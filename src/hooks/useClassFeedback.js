import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { computeClassSummary, formatSummaryForPrompt } from '../classUtils'

// Each tick, advance by max(fraction × remaining gap, min step).
const PROGRESS_STEP_FRACTION = 0.02
const PROGRESS_MIN_STEP = 0.5   // % per tick — floor near the cap
const PROGRESS_TICK_MS = 250
const PROGRESS_CAP = 90

// Maps NDJSON "section" keys to wcfData field names
const SECTION_KEYS = [
  'key_successes',
  'key_misconceptions',
  'individual_concerns',
  'little_errors',
  'students_to_praise',
  'long_term_implications',
  'immediate_action',
]

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

Generate a Whole Class Feedback sheet. Output each section as a separate JSON line — one line per section, no preamble, no markdown fences, no extra text.

Use exactly these seven lines in this order:
{"section":"key_successes","data":["bullet string","bullet string"]}
{"section":"key_misconceptions","data":["misconception + reteach action","..."]}
{"section":"individual_concerns","data":["Name: concern description","..."]}
{"section":"little_errors","data":["small mistake description","..."]}
{"section":"students_to_praise","data":["Name — reason","..."]}
{"section":"long_term_implications","data":["SOW implication","..."]}
{"section":"immediate_action","data":"one specific next-lesson action string"}

Base your analysis on the question averages and student performance data provided. Be specific and curriculum-relevant for ${examBoard} ${subject}.`

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
          max_tokens: 4000,
          stream: true,
          system: 'You are an experienced UK secondary science teacher. Analyse class exam performance data and produce a structured Whole Class Feedback sheet. Output each section as a separate JSON line exactly as instructed. Return only the JSON lines with no other text.',
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

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            textBuffer += event.delta.text
            const textLines = textBuffer.split('\n')
            textBuffer = textLines.pop() ?? ''
            for (const textLine of textLines) {
              tryParseSectionLine(textLine)
            }
          } else if (event.type === 'message_stop') {
            if (textBuffer.trim()) tryParseSectionLine(textBuffer)
            textBuffer = ''
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) tryParseSectionLine(textBuffer)

    } catch (err) {
      setWcfError(err.message)
    } finally {
      setWcfProgress(100)
      setWcfLoading(false)
    }
  }

  function tryParseSectionLine(line) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return
    try {
      const parsed = JSON.parse(trimmed)
      if (!parsed.section || !SECTION_KEYS.includes(parsed.section)) return
      if (parsed.data === undefined) return
      flushSync(() => {
        setWcfData(prev => ({ ...(prev || {}), [parsed.section]: parsed.data }))
      })
    } catch {
      // Incomplete or malformed line — ignore
    }
  }

  return { wcfData, setWcfData, wcfLoading, wcfError, setWcfError, wcfProgress, handleGenerateWCF }
}
