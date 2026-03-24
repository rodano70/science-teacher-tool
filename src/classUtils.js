/**
 * Compute a compact class summary from raw SheetJS rows.
 * This is what gets sent to Claude — not the raw rows.
 *
 * Returns an object with:
 *   - studentCount
 *   - questions: [{ label, maxMark, average, averagePct }]
 *   - nonCompleters: [studentName]
 *   - topStudents: [{ name, total }]   (top 3)
 *   - bottomStudents: [{ name, total }] (bottom 3, excluding non-completers)
 *   - classAverage: number
 *   - classTotalMax: number
 *
 * v0.6 — Educake fix: use the Questions count from the metadata row to select
 *         exactly the right __EMPTY_N score columns and label them Q1–QN.
 *         maxMark is now derived from student scores only, not from aggregate
 *         rows that contain inflated values (class averages, totals, etc.).
 */

/** Non-score column names in an Educake export */
const EDUCAKE_META_KEYS = new Set([
  'Start Date', 'End Date', 'Year', 'Class', 'Questions',
  'Main Topics', 'Specification Points',
])

/**
 * Returns true when the parsed rows look like an Educake export.
 * SheetJS reads the first Excel row as column names, so an Educake file
 * ends up with 'Start Date', 'End Date', 'Year', 'Class', 'Questions' as keys.
 */
function isEducakeFormat(keys) {
  return (
    keys.includes('Start Date') &&
    keys.includes('End Date') &&
    keys.includes('Year') &&
    keys.includes('Class')
  )
}

/**
 * Returns true only if the cell value looks like a real student name:
 * at least two words, each word containing only letters/hyphens/apostrophes.
 * Filters out metadata rows (empty, single-word labels, numeric cells).
 */
