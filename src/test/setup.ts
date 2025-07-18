import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Editor.js since it requires DOM manipulation
vi.mock('@editorjs/editorjs', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      isReady: Promise.resolve(),
      save: vi.fn().mockResolvedValue({
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: 'Test content'
            }
          }
        ]
      }),
      destroy: vi.fn(),
      render: vi.fn().mockResolvedValue(undefined),
    }))
  }
})

vi.mock('@editorjs/header', () => ({
  default: vi.fn()
}))

vi.mock('@editorjs/paragraph', () => ({
  default: vi.fn()
}))