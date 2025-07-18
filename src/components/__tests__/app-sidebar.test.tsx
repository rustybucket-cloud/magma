import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import AppSidebar from '../app-sidebar'
import { FileTreeItem } from '@/types'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FolderOpen: () => <div data-testid="folder-open-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  FolderPlus: () => <div data-testid="folder-plus-icon" />,
  FileText: () => <div data-testid="file-text-icon" />
}))

// Mock UI components
vi.mock('../ui/sidebar', () => ({
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
  SidebarHeader: ({ children, className }: any) => (
    <div data-testid="sidebar-header" className={className}>{children}</div>
  ),
  SidebarFooter: ({ children, className }: any) => (
    <div data-testid="sidebar-footer" className={className}>{children}</div>
  )
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, disabled, ...props }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('../ui/input', () => ({
  Input: ({ value, onChange, onKeyDown, placeholder, autoFocus, ...props }: any) => (
    <input
      data-testid="input"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      {...props}
    />
  )
}))

vi.mock('../ui/dialog', () => ({
  Dialog: ({ children, open }: any) => 
    open ? <div data-testid="dialog" data-open={open}>{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>
}))

vi.mock('../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button data-testid="dropdown-item" onClick={onClick}>{children}</button>
  )
}))

// Mock FolderTree component
vi.mock('../folder-tree', () => ({
  FolderTree: ({ items, onFileClick, onCreateNote, onCreateFolder, onRename, onDelete }: any) => (
    <div data-testid="folder-tree">
      {items.map((item: FileTreeItem) => (
        <div key={item.path} data-testid={`tree-item-${item.name}`}>
          <button onClick={() => onFileClick?.(item.path)}>{item.name}</button>
          <button onClick={() => onCreateNote?.(item.path)}>Create Note</button>
          <button onClick={() => onCreateFolder?.(item.path)}>Create Folder</button>
          <button onClick={() => onRename?.(item.path, 'new-name', item.type === 'file')}>Rename</button>
          <button onClick={() => onDelete?.(item.path)}>Delete</button>
        </div>
      ))}
    </div>
  )
}))

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
})

// Mock NotesContext
const mockSelectFolder = vi.fn()
const mockOpenFile = vi.fn()
const mockCreateNote = vi.fn()
const mockCreateFolder = vi.fn()
const mockRenameFileOrFolder = vi.fn()
const mockDeleteFileOrFolder = vi.fn()

