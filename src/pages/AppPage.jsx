import { useState, useCallback, useRef } from 'react'
import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'
import AppShell from '../components/AppShell.jsx'

export default function AppPage() {
  const [appKey, setAppKey] = useState(0)
  const [activeStep, setActiveStep] = useState(0)

  // App registers its navigate(stepIndex) function here so the stepper can drive it.
  const navigateRef = useRef(null)

  const handleReset = useCallback(() => {
    if (!window.confirm('This will clear all results and start a new session. Are you sure?')) return
    setAppKey(k => k + 1)
    setActiveStep(0)
    navigateRef.current = null
  }, [])

  const handleStepChange = useCallback((step) => setActiveStep(step), [])

  // Called by AppShell stepper clicks — relays to App's registered navigate function.
  const handleStepClick = useCallback((stepIndex) => {
    navigateRef.current?.(stepIndex)
  }, [])

  return (
    <PasswordGate>
      <AppShell onReset={handleReset} activeStep={activeStep} onStepClick={handleStepClick}>
        <App
          key={appKey}
          onStepChange={handleStepChange}
          onRegisterNavigate={(fn) => { navigateRef.current = fn }}
        />
      </AppShell>
    </PasswordGate>
  )
}
