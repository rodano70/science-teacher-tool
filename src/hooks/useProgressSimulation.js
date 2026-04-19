import { useState, useRef, useEffect } from 'react'

const PROGRESS_STEP_FRACTION = 0.02
const PROGRESS_MIN_STEP = 0.5
const PROGRESS_TICK_MS = 250
const PROGRESS_CAP = 90

// Asymptotic progress bar simulation used during long AI streaming operations.
// Returns { progress, startProgress, completeProgress, resetProgress }.
//   startProgress()    — resets to 0 and begins the interval
//   completeProgress() — stops the interval and jumps to 100
//   resetProgress()    — stops the interval and resets to 0
export function useProgressSimulation() {
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)

  // Clear the interval on unmount so we don't leak timers.
  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  function startProgress() {
    clearInterval(timerRef.current)
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= PROGRESS_CAP) return prev
        const step = Math.max((PROGRESS_CAP - prev) * PROGRESS_STEP_FRACTION, PROGRESS_MIN_STEP)
        return Math.min(prev + step, PROGRESS_CAP)
      })
    }, PROGRESS_TICK_MS)
  }

  function completeProgress() {
    clearInterval(timerRef.current)
    setProgress(100)
  }

  function resetProgress() {
    clearInterval(timerRef.current)
    setProgress(0)
  }

  return { progress, startProgress, completeProgress, resetProgress }
}
