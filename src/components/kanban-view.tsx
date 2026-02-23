import { useBin } from '../contexts/bin-context'
import type { BinItem, Priority } from '../types/bin-item'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ColumnConfig {
  priority: Priority
  label: string
  borderColor: string
  bgColor: string
  badgeVariant: 'priority_s' | 'priority_a' | 'priority_b'
}

const columns: ColumnConfig[] = [
  {
    priority: 'S',
    label: 'S — 즉시 수정',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/5',
    badgeVariant: 'priority_s',
  },
  {
    priority: 'A',
    label: 'A — 다음 사이클',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/5',
    badgeVariant: 'priority_a',
  },
  {
    priority: 'B',
    label: 'B — 미래 개선',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/5',
    badgeVariant: 'priority_b',
  },
]

function KanbanCard({ item, onSelect }: { item: BinItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-secondary rounded-lg border border-border p-3 hover:border-accent transition-colors"
    >
      <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}

function KanbanColumn({ config, items, onSelectItem }: {
  config: ColumnConfig
  items: BinItem[]
  onSelectItem: (item: BinItem) => void
}) {
  return (
    <div
      className={`w-72 flex-shrink-0 rounded-lg border-t-2 ${config.borderColor} ${config.bgColor} flex flex-col max-h-full`}
    >
      {/* Column header */}
      <div className="px-3 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        <Badge variant={config.badgeVariant}>
          {items.length}
        </Badge>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">항목 없음</p>
          ) : (
            items.map(item => (
              <KanbanCard
                key={item.id}
                item={item}
                onSelect={() => onSelectItem(item)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function KanbanView() {
  const { items, setSelectedItem, searchQuery, priorityFilter } = useBin()

  const filtered = items.filter(item => {
    if (priorityFilter.size > 0 && !priorityFilter.has(item.priority)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const groupedByPriority = (priority: Priority) =>
    filtered.filter(item => item.priority === priority)

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 h-full min-w-max">
        {columns.map(col => (
          <KanbanColumn
            key={col.priority}
            config={col}
            items={groupedByPriority(col.priority)}
            onSelectItem={setSelectedItem}
          />
        ))}
      </div>
    </div>
  )
}
