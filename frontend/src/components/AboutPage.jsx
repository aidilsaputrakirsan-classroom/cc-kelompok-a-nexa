function AboutPage({ onBack }) {
  const team = [
    { name: "Dzaky Rasyid", nim: "10231035", role: "Lead Backend", icon: "dns", color: "from-blue-500 to-cyan-600", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { name: "Dhiya Afifah", nim: "10231031", role: "Lead Frontend", icon: "web", color: "from-violet-500 to-pink-600", badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { name: "Ika Agustin Wulandari", nim: "10231041", role: "Lead DevOps", icon: "settings_suggest", color: "from-emerald-500 to-teal-600", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { name: "Gabriel Karmen", nim: "10231043", role: "Lead QA & Docs", icon: "verified", color: "from-amber-500 to-orange-600", badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ]

  const techStack = [
    { label: "Backend", value: "FastAPI + PostgreSQL", icon: "storage", color: "text-blue-500" },
    { label: "Frontend", value: "React + Vite", icon: "code", color: "text-violet-500" },
    { label: "Container", value: "Docker + Docker Compose", icon: "deployed_code", color: "text-cyan-500" },
    { label: "CI/CD", value: "GitHub Actions", icon: "sync_alt", color: "text-emerald-500" },
  ]

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary font-semibold text-sm mb-8 hover:gap-3 transition-all group"
      >
        <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Kembali ke Dashboard
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40">
        <div className="absolute inset-0 opacity-10">
          <span className="material-symbols-outlined text-white absolute right-8 bottom-4 text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
        <div className="relative z-10 px-10 py-12">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
            Komputasi Awan — SI ITK
          </span>
          <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">About This Project</h1>
          <p className="text-indigo-100 text-base max-w-xl leading-relaxed">
            Studyfy adalah platform Learning Management System (LMS) berbasis cloud yang dirancang untuk menciptakan pengalaman belajar digital yang simpel, terorganisir, dan menyenangkan dengan mengintegrasikan peran admin, pengajar, dan murid dalam satu sistem terpadu yang efisien.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              Studyfy LMS
            </span>
            <span className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              Kelompok A — Nexa
            </span>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1928] rounded-2xl border border-outline-variant/5 dark:border-white/5 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/10 dark:border-white/5">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
          <h2 className="text-lg font-bold text-on-surface dark:text-white">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-outline-variant/5 dark:bg-white/5">
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 bg-surface-container-lowest dark:bg-[#1a1928] hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-surface-container-low dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                <span className={`material-symbols-outlined text-xl ${tech.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{tech.icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant dark:text-slate-500 uppercase tracking-wider mb-0.5">{tech.label}</p>
                <p className="text-sm font-bold text-on-surface dark:text-slate-100">{tech.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1928] rounded-2xl border border-outline-variant/5 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/10 dark:border-white/5">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          <h2 className="text-lg font-bold text-on-surface dark:text-white">Tim Pengembang</h2>
          <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {team.length} Anggota
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {team.map((member, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 p-4 rounded-xl border border-outline-variant/5 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-md dark:hover:shadow-black/30 transition-all duration-200 bg-surface-container-low/50 dark:bg-white/[0.03]"
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                {member.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">{member.name}</p>
                <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-1.5">{member.nim}</p>
                <span className={`inline-flex items-center gap-1 ${member.badge} text-[11px] font-bold px-2 py-0.5 rounded-full`}>
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{member.icon}</span>
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-on-surface-variant dark:text-slate-600 mt-8 pb-2">
        Studyfy LMS · Cloud Computing · Institut Teknologi Kalimantan · 2025/2026
      </p>

    </div>
  )
}

export default AboutPage