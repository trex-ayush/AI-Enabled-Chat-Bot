import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

// Auth API
export const authAPI = {
  login: (email, password) =>
    axios.post(`${API_BASE_URL}/auth/login`, { email, password }),

  register: (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData),

  logout: () => axios.post(`${API_BASE_URL}/auth/logout`),

  getProfile: () => axios.get(`${API_BASE_URL}/auth/profile`),

  updateProfile: (userData) =>
    axios.put(`${API_BASE_URL}/auth/profile`, userData),
};

// Support API
export const supportAPI = {
  createSession: () => axios.post(`${API_BASE_URL}/support/sessions`),

  createUserSession: () => axios.post(`${API_BASE_URL}/support/user/sessions`),

  sendMessage: (sessionId, message) =>
    axios.post(`${API_BASE_URL}/support/chat`, { sessionId, message }),

  getSessionHistory: (sessionId) =>
    axios.get(`${API_BASE_URL}/support/sessions/${sessionId}`),

  getFAQs: () => axios.get(`${API_BASE_URL}/support/faqs`),

  healthCheck: () => axios.get(`${API_BASE_URL}/support/health`),

  // New endpoints for user chat history
  getUserChats: (page = 1, limit = 20) =>
    axios.get(`${API_BASE_URL}/support/user/chats`, {
      params: { page, limit }
    }),

  getUserSession: (sessionId) =>
    axios.get(`${API_BASE_URL}/support/user/sessions/${sessionId}`),
};

// Admin API
export const adminAPI = {
  getEscalatedChats: (params = {}) =>
    axios.get(`${API_BASE_URL}/admin/escalated-chats`, { params }),

  getChatDetails: (chatId) =>
    axios.get(`${API_BASE_URL}/admin/escalated-chats/${chatId}`),

  assignAdminToChat: (chatId, adminId) =>
    axios.post(`${API_BASE_URL}/admin/escalated-chats/${chatId}/assign`, {
      adminId,
    }),

  sendAdminMessage: (sessionId, message) =>
    axios.post(`${API_BASE_URL}/admin/sessions/${sessionId}/admin-message`, {
      message,
    }),

  resolveChat: (chatId, resolutionNotes) =>
    axios.post(`${API_BASE_URL}/admin/escalated-chats/${chatId}/resolve`, {
      resolutionNotes,
    }),

  addAdminNote: (chatId, note) =>
    axios.post(`${API_BASE_URL}/admin/escalated-chats/${chatId}/notes`, {
      note,
    }),

  getDashboardStats: () => axios.get(`${API_BASE_URL}/admin/dashboard/stats`),

  getAllUsers: () => axios.get(`${API_BASE_URL}/admin/users`),

  createUser: (userData) => axios.post(`${API_BASE_URL}/admin/users`, userData),

  updateUser: (userId, userData) =>
    axios.put(`${API_BASE_URL}/admin/users/${userId}`, userData),
};