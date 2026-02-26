import { useState, useCallback, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain, Pencil, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'
import { priorityVariant, priorityLabels } from '@/lib/priority'
import { formatRelativeTime } from '@/lib/date-utils'
import { buildMarkdownBody } from '@/lib/markdown-render'
import { useBin } from '../../contexts/bin-context'
import type { BinItem, BinItemStatus, Priority } from '../../types/bin-item'

interface DetailPanelProps {
  onPromote?: (item: BinItem) => void
  onResolve?: (item: BinItem) => void
  onDrop?: (item: BinItem) => void
  onStartThinking?: (item: BinItem) => void
  onEdit?: (item: BinItem, patch: Partial<BinItem>) => Promise<void>
  onRestore?: (item: BinItem) => void
  onDeletePermanently?: (item: BinItem) => void
  onEmptyTrash?: () => void
}

const statusLabels: Record<BinItemStatus, string> = {
  open: '열림',
  promoted: '승격됨',
  resolved: '해결됨',
  dropped: '폐기됨',
}

const statusClasses: Record<BinItemStatus, string> = {
  open: 'bg-status-open/15 text-status-open border-status-open/30',
  promoted: 'bg-status-promoted/15 text-status-promoted border-status-promoted/30',
  resolved: 'bg-status-resolved/15 text-status-resolved border-status-resolved/30',
  dropped: 'bg-status-dropped/15 text-status-dropped border-status-dropped/30',
}

function AutoResizeTextarea({ value, onChange, label }: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  )
}

