import { describe, it, expect } from 'vitest'
import { parseBinItem, serializeBinItem } from '../markdown'
import type { BinItem } from '../../types/bin-item'

const SAMPLE_MARKDOWN = `---
id: "abc123"
title: "상태머신 구조 개선"
priority: "A"
tags: ["전투시스템", "아키텍처"]
author: "dev-name"
created: "2026-02-15T10:30:00+09:00"
status: "open"
promoted_at: null
---

## 문제 상황
전투 상태머신에서 이벤트 누락 발생

## 현재 구조
switch-case 기반 상태 전환

## 개선 아이디어
State 패턴 적용

## 영향 범위
- BattleStateMachine.cs
- UI 컨트롤러 3개`

describe('parseBinItem', () => {
  it('parses frontmatter and body sections from markdown', () => {
    const item = parseBinItem(SAMPLE_MARKDOWN, 'bins/personal/dev-name/test.md', 'sha123')

    expect(item.id).toBe('abc123')
    expect(item.title).toBe('상태머신 구조 개선')
    expect(item.priority).toBe('A')
    expect(item.tags).toEqual(['전투시스템', '아키텍처'])
    expect(item.author).toBe('dev-name')
    expect(item.status).toBe('open')
    expect(item.promoted_at).toBeNull()
    expect(item.problem).toContain('이벤트 누락')
    expect(item.currentStructure).toContain('switch-case')
    expect(item.idea).toContain('State 패턴')
    expect(item.impact).toContain('BattleStateMachine')
    expect(item.filePath).toBe('bins/personal/dev-name/test.md')
    expect(item.sha).toBe('sha123')
  })

  it('handles missing body sections gracefully', () => {
    const minimal = `---
id: "min1"
title: "최소 항목"
priority: "B"
tags: []
author: "dev"
created: "2026-02-15T00:00:00+09:00"
status: "open"
promoted_at: null
---`

    const item = parseBinItem(minimal, 'path.md', 'sha')
    expect(item.problem).toBe('')
    expect(item.idea).toBe('')
  })
})

describe('serializeBinItem', () => {
  it('serializes a BinItem back to markdown with frontmatter', () => {
    const item: BinItem = {
      id: 'abc123',
      title: '테스트 항목',
      priority: 'S',
      tags: ['UI'],
      author: 'dev',
      created: '2026-02-15T10:00:00+09:00',
      status: 'open',
      promoted_at: null,
      problem: '문제 설명',
      currentStructure: '현재 구조 설명',
      idea: '개선 아이디어 설명',
      impact: '영향 범위 설명',
      filePath: '',
      sha: '',
    }

    const md = serializeBinItem(item)
    expect(md).toContain('title: "테스트 항목"')
    expect(md).toContain('priority: "S"')
    expect(md).toContain('## 문제 상황')
    expect(md).toContain('문제 설명')
    expect(md).toContain('## 개선 아이디어')
  })
})
