import { useState } from "react"

function LoginPage({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Track focus states for inputs
  const [focusedInput, setFocusedInput] = useState(null)
  const [hoverBtn, setHoverBtn] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        if (!formData.name.trim()) {
          setError("Nama wajib diisi")
          setLoading(false)
          return
        }
        if (formData.password.length < 8) {
          setError("Password minimal 8 karakter")
          setLoading(false)
          return
        }
        await onRegister(formData)
      } else {
        await onLogin({ email: formData.email, password: formData.password })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Decorative Blur Orbs */}
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>

      <div style={styles.card}>
        <h1 style={styles.title}>NEXA Cloud</h1>
        <p style={styles.subtitle}>Sistem Manajemen Inventaris & Kelas</p>

        {/* Tab Switch */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isRegister ? {} : styles.tabActive) }}
            onClick={() => { setIsRegister(false); setError("") }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(isRegister ? styles.tabActive : {}) }}
            onClick={() => { setIsRegister(true); setError("") }}
          >
            Register
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                style={{ ...styles.input, ...(focusedInput === 'name' ? styles.inputFocus : {}) }}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Alamat Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@student.itk.ac.id"
              required
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              style={{ ...styles.input, ...(focusedInput === 'email' ? styles.inputFocus : {}) }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              required
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              style={{ ...styles.input, ...(focusedInput === 'password' ? styles.inputFocus : {}) }}
            />
          </div>

          <button 
            type="submit" 
            style={{ ...styles.btnSubmit, ...(hoverBtn && !loading ? styles.btnSubmitHover : {}) }} 
            disabled={loading}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
          >
            {loading ? "⏳ Memproses..." : isRegister ? "Buat Akun" : "Masuk ke Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    padding: "2rem",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "3rem",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    zIndex: 1,
    color: "white",
  },
  title: {
    textAlign: "center",
    margin: "0 0 0.5rem 0",
    background: "linear-gradient(to right, #a855f7, #38bdf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "2.5rem",
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    margin: "0 0 2.5rem 0",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  tabs: {
    display: "flex",
    marginBottom: "2rem",
    borderRadius: "12px",
    background: "rgba(15, 23, 42, 0.6)",
    padding: "4px",
  },
  tab: {
    flex: 1,
    padding: "0.8rem",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#64748b",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  tabActive: {
    backgroundColor: "#3b82f6",
    color: "white",
    boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#e2e8f0",
    marginLeft: "0.2rem",
  },
  input: {
    padding: "0.9rem 1rem",
    background: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "1rem",
    color: "white",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  },
  inputFocus: {
    borderColor: "#38bdf8",
    boxShadow: "0 0 0 2px rgba(56, 189, 248, 0.2)",
  },
  btnSubmit: {
    padding: "1rem",
    background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.05rem",
    fontWeight: "bold",
    marginTop: "1rem",
    boxShadow: "0 4px 14px 0 rgba(139, 92, 246, 0.39)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  btnSubmitHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px 0 rgba(139, 92, 246, 0.5)",
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "0.8rem 1rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
    textAlign: "center",
    fontWeight: "500",
  },
}

export default LoginPage