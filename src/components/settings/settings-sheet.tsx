import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/contexts/settings-context'
import type { ThinkingMode, ListDensity } from '@/types/settings'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const THINKING_MODES: { value: ThinkingMode; label: string }[] = [
  { value: 'fullscreen', label: 'Fullscreen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'split', label: 'Split' },
]

const TIMER_PRESETS = [15, 30, 45, 60] as const

const LIST_DENSITIES: { value: ListDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
]

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { settings, setThinkingMode, setDefaultTimer, setListDensity } = useSettings()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Customize your ThinkBin experience.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Thinking Mode */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Thinking Mode</h4>
            <p className="text-xs text-muted-foreground">
              Choose how thinking sessions are displayed.
            </p>
            <div className="flex gap-2">
              {THINKING_MODES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={settings.thinkingMode === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setThinkingMode(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Default Timer */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Default Timer</h4>
            <p className="text-xs text-muted-foreground">
              Set the default duration for thinking sessions.
            </p>
            <div className="flex gap-2">
              {TIMER_PRESETS.map((minutes) => (
                <Button
                  key={minutes}
                  variant={settings.defaultTimer === minutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultTimer(minutes)}
                >
                  {minutes}min
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* List Density */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">List Density</h4>
            <p className="text-xs text-muted-foreground">
              Adjust the spacing of items in lists.
            </p>
            <div className="flex gap-2">
              {LIST_DENSITIES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={settings.listDensity === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListDensity(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
