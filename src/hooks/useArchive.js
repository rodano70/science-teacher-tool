import { useState } from 'react'

const STORAGE_KEY = 'science_teacher_archive'

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function persistEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (e) {
    console.error('Archive: failed to persist entries', e)
  }
}

/**
 * Hook that manages the assessment archive stored in localStorage.
 *
 * Entry shape:
 *   { id, createdAt, version, groupId, fingerprint,
 *     metadata: { examBoard, subject, topic, studentCount, averageScore },
 *     notes,
 *     wcfData, feedbackData }
 */
export function useArchive() {
  const [entries, setEntries] = useState(() => loadEntries())

  // ── Write ─────────────────────────────────────────────────────────────────

  function saveEntry({ examBoard, subject, topic, studentCount, averageScore, fingerprint, wcfData, feedbackData }) {
    const id = crypto.randomUUID()
    const groupId = crypto.randomUUID()
    const entry = {
      id,
      createdAt: new Date().toISOString(),
      version: 1,
      groupId,
      fingerprint: fingerprint || 'unknown',
      metadata: { examBoard, subject, topic, studentCount: studentCount ?? 0, averageScore: averageScore ?? null },
      notes: '',
      wcfData: wcfData || null,
      feedbackData: feedbackData || null,
    }
    const next = [entry, ...entries]
    persistEntries(next)
    setEntries(next)
    return id
  }

  function saveEntryAsVersion({ matchedEntry, examBoard, subject, topic, studentCount, averageScore, fingerprint, wcfData, feedbackData }) {
    const sameGroup = entries.filter(e => e.groupId === matchedEntry.groupId)
    const maxVersion = sameGroup.length > 0 ? Math.max(...sameGroup.map(e => e.version)) : 1
    const id = crypto.randomUUID()
    const entry = {
      id,
      createdAt: new Date().toISOString(),
      version: maxVersion + 1,
      groupId: matchedEntry.groupId,
      fingerprint: fingerprint || 'unknown',
      metadata: { examBoard, subject, topic, studentCount: studentCount ?? 0, averageScore: averageScore ?? null },
      notes: '',
      wcfData: wcfData || null,
      feedbackData: feedbackData || null,
    }
    const next = [entry, ...entries]
    persistEntries(next)
    setEntries(next)
    return id
  }

  function replaceEntry(id, { wcfData, feedbackData, metadata }) {
    const next = entries.map(e => {
      if (e.id !== id) return e
      return {
        ...e,
        ...(wcfData !== undefined ? { wcfData } : {}),
        ...(feedbackData !== undefined ? { feedbackData } : {}),
        ...(metadata ? { metadata } : {}),
      }
    })
    persistEntries(next)
    setEntries(next)
  }

  function updateEntry(id, patch) {
    const next = entries.map(e => e.id === id ? { ...e, ...patch } : e)
    persistEntries(next)
    setEntries(next)
  }

  function updateNotes(id, notes) {
    updateEntry(id, { notes })
  }

  function deleteEntry(id) {
    const next = entries.filter(e => e.id !== id)
    persistEntries(next)
    setEntries(next)
  }

  function deleteEntries(ids) {
    const idSet = new Set(ids)
    const next = entries.filter(e => !idSet.has(e.id))
    persistEntries(next)
    setEntries(next)
  }

  function findByFingerprint(fingerprint) {
    if (!fingerprint || fingerprint === 'unknown') return null
    return entries.find(e => e.fingerprint === fingerprint) || null
  }

  // ── Export / Import ───────────────────────────────────────────────────────

  function exportArchive() {
    const json = JSON.stringify(entries, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `science-teacher-archive-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function importArchive(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          if (!Array.isArray(imported)) throw new Error('Invalid format: expected a JSON array')
          const existingIds = new Set(entries.map(e => e.id))
          const newEntries = imported.filter(e => e.id && e.createdAt && !existingIds.has(e.id))
          const merged = [...newEntries, ...entries].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
          persistEntries(merged)
          setEntries(merged)
          resolve(newEntries.length)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // ── Storage estimate ──────────────────────────────────────────────────────

  const storageKB = (() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || ''
      return Math.round(data.length / 1024)
    } catch {
      return 0
    }
  })()

  return {
    entries,
    saveEntry,
    saveEntryAsVersion,
    replaceEntry,
    updateEntry,
    updateNotes,
    deleteEntry,
    deleteEntries,
    findByFingerprint,
    exportArchive,
    importArchive,
    storageKB,
  }
}
