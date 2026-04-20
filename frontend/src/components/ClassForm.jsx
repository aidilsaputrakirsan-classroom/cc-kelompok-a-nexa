import { useState, useEffect } from "react"

function ClassForm({ onSubmit, editingClass, onCancelEdit }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    semester: "1",
    academic_year: "2024/2025",
    max_students: "",
    instructor_id: ""
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name,
        code: editingClass.code,
        description: editingClass.description || "",
        semester: String(editingClass.semester),
        academic_year: editingClass.academic_year,
        max_students: editingClass.max_students ? String(editingClass.max_students) : "",
        instructor_id: String(editingClass.instructor_id)
      })
    } else {
      setFormData({
        name: "", code: "", description: "", semester: "1", academic_year: "2024/2025", max_students: "", instructor_id: ""
      })
    }
    setError("")
  }, [editingClass])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.code || !formData.academic_year || !formData.instructor_id) {
      setError("Harap isi semua field wajib (*)")
      return
    }

    const classData = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      description: formData.description.trim() || null,
      semester: parseInt(formData.semester),
      academic_year: formData.academic_year.trim(),
      max_students: formData.max_students ? parseInt(formData.max_students) : null,
      instructor_id: parseInt(formData.instructor_id)
    }

    try {
      await onSubmit(classData, editingClass?.id)
      setFormData({ name: "", code: "", description: "", semester: "1", academic_year: "2024/2025", max_students: "", instructor_id: "" })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {editingClass ? "✏️ Edit Kelas" : "➕ Tambah Kelas Baru (Khusus Admin)"}
      </h2>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Kode Kelas *</label>
            <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="TK301" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Nama Kelas *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Cloud Computing" style={styles.input} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, maxWidth: "150px" }}>
            <label style={styles.label}>Semester *</label>
            <input type="number" name="semester" value={formData.semester} onChange={handleChange} min="1" max="8" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Tahun Ajaran *</label>
            <input type="text" name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="2024/2025" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Maks Mahasiswa</label>
            <input type="number" name="max_students" value={formData.max_students} onChange={handleChange} placeholder="40" min="1" style={styles.input} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Deskripsi</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Opsional" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>ID Dosen Pengampu *</label>
            <input type="number" name="instructor_id" value={formData.instructor_id} onChange={handleChange} placeholder="ID User" min="1" style={styles.input} />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.btnSubmit}>
            {editingClass ? "💾 Update Kelas" : "➕ Buat Kelas"}
          </button>
          {editingClass && (
            <button type="button" onClick={onCancelEdit} style={styles.btnCancel}>
              ✕ Batal Edit
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    marginBottom: "1.5rem",
  },
  title: {
    margin: "0 0 1rem 0",
    color: "#1F4E79",
    fontSize: "1.2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  row: {
    display: "flex",
    gap: "1rem",
  },
  field: {
    flex: 1,
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
    border: "2px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.95rem",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  btnSubmit: {
    padding: "0.7rem 1.5rem",
    backgroundColor: "#548235",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "bold",
  },
  btnCancel: {
    padding: "0.7rem 1.5rem",
    backgroundColor: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  error: {
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "0.75rem",
    fontSize: "0.9rem",
  },
}

export default ClassForm
