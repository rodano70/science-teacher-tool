/**
 * EditableItem — shared inline-editable text component.
 *
 * Props:
 *   value           string   — controlled display value
 *   onChange        fn|undef — (newValue) => void; undefined = read-only
 *   textStyle       object   — merged into the display element style
 *   variant         'wcf' | 'card'   (default 'wcf')
 *   discardOnEscape bool     (default true)
 *                   true  → Escape reverts edit and closes (WCF panels)
 *                   false → Escape blurs and saves (student card fields)
 *
 * Variants:
 *   'wcf'  — <span> display, Unicode ✏ pencil, primary-tinted hover highlight.
 *            Used in ClassFeedbackPanel, DiagnosisZone, ImplicationsZone.
 *   'card' — <div> wrapper with absolute pencil icon and <p> display.
 *            Used in StudentCard.
 */
import { useState, useRef, useEffect } from 'react'
import { useAutoSizeTextarea } from '../../hooks/useAutoSizeTextarea'

export default function EditableItem({ value, onChange, textStyle, variant = 'wcf', discardOnEscape = true }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setVal(value) }, [value])
  useAutoSizeTextarea(ref, val, editing)

  const isReadOnly = onChange === undefined

  function handleBlur() {
    setEditing(false)
    onChange?.(val)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      if (discardOnEscape) {
        setVal(value)
        setEditing(false)
      } else {
        ref.current?.blur()
      }
    }
  }

  /* ── Card variant ──────────────────────────────────────────────────────── */
  if (variant === 'card') {
    return (
      <div
        onClick={() => !editing && !isReadOnly && setEditing(true)}
        onMouseEnter={() => !isReadOnly && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...cardStyles.wrapper,
          ...(hovered && !editing ? cardStyles.wrapperHovered : {}),
        }}
      >
        {!isReadOnly && (
          <span
            className="material-symbols-outlined"
            style={{ ...cardStyles.pencil, opacity: hovered && !editing ? 1 : 0 }}
          >
            edit
          </span>
        )}
        {editing ? (
          <textarea
            ref={ref}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={cardStyles.textarea}
          />
        ) : (
          <p style={{ ...cardStyles.text, ...(textStyle || {}) }}>{val}</p>
        )}
      </div>
    )
  }

  /* ── WCF variant (default) ─────────────────────────────────────────────── */
  if (editing) {
    return (
      <textarea
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ ...wcfStyles.textarea, ...(textStyle || {}) }}
      />
    )
  }

  return (
    <span
      onClick={() => !isReadOnly && setEditing(true)}
      onMouseEnter={() => !isReadOnly && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...wcfStyles.span,
        ...(textStyle || {}),
        ...(hovered && !isReadOnly ? wcfStyles.spanHovered : {}),
        cursor: isReadOnly ? 'default' : 'text',
      }}
      title={isReadOnly ? undefined : 'Click to edit'}
    >
      {val}
      {!isReadOnly && (
        <span style={{ ...wcfStyles.pencil, opacity: hovered ? 0.5 : 0 }}>✏</span>
      )}
    </span>
  )
}

const wcfStyles = {
  span: {
    display: 'block',
    borderRadius: '4px',
    padding: '1px 3px',
    marginLeft: '-3px',
    position: 'relative',
    transition: 'background-color 0.1s',
  },
  spanHovered: {
    backgroundColor: 'rgba(147,179,233,0.12)',
  },
  pencil: {
    marginLeft: '5px',
    fontSize: '10px',
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
    lineHeight: '1.55',
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

const cardStyles = {
  wrapper: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  wrapperHovered: {
    background: 'var(--color-surface-container-low)',
  },
  pencil: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: '15px',
    color: 'var(--color-on-surface-variant)',
    transition: 'opacity 0.15s',
    pointerEvents: 'none',
  },
  text: {
    margin: 0,
  },
  textarea: {
    fontFamily: 'inherit',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '0',
    border: 'none',
    outline: 'none',
    background: 'var(--color-surface-container-low)',
    borderRadius: '4px',
    width: '100%',
    resize: 'none',
    color: 'inherit',
    overflowY: 'hidden',
  },
}
