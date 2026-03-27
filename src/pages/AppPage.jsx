import { useState, useCallback } from 'react'
import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'
import AppShell from '../components/AppShell.jsx'

export default function AppPage() {
  const [appKey, setAppKey] = useState(0)

  const handleReset = useCallback(() => {
    if (!window.confirm('This will clear all results and start a new session. Are you sure?')) return
    setAppKey(k => k + 1)
  }, [])

  return (
    <PasswordGate>
      <AppShell onReset={handleReset}>
        <App key={appKey} />
      </AppShell>
    </PasswordGate>
  )
}
