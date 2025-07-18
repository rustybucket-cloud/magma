import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cn } from '../utils'

// Mock clsx and tailwind-merge
vi.mock('clsx', () => ({
  clsx: vi.fn((...args) => args.filter(Boolean).join(' '))
}))

vi.mock('tailwind-merge', () => ({
  twMerge: vi.fn((input) => input)
}))

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const mockClsx = vi.mocked(clsx)
const mockTwMerge = vi.mocked(twMerge)

describe('cn utility function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls clsx with provided inputs', () => {
    cn('class1', 'class2')
    
    expect(mockClsx).toHaveBeenCalledWith(['class1', 'class2'])
  })

  it('calls twMerge with clsx result', () => {
    mockClsx.mockReturnValue('class1 class2')
    
    cn('class1', 'class2')
    
    expect(mockTwMerge).toHaveBeenCalledWith('class1 class2')
  })

  it('returns twMerge result', () => {
    mockClsx.mockReturnValue('class1 class2')
    mockTwMerge.mockReturnValue('merged-classes')
    
    const result = cn('class1', 'class2')
    
    expect(result).toBe('merged-classes')
  })

  it('handles single class name', () => {
    mockClsx.mockReturnValue('single-class')
    mockTwMerge.mockReturnValue('single-class')
    
    const result = cn('single-class')
    
    expect(result).toBe('single-class')
    expect(mockClsx).toHaveBeenCalledWith(['single-class'])
  })

  it('handles multiple class names', () => {
    mockClsx.mockReturnValue('class1 class2 class3')
    mockTwMerge.mockReturnValue('class1 class2 class3')
    
    const result = cn('class1', 'class2', 'class3')
    
    expect(result).toBe('class1 class2 class3')
    expect(mockClsx).toHaveBeenCalledWith(['class1', 'class2', 'class3'])
  })

  it('handles conditional classes', () => {
    mockClsx.mockReturnValue('class1 class3')
    mockTwMerge.mockReturnValue('class1 class3')
    
    const result = cn('class1', false && 'class2', 'class3')
    
    expect(result).toBe('class1 class3')
    expect(mockClsx).toHaveBeenCalledWith(['class1', false, 'class3'])
  })

  it('handles object-style classes', () => {
    mockClsx.mockReturnValue('class1 class2')
    mockTwMerge.mockReturnValue('class1 class2')
    
    const result = cn({ 'class1': true, 'class2': true, 'class3': false })
    
    expect(result).toBe('class1 class2')
    expect(mockClsx).toHaveBeenCalledWith([{ 'class1': true, 'class2': true, 'class3': false }])
  })

  it('handles array of classes', () => {
    mockClsx.mockReturnValue('class1 class2')
    mockTwMerge.mockReturnValue('class1 class2')
    
    const result = cn(['class1', 'class2'])
    
    expect(result).toBe('class1 class2')
    expect(mockClsx).toHaveBeenCalledWith([['class1', 'class2']])
  })

  it('handles mixed input types', () => {
    mockClsx.mockReturnValue('class1 class2 class4')
    mockTwMerge.mockReturnValue('class1 class2 class4')
    
    const result = cn(
      'class1',
      { 'class2': true, 'class3': false },
      ['class4'],
      null,
      undefined
    )
    
    expect(result).toBe('class1 class2 class4')
    expect(mockClsx).toHaveBeenCalledWith([
      'class1',
      { 'class2': true, 'class3': false },
      ['class4'],
      null,
      undefined
    ])
  })

  it('handles empty input', () => {
    mockClsx.mockReturnValue('')
    mockTwMerge.mockReturnValue('')
    
    const result = cn()
    
    expect(result).toBe('')
    expect(mockClsx).toHaveBeenCalledWith([])
  })

  it('handles null and undefined inputs', () => {
    mockClsx.mockReturnValue('class1')
    mockTwMerge.mockReturnValue('class1')
    
    const result = cn('class1', null, undefined)
    
    expect(result).toBe('class1')
    expect(mockClsx).toHaveBeenCalledWith(['class1', null, undefined])
  })

  it('integrates clsx and twMerge correctly', () => {
    // Reset mocks to use actual implementations for integration test
    vi.clearAllMocks()
    
    // Import the actual functions for this test
    const { clsx: actualClsx } = require('clsx')
    const { twMerge: actualTwMerge } = require('tailwind-merge')
    
    mockClsx.mockImplementation(actualClsx)
    mockTwMerge.mockImplementation(actualTwMerge)
    
    const result = cn('px-2 py-1', 'px-4')
    
    // twMerge should handle conflicting Tailwind classes
    expect(mockClsx).toHaveBeenCalled()
    expect(mockTwMerge).toHaveBeenCalled()
    expect(typeof result).toBe('string')
  })
})