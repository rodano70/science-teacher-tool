import { useState } from 'react'
import { flushSync } from 'react-dom'
import { extractStudentsForFeedback } from '../classUtils'
import { downloadFeedbackDoc } from '../utils/docUtils'
import { useProgressSimulation } from './useProgressSimulation'
import { runToolStream } from '../utils/streamUtils'

const SYSTEM_PROMPT = `You are a feedback assistant generating written feedback for UK secondary science students based on their assessment results.  For each student, write three sections: WWW (What Went Well), EBI (Even Better If), and To Improve.  FEEDBACK RULES — follow these precisely:  WWW must identify a specific strength tied to what the student actually did — never generic praise like "well done" or "good effort." Name the concept or question where they demonstrated understanding.  EBI must be constructive and forward-looking, phrased tentatively: "Even better if you had explained why…" or "Even better if you had connected this to…" It should address the reasoning or method behind the error, not just the wrong answer. Where possible, connect the gap to the underlying concept that transfers beyond this specific question.  To Improve must contain one concrete, specific action the student can take immediately — a question to attempt, a concept to revisit, a sentence to rewrite, or a comparison to make. It must be something genuinely doable, not a vague instruction like "revise this topic."  ALWAYS write at the level of subject process — connect errors to the reasoning or method involved, not just the mark. A student who got Q4 wrong needs to understand what went wrong in their thinking, not just that Q4 was incorrect.  Frame errors as information about learning, not failure. Use tentative, constructive language for areas of development. Never compare students to each other. Never comment on the student as a person ("you're clearly capable," "you need to try harder"). Never use hollow praise.  If question text is provided, you must reference the specific concept, term, or idea from that question — do not refer to questions by number alone. Feedback that names the misconception is always more useful than feedback that does not.  Keep each section to 1–3 sentences. Do not exceed this. `

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
