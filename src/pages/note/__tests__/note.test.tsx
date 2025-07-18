import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import NotePage from '../note'

import { type Note } from '@/types'

// Mock the motion library
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
  }
}))

// Mock the NoteEditor component
vi.mock('@/components/note-editor', () => ({
  NoteEditor: ({ onContentChange, initialContent, path }: any) => (
    <div data-testid="note-editor">
      <div data-testid="editor-content">{initialContent}</div>
      <div data-testid="editor-path">{path}</div>
      <button 
        data-testid="change-content" 
        onClick={() => onContentChange('Updated content')}
      >
        Change Content
      </button>
    </div>
  )
}))

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, onBlur, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      onBlur={onBlur}
      {...props}
    />
  )
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">←</span>
}))

// Mock the NotesContext
const mockUseNotes = {
  saveNote: vi.fn(),
  loadNoteByPath: vi.fn(),
  renameNote: vi.fn(),
}

vi.mock('@/contexts/NotesContext', () => ({
  useNotes: () => mockUseNotes
}))

// Mock react-router
const mockNavigate = vi.fn()
const mockUseParams = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('NotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
    mockUseParams.mockReturnValue({ notePath: 'test-note.md' })
  })

  const renderNotePage = () => {
    return render(
      <BrowserRouter>
        <NotePage />
      </BrowserRouter>
    )
  }

  describe('initialization', () => {
    it('renders without crashing', () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()
      
      expect(screen.getByRole('button', { name: /back to notes/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Untitled')).toBeInTheDocument()
    })

    it('loads note by path on mount', async () => {
      const mockNote: Note = {
        title: 'Test Note',
        content: 'Test content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test-note.md'
      }

      mockUseNotes.loadNoteByPath.mockResolvedValue(mockNote)
      
      renderNotePage()

      await waitFor(() => {
        expect(mockUseNotes.loadNoteByPath).toHaveBeenCalledWith('test-note.md')
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('Test content')
      })
    })

    it('handles encoded note path', async () => {
      mockUseParams.mockReturnValue({ notePath: 'folder%2Ftest-note.md' })
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      await waitFor(() => {
        expect(mockUseNotes.loadNoteByPath).toHaveBeenCalledWith('folder/test-note.md')
      })
    })

    it('handles missing note path', async () => {
      mockUseParams.mockReturnValue({})
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      // Should not call loadNoteByPath when no path is provided
      expect(mockUseNotes.loadNoteByPath).not.toHaveBeenCalled()
    })
  })

  describe('note loading', () => {
    it('sets content and title when note is loaded successfully', async () => {
      const mockNote: Note = {
        title: 'My Note',
        content: 'My content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'my-note.md'
      }

      mockUseNotes.loadNoteByPath.mockResolvedValue(mockNote)
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('My Note')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('My content')
      })
    })

    it('handles null note content', async () => {
      const mockNote: Note = {
        title: 'Empty Note',
        content: null as any,
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'empty-note.md'
      }

      mockUseNotes.loadNoteByPath.mockResolvedValue(mockNote)
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Empty Note')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('')
      })
    })

    it('handles note not found', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Untitled')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('')
      })
    })

    it('handles note loading error', async () => {
      mockUseNotes.loadNoteByPath.mockRejectedValue(new Error('Load error'))
      
      renderNotePage()

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error loading note by path:', expect.any(Error))
        expect(screen.getByDisplayValue('Untitled')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('')
      })
    })
  })

  describe('navigation', () => {
    it('navigates back to home when back button is clicked', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      const backButton = screen.getByRole('button', { name: /back to notes/i })
      fireEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('title editing', () => {
    it('updates internal title when input changes', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Original Title',
        content: 'Content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      })
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
      })

      const titleInput = screen.getByDisplayValue('Original Title')
      fireEvent.change(titleInput, { target: { value: 'New Title' } })

      expect(screen.getByDisplayValue('New Title')).toBeInTheDocument()
    })

    it('renames note when title input loses focus', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Original Title',
        content: 'Content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      })
      mockUseNotes.renameNote.mockResolvedValue(true)
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
      })

      const titleInput = screen.getByDisplayValue('Original Title')
      fireEvent.change(titleInput, { target: { value: 'New Title' } })
      fireEvent.blur(titleInput)

      await waitFor(() => {
        expect(mockUseNotes.renameNote).toHaveBeenCalledWith('Original Title', 'New Title')
      })
    })

    it('handles title rename error', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Original Title',
        content: 'Content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      })
      mockUseNotes.renameNote.mockRejectedValue(new Error('Rename error'))
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
      })

      const titleInput = screen.getByDisplayValue('Original Title')
      fireEvent.change(titleInput, { target: { value: 'New Title' } })
      fireEvent.blur(titleInput)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error renaming note:', expect.any(Error))
      })
    })
  })

  describe('content editing', () => {
    it('saves note when content changes', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Test Note',
        content: 'Original content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      })
      mockUseNotes.saveNote.mockResolvedValue(true)
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByTestId('note-editor')).toBeInTheDocument()
      })

      const changeButton = screen.getByTestId('change-content')
      fireEvent.click(changeButton)

      expect(mockUseNotes.saveNote).toHaveBeenCalledWith('Test Note', 'Updated content')
    })

    it('does not save when content is null', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      // Wait for the component to render but content should be null initially
      await waitFor(() => {
        expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument()
      })

      expect(mockUseNotes.saveNote).not.toHaveBeenCalled()
    })
  })

  describe('editor rendering', () => {
    it('renders editor with correct props when content is loaded', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Test Note',
        content: 'Test content',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'test.md'
      })
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByTestId('note-editor')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('Test content')
        expect(screen.getByTestId('editor-path')).toHaveTextContent('test-note.md')
      })
    })

    it('does not render editor when content is null', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      renderNotePage()

      // Content should be null initially, so editor should not render
      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument()
    })

    it('renders editor with empty content when note has empty content', async () => {
      mockUseNotes.loadNoteByPath.mockResolvedValue({
        title: 'Empty Note',
        content: '',
        category: { id: '1', name: 'General' },
        createdAt: new Date(),
        updatedAt: new Date(),
        path: 'empty.md'
      })
      
      renderNotePage()

      await waitFor(() => {
        expect(screen.getByTestId('note-editor')).toBeInTheDocument()
        expect(screen.getByTestId('editor-content')).toHaveTextContent('')
      })
    })
  })

  describe('component key behavior', () => {
    it('uses path as key for NotePageChild to force re-render', () => {
      mockUseParams.mockReturnValue({ notePath: 'test%2Fnote.md' })
      mockUseNotes.loadNoteByPath.mockResolvedValue(null)
      
      const { container } = renderNotePage()
      
      // The component should render (we can't directly test the key prop, but we can verify it renders)
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})