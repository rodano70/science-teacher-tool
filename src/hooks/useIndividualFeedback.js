import { useState } from 'react'
import { flushSync } from 'react-dom'
import { extractStudentsForFeedback } from '../classUtils'
import { downloadFeedbackDoc } from '../utils/docUtils'
import { useProgressSimulation } from './useProgressSimulation'
import { runToolStream } from '../utils/streamUtils'

const SYSTEM_PROMPT = `## Role
You are an expert UK secondary science teacher writing concise, formative feedback on
student assessments. Write in British English throughout (use "practise", "analyse",
"recognise", "colour", "behaviour", etc.).

## Output rules
- Call the submit_student_feedback tool exactly once per student. Never skip a student.
- If no question-paper text was provided, do not reference question numbers in any field.
- The "www" field must name the specific scientific concept demonstrated — not generic praise.
- The "ebi" field must be tentative and constructive: use "consider", "try", "it may help to".
  Address the reasoning or method behind the error, not just the incorrect answer — connect
  it to the underlying concept where possible.
- The "to_improve" field must be a single, concrete, actionable step achievable before the
  next lesson. For students who performed well, identify the next level of challenge or depth —
  a harder application, a link to another concept, or a question that extends their thinking.
- Where a student's pattern of errors suggests a study or reasoning habit worth addressing —
  rushing, not showing working, missing command words — the "to_improve" field may target
  that habit rather than a specific concept.
- Always refer to the specific scientific concept, process, or idea involved — never
  to question numbers. "You showed understanding of rate of reaction" not "you did
  well on Q3."

## UK context
- Assessments follow UK exam board mark schemes (AQA, OCR, Edexcel, WJEC, CCEA).
- Grade boundaries and mark allocations reflect UK GCSE / A-Level conventions.
- Reference subject-specific command words: "describe", "explain", "evaluate", "calculate".

## Tone & style
- Write at the student's level; avoid teacher jargon.
- Address the student directly using second person throughout — "you", "your". Never refer
  to the student in the third person.
- Frame errors and gaps as normal parts of learning, not failures. Use language that treats
  mistakes as diagnostic information.
- No hollow praise ("well done", "good effort", "great work").
- Do not compare students to one another.
- Keep each field to 1–2 sentences maximum.

## Do not
- Do not invent marks or totals not present in the input data.
- Do not reference other students by name.
- Do not reproduce the full question text in feedback fields.
- Do not comment on the student as a person ("you clearly struggle with this",
  "you are capable of better").`

// Tool definition for structured per-student feedback output.
const FEEDBACK_TOOL = {
  name: 'submit_student_feedback',
  description: 'Submit personalised WWW / EBI / To Improve feedback for one student who completed the assessment.',
  input_schema: {
    type: 'object',
    properties: {
      name:       { type: 'string',  description: "Student name as 'Surname, Firstname'" },
      total:      { type: 'integer', description: 'Raw score achieved' },
      maxTotal:   { type: 'integer', description: 'Maximum possible score' },
      www:        { type: 'string',  description: 'What Went Well — specific strength tied to what the student actually did' },
      ebi:        { type: 'string',  description: 'Even Better If — constructive, forward-looking, phrased tentatively' },
      to_improve: { type: 'string',  description: 'To Improve — one concrete, immediately doable action' },
    },
    required: ['name', 'total', 'maxTotal', 'www', 'ebi', 'to_improve'],
  },
}

const BATCH_SIZE = 12

function chunkArray(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function buildStudentList(students) {
  return students
    .map(s => `${s.name} — ${s.total}/${s.maxTotal} — ${s.breakdown}`)
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
  const [debugInfo, setDebugInfo] = useState(null)
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
        tools: [FEEDBACK_TOOL],
        tool_choice: { type: 'any' },
        messages: promptMessages,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`API error ${response.status}: ${errBody}`)
    }

    let stopReason = null
    let parsedCount = 0

    await runToolStream(
      response,
      input => {
        parsedCount++
        appendStudent(input)
      },
      reason => {
        stopReason = reason
        if (reason === 'max_tokens') onTruncated?.()
      }
    )

    setDebugInfo({
      stopReason: stopReason ?? 'end_turn',
      parsedCount,
    })
  }

  function buildUserPrompt(studentList) {
    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    return `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}
${gradeBoundaries ? `Grade Boundaries: ${gradeBoundaries}\n` : ''}${questionBlock}

Call submit_student_feedback once for every student listed below.
Student data (Name — Total score — Per-question breakdown where 1=correct 0=incorrect):
${studentList}

Generate personalised WWW / EBI / To Improve feedback for every student.
Use the student's name in the feedback. Be specific and curriculum-relevant for ${examBoard} ${subject} — ${topic}.`
  }

  async function handleGenerateFeedback() {
    setActiveOutput('individual')
    setFeedbackError('')
    setFeedbackSuccess(false)

    const err = validateInputs()
    if (err) { setFeedbackError(err); return }

    const rawStudents = extractStudentsForFeedback(studentData)
    if (!rawStudents || rawStudents.length === 0) {
      setFeedbackError('Could not extract student data from the uploaded file.')
      return
    }

    const completers = rawStudents.filter(s => s.total > 0)
    const nonCompleters = rawStudents.filter(s => s.total === 0)

    // Seed feedbackData with client-built non-completer objects immediately
    const nonCompleterObjects = nonCompleters.map(s => ({ name: s.name, isNonCompleter: true }))
    setFeedbackData(nonCompleterObjects)

    setTruncated(false)
    startProgress()
    setFeedbackLoading(true)

    try {
      const batches = chunkArray(completers, BATCH_SIZE)
      let anyTruncated = false

      await Promise.all(
        batches.map(batch => {
          const studentList = buildStudentList(batch)
          const userPrompt = buildUserPrompt(studentList)
          return streamStudents(
            [{ role: 'user', content: userPrompt }],
            () => { anyTruncated = true }
          )
        })
      )

      if (anyTruncated) setTruncated(true)
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
      .map(s => `${s.name} — ${s.total}/${s.maxTotal} — ${s.breakdown}`)
      .join('\n')

    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}
${gradeBoundaries ? `Grade Boundaries: ${gradeBoundaries}\n` : ''}${questionBlock}

The following students were missing from a previous feedback run. Call submit_student_feedback once for each student listed below.
Student data (Name — Total score — Per-question breakdown where 1=correct 0=incorrect):
${studentList}

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
    debugInfo,
    handleGenerateFeedback,
    handleRetryMissing,
    handleDownloadWordDoc,
  }
}
