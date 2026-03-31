/**
 * ImplicationsZone — Zone 4 of the WCF sheet.
 * Full-width tertiary-container card split into two equal columns via CSS grid:
 *   Left:  "Immediate — next lesson"       (bolt icon)
 *   Right: "Long-term — SOW implications"  (history_edu icon)
 * Separated by a 1px vertical rule (40px grid column, centred).
 *
 * Props:
 *   immediate_action       — single string
 *   long_term_implications — array of strings
 *   onEdit(field, index, value) — optional edit callback
 */
import { useState, useRef, useEffect } from 'react'

function EditableItem({ value, onChange, textStyle, multiline }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const ref = useRef(null)

  useEffect(() => { setVal(value) }, [value])

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [editing])

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={val}
        onChange={e => {
          setVal(e.target.value)
          if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.height = ref.current.scrollHeight + 'px'
          }
        }}
        onBlur={() => { setEditing(false); onChange(val) }}
        onKeyDown={e => { if (e.key === 'Escape') { setVal(value); setEditing(false) } }}
        style={{ ...editStyles.textarea, ...(textStyle || {}) }}
      />
    )
  }

  return (
    <span
      className="wcf-editable"
      onClick={() => onChange !== undefined ? setEditing(true) : undefined}
      style={{ ...editStyles.span, ...(textStyle || {}), cursor: onChange ? 'text' : 'default' }}
      title={onChange ? 'Click to edit' : undefined}
    >
      {val}
      {onChange && <span style={editStyles.pencil} className="wcf-pencil">✏</span>}
    </span>
  )
}

const editStyles = {
  span: {
    display: 'block',
    borderRadius: '4px',
    padding: '1px 3px',
    marginLeft: '-3px',
    position: 'relative',
  },
  pencil: {
    marginLeft: '5px',
    fontSize: '10px',
    opacity: 0,
    transition: 'opacity 0.15s',
    pointerEvents: 'none',
    verticalAlign: 'middle',
  },
  textarea: {
    width: '100%',
    border: '1px solid var(--color-primary)',
    borderRadius: '4px',
    padding: '3px 6px',
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container-low)',
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'block',
    minHeight: '22px',
  },
}

export default function ImplicationsZone({ immediate_action, long_term_implications, onEdit }) {
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])
  const ltList = toArray(long_term_implications)

  return (
    <div style={styles.wrapper} className="print-page-break">
      <style>{`
        .wcf-editable:hover { background-color: rgba(147,179,233,0.12); }
        .wcf-editable:hover .wcf-pencil { opacity: 0.5; }
      `}</style>
      <p style={styles.sectionLabel}>Teaching Implications</p>
      <div style={styles.card} className="print-card">
        <div style={styles.columns}>

          {/* ── Left: Immediate ─────────────────────────────────────────── */}
          <div style={styles.column}>
            <div style={styles.colHeader}>
              <span className="material-symbols-outlined" style={styles.iconTertiary}>bolt</span>
              <span style={styles.colLabel}>Immediate</span>
            </div>
            <EditableItem
              value={immediate_action || 'No immediate action identified.'}
              onChange={onEdit ? (val) => onEdit('immediate_action', 0, val) : undefined}
              textStyle={styles.bodyText}
            />
          </div>

          {/* ── Vertical rule ────────────────────────────────────────────── */}
          <div style={styles.vRule} />

          {/* ── Right: Long-term ─────────────────────────────────────────── */}
          <div style={styles.column}>
            <div style={styles.colHeader}>
              <span className="material-symbols-outlined" style={styles.iconTertiary}>history_edu</span>
              <span style={styles.colLabel}>Long-term</span>
            </div>
            {ltList.length > 0 ? (
              <div style={styles.ltParagraphs}>
                {ltList.map((item, i) => (
                  <EditableItem
                    key={i}
                    value={item}
                    onChange={onEdit ? (val) => onEdit('long_term_implications', i, val) : undefined}
                    textStyle={{ ...styles.bodyText, display: 'block', marginBottom: '4px' }}
                  />
                ))}
              </div>
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
  sectionLabel: {
    margin: '0 0 14px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-on-surface-variant)',
  },
  card: {
    backgroundColor: 'rgba(217, 215, 248, 0.30)',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 40px minmax(0, 1fr)',
    gap: '0',
    alignItems: 'start',
  },
  column: {
    padding: '0 8px',
  },
  vRule: {
    width: '1px',
    alignSelf: 'stretch',
    backgroundColor: 'var(--color-tertiary-container)',
    justifySelf: 'center',
  },
  colHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  iconTertiary: {
    fontSize: '18px',
    color: 'var(--color-tertiary)',
  },
  colLabel: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    color: '#54546f',
  },
  bodyText: {
    margin: '0 0 6px',
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--color-on-surface-variant)',
  },
  ltParagraphs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
