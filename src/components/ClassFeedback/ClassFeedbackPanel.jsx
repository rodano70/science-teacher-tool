/**
 * ClassFeedbackPanel — Whole Class Feedback sheet, four-zone layout.
 *
 * Zone 1 — Context header (identity block + stat tiles + action buttons)
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

  // Parse praise and concerns — strings formatted as "Name — reason" or "Name: reason"
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

      <div style={styles.sheet} id="wcf-sheet">

        {/* ── Zone 1: Context header ─────────────────────────────────────── */}
        <div style={styles.zone1}>

          {/* Identity block */}
          <div style={styles.headerIdentity}>
            <p style={styles.headerEyebrow}>Class Feedback · {today}</p>
            <h2 style={styles.headerTitle}>{topic || 'Whole Class Feedback'}</h2>
            <p style={styles.headerSubtitle}>{examBoard} {subject}</p>
          </div>

          {/* Stat tiles + actions */}
          {statCards && (
            <div style={styles.headerControls}>

              {/* Avg tile — primary-container */}
              {classAvgPct != null && (
                <div style={{ ...styles.statTile, ...styles.statTilePrimary }}>
                  <span style={styles.tileMicroLabel}>Average</span>
                  <span style={{ ...styles.tileValue, color: 'var(--color-on-primary-container)' }}>{classAvgPct}%</span>
                </div>
              )}

              {/* Completers tile */}
              {completersCount != null && (
                <div style={{ ...styles.statTile, ...styles.statTileSurface }}>
                  <span style={styles.tileMicroLabel}>Completers</span>
                  <span style={styles.tileValue}>{completersCount}</span>
                </div>
              )}

              {/* Range tile */}
              {minScore != null && maxScore != null && (
                <div style={{ ...styles.statTile, ...styles.statTileSurface }}>
                  <span style={styles.tileMicroLabel}>Range</span>
                  <span style={{ ...styles.tileValue, fontSize: '18px' }}>
                    {minScore}–{maxScore}
                    <span style={styles.tileRangeSuffix}>/{summary.classTotalMax}</span>
                  </span>
                </div>
              )}

              {/* Absent / non-completers tile */}
              {nonCompletersCount != null && nonCompletersCount > 0 && (
                <div style={{ ...styles.statTile, ...styles.statTileAlert }}>
                  <span style={{ ...styles.tileMicroLabel, color: 'var(--color-error)', opacity: 0.7 }}>Absent</span>
                  <span style={{ ...styles.tileValue, color: 'var(--color-error)' }}>{nonCompletersCount}</span>
                </div>
              )}

              {/* Vertical divider */}
              <div style={styles.headerVDivider} />

              {/* Action buttons */}
              <div style={styles.headerActions} className="no-print">
                <button style={styles.btnPrint} onClick={handlePrint}>
                  <span className="material-symbols-outlined" style={styles.btnIcon}>print</span>
                  Print
                </button>
                <button style={styles.btnIndividual}>
                  <span className="material-symbols-outlined" style={styles.btnIcon}>person</span>
                  Individual
                </button>
              </div>
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
          <p style={styles.sectionLabel}>Individual Signals</p>
          <div style={styles.signalsGrid}>

            {/* Praise in class */}
            <div style={styles.signalCard}>
              <div style={styles.signalCardHeader}>
                <span className="material-symbols-outlined filled" style={styles.iconTertiary}>star</span>
                <h3 style={styles.signalHeading}>Praise in class</h3>
              </div>
              {praiseList.length > 0 ? (() => {
                const parsed = praiseList.map(item => {
                  const match = item.match(/^(.+?)(?:\s+[—–]\s+|:\s+)(.+)$/)
                  return { name: match ? match[1] : item, reason: match ? match[2] : null }
                })
                const notes = parsed.filter(p => p.reason).map(p => `${p.name}: ${p.reason}`)
                return (
                  <>
                    <div style={styles.praisePillWrap}>
                      {parsed.map((p, i) => (
                        <span key={i} style={styles.praisePill}>{p.name}</span>
                      ))}
                    </div>
                    {notes.length > 0 && (
                      <p style={styles.praiseHint}>{notes.join(' · ')}</p>
                    )}
                  </>
                )
              })() : (
                <p style={styles.empty}>No students identified for praise.</p>
              )}
            </div>

            {/* Students needing attention */}
            <div style={styles.signalCard}>
              <div style={styles.signalCardHeader}>
                <span className="material-symbols-outlined" style={styles.iconError}>person_alert</span>
                <h3 style={styles.signalHeading}>Students needing attention</h3>
              </div>
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
                        {label && <span style={styles.concernBadge}>{label}</span>}
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
                    {nonCompleters.join(', ')}
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
            <p style={styles.sectionLabel}>Performance Analytics</p>
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

  /* ── Sheet container ─────────────────────────────────────────────────── */
  sheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },

  /* ── Zone 1: Context header ──────────────────────────────────────────── */
  zone1: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '24px 24px 20px',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
  },
  headerIdentity: {
    flex: '1 1 200px',
  },
  headerEyebrow: {
    margin: '0 0 4px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  },
  headerTitle: {
    margin: '0 0 4px',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.01em',
    lineHeight: '1.25',
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  statTile: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    padding: '12px 18px',
    minWidth: '80px',
    gap: '2px',
  },
  statTilePrimary: {
    backgroundColor: 'var(--color-primary-container)',
  },
  statTileSurface: {
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid rgba(147, 179, 233, 0.20)',
  },
  statTileAlert: {
    backgroundColor: 'rgba(254, 137, 131, 0.15)',
    border: '1px solid rgba(159, 64, 61, 0.10)',
  },
  tileMicroLabel: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    opacity: 0.7,
  },
  tileValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--color-on-primary-container)',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  tileRangeSuffix: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
    marginLeft: '1px',
  },
  tileLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '2px',
  },
  headerVDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e5e7eb',
    flexShrink: 0,
    alignSelf: 'center',
    margin: '0 4px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  btnPrint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #455f88 0%, #39537c 100%)',
    color: '#f6f7ff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    boxShadow: '0 2px 6px rgba(69, 95, 136, 0.18)',
  },
  btnIndividual: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '2px solid var(--color-primary)',
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  btnIcon: {
    fontSize: '16px',
  },

  /* ── Section label (shared) ──────────────────────────────────────────── */
  sectionLabel: {
    margin: '0 0 14px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-on-surface-variant)',
  },

  /* ── Zone 3: Individual Signals ──────────────────────────────────────── */
  signalsZone: {
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  signalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: '16px',
  },
  signalCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '18px 20px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  signalCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  iconTertiary: {
    fontSize: '20px',
    color: 'var(--color-tertiary)',
  },
  iconError: {
    fontSize: '20px',
    color: 'var(--color-error)',
  },
  signalHeading: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    letterSpacing: '0.01em',
  },

  /* Praise pills */
  praisePillWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '10px',
  },
  praisePill: {
    display: 'inline-block',
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    borderRadius: '20px',
    padding: '3px 12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  praiseHint: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },

  /* Concern rows */
  concernsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  concernRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 0',
  },
  concernName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  concernLabel: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  concernBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--color-error)',
    backgroundColor: 'rgba(254, 137, 131, 0.18)',
    padding: '3px 8px',
    borderRadius: '6px',
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

  /* ── Zone 5: Analytics ───────────────────────────────────────────────── */
  analyticsZone: {
    borderTop: '1px solid #e5e7eb',
    padding: '20px 24px 0',
  },

  /* ── Shared ──────────────────────────────────────────────────────────── */
  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
