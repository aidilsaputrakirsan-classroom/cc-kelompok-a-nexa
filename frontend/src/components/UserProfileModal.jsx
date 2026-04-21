import { useState, useEffect } from "react"
import { updateProfile } from "../services/api"

function UserProfileModal({ user, onClose, onUpdateSuccess }) {
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", profile_picture: "" })
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

  const getRoleLabel = () => {
    if (user.role === 'admin') return 'Administrator'
    if (user.role === 'dosen') return 'Dosen'
    return 'Mahasiswa'
  }

  const inputClass = "w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60"

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-end px-6 pb-4">
          <div className="absolute inset-0 opacity-10">
            <span className="material-symbols-outlined text-white absolute right-4 top-2 text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
          </div>
          <div className="relative z-10 flex items-end gap-4 w-full">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl ring-4 ring-white/30 overflow-hidden flex-shrink-0 bg-indigo-700 flex items-center justify-center">
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{(formData.name || user.name)?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-white font-bold text-lg leading-none mb-1">{user.name}</p>
              <p className="text-indigo-100 text-xs">{user.email}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-outline-variant/10 bg-surface-container-low/50">
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{getRoleLabel()}</span>
          {user.semester && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">Semester {user.semester}</span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-3 bg-error-container/10 border border-error/20 p-3 rounded-xl">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant ml-1">Nama Lengkap</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base group-focus-within:text-primary transition-colors">badge</span>
              <input 
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant ml-1">Nomor Telepon</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base group-focus-within:text-primary transition-colors">phone</span>
              <input 
                type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+62812..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant ml-1">Alamat</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-4 text-outline text-base group-focus-within:text-primary transition-colors">home</span>
              <textarea 
                name="address" value={formData.address} onChange={handleChange} placeholder="Alamat lengkap..." rows={2}
                className={`${inputClass} pl-10 resize-none`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-on-surface-variant ml-1">URL Foto Profil</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base group-focus-within:text-primary transition-colors">image</span>
              <input 
                type="url" name="profile_picture" value={formData.profile_picture} onChange={handleChange} placeholder="https://..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full primary-gradient text-on-primary font-bold py-3 rounded-xl tonal-elevation hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Simpan Profil
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UserProfileModal
