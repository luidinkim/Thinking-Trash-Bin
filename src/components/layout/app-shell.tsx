import { useState } from 'react'
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels'
import { Menu, Plus, List, Columns3 } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { Sidebar } from './sidebar'
import { ListPanel } from './list-panel'
import { DetailPanel } from './detail-panel'
import { QuickCapture } from '../quick-capture'
import { KanbanView } from '../kanban-view'
import { ThinkingSession } from '../thinking/thinking-session'
import { TimerDialog } from '../thinking/timer-dialog'
import { useBinItems } from '../../hooks/use-bin-items'
import { useThinking } from '../../contexts/thinking-context'
import { useToast } from '../../contexts/toast-context'
import type { BinItem } from '../../types/bin-item'
import type { QuickCaptureData } from '../quick-capture'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [timerDialogOpen, setTimerDialogOpen] = useState(false)
  const [thinkingItem, setThinkingItem] = useState<BinItem | null>(null)
  const { items, createItem, promoteItem, updateItemStatus, updateItemContent } = useBinItems()
  const { startSession } = useThinking()
  const { addToast } = useToast()

  const availableTags = [...new Set(items.flatMap(i => i.tags))]

  const handleSave = async (data: QuickCaptureData) => {
    try {
      await createItem(data)
      addToast('항목이 생성되었습니다', 'success')
    } catch {
      addToast('오류가 발생했습니다', 'error')
    }
  }

  const handlePromote = async (item: Parameters<typeof promoteItem>[0]) => {
    try {
      await promoteItem(item)
      addToast('팀 Bin으로 승격되었습니다', 'success')
    } catch {
      addToast('오류가 발생했습니다', 'error')
    }
  }

  const handleResolve = async (item: Parameters<typeof updateItemStatus>[0]) => {
    try {
      await updateItemStatus(item, 'resolved')
      addToast('해결됨으로 변경되었습니다', 'success')
    } catch {
      addToast('오류가 발생했습니다', 'error')
    }
  }

  const handleDrop = async (item: Parameters<typeof updateItemStatus>[0]) => {
    try {
      await updateItemStatus(item, 'dropped')
      addToast('폐기되었습니다', 'info')
    } catch {
      addToast('오류가 발생했습니다', 'error')
    }
  }

  const handleStartThinking = (item: BinItem) => {
    setThinkingItem(item)
    setTimerDialogOpen(true)
  }

  const handleThinkingStart = (item: BinItem, minutes: number) => {
    startSession(item, minutes)
  }

  const handleSaveThinkingMemo = async (item: BinItem, memo: string, elapsedMinutes: number) => {
    if (!memo.trim()) return
    try {
      const now = new Date()
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const newNote = `### ${timestamp} (${elapsedMinutes}분)\n${memo}`

      const updatedNotes = item.thinkingNotes
        ? `${newNote}\n\n${item.thinkingNotes}`
        : newNote

      await updateItemContent(item, { thinkingNotes: updatedNotes })
      addToast('생각 메모가 저장되었습니다', 'success')
    } catch {
      addToast('메모 저장에 실패했습니다', 'error')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold text-foreground">ThinkBin</span>
        <div className="flex-1" />
        {/* Mobile view toggle + capture */}
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('kanban')}
            aria-label="Kanban view"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-56">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal" className="h-full">
          {/* Sidebar panel */}
          <Panel defaultSize={15} minSize={10} maxSize={25}>
            <Sidebar />
          </Panel>

          <PanelResizeHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />

          {/* Main content panel */}
          <Panel defaultSize={85} minSize={50}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* View toggle toolbar */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-1.5',
                    viewMode !== 'list' && 'text-muted-foreground',
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-1.5',
                    viewMode !== 'kanban' && 'text-muted-foreground',
                  )}
                  onClick={() => setViewMode('kanban')}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  Kanban
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCaptureOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Capture
                </Button>
              </div>

              {/* View content */}
              {viewMode === 'list' ? (
                <PanelGroup orientation="horizontal" className="flex-1 min-h-0">
                  <Panel defaultSize={35} minSize={20}>
                    <ListPanel />
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />
                  <Panel defaultSize={65}>
                    <DetailPanel
                      onPromote={(item) => handlePromote(item)}
                      onResolve={(item) => handleResolve(item)}
                      onDrop={(item) => handleDrop(item)}
                      onStartThinking={(item) => handleStartThinking(item)}
                    />
                  </Panel>
                </PanelGroup>
              ) : (
                <KanbanView />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden min-h-0">
        {viewMode === 'list' ? (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ListPanel />
            <DetailPanel
              onPromote={(item) => handlePromote(item)}
              onResolve={(item) => handleResolve(item)}
              onDrop={(item) => handleDrop(item)}
              onStartThinking={(item) => handleStartThinking(item)}
            />
          </div>
        ) : (
          <KanbanView />
        )}
      </div>

      {/* Floating Action Button (mobile) */}
      <Button
        size="icon"
        className="lg:hidden fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setCaptureOpen(true)}
        aria-label="Quick Capture"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Capture modal */}
      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSave={handleSave}
        availableTags={availableTags}
      />

      {/* Thinking session (renders as fixed overlay for fullscreen/split, inline for overlay) */}
      <ThinkingSession
        onSave={handleSaveThinkingMemo}
        onPromote={handlePromote}
        onResolve={handleResolve}
        onDrop={handleDrop}
      />

      {/* Timer dialog for selecting thinking duration */}
      <TimerDialog
        item={thinkingItem}
        open={timerDialogOpen}
        onOpenChange={setTimerDialogOpen}
        onStart={handleThinkingStart}
      />
    </div>
  )
}
