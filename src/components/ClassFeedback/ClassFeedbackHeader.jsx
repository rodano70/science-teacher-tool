/**
 * ClassFeedbackHeader — screen-only hero + action bar + print-only meta block.
 *
 * Props:
 *   examBoard, subject, topic  — strings for hero context pill + print meta
 *   today                      — formatted date string
 *   wcfLoading                 — bool
 *   sectionsReceived           — number (shown in streaming pill)
 *   totalSections              — number
 *   hasData                    — bool (controls download/switch button visibility)
 *   statCards                  — object|null (for print-only stat pills)
 *   onBack                     — fn|undefined
 *   onSwitchToIndividual       — fn|undefined
 *   onDownload                 — fn
 *   downloadSuccess            — bool
 *   onPrint                    — fn
 */
export default function ClassFeedbackHeader({
  examBoard, subject, topic,
  today,
  wcfLoading,
  sectionsReceived,
  totalSections,
  hasData,
  statCards,
  onBack,
  onSwitchToIndividual,
  onDownload,
  downloadSuccess,
  onPrint,
}) {
  const eyebrow = [examBoard, subject, topic].filter(Boolean).join(' • ').toUpperCase()
  const { classAvgPct, completersCount, minScore, maxScore } = statCards || {}

  return (
    <>
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
        @keyframes wcf-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── Print-only header ───────────────────────────────────────────── */}
      <div className="print-only" style={styles.printHeader}>
        <span style={styles.printWordmark}>TeacherDesk</span>
        <span style={styles.printMeta}>{examBoard} {subject} — {topic} · {today}</span>
        <div style={styles.printPills}>
          {classAvgPct != null && <span style={styles.printPill}>{classAvgPct}% avg</span>}
          {completersCount != null && <span style={styles.printPill}>{completersCount} completers</span>}
          {minScore != null && maxScore != null && <span style={styles.printPill}>{minScore}–{maxScore} range</span>}
        </div>
      </div>

      {/* ── Hero (screen only) ──────────────────────────────────────────── */}
      <div style={styles.hero} className="no-print">
        <span style={styles.heroEyebrow}>Assessment Intelligence</span>
        <h1 style={styles.heroTitle}>
          Whole Class{' '}
          <span style={styles.heroDot}>·</span>{' '}
          <span style={styles.heroAccent}>Feedback Sheet</span>
        </h1>
        {eyebrow && <p style={styles.heroContext}>{eyebrow}</p>}
      </div>

      {/* ── Action bar (screen only) ────────────────────────────────────── */}
      <div style={styles.actionBar} className="no-print">
        {onBack && (
          <button className="cfp-back-btn" onClick={onBack} type="button">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Setup
          </button>
        )}
        <div style={styles.headerButtons}>
          {hasData && wcfLoading && (
            <span style={styles.streamingPill}>
              <span style={styles.streamingDot} />
              {`${sectionsReceived} of ${totalSections} modules generated`}
            </span>
          )}
          {onSwitchToIndividual && !wcfLoading && (
            <button className="cfp-switch-btn" onClick={onSwitchToIndividual} type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
              Individual Student Feedback
            </button>
          )}
          {!wcfLoading && (
            <button className="cfp-dl-btn" onClick={onDownload} type="button">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
              Download Word Document
            </button>
          )}
          {downloadSuccess && (
            <span style={styles.successNote}>Downloaded ✓</span>
          )}
        </div>
      </div>
    </>
  )
}

const styles = {
  /* ── Print-only header ─────────────────────────────────────────────────── */
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

  /* ── Hero ──────────────────────────────────────────────────────────────── */
  hero: {
    padding: '0 32px',
    marginBottom: '20px',
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
    margin: '8px 0 0',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
  },

  /* ── Action bar ────────────────────────────────────────────────────────── */
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    padding: '0 32px',
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
  streamingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--color-surface-container)',
    border: '1px solid rgba(147, 179, 233, 0.3)',
    borderRadius: '999px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
  },
  streamingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    animation: 'wcf-pulse 1.2s ease-in-out infinite',
  },
}
