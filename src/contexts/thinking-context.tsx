import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { BinItem } from '@/types/bin-item'

interface ThinkingSession {
  item: BinItem
  durationMinutes: number
  startedAt: Date
}

interface ThinkingContextType {
  session: ThinkingSession | null
  isActive: boolean
  startSession: (item: BinItem, durationMinutes: number) => void
  endSession: () => void
}

const ThinkingContext = createContext<ThinkingContextType | null>(null)

export function ThinkingProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ThinkingSession | null>(null)

  const startSession = useCallback((item: BinItem, durationMinutes: number) => {
    setSession({ item, durationMinutes, startedAt: new Date() })
  }, [])

  const endSession = useCallback(() => {
    setSession(null)
  }, [])

  return (
    <ThinkingContext.Provider value={{
      session,
      isActive: session !== null,
      startSession,
      endSession,
    }}>
      {children}
    </ThinkingContext.Provider>
  )
}

export function useThinking() {
  const ctx = useContext(ThinkingContext)
  if (!ctx) throw new Error('useThinking must be used within ThinkingProvider')
  return ctx
}
