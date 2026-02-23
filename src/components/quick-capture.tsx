import { useState, useEffect, useRef } from 'react'
import type { Priority } from '../types/bin-item'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export interface QuickCaptureData {
  title: string
  priority: Priority
  tags: string[]
  problem: string
  currentStructure: string
  idea: string
  impact: string
}

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onSave: (data: QuickCaptureData) => void
  availableTags: string[]
}

const PRIORITY_STYLES: Record<Priority, { active: string; label: string; badge: 'priority_s' | 'priority_a' | 'priority_b' }> = {
  S: {
    active: 'border-red-500 bg-red-500/20 text-red-400',
    label: 'S',
    badge: 'priority_s',
  },
  A: {
    active: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
    label: 'A',
    badge: 'priority_a',
  },
  B: {
    active: 'border-blue-500 bg-blue-500/20 text-blue-400',
    label: 'B',
    badge: 'priority_b',
  },
}

export function QuickCapture({ open, onClose, onSave, availableTags }: QuickCaptureProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('B')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [problem, setProblem] = useState('')
  const [currentStructure, setCurrentStructure] = useState('')
  const [idea, setIdea] = useState('')
  const [impact, setImpact] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && titleRef.current) {
      titleRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const resetFields = () => {
    setTitle('')
    setPriority('B')
    setSelectedTags([])
    setExpanded(false)
    setProblem('')
    setCurrentStructure('')
    setIdea('')
    setImpact('')
  }

  const handleSave = () => {
    onSave({
      title,
      priority,
      tags: selectedTags,
      problem,
      currentStructure,
      idea,
      impact,
    })
    resetFields()
    onClose()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
        data-testid="quick-capture-backdrop"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
        role="dialog"
        aria-label="Quick Capture"
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Quick Capture</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Title input */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요..."
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />

          {/* Priority selector */}
          <div className="flex gap-2">
            {(Object.keys(PRIORITY_STYLES) as Priority[]).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                onClick={() => setPriority(p)}
                className={cn(
                  'transition-colors',
                  priority === p
                    ? PRIORITY_STYLES[p].active
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {PRIORITY_STYLES[p].label}
              </Button>
            ))}
          </div>

          {/* Tag selector */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedTags.includes(tag)
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Expand button */}
          <Button
            variant="link"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="px-0 text-primary"
          >
            {expanded ? '상세 필드 접기' : '상세 필드 펼치기'}
          </Button>

          {/* Expanded detail fields */}
          {expanded && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">문제 상황</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">현재 구조</label>
                <textarea
                  value={currentStructure}
                  onChange={(e) => setCurrentStructure(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">개선 아이디어</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">영향 범위</label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={title.trim() === ''}
            className="w-full"
            size="lg"
          >
            저장하고 계속 작업
          </Button>
        </div>
      </div>
    </>
  )
}
