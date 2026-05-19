import ItemCard from "./ItemCard"

function ItemList({ items, onEdit, onDelete, loading }) {

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#888', fontSize: '1.2rem', fontWeight: 'bold' }}>Memuat data inventaris...</p>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={{ fontSize: '4rem', margin: '0 0 1rem 0', opacity: 0.8 }}>📭</p>
        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#1F4E79' }}>Belum ada item.</p>
        <p style={{ color: '#888' }}>
          Gunakan form di atas untuk menambahkan item pertama Anda.
        </p>
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
    paddingBottom: "3rem"
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: "4rem",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e0e0",
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

export default ItemList