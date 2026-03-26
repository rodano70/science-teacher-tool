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
    <div style={styles.section}>
      {/* ── Header row: label + clear link (error state only — ready state
           has the link at the bottom of the list instead) ───────────── */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.sectionLabel}>Question paper</span>
          <span style={styles.optional}> (optional)</span>
        </div>
        {questionPdfStatus === 'error' && (
          <button style={styles.clearLink} onClick={onClear} type="button">
            Clear question paper
          </button>
        )}
      </div>

      {/* ── Helper text ───────────────────────────────────────────────── */}
      <p style={styles.helperText}>
        Upload the exam PDF and Claude will reference specific questions in its
        analysis — making feedback far more diagnostic.
      </p>

      {/* ── Loading state ─────────────────────────────────────────────── */}
      {questionPdfStatus === 'loading' && (
        <div style={styles.loadingRow}>
          <span className="pdf-spinner" aria-hidden="true" />
          <span style={styles.loadingText}>Extracting questions…</span>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────── */}
      {questionPdfStatus === 'error' && (
        <p style={styles.errorText}>
          Extraction failed — you can continue without a question paper or{' '}
          <button style={styles.retryBtn} type="button" onClick={onClear}>
            try again
          </button>
          .
        </p>
      )}

      {/* ── Ready state: editable question list ──────────────────────── */}
      {questionPdfStatus === 'ready' && (
        <div>
          {/* Success banner */}
          <div style={styles.successBanner}>
            <span style={styles.successCheck}>✓</span>
            <span>
              {questionTexts.length} question{questionTexts.length !== 1 ? 's' : ''} extracted
              {' '}— edit any that need correcting.
            </span>
          </div>

          {/* Numbered textarea list */}
          <div style={styles.questionList}>
            {questionTexts.map((text, i) => (
              <div key={i} style={styles.questionRow}>
                <span style={styles.questionLabel} aria-hidden="true">Q{i + 1}</span>
                <AutoResizeTextarea
                  value={text}
                  onChange={e => onQuestionChange(i, e.target.value)}
                  style={styles.questionTextarea}
                />
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

      {/* ── Drop zone — idle only ─────────────────────────────────────── */}
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
          <span style={styles.docIcon} aria-hidden="true">
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <rect x="1" y="1" width="15" height="20" rx="2"
                fill="#f3f4f6" stroke={dragOver ? '#1d4ed8' : '#9ca3af'} strokeWidth="1.5" />
              <path d="M16 1l5 5h-4a1 1 0 01-1-1V1z"
                fill={dragOver ? '#bfdbfe' : '#e5e7eb'} />
              <line x1="4" y1="8" x2="13" y2="8"
                stroke={dragOver ? '#1d4ed8' : '#d1d5db'} strokeWidth="1.25" strokeLinecap="round" />
              <line x1="4" y1="11" x2="13" y2="11"
                stroke={dragOver ? '#1d4ed8' : '#d1d5db'} strokeWidth="1.25" strokeLinecap="round" />
              <line x1="4" y1="14" x2="9" y2="14"
                stroke={dragOver ? '#1d4ed8' : '#d1d5db'} strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </span>
          <span style={dragOver ? styles.dropTextActive : styles.dropText}>
            Drop PDF here or click to browse
          </span>
        </label>
      )}
    </div>
  )
}

const styles = {
  section: {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  sectionLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.01em',
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
    fontSize: '12px',
  },
  clearLink: {
    background: 'none',
    border: 'none',
    padding: '0',
    fontSize: '12px',
    color: '#6b7280',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  helperText: {
    margin: '0 0 12px',
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '20px 16px',
    border: '2px dashed #ced4da',
    borderRadius: '6px',
    backgroundColor: '#fafbfc',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
    boxSizing: 'border-box',
  },
  dropZoneActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#1d4ed8',
    color: '#1d4ed8',
  },
  docIcon: {
    flexShrink: 0,
    lineHeight: 0,
  },
  dropText: {
    color: '#6b7280',
  },
  dropTextActive: {
    color: '#1d4ed8',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 0 2px',
  },
  loadingText: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorText: {
    margin: '0 0 0',
    fontSize: '13px',
    color: '#b91c1c',
    lineHeight: '1.5',
  },
  retryBtn: {
    background: 'none',
    border: 'none',
    padding: '0',
    fontSize: '13px',
    color: '#b91c1c',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#15803d',
    fontWeight: '500',
    marginBottom: '12px',
  },
  successCheck: {
    fontWeight: '700',
    flexShrink: 0,
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  questionLabel: {
    flexShrink: 0,
    width: '26px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    paddingTop: '7px',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
  questionTextarea: {
    flex: 1,
    padding: '6px 9px',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#111827',
    lineHeight: '1.55',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    outline: 'none',
    width: '100%',
  },
  clearRow: {
    marginTop: '12px',
    textAlign: 'right',
  },
}
