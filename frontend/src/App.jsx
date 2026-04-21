import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import LoginPage from "./components/LoginPage"
import Dashboard from "./components/Dashboard"
import ClassList from "./components/ClassList"
import ClassForm from "./components/ClassForm"
import ClassDetail from "./components/ClassDetail"
import UserProfileModal from "./components/UserProfileModal"
import TeamInfo from "./components/TeamInfo"
import {
  fetchClasses, createClass, updateClass, deleteClass, archiveClass, unarchiveClass,
  checkHealth, login, register, clearToken, getMe
} from "./services/api"

function App() {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ==================== APP STATE ====================
  const [activeTab, setActiveTab] = useState("beranda")
  const [isConnected, setIsConnected] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // --- Classes State ---
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [filters, setFilters] = useState({ semester: "", instructor_id: "" })

  // ==================== LOAD DATA ====================
  const loadClasses = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const params = {}
      if (filters.semester) params.semester = filters.semester
      if (filters.instructor_id) params.instructor_id = filters.instructor_id
      if (activeTab === "archives") params.only_archived = true
      
      const data = await fetchClasses(params)
      setClasses(data.classes)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
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
      getMe().then(data => setUser(data)).catch(() => {})
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
    <div className="bg-surface text-on-surface min-h-screen">
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
      />

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
                {user?.role === 'admin' && (
                  <ClassForm
                    onSubmit={handleClassSubmit}
                    editingClass={editingClass}
                    onCancelEdit={() => setEditingClass(null)}
                  />
                )}
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