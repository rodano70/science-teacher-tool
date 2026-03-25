export default function StudentCard({ student }) {
  const isNonCompleter = !student.ebi && !student.to_improve

  const nameText = student.score && student.score !== 'Did not submit'
    ? `${student.name}  —  ${student.score}`
    : student.name

  return (
    <div style={styles.card}>
      <p style={styles.name}>{nameText}</p>

      {isNonCompleter ? (
        <p style={styles.nonCompleter}>{student.www ?? 'No submission recorded.'}</p>
      ) : (
        <>
          <p style={styles.field}>
            <span style={styles.label}>WWW: </span>{student.www ?? ''}
          </p>
          <p style={styles.field}>
            <span style={styles.label}>EBI: </span>{student.ebi ?? ''}
          </p>
          <p style={styles.field}>
            <span style={styles.label}>To Improve: </span>{student.to_improve ?? ''}
          </p>
        </>
      )}
    </div>
  )
}

const styles = {
  card: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  name: {
    margin: '0 0 10px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  field: {
    margin: '0 0 6px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
  },
  label: {
    fontWeight: '600',
  },
  nonCompleter: {
    margin: '0',
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#6b7280',
  },
}
