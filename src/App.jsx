import { useState, useEffect } from 'react'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import FileUpload from './FileUpload'
import WCFSheet from './WCFSheet'
import { computeClassSummary, formatSummaryForPrompt, extractStudentsForFeedback } from './classUtils'

const WCF_MESSAGES = [
  'Parsing student results...',
  'Calculating question averages...',
  'Identifying misconceptions...',
  'Drafting feedback sections...',
  'Almost done...',
]

const INDIVIDUAL_MESSAGES = [
  'Analysing individual performance...',
  'Writing personalised feedback...',
  'Preparing student comments...',
  'Almost done...',
]

function App() {
  // Shared state — both features read from studentData
  const [studentData, setStudentData] = useState(null)

  // Shared form fields
  const [examBoard, setExamBoard] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeBoundaries, setGradeBoundaries] = useState('')

  // Individual feedback state
  const [feedbackData, setFeedbackData] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  // WCF state
  const [wcfData, setWcfData] = useState(null)
  const [wcfLoading, setWcfLoading] = useState(false)
  const [wcfError, setWcfError] = useState('')

  // Loading message cycling
  const [wcfMessage, setWcfMessage] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')

  useEffect(() => {
    if (!wcfLoading) { setWcfMessage(''); return }
    let i = 0
    setWcfMessage(WCF_MESSAGES[0])
    const timer = setInterval(() => {
      i = (i + 1) % WCF_MESSAGES.length
      setWcfMessage(WCF_MESSAGES[i])
    }, 2000)
    return () => clearInterval(timer)
  }, [wcfLoading])

  useEffect(() => {
    if (!feedbackLoading) { setFeedbackMessage(''); return }
    let i = 0
    setFeedbackMessage(INDIVIDUAL_MESSAGES[0])
    const timer = setInterval(() => {
      i = (i + 1) % INDIVIDUAL_MESSAGES.length
      setFeedbackMessage(INDIVIDUAL_MESSAGES[i])
    }, 2000)
    return () => clearInterval(timer)
  }, [feedbackLoading])

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

  // ─── Feature 1: Individual Feedback ──────────────────────────────────────

  async function handleGenerateFeedback() {
    setFeedbackError('')
    setFeedbackData(null)
    setFeedbackSuccess(false)

    const err = validateInputs()
    if (err) { setFeedbackError(err); return }

    const rawStudents = extractStudentsForFeedback(studentData)
    if (!rawStudents || rawStudents.length === 0) {
      setFeedbackError('Could not extract student data from the uploaded file.')
      return
    }

    const students = rawStudents.map(s => ({ ...s, completed: s.total > 0 }))

    const studentList = students
      .map(s => s.completed
        ? `${s.name} [completed: true] — ${s.total}/${s.maxTotal} — ${s.breakdown}`
        : `${s.name} [completed: false]`
      )
      .join('\n')

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}

Student data (Name — Total score — Per-question scores where 1=correct 0=incorrect):
${studentList}

IMPORTANT: Students marked [completed: false] did not submit their work. For these students only, write a single short sentence in the "www" field noting that no submission was recorded. Set "ebi" and "to_improve" to "" (empty strings). Set "score" to "Did not submit". They must still appear in the JSON array.

Return ONLY a valid JSON array. No preamble, no markdown fences, no extra text — just the JSON array.

[
  {
    "name": "Student Full Name",
    "score": "18/19",
    "www": "What Went Well paragraph...",
    "ebi": "Even Better If paragraph...",
    "to_improve": "One specific action the student can take..."
  }
]