function isValidStudentName(value) {
  if (value === null || value === undefined) return false
  const name = String(value).trim()
  if (!name) return false
  const parts = name.split(/\s+/)
  if (parts.length < 2) return false
  return parts.every(p => /^[A-Za-z][A-Za-z'\-]*$/.test(p))
}

// ---------------------------------------------------------------------------
// Educake-specific summary
// ---------------------------------------------------------------------------

function computeEducakeSummary(rows, keys) {
  // Student rows: both first name ('Start Date') and last name ('End Date') are
  // non-empty strings, and 'Start Date' is not a date value or the 'All Students'
  // header label that appears a few rows before the real data.
  const studentRows = rows.filter(row => {
    const firstName = String(row['Start Date'] || '').trim()
    const lastName  = String(row['End Date']   || '').trim()
    if (!firstName || !lastName) return false
    if (firstName === 'All Students') return false
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(firstName)) return false
    return true
  })

  if (studentRows.length === 0) return null

  // Read the question count from the first metadata row that has a numeric
  // value in the 'Questions' column (e.g. row 0 has Questions: 19).
  let questionCount = 0
  for (const row of rows) {
    const q = Number(row['Questions'])
    if (!isNaN(q) && q > 0) { questionCount = q; break }
  }

  // Educake exports several unnamed aggregate columns (rank, subtotals, total,
  // percentage) BEFORE the per-question score columns.  All unnamed columns are
  // mapped by SheetJS to __EMPTY, __EMPTY_1, __EMPTY_2 … in left-to-right order.
  // The individual question scores are always the LAST `questionCount` of these
  // keys, so we sort them numerically and take the tail.
  const allEmptyKeys = Object.keys(studentRows[0])
    .filter(k => k === '__EMPTY' || /^__EMPTY_\d+$/.test(k))
    .sort((a, b) => {
      const na = a === '__EMPTY' ? 0 : parseInt(a.slice('__EMPTY_'.length), 10)
      const nb = b === '__EMPTY' ? 0 : parseInt(b.slice('__EMPTY_'.length), 10)
      return na - nb
    })
  const rawKeys = allEmptyKeys.slice(-questionCount)
  const questionLabels = rawKeys.map((_, i) => `Q${i + 1}`)

  const students = studentRows.map(row => {
    const name   = `${String(row['Start Date']).trim()} ${String(row['End Date']).trim()}`
    const scores = rawKeys.map(k => {
      const v = Number(row[k])
      return isNaN(v) ? 0 : v
    })
    const total = scores.reduce((a, b) => a + b, 0)
    return { name, scores, total }
  })

  return buildSummary(students, questionLabels)
}

// ---------------------------------------------------------------------------
// Generic summary (non-Educake)
// ---------------------------------------------------------------------------

function computeGenericSummary(rows, keys) {
  // --- Identify name column ---
  const nameKey =
    keys.find(k => /^(student[\s_]?name|name|pupil|student)$/i.test(k.trim())) ||
    keys[0]

  // --- Identify question / mark columns ---
  const numericKeys = keys.filter(k => {
    if (k === nameKey) return false
    if (k.startsWith('__EMPTY')) return false
    if (/total|score|mark|grade|result/i.test(k)) return false
    const numericVals = rows
      .map(r => r[k])
      .filter(v => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number)
    if (numericVals.length < rows.length * 0.3) return false
    const maxVal = Math.max(...numericVals)
    if (maxVal > 20) return false
    return true
  })

  const questionKeys = numericKeys.length > 0
    ? numericKeys
    : keys.filter(k => k !== nameKey && !k.startsWith('__EMPTY'))

  const students = rows
    .filter(row => isValidStudentName(row[nameKey]))
    .map(row => {
      const name   = String(row[nameKey]).trim()
      const scores = questionKeys.map(k => {
        const v = Number(row[k])
        return isNaN(v) ? 0 : v
      })
      const total = scores.reduce((a, b) => a + b, 0)
      return { name, scores, total }
    })

  return buildSummary(students, questionKeys)
}

// ---------------------------------------------------------------------------
// Shared summary builder
// ---------------------------------------------------------------------------

/**
 * @param {Array<{name,scores,total}>} students
 * @param {string[]} questionLabels  Human-readable label for each score column
 */
function buildSummary(students, questionLabels) {
  if (students.length === 0) return null

  const nonCompleters = students.filter(s => s.total === 0).map(s => s.name)
  const completers    = students.filter(s => s.total > 0)

  const questions = questionLabels.map((label, i) => {
    const completerVals = completers.map(s => s.scores[i]).filter(v => !isNaN(v))
    const avg     = completerVals.length > 0
      ? completerVals.reduce((a, b) => a + b, 0) / completerVals.length
      : 0

    // Derive maxMark from the highest score any student achieved on this question.
    // This avoids inflated values from aggregate/metadata rows in the raw sheet.
    const allVals = students.map(s => s.scores[i]).filter(v => !isNaN(v))
    const maxMark = allVals.length > 0 ? Math.max(...allVals) : 0

    return {
      label,
      maxMark,
      average:    Math.round(avg * 10) / 10,
      averagePct: maxMark > 0 ? Math.round((avg / maxMark) * 100) : null,
    }
  })

  const sorted         = [...completers].sort((a, b) => b.total - a.total)
  const topStudents    = sorted.slice(0, 3).map(s => ({ name: s.name, total: s.total }))
  const bottomStudents = sorted.slice(-3).reverse().map(s => ({ name: s.name, total: s.total }))

  const classTotalMax = questions.reduce((sum, q) => sum + q.maxMark, 0)
  const classAverage  = completers.length > 0
    ? Math.round(
        (completers.reduce((sum, s) => sum + s.total, 0) / completers.length) * 10
      ) / 10
    : 0

  return {
    studentCount: students.length,
    questions,
    nonCompleters,
    topStudents,
    bottomStudents,
    classAverage,
    classTotalMax,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeClassSummary(rows) {
  if (!rows || rows.length === 0) return null

  const keys = Object.keys(rows[0])

  if (isEducakeFormat(keys)) {
    return computeEducakeSummary(rows, keys)
  }

  return computeGenericSummary(rows, keys)
}

/**
 * Format the class summary as a readable string for the Claude prompt.
 */
export function formatSummaryForPrompt(summary) {
  const lines = []

  lines.push(`Students: ${summary.studentCount} total, ${summary.nonCompleters.length} non-completers`)
  lines.push(`Class average: ${summary.classAverage} / ${summary.classTotalMax}`)
  lines.push('')

  lines.push('Per-question averages:')
  summary.questions.forEach(q => {
    const pct = q.averagePct !== null ? ` (${q.averagePct}%)` : ''
    lines.push(`  ${q.label}: avg ${q.average}/${q.maxMark}${pct}`)
  })
  lines.push('')

  if (summary.nonCompleters.length > 0) {
    lines.push(`Non-completers (score = 0): ${summary.nonCompleters.join(', ')}`)
    lines.push('')
  }

  if (summary.topStudents.length > 0) {
    lines.push('Top performers:')
    summary.topStudents.forEach(s => lines.push(`  ${s.name}: ${s.total}`))
    lines.push('')
  }

  if (summary.bottomStudents.length > 0) {
    lines.push('Lowest performers (excluding non-completers):')
    summary.bottomStudents.forEach(s => lines.push(`  ${s.name}: ${s.total}`))
  }

  return lines.join('\n')
}
