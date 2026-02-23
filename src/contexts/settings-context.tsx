import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { DEFAULT_SETTINGS } from '@/types/settings'
import type { ReactNode } from 'react'
import type { Settings, ThinkingMode, ThemeMode, ListDensity } from '@/types/settings'

const STORAGE_KEY = 'thinkbin-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsContextType {
  settings: Settings
  setThinkingMode: (mode: ThinkingMode) => void
  setDefaultTimer: (minutes: number) => void
  setTheme: (theme: ThemeMode) => void
  setListDensity: (density: ListDensity) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const setThinkingMode = useCallback((thinkingMode: ThinkingMode) => update({ thinkingMode }), [update])
  const setDefaultTimer = useCallback((defaultTimer: number) => {
    update({ defaultTimer: Math.max(1, Math.min(60, defaultTimer)) })
  }, [update])
  const setTheme = useCallback((theme: ThemeMode) => update({ theme }), [update])
  const setListDensity = useCallback((listDensity: ListDensity) => update({ listDensity }), [update])

  return (
    <SettingsContext.Provider value={{ settings, setThinkingMode, setDefaultTimer, setTheme, setListDensity }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
