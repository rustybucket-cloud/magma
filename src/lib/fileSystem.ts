import { open } from '@tauri-apps/plugin-dialog'
import { readDir, readTextFile, writeTextFile, exists, rename } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { type Note } from '@/types'

export interface FileNote {
  title: string
  content: string
  filePath: string
  createdAt: Date
  updatedAt: Date
}

export class FileSystemManager {
  private notesFolder: string | null = null

  private titleToFilename(title: string): string {
    // Convert title to safe filename by removing/replacing unsafe characters
    return title
      .replace(/[<>:"/\\|?*]/g, '-') // Replace unsafe characters with dash
      .replace(/\s+/g, '-') // Replace spaces with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase()
  }



  async selectNotesFolder(): Promise<string | null> {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Notes Folder'
      })
      
      if (selected && typeof selected === 'string') {
        this.notesFolder = selected
        // Store in localStorage for persistence
        localStorage.setItem('notesFolder', selected)
        return selected
      }
      return null
    } catch (error) {
      console.error('Error selecting folder:', error)
      return null
    }
  }

  getNotesFolder(): string | null {
    if (!this.notesFolder) {
      this.notesFolder = localStorage.getItem('notesFolder')
    }
    return this.notesFolder
  }

  setNotesFolder(path: string) {
    this.notesFolder = path
    localStorage.setItem('notesFolder', path)
  }

  async loadNotes(): Promise<Note[]> {
    if (!this.notesFolder) {
      return []
    }

    try {
      const entries = await readDir(this.notesFolder)
      const notes: Note[] = []

      for (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.md')) {
          try {
            const filePath = await join(this.notesFolder, entry.name)
            const content = await readTextFile(filePath)
            
            // Extract title from filename (remove .md extension)
            const title = entry.name.replace('.md', '')
            
            // Parse frontmatter if it exists, otherwise use file stats
            const note: Note = {
              title,
              content,
              category: { id: '1', name: 'General' }, // Default category
              createdAt: new Date(), // In a real app, you'd parse this from file stats or frontmatter
              updatedAt: new Date()
            }
            
            notes.push(note)
          } catch (error) {
            console.error(`Error reading note ${entry.name}:`, error)
          }
        }
      }

      return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    } catch (error) {
      console.error('Error loading notes:', error)
      return []
    }
  }

  async createNote(): Promise<string | null> {
    if (!this.notesFolder) {
      throw new Error('No notes folder selected')
    }

    try {
      // Generate unique title and filename
      const timestamp = Date.now()
      const title = `Untitled-${timestamp}`
      const filename = this.titleToFilename(title) + '.md'
      const filePath = await join(this.notesFolder, filename)

      // Create initial note content
      const frontmatter = `---
title: ${title}
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

`

      await writeTextFile(filePath, frontmatter)
      return title
    } catch (error) {
      console.error('Error creating note:', error)
      return null
    }
  }

  async saveNote(title: string, content: string): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error('No notes folder selected')
    }

    try {
      const filename = this.titleToFilename(title) + '.md'
      const filePath = await join(this.notesFolder, filename)

      // Check if file exists to determine if this is an update
      const fileExists = await exists(filePath)
      let createdDate = new Date().toISOString()

      if (fileExists) {
        // If updating, preserve the original created date
        try {
          const existingContent = await readTextFile(filePath)
          const { frontmatter } = this.parseFrontmatter(existingContent)
          createdDate = frontmatter.created || createdDate
        } catch (error) {
          console.error('Error reading existing file for created date:', error)
        }
      }

      // Create frontmatter with metadata
      const frontmatter = `---
title: ${title}
created: ${createdDate}
updated: ${new Date().toISOString()}
---

`

      const fileContent = frontmatter + content

      await writeTextFile(filePath, fileContent)
      return true
    } catch (error) {
      console.error('Error saving note:', error)
      return false
    }
  }

  async loadNote(title: string): Promise<Note | null> {
    if (!this.notesFolder) {
      return null
    }

    try {
      const filename = this.titleToFilename(title) + '.md'
      const filePath = await join(this.notesFolder, filename)
      
      if (!(await exists(filePath))) {
        return null
      }

      const content = await readTextFile(filePath)
      
      // Parse frontmatter and content
      const { frontmatter, body } = this.parseFrontmatter(content)
      
      return {
        title: frontmatter.title || title,
        content: body,
        category: { id: '1', name: 'General' },
        createdAt: frontmatter.created ? new Date(frontmatter.created) : new Date(),
        updatedAt: frontmatter.updated ? new Date(frontmatter.updated) : new Date()
      }
    } catch (error) {
      console.error('Error loading note:', error)
      return null
    }
  }

  async renameNote(title: string, newTitle: string): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error('No notes folder selected')
    }

    try {
      const oldFilename = this.titleToFilename(title) + '.md'
      const newFilename = this.titleToFilename(newTitle) + '.md'
      const oldFilePath = await join(this.notesFolder, oldFilename)
      const newFilePath = await join(this.notesFolder, newFilename)

      const fileExists = await exists(oldFilePath)
      if (!fileExists) {
        throw new Error('Note not found')
      }

      await rename(oldFilePath, newFilePath)
      return true
    } catch (error) {
      console.error('Error renaming note:', error)
      return false
    }
  }

  async deleteNote(title: string): Promise<boolean> {
    if (!this.notesFolder) {
      return false
    }

    try {
      const filename = this.titleToFilename(title) + '.md'
      const filePath = await join(this.notesFolder, filename)
      
      if (await exists(filePath)) {
        // Note: You'd need to add delete permission and import remove function
        // await remove(filePath)
        console.log('Delete functionality would remove:', filePath)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting note:', error)
      return false
    }
  }



  private parseFrontmatter(content: string): { frontmatter: any; body: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = content.match(frontmatterRegex)
    
    if (match) {
      const frontmatterText = match[1]
      const body = match[2]
      
      // Simple YAML parsing (in a real app, use a proper YAML parser)
      const frontmatter: any = {}
      frontmatterText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          frontmatter[key.trim()] = valueParts.join(':').trim()
        }
      })
      
      return { frontmatter, body }
    }
    
    return { frontmatter: {}, body: content }
  }
}

// Singleton instance
export const fileSystem = new FileSystemManager()
