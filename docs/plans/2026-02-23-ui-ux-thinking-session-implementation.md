# ThinkBin UI/UX 리빌드 + 생각하기 세션 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** shadcn/ui 기반으로 UI를 리빌드하고, 타이머가 있는 "생각하기" 세션 기능을 추가한다.

**Architecture:** 기존 React + Vite + Tailwind 스택 위에 shadcn/ui 컴포넌트를 도입한다. 설정 시스템(SettingsContext)으로 사용자 환경설정을 관리하고, 생각하기 세션(ThinkingContext)으로 타이머 + 메모 + 상태변경을 지원한다. 3가지 세션 UI 모드(풀스크린/오버레이/스플릿)는 설정에서 전환 가능하다.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui (Radix UI), Vitest

---

## Task 1: shadcn/ui 기초 설정

> shadcn/ui가 동작하기 위한 기반 설정을 추가한다. Tailwind CSS v4 + Vite 환경에 맞게 구성한다.

**Files:**
- Create: `src/lib/cn.ts`
- Modify: `package.json` (의존성 추가)
- Modify: `tsconfig.app.json` (path alias 추가)
- Modify: `vite.config.ts` (path alias 추가)
- Modify: `src/index.css` (CSS 변수 추가)

**Step 1: 의존성 설치**

Run:
```bash
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-scroll-area lucide-react
npm install react-resizable-panels
```

**Step 2: path alias 설정**

`tsconfig.app.json`에 `baseUrl`과 `paths` 추가:

```json
{
  "compilerOptions": {
    ...기존 설정 유지,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`vite.config.ts`에 resolve alias 추가:

```typescript
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 3: cn 유틸리티 함수 생성**

Create `src/lib/cn.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 4: CSS 변수 추가**

`src/index.css`에 shadcn/ui용 CSS 변수를 추가한다. Tailwind CSS v4에서는 `@theme` 디렉티브를 사용한다:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-border: oklch(0.274 0.006 286.033);
  --color-input: oklch(0.274 0.006 286.033);
  --color-ring: oklch(0.551 0.027 264.364);
  --color-background: oklch(0.141 0.005 285.823);
  --color-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.985 0 0);
  --color-primary-foreground: oklch(0.205 0.006 285.885);
  --color-secondary: oklch(0.274 0.006 286.033);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.554 0.191 29.234);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.274 0.006 286.033);
  --color-muted-foreground: oklch(0.708 0.014 285.823);
  --color-accent: oklch(0.274 0.006 286.033);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-card: oklch(0.141 0.005 285.823);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.141 0.005 285.823);
  --color-popover-foreground: oklch(0.985 0 0);
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

기존 animation과 scrollbar 스타일은 유지한다.

**Step 5: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

**Step 6: 커밋**

```bash
git add -A
git commit -m "chore: add shadcn/ui foundation (dependencies, path alias, CSS vars, cn utility)"
```

---

## Task 2: shadcn/ui 기본 컴포넌트 생성

> 앱 전반에서 사용할 shadcn/ui 컴포넌트 파일을 생성한다. 각 컴포넌트는 `src/components/ui/`에 배치한다.

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/scroll-area.tsx`

**Step 1: Button 컴포넌트 생성**

Create `src/components/ui/button.tsx`:

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Step 2: Badge 컴포넌트 생성**

Create `src/components/ui/badge.tsx`:

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        priority_s: 'border-transparent bg-red-900/50 text-red-300',
        priority_a: 'border-transparent bg-yellow-900/50 text-yellow-300',
        priority_b: 'border-transparent bg-blue-900/50 text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

**Step 3: Dialog 컴포넌트 생성**

Create `src/components/ui/dialog.tsx`:

```typescript
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}
```

**Step 4: Sheet 컴포넌트 생성**

Create `src/components/ui/sheet.tsx`:

```typescript
import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
  SheetContent, SheetHeader, SheetTitle, SheetDescription,
}
```

**Step 5: Progress 컴포넌트 생성**

Create `src/components/ui/progress.tsx`:

```typescript
import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/cn'

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

**Step 6: Separator 컴포넌트 생성**

Create `src/components/ui/separator.tsx`:

```typescript
import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/cn'

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
    {...props}
  />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

**Step 7: Tooltip, ScrollArea 컴포넌트 생성**

Create `src/components/ui/tooltip.tsx`:

```typescript
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/cn'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

Create `src/components/ui/scroll-area.tsx`:

```typescript
import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/cn'

const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

**Step 8: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

