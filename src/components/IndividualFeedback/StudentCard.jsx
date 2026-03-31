export default function StudentCard({ student, threshold, maxTotal }) {
  const isNonCompleter = student.isNonCompleter || (!student.ebi && !student.to_improve)

  const effectiveMaxTotal = maxTotal ?? student.maxTotal ?? 1
  const scorePct = effectiveMaxTotal > 0 && student.total != null
    ? Math.round((student.total / effectiveMaxTotal) * 100)
    : null

  const needsReview = !isNonCompleter && scorePct !== null && threshold != null && scorePct < threshold

  const scoreLabel = student.total != null && effectiveMaxTotal > 1
    ? `${student.total} / ${effectiveMaxTotal}`
    : (student.score && student.score !== 'Did not submit' ? student.score : null)

  if (isNonCompleter) {
    return (
      <article style={stylesNC.card}>
        <div style={stylesNC.left}>
          <h4 style={styles.name}>{student.name}</h4>
          <span style={stylesNC.badge}>No Submission</span>
        </div>
        <div style={stylesNC.right}>
          <div style={stylesNC.placeholder}>
            <span className="material-symbols-outlined" style={stylesNC.icon}>error_outline</span>
            <p style={stylesNC.message}>Assessment not submitted. Feedback not generated.</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article style={styles.card}>
      {/* Left column */}
      <div style={styles.left}>
        <h4 style={styles.name}>{student.name}</h4>
        {scoreLabel && (
          <span style={styles.scoreBadge}>{scoreLabel}</span>
        )}
        {needsReview && (
          <span style={styles.needsReviewTag}>Needs Review</span>
        )}
      </div>

      {/* Right column — three-column grid */}
      <div style={styles.right}>
        <div style={styles.grid}>
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-primary)' }}>WWW</span>
            <p style={styles.sectionText}>{student.www ?? ''}</p>
          </div>
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-on-surface-variant)' }}>EBI</span>
            <p style={styles.sectionText}>{student.ebi ?? ''}</p>
          </div>
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-on-tertiary-container)' }}>To Improve</span>
            <p style={styles.sectionText}>{student.to_improve ?? ''}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'row',
    gap: '32px',
    background: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(8,50,97,0.05)',
  },
  left: {
    width: '22%',
    flexShrink: 0,
  },
  name: {
    margin: '0 0 8px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  scoreBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: 'var(--color-surface-container-high)',
    color: 'var(--color-on-surface-variant)',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
  },
  needsReviewTag: {
    display: 'inline-block',
    padding: '2px 8px',
    marginTop: '6px',
    marginLeft: '6px',
    background: 'var(--color-error-container)',
    color: 'var(--color-on-error-container)',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  right: {
    flex: 1,
    minWidth: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  sectionText: {
    margin: '0',
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--color-on-surface)',
  },
}

const stylesNC = {
  card: {
    display: 'flex',
    flexDirection: 'row',
    gap: '32px',
    background: 'var(--color-surface-container-low)',
    borderLeft: '3px solid var(--color-error-container)',
    borderRadius: '12px',
    padding: '32px',
    opacity: 0.8,
  },
  left: {
    width: '22%',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: 'var(--color-error-container)',
    color: 'var(--color-on-error-container)',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed rgba(147, 179, 233, 0.3)',
    borderRadius: '12px',
    padding: '32px',
    gap: '8px',
  },
  icon: {
    fontSize: '28px',
    color: 'var(--color-error)',
  },
  message: {
    margin: '0',
    fontSize: '13px',
    fontStyle: 'italic',
    color: 'var(--color-on-surface-variant)',
    textAlign: 'center',
  },
}
