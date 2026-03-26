import { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import ClassFeedbackPanel from './components/ClassFeedback/ClassFeedbackPanel'
import IndividualFeedbackPanel from './components/IndividualFeedback/IndividualFeedbackPanel'
import { useClassFeedback } from './hooks/useClassFeedback'
import { useIndividualFeedback } from './hooks/useIndividualFeedback'
import { computeClassSummary, extractStudentsForFeedback } from './classUtils'

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

  // ─── Chart data (derived from studentData, no extra API calls) ───────────

  const _summary = studentData ? computeClassSummary(studentData) : null

  const questionStats = _summary
    ? _summary.questions.map(q => ({
        label: q.label,
        pctCorrect: q.maxMark > 0 ? Math.round((q.average / q.maxMark) * 1000) / 10 : 0,
      }))
    : null

  const scoreDistribution = (() => {
    if (!studentData) return null
    const students = extractStudentsForFeedback(studentData)
    const completers = students.filter(s => s.total > 0)
    if (completers.length === 0) return null
    const countMap = {}
    completers.forEach(s => { countMap[s.total] = (countMap[s.total] || 0) + 1 })
    return Object.entries(countMap)
      .map(([score, count]) => ({ score: Number(score), count }))
      .sort((a, b) => a.score - b.score)
  })()

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
      {/* App header — full-width band */}
      <header style={styles.appHeader}>
        <div style={styles.headerInner}>
          <h1 style={styles.appTitle}>UK Science Teacher Tool</h1>
          <p style={styles.appSubtitle}>
            Upload class results — generate whole-class and individual student feedback
          </p>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.card}>
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
          {wcfError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}>!</span>
              {wcfError}
            </div>
          )}
          {feedbackError && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}>!</span>
              {feedbackError}
            </div>
          )}

          {/* Single output panel — only one renders at a time */}
          {activeOutput === 'wcf' && wcfData && (
            <ClassFeedbackPanel
              data={wcfData}
              examBoard={examBoard}
              subject={subject}
              topic={topic}
              studentData={studentData}
              questionStats={questionStats}
              scoreDistribution={scoreDistribution}
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
      </main>

      <p style={styles.version}>v0.14</p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
  },
  appHeader: {
    backgroundColor: '#1e3150',
    borderBottom: '3px solid #1d4ed8',
  },
  headerInner: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '20px 24px',
  },
  appTitle: {
    margin: '0 0 4px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  appSubtitle: {
    margin: '0',
    fontSize: '13px',
    color: '#93c5fd',
    fontWeight: '400',
  },
  main: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '32px 24px 64px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.05)',
    padding: '32px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginTop: '20px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#b91c1c',
    lineHeight: '1.5',
  },
  errorIcon: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#b91c1c',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    marginTop: '1px',
  },
  version: {
    position: 'fixed',
    bottom: '12px',
    right: '16px',
    margin: '0',
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '400',
  },
}

export default App
