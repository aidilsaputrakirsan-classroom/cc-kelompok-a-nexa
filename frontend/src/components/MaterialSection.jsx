import { useState, useEffect } from "react"
import {
  fetchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialPublish,
} from "../services/api"

/**
 * MaterialSection — CRUD materi menggunakan backend API
 * Endpoints: /classes/{class_id}/materials
 */

const MATERIAL_TYPES = [
  { value: "pdf",   label: "PDF",   icon: "picture_as_pdf", color: "text-red-500",    bg: "bg-red-50 dark:bg-red-500/10" },
  { value: "ppt",   label: "PPT",   icon: "slideshow",      color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  { value: "video", label: "Video", icon: "play_circle",    color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-500/10" },
  { value: "link",  label: "Link",  icon: "link",           color: "text-green-500",  bg: "bg-green-50 dark:bg-green-500/10" },
]

const emptyForm = {
  title: "",
  description: "",
  material_type: "link",
  external_link: "",
  is_published: true,
}

function MaterialTypeIcon({ type }) {
  const t = MATERIAL_TYPES.find((m) => m.value === type) || MATERIAL_TYPES[3]
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg} flex-shrink-0`}>
      <span className={`material-symbols-outlined text-xl ${t.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {t.icon}
      </span>
    </div>
  )
}

function MaterialSection({ classItem, currentUser }) {
  const [materials, setMaterials]   = useState([])
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [formError, setFormError]   = useState("")
  const [loading, setLoading]       = useState(true)
  const [apiError, setApiError]     = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Robust check: Number() handles int vs string mismatch
  const canManage =
    currentUser?.role === "dosen" &&
    Number(classItem?.instructor_id) === Number(currentUser?.id)

  // ===== Load from API =====
  const loadMaterials = async () => {
    setLoading(true)
    setApiError("")
    try {
      const data = await fetchMaterials(classItem.id)
      setMaterials(data.materials || [])
    } catch (err) {
      setApiError(err.message || "Gagal memuat materi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classItem?.id) {
      loadMaterials()
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
    }
  }, [classItem?.id])

  // ===== Helpers =====
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError("")
    setShowForm(true)
  }

  const openEdit = (mat) => {
    setEditingId(mat.id)
    setForm({
      title: mat.title,
      description: mat.description || "",
      material_type: mat.material_type,
      external_link: mat.external_link || mat.file_path || "",
      is_published: mat.is_published,
    })
    setFormError("")
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError("")
  }

  // ===== CRUD =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")

    if (!form.title.trim()) { setFormError("Judul materi wajib diisi."); return }
    if (!form.external_link.trim()) { setFormError("URL / Link materi wajib diisi."); return }

    setSubmitting(true)
    try {
      if (editingId) {
        // Backend MaterialUpdate: title, description, is_published, external_link
        await updateMaterial(classItem.id, editingId, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          is_published: form.is_published,
          external_link: form.external_link.trim() || null,
        })
      } else {
        // Backend MaterialCreate: title, description, material_type, is_published, external_link
        await createMaterial(classItem.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          material_type: form.material_type,
          external_link: form.external_link.trim() || null,
          is_published: form.is_published,
        })
      }
      await loadMaterials()
      cancelForm()
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan materi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (mat) => {
    if (!window.confirm(`Hapus materi "${mat.title}"?`)) return
    try {
      await deleteMaterial(classItem.id, mat.id)
      await loadMaterials()
    } catch (err) {
      setApiError(err.message || "Gagal menghapus materi")
    }
  }

  const handleTogglePublish = async (mat) => {
    try {
      await toggleMaterialPublish(classItem.id, mat.id, !mat.is_published)
      await loadMaterials()
    } catch (err) {
      setApiError(err.message || "Gagal mengubah status materi")
    }
  }

  const inputClass =
    "w-full px-4 py-3 bg-surface-container-low dark:bg-white/5 border border-outline-variant/20 dark:border-white/10 rounded-xl text-sm text-on-surface dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60 dark:placeholder:text-slate-600"

  const visibleMaterials = canManage
    ? materials
    : materials.filter((m) => m.is_published)

  return (
    <div className="bg-surface-container-lowest dark:bg-[#1a1928] rounded-xl border border-outline-variant/5 dark:border-white/5 shadow-sm overflow-hidden mt-6">

      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 dark:border-white/5">
        <h3 className="text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            folder_open
          </span>
          Materi Pembelajaran
          <span className="ml-1 bg-primary/10 text-primary text-sm font-bold px-2 py-0.5 rounded-full">
            {visibleMaterials.length}
          </span>
        </h3>
        {canManage && !showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 primary-gradient text-on-primary px-4 py-2 rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Tambah Materi
          </button>
        )}
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-error-container/10 border border-error/20 p-3 rounded-xl">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="text-error text-sm font-medium flex-1">{apiError}</p>
          <button onClick={() => setApiError("")} className="text-error hover:opacity-70">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && canManage && (
        <div className="px-6 py-5 border-b border-outline-variant/10 dark:border-white/5 bg-surface-container-low/50 dark:bg-white/[0.03]">
          <h4 className="text-sm font-bold text-on-surface dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">{editingId ? "edit" : "add_circle"}</span>
            {editingId ? "Edit Materi" : "Tambah Materi Baru"}
          </h4>

          {formError && (
            <div className="mb-4 flex items-center gap-3 bg-error-container/10 border border-error/20 p-3 rounded-xl">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <p className="text-error text-sm font-medium">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Title + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">
                  Judul Materi *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Pertemuan 1 - Pengenalan..."
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">
                  Tipe Materi {editingId && <span className="text-outline normal-case">(tidak bisa diubah)</span>}
                </label>
                <div className="flex gap-2">
                  {MATERIAL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      disabled={!!editingId}
                      onClick={() => setForm((p) => ({ ...p, material_type: t.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed ${
                        form.material_type === t.value
                          ? `border-current ${t.color} ${t.bg}`
                          : "border-outline-variant/20 dark:border-white/10 text-on-surface-variant dark:text-slate-500 hover:bg-surface-container dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* URL Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">
                URL / Link Materi *
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                  {form.material_type === "link" ? "link" : "attach_file"}
                </span>
                <input
                  type="url"
                  name="external_link"
                  value={form.external_link}
                  onChange={handleChange}
                  placeholder={form.material_type === "link" ? "https://example.com/..." : "https://drive.google.com/..."}
                  className={`${inputClass} pl-10`}
                />
              </div>
              {form.material_type !== "link" && (
                <p className="text-[11px] text-on-surface-variant dark:text-slate-500 ml-1">
                  Untuk PDF/PPT/Video, gunakan link Google Drive atau cloud storage
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 ml-1 uppercase tracking-wide">
                Deskripsi (opsional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Deskripsi singkat materi ini..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Publish toggle */}
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div
                onClick={() => setForm((p) => ({ ...p, is_published: !p.is_published }))}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.is_published ? "bg-primary" : "bg-outline-variant dark:bg-white/20"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.is_published ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-medium text-on-surface dark:text-slate-300">
                {form.is_published ? "Dipublikasikan (terlihat mahasiswa)" : "Draft (tersembunyi)"}
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 primary-gradient text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20 disabled:opacity-60 disabled:scale-100"
              >
                {submitting
                  ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-base">{editingId ? "save" : "add"}</span>
                }
                {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Materi"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors border border-outline-variant/10 dark:border-white/5"
              >
                <span className="material-symbols-outlined text-base">close</span>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Material List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : visibleMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 dark:text-slate-600 mb-3">
              folder_open
            </span>
            <p className="text-on-surface dark:text-slate-200 font-semibold mb-1">Belum ada materi</p>
            <p className="text-on-surface-variant dark:text-slate-500 text-sm">
              {canManage
                ? "Klik \"Tambah Materi\" untuk mengunggah materi pertama."
                : "Dosen belum menambahkan materi untuk kelas ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMaterials.map((mat) => {
              const typeInfo = MATERIAL_TYPES.find((t) => t.value === mat.material_type) || MATERIAL_TYPES[3]
              const url = mat.external_link || mat.file_path
              return (
                <div
                  key={mat.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-outline-variant/5 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-md dark:hover:shadow-black/30 transition-all duration-200 bg-surface-container-low/30 dark:bg-white/[0.02]"
                >
                  <MaterialTypeIcon type={mat.material_type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">{mat.title}</p>
                      {!mat.is_published && canManage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Draft
                        </span>
                      )}
                    </div>
                    {mat.description && (
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-1 mb-1">{mat.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </span>
                      {mat.created_at && (
                        <span className="text-[11px] text-on-surface-variant dark:text-slate-500">
                          {new Date(mat.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka materi"
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    )}
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleTogglePublish(mat)}
                          title={mat.is_published ? "Sembunyikan (Draft)" : "Publikasikan"}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            mat.is_published
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                              : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {mat.is_published ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                        <button
                          onClick={() => openEdit(mat)}
                          title="Edit"
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(mat)}
                          title="Hapus"
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </>
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

export default MaterialSection
