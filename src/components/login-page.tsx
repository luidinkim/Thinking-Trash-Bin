import { useAuth } from '../contexts/auth-context'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const { login, loading, error } = useAuth()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">ThinkBin</h1>
          <p className="text-muted-foreground mt-2">생각의 쓰레기통 — 개선 아이디어를 안전하게</p>
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={login}
          disabled={loading}
          className="mx-auto"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {loading ? '로그인 중...' : 'GitHub로 로그인'}
        </Button>
      </div>
    </div>
  )
}
