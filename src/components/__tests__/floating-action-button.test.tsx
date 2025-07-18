import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { FloatingActionButton } from '../floating-action-button'

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  }
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Mock Mountain icon
vi.mock('@/components/icons/mountain', () => ({
  default: ({ style }: any) => (
    <div data-testid="mountain-icon" style={style}>
      Mountain Icon
    </div>
  )
}))

// Mock NotesContext
const mockCreateNote = vi.fn()
vi.mock('@/contexts/NotesContext', () => ({
  useNotes: () => ({
    createNote: mockCreateNote
  })
}))

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock Date.now for consistent timestamps
const mockDateNow = vi.spyOn(Date, 'now')

describe('FloatingActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
    mockDateNow.mockReturnValue(1234567890)
  })

  const renderFloatingActionButton = (props = {}) => {
    return render(
      <BrowserRouter>
        <FloatingActionButton {...props} />
      </BrowserRouter>
    )
  }

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderFloatingActionButton()
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Create new note')).toBeInTheDocument()
    })

    it('renders Mountain icon', () => {
      renderFloatingActionButton()
      
      expect(screen.getByTestId('mountain-icon')).toBeInTheDocument()
    })

    it('applies default classes', () => {
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'h-14',
        'w-14', 
        'rounded-full',
        'shadow-lg',
        'hover:shadow-xl',
        'transition-shadow'
      )
    })

    it('applies custom className', () => {
      renderFloatingActionButton({ className: 'custom-class' })
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('has correct accessibility attributes', () => {
      renderFloatingActionButton()
      
      // The size prop is passed to the Button component but doesn't become an HTML attribute
      expect(screen.getByText('Create new note')).toHaveClass('sr-only')
    })

    it('sets Mountain icon size', () => {
      renderFloatingActionButton()
      
      const icon = screen.getByTestId('mountain-icon')
      expect(icon).toHaveStyle({ width: '40px', height: '40px' })
    })
  })

  describe('note creation', () => {
    it('creates note and navigates on successful creation', async () => {
      mockCreateNote.mockResolvedValue('new-note.md')
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith()
        expect(mockNavigate).toHaveBeenCalledWith('/note/new-note.md')
      })
    })

    it('handles encoded note paths', async () => {
      mockCreateNote.mockResolvedValue('folder/my note.md')
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/note/folder%2Fmy%20note.md')
      })
    })

    it('handles null return from createNote', async () => {
      mockCreateNote.mockResolvedValue(null)
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith()
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-1234567890.md')
      })
    })

    it('handles createNote error with fallback navigation', async () => {
      mockCreateNote.mockRejectedValue(new Error('Creation failed'))
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error creating note:', expect.any(Error))
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-1234567890.md')
      })
    })

    it('uses timestamp for fallback navigation', async () => {
      mockCreateNote.mockResolvedValue(null)
      mockDateNow.mockReturnValue(9999999999)
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-9999999999.md')
      })
    })
  })

  describe('interaction', () => {
    it('calls handleClick when button is clicked', async () => {
      mockCreateNote.mockResolvedValue('test.md')
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalled()
      })
    })

    it('handles multiple rapid clicks gracefully', async () => {
      mockCreateNote.mockResolvedValue('test.md')
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      
      // Rapid clicks
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Should still work correctly
      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('logs error and provides fallback when createNote throws', async () => {
      const error = new Error('Network error')
      mockCreateNote.mockRejectedValue(error)
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error creating note:', error)
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-1234567890.md')
      })
    })

    it('provides fallback when createNote returns undefined', async () => {
      mockCreateNote.mockResolvedValue(undefined)
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-1234567890.md')
      })
    })

    it('provides fallback when createNote returns empty string', async () => {
      mockCreateNote.mockResolvedValue('')
      
      renderFloatingActionButton()
      
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/note/Untitled-1234567890.md')
      })
    })
  })

  describe('motion props', () => {
    it('applies motion wrapper with correct classes', () => {
      renderFloatingActionButton()
      
      // The motion.div wrapper should have the fixed positioning classes
      const wrapper = screen.getByRole('button').parentElement
      expect(wrapper).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50')
    })
  })
})