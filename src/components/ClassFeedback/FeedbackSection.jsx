export default function FeedbackSection({ number, title, color, bg, border, items }) {
  const list = Array.isArray(items) ? items : (items ? [items] : [])

  return (
    <div style={{ ...styles.section, backgroundColor: bg, borderColor: border }}>
      <div style={styles.sectionHeader}>
        <span style={{ ...styles.sectionNumber, backgroundColor: color }}>{number}</span>
        <h2 style={{ ...styles.sectionTitle, color }}>{title}</h2>
      </div>
      {list.length > 0 ? (
        <ul style={styles.list}>
          {list.map((item, i) => (
            <li key={i} style={styles.listItem}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.empty}>No items identified.</p>
      )}
    </div>
  )
}

const styles = {
  section: {
    margin: '0',
    padding: '20px 28px',
    borderTop: '1px solid',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  sectionNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
  },
  sectionTitle: {
    margin: '0',
    fontSize: '15px',
    fontWeight: '700',
  },
  list: {
    margin: '0',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listItem: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
  },
  empty: {
    margin: '0',
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
