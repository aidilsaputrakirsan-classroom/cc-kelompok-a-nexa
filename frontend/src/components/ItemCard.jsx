function ItemCard({ item, onEdit, onDelete }) {
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{item.name}</h3>
        <span style={styles.priceBadge}>{formatRupiah(item.price)}</span>
      </div>

      <p style={styles.description}>
        {item.description || <span style={{ fontStyle: 'italic', color: '#aaa' }}>Tidak ada deskripsi</span>}
      </p>

      <div style={styles.metaInfo}>
        <div style={styles.metaItem}>
          <span>📦</span>
          <span>Stok: <strong style={{ color: '#333' }}>{item.quantity}</strong></span>
        </div>
        <div style={styles.metaItem}>
          <span>🕐</span>
          <span>{formatDate(item.created_at)}</span>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={() => onEdit(item)} style={styles.btnEdit}>
          ✏️ Edit
        </button>
        <button onClick={() => onDelete(item.id)} style={styles.btnDelete}>
          🗑️ Hapus
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    border: "1px solid #e0e0e0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#1F4E79",
  },
  priceBadge: {
    backgroundColor: "#548235",
    color: "white",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  description: {
    color: "#555",
    fontSize: "0.95rem",
    margin: "0 0 1.5rem 0",
    flex: 1,
    lineHeight: 1.5,
  },
  metaInfo: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #eee",
    fontSize: "0.85rem",
    color: "#888",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "auto",
  },
  btnEdit: {
    flex: 1,
    padding: "0.6rem",
    backgroundColor: "#f0f2f5",
    color: "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnDelete: {
    flex: 1,
    padding: "0.6rem",
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
}

export default ItemCard