// MailGuard AI - Dashboard Page Controller

const DashboardPage = {
  activeTimeframe: '7d',
  currentPage: 1,
  pageSize: 8,
  searchQuery: '',
  riskFilter: 'ALL',

  render() {
    return `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">Email Security Dashboard</h1>
          <p class="page-subtitle">Monitor email threats and AI detection activity in real-time across enterprise communication channels.</p>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid" id="kpi-container">
          <div class="kpi-card"><div class="kpi-info"><span class="kpi-label">Loading...</span><span class="kpi-value">--</span></div></div>
        </div>

        <!-- Charts Grid -->
        <div class="dashboard-charts-grid">
          <!-- Donut: Classification -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title">
                <span>🛡️</span> Email Classification Breakdown
              </div>
            </div>
            <div class="card-body" id="donut-chart-container">
              <div style="text-align: center; padding: 40px 0; color: var(--text-subtle);">Loading classification distribution...</div>
            </div>
          </div>

          <!-- Line: Detection Trends -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title">
                <span>📈</span> Detection Trends & Volume
              </div>
              <div class="chart-header-actions">
                <div class="timeframe-toggle">
                  <button class="timeframe-btn active" id="btn-tf-7d" onclick="DashboardPage.setTimeframe('7d')">7 Days</button>
                  <button class="timeframe-btn" id="btn-tf-30d" onclick="DashboardPage.setTimeframe('30d')">30 Days</button>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="line-chart-wrap">
                <canvas id="trend-chart-canvas"></canvas>
              </div>
              <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 12px; font-weight: 600;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #3B82F6;"></span> Total Scanned</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span> Safe / Legitimate</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444;"></span> Threats / Spam</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Distribution -->
        <div class="card risk-dist-card">
          <div class="card-header">
            <div class="card-title"><span>⚠️</span> Threat Risk Level Distribution</div>
          </div>
          <div class="card-body" id="risk-dist-container">
            <div style="color: var(--text-subtle);">Loading risk distribution...</div>
          </div>
        </div>

        <!-- Recent Threats Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>🚨</span> Recent Threat Ingestion & Analysis Log</div>
            <a href="#/history" class="btn btn-secondary btn-sm">View Full History →</a>
          </div>

          <div class="table-filter-bar">
            <input 
              type="text" 
              class="table-search-input" 
              placeholder="Search sender, subject, or threat..." 
              id="threat-search"
              oninput="DashboardPage.handleSearch(this.value)"
            />
            <div style="display: flex; gap: 10px; align-items: center;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-subtle);">FILTER RISK:</label>
              <select class="table-filter-select" id="threat-risk-filter" onchange="DashboardPage.handleRiskFilter(this.value)">
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="threat-table-body">
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-subtle);">Loading threat logs...</td></tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-wrap" id="threat-pagination"></div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadStats();
    await this.loadDonutAndRisk();
    await this.loadTrends();
    await this.loadRecentThreats();
  },

  async loadStats() {
    try {
      const stats = await window.apiService.getDashboardStats();
      const kpiContainer = document.getElementById('kpi-container');
      if (!kpiContainer) return;

      kpiContainer.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Total Analyzed</span>
            <span class="kpi-value">${stats.total_emails.toLocaleString()}</span>
            <span class="kpi-subtext">Across all enterprise channels</span>
          </div>
          <div class="kpi-icon-wrap kpi-icon-blue">📬</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Spam Detected</span>
            <span class="kpi-value" style="color: var(--danger-solid);">${stats.spam_detected.toLocaleString()}</span>
            <span class="kpi-subtext">Flagged & quarantined</span>
          </div>
          <div class="kpi-icon-wrap kpi-icon-red">🚫</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Phishing Detected</span>
            <span class="kpi-value" style="color: var(--purple-solid);">${stats.phishing_detected.toLocaleString()}</span>
            <span class="kpi-subtext">Credential & wire lures</span>
          </div>
          <div class="kpi-icon-wrap kpi-icon-purple">🎣</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">Safe Emails</span>
            <span class="kpi-value" style="color: var(--success-solid);">${stats.safe_emails.toLocaleString()}</span>
            <span class="kpi-subtext">Verified legitimate</span>
          </div>
          <div class="kpi-icon-wrap kpi-icon-green">✅</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-info">
            <span class="kpi-label">High-Risk Threats</span>
            <span class="kpi-value" style="color: var(--danger-solid);">${stats.high_risk_emails.toLocaleString()}</span>
            <span class="kpi-subtext">Risk score &gt; 70 / 100</span>
          </div>
          <div class="kpi-icon-wrap kpi-icon-amber">🔥</div>
        </div>
      `;
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  },

  async loadDonutAndRisk() {
    try {
      const riskData = await window.apiService.getRiskDistribution();
      
      // Render Donut Chart
      const donutContainer = document.getElementById('donut-chart-container');
      window.ChartEngine.renderDonutChart(donutContainer, riskData.categories, riskData.total);

      // Render Risk Distribution Bars
      const riskDistContainer = document.getElementById('risk-dist-container');
      if (riskDistContainer) {
        riskDistContainer.innerHTML = `
          <div class="risk-dist-grid">
            <div class="risk-level-stat stat-low">
              <div class="risk-stat-header">
                <span>🟢 Low Risk (0–35)</span>
                <span>${riskData.low_risk_pct}%</span>
              </div>
              <div class="risk-stat-val">${riskData.low_risk_count.toLocaleString()}</div>
              <div class="risk-progress-bar">
                <div class="risk-progress-fill fill-low" style="width: ${riskData.low_risk_pct}%"></div>
              </div>
            </div>

            <div class="risk-level-stat stat-med">
              <div class="risk-stat-header">
                <span>🟠 Medium Risk (36–69)</span>
                <span>${riskData.medium_risk_pct}%</span>
              </div>
              <div class="risk-stat-val">${riskData.medium_risk_count.toLocaleString()}</div>
              <div class="risk-progress-bar">
                <div class="risk-progress-fill fill-med" style="width: ${riskData.medium_risk_pct}%"></div>
              </div>
            </div>

            <div class="risk-level-stat stat-high">
              <div class="risk-stat-header">
                <span>🔴 High Risk (70–100)</span>
                <span>${riskData.high_risk_pct}%</span>
              </div>
              <div class="risk-stat-val">${riskData.high_risk_count.toLocaleString()}</div>
              <div class="risk-progress-bar">
                <div class="risk-progress-fill fill-high" style="width: ${riskData.high_risk_pct}%"></div>
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to load donut and risk:', err);
    }
  },

  async loadTrends() {
    try {
      const trends = await window.apiService.getDashboardTrends(this.activeTimeframe);
      const canvas = document.getElementById('trend-chart-canvas');
      if (canvas) {
        window.ChartEngine.renderTrendChart(canvas, trends.points);
      }
    } catch (err) {
      console.error('Failed to load trends:', err);
    }
  },

  async setTimeframe(tf) {
    this.activeTimeframe = tf;
    document.getElementById('btn-tf-7d')?.classList.toggle('active', tf === '7d');
    document.getElementById('btn-tf-30d')?.classList.toggle('active', tf === '30d');
    await this.loadTrends();
  },

  async loadRecentThreats() {
    try {
      const data = await window.apiService.getRecentThreats({
        search: this.searchQuery,
        risk_filter: this.riskFilter,
        page: this.currentPage,
        page_size: this.pageSize
      });

      const tbody = document.getElementById('threat-table-body');
      if (!tbody) return;

      if (!data.items || data.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-subtle);">No matching email records found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.items.map(item => {
        let badgeClass = 'badge-low';
        if (item.risk_level === 'HIGH') badgeClass = 'badge-high';
        else if (item.risk_level === 'MEDIUM') badgeClass = 'badge-medium';

        return `
          <tr style="cursor: pointer;" onclick="App.openEmailDetailModal(${item.id})">
            <td class="cell-sender" title="${item.sender}">${item.sender}</td>
            <td class="cell-subject" title="${item.subject}">${item.subject}</td>
            <td><span class="badge badge-info">${item.category}</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 800; font-size: 14px;">${item.risk_score}</span>
                <span style="color: var(--text-subtle); font-size: 11px;">/100</span>
              </div>
            </td>
            <td><span class="badge ${badgeClass}">${item.risk_level}</span></td>
            <td style="color: var(--text-subtle); font-size: 12px;">${item.created_at}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); App.openEmailDetailModal(${item.id})">Inspect →</button>
            </td>
          </tr>
        `;
      }).join('');

      // Pagination
      const paginationEl = document.getElementById('threat-pagination');
      if (paginationEl) {
        const totalPages = Math.ceil(data.total / this.pageSize) || 1;
        paginationEl.innerHTML = `
          <span>Showing page ${data.page} of ${totalPages} (${data.total} total items)</span>
          <div class="pagination-btns">
            <button class="btn btn-secondary btn-sm" ${data.page <= 1 ? 'disabled' : ''} onclick="DashboardPage.changePage(${data.page - 1})">Previous</button>
            <button class="btn btn-secondary btn-sm" ${data.page >= totalPages ? 'disabled' : ''} onclick="DashboardPage.changePage(${data.page + 1})">Next</button>
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to load recent threats:', err);
    }
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.currentPage = 1;
    this.loadRecentThreats();
  },

  handleRiskFilter(val) {
    this.riskFilter = val;
    this.currentPage = 1;
    this.loadRecentThreats();
  },

  changePage(p) {
    this.currentPage = p;
    this.loadRecentThreats();
  }
};

window.DashboardPage = DashboardPage;
