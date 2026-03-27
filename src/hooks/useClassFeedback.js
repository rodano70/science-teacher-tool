import { useState, useEffect } from 'react'
import { computeClassSummary, formatSummaryForPrompt } from '../classUtils'

// Each tick, advance by max(fraction × remaining gap, min step).
// Lower fraction slows the initial rush; the min step floor keeps the bar
// visibly moving near the 90% cap instead of appearing to freeze.
const PROGRESS_STEP_FRACTION = 0.02
const PROGRESS_MIN_STEP = 0.5   // % per tick — floor near the cap
const PROGRESS_TICK_MS = 250
const PROGRESS_CAP = 90

export function useClassFeedback({
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
  const [wcfData, setWcfData] = useState(null)
  const [wcfLoading, setWcfLoading] = useState(false)
  const [wcfError, setWcfError] = useState('')
  const [wcfProgress, setWcfProgress] = useState(0)

  useEffect(() => {
    if (!wcfLoading) { setWcfProgress(0); return }
    setWcfProgress(0)
    const timer = setInterval(() => {
      setWcfProgress(prev => {
        if (prev >= PROGRESS_CAP) return prev
        const step = Math.max((PROGRESS_CAP - prev) * PROGRESS_STEP_FRACTION, PROGRESS_MIN_STEP)
        return Math.min(prev + step, PROGRESS_CAP)
      })
    }, PROGRESS_TICK_MS)
    return () => clearInterval(timer)
  }, [wcfLoading])

  async function handleGenerateWCF() {
    setActiveOutput('wcf')
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

    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}${questionBlock}

Class data summary:
${summaryText}

Generate a Whole Class Feedback sheet. Return ONLY a valid JSON object with exactly these seven keys. No preamble, no markdown fences, no extra text — just the JSON.

{
  "key_successes": ["array of bullet-point strings describing what the class did well"],
  "key_misconceptions": ["array of bullet-point strings, each describing a misconception and a suggested reteach action"],
  "individual_concerns": ["array of strings, each naming a specific student and their concern — use the student names from the data"],
  "little_errors": ["array of bullet-point strings about small mistakes: command words, units, spelling, working out"],
  "students_to_praise": ["array of strings, each naming a student and why they should be praised"],
  "long_term_implications": ["array of bullet-point strings about scheme-of-work or teaching changes to make"],
  "immediate_action": "one specific thing the teacher should do in the next lesson to address the main misconception"
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
      setWcfProgress(100)
      setWcfLoading(false)
    }
  }

  return { wcfData, setWcfData, wcfLoading, wcfError, setWcfError, wcfProgress, handleGenerateWCF }
}
