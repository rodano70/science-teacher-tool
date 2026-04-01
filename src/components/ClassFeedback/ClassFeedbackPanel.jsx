/**
 * ClassFeedbackPanel — Whole Class Feedback sheet, four-zone layout.
 *
 * Zone 1 — Context header (identity block + stat tiles + action buttons)
 * Zone 2 — Assessment Diagnosis  → DiagnosisZone
 * Zone 3 — Individual Signals    → inline (praise + concerns)
 * Zone 4 — Teaching Implications → ImplicationsZone
 * Zone 5 — Performance Analytics → PerformanceDashboard
 */
import { useState, useEffect } from 'react'
import DiagnosisZone from './DiagnosisZone'
import ImplicationsZone from './ImplicationsZone'
import PerformanceDashboard from './PerformanceDashboard'
import ClassFeedbackHeader from './ClassFeedbackHeader'
import IndividualSignalsZone from './IndividualSignalsZone'
import { computeClassSummary } from '../../classUtils'
import { downloadWCFDoc } from '../../utils/docUtils'

/* ── Main component ─────────────────────────────────────────────────────── */
export default function ClassFeedbackPanel({
  data,
  wcfLoading = false,
  wcfProgress = 0,
  wcfError = '',
  examBoard,
  subject,
  topic,
  studentData,
  questionStats,
  scoreDistribution,
  onBack,
  onSwitchToIndividual,
}) {
  // Editable copy of data — changes here flow to download but not back to API
  const [editedData, setEditedData] = useState(data || {})
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const TOTAL_SECTIONS = 7
  const SECTION_KEYS_ALL = ['key_successes', 'key_misconceptions', 'individual_concerns', 'little_errors', 'students_to_praise', 'long_term_implications', 'immediate_action']
  const sectionsReceived = data ? SECTION_KEYS_ALL.filter(k => data[k] !== undefined).length : 0

  useEffect(() => {
    if (data) setEditedData(data)
  }, [data])

  function updateArrayItem(field, idx, value) {
    setEditedData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => i === idx ? value : item),
    }))
  }

  function updateString(field, value) {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  // ── Class summary (derived) ──────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const summary = studentData ? computeClassSummary(studentData) : null
  const classAvgPct = summary && summary.classTotalMax > 0
    ? Math.round((summary.classAverage / summary.classTotalMax) * 100)
    : null
  const completersCount = summary ? summary.studentCount - summary.nonCompleters.length : null
  const nonCompletersCount = summary ? summary.nonCompleters.length : null
  const minScore = summary && summary.bottomStudents.length > 0 ? summary.bottomStudents[0].total : null
  const maxScore = summary && summary.topStudents.length > 0 ? summary.topStudents[0].total : null

  const statCards = summary ? {
    classAvgPct, completersCount, nonCompletersCount, minScore, maxScore,
    classTotalMax: summary.classTotalMax,
  } : null

  // ── Parse signals ────────────────────────────────────────────────────────
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : [])
  const praiseList = toArray(editedData.students_to_praise)
  const concernsList = toArray(editedData.individual_concerns)

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handlePrint() { window.print() }

  async function handleDownload() {
    await downloadWCFDoc({
      wcfData: editedData,
      examBoard,
      subject,
      topic,
      statCards,
      setSuccess: setDownloadSuccess,
    })
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!data && !wcfLoading) {
    return (
      <div style={styles.wrapper}>
        <ClassFeedbackHeader
          examBoard={examBoard} subject={subject} topic={topic}
          today={today}
          wcfLoading={wcfLoading}
          sectionsReceived={sectionsReceived}
          totalSections={TOTAL_SECTIONS}
          hasData={false}
          statCards={null}
          onBack={onBack}
          onDownload={handleDownload}
          downloadSuccess={downloadSuccess}
          onPrint={handlePrint}
        />
        {wcfError && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>!</span>
            {wcfError}
          </div>
        )}
        <div style={styles.emptyInner}>
          <div style={styles.emptyCard}>
            <span className="material-symbols-outlined" style={styles.emptyIcon}>group</span>
            <h2 style={styles.emptyTitle}>No class feedback yet</h2>
            <p style={styles.emptyDesc}>
              Go to the Upload section, upload your marksheet and fill in the exam details, then click{' '}
              <strong>Generate Whole Class Feedback</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <ClassFeedbackHeader
        examBoard={examBoard} subject={subject} topic={topic}
        today={today}
        wcfLoading={wcfLoading}
        sectionsReceived={sectionsReceived}
        totalSections={TOTAL_SECTIONS}
        hasData={!!data}
        statCards={statCards}
        onBack={onBack}
        onSwitchToIndividual={onSwitchToIndividual}
        onDownload={handleDownload}
        downloadSuccess={downloadSuccess}
        onPrint={handlePrint}
      />

      {/* ── Loading card — Phase 1: generating, no sections received yet ──── */}
      {wcfLoading && !data && (
        <div style={styles.loadingCard}>
          <div style={styles.loadingHeader}>
            <p style={styles.loadingLabel}>Generating your class feedback…</p>
            <span style={styles.loadingCount}>0 of {TOTAL_SECTIONS} modules</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${wcfProgress}%` }} />
          </div>
        </div>
      )}

      {/* ── Error box ─────────────────────────────────────────────────────── */}
      {wcfError && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>!</span>
          {wcfError}
        </div>
      )}

      {/* ── WCF Sheet — Phase 2+: sections arriving or complete ──────────── */}
      {data && <div style={styles.sheet} id="wcf-sheet">

        {/* ── Zone 1: Context header ─────────────────────────────────────── */}
        <div style={styles.zone1}>
          <div style={styles.headerIdentity}>
            <p style={styles.headerEyebrow}>Class Feedback · {today}</p>
            <h2 style={styles.headerTitle}>{topic || 'Whole Class Feedback'}</h2>
            <p style={styles.headerSubtitle}>{examBoard} {subject}</p>
          </div>

          {statCards && (
            <div style={styles.headerControls}>
              {classAvgPct != null && (
                <div style={{ ...styles.statTile, ...styles.statTilePrimary }}>
                  <span style={styles.tileMicroLabel}>Average</span>
                  <span style={{ ...styles.tileValue, color: 'var(--color-on-primary-container)' }}>{classAvgPct}%</span>
                </div>
              )}
              {completersCount != null && (
                <div style={{ ...styles.statTile, ...styles.statTileSurface }}>
                  <span style={styles.tileMicroLabel}>Completers</span>
                  <span style={styles.tileValue}>{completersCount}</span>
                </div>
              )}
              {minScore != null && maxScore != null && (
                <div style={{ ...styles.statTile, ...styles.statTileSurface }}>
                  <span style={styles.tileMicroLabel}>Range</span>
                  <span style={{ ...styles.tileValue, fontSize: '18px' }}>
                    {minScore}–{maxScore}
                    <span style={styles.tileRangeSuffix}>/{summary.classTotalMax}</span>
                  </span>
                </div>
              )}
              {nonCompletersCount != null && nonCompletersCount > 0 && (
                <div style={{ ...styles.statTile, ...styles.statTileAlert }}>
                  <span style={{ ...styles.tileMicroLabel, color: 'var(--color-error)', opacity: 0.7 }}>Absent</span>
                  <span style={{ ...styles.tileValue, color: 'var(--color-error)' }}>{nonCompletersCount}</span>
                </div>
              )}
              <div style={styles.headerVDivider} />
              <div style={styles.headerActions} className="no-print">
                <button style={styles.btnPrint} onClick={handlePrint} title="Print this sheet">
                  <span className="material-symbols-outlined" style={styles.btnIcon}>print</span>
                  Print
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Zone 2: Assessment Diagnosis ──────────────────────────────── */}
        <DiagnosisZone
          successes={editedData.key_successes}
          misconceptions={editedData.key_misconceptions}
          little_errors={editedData.little_errors}
          onEdit={(field, idx, val) => updateArrayItem(field, idx, val)}
        />

        {/* ── Zone 3: Individual Signals ────────────────────────────────── */}
        <IndividualSignalsZone
          praiseList={praiseList}
          concernsList={concernsList}
          onPraiseChange={(i, val) => {
            setEditedData(prev => ({
              ...prev,
              students_to_praise: (prev.students_to_praise || []).map((item, idx) => {
                if (idx !== i) return item
                const match = item.match(/^(.+?)(?:\s+[—–]\s+|:\s+)/)
                const name = match ? match[1].trim() : item.trim()
                return `${name} — ${val}`
              }),
            }))
          }}
          onConcernChange={(i, val) => {
            setEditedData(prev => ({
              ...prev,
              individual_concerns: (prev.individual_concerns || []).map((item, idx) => {
                if (idx !== i) return item
                const parts = item.split(/\s+[—–]\s+/)
                const head = parts[0] || item
                return val ? `${head} — ${val}` : head
              }),
            }))
          }}
        />

        {/* ── Zone 4: Teaching Implications ────────────────────────────── */}
        <ImplicationsZone
          immediate_action={editedData.immediate_action}
          long_term_implications={editedData.long_term_implications}
          onEdit={(field, idx, val) => {
            if (field === 'immediate_action') {
              updateString('immediate_action', val)
            } else {
              updateArrayItem(field, idx, val)
            }
          }}
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

      </div>}

    </div>
  )
}

const styles = {
  /* ── Loading state ───────────────────────────────────────────────────── */
  loadingCard: {
    margin: '0 32px',
    padding: '32px 40px',
    background: 'var(--color-surface-container-low)',
    borderRadius: '16px',
    border: '1px solid rgba(147, 179, 233, 0.15)',
  },
  loadingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '16px',
  },
  loadingCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    whiteSpace: 'nowrap',
  },
  loadingLabel: {
    margin: '0',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
  },
  progressTrack: {
    height: '6px',
    borderRadius: '999px',
    background: 'var(--color-surface-container-high)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '999px',
    background: 'var(--color-primary)',
    transition: 'width 0.25s ease',
  },

  /* ── Empty state ─────────────────────────────────────────────────────── */
  emptyWrapper: {
    padding: '40px 48px 64px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '400px',
  },
  emptyInner: {
    padding: '0 32px 48px',
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

  /* ── Error box ───────────────────────────────────────────────────────── */
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    margin: '16px 32px 0',
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

  /* ── Wrapper ─────────────────────────────────────────────────────────── */
  wrapper: {
    paddingTop: '28px',
  },

  /* ── Sheet container ─────────────────────────────────────────────────── */
  sheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    marginLeft: '32px',
    marginRight: '32px',
    marginBottom: '40px',
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
  headerIdentity: { flex: '1 1 200px' },
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
  headerSubtitle: { margin: 0, fontSize: '13px', color: 'var(--color-on-surface-variant)' },
  headerControls: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0,
  },
  statTile: {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    borderRadius: '12px', padding: '12px 18px', minWidth: '80px', gap: '2px',
  },
  statTilePrimary: { backgroundColor: 'var(--color-primary-container)' },
  statTileSurface: { backgroundColor: 'var(--color-surface-container-low)', border: '1px solid rgba(147, 179, 233, 0.20)' },
  statTileAlert: { backgroundColor: 'rgba(254, 137, 131, 0.15)', border: '1px solid rgba(159, 64, 61, 0.10)' },
  tileMicroLabel: {
    fontSize: '9px', fontWeight: '800', color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7,
  },
  tileValue: { fontSize: '22px', fontWeight: '800', color: 'var(--color-on-primary-container)', lineHeight: '1.1', letterSpacing: '-0.02em' },
  tileRangeSuffix: { fontSize: '12px', fontWeight: '600', color: 'var(--color-on-surface-variant)', marginLeft: '1px' },
  headerVDivider: { width: '1px', height: '40px', backgroundColor: '#e5e7eb', flexShrink: 0, alignSelf: 'center', margin: '0 4px' },
  headerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  btnPrint: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    borderRadius: '8px', border: 'none',
    background: 'var(--color-surface-container-high)',
    color: 'var(--color-on-surface-variant)',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.01em',
  },
  btnIcon: { fontSize: '16px' },

  /* ── Section label (shared) ──────────────────────────────────────────── */
  sectionLabel: {
    margin: '0 0 14px',
    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.12em', color: 'var(--color-on-surface-variant)',
  },

  /* ── Zone 5: Analytics ───────────────────────────────────────────────── */
  analyticsZone: { borderTop: '1px solid #e5e7eb', padding: '20px 24px 0' },
}
