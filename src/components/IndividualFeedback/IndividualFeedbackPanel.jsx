import StudentCard from './StudentCard'

export default function IndividualFeedbackPanel({ feedbackData, feedbackSuccess, onDownload }) {
  return (
    <div style={styles.outputBox}>
      <h3 style={styles.outputHeading}>Individual Student Feedback Ready</h3>
      <p style={styles.outputMeta}>
        Feedback generated for {feedbackData.length} student{feedbackData.length !== 1 ? 's' : ''}.
      </p>
      <button
        style={{ ...styles.button, ...styles.buttonPrimary, maxWidth: '320px' }}
        type="button"
        onClick={onDownload}
      >
        Download Feedback as Word Document
      </button>
      {feedbackSuccess && (
        <p style={styles.successText}>Document downloaded successfully.</p>
      )}

      <div style={styles.cardList}>
        {feedbackData.map((student, i) => (
          <StudentCard key={i} student={student} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  outputBox: {
    marginTop: '32px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  outputHeading: {
    margin: '0 0 8px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  outputMeta: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#6b7280',
  },
  button: {
    flex: '1',
    minWidth: '200px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
  },
  successText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#16a34a',
  },
  cardList: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
}
