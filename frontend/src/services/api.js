const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Centralized fetch wrapper to handle service unavailability
const originalFetch = globalThis.fetch;
const fetch = async (url, options) => {
  try {
    const response = await originalFetch(url, options);
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error("Service temporarily unavailable");
    }
    return response;
  } catch (error) {
    if (error.message === "Service temporarily unavailable") {
      throw error;
    }
    console.error("API Connection/Server Error:", error);
    throw new Error("Service temporarily unavailable");
  }
};

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

async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    throw new Error("UNAUTHORIZED")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request gagal (${response.status})`)
  }
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

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function fetchUsers(role = null) {
  const query = role ? `?role=${role}` : ""
  const response = await fetch(`${API_URL}/users${query}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getTeam() {
  const response = await fetch(`${API_URL}/team`)
  return handleResponse(response)
}

// ==================== USER PROFILE ====================

export async function updateProfile(profileData) {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  })
  return handleResponse(response)
}

// ==================== CLASSES API ====================

export async function fetchClasses(params = {}) {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.append("skip", params.skip)
  if (params.limit !== undefined) query.append("limit", params.limit)
  if (params.instructor_id) query.append("instructor_id", params.instructor_id)
  if (params.semester) query.append("semester", params.semester)
  if (params.only_archived) query.append("only_archived", params.only_archived)

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

export async function archiveClass(id) {
  const response = await fetch(`${API_URL}/classes/${id}/archive`, {
    method: "PATCH",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function unarchiveClass(id) {
  const response = await fetch(`${API_URL}/classes/${id}/unarchive`, {
    method: "PATCH",
    headers: authHeaders(),
  })
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

// ==================== MATERIAL API ====================

export async function fetchMaterials(classId, params = {}) {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.append("skip", params.skip)
  if (params.limit !== undefined) query.append("limit", params.limit)
  const response = await fetch(`${API_URL}/classes/${classId}/materials?${query.toString()}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createMaterial(classId, materialData) {
  const response = await fetch(`${API_URL}/classes/${classId}/materials`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(materialData),
  })
  return handleResponse(response)
}

export async function updateMaterial(classId, materialId, materialData) {
  const response = await fetch(`${API_URL}/classes/${classId}/materials/${materialId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(materialData),
  })
  return handleResponse(response)
}

export async function deleteMaterial(classId, materialId) {
  const response = await fetch(`${API_URL}/classes/${classId}/materials/${materialId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (response.status === 204) return null
  return handleResponse(response)
}

export async function toggleMaterialPublish(classId, materialId, isPublished) {
  const response = await fetch(`${API_URL}/classes/${classId}/materials/${materialId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ is_published: isPublished }),
  })
  return handleResponse(response)
}

// ==================== ASSIGNMENT API ====================

export async function fetchAssignments(classId, params = {}) {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.append("skip", params.skip)
  if (params.limit !== undefined) query.append("limit", params.limit)
  const response = await fetch(`${API_URL}/classes/${classId}/assignments?${query.toString()}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createAssignment(classId, data) {
  const response = await fetch(`${API_URL}/classes/${classId}/assignments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function updateAssignment(classId, assignmentId, data) {
  const response = await fetch(`${API_URL}/classes/${classId}/assignments/${assignmentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export async function deleteAssignment(classId, assignmentId) {
  const response = await fetch(`${API_URL}/classes/${classId}/assignments/${assignmentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (response.status === 204) return null
  return handleResponse(response)
}

// ==================== SUBMISSION API ====================

export async function submitAssignment(classId, assignmentId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const headers = {}
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`
  const response = await fetch(
    `${API_URL}/classes/${classId}/assignments/${assignmentId}/submissions`,
    { method: "POST", headers, body: formData }
  )
  return handleResponse(response)
}

export async function getMySubmission(classId, assignmentId) {
  const response = await fetch(
    `${API_URL}/classes/${classId}/assignments/${assignmentId}/my-submission`,
    { headers: authHeaders() }
  )
  return handleResponse(response)
}

export async function listSubmissions(classId, assignmentId, params = {}) {
  const query = new URLSearchParams()
  if (params.skip !== undefined) query.append("skip", params.skip)
  if (params.limit !== undefined) query.append("limit", params.limit)
  const response = await fetch(
    `${API_URL}/classes/${classId}/assignments/${assignmentId}/submissions?${query.toString()}`,
    { headers: authHeaders() }
  )
  return handleResponse(response)
}

export async function returnSubmission(submissionId) {
  const response = await fetch(`${API_URL}/submissions/${submissionId}/return`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (response.status === 204) return null
  return handleResponse(response)
}

// ==================== GRADING API ====================

export async function submitGrade(submissionId, score) {
  const response = await fetch(`${API_URL}/submissions/${submissionId}/grade`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ score }),
  })
  return handleResponse(response)
}

export async function getSubmissionGrade(submissionId) {
  const response = await fetch(`${API_URL}/submissions/${submissionId}/grade`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== ITEMS API (kept for backend compatibility) ====================

export async function fetchItems(search = "", skip = 0, limit = 20) {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("skip", skip)
  params.append("limit", limit)
  const response = await fetch(`${API_URL}/items?${params}`, { headers: authHeaders() })
  return handleResponse(response)
}

export async function getStats() {
  const response = await fetch(`${API_URL}/items/stats`, { headers: authHeaders() })
  return handleResponse(response)
}

export async function createItem(itemData) {
  const response = await fetch(`${API_URL}/items`, { method: "POST", headers: authHeaders(), body: JSON.stringify(itemData) })
  return handleResponse(response)
}

export async function updateItem(id, itemData) {
  const response = await fetch(`${API_URL}/items/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(itemData) })
  return handleResponse(response)
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/items/${id}`, { method: "DELETE", headers: authHeaders() })
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

// ==================== SYSTEM METRICS API ====================

export async function fetchGatewayHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error("Gateway degraded");
    const data = await response.json();
    return {
      status: "healthy",
      data: data
    };
  } catch (error) {
    return {
      status: "unreachable",
      error: error.message
    };
  }
}

export async function fetchAuthMetrics() {
  try {
    // Gateway routes to auth-service
    const response = await fetch(`${API_URL}/auth/metrics`);
    if (!response.ok) throw new Error("Service degraded");
    const data = await response.json();
    return {
      status: "healthy",
      data: data
    };
  } catch (error) {
    return {
      status: "unreachable",
      error: error.message
    };
  }
}

export async function fetchItemMetrics() {
  try {
    // Note: If Nginx config maps /items/metrics to item-service /items/metrics, 
    // it depends on the gateway routing. 
    // The instructions say "endpoint /auth/metrics, /items/metrics, dan /items/health"
    const response = await fetch(`${API_URL}/items/metrics`);
    if (!response.ok) throw new Error("Service degraded");
    const data = await response.json();
    return {
      status: "healthy",
      data: data
    };
  } catch (error) {
    return {
      status: "unreachable",
      error: error.message
    };
  }
}