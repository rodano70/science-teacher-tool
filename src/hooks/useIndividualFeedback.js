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

const SYSTEM_PROMPT = `You are a feedback assistant generating written feedback for UK secondary science students based on their assessment results.  For each student, write three sections: WWW (What Went Well), EBI (Even Better If), and To Improve.  FEEDBACK RULES — follow these precisely:  WWW must identify a specific strength tied to what the student actually did — never generic praise like "well done" or "good effort." Name the concept or question where they demonstrated understanding.  EBI must be constructive and forward-looking, phrased tentatively: "Even better if you had explained why…" or "Even better if you had connected this to…" It should address the reasoning or method behind the error, not just the wrong answer. Where possible, connect the gap to the underlying concept that transfers beyond this specific question.  To Improve must contain one concrete, specific action the student can take immediately — a question to attempt, a concept to revisit, a sentence to rewrite, or a comparison to make. It must be something genuinely doable, not a vague instruction like "revise this topic."  ALWAYS write at the level of subject process — connect errors to the reasoning or method involved, not just the mark. A student who got Q4 wrong needs to understand what went wrong in their thinking, not just that Q4 was incorrect.  Frame errors as information about learning, not failure. Use tentative, constructive language for areas of development. Never compare students to each other. Never comment on the student as a person ("you're clearly capable," "you need to try harder"). Never use hollow praise.  If question text is provided, you must reference the specific concept, term, or idea from that question — do not refer to questions by number alone. Feedback that names the misconception is always more useful than feedback that does not.  Keep each section to 1–3 sentences. Do not exceed this. `

export function useIndividualFeedback({
  examBoard,
  subject,
  topic,
  gradeBoundaries,
  studentData,
  questionTexts,
  validateInputs,
  setActiveOutput,
}) {
  const [feedbackData, setFeedbackData] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [feedbackProgress, setFeedbackProgress] = useState(0)
  const [truncated, setTruncated] = useState(false)

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
    setFeedbackSuccess(false)

    const err = validateInputs()
    if (err) { setFeedbackError(err); return }

    setFeedbackData([])

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

Output each student on its own line as a standalone JSON object with no array wrapper, no pretty-printing, no markdown fences, and no text before or after the JSON lines. Each line must be a complete, parseable JSON object. Use this shape for completers:
{"name":"Surname, Firstname","total":<number>,"maxTotal":<number>,"www":"...","ebi":"...","to_improve":"..."}
and this shape for non-completers:
{"name":"Surname, Firstname","isNonCompleter":true}
Output students in alphabetical order by surname.

Generate personalised WWW / EBI / To Improve feedback for every student who completed the work. Use the student's name in the feedback. Be specific and curriculum-relevant for ${examBoard} ${subject} — ${topic}.`

    setTruncated(false)
    setFeedbackLoading(true)
    try {
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
          max_tokens: 16000,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API error ${response.status}: ${errBody}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let textBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const sseLines = sseBuffer.split('\n')
        sseBuffer = sseLines.pop() ?? ''

        for (const sseLine of sseLines) {
          if (!sseLine.startsWith('data: ')) continue
          const payload = sseLine.slice(6).trim()
          if (payload === '[DONE]') continue
          let event
          try { event = JSON.parse(payload) } catch { continue }

          if (event.type === 'message_delta' && event.delta?.stop_reason === 'max_tokens') {
            setTruncated(true)
          } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            textBuffer += event.delta.text
            // Split on newlines; keep last (potentially incomplete) line in buffer
            const textLines = textBuffer.split('\n')
            textBuffer = textLines.pop() ?? ''
            for (const textLine of textLines) {
              tryParseStudentLine(textLine)
            }
          } else if (event.type === 'message_stop') {
            // Flush any remaining content in textBuffer
            tryParseStudentLine(textBuffer)
            textBuffer = ''
          }
        }
      }

      // Final flush in case stream ended without message_stop event
      if (textBuffer.trim()) {
        tryParseStudentLine(textBuffer)
      }

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

  function tryParseStudentLine(line) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return
    try {
      const parsed = JSON.parse(trimmed)
      if (!parsed.name) return
      // Add a score string for backward compat with docUtils
      if (!parsed.isNonCompleter && parsed.total != null && parsed.maxTotal != null) {
        parsed.score = `${parsed.total}/${parsed.maxTotal}`
      }
      setFeedbackData(prev => [...(prev || []), parsed])
    } catch {
      // Incomplete or malformed JSON line — ignore
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
    truncated,
    handleGenerateFeedback,
    handleDownloadWordDoc,
  }
}