**Step 9: 커밋**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn/ui base components (button, badge, dialog, sheet, progress, separator, tooltip, scroll-area)"
```

---

## Task 3: 설정 시스템 구현

> Settings Context를 만들고 localStorage에 영속 저장한다. TDD로 진행한다.

**Files:**
- Create: `src/types/settings.ts`
- Create: `src/contexts/settings-context.tsx`
- Create: `src/components/settings/settings-sheet.tsx`
- Test: `src/lib/__tests__/settings.test.ts`

**Step 1: 설정 타입 정의**

Create `src/types/settings.ts`:

```typescript
export type ThinkingMode = 'fullscreen' | 'overlay' | 'split'
export type ThemeMode = 'dark' | 'light' | 'system'
export type ListDensity = 'compact' | 'comfortable'

export interface Settings {
  thinkingMode: ThinkingMode
  defaultTimer: number  // 분 단위, 1-60, 기본 30
  theme: ThemeMode
  listDensity: ListDensity
}

export const DEFAULT_SETTINGS: Settings = {
  thinkingMode: 'fullscreen',
  defaultTimer: 30,
  theme: 'dark',
  listDensity: 'comfortable',
}
```

**Step 2: 설정 직렬화/역직렬화 테스트 작성**

Create `src/lib/__tests__/settings.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS } from '../../types/settings'
import type { Settings } from '../../types/settings'

const STORAGE_KEY = 'thinkbin-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

describe('settings persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when no stored settings', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves and loads settings', () => {
    const custom: Settings = {
      ...DEFAULT_SETTINGS,
      thinkingMode: 'split',
      defaultTimer: 45,
    }
    saveSettings(custom)
    expect(loadSettings()).toEqual(custom)
  })

  it('merges partial stored settings with defaults', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ thinkingMode: 'overlay' }))
    const loaded = loadSettings()
    expect(loaded.thinkingMode).toBe('overlay')
    expect(loaded.defaultTimer).toBe(30) // default
  })

  it('returns defaults on corrupted data', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
```

**Step 3: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/lib/__tests__/settings.test.ts`
Expected: 4 tests pass

**Step 4: SettingsContext 생성**

Create `src/contexts/settings-context.tsx`:

```typescript
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type Settings, type ThinkingMode, type ThemeMode, type ListDensity } from '@/types/settings'

const STORAGE_KEY = 'thinkbin-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsContextType {
  settings: Settings
  setThinkingMode: (mode: ThinkingMode) => void
  setDefaultTimer: (minutes: number) => void
  setTheme: (theme: ThemeMode) => void
  setListDensity: (density: ListDensity) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const setThinkingMode = useCallback((thinkingMode: ThinkingMode) => update({ thinkingMode }), [update])
  const setDefaultTimer = useCallback((defaultTimer: number) => {
    update({ defaultTimer: Math.max(1, Math.min(60, defaultTimer)) })
  }, [update])
  const setTheme = useCallback((theme: ThemeMode) => update({ theme }), [update])
  const setListDensity = useCallback((listDensity: ListDensity) => update({ listDensity }), [update])

  return (
    <SettingsContext.Provider value={{ settings, setThinkingMode, setDefaultTimer, setTheme, setListDensity }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
```

**Step 5: 설정 Sheet UI 생성**

Create `src/components/settings/settings-sheet.tsx`:

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/contexts/settings-context'
import type { ThinkingMode, ListDensity } from '@/types/settings'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { settings, setThinkingMode, setDefaultTimer, setListDensity } = useSettings()

  const thinkingModes: { value: ThinkingMode; label: string; desc: string }[] = [
    { value: 'fullscreen', label: '풀스크린', desc: '전체 화면으로 집중' },
    { value: 'overlay', label: '오버레이', desc: '디테일 패널 위에 표시' },
    { value: 'split', label: '스플릿', desc: '좌우 분할 화면' },
  ]

  const densities: { value: ListDensity; label: string }[] = [
    { value: 'compact', label: '컴팩트' },
    { value: 'comfortable', label: '여유' },
  ]

  const timerPresets = [15, 30, 45, 60]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>설정</SheetTitle>
          <SheetDescription>ThinkBin 환경설정</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 생각하기 모드 */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">생각하기 모드</h3>
            <div className="space-y-2">
              {thinkingModes.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setThinkingMode(mode.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    settings.thinkingMode === mode.value
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground'
                  }`}
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-muted-foreground">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 기본 타이머 */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">기본 타이머 (분)</h3>
            <div className="flex gap-2">
              {timerPresets.map(min => (
                <Button
                  key={min}
                  variant={settings.defaultTimer === min ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultTimer(min)}
                >
                  {min}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 리스트 밀도 */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">리스트 밀도</h3>
            <div className="flex gap-2">
              {densities.map(d => (
                <Button
                  key={d.value}
                  variant={settings.listDensity === d.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListDensity(d.value)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Step 6: App.tsx에 SettingsProvider 추가**

`src/App.tsx`의 provider 체인에 SettingsProvider를 추가한다:

```typescript
import { SettingsProvider } from './contexts/settings-context'

function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
      <ToastContainer />
    </ToastProvider>
  )
}
```

**Step 7: 빌드 + 테스트 확인**

Run: `npm run build && npx vitest run`
Expected: 빌드 성공, 모든 테스트 통과

**Step 8: 커밋**

```bash
git add src/types/settings.ts src/contexts/settings-context.tsx src/components/settings/ src/lib/__tests__/settings.test.ts src/App.tsx
git commit -m "feat: add settings system with localStorage persistence and settings sheet UI"
```

---

## Task 4: 리스트 패널 리빌드

> 리스트 패널을 shadcn 컴포넌트로 리빌드한다. 미리보기, 태그 칩, 생각횟수 배지를 추가한다.

**Files:**
- Create: `src/components/item-card.tsx`
- Modify: `src/components/layout/list-panel.tsx`

**Step 1: ItemCard 컴포넌트 생성**

Create `src/components/item-card.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { BinItem } from '@/types/bin-item'
import { useSettings } from '@/contexts/settings-context'

