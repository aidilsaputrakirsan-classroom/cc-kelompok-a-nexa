import { useState, useEffect, useRef } from "react"
import {
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  listSubmissions,
  returnSubmission,
  submitGrade,
} from "../services/api"

// ===== HELPERS =====

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(isoString) {
  if (!isoString) return "-"
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatDateShort(isoString) {
  if (!isoString) return "-"
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })
}

/** Hitung sisa waktu sampai deadline */
function getDeadlineStatus(deadlineISO, allowLate) {
  const now = new Date()
  const deadline = new Date(deadlineISO)
  const diffMs = deadline - now
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffMs <= 0) {
    // Sudah lewat deadline
    return {
      isPast: true,
      canSubmit: allowLate,
      label: allowLate ? "Terlambat (diterima)" : "Deadline Terlewat",
      color: allowLate ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400",
      bg: allowLate ? "bg-amber-50 dark:bg-amber-500/10" : "bg-red-50 dark:bg-red-500/10",
      badgeColor: allowLate ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
    }
  }
  if (diffHours < 24) {
    return {
      isPast: false,
      canSubmit: true,
      label: `${Math.ceil(diffHours)} jam lagi`,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      badgeColor: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
    }
  }
  if (diffDays < 3) {
    return {
      isPast: false,
      canSubmit: true,
      label: `${Math.ceil(diffDays)} hari lagi`,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      badgeColor: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
    }
  }
  return {
    isPast: false,
    canSubmit: true,
    label: `${Math.ceil(diffDays)} hari lagi`,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    badgeColor: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  }
}

