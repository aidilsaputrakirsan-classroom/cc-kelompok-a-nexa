function Header({ totalItems, isConnected, user, onLogout, onOpenProfile, activeTab, onTabChange }) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <h1 style={styles.title}>☁️ Cloud App</h1>
        <p style={styles.subtitle}>Komputasi Awan — SI ITK</p>
        
        {/* Navigation Tabs */}
        {user && (
          <div style={styles.tabs}>
            <button 
              style={{...styles.tab, ...(activeTab === 'inventory' ? styles.activeTab : {})}}
              onClick={() => onTabChange('inventory')}
            >
              📦 Inventaris
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'classes' ? styles.activeTab : {})}}
              onClick={() => onTabChange('classes')}
            >
              🎓 Kelas
            </button>
          </div>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.stats}>
          {activeTab === 'inventory' && <span style={styles.badge}>{totalItems} items</span>}
          <span style={{
            ...styles.status,
            backgroundColor: isConnected ? "#E2EFDA" : "#FBE5D6",
            color: isConnected ? "#548235" : "#C00000",
          }}>
            {isConnected ? "🟢 API Online" : "🔴 API Offline"}
          </span>
        </div>
        {user && (
          <div style={styles.user}>
            <button onClick={onOpenProfile} style={styles.profileBtn}>
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" style={styles.avatar} />
              ) : (
                <span style={{ fontSize: '1.2rem' }}>👤</span>
              )}
              <span style={styles.userName}>{user.name}</span>
            </button>
            <button onClick={onLogout} style={styles.btnLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: "white",
    padding: "1.5rem 2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    border: "1px solid #e0e0e0",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  title: {
    margin: "0 0 0.25rem 0",
    color: "#1F4E79",
    fontSize: "1.8rem",
  },
  subtitle: {
    margin: 0,
    color: "#888",
    fontSize: "0.9rem",
    marginBottom: "1rem"
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem"
  },
  tab: {
    padding: "0.5rem 1rem",
    border: "none",
    backgroundColor: "#f0f2f5",
    color: "#555",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "bold",
    transition: "all 0.2s"
  },
  activeTab: {
    backgroundColor: "#1F4E79",
    color: "white"
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem",
  },
  stats: {
    display: "flex",
    gap: "0.5rem",
  },
  badge: {
    backgroundColor: "#1F4E79",
    color: "white",
    padding: "0.3rem 0.8rem",
    borderRadius: "16px",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  status: {
    padding: "0.3rem 0.8rem",
    borderRadius: "16px",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#f0f2f5",
    border: "1px solid #ddd",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    cursor: "pointer",
  },
  avatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  userName: {
    fontWeight: "bold",
    color: "#1F4E79",
    fontSize: "0.9rem",
  },
  btnLogout: {
    backgroundColor: "#e0e0e0",
    color: "#333",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
}

export default Header