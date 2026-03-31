import { useState, useMemo, useEffect, useRef } from 'react'
import StudentCard from './StudentCard'
import { downloadFeedbackDoc } from '../../utils/docUtils'

export default function IndividualFeedbackPanel({
  feedbackData,
  feedbackLoading,
  feedbackSuccess,
  onDownloadSuccess,
  onSwitchToWCF,
  examBoard,
  subject,
  topic,
  questionTexts,
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [threshold, setThreshold] = useState(60)

  // editsRef holds the latest text for every completer, keyed by student name.
  // Writing here does not trigger re-renders; read synchronously on download.
  const editsRef = useRef({})

  const students = feedbackData || []
  const completers = students.filter(s => !s.isNonCompleter)
  const nonCompleters = students.filter(s => s.isNonCompleter)

  const classStats = useMemo(() => {
    if (completers.length === 0) return { classAvg: 0, maxTotal: 1 }
    const maxTotal = completers[0].maxTotal ?? 1
    const avgTotal = completers.reduce((sum, s) => sum + (s.total ?? 0), 0) / completers.length
    return { classAvg: avgTotal, maxTotal }
  }, [completers])

  // Seed editsRef with original API values whenever students array grows
  useEffect(() => {
    students.forEach(s => {
      if (!s.isNonCompleter && !editsRef.current[s.name]) {
        editsRef.current[s.name] = {
          www: s.www,
          ebi: s.ebi,
          toImprove: s.to_improve,
        }
      }
    })
  }, [students])

  // Auto-set threshold to class average once streaming completes
  useEffect(() => {
    if (!feedbackLoading && completers.length > 0 && classStats.maxTotal > 0) {
      setThreshold(Math.round((classStats.classAvg / classStats.maxTotal) * 100))
    }
  }, [feedbackLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStudents = useMemo(() => {
    if (activeFilter === 'noSubmission') return nonCompleters
    if (activeFilter === 'needsReview') {
      return completers.filter(s => {
        const pct = classStats.maxTotal > 0 ? ((s.total ?? 0) / classStats.maxTotal) * 100 : 0
        return pct < threshold
      })
    }
    return students
  }, [students, activeFilter, threshold, classStats, completers, nonCompleters])

  async function handleDownload() {
    const exportData = students.map(s =>
      s.isNonCompleter
        ? s
        : {
            ...s,
            www: editsRef.current[s.name]?.www ?? s.www,
            ebi: editsRef.current[s.name]?.ebi ?? s.ebi,
            to_improve: editsRef.current[s.name]?.toImprove ?? s.to_improve,
          }
    )
    await downloadFeedbackDoc({ feedbackData: exportData, subject, topic, setFeedbackSuccess: onDownloadSuccess })
  }

  const eyebrow = [examBoard, subject, topic].filter(Boolean).join(' • ').toUpperCase()
  const classAvgPct = classStats.maxTotal > 0
    ? Math.round((classStats.classAvg / classStats.maxTotal) * 100)
    : 0

  return (
    <div style={styles.wrapper}>
      <style>{`
        .ifp-switch-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          background: var(--color-surface-container-high);
          color: var(--color-on-primary-container);
          border: none; border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background-color 0.15s;
        }
        .ifp-switch-btn:hover { background: var(--color-surface-container-highest); }
        .ifp-dl-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(to right, var(--color-primary), var(--color-primary-dim));
          color: var(--color-on-primary);
          border: none; border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .ifp-dl-btn:hover { opacity: 0.9; }
        .ifp-pill-btn {
          cursor: pointer; border: none;
          font-family: inherit; font-size: 12px; font-weight: 500;
          padding: 7px 16px; border-radius: 999px; transition: background-color 0.15s;
        }
        .ifp-pill-btn.active {
          background: var(--color-primary); color: var(--color-on-primary);
        }
        .ifp-pill-btn.inactive {
          background: var(--color-surface-container-high); color: var(--color-on-surface);
        }
        .ifp-pill-btn.inactive:hover { background: var(--color-surface-container-highest); }
        .ifp-threshold { overflow: hidden; max-height: 0; transition: max-height 0.3s ease; }
        .ifp-threshold.visible { max-height: 80px; }
        .ifp-spinner {
          display: inline-block; width: 12px; height: 12px;
          border: 2px solid var(--color-outline-variant);
          border-top-color: var(--color-primary);
          border-radius: 50%; animation: ifp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes ifp-spin { to { transform: rotate(360deg); } }
        .sc-field-wrapper { position: relative; cursor: pointer; }
        .sc-field-pencil { position: absolute; top: 0; right: 0; font-size: 15px !important; color: var(--color-on-surface-variant); opacity: 0; transition: opacity 0.15s; pointer-events: none; }
        .sc-field-wrapper:hover .sc-field-pencil { opacity: 1; }
      `}</style>

      {/* Header row */}
      <div style={styles.header}>
        <div>
          {eyebrow && <p style={styles.eyebrow}>{eyebrow}</p>}
          <h1 style={styles.h1}>Individual Student Feedback</h1>
        </div>
        <div style={styles.headerButtons}>
          {onSwitchToWCF && (
            <button className="ifp-switch-btn" onClick={onSwitchToWCF} type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>group</span>
              Whole Class Feedback
            </button>
          )}
          <button className="ifp-dl-btn btn-download" onClick={handleDownload} type="button">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
            Download Word Document
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <p style={styles.statLabel}>Total Students</p>
          <p style={styles.statValue}>{students.length}</p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <p style={styles.statLabel}>Feedback Generated</p>
          <p style={{ ...styles.statValue, color: 'var(--color-primary)' }}>{completers.length}</p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <p style={styles.statLabel}>No Submission</p>
          <p style={{ ...styles.statValue, color: 'var(--color-error)' }}>{nonCompleters.length}</p>
        </div>
        <div style={styles.generatingSlot}>
          {feedbackLoading && (
            <div style={styles.generatingPill}>
              <span className="ifp-spinner" />
              <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Generating…</span>
            </div>
          )}
          {!feedbackLoading && feedbackSuccess && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
              Document downloaded.
            </p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterPills}>
          {[
            { key: 'all', label: 'All Students' },
            { key: 'needsReview', label: 'Needs Review' },
            { key: 'noSubmission', label: 'No Submission' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`ifp-pill-btn ${activeFilter === key ? 'active' : 'inactive'}`}
              onClick={() => setActiveFilter(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className={`ifp-threshold${activeFilter === 'needsReview' ? ' visible' : ''}`}>
          <div style={styles.thresholdInner}>
            <label style={styles.thresholdLabel}>
              Below <strong>{threshold}%</strong> of total marks
              {!feedbackLoading && completers.length > 0 && (
                <span style={styles.thresholdNote}> (class avg: {classAvgPct}%)</span>
              )}
            </label>
            <input
              type="range"
              min={30}
              max={90}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={styles.rangeInput}
            />
          </div>
        </div>
      </div>

      {/* Card list */}
      <div style={styles.cardList}>
        {filteredStudents.map((student, i) => (
          <StudentCard
            key={i}
            student={student}
            threshold={threshold}
            maxTotal={classStats.maxTotal}
            questionTexts={questionTexts}
            onChange={(field, value) => {
              editsRef.current[student.name] = {
                ...editsRef.current[student.name],
                [field]: value,
              }
            }}
          />
        ))}

        {feedbackLoading && (
          <div style={styles.loadingBlock}>
            <span className="ifp-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
              Generating feedback…
              {students.length > 0
                ? ` ${students.length} student${students.length !== 1 ? 's' : ''} so far`
                : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    marginTop: '32px',
    paddingTop: '28px',
    borderTop: '1px solid rgba(147, 179, 233, 0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    padding: '0 48px',
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  },
  h1: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    background: 'var(--color-surface-container-low)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    marginLeft: '48px',
    marginRight: '48px',
    flexWrap: 'wrap',
  },
  statItem: {
    flexShrink: 0,
  },
  statLabel: {
    margin: '0 0 2px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-on-surface-variant)',
  },
  statValue: {
    margin: '0',
    fontSize: '22px',
    fontWeight: '900',
    color: 'var(--color-on-surface)',
  },
  divider: {
    width: '1px',
    height: '32px',
    backgroundColor: 'rgba(147, 179, 233, 0.2)',
    flexShrink: 0,
  },
  generatingSlot: {
    marginLeft: 'auto',
  },
  generatingPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'var(--color-surface-container)',
    border: '1px solid rgba(147, 179, 233, 0.3)',
    borderRadius: '999px',
  },
  filterBar: {
    padding: '0 48px',
    marginBottom: '24px',
  },
  filterPills: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  thresholdInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '12px',
  },
  thresholdLabel: {
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    whiteSpace: 'nowrap',
  },
  thresholdNote: {
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    fontWeight: '400',
    marginLeft: '4px',
  },
  rangeInput: {
    flexShrink: 0,
    width: '160px',
    accentColor: 'var(--color-primary)',
    cursor: 'pointer',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '0 48px 48px',
  },
  loadingBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    background: 'var(--color-surface-container-low)',
    borderRadius: '12px',
  },
}