Generate personalised WWW / EBI / To Improve feedback for every student who completed the work. Use the student's name in the feedback. Be specific and curriculum-relevant for ${examBoard} ${subject} — ${topic}.`

    setFeedbackLoading(true)
    try {
      const data = await callClaude(
        'You are a UK secondary science teacher assistant. Generate personalised WWW/EBI/To Improve feedback for each student based on their exam results. Return only a valid JSON array with no markdown fences.',
        userPrompt,
        8000
      )
      let rawText = data.content?.[0]?.text ?? ''
      rawText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(rawText)
      setFeedbackData(parsed)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setFeedbackError('The AI returned an unexpected format. Please try again.')
      } else {
        setFeedbackError(err.message)
      }
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function handleDownloadWordDoc() {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    const docChildren = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({ text: `${subject} — ${topic} — Individual Feedback — ${dateStr}` }),
        ],
        spacing: { after: 400 },
      }),
    ]

    feedbackData.forEach((student, idx) => {
      const isNonCompleter = !student.ebi && !student.to_improve

      const nameText = student.score && student.score !== 'Did not submit'
        ? `${student.name}  —  ${student.score}`
        : student.name

      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: nameText, bold: true })],
          spacing: { before: idx === 0 ? 0 : 200, after: 160 },
        }),
      )

      if (isNonCompleter) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: student.www ?? 'No submission recorded.', italics: true })],
            spacing: { after: 200 },
          }),
        )
      } else {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'WWW: ', bold: true }),
              new TextRun({ text: student.www ?? '' }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'EBI: ', bold: true }),
              new TextRun({ text: student.ebi ?? '' }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'To Improve: ', bold: true }),
              new TextRun({ text: student.to_improve ?? '' }),
            ],
            spacing: { after: 200 },
          }),
        )
      }

      if (idx < feedbackData.length - 1) {
        docChildren.push(new Paragraph({ thematicBreak: true, spacing: { after: 200 } }))
      }
    })

    const doc = new Document({ sections: [{ children: docChildren }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subject} - ${topic} - Individual Feedback - ${new Date().toISOString().slice(0, 10)}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setFeedbackSuccess(true)
  }

  // ─── Feature 2: Whole Class Feedback Sheet ────────────────────────────────

  async function handleGenerateWCF() {
    setWcfError('')
    setWcfData(null)

    const err = validateInputs()
    if (err) { setWcfError(err); return }

    const summary = computeClassSummary(studentData)
    if (!summary) {
      setWcfError('Could not compute class summary from the uploaded data.')
      return
    }

    const summaryText = formatSummaryForPrompt(summary)

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}

Class data summary:
${summaryText}

Generate a Whole Class Feedback sheet. Return ONLY a valid JSON object with exactly these six keys. No preamble, no markdown fences, no extra text — just the JSON.

{
  "key_successes": ["array of bullet-point strings describing what the class did well"],
  "key_misconceptions": ["array of bullet-point strings, each describing a misconception and a suggested reteach action"],
  "individual_concerns": ["array of strings, each naming a specific student and their concern — use the student names from the data"],
  "little_errors": ["array of bullet-point strings about small mistakes: command words, units, spelling, working out"],
  "students_to_praise": ["array of strings, each naming a student and why they should be praised"],
  "long_term_implications": ["array of bullet-point strings about scheme-of-work or teaching changes to make"]
}

Base your analysis on the question averages and student performance data provided. Be specific and curriculum-relevant for ${examBoard} ${subject}.`

    setWcfLoading(true)
    try {
      const data = await callClaude(
        'You are an experienced UK secondary science teacher. Analyse class exam performance data and produce a structured Whole Class Feedback sheet as a JSON object. Return only valid JSON with no markdown fences.',
        userPrompt,
        4000
      )
      let rawText = data.content?.[0]?.text ?? ''
      rawText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(rawText)
      setWcfData(parsed)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setWcfError('The AI returned an unexpected format. Please try again.')
      } else {
        setWcfError(err.message)
      }
    } finally {
      setWcfLoading(false)
    }
  }

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

          {/* Two output buttons */}
          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary, opacity: wcfLoading ? 0.7 : 1 }}
              type="button"
              onClick={handleGenerateWCF}
              disabled={wcfLoading}
            >
              {wcfLoading ? (wcfMessage || 'Generating…') : 'Generate Class Feedback Sheet'}
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonSecondary, opacity: feedbackLoading ? 0.7 : 1 }}
              type="button"
              onClick={handleGenerateFeedback}
              disabled={feedbackLoading}
            >
              {feedbackLoading ? (feedbackMessage || 'Generating…') : 'Generate Individual Feedback'}
            </button>
          </div>
        </div>

        {/* WCF errors */}
        {wcfError && <p style={styles.errorText}>{wcfError}</p>}

        {/* Individual feedback errors */}
        {feedbackError && <p style={styles.errorText}>{feedbackError}</p>}

        {/* WCF output */}
        {wcfData && (
          <WCFSheet
            data={wcfData}
            examBoard={examBoard}
            subject={subject}
            topic={topic}
          />
        )}

        {/* Individual feedback — download panel */}
        {feedbackData && (
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
      <p style={styles.version}>v0.10</p>
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
