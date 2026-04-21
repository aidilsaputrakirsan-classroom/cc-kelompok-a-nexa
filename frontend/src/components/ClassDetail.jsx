import { useState, useEffect } from "react"
import { fetchClassStudents, addStudentToClass, removeStudentFromClass } from "../services/api"

function ClassDetail({ classItem, onBack, currentUser }) {
  const [students, setStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
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
      setError("Gagal memuat daftar siswa")
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableStudents = async () => {
    try {
      const { fetchUsers } = await import("../services/api")
      const allUsers = await fetchUsers("mahasiswa")
      setAvailableStudents(allUsers)
    } catch (err) {
      console.error("Gagal memuat daftar semua siswa:", err)
    }
  }

  useEffect(() => {
    loadStudents()
    loadAvailableStudents()
  }, [classItem.id])

  const handleAddStudent = async (e) => {
    e.preventDefault()
    if (!newStudentId) return
    const userId = parseInt(newStudentId)
    setError("")
    try {
      await addStudentToClass(classItem.id, userId)
      setNewStudentId("")
      loadStudents()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveStudent = async (userId) => {
    if (!window.confirm("Keluarkan siswa dari kelas ini?")) return
    try {
      await removeStudentFromClass(classItem.id, userId)
      loadStudents()
    } catch (err) {
      setError(err.message)
    }
  }

  const canManage = currentUser.role === 'admin' || (currentUser.role === 'dosen' && classItem.instructor_id === currentUser.id)
  const unassignedStudents = availableStudents.filter(as => !students.some(s => s.id === as.id))

  const avatarColors = ['from-indigo-500 to-purple-600', 'from-blue-500 to-cyan-600', 'from-violet-500 to-pink-600', 'from-emerald-500 to-teal-600']

  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-primary font-semibold text-sm mb-6 hover:gap-3 transition-all group"
      >
        <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Kembali ke Daftar Kelas
      </button>

      {/* Class Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 overflow-hidden shadow-sm mb-6">
        <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-center px-8">
          <div className="absolute inset-0 opacity-20">
            <span className="material-symbols-outlined text-white absolute right-8 bottom-4 text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          </div>
          <div className="relative z-10">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{classItem.code}</span>
            <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">{classItem.name}</h2>
            <p className="text-indigo-100 text-sm">Semester {classItem.semester} • {classItem.academic_year}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="flex items-center gap-2 bg-surface-container-low text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-medium">
              <span className="material-symbols-outlined text-base">person</span>
              ID Guru: {classItem.instructor_id}
            </span>
            <span className="flex items-center gap-2 bg-surface-container-low text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-medium">
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {classItem.academic_year}
            </span>
            {classItem.max_students && (
              <span className="flex items-center gap-2 bg-surface-container-low text-on-surface-variant px-3 py-1.5 rounded-xl text-sm font-medium">
                <span className="material-symbols-outlined text-base">group</span>
                Kapasitas: {classItem.max_students} mahasiswa
              </span>
            )}
          </div>
          {classItem.description && (
            <p className="text-on-surface-variant text-sm leading-relaxed">{classItem.description}</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-error-container/10 border border-error/20 p-4 rounded-xl">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="text-error text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Students Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            Daftar Mahasiswa
            <span className="ml-1 bg-primary/10 text-primary text-sm font-bold px-2 py-0.5 rounded-full">
              {students.length}{classItem.max_students ? ` / ${classItem.max_students}` : ''}
            </span>
          </h3>
        </div>

        {/* Add Student Form */}
        {canManage && (
          <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
            <form onSubmit={handleAddStudent} className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">person_add</span>
                <select
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">Pilih mahasiswa untuk ditambahkan...</option>
                  {unassignedStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={!newStudentId}
                className="primary-gradient text-on-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Tambah Mahasiswa
              </button>
            </form>
          </div>
        )}

        {/* Student List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">group_off</span>
              <p className="text-on-surface font-semibold mb-1">Belum ada mahasiswa</p>
              <p className="text-on-surface-variant text-sm">Tambahkan mahasiswa ke kelas ini menggunakan form di atas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student, idx) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/10"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} text-white flex items-center justify-center font-bold text-base flex-shrink-0`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{student.name}</p>
                      <p className="text-xs text-on-surface-variant">{student.email}</p>
                    </div>
                  </div>
                  {canManage && (
                    <button 
                      onClick={() => handleRemoveStudent(student.id)} 
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">person_remove</span>
                      Keluarkan
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassDetail
