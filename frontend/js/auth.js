// MailGuard AI - Authentication State Manager

class AuthManager {
  constructor() {
    this.tokenKey = window.CONFIG?.AUTH_TOKEN_KEY || 'mailguard_auth_token';
    this.userKey = window.CONFIG?.USER_DATA_KEY || 'mailguard_user_data';
  }

  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  getUser() {
    try {
      const u = localStorage.getItem(this.userKey);
      return u ? JSON.parse(u) : {
        full_name: "Prashanthi Kolli",
        email: "analyst@mailguard.ai",
        role: "Lead SecOps Analyst"
      };
    } catch (_) {
      return {
        full_name: "Prashanthi Kolli",
        email: "analyst@mailguard.ai",
        role: "Lead SecOps Analyst"
      };
    }
  }

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.reload();
  }
}

window.authManager = new AuthManager();
