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
  questionTexts,
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

    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}${questionBlock}

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
        'You are a feedback assistant generating written feedback for UK secondary science students based on their assessment results.  For each student, write three sections: WWW (What Went Well), EBI (Even Better If), and To Improve.  FEEDBACK RULES — follow these precisely:  WWW must identify a specific strength tied to what the student actually did — never generic praise like "well done" or "good effort." Name the concept or question where they demonstrated understanding.  EBI must be constructive and forward-looking, phrased tentatively: "Even better if you had explained why…" or "Even better if you had connected this to…" It should address the reasoning or method behind the error, not just the wrong answer. Where possible, connect the gap to the underlying concept that transfers beyond this specific question.  To Improve must contain one concrete, specific action the student can take immediately — a question to attempt, a concept to revisit, a sentence to rewrite, or a comparison to make. It must be something genuinely doable, not a vague instruction like "revise this topic."  ALWAYS write at the level of subject process — connect errors to the reasoning or method involved, not just the mark. A student who got Q4 wrong needs to understand what went wrong in their thinking, not just that Q4 was incorrect.  Frame errors as information about learning, not failure. Use tentative, constructive language for areas of development. Never compare students to each other. Never comment on the student as a person ("you\'re clearly capable," "you need to try harder"). Never use hollow praise.  If question text is provided, you must reference the specific concept, term, or idea from that question — do not refer to questions by number alone. Feedback that names the misconception is always more useful than feedback that does not.  Keep each section to 1–3 sentences. Do not exceed this. ',
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
