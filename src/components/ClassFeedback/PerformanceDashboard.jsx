import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

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
 * PerformanceDashboard — two-panel analytics layout (Zone 5).
 * Left panel (col-8): per-question horizontal bar chart
 * Right panel (col-4): score distribution vertical bar chart
 *
 * Props:
 *   statCards         — pre-computed values (for distribution tooltip)
 *   questionStats     — [{label, pctCorrect}] for the Per Question chart
 *   scoreDistribution — [{score, count}] for the Score Distribution chart
 */
export default function PerformanceDashboard({ statCards, questionStats, scoreDistribution }) {
  const perQChartHeight = questionStats
    ? Math.max(280, questionStats.length * 32 + 60)
    : 280

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>

        {/* ── Left: Per-question chart ── */}
        <div style={styles.chartPanel}>
          <p style={styles.sectionLabel}>Percentage correct per question</p>
          {questionStats && questionStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={perQChartHeight}>
                <BarChart
                  data={questionStats}
                  layout="vertical"
                  margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                  barSize={14}
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
            </>
          ) : (
            <p style={styles.empty}>No question data available.</p>
          )}
        </div>

        {/* ── Right: Score distribution ── */}
        <div style={{ ...styles.chartPanel, display: 'flex', flexDirection: 'column' }}>
          <p style={styles.sectionLabel}>Score distribution</p>
          {scoreDistribution && scoreDistribution.length > 0 ? (
            <>
              <div style={{ flex: 1, minHeight: '160px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={scoreDistribution}
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                    barSize={Math.max(8, Math.min(28, Math.floor(220 / scoreDistribution.length) - 4))}
                  >
                    <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis
                      type="category"
                      dataKey="score"
                      tick={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fill: '#374151' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fontFamily: 'Inter, sans-serif', fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip
                      content={<DistributionTooltip maxScore={statCards.classTotalMax} />}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="count" fill="#5b8dd9" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={styles.distributionNote}>
                {scoreDistribution.length > 0 && (() => {
                  const peak = scoreDistribution.reduce((a, b) => b.count > a.count ? b : a, scoreDistribution[0])
                  return `Most students scoring around ${peak.score}/${statCards.classTotalMax}.`
                })()}
              </p>
            </>
          ) : (
            <p style={styles.empty}>No score data available.</p>
          )}
        </div>

      </div>
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
    padding: '0 24px 24px',
  },

  /* Two-column grid — matches 8/12 + 4/12 mockup proportions */
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '16px',
    alignItems: 'start',
  },

  /* Chart panels */
  chartPanel: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    padding: '24px 28px',
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

  /* Legend */
  legend: {
    display: 'flex',
    gap: '16px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(147, 179, 233, 0.20)',
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

  /* Distribution note */
  distributionNote: {
    margin: '14px 0 0',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },

  empty: {
    margin: 0,
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
