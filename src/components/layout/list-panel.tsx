import { useBin } from '../../contexts/bin-context'
import type { BinItem, Priority } from '../../types/bin-item'

const priorityColors: Record<Priority, string> = {
  S: 'text-red-500',
  A: 'text-yellow-500',
  B: 'text-blue-500',
}

const priorityBgColors: Record<Priority, string> = {
  S: 'bg-red-500/10 border-red-500/30',
  A: 'bg-yellow-500/10 border-yellow-500/30',
  B: 'bg-blue-500/10 border-blue-500/30',
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function ItemCard({ item, isSelected, onSelect }: { item: BinItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 border-b border-gray-800 transition-colors ${
        isSelected
          ? 'bg-gray-800'
          : 'hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`font-bold text-sm ${priorityColors[item.priority]}`}>
          {item.priority}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-100 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {item.tags.length > 0 && (
              <div className="flex gap-1 flex-1 min-w-0 overflow-hidden">
                {item.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-500 rounded truncate"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {relativeTime(item.created)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function ListPanel() {
  const {
    items,
    selectedItem,
    setSelectedItem,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    togglePriorityFilter,
  } = useBin()

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

  return (
    <div className="w-full lg:w-80 h-full bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
          />
        </div>
      </div>

      {/* Priority filter chips */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-2">
        {(['S', 'A', 'B'] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => togglePriorityFilter(p)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              priorityFilter.has(p)
                ? `${priorityBgColors[p]} ${priorityColors[p]}`
                : 'border-gray-700 text-gray-500 hover:border-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">항목이 없습니다</p>
          </div>
        ) : (
          filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={() => setSelectedItem(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}
