import { useState } from 'react'

// Wraps FileReader in a promise; resolves with the raw base64 string (no data-URL prefix).
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      // e.target.result = "data:application/pdf;base64,<data>"
      const base64 = e.target.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function usePdfExtraction() {
  const [questionTexts, setQuestionTexts] = useState([])
  const [questionPdfStatus, setQuestionPdfStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'

  function clearQuestionTexts() {
    setQuestionTexts([])
    setQuestionPdfStatus('idle')
  }

  async function extractQuestionsFromPdf(file) {
    setQuestionPdfStatus('loading')
    try {
      const base64 = await readFileAsBase64(file)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: 'Extract all exam questions from this document. Return only a JSON array of strings, one string per question, in order. Each string should be the full question text including any sub-parts. Return nothing else — no preamble, no markdown fences, just the raw JSON array.',
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API error ${response.status}: ${errBody}`)
      }

      const data = await response.json()
      let rawText = data.content?.[0]?.text ?? ''
      rawText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(rawText)
      setQuestionTexts(parsed)
      setQuestionPdfStatus('ready')
    } catch (err) {
      console.error('PDF extraction failed:', err)
      setQuestionPdfStatus('error')
    }
  }

  return { questionTexts, questionPdfStatus, extractQuestionsFromPdf, clearQuestionTexts }
}
