import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThinking } from '@/contexts/thinking-context'
import { useSettings } from '@/contexts/settings-context'
import { useTimer } from '@/hooks/use-timer'
import { TimerBar } from './timer-bar'
import { ThinkingMemo } from './thinking-memo'
import { ModeFullscreen } from './mode-fullscreen'
import { ModeOverlay } from './mode-overlay'
import { ModeSplit } from './mode-split'
import type { BinItem, Priority } from '@/types/bin-item'

interface ThinkingSessionProps {
  onSave: (item: BinItem, memo: string, elapsedMinutes: number) => Promise<void>
  onPromote: (item: BinItem) => Promise<void>
  onResolve: (item: BinItem) => Promise<void>
  onDrop: (item: BinItem) => Promise<void>
}

const priorityVariant: Record<Priority, 'priority_s' | 'priority_a' | 'priority_b'> = {
  S: 'priority_s',
  A: 'priority_a',
  B: 'priority_b',
}

const priorityLabels: Record<Priority, string> = {
  S: 'S -- 즉시 수정',
  A: 'A -- 다음 사이클',
  B: 'B -- 미래 개선',
}

function buildMarkdownBody(item: BinItem): string {
  const sections: string[] = []
  if (item.problem) sections.push(`## 문제 상황\n\n${item.problem}`)
  if (item.currentStructure) sections.push(`## 현재 구조\n\n${item.currentStructure}`)
  if (item.idea) sections.push(`## 개선 아이디어\n\n${item.idea}`)
  if (item.impact) sections.push(`## 영향 범위\n\n${item.impact}`)
  return sections.join('\n\n')
}

export function ThinkingSession({ onSave, onPromote, onResolve, onDrop }: ThinkingSessionProps) {
  const { session, endSession } = useThinking()
  const { settings } = useSettings()
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const memoRef = useRef(memo)
  memoRef.current = memo

  const handleExpire = useCallback(async () => {
    if (!session) return
    setSaving(true)
    try {
      await onSave(session.item, memoRef.current, session.durationMinutes)
    } finally {
      setSaving(false)
      endSession()
    }
  }, [session, onSave, endSession])

  const timer = useTimer({
    durationMinutes: session?.durationMinutes ?? 1,
    onExpire: handleExpire,
  })

  const { start: timerStart } = timer

  // Start timer when session becomes active
  const prevSessionRef = useRef<typeof session>(null)
  useEffect(() => {
    if (session && session !== prevSessionRef.current) {
      setMemo('')
      timerStart()
    }
    prevSessionRef.current = session
  }, [session, timerStart])

  const handleSaveAndEnd = useCallback(async () => {
    if (!session) return
    setSaving(true)
    try {
      timer.stop()
      await onSave(session.item, memo, timer.elapsedMinutes)
    } finally {
      setSaving(false)
      endSession()
    }
  }, [session, memo, timer, onSave, endSession])

  const handlePromote = useCallback(async () => {
    if (!session) return
    setSaving(true)
    try {
      timer.stop()
      await onSave(session.item, memo, timer.elapsedMinutes)
      await onPromote(session.item)
    } finally {
      setSaving(false)
      endSession()
    }
  }, [session, memo, timer, onSave, onPromote, endSession])

  const handleResolve = useCallback(async () => {
    if (!session) return
    setSaving(true)
    try {
      timer.stop()
      await onSave(session.item, memo, timer.elapsedMinutes)
      await onResolve(session.item)
    } finally {
      setSaving(false)
      endSession()
    }
  }, [session, memo, timer, onSave, onResolve, endSession])

  const handleDrop = useCallback(async () => {
    if (!session) return
    setSaving(true)
    try {
      timer.stop()
      await onSave(session.item, memo, timer.elapsedMinutes)
      await onDrop(session.item)
    } finally {
      setSaving(false)
      endSession()
    }
  }, [session, memo, timer, onSave, onDrop, endSession])

  const handleStop = useCallback(() => {
    timer.stop()
    endSession()
  }, [timer, endSession])

  if (!session) return null

  const { item } = session
  const body = buildMarkdownBody(item)

  const timerBar = (
    <TimerBar
      formattedTime={timer.formattedTime}
      progress={timer.progress}
      onStop={handleStop}
    />
  )

  const originalContent = (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">{item.title}</h2>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant={priorityVariant[item.priority]}>
          {priorityLabels[item.priority]}
        </Badge>
        {item.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs font-normal">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </div>
    </div>
  )

  const memoArea = (
    <ThinkingMemo value={memo} onChange={setMemo} />
  )

  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePromote}
        disabled={saving}
      >
        승격
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleResolve}
        disabled={saving}
      >
        해결
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDrop}
        disabled={saving}
      >
        폐기
      </Button>
      <Button
        size="sm"
        onClick={handleSaveAndEnd}
        disabled={saving}
      >
        {saving ? '저장 중...' : '저장+종료'}
      </Button>
    </>
  )

  const mode = settings.thinkingMode

  if (mode === 'fullscreen') {
    return (
      <ModeFullscreen
        timerBar={timerBar}
        originalContent={originalContent}
        memo={memoArea}
        actions={actions}
      />
    )
  }

  if (mode === 'overlay') {
    return (
      <ModeOverlay
        timerBar={timerBar}
        originalContent={originalContent}
        memo={memoArea}
        actions={actions}
      />
    )
  }

  return (
    <ModeSplit
      timerBar={timerBar}
      originalContent={originalContent}
      memo={memoArea}
      actions={actions}
    />
  )
}
