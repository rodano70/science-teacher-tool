import { Component } from 'react'

/**
 * ErrorBoundary — catches React render errors that would otherwise cause a
 * blank screen. Shows a minimal error card with the message so the user can
 * report it and retry without a full page reload.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <span className="material-symbols-outlined" style={styles.icon}>error</span>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>{this.state.error.message || 'An unexpected error occurred.'}</p>
            <button
              style={styles.btn}
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '32px',
  },
  card: {
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
  icon: {
    fontSize: '48px',
    color: 'var(--color-error)',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  message: {
    margin: '0 0 24px',
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.6',
    wordBreak: 'break-word',
  },
  btn: {
    padding: '8px 20px',
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}
