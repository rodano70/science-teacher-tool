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
      <div style={styles.field}>
        <label style={styles.label}>Exam Board</label>
        <select
          style={styles.select}
          value={examBoard}
          onChange={e => setExamBoard(e.target.value)}
        >
          <option value="">Select exam board...</option>
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
          <option value="">Select subject...</option>
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
          <option value="Combined Science">Combined Science</option>
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Topic</label>
        <input
          type="text"
          style={styles.input}
          placeholder="e.g. Photosynthesis, Atomic Structure..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Grade Boundaries{' '}
          <span style={styles.optional}>(optional)</span>
        </label>
        <input
          type="text"
          style={styles.input}
          placeholder="e.g. A*:90, A:80, B:70..."
          value={gradeBoundaries}
          onChange={e => setGradeBoundaries(e.target.value)}
        />
      </div>

      {/* Shared upload — both buttons use the same parsed data */}
      <FileUpload onDataParsed={onDataParsed} />

      {/* Start Over — only visible once a file has been uploaded */}
      {studentData && (
        <button
          style={{ ...styles.button, ...styles.buttonReset }}
          type="button"
          onClick={onReset}
        >
          Start Over
        </button>
      )}

      {/* Two output buttons */}
      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary, opacity: wcfLoading ? 0.7 : 1 }}
          type="button"
          onClick={onGenerateWCF}
          disabled={wcfLoading}
        >
          {wcfLoading ? 'Generating…' : 'Generate Class Feedback Sheet'}
        </button>

        <button
          style={{ ...styles.button, ...styles.buttonSecondary, opacity: feedbackLoading ? 0.7 : 1 }}
          type="button"
          onClick={onGenerateFeedback}
          disabled={feedbackLoading}
        >
          {feedbackLoading ? 'Generating…' : 'Generate Individual Feedback'}
        </button>
      </div>

      {/* WCF progress bar */}
      {wcfLoading && (
        <div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${wcfProgress}%` }} />
          </div>
          <p style={styles.progressLabel}>Analysing class data…</p>
        </div>
      )}

      {/* Individual feedback progress bar */}
      {feedbackLoading && (
        <div>
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
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#fff',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  button: {
    flex: '1',
    minWidth: '200px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  buttonReset: {
    flex: 'none',
    minWidth: 'unset',
    width: '100%',
    backgroundColor: '#fff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontWeight: '500',
  },
  progressTrack: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginTop: '4px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#4f46e5',
    transition: 'width 0.25s ease-out',
  },
  progressLabel: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },
}
