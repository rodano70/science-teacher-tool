/**
 * WCFSheet — renders the Whole Class Feedback sheet from the structured JSON
 * returned by Claude. Six sections matching the school WCF template.
 */
import FeedbackSection from './FeedbackSection'

export default function ClassFeedbackPanel({ data, examBoard, subject, topic }) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function handlePrint() {
    window.print()
  }

  return (
    <div style={styles.wrapper}>
      {/* Print button — hidden when actually printing via @media print */}
      <div style={styles.printBar} className="no-print">
        <button className="btn-print" style={styles.printButton} onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      <div style={styles.sheet} id="wcf-sheet">
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Whole Class Feedback Sheet</h2>
          <div style={styles.meta}>
            <span>{examBoard} {subject} — {topic}</span>
            <span style={styles.date}>{today}</span>
          </div>
        </div>

        {/* Section 1: Key Successes */}
        <FeedbackSection
          number="1"
          title="Key Successes"
          color="#166534"
          bg="#f0fdf4"
          border="#bbf7d0"
          items={data.key_successes}
        />

        {/* Section 2: Key Misconceptions */}
        <FeedbackSection
          number="2"
          title="Key Misconceptions & Reteach Actions"
          color="#9a3412"
          bg="#fff7ed"
          border="#fed7aa"
          items={data.key_misconceptions}
        />

        {/* Section 3: Individual Student Concerns */}
        <FeedbackSection
          number="3"
          title="Individual Student Concerns"
          color="#1e40af"
          bg="#eff6ff"
          border="#bfdbfe"
          items={data.individual_concerns}
        />

        {/* Section 4: Little Errors */}
        <FeedbackSection
          number="4"
          title="Little Errors (Command Words, Units, Spelling)"
          color="#6b21a8"
          bg="#faf5ff"
          border="#e9d5ff"
          items={data.little_errors}
        />

        {/* Section 5: Students to Praise */}
        <FeedbackSection
          number="5"
          title="Students to Praise"
          color="#065f46"
          bg="#ecfdf5"
          border="#a7f3d0"
          items={data.students_to_praise}
        />

        {/* Section 6: Long-term Implications */}
        <FeedbackSection
          number="6"
          title="Long-term Implications (Scheme of Work)"
          color="#7c2d12"
          bg="#fff7ed"
          border="#fed7aa"
          items={data.long_term_implications}
        />
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    marginTop: '32px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '28px',
  },
  printBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '14px',
  },
  printButton: {
    padding: '9px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#374151',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  sheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  header: {
    backgroundColor: '#1e3150',
    color: '#ffffff',
    padding: '20px 24px',
  },
  title: {
    margin: '0 0 6px',
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.01em',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#93c5fd',
    flexWrap: 'wrap',
    gap: '8px',
  },
  date: {
    color: '#7dd3fc',
  },
}
