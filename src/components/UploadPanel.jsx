import FileUpload from '../FileUpload'
import PdfDropZone from './PdfDropZone'

export default function UploadPanel({
  examBoard, setExamBoard,
  subject, setSubject,
  topic, setTopic,
  gradeBoundaries, setGradeBoundaries,
  studentData,
  onDataParsed,
  onReset,
  questionTexts,
  questionPdfStatus,
  onPdfFile,
  clearQuestionTexts,
  onQuestionChange,
  wcfLoading, wcfProgress, onGenerateWCF,
  feedbackLoading, feedbackProgress, onGenerateFeedback,
}) {
  return (
    <div style={styles.wrapper}>

      {/* ── Hero title ─────────────────────────────────────────────────── */}
      <div style={styles.hero}>
        <span style={styles.eyebrow}>Assessment Intelligence</span>
        <h1 style={styles.heroTitle}>
          Upload &amp; Configure{' '}
          <br />
          <span style={styles.heroAccent}>Assessment Results</span>
        </h1>
      </div>

      {/* ── Bento grid ─────────────────────────────────────────────────── */}
      <div style={styles.bentoGrid}>

        {/* ── LEFT COLUMN: marksheet + question paper ────────────────── */}
        <div style={styles.leftCol}>

          {/* Student Marksheet section */}
          <div style={styles.marksheetCard}>
            <h2 style={styles.cardHeading}>Student Marksheet</h2>
            <p style={styles.cardDesc}>
              Upload your Excel or CSV file containing student names and raw marks per question.
            </p>
            <FileUpload onDataParsed={onDataParsed} />
          </div>

          {/* Question Paper section */}
          <div style={styles.questionCard}>
            <div style={styles.questionCardHeader}>
              <div>
                <h2 style={styles.cardHeading}>Question Paper</h2>
                <p style={styles.questionCardDesc}>
                  Upload the PDF to automatically extract assessment criteria and topic tagging.
                </p>
              </div>
              <div style={styles.descIconBadge}>
                <span
                  className="material-symbols-outlined"
                  style={styles.descIcon}
                >
                  description
                </span>
              </div>
            </div>
            <PdfDropZone
              questionTexts={questionTexts}
              questionPdfStatus={questionPdfStatus}
              onPdfFile={onPdfFile}
              onClear={clearQuestionTexts}
              onQuestionChange={onQuestionChange}
            />
          </div>

        </div>

        {/* ── RIGHT COLUMN: assessment details form ──────────────────── */}
        <div style={styles.rightCol}>

          <div style={styles.formPanel}>
            <h2 style={styles.formHeading}>Assessment Details</h2>

            {/* ── Exam Board ──────────────────────────────────────── */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Exam Board</label>
              <select
                className="bottom-bar-input"
                style={styles.selectInput}
                value={examBoard}
                onChange={e => setExamBoard(e.target.value)}
              >
                <option value="">Select exam board…</option>
                <option value="AQA">AQA</option>
                <option value="OCR">OCR</option>
                <option value="Edexcel">Edexcel</option>
              </select>
            </div>

            {/* ── Subject ─────────────────────────────────────────── */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Subject</label>
              <select
                className="bottom-bar-input"
                style={styles.selectInput}
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

            {/* ── Topic ───────────────────────────────────────────── */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Core Topic</label>
              <input
                type="text"
                className="bottom-bar-input"
                style={styles.textInput}
                placeholder="e.g. Cell Biology"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            {/* ── Grade Boundaries ────────────────────────────────── */}
            <div style={styles.fieldGroup}>
              <div style={styles.gradeBoundariesLabelRow}>
                <label style={styles.fieldLabel}>Grade Boundaries (9-1)</label>
              </div>
              <div style={styles.gradeBoundariesCard}>
                <input
                  type="text"
                  className="bottom-bar-input"
                  style={styles.gradeBoundariesInput}
                  placeholder="e.g. 9:90, 8:80, 7:70, 4:45…"
                  value={gradeBoundaries}
                  onChange={e => setGradeBoundaries(e.target.value)}
                />
              </div>
            </div>

            {/* ── Generate WCF button ──────────────────────────────── */}
            <button
              style={{ ...styles.btnWCF, opacity: wcfLoading ? 0.65 : 1 }}
              type="button"
              onClick={onGenerateWCF}
              disabled={wcfLoading}
            >
              <span className="material-symbols-outlined" style={styles.btnIcon}>
                auto_awesome
              </span>
              <span style={styles.btnText}>
                {wcfLoading ? 'Generating…' : 'Generate Whole Class Feedback'}
                {!wcfLoading && questionTexts.length > 0 && (
                  <span style={styles.qContextBadge}>✓ With question context</span>
                )}
              </span>
            </button>

            {/* ── Generate Individual button ───────────────────────── */}
            <button
              style={{ ...styles.btnIndividual, opacity: feedbackLoading ? 0.65 : 1 }}
              type="button"
              onClick={onGenerateFeedback}
              disabled={feedbackLoading}
            >
              <span className="material-symbols-outlined" style={styles.btnIcon}>
                person
              </span>
              <span style={styles.btnText}>
                {feedbackLoading ? 'Generating…' : 'Generate Individual Student Feedback'}
                {!feedbackLoading && questionTexts.length > 0 && (
                  <span style={styles.qContextBadge}>✓ With question context</span>
                )}
              </span>
            </button>

          </div>

          {/* ── WCF progress ──────────────────────────────────────── */}
          {wcfLoading && (
            <div style={styles.progressWrapper}>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${wcfProgress}%` }} />
              </div>
              <p style={styles.progressLabel}>Analysing class data…</p>
            </div>
          )}

          {/* ── Individual feedback progress ──────────────────────── */}
          {feedbackLoading && (
            <div style={styles.progressWrapper}>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${feedbackProgress}%` }} />
              </div>
              <p style={styles.progressLabel}>Writing personalised feedback…</p>
            </div>
          )}

          {/* ── Start Over ────────────────────────────────────────── */}
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

        </div>

      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    padding: '40px 48px 64px',
  },

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  hero: {
    marginBottom: '48px',
  },
  eyebrow: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  heroTitle: {
    margin: 0,
    fontSize: '44px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    lineHeight: '1.1',
  },
  heroAccent: {
    color: 'var(--color-primary)',
  },

  /* ── Bento grid ───────────────────────────────────────────────────────── */
  bentoGrid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '32px',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'sticky',
    top: '80px',
  },

  /* ── Left column cards ────────────────────────────────────────────────── */
  marksheetCard: {
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '12px',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
  },
  questionCard: {
    backgroundColor: 'var(--color-surface-container)',
    borderRadius: '12px',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
  },
  questionCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  descIconBadge: {
    backgroundColor: 'var(--color-surface-container-highest)',
    borderRadius: '8px',
    padding: '10px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '16px',
  },
  descIcon: {
    color: 'var(--color-primary)',
    fontSize: '22px',
  },
  cardHeading: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    margin: '0 0 32px',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.55',
    maxWidth: '420px',
  },
  questionCardDesc: {
    margin: '0',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.55',
  },

  /* ── Right column form panel ──────────────────────────────────────────── */
  formPanel: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '40px',
    border: '1px solid var(--color-outline-variant)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formHeading: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.01em',
  },

  /* ── Form fields ──────────────────────────────────────────────────────── */
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  selectInput: {
    width: '100%',
    backgroundColor: 'var(--color-surface-container-low)',
    border: 'none',
    borderBottom: '2px solid var(--color-outline)',
    borderRadius: '6px 6px 0 0',
    padding: '12px 36px 12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-on-surface)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235b7cae' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    boxSizing: 'border-box',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'var(--color-surface-container-low)',
    border: 'none',
    borderBottom: '2px solid var(--color-outline)',
    borderRadius: '6px 6px 0 0',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-on-surface)',
    outline: 'none',
    boxSizing: 'border-box',
  },

  gradeBoundariesLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  gradeBoundariesCard: {
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '8px',
    padding: '12px 16px',
    border: '1px solid var(--color-outline-variant)',
  },
  gradeBoundariesInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--color-outline)',
    borderRadius: '0',
    padding: '4px 0 8px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-on-surface)',
    outline: 'none',
    boxSizing: 'border-box',
  },

  /* ── Buttons ──────────────────────────────────────────────────────────── */
  btnWCF: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #455f88 0%, #39537c 100%)',
    color: 'var(--color-on-primary)',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    boxShadow: '0 4px 12px rgba(69, 95, 136, 0.2)',
  },
  btnIndividual: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '16px',
    background: 'transparent',
    color: 'var(--color-primary)',
    borderRadius: '8px',
    border: '2px solid var(--color-primary)',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  btnIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  btnText: {
    textAlign: 'center',
  },
  qContextBadge: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '400',
    color: '#86efac',
    marginTop: '3px',
    letterSpacing: '0.01em',
  },

  /* ── Progress bars ────────────────────────────────────────────────────── */
  progressWrapper: {
    padding: '4px 0',
  },
  progressTrack: {
    height: '5px',
    borderRadius: '3px',
    backgroundColor: 'var(--color-surface-container-high)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: 'var(--color-primary)',
    transition: 'width 0.3s ease-out',
  },
  progressLabel: {
    margin: '7px 0 0',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    fontStyle: 'italic',
  },

  /* ── Start Over ───────────────────────────────────────────────────────── */
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  btnGhost: {
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid var(--color-outline-variant)',
    backgroundColor: 'transparent',
    color: 'var(--color-on-surface-variant)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
}
