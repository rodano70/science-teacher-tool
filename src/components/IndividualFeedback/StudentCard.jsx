import { useState } from 'react'
import EditableItem from '../shared/EditableItem'

function parseBreakdown(breakdown) {
  if (!breakdown) return {}
  const result = {}
  breakdown.split(', ').forEach(part => {
    const colonIdx = part.indexOf(':')
    if (colonIdx === -1) return
    const key = part.slice(0, colonIdx).trim()
    const val = part.slice(colonIdx + 1).trim()
    result[key] = parseInt(val, 10)
  })
  return result
}

export default function StudentCard({ student, threshold, maxTotal, questionTexts, onChange }) {
  const isNonCompleter = student.isNonCompleter || (!student.ebi && !student.to_improve)

  const effectiveMaxTotal = maxTotal ?? student.maxTotal ?? 1
  const scorePct = effectiveMaxTotal > 0 && student.total != null
    ? Math.round((student.total / effectiveMaxTotal) * 100)
    : null

  const needsReview = !isNonCompleter && scorePct !== null && threshold != null && scorePct < threshold

  const scoreLabel = student.total != null && effectiveMaxTotal > 1
    ? `${student.total} / ${effectiveMaxTotal}`
    : (student.score && student.score !== 'Did not submit' ? student.score : null)

  // Pill strip hover
  const [hoveredPillIndex, setHoveredPillIndex] = useState(null)

  const parsedBreakdown = !isNonCompleter ? parseBreakdown(student.breakdown) : {}
  const showPillStrip = !isNonCompleter && Array.isArray(questionTexts) && questionTexts.length > 0

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

        {/* Question pill strip */}
        {showPillStrip && (
          <div style={pillStyles.strip}>
            {questionTexts.map((qText, i) => {
              const score = parsedBreakdown[`Q${i + 1}`]
              const isCorrect = score > 0
              return (
                <div
                  key={i}
                  style={{
                    ...pillStyles.pill,
                    background: isCorrect
                      ? 'var(--color-primary-container)'
                      : 'rgba(254,137,131,0.5)',
                  }}
                  onMouseEnter={() => setHoveredPillIndex(i)}
                  onMouseLeave={() => setHoveredPillIndex(null)}
                >
                  {hoveredPillIndex === i && (
                    <div style={pillStyles.popover}>
                      <div style={pillStyles.popoverHeader}>
                        <span style={pillStyles.popoverQuestion}>Q{i + 1}</span>
                        <span style={{
                          ...pillStyles.popoverStatus,
                          color: isCorrect ? 'var(--color-primary)' : 'var(--color-error)',
                        }}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p style={pillStyles.popoverBody}>{qText}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right column — three-column grid */}
      <div style={styles.right}>
        <div style={styles.grid}>

          {/* WWW */}
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-primary)' }}>WWW</span>
            <EditableItem
              variant="card"
              value={student.www ?? ''}
              onChange={newVal => onChange?.('www', newVal)}
              discardOnEscape={false}
              textStyle={styles.sectionText}
            />
          </div>

          {/* EBI */}
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-on-surface-variant)' }}>EBI</span>
            <EditableItem
              variant="card"
              value={student.ebi ?? ''}
              onChange={newVal => onChange?.('ebi', newVal)}
              discardOnEscape={false}
              textStyle={styles.sectionText}
            />
          </div>

          {/* To Improve */}
          <div>
            <span style={{ ...styles.sectionLabel, color: 'var(--color-on-tertiary-container)' }}>To Improve</span>
            <EditableItem
              variant="card"
              value={student.to_improve ?? ''}
              onChange={newVal => onChange?.('toImprove', newVal)}
              discardOnEscape={false}
              textStyle={styles.sectionText}
            />
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

const pillStyles = {
  strip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
    marginTop: '10px',
  },
  pill: {
    position: 'relative',
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    flexShrink: 0,
    cursor: 'default',
  },
  popover: {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    left: 0,
    zIndex: 100,
    background: 'var(--color-surface-container-lowest)',
    boxShadow: '0 4px 16px rgba(8,50,97,0.12)',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    maxWidth: '320px',
    minWidth: '180px',
    pointerEvents: 'none',
  },
  popoverHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  popoverQuestion: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  popoverStatus: {
    fontSize: '11px',
    fontWeight: '600',
  },
  popoverBody: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.5,
    color: 'var(--color-on-surface-variant)',
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
