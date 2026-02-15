import { useState } from 'react'
import { Sidebar } from './sidebar'
import { ListPanel } from './list-panel'
import { DetailPanel } from './detail-panel'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <ListPanel />
        <DetailPanel />
      </div>
    </div>
  )
}
