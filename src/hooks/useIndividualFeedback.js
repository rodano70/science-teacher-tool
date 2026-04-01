import { useState } from 'react'
import { flushSync } from 'react-dom'
import { extractStudentsForFeedback } from '../classUtils'
import { downloadFeedbackDoc } from '../utils/docUtils'
import { useProgressSimulation } from './useProgressSimulation'
import { runStream } from '../utils/streamUtils'

const SYSTEM_PROMPT = `You are a feedback assistant generating written feedback for UK secondary science students based on their assessment results.  For each student, write three sections: WWW (What Went Well), EBI (Even Better If), and To Improve.  FEEDBACK RULES — follow these precisely:  WWW must identify a specific strength tied to what the student actually did — never generic praise like "well done" or "good effort." Name the concept or question where they demonstrated understanding.  EBI must be constructive and forward-looking, phrased tentatively: "Even better if you had explained why…" or "Even better if you had connected this to…" It should address the reasoning or method behind the error, not just the wrong answer. Where possible, connect the gap to the underlying concept that transfers beyond this specific question.  To Improve must contain one concrete, specific action the student can take immediately — a question to attempt, a concept to revisit, a sentence to rewrite, or a comparison to make. It must be something genuinely doable, not a vague instruction like "revise this topic."  ALWAYS write at the level of subject process — connect errors to the reasoning or method involved, not just the mark. A student who got Q4 wrong needs to understand what went wrong in their thinking, not just that Q4 was incorrect.  Frame errors as information about learning, not failure. Use tentative, constructive language for areas of development. Never compare students to each other. Never comment on the student as a person ("you're clearly capable," "you need to try harder"). Never use hollow praise.  If question text is provided, you must reference the specific concept, term, or idea from that question — do not refer to questions by number alone. Feedback that names the misconception is always more useful than feedback that does not.  Keep each section to 1–3 sentences. Do not exceed this. `

// Extract complete, top-level JSON objects from a streaming text buffer.
// Uses brace counting and handles strings/escapes correctly — more robust than
// line-by-line splitting, which breaks when Claude's output contains literal
// newlines inside string values.
// Returns { objects: Array<object>, remaining: string }
function extractJsonObjects(buffer) {
  const objects = []
  let i = 0

  while (i < buffer.length) {
    const start = buffer.indexOf('{', i)
    if (start === -1) break

    let depth = 0
    let inString = false
    let escaped = false
    let end = -1

    for (let j = start; j < buffer.length; j++) {
      const c = buffer[j]
      if (escaped) { escaped = false; continue }
      if (c === '\\' && inString) { escaped = true; continue }
      if (c === '"') { inString = !inString; continue }
      if (inString) continue
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) { end = j; break }
      }
    }

    if (end === -1) {
      return { objects, remaining: buffer.slice(start) }
    }

    const candidate = buffer.slice(start, end + 1)
    try {
      const parsed = JSON.parse(candidate)
      objects.push(parsed)
    } catch {
      // Balanced braces but invalid JSON — skip past this opening brace
    }
    i = end + 1
  }

  return { objects, remaining: '' }
}

function buildStudentList(students) {
  return students
    .map(s => s.completed !== false && s.total > 0
      ? `${s.name} [completed: true] — ${s.total}/${s.maxTotal} — ${s.breakdown}`
      : `${s.name} [completed: false]`
    )
    .join('\n')
}

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
  const [truncated, setTruncated] = useState(false)
  const { progress: feedbackProgress, startProgress, completeProgress } = useProgressSimulation()

  // Append a validated student object to feedbackData immediately via flushSync,
  // so each student card renders as soon as it is parsed from the stream.
  function appendStudent(obj) {
    if (!obj.name) return
    if (!obj.isNonCompleter && obj.total != null && obj.maxTotal != null) {
      obj.score = `${obj.total}/${obj.maxTotal}`
    }
    flushSync(() => {
      setFeedbackData(prev => [...(prev || []), obj])
    })
  }

  async function streamStudents(promptMessages, onTruncated) {
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
        messages: promptMessages,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`API error ${response.status}: ${errBody}`)
    }

    let jsonBuffer = ''

    await runStream(
      response,
      chunk => {
        jsonBuffer += chunk
        const { objects, remaining } = extractJsonObjects(jsonBuffer)
        jsonBuffer = remaining
        for (const obj of objects) {
          appendStudent(obj)
        }
      },
      reason => { if (reason === 'max_tokens') onTruncated?.() }
    )

    // Final parse of anything left in the buffer
    if (jsonBuffer.trim()) {
      const { objects } = extractJsonObjects(jsonBuffer)
      for (const obj of objects) {
        appendStudent(obj)
      }
    }
  }

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
    const studentList = buildStudentList(students)

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
    startProgress()
    setFeedbackLoading(true)

    try {
      await streamStudents(
        [{ role: 'user', content: userPrompt }],
        () => setTruncated(true)
      )
    } catch (err) {
      if (err instanceof SyntaxError) {
        setFeedbackError('The AI returned an unexpected format. Please try again.')
      } else {
        setFeedbackError(err.message)
      }
    } finally {
      completeProgress()
      setFeedbackLoading(false)
    }
  }

  // Retry generation for a specific subset of students (those missing from the
  // first response). Appends results to existing feedbackData without clearing it.
  async function handleRetryMissing(missingStudents) {
    if (!missingStudents || missingStudents.length === 0) return

    setFeedbackError('')
    setFeedbackLoading(true)

    const studentList = missingStudents
      .map(s => `${s.name} [completed: true] — ${s.total}/${s.maxTotal} — ${s.breakdown}`)
      .join('\n')

    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}${questionBlock}

The following students were missing from a previous feedback run. Generate feedback only for these students:
${studentList}

Output each student on its own line as a standalone JSON object. Use this shape:
{"name":"Surname, Firstname","total":<number>,"maxTotal":<number>,"www":"...","ebi":"...","to_improve":"..."}
No preamble, no markdown fences, no extra text.

Be specific and curriculum-relevant for ${examBoard} ${subject} — ${topic}.`

    startProgress()

    try {
      await streamStudents(
        [{ role: 'user', content: userPrompt }],
        null
      )
    } catch (err) {
      setFeedbackError(err.message)
    } finally {
      completeProgress()
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
    truncated,
    handleGenerateFeedback,
    handleRetryMissing,
    handleDownloadWordDoc,
  }
}
