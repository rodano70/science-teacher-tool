import { useState } from 'react'
import { downloadWCFDoc, downloadFeedbackDoc } from '../../utils/docUtils'
import { useAutoSizeTextarea } from '../../hooks/useAutoSizeTextarea'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Read-only WCF section ─────────────────────────────────────────────────

function WCFSection({ title, items, color }) {
  const [open, setOpen] = useState(true)
  const list = Array.isArray(items) ? items : (items ? [items] : [])
  if (list.length === 0) return null
  return (
    <div style={sectionStyles.wrap}>
      <button style={sectionStyles.header} onClick={() => setOpen(o => !o)}>
        <span style={{ ...sectionStyles.dot, background: color }} />
        <span style={sectionStyles.title}>{title}</span>
        <span className="material-symbols-outlined" style={sectionStyles.chevron}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <ul style={sectionStyles.list}>
          {list.map((item, i) => (
            <li key={i} style={sectionStyles.item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

const sectionStyles = {
  wrap: {
    borderBottom: '1px solid rgba(147, 179, 233, 0.15)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  chevron: {
    fontSize: '18px',
    color: 'var(--color-on-surface-variant)',
  },
  list: {
    margin: '0',
    padding: '0 20px 16px 42px',
    listStyle: 'disc',
  },
  item: {
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    lineHeight: '1.55',
    marginBottom: '6px',
  },
}

// ── Read-only student card ────────────────────────────────────────────────

function StudentRow({ student }) {
  const [open, setOpen] = useState(false)
  const isNonCompleter = student.isNonCompleter || (!student.ebi && !student.to_improve && !student.www)
  return (
    <div style={rowStyles.wrap}>
      <button style={rowStyles.header} onClick={() => setOpen(o => !o)}>
        <span style={rowStyles.name}>{student.name}</span>
        {student.score && <span style={rowStyles.score}>{student.score}</span>}
        {isNonCompleter && <span style={rowStyles.ncBadge}>No submission</span>}
        <span className="material-symbols-outlined" style={rowStyles.chevron}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div style={rowStyles.body}>
          {isNonCompleter ? (
            <p style={rowStyles.ncText}>{student.www || 'No submission recorded.'}</p>
          ) : (
            <div style={rowStyles.grid}>
              <div>
                <p style={{ ...rowStyles.label, color: '#1d4ed8' }}>WWW</p>
                <p style={rowStyles.text}>{student.www || '—'}</p>
              </div>
              <div>
                <p style={{ ...rowStyles.label, color: 'var(--color-on-surface)' }}>EBI</p>
                <p style={rowStyles.text}>{student.ebi || '—'}</p>
              </div>
              <div>
                <p style={{ ...rowStyles.label, color: '#4f376b' }}>To Improve</p>
                <p style={rowStyles.text}>{student.to_improve || '—'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const rowStyles = {
  wrap: {
    borderBottom: '1px solid rgba(147, 179, 233, 0.12)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  name: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  score: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  ncBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container-high)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  chevron: {
    fontSize: '18px',
    color: 'var(--color-on-surface-variant)',
  },
  body: {
    padding: '0 20px 16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
  },
  label: {
    margin: '0 0 4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  text: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    lineHeight: '1.55',
  },
  ncText: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    fontStyle: 'italic',
  },
}

// ── Notes editor ─────────────────────────────────────────────────────────

function NotesEditor({ notes, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes || '')
  const textareaRef = useAutoSizeTextarea(draft)

  function handleSave() {
    onSave(draft)
    setEditing(false)
  }

  return (
    <div style={notesStyles.wrap}>
      <div style={notesStyles.header}>
        <span className="material-symbols-outlined" style={notesStyles.icon}>sticky_note_2</span>
        <span style={notesStyles.label}>Notes</span>
        {!editing && (
          <button style={notesStyles.editBtn} onClick={() => { setDraft(notes || ''); setEditing(true) }}>
            {notes ? 'Edit' : 'Add note'}
          </button>
        )}
      </div>
      {editing ? (
        <div style={notesStyles.editorWrap}>
          <textarea
            ref={textareaRef}
            style={notesStyles.textarea}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a note about this assessment (e.g. 'Mock exam, results lower than expected')…"
            rows={2}
          />
          <div style={notesStyles.editorActions}>
            <button style={notesStyles.saveBtn} onClick={handleSave}>Save</button>
            <button style={notesStyles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <p style={notes ? notesStyles.noteText : notesStyles.notePlaceholder}>
          {notes || 'No notes yet.'}
        </p>
      )}
    </div>
  )
}

const notesStyles = {
  wrap: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(147, 179, 233, 0.15)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '16px',
    color: 'var(--color-outline)',
  },
  label: {
    flex: 1,
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  editBtn: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
  },
  editorWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textarea: {
    width: '100%',
    fontSize: '13px',
    padding: '10px 12px',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    color: 'var(--color-on-surface)',
    lineHeight: '1.5',
    boxSizing: 'border-box',
  },
  editorActions: {
    display: 'flex',
    gap: '8px',
  },
  saveBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-primary)',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '6px 10px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  noteText: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    lineHeight: '1.55',
    fontStyle: 'italic',
  },
  notePlaceholder: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.5,
  },
}

// ── Main ArchiveViewer ────────────────────────────────────────────────────

export default function ArchiveViewer({ entry, onBack, onUpdateNotes, onLoadFromArchive }) {
  const [studentFilter, setStudentFilter] = useState('all') // 'all' | 'nonCompleters'
  const [wcfDownloading, setWcfDownloading] = useState(false)
  const [indivDownloading, setIndivDownloading] = useState(false)

  const hasWCF = !!entry.wcfData
  const hasIndiv = !!entry.feedbackData

  const completers = hasIndiv ? entry.feedbackData.filter(s => !s.isNonCompleter) : []
  const nonCompleters = hasIndiv ? entry.feedbackData.filter(s => s.isNonCompleter) : []
  const displayedStudents = studentFilter === 'nonCompleters' ? nonCompleters : (hasIndiv ? entry.feedbackData : [])

  async function handleDownloadWCF() {
    setWcfDownloading(true)
    try {
      await downloadWCFDoc({
        wcfData: entry.wcfData,
        examBoard: entry.metadata.examBoard || '',
        subject: entry.metadata.subject || '',
        topic: entry.metadata.topic || '',
        statCards: null,
        setSuccess: () => {},
      })
    } finally {
      setWcfDownloading(false)
    }
  }

  async function handleDownloadIndividual() {
    setIndivDownloading(true)
    try {
      await downloadFeedbackDoc({
        feedbackData: entry.feedbackData,
        subject: entry.metadata.subject || '',
        topic: entry.metadata.topic || '',
        setFeedbackSuccess: () => {},
      })
    } finally {
      setIndivDownloading(false)
    }
  }

  return (
    <div style={styles.root}>

      {/* ── Back nav ──────────────────────────────────────────────────── */}
      <button style={styles.backBtn} onClick={onBack}>
        <span className="material-symbols-outlined" style={styles.backIcon}>arrow_back</span>
        Back to Archive
      </button>

      {/* ── Entry header ──────────────────────────────────────────────── */}
      <div style={styles.entryHeader}>
        <div style={styles.entryHeaderLeft}>
          <p style={styles.eyebrow}>Archived Assessment</p>
          <h1 style={styles.entryTitle}>{entry.metadata.topic || 'Untitled Assessment'}</h1>
          <div style={styles.chips}>
            {entry.metadata.examBoard && <span style={styles.chip}>{entry.metadata.examBoard}</span>}
            {entry.metadata.subject && <span style={styles.chip}>{entry.metadata.subject}</span>}
            <span style={styles.chip}>
              <span className="material-symbols-outlined" style={styles.chipIcon}>calendar_today</span>
              {formatDate(entry.createdAt)}
            </span>
            {entry.metadata.studentCount > 0 && (
              <span style={styles.chip}>
                <span className="material-symbols-outlined" style={styles.chipIcon}>group</span>
                {entry.metadata.studentCount} students
              </span>
            )}
            {entry.metadata.averageScore != null && (
              <span style={styles.chip}>
                <span className="material-symbols-outlined" style={styles.chipIcon}>analytics</span>
                {entry.metadata.averageScore}% average
              </span>
            )}
            {entry.version > 1 && (
              <span style={styles.versionChip}>v{entry.version}</span>
            )}
          </div>
        </div>

        {/* Download + load actions */}
        <div style={styles.entryActions}>
          {onLoadFromArchive && (
            <button style={styles.loadBtn} onClick={() => onLoadFromArchive(entry)} title="Restore this feedback into the current session for editing">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>input</span>
              Load into session
            </button>
          )}
          <button
            style={hasWCF ? styles.dlBtn : styles.dlBtnDisabled}
            disabled={!hasWCF || wcfDownloading}
            onClick={handleDownloadWCF}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>article</span>
            {wcfDownloading ? 'Generating…' : 'WCF Doc'}
          </button>
          <button
            style={hasIndiv ? styles.dlBtn : styles.dlBtnDisabled}
            disabled={!hasIndiv || indivDownloading}
            onClick={handleDownloadIndividual}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
            {indivDownloading ? 'Generating…' : 'Individual Doc'}
          </button>
        </div>
      </div>

      {/* ── Content panels ────────────────────────────────────────────── */}
      {!hasWCF && !hasIndiv ? (
        <div style={styles.noDataCard}>
          <span className="material-symbols-outlined" style={styles.noDataIcon}>hourglass_empty</span>
          <p style={styles.noDataText}>No feedback data saved for this entry.</p>
        </div>
      ) : (
        <div style={styles.contentGrid}>

          {/* WCF panel */}
          {hasWCF && (
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <span className="material-symbols-outlined" style={styles.cardHeaderIcon}>school</span>
                <h2 style={styles.cardTitle}>Whole Class Feedback</h2>
              </div>
              <WCFSection title="Key Successes" items={entry.wcfData.key_successes} color="#1d4ed8" />
              <WCFSection title="Key Misconceptions" items={entry.wcfData.key_misconceptions} color="#b91c1c" />
              <WCFSection title="Surface Errors" items={entry.wcfData.little_errors} color="#6b7280" />
              <WCFSection title="Students to Praise" items={entry.wcfData.students_to_praise} color="#4f376b" />
              <WCFSection title="Individual Concerns" items={entry.wcfData.individual_concerns} color="#b45309" />
              <WCFSection title="Immediate Action" items={entry.wcfData.immediate_action} color="#0891b2" />
              <WCFSection title="Long-term Implications" items={entry.wcfData.long_term_implications} color="#374151" />
            </div>
          )}

          {/* Individual feedback panel */}
          {hasIndiv && (
            <div style={styles.contentCard}>
              <div style={styles.cardHeader}>
                <span className="material-symbols-outlined" style={styles.cardHeaderIcon}>person</span>
                <h2 style={styles.cardTitle}>Individual Student Feedback</h2>
                <span style={styles.cardCount}>{entry.feedbackData.length} students</span>
              </div>

              {/* Filter pills */}
              <div style={styles.filterPills}>
                <button
                  style={studentFilter === 'all' ? styles.pillActive : styles.pill}
                  onClick={() => setStudentFilter('all')}
                >
                  All ({entry.feedbackData.length})
                </button>
                {nonCompleters.length > 0 && (
                  <button
                    style={studentFilter === 'nonCompleters' ? styles.pillActive : styles.pill}
                    onClick={() => setStudentFilter('nonCompleters')}
                  >
                    No submission ({nonCompleters.length})
                  </button>
                )}
                {completers.length > 0 && (
                  <button
                    style={studentFilter === 'completers' ? styles.pillActive : styles.pill}
                    onClick={() => setStudentFilter('completers')}
                  >
                    Completed ({completers.length})
                  </button>
                )}
              </div>

              <div>
                {displayedStudents.map(s => (
                  <StudentRow key={s.name} student={s} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      <div style={styles.notesCard}>
        <NotesEditor
          notes={entry.notes}
          onSave={(notes) => onUpdateNotes(entry.id, notes)}
        />
      </div>

    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  root: {
    padding: '32px',
    maxWidth: '1200px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 0',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '20px',
  },
  backIcon: {
    fontSize: '18px',
  },

  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  entryHeaderLeft: {
    flex: 1,
    minWidth: '240px',
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  entryTitle: {
    margin: '0 0 12px',
    fontSize: '26px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container)',
    borderRadius: '20px',
  },
  chipIcon: {
    fontSize: '13px',
  },
  versionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-on-tertiary-container)',
    backgroundColor: 'var(--color-tertiary-container)',
    borderRadius: '20px',
    letterSpacing: '0.04em',
  },
  entryActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  loadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    background: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-primary)',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dlBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    background: 'var(--color-surface-container)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'default',
    opacity: 0.45,
    fontFamily: 'inherit',
  },

  noDataCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 40px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  noDataIcon: {
    fontSize: '40px',
    color: 'var(--color-outline)',
    marginBottom: '12px',
  },
  noDataText: {
    margin: '0',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
  },

  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  contentCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    border: '1px solid rgba(147, 179, 233, 0.2)',
    boxShadow: '0 1px 4px rgba(8, 50, 97, 0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(147, 179, 233, 0.15)',
    backgroundColor: 'var(--color-surface-container-low)',
  },
  cardHeaderIcon: {
    fontSize: '18px',
    color: 'var(--color-primary)',
  },
  cardTitle: {
    flex: 1,
    margin: '0',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  cardCount: {
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    fontFamily: 'ui-monospace, monospace',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(147, 179, 233, 0.12)',
  },
  pill: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    background: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  pillActive: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-primary)',
    background: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    borderRadius: '20px',
    cursor: 'default',
    fontFamily: 'inherit',
  },

  notesCard: {
    marginTop: '20px',
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    border: '1px solid rgba(147, 179, 233, 0.2)',
    overflow: 'hidden',
  },
}
