/**
 * IndividualSignalsZone — Zone 3 of the WCF sheet.
 * Two-column card grid: Praise in class (left) + Students needing attention (right).
 *
 * Props:
 *   praiseList     — string[]
 *   concernsList   — string[]
 *   onPraiseChange  — (i, val) => void
 *   onConcernChange — (i, val) => void
 */
import { useState } from 'react'
import EditableItem from '../shared/EditableItem'

function PraiseSection({ praiseList, onPraiseChange }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const parsed = praiseList.map(item => {
    const match = item.match(/^(.+?)(?:\s+[—–]\s+|:\s+)(.+)$/)
    const name = match ? match[1].trim() : item.trim()
    const rawReason = match ? match[2].trim() : null
    const score = rawReason ? (rawReason.match(/\b(\d+)\/(\d+)\b/)?.[0] ?? null) : null
    const afterDash = rawReason ? rawReason.split(/\s+[—–]\s+/) : []
    const description = afterDash.length > 1 ? afterDash.slice(1).join(' — ') : rawReason
    return { name, score, description }
  })

  function toggleIdx(i) {
    setActiveIdx(prev => (prev === i ? null : i))
  }

  return (
    <>
      <div style={praiseStyles.pillWrap}>
        {parsed.map((p, i) => (
          <span
            key={i}
            style={{ ...praiseStyles.pill, ...(activeIdx === i ? praiseStyles.pillActive : {}) }}
            onClick={() => toggleIdx(i)}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div style={praiseStyles.blockList}>
        {praiseList.map((rawItem, i) => {
          const p = parsed[i]
          return (
            <div
              key={i}
              style={{ ...praiseStyles.block, ...(activeIdx === i ? praiseStyles.blockHighlighted : {}) }}
            >
              <div style={praiseStyles.blockHeader}>
                <span style={praiseStyles.blockName}>{p.name}</span>
                {p.score && <span style={praiseStyles.scoreBadge}>{p.score}</span>}
              </div>
              {onPraiseChange ? (
                <EditableItem
                  value={p.description || rawItem}
                  onChange={val => onPraiseChange(i, val)}
                  textStyle={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)', margin: 0 }}
                />
              ) : (
                p.description && <p style={praiseStyles.blockText}>{p.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const praiseStyles = {
  pillWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  pill: {
    display: 'inline-block',
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    borderRadius: '20px',
    padding: '4px 13px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  pillActive: {
    border: '2px solid var(--color-primary)',
  },
  blockList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  block: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid rgba(93, 93, 120, 0.10)',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  blockHighlighted: {
    backgroundColor: 'var(--color-primary-container)',
    border: '1px solid var(--color-outline-variant)',
  },
  blockHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  blockName: { fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },
  scoreBadge: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.02em',
  },
  blockText: { margin: 0, fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)' },
}

function ConcernSection({ concernsList, onConcernChange }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const parsed = concernsList.map(item => {
    const parts = item.split(/\s+[—–]\s+/)
    const firstPart = parts[0]?.trim() ?? ''
    const description = parts.slice(1).join(' — ').trim() || null
    const colonIdx = firstPart.indexOf(':')
    const name = colonIdx > 0 ? firstPart.substring(0, colonIdx).trim() : firstPart.trim()
    const isNonCompleter = /non.?completer/i.test(firstPart)
    const scoreMatch = !isNonCompleter ? firstPart.match(/\b(\d+)\/(\d+)\b/) : null
    const score = scoreMatch ? scoreMatch[0] : null
    return { name, score, isNonCompleter, description }
  })

  function toggleIdx(i) {
    setActiveIdx(prev => (prev === i ? null : i))
  }

  return (
    <>
      <div style={concernStyles.pillWrap}>
        {parsed.map((p, i) => (
          <span
            key={i}
            style={{ ...concernStyles.pill, ...(activeIdx === i ? concernStyles.pillActive : {}) }}
            onClick={() => toggleIdx(i)}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div style={concernStyles.blockList}>
        {concernsList.map((rawItem, i) => {
          const p = parsed[i]
          return (
            <div
              key={i}
              style={{
                ...concernStyles.block,
                ...(activeIdx === i ? concernStyles.blockHighlighted : {}),
                borderBottom: i < concernsList.length - 1 ? '1px solid rgba(254, 137, 131, 0.12)' : 'none',
              }}
            >
              <div style={concernStyles.blockHeader}>
                <span style={concernStyles.blockName}>{p.name}</span>
                {p.isNonCompleter
                  ? <span style={concernStyles.nonCompleterBadge}>non-completer</span>
                  : p.score
                    ? <span style={concernStyles.scoreBadge}>{p.score}</span>
                    : null
                }
              </div>
              {onConcernChange ? (
                <EditableItem
                  value={p.description || ''}
                  onChange={val => onConcernChange(i, val)}
                  textStyle={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)', margin: 0 }}
                />
              ) : (
                p.description && <p style={concernStyles.blockText}>{p.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const concernStyles = {
  pillWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  pill: {
    display: 'inline-block',
    backgroundColor: 'rgba(254, 137, 131, 0.08)',
    color: 'var(--color-error)',
    borderRadius: '20px',
    padding: '4px 13px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid transparent',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  pillActive: {
    border: '2px solid rgba(159, 64, 61, 0.35)',
    backgroundColor: 'rgba(254, 137, 131, 0.14)',
  },
  blockList: {
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(254, 137, 131, 0.14)', borderRadius: '8px', overflow: 'hidden',
  },
  block: { padding: '10px 14px', backgroundColor: 'var(--color-surface-container-lowest)', transition: 'background-color 0.2s' },
  blockHighlighted: { backgroundColor: 'rgba(254, 137, 131, 0.07)' },
  blockHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  blockName: { fontSize: '12px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },
  scoreBadge: {
    fontSize: '11px', fontWeight: '700', color: 'var(--color-error)',
    backgroundColor: 'rgba(254, 137, 131, 0.10)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.02em',
  },
  nonCompleterBadge: {
    fontSize: '11px', fontWeight: '600', color: 'var(--color-on-surface-variant)',
    backgroundColor: 'var(--color-surface-container)', padding: '1px 7px', borderRadius: '4px', letterSpacing: '0.01em',
  },
  blockText: { margin: 0, fontSize: '13px', lineHeight: '1.55', color: 'var(--color-on-surface-variant)' },
}

export default function IndividualSignalsZone({ praiseList, concernsList, onPraiseChange, onConcernChange }) {
  return (
    <div style={styles.signalsZone}>
      <p style={styles.sectionLabel}>Individual Signals</p>
      <div style={styles.signalsGrid}>
        <div style={styles.signalCard}>
          <div style={styles.signalCardHeader}>
            <span className="material-symbols-outlined filled" style={styles.iconTertiary}>star</span>
            <h3 style={styles.signalHeading}>Praise in class</h3>
          </div>
          {praiseList.length > 0
            ? <PraiseSection praiseList={praiseList} onPraiseChange={onPraiseChange} />
            : <p style={styles.empty}>No students identified for praise.</p>
          }
        </div>
        <div style={styles.signalCard}>
          <div style={styles.signalCardHeader}>
            <span className="material-symbols-outlined" style={styles.iconError}>person_alert</span>
            <h3 style={styles.signalHeading}>Students needing attention</h3>
          </div>
          {concernsList.length > 0
            ? <ConcernSection concernsList={concernsList} onConcernChange={onConcernChange} />
            : <p style={styles.empty}>No individual concerns identified.</p>
          }
        </div>
      </div>
    </div>
  )
}

const styles = {
  signalsZone: { padding: '20px 24px', borderTop: '1px solid #e5e7eb' },
  sectionLabel: {
    margin: '0 0 14px',
    fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.12em', color: 'var(--color-on-surface-variant)',
  },
  signalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: '16px',
  },
  signalCard: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px', padding: '18px 20px',
    border: '1px solid rgba(93, 93, 120, 0.12)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  signalCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  iconTertiary: { fontSize: '20px', color: 'var(--color-tertiary)' },
  iconError: { fontSize: '20px', color: 'var(--color-error)' },
  signalHeading: { margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--color-on-surface)', letterSpacing: '0.01em' },
  empty: { margin: 0, fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' },
}
