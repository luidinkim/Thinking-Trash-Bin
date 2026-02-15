import { useBin } from '../contexts/bin-context'
import type { BinItem, Priority } from '../types/bin-item'

interface ColumnConfig {
  priority: Priority
  label: string
  borderColor: string
  bgColor: string
  badgeColor: string
}

const columns: ColumnConfig[] = [
  {
    priority: 'S',
    label: 'S — 즉시 수정',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/5',
    badgeColor: 'bg-red-500/20 text-red-400',
  },
  {
    priority: 'A',
    label: 'A — 다음 사이클',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/5',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    priority: 'B',
    label: 'B — 미래 개선',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/5',
    badgeColor: 'bg-blue-500/20 text-blue-400',
  },
]

function KanbanCard({ item, onSelect }: { item: BinItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-gray-800 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-colors"
    >
      <p className="text-sm text-gray-100 line-clamp-2">{item.title}</p>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded"
            >
              {tag}
            </span>
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
        <h3 className="text-sm font-semibold text-gray-200">{config.label}</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badgeColor}`}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">항목 없음</p>
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
