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
import { computeClassSummary } from '../../classUtils'
import { downloadWCFDoc } from '../../utils/docUtils'

/* ── EditableItem (inline) ──────────────────────────────────────────────── */
function EditableItem({ value, onChange, style }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => { setVal(value) }, [value])

  if (editing) {
    return (
      <textarea
        ref={el => { if (el) { el.focus(); el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
        value={val}
        onChange={e => {
          setVal(e.target.value)
          const el = e.target
          el.style.height = 'auto'
          el.style.height = el.scrollHeight + 'px'
        }}
        onBlur={() => { setEditing(false); onChange(val) }}
        onKeyDown={e => { if (e.key === 'Escape') { setVal(value); setEditing(false) } }}
        style={{ ...eiStyles.textarea, ...(style || {}) }}
      />
    )
  }
  return (
    <span
      className="wcf-editable"
      onClick={() => setEditing(true)}
      style={{ ...eiStyles.span, ...(style || {}) }}
      title="Click to edit"
    >
      {val}
      <span className="wcf-pencil" style={eiStyles.pencil}>✏</span>
    </span>
  )
}

const eiStyles = {
  span: { display: 'block', borderRadius: '4px', padding: '1px 3px', marginLeft: '-3px', cursor: 'text', position: 'relative' },
  pencil: { marginLeft: '5px', fontSize: '10px', opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none', verticalAlign: 'middle' },
  textarea: {
    width: '100%', border: '1px solid var(--color-primary)', borderRadius: '4px', padding: '3px 6px',
    fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container-low)', fontFamily: 'inherit',
    resize: 'none', outline: 'none', boxSizing: 'border-box', overflow: 'hidden', display: 'block', minHeight: '22px',
  },
}

/* ── Praise sub-component ───────────────────────────────────────────────── */
function PraiseSection({ praiseList, onPraiseChange }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const parsed = praiseList.map(item => {
    const match = item.match(/^(.+?)(?:\s+[—–]\s+|:\s+)(.+)$/)
    const name = match ? match[1].trim() : item.trim()
    const rawReason = match ? match[2].trim() : null
    const score = rawReason ? (rawReason.match(/\b(\d+)\/(\d+)\b/)?.[0] ?? null) : null
    const afterDash = rawReason ? rawReason.split(/\s+[—–]\s+/) : []
    const description = afterDash.length > 1 ? afterDash.slice(1).join(' — ') : rawReason
    return { name, score, description }
  })

  function toggleIdx(i) {
    setActiveIdx(prev => (prev === i ? null : i))
  }

  return (
    <>
      <div style={praiseStyles.pillWrap}>
        {parsed.map((p, i) => (
          <span
            key={i}
            style={{ ...praiseStyles.pill, ...(activeIdx === i ? praiseStyles.pillActive : {}) }}
            onClick={() => toggleIdx(i)}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div style={praiseStyles.blockList}>
        {praiseList.map((rawItem, i) => {
          const p = parsed[i]
          return (
            <div
              key={i}
              style={{ ...praiseStyles.block, ...(activeIdx === i ? praiseStyles.blockHighlighted : {}) }}
            >
              <div style={praiseStyles.blockHeader}>
                <span style={praiseStyles.blockName}>{p.name}</span>
                {p.score && <span style={praiseStyles.scoreBadge}>{p.score}</span>}
              </div>
              {onPraiseChange ? (
                <EditableItem
                  value={p.description || rawItem}
                  onChange={val => onPraiseChange(i, val)}
                  style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)', margin: 0 }}
                />
              ) : (
                p.description && <p style={praiseStyles.blockText}>{p.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const praiseStyles = {
  pillWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  pill: {
    display: 'inline-block',
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    borderRadius: '20px',
    padding: '4px 13px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  pillActive: {
    border: '2px solid var(--color-primary)',
  },
  blockList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  block: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid rgba(93, 93, 120, 0.10)',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  blockHighlighted: {
    backgroundColor: 'var(--color-primary-container)',
    border: '1px solid var(--color-outline-variant)',
  },
  blockHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  blockName: { fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },
  scoreBadge: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.02em',
  },
  blockText: { margin: 0, fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)' },
}

/* ── Concern sub-component ──────────────────────────────────────────────── */
function ConcernSection({ concernsList, onConcernChange }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const parsed = concernsList.map(item => {
    const parts = item.split(/\s+[—–]\s+/)
    const firstPart = parts[0]?.trim() ?? ''
    const description = parts.slice(1).join(' — ').trim() || null
    const colonIdx = firstPart.indexOf(':')
    const name = colonIdx > 0 ? firstPart.substring(0, colonIdx).trim() : firstPart.trim()
    const isNonCompleter = /non.?completer/i.test(firstPart)
    const scoreMatch = !isNonCompleter ? firstPart.match(/\b(\d+)\/(\d+)\b/) : null
    const score = scoreMatch ? scoreMatch[0] : null
    return { name, score, isNonCompleter, description }
  })

  function toggleIdx(i) {
    setActiveIdx(prev => (prev === i ? null : i))
  }

  return (
    <>
      <div style={concernStyles.pillWrap}>
        {parsed.map((p, i) => (
          <span
            key={i}
            style={{ ...concernStyles.pill, ...(activeIdx === i ? concernStyles.pillActive : {}) }}
            onClick={() => toggleIdx(i)}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div style={concernStyles.blockList}>
        {concernsList.map((rawItem, i) => {
          const p = parsed[i]
          return (
            <div
              key={i}
              style={{
                ...concernStyles.block,
                ...(activeIdx === i ? concernStyles.blockHighlighted : {}),
                borderBottom: i < concernsList.length - 1 ? '1px solid rgba(254, 137, 131, 0.12)' : 'none',
              }}
            >
              <div style={concernStyles.blockHeader}>
                <span style={concernStyles.blockName}>{p.name}</span>
                {p.isNonCompleter
                  ? <span style={concernStyles.nonCompleterBadge}>non-completer</span>
                  : p.score
                    ? <span style={concernStyles.scoreBadge}>{p.score}</span>
                    : null
                }
              </div>
              {onConcernChange ? (
                <EditableItem
                  value={p.description || ''}
                  onChange={val => onConcernChange(i, val)}
                  style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)', margin: 0 }}
                />
              ) : (
                p.description && <p style={concernStyles.blockText}>{p.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const concernStyles = {
  pillWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  pill: {
    display: 'inline-block',
    backgroundColor: 'rgba(254, 137, 131, 0.08)',
    color: 'var(--color-error)',
    borderRadius: '20px',
    padding: '4px 13px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid transparent',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  pillActive: {
    border: '2px solid rgba(159, 64, 61, 0.35)',
    backgroundColor: 'rgba(254, 137, 131, 0.14)',
  },
  blockList: {
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(254, 137, 131, 0.14)', borderRadius: '8px', overflow: 'hidden',
  },
  block: { padding: '10px 14px', backgroundColor: 'var(--color-surface-container-lowest)', transition: 'background-color 0.2s' },
  blockHighlighted: { backgroundColor: 'rgba(254, 137, 131, 0.07)' },
  blockHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  blockName: { fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },
  scoreBadge: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-error)',
    backgroundColor: 'rgba(254, 137, 131, 0.10)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.02em',
  },
  nonCompleterBadge: {
    fontSize: '11px', fontWeight: '600', color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.01em',
  },
  blockText: { margin: 0, fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)' },
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function ClassFeedbackPanel({
  data,
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

  const eyebrow = [examBoard, subject, topic].filter(Boolean).join(' • ').toUpperCase()

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div style={styles.emptyWrapper}>
        <div style={styles.emptyCard}>
          <span className="material-symbols-outlined" style={styles.emptyIcon}>group</span>
          <h2 style={styles.emptyTitle}>No class feedback yet</h2>
          <p style={styles.emptyDesc}>
            Go to the Upload section, upload your marksheet and fill in the exam details, then click{' '}
            <strong>Generate Whole Class Feedback</strong>.
          </p>
          {onBack && (
            <button className="cfp-back-btn" onClick={onBack} type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Setup
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <style>{`
        .cfp-dl-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(to right, var(--color-primary), var(--color-primary-dim));
          color: var(--color-on-primary);
          border: none; border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .cfp-dl-btn:hover { opacity: 0.9; }
        .cfp-switch-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          background: var(--color-surface-container-high);
          color: var(--color-on-primary-container);
          border: none; border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background-color 0.15s;
        }
        .cfp-switch-btn:hover { background: var(--color-surface-container-highest); }
        .cfp-back-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: transparent;
          color: var(--color-on-surface-variant);
          border: 1px solid var(--color-outline-variant); border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background-color 0.15s;
        }
        .cfp-back-btn:hover { background: var(--color-surface-container-high); }
        .wcf-editable:hover { background-color: rgba(147,179,233,0.12); }
        .wcf-editable:hover .wcf-pencil { opacity: 0.5; }
      `}</style>

      {/* ── Print-only header ─────────────────────────────────────────────── */}
      <div className="print-only" style={styles.printHeader}>
        <span style={styles.printWordmark}>TeacherDesk</span>
        <span style={styles.printMeta}>{examBoard} {subject} — {topic} · {today}</span>
        <div style={styles.printPills}>
          {classAvgPct != null && <span style={styles.printPill}>{classAvgPct}% avg</span>}
          {completersCount != null && <span style={styles.printPill}>{completersCount} completers</span>}
          {minScore != null && maxScore != null && <span style={styles.printPill}>{minScore}–{maxScore} range</span>}
        </div>
      </div>

      {/* ── Hero (screen only) ────────────────────────────────────────────── */}
      <div style={styles.hero} className="no-print">
        <span style={styles.heroEyebrow}>Assessment Intelligence</span>
        <h1 style={styles.heroTitle}>
          Whole Class{' '}
          <br />
          <span style={styles.heroAccent}>Feedback Sheet</span>
        </h1>
        {eyebrow && <p style={styles.heroContext}>{eyebrow}</p>}
      </div>

      {/* ── Action bar (screen only) ──────────────────────────────────────── */}
      <div style={styles.actionBar} className="no-print">
        {onBack && (
          <button className="cfp-back-btn" onClick={onBack} type="button">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Setup
          </button>
        )}
        <div style={styles.headerButtons}>
          {onSwitchToIndividual && (
            <button className="cfp-switch-btn" onClick={onSwitchToIndividual} type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
              Individual Student Feedback
            </button>
          )}
          <button className="cfp-dl-btn" onClick={handleDownload} type="button">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
            Download Word Document
          </button>
          {downloadSuccess && (
            <span style={styles.successNote}>Downloaded ✓</span>
          )}
        </div>
      </div>

      {/* ── WCF Sheet ────────────────────────────────────────────────────── */}
      <div style={styles.sheet} id="wcf-sheet">

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
        <div style={styles.signalsZone}>
          <p style={styles.sectionLabel}>Individual Signals</p>
          <div style={styles.signalsGrid}>
            <div style={styles.signalCard}>
              <div style={styles.signalCardHeader}>
                <span className="material-symbols-outlined filled" style={styles.iconTertiary}>star</span>
                <h3 style={styles.signalHeading}>Praise in class</h3>
              </div>
              {praiseList.length > 0
                ? <PraiseSection praiseList={praiseList} onPraiseChange={(i, val) => {
                    setEditedData(prev => ({
                      ...prev,
                      students_to_praise: (prev.students_to_praise || []).map((item, idx) => {
                        if (idx !== i) return item
                        // Rebuild the raw string: keep "Name — val" format
                        const match = item.match(/^(.+?)(?:\s+[—–]\s+|:\s+)/)
                        const name = match ? match[1].trim() : item.trim()
                        return `${name} — ${val}`
                      }),
                    }))
                  }} />
                : <p style={styles.empty}>No students identified for praise.</p>
              }
            </div>
            <div style={styles.signalCard}>
              <div style={styles.signalCardHeader}>
                <span className="material-symbols-outlined" style={styles.iconError}>person_alert</span>
                <h3 style={styles.signalHeading}>Students needing attention</h3>
              </div>
              {concernsList.length > 0
                ? <ConcernSection concernsList={concernsList} onConcernChange={(i, val) => {
                    setEditedData(prev => ({
                      ...prev,
                      individual_concerns: (prev.individual_concerns || []).map((item, idx) => {
                        if (idx !== i) return item
                        const parts = item.split(/\s+[—–]\s+/)
                        const head = parts[0] || item
                        return val ? `${head} — ${val}` : head
                      }),
                    }))
                  }} />
                : <p style={styles.empty}>No individual concerns identified.</p>
              }
            </div>
          </div>
        </div>

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

      </div>
    </div>
  )
}

const styles = {
  /* ── Empty state ─────────────────────────────────────────────────────── */
  emptyWrapper: {
    padding: '40px 48px 64px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '400px',
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

  /* ── Wrapper ─────────────────────────────────────────────────────────── */
  wrapper: {
    paddingTop: '40px',
  },

  /* ── Hero (screen only) ──────────────────────────────────────────────── */
  hero: {
    padding: '0 48px',
    marginBottom: '32px',
  },
  heroEyebrow: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  heroTitle: {
    margin: '0 0 10px',
    fontSize: '44px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    lineHeight: '1.1',
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

  /* ── Action bar (screen only) ────────────────────────────────────────── */
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
    padding: '0 48px',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  successNote: {
    fontSize: '13px',
    color: 'var(--color-primary)',
    fontWeight: '500',
  },

  /* ── Print-only header ───────────────────────────────────────────────── */
  printHeader: {
    display: 'none',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0 12px',
    borderBottom: '1px solid #ccc',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  printWordmark: { fontSize: '13px', fontWeight: '700', color: '#1e3150' },
  printMeta: { fontSize: '12px', color: '#374151', flex: 1, textAlign: 'center' },
  printPills: { display: 'flex', gap: '8px' },
  printPill: { fontSize: '11px', padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', color: '#374151' },

  /* ── Sheet container ─────────────────────────────────────────────────── */
  sheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    marginLeft: '48px',
    marginRight: '48px',
    marginBottom: '48px',
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

  /* ── Zone 3: Individual Signals ──────────────────────────────────────── */
  signalsZone: { padding: '20px 24px', borderTop: '1px solid #e5e7eb' },
  signalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: '16px',
  },
  signalCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px', padding: '18px 20px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  signalCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  iconTertiary: { fontSize: '20px', color: 'var(--color-tertiary)' },
  iconError: { fontSize: '20px', color: 'var(--color-error)' },
  signalHeading: { margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },

  /* ── Zone 5: Analytics ───────────────────────────────────────────────── */
  analyticsZone: { borderTop: '1px solid #e5e7eb', padding: '20px 24px 0' },

  /* ── Shared ──────────────────────────────────────────────────────────── */
  empty: { margin: 0, fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' },
}
