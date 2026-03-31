import { useState, useCallback } from 'react'
import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'
import AppShell from '../components/AppShell.jsx'

export default function AppPage() {
  const [appKey, setAppKey] = useState(0)
  const [activeStep, setActiveStep] = useState(0)

  const handleReset = useCallback(() => {
    if (!window.confirm('This will clear all results and start a new session. Are you sure?')) return
    setAppKey(k => k + 1)
    setActiveStep(0)
  }, [])

  const handleStepChange = useCallback((step) => setActiveStep(step), [])

  return (
    <PasswordGate>
      <AppShell onReset={handleReset} activeStep={activeStep}>
        <App key={appKey} onStepChange={handleStepChange} />
      </AppShell>
    </PasswordGate>
  )
}
