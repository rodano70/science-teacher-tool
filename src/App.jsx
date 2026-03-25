import { useState } from 'react'
import FileUpload from './FileUpload'
import WCFSheet from './WCFSheet'
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

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Exam Board</label>
            <select
              style={styles.select}
              value={examBoard}
              onChange={e => setExamBoard(e.target.value)}
            >
              <option value="">Select exam board...</option>
              <option value="AQA">AQA</option>
              <option value="OCR">OCR</option>
              <option value="Edexcel">Edexcel</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <select
              style={styles.select}
              value={subject}
              onChange={e => setSubject(e.target.value)}
            >
              <option value="">Select subject...</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Combined Science">Combined Science</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Topic</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. Photosynthesis, Atomic Structure..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Grade Boundaries{' '}
              <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. A*:90, A:80, B:70..."
              value={gradeBoundaries}
              onChange={e => setGradeBoundaries(e.target.value)}
            />
          </div>

          {/* Shared upload — both buttons use the same parsed data */}
          <FileUpload onDataParsed={setStudentData} />

          {/* Start Over — only visible once a file has been uploaded */}
          {studentData && (
            <button
              style={{ ...styles.button, ...styles.buttonReset }}
              type="button"
              onClick={handleReset}
            >
              Start Over
            </button>
          )}

          {/* Two output buttons */}
          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary, opacity: wcfLoading ? 0.7 : 1 }}
              type="button"
              onClick={onClickGenerateWCF}
              disabled={wcfLoading}
            >
              {wcfLoading ? 'Generating…' : 'Generate Class Feedback Sheet'}
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonSecondary, opacity: feedbackLoading ? 0.7 : 1 }}
              type="button"
              onClick={onClickGenerateFeedback}
              disabled={feedbackLoading}
            >
              {feedbackLoading ? 'Generating…' : 'Generate Individual Feedback'}
            </button>
          </div>

          {/* WCF progress bar */}
          {wcfLoading && (
            <div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${wcfProgress}%` }} />
              </div>
              <p style={styles.progressLabel}>Analysing class data…</p>
            </div>
          )}

          {/* Individual feedback progress bar */}
          {feedbackLoading && (
            <div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${feedbackProgress}%` }} />
              </div>
              <p style={styles.progressLabel}>Writing personalised feedback…</p>
            </div>
          )}
        </div>

        {/* Errors — always shown regardless of active output */}
        {wcfError && <p style={styles.errorText}>{wcfError}</p>}
        {feedbackError && <p style={styles.errorText}>{feedbackError}</p>}

        {/* Single output panel — only one renders at a time */}
        {activeOutput === 'wcf' && wcfData && (
          <WCFSheet
            data={wcfData}
            examBoard={examBoard}
            subject={subject}
            topic={topic}
          />
        )}

        {activeOutput === 'individual' && feedbackData && (
          <div style={styles.outputBox}>
            <h3 style={styles.outputHeading}>Individual Student Feedback Ready</h3>
            <p style={styles.outputMeta}>
              Feedback generated for {feedbackData.length} student{feedbackData.length !== 1 ? 's' : ''}.
            </p>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary, maxWidth: '320px' }}
              type="button"
              onClick={handleDownloadWordDoc}
            >
              Download Feedback as Word Document
            </button>
            {feedbackSuccess && (
              <p style={styles.successText}>Document downloaded successfully.</p>
            )}
          </div>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#fff',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  button: {
    flex: '1',
    minWidth: '200px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  buttonReset: {
    flex: 'none',
    minWidth: 'unset',
    width: '100%',
    backgroundColor: '#fff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontWeight: '500',
  },
  errorText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#ef4444',
  },
  successText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#16a34a',
  },
  outputBox: {
    marginTop: '32px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  outputHeading: {
    margin: '0 0 8px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  outputMeta: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#6b7280',
  },
  progressTrack: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginTop: '4px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#4f46e5',
    transition: 'width 0.25s ease-out',
  },
  progressLabel: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#6b7280',
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
