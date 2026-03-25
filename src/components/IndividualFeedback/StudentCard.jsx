export default function StudentCard({ student }) {
  const isNonCompleter = !student.ebi && !student.to_improve

  const scoreLabel = student.score && student.score !== 'Did not submit'
    ? student.score
    : null

  return (
    <div style={isNonCompleter ? { ...styles.card, ...styles.cardNonCompleter } : styles.card}>
      {/* Name / score header */}
      <div style={isNonCompleter ? { ...styles.cardHeader, ...styles.cardHeaderMuted } : styles.cardHeader}>
        <span style={styles.studentName}>{student.name}</span>
        {scoreLabel && (
          <span style={styles.scoreBadge}>{scoreLabel}</span>
        )}
      </div>

      {/* Card body */}
      <div style={styles.cardBody}>
        {isNonCompleter ? (
          <p style={styles.nonCompleterNote}>{student.www ?? 'No submission recorded.'}</p>
        ) : (
          <>
            <div style={styles.section}>
              <span style={styles.sectionLabel}>What Went Well</span>
              <p style={styles.sectionText}>{student.www ?? ''}</p>
            </div>
            <div style={styles.section}>
              <span style={styles.sectionLabel}>Even Better If</span>
              <p style={styles.sectionText}>{student.ebi ?? ''}</p>
            </div>
            <div style={{ ...styles.section, marginBottom: 0 }}>
              <span style={styles.sectionLabel}>To Improve</span>
              <p style={styles.sectionText}>{student.to_improve ?? ''}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  card: {
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  cardNonCompleter: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e5e7eb',
  },
  cardHeaderMuted: {
    backgroundColor: '#f3f4f6',
  },
  studentName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
  },
  scoreBadge: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#4b5563',
    backgroundColor: '#e9ecef',
    padding: '2px 8px',
    borderRadius: '3px',
  },
  cardBody: {
    padding: '12px 16px',
  },
  section: {
    marginBottom: '10px',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '3px',
  },
  sectionText: {
    margin: '0',
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#374151',
  },
  nonCompleterNote: {
    margin: '0',
    fontSize: '13px',
    fontStyle: 'italic',
    color: '#9ca3af',
  },
}
