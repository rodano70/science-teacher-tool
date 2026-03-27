import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

const TABS = ['Overview', 'Per Question', 'Score Distribution']

// Chart colours — do not change
function barColor(pct) {
  if (pct >= 80) return '#52a97d'
  if (pct >= 60) return '#e0993a'
  return '#d95f5f'
}

function QuestionTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const { label, pctCorrect } = payload[0].payload
  return (
    <div style={tooltipStyle}>
      <span style={{ fontWeight: 600, color: '#1e3150' }}>{label}</span>
      <span style={{ color: barColor(pctCorrect), fontWeight: 700, marginLeft: 8 }}>
        {pctCorrect}%
      </span>
    </div>
  )
}

function DistributionTooltip({ active, payload, maxScore }) {
  if (!active || !payload || payload.length === 0) return null
  const { score, count } = payload[0].payload
  return (
    <div style={tooltipStyle}>
      <span style={{ fontWeight: 600, color: '#1e3150' }}>
        {count} student{count !== 1 ? 's' : ''} scored {score}/{maxScore}
      </span>
    </div>
  )
}

/**
 * PerformanceDashboard — tabbed chart panel (Zone 5).
 * Restyled to design-system surface tokens; chart colours unchanged.
 *
 * Props:
 *   statCards         — pre-computed values for the Overview stat cards
 *   questionStats     — [{label, pctCorrect}] for the Per Question chart
 *   scoreDistribution — [{score, count}] for the Score Distribution chart
 */
export default function PerformanceDashboard({ statCards, questionStats, scoreDistribution }) {
  const [activeTab, setActiveTab] = useState('Overview')

  const perQChartHeight = questionStats
    ? Math.max(300, questionStats.length * 32 + 60)
    : 300

  return (
    <div style={styles.wrapper}>

      {/* ── Tab bar ── */}
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

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div style={styles.chartPanel}>
          <p style={styles.sectionLabel}>CLASS SUMMARY</p>
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
        </div>
      )}

      {/* ── Per Question ── */}
      {activeTab === 'Per Question' && (
        <div style={styles.chartPanel}>
          <p style={styles.sectionLabel}>PERFORMANCE BY QUESTION</p>
          <ResponsiveContainer width="100%" height={perQChartHeight}>
            <BarChart
              data={questionStats}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
              barSize={16}
            >
              <CartesianGrid horizontal={false} vertical={true} stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickCount={6}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={34}
                tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: '#374151' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<QuestionTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <ReferenceLine
                x={80}
                stroke="#52a97d"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: '80%', position: 'insideTopRight', fontSize: 10, fill: '#52a97d', dy: -4 }}
              />
              <ReferenceLine
                x={60}
                stroke="#e0993a"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: '60%', position: 'insideTopRight', fontSize: 10, fill: '#e0993a', dy: -4 }}
              />
              <Bar dataKey="pctCorrect" radius={[0, 3, 3, 0]}>
                {questionStats.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry.pctCorrect)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Colour-coded legend */}
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#52a97d' }} />
              &gt;80% — secure
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#e0993a' }} />
              60–80% — developing
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#d95f5f' }} />
              &lt;60% — reteach
            </span>
          </div>
        </div>
      )}

      {/* ── Score Distribution ── */}
      {activeTab === 'Score Distribution' && (
        <div style={styles.chartPanel}>
          <p style={styles.sectionLabel}>SCORE DISTRIBUTION</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={scoreDistribution}
              margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
              barSize={28}
            >
              <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis
                type="category"
                dataKey="score"
                tick={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fill: '#374151' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                content={<DistributionTooltip maxScore={statCards.classTotalMax} />}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="count" fill="#5b8dd9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '13px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  fontFamily: 'Inter, sans-serif',
}

const styles = {
  /* Outer wrapper — no background; sits on the page surface */
  wrapper: {
    padding: '0 24px 24px',
  },

  /* Tab bar */
  tabBar: {
    display: 'inline-flex',
    gap: '2px',
    padding: '4px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  tab: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    lineHeight: '1',
    borderRadius: '6px',
    transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
  },
  tabActive: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    color: 'var(--color-on-surface)',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  tabInactive: {
    color: 'var(--color-on-surface-variant)',
  },

  /* Chart panels */
  chartPanel: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px 32px',
    border: '1px solid rgba(147, 179, 233, 0.20)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },

  /* Section label above chart */
  sectionLabel: {
    margin: '0 0 16px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-on-surface-variant)',
  },

  /* Overview stat cards */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '8px',
    gap: '5px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    lineHeight: '1',
  },
  statValueRange: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  /* Legend */
  legend: {
    display: 'flex',
    gap: '20px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--color-on-surface-variant)',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
}
