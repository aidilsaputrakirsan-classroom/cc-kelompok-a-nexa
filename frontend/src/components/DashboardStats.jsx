import { useState, useEffect } from "react"
import { getStats } from "../services/api"

function DashboardStats({ refreshTrigger }) {
  const [stats, setStats] = useState({
    total_items: 0,
    total_quantity: 0,
    total_value: 0,
    average_price: 0
  })

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [refreshTrigger])

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📦</div>
        <div>
          <div style={styles.label}>Total Item Unik</div>
          <div style={styles.value}>{stats.total_items}</div>
        </div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.icon}>📊</div>
        <div>
          <div style={styles.label}>Total Stok</div>
          <div style={styles.value}>{stats.total_quantity}</div>
        </div>
      </div>

      <div style={{ ...styles.card, gridColumn: 'span 2' }}>
        <div style={styles.icon}>💰</div>
        <div>
          <div style={styles.label}>Total Nilai Aset</div>
          <div style={styles.value}>{formatRupiah(stats.total_value)}</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #e0e0e0",
  },
  icon: {
    fontSize: "2.5rem",
    opacity: 0.8,
  },
  label: {
    color: "#888",
    fontSize: "0.9rem",
    fontWeight: "bold",
    marginBottom: "0.25rem",
  },
  value: {
    color: "#1F4E79",
    fontSize: "1.5rem",
    fontWeight: "bold",
  }
}

export default DashboardStats
