import { useState } from 'react'
import { computeClassSummary, formatSummaryForPrompt } from '../classUtils'
import { useProgressSimulation } from './useProgressSimulation'
import { runToolStream } from '../utils/streamUtils'

// The seven sections of the Whole Class Feedback sheet. Order matches the
// sequence the model is instructed to emit them in so the UI fills in visibly
// top-to-bottom.
const SECTIONS = [
  'key_successes',
  'key_misconceptions',
  'individual_concerns',
  'little_errors',
  'students_to_praise',
  'long_term_implications',
  'immediate_action',
]

// Tool the model calls once per section. `data` is an array of bullet strings
// for every section except `immediate_action`, which is a single string.
const SECTION_TOOL = {
  name: 'submit_section',
  description: 'Submit one completed section of the Whole Class Feedback sheet. Call this tool exactly seven times, once per section, in the documented order.',
  input_schema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        enum: SECTIONS,
        description: 'Identifier of the section being submitted.',
      },
      data: {
        description: 'For immediate_action this is a single string. For all other sections it is an array of short bullet strings.',
      },
    },
    required: ['section', 'data'],
  },
}

const SYSTEM_PROMPT =
  'You are an experienced UK secondary science teacher. Analyse class exam performance data and produce a Whole Class Feedback sheet by calling the submit_section tool seven times, in this exact order: key_successes, key_misconceptions, individual_concerns, little_errors, students_to_praise, long_term_implications, immediate_action. Do not output any text between tool calls. For immediate_action, `data` is a single next-lesson action string. For every other section, `data` is an array of short bullet strings.'

export function useClassFeedback({
  examBoard,
  subject,
  topic,
  gradeBoundaries,
  studentData,
  questionTexts,
  validateInputs,
  setActiveOutput,
}) {
  const [wcfData, setWcfData] = useState(null)
  const [wcfLoading, setWcfLoading] = useState(false)
  const [wcfError, setWcfError] = useState('')
  const { progress: wcfProgress, startProgress, completeProgress } = useProgressSimulation()

  async function handleGenerateWCF() {
    setWcfError('')

    const err = validateInputs()
    if (err) { setWcfError(err); return }

    const summary = computeClassSummary(studentData)
    if (!summary) {
      setWcfError('Could not compute class summary from the uploaded data.')
      return
    }

    // Only switch views once inputs are verified, otherwise the user lands on
    // an empty feedback page with the error tucked out of sight.
    setActiveOutput('wcf')
    setWcfData(null)

    const summaryText = formatSummaryForPrompt(summary)
    const questionBlock = questionTexts.length > 0
      ? '\nQuestion paper: ' + questionTexts.map((t, i) => `Q${i + 1}: ${t}`).join(' ')
      : ''

    const userPrompt = `Exam Board: ${examBoard}
Subject: ${subject}
Topic: ${topic}${gradeBoundaries ? `\nGrade Boundaries: ${gradeBoundaries}` : ''}${questionBlock}

Class data summary:
${summaryText}

Call submit_section seven times in order:
  1. key_successes            — bullets describing what the class understood
  2. key_misconceptions       — bullets stating the misconception + reteach action
  3. individual_concerns      — bullets formatted "Name: concern description"
  4. little_errors            — bullets describing small surface mistakes
  5. students_to_praise       — bullets formatted "Name — reason"
  6. long_term_implications   — bullets describing SOW implications
  7. immediate_action         — a single specific next-lesson action string

Be specific and curriculum-relevant for ${examBoard} ${subject} — ${topic}.`

    startProgress()
    setWcfLoading(true)

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
          max_tokens: 6000,
          stream: true,
          system: SYSTEM_PROMPT,
          tools: [SECTION_TOOL],
          tool_choice: { type: 'any' },
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API error ${response.status}: ${errBody}`)
      }

      await runToolStream(response, input => {
        if (!input || !SECTIONS.includes(input.section)) return
        setWcfData(prev => ({ ...(prev || {}), [input.section]: input.data }))
      })
    } catch (err) {
      setWcfError(err.message)
    } finally {
      completeProgress()
      setWcfLoading(false)
    }
  }

  return { wcfData, setWcfData, wcfLoading, wcfError, setWcfError, wcfProgress, handleGenerateWCF }
}
