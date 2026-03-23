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
 */
export function computeClassSummary(rows) {
  if (!rows || rows.length === 0) return null

  const keys = Object.keys(rows[0])

  // --- Identify name column ---
  const nameKey =
    keys.find(k => /^(student[\s_]?name|name|pupil|student)$/i.test(k.trim())) ||
    keys[0]

  // --- Identify question / mark columns ---
  // Heuristic: numeric columns that are not the name column and not a "total" column.
  // We count how many rows have a numeric value for each key.
  const numericKeys = keys.filter(k => {
    if (k === nameKey) return false
    if (/total|score|mark|grade|result/i.test(k)) return false
    const numericCount = rows.filter(r => {
      const v = r[k]
      return v !== '' && !isNaN(Number(v))
    }).length
    return numericCount > rows.length * 0.3 // at least 30% of rows have a number
  })

  // If we couldn't find question columns, fall back to all numeric-ish columns
  const questionKeys = numericKeys.length > 0
    ? numericKeys
    : keys.filter(k => k !== nameKey)

  // --- Per-student totals ---
  const students = rows.map(row => {
    const name = String(row[nameKey] || '').trim() || 'Unknown'
    const scores = questionKeys.map(k => {
      const v = Number(row[k])
      return isNaN(v) ? 0 : v
    })
    const total = scores.reduce((a, b) => a + b, 0)
    return { name, scores, total }
  })

  // --- Non-completers: total score = 0 ---
  const nonCompleters = students
    .filter(s => s.total === 0)
    .map(s => s.name)

  // --- Per-question averages (only students who attempted — non-zero total) ---
  const completers = students.filter(s => s.total > 0)

  const questions = questionKeys.map((k, i) => {
    const vals = completers.map(s => s.scores[i]).filter(v => !isNaN(v))
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0

    // Try to find the max mark for this question from the data
    const maxMark = Math.max(...rows.map(r => {
      const v = Number(r[k])
      return isNaN(v) ? 0 : v
    }))

    return {
      label: k,
      maxMark,
      average: Math.round(avg * 10) / 10,
      averagePct: maxMark > 0 ? Math.round((avg / maxMark) * 100) : null,
    }
  })

  // --- Top / bottom students (excluding non-completers) ---
  const sorted = [...completers].sort((a, b) => b.total - a.total)
  const topStudents = sorted.slice(0, 3).map(s => ({ name: s.name, total: s.total }))
  const bottomStudents = sorted.slice(-3).reverse().map(s => ({ name: s.name, total: s.total }))

  const classTotalMax = questionKeys.length > 0
    ? questions.reduce((sum, q) => sum + q.maxMark, 0)
    : 0

  const classAverage = completers.length > 0
    ? Math.round(
        (completers.reduce((sum, s) => sum + s.total, 0) / completers.length) * 10
      ) / 10
    : 0

  return {
    studentCount: rows.length,
    questions,
    nonCompleters,
    topStudents,
    bottomStudents,
    classAverage,
    classTotalMax,
  }
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
