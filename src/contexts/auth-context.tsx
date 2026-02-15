import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Octokit } from '@octokit/rest'
import { getStoredToken, storeToken, clearToken, exchangeCodeForToken } from '../lib/auth'

interface User {
  login: string
  avatar_url: string
  name: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: () => void
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async (accessToken: string) => {
    const octokit = new Octokit({ auth: accessToken })
    const { data } = await octokit.users.getAuthenticated()
    setUser({ login: data.login, avatar_url: data.avatar_url, name: data.name })
    setToken(accessToken)
  }, [])

  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      fetchUser(stored)
        .catch(() => clearToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
      scope: 'repo',
      redirect_uri: window.location.origin + '/callback',
    })
    window.location.href = `https://github.com/login/oauth/authorize?${params}`
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setToken(null)
  }

  const handleCallback = async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await exchangeCodeForToken(code)
      storeToken(accessToken)
      await fetchUser(accessToken)
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
