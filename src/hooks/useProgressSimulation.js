import { useState, useEffect } from 'react'

const PROGRESS_STEP_FRACTION = 0.02
const PROGRESS_MIN_STEP = 0.5
const PROGRESS_TICK_MS = 250
const PROGRESS_CAP = 90

// Asymptotic progress bar simulation used during long AI streaming operations.
// Returns { progress, startProgress, completeProgress, resetProgress }.
//   startProgress()    — resets to 0 and begins the interval
//   completeProgress() — jumps to 100 and stops the interval
//   resetProgress()    — resets to 0 and stops the interval
export function useProgressSimulation() {
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) { setProgress(0); return }
    setProgress(0)
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= PROGRESS_CAP) return prev
        const step = Math.max((PROGRESS_CAP - prev) * PROGRESS_STEP_FRACTION, PROGRESS_MIN_STEP)
        return Math.min(prev + step, PROGRESS_CAP)
      })
    }, PROGRESS_TICK_MS)
    return () => clearInterval(timer)
  }, [isRunning])

  function startProgress() { setIsRunning(true) }
  function completeProgress() { setProgress(100); setIsRunning(false) }
  function resetProgress() { setIsRunning(false) }

  return { progress, startProgress, completeProgress, resetProgress }
}