// ===== CONFIRM DIALOG =====
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest dark:bg-[#1e1d2e] rounded-2xl shadow-2xl border border-outline-variant/10 dark:border-white/10 max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface dark:text-white text-base mb-1">Konfirmasi Submit</h3>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            Ya, Submit Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== ASSIGNMENT FORM (Dosen) =====
const emptyForm = {
  title: "",
  description: "",
  deadline: "",
  allow_late_submission: false,
  max_score: 100,
  is_published: true,
}

function AssignmentForm({ editingAssignment, onSubmit, onCancel, submitting, formError }) {
  const [form, setForm] = useState(() => {
    if (editingAssignment) {
      // Convert ISO deadline to datetime-local format
      const d = new Date(editingAssignment.deadline)
      const pad = (n) => String(n).padStart(2, "0")
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      return {
        title: editingAssignment.title || "",
        description: editingAssignment.description || "",
        deadline: local,
        allow_late_submission: editingAssignment.allow_late_submission ?? false,
        max_score: editingAssignment.max_score ?? 100,
        is_published: editingAssignment.is_published ?? true,
      }
    }
    return emptyForm
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const inputClass = "w-full px-4 py-3 bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 dark:border-white/10 rounded-xl text-sm text-on-surface dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60 dark:placeholder:text-slate-600"

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="px-6 py-5 border-b border-outline-variant/10 dark:border-white/5 bg-surface-container-low/50 dark:bg-white/[0.03]">
      <h4 className="text-sm font-bold text-on-surface dark:text-slate-200 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">
          {editingAssignment ? "edit" : "add_circle"}
        </span>
        {editingAssignment ? "Edit Assignment" : "Buat Assignment Baru"}
      </h4>

      {formError && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-lg">error</span>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">Judul Assignment *</label>
          <input
            type="text" name="title" value={form.title} onChange={handleChange}
            placeholder="Cloud Deployment Project..." required
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">Deskripsi / Instruksi</label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            placeholder="Instruksi detail untuk mahasiswa..."
            rows={3} className={`${inputClass} resize-none`}
          />
        </div>

        {/* Deadline + Max Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">Deadline (WITA) *</label>
            <input
              type="datetime-local" name="deadline" value={form.deadline} onChange={handleChange}
              required className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">Nilai Maksimal *</label>
            <input
              type="number" name="max_score" value={form.max_score} onChange={handleChange}
              min={1} max={1000} required className={inputClass}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((p) => ({ ...p, allow_late_submission: !p.allow_late_submission }))}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.allow_late_submission ? "bg-amber-500" : "bg-outline-variant dark:bg-white/20"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.allow_late_submission ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-on-surface dark:text-slate-300">
              Terima submission terlambat
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((p) => ({ ...p, is_published: !p.is_published }))}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.is_published ? "bg-primary" : "bg-outline-variant dark:bg-white/20"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.is_published ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-on-surface dark:text-slate-300">
              {form.is_published ? "Dipublikasikan" : "Draft (tersembunyi)"}
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit" disabled={submitting}
            className="flex items-center gap-2 primary-gradient text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20 disabled:opacity-60 disabled:scale-100"
          >
            {submitting
              ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-base">{editingAssignment ? "save" : "add"}</span>
            }
            {submitting ? "Menyimpan..." : editingAssignment ? "Simpan Perubahan" : "Buat Assignment"}
          </button>
          <button
            type="button" onClick={onCancel} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors border border-outline-variant/10 dark:border-white/5"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

// ===== SUBMISSION LIST PANEL (Dosen) =====
function SubmissionListPanel({ assignment, classId, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scores, setScores] = useState({}) // submissionId -> score string
  const [grading, setGrading] = useState({}) // submissionId -> bool
  const [gradeSuccess, setGradeSuccess] = useState({}) // submissionId -> bool
  const [returning, setReturning] = useState({}) // submissionId -> bool

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listSubmissions(classId, assignment.id)
      setSubmissions(data.submissions || [])
      // Init scores from existing grades
      const initScores = {}
      for (const s of data.submissions || []) {
        initScores[s.id] = ""
      }
      setScores(initScores)
    } catch (err) {
      setError(err.message || "Gagal memuat submissions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [assignment.id])

  const handleGrade = async (submissionId) => {
    const score = parseFloat(scores[submissionId])
    if (isNaN(score) || score < 0 || score > assignment.max_score) {
      setError(`Nilai harus antara 0 dan ${assignment.max_score}`)
      return
    }
    setError("")
    setGrading((prev) => ({ ...prev, [submissionId]: true }))
    try {
      await submitGrade(submissionId, score)
      setGradeSuccess((prev) => ({ ...prev, [submissionId]: true }))
      setTimeout(() => setGradeSuccess((prev) => ({ ...prev, [submissionId]: false })), 2000)
    } catch (err) {
      setError(err.message || "Gagal menyimpan nilai")
    } finally {
      setGrading((prev) => ({ ...prev, [submissionId]: false }))
    }
  }

  const handleReturn = async (sub) => {
    if (!window.confirm(`Return submission dari "${sub.original_filename}"? Mahasiswa bisa submit ulang.`)) return
    setReturning((prev) => ({ ...prev, [sub.id]: true }))
    try {
      await returnSubmission(sub.id)
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id))
    } catch (err) {
      setError(err.message || "Gagal return submission")
    } finally {
      setReturning((prev) => ({ ...prev, [sub.id]: false }))
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest dark:bg-[#1e1d2e] rounded-2xl shadow-2xl border border-outline-variant/10 dark:border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10 dark:border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface dark:text-white text-base">{assignment.title}</h3>
              <p className="text-on-surface-variant dark:text-slate-400 text-xs">{submissions.length} submission • Max {assignment.max_score} poin</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-white/5 text-on-surface-variant dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {error && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
              <span className="material-symbols-outlined text-red-500 text-lg">error</span>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium flex-1">{error}</p>
              <button onClick={() => setError("")}><span className="material-symbols-outlined text-sm text-red-400">close</span></button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 dark:text-slate-600 mb-3">inbox</span>
              <p className="text-on-surface dark:text-slate-200 font-semibold mb-1">Belum ada submission</p>
              <p className="text-on-surface-variant dark:text-slate-500 text-sm">Mahasiswa belum mengumpulkan tugas ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, idx) => (
                <div key={sub.id} className="p-4 rounded-xl border border-outline-variant/10 dark:border-white/5 bg-surface-container-low/30 dark:bg-white/[0.02]">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${["bg-gradient-to-br from-indigo-500 to-purple-600","bg-gradient-to-br from-blue-500 to-cyan-600","bg-gradient-to-br from-emerald-500 to-teal-600","bg-gradient-to-br from-violet-500 to-pink-600"][idx % 4]}`}>
                      {String(sub.student_id).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-on-surface dark:text-slate-100">Student #{sub.student_id}</p>
                        {sub.is_late && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">Terlambat</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">description</span>
                        <span className="truncate">{sub.original_filename}</span>
                        <span>•</span>
                        <span>{formatBytes(sub.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(sub.submitted_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grade Input Row */}
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="relative flex-1 max-w-[160px]">
                        <input
                          type="number"
                          min={0} max={assignment.max_score}
                          step="0.5"
                          placeholder={`0–${assignment.max_score}`}
                          value={scores[sub.id] ?? ""}
                          onChange={(e) => setScores((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                          className="w-full px-3 py-2 bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 dark:border-white/10 rounded-xl text-sm text-on-surface dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">/ {assignment.max_score}</span>
                      <button
                        onClick={() => handleGrade(sub.id)}
                        disabled={grading[sub.id] || scores[sub.id] === ""}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          gradeSuccess[sub.id]
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "primary-gradient text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                        }`}
                      >
                        {grading[sub.id]
                          ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          : gradeSuccess[sub.id]
                          ? <span className="material-symbols-outlined text-sm">check_circle</span>
                          : <span className="material-symbols-outlined text-sm">grade</span>
                        }
                        {gradeSuccess[sub.id] ? "Tersimpan!" : "Beri Nilai"}
                      </button>
                    </div>

                    {/* Return Button */}
                    <button
                      onClick={() => handleReturn(sub)}
                      disabled={returning[sub.id]}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      {returning[sub.id]
                        ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        : <span className="material-symbols-outlined text-sm">undo</span>
                      }
                      Return
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== STUDENT SUBMISSION PANEL =====
function StudentSubmissionPanel({ assignment, classId, onClose }) {
  const [mySubmission, setMySubmission] = useState(undefined) // undefined = loading
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const fileInputRef = useRef(null)

  const deadlineStatus = getDeadlineStatus(assignment.deadline, assignment.allow_late_submission)

  const load = async () => {
    try {
      const data = await getMySubmission(classId, assignment.id)
      setMySubmission(data) // null = belum submit
    } catch {
      setMySubmission(null)
    }
  }

  useEffect(() => { load() }, [assignment.id])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    setFileError("")
    if (!f) { setFile(null); return }
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Hanya file PDF yang diperbolehkan.")
      setFile(null); return
    }
    if (f.size > 2 * 1024 * 1024) {
      setFileError("Ukuran file maksimal 2MB.")
      setFile(null); return
    }
    setFile(f)
  }

  const handleSubmitConfirm = async () => {
    setShowConfirm(false)
    setApiError("")
    setSubmitting(true)
    try {
      await submitAssignment(classId, assignment.id, file)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await load()
    } catch (err) {
      setApiError(err.message || "Gagal mengumpulkan tugas")
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = mySubmission === undefined

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {showConfirm && (
        <ConfirmDialog
          message={
            deadlineStatus.isPast && assignment.allow_late_submission
              ? "Deadline sudah terlewat. Submission akan ditandai sebagai TERLAMBAT. Anda tidak dapat mengubah file kecuali dosen me-return submission ini. Lanjutkan?"
              : "Yakin ingin mengumpulkan tugas ini? Anda tidak dapat mengubah file kecuali dosen me-return submission ini."
          }
          onConfirm={handleSubmitConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="bg-surface-container-lowest dark:bg-[#1e1d2e] rounded-2xl shadow-2xl border border-outline-variant/10 dark:border-white/10 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10 dark:border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface dark:text-white text-base line-clamp-1">{assignment.title}</h3>
              <p className="text-on-surface-variant dark:text-slate-400 text-xs">Max {assignment.max_score} poin</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-white/5 text-on-surface-variant dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Assignment Info */}
          <div className="p-4 rounded-xl bg-surface-container-low/50 dark:bg-white/[0.03] border border-outline-variant/10 dark:border-white/5 space-y-2">
            {assignment.description && (
              <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">{assignment.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base text-on-surface-variant dark:text-slate-400">schedule</span>
              <span className="text-on-surface-variant dark:text-slate-400">Deadline:</span>
              <span className="font-semibold text-on-surface dark:text-slate-200">{formatDate(assignment.deadline)}</span>
            </div>
            {/* Deadline Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${deadlineStatus.badgeColor}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                {deadlineStatus.isPast ? "event_busy" : "event_available"}
              </span>
              {deadlineStatus.label}
              {assignment.allow_late_submission && deadlineStatus.isPast && (
                <span className="ml-1">• Pengumpulan terlambat diizinkan</span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : mySubmission ? (
            /* === ALREADY SUBMITTED === */
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Tugas Sudah Dikumpulkan</p>
                </div>
                <div className="space-y-1.5 text-xs text-on-surface-variant dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">description</span>
                    <span className="font-medium text-on-surface dark:text-slate-200">{mySubmission.original_filename}</span>
                    <span>({formatBytes(mySubmission.file_size)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>Dikumpulkan: {formatDate(mySubmission.submitted_at)}</span>
                    {mySubmission.is_late && (
                      <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">Terlambat</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grade Display */}
              {mySubmission.score !== null && mySubmission.score !== undefined ? (
                <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                    <p className="text-sm font-bold text-on-surface dark:text-slate-100">Nilai Kamu</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-primary">{mySubmission.score}</span>
                    <span className="text-base font-semibold text-on-surface-variant dark:text-slate-400">/ {assignment.max_score}</span>
                  </div>
                  {mySubmission.graded_at && (
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">Dinilai pada {formatDate(mySubmission.graded_at)}</p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-container-low/50 dark:bg-white/[0.03] border border-outline-variant/10 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-base">hourglass_empty</span>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400">Nilai belum diberikan oleh dosen.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* === NOT YET SUBMITTED === */
            <div className="space-y-3">
              {/* Cannot submit after deadline */}
              {deadlineStatus.isPast && !assignment.allow_late_submission && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">Deadline Telah Terlewat</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Pengumpulan terlambat tidak diizinkan untuk tugas ini.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Late warning */}
              {deadlineStatus.isPast && assignment.allow_late_submission && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Anda akan mengumpulkan setelah deadline — submission akan ditandai <strong>Terlambat</strong>.</p>
                </div>
              )}

              {/* Upload Form */}
              {deadlineStatus.canSubmit && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">Upload File Tugas *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      file
                        ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                        : "border-outline-variant/30 dark:border-white/10 hover:border-primary/30 hover:bg-surface-container-low/50 dark:hover:bg-white/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file" accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                        <p className="text-sm font-bold text-on-surface dark:text-slate-100">{file.name}</p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">{formatBytes(file.size)}</p>
                        <span className="text-xs text-primary font-medium">Klik untuk ganti file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 dark:text-slate-600">upload_file</span>
                        <p className="text-sm font-semibold text-on-surface dark:text-slate-200">Klik untuk pilih file PDF</p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">Hanya PDF • Maks 2MB</p>
                      </div>
                    )}
                  </div>

                  {fileError && (
                    <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {fileError}
                    </div>
                  )}

                  {apiError && (
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
                      <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">{apiError}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { if (file) setShowConfirm(true) }}
                    disabled={!file || submitting}
                    className="w-full flex items-center justify-center gap-2 primary-gradient text-on-primary py-3 rounded-xl text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                  >
                    {submitting
                      ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined">upload</span>
                    }
                    {submitting ? "Mengumpulkan..." : "Kumpulkan Tugas"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== MAIN ASSIGNMENT SECTION =====
function AssignmentSection({ classId, currentUser }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState("")

  // Dosen state
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [formError, setFormError] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [managingSubmissions, setManagingSubmissions] = useState(null)

  // Mahasiswa state
  const [viewingAssignment, setViewingAssignment] = useState(null)

  const canManage = currentUser?.role === "dosen"

  const loadAssignments = async () => {
    setLoading(true)
    setApiError("")
    try {
      const data = await fetchAssignments(classId)
      setAssignments(data.assignments || [])
    } catch (err) {
      setApiError(err.message || "Gagal memuat assignment")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classId) {
      loadAssignments()
      setShowForm(false)
      setEditingAssignment(null)
    }
  }, [classId])

  // ---- Dosen Handlers ----
  const handleFormSubmit = async (form) => {
    setFormError("")
    if (!form.title.trim()) { setFormError("Judul assignment wajib diisi."); return }
    if (!form.deadline) { setFormError("Deadline wajib diisi."); return }

    // Convert datetime-local to ISO with +08:00 (WITA)
    const deadlineISO = new Date(form.deadline).toISOString()

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      deadline: deadlineISO,
      allow_late_submission: form.allow_late_submission,
      max_score: parseInt(form.max_score),
      is_published: form.is_published,
    }

    setFormSubmitting(true)
    try {
      if (editingAssignment) {
        await updateAssignment(classId, editingAssignment.id, payload)
      } else {
        await createAssignment(classId, payload)
      }
      await loadAssignments()
      setShowForm(false)
      setEditingAssignment(null)
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan assignment")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (assignment) => {
    if (!window.confirm(`Hapus assignment "${assignment.title}"? Semua submission terkait juga akan hilang.`)) return
    try {
      await deleteAssignment(classId, assignment.id)
      await loadAssignments()
    } catch (err) {
      setApiError(err.message || "Gagal menghapus assignment")
    }
  }

  const openEdit = (assignment) => {
    setEditingAssignment(assignment)
    setFormError("")
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingAssignment(null)
    setFormError("")
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-[#1a1928] rounded-xl border border-outline-variant/5 dark:border-white/5 shadow-sm overflow-hidden mt-6">

      {/* Submission List Modal (Dosen) */}
      {managingSubmissions && (
        <SubmissionListPanel
          assignment={managingSubmissions}
          classId={classId}
          onClose={() => setManagingSubmissions(null)}
        />
      )}

      {/* Student Submission Panel */}
      {viewingAssignment && (
        <StudentSubmissionPanel
          assignment={viewingAssignment}
          classId={classId}
          onClose={() => setViewingAssignment(null)}
        />
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 dark:border-white/5">
        <h3 className="text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
          Tugas / Assignment
          <span className="ml-1 bg-primary/10 text-primary text-sm font-bold px-2 py-0.5 rounded-full">
            {assignments.length}
          </span>
        </h3>
        {canManage && !showForm && (
          <button
            onClick={() => { setEditingAssignment(null); setFormError(""); setShowForm(true) }}
            className="flex items-center gap-2 primary-gradient text-on-primary px-4 py-2 rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Tambah Tugas
          </button>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-lg">error</span>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium flex-1">{apiError}</p>
          <button onClick={() => setApiError("")}><span className="material-symbols-outlined text-sm text-red-400">close</span></button>
        </div>
      )}

      {/* Add / Edit Form (Dosen) */}
      {showForm && canManage && (
        <AssignmentForm
          editingAssignment={editingAssignment}
          onSubmit={handleFormSubmit}
          onCancel={cancelForm}
          submitting={formSubmitting}
          formError={formError}
        />
      )}

      {/* Assignment List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 dark:text-slate-600 mb-3">assignment</span>
            <p className="text-on-surface dark:text-slate-200 font-semibold mb-1">Belum ada tugas</p>
            <p className="text-on-surface-variant dark:text-slate-500 text-sm">
              {canManage
                ? "Klik \"Tambah Tugas\" untuk membuat assignment pertama."
                : "Dosen belum memberikan tugas untuk kelas ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const ds = getDeadlineStatus(assignment.deadline, assignment.allow_late_submission)
              return (
                <div
                  key={assignment.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-outline-variant/5 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-md dark:hover:shadow-black/30 transition-all duration-200 bg-surface-container-low/30 dark:bg-white/[0.02]"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">{assignment.title}</p>
                      {!assignment.is_published && canManage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">Draft</span>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-1 mb-1">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Deadline badge */}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${ds.badgeColor}`}>
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {ds.isPast ? "event_busy" : "event_available"}
                        </span>
                        {ds.label}
                      </span>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-500">
                        {formatDateShort(assignment.deadline)}
                      </span>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-500">
                        Max {assignment.max_score} poin
                      </span>
                      {assignment.allow_late_submission && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Terlambat OK</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canManage ? (
                      <>
                        <button
                          onClick={() => setManagingSubmissions(assignment)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold primary-gradient text-on-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
                        >
                          <span className="material-symbols-outlined text-sm">folder_open</span>
                          Submission
                        </button>
                        <button
                          onClick={() => openEdit(assignment)}
                          title="Edit"
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(assignment)}
                          title="Hapus"
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setViewingAssignment(assignment)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          ds.isPast && !assignment.allow_late_submission
                            ? "bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 cursor-default"
                            : "primary-gradient text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {ds.isPast && !assignment.allow_late_submission ? "info" : "upload_file"}
                        </span>
                        {ds.isPast && !assignment.allow_late_submission ? "Lihat Detail" : "Kumpulkan"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignmentSection
