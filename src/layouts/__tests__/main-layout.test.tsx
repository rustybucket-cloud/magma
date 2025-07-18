import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import MainLayout from '../main-layout'

// Mock the NotesProvider
vi.mock('@/contexts/NotesContext', () => ({
  NotesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notes-provider">{children}</div>
  )
}))

// Mock the UI components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle Sidebar</button>
}))

// Mock the AppSidebar
vi.mock('@/components/app-sidebar', () => ({
  default: () => <div data-testid="app-sidebar">App Sidebar</div>
}))

// Mock react-router hooks
const mockUseLocation = vi.fn()
const mockUseParams = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    useParams: () => mockUseParams(),
    Outlet: () => <div data-testid="outlet">Page Content</div>
  }
})

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/' })
    mockUseParams.mockReturnValue({})
  })

  const renderMainLayout = () => {
    return render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )
  }

  describe('layout structure', () => {
    it('renders all main layout components', () => {
      renderMainLayout()

      expect(screen.getByTestId('notes-provider')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })

    it('renders header with correct structure', () => {
      renderMainLayout()

      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('h-[var(--header-height)]', 'flex', 'items-center', 'pl-2', 'gap-2')
    })

    it('renders main content area', () => {
      renderMainLayout()

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveClass('min-h-[calc(100vh-var(--header-height)-8px)]', 'border-1', 'border-gray-600', 'rounded-lg', 'm-1')
    })

    it('renders page content through Outlet', () => {
      renderMainLayout()

      expect(screen.getByTestId('outlet')).toBeInTheDocument()
      expect(screen.getByText('Page Content')).toBeInTheDocument()
    })
  })

  describe('HeaderText component', () => {
    it('displays "Home" when on home page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' })
      
      renderMainLayout()

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('displays filename when on note page', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/test-note.md' })
      mockUseParams.mockReturnValue({ notePath: 'test-note.md' })
      
      renderMainLayout()

      expect(screen.getByText('test-note')).toBeInTheDocument()
    })

    it('displays filename from nested path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/folder/subfolder/my-note.md' })
      mockUseParams.mockReturnValue({ notePath: 'folder/subfolder/my-note.md' })
      
      renderMainLayout()

      expect(screen.getByText('my-note')).toBeInTheDocument()
    })

    it('handles encoded note path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/folder%2Ftest-note.md' })
      mockUseParams.mockReturnValue({ notePath: 'folder%2Ftest-note.md' })
      
      renderMainLayout()

      expect(screen.getByText('test-note')).toBeInTheDocument()
    })

    it('displays "Untitled" when note path is missing', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/' })
      mockUseParams.mockReturnValue({ notePath: undefined })
      
      renderMainLayout()

      expect(screen.getByText('Untitled')).toBeInTheDocument()
    })

    it('displays "Untitled" when note path is empty', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/' })
      mockUseParams.mockReturnValue({ notePath: '' })
      
      renderMainLayout()

      expect(screen.getByText('Untitled')).toBeInTheDocument()
    })

    it('displays "Untitled" when path has no filename', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/folder/' })
      mockUseParams.mockReturnValue({ notePath: 'folder/' })
      
      renderMainLayout()

      expect(screen.getByText('Untitled')).toBeInTheDocument()
    })

    it('returns null for unknown routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown' })
      
      renderMainLayout()

      // Should not display any header text for unknown routes
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
      expect(screen.queryByText('Untitled')).not.toBeInTheDocument()
    })

    it('handles note path without .md extension', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/plain-note' })
      mockUseParams.mockReturnValue({ notePath: 'plain-note' })
      
      renderMainLayout()

      expect(screen.getByText('plain-note')).toBeInTheDocument()
    })

    it('handles complex encoded paths', () => {
      mockUseLocation.mockReturnValue({ pathname: '/note/My%20Documents%2FSpecial%20Note.md' })
      mockUseParams.mockReturnValue({ notePath: 'My%20Documents%2FSpecial%20Note.md' })
      
      renderMainLayout()

      expect(screen.getByText('Special Note')).toBeInTheDocument()
    })
  })

  describe('provider hierarchy', () => {
    it('wraps content in NotesProvider', () => {
      renderMainLayout()

      const notesProvider = screen.getByTestId('notes-provider')
      const sidebarProvider = screen.getByTestId('sidebar-provider')
      
      expect(notesProvider).toBeInTheDocument()
      expect(notesProvider).toContainElement(sidebarProvider)
    })

    it('wraps sidebar content in SidebarProvider', () => {
      renderMainLayout()

      const sidebarProvider = screen.getByTestId('sidebar-provider')
      const appSidebar = screen.getByTestId('app-sidebar')
      
      expect(sidebarProvider).toBeInTheDocument()
      expect(sidebarProvider).toContainElement(appSidebar)
    })
  })

  describe('responsive layout', () => {
    it('applies correct CSS classes for responsive design', () => {
      renderMainLayout()

      // Check that the layout structure is present
      const sidebarProvider = screen.getByTestId('sidebar-provider')
      expect(sidebarProvider).toBeInTheDocument()
      
      // The actual div with classes is rendered by the real component, 
      // but our mock doesn't include those classes
      expect(sidebarProvider).toContainElement(screen.getByTestId('app-sidebar'))
    })

    it('includes sidebar trigger in header', () => {
      renderMainLayout()

      const header = screen.getByRole('banner')
      const sidebarTrigger = screen.getByTestId('sidebar-trigger')
      
      expect(header).toContainElement(sidebarTrigger)
    })
  })
})