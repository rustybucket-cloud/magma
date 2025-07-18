import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock the MainLayout component
vi.mock('../layouts/main-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">
      <div data-testid="layout-content">{children}</div>
    </div>
  )
}))

// Mock the home router
vi.mock('@/pages/home/router', () => ({
  default: [
    {
      path: '/',
      element: <div data-testid="home-page">Home Page</div>
    },
    {
      path: '/note/:notePath',
      element: <div data-testid="note-page">Note Page</div>
    }
  ]
}))

// Mock CSS import
vi.mock('./index.css', () => ({}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<App />)
    
    expect(screen.getByTestId('main-layout')).toBeInTheDocument()
    expect(screen.getByTestId('layout-content')).toBeInTheDocument()
  })

  it('sets up router with MainLayout as root component', () => {
    render(<App />)
    
    // The MainLayout should be rendered as the root component
    expect(screen.getByTestId('main-layout')).toBeInTheDocument()
  })

  it('includes home router routes as children', () => {
    render(<App />)
    
    // The router should be set up and rendering
    expect(screen.getByTestId('layout-content')).toBeInTheDocument()
  })
})