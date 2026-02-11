import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Users
export const getCurrentUser = () => api.get('/users/me');
export const updatePreferences = (preferences) => api.put('/users/preferences', { preferences });
export const updateLocation = (location) => api.put('/users/location', location);

// Events
export const searchEvents = (params) => api.get('/events/search', { params });
export const getEvent = (id) => api.get(`/events/${id}`);
export const refreshEvents = (data) => api.post('/events/refresh', data);
export const getCategories = () => api.get('/events/meta/categories');

// Groups
export const createGroup = (data) => api.post('/groups', data);
export const searchGroups = (params) => api.get('/groups/search', { params });
export const getGroup = (id) => api.get(`/groups/${id}`);
export const joinGroup = (id) => api.post(`/groups/${id}/join`);
export const leaveGroup = (id) => api.post(`/groups/${id}/leave`);
export const getGroupMembers = (id) => api.get(`/groups/${id}/members`);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);

// Group Events
export const getGroupEvents = (groupId) => api.get(`/group-events/group/${groupId}`);
export const attachEvent = (data) => api.post('/group-events/attach', data);
export const createCustomEvent = (data) => api.post('/group-events/create', data);
export const rsvpEvent = (eventId, status) => api.post(`/group-events/${eventId}/rsvp`, { status });
export const getEventRSVPs = (eventId) => api.get(`/group-events/${eventId}/rsvps`);

// Chat
export const sendChatMessage = (message) => api.post('/chat/message', { message });

export default api;
// Group Messages
export const getGroupMessages = (groupId, limit = 50) => 
  api.get(`/group-messages/${groupId}`, { params: { limit } });
