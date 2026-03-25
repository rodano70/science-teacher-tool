import StudentCard from './StudentCard'

export default function IndividualFeedbackPanel({ feedbackData, feedbackSuccess, onDownload }) {
  return (
    <div style={styles.wrapper}>
      {/* Panel header */}
      <div style={styles.panelHeader}>
        <div>
          <h3 style={styles.panelTitle}>Individual Student Feedback</h3>
          <p style={styles.panelMeta}>
            {feedbackData.length} student{feedbackData.length !== 1 ? 's' : ''} — feedback ready to download
          </p>
        </div>
        <div style={styles.downloadArea}>
          <button
            className="btn-download"
            style={styles.downloadButton}
            type="button"
            onClick={onDownload}
          >
            Download as Word Document
          </button>
          {feedbackSuccess && (
            <p style={styles.successNote}>Document downloaded.</p>
          )}
        </div>
      </div>

      {/* Student cards */}
      <div style={styles.cardList}>
        {feedbackData.map((student, i) => (
          <StudentCard key={i} student={student} />
        ))}
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
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  panelTitle: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
  },
  panelMeta: {
    margin: '0',
    fontSize: '13px',
    color: '#6b7280',
  },
  downloadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  },
  downloadButton: {
    padding: '9px 18px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
  successNote: {
    margin: '0',
    fontSize: '12px',
    color: '#15803d',
    fontWeight: '500',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
}
