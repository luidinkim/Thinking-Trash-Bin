import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { ToastProvider } from './contexts/toast-context'
import { LoginPage } from './components/login-page'
import { AppShell } from './components/layout/app-shell'
import { OAuthCallback } from './components/oauth-callback'
import { ToastContainer } from './components/toast'

function AppContent() {
  const { user, loading } = useAuth()
  const [isCallback, setIsCallback] = useState(window.location.pathname.startsWith('/callback'))
  const handleCallbackComplete = useCallback(() => setIsCallback(false), [])

  if (isCallback) return <OAuthCallback onComplete={handleCallbackComplete} />

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <BinProvider>
      <AppShell />
    </BinProvider>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <ToastContainer />
    </ToastProvider>
  )
}

export default App
