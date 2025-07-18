import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FolderTree } from '../folder-tree'
import { FileTreeItem } from '@/types'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  File: () => <div data-testid="file-icon" />,
  Folder: () => <div data-testid="folder-icon" />,
  FolderOpen: () => <div data-testid="folder-open-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />
}))

// Mock UI components
vi.mock('../ui/input', () => ({
  Input: ({ value, onChange, onBlur, onKeyDown, onClick, className, ...props }: any) => (
    <input
      data-testid="tree-input"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className={className}
      {...props}
    />
  )
}))

vi.mock('../ui/context-menu', () => ({
  ContextMenu: ({ children }: any) => <div data-testid="context-menu">{children}</div>,
  ContextMenuTrigger: ({ children }: any) => (
    <div data-testid="context-menu-trigger">{children}</div>
  ),
  ContextMenuContent: ({ children }: any) => <div data-testid="context-menu-content">{children}</div>,
  ContextMenuItem: ({ children, onClick, variant }: any) => (
    <button 
      data-testid="context-menu-item" 
      onClick={onClick}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  ContextMenuSeparator: () => <div data-testid="context-menu-separator" />
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Sample file tree data
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

const emptyFolder: FileTreeItem[] = [
  {
    name: 'EmptyFolder',
    path: 'EmptyFolder',
    type: 'folder',
    children: []
  }
]

describe('FolderTree', () => {
  const mockOnFileClick = vi.fn()
  const mockOnCreateNote = vi.fn()
  const mockOnCreateFolder = vi.fn()
  const mockOnRename = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('renders empty tree', () => {
      render(
        <FolderTree 
          items={[]} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Should render without crashing
      expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
    })

    it('renders file and folder items', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('standalone.md')).toBeInTheDocument()
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument()
      expect(screen.getAllByTestId('file-icon')).toHaveLength(2) // One in tree, one in context menu
    })

    it('shows chevron icons for folders', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    })

    it('does not show chevron icons for files', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onFileClick={mockOnFileClick}
        />
      )
      
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
    })
  })

  describe('folder expansion', () => {
    it('expands folder when clicked', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Initially collapsed
      expect(screen.queryByText('note1.md')).not.toBeInTheDocument()
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
      
      // Click to expand
      const folderItem = screen.getByText('Documents')
      fireEvent.click(folderItem)
      
      // Should be expanded
      expect(screen.getByText('note1.md')).toBeInTheDocument()
      expect(screen.getByText('Subfolder')).toBeInTheDocument()
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument()
    })

    it('collapses expanded folder when clicked again', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      const folderItem = screen.getByText('Documents')
      
      // Expand
      fireEvent.click(folderItem)
      expect(screen.getByText('note1.md')).toBeInTheDocument()
      
      // Collapse
      fireEvent.click(folderItem)
      expect(screen.queryByText('note1.md')).not.toBeInTheDocument()
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    })

    it('handles nested folder expansion', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Expand Documents folder
      const documentsFolder = screen.getByText('Documents')
      fireEvent.click(documentsFolder)
      
      expect(screen.getByText('Subfolder')).toBeInTheDocument()
      expect(screen.queryByText('note2.md')).not.toBeInTheDocument()
      
      // Expand Subfolder
      const subfolder = screen.getByText('Subfolder')
      fireEvent.click(subfolder)
      
      expect(screen.getByText('note2.md')).toBeInTheDocument()
    })
  })

  describe('file interactions', () => {
    it('calls onFileClick when file is clicked', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      const fileItem = screen.getByText('standalone.md')
      fireEvent.click(fileItem)
      
      expect(mockOnFileClick).toHaveBeenCalledWith('standalone.md')
    })

    it('calls onFileClick for nested files', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Expand Documents folder first
      const documentsFolder = screen.getByText('Documents')
      fireEvent.click(documentsFolder)
      
      // Click nested file
      const nestedFile = screen.getByText('note1.md')
      fireEvent.click(nestedFile)
      
      expect(mockOnFileClick).toHaveBeenCalledWith('Documents/note1.md')
    })
  })

  describe('context menu', () => {
    it('renders context menu for files', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
        />
      )
      
      expect(screen.getAllByTestId('context-menu')).toHaveLength(2) // Documents folder + standalone.md file
    })

    it('shows file-specific context menu items', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file only
          onFileClick={mockOnFileClick}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
        />
      )
      
      const contextMenuItems = screen.getAllByTestId('context-menu-item')
      const itemTexts = contextMenuItems.map(item => item.textContent)
      
      expect(itemTexts).toContain('Open')
      expect(itemTexts).toContain('Rename')
      expect(itemTexts).toContain('Delete')
    })

    it('shows folder-specific context menu items', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[0]]} // Documents folder only
          onCreateNote={mockOnCreateNote}
          onCreateFolder={mockOnCreateFolder}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
        />
      )
      
      const contextMenuItems = screen.getAllByTestId('context-menu-item')
      const itemTexts = contextMenuItems.map(item => item.textContent)
      
      expect(itemTexts).toContain('New Note')
      expect(itemTexts).toContain('New Folder')
      expect(itemTexts).toContain('Rename')
      expect(itemTexts).toContain('Delete')
    })

    it('calls onCreateNote when New Note context item is clicked', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[0]]} // Documents folder
          onCreateNote={mockOnCreateNote}
        />
      )
      
      const newNoteItem = screen.getByText('New Note')
      fireEvent.click(newNoteItem)
      
      expect(mockOnCreateNote).toHaveBeenCalledWith('Documents')
    })

    it('calls onCreateFolder when New Folder context item is clicked', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[0]]} // Documents folder
          onCreateFolder={mockOnCreateFolder}
        />
      )
      
      const newFolderItem = screen.getByText('New Folder')
      fireEvent.click(newFolderItem)
      
      expect(mockOnCreateFolder).toHaveBeenCalledWith('Documents')
    })

    it('calls onDelete when Delete context item is clicked', async () => {
      mockOnDelete.mockResolvedValue(true)
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onDelete={mockOnDelete}
        />
      )
      
      const deleteItem = screen.getByText('Delete')
      fireEvent.click(deleteItem)
      
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('standalone.md')
      })
    })
  })

  describe('rename functionality', () => {
    it('enters edit mode when Rename context item is clicked', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      expect(screen.getByTestId('tree-input')).toBeInTheDocument()
      expect(screen.getByDisplayValue('standalone.md')).toBeInTheDocument()
    })

    it('calls onRename when Enter is pressed during edit', async () => {
      mockOnRename.mockResolvedValue(true)
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Change name and press Enter
      const input = screen.getByTestId('tree-input')
      fireEvent.change(input, { target: { value: 'renamed.md' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('standalone.md', 'renamed.md', true)
      })
    })

    it('cancels edit when Escape is pressed', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Press Escape
      const input = screen.getByTestId('tree-input')
      fireEvent.keyDown(input, { key: 'Escape' })
      
      // Should exit edit mode
      expect(screen.queryByTestId('tree-input')).not.toBeInTheDocument()
      expect(screen.getByText('standalone.md')).toBeInTheDocument()
      expect(mockOnRename).not.toHaveBeenCalled()
    })

    it('calls onRename when input loses focus', async () => {
      mockOnRename.mockResolvedValue(true)
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Change name and blur
      const input = screen.getByTestId('tree-input')
      fireEvent.change(input, { target: { value: 'renamed.md' } })
      fireEvent.blur(input)
      
      // Wait for the timeout in handleBlur
      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('standalone.md', 'renamed.md', true)
      }, { timeout: 200 })
    })

    it('resets name if rename fails', async () => {
      mockOnRename.mockResolvedValue(false)
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Change name and press Enter
      const input = screen.getByTestId('tree-input')
      fireEvent.change(input, { target: { value: 'renamed.md' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalled()
      })
      
      // Should still be in edit mode with original name
      expect(screen.getByDisplayValue('standalone.md')).toBeInTheDocument()
    })

    it('does not rename if name is unchanged', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Press Enter without changing name
      const input = screen.getByTestId('tree-input')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnRename).not.toHaveBeenCalled()
      expect(screen.queryByTestId('tree-input')).not.toBeInTheDocument()
    })

    it('does not rename if name is empty', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Clear name and press Enter
      const input = screen.getByTestId('tree-input')
      fireEvent.change(input, { target: { value: '   ' } }) // whitespace only
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnRename).not.toHaveBeenCalled()
      expect(screen.queryByTestId('tree-input')).not.toBeInTheDocument()
    })

    it('prevents clicks during edit mode', () => {
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onFileClick={mockOnFileClick}
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      // Try to click the item while editing
      const input = screen.getByTestId('tree-input')
      fireEvent.click(input.parentElement!)
      
      // Should not call onFileClick
      expect(mockOnFileClick).not.toHaveBeenCalled()
    })
  })

  describe('indentation and nesting', () => {
    it('applies correct indentation for nested items', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Expand Documents folder
      const documentsFolder = screen.getByText('Documents')
      fireEvent.click(documentsFolder)
      
      // Check that nested items have proper indentation
      const nestedFile = screen.getByText('note1.md').parentElement
      expect(nestedFile).toHaveStyle({ paddingLeft: '16px' })
    })

    it('handles deeply nested items', () => {
      render(
        <FolderTree 
          items={sampleFileTree} 
          onFileClick={mockOnFileClick}
        />
      )
      
      // Expand Documents folder
      const documentsFolder = screen.getByText('Documents')
      fireEvent.click(documentsFolder)
      
      // Expand Subfolder
      const subfolder = screen.getByText('Subfolder')
      fireEvent.click(subfolder)
      
      // Check deeply nested item indentation
      const deeplyNestedFile = screen.getByText('note2.md').parentElement
      expect(deeplyNestedFile).toHaveStyle({ paddingLeft: '32px' }) // level 2 * 16px
    })
  })

  describe('edge cases', () => {
    it('handles empty folder', () => {
      render(
        <FolderTree 
          items={emptyFolder} 
          onFileClick={mockOnFileClick}
        />
      )
      
      const folderItem = screen.getByText('EmptyFolder')
      fireEvent.click(folderItem)
      
      // Should expand but show no children
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument()
    })

    it('handles missing callback functions gracefully', () => {
      render(
        <FolderTree 
          items={sampleFileTree}
          // No callbacks provided
        />
      )
      
      // Should render without crashing
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('standalone.md')).toBeInTheDocument()
      
      // Clicking should not throw errors
      const fileItem = screen.getByText('standalone.md')
      expect(() => fireEvent.click(fileItem)).not.toThrow()
    })

    it('handles rename with error gracefully', async () => {
      mockOnRename.mockRejectedValue(new Error('Rename failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <FolderTree 
          items={[sampleFileTree[1]]} // standalone.md file
          onRename={mockOnRename}
        />
      )
      
      // Enter edit mode and try to rename
      const renameItem = screen.getByText('Rename')
      fireEvent.click(renameItem)
      
      const input = screen.getByTestId('tree-input')
      fireEvent.change(input, { target: { value: 'renamed.md' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error during rename:', expect.any(Error))
      })
      
      // Should reset to original name
      expect(screen.getByDisplayValue('standalone.md')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })
})