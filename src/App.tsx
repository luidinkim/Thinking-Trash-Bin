import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { LoginPage } from './components/login-page'
import { AppShell } from './components/layout/app-shell'

function AppContent() {
  const { user, loading } = useAuth()

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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