export function DetailPanel({
  onPromote,
  onResolve,
  onDrop,
  onStartThinking,
  onEdit,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
}: DetailPanelProps) {
  const { selectedItem, scope, trashMode } = useBin()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('B')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editProblem, setEditProblem] = useState('')
  const [editStructure, setEditStructure] = useState('')
  const [editIdea, setEditIdea] = useState('')
  const [editImpact, setEditImpact] = useState('')
  const [newTag, setNewTag] = useState('')

  // Reset editing when selected item changes
  const selectedItemId = selectedItem?.id
  useEffect(() => {
    setEditing(false)
  }, [selectedItemId])

  const startEditing = useCallback(() => {
    if (!selectedItem) return
    setEditTitle(selectedItem.title)
    setEditPriority(selectedItem.priority)
    setEditTags([...selectedItem.tags])
    setEditProblem(selectedItem.problem)
    setEditStructure(selectedItem.currentStructure)
    setEditIdea(selectedItem.idea)
    setEditImpact(selectedItem.impact)
    setNewTag('')
    setEditing(true)
  }, [selectedItem])

  const hasChanges = useCallback(() => {
    if (!selectedItem) return false
    return (
      editTitle !== selectedItem.title ||
      editPriority !== selectedItem.priority ||
      JSON.stringify(editTags) !== JSON.stringify(selectedItem.tags) ||
      editProblem !== selectedItem.problem ||
      editStructure !== selectedItem.currentStructure ||
      editIdea !== selectedItem.idea ||
      editImpact !== selectedItem.impact
    )
  }, [selectedItem, editTitle, editPriority, editTags, editProblem, editStructure, editIdea, editImpact])

  const cancelEditing = useCallback(() => {
    if (hasChanges()) {
      const confirmed = window.confirm('변경 사항이 있습니다. 편집을 취소하시겠습니까?')
      if (!confirmed) return
    }
    setEditing(false)
  }, [hasChanges])

  const handleSave = useCallback(async () => {
    if (!selectedItem || !onEdit) return
    setSaving(true)
    try {
      await onEdit(selectedItem, {
        title: editTitle,
        priority: editPriority,
        tags: editTags,
        problem: editProblem,
        currentStructure: editStructure,
        idea: editIdea,
        impact: editImpact,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [selectedItem, onEdit, editTitle, editPriority, editTags, editProblem, editStructure, editIdea, editImpact])

  const addTag = useCallback(() => {
    const tag = newTag.trim()
    if (tag && !editTags.includes(tag)) {
      setEditTags(prev => [...prev, tag])
      setNewTag('')
    }
  }, [newTag, editTags])

  const removeTag = useCallback((tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag))
  }, [])

  if (!selectedItem) {
    return (
      <div className="flex-1 h-full bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">
          {trashMode ? '삭제할 항목을 선택하세요' : '항목을 선택하세요'}
        </p>
        {trashMode && onEmptyTrash && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEmptyTrash}
          >
            비우기
          </Button>
        )}
      </div>
    )
  }

  // ── EDIT MODE ──
  if (editing) {
    return (
      <div className="flex-1 h-full bg-background flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">제목</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">우선순위</label>
              <div className="flex gap-2">
                {(['S', 'A', 'B'] as Priority[]).map(p => (
                  <Button
                    key={p}
                    variant={editPriority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditPriority(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">태그</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="새 태그..."
                  className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button variant="outline" size="sm" onClick={addTag} disabled={!newTag.trim()}>
                  추가
                </Button>
              </div>
            </div>

            <Separator />

            {/* Body sections */}
            <AutoResizeTextarea label="문제 상황" value={editProblem} onChange={setEditProblem} />
            <AutoResizeTextarea label="현재 구조" value={editStructure} onChange={setEditStructure} />
            <AutoResizeTextarea label="개선 아이디어" value={editIdea} onChange={setEditIdea} />
            <AutoResizeTextarea label="영향 범위" value={editImpact} onChange={setEditImpact} />

            {/* Thinking notes (read-only) */}
            {selectedItem.thinkingNotes && (
              <>
                <Separator />
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">생각 노트 (읽기 전용)</label>
                  <div className="prose prose-invert prose-sm max-w-none dark:prose-invert rounded-md bg-secondary/50 p-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedItem.thinkingNotes}</ReactMarkdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Edit action bar */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !editTitle.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    )
  }

  // ── VIEW MODE ──
  const body = buildMarkdownBody(selectedItem)
  const relativeDate = formatRelativeTime(selectedItem.created)

  return (
    <div className="flex-1 h-full bg-background flex flex-col overflow-hidden">
      {/* Meta info card */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">{selectedItem.title}</h2>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant={priorityVariant[selectedItem.priority]}>
            {priorityLabels[selectedItem.priority]}
          </Badge>
          <Badge
            variant="outline"
            className={cn('text-xs', statusClasses[selectedItem.status])}
          >
            {statusLabels[selectedItem.status]}
          </Badge>
        </div>

        {selectedItem.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {selectedItem.tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span>{selectedItem.author}</span>
          <span>{relativeDate}</span>
        </div>
      </div>

      {/* "생각하기" button */}
      {onStartThinking && !trashMode && (
        <>
          <div className="px-6 py-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onStartThinking(selectedItem)}
            >
              <Brain className="h-4 w-4" />
              생각하기
            </Button>
          </div>
          <Separator />
        </>
      )}

      {/* Markdown body */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {body ? (
            <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              내용이 없습니다. 편집 버튼을 눌러 내용을 추가하세요.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="p-4 border-t border-border flex gap-2">
        {trashMode ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore?.(selectedItem)}
            >
              복원
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeletePermanently?.(selectedItem)}
            >
              영구 삭제
            </Button>
            <div className="flex-1" />
            {onEmptyTrash && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onEmptyTrash}
              >
                비우기
              </Button>
            )}
          </>
        ) : (
          <>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={startEditing}
              >
                <Pencil className="h-3.5 w-3.5" />
                편집
              </Button>
            )}
            {scope === 'personal' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPromote?.(selectedItem)}
              >
                ↑ 승격
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve?.(selectedItem)}
            >
              ✓ 해결
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDrop?.(selectedItem)}
            >
              × 폐기
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
