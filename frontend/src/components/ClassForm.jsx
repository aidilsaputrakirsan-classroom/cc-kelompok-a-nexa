import { useState, useEffect } from "react"

function ClassForm({ onSubmit, editingClass, onCancelEdit }) {
  const [formData, setFormData] = useState({
    name: "", code: "", description: "",
    semester: "1", academic_year: "2024/2025",
    max_students: "", instructor_id: ""
  })
  const [instructors, setInstructors] = useState([])
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const { fetchUsers } = await import("../services/api")
        const allUsers = await fetchUsers()
        const teachers = allUsers.filter(u => u.role === 'admin' || u.role === 'dosen')
        setInstructors(teachers)
      } catch (err) {
        console.error("Gagal memuat daftar guru:", err)
      }
    }
    loadInstructors()
  }, [])

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
      setIsOpen(true)
    } else {
      setFormData({ name: "", code: "", description: "", semester: "1", academic_year: "2024/2025", max_students: "", instructor_id: "" })
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
      setIsOpen(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60"

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      {!editingClass && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 primary-gradient text-on-primary px-5 py-3 rounded-xl font-semibold text-sm mb-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">{isOpen ? 'close' : 'add'}</span>
          {isOpen ? 'Tutup Form' : 'Buat Kelas Baru'}
        </button>
      )}

      {/* Form Card */}
      {(isOpen || editingClass) && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingClass ? 'edit' : 'add_circle'}</span>
              {editingClass ? "Edit Kelas" : "Buat Kelas Baru"}
            </h2>
            {editingClass && (
              <button 
                onClick={() => { onCancelEdit(); setIsOpen(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-error-container/10 border border-error/20 p-4 rounded-xl">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="text-error text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Row 1: Code + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Kode Kelas *</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="MTK-01" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Nama Kelas *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Matematika Dasar" className={inputClass} />
              </div>
            </div>

            {/* Row 2: Semester + Year + Max */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Semester *</label>
                <input type="number" name="semester" value={formData.semester} onChange={handleChange} min="1" max="8" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Tahun Ajaran *</label>
                <input type="text" name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="2024/2025" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Maks Mahasiswa</label>
                <input type="number" name="max_students" value={formData.max_students} onChange={handleChange} placeholder="30" min="1" className={inputClass} />
              </div>
            </div>

            {/* Row 3: Description + Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Deskripsi</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Opsional" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1">Guru Pengajar *</label>
                <select 
                  name="instructor_id" 
                  value={formData.instructor_id} 
                  onChange={handleChange} 
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Pilih Guru...</option>
                  {instructors.map(guru => (
                    <option key={guru.id} value={guru.id}>
                      {guru.name} ({guru.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                type="submit" 
                className="flex items-center gap-2 primary-gradient text-on-primary px-6 py-3 rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
              >
                <span className="material-symbols-outlined text-base">{editingClass ? 'save' : 'add'}</span>
                {editingClass ? "Update Kelas" : "Buat Kelas"}
              </button>
              {editingClass ? (
                <button 
                  type="button" 
                  onClick={() => { onCancelEdit(); setIsOpen(false); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Batal
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { setIsOpen(false); setFormData({ name: "", code: "", description: "", semester: "1", academic_year: "2024/2025", max_students: "", instructor_id: "" }); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Tutup
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ClassForm
