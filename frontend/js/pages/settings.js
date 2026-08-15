// MailGuard AI - Settings Page Controller

const SettingsPage = {
  render() {
    const user = window.authManager?.getUser() || { full_name: "Prashanthi Kolli", email: "analyst@mailguard.ai", role: "Lead SecOps Analyst" };

    return `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">Enterprise System Settings</h1>
          <p class="page-subtitle">Configure SecOps profile, detection sensitivity thresholds, notification alerts, and API settings.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Profile Settings -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>👤</span> Analyst Profile Settings</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" value="${user.full_name}" id="settings-name" />
              </div>
              <div class="form-group">
                <label class="form-label">Corporate Email</label>
                <input type="email" class="form-control" value="${user.email}" readonly />
              </div>
              <div class="form-group">
                <label class="form-label">Security Role</label>
                <input type="text" class="form-control" value="${user.role}" readonly />
              </div>
              <button class="btn btn-primary btn-sm" onclick="alert('Profile preferences updated.')">Save Profile</button>
            </div>
          </div>

          <!-- Detection Threshold Settings -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>🎯</span> Threat Detection Sensitivity</div>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Risk Scoring Mode</label>
                <select class="form-control" id="settings-mode">
                  <option value="balanced" selected>Balanced Enterprise Mode (Recommended)</option>
                  <option value="aggressive">Aggressive Mode (High Phishing Catch-Rate)</option>
                  <option value="strict">Strict Zero-Trust Mode (Flag all External Links)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">High-Risk Quarantine Threshold</label>
                <input type="range" min="50" max="90" value="70" style="width: 100%; margin: 8px 0;" oninput="document.getElementById('thresh-val').textContent = this.value" />
                <div style="font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">
                  <span>Threshold Score: <strong id="thresh-val">70</strong> / 100</span>
                  <span>Default: 70</span>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="alert('Detection parameters saved.')">Update Thresholds</button>
            </div>
          </div>

          <!-- Notification Settings -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>🔔</span> Alert & Notification Preferences</div>
            </div>
            <div class="card-body" style="display: flex; flex-direction: column; gap: 14px;">
              <label style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; cursor: pointer;">
                <input type="checkbox" checked /> Send immediate Slack/Webhook alert on High-Risk Phishing detection
              </label>
              <label style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; cursor: pointer;">
                <input type="checkbox" checked /> Daily threat digest email to SecOps distribution list
              </label>
              <label style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; cursor: pointer;">
                <input type="checkbox" checked /> Auto-submit verified false-positives to continuous learning queue
              </label>
              <button class="btn btn-secondary btn-sm" style="width: fit-content;" onclick="alert('Notification rules updated.')">Save Preferences</button>
            </div>
          </div>

          <!-- System & Security Info -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>🔒</span> Security & Engine Health</div>
            </div>
            <div class="card-body">
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">AI Inference Engine:</span>
                  <strong>Calibrated Support Vector Machine (SVM)</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Database Backend:</span>
                  <strong>MySQL / SQLAlchemy ORM</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Explainability Framework:</span>
                  <strong>Feature Attribution & Highlight Span Engine</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">System Status:</span>
                  <span class="badge badge-success">Operational 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {}
};

window.SettingsPage = SettingsPage;
