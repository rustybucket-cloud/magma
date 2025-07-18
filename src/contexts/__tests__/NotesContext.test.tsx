import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { NotesProvider, useNotes } from '../NotesContext'
import { fileSystem } from '@/lib/fileSystem'
import { type Note, type FileTreeItem } from '@/types'

// Mock the fileSystem
vi.mock('@/lib/fileSystem', () => ({
  fileSystem: {
    getNotesFolder: vi.fn(),
    selectNotesFolder: vi.fn(),
    loadFileTree: vi.fn(),
    loadNotes: vi.fn(),
    createNote: vi.fn(),
    createFolder: vi.fn(),
    saveNote: vi.fn(),
    loadNote: vi.fn(),
    loadNoteByPath: vi.fn(),
    deleteNote: vi.fn(),
    deleteFileOrFolder: vi.fn(),
    renameNote: vi.fn(),
    renameFileOrFolder: vi.fn(),
  }
}))

const mockFileSystem = vi.mocked(fileSystem)

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

// Test component that uses the context
function TestComponent() {
  const {
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
  } = useNotes()

  return (
    <div>
      <div data-testid="notes-count">{notes.length}</div>
      <div data-testid="file-tree-count">{fileTree.length}</div>
      <div data-testid="notes-folder">{notesFolder || 'none'}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="current-note">{currentNote?.title || 'none'}</div>
      
      <button onClick={selectFolder} data-testid="select-folder">Select Folder</button>
      <button onClick={loadNotes} data-testid="load-notes">Load Notes</button>
      <button onClick={loadFileTree} data-testid="load-file-tree">Load File Tree</button>
      <button onClick={() => createNote()} data-testid="create-note">Create Note</button>
      <button onClick={() => createFolder('Test Folder')} data-testid="create-folder">Create Folder</button>
      <button onClick={() => saveNote('Test', 'Content')} data-testid="save-note">Save Note</button>
      <button onClick={() => loadNote('Test')} data-testid="load-note">Load Note</button>
      <button onClick={() => loadNoteByPath('test.md')} data-testid="load-note-by-path">Load Note By Path</button>
      <button onClick={() => openFile('test.md')} data-testid="open-file">Open File</button>
      <button onClick={() => deleteNote('Test')} data-testid="delete-note">Delete Note</button>
      <button onClick={() => deleteFileOrFolder('test.md')} data-testid="delete-file">Delete File</button>
      <button onClick={() => renameNote('Old', 'New')} data-testid="rename-note">Rename Note</button>
      <button onClick={() => renameFileOrFolder('old.md', 'new', true)} data-testid="rename-file">Rename File</button>
    </div>
  )
}

