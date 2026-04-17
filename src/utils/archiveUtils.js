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
 * @param {Array[]} studentData  Raw 2-D array from SheetJS (first col = name, rest = marks)
 * @param {string[]} questionTexts  Extracted question texts (may be empty array)
 * @returns {string}  Base-36 hash string
 */
export function computeFingerprint(studentData, questionTexts = []) {
  if (!studentData || studentData.length === 0) return 'empty'

  // Sort rows by first column (student name) for determinism
  const sorted = [...studentData].sort((a, b) => {
    const nameA = String(a[0] ?? '')
    const nameB = String(b[0] ?? '')
    return nameA.localeCompare(nameB)
  })

  const studentStr = sorted.map(row => row.map(cell => String(cell ?? '')).join(',')).join('|')
  const questionStr = questionTexts.join('||')
  return djb2(studentStr + '###' + questionStr)
}
