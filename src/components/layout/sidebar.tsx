import { useBin } from '../../contexts/bin-context'
import { useAuth } from '../../contexts/auth-context'
import type { Priority } from '../../types/bin-item'

interface SidebarProps {
  onClose?: () => void
}

const priorityColors: Record<Priority, string> = {
  S: 'bg-red-500',
  A: 'bg-yellow-500',
  B: 'bg-blue-500',
}

export function Sidebar({ onClose }: SidebarProps) {
  const { scope, setScope, items } = useBin()
  const { user, logout } = useAuth()

  const priorityCounts: Record<Priority, number> = { S: 0, A: 0, B: 0 }
  const tagSet = new Set<string>()

  for (const item of items) {
    if (item.priority in priorityCounts) {
      priorityCounts[item.priority]++
    }
    for (const tag of item.tags) {
      tagSet.add(tag)
    }
  }

  const tags = Array.from(tagSet).sort()

  const handleScopeChange = (newScope: 'personal' | 'team') => {
    setScope(newScope)
    onClose?.()
  }

  return (
    <div className="w-56 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">ThinkBin</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-200"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        <button
          onClick={() => handleScopeChange('personal')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            scope === 'personal'
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          내 Bin
        </button>
        <button
          onClick={() => handleScopeChange('team')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            scope === 'team'
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          팀 Bin
        </button>
      </nav>

      {/* Priority counts */}
      <div className="px-4 py-3 border-t border-gray-800">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</h2>
        <div className="space-y-1">
          {(['S', 'A', 'B'] as Priority[]).map(p => (
            <div key={p} className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${priorityColors[p]}`} />
                <span>{p}</span>
              </div>
              <span className="text-gray-500">{priorityCounts[p]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-800 flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h2>
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      {user && (
        <div className="p-4 border-t border-gray-800 flex items-center gap-3">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 truncate">{user.name ?? user.login}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Logout"
            title="로그아웃"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
