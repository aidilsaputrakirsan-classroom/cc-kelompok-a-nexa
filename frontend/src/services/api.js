const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ==================== TOKEN MANAGEMENT ====================

let authToken = null

export function setToken(token) {
  authToken = token
}

export function getToken() {
  return authToken
}

export function clearToken() {
  authToken = null
}

function authHeaders() {
  const headers = {"Content-Type": "application/json"}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

// Helper: handle response errors
async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    throw new Error("UNAUTHORIZED")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request gagal (${response.status})`)
  }
  // 204 No Content
  if (response.status === 204) return null
  return response.json()
}

// ==================== AUTH API ====================

export async function register(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return handleResponse(response)
}

export async function login(data) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const res = await handleResponse(response)
  setToken(res.access_token)
  return res
}

export async function getTeam() {
  const response = await fetch(`${API_URL}/team`)
  return handleResponse(response)
}

// ==================== CLASSES API ====================

export async function fetchClasses(params = {}) {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.append("skip", params.skip)
  if (params.limit !== undefined) query.append("limit", params.limit)
  if (params.instructor_id) query.append("instructor_id", params.instructor_id)
  if (params.semester) query.append("semester", params.semester)
  
  const response = await fetch(`${API_URL}/classes?${query.toString()}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createClass(classData) {
  const response = await fetch(`${API_URL}/classes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(classData),
  })
  return handleResponse(response)
}

export async function updateClass(id, classData) {
  const response = await fetch(`${API_URL}/classes/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(classData),
  })
  return handleResponse(response)
}

export async function deleteClass(id) {
  const response = await fetch(`${API_URL}/classes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (response.status === 204) return null
  return handleResponse(response)
}

export async function fetchClassStudents(classId) {
  const response = await fetch(`${API_URL}/classes/${classId}/students`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function addStudentToClass(classId, userId) {
  const response = await fetch(`${API_URL}/classes/${classId}/students/${userId}`, {
    method: "POST",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function removeStudentFromClass(classId, userId) {
  const response = await fetch(`${API_URL}/classes/${classId}/students/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (response.status === 204) return null
  return handleResponse(response)
}

export async function fetchUserClasses(userId) {
  const response = await fetch(`${API_URL}/users/${userId}/classes`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function updateProfile(profileData) {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  })
  return handleResponse(response)
}

// ==================== ITEMS API ====================

export async function fetchItems(search = "", skip = 0, limit = 20) {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("skip", skip)
  params.append("limit", limit)

  const response = await fetch(`${API_URL}/items?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getStats() {
  const response = await fetch(`${API_URL}/items/stats`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createItem(itemData) {
  const response = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function updateItem(id, itemData) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}