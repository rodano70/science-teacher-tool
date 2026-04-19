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
 * Sorted by student name for determinism even if row order changes.
 *
 * @param {Array} studentData  Array of objects from SheetJS sheet_to_json (default format)
 * @param {string[]} questionTexts  Extracted question texts (may be empty array)
 * @returns {string}  Base-36 hash string
 */
export function computeFingerprint(studentData, questionTexts = []) {
  if (!studentData || studentData.length === 0) return 'empty'

  // SheetJS sheet_to_json returns an array of objects; handle both objects and arrays.
  const rowToStr = row =>
    Array.isArray(row)
      ? row.map(cell => String(cell ?? '')).join(',')
      : Object.values(row).map(cell => String(cell ?? '')).join(',')

  const firstCell = row =>
    Array.isArray(row) ? String(row[0] ?? '') : String(Object.values(row)[0] ?? '')

  // Sort rows by the first cell (student name column) for determinism
  const sorted = [...studentData].sort((a, b) =>
    firstCell(a).localeCompare(firstCell(b))
  )

  const studentStr = sorted.map(rowToStr).join('|')
  const questionStr = questionTexts.join('||')
  return djb2(studentStr + '###' + questionStr)
}
