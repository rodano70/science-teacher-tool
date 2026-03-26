import { useState } from 'react'

const TABS = ['Overview', 'Per Question', 'Score Distribution']

/**
 * PerformanceDashboard — tabbed chart panel that sits between the WCF header
 * and the six written feedback sections.
 *
 * Props:
 *   statCards       — pre-computed values for the Overview stat cards
 *   questionStats   — [{label, pctCorrect}] for the Per Question chart
 *   scoreDistribution — [{score, count}] for the Score Distribution chart
 */
export default function PerformanceDashboard({ statCards, questionStats, scoreDistribution }) {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <div style={styles.wrapper}>
      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.content}>
        {activeTab === 'Overview' && (
          <p style={styles.placeholder}>Stat cards coming in next step.</p>
        )}
        {activeTab === 'Per Question' && (
          <p style={styles.placeholder}>Per-question bar chart coming in next step.</p>
        )}
        {activeTab === 'Score Distribution' && (
          <p style={styles.placeholder}>Score distribution histogram coming in next step.</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    borderBottom: '1px solid #e5e7eb',
  },
  tabBar: {
    display: 'flex',
    gap: '0',
    padding: '0 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tab: {
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    lineHeight: '1',
    marginBottom: '-1px',  /* overlap the container's bottom border */
    transition: 'color 0.15s',
  },
  tabActive: {
    color: '#1d4ed8',
    borderBottom: '2px solid #1d4ed8',
    fontWeight: '600',
  },
  tabInactive: {
    color: '#6b7280',
    borderBottom: '2px solid transparent',
  },
  content: {
    padding: '28px 24px',
    backgroundColor: '#ffffff',
  },
  placeholder: {
    margin: '0',
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
