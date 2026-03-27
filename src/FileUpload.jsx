import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function FileUpload({ onDataParsed }) {
  const [fileName, setFileName] = useState('')
  const [rowCount, setRowCount] = useState(null)

  function handleFileChange(e) {
    const file = e.target.files[0] || null
    if (!file) {
      setFileName('')
      setRowCount(null)
      onDataParsed(null)
      return
    }

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

  return (
    <label style={fileName ? styles.dropZoneLoaded : styles.dropZone}>
      <input
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {fileName ? (
        <div style={styles.fileInfo}>
          <span className="material-symbols-outlined" style={styles.fileIcon}>description</span>
          <div style={styles.fileDetails}>
            <span style={styles.fileName}>{fileName}</span>
            {rowCount !== null && (
              <span style={styles.rowCount}>
                {rowCount} student row{rowCount !== 1 ? 's' : ''} parsed
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.idleContent}>
          <span className="material-symbols-outlined" style={styles.uploadIcon}>upload_file</span>
          <p style={styles.dropTitle}>Drop marksheets here or browse files</p>
          <p style={styles.dropSubtitle}>Accepted formats: .xlsx, .csv (Max 10MB)</p>
          <span style={styles.selectBtn}>Select File</span>
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
    padding: '48px 32px',
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
  idleContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadIcon: {
    color: 'var(--color-primary)',
    fontSize: '48px',
    marginBottom: '16px',
  },
  dropTitle: {
    margin: '0 0 6px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-on-surface)',
  },
  dropSubtitle: {
    margin: '0 0 20px',
    fontSize: '13px',
    color: 'var(--color-outline)',
  },
  selectBtn: {
    display: 'inline-block',
    padding: '8px 20px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
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
