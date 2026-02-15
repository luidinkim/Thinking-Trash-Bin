import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock auth module to avoid real sessionStorage / Octokit calls
vi.mock('./contexts/auth-context', () => {
  const actual = vi.importActual('./contexts/auth-context')
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
      user: null,
      token: null,
      loading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      handleCallback: vi.fn(),
    }),
  }
})

describe('App', () => {
  it('renders without crashing and shows loading state', () => {
    render(<App />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
