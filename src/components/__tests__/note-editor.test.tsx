import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { NoteEditor } from '../note-editor'

// Mock Editor.js
vi.mock('@editorjs/editorjs', () => ({
  default: vi.fn()
}))

vi.mock('@editorjs/header', () => ({
  default: vi.fn()
}))

vi.mock('@editorjs/paragraph', () => ({
  default: vi.fn()
}))

// Import the mocked module
import EditorJS from '@editorjs/editorjs'

// Create mock functions
const mockDestroy = vi.fn()
const mockSave = vi.fn()
const mockRender = vi.fn()

const MockedEditorJS = vi.mocked(EditorJS)

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock implementation
    MockedEditorJS.mockImplementation(() => ({
      isReady: Promise.resolve(),
      save: mockSave.mockResolvedValue({
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: 'Test content'
            }
          }
        ]
      }),
      destroy: mockDestroy,
      render: mockRender.mockResolvedValue(undefined),
    } as any))
  })

  it('renders without crashing', async () => {
    render(<NoteEditor />)
    // Wait for timeout-based initialization
    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalled()
    })
  })

  it('initializes Editor.js with correct configuration', async () => {
    const onContentChange = vi.fn()
    render(<NoteEditor onContentChange={onContentChange} />)

    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            header: expect.any(Function),
            paragraph: expect.any(Function)
          }),
          placeholder: "Start writing your note...",
          onChange: expect.any(Function)
        })
      )
    })
  })

  it('initializes with initial content', async () => {
    const initialContent = "Hello world"
    render(<NoteEditor initialContent={initialContent} />)

    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            blocks: [
              {
                type: "paragraph",
                data: {
                  text: "Hello world"
                }
              }
            ]
          }
        })
      )
    })
  })

  it('initializes with empty content when no initial content provided', async () => {
    render(<NoteEditor />)

    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined
        })
      )
    })
  })

  it('does not recreate editor when initial content changes (relies on key prop)', async () => {
    const { rerender } = render(<NoteEditor initialContent="First content" />)
    
    // Wait for first initialization
    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalledTimes(1)
    })
    
    expect(mockDestroy).not.toHaveBeenCalled()

    // Change the content - should NOT recreate editor
    rerender(<NoteEditor initialContent="Second content" />)

    // Wait a bit to ensure no recreation happens
    await new Promise(resolve => setTimeout(resolve, 50))

    // Editor should not be recreated
    expect(mockDestroy).not.toHaveBeenCalled()
    expect(MockedEditorJS).toHaveBeenCalledTimes(1)
  })

  it('calls onContentChange when editor content changes', async () => {
    const onContentChange = vi.fn()
    render(<NoteEditor onContentChange={onContentChange} />)

    // Wait for editor to initialize
    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalled()
    })

    // Get the onChange callback that was passed to Editor.js
    const editorConfig = MockedEditorJS.mock.calls[0][0] as any
    const onChange = editorConfig?.onChange

    // Simulate content change
    if (onChange) {
      await onChange()
    }

    expect(mockSave).toHaveBeenCalled()
    expect(onContentChange).toHaveBeenCalledWith('Test content')
  })

  it('handles destroy gracefully when destroy method is not available', async () => {
    // Mock an editor instance without destroy method
    MockedEditorJS.mockImplementation(() => ({
      isReady: Promise.resolve(),
      save: mockSave,
      // No destroy method
    } as any))

    const { unmount } = render(<NoteEditor initialContent="Test" />)
    
    // Wait for initialization
    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalled()
    })
    
    // This should not throw an error
    expect(() => unmount()).not.toThrow()
  })

  it('cleans up editor on unmount', async () => {
    const { unmount } = render(<NoteEditor />)
    
    // Wait for initialization
    await waitFor(() => {
      expect(MockedEditorJS).toHaveBeenCalled()
    })
    
    unmount()
    
    expect(mockDestroy).toHaveBeenCalled()
  })
})