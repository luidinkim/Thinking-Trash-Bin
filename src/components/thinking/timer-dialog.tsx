import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/contexts/settings-context'
import type { BinItem } from '@/types/bin-item'

interface TimerDialogProps {
  item: BinItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (item: BinItem, minutes: number) => void
}

const PRESETS = [15, 30, 45, 60]

export function TimerDialog({ item, open, onOpenChange, onStart }: TimerDialogProps) {
  const { settings } = useSettings()
  const [minutes, setMinutes] = useState(settings.defaultTimer)

  // Reset minutes to default when dialog opens
  useEffect(() => {
    if (open) {
      setMinutes(settings.defaultTimer) // eslint-disable-line react-hooks/set-state-in-effect -- intentional: sync local state with prop
    }
  }, [open, settings.defaultTimer])

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>생각하기</DialogTitle>
          <DialogDescription>{item.title}에 대해 생각할 시간을 설정하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">시간 선택 (분)</p>
            <div className="flex gap-2">
              {PRESETS.map(p => (
                <Button
                  key={p}
                  variant={minutes === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinutes(p)}
                >
                  {p}분
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">직접 입력</p>
            <input
              type="number"
              min={1}
              max={60}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-24 bg-secondary text-foreground border border-border rounded-md px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => { onStart(item, minutes); onOpenChange(false) }}>
            시작 ({minutes}분)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
