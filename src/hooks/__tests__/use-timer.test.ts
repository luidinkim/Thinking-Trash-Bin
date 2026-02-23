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

  it('resets remaining seconds when durationMinutes changes', () => {
    let duration = 1
    const { result, rerender } = renderHook(() => useTimer({ durationMinutes: duration, onExpire: vi.fn() }))
    expect(result.current.remainingSeconds).toBe(60)

    duration = 2
    rerender()
    expect(result.current.remainingSeconds).toBe(120)
  })
})
