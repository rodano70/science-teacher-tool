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
      {activeTab === 'Overview' && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{statCards.classAvgPct}%</span>
            <span style={styles.statLabel}>Class Average</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{statCards.completersCount}</span>
            <span style={styles.statLabel}>Completers</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{statCards.nonCompletersCount}</span>
            <span style={styles.statLabel}>Non-completers</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValueRange}>
              {statCards.minScore} &mdash; {statCards.maxScore}
            </span>
            <span style={styles.statLabel}>
              Score range · out of {statCards.classTotalMax}
            </span>
          </div>
        </div>
      )}
      {activeTab === 'Per Question' && (
        <div style={styles.content}>
          <p style={styles.placeholder}>Per-question bar chart coming in next step.</p>
        </div>
      )}
      {activeTab === 'Score Distribution' && (
        <div style={styles.content}>
          <p style={styles.placeholder}>Score distribution histogram coming in next step.</p>
        </div>
      )}
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
  /* Overview stat cards — identical layout to the pre-dashboard v0.13 grid */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    backgroundColor: '#e5e7eb',
    borderBottom: '1px solid #e5e7eb',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 12px',
    backgroundColor: '#f9fafb',
    gap: '5px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e3150',
    lineHeight: '1',
  },
  statValueRange: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e3150',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  /* Placeholder panels for charts not yet implemented */
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
