import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { useSettings } from '@/contexts/settings-context'
import type { BinItem, Priority } from '@/types/bin-item'

const priorityVariant: Record<Priority, 'priority_s' | 'priority_a' | 'priority_b'> = {
  S: 'priority_s',
  A: 'priority_a',
  B: 'priority_b',
}

/**
 * Get the first non-empty preview text from the item's body sections.
 */
function getPreviewText(item: BinItem): string {
  return item.problem || item.idea || item.currentStructure || ''
}

/**
 * Count thinking sessions by matching `### YYYY-MM-DD` heading patterns
 * in the combined body text. This is a temporary approach until the
 * thinkingNotes field is added in Task 8.
 */
function countThinkingSessions(item: BinItem): number {
  const body = [item.problem, item.currentStructure, item.idea, item.impact]
    .filter(Boolean)
    .join('\n')
  const matches = body.match(/^### \d{4}-\d{2}-\d{2}/gm)
  return matches ? matches.length : 0
}

/**
 * Format a date string as Korean relative time.
 */
function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 30) return `${diffDays}일 전`

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

interface ItemCardProps {
  item: BinItem
  selected: boolean
  onClick: () => void
}

export function ItemCard({ item, selected, onClick }: ItemCardProps) {
  const { settings } = useSettings()
  const isComfortable = settings.listDensity === 'comfortable'
  const preview = getPreviewText(item)
  const thinkingCount = countThinkingSessions(item)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 border-b border-border transition-colors',
        selected
          ? 'bg-accent border-l-2 border-l-primary'
          : 'hover:bg-accent/50',
      )}
    >
      {/* Top row: Priority badge + Title */}
      <div className="flex items-center gap-2">
        <Badge variant={priorityVariant[item.priority]} className="px-1.5 py-0 text-[10px] leading-4 shrink-0">
          {item.priority}
        </Badge>
        <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {item.title}
        </p>
      </div>

      {/* Preview text (comfortable mode only) */}
      {isComfortable && preview && (
        <p className="mt-1 text-xs text-muted-foreground truncate pl-7">
          {preview}
        </p>
      )}

      {/* Bottom row: Tags + thinking count + relative time */}
      <div className="flex items-center gap-1.5 mt-1.5 pl-7">
        {/* Tags (up to 3) */}
        {item.tags.length > 0 && (
          <div className="flex gap-1 min-w-0 overflow-hidden shrink">
            {item.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex px-1.5 py-0 text-[10px] leading-4 rounded bg-secondary text-secondary-foreground truncate"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Thinking count badge */}
        {thinkingCount > 0 && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] leading-4 shrink-0 text-muted-foreground">
            {`\uC0DD\uAC01 ${thinkingCount}\uD68C`}
          </Badge>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Relative time (comfortable mode only) */}
        {isComfortable && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {relativeTime(item.created)}
          </span>
        )}
      </div>
    </button>
  )
}
