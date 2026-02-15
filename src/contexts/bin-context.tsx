import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { BinItem, BinScope } from '../types/bin-item'

interface BinState {
  scope: BinScope
  setScope: (scope: BinScope) => void
  items: BinItem[]
  setItems: (items: BinItem[]) => void
  selectedItem: BinItem | null
  setSelectedItem: (item: BinItem | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  priorityFilter: Set<string>
  togglePriorityFilter: (priority: string) => void
  tagFilter: Set<string>
  toggleTagFilter: (tag: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const BinContext = createContext<BinState | null>(null)

export function BinProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<BinScope>('personal')
  const [items, setItems] = useState<BinItem[]>([])
  const [selectedItem, setSelectedItem] = useState<BinItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const togglePriorityFilter = useCallback((p: string) => {
    setPriorityFilter(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }, [])

  const toggleTagFilter = useCallback((t: string) => {
    setTagFilter(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }, [])

  return (
    <BinContext.Provider
      value={{
        scope, setScope,
        items, setItems,
        selectedItem, setSelectedItem,
        searchQuery, setSearchQuery,
        priorityFilter, togglePriorityFilter,
        tagFilter, toggleTagFilter,
        loading, setLoading,
      }}
    >
      {children}
    </BinContext.Provider>
  )
}

export function useBin(): BinState {
  const ctx = useContext(BinContext)
  if (!ctx) throw new Error('useBin must be used within BinProvider')
  return ctx
}
