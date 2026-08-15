// MailGuard AI - API Client Service
// Centralized communication layer with FastAPI backend

class ApiService {
  constructor() {
    this.baseUrl = window.CONFIG?.API_BASE_URL || '/api';
  }

  getAuthHeader() {
    const token = localStorage.getItem(window.CONFIG?.AUTH_TOKEN_KEY || 'mailguard_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeader(),
      ...options.headers
    };

    // If body is not FormData, add JSON content type
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // Authentication
  async login(email, password, rememberMe = false) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe })
    });
  }

  async register(email, password, fullName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName })
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Email Analysis
  async analyzeEmail(sender, subject, body) {
    return this.request('/emails/analyze', {
      method: 'POST',
      body: JSON.stringify({ sender, subject, body })
    });
  }

  async uploadEmailFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/emails/upload', {
      method: 'POST',
      body: formData
    });
  }

  async getEmailHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.classification) query.append('classification', params.classification);
    if (params.risk_level) query.append('risk_level', params.risk_level);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    return this.request(`/emails/history?${query.toString()}`);
  }

  async getEmailDetail(id) {
    return this.request(`/emails/${id}`);
  }

  async submitFeedback(emailId, feedbackData) {
    return this.request(`/emails/${emailId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  }

  // Dashboard Telemetry
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardTrends(timeframe = '7d') {
    return this.request(`/dashboard/trends?timeframe=${timeframe}`);
  }

  async getRiskDistribution() {
    return this.request('/dashboard/risk-distribution');
  }

  async getRecentThreats(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.risk_filter) query.append('risk_filter', params.risk_filter);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size || 10);

    return this.request(`/dashboard/recent-threats?${query.toString()}`);
  }

  // Model Performance
  async getModelPerformance() {
    return this.request('/model/performance');
  }

  async getModelVersions() {
    return this.request('/model/versions');
  }

  async triggerRetrain() {
    return this.request('/model/retrain', {
      method: 'POST'
    });
  }
}

window.apiService = new ApiService();
