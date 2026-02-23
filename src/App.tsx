import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { ThinkingProvider } from './contexts/thinking-context'
import { Toaster } from 'sonner'
import { SettingsProvider, useSettings } from './contexts/settings-context'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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

function ThemedToaster() {
  const { settings } = useSettings()
  const toasterTheme = settings.theme === 'system' ? 'system' : settings.theme
  return <Toaster theme={toasterTheme} position="bottom-right" />
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <ThemedToaster />
    </SettingsProvider>
  )
}

export default App
