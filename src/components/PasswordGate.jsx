import { useState, useEffect } from 'react'

const CORRECT_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('td_auth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  if (authenticated) return children

  function handleSubmit(e) {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('td_auth', 'true')
      setAuthenticated(true)
    } else {
      setError('Incorrect password — please try again')
      setPassword('')
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.logoMark}>TD</div>
        <h1 style={styles.appName}>TeacherDesk</h1>
        <p style={styles.tagline}>UK Science Teacher Tool</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Enter password"
            style={styles.input}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>Enter</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  logoMark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#1e3150',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    marginBottom: '16px',
  },
  appName: {
    margin: '0 0 4px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  tagline: {
    margin: '0 0 28px',
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '400',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '15px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: {
    margin: '0',
    fontSize: '13px',
    color: '#dc2626',
    textAlign: 'left',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1e3150',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '4px',
  },
}
