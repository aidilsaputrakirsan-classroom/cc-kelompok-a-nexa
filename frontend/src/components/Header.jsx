import React from "react"

function Header({ isConnected, user, onLogout, onOpenProfile, activeTab, onTabChange, darkMode, onToggleDarkMode }) {
  if (!user) return null

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Administrator'
    if (role === 'dosen') return 'Dosen'
    return 'Mahasiswa'
  }

  return (
    <>
      {/* SideNavBar Component */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-[#1a1928] flex flex-col py-8 px-4 space-y-2 z-50 overflow-y-auto border-r border-outline-variant/10 dark:border-white/5 transition-colors duration-300">
        <div className="px-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">Studyfy</h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-slate-400 mt-1">The Fluid Academy</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => onTabChange('beranda')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-bold ${
              activeTab === 'beranda'
                ? 'text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('classes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-bold ${
              activeTab === 'classes'
                ? 'text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span>Courses</span>
          </button>

          {(user.role === 'dosen' || user.role === 'admin') && (
            <button
              onClick={() => onTabChange('archives')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-bold ${
                activeTab === 'archives'
                  ? 'text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Archives</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('about')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-bold ${
              activeTab === 'about'
                ? 'text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">info</span>
            <span>About</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-outline-variant/10 dark:border-white/5 space-y-1">
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-white/5"
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar Component */}
      <header className="fixed top-0 right-0 left-64 h-16 bg-white/70 dark:bg-[#13121e]/80 backdrop-blur-xl z-40 flex justify-between items-center px-8 shadow-sm dark:shadow-black/20 border-b border-transparent dark:border-white/5 transition-colors duration-300">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-96 hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              placeholder="Search courses, tutors, or tasks..."
              className="w-full bg-surface-container dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {isConnected ? "Online" : "Offline"}
          </div>

          <div className="h-8 w-px bg-outline-variant/20 dark:bg-white/10 mx-1"></div>

          {/* ===== DARK MODE TOGGLE ===== */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-yellow-300"
          >
            <span
              className="material-symbols-outlined text-xl transition-all duration-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <div className="h-8 w-px bg-outline-variant/20 dark:bg-white/10 mx-1"></div>

          <button onClick={onOpenProfile} className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface dark:text-slate-100 leading-none">{user.name}</p>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400 leading-none mt-1">{getRoleLabel(user.role)}</p>
            </div>
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center font-bold text-lg ring-2 ring-primary/10">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>
    </>
  )
}

export default Header