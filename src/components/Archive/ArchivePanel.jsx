import { useState, useRef } from 'react'
import { downloadWCFDoc, downloadFeedbackDoc } from '../../utils/docUtils'

const PER_PAGE = 10
const SUBJECTS = ['All Subjects', 'Biology', 'Chemistry', 'Physics', 'Combined Science']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'avgDesc', label: 'Highest average' },
  { value: 'studentsDesc', label: 'Most students' },
]

function formatDate(iso) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function ArchivePanel({ archive, onViewEntry, onLoadFromArchive }) {
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('All Subjects')
  const [sortKey, setSortKey] = useState('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [rowConfirm, setRowConfirm] = useState(null)   // entry id awaiting row-level confirm
  const [importStatus, setImportStatus] = useState(null) // { type: 'success'|'error', message }
  const importInputRef = useRef(null)

  // ── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = archive.entries.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || [e.metadata.topic, e.metadata.subject, e.metadata.examBoard]
      .some(s => (s || '').toLowerCase().includes(q))
    const matchSubject = filterSubject === 'All Subjects' || e.metadata.subject === filterSubject
    return matchSearch && matchSubject
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
    if (sortKey === 'avgDesc') return (b.metadata.averageScore ?? -1) - (a.metadata.averageScore ?? -1)
    if (sortKey === 'studentsDesc') return (b.metadata.studentCount ?? 0) - (a.metadata.studentCount ?? 0)
    return new Date(b.createdAt) - new Date(a.createdAt) // newest
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // ── Selection ─────────────────────────────────────────────────────────────

  const allOnPageSelected = paged.length > 0 && paged.every(e => selected.has(e.id))

  function toggleSelectAll() {
    if (allOnPageSelected) {
      const next = new Set(selected)
      paged.forEach(e => next.delete(e.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      paged.forEach(e => next.add(e.id))
      setSelected(next)
    }
    setBulkConfirm(false)
  }

  function toggleSelect(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
    setBulkConfirm(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function handleBulkDelete() {
    archive.deleteEntries([...selected])
    setSelected(new Set())
    setBulkConfirm(false)
    setPage(1)
  }

  function handleRowDelete(id) {
    archive.deleteEntry(id)
    setRowConfirm(null)
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  // ── Download helpers (no editing in archive, so no setSuccess side-effects needed) ──

  async function handleDownloadWCF(entry) {
    if (!entry.wcfData) return
    await downloadWCFDoc({
      wcfData: entry.wcfData,
      examBoard: entry.metadata.examBoard || '',
      subject: entry.metadata.subject || '',
      topic: entry.metadata.topic || '',
      statCards: null,
      setSuccess: () => {},
    })
  }

  async function handleDownloadIndividual(entry) {
    if (!entry.feedbackData) return
    await downloadFeedbackDoc({
      feedbackData: entry.feedbackData,
      subject: entry.metadata.subject || '',
      topic: entry.metadata.topic || '',
      setFeedbackSuccess: () => {},
    })
  }

  // ── Import ────────────────────────────────────────────────────────────────

  function handleImportChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    archive.importArchive(file)
      .then(count => {
        setImportStatus({ type: 'success', message: `${count} ${count === 1 ? 'entry' : 'entries'} imported.` })
        setTimeout(() => setImportStatus(null), 4000)
      })
      .catch(err => {
        setImportStatus({ type: 'error', message: `Import failed: ${err.message}` })
        setTimeout(() => setImportStatus(null), 6000)
      })
  }

  // ── Storage warning ───────────────────────────────────────────────────────

  const nearLimit = archive.storageKB > 4000

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>Library</p>
          <h1 style={styles.title}>Assessment Archive</h1>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.actionBtn} onClick={archive.exportArchive} disabled={archive.entries.length === 0}>
            <span className="material-symbols-outlined" style={styles.btnIcon}>download</span>
            Export JSON
          </button>
          <button style={styles.actionBtn} onClick={() => importInputRef.current?.click()}>
            <span className="material-symbols-outlined" style={styles.btnIcon}>upload</span>
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportChange}
          />
        </div>
      </div>

      {/* ── Storage bar ───────────────────────────────────────────────── */}
      <div style={{ ...styles.storageBanner, ...(nearLimit ? styles.storageBannerWarn : {}) }}>
        <span className="material-symbols-outlined" style={styles.storageIcon}>
          {nearLimit ? 'warning' : 'storage'}
        </span>
        <span style={styles.storageText}>
          {nearLimit
            ? `${archive.storageKB} KB used — approaching browser storage limit. Export and delete old entries.`
            : `${archive.storageKB} KB used in browser storage · Export to back up to cloud`}
        </span>
      </div>

      {/* ── Import status banner ───────────────────────────────────────── */}
      {importStatus && (
        <div style={importStatus.type === 'success' ? styles.importSuccess : styles.importError}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {importStatus.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {importStatus.message}
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrap}>
          <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search topic, subject, exam board…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => { setSearch(''); setPage(1) }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>

        <select
          style={styles.select}
          value={filterSubject}
          onChange={e => { setFilterSubject(e.target.value); setPage(1) }}
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select
          style={styles.select}
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div style={styles.bulkBar}>
          <span style={styles.bulkCount}>{selected.size} selected</span>
          {bulkConfirm ? (
            <>
              <span style={styles.bulkConfirmText}>Delete {selected.size} {selected.size === 1 ? 'entry' : 'entries'}?</span>
              <button style={styles.bulkDeleteConfirmBtn} onClick={handleBulkDelete}>Yes, delete</button>
              <button style={styles.bulkCancelBtn} onClick={() => setBulkConfirm(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button style={styles.bulkDeleteBtn} onClick={() => setBulkConfirm(true)}>
                <span className="material-symbols-outlined" style={styles.btnIcon}>delete</span>
                Delete selected
              </button>
              <button style={styles.bulkCancelBtn} onClick={() => setSelected(new Set())}>Deselect all</button>
            </>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {archive.entries.length === 0 ? (
        <div style={styles.emptyState}>
          <span className="material-symbols-outlined" style={styles.emptyIcon}>inventory_2</span>
          <h2 style={styles.emptyTitle}>No archived assessments yet</h2>
          <p style={styles.emptyDesc}>
            Feedback you generate will be saved here automatically after each session.
            Use the Export button to back up your archive to Google Drive or OneDrive.
          </p>
        </div>
      ) : (

        /* ── Table ────────────────────────────────────────────────────── */
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, width: '36px', paddingRight: '0' }}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    style={styles.checkbox}
                    title="Select all on this page"
                  />
                </th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Topic</th>
                <th style={styles.th}>Subject · Exam Board</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Students</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Avg %</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>WCF</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Individual</th>
                <th style={styles.th}>Ver.</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(entry => {
                const { date, time } = formatDate(entry.createdAt)
                const isSelected = selected.has(entry.id)
                const isRowConfirm = rowConfirm === entry.id
                return (
                  <tr
                    key={entry.id}
                    style={{ ...styles.tr, ...(isSelected ? styles.trSelected : {}) }}
                  >
                    <td style={{ ...styles.td, width: '36px', paddingRight: '0' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(entry.id)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.td}>
                      <p style={styles.dateMain}>{date}</p>
                      <p style={styles.dateSub}>{time}</p>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.topicText}>{entry.metadata.topic || '—'}</p>
                      {entry.notes && <p style={styles.notePreview}>{entry.notes}</p>}
                    </td>
                    <td style={styles.td}>
                      <p style={styles.cellText}>{entry.metadata.subject || '—'}</p>
                      <p style={styles.cellSub}>{entry.metadata.examBoard || ''}</p>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={styles.mono}>{entry.metadata.studentCount ?? '—'}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={styles.mono}>
                        {entry.metadata.averageScore != null ? `${entry.metadata.averageScore}%` : '—'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {entry.wcfData
                        ? <span className="material-symbols-outlined" style={styles.checkIcon}>check_circle</span>
                        : <span style={styles.dash}>—</span>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {entry.feedbackData
                        ? <span className="material-symbols-outlined" style={styles.checkIcon}>check_circle</span>
                        : <span style={styles.dash}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {entry.version > 1 && (
                        <span style={styles.versionBadge}>v{entry.version}</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {isRowConfirm ? (
                        <span style={styles.rowConfirmWrap}>
                          <span style={styles.rowConfirmText}>Delete?</span>
                          <button style={styles.rowConfirmYes} onClick={() => handleRowDelete(entry.id)}>Yes</button>
                          <button style={styles.rowConfirmNo} onClick={() => setRowConfirm(null)}>No</button>
                        </span>
                      ) : (
                        <span style={styles.rowActions}>
                          <button style={styles.viewBtn} onClick={() => onViewEntry(entry)}>
                            <span className="material-symbols-outlined" style={styles.btnIcon}>visibility</span>
                            View
                          </button>
                          <button
                            style={entry.wcfData ? styles.dlBtn : styles.dlBtnDisabled}
                            disabled={!entry.wcfData}
                            onClick={() => handleDownloadWCF(entry)}
                            title="Download Whole Class Feedback"
                          >
                            <span className="material-symbols-outlined" style={styles.btnIcon}>article</span>
                            WCF
                          </button>
                          <button
                            style={entry.feedbackData ? styles.dlBtn : styles.dlBtnDisabled}
                            disabled={!entry.feedbackData}
                            onClick={() => handleDownloadIndividual(entry)}
                            title="Download Individual Feedback"
                          >
                            <span className="material-symbols-outlined" style={styles.btnIcon}>group</span>
                            Indiv.
                          </button>
                          {onLoadFromArchive && (
                            <button style={styles.loadBtn} onClick={() => onLoadFromArchive(entry)} title="Load into session for editing">
                              <span className="material-symbols-outlined" style={styles.btnIcon}>input</span>
                            </button>
                          )}
                          <button style={styles.deleteBtn} onClick={() => setRowConfirm(entry.id)}>
                            <span className="material-symbols-outlined" style={styles.btnIcon}>delete</span>
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          <div style={styles.pagination}>
            <p style={styles.paginationInfo}>
              {sorted.length === 0
                ? 'No results'
                : `Showing ${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, sorted.length)} of ${sorted.length} ${sorted.length === 1 ? 'assessment' : 'assessments'}`}
            </p>
            <div style={styles.paginationBtns}>
              <button
                style={safePage <= 1 ? styles.pageNavDisabled : styles.pageNav}
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`ellipsis-${i}`} style={styles.pageEllipsis}>…</span>
                    : <button
                        key={n}
                        style={n === safePage ? styles.pageActive : styles.pagePill}
                        onClick={() => setPage(n)}
                      >{n}</button>
                )}
              <button
                style={safePage >= totalPages ? styles.pageNavDisabled : styles.pageNav}
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  root: {
    padding: '32px',
    maxWidth: '1200px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-outline)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--color-on-surface)',
    letterSpacing: '-0.02em',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },

  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    background: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  storageBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-surface-container-low)',
    marginBottom: '16px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
  },
  storageBannerWarn: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
  },
  storageIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  storageText: {
    flex: 1,
  },

  importSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '14px',
  },
  importError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '14px',
  },

  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrap: {
    position: 'relative',
    flex: '1',
    minWidth: '220px',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '17px',
    color: 'var(--color-on-surface-variant)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '38px',
    padding: '0 36px 0 36px',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  clearBtn: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-on-surface-variant)',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  select: {
    height: '38px',
    padding: '0 12px',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },

  bulkBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: 'var(--color-primary-container)',
    borderRadius: '8px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  bulkCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-primary-container)',
  },
  bulkConfirmText: {
    fontSize: '13px',
    color: 'var(--color-on-primary-container)',
  },
  bulkDeleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#b91c1c',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  bulkDeleteConfirmBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    background: '#b91c1c',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  bulkCancelBtn: {
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 40px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderRadius: '16px',
    border: '1px dashed var(--color-outline-variant)',
  },
  emptyIcon: {
    fontSize: '52px',
    color: 'var(--color-outline)',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 10px',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  emptyDesc: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.6',
    maxWidth: '380px',
  },

  tableWrap: {
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(147, 179, 233, 0.2)',
    boxShadow: '0 1px 4px rgba(8, 50, 97, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    backgroundColor: 'var(--color-surface-container-low)',
    borderBottom: '1px solid rgba(147, 179, 233, 0.25)',
  },
  th: {
    padding: '12px 14px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid rgba(147, 179, 233, 0.12)',
    transition: 'background 0.12s',
  },
  trSelected: {
    backgroundColor: 'rgba(69, 95, 136, 0.06)',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },
  checkbox: {
    width: '15px',
    height: '15px',
    cursor: 'pointer',
    accentColor: 'var(--color-primary)',
  },
  dateMain: {
    margin: '0',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  dateSub: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: 'var(--color-on-surface-variant)',
  },
  topicText: {
    margin: '0',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  notePreview: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: 'var(--color-on-surface-variant)',
    fontStyle: 'italic',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellText: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
  },
  cellSub: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: 'var(--color-on-surface-variant)',
  },
  mono: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '13px',
    color: 'var(--color-on-surface)',
  },
  checkIcon: {
    fontSize: '16px',
    color: 'var(--color-primary)',
  },
  dash: {
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.4,
  },
  versionBadge: {
    display: 'inline-block',
    padding: '2px 7px',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '10px',
    backgroundColor: 'var(--color-tertiary-container)',
    color: 'var(--color-on-tertiary-container)',
    letterSpacing: '0.04em',
  },

  rowActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '4px',
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '5px 8px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dlBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '5px 8px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'default',
    opacity: 0.3,
    fontFamily: 'inherit',
  },
  loadBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 6px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    title: 'Load into session',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 6px',
    fontSize: '12px',
    color: 'var(--color-error)',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    opacity: 0.7,
  },
  rowConfirmWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  rowConfirmText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#b91c1c',
  },
  rowConfirmYes: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    background: '#b91c1c',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  rowConfirmNo: {
    padding: '4px 8px',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  btnIcon: {
    fontSize: '15px',
  },

  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--color-surface-container-low)',
    borderTop: '1px solid rgba(147, 179, 233, 0.15)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  paginationInfo: {
    margin: '0',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
  },
  paginationBtns: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  pageNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'var(--color-on-surface-variant)',
  },
  pageNavDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'default',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.3,
  },
  pagePill: {
    width: '30px',
    height: '30px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-on-surface-variant)',
    fontFamily: 'inherit',
  },
  pageActive: {
    width: '30px',
    height: '30px',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'default',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-on-primary)',
    fontFamily: 'inherit',
  },
  pageEllipsis: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'var(--color-on-surface-variant)',
  },
}
