import { useState, useEffect } from "react"
import { fetchClassStudents, addStudentToClass, removeStudentFromClass } from "../services/api"

function ClassDetail({ classItem, onBack, currentUser }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [newStudentId, setNewStudentId] = useState("")
  const [error, setError] = useState("")

  const loadStudents = async () => {
    setLoading(true)
    try {
      const data = await fetchClassStudents(classItem.id)
      setStudents(data)
    } catch (err) {
      console.error(err)
      setError("Gagal memuat mahasiswa")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [classItem.id])

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!newStudentId) return
    
    setError("")
    try {
      await addStudentToClass(classItem.id, newStudentId)
      setNewStudentId("")
      loadStudents()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveStudent = async (userId) => {
    if (!window.confirm("Keluarkan mahasiswa dari kelas?")) return
    try {
      await removeStudentFromClass(classItem.id, userId)
      loadStudents()
    } catch (err) {
      setError(err.message)
    }
  }

  const isInstructorOrAdmin = currentUser.role === 'admin' || currentUser.role === 'dosen'

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}>← Kembali ke Daftar Kelas</button>
      
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{classItem.name} ({classItem.code})</h2>
          <p style={styles.subtitle}>{classItem.academic_year} - Semester {classItem.semester}</p>
        </div>
        <div style={styles.instructorBadge}>ID Dosen: {classItem.instructor_id}</div>
      </div>

      {classItem.description && <p style={styles.description}>{classItem.description}</p>}
      
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.content}>
        <div style={styles.sectionTitle}>
          Daftar Mahasiswa ({students.length}{classItem.max_students ? ` / ${classItem.max_students}` : ''})
        </div>

        {isInstructorOrAdmin && (
          <form onSubmit={handleAddStudent} style={styles.addForm}>
            <input 
              type="number" 
              placeholder="ID User Mahasiswa" 
              value={newStudentId} 
              onChange={e => setNewStudentId(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.btnAdd}>Tambah Mahasiswa</button>
          </form>
        )}

        {loading ? (
          <div style={styles.loading}>Memuat mahasiswa...</div>
        ) : students.length === 0 ? (
          <div style={styles.empty}>Belum ada mahasiswa di kelas ini.</div>
        ) : (
          <div style={styles.list}>
            {students.map(student => (
              <div key={student.id} style={styles.studentCard}>
                <div style={styles.studentInfo}>
                  <div style={styles.avatar}>{student.name.charAt(0)}</div>
                  <div>
                    <div style={styles.studentName}>{student.name}</div>
                    <div style={styles.studentEmail}>{student.email}</div>
                  </div>
                </div>
                {isInstructorOrAdmin && (
                  <button onClick={() => handleRemoveStudent(student.id)} style={styles.btnRemove}>Keluarkan</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    marginBottom: "2rem",
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#1F4E79",
    fontWeight: "bold",
    cursor: "pointer",
    padding: 0,
    marginBottom: "1.5rem",
    fontSize: "0.95rem"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem"
  },
  title: {
    margin: "0 0 0.25rem 0",
    color: "#1F4E79",
    fontSize: "1.5rem",
  },
  subtitle: {
    margin: 0,
    color: "#555",
    fontWeight: "bold",
  },
  instructorBadge: {
    backgroundColor: "#f0f2f5",
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#1F4E79"
  },
  description: {
    color: "#555",
    marginBottom: "2rem",
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#1F4E79",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "0.5rem",
    marginBottom: "1rem"
  },
  addForm: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem"
  },
  input: {
    padding: "0.6rem 0.8rem",
    border: "2px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.95rem",
    outline: "none",
    width: "200px"
  },
  btnAdd: {
    padding: "0.6rem 1.5rem",
    backgroundColor: "#548235",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  error: {
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
    color: "#888"
  },
  empty: {
    textAlign: "center",
    padding: "2rem",
    color: "#888",
    fontStyle: "italic",
    border: "1px dashed #ccc",
    borderRadius: "8px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem"
  },
  studentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  avatar: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1F4E79',
    color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: '1.2rem'
  },
  studentName: {
    fontWeight: "bold",
    color: "#333",
  },
  studentEmail: {
    fontSize: "0.85rem",
    color: "#888"
  },
  btnRemove: {
    padding: "0.4rem 1rem",
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem"
  }
}

export default ClassDetail
