import type { ReactNode } from 'react'

interface ModeSplitProps {
  timerBar: ReactNode
  originalContent: ReactNode
  memo: ReactNode
  actions: ReactNode
}

export function ModeSplit({ timerBar, originalContent, memo, actions }: ModeSplitProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {timerBar}
      <div className="flex-1 overflow-hidden grid grid-cols-2 gap-0">
        <div className="overflow-y-auto border-r border-border p-4">
          {originalContent}
        </div>
        <div className="flex flex-col p-4">
          {memo}
        </div>
      </div>
      <div className="border-t border-border p-3 flex justify-end gap-2">
        {actions}
      </div>
    </div>
  )
}
