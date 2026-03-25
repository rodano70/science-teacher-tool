import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function downloadFeedbackDoc({ feedbackData, subject, topic, setFeedbackSuccess }) {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const docChildren = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({ text: `${subject} — ${topic} — Individual Feedback — ${dateStr}` }),
      ],
      spacing: { after: 400 },
    }),
  ]

  feedbackData.forEach((student, idx) => {
    const isNonCompleter = !student.ebi && !student.to_improve

    const nameText = student.score && student.score !== 'Did not submit'
      ? `${student.name}  —  ${student.score}`
      : student.name

    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: nameText, bold: true })],
        spacing: { before: idx === 0 ? 0 : 200, after: 160 },
      }),
    )

    if (isNonCompleter) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: student.www ?? 'No submission recorded.', italics: true })],
          spacing: { after: 200 },
        }),
      )
    } else {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'WWW: ', bold: true }),
            new TextRun({ text: student.www ?? '' }),
          ],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'EBI: ', bold: true }),
            new TextRun({ text: student.ebi ?? '' }),
          ],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'To Improve: ', bold: true }),
            new TextRun({ text: student.to_improve ?? '' }),
          ],
          spacing: { after: 200 },
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
