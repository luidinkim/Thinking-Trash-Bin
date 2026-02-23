import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { ThinkingProvider } from './contexts/thinking-context'
import { Toaster } from 'sonner'
import { SettingsProvider } from './contexts/settings-context'
import { LoginPage } from './components/login-page'
import { AppShell } from './components/layout/app-shell'
import { OAuthCallback } from './components/oauth-callback'

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
      <ThinkingProvider>
        <AppShell />
      </ThinkingProvider>
    </BinProvider>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster theme="dark" position="bottom-right" />
    </SettingsProvider>
  )
}

export default App
