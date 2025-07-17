import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fileSystem } from '@/lib/fileSystem'
import { type Note } from '@/types'

interface NotesContextType {
  notes: Note[]
  notesFolder: string | null
  isLoading: boolean
  selectFolder: () => Promise<void>
  loadNotes: () => Promise<void>
  createNote: () => Promise<string | null>
  saveNote: (title: string, content: string) => Promise<boolean>
  loadNote: (title: string) => Promise<Note | null>
  deleteNote: (title: string) => Promise<boolean>
  renameNote: (title: string, newTitle: string) => Promise<boolean>
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
  const [notesFolder, setNotesFolder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize on mount
  useEffect(() => {
    const savedFolder = fileSystem.getNotesFolder()
    if (savedFolder) {
      setNotesFolder(savedFolder)
      loadNotes()
    }
  }, [])

  const selectFolder = async () => {
    const folder = await fileSystem.selectNotesFolder()
    if (folder) {
      setNotesFolder(folder)
      await loadNotes()
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

  const createNote = async () => {
    try {
      const noteTitle = await fileSystem.createNote()
      if (noteTitle) {
        // Reload notes to reflect changes
        await loadNotes()
      }
      return noteTitle
    } catch (error) {
      console.error('Error creating note:', error)
      return null
    }
  }

  const saveNote = async (title: string, content: string) => {
    try {
      const success = await fileSystem.saveNote(title, content)
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

  const value: NotesContextType = {
    notes,
    notesFolder,
    isLoading,
    selectFolder,
    loadNotes,
    createNote,
    saveNote,
    loadNote,
    deleteNote,
    renameNote
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}
