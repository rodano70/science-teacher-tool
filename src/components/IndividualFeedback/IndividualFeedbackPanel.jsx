import { useState, useMemo, useEffect, useRef } from 'react'
import StudentCard from './StudentCard'
import { downloadFeedbackDoc } from '../../utils/docUtils'
import { extractStudentsForFeedback } from '../../classUtils'

// Normalize a student name for fuzzy matching across formats.
// classUtils produces "Firstname Lastname"; Claude returns "Lastname, Firstname".
// Stripping commas and sorting words alphabetically makes both map to the same key.
function normalizeName(name) {
  return name.toLowerCase().replace(/,/g, '').split(/\s+/).sort().join(' ')
}

export default function IndividualFeedbackPanel({
  feedbackData,
  feedbackLoading,
  feedbackError = '',
  feedbackSuccess,
  truncated,
  onDownloadSuccess,
  onBack,
  onSwitchToWCF,
  examBoard,
  subject,
  topic,
  questionTexts,
  studentData,
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [threshold, setThreshold] = useState(60)

  // editsRef holds the latest text for every completer, keyed by student name.
  // Writing here does not trigger re-renders; read synchronously on download.
  const editsRef = useRef({})

  // Derive ground-truth counts and breakdown strings from the original Excel data.
  // feedbackData may have fewer entries than the class if some API JSON lines failed
  // to parse, so we use classUtils data for display counts and pill-strip breakdown.
  const rawStudents = useMemo(
    () => (studentData ? extractStudentsForFeedback(studentData) : []),
    [studentData]
  )
  const expectedTotal = rawStudents.length
  const expectedNonCompleters = rawStudents.filter(s => s.total === 0).length
  const expectedCompleters = rawStudents.filter(s => s.total > 0).length

  // name → breakdown string map with two keys per student:
  // direct key (classUtils format, e.g. "John Smith") and
  // normalized key (sorted words, e.g. "john smith") to match
  // Claude's "Surname, Firstname" output format.
  const breakdownMap = useMemo(() => {
    const direct = {}
    const normalized = {}
    rawStudents.forEach(s => {
      direct[s.name] = s.breakdown
      normalized[normalizeName(s.name)] = s.breakdown
    })
    return { direct, normalized }
  }, [rawStudents])

  function getBreakdown(name) {
    return breakdownMap.direct[name] ?? breakdownMap.normalized[normalizeName(name)]
  }

  const students = feedbackData || []
  const completers = students.filter(s => !s.isNonCompleter && !s.isMissingFeedback)
  const nonCompleters = students.filter(s => s.isNonCompleter)

  // Detect completers from rawStudents that never appeared in feedbackData.
  // Only compute when loading is finished to avoid flickering.
  const missingStudents = useMemo(() => {
    if (feedbackLoading || !feedbackData || feedbackData.length === 0) return []
    const generatedNames = new Set(
      feedbackData.filter(s => !s.isNonCompleter).map(s => normalizeName(s.name))
    )
    const nonCompleterNames = new Set(
      rawStudents.filter(s => s.total === 0).map(s => normalizeName(s.name))
    )
    return rawStudents
      .filter(s => s.total > 0 && !generatedNames.has(normalizeName(s.name)) && !nonCompleterNames.has(normalizeName(s.name)))
      .map(s => ({ ...s, isMissingFeedback: true }))
  }, [feedbackLoading, feedbackData, rawStudents])

  const classStats = useMemo(() => {
    if (completers.length === 0) return { classAvg: 0, maxTotal: 1 }
    const maxTotal = completers[0].maxTotal ?? 1
    const avgTotal = completers.reduce((sum, s) => sum + (s.total ?? 0), 0) / completers.length
    return { classAvg: avgTotal, maxTotal }
  }, [completers])

  // Seed editsRef with original API values whenever students array grows
  useEffect(() => {
    students.forEach(s => {
      if (!s.isNonCompleter && !s.isMissingFeedback && !editsRef.current[s.name]) {
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

  // All displayed students: API results + missing placeholders
  const allStudents = [...students, ...missingStudents]

  const filteredStudents = useMemo(() => {
    if (activeFilter === 'noSubmission') return nonCompleters
    if (activeFilter === 'needsReview') {
      return completers.filter(s => {
        const pct = classStats.maxTotal > 0 ? ((s.total ?? 0) / classStats.maxTotal) * 100 : 0
        return pct < threshold
      })
    }
    return allStudents
  }, [allStudents, activeFilter, threshold, classStats, completers, nonCompleters])

  async function handleDownload() {
    const exportData = allStudents
      .filter(s => !s.isMissingFeedback)
      .map(s =>
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

  // ── Empty state ────────────────────────────────────────────────────────
  const hasNoData = !feedbackLoading && feedbackData === null
  if (hasNoData) {
    return (
      <div style={styles.wrapper}>
        <style>{`
          .ifp-back-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 16px;
            background: transparent;
            color: var(--color-on-surface-variant);
            border: 1px solid var(--color-outline-variant); border-radius: 8px;
            font-family: inherit; font-size: 14px; font-weight: 500;
            cursor: pointer; transition: background-color 0.15s;
          }
          .ifp-back-btn:hover { background: var(--color-surface-container-high); }
        `}</style>
        <div style={styles.hero}>
          <span style={styles.heroEyebrow}>Assessment Intelligence</span>
          <h1 style={styles.heroTitle}>
            Individual Student{' '}
            <span style={styles.heroDot}>·</span>{' '}
            <span style={styles.heroAccent}>Feedback Review</span>
          </h1>
        </div>
        <div style={styles.emptyWrapper}>
          <div style={styles.emptyCard}>
            <span className="material-symbols-outlined" style={styles.emptyIcon}>person</span>
            <h2 style={styles.emptyTitle}>No individual feedback yet</h2>
            <p style={styles.emptyDesc}>
              Go to the Upload section, upload your marksheet and fill in the exam details, then click{' '}
              <strong>Generate Individual Student Feedback</strong>.
            </p>
            {onBack && (
              <button className="ifp-back-btn" onClick={onBack} type="button">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Back to Setup
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

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
        .ifp-back-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: transparent;
          color: var(--color-on-surface-variant);
          border: 1px solid var(--color-outline-variant); border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background-color 0.15s;
        }
        .ifp-back-btn:hover { background: var(--color-surface-container-high); }
        .ifp-missing-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px;
          background: var(--color-surface-container-low);
          border: 1px dashed var(--color-outline-variant);
          border-radius: 12px;
          opacity: 0.75;
        }
      `}</style>

      {/* Hero title */}
      <div style={styles.hero}>
        <span style={styles.heroEyebrow}>Assessment Intelligence</span>
        <h1 style={styles.heroTitle}>
          Individual Student{' '}
          <span style={styles.heroDot}>·</span>{' '}
          <span style={styles.heroAccent}>Feedback Review</span>
        </h1>
        {eyebrow && <p style={styles.heroContext}>{eyebrow}</p>}
      </div>

      {/* Action bar */}
      <div style={styles.actionBar}>
        {onBack && (
          <button className="ifp-back-btn" onClick={onBack} type="button">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Setup
          </button>
        )}
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
          <p style={styles.statValue}>{expectedTotal || allStudents.length}</p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <p style={styles.statLabel}>Feedback Generated</p>
          <p style={{ ...styles.statValue, color: 'var(--color-primary)' }}>
            {completers.length}
            {feedbackLoading && expectedCompleters > 0 && (
              <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--color-on-surface-variant)', marginLeft: '2px' }}>
                {` / ${expectedCompleters}`}
              </span>
            )}
          </p>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <p style={styles.statLabel}>No Submission</p>
          <p style={{ ...styles.statValue, color: 'var(--color-error)' }}>{expectedNonCompleters || nonCompleters.length}</p>
        </div>
        {!feedbackLoading && missingStudents.length > 0 && (
          <>
            <div style={styles.divider} />
            <div style={styles.statItem}>
              <p style={styles.statLabel}>Not Returned</p>
              <p style={{ ...styles.statValue, color: 'var(--color-on-surface-variant)' }}>{missingStudents.length}</p>
            </div>
          </>
        )}
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

      {/* Error box */}
      {feedbackError && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>!</span>
          {feedbackError}
        </div>
      )}

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

      {/* Truncation warning */}
      {!feedbackLoading && truncated && (
        <div style={styles.truncationWarning}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>warning</span>
          The AI response was cut short — some students above may be missing feedback. Try regenerating.
        </div>
      )}

      {/* Card list */}
      <div style={styles.cardList}>
        {filteredStudents.map((student, i) => {
          // Missing feedback placeholder
          if (student.isMissingFeedback) {
            return (
              <div key={`missing-${i}`} className="ifp-missing-card">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
                  help_outline
                </span>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: 'var(--color-on-surface)' }}>
                    {student.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Feedback was not returned for this student. Score: {student.total}/{student.maxTotal}. Try regenerating.
                  </p>
                </div>
              </div>
            )
          }

          return (
            <StudentCard
              key={i}
              student={
                student.breakdown
                  ? student
                  : { ...student, breakdown: getBreakdown(student.name) }
              }
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
          )
        })}

        {feedbackLoading && (
          <div style={styles.loadingBlock}>
            <span className="ifp-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
              {`Generating… ${students.length} of ${expectedCompleters} student${expectedCompleters !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    paddingTop: '28px',
  },
  // Hero title
  hero: {
    padding: '0 32px',
    marginBottom: '24px',
  },
  heroEyebrow: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  heroTitle: {
    margin: '0 0 8px',
    fontSize: '34px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  heroDot: {
    color: 'var(--color-outline)',
    fontWeight: '400',
  },
  heroAccent: {
    color: 'var(--color-primary)',
  },
  heroContext: {
    margin: '10px 0 0',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  },
  // Empty state
  emptyWrapper: {
    padding: '0 48px 64px',
    display: 'flex',
    justifyContent: 'center',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '420px',
    padding: '48px 40px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '16px',
    border: '1px solid rgba(147, 179, 233, 0.15)',
  },
  emptyIcon: {
    fontSize: '48px',
    color: 'var(--color-outline)',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 12px',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  emptyDesc: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.6',
  },
  // Action bar
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
    padding: '0 32px',
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
    marginLeft: '32px',
    marginRight: '32px',
    flexWrap: 'wrap',
  },
  statItem: { flexShrink: 0 },
  statLabel: {
    margin: '0 0 2px',
    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)',
  },
  statValue: { margin: '0', fontSize: '22px', fontWeight: '900', color: 'var(--color-on-surface)' },
  divider: { width: '1px', height: '32px', backgroundColor: 'rgba(147, 179, 233, 0.2)', flexShrink: 0 },
  generatingSlot: { marginLeft: 'auto' },
  generatingPill: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 12px',
    background: 'var(--color-surface-container)',
    border: '1px solid rgba(147, 179, 233, 0.3)', borderRadius: '999px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    margin: '0 32px 16px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#b91c1c',
    lineHeight: '1.5',
  },
  errorIcon: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#b91c1c',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    marginTop: '1px',
  },
  filterBar: { padding: '0 32px', marginBottom: '24px' },
  filterPills: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  thresholdInner: { display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px' },
  thresholdLabel: { fontSize: '13px', color: 'var(--color-on-surface)', whiteSpace: 'nowrap' },
  thresholdNote: { fontSize: '12px', color: 'var(--color-on-surface-variant)', fontWeight: '400', marginLeft: '4px' },
  rangeInput: { flexShrink: 0, width: '160px', accentColor: 'var(--color-primary)', cursor: 'pointer' },
  truncationWarning: {
    display: 'flex', alignItems: 'center', gap: '10px',
    margin: '0 32px 16px',
    padding: '12px 16px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#92400e',
    lineHeight: '1.5',
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 32px 40px' },
  loadingBlock: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '16px 20px',
    background: 'var(--color-surface-container-low)', borderRadius: '12px',
  },
}