const mockNotesContext = {
  fileTree: [] as FileTreeItem[],
  notesFolder: null as string | null,
  selectFolder: mockSelectFolder,
  openFile: mockOpenFile,
  createNote: mockCreateNote,
  createFolder: mockCreateFolder,
  renameFileOrFolder: mockRenameFileOrFolder,
  deleteFileOrFolder: mockDeleteFileOrFolder,
  notes: [],
  loadNotes: vi.fn(),
  loadFileTree: vi.fn(),
  saveNote: vi.fn(),
  loadNote: vi.fn(),
  loadNoteByPath: vi.fn(),
  deleteNote: vi.fn(),
  renameNote: vi.fn()
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

// Sample file tree for testing
const sampleFileTree: FileTreeItem[] = [
  {
    name: 'Documents',
    path: 'Documents',
    type: 'folder',
    children: [
      {
        name: 'note1.md',
        path: 'Documents/note1.md',
        type: 'file'
      },
      {
        name: 'Subfolder',
        path: 'Documents/Subfolder',
        type: 'folder',
        children: [
          {
            name: 'note2.md',
            path: 'Documents/Subfolder/note2.md',
            type: 'file'
          }
        ]
      }
    ]
  },
  {
    name: 'standalone.md',
    path: 'standalone.md',
    type: 'file'
  }
]

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset context to default state
    mockNotesContext.fileTree = []
    mockNotesContext.notesFolder = null
  })

  describe('when no notes folder is selected', () => {
    it('renders Magma title and select folder button', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByText('Magma')).toBeInTheDocument()
      expect(screen.getByText('Select Notes Folder')).toBeInTheDocument()
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument()
    })

    it('calls selectFolder when select folder button is clicked', () => {
      renderWithRouter(<AppSidebar />)
      
      const selectButton = screen.getByText('Select Notes Folder')
      fireEvent.click(selectButton)
      
      expect(mockSelectFolder).toHaveBeenCalledTimes(1)
    })

    it('shows instruction message', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByText('Select a folder to view your notes')).toBeInTheDocument()
    })

    it('does not show dropdown menu or folder tree', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument()
      expect(screen.queryByTestId('folder-tree')).not.toBeInTheDocument()
    })

    it('does not show footer with folder path', () => {
      renderWithRouter(<AppSidebar />)
      
      const footer = screen.getByTestId('sidebar-footer')
      expect(footer).toBeEmptyDOMElement()
    })
  })

  describe('when notes folder is selected', () => {
    beforeEach(() => {
      mockNotesContext.notesFolder = '/path/to/notes'
    })

    it('renders Magma title and plus dropdown', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByText('Magma')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('shows dropdown menu items', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByText('New Note')).toBeInTheDocument()
      expect(screen.getByText('New Folder')).toBeInTheDocument()
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument()
      expect(screen.getByTestId('folder-plus-icon')).toBeInTheDocument()
    })

    it('calls createNote when New Note is clicked', async () => {
      renderWithRouter(<AppSidebar />)
      
      const newNoteButton = screen.getByText('New Note')
      fireEvent.click(newNoteButton)
      
      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith(undefined)
      })
    })

    it('opens create folder dialog when New Folder is clicked', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Folder')).toBeInTheDocument()
    })

    it('shows footer with shortened folder path', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByText('/path/to/notes')).toBeInTheDocument()
    })

    it('shortens long folder paths in footer', () => {
      mockNotesContext.notesFolder = '/very/long/path/to/notes/folder/that/exceeds/twenty/five/characters'
      renderWithRouter(<AppSidebar />)
      
      const shortenedPath = screen.getByText(/^\.\.\./)
      expect(shortenedPath.textContent).toMatch(/^\.\.\./)
      expect(shortenedPath.textContent?.length).toBeLessThanOrEqual(28) // "..." + 25 chars
    })

    it('calls selectFolder when footer folder button is clicked', () => {
      renderWithRouter(<AppSidebar />)
      
      const folderButton = screen.getByText('/path/to/notes')
      fireEvent.click(folderButton)
      
      expect(mockSelectFolder).toHaveBeenCalledTimes(1)
    })

    describe('with empty file tree', () => {
      it('shows no files message', () => {
        renderWithRouter(<AppSidebar />)
        
        expect(screen.getByText('No files found in selected folder')).toBeInTheDocument()
        expect(screen.queryByTestId('folder-tree')).not.toBeInTheDocument()
      })
    })

    describe('with file tree', () => {
      beforeEach(() => {
        mockNotesContext.fileTree = sampleFileTree
      })

      it('renders folder tree', () => {
        renderWithRouter(<AppSidebar />)
        
        expect(screen.getByTestId('folder-tree')).toBeInTheDocument()
        expect(screen.getByTestId('tree-item-Documents')).toBeInTheDocument()
        expect(screen.getByTestId('tree-item-standalone.md')).toBeInTheDocument()
      })

      it('handles file click and navigates', async () => {
        renderWithRouter(<AppSidebar />)
        
        const fileButton = screen.getByTestId('tree-item-standalone.md').querySelector('button')
        fireEvent.click(fileButton!)
        
        await waitFor(() => {
          expect(mockOpenFile).toHaveBeenCalledWith('standalone.md')
          expect(mockNavigate).toHaveBeenCalledWith('/note/standalone.md')
        })
      })
    })
  })

  describe('create folder dialog', () => {
    beforeEach(() => {
      mockNotesContext.notesFolder = '/path/to/notes'
    })

    it('opens dialog when New Folder is clicked', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true')
      expect(screen.getByText('Create New Folder')).toBeInTheDocument()
      expect(screen.getByText('Enter a name for the new folder.')).toBeInTheDocument()
    })

    it('shows parent path in dialog description when creating in subfolder', () => {
      renderWithRouter(<AppSidebar />)
      
      // Simulate creating folder in a subfolder by calling handleCreateFolder with path
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      // The dialog should be open
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    it('creates folder when form is submitted with valid name', async () => {
      mockCreateFolder.mockResolvedValue(true)
      renderWithRouter(<AppSidebar />)
      
      // Open dialog
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      // Enter folder name
      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'New Folder' } })
      
      // Click create button
      const createButton = screen.getByText('Create Folder')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(mockCreateFolder).toHaveBeenCalledWith('New Folder', undefined)
      })
    })

    it('closes dialog after successful folder creation', async () => {
      mockCreateFolder.mockResolvedValue(true)
      renderWithRouter(<AppSidebar />)
      
      // Open dialog
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      // Enter folder name and create
      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'New Folder' } })
      
      const createButton = screen.getByText('Create Folder')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })

    it('keeps dialog open if folder creation fails', async () => {
      mockCreateFolder.mockResolvedValue(false)
      renderWithRouter(<AppSidebar />)
      
      // Open dialog
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      // Enter folder name and create
      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'New Folder' } })
      
      const createButton = screen.getByText('Create Folder')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(mockCreateFolder).toHaveBeenCalled()
      })
      
      // Dialog should still be open
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    it('disables create button when folder name is empty', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      const createButton = screen.getByText('Create Folder')
      expect(createButton).toBeDisabled()
    })

    it('enables create button when folder name is entered', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'New Folder' } })
      
      const createButton = screen.getByText('Create Folder')
      expect(createButton).not.toBeDisabled()
    })

    it('closes dialog when cancel is clicked', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })

    it('handles Enter key to create folder', async () => {
      mockCreateFolder.mockResolvedValue(true)
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      const input = screen.getByTestId('input')
      fireEvent.change(input, { target: { value: 'New Folder' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockCreateFolder).toHaveBeenCalledWith('New Folder', undefined)
      })
    })

    it('handles Escape key to cancel', () => {
      renderWithRouter(<AppSidebar />)
      
      const newFolderButton = screen.getByText('New Folder')
      fireEvent.click(newFolderButton)
      
      const input = screen.getByTestId('input')
      fireEvent.keyDown(input, { key: 'Escape' })
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })

  describe('delete confirmation dialog', () => {
    beforeEach(() => {
      mockNotesContext.notesFolder = '/path/to/notes'
      mockNotesContext.fileTree = sampleFileTree
    })

    it('opens delete dialog when delete is triggered from folder tree', async () => {
      renderWithRouter(<AppSidebar />)
      
      const deleteButton = screen.getByTestId('tree-item-standalone.md').querySelector('button:last-child')
      fireEvent.click(deleteButton!)
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete "standalone.md"')).toBeInTheDocument()
        expect(screen.getByText('Are you sure you want to delete this item? This action cannot be undone.')).toBeInTheDocument()
      })
    })

    it('deletes item when confirmed', async () => {
      mockDeleteFileOrFolder.mockResolvedValue(true)
      renderWithRouter(<AppSidebar />)
      
      // Trigger delete
      const deleteButton = screen.getByTestId('tree-item-standalone.md').querySelector('button:last-child')
      fireEvent.click(deleteButton!)
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      
      // Confirm delete (use the dialog delete button specifically)
      const confirmButton = screen.getByTestId('dialog-footer').querySelector('[data-variant="destructive"]')
      fireEvent.click(confirmButton!)
      
      await waitFor(() => {
        expect(mockDeleteFileOrFolder).toHaveBeenCalledWith('standalone.md')
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes dialog when cancel is clicked', async () => {
      renderWithRouter(<AppSidebar />)
      
      // Trigger delete
      const deleteButton = screen.getByTestId('tree-item-standalone.md').querySelector('button:last-child')
      fireEvent.click(deleteButton!)
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
      
      // Cancel delete
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      expect(mockDeleteFileOrFolder).not.toHaveBeenCalled()
    })
  })

  describe('accessibility and structure', () => {
    it('renders all sidebar components', () => {
      renderWithRouter(<AppSidebar />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument()
    })

    it('has correct CSS classes on header and footer', () => {
      mockNotesContext.notesFolder = '/path/to/notes'
      renderWithRouter(<AppSidebar />)
      
      const header = screen.getByTestId('sidebar-header')
      const footer = screen.getByTestId('sidebar-footer')
      
      expect(header).toHaveClass('border-b', 'pb-4')
      expect(footer).toHaveClass('border-t', 'pt-4')
    })
  })
})