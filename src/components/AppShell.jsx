/* AppShell.jsx — pure layout shell, no imports of hooks or app state */

const SIDEBAR_WIDTH = 256

export default function AppShell({ children }) {
  return (
    <div style={styles.root}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={styles.sidebar}>

        {/* Wordmark */}
        <div style={styles.sidebarWordmark}>TeacherDesk</div>

        {/* TOOLS section */}
        <nav style={styles.navSection}>
          <p style={styles.navSectionLabel}>TOOLS</p>
          <p style={styles.navSectionSubLabel}>Academic Curator</p>

          {/* Active item */}
          <div style={styles.navItemActive}>
            <span className="material-symbols-outlined" style={styles.navItemIconMs}>biotech</span>
            <span style={styles.navItemLabel}>Science Feedback</span>
          </div>

          {/* Greyed items */}
          <div style={styles.navItemDisabled}>
            <span className="material-symbols-outlined" style={styles.navItemIconMs}>edit_calendar</span>
            <span style={styles.navItemLabel}>Lesson Planner</span>
            <span style={styles.soonBadge}>Soon</span>
          </div>

          <div style={styles.navItemDisabled}>
            <span className="material-symbols-outlined" style={styles.navItemIconMs}>description</span>
            <span style={styles.navItemLabel}>Report Writer</span>
            <span style={styles.soonBadge}>Soon</span>
          </div>
        </nav>

        {/* LIBRARY section */}
        <nav style={{ ...styles.navSection, marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-surface-container)' }}>
          <p style={styles.navSectionLabel}>LIBRARY</p>

          <div style={styles.navItemInactive}>
            <span className="material-symbols-outlined" style={styles.navItemIconMs}>library_books</span>
            <span style={styles.navItemLabel}>Library</span>
          </div>

          <div style={styles.navItemInactive}>
            <span className="material-symbols-outlined" style={styles.navItemIconMs}>inventory_2</span>
            <span style={styles.navItemLabel}>Archive</span>
          </div>
        </nav>

        {/* Help Centre — pinned to bottom */}
        <div style={styles.sidebarFooter}>
          <a href="#" style={styles.helpLink}>
            <span className="material-symbols-outlined" style={styles.helpIcon}>help</span>
            Help Centre
          </a>
        </div>

      </aside>

      {/* ── Main column (right of sidebar) ──────────────────────────────── */}
      <div style={styles.mainColumn}>

        {/* Top bar */}
        <header style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <span style={styles.topBarWordmark}>TeacherDesk</span>
            <span style={styles.topBarTool}>Science Feedback Tool</span>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.resetBtn}>Reset Session</button>
            <button style={styles.iconBtn} title="Settings" aria-label="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <div style={styles.avatar}>
              <span className="material-symbols-outlined" style={styles.avatarIcon}>account_circle</span>
            </div>
          </div>
        </header>

        {/* Stepper */}
        <div style={styles.stepperBar}>
          {steps.map((step, i) => (
            <div key={i} style={styles.stepItem}>
              <span style={i === 0 ? styles.stepLabelActive : styles.stepLabelInactive}>
                {step}
              </span>
              {i === 0 && <div style={styles.stepUnderline} />}
            </div>
          ))}
        </div>

        {/* Content — no padding; each panel manages its own */}
        <div style={styles.content}>
          {children}
        </div>

      </div>
    </div>
  )
}

const steps = ['1. Upload', '2. Feedback', '3. Dashboard']

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-background)',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  /* Sidebar */
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: `${SIDEBAR_WIDTH}px`,
    height: '100vh',
    backgroundColor: 'var(--color-surface-container-low)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    overflowY: 'auto',
    zIndex: 40,
  },
  sidebarWordmark: {
    padding: '20px 20px 16px',
    fontSize: '17px',
    fontWeight: '900',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
    borderBottom: '1px solid var(--color-surface-container)',
    marginBottom: '8px',
  },
  navSection: {
    padding: '0 8px',
  },
  navSectionLabel: {
    margin: '12px 12px 4px',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.6,
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-surface-container-highest)',
    cursor: 'pointer',
    marginBottom: '2px',
  },
  navItemInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '2px',
  },
  navItemDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'default',
    opacity: 0.45,
    marginBottom: '2px',
  },
  navItemIcon: {
    fontSize: '15px',
    flexShrink: 0,
    width: '20px',
    textAlign: 'center',
  },
  navItemIconMs: {
    fontSize: '20px',
    flexShrink: 0,
    color: 'var(--color-on-surface)',
  },
  navSectionSubLabel: {
    margin: '0 12px 6px',
    fontSize: '9px',
    fontWeight: '500',
    letterSpacing: '0.05em',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.5,
  },
  navItemLabel: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--color-on-surface)',
  },
  soonBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--color-on-tertiary-container)',
    backgroundColor: 'var(--color-tertiary-container)',
    padding: '2px 6px',
    borderRadius: '10px',
    letterSpacing: '0.02em',
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '16px 20px 0',
  },
  helpLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    textDecoration: 'none',
    opacity: 0.7,
  },
  helpIcon: {
    fontSize: '18px',
  },

  /* Main column */
  mainColumn: {
    marginLeft: `${SIDEBAR_WIDTH}px`,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },

  /* Top bar */
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    backgroundColor: 'var(--color-surface-container-low)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    height: '56px',
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  topBarWordmark: {
    fontSize: '15px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
  },
  topBarTool: {
    fontSize: '13px',
    fontWeight: '400',
    color: 'var(--color-on-surface-variant)',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  resetBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    color: 'var(--color-on-surface-variant)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: 0,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  avatarIcon: {
    fontSize: '30px',
    color: 'var(--color-on-surface)',
  },

  /* Stepper */
  stepperBar: {
    display: 'flex',
    gap: '0',
    padding: '0 28px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderBottom: '1px solid var(--color-surface-container)',
    flexShrink: 0,
  },
  stepItem: {
    position: 'relative',
    padding: '12px 20px 0',
    marginRight: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: '0',
  },
  stepLabelActive: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    paddingBottom: '10px',
    whiteSpace: 'nowrap',
  },
  stepLabelInactive: {
    fontSize: '13px',
    fontWeight: '400',
    color: 'var(--color-on-surface-variant)',
    paddingBottom: '10px',
    whiteSpace: 'nowrap',
  },
  stepUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20px',
    right: '20px',
    height: '2px',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '2px 2px 0 0',
  },

  /* Content area */
  content: {
    flex: 1,
  },
}
