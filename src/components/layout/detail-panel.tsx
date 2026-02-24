import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'
import { useBin } from '../../contexts/bin-context'
import type { BinItem, BinItemStatus, Priority } from '../../types/bin-item'

interface DetailPanelProps {
  onPromote?: (item: BinItem) => void
  onResolve?: (item: BinItem) => void
  onDrop?: (item: BinItem) => void
  onStartThinking?: (item: BinItem) => void
  onRestore?: (item: BinItem) => void
  onDeletePermanently?: (item: BinItem) => void
  onEmptyTrash?: () => void
}

const priorityLabels: Record<Priority, string> = {
  S: 'S -- 즉시 수정',
  A: 'A -- 다음 사이클',
  B: 'B -- 미래 개선',
}

const priorityVariant: Record<Priority, 'priority_s' | 'priority_a' | 'priority_b'> = {
  S: 'priority_s',
  A: 'priority_a',
  B: 'priority_b',
}

const statusLabels: Record<BinItemStatus, string> = {
  open: '열림',
  promoted: '승격됨',
  resolved: '해결됨',
  dropped: '폐기됨',
}

const statusClasses: Record<BinItemStatus, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  promoted: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  resolved: 'bg-green-500/15 text-green-400 border-green-500/30',
  dropped: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  if (diffDays > 0) return `${diffDays}일 전`
  if (diffHours > 0) return `${diffHours}시간 전`
  if (diffMinutes > 0) return `${diffMinutes}분 전`
  return '방금 전'
}

function buildMarkdownBody(item: BinItem): string {
  const sections: string[] = []

  if (item.problem) {
    sections.push(`## 문제 상황\n\n${item.problem}`)
  }
  if (item.currentStructure) {
    sections.push(`## 현재 구조\n\n${item.currentStructure}`)
  }
  if (item.idea) {
    sections.push(`## 개선 아이디어\n\n${item.idea}`)
  }
  if (item.impact) {
    sections.push(`## 영향 범위\n\n${item.impact}`)
  }

  return sections.join('\n\n')
}

export function DetailPanel({
  onPromote,
  onResolve,
  onDrop,
  onStartThinking,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
}: DetailPanelProps) {
  const { selectedItem, scope, trashMode } = useBin()

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
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
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