interface ItemCardProps {
  item: BinItem
  selected: boolean
  onClick: () => void
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'S': return 'priority_s' as const
    case 'A': return 'priority_a' as const
    default: return 'priority_b' as const
  }
}

function getPreviewText(item: BinItem): string {
  return item.problem || item.idea || item.currentStructure || ''
}

function countThinkingSessions(item: BinItem): number {
  const body = [item.problem, item.currentStructure, item.idea, item.impact].join('\n')
  const matches = body.match(/### \d{4}-\d{2}-\d{2}/g)
  return matches?.length ?? 0
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function ItemCard({ item, selected, onClick }: ItemCardProps) {
  const { settings } = useSettings()
  const isCompact = settings.listDensity === 'compact'
  const preview = getPreviewText(item)
  const thinkCount = countThinkingSessions(item)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border transition-colors',
        isCompact ? 'p-2' : 'p-3',
        selected
          ? 'border-ring bg-accent/50'
          : 'border-transparent hover:bg-accent/30'
      )}
    >
      <div className="flex items-start gap-2">
        <Badge variant={getPriorityVariant(item.priority)} className="mt-0.5 shrink-0">
          {item.priority}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-foreground truncate">{item.title}</div>
          {!isCompact && preview && (
            <div className="text-xs text-muted-foreground truncate mt-1">{preview}</div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
            {!isCompact && (
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {formatRelativeTime(item.created)}
                {thinkCount > 0 && ` · 생각 ${thinkCount}회`}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
```

**Step 2: list-panel.tsx 리빌드**

기존 `src/components/layout/list-panel.tsx`를 수정한다. 검색 입력과 우선순위 필터 칩은 유지하되, shadcn 컴포넌트와 ItemCard를 사용한다:

- 기존 인라인 아이템 렌더링을 `<ItemCard>` 컴포넌트로 교체
- ScrollArea로 스크롤 영역 래핑
- 검색/필터 UI를 Button + Badge로 교체

참고: 기존 파일의 props 인터페이스(`ListPanelProps`)를 유지하고, 내부 렌더링만 교체한다. 기존 `ListPanelProps`에 `items`, `selectedItem`, `onSelectItem`, `search`, `onSearchChange`, `priorityFilter`, `onTogglePriority` 등이 있다.

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add src/components/item-card.tsx src/components/layout/list-panel.tsx
git commit -m "feat: rebuild list panel with ItemCard component, previews, tags, and thinking count"
```

---

## Task 5: 디테일 패널 리빌드

> 디테일 패널을 shadcn 컴포넌트로 리빌드한다. 메타정보 카드, prose 스타일, 생각하기 버튼을 추가한다.

**Files:**
- Modify: `src/components/layout/detail-panel.tsx`

**Step 1: detail-panel.tsx 리빌드**

기존 `src/components/layout/detail-panel.tsx`를 수정한다:

- 상단에 메타정보 카드 (Badge로 우선순위, 태그, 생성일, 상태)
- `<ReactMarkdown>` 영역에 `prose prose-invert` 클래스 적용
- "생각하기" 버튼 추가 (Brain 아이콘, lucide-react)
- 하단 액션 버튼을 `<Button>` 컴포넌트로 교체
- ScrollArea로 래핑

기존 props 인터페이스(item, onPromote, onResolve, onDrop)는 유지하고, `onStartThinking` 콜백을 추가한다.

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: 커밋**

```bash
git add src/components/layout/detail-panel.tsx
git commit -m "feat: rebuild detail panel with meta card, prose styling, and thinking button"
```

---

## Task 6: 사이드바 + AppShell 리빌드

> 사이드바에 설정 버튼 추가, AppShell을 ResizablePanel로 리빌드한다.

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/app-shell.tsx`

**Step 1: sidebar.tsx 리빌드**

- shadcn Button, Badge, Separator 사용
- 하단에 설정(기어) 아이콘 버튼 추가 → SettingsSheet 오픈
- 기존 기능(scope 전환, 우선순위 카운트, 태그, 유저 프로필) 유지
- lucide-react 아이콘 사용 (Settings, LogOut, User, FolderOpen, Users)

**Step 2: app-shell.tsx 리빌드**

- `react-resizable-panels`의 `PanelGroup`, `Panel`, `PanelResizeHandle` 사용
- 3패널 구조: sidebar(기본 200px) | list(기본 320px) | detail(나머지)
- 리사이즈 핸들에 시각적 피드백 (hover 시 border 색상 변경)
- Quick Capture FAB 유지
- 모바일: 사이드바를 Sheet으로, 리스트를 전체폭으로

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/app-shell.tsx
git commit -m "feat: rebuild sidebar with settings button and app shell with resizable panels"
```

---

## Task 7: 타이머 훅 구현 (TDD)

> 생각하기 세션의 핵심인 타이머 로직을 TDD로 구현한다.

**Files:**
- Create: `src/hooks/use-timer.ts`
- Create: `src/hooks/__tests__/use-timer.test.ts`

**Step 1: 실패하는 테스트 작성**

Create `src/hooks/__tests__/use-timer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../use-timer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with correct duration in seconds', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 30, onExpire: vi.fn() }))
    expect(result.current.remainingSeconds).toBe(30 * 60)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.progress).toBe(100)
  })

  it('starts countdown when start is called', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 1, onExpire: vi.fn() }))

    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remainingSeconds).toBe(59)
  })

  it('calculates progress percentage', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 1, onExpire: vi.fn() }))

    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(30000) }) // 30 seconds
    expect(result.current.progress).toBe(50)
  })

  it('calls onExpire when timer reaches zero', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer({ durationMinutes: 1, onExpire }))

    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(60000) })

    expect(onExpire).toHaveBeenCalledOnce()
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
  })

  it('stops countdown when stop is called', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 1, onExpire: vi.fn() }))

    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(10000) })
    act(() => result.current.stop())

    expect(result.current.isRunning).toBe(false)
    const remaining = result.current.remainingSeconds
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.remainingSeconds).toBe(remaining) // no change
  })

  it('returns elapsed minutes', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 30, onExpire: vi.fn() }))

    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(5 * 60 * 1000) }) // 5 minutes

    expect(result.current.elapsedMinutes).toBe(5)
  })

  it('formats remaining time as MM:SS', () => {
    const { result } = renderHook(() => useTimer({ durationMinutes: 1, onExpire: vi.fn() }))
    expect(result.current.formattedTime).toBe('01:00')

    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.formattedTime).toBe('00:55')
  })
})
```

**Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/hooks/__tests__/use-timer.test.ts`
Expected: FAIL - cannot find module `../use-timer`

**Step 3: 타이머 훅 구현**

Create `src/hooks/use-timer.ts`:

```typescript
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerOptions {
  durationMinutes: number
  onExpire: () => void
}

interface UseTimerReturn {
  remainingSeconds: number
  isRunning: boolean
  progress: number
  elapsedMinutes: number
  formattedTime: string
  start: () => void
  stop: () => void
}

export function useTimer({ durationMinutes, onExpire }: UseTimerOptions): UseTimerReturn {
  const totalSeconds = durationMinutes * 60
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          stop()
          onExpireRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stop])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const progress = Math.round((remainingSeconds / totalSeconds) * 100)
  const elapsedMinutes = Math.floor((totalSeconds - remainingSeconds) / 60)
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return { remainingSeconds, isRunning, progress, elapsedMinutes, formattedTime, start, stop }
}
```

**Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/hooks/__tests__/use-timer.test.ts`
Expected: 7 tests pass

**Step 5: 커밋**

```bash
git add src/hooks/use-timer.ts src/hooks/__tests__/use-timer.test.ts
git commit -m "feat: add useTimer hook with TDD (countdown, progress, formatting)"
```

---

## Task 8: 생각 노트 마크다운 파싱/직렬화 확장 (TDD)

> 기존 markdown.ts를 확장하여 "생각 노트" 섹션을 파싱/직렬화한다.

**Files:**
- Modify: `src/lib/markdown.ts`
- Modify: `src/lib/__tests__/markdown.test.ts`
- Modify: `src/types/bin-item.ts`

**Step 1: BinItem 타입에 thinkingNotes 필드 추가**

`src/types/bin-item.ts`의 BinItem 인터페이스에 추가:

```typescript
export interface BinItem {
  // ...기존 필드 유지
  thinkingNotes: string  // ## 생각 노트 섹션 전체 원문
}
```

**Step 2: 실패하는 테스트 작성**

`src/lib/__tests__/markdown.test.ts`에 추가:

```typescript
describe('thinking notes parsing', () => {
  it('parses thinking notes section from markdown', () => {
    const md = `---
id: "t1"
title: "테스트"
priority: "A"
tags: []
author: "dev"
created: "2026-02-23T10:00:00+09:00"
status: "open"
promoted_at: null
---

## 문제 상황
문제 설명

## 생각 노트
### 2026-02-23 14:30 (32분)
- 메모 내용 A

### 2026-02-23 10:15 (15분)
- 메모 내용 B`

    const item = parseBinItem(md, 'path.md', 'sha')
    expect(item.thinkingNotes).toContain('### 2026-02-23 14:30 (32분)')
    expect(item.thinkingNotes).toContain('메모 내용 A')
    expect(item.thinkingNotes).toContain('메모 내용 B')
  })

  it('returns empty string when no thinking notes exist', () => {
    const item = parseBinItem(SAMPLE_MARKDOWN, 'path.md', 'sha')
    expect(item.thinkingNotes).toBe('')
  })
})

describe('thinking notes serialization', () => {
  it('includes thinking notes section in serialized markdown', () => {
    const item: BinItem = {
      id: 't1', title: '테스트', priority: 'A', tags: [],
      author: 'dev', created: '2026-02-23T10:00:00+09:00',
      status: 'open', promoted_at: null,
      problem: '문제', currentStructure: '', idea: '', impact: '',
      thinkingNotes: '### 2026-02-23 14:30 (32분)\n- 메모 내용',
      filePath: '', sha: '',
    }

    const md = serializeBinItem(item)
    expect(md).toContain('## 생각 노트')
    expect(md).toContain('### 2026-02-23 14:30 (32분)')
  })

  it('omits thinking notes section when empty', () => {
    const item: BinItem = {
      id: 't1', title: '테스트', priority: 'A', tags: [],
      author: 'dev', created: '2026-02-23T10:00:00+09:00',
      status: 'open', promoted_at: null,
      problem: '문제', currentStructure: '', idea: '', impact: '',
      thinkingNotes: '',
      filePath: '', sha: '',
    }

    const md = serializeBinItem(item)
    expect(md).not.toContain('## 생각 노트')
  })
})
```

**Step 3: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/lib/__tests__/markdown.test.ts`
Expected: 새 테스트 FAIL (thinkingNotes 필드 없음)

**Step 4: markdown.ts 수정**

`parseBinItem`에서 `## 생각 노트` 섹션을 추출하고, `serializeBinItem`에서 조건부로 추가한다:

```typescript
export function parseBinItem(markdown: string, filePath: string, sha: string): BinItem {
  const { data, content } = parseFrontmatter(markdown)

  return {
    // ...기존 필드 유지
    thinkingNotes: extractSection(content, '생각 노트'),
    filePath,
    sha,
  }
}

export function serializeBinItem(item: BinItem): string {
  // ...기존 frontmatter 유지

  const sections = [
    `## 문제 상황\n${item.problem}`,
    `## 현재 구조\n${item.currentStructure}`,
    `## 개선 아이디어\n${item.idea}`,
    `## 영향 범위\n${item.impact}`,
  ]

  if (item.thinkingNotes) {
    sections.push(`## 생각 노트\n${item.thinkingNotes}`)
  }

  return `${frontmatter}\n\n${sections.join('\n\n')}\n`
}
```

**Step 5: 기존 코드에서 BinItem 사용하는 곳에 thinkingNotes 추가**

`src/hooks/use-bin-items.ts`에서 새 아이템 생성 시 `thinkingNotes: ''`을 추가한다.
`src/components/quick-capture.tsx`에서 BinItem 객체 생성 시에도 추가한다.

**Step 6: 테스트 실행하여 통과 확인**

Run: `npx vitest run`
Expected: 모든 테스트 통과

**Step 7: 커밋**

```bash
git add src/types/bin-item.ts src/lib/markdown.ts src/lib/__tests__/markdown.test.ts src/hooks/use-bin-items.ts src/components/quick-capture.tsx
git commit -m "feat: add thinking notes parsing and serialization to markdown system"
```

---

## Task 9: 생각하기 컨텍스트 구현

> 생각하기 세션의 상태를 관리하는 ThinkingContext를 구현한다.

**Files:**
- Create: `src/contexts/thinking-context.tsx`

**Step 1: ThinkingContext 생성**

Create `src/contexts/thinking-context.tsx`:

```typescript
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { BinItem } from '@/types/bin-item'

interface ThinkingSession {
  item: BinItem
  durationMinutes: number
  startedAt: Date
}

interface ThinkingContextType {
  session: ThinkingSession | null
  isActive: boolean
  startSession: (item: BinItem, durationMinutes: number) => void
  endSession: () => void
}

const ThinkingContext = createContext<ThinkingContextType | null>(null)

export function ThinkingProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ThinkingSession | null>(null)

  const startSession = useCallback((item: BinItem, durationMinutes: number) => {
    setSession({ item, durationMinutes, startedAt: new Date() })
  }, [])

  const endSession = useCallback(() => {
    setSession(null)
  }, [])

  return (
    <ThinkingContext.Provider value={{
      session,
      isActive: session !== null,
      startSession,
      endSession,
    }}>
      {children}
    </ThinkingContext.Provider>
  )
}

