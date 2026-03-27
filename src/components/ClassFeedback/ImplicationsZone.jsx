/**
 * ImplicationsZone — Zone 4 of the WCF sheet.
 * Full-width tertiary-container card split into two columns:
 *   Left:  "Immediate — next lesson"       (bolt icon)
 *   Right: "Long-term — SOW implications"  (history_edu icon)
 * Separated by a vertical rule.
 *
 * Props:
 *   immediate_action       — single string (new field)
 *   long_term_implications — array of strings
 */
export default function ImplicationsZone({ immediate_action, long_term_implications }) {
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])
  const ltList = toArray(long_term_implications)

  return (
    <div style={styles.wrapper} className="print-page-break">
      <div style={styles.card} className="print-card">
        <div style={styles.columns}>

          {/* ── Left: Immediate ─────────────────────────────────────────── */}
          <div style={styles.column}>
            <div style={styles.colHeader}>
              <span className="material-symbols-outlined" style={styles.iconTertiary}>bolt</span>
              <h3 style={styles.colHeading}>Immediate — next lesson</h3>
            </div>
            <p style={styles.immediateText}>
              {immediate_action || 'No immediate action identified.'}
            </p>
          </div>

          {/* ── Vertical rule ───────────────────────────────────────────── */}
          <div style={styles.vRule} />

          {/* ── Right: Long-term ────────────────────────────────────────── */}
          <div style={styles.column}>
            <div style={styles.colHeader}>
              <span className="material-symbols-outlined" style={styles.iconTertiary}>history_edu</span>
              <h3 style={styles.colHeading}>Long-term — SOW implications</h3>
            </div>
            {ltList.length > 0 ? (
              <ul style={styles.ltList}>
                {ltList.map((item, i) => (
                  <li key={i} style={styles.ltItem}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.empty}>No long-term implications identified.</p>
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
  card: {
    backgroundColor: 'rgba(217, 215, 248, 0.30)',
    borderRadius: '10px',
    padding: '20px 24px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
  },
  columns: {
    display: 'flex',
    gap: '0',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    padding: '0 20px',
  },
  vRule: {
    width: '1px',
    alignSelf: 'stretch',
    backgroundColor: 'var(--color-tertiary-container)',
    flexShrink: 0,
  },
  colHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  iconTertiary: {
    fontSize: '20px',
    color: 'var(--color-tertiary)',
  },
  colHeading: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-on-tertiary-container)',
    letterSpacing: '0.01em',
  },
  immediateText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#374151',
  },
  ltList: {
    margin: 0,
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  ltItem: {
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
