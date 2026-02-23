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
