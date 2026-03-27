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
      <p style={styles.sectionLabel}>Assessment Diagnosis</p>
      <div style={styles.grid}>

        {/* ── Left: What the class understood ───────────────────────────── */}
        <div style={styles.successCard} className="print-card">
          <div style={styles.cardHeader}>
            <span className="material-symbols-outlined filled" style={styles.iconPrimary}>verified</span>
            <h3 style={styles.successHeading}>What the class understood</h3>
          </div>
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
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={styles.iconError}>psychology_alt</span>
              <h3 style={styles.misconceptionHeading}>Misconceptions to reteach</h3>
            </div>
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
            <div style={styles.cardHeader}>
              <span className="material-symbols-outlined" style={styles.iconOutline}>pending</span>
              <h3 style={styles.errorsHeading}>Surface errors to address briefly</h3>
            </div>
            {errorList.length > 0 ? (
              <ul style={styles.dotList}>
                {errorList.map((item, i) => (
                  <li key={i} style={styles.dotItem}>
                    <span style={styles.dotBullet} />
                    <span style={styles.itemText}>{item}</span>
                  </li>
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
  sectionLabel: {
    margin: '0 0 14px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-on-surface-variant)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '16px',
    alignItems: 'start',
  },

  /* ── Left: successes ─────────────────────────────────────────────────── */
  successCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '18px 20px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  iconPrimary: {
    fontSize: '20px',
    color: 'var(--color-primary)',
  },
  successHeading: {
    margin: 0,
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
    borderRadius: '12px',
    padding: '16px 18px',
    border: '1px solid rgba(159, 64, 61, 0.10)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  iconError: {
    fontSize: '20px',
    color: 'var(--color-error)',
  },
  misconceptionHeading: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    color: '#752121',
    letterSpacing: '0.01em',
  },
  errorsCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '16px 18px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  iconOutline: {
    fontSize: '20px',
    color: 'var(--color-on-surface-variant)',
  },
  errorsHeading: {
    margin: 0,
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
    color: 'var(--color-on-surface-variant)',
  },
  dotList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dotItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  dotBullet: {
    flexShrink: 0,
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-outline)',
    marginTop: '5px',
  },
  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
