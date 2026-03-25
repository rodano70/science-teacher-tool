import { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import ClassFeedbackPanel from './components/ClassFeedback/ClassFeedbackPanel'
import IndividualFeedbackPanel from './components/IndividualFeedback/IndividualFeedbackPanel'
import { useClassFeedback } from './hooks/useClassFeedback'
import { useIndividualFeedback } from './hooks/useIndividualFeedback'

function App() {
  // Shared state — both features read from studentData
  const [studentData, setStudentData] = useState(null)

  // Shared form fields
  const [examBoard, setExamBoard] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeBoundaries, setGradeBoundaries] = useState('')

  // Which output panel is currently visible: null | 'wcf' | 'individual'
  const [activeOutput, setActiveOutput] = useState(null)

  // ─── Shared Claude API helper ─────────────────────────────────────────────

  async function callClaude(systemPrompt, userPrompt, maxTokens) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`API error ${response.status}: ${errBody}`)
    }

    return response.json()
  }

  // ─── Shared validation ────────────────────────────────────────────────────

  function validateInputs() {
    if (!studentData || studentData.length === 0) {
      return 'Please upload an Excel file with student data first.'
    }
    if (!examBoard || !subject || !topic) {
      return 'Please fill in Exam Board, Subject, and Topic.'
    }
    return null
  }

  // ─── Feature 1: Individual Feedback (hook) ────────────────────────────────

  const {
    feedbackData,
    setFeedbackData,
    feedbackLoading,
    setFeedbackLoading,
    feedbackError,
    setFeedbackError,
    feedbackSuccess,
    setFeedbackSuccess,
    feedbackProgress,
    handleGenerateFeedback,
    handleDownloadWordDoc,
  } = useIndividualFeedback({
    examBoard,
    subject,
    topic,
    gradeBoundaries,
    studentData,
    validateInputs,
    callClaude,
    setActiveOutput,
  })

  // ─── Feature 2: Whole Class Feedback Sheet (hook) ─────────────────────────

  const { wcfData, setWcfData, wcfLoading, wcfError, setWcfError, wcfProgress, handleGenerateWCF } = useClassFeedback({
    examBoard,
    subject,
    topic,
    gradeBoundaries,
    studentData,
    validateInputs,
    callClaude,
    setActiveOutput,
  })

  // Cross-panel clearing: each button clears the other panel before delegating to its hook handler
  function onClickGenerateWCF() {
    setFeedbackData(null)
    setFeedbackError('')
    setFeedbackSuccess(false)
    handleGenerateWCF()
  }

  function onClickGenerateFeedback() {
    setWcfData(null)
    setWcfError('')
    handleGenerateFeedback()
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  function handleReset() {
    if (!window.confirm('This will clear all results. Are you sure?')) return
    setStudentData(null)
    setExamBoard('')
    setSubject('')
    setTopic('')
    setGradeBoundaries('')
    setFeedbackData(null)
    setFeedbackLoading(false)
    setFeedbackError('')
    setFeedbackSuccess(false)
    setWcfData(null)
    setWcfError('')
    setActiveOutput(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>UK Science Teacher Tool</h1>
        <p style={styles.subheading}>Upload once — generate class feedback and individual student feedback</p>

        <UploadPanel
          examBoard={examBoard} setExamBoard={setExamBoard}
          subject={subject} setSubject={setSubject}
          topic={topic} setTopic={setTopic}
          gradeBoundaries={gradeBoundaries} setGradeBoundaries={setGradeBoundaries}
          studentData={studentData}
          onDataParsed={setStudentData}
          onReset={handleReset}
          wcfLoading={wcfLoading} wcfProgress={wcfProgress} onGenerateWCF={onClickGenerateWCF}
          feedbackLoading={feedbackLoading} feedbackProgress={feedbackProgress} onGenerateFeedback={onClickGenerateFeedback}
        />

        {/* Errors — always shown regardless of active output */}
        {wcfError && <p style={styles.errorText}>{wcfError}</p>}
        {feedbackError && <p style={styles.errorText}>{feedbackError}</p>}

        {/* Single output panel — only one renders at a time */}
        {activeOutput === 'wcf' && wcfData && (
          <ClassFeedbackPanel
            data={wcfData}
            examBoard={examBoard}
            subject={subject}
            topic={topic}
          />
        )}

        {activeOutput === 'individual' && feedbackData && (
          <IndividualFeedbackPanel
            feedbackData={feedbackData}
            feedbackSuccess={feedbackSuccess}
            onDownload={handleDownloadWordDoc}
          />
        )}
      </div>
      <p style={styles.version}>v0.12</p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '40px',
    width: '100%',
    maxWidth: '680px',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subheading: {
    margin: '0 0 32px',
    fontSize: '14px',
    color: '#6b7280',
  },
  errorText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#ef4444',
  },
  version: {
    position: 'fixed',
    bottom: '12px',
    right: '16px',
    margin: '0',
    fontSize: '11px',
    color: '#9ca3af',
  },
}

export default App
