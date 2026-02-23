import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { X } from 'lucide-react'

interface TimerBarProps {
  formattedTime: string
  progress: number
  onStop: () => void
}

function getProgressColor(progress: number): string {
  if (progress > 50) return '[&>div]:bg-green-500'
  if (progress > 20) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}

export function TimerBar({ formattedTime, progress, onStop }: TimerBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card border-b border-border">
      <span className="text-sm font-mono font-medium text-foreground min-w-[4rem]">
        {formattedTime}
      </span>
      <Progress
        value={progress}
        className={cn('flex-1 h-2', getProgressColor(progress))}
      />
      <span className="text-xs text-muted-foreground">{progress}%</span>
      <Button variant="ghost" size="icon" onClick={onStop} className="h-7 w-7">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
