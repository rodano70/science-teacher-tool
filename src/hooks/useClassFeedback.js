import { useState, useRef } from 'react'
import { computeClassSummary, formatSummaryForPrompt } from '../classUtils'
import { useProgressSimulation } from './useProgressSimulation'
import { runStream } from '../utils/streamUtils'

const SECTION_KEYS = [
  'key_successes',
  'key_misconceptions',
  'individual_concerns',
  'little_errors',
  'students_to_praise',
  'long_term_implications',
  'immediate_action',
]

// Extract complete, top-level JSON objects from a streaming text buffer.
// Uses brace counting and handles strings with escaped characters correctly.
// Returns { objects: Array<object>, remaining: string } where remaining is
// any incomplete JSON fragment to keep in the buffer for the next chunk.
function extractJsonObjects(buffer) {
  const objects = []
  let i = 0

  while (i < buffer.length) {
    // Fast-forward to the next opening brace
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
      // Incomplete object — keep from start onwards as the remaining buffer
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

  // Accumulator ref: sections extracted from the stream are stored here and
  // flushed to state on a 250 ms interval so React re-renders incrementally.
  const pendingSectionsRef = useRef({})

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

Generate a Whole Class Feedback sheet. Output each section as a separate JSON object on its own line (NDJSON). No preamble, no markdown fences, no extra text.

Output exactly these seven objects in order:
{"section":"key_successes","data":["bullet string","bullet string"]}
{"section":"key_misconceptions","data":["misconception + reteach action","..."]}
{"section":"individual_concerns","data":["Name: concern description","..."]}
{"section":"little_errors","data":["small mistake description","..."]}
{"section":"students_to_praise","data":["Name — reason","..."]}
{"section":"long_term_implications","data":["SOW implication","..."]}
{"section":"immediate_action","data":"one specific next-lesson action string"}

Be specific and curriculum-relevant for ${examBoard} ${subject}.`

    pendingSectionsRef.current = {}
    startProgress()
    setWcfLoading(true)

    // Flush accumulator to state every 250 ms so sections appear progressively
    const flushInterval = setInterval(() => {
      const pending = pendingSectionsRef.current
      if (Object.keys(pending).length > 0) {
        pendingSectionsRef.current = {}
        setWcfData(prev => ({ ...(prev || {}), ...pending }))
      }
    }, 250)

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
          system: 'You are an experienced UK secondary science teacher. Analyse class exam performance data and produce a Whole Class Feedback sheet. Output each section as a JSON object on its own line (NDJSON format). Return only the JSON lines — no markdown, no preamble, no extra text.',
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API error ${response.status}: ${errBody}`)
      }

      let jsonBuffer = ''

      await runStream(response, chunk => {
        jsonBuffer += chunk
        const { objects, remaining } = extractJsonObjects(jsonBuffer)
        jsonBuffer = remaining
        for (const obj of objects) {
          processWcfObject(obj)
        }
      })

      // Final parse of anything left in the buffer
      if (jsonBuffer.trim()) {
        const { objects } = extractJsonObjects(jsonBuffer)
        for (const obj of objects) {
          processWcfObject(obj)
        }
      }

    } catch (err) {
      setWcfError(err.message)
    } finally {
      clearInterval(flushInterval)
      // Final flush of any remaining sections
      const remaining = pendingSectionsRef.current
      if (Object.keys(remaining).length > 0) {
        setWcfData(prev => ({ ...(prev || {}), ...remaining }))
        pendingSectionsRef.current = {}
      }
      completeProgress()
      setWcfLoading(false)
    }
  }

  // Handle a parsed JSON object from the stream.
  // Accepts both NDJSON section format and the legacy single-object format.
  function processWcfObject(obj) {
    if (obj.section && SECTION_KEYS.includes(obj.section) && obj.data !== undefined) {
      // NDJSON section: {"section":"key_successes","data":[...]}
      pendingSectionsRef.current = { ...pendingSectionsRef.current, [obj.section]: obj.data }
    } else {
      // Fallback: legacy single-object format with all sections as top-level keys
      const found = SECTION_KEYS.filter(k => obj[k] !== undefined)
      if (found.length > 0) {
        const patch = {}
        found.forEach(k => { patch[k] = obj[k] })
        pendingSectionsRef.current = { ...pendingSectionsRef.current, ...patch }
      }
    }
  }

  return { wcfData, setWcfData, wcfLoading, wcfError, setWcfError, wcfProgress, handleGenerateWCF }
}
