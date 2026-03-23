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
      <label style={styles.uploadButton}>
        <input
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {fileName || 'Upload Excel file'}
      </label>
      {rowCount !== null && (
        <p style={styles.parsedNote}>
          {rowCount} student row{rowCount !== 1 ? 's' : ''} parsed from Excel.
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px dashed #d1d5db',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    transition: 'background-color 0.15s',
  },
  parsedNote: {
    margin: '0',
    fontSize: '13px',
    color: '#10b981',
  },
}
