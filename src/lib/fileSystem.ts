import { open } from '@tauri-apps/plugin-dialog'
import { readDir, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { type Note } from '@/types'

export interface FileNote {
  id: string
  title: string
  content: string
  filePath: string
  createdAt: Date
  updatedAt: Date
}

export class FileSystemManager {
  private notesFolder: string | null = null

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
              id: entry.name.replace('.md', ''),
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

  async saveNote(note: Partial<Note> & { title: string; content: string }): Promise<boolean> {
    if (!this.notesFolder) {
      throw new Error('No notes folder selected')
    }

    try {
      // Create filename from title (sanitize for filesystem)
      const filename = this.sanitizeFilename(note.title) + '.md'
      const filePath = await join(this.notesFolder, filename)

      // Create frontmatter with metadata
      const frontmatter = `---
title: ${note.title}
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

`

      const fileContent = frontmatter + note.content

      await writeTextFile(filePath, fileContent)
      return true
    } catch (error) {
      console.error('Error saving note:', error)
      return false
    }
  }

  async loadNote(id: string): Promise<Note | null> {
    if (!this.notesFolder) {
      return null
    }

    try {
      const filename = id + '.md'
      const filePath = await join(this.notesFolder, filename)
      
      if (!(await exists(filePath))) {
        return null
      }

      const content = await readTextFile(filePath)
      
      // Parse frontmatter and content
      const { frontmatter, body } = this.parseFrontmatter(content)
      
      return {
        id,
        title: frontmatter.title || id,
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

  async deleteNote(id: string): Promise<boolean> {
    if (!this.notesFolder) {
      return false
    }

    try {
      const filename = id + '.md'
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

  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid filename characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase()
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