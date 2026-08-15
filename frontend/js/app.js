// MailGuard AI - Main Application Controller & UI State

const App = {
  init() {
    this.setupAuthUI();
    window.Router.init();
  },

  setupAuthUI() {
    const user = window.authManager.getUser();
    const userNameEl = document.getElementById('user-profile-name');
    const userRoleEl = document.getElementById('user-profile-role');
    const userAvatarEl = document.getElementById('user-avatar-initials');

    if (userNameEl) userNameEl.textContent = user.full_name || "Prashanthi Kolli";
    if (userRoleEl) userRoleEl.textContent = user.role || "Lead SecOps Analyst";
    if (userAvatarEl) {
      const initials = (user.full_name || "PK").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      userAvatarEl.textContent = initials;
    }
  },

  handleGlobalSearch(query) {
    if (!query) return;
    if (window.location.hash !== '#/history') {
      window.location.hash = '#/history';
      setTimeout(() => {
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
          searchInput.value = query;
          window.HistoryPage.handleSearch(query);
        }
      }, 100);
    } else {
      const searchInput = document.getElementById('history-search');
      if (searchInput) {
        searchInput.value = query;
        window.HistoryPage.handleSearch(query);
      }
    }
  },

  async openEmailDetailModal(emailId) {
    try {
      const data = await window.apiService.getEmailDetail(emailId);
      const modalBackdrop = document.getElementById('email-detail-modal');
      const modalContent = document.getElementById('modal-detail-body');
      if (!modalBackdrop || !modalContent) return;

      let badgeClass = 'badge-low';
      if (data.risk_level === 'HIGH') badgeClass = 'badge-high';
      else if (data.risk_level === 'MEDIUM') badgeClass = 'badge-medium';

      modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Header Meta -->
          <div style="background: var(--bg-subtle); padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Sender</div>
              <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main); word-break: break-all;">${this.escapeHtml(data.sender)}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Classification & Risk</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                <span class="badge ${badgeClass}">${data.risk_level} RISK (${data.risk_score}/100)</span>
                <span class="badge badge-purple">${data.classification}</span>
              </div>
            </div>
            <div style="grid-column: span 2;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Subject</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${this.escapeHtml(data.subject)}</div>
            </div>
          </div>

          <!-- Explainable Signals -->
          <div>
            <div style="font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; text-transform: uppercase;">
              💡 Detection Signals & Evidence
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(data.explanations || []).map(exp => `
                <div style="padding: 10px 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700;">
                    <span>${exp.title}</span>
                    <span class="badge badge-${exp.badge_color}">${exp.severity}</span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${exp.explanation}</div>
                  ${exp.evidence ? `<div style="font-size: 11px; font-family: var(--font-mono); background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; margin-top: 4px;">${exp.evidence}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Highlighted Body -->
          <div>
            <div style="font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; text-transform: uppercase;">
              📝 Original Email Content
            </div>
            <div class="highlight-body-box" style="max-height: 240px; overflow-y: auto;">
              ${data.highlight_spans && data.highlight_spans.length > 0 
                ? data.highlight_spans.map(s => {
                    if (s.type === 'high_risk') return `<mark class="hl-high-risk" title="${s.explanation}">${this.escapeHtml(s.text)}</mark>`;
                    if (s.type === 'suspicious') return `<mark class="hl-suspicious" title="${s.explanation}">${this.escapeHtml(s.text)}</mark>`;
                    return `<span class="hl-normal">${this.escapeHtml(s.text)}</span>`;
                  }).join('')
                : this.escapeHtml(data.body)
              }
            </div>
          </div>

          <!-- Feedback Status -->
          ${data.feedback ? `
            <div style="padding: 12px 16px; background: var(--success-bg); border: 1px solid var(--success-border); border-radius: var(--radius-md); font-size: 12.5px; color: var(--success-text);">
              <strong>Feedback Status:</strong> ${data.feedback.is_correct ? 'Confirmed correct by SecOps triage' : `Corrected to: ${data.feedback.user_correction}`}
            </div>
          ` : ''}
        </div>
      `;

      modalBackdrop.style.display = 'flex';
    } catch (err) {
      alert("Failed to load email details: " + err.message);
    }
  },

  closeEmailDetailModal() {
    const modalBackdrop = document.getElementById('email-detail-modal');
    if (modalBackdrop) modalBackdrop.style.display = 'none';
  },

  openLoginModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
  },

  closeLoginModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
  },

  fillDemoLogin() {
    document.getElementById('auth-email').value = 'analyst@mailguard.ai';
    document.getElementById('auth-password').value = 'Admin@123';
  },

  async handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const rememberMe = document.getElementById('auth-remember').checked;

    try {
      const res = await window.apiService.login(email, password, rememberMe);
      window.authManager.setSession(res.access_token, res.user);
      this.closeLoginModal();
      this.setupAuthUI();
      alert("Authenticated successfully as " + res.user.full_name);
    } catch (err) {
      alert("Authentication error: " + err.message);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
