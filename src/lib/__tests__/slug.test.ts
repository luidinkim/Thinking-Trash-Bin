import { describe, it, expect } from 'vitest'
import { generateFilePath } from '../slug'

describe('generateFilePath', () => {
  it('creates personal bin path with date and title slug', () => {
    const path = generateFilePath('personal', 'dev-name', '상태머신 구조 개선', '2026-02-15')
    expect(path).toBe('bins/personal/dev-name/2026-02-15-상태머신-구조-개선.md')
  })

  it('creates team bin path', () => {
    const path = generateFilePath('team', 'dev-name', '전투 시스템 리팩토링', '2026-02-15')
    expect(path).toBe('bins/team/2026-02-15-전투-시스템-리팩토링.md')
  })

  it('removes special characters from slug', () => {
    const path = generateFilePath('personal', 'dev', 'UI (이벤트) 정리!', '2026-02-15')
    expect(path).toBe('bins/personal/dev/2026-02-15-UI-이벤트-정리.md')
  })
})
