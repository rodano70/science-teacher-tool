import { useState, useEffect } from 'react'
import UploadPanel from './components/UploadPanel'
import ClassFeedbackPanel from './components/ClassFeedback/ClassFeedbackPanel'
import IndividualFeedbackPanel from './components/IndividualFeedback/IndividualFeedbackPanel'
import { useClassFeedback } from './hooks/useClassFeedback'
import { useIndividualFeedback } from './hooks/useIndividualFeedback'
import { usePdfExtraction } from './hooks/usePdfExtraction'
import { computeClassSummary, extractStudentsForFeedback } from './classUtils'

function App({ onStepChange, onRegisterNavigate }) {
  // Shared state — both features read from studentData
  const [studentData, setStudentData] = useState(null)

  // Shared form fields
  const [examBoard, setExamBoard] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeBoundaries, setGradeBoundaries] = useState('')

  // PDF question extraction
  const {
    questionTexts,
    questionPdfStatus,
    pdfMeta,
    extractQuestionsFromPdf,
    clearQuestionTexts,
    updateQuestionText,
  } = usePdfExtraction()

  // Which output panel is currently visible: null | 'wcf' | 'individual'
  const [activeOutput, setActiveOutput] = useState(null)

  // Wire stepper step index: null→0, wcf→1, individual→2, dashboard→3
  useEffect(() => {
    if (activeOutput === null) onStepChange?.(0)
    else if (activeOutput === 'wcf') onStepChange?.(1)
    else if (activeOutput === 'individual') onStepChange?.(2)
    else if (activeOutput === 'dashboard') onStepChange?.(3)
  }, [activeOutput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Register navigate function with parent (AppPage) so the stepper can drive navigation.
  useEffect(() => {
    onRegisterNavigate?.((stepIndex) => {
      if (stepIndex === 0) setActiveOutput(null)
      else if (stepIndex === 1) setActiveOutput('wcf')
      else if (stepIndex === 2) setActiveOutput('individual')
      else if (stepIndex === 3) setActiveOutput('dashboard')
    })
  }, [onRegisterNavigate]) // eslint-disable-line react-hooks/exhaustive-deps

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
    truncated,
    handleGenerateFeedback,
    handleRetryMissing,
    handleDownloadWordDoc,
  } = useIndividualFeedback({
    examBoard,
    subject,
    topic,
    gradeBoundaries,
    studentData,
    questionTexts,
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
    questionTexts,
    validateInputs,
    callClaude,
    setActiveOutput,
  })

  // Generate WCF from upload page — each panel keeps its own data intact
  function onClickGenerateWCF() {
    setWcfError('')
    handleGenerateWCF()
  }

  // Generate individual feedback from upload page — each panel keeps its own data intact
  function onClickGenerateFeedback() {
    setFeedbackError('')
    setFeedbackSuccess(false)
    handleGenerateFeedback()
  }

  // Switch from individual → WCF without clearing feedbackData.
  // Generation continues in background if still streaming.
  function onSwitchToWCF() {
    if (wcfData) {
      setActiveOutput('wcf')
    } else {
      handleGenerateWCF()
    }
  }

  // Switch from WCF → individual without clearing wcfData.
  function onSwitchToIndividual() {
    setActiveOutput('individual')
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
    clearQuestionTexts()
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
    <>
      <main style={styles.main}>
        <div style={styles.card}>

          {/* ── Upload page (step 1) ─────────────────────────────────────── */}
          {!activeOutput && (
            <>
              <UploadPanel
                examBoard={examBoard} setExamBoard={setExamBoard}
                subject={subject} setSubject={setSubject}
                topic={topic} setTopic={setTopic}
                gradeBoundaries={gradeBoundaries} setGradeBoundaries={setGradeBoundaries}
                studentData={studentData}
                onDataParsed={setStudentData}
                onReset={handleReset}
                questionTexts={questionTexts}
                questionPdfStatus={questionPdfStatus}
                pdfMeta={pdfMeta}
                onPdfFile={extractQuestionsFromPdf}
                clearQuestionTexts={clearQuestionTexts}
                onQuestionChange={updateQuestionText}
                wcfLoading={wcfLoading} wcfProgress={wcfProgress} onGenerateWCF={onClickGenerateWCF}
                feedbackLoading={feedbackLoading} feedbackProgress={feedbackProgress} onGenerateFeedback={onClickGenerateFeedback}
              />

              {/* Errors on upload page */}
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

              {/* Resume bar — navigate back to existing output without regenerating */}
              {(feedbackData?.length > 0 || wcfData) && (
                <div style={styles.resumeBar}>
                  {feedbackData?.length > 0 && (
                    <button style={styles.resumeBtn} onClick={() => setActiveOutput('individual')}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                      Resume Individual Feedback
                    </button>
                  )}
                  {wcfData && (
                    <button style={styles.resumeBtn} onClick={() => setActiveOutput('wcf')}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                      Resume Class Feedback
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── WCF page (step 2) ────────────────────────────────────────── */}
          {activeOutput === 'wcf' && (
            <ClassFeedbackPanel
              data={wcfData}
              wcfLoading={wcfLoading}
              wcfProgress={wcfProgress}
              wcfError={wcfError}
              examBoard={examBoard}
              subject={subject}
              topic={topic}
              studentData={studentData}
              questionStats={questionStats}
              scoreDistribution={scoreDistribution}
              onBack={() => setActiveOutput(null)}
              onSwitchToIndividual={onSwitchToIndividual}
            />
          )}

          {/* ── Individual feedback page (step 3) ────────────────────────── */}
          {activeOutput === 'individual' && (
            <IndividualFeedbackPanel
              feedbackData={feedbackData}
              feedbackLoading={feedbackLoading}
              feedbackError={feedbackError}
              feedbackSuccess={feedbackSuccess}
              truncated={truncated}
              onDownloadSuccess={setFeedbackSuccess}
              onBack={() => setActiveOutput(null)}
              onSwitchToWCF={onSwitchToWCF}
              onRetryMissing={handleRetryMissing}
              examBoard={examBoard}
              subject={subject}
              topic={topic}
              questionTexts={questionTexts}
              studentData={studentData}
            />
          )}

          {/* ── Dashboard page (step 4) ──────────────────────────────────── */}
          {activeOutput === 'dashboard' && (
            <div style={styles.dashboardWrapper}>
              <div style={styles.dashboardHero}>
                <span style={styles.dashboardEyebrow}>Analytics</span>
                <h1 style={styles.dashboardTitle}>
                  Assessment <span style={styles.dashboardAccent}>· Dashboard</span>
                </h1>
              </div>
              <div style={styles.comingSoonCard}>
                <span className="material-symbols-outlined" style={styles.comingSoonIcon}>bar_chart</span>
                <h2 style={styles.comingSoonTitle}>Coming soon</h2>
                <p style={styles.comingSoonDesc}>
                  The Dashboard will bring together class trends, progress tracking, and
                  longitudinal performance insights across assessments.
                </p>
                <button style={styles.comingSoonBtn} onClick={() => setActiveOutput(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Back to Upload
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <p style={styles.version}>v0.26</p>
    </>
  )
}

const styles = {
  main: {
    maxWidth: '1260px',
    margin: '0 auto',
    padding: '0',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: '0',
    boxShadow: 'none',
    padding: '0',
  },
  resumeBar: {
    padding: '0 48px 40px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  resumeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'var(--color-surface-container-low)',
    border: '1px solid rgba(147, 179, 233, 0.3)',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-primary)',
    cursor: 'pointer',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    margin: '0 48px 16px',
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

  /* Dashboard coming-soon panel */
  dashboardWrapper: {
    paddingTop: '32px',
  },
  dashboardHero: {
    padding: '0 32px',
    marginBottom: '28px',
  },
  dashboardEyebrow: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  dashboardTitle: {
    margin: '0',
    fontSize: '34px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    lineHeight: '1.15',
  },
  dashboardAccent: {
    color: 'var(--color-primary)',
  },
  comingSoonCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '420px',
    margin: '0 auto',
    padding: '48px 40px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '16px',
    border: '1px solid rgba(147, 179, 233, 0.15)',
  },
  comingSoonIcon: {
    fontSize: '48px',
    color: 'var(--color-outline)',
    marginBottom: '16px',
  },
  comingSoonTitle: {
    margin: '0 0 12px',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  comingSoonDesc: {
    margin: '0 0 28px',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.6',
  },
  comingSoonBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
}

export default App
