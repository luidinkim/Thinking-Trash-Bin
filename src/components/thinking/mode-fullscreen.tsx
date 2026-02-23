import type { ReactNode } from 'react'

interface ModeFullscreenProps {
  timerBar: ReactNode
  originalContent: ReactNode
  memo: ReactNode
  actions: ReactNode
}

export function ModeFullscreen({ timerBar, originalContent, memo, actions }: ModeFullscreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {timerBar}
      <div className="flex-1 overflow-hidden grid grid-rows-2 gap-4 p-4">
        <div className="overflow-y-auto rounded-lg border border-border p-4">
          {originalContent}
        </div>
        <div className="flex flex-col">
          {memo}
        </div>
      </div>
      <div className="border-t border-border p-3 flex justify-end gap-2">
        {actions}
      </div>
    </div>
  )
}
