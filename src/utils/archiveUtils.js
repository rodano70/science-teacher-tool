// djb2 hash — deterministic 32-bit integer hash, no library needed
function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

/**
 * Compute a stable fingerprint for an assessment sitting.
 * Two runs with the same marks sheet + same question texts → same fingerprint.
 *
 * studentData is whatever shape SheetJS produced — typically an array of
 * plain objects keyed by column name, but we also handle 2-D arrays defensively.
 *
 * @param {Array} studentData     Parsed rows from SheetJS
 * @param {string[]} questionTexts  Extracted question texts (may be empty)
 * @returns {string}  Base-36 hash string
 */
export function computeFingerprint(studentData, questionTexts = []) {
  if (!studentData || studentData.length === 0) return 'empty'

  const rowStrs = studentData.map(row => {
    if (Array.isArray(row)) {
      return row.map(cell => String(cell ?? '')).join(',')
    }
    if (row && typeof row === 'object') {
      // Sort keys so object key order doesn't affect the fingerprint
      const keys = Object.keys(row).sort()
      return keys.map(k => `${k}=${String(row[k] ?? '')}`).join(',')
    }
    return String(row ?? '')
  })

  // Sort rows so row order doesn't affect the fingerprint
  rowStrs.sort()

  return djb2(rowStrs.join('|') + '###' + questionTexts.join('||'))
}
