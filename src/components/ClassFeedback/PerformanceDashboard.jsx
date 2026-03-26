import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

const TABS = ['Overview', 'Per Question', 'Score Distribution']

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
 * PerformanceDashboard — tabbed chart panel that sits between the WCF header
 * and the six written feedback sections.
 *
 * Props:
 *   statCards         — pre-computed values for the Overview stat cards
 *   questionStats     — [{label, pctCorrect}] for the Per Question chart
 *   scoreDistribution — [{score, count}] for the Score Distribution chart
 */
export default function PerformanceDashboard({ statCards, questionStats, scoreDistribution }) {
  const [activeTab, setActiveTab] = useState('Overview')

  // 32px per question row gives each bar comfortable breathing room
  const perQChartHeight = questionStats
    ? Math.max(300, questionStats.length * 32 + 60)
    : 300

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

      {/* ── Overview ── */}
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

      {/* ── Per Question ── */}
      {activeTab === 'Per Question' && (
        <div style={styles.chartPanel}>
          <p style={styles.chartTitle}>Performance by Question</p>
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

              {/* Threshold reference lines */}
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
        </div>
      )}

      {/* ── Score Distribution ── */}
      {activeTab === 'Score Distribution' && (
        <div style={styles.chartPanel}>
          <p style={styles.chartTitle}>Score Distribution</p>
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
  wrapper: {
    borderBottom: '1px solid #e5e7eb',
  },
  tabBar: {
    display: 'flex',
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
    marginBottom: '-1px',
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
  /* Overview stat cards — no bottom border; wrapper.borderBottom is the separator */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    backgroundColor: '#e5e7eb',
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
  /* Chart panels */
  chartPanel: {
    padding: '24px',
    backgroundColor: '#ffffff',
  },
  chartTitle: {
    margin: '0 0 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.01em',
  },
}
