import type { ReactNode } from 'react'

interface ModeOverlayProps {
  timerBar: ReactNode
  originalContent: ReactNode
  memo: ReactNode
  actions: ReactNode
}

export function ModeOverlay({ timerBar, originalContent, memo, actions }: ModeOverlayProps) {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {timerBar}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg border border-border p-4">
          {originalContent}
        </div>
        <div className="min-h-[200px]">
          {memo}
        </div>
      </div>
      <div className="border-t border-border p-3 flex justify-end gap-2">
        {actions}
      </div>
    </div>
  )
}
