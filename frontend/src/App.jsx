import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import LoginPage from "./components/LoginPage"
import Dashboard from "./components/Dashboard"
import ClassList from "./components/ClassList"
import ClassForm from "./components/ClassForm"
import ClassDetail from "./components/ClassDetail"
import UserProfileModal from "./components/UserProfileModal"
import TeamInfo from "./components/TeamInfo"
import AboutPage from "./components/AboutPage"
import {
  fetchClasses, createClass, updateClass, deleteClass, archiveClass, unarchiveClass,
  checkHealth, login, register, clearToken, getMe
} from "./services/api"
import StatusPage from "./pages/StatusPage"

function App() {
  if (window.location.pathname === '/status') {
    return <StatusPage />;
  }

  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authDown, setAuthDown] = useState(false)

  // ==================== APP STATE ====================
  const [activeTab, setActiveTab] = useState("beranda")
  const [isConnected, setIsConnected] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // ==================== DARK MODE ====================
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage, default false (light)
    return localStorage.getItem("studyfy-dark-mode") === "true"
  })

  // Apply dark class to <html> whenever darkMode changes
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("studyfy-dark-mode", String(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  // --- Classes State ---
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [classesError, setClassesError] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [filters, setFilters] = useState({ semester: "", instructor_id: "" })

  // ==================== LOAD DATA ====================
  const loadClasses = useCallback(async () => {
    setLoadingClasses(true)
    setClassesError(null)
    try {
      const params = {}
      if (filters.semester) params.semester = filters.semester
      if (filters.instructor_id) params.instructor_id = filters.instructor_id
      if (activeTab === "archives") params.only_archived = true
      
      const data = await fetchClasses(params)
      setClasses(data.classes)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else if (err.message === "Service temporarily unavailable") {
        setClassesError("Layanan tidak tersedia. Silakan coba lagi nanti.")
      } else {
        setClassesError("Gagal memuat kelas.")
      }
      console.error("Error loading classes:", err)
    } finally {
      setLoadingClasses(false)
    }
  }, [filters, activeTab])

  useEffect(() => {
    checkHealth().then(setIsConnected)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadClasses()
      getMe().then(data => {
        setUser(data)
        setAuthDown(false)
      }).catch((err) => {
        if (err.message === "Service temporarily unavailable") {
          setAuthDown(true)
        }
      })
    }
  }, [isAuthenticated, loadClasses])

  // ==================== AUTH HANDLERS ====================
  const handleLogin = async (data) => {
    const res = await login(data)
    setUser(res.user)
    setIsAuthenticated(true)
  }

  const handleRegister = async (userData) => {
    await register(userData)
    await handleLogin({ email: userData.email, password: userData.password })
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setClasses([])
    setEditingClass(null)
    setSelectedClass(null)
    setActiveTab("beranda")
  }

  // ==================== CLASS HANDLERS ====================
  const handleClassSubmit = async (classData, editId) => {
    try {
      if (editId) {
        await updateClass(editId, classData)
        setEditingClass(null)
      } else {
        await createClass(classData)
      }
      loadClasses()
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else throw err
    }
  }

  const handleClassDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus kelas ini secara permanen?")) return
    try {
      await deleteClass(id)
      loadClasses()
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal menghapus: " + err.message)
    }
  }

  const handleClassArchive = async (id) => {
    if (!window.confirm("Yakin ingin mengarsipkan kelas ini?")) return
    try {
      await archiveClass(id)
      loadClasses()
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal mengarsip: " + err.message)
    }
  }

  const handleClassUnarchive = async (id) => {
    if (!window.confirm("Keluarkan kelas ini dari arsip?")) return
    try {
      await unarchiveClass(id)
      loadClasses()
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal mengembalikan kelas: " + err.message)
    }
  }

  // ==================== RENDER ====================
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
  }

  return (
    <div className="bg-surface dark:bg-[#0f0e17] text-on-surface dark:text-slate-100 min-h-screen transition-colors duration-300">
      <Header
        isConnected={isConnected}
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedClass(null)
        }}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {authDown && (
        <div className="fixed top-16 left-64 right-0 z-40 bg-amber-500 text-amber-950 px-4 py-2 text-center font-bold shadow-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-xl">warning</span>
          Some features temporarily unavailable
        </div>
      )}

      {isProfileOpen && (
        <UserProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onUpdateSuccess={setUser}
        />
      )}

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 px-8 pb-12 min-h-screen flex flex-col">
        {/* BERANDA TAB */}
        {activeTab === "beranda" && user && (
          <Dashboard user={user} />
        )}

        {/* KELAS TAB */}
        {activeTab === "classes" && (
          <div className="flex-1">
            {selectedClass ? (
              <ClassDetail
                classItem={selectedClass}
                onBack={() => setSelectedClass(null)}
                currentUser={user}
              />
            ) : (
              <>
                {user?.role === 'dosen' && (
                  <ClassForm
                    onSubmit={handleClassSubmit}
                    editingClass={editingClass}
                    onCancelEdit={() => setEditingClass(null)}
                    currentUser={user}
                  />
                )}
                {classesError ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface-container-lowest dark:bg-[#1a1928] rounded-xl border border-red-200 dark:border-red-900/30 text-center mt-4">
                    <span className="material-symbols-outlined text-6xl text-red-500 mb-4">cloud_off</span>
                    <h3 className="text-xl font-bold text-on-surface dark:text-white mb-2">Oops, Terjadi Kesalahan</h3>
                    <p className="text-on-surface-variant dark:text-slate-400 mb-8 max-w-md">{classesError}</p>
                    <button
                      onClick={loadClasses}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <ClassList
                    classes={classes}
                    loading={loadingClasses}
                    currentUser={user}
                    filters={filters}
                    onFilterChange={setFilters}
                    onSelect={setSelectedClass}
                    onEdit={(cls) => { setEditingClass(cls); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    onDelete={handleClassDelete}
                    onArchive={handleClassArchive}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ARSIP KELAS TAB */}
        {activeTab === "archives" && (
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Arsip Kelas
            </h2>
            {classesError ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface-container-lowest dark:bg-[#1a1928] rounded-xl border border-red-200 dark:border-red-900/30 text-center mt-4">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">cloud_off</span>
                <h3 className="text-xl font-bold text-on-surface dark:text-white mb-2">Oops, Terjadi Kesalahan</h3>
                <p className="text-on-surface-variant dark:text-slate-400 mb-8 max-w-md">{classesError}</p>
                <button
                  onClick={loadClasses}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Coba Lagi
                </button>
              </div>
            ) : (
              <ClassList
                classes={classes}
                loading={loadingClasses}
                currentUser={user}
                filters={filters}
                onFilterChange={setFilters}
                onSelect={setSelectedClass}
                onEdit={(cls) => { setEditingClass(cls); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onDelete={handleClassDelete}
                onArchive={handleClassArchive}
                onUnarchive={handleClassUnarchive}
                isArchivePage={true}
              />
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="flex-1">
            <AboutPage onBack={() => setActiveTab("beranda")} />
          </div>
        )}

        <div className="mt-auto pt-8">
          <TeamInfo />
        </div>
      </main>
    </div>
  )
}

export default App