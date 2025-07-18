import { open } from "@tauri-apps/plugin-dialog";
import {
  readDir,
  readTextFile,
  writeTextFile,
  exists,
  rename,
  mkdir,
  remove,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { type Note, type FileTreeItem } from "@/types";



export class FileSystemManager {
  private notesFolder: string | null = null;

  private titleToFilename(title: string): string {
    // Convert title to safe filename by removing/replacing unsafe characters
    return title
      .replace(/[<>:"/\\|?*]/g, "-") // Replace unsafe characters with dash
      .replace(/\s+/g, "-") // Replace spaces with dash
      .replace(/-+/g, "-") // Replace multiple dashes with single dash
      .replace(/^-|-$/g, "") // Remove leading/trailing dashes
      .toLowerCase();
  }

  async selectNotesFolder(): Promise<string | null> {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Notes Folder",
      });

      if (selected && typeof selected === "string") {
        this.notesFolder = selected;
        // Store in localStorage for persistence
        localStorage.setItem("notesFolder", selected);
        return selected;
      }
      return null;
    } catch (error) {
      console.error("Error selecting folder:", error);
      return null;
    }
  }

  getNotesFolder(): string | null {
    if (!this.notesFolder) {
      this.notesFolder = localStorage.getItem("notesFolder");
    }
    return this.notesFolder;
  }

  setNotesFolder(path: string) {
    this.notesFolder = path;
    localStorage.setItem("notesFolder", path);
  }

  async loadFileTree(): Promise<FileTreeItem[]> {
    if (!this.notesFolder) {
      return [];
    }

    try {
      return await this.buildFileTree(this.notesFolder, "");
    } catch (error) {
      console.error("Error loading file tree:", error);
      return [];
    }
  }

  private async buildFileTree(
    basePath: string,
    relativePath: string
  ): Promise<FileTreeItem[]> {
    const fullPath = relativePath
      ? await join(basePath, relativePath)
      : basePath;
    const entries = await readDir(fullPath);
    const items: FileTreeItem[] = [];

    for (const entry of entries) {
      const itemPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isFile && entry.name.endsWith(".md")) {
        items.push({
          name: entry.name.replace(".md", ""),
          path: itemPath,
          type: "file",
        });
      } else if (entry.isDirectory) {
        const children = await this.buildFileTree(basePath, itemPath);
        items.push({
          name: entry.name,
          path: itemPath,
          type: "folder",
          children,
          isExpanded: false,
        });
      }
    }

    // Sort: folders first, then files, both alphabetically
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async loadNotes(): Promise<Note[]> {
    if (!this.notesFolder) {
      return [];
    }

    try {
      const notes = await this.loadNotesRecursive(this.notesFolder, "");
      return notes.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      console.error("Error loading notes:", error);
      return [];
    }
  }

  private async loadNotesRecursive(
    basePath: string,
    relativePath: string
  ): Promise<Note[]> {
    const fullPath = relativePath
      ? await join(basePath, relativePath)
      : basePath;
    const entries = await readDir(fullPath);
    const notes: Note[] = [];

    for (const entry of entries) {
      const itemPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isFile && entry.name.endsWith(".md")) {
        try {
          const filePath = await join(basePath, itemPath);
          const content = await readTextFile(filePath);

          // Parse frontmatter if it exists
          const { frontmatter, body } = this.parseFrontmatter(content);

          // Always use filename without extension for title
          let title = entry.name.replace(".md", "");

          // If we're in a nested folder, include the folder context for better identification
          if (relativePath) {
            title = `${relativePath.replace(/\//g, " / ")} / ${title}`;
          }

          const note: Note = {
            title,
            content: body,
            category: { id: "1", name: "General" }, // Default category
            createdAt: frontmatter.created
              ? new Date(frontmatter.created)
              : new Date(),
            updatedAt: frontmatter.updated
              ? new Date(frontmatter.updated)
              : new Date(),
            path: itemPath, // Store the relative path for loading
          };

          notes.push(note);
        } catch (error) {
          console.error(`Error reading note ${itemPath}:`, error);
        }
      } else if (entry.isDirectory) {
        // Recursively load notes from subdirectories
        const subNotes = await this.loadNotesRecursive(basePath, itemPath);
        notes.push(...subNotes);
      }
    }

    return notes;
  }

  async createNote(folderPath?: string): Promise<string | null> {
    if (!this.notesFolder) {
      throw new Error("No notes folder selected");
    }

    try {
      // Generate unique title and filename
      const timestamp = Date.now();
      const title = `Untitled-${timestamp}`;
      const filename = this.titleToFilename(title) + ".md";

      // Determine the target directory
      let targetDir = this.notesFolder;
      if (folderPath) {
        targetDir = await join(this.notesFolder, folderPath);

        // Ensure the target directory exists
        if (!(await exists(targetDir))) {
          throw new Error("Target folder does not exist");
        }
      }

      const filePath = await join(targetDir, filename);

      // Create initial note content
      const frontmatter = `---
title: ${title}
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

`;

      await writeTextFile(filePath, frontmatter);
      return title;
    } catch (error) {
      console.error("Error creating note:", error);
      return null;
    }
  }

  async createFolder(
    folderName: string,
    parentPath?: string
  ): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error("No notes folder selected");
    }

    try {
      // Sanitize folder name
      const sanitizedName = folderName
        .replace(/[<>:"/\\|?*]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!sanitizedName) {
        throw new Error("Invalid folder name");
      }

      // Determine the target directory
      const targetDir = parentPath
        ? await join(this.notesFolder, parentPath)
        : this.notesFolder;

      const folderPath = await join(targetDir, sanitizedName);

      // Check if folder already exists
      if (await exists(folderPath)) {
        throw new Error("Folder already exists");
      }

      await mkdir(folderPath);
      return true;
    } catch (error) {
      console.error("Error creating folder:", error);
      return false;
    }
  }

  async saveNote(
    title: string,
    content: string,
    folderPath?: string
  ): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error("No notes folder selected");
    }

    try {
      const filename = this.titleToFilename(title) + ".md";

      // Determine the target directory
      let targetDir = this.notesFolder;
      if (folderPath) {
        targetDir = await join(this.notesFolder, folderPath);
      }

      const filePath = await join(targetDir, filename);

      // Check if file exists to determine if this is an update
      const fileExists = await exists(filePath);
      let createdDate = new Date().toISOString();

      if (fileExists) {
        // If updating, preserve the original created date
        try {
          const existingContent = await readTextFile(filePath);
          const { frontmatter } = this.parseFrontmatter(existingContent);
          createdDate = frontmatter.created || createdDate;
        } catch (error) {
          console.error("Error reading existing file for created date:", error);
        }
      }

      // Create frontmatter with metadata
      const frontmatter = `---
title: ${title}
created: ${createdDate}
updated: ${new Date().toISOString()}
---

`;

      const fileContent = frontmatter + content;

      await writeTextFile(filePath, fileContent);
      return true;
    } catch (error) {
      console.error("Error saving note:", error);
      return false;
    }
  }

  async loadNote(title: string): Promise<Note | null> {
    if (!this.notesFolder) {
      return null;
    }

    try {
      const filename = this.titleToFilename(title) + ".md";
      const filePath = await join(this.notesFolder, filename);

      if (!(await exists(filePath))) {
        return null;
      }

      const content = await readTextFile(filePath);

      // Parse frontmatter and content
      const { frontmatter, body } = this.parseFrontmatter(content);

      return {
        title: title, // Use the passed title parameter (from filename)
        content: body,
        category: { id: "1", name: "General" },
        createdAt: frontmatter.created
          ? new Date(frontmatter.created)
          : new Date(),
        updatedAt: frontmatter.updated
          ? new Date(frontmatter.updated)
          : new Date(),
        path: filename.replace('.md', ''), // Store the filename without extension as path
      };
    } catch (error) {
      console.error("Error loading note:", error);
      return null;
    }
  }

  async loadNoteByPath(relativePath: string): Promise<Note | null> {
    if (!this.notesFolder) {
      return null;
    }

    try {
      const filePath = await join(this.notesFolder, relativePath);

      if (!(await exists(filePath))) {
        return null;
      }

      const content = await readTextFile(filePath);

      // Parse frontmatter and content
      const { frontmatter, body } = this.parseFrontmatter(content);

      // Extract title from path (get filename without extension)
      const pathParts = relativePath.split("/");
      const filename = pathParts[pathParts.length - 1].replace('.md', '');

      return {
        title: filename, // Use filename only, ignore frontmatter title
        content: body,
        category: { id: "1", name: "General" },
        createdAt: frontmatter.created
          ? new Date(frontmatter.created)
          : new Date(),
        updatedAt: frontmatter.updated
          ? new Date(frontmatter.updated)
          : new Date(),
        path: relativePath.replace('.md', ''), // Store the relative path without extension
      };
    } catch (error) {
      console.error("Error loading note by path:", error);
      return null;
    }
  }

  async renameNote(title: string, newTitle: string): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error("No notes folder selected");
    }

    try {
      const oldFilename = this.titleToFilename(title) + ".md";
      const newFilename = this.titleToFilename(newTitle) + ".md";
      const oldFilePath = await join(this.notesFolder, oldFilename);
      const newFilePath = await join(this.notesFolder, newFilename);

      const fileExists = await exists(oldFilePath);
      if (!fileExists) {
        throw new Error("Note not found");
      }

      await rename(oldFilePath, newFilePath);
      return true;
    } catch (error) {
      console.error("Error renaming note:", error);
      return false;
    }
  }

  async deleteNote(title: string): Promise<boolean> {
    if (!this.notesFolder) {
      return false;
    }

    try {
      const filename = this.titleToFilename(title) + ".md";
      const filePath = await join(this.notesFolder, filename);

      if (await exists(filePath)) {
        await remove(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  async deleteFileOrFolder(relativePath: string): Promise<boolean> {
    if (!this.notesFolder) {
      return false;
    }

    try {
      const fullPath = await join(this.notesFolder, relativePath);

      if (await exists(fullPath)) {
        await remove(fullPath, { recursive: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file or folder:", error);
      return false;
    }
  }

  async renameFileOrFolder(
    oldPath: string,
    newName: string,
    isFile: boolean = false
  ): Promise<boolean> {
    if (!this.notesFolder) {
      return false;
    }

    try {
      // The oldPath from file tree already includes .md extension for files
      const oldFullPath = await join(this.notesFolder, oldPath);

      if (!(await exists(oldFullPath))) {
        return false;
      }

      // Get the parent directory from the old path
      const pathParts = oldPath.split("/");
      const parentPath = pathParts.slice(0, -1).join("/");

      // Sanitize the new name
      let sanitizedName = newName
        .replace(/[<>:"/\\|?*]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!sanitizedName) {
        throw new Error("Invalid name");
      }

      // For files, add .md extension to the new name
      const actualNewName = isFile ? sanitizedName + ".md" : sanitizedName;
      const newRelativePath = parentPath
        ? `${parentPath}/${actualNewName}`
        : actualNewName;
      const newFullPath = await join(this.notesFolder, newRelativePath);

      // Check if target already exists
      if (await exists(newFullPath)) {
        throw new Error("A file or folder with that name already exists");
      }

      await rename(oldFullPath, newFullPath);
      return true;
    } catch (error) {
      console.error("Error renaming file or folder:", error);
      return false;
    }
  }

  private parseFrontmatter(content: string): {
    frontmatter: any;
    body: string;
  } {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      const frontmatterText = match[1];
      const body = match[2];

      // Simple YAML parsing (in a real app, use a proper YAML parser)
      const frontmatter: any = {};
      frontmatterText.split(/\r?\n/).forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            frontmatter[key] = value;
          }
        }
      });

      return { frontmatter, body };
    }

    return { frontmatter: {}, body: content };
  }
}

// Singleton instance
export const fileSystem = new FileSystemManager();
