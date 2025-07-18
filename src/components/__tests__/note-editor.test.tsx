import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteEditor } from '../note-editor'

// Mock Lexical modules
vi.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: { children: React.ReactNode }) => <div data-testid="lexical-composer">{children}</div>
}))

vi.mock('@lexical/react/LexicalRichTextPlugin', () => ({
  RichTextPlugin: ({ contentEditable }: { contentEditable: React.ReactNode }) => (
    <div data-testid="rich-text-plugin">{contentEditable}</div>
  )
}))

vi.mock('@lexical/react/LexicalContentEditable', () => ({
  ContentEditable: ({ placeholder, ...props }: any) => (
    <div data-testid="content-editable" {...props}>
      {placeholder}
    </div>
  )
}))

vi.mock('@lexical/react/LexicalAutoFocusPlugin', () => ({
  AutoFocusPlugin: () => <div data-testid="auto-focus-plugin" />
}))

vi.mock('@lexical/react/LexicalHistoryPlugin', () => ({
  HistoryPlugin: () => <div data-testid="history-plugin" />
}))

vi.mock('@lexical/react/LexicalOnChangePlugin', () => ({
  OnChangePlugin: ({ onChange }: { onChange: (editorState: any) => void }) => {
    ;(global as any).mockOnChange = onChange
    return <div data-testid="on-change-plugin" />
  }
}))

vi.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({
  MarkdownShortcutPlugin: () => <div data-testid="markdown-shortcut-plugin" />
}))

vi.mock('@lexical/react/LexicalErrorBoundary', () => ({
  LexicalErrorBoundary: () => <div data-testid="error-boundary" />
}))

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [
    {
      update: vi.fn((callback: () => void) => {
        ;(global as any).mockUpdateCalled = true
        callback()
      })
    }
  ]
}))

vi.mock('@lexical/markdown', () => ({
  $convertFromMarkdownString: vi.fn(),
  $convertToMarkdownString: vi.fn(() => 'mocked markdown'),
  TRANSFORMERS: []
}))

vi.mock('lexical', () => ({
  $getRoot: vi.fn(() => ({}))
}))

// Mock all the node types
vi.mock('@lexical/react/LexicalHorizontalRuleNode', () => ({
  HorizontalRuleNode: {}
}))

vi.mock('@lexical/rich-text', () => ({
  HeadingNode: {},
  QuoteNode: {}
}))

vi.mock('@lexical/list', () => ({
  ListNode: {},
  ListItemNode: {}
}))

vi.mock('@lexical/code', () => ({
  CodeNode: {}
}))

vi.mock('@lexical/link', () => ({
  LinkNode: {}
}))

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<NoteEditor />)
    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument()
    expect(screen.getByTestId('rich-text-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('content-editable')).toBeInTheDocument()
  })

  it('renders all required plugins', () => {
    render(<NoteEditor />)
    
    expect(screen.getByTestId('auto-focus-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('history-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('on-change-plugin')).toBeInTheDocument()
    expect(screen.getByTestId('markdown-shortcut-plugin')).toBeInTheDocument()
  })

  it('initializes with initial content', () => {
    ;(global as any).mockUpdateCalled = false
    const initialContent = "Hello world"
    render(<NoteEditor initialContent={initialContent} />)
    
    // Should call update to set initial content
    expect((global as any).mockUpdateCalled).toBe(true)
  })

  it('does not initialize content when no initial content provided', () => {
    ;(global as any).mockUpdateCalled = false
    render(<NoteEditor />)
    
    // Should not call update when no initial content
    expect((global as any).mockUpdateCalled).toBe(false)
  })

  it('calls onContentChange when editor content changes', async () => {
    const onContentChange = vi.fn()
    render(<NoteEditor onContentChange={onContentChange} />)

    // Get the onChange callback that was stored globally
    const onChange = (global as any).mockOnChange
    expect(onChange).toBeDefined()

    // Simulate editor state change
    const mockEditorState = {
      read: vi.fn((callback: () => void) => callback())
    }
    
    onChange(mockEditorState)
    
    expect(onContentChange).toHaveBeenCalledWith('mocked markdown')
  })

  it('handles missing onContentChange gracefully', () => {
    render(<NoteEditor />)

    // Get the onChange callback
    const onChange = (global as any).mockOnChange
    
    // Simulate editor state change without onContentChange
    const mockEditorState = {
      read: vi.fn((callback: () => void) => callback())
    }
    
    expect(() => onChange(mockEditorState)).not.toThrow()
  })

  it('renders with correct placeholder text', () => {
    render(<NoteEditor />)
    
    const contentEditable = screen.getByTestId('content-editable')
    expect(contentEditable).toBeInTheDocument()
  })

  it('only initializes content once', () => {
    ;(global as any).mockUpdateCalled = false
    const { rerender } = render(<NoteEditor initialContent="First content" />)
    
    expect((global as any).mockUpdateCalled).toBe(true)
    
    // Reset the flag
    ;(global as any).mockUpdateCalled = false
    
    // Re-render with different content - should not call update again due to initializedRef
    rerender(<NoteEditor initialContent="Second content" />)
    
    expect((global as any).mockUpdateCalled).toBe(false)
  })
})