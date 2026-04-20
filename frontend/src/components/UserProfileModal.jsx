import { useState, useEffect } from "react"
import { updateProfile } from "../services/api"

function UserProfileModal({ user, onClose, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    profile_picture: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        profile_picture: user.profile_picture || "",
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const dataToSubmit = {
        name: formData.name.trim() || undefined,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        profile_picture: formData.profile_picture.trim() || null,
      }
      
      const updatedUser = await updateProfile(dataToSubmit)
      onUpdateSuccess(updatedUser)
      onClose()
    } catch (err) {
      setError(err.message || "Gagal memperbarui profil")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
        
        <h2 style={styles.title}>Profil Saya</h2>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.headerInfo}>
          <div style={{
            ...styles.avatar,
            background: formData.profile_picture ? `url(${formData.profile_picture}) center/cover` : '#1F4E79'
          }}>
            {!formData.profile_picture && formData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.email}>{user.email}</div>
            <div style={styles.badgeGroup}>
              <span style={styles.roleBadge}>{user.role.toUpperCase()}</span>
              {user.semester && <span style={styles.semesterBadge}>Semester {user.semester}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nama Lengkap</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={styles.input} />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Nomor Telepon</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Contoh: +62812..." style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Alamat</label>
            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Alamat lengkap..." rows={2} style={{ ...styles.input, resize: 'none' }}></textarea>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>URL Foto Profil</label>
            <input type="url" name="profile_picture" value={formData.profile_picture} onChange={handleChange} placeholder="https://..." style={styles.input} />
          </div>

          <button type="submit" disabled={loading} style={styles.btnSubmit}>
            {loading ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
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
    maxWidth: "500px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    position: 'relative',
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
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    border: '3px solid #548235',
  },
  email: {
    color: "#555",
    fontSize: "0.95rem",
    marginBottom: "0.5rem",
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  roleBadge: {
    backgroundColor: "#1F4E79",
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  semesterBadge: {
    backgroundColor: "#548235",
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "0.6rem 0.8rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
    outline: "none",
  },
  btnSubmit: {
    padding: "0.8rem",
    backgroundColor: "#548235",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "0.5rem",
  },
  error: {
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    textAlign: "center",
  },
}

export default UserProfileModal
