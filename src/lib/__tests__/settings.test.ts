import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS } from '../../types/settings'
import type { Settings } from '../../types/settings'

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

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

describe('settings persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when no stored settings', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves and loads settings', () => {
    const custom: Settings = {
      ...DEFAULT_SETTINGS,
      thinkingMode: 'split',
      defaultTimer: 45,
    }
    saveSettings(custom)
    expect(loadSettings()).toEqual(custom)
  })

  it('merges partial stored settings with defaults', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ thinkingMode: 'overlay' }))
    const loaded = loadSettings()
    expect(loaded.thinkingMode).toBe('overlay')
    expect(loaded.defaultTimer).toBe(30) // default
  })

  it('returns defaults on corrupted data', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
