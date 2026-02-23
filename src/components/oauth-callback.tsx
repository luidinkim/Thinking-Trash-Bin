import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/auth-context'

export function OAuthCallback({ onComplete }: { onComplete: () => void }) {
  const { handleCallback } = useAuth()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      handleCallback(code)
        .then(() => {
          window.history.replaceState({}, '', '/')
          onComplete()
        })
        .catch(() => {
          window.history.replaceState({}, '', '/')
          onComplete()
        })
    } else {
      window.history.replaceState({}, '', '/')
      onComplete()
    }
  }, [handleCallback, onComplete])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">로그인 처리 중...</p>
    </div>
  )
}
