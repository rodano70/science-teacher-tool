import { useState } from 'react'
import * as XLSX from 'xlsx'

// studentData — optional; when provided (after remount) the widget shows the
// "already loaded" state using the row count from the existing data, even though
// the internal fileName state has reset.
export default function FileUpload({ onDataParsed, studentData }) {
  const [fileName, setFileName] = useState('')
  const [rowCount, setRowCount] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  // Derive display state: prefer internal state (after a fresh upload in this
  // render cycle); fall back to the row count from the prop if data already exists.
  const displayRowCount = rowCount !== null ? rowCount : (studentData?.length ?? null)
  const isLoaded = fileName !== '' || (studentData && studentData.length > 0)

  function parseFile(file) {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      setRowCount(rows.length)
      onDataParsed(rows)
      console.log('Parsed student data:', rows)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null
    if (!file) {
      setFileName('')
      setRowCount(null)
      onDataParsed(null)
      return
    }
    parseFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer.files).find(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    )
    if (file) parseFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  return (
    <label
      style={{
        ...(isLoaded ? styles.dropZoneLoaded : styles.dropZone),
        ...(dragOver ? styles.dropZoneActive : {}),
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {isLoaded ? (
        <div style={styles.fileInfo}>
          <span className="material-symbols-outlined" style={styles.fileIcon}>description</span>
          <div style={styles.fileDetails}>
            {fileName ? (
              <span style={styles.fileName}>{fileName}</span>
            ) : (
              <span style={styles.fileName}>Marksheet loaded</span>
            )}
            {displayRowCount !== null && (
              <span style={styles.rowCount}>
                {displayRowCount} student row{displayRowCount !== 1 ? 's' : ''} parsed
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.idleContent}>
          <span className="material-symbols-outlined" style={{
            ...styles.uploadIcon,
            color: dragOver ? 'var(--color-primary)' : 'var(--color-primary)',
          }}>upload_file</span>
          <div style={styles.idleText}>
            <p style={styles.dropTitle}>
              {dragOver ? 'Drop to upload' : 'Drop marksheets here or click to browse'}
            </p>
            <p style={styles.dropSubtitle}>.xlsx · .csv · Max 10MB</p>
          </div>
        </div>
      )}
    </label>
  )
}

const styles = {
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '28px 20px',
    border: '2px dashed var(--color-outline-variant)',
    borderRadius: '12px',
    backgroundColor: 'var(--color-surface-container-lowest)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  dropZoneLoaded: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '20px 24px',
    border: '2px solid var(--color-primary)',
    borderRadius: '12px',
    backgroundColor: 'var(--color-surface-container-lowest)',
    cursor: 'pointer',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  dropZoneActive: {
    backgroundColor: 'var(--color-primary-container)',
    borderColor: 'var(--color-primary)',
  },
  idleContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
  },
  idleText: {
    flex: 1,
    textAlign: 'left',
  },
  uploadIcon: {
    color: 'var(--color-primary)',
    fontSize: '32px',
    flexShrink: 0,
  },
  dropTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  dropSubtitle: {
    margin: '3px 0 0',
    fontSize: '12px',
    color: 'var(--color-outline)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  fileIcon: {
    color: 'var(--color-primary)',
    fontSize: '28px',
    flexShrink: 0,
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  rowCount: {
    fontSize: '12px',
    color: 'var(--color-outline)',
  },
}