export function useThinking() {
  const ctx = useContext(ThinkingContext)
  if (!ctx) throw new Error('useThinking must be used within ThinkingProvider')
  return ctx
}
```

**Step 2: App.tsx에 ThinkingProvider 추가**

BinProvider 내부에 ThinkingProvider를 추가한다:

```typescript
<BinProvider>
  <ThinkingProvider>
    <AppShell />
  </ThinkingProvider>
</BinProvider>
```

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add src/contexts/thinking-context.tsx src/App.tsx
git commit -m "feat: add ThinkingContext for thinking session state management"
```

---

## Task 10: 타이머 다이얼로그 구현

> 생각하기 세션 시작 시 표시되는 타이머 설정 다이얼로그를 구현한다.

**Files:**
- Create: `src/components/thinking/timer-dialog.tsx`

**Step 1: TimerDialog 컴포넌트 생성**

Create `src/components/thinking/timer-dialog.tsx`:

```typescript
import { useState } from 'react'
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
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 3: 커밋**

```bash
git add src/components/thinking/timer-dialog.tsx
git commit -m "feat: add timer dialog for thinking session duration selection"
```

---

## Task 11: 타이머 바 컴포넌트 구현

> 세션 중 상단에 표시되는 타이머 바를 구현한다.

**Files:**
- Create: `src/components/thinking/timer-bar.tsx`

**Step 1: TimerBar 컴포넌트 생성**

Create `src/components/thinking/timer-bar.tsx`:

```typescript
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
```

**Step 2: 커밋**

```bash
git add src/components/thinking/timer-bar.tsx
git commit -m "feat: add timer bar component with progress indicator and color transitions"
```

---

## Task 12: 생각 메모 컴포넌트 구현

> 세션 중 메모를 작성하는 텍스트에어리어 컴포넌트를 구현한다.

**Files:**
- Create: `src/components/thinking/thinking-memo.tsx`

**Step 1: ThinkingMemo 컴포넌트 생성**

Create `src/components/thinking/thinking-memo.tsx`:

```typescript
interface ThinkingMemoProps {
  value: string
  onChange: (value: string) => void
}