describe('NotesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useNotes hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useNotes must be used within a NotesProvider')

      console.error = originalError
    })
  })

  describe('NotesProvider', () => {
    it('initializes with default state', () => {
      mockFileSystem.getNotesFolder.mockReturnValue(null)

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      expect(screen.getByTestId('notes-count')).toHaveTextContent('0')
      expect(screen.getByTestId('file-tree-count')).toHaveTextContent('0')
      expect(screen.getByTestId('notes-folder')).toHaveTextContent('none')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      expect(screen.getByTestId('current-note')).toHaveTextContent('none')
    })

    it('initializes with saved folder and loads data', async () => {
      const mockNotes: Note[] = [
        {
          title: 'Test Note',
          content: 'Test content',
          category: { id: '1', name: 'General' },
          createdAt: new Date(),
          updatedAt: new Date(),
          path: 'test.md'
        }
      ]

      const mockFileTree: FileTreeItem[] = [
        {
          name: 'test',
          path: 'test.md',
          type: 'file'
        }
      ]

      mockFileSystem.getNotesFolder.mockReturnValue('/test/notes')
      mockFileSystem.loadNotes.mockResolvedValue(mockNotes)
      mockFileSystem.loadFileTree.mockResolvedValue(mockFileTree)

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('notes-folder')).toHaveTextContent('/test/notes')
      })

      await waitFor(() => {
        expect(screen.getByTestId('notes-count')).toHaveTextContent('1')
        expect(screen.getByTestId('file-tree-count')).toHaveTextContent('1')
      })

      expect(mockFileSystem.loadNotes).toHaveBeenCalled()
      expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
    })
  })

  describe('selectFolder', () => {
    it('selects folder and loads data', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue(null)
      mockFileSystem.selectNotesFolder.mockResolvedValue('/new/folder')
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('select-folder').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('notes-folder')).toHaveTextContent('/new/folder')
      })

      expect(mockFileSystem.selectNotesFolder).toHaveBeenCalled()
      expect(mockFileSystem.loadNotes).toHaveBeenCalled()
      expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
    })

    it('handles folder selection cancellation', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue(null)
      mockFileSystem.selectNotesFolder.mockResolvedValue(null)

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('select-folder').click()
      })

      expect(screen.getByTestId('notes-folder')).toHaveTextContent('none')
      expect(mockFileSystem.loadNotes).not.toHaveBeenCalled()
      expect(mockFileSystem.loadFileTree).not.toHaveBeenCalled()
    })
  })

  describe('loadFileTree', () => {
    it('loads file tree successfully', async () => {
      const mockFileTree: FileTreeItem[] = [
        { name: 'folder1', path: 'folder1', type: 'folder', children: [], isExpanded: false },
        { name: 'note1', path: 'note1.md', type: 'file' }
      ]

      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadFileTree.mockResolvedValue(mockFileTree)
      mockFileSystem.loadNotes.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-file-tree').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('file-tree-count')).toHaveTextContent('2')
      })

      expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
    })

    it('handles file tree loading error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadFileTree.mockRejectedValue(new Error('Load error'))
      mockFileSystem.loadNotes.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-file-tree').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error loading file tree:', expect.any(Error))
      })

      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })
  })

  describe('loadNotes', () => {
    it('loads notes successfully', async () => {
      const mockNotes: Note[] = [
        {
          title: 'Note 1',
          content: 'Content 1',
          category: { id: '1', name: 'General' },
          createdAt: new Date(),
          updatedAt: new Date(),
          path: 'note1.md'
        },
        {
          title: 'Note 2',
          content: 'Content 2',
          category: { id: '1', name: 'General' },
          createdAt: new Date(),
          updatedAt: new Date(),
          path: 'note2.md'
        }
      ]

      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNotes.mockResolvedValue(mockNotes)
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-notes').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('notes-count')).toHaveTextContent('2')
      })

      expect(mockFileSystem.loadNotes).toHaveBeenCalled()
    })

    it('handles notes loading error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNotes.mockRejectedValue(new Error('Load error'))
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-notes').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error loading notes:', expect.any(Error))
      })

      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })
  })

  describe('createNote', () => {
    it('creates note and reloads data', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.createNote.mockResolvedValue('new-note.md')
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('create-note').click()
      })

      expect(mockFileSystem.createNote).toHaveBeenCalledWith(undefined)
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
        expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
      })
    })

    it('handles note creation error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.createNote.mockRejectedValue(new Error('Create error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('create-note').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error creating note:', expect.any(Error))
      })
    })

    it('handles null return from createNote', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.createNote.mockResolvedValue(null)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('create-note').click()
      })

      expect(mockFileSystem.createNote).toHaveBeenCalled()
      // Should not reload data if creation failed
      expect(mockFileSystem.loadNotes).toHaveBeenCalledTimes(1) // Only initial load
    })
  })

  describe('createFolder', () => {
    it('creates folder and reloads file tree', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.createFolder.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('create-folder').click()
      })

      expect(mockFileSystem.createFolder).toHaveBeenCalledWith('Test Folder', undefined)
      
      await waitFor(() => {
        expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
      })
    })

    it('handles folder creation error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.createFolder.mockRejectedValue(new Error('Create error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('create-folder').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error creating folder:', expect.any(Error))
      })
    })
  })

  describe('saveNote', () => {
    it('saves note and reloads notes', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.saveNote.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('save-note').click()
      })

      expect(mockFileSystem.saveNote).toHaveBeenCalledWith('Test', 'Content', undefined)
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
      })
    })

    it('handles save note error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.saveNote.mockRejectedValue(new Error('Save error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('save-note').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error saving note:', expect.any(Error))
      })
    })
  })

  describe('loadNote', () => {
    it('loads note successfully', async () => {
      const mockNote: Note = {
        title: 'Test Note',
        content: 'Test content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      }

      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNote.mockResolvedValue(mockNote)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-note').click()
      })

      expect(mockFileSystem.loadNote).toHaveBeenCalledWith('Test')
    })

    it('handles load note error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNote.mockRejectedValue(new Error('Load error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-note').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error loading note:', expect.any(Error))
      })
    })
  })

  describe('loadNoteByPath', () => {
    it('loads note by path successfully', async () => {
      const mockNote: Note = {
        title: 'Test Note',
        content: 'Test content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      }

      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNoteByPath.mockResolvedValue(mockNote)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-note-by-path').click()
      })

      expect(mockFileSystem.loadNoteByPath).toHaveBeenCalledWith('test.md')
    })

    it('handles load note by path error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNoteByPath.mockRejectedValue(new Error('Load error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('load-note-by-path').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error loading note by path:', expect.any(Error))
      })
    })
  })

  describe('openFile', () => {
    it('opens file and sets current note', async () => {
      const mockNote: Note = {
        title: 'Test Note',
        content: 'Test content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      }

      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNoteByPath.mockResolvedValue(mockNote)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('open-file').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('current-note')).toHaveTextContent('Test Note')
      })

      expect(mockFileSystem.loadNoteByPath).toHaveBeenCalledWith('test.md')
    })

    it('handles open file error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNoteByPath.mockRejectedValue(new Error('Open error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('open-file').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error opening file:', expect.any(Error))
      })

      expect(screen.getByTestId('current-note')).toHaveTextContent('none')
    })

    it('handles null note from loadNoteByPath', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.loadNoteByPath.mockResolvedValue(null)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('open-file').click()
      })

      expect(screen.getByTestId('current-note')).toHaveTextContent('none')
    })
  })

  describe('deleteNote', () => {
    it('deletes note and reloads notes', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.deleteNote.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('delete-note').click()
      })

      expect(mockFileSystem.deleteNote).toHaveBeenCalledWith('Test')
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
      })
    })

    it('handles delete note error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.deleteNote.mockRejectedValue(new Error('Delete error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('delete-note').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error deleting note:', expect.any(Error))
      })
    })
  })

  describe('deleteFileOrFolder', () => {
    it('deletes file and reloads data', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.deleteFileOrFolder.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('delete-file').click()
      })

      expect(mockFileSystem.deleteFileOrFolder).toHaveBeenCalledWith('test.md')
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
        expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
      })
    })

    it('handles delete file error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.deleteFileOrFolder.mockRejectedValue(new Error('Delete error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('delete-file').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error deleting file or folder:', expect.any(Error))
      })
    })
  })

  describe('renameNote', () => {
    it('renames note and reloads notes', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.renameNote.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('rename-note').click()
      })

      expect(mockFileSystem.renameNote).toHaveBeenCalledWith('Old', 'New')
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
      })
    })

    it('handles rename note error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.renameNote.mockRejectedValue(new Error('Rename error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('rename-note').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error renaming note:', expect.any(Error))
      })
    })
  })

  describe('renameFileOrFolder', () => {
    it('renames file and reloads data', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.renameFileOrFolder.mockResolvedValue(true)
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('rename-file').click()
      })

      expect(mockFileSystem.renameFileOrFolder).toHaveBeenCalledWith('old.md', 'new', true)
      
      await waitFor(() => {
        expect(mockFileSystem.loadNotes).toHaveBeenCalled()
        expect(mockFileSystem.loadFileTree).toHaveBeenCalled()
      })
    })

    it('handles rename file error', async () => {
      mockFileSystem.getNotesFolder.mockReturnValue('/test')
      mockFileSystem.renameFileOrFolder.mockRejectedValue(new Error('Rename error'))
      mockFileSystem.loadNotes.mockResolvedValue([])
      mockFileSystem.loadFileTree.mockResolvedValue([])

      render(
        <NotesProvider>
          <TestComponent />
        </NotesProvider>
      )

      await act(async () => {
        screen.getByTestId('rename-file').click()
      })

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error renaming file or folder:', expect.any(Error))
      })
    })
  })
})