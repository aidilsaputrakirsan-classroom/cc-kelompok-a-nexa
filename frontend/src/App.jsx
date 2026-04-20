import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import ItemForm from "./components/ItemForm"
import ItemList from "./components/ItemList"
import LoginPage from "./components/LoginPage"
import DashboardStats from "./components/DashboardStats"
import TeamInfo from "./components/TeamInfo"
import UserProfileModal from "./components/UserProfileModal"
import ClassList from "./components/ClassList"
import ClassForm from "./components/ClassForm"
import ClassDetail from "./components/ClassDetail"
import {
  fetchItems, createItem, updateItem, deleteItem,
  fetchClasses, createClass, updateClass, deleteClass,
  checkHealth, login, register, setToken, clearToken, getMe
} from "./services/api"

function App() {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ==================== APP STATE ====================
  const [activeTab, setActiveTab] = useState("inventory") // 'inventory' or 'classes'
  const [isConnected, setIsConnected] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  // --- Inventory State ---
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loadingItems, setLoadingItems] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshStats, setRefreshStats] = useState(0)

  // --- Classes State ---
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null) // For Class Detail

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async (search = "") => {
    setLoadingItems(true)
    try {
      const data = await fetchItems(search)
      setItems(data.items)
      setTotalItems(data.total)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      console.error("Error loading items:", err)
    } finally {
      setLoadingItems(false)
    }
  }, [])

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const data = await fetchClasses()
      setClasses(data.classes)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      console.error("Error loading classes:", err)
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  useEffect(() => {
    checkHealth().then(setIsConnected)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
      loadClasses()
      getMe().then(data => setUser(data)).catch(() => {})
    }
  }, [isAuthenticated, loadItems, loadClasses])

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
    setItems([])
    setClasses([])
  }

  // ==================== ITEM HANDLERS ====================

  const handleItemSubmit = async (itemData, editId) => {
    try {
      if (editId) {
        await updateItem(editId, itemData)
        setEditingItem(null)
      } else {
        await createItem(itemData)
      }
      loadItems(searchQuery)
      setRefreshStats(prev => prev + 1)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else throw err
    }
  }

  const handleItemDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus item ini?")) return
    try {
      await deleteItem(id)
      loadItems(searchQuery)
      setRefreshStats(prev => prev + 1)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal menghapus: " + err.message)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadItems(query)
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
    if (!window.confirm("Yakin ingin menghapus kelas ini?")) return
    try {
      await deleteClass(id)
      loadClasses()
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal menghapus: " + err.message)
    }
  }

  // ==================== RENDER ====================

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
  }

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Header
          totalItems={totalItems}
          isConnected={isConnected}
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSelectedClass(null) // Reset class detail view when switching tabs
          }}
        />

        {isProfileOpen && (
          <UserProfileModal 
            user={user} 
            onClose={() => setIsProfileOpen(false)} 
            onUpdateSuccess={setUser} 
          />
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <>
            <DashboardStats refreshTrigger={refreshStats} />
            <ItemForm
              onSubmit={handleItemSubmit}
              editingItem={editingItem}
              onCancelEdit={() => setEditingItem(null)}
            />
            <SearchBar onSearch={handleSearch} />
            <ItemList
              items={items}
              onEdit={(item) => { setEditingItem(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onDelete={handleItemDelete}
              loading={loadingItems}
            />
          </>
        )}

        {/* CLASSES TAB */}
        {activeTab === "classes" && (
          <>
            {selectedClass ? (
              <ClassDetail 
                classItem={selectedClass} 
                onBack={() => setSelectedClass(null)}
                currentUser={user}
              />
            ) : (
              <>
                {user.role === 'admin' && (
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
                  onSelect={setSelectedClass}
                  onEdit={(cls) => { setEditingClass(cls); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  onDelete={handleClassDelete}
                />
              </>
            )}
          </>
        )}

        <TeamInfo />
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "2rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: { maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" },
}

export default App