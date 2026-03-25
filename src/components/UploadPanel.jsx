import FileUpload from '../FileUpload'

export default function UploadPanel({
  examBoard, setExamBoard,
  subject, setSubject,
  topic, setTopic,
  gradeBoundaries, setGradeBoundaries,
  studentData,
  onDataParsed,
  onReset,
  wcfLoading, wcfProgress, onGenerateWCF,
  feedbackLoading, feedbackProgress, onGenerateFeedback,
}) {
  return (
    <div style={styles.form}>
      {/* ── Row 1: Exam Board + Subject ─────────────────────────────── */}
      <div style={styles.fieldRow}>
        <div style={styles.field}>
          <label style={styles.label}>Exam Board</label>
          <select
            style={styles.select}
            value={examBoard}
            onChange={e => setExamBoard(e.target.value)}
          >
            <option value="">Select exam board…</option>
            <option value="AQA">AQA</option>
            <option value="OCR">OCR</option>
            <option value="Edexcel">Edexcel</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Subject</label>
          <select
            style={styles.select}
            value={subject}
            onChange={e => setSubject(e.target.value)}
          >
            <option value="">Select subject…</option>
            <option value="Biology">Biology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Physics">Physics</option>
            <option value="Combined Science">Combined Science</option>
          </select>
        </div>
      </div>

      {/* ── Topic ────────────────────────────────────────────────────── */}
      <div style={styles.field}>
        <label style={styles.label}>Topic</label>
        <input
          type="text"
          style={styles.input}
          placeholder="e.g. Photosynthesis, Atomic Structure…"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
      </div>

      {/* ── Grade Boundaries ─────────────────────────────────────────── */}
      <div style={styles.field}>
        <label style={styles.label}>
          Grade Boundaries{' '}
          <span style={styles.optional}>(optional)</span>
        </label>
        <input
          type="text"
          style={styles.input}
          placeholder="e.g. A*:90, A:80, B:70…"
          value={gradeBoundaries}
          onChange={e => setGradeBoundaries(e.target.value)}
        />
      </div>

      {/* ── File upload ───────────────────────────────────────────────── */}
      <FileUpload onDataParsed={onDataParsed} />

      {/* ── Divider before actions ────────────────────────────────────── */}
      <div style={styles.divider} />

      {/* ── Action buttons ───────────────────────────────────────────── */}
      <div style={styles.buttonRow}>
        <button
          className="btn-primary"
          style={{ ...styles.btn, ...styles.btnPrimary, opacity: wcfLoading ? 0.65 : 1 }}
          type="button"
          onClick={onGenerateWCF}
          disabled={wcfLoading}
        >
          {wcfLoading ? 'Generating…' : 'Generate Class Feedback Sheet'}
        </button>

        <button
          className="btn-primary"
          style={{ ...styles.btn, ...styles.btnPrimary, opacity: feedbackLoading ? 0.65 : 1 }}
          type="button"
          onClick={onGenerateFeedback}
          disabled={feedbackLoading}
        >
          {feedbackLoading ? 'Generating…' : 'Generate Individual Feedback'}
        </button>
      </div>

      {/* ── Start Over — only shown when file is loaded ───────────────── */}
      {studentData && (
        <div style={styles.resetRow}>
          <button
            className="btn-ghost"
            style={styles.btnGhost}
            type="button"
            onClick={onReset}
          >
            Start Over
          </button>
        </div>
      )}

      {/* ── WCF progress ─────────────────────────────────────────────── */}
      {wcfLoading && (
        <div style={styles.progressWrapper}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${wcfProgress}%` }} />
          </div>
          <p style={styles.progressLabel}>Analysing class data…</p>
        </div>
      )}

      {/* ── Individual feedback progress ──────────────────────────────── */}
      {feedbackLoading && (
        <div style={styles.progressWrapper}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${feedbackProgress}%` }} />
          </div>
          <p style={styles.progressLabel}>Writing personalised feedback…</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
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
  select: {
    padding: '9px 32px 9px 11px',
    borderRadius: '5px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#fff',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 11px center',
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    padding: '9px 11px',
    borderRadius: '5px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    width: '100%',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '4px 0',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  btn: {
    flex: '1',
    minWidth: '200px',
    padding: '11px 16px',
    borderRadius: '5px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  btnPrimary: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
  },
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  btnGhost: {
    padding: '7px 14px',
    borderRadius: '5px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  progressWrapper: {
    marginTop: '4px',
  },
  progressTrack: {
    height: '5px',
    borderRadius: '3px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#1d4ed8',
    transition: 'width 0.3s ease-out',
  },
  progressLabel: {
    margin: '7px 0 0',
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
}
