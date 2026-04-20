import { useState, useEffect } from "react"
import { getTeam } from "../services/api"

function TeamInfo() {
  const [isOpen, setIsOpen] = useState(false)
  const [teamData, setTeamData] = useState(null)

  useEffect(() => {
    if (isOpen && !teamData) {
      getTeam().then(setTeamData).catch(console.error)
    }
  }, [isOpen, teamData])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={styles.floatingBtn}
      >
        👥 Meet The Team
      </button>

      {isOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>×</button>
            
            <h2 style={styles.title}>Developer Team</h2>
            
            {!teamData ? (
              <div style={styles.loading}>Memuat data tim...</div>
            ) : (
              <div>
                <div style={styles.badgeGroup}>
                  <span style={styles.teamBadge}>Tim: {teamData.team}</span>
                </div>
                
                <div style={styles.grid}>
                  {teamData.members.map((member, i) => (
                    <div key={i} style={styles.memberCard}>
                      <div style={styles.avatar}>
                        {member.name.charAt(0)}
                      </div>
                      <div style={styles.memberInfo}>
                        <div style={styles.memberName}>{member.name}</div>
                        <div style={styles.memberNim}>{member.nim}</div>
                        <div style={styles.memberRole}>{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  floatingBtn: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    backgroundColor: '#1F4E79',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    zIndex: 50,
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modal: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "600px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#888',
  },
  title: {
    margin: "0 0 1.5rem 0",
    color: "#1F4E79",
    fontSize: "1.5rem",
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
    color: "#888",
  },
  badgeGroup: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  teamBadge: {
    backgroundColor: "#f0f2f5",
    color: "#1F4E79",
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    border: "1px solid #ddd",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
  },
  memberCard: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #e0e0e0",
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#548235',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  memberInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  memberName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '0.95rem',
  },
  memberNim: {
    color: '#888',
    fontSize: '0.8rem',
  },
  memberRole: {
    color: '#1F4E79',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  }
}

export default TeamInfo
