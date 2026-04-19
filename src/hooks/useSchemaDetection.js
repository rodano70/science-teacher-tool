import { useState, useCallback } from 'react'

const API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT =
  'You are a data analyst specialising in Excel gradebook formats used by UK secondary schools. ' +
  'Analyse the provided spreadsheet rows and return a JSON schema describing where the data lives. ' +
  'Return ONLY valid JSON — no explanation, no markdown fences, no prose.'

function buildPrompt(rows) {
  const sample = rows.slice(0, 8)
  const keys = Object.keys(sample[0] || {})

  return `Analyse this spreadsheet data and return a schema JSON object.

Column keys (as SheetJS parsed them): ${JSON.stringify(keys)}

First rows (up to 8, zero-indexed):
${JSON.stringify(sample, null, 2)}

Return JSON with exactly this shape:
{
  "format": "educake | teacher-custom | unknown — short descriptive name",
  "nameColumns": ["colKey"],
  "questionColumns": ["colKey1", "colKey2"],
  "maxMarksRow": null,
  "dataStartRow": 0,
  "notes": "any useful observations"
}

Rules:
- nameColumns: the SheetJS column key(s) that contain the student name. Use two keys when first name and last name are in separate columns (first-name key first). Use one key when the full name is in a single column.
- questionColumns: column keys for per-question scores in order. Exclude totals, percentages, ranks, and metadata columns.
- maxMarksRow: zero-indexed row number containing the maximum marks per question, or null if no such row exists.
- dataStartRow: zero-indexed row number where the first real student data row begins (not a header or metadata row).`
}

function stripFences(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

export function useSchemaDetection() {
  const [schemaStatus, setSchemaStatus]   = useState('idle')
  const [detectedSchema, setDetectedSchema] = useState(null)

  const detectSchema = useCallback(async (rawRows) => {
    if (!rawRows || rawRows.length === 0) return null

    setSchemaStatus('detecting')
    setDetectedSchema(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildPrompt(rawRows) }],
        }),
      })

      if (!response.ok) {
        setSchemaStatus('error')
        return null
      }

      const data = await response.json()
      const raw  = data?.content?.[0]?.text ?? ''
      const schema = JSON.parse(stripFences(raw))

      setDetectedSchema(schema)
      setSchemaStatus('ready')
      return schema
    } catch {
      setSchemaStatus('error')
      return null
    }
  }, [])

  return { detectSchema, schemaStatus, detectedSchema }
}