export function ThinkingMemo({ value, onChange }: ThinkingMemoProps) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-medium text-foreground mb-2">생각 노트</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="자유롭게 생각을 기록하세요... (마크다운 지원)"
        className="flex-1 w-full bg-secondary/50 text-foreground border border-border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
      />
    </div>
  )
}
```

**Step 2: 커밋**

```bash
git add src/components/thinking/thinking-memo.tsx
git commit -m "feat: add thinking memo textarea component"
```

---

## Task 13: 세션 모드 레이아웃 구현 (풀스크린, 오버레이, 스플릿)

> 3가지 세션 UI 모드 레이아웃 컴포넌트를 구현한다.

**Files:**
- Create: `src/components/thinking/mode-fullscreen.tsx`
- Create: `src/components/thinking/mode-overlay.tsx`
- Create: `src/components/thinking/mode-split.tsx`

**Step 1: 풀스크린 모드**

Create `src/components/thinking/mode-fullscreen.tsx`:

```typescript
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
```

**Step 2: 오버레이 모드**

Create `src/components/thinking/mode-overlay.tsx`:

```typescript
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
```

**Step 3: 스플릿 모드**

Create `src/components/thinking/mode-split.tsx`:

```typescript
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
```

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 5: 커밋**

```bash
git add src/components/thinking/mode-fullscreen.tsx src/components/thinking/mode-overlay.tsx src/components/thinking/mode-split.tsx
git commit -m "feat: add three thinking session layout modes (fullscreen, overlay, split)"
```

---

## Task 14: 생각하기 세션 컨테이너 구현

> 모든 세션 컴포넌트를 조합하는 ThinkingSession 컨테이너를 구현한다. 타이머 + 메모 + 모드별 레이아웃 + 저장 로직을 통합한다.

**Files:**
- Create: `src/components/thinking/thinking-session.tsx`
- Modify: `src/components/layout/app-shell.tsx` (세션 렌더링 통합)

**Step 1: ThinkingSession 컴포넌트 생성**

Create `src/components/thinking/thinking-session.tsx`:

```typescript
import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useThinking } from '@/contexts/thinking-context'
import { useSettings } from '@/contexts/settings-context'
import { useTimer } from '@/hooks/use-timer'
import { TimerBar } from './timer-bar'
import { ThinkingMemo } from './thinking-memo'
import { ModeFullscreen } from './mode-fullscreen'
import { ModeOverlay } from './mode-overlay'
import { ModeSplit } from './mode-split'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BinItem } from '@/types/bin-item'

