import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FileSystemManager } from '../fileSystem'
import { FileTreeItem } from '@/types'

// Mock Tauri APIs
vi.mock('@tauri-apps/plugin-dialog')
vi.mock('@tauri-apps/plugin-fs')
vi.mock('@tauri-apps/api/path')

// Import mocked functions
import { open } from '@tauri-apps/plugin-dialog'
import {
  readDir,
  readTextFile,
  writeTextFile,
  exists,
  rename,
  mkdir,
  remove
} from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

const mockOpen = vi.mocked(open)
const mockReadDir = vi.mocked(readDir)
const mockReadTextFile = vi.mocked(readTextFile)
const mockWriteTextFile = vi.mocked(writeTextFile)
const mockExists = vi.mocked(exists)
const mockRename = vi.mocked(rename)
const mockMkdir = vi.mocked(mkdir)
const mockRemove = vi.mocked(remove)
const mockJoin = vi.mocked(join)

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('FileSystemManager', () => {
  let fileSystem: FileSystemManager

  beforeEach(() => {
    vi.clearAllMocks()
    fileSystem = new FileSystemManager()
    
    // Default mock implementations
    mockJoin.mockImplementation((...paths) => Promise.resolve(paths.join('/')))
    mockExists.mockResolvedValue(true)
  })

  afterEach(() => {
    mockConsoleError.mockClear()
  })

  describe('folder selection', () => {
    it('selects notes folder successfully', async () => {
      const selectedPath = '/path/to/notes'
      mockOpen.mockResolvedValue(selectedPath)

      const result = await fileSystem.selectNotesFolder()

      expect(mockOpen).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
        title: 'Select Notes Folder'
      })
      expect(result).toBe(selectedPath)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notesFolder', selectedPath)
    })

    it('returns null when user cancels folder selection', async () => {
      mockOpen.mockResolvedValue(null)

      const result = await fileSystem.selectNotesFolder()

      expect(result).toBeNull()
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('returns null when folder selection returns array', async () => {
      mockOpen.mockResolvedValue(['/path1', '/path2'])

      const result = await fileSystem.selectNotesFolder()

      expect(result).toBeNull()
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('handles folder selection error', async () => {
      const error = new Error('Permission denied')
      mockOpen.mockRejectedValue(error)

      const result = await fileSystem.selectNotesFolder()

      expect(result).toBeNull()
      expect(mockConsoleError).toHaveBeenCalledWith('Error selecting folder:', error)
    })

    it('gets notes folder from memory', () => {
      fileSystem.setNotesFolder('/test/path')
      
      const result = fileSystem.getNotesFolder()
      
      expect(result).toBe('/test/path')
    })

    it('gets notes folder from localStorage when not in memory', () => {
      mockLocalStorage.getItem.mockReturnValue('/stored/path')
      
      const result = fileSystem.getNotesFolder()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('notesFolder')
      expect(result).toBe('/stored/path')
    })

    it('sets notes folder and persists to localStorage', () => {
      const path = '/new/path'
      
      fileSystem.setNotesFolder(path)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notesFolder', path)
      expect(fileSystem.getNotesFolder()).toBe(path)
    })
  })

  describe('file tree operations', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('loads empty file tree when no notes folder', async () => {
      const emptyFileSystem = new FileSystemManager()
      
      const result = await emptyFileSystem.loadFileTree()
      
      expect(result).toEqual([])
    })

    it('builds file tree with files and folders', async () => {
      const mockEntries = [
        { name: 'note1.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'folder1', isFile: false, isDirectory: true, isSymlink: false },
        { name: 'note2.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'not-markdown.txt', isFile: true, isDirectory: false, isSymlink: false }
      ]
      
      const mockSubEntries = [
        { name: 'subnote.md', isFile: true, isDirectory: false, isSymlink: false }
      ]

      mockReadDir
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce(mockSubEntries)

      const result = await fileSystem.loadFileTree()

      expect(mockReadDir).toHaveBeenCalledWith('/notes')
      expect(mockReadDir).toHaveBeenCalledWith('/notes/folder1')
      
      const expected: FileTreeItem[] = [
        {
          name: 'folder1',
          path: 'folder1',
          type: 'folder',
          children: [
            {
              name: 'subnote',
              path: 'folder1/subnote.md',
              type: 'file'
            }
          ],
          isExpanded: false
        },
        {
          name: 'note1',
          path: 'note1.md',
          type: 'file'
        },
        {
          name: 'note2',
          path: 'note2.md',
          type: 'file'
        }
      ]

      expect(result).toEqual(expected)
    })

    it('handles file tree loading error', async () => {
      const error = new Error('Permission denied')
      mockReadDir.mockRejectedValue(error)

      const result = await fileSystem.loadFileTree()

      expect(result).toEqual([])
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading file tree:', error)
    })

    it('sorts file tree items correctly', async () => {
      const mockEntries = [
        { name: 'z-note.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'a-folder', isFile: false, isDirectory: true, isSymlink: false },
        { name: 'a-note.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'z-folder', isFile: false, isDirectory: true, isSymlink: false }
      ]

      mockReadDir
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce([]) // a-folder is empty
        .mockResolvedValueOnce([]) // z-folder is empty

      const result = await fileSystem.loadFileTree()

      // Should be sorted: folders first (alphabetically), then files (alphabetically)
      expect(result.map(item => item.name)).toEqual(['a-folder', 'z-folder', 'a-note', 'z-note'])
    })
  })

  describe('note operations', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('loads notes recursively', async () => {
      const mockEntries = [
        { name: 'note1.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'folder1', isFile: false, isDirectory: true, isSymlink: false }
      ]
      
      const mockSubEntries = [
        { name: 'note2.md', isFile: true, isDirectory: false, isSymlink: false }
      ]

      const noteContent1 = `---
title: Note 1
created: 2024-01-01T10:00:00.000Z
updated: 2024-01-01T11:00:00.000Z
---

This is note 1 content`

      const noteContent2 = `---
title: Note 2
created: 2024-01-02T10:00:00.000Z
updated: 2024-01-02T11:00:00.000Z
---

This is note 2 content`

      mockReadDir
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce(mockSubEntries)
      
      mockReadTextFile
        .mockResolvedValueOnce(noteContent1)
        .mockResolvedValueOnce(noteContent2)

      const result = await fileSystem.loadNotes()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('folder1 / note2') // More recent, so first
      expect(result[0].content).toBe('\nThis is note 2 content')
      expect(result[0].path).toBe('folder1/note2.md')
      expect(result[1].title).toBe('note1')
      expect(result[1].content).toBe('\nThis is note 1 content')
      expect(result[1].path).toBe('note1.md')
    })

    it('handles notes loading error', async () => {
      const error = new Error('File not found')
      mockReadDir.mockRejectedValue(error)

      const result = await fileSystem.loadNotes()

      expect(result).toEqual([])
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading notes:', error)
    })

    it('skips corrupted note files', async () => {
      const mockEntries = [
        { name: 'good.md', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'bad.md', isFile: true, isDirectory: false, isSymlink: false }
      ]

      const goodContent = `---
title: Good Note
---
Good content`

      mockReadDir.mockResolvedValue(mockEntries)
      mockReadTextFile
        .mockResolvedValueOnce(goodContent)
        .mockRejectedValueOnce(new Error('Corrupted file'))

      const result = await fileSystem.loadNotes()

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('good')
      expect(mockConsoleError).toHaveBeenCalledWith('Error reading note bad.md:', expect.any(Error))
    })
  })

  describe('note creation', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('creates note in root folder', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1234567890)
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.createNote()

      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/notes/untitled-1234567890.md',
        `---
title: Untitled-1234567890
created: 2024-01-01T10:00:00.000Z
updated: 2024-01-01T10:00:00.000Z
---

`
      )
      expect(result).toBe('untitled-1234567890.md')
    })

    it('creates note in subfolder', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1234567890)
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.createNote('Documents')

      expect(mockExists).toHaveBeenCalledWith('/notes/Documents')
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/notes/Documents/untitled-1234567890.md',
        expect.stringContaining('title: Untitled-1234567890')
      )
      expect(result).toBe('Documents/untitled-1234567890.md')
    })

    it('throws error when no notes folder selected', async () => {
      const emptyFileSystem = new FileSystemManager()

      await expect(emptyFileSystem.createNote()).rejects.toThrow('No notes folder selected')
    })

    it('returns null when target folder does not exist', async () => {
      mockExists.mockResolvedValue(false)

      const result = await fileSystem.createNote('NonExistent')
      expect(result).toBeNull()
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating note:', expect.any(Error))
    })

    it('handles note creation error', async () => {
      const error = new Error('Disk full')
      mockWriteTextFile.mockRejectedValue(error)

      const result = await fileSystem.createNote()

      expect(result).toBeNull()
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating note:', error)
    })
  })

  describe('folder creation', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('creates folder in root', async () => {
      mockExists.mockResolvedValue(false) // Folder doesn't exist yet

      const result = await fileSystem.createFolder('New Folder')

      expect(mockMkdir).toHaveBeenCalledWith('/notes/New-Folder')
      expect(result).toBe(true)
    })

    it('creates folder in parent path', async () => {
      mockExists.mockResolvedValue(false)

      const result = await fileSystem.createFolder('Sub Folder', 'Documents')

      expect(mockMkdir).toHaveBeenCalledWith('/notes/Documents/Sub-Folder')
      expect(result).toBe(true)
    })

    it('sanitizes folder name', async () => {
      mockExists.mockResolvedValue(false)

      await fileSystem.createFolder('Folder<>:"/\\|?*Name   With   Spaces')

      expect(mockMkdir).toHaveBeenCalledWith('/notes/Folder-Name-With-Spaces')
    })

    it('throws error when no notes folder selected', async () => {
      const emptyFileSystem = new FileSystemManager()

      await expect(emptyFileSystem.createFolder('Test')).rejects.toThrow('No notes folder selected')
    })

    it('returns false when folder already exists', async () => {
      mockExists.mockResolvedValue(true)

      const result = await fileSystem.createFolder('Existing')

      expect(result).toBe(false)
      expect(mockMkdir).not.toHaveBeenCalled()
    })

    it('returns false for invalid folder name', async () => {
      const result = await fileSystem.createFolder('   ---   ')

      expect(result).toBe(false)
      expect(mockMkdir).not.toHaveBeenCalled()
    })

    it('handles folder creation error', async () => {
      mockExists.mockResolvedValue(false)
      const error = new Error('Permission denied')
      mockMkdir.mockRejectedValue(error)

      const result = await fileSystem.createFolder('Test')

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating folder:', error)
    })
  })

  describe('note saving', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('saves new note', async () => {
      mockExists.mockResolvedValue(false) // New file
      mockWriteTextFile.mockResolvedValue(undefined) // Mock successful write
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.saveNote('Test Note', 'Note content')

      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/notes/test-note.md',
        expect.stringContaining('title: Test Note')
      )
      expect(result).toBe(true)
    })

    it('updates existing note preserving created date', async () => {
      mockExists.mockResolvedValue(true) // Existing file
      const existingContent = `---
title: Old Title
created: 2024-01-01T09:00:00.000Z
updated: 2024-01-01T09:30:00.000Z
---

Old content`
      
      mockReadTextFile.mockResolvedValue(existingContent)
      mockWriteTextFile.mockResolvedValue(undefined) // Mock successful write
      const mockDate = new Date('2024-01-01T11:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.saveNote('Test Note', 'Updated content')

      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/notes/test-note.md',
        expect.stringContaining('created: 2024-01-01T09:00:00.000Z')
      )
      expect(result).toBe(true)
    })

    it('saves note in subfolder', async () => {
      mockExists.mockResolvedValue(false)
      mockWriteTextFile.mockResolvedValue(undefined) // Mock successful write
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.saveNote('Test Note', 'Content', 'Documents')

      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/notes/Documents/test-note.md',
        expect.stringContaining('title: Test Note')
      )
      expect(result).toBe(true)
    })

    it('throws error when no notes folder selected', async () => {
      const emptyFileSystem = new FileSystemManager()

      await expect(emptyFileSystem.saveNote('Test', 'Content')).rejects.toThrow('No notes folder selected')
    })

    it('handles save error', async () => {
      const error = new Error('Disk full')
      mockWriteTextFile.mockRejectedValue(error)

      const result = await fileSystem.saveNote('Test', 'Content')

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith('Error saving note:', error)
    })

    it('handles error reading existing file for created date', async () => {
      mockExists.mockResolvedValue(true)
      mockReadTextFile.mockRejectedValue(new Error('Read error'))
      mockWriteTextFile.mockResolvedValue(undefined) // Mock successful write
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.saveNote('Test', 'Content')

      expect(result).toBe(true)
      expect(mockConsoleError).toHaveBeenCalledWith('Error reading existing file for created date:', expect.any(Error))
      // Should use current date as fallback
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('title: Test')
      )
    })
  })

  describe('note loading', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('loads note by title', async () => {
      const noteContent = `---
title: Test Note
created: 2024-01-01T10:00:00.000Z
updated: 2024-01-01T11:00:00.000Z
---

This is the note content`

      mockReadTextFile.mockResolvedValue(noteContent)

      const result = await fileSystem.loadNote('Test Note')

      expect(mockExists).toHaveBeenCalledWith('/notes/test-note.md')
      expect(mockReadTextFile).toHaveBeenCalledWith('/notes/test-note.md')
      expect(result).toEqual({
        title: 'Test Note',
        content: '\nThis is the note content',
        category: { id: '1', name: 'General' },
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
        updatedAt: new Date('2024-01-01T11:00:00.000Z'),
        path: 'test-note'
      })
    })

    it('loads note by path', async () => {
      const noteContent = `---
title: Ignored Title
created: 2024-01-01T10:00:00.000Z
updated: 2024-01-01T11:00:00.000Z
---

Path-based content`

      mockReadTextFile.mockResolvedValue(noteContent)

      const result = await fileSystem.loadNoteByPath('Documents/my-note.md')

      expect(mockExists).toHaveBeenCalledWith('/notes/Documents/my-note.md')
      expect(mockReadTextFile).toHaveBeenCalledWith('/notes/Documents/my-note.md')
      expect(result).toEqual({
        title: 'my-note', // Uses filename, not frontmatter title
        content: '\nPath-based content',
        category: { id: '1', name: 'General' },
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
        updatedAt: new Date('2024-01-01T11:00:00.000Z'),
        path: 'Documents/my-note'
      })
    })

    it('returns null when note does not exist', async () => {
      mockExists.mockResolvedValue(false)

      const result = await fileSystem.loadNote('Nonexistent')

      expect(result).toBeNull()
      expect(mockReadTextFile).not.toHaveBeenCalled()
    })

    it('returns null when no notes folder selected', async () => {
      const emptyFileSystem = new FileSystemManager()

      const result = await emptyFileSystem.loadNote('Test')

      expect(result).toBeNull()
    })

    it('handles note loading error', async () => {
      const error = new Error('Permission denied')
      mockReadTextFile.mockRejectedValue(error)

      const result = await fileSystem.loadNote('Test')

      expect(result).toBeNull()
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading note:', error)
    })

    it('handles note without frontmatter', async () => {
      const noteContent = 'Just plain content without frontmatter'
      mockReadTextFile.mockResolvedValue(noteContent)
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.loadNote('Plain Note')

      expect(result?.content).toBe('Just plain content without frontmatter')
      expect(result?.title).toBe('Plain Note')
      expect(result?.createdAt).toEqual(mockDate)
      expect(result?.updatedAt).toEqual(mockDate)
    })
  })

  describe('file and folder operations', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('renames note', async () => {
      const result = await fileSystem.renameNote('Old Title', 'New Title')

      expect(mockExists).toHaveBeenCalledWith('/notes/old-title.md')
      expect(mockRename).toHaveBeenCalledWith('/notes/old-title.md', '/notes/new-title.md')
      expect(result).toBe(true)
    })

    it('fails to rename non-existent note', async () => {
      mockExists.mockResolvedValue(false)

      const result = await fileSystem.renameNote('Nonexistent', 'New Name')

      expect(result).toBe(false)
      expect(mockRename).not.toHaveBeenCalled()
    })

    it('renames file or folder', async () => {
      mockExists.mockResolvedValueOnce(true) // Source exists
      mockExists.mockResolvedValueOnce(false) // Target doesn't exist

      const result = await fileSystem.renameFileOrFolder('Documents/old-file.md', 'new-file', true)

      expect(mockExists).toHaveBeenCalledWith('/notes/Documents/old-file.md')
      expect(mockRename).toHaveBeenCalledWith('/notes/Documents/old-file.md', '/notes/Documents/new-file.md')
      expect(result).toBe(true)
    })

    it('renames folder', async () => {
      mockExists.mockResolvedValueOnce(true) // Source exists
      mockExists.mockResolvedValueOnce(false) // Target doesn't exist

      const result = await fileSystem.renameFileOrFolder('old-folder', 'new-folder', false)

      expect(mockRename).toHaveBeenCalledWith('/notes/old-folder', '/notes/new-folder')
      expect(result).toBe(true)
    })

    it('fails to rename when target already exists', async () => {
      mockExists
        .mockResolvedValueOnce(true) // Source exists
        .mockResolvedValueOnce(true) // Target also exists

      const result = await fileSystem.renameFileOrFolder('source.md', 'target', true)

      expect(result).toBe(false)
      expect(mockRename).not.toHaveBeenCalled()
    })

    it('deletes note', async () => {
      const result = await fileSystem.deleteNote('Test Note')

      expect(mockExists).toHaveBeenCalledWith('/notes/test-note.md')
      expect(mockRemove).toHaveBeenCalledWith('/notes/test-note.md')
      expect(result).toBe(true)
    })

    it('fails to delete non-existent note', async () => {
      mockExists.mockResolvedValue(false)

      const result = await fileSystem.deleteNote('Nonexistent')

      expect(result).toBe(false)
      expect(mockRemove).not.toHaveBeenCalled()
    })

    it('deletes file or folder recursively', async () => {
      const result = await fileSystem.deleteFileOrFolder('Documents/subfolder')

      expect(mockExists).toHaveBeenCalledWith('/notes/Documents/subfolder')
      expect(mockRemove).toHaveBeenCalledWith('/notes/Documents/subfolder', { recursive: true })
      expect(result).toBe(true)
    })

    it('handles deletion errors', async () => {
      const error = new Error('Permission denied')
      mockRemove.mockRejectedValue(error)

      const result = await fileSystem.deleteNote('Test')

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting note:', error)
    })
  })

  describe('frontmatter parsing', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('parses frontmatter correctly', async () => {
      const noteContent = `---
title: Test Note
created: 2024-01-01T10:00:00.000Z
updated: 2024-01-01T11:00:00.000Z
author: John Doe
tags: test, example
---

This is the body content
With multiple lines`

      mockReadTextFile.mockResolvedValue(noteContent)

      const result = await fileSystem.loadNote('Test')

      expect(result?.content).toBe(`
This is the body content
With multiple lines`)
      expect(result?.createdAt).toEqual(new Date('2024-01-01T10:00:00.000Z'))
      expect(result?.updatedAt).toEqual(new Date('2024-01-01T11:00:00.000Z'))
    })

    it('handles content without frontmatter', async () => {
      const noteContent = `This is just plain content
Without any frontmatter`

      mockReadTextFile.mockResolvedValue(noteContent)
      const mockDate = new Date('2024-01-01T10:00:00.000Z')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      const result = await fileSystem.loadNote('Plain')

      expect(result?.content).toBe(noteContent)
      expect(result?.createdAt).toEqual(mockDate)
      expect(result?.updatedAt).toEqual(mockDate)
    })

    it('handles malformed frontmatter', async () => {
      const noteContent = `---
title Test Note (missing colon)
created: 2024-01-01T10:00:00.000Z
: invalid line
---

Content after malformed frontmatter`

      mockReadTextFile.mockResolvedValue(noteContent)

      const result = await fileSystem.loadNote('Malformed')

      expect(result?.content).toBe('\nContent after malformed frontmatter')
      expect(result?.createdAt).toEqual(new Date('2024-01-01T10:00:00.000Z'))
    })

    it('handles Windows line endings', async () => {
      const noteContent = `---\r\ntitle: Windows Note\r\ncreated: 2024-01-01T10:00:00.000Z\r\n---\r\n\r\nWindows content`

      mockReadTextFile.mockResolvedValue(noteContent)

      const result = await fileSystem.loadNote('Windows')

      expect(result?.content).toBe('\r\nWindows content')
      expect(result?.createdAt).toEqual(new Date('2024-01-01T10:00:00.000Z'))
    })
  })

  describe('filename sanitization', () => {
    it('sanitizes unsafe characters in filenames', () => {
      const fileSystem = new FileSystemManager()
      
      // Access private method through type assertion
      const sanitize = (fileSystem as any).titleToFilename.bind(fileSystem)
      
      expect(sanitize('Normal Title')).toBe('normal-title')
      expect(sanitize('Title<>:"/\\|?*')).toBe('title')
      expect(sanitize('Multiple   Spaces')).toBe('multiple-spaces')
      expect(sanitize('---Multiple---Dashes---')).toBe('multiple-dashes')
      expect(sanitize('  Leading and Trailing  ')).toBe('leading-and-trailing')
      expect(sanitize('UPPERCASE')).toBe('uppercase')
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      fileSystem.setNotesFolder('/notes')
    })

    it('handles operations without notes folder gracefully', async () => {
      const emptyFileSystem = new FileSystemManager()

      expect(await emptyFileSystem.loadFileTree()).toEqual([])
      expect(await emptyFileSystem.loadNotes()).toEqual([])
      expect(await emptyFileSystem.loadNote('Test')).toBeNull()
      expect(await emptyFileSystem.loadNoteByPath('test.md')).toBeNull()
      expect(await emptyFileSystem.deleteNote('Test')).toBe(false)
      expect(await emptyFileSystem.deleteFileOrFolder('test')).toBe(false)
      expect(await emptyFileSystem.renameFileOrFolder('old', 'new')).toBe(false)
    })

    it('handles Tauri API errors gracefully', async () => {
      const error = new Error('Tauri API error')
      
      mockReadDir.mockRejectedValue(error)
      mockReadTextFile.mockRejectedValue(error)
      mockWriteTextFile.mockRejectedValue(error)
      mockMkdir.mockRejectedValue(error)
      mockRemove.mockRejectedValue(error)
      mockRename.mockRejectedValue(error)

      expect(await fileSystem.loadFileTree()).toEqual([])
      expect(await fileSystem.loadNotes()).toEqual([])
      expect(await fileSystem.loadNote('Test')).toBeNull()
      expect(await fileSystem.createNote()).toBeNull()
      expect(await fileSystem.createFolder('Test')).toBe(false)
      expect(await fileSystem.saveNote('Test', 'Content')).toBe(false)
      expect(await fileSystem.deleteNote('Test')).toBe(false)
      expect(await fileSystem.renameNote('Old', 'New')).toBe(false)

      // Should log all errors (9 because createNote logs an extra error for the folder check)
      expect(mockConsoleError).toHaveBeenCalledTimes(9)
    })
  })
})