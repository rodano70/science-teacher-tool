/**
 * ClassFeedbackPanel — Whole Class Feedback sheet, four-zone layout.
 *
 * Zone 1 — Context header (class identity, stat pills, print action)
 * Zone 2 — Assessment Diagnosis  → DiagnosisZone
 * Zone 3 — Individual Signals    → inline (praise + concerns)
 * Zone 4 — Teaching Implications → ImplicationsZone
 * Zone 5 — Performance Analytics → PerformanceDashboard
 */
import DiagnosisZone from './DiagnosisZone'
import ImplicationsZone from './ImplicationsZone'
import PerformanceDashboard from './PerformanceDashboard'
import { computeClassSummary } from '../../classUtils'

export default function ClassFeedbackPanel({ data, examBoard, subject, topic, studentData, questionStats, scoreDistribution }) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const summary = studentData ? computeClassSummary(studentData) : null
  const classAvgPct = summary && summary.classTotalMax > 0
    ? Math.round((summary.classAverage / summary.classTotalMax) * 100)
    : null
  const completersCount = summary ? summary.studentCount - summary.nonCompleters.length : null
  const nonCompletersCount = summary ? summary.nonCompleters.length : null
  const minScore = summary && summary.bottomStudents.length > 0 ? summary.bottomStudents[0].total : null
  const maxScore = summary && summary.topStudents.length > 0 ? summary.topStudents[0].total : null

  const statCards = summary ? {
    classAvgPct,
    completersCount,
    nonCompletersCount,
    minScore,
    maxScore,
    classTotalMax: summary.classTotalMax,
  } : null

  const nonCompleters = summary ? summary.nonCompleters : []

  // Parse praise and concerns — strings formatted as "Name — reason"
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])
  const praiseList = toArray(data.students_to_praise)
  const concernsList = toArray(data.individual_concerns)

  function handlePrint() {
    window.print()
  }

  return (
    <div style={styles.wrapper}>

      {/* ── Print-only header (hidden on screen, shown in print) ───────── */}
      <div className="print-only" style={styles.printHeader}>
        <span style={styles.printWordmark}>TeacherDesk</span>
        <span style={styles.printMeta}>{examBoard} {subject} — {topic} · {today}</span>
        <div style={styles.printPills}>
          {classAvgPct != null && (
            <span style={styles.printPill}>{classAvgPct}% avg</span>
          )}
          {completersCount != null && (
            <span style={styles.printPill}>{completersCount} completers</span>
          )}
          {minScore != null && maxScore != null && (
            <span style={styles.printPill}>{minScore}–{maxScore} range</span>
          )}
        </div>
      </div>

      {/* ── Print button ───────────────────────────────────────────────── */}
      <div style={styles.printBar} className="no-print">
        <button className="btn-print" style={styles.printButton} onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      <div style={styles.sheet} id="wcf-sheet">

        {/* ── Zone 1: Context header ─────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h2 style={styles.title}>Whole Class Feedback Sheet</h2>
              <div style={styles.meta}>
                <span>{examBoard} {subject} — {topic}</span>
                <span style={styles.date}>{today}</span>
              </div>
            </div>
          </div>
          {/* Stat pills — quick summary in Zone 1 */}
          {statCards && (
            <div style={styles.statPills}>
              {classAvgPct != null && (
                <span style={styles.statPill}>
                  <span style={styles.pillValue}>{classAvgPct}%</span>
                  <span style={styles.pillLabel}>avg</span>
                </span>
              )}
              {completersCount != null && (
                <span style={styles.statPill}>
                  <span style={styles.pillValue}>{completersCount}</span>
                  <span style={styles.pillLabel}>completers</span>
                </span>
              )}
              {nonCompletersCount != null && nonCompletersCount > 0 && (
                <span style={{ ...styles.statPill, ...styles.statPillAlert }}>
                  <span style={styles.pillValue}>{nonCompletersCount}</span>
                  <span style={styles.pillLabel}>non-completers</span>
                </span>
              )}
              {minScore != null && maxScore != null && (
                <span style={styles.statPill}>
                  <span style={styles.pillValue}>{minScore}–{maxScore}</span>
                  <span style={styles.pillLabel}>range / {summary.classTotalMax}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Zone 2: Assessment Diagnosis ──────────────────────────────── */}
        <DiagnosisZone
          successes={data.key_successes}
          misconceptions={data.key_misconceptions}
          little_errors={data.little_errors}
        />

        {/* ── Zone 3: Individual Signals ────────────────────────────────── */}
        <div style={styles.signalsZone}>
          <div style={styles.signalsGrid}>

            {/* Praise in class */}
            <div style={styles.signalCard}>
              <h3 style={styles.signalHeading}>Praise in class</h3>
              {praiseList.length > 0 ? (
                <div style={styles.praisePillWrap}>
                  {praiseList.map((item, i) => {
                    const parts = item.split(/\s+[—–-]\s+/)
                    const name = parts[0] ?? item
                    const reason = parts[1] ?? null
                    return (
                      <div key={i} style={styles.praiseRow}>
                        <span style={styles.praisePill}>{name}</span>
                        {reason && <span style={styles.praiseReason}>{reason}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={styles.empty}>No students identified for praise.</p>
              )}
            </div>

            {/* Students needing attention */}
            <div style={styles.signalCard}>
              <h3 style={styles.signalHeading}>Students needing attention</h3>
              {concernsList.length > 0 ? (
                <div style={styles.concernsList}>
                  {concernsList.map((item, i) => {
                    const parts = item.split(/\s+[—–-]\s+/)
                    const name = parts[0] ?? item
                    const label = parts[1] ?? null
                    return (
                      <div key={i} style={{
                        ...styles.concernRow,
                        borderBottom: i < concernsList.length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}>
                        <span style={styles.concernName}>{name}</span>
                        {label && <span style={styles.concernLabel}>{label}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={styles.empty}>No individual concerns identified.</p>
              )}
              {/* Non-completers group at bottom */}
              {nonCompleters.length > 0 && (
                <div style={styles.nonCompleterGroup}>
                  <span style={styles.nonCompleterLabel}>Non-completers:</span>
                  <span style={styles.nonCompleterNames}>
                    {nonCompleters.map(s => s.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Zone 4: Teaching Implications ────────────────────────────── */}
        <ImplicationsZone
          immediate_action={data.immediate_action}
          long_term_implications={data.long_term_implications}
        />

        {/* ── Zone 5: Performance Analytics ─────────────────────────────── */}
        {statCards && (
          <div style={styles.analyticsZone} className="no-print">
            <p style={styles.zoneLabel}>PERFORMANCE ANALYTICS</p>
            <PerformanceDashboard
              statCards={statCards}
              questionStats={questionStats}
              scoreDistribution={scoreDistribution}
            />
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    marginTop: '32px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '28px',
  },

  /* ── Print-only header ───────────────────────────────────────────────── */
  printHeader: {
    display: 'none', // overridden by .print-only in @media print
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0 12px',
    borderBottom: '1px solid #ccc',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  printWordmark: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1e3150',
  },
  printMeta: {
    fontSize: '12px',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  printPills: {
    display: 'flex',
    gap: '8px',
  },
  printPill: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    color: '#374151',
  },

  /* ── Print button ────────────────────────────────────────────────────── */
  printBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '14px',
  },
  printButton: {
    padding: '9px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#374151',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },

  /* ── Sheet container ─────────────────────────────────────────────────── */
  sheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },

  /* ── Zone 1: Header ──────────────────────────────────────────────────── */
  header: {
    backgroundColor: '#1e3150',
    color: '#ffffff',
    padding: '20px 24px 16px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    margin: '0 0 6px',
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.01em',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#93c5fd',
    flexWrap: 'wrap',
    gap: '8px',
  },
  date: {
    color: '#7dd3fc',
  },
  statPills: {
    display: 'flex',
    gap: '8px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  statPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
    padding: '4px 12px',
  },
  statPillAlert: {
    backgroundColor: 'rgba(254,137,131,0.15)',
    border: '1px solid rgba(254,137,131,0.25)',
  },
  pillValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  pillLabel: {
    fontSize: '11px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.70)',
  },

  /* ── Zone 3: Individual Signals ──────────────────────────────────────── */
  signalsZone: {
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  signalsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  signalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '18px 20px',
    border: '1px solid #e5e7eb',
  },
  signalHeading: {
    margin: '0 0 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '0.01em',
  },

  /* Praise pills */
  praisePillWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  praiseRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flexWrap: 'wrap',
  },
  praisePill: {
    display: 'inline-block',
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    borderRadius: '20px',
    padding: '3px 12px',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  praiseReason: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: '1.5',
    paddingTop: '2px',
  },

  /* Concern rows */
  concernsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  concernRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 0',
    flexWrap: 'wrap',
  },
  concernName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
    flexShrink: 0,
  },
  concernLabel: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  nonCompleterGroup: {
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'flex-start',
  },
  nonCompleterLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  nonCompleterNames: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  /* ── Zone 5: Analytics label ─────────────────────────────────────────── */
  analyticsZone: {
    borderTop: '1px solid #e5e7eb',
    padding: '20px 24px 0',
  },
  zoneLabel: {
    margin: '0 0 12px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-on-surface-variant)',
  },

  /* ── Shared ──────────────────────────────────────────────────────────── */
  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
