import { useState, useCallback, useRef } from 'react'
import App from '../App.jsx'
import PasswordGate from '../components/PasswordGate.jsx'
import AppShell from '../components/AppShell.jsx'
import ArchivePanel from '../components/Archive/ArchivePanel.jsx'
import ArchiveViewer from '../components/Archive/ArchiveViewer.jsx'
import { useArchive } from '../hooks/useArchive.js'

export default function AppPage() {
  const [appKey, setAppKey] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [view, setView] = useState('tool')              // 'tool' | 'archive'
  const [viewingEntry, setViewingEntry] = useState(null) // archive entry open in viewer

  // App registers its navigate(stepIndex) function here so the stepper can drive it.
  const navigateRef = useRef(null)
  // App registers its loadFromArchive(entry) function here.
  const loadFromArchiveRef = useRef(null)

  // Archive state lives here so it persists across App remounts (appKey resets).
  const archive = useArchive()

  const handleReset = useCallback(() => {
    if (!window.confirm('This will clear all results and start a new session. Are you sure?')) return
    setAppKey(k => k + 1)
    setActiveStep(0)
    navigateRef.current = null
    setView('tool')
    setViewingEntry(null)
  }, [])

  const handleStepChange = useCallback((step) => setActiveStep(step), [])

  // Called by AppShell stepper clicks — relays to App's registered navigate function.
  const handleStepClick = useCallback((stepIndex) => {
    navigateRef.current?.(stepIndex)
  }, [])

  // Called by AppShell Archive nav item click.
  const handleArchiveClick = useCallback(() => {
    setView('archive')
    setViewingEntry(null)
  }, [])

  // Called by ArchiveViewer "Load into session" — restores entry data into the live tool.
  const handleLoadFromArchive = useCallback((entry) => {
    loadFromArchiveRef.current?.(entry)
    setView('tool')
    setViewingEntry(null)
  }, [])

  return (
    <PasswordGate>
      <AppShell
        onReset={handleReset}
        activeStep={view === 'tool' ? activeStep : -1}
        onStepClick={view === 'tool' ? handleStepClick : undefined}
        onArchiveClick={handleArchiveClick}
        onBack={() => setView('tool')}
        archiveActive={view === 'archive'}
        archiveCount={archive.entries.length}
        showStepper={view === 'tool'}
      >
        {view === 'archive' ? (
          viewingEntry ? (
            <ArchiveViewer
              entry={viewingEntry}
              onBack={() => setViewingEntry(null)}
              onUpdateNotes={archive.updateNotes}
              onLoadFromArchive={handleLoadFromArchive}
            />
          ) : (
            <ArchivePanel
              archive={archive}
              onViewEntry={setViewingEntry}
              onLoadFromArchive={handleLoadFromArchive}
              onBack={() => setView('tool')}
            />
          )
        ) : (
          <App
            key={appKey}
            onStepChange={handleStepChange}
            onRegisterNavigate={(fn) => { navigateRef.current = fn }}
            onRegisterLoadFromArchive={(fn) => { loadFromArchiveRef.current = fn }}
            archive={archive}
          />
        )}
      </AppShell>
    </PasswordGate>
  )
}
