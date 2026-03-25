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
    <div style={styles.field}>
      <label style={styles.label}>Student Results (Excel)</label>
      <label className={`upload-zone${fileName ? ' has-file' : ''}`}>
        <input
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {fileName ? (
          <span>
            <span style={styles.fileIcon}>&#10003;</span>{' '}
            {fileName}
          </span>
        ) : (
          <span>
            <span style={styles.uploadIcon}>&#8679;</span>{' '}
            Click to upload Excel file (.xlsx, .xls)
          </span>
        )}
      </label>
      {rowCount !== null && (
        <p style={styles.parsedNote}>
          {rowCount} student row{rowCount !== 1 ? 's' : ''} parsed successfully.
        </p>
      )}
    </div>
  )
}

const styles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.01em',
  },
  fileIcon: {
    fontWeight: '700',
  },
  uploadIcon: {
    fontSize: '18px',
    lineHeight: 1,
  },
  parsedNote: {
    margin: '0',
    fontSize: '12px',
    color: '#15803d',
    fontWeight: '500',
  },
}
