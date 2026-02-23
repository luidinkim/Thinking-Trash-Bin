import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThinking } from '@/contexts/thinking-context'
import { useSettings } from '@/contexts/settings-context'
import { useTimer } from '@/hooks/use-timer'
import { priorityVariant, priorityLabels } from '@/lib/priority'
import { buildMarkdownBody } from '@/lib/markdown-render'
import { TimerBar } from './timer-bar'
import { ThinkingMemo } from './thinking-memo'
import { ModeFullscreen } from './mode-fullscreen'
import { ModeOverlay } from './mode-overlay'
import { ModeSplit } from './mode-split'
import type { BinItem } from '@/types/bin-item'

interface ThinkingSessionProps {
  onSave: (item: BinItem, memo: string, elapsedMinutes: number) => Promise<void>
  onPromote: (item: BinItem) => Promise<void>
  onResolve: (item: BinItem) => Promise<void>
  onDrop: (item: BinItem) => Promise<void>
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
    if (memoRef.current.trim()) {
      const confirmed = window.confirm('작성 중인 메모가 있습니다. 저장하지 않고 종료하시겠습니까?')
      if (!confirmed) return
    }
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
      <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
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
