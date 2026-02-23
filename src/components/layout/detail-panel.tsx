import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'
import { priorityVariant, priorityLabels } from '@/lib/priority'
import { formatRelativeTime } from '@/lib/date-utils'
import { buildMarkdownBody } from '@/lib/markdown-render'
import { useBin } from '../../contexts/bin-context'
import type { BinItem, BinItemStatus } from '../../types/bin-item'

interface DetailPanelProps {
  onPromote?: (item: BinItem) => void
  onResolve?: (item: BinItem) => void
  onDrop?: (item: BinItem) => void
  onStartThinking?: (item: BinItem) => void
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

export function DetailPanel({
  onPromote,
  onResolve,
  onDrop,
  onStartThinking,
}: DetailPanelProps) {
  const { selectedItem, scope } = useBin()

  if (!selectedItem) {
    return (
      <div className="flex-1 h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">항목을 선택하세요</p>
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
      {onStartThinking && (
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
          <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="p-4 border-t border-border flex gap-2">
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
      </div>
    </div>
  )
}
