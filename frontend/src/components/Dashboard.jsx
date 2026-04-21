import { useState, useEffect } from "react"
import { fetchClasses, fetchUserClasses } from "../services/api"

function Dashboard({ user }) {
  const [myClasses, setMyClasses] = useState([])
  const [allClasses, setAllClasses] = useState([])
  const [totalClasses, setTotalClasses] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [user])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      if (user.role === 'admin') {
        const data = await fetchClasses()
        setAllClasses(data.classes)
        setTotalClasses(data.total)
      } else if (user.role === 'dosen') {
        const data = await fetchClasses({ instructor_id: user.id })
        setMyClasses(data.classes)
        setTotalClasses(data.total)
      } else {
        const classes = await fetchUserClasses(user.id)
        setMyClasses(classes)
      }
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = () => {
    if (user.role === 'admin') return 'Administrator'
    if (user.role === 'dosen') return 'Dosen'
    return 'Mahasiswa'
  }

  const displayClasses = user.role === 'admin' ? allClasses : myClasses

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Hero */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-on-surface-variant font-medium mb-1">Selamat datang kembali 👋</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">{user.name}!</h2>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                {user.role === 'admin' ? 'admin_panel_settings' : user.role === 'dosen' ? 'school' : 'menu_book'}
              </span>
              {getRoleLabel()}
            </span>
          </div>
          <div className="bg-indigo-700 rounded-2xl p-6 text-on-primary relative overflow-hidden shadow-xl shadow-indigo-200 hidden md:block min-w-[220px]">
            <div className="relative z-10">
              <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-1 rounded font-bold tracking-widest uppercase">Platform</span>
              <h4 className="text-xl font-bold mt-3 mb-1">Studyfy LMS</h4>
              <p className="text-indigo-100 text-sm">The Fluid Academy</p>
            </div>
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-8 -left-8 w-20 h-20 bg-indigo-500 rounded-full blur-xl opacity-30"></div>
          </div>
        </div>
      </section>

      {/* Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">
              {user.role === 'admin' ? 'Total Kelas' : user.role === 'dosen' ? 'Kelas Diajar' : 'Kelas Diikuti'}
            </p>
            <h3 className="text-3xl font-bold text-on-surface">{user.role === 'admin' ? totalClasses : myClasses.length}</h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {user.role === 'admin' ? 'manage_accounts' : user.role === 'dosen' ? 'groups' : 'grade'}
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">
              {user.role === 'admin' ? 'Kelas Aktif' : user.role === 'dosen' ? 'Total Diajar' : 'Semester'}
            </p>
            <h3 className="text-3xl font-bold text-on-surface">
              {user.role === 'admin' ? allClasses.length : user.role === 'dosen' ? myClasses.length : (user.semester || '—')}
            </h3>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">Status</p>
            <h3 className="text-lg font-bold text-on-surface leading-tight">Aktif</h3>
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-on-surface">
              {user.role === 'admin' ? '📋 Kelas Terbaru' : user.role === 'dosen' ? '🏫 Kelas yang Saya Ajar' : '📖 Kelas yang Saya Ikuti (Mahasiswa)'}
            </h3>
          </div>

          {displayClasses.length === 0 ? (
            <div className="bg-surface-container-lowest p-12 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">inbox</span>
              <p className="text-on-surface font-semibold text-lg mb-1">Belum ada kelas</p>
              <p className="text-on-surface-variant text-sm">
                {user.role === 'dosen' ? 'Belum ada kelas yang diajar.' : user.role === 'admin' ? 'Buat kelas baru di tab Courses.' : 'Belum mengikuti kelas apapun sebagai mahasiswa.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayClasses.slice(0, 6).map((cls, idx) => {
                const colors = [
                  { bg: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
                  { bg: 'from-blue-500 to-cyan-600', light: 'bg-blue-50', text: 'text-blue-600' },
                  { bg: 'from-violet-500 to-pink-600', light: 'bg-violet-50', text: 'text-violet-600' },
                ]
                const color = colors[idx % colors.length]
                return (
                  <div key={cls.id} className="group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/5 hover:shadow-xl transition-all duration-300">
                    <div className={`relative h-32 bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-white/80 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-tighter shadow-sm">
                        Sem. {cls.semester}
                      </div>
                    </div>
                    <div className="p-5">
                      <span className={`inline-block ${color.light} ${color.text} px-2 py-0.5 rounded text-[11px] font-bold mb-2`}>{cls.code}</span>
                      <h4 className="text-base font-bold text-on-surface mb-1 leading-tight">{cls.name}</h4>
                      <p className="text-on-surface-variant text-xs mb-3">{cls.academic_year}</p>
                      {cls.description && (
                        <p className="text-on-surface-variant text-xs mb-3 line-clamp-2">{cls.description}</p>
                      )}
                      <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          {cls.academic_year}
                        </span>
                        {cls.max_students && (
                          <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span>
                            Max {cls.max_students}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
