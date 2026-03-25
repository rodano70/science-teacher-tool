import { useState, useEffect } from 'react'
import { extractStudentsForFeedback } from '../classUtils'
import { downloadFeedbackDoc } from '../utils/docUtils'

// Each tick, advance by max(fraction × remaining gap, min step).
// Lower fraction slows the initial rush; the min step floor keeps the bar
// visibly moving near the 90% cap instead of appearing to freeze.
const PROGRESS_STEP_FRACTION = 0.02
const PROGRESS_MIN_STEP = 0.5   // % per tick — floor near the cap
const PROGRESS_TICK_MS = 250
const PROGRESS_CAP = 90

export function useIndividualFeedback({
  examBoard,
  subject,
  topic,
  gradeBoundaries,
  studentData,
  validateInputs,
  callClaude,
  setActiveOutput,
}) {
  const [feedbackData, setFeedbackData] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [feedbackProgress, setFeedbackProgress] = useState(0)

  useEffect(() => {
    if (!feedbackLoading) { setFeedbackProgress(0); return }
    setFeedbackProgress(0)
    const timer = setInterval(() => {
      setFeedbackProgress(prev => {
        if (prev >= PROGRESS_CAP) return prev
        const step = Math.max((PROGRESS_CAP - prev) * PROGRESS_STEP_FRACTION, PROGRESS_MIN_STEP)
        return Math.min(prev + step, PROGRESS_CAP)
      })
    }, PROGRESS_TICK_MS)
    return () => clearInterval(timer)
  }, [feedbackLoading])

  async function handleGenerateFeedback() {
    setActiveOutput('individual')
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
      setFeedbackProgress(100)
      setFeedbackLoading(false)
    }
  }

  async function handleDownloadWordDoc() {
    await downloadFeedbackDoc({ feedbackData, subject, topic, setFeedbackSuccess })
  }

  return {
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
  }
}
