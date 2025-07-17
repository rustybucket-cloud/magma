import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fileSystem } from '@/lib/fileSystem'
import { type Note, type FileTreeItem } from '@/types'

interface NotesContextType {
  notes: Note[]
  fileTree: FileTreeItem[]
  notesFolder: string | null
  isLoading: boolean
  currentNote: Note | null
  selectFolder: () => Promise<void>
  loadNotes: () => Promise<void>
  loadFileTree: () => Promise<void>
  createNote: (folderPath?: string) => Promise<string | null>
  createFolder: (folderName: string, parentPath?: string) => Promise<boolean>
  saveNote: (title: string, content: string, folderPath?: string) => Promise<boolean>
  loadNote: (title: string) => Promise<Note | null>
  loadNoteByPath: (path: string) => Promise<Note | null>
  openFile: (path: string) => Promise<void>
  deleteNote: (title: string) => Promise<boolean>
  deleteFileOrFolder: (path: string) => Promise<boolean>
  renameNote: (title: string, newTitle: string) => Promise<boolean>
  renameFileOrFolder: (oldPath: string, newName: string, isFile?: boolean) => Promise<boolean>
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([])
  const [notesFolder, setNotesFolder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentNote, setCurrentNote] = useState<Note | null>(null)

  // Initialize on mount
  useEffect(() => {
    const savedFolder = fileSystem.getNotesFolder()
    if (savedFolder) {
      setNotesFolder(savedFolder)
      loadNotes()
      loadFileTree()
    }
  }, [])

  const selectFolder = async () => {
    const folder = await fileSystem.selectNotesFolder()
    if (folder) {
      setNotesFolder(folder)
      await loadNotes()
      await loadFileTree()
    }
  }

  const loadFileTree = async () => {
    setIsLoading(true)
    try {
      const tree = await fileSystem.loadFileTree()
      setFileTree(tree)
    } catch (error) {
      console.error('Error loading file tree:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const loadedNotes = await fileSystem.loadNotes()
      setNotes(loadedNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNote = async (folderPath?: string) => {
    try {
      const noteTitle = await fileSystem.createNote(folderPath)
      if (noteTitle) {
        // Reload notes and file tree to reflect changes
        await loadNotes()
        await loadFileTree()
      }
      return noteTitle
    } catch (error) {
      console.error('Error creating note:', error)
      return null
    }
  }

  const createFolder = async (folderName: string, parentPath?: string) => {
    try {
      const success = await fileSystem.createFolder(folderName, parentPath)
      if (success) {
        // Reload file tree to reflect changes
        await loadFileTree()
      }
      return success
    } catch (error) {
      console.error('Error creating folder:', error)
      return false
    }
  }

  const saveNote = async (title: string, content: string, folderPath?: string) => {
    try {
      const success = await fileSystem.saveNote(title, content, folderPath)
      if (success) {
        // Reload notes to reflect changes
        await loadNotes()
      }
      return success
    } catch (error) {
      console.error('Error saving note:', error)
      return false
    }
  }

  const renameNote = async (title: string, newTitle: string) => {
    try {
      const success = await fileSystem.renameNote(title, newTitle)
      if (success) {
        await loadNotes()
        return true
      }
      return false
    } catch (error) {
      console.error('Error renaming note:', error)
      return false
    }
  }

  const loadNote = async (title: string) => {
    try {
      return await fileSystem.loadNote(title)
    } catch (error) {
      console.error('Error loading note:', error)
      return null
    }
  }

  const loadNoteByPath = async (path: string) => {
    try {
      return await fileSystem.loadNoteByPath(path)
    } catch (error) {
      console.error('Error loading note by path:', error)
      return null
    }
  }

  const openFile = async (path: string) => {
    try {
      const note = await fileSystem.loadNoteByPath(path)
      if (note) {
        setCurrentNote(note)
      }
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  const deleteNote = async (title: string) => {
    try {
      const success = await fileSystem.deleteNote(title)
      if (success) {
        // Reload notes to reflect changes
        await loadNotes()
      }
      return success
    } catch (error) {
      console.error('Error deleting note:', error)
      return false
    }
  }

  const deleteFileOrFolder = async (path: string) => {
    try {
      const success = await fileSystem.deleteFileOrFolder(path)
      if (success) {
        // Reload both notes and file tree to reflect changes
        await loadNotes()
        await loadFileTree()
      }
      return success
    } catch (error) {
      console.error('Error deleting file or folder:', error)
      return false
    }
  }

  const renameFileOrFolder = async (oldPath: string, newName: string, isFile: boolean = false) => {
    try {
      const success = await fileSystem.renameFileOrFolder(oldPath, newName, isFile)
      if (success) {
        // Reload both notes and file tree to reflect changes
        await loadNotes()
        await loadFileTree()
      }
      return success
    } catch (error) {
      console.error('Error renaming file or folder:', error)
      return false
    }
  }

  const value: NotesContextType = {
    notes,
    fileTree,
    notesFolder,
    isLoading,
    currentNote,
    selectFolder,
    loadNotes,
    loadFileTree,
    createNote,
    createFolder,
    saveNote,
    loadNote,
    loadNoteByPath,
    openFile,
    deleteNote,
    deleteFileOrFolder,
    renameNote,
    renameFileOrFolder
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}
