// SSE transport layer for Anthropic streaming responses.
// Handles the reader/decoder loop, SSE framing, and text_delta extraction.
//
// runStream(response, onText, onStopReason?)
//   response     — fetch Response with a streaming body (already checked for .ok)
//   onText       — (chunk: string) => void  called for each text_delta string
//   onStopReason — (reason: string) => void  called when message_delta carries a
//                  stop_reason (e.g. 'max_tokens'); optional
//
// Returns a promise that resolves when the stream ends.
// The caller is responsible for any post-stream buffer draining.
export async function runStream(response, onText, onStopReason) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let sseBuffer = ''

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
        onText(event.delta.text)
      } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
        onStopReason?.(event.delta.stop_reason)
      } else if (event.type === 'message_stop') {
        onText('')  // signal end-of-stream so callers can drain their buffers
      }
    }
  }
}
