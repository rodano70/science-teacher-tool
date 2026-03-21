import { useState } from 'react'

function App() {
  const [examBoard, setExamBoard] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeBoundaries, setGradeBoundaries] = useState('')
  const [excelFile, setExcelFile] = useState(null)

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>UK Science Teacher Tool</h1>
        <p style={styles.subheading}>Generate exam feedback for your students</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Exam Board</label>
            <select
              style={styles.select}
              value={examBoard}
              onChange={e => setExamBoard(e.target.value)}
            >
              <option value="">Select exam board...</option>
              <option value="AQA">AQA</option>
              <option value="OCR">OCR</option>
              <option value="Edexcel">Edexcel</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <select
              style={styles.select}
              value={subject}
              onChange={e => setSubject(e.target.value)}
            >
              <option value="">Select subject...</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Combined Science">Combined Science</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Topic</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. Photosynthesis, Atomic Structure..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Grade Boundaries{' '}
              <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. A*:90, A:80, B:70..."
              value={gradeBoundaries}
              onChange={e => setGradeBoundaries(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Student Results (Excel)</label>
            <label style={styles.uploadButton}>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => setExcelFile(e.target.files[0] || null)}
              />
              {excelFile ? excelFile.name : 'Upload Excel file'}
            </label>
            {excelFile && (
              <span style={styles.fileName}>{excelFile.name}</span>
            )}
          </div>

          <button style={styles.generateButton} type="button">
            Generate Feedback
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '40px',
    width: '100%',
    maxWidth: '560px',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subheading: {
    margin: '0 0 32px',
    fontSize: '14px',
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
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
  optional: {
    fontWeight: '400',
    color: '#9ca3af',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#fff',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#374151',
    outline: 'none',
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
  fileName: {
    fontSize: '13px',
    color: '#10b981',
    marginTop: '4px',
  },
  generateButton: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default App
