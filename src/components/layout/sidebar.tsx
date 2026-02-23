import { useState } from 'react'
import { Brain, FolderOpen, Users, Settings, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SettingsSheet } from '@/components/settings/settings-sheet'
import { cn } from '@/lib/cn'
import { priorityVariant } from '@/lib/priority'
import { useBin } from '@/contexts/bin-context'
import { useAuth } from '@/contexts/auth-context'
import type { Priority } from '@/types/bin-item'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { scope, setScope, items } = useBin()
  const { user, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
    <div className="w-56 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">ThinkBin</h1>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scope toggle */}
      <nav className="p-3 space-y-1">
        <Button
          variant={scope === 'personal' ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'w-full justify-start gap-2',
            scope !== 'personal' && 'text-muted-foreground',
          )}
          onClick={() => handleScopeChange('personal')}
        >
          <FolderOpen className="h-4 w-4" />
          My Bin
        </Button>
        <Button
          variant={scope === 'team' ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'w-full justify-start gap-2',
            scope !== 'team' && 'text-muted-foreground',
          )}
          onClick={() => handleScopeChange('team')}
        >
          <Users className="h-4 w-4" />
          Team Bin
        </Button>
      </nav>

      <Separator />

      {/* Priority counts */}
      <div className="px-4 py-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Priority
        </h2>
        <div className="space-y-1.5">
          {(['S', 'A', 'B'] as Priority[]).map(p => (
            <div key={p} className="flex items-center justify-between text-sm">
              <Badge variant={priorityVariant[p]} className="text-xs">
                {p}
              </Badge>
              <span className="text-muted-foreground tabular-nums">
                {priorityCounts[p]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      <Separator />

      {/* Settings button */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* User profile */}
      {user && (
        <div className="p-4 border-t border-border flex items-center gap-3">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {user.name ?? user.login}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={logout}
            aria-label="Logout"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Settings Sheet */}
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
