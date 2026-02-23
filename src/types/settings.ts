export type ThinkingMode = 'fullscreen' | 'overlay' | 'split'
export type ThemeMode = 'dark' | 'light' | 'system'
export type ListDensity = 'compact' | 'comfortable'

export interface Settings {
  thinkingMode: ThinkingMode
  defaultTimer: number  // 분 단위, 1-60, 기본 30
  theme: ThemeMode
  listDensity: ListDensity
}

export const DEFAULT_SETTINGS: Settings = {
  thinkingMode: 'fullscreen',
  defaultTimer: 30,
  theme: 'dark',
  listDensity: 'comfortable',
}
