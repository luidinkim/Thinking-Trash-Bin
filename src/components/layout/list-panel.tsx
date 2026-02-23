import { useBin } from '@/contexts/bin-context'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ItemCard } from '@/components/item-card'
import { cn } from '@/lib/cn'
import { priorityVariant } from '@/lib/priority'
import type { Priority } from '@/types/bin-item'

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
    <div className="w-full lg:w-80 h-full bg-background border-r border-border flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Priority filter chips */}
      <div className="px-3 py-2 border-b border-border flex gap-2">
        {(['S', 'A', 'B'] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => togglePriorityFilter(p)}
          >
            <Badge
              variant={priorityFilter.has(p) ? priorityVariant[p] : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                !priorityFilter.has(p) && 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p}
            </Badge>
          </button>
        ))}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">항목이 없습니다</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
