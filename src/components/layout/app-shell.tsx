import { useState } from 'react'
import { Sidebar } from './sidebar'
import { ListPanel } from './list-panel'
import { DetailPanel } from './detail-panel'
import { QuickCapture } from '../quick-capture'
import { KanbanView } from '../kanban-view'
import { useBinItems } from '../../hooks/use-bin-items'
import type { QuickCaptureData } from '../quick-capture'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const { items, createItem, promoteItem, updateItemStatus } = useBinItems()

  const availableTags = [...new Set(items.flatMap(i => i.tags))]

  const handleSave = async (data: QuickCaptureData) => {
    await createItem(data)
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-950 text-gray-100">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-400 hover:text-gray-200"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold">ThinkBin</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: always visible; mobile: slide from left */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* View toggle toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'kanban'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Kanban
          </button>
        </div>

        {/* View content */}
        {viewMode === 'list' ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            <ListPanel />
            <DetailPanel
              onPromote={(item) => promoteItem(item)}
              onResolve={(item) => updateItemStatus(item, 'resolved')}
              onDrop={(item) => updateItemStatus(item, 'dropped')}
            />
          </div>
        ) : (
          <KanbanView />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-bold shadow-lg flex items-center justify-center transition-colors"
        aria-label="Quick Capture"
      >
        +
      </button>

      {/* Quick Capture modal */}
      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSave={handleSave}
        availableTags={availableTags}
      />
    </div>
  )
}
