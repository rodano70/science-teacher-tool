import { useState, useEffect, useRef } from 'react'

// Auto-resizes to fit content: sets height:'auto' first so scrollHeight recalculates,
// then pins the height to scrollHeight. resize:'none' keeps the manual handle hidden.
function AutoResizeTextarea({ value, onChange, style }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      style={{ ...style, overflow: 'hidden', resize: 'none' }}
    />
  )
}

export default function PdfDropZone({ questionTexts, questionPdfStatus, onPdfFile, onClear, onQuestionChange }) {
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (file) onPdfFile(file)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) onPdfFile(file)
    // Reset so the same file can be re-selected after a clear
    e.target.value = ''
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  return (
    <>
      {/* ── Loading state ─────────────────────────────────────── */}
      {questionPdfStatus === 'loading' && (
        <div style={styles.loadingRow}>
          <span className="pdf-spinner" aria-hidden="true" />
          <span style={styles.loadingText}>Extracting questions…</span>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────── */}
      {questionPdfStatus === 'error' && (
        <p style={styles.errorText}>
          Extraction failed — you can continue without a question paper or{' '}
          <button style={styles.retryBtn} type="button" onClick={onClear}>
            try again
          </button>
          .
        </p>
      )}

      {/* ── Ready state: editable question list ──────────────── */}
      {questionPdfStatus === 'ready' && (
        <div>
          {/* Success banner */}
          <div style={styles.successBanner}>
            <span className="material-symbols-outlined" style={styles.successIcon}>check_circle</span>
            <span>
              {questionTexts.length} question{questionTexts.length !== 1 ? 's' : ''} extracted
              {' '}— edit any that need correcting.
            </span>
          </div>

          {/* Extracted question list */}
          <div style={styles.questionList}>
            <div style={styles.questionListHeader}>
              <span style={styles.questionListLabel}>Extracted Question Map</span>
            </div>
            {questionTexts.map((text, i) => (
              <div key={i} style={styles.questionRow}>
                <span style={styles.questionLabel} aria-hidden="true">Q{i + 1}</span>
                <AutoResizeTextarea
                  value={text}
                  onChange={e => onQuestionChange(i, e.target.value)}
                  style={styles.questionTextarea}
                />
                <span
                  className="material-symbols-outlined"
                  style={styles.dragHandle}
                  aria-hidden="true"
                >
                  drag_indicator
                </span>
              </div>
            ))}
          </div>

          {/* Clear link below the list */}
          <div style={styles.clearRow}>
            <button style={styles.clearLink} onClick={onClear} type="button">
              Clear question paper
            </button>
          </div>
        </div>
      )}

      {/* ── Drop zone — idle only ─────────────────────────────── */}
      {questionPdfStatus === 'idle' && (
        <label
          style={{
            ...styles.dropZone,
            ...(dragOver ? styles.dropZoneActive : {}),
          }}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={styles.idleContent}>
            <span
              className="material-symbols-outlined"
              style={{
                ...styles.pdfIcon,
                color: dragOver ? 'var(--color-primary)' : 'var(--color-outline)',
              }}
            >
              picture_as_pdf
            </span>
            <span style={dragOver ? styles.dropTextActive : styles.dropText}>
              Drop PDF here or click to browse
            </span>
          </div>
        </label>
      )}
    </>
  )
}

const styles = {
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '28px 20px',
    border: '2px dashed var(--color-outline-variant)',
    borderRadius: '10px',
    backgroundColor: 'var(--color-surface-container-lowest)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
    boxSizing: 'border-box',
  },
  dropZoneActive: {
    backgroundColor: 'var(--color-primary-container)',
    borderColor: 'var(--color-primary)',
  },
  idleContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  pdfIcon: {
    fontSize: '36px',
  },
  dropText: {
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
  },
  dropTextActive: {
    fontSize: '13px',
    color: 'var(--color-primary)',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 0 2px',
  },
  loadingText: {
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    fontStyle: 'italic',
  },
  errorText: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-error)',
    lineHeight: '1.5',
  },
  retryBtn: {
    background: 'none',
    border: 'none',
    padding: '0',
    fontSize: '13px',
    color: 'var(--color-error)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--color-primary)',
    fontWeight: '500',
    marginBottom: '16px',
  },
  successIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  questionListHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-outline-variant)',
    backgroundColor: 'var(--color-surface-container)',
  },
  questionListLabel: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--color-outline)',
  },
  questionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderBottom: '1px solid var(--color-outline-variant)',
  },
  questionLabel: {
    flexShrink: 0,
    width: '26px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    paddingTop: '6px',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
  questionTextarea: {
    flex: 1,
    padding: '4px 8px',
    border: 'none',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    lineHeight: '1.55',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    outline: 'none',
    width: '100%',
  },
  dragHandle: {
    fontSize: '18px',
    color: 'var(--color-outline)',
    paddingTop: '4px',
    flexShrink: 0,
    cursor: 'default',
  },
  clearRow: {
    marginTop: '12px',
    textAlign: 'right',
  },
  clearLink: {
    background: 'none',
    border: 'none',
    padding: '0',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
}
