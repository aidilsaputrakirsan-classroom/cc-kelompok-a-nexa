function ClassList({ classes, onSelect, onEdit, onDelete, currentUser }) {
  
  if (!classes || classes.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={{ fontSize: '3rem', margin: '0 0 1rem 0', opacity: 0.8 }}>🎓</p>
        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#1F4E79' }}>Belum ada kelas.</p>
        {currentUser.role === 'admin' && (
          <p style={{ color: '#888' }}>Gunakan form di atas untuk membuat kelas.</p>
        )}
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {classes.map(cls => (
        <div key={cls.id} style={styles.card}>
          <div style={styles.header}>
            <div>
              <span style={styles.codeBadge}>{cls.code}</span>
              <h3 style={styles.title}>{cls.name}</h3>
            </div>
            {currentUser.role === 'admin' && (
              <div style={styles.actions}>
                <button onClick={(e) => { e.stopPropagation(); onEdit(cls); }} style={styles.iconBtn}>✏️</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(cls.id); }} style={styles.iconBtn}>🗑️</button>
              </div>
            )}
          </div>
          
          <p style={styles.description}>{cls.description || "Tidak ada deskripsi"}</p>
          
          <div style={styles.meta}>
            <div>Semester {cls.semester}</div>
            <div>{cls.academic_year}</div>
          </div>
          
          <button onClick={() => onSelect(cls)} style={styles.btnDetail}>
            Lihat Detail & Mahasiswa →
          </button>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    paddingBottom: "3rem"
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e0e0e0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem"
  },
  codeBadge: {
    display: "inline-block",
    backgroundColor: "#548235",
    color: "white",
    padding: "0.2rem 0.6rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    marginBottom: "0.5rem"
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#1F4E79",
  },
  actions: {
    display: "flex",
    gap: "0.25rem"
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0.25rem"
  },
  description: {
    color: "#555",
    fontSize: "0.95rem",
    flex: 1,
    marginBottom: "1.5rem",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "#888",
    paddingTop: "1rem",
    borderTop: "1px solid #eee",
    marginBottom: "1rem"
  },
  btnDetail: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#f0f2f5",
    color: "#1F4E79",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
    transition: "background 0.2s"
  },
  emptyContainer: {
    backgroundColor: "white",
    padding: "4rem",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed #ccc",
  }
}

export default ClassList