interface ThinkingSessionProps {
  onSave: (item: BinItem, memo: string, elapsedMinutes: number) => Promise<void>
  onPromote: (item: BinItem) => Promise<void>
  onResolve: (item: BinItem) => Promise<void>
  onDrop: (item: BinItem) => Promise<void>
}

export function ThinkingSession({ onSave, onPromote, onResolve, onDrop }: ThinkingSessionProps) {
  const { session, endSession } = useThinking()
  const { settings } = useSettings()
  const [memo, setMemo] = useState('')

  const handleExpire = useCallback(async () => {
    if (session && memo.trim()) {
      await onSave(session.item, memo, session.durationMinutes)
    }
    endSession()
  }, [session, memo, onSave, endSession])

  const timer = useTimer({
    durationMinutes: session?.durationMinutes ?? 1,
    onExpire: handleExpire,
  })

  // Auto-start timer when session begins
  // (handled by useEffect in the session start flow)

  if (!session) return null

  const handleSaveAndEnd = async () => {
    timer.stop()
    if (memo.trim()) {
      await onSave(session.item, memo, timer.elapsedMinutes)
    }
    endSession()
  }

  const handleAction = async (action: (item: BinItem) => Promise<void>) => {
    timer.stop()
    if (memo.trim()) {
      await onSave(session.item, memo, timer.elapsedMinutes)
    }
    await action(session.item)
    endSession()
  }

  const timerBar = (
    <TimerBar
      formattedTime={timer.formattedTime}
      progress={timer.progress}
      onStop={handleSaveAndEnd}
    />
  )

  const originalContent = (
    <div className="prose prose-invert prose-sm max-w-none">
      <h2 className="text-lg font-semibold">{session.item.title}</h2>
      <div className="flex gap-2 mb-4">
        <Badge variant={`priority_${session.item.priority.toLowerCase()}` as 'priority_s'}>
          {session.item.priority}
        </Badge>
        {session.item.tags.map(tag => (
          <span key={tag} className="text-xs bg-secondary px-1.5 py-0.5 rounded">#{tag}</span>
        ))}
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {[
          session.item.problem && `## 문제 상황\n${session.item.problem}`,
          session.item.currentStructure && `## 현재 구조\n${session.item.currentStructure}`,
          session.item.idea && `## 개선 아이디어\n${session.item.idea}`,
          session.item.impact && `## 영향 범위\n${session.item.impact}`,
        ].filter(Boolean).join('\n\n')}
      </ReactMarkdown>
    </div>
  )

  const memoArea = <ThinkingMemo value={memo} onChange={setMemo} />

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={() => handleAction(onPromote)}>↑ 승격</Button>
      <Button variant="outline" size="sm" onClick={() => handleAction(onResolve)}>✓ 해결</Button>
      <Button variant="destructive" size="sm" onClick={() => handleAction(onDrop)}>× 폐기</Button>
      <Button size="sm" onClick={handleSaveAndEnd}>저장 + 종료</Button>
    </>
  )

  const modeProps = { timerBar, originalContent, memo: memoArea, actions }

  switch (settings.thinkingMode) {
    case 'fullscreen': return <ModeFullscreen {...modeProps} />
    case 'split': return <ModeSplit {...modeProps} />
    case 'overlay': return <ModeOverlay {...modeProps} />
  }
}
```

**Step 2: app-shell.tsx에 ThinkingSession 통합**

`src/components/layout/app-shell.tsx`에서:

1. ThinkingSession 컴포넌트를 import
2. TimerDialog 컴포넌트를 import
3. detail-panel의 "생각하기" 버튼 클릭 시 TimerDialog 표시
4. TimerDialog에서 "시작" 클릭 시 ThinkingContext.startSession() 호출
5. fullscreen/split 모드는 전체 앱 위에 렌더링
6. overlay 모드는 detail-panel 위치에 렌더링

메모 저장 로직: `onSave` 콜백에서:

```typescript
async function handleSaveThinkingMemo(item: BinItem, memo: string, elapsedMinutes: number) {
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const newNote = `### ${timestamp} (${elapsedMinutes}분)\n${memo}`

  const updatedNotes = item.thinkingNotes
    ? `${newNote}\n\n${item.thinkingNotes}`
    : newNote

  const updatedItem = { ...item, thinkingNotes: updatedNotes }
  // GitHubService를 통해 업데이트
}
```

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 4: 수동 테스트**

Run: `npm run dev`
- 아이템 선택 → "생각하기" 버튼 클릭 → 타이머 다이얼로그 표시
- 시간 선택 → "시작" → 설정된 모드로 세션 진입
- 메모 작성 → "저장+종료" → 아이템 본문에 생각 노트 추가 확인

**Step 5: 커밋**

```bash
git add src/components/thinking/thinking-session.tsx src/components/layout/app-shell.tsx
git commit -m "feat: integrate thinking session with timer, memo, save logic, and mode switching"
```

---

## Task 15: Quick Capture + 칸반 뷰 리빌드

> 나머지 컴포넌트를 shadcn으로 리빌드한다.

**Files:**
- Modify: `src/components/quick-capture.tsx`
- Modify: `src/components/kanban-view.tsx`
- Modify: `src/components/login-page.tsx`

**Step 1: quick-capture.tsx 리빌드**

- shadcn Button, Badge 사용
- 기존 기능 유지, 스타일만 교체

**Step 2: kanban-view.tsx 리빌드**

- shadcn Badge, ScrollArea 사용
- ItemCard 컴포넌트 재사용 가능한 부분 활용
- 기존 기능 유지

**Step 3: login-page.tsx 리빌드**

- shadcn Button 사용
- 기존 기능 유지

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

**Step 5: 커밋**

```bash
git add src/components/quick-capture.tsx src/components/kanban-view.tsx src/components/login-page.tsx
git commit -m "feat: rebuild quick capture, kanban view, and login page with shadcn/ui components"
```

---

## Task 16: Toast 시스템 교체

> 기존 커스텀 toast를 sonner로 교체한다 (선택사항이지만 일관성을 위해).

**Files:**
- Modify: `package.json` (sonner 추가)
- Modify: `src/App.tsx`
- Delete: `src/components/toast.tsx` (더 이상 필요 없음)
- Delete: `src/contexts/toast-context.tsx` (더 이상 필요 없음)
- Modify: 기존 addToast 호출 → toast() 호출로 변경

**Step 1: sonner 설치**

Run: `npm install sonner`

**Step 2: App.tsx에 Toaster 추가**

```typescript
import { Toaster } from 'sonner'

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster theme="dark" position="bottom-right" />
    </SettingsProvider>
  )
}
```

**Step 3: toast 호출부 변경**

기존 `useToast()` → `toast()` (sonner) 또는 `toast.success()` / `toast.error()`

**Step 4: 기존 toast 관련 파일 제거**

toast.tsx, toast-context.tsx 삭제 (또는 사용처가 없으면 빌드 시 자동으로 안 쓰임)

**Step 5: 빌드 + 테스트 확인**

Run: `npm run build && npx vitest run`
Expected: 빌드 성공, 테스트 통과

**Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: replace custom toast system with sonner for consistent notifications"
```

