import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import Home from '../home'
import { Note } from '@/types'

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  FolderOpen: () => <div data-testid="folder-open-icon" />
}))

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, ...props }: any) => (
    <input data-testid="search-input" placeholder={placeholder} {...props} />
  )
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="select-folder-button" onClick={onClick} {...props}>
      {children}
    </button>
  )
}))

// Mock floating action button
vi.mock('@/components/floating-action-button', () => ({
  FloatingActionButton: () => <div data-testid="floating-action-button" />
}))

// Mock note card
vi.mock('../components/note-card', () => ({
  default: ({ note }: { note: Note }) => (
    <div data-testid={`note-card-${note.title}`}>
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <span>{note.updatedAt.toLocaleDateString()}</span>
    </div>
  )
}))

// Mock NotesContext
const mockSelectFolder = vi.fn()
const mockNotesContext = {
  notes: [] as Note[],
  notesFolder: null as string | null,
  selectFolder: mockSelectFolder,
  fileTree: [],
  loadNotes: vi.fn(),
  loadFileTree: vi.fn(),
  createNote: vi.fn(),
  createFolder: vi.fn(),
  saveNote: vi.fn(),
  loadNote: vi.fn(),
  loadNoteByPath: vi.fn(),
  openFile: vi.fn(),
  deleteNote: vi.fn(),
  renameNote: vi.fn(),
  renameFileOrFolder: vi.fn(),
  deleteFileOrFolder: vi.fn()
}

vi.mock('@/contexts/NotesContext', () => ({
  useNotes: () => mockNotesContext
}))

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

// Sample notes for testing
const sampleNotes: Note[] = [
  {
    title: 'First Note',
    content: 'This is the first note content',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    category: { id: '1', name: 'General' },
    path: 'first-note.md'
  },
  {
    title: 'Second Note',
    content: 'This is the second note with some longer content that should be truncated when displayed in the card view',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z'),
    category: { id: '1', name: 'General' },
    path: 'second-note.md'
  },
  {
    title: 'Third Note',
    content: '---\ntitle: Third Note\n---\nThis note has frontmatter that should be stripped',
    createdAt: new Date('2024-01-01T11:00:00Z'), // Same date as first note
    updatedAt: new Date('2024-01-01T11:00:00Z'),
    category: { id: '2', name: 'Work' },
    path: 'third-note.md'
  }
]

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset context to default state
    mockNotesContext.notes = []
    mockNotesContext.notesFolder = null
  })

  describe('when no notes folder is selected', () => {
    it('renders welcome screen with folder selection', () => {
      renderWithRouter(<Home />)
      
      expect(screen.getByText('Welcome to Magma')).toBeInTheDocument()
      expect(screen.getByText('Select a folder where your notes will be stored')).toBeInTheDocument()
      expect(screen.getByTestId('select-folder-button')).toBeInTheDocument()
      expect(screen.getAllByTestId('folder-open-icon')).toHaveLength(2) // One in main area, one in button
    })

    it('calls selectFolder when button is clicked', () => {
      renderWithRouter(<Home />)
      
      const selectButton = screen.getByTestId('select-folder-button')
      fireEvent.click(selectButton)
      
      expect(mockSelectFolder).toHaveBeenCalledTimes(1)
    })

    it('does not render search input or floating action button', () => {
      renderWithRouter(<Home />)
      
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
      expect(screen.queryByTestId('floating-action-button')).not.toBeInTheDocument()
    })
  })

  describe('when notes folder is selected', () => {
    beforeEach(() => {
      mockNotesContext.notesFolder = '/path/to/notes'
    })

    it('renders search input and floating action button', () => {
      renderWithRouter(<Home />)
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByTestId('floating-action-button')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument()
    })

    it('shows empty state when no notes exist', () => {
      renderWithRouter(<Home />)
      
      expect(screen.getByText('No notes found in this folder')).toBeInTheDocument()
      expect(screen.getByText('Click the + button to create your first note')).toBeInTheDocument()
    })

    it('renders notes grouped by date', () => {
      mockNotesContext.notes = sampleNotes
      renderWithRouter(<Home />)
      
      // Should show date headers (using the actual date format from toDateString())
      const expectedDate1 = new Date('2024-01-01T10:00:00Z').toDateString()
      const expectedDate2 = new Date('2024-01-02T10:00:00Z').toDateString()
      
      expect(screen.getByText(expectedDate1)).toBeInTheDocument()
      expect(screen.getByText(expectedDate2)).toBeInTheDocument()
      
      // Should show note cards
      expect(screen.getByTestId('note-card-First Note')).toBeInTheDocument()
      expect(screen.getByTestId('note-card-Second Note')).toBeInTheDocument()
      expect(screen.getByTestId('note-card-Third Note')).toBeInTheDocument()
    })

    it('groups notes correctly by date', () => {
      mockNotesContext.notes = sampleNotes
      renderWithRouter(<Home />)
      
      const expectedDate1 = new Date('2024-01-01T10:00:00Z').toDateString()
      const expectedDate2 = new Date('2024-01-02T10:00:00Z').toDateString()
      
      // First Note and Third Note should be under the same date
      const jan01Section = screen.getByText(expectedDate1).parentElement
      expect(jan01Section).toContainElement(screen.getByTestId('note-card-First Note'))
      expect(jan01Section).toContainElement(screen.getByTestId('note-card-Third Note'))
      
      // Second Note should be under Jan 02 2024
      const jan02Section = screen.getByText(expectedDate2).parentElement
      expect(jan02Section).toContainElement(screen.getByTestId('note-card-Second Note'))
    })

    it('does not show welcome screen when folder is selected', () => {
      renderWithRouter(<Home />)
      
      expect(screen.queryByText('Welcome to Magma')).not.toBeInTheDocument()
      expect(screen.queryByText('Select a folder where your notes will be stored')).not.toBeInTheDocument()
    })
  })

  describe('notes grouping logic', () => {
    it('handles notes with same date correctly', () => {
      const notesWithSameDate: Note[] = [
        {
          title: 'Morning Note',
          content: 'Written in the morning',
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T09:00:00Z'),
          category: { id: '1', name: 'General' },
          path: 'morning.md'
        },
        {
          title: 'Evening Note',
          content: 'Written in the evening',
          createdAt: new Date('2024-01-01T21:00:00Z'),
          updatedAt: new Date('2024-01-01T21:00:00Z'),
          category: { id: '1', name: 'General' },
          path: 'evening.md'
        }
      ]
      
      mockNotesContext.notes = notesWithSameDate
      mockNotesContext.notesFolder = '/path/to/notes'
      renderWithRouter(<Home />)
      
      const expectedDate = new Date('2024-01-01T09:00:00Z').toDateString()
      
      // Should only show one date header
      const dateHeaders = screen.getAllByText(expectedDate)
      expect(dateHeaders).toHaveLength(1)
      
      // Both notes should be present
      expect(screen.getByTestId('note-card-Morning Note')).toBeInTheDocument()
      expect(screen.getByTestId('note-card-Evening Note')).toBeInTheDocument()
    })

    it('handles empty notes array', () => {
      mockNotesContext.notes = []
      mockNotesContext.notesFolder = '/path/to/notes'
      renderWithRouter(<Home />)
      
      expect(screen.getByText('No notes found in this folder')).toBeInTheDocument()
      expect(screen.queryByTestId('note-card-')).not.toBeInTheDocument()
    })
  })
})