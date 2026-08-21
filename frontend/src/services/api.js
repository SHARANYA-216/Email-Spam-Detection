import axios from 'axios';

const API_BASE_URL = 'https://email-spam-detection-oyhu.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mailguard_token') || sessionStorage.getItem('mailguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password, rememberMe = false) => api.post('/auth/login', { email, password, remember_me: rememberMe }),
  register: (email, password, fullName = 'MailGuard User') =>
    api.post('/auth/register', { email, password, full_name: fullName }),
};

export const emailAPI = {
  analyze: (sender, subject, body) => api.post('/emails/analyze', { sender, subject, body }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/emails/upload', formData);
  },
  getHistory: (params) => api.get('/emails/history', { params }),
  getDetail: (id) => api.get(`/emails/${id}`),
  delete: (id) => api.delete(`/emails/${id}`),
  submitFeedback: (id, isCorrect, userCorrection) =>
    api.post(`/emails/${id}/feedback`, { is_correct: isCorrect, user_correction: userCorrection }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getTrends: (days = 7) => api.get(`/dashboard/trends?days=${days}`),
  getRiskDistribution: () => api.get('/dashboard/risk-distribution'),
  getRecentThreats: () => api.get('/dashboard/recent-threats'),
};

export const modelAPI = {
  getPerformance: () => api.get('/model/performance'),
  triggerRetrain: () => api.post('/model/retrain'),
};

export default api;
