import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function downloadFeedbackDoc({ feedbackData, subject, topic, setFeedbackSuccess }) {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const docChildren = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({ text: `${subject} — ${topic}`, bold: true }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Individual Feedback  ·  ${dateStr}`, italics: true, size: 22, color: '555555' }),
      ],
      spacing: { after: 400 },
    }),
  ]

  feedbackData.forEach((student, idx) => {
    const isNonCompleter = student.isNonCompleter || (!student.ebi && !student.to_improve)

    const nameText = student.score && student.score !== 'Did not submit'
      ? `${student.name}  —  ${student.score}`
      : student.name

    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: nameText, bold: true })],
        spacing: { before: idx === 0 ? 0 : 300, after: 160 },
        border: {
          bottom: { color: 'DDDDDD', size: 6, space: 1, style: 'single' },
        },
      }),
    )

    if (isNonCompleter) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: student.www ?? 'No submission recorded.', italics: true, color: '888888' })],
          spacing: { after: 200 },
        }),
      )
    } else {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'WWW  ', bold: true, color: '1d4ed8' }),
            new TextRun({ text: '(What Went Well)', italics: true, color: '888888', size: 18 }),
          ],
          spacing: { before: 80, after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: student.www ?? '' })],
          spacing: { after: 160 },
          indent: { left: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'EBI  ', bold: true, color: '374151' }),
            new TextRun({ text: '(Even Better If)', italics: true, color: '888888', size: 18 }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: student.ebi ?? '' })],
          spacing: { after: 160 },
          indent: { left: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'To Improve  ', bold: true, color: '4f376b' }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: student.to_improve ?? '' })],
          spacing: { after: 200 },
          indent: { left: 200 },
        }),
      )
    }

    if (idx < feedbackData.length - 1) {
      docChildren.push(new Paragraph({ thematicBreak: true, spacing: { after: 200 } }))
    }
  })

  const doc = new Document({ sections: [{ children: docChildren }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${subject} - ${topic} - Individual Feedback - ${new Date().toISOString().slice(0, 10)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  setFeedbackSuccess(true)
}

export async function downloadWCFDoc({ wcfData, examBoard, subject, topic, statCards, setSuccess }) {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])

  const children = []

  // ── Title block ───────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: topic || 'Whole Class Feedback', bold: true })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${examBoard} ${subject}  ·  Whole Class Feedback  ·  ${dateStr}`, italics: true, size: 22, color: '555555' }),
      ],
      spacing: { after: 160 },
    }),
  )

  // ── Class stats summary ───────────────────────────────────────────────────
  if (statCards) {
    const statParts = []
    if (statCards.classAvgPct != null) statParts.push(`Class average: ${statCards.classAvgPct}%`)
    if (statCards.completersCount != null) statParts.push(`Completers: ${statCards.completersCount}`)
    if (statCards.nonCompletersCount != null && statCards.nonCompletersCount > 0) statParts.push(`Absent/non-completers: ${statCards.nonCompletersCount}`)
    if (statCards.minScore != null && statCards.maxScore != null) statParts.push(`Range: ${statCards.minScore}–${statCards.maxScore} / ${statCards.classTotalMax}`)

    if (statParts.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: statParts.join('   |   '), color: '374151', size: 20 })],
          spacing: { after: 400 },
          border: {
            bottom: { color: 'DDDDDD', size: 6, space: 4, style: 'single' },
          },
        }),
      )
    }
  }

  // ── Assessment Diagnosis ──────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Assessment Diagnosis', bold: true })],
      spacing: { before: 320, after: 200 },
    }),
  )

  const successes = toArray(wcfData.key_successes)
  if (successes.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'What the class understood', bold: true, color: '1d4ed8' })],
        spacing: { after: 100 },
      }),
    )
    successes.forEach(s => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: s })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  const misconceptions = toArray(wcfData.key_misconceptions)
  if (misconceptions.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Misconceptions to reteach', bold: true, color: 'b91c1c' })],
        spacing: { before: 200, after: 100 },
      }),
    )
    misconceptions.forEach(m => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: m })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  const errors = toArray(wcfData.little_errors)
  if (errors.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Surface errors to address briefly', bold: true, color: '555555' })],
        spacing: { before: 200, after: 100 },
      }),
    )
    errors.forEach(e => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: e })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  // ── Teaching Implications ─────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Teaching Implications', bold: true })],
      spacing: { before: 360, after: 200 },
      border: {
        top: { color: 'DDDDDD', size: 6, space: 4, style: 'single' },
      },
    }),
  )

  if (wcfData.immediate_action) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Immediate — next lesson', bold: true, color: '374151' })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: wcfData.immediate_action })],
        spacing: { after: 200 },
        indent: { left: 200 },
      }),
    )
  }

  const ltList = toArray(wcfData.long_term_implications)
  if (ltList.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Long-term — scheme of work implications', bold: true, color: '374151' })],
        spacing: { after: 100 },
      }),
    )
    ltList.forEach(lt => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: lt })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  // ── Individual Signals ────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Individual Signals', bold: true })],
      spacing: { before: 360, after: 200 },
      border: {
        top: { color: 'DDDDDD', size: 6, space: 4, style: 'single' },
      },
    }),
  )

  const praise = toArray(wcfData.students_to_praise)
  if (praise.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Praise in class', bold: true, color: '4f376b' })],
        spacing: { after: 100 },
      }),
    )
    praise.forEach(p => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: p })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  const concerns = toArray(wcfData.individual_concerns)
  if (concerns.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Students needing attention', bold: true, color: 'b91c1c' })],
        spacing: { before: 200, after: 100 },
      }),
    )
    concerns.forEach(c => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: c })],
          spacing: { after: 80 },
        }),
      )
    })
  }

  const doc = new Document({ sections: [{ children }] })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${subject} - ${topic} - Whole Class Feedback - ${new Date().toISOString().slice(0, 10)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  if (setSuccess) setSuccess(true)
}
