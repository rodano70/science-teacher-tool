export default function FeedbackSection({ number, title, color, bg, border, items }) {
  const list = Array.isArray(items) ? items : (items ? [items] : [])

  return (
    <div style={{ ...styles.section, backgroundColor: bg, borderTopColor: border }}>
      <div style={styles.sectionHeader}>
        <span style={{ ...styles.sectionNumber, backgroundColor: color }}>{number}</span>
        <h3 style={{ ...styles.sectionTitle, color }}>{title}</h3>
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
    padding: '18px 24px',
    borderTop: '1px solid',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  sectionNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
  },
  sectionTitle: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.01em',
  },
  list: {
    margin: '0',
    paddingLeft: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  listItem: {
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#374151',
  },
  empty: {
    margin: '0',
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
}
