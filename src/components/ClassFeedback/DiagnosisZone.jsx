/**
 * DiagnosisZone — Zone 2 of the WCF sheet.
 * Organises three data arrays into a single visual hierarchy:
 *   Left (7/12): "What the class understood" — successes with primary left-bar decorators
 *   Right (5/12, stacked):
 *     Top: "Misconceptions to reteach" — error-tinted card
 *     Bottom: "Surface errors to address briefly" — surface-container-low card
 *
 * Props:
 *   successes    — key_successes array
 *   misconceptions — key_misconceptions array
 *   little_errors  — little_errors array
 */
export default function DiagnosisZone({ successes, misconceptions, little_errors }) {
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])
  const successList = toArray(successes)
  const misconceptionList = toArray(misconceptions)
  const errorList = toArray(little_errors)

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>

        {/* ── Left: What the class understood ───────────────────────────── */}
        <div style={styles.successCard} className="print-card">
          <h3 style={styles.successHeading}>What the class understood</h3>
          {successList.length > 0 ? (
            <ul style={styles.barList}>
              {successList.map((item, i) => (
                <li key={i} style={styles.barItem}>
                  <span style={styles.primaryBar} />
                  <span style={styles.itemText}>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.empty}>No successes identified.</p>
          )}
        </div>

        {/* ── Right: two stacked cards ───────────────────────────────────── */}
        <div style={styles.rightStack}>

          {/* Misconceptions to reteach */}
          <div style={styles.misconceptionCard} className="print-card">
            <h3 style={styles.misconceptionHeading}>Misconceptions to reteach</h3>
            {misconceptionList.length > 0 ? (
              <ul style={styles.barList}>
                {misconceptionList.map((item, i) => (
                  <li key={i} style={styles.barItem}>
                    <span style={styles.errorBar} />
                    <span style={styles.itemText}>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={styles.empty}>No misconceptions identified.</p>
            )}
          </div>

          {/* Surface errors to address briefly */}
          <div style={styles.errorsCard} className="print-card">
            <h3 style={styles.errorsHeading}>Surface errors to address briefly</h3>
            {errorList.length > 0 ? (
              <ul style={styles.dotList}>
                {errorList.map((item, i) => (
                  <li key={i} style={styles.dotItem}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.empty}>No surface errors identified.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '16px',
    alignItems: 'start',
  },

  /* ── Left: successes ─────────────────────────────────────────────────── */
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '18px 20px',
    border: '1px solid #e5e7eb',
    height: '100%',
  },
  successHeading: {
    margin: '0 0 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '0.01em',
  },

  /* ── Right stack ─────────────────────────────────────────────────────── */
  rightStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  misconceptionCard: {
    backgroundColor: 'rgba(254, 137, 131, 0.12)',
    borderRadius: '8px',
    padding: '16px 18px',
    border: '1px solid rgba(159, 64, 61, 0.12)',
  },
  misconceptionHeading: {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-error)',
    letterSpacing: '0.01em',
  },
  errorsCard: {
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '8px',
    padding: '16px 18px',
    border: '1px solid var(--color-outline-variant)',
  },
  errorsHeading: {
    margin: '0 0 10px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    letterSpacing: '0.01em',
  },

  /* ── Shared list styles ──────────────────────────────────────────────── */
  barList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  barItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  primaryBar: {
    flexShrink: 0,
    width: '3px',
    minHeight: '16px',
    alignSelf: 'stretch',
    borderRadius: '2px',
    backgroundColor: 'var(--color-primary)',
    marginTop: '2px',
  },
  errorBar: {
    flexShrink: 0,
    width: '3px',
    minHeight: '16px',
    alignSelf: 'stretch',
    borderRadius: '2px',
    backgroundColor: 'var(--color-error)',
    marginTop: '2px',
  },
  itemText: {
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#374151',
  },
  dotList: {
    margin: 0,
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  dotItem: {
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#374151',
  },
  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
