import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const features = [
  {
    icon: '📊',
    title: 'Upload your mark sheet',
    body: 'Drop in your Educake export. No reformatting needed.',
  },
  {
    icon: '📄',
    title: 'Add your question paper',
    body: 'Upload the PDF so feedback names specific misconceptions, not just question numbers.',
  },
  {
    icon: '🧠',
    title: 'Whole Class Feedback',
    body: 'A colour-coded summary: key successes, misconceptions, individual concerns, and long-term implications.',
  },
  {
    icon: '📝',
    title: 'Individual comments',
    body: 'Personalised WWW / EBI / To Improve for every student, downloaded as a Word document.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.root}>

      {/* ── Fixed video background ── */}
      <video autoPlay muted loop playsInline style={styles.video}>
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        {/* Dark overlay */}
        <div style={styles.overlay} />

        {/* Centred content */}
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>FOR UK SECONDARY SCIENCE TEACHERS</p>
          <h1 className="td-hero-title">TeacherDesk</h1>
          <p className="td-hero-payoff">Diagnostic feedback for every student, in minutes</p>
          <button className="td-cta-btn" onClick={() => navigate('/app')}>
            Log in to TeacherDesk
          </button>
          <p style={styles.privacyNote}>
            Student data is processed via the Anthropic API and not stored by this application
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="td-how-section">
        <p style={styles.sectionLabel}>HOW IT WORKS</p>
        <div className="td-features-grid">
          {features.map((f, i) => (
            <div key={i} className="td-feature-card">
              <span style={styles.cardIcon}>{f.icon}</span>
              <h3 style={styles.cardTitle}>{f.title}</h3>
              <p style={styles.cardBody}>{f.body}</p>
            </div>
          ))}
        </div>
        <div style={styles.secondCta}>
          <button className="td-cta-btn" onClick={() => navigate('/app')}>
            Log in to TeacherDesk
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2025 TeacherDesk</p>
        <p style={styles.version}>v0.19.2</p>
      </footer>

    </div>
  )
}

const styles = {
  root: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  /* Fixed video fills the viewport behind everything */
  video: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },

  /* Hero — full viewport, sits above the video */
  hero: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },

  /* Semi-transparent overlay dims the video */
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(8, 12, 28, 0.58)',
    zIndex: 1,
  },

  /* Centred hero copy — sits above overlay */
  heroContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '0 24px',
    maxWidth: '760px',
    width: '100%',
  },

  eyebrow: {
    margin: '0 0 20px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '3.5px',
    color: '#93c5fd',
    textTransform: 'uppercase',
  },

  privacyNote: {
    margin: '20px auto 0',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: '1.6',
    maxWidth: '360px',
  },

  /* Section label above the feature cards */
  sectionLabel: {
    textAlign: 'center',
    margin: '0 0 52px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '4px',
    color: '#475569',
    textTransform: 'uppercase',
  },

  /* Feature card content */
  cardIcon: {
    display: 'block',
    fontSize: '28px',
    marginBottom: '14px',
  },
  cardTitle: {
    margin: '0 0 10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#f1f5f9',
    lineHeight: '1.35',
  },
  cardBody: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.65',
  },

  /* Second CTA beneath the grid */
  secondCta: {
    textAlign: 'center',
    marginTop: '56px',
  },

  /* Footer */
  footer: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#080c1c',
    borderTop: '1px solid rgba(255, 255, 255, 0.07)',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '400',
  },
  version: {
    margin: 0,
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '400',
  },
}
