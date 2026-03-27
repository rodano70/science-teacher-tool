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
  const [pdfMeta, setPdfMeta] = useState(null) // { examBoard, subject, topic } — nulls filtered out

  function clearQuestionTexts() {
    setQuestionTexts([])
    setQuestionPdfStatus('idle')
    setPdfMeta(null)
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
          max_tokens: 2000,
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
                  text: `Extract information from this exam question paper and return a single JSON object with exactly these four keys:

{
  "examBoard": "the exam board name (e.g. AQA, Edexcel, OCR, WJEC) — return null if not clearly stated",
  "subject": "the science subject (e.g. Biology, Chemistry, Physics, Combined Science) — return null if not clearly stated",
  "topic": "the specific topic or unit title — return null if not clearly stated",
  "questions": ["array of full question strings, one per question, in order"]
}

Return null for examBoard, subject, or topic if the document does not contain clear evidence for that field — never guess. Return only the raw JSON object with no preamble, no markdown fences, no extra text.`,
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

      // Populate questions array (unchanged behaviour)
      if (Array.isArray(parsed.questions)) {
        setQuestionTexts(parsed.questions)
      }

      // Build pdfMeta — only include non-null fields
      const meta = {}
      if (parsed.examBoard != null) meta.examBoard = parsed.examBoard
      if (parsed.subject != null) meta.subject = parsed.subject
      if (parsed.topic != null) meta.topic = parsed.topic
      setPdfMeta(Object.keys(meta).length > 0 ? meta : null)

      setQuestionPdfStatus('ready')
    } catch (err) {
      console.error('PDF extraction failed:', err)
      setQuestionPdfStatus('error')
    }
  }

  function updateQuestionText(index, text) {
    setQuestionTexts(prev => prev.map((q, i) => (i === index ? text : q)))
  }

  return { questionTexts, questionPdfStatus, pdfMeta, extractQuestionsFromPdf, clearQuestionTexts, updateQuestionText }
}
