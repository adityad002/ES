import axios from 'axios';

// Debug environment variables
console.log('API Configuration Debug:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final baseURL:', process.env.REACT_APP_API_URL || '/api');

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.baseURL + config.url);
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    console.error('Request URL:', error.config?.url);
    console.error('Base URL:', error.config?.baseURL);
    console.error('Full URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
    
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., token expired)
      console.log('Unauthorized access detected, redirecting to login');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API services for different endpoints
const authService = {
  login: async (credentials) => {
    try {
      console.log('Sending login request with credentials:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      console.log('Login response received:', response.status);
      return response;
    } catch (error) {
      console.error('Login request failed:', error.message);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      console.log('Sending registration request for:', userData.email);
      const response = await api.post('/auth/register', userData);
      console.log('Registration response received:', response.status);
      return response;
    } catch (error) {
      console.error('Registration request failed:', error.message);
      throw error;
    }
  },
  getProfile: async () => {
    try {
      console.log('Fetching user profile');
      const response = await api.get('/auth/me');
      console.log('Profile data received');
      return response;
    } catch (error) {
      console.error('Profile fetch failed:', error.message);
      throw error;
    }
  }
};

const teacherService = {
  getAll: () => api.get('/teachers'),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getAvailability: (id) => api.get(`/teachers/${id}/availability`),
  updateAvailability: (id, data) => api.put(`/teachers/${id}/availability`, data)
};

const subjectService = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`)
};

const subjectAssignmentService = {
  getAll: () => api.get('/subject-assignments'),
  getById: (id) => api.get(`/subject-assignments/${id}`),
  create: (data) => api.post('/subject-assignments', data),
  update: (id, data) => api.put(`/subject-assignments/${id}`, data),
  delete: (id) => api.delete(`/subject-assignments/${id}`),
  getByTeacher: (teacherId) => api.get(`/subject-assignments/by-teacher/${teacherId}`),
  getBySubject: (subjectId) => api.get(`/subject-assignments/by-subject/${subjectId}`),
  getByClass: (className) => api.get(`/subject-assignments/by-class/${className}`)
};

const timetableService = {
  getAll: () => api.get('/timetable'),
  getBySemester: (semester) => api.get(`/timetable/semester/${semester}`),
  getByTeacher: (teacherId) => api.get(`/timetable/teacher/${teacherId}`),
  generate: (params = {}) => api.post('/timetable/generate', params),
  clear: () => api.delete('/timetable/all'),
  getStats: () => api.get('/timetable/stats')
};

const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export {
  api as default,
  authService,
  teacherService,
  subjectService,
  subjectAssignmentService,
  timetableService,
  settingsService
}; 