---

## Task 17: 전체 통합 테스트 + 정리

> 전체 빌드, 테스트, 수동 검증을 진행하고 정리한다.

**Step 1: 전체 테스트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 통과

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

**Step 3: 린트 확인**

Run: `npm run lint`
Expected: 에러 없음 (경고는 허용)

**Step 4: 수동 테스트 체크리스트**

Run: `npm run dev` 후 아래 항목 확인:

- [ ] GitHub OAuth 로그인 정상 동작
- [ ] 사이드바: scope 전환, 우선순위 카운트, 태그, 유저 프로필
- [ ] 사이드바: 설정 버튼 → 설정 Sheet 열림/닫힘
- [ ] 설정: 생각하기 모드 변경, 타이머 기본값 변경, 리스트 밀도 변경
- [ ] 리스트 패널: 검색, 필터, 아이템 카드 미리보기/태그/생각횟수
- [ ] 리스트 밀도: compact/comfortable 전환
- [ ] 디테일 패널: 마크다운 가독성, 메타정보 카드, 액션 버튼
- [ ] 디테일 패널: "생각하기" 버튼 → 타이머 다이얼로그
- [ ] 생각하기: 타이머 설정 → 세션 시작 → 타이머 카운트다운
- [ ] 생각하기: 메모 작성 → 저장+종료 → 아이템에 생각 노트 추가
- [ ] 생각하기: 타이머 만료 시 자동 저장+종료
- [ ] 생각하기: 상태변경(승격/해결/폐기) 동작
- [ ] 생각하기: 3가지 모드(풀스크린/오버레이/스플릿) 전환
- [ ] Quick Capture: 새 아이템 생성
- [ ] 칸반 뷰: S/A/B 컬럼 표시
- [ ] 패널 리사이즈: 드래그로 사이드바/리스트/디테일 크기 조절
- [ ] 반응형: 모바일 레이아웃 동작

**Step 5: 불필요한 파일 정리**

사용하지 않는 import, 불필요한 파일이 없는지 확인한다.

**Step 6: 최종 커밋**

```bash
git add -A
git commit -m "chore: final integration cleanup and verification"
```
