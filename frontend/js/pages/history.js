// MailGuard AI - Email History Page Controller

const HistoryPage = {
  searchQuery: '',
  classificationFilter: 'ALL',
  riskFilter: 'ALL',
  currentPage: 1,
  pageSize: 12,

  render() {
    return `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">Email History & Investigation Log</h1>
          <p class="page-subtitle">Search, filter, and inspect past email analyses and continuous learning feedback records.</p>
        </div>

        <div class="card">
          <div class="table-filter-bar">
            <div style="display: flex; gap: 12px; flex-wrap: wrap; flex: 1;">
              <input 
                type="text" 
                class="table-search-input" 
                placeholder="Search by sender, subject, category..." 
                id="history-search" 
                oninput="HistoryPage.handleSearch(this.value)"
              />
              <select class="table-filter-select" id="history-class-filter" onchange="HistoryPage.handleClassFilter(this.value)">
                <option value="ALL">All Classifications</option>
                <option value="LEGITIMATE">Legitimate (Safe)</option>
                <option value="PHISHING">Phishing</option>
                <option value="PROMOTIONAL">Promotional</option>
                <option value="SUSPICIOUS">Suspicious / Scam</option>
                <option value="SPAM">Generic Spam</option>
              </select>
              <select class="table-filter-select" id="history-risk-filter" onchange="HistoryPage.handleRiskFilter(this.value)">
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
                  <th>Timestamp</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Classification</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Confidence</th>
                  <th>Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="history-table-body">
                <tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-subtle);">Loading history logs...</td></tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-wrap" id="history-pagination"></div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadHistory();
  },

  async loadHistory() {
    try {
      const data = await window.apiService.getEmailHistory({
        search: this.searchQuery,
        classification: this.classificationFilter,
        risk_level: this.riskFilter,
        page: this.currentPage,
        page_size: this.pageSize
      });

      const tbody = document.getElementById('history-table-body');
      if (!tbody) return;

      if (!data.items || data.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-subtle);">No matching emails found in historical database.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.items.map(item => {
        let badgeClass = 'badge-low';
        if (item.risk_level === 'HIGH') badgeClass = 'badge-high';
        else if (item.risk_level === 'MEDIUM') badgeClass = 'badge-medium';

        let fbBadge = `<span style="color: var(--text-subtle); font-size: 11px;">Pending</span>`;
        if (item.feedback) {
          fbBadge = item.feedback.is_correct 
            ? `<span class="badge badge-success" style="font-size: 10px;">👍 Correct</span>` 
            : `<span class="badge badge-warning" style="font-size: 10px;">👎 ${item.feedback.user_correction || 'Corrected'}</span>`;
        }

        return `
          <tr style="cursor: pointer;" onclick="App.openEmailDetailModal(${item.id})">
            <td style="color: var(--text-subtle); font-size: 12px; white-space: nowrap;">${item.created_at}</td>
            <td class="cell-sender" title="${item.sender}">${item.sender}</td>
            <td class="cell-subject" title="${item.subject}">${item.subject}</td>
            <td><span class="badge badge-info">${item.classification}</span></td>
            <td><strong>${item.risk_score}</strong> <span style="font-size: 11px; color: var(--text-subtle);">/100</span></td>
            <td><span class="badge ${badgeClass}">${item.risk_level}</span></td>
            <td>${item.confidence}%</td>
            <td>${fbBadge}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); App.openEmailDetailModal(${item.id})">Inspect →</button>
            </td>
          </tr>
        `;
      }).join('');

      const paginationEl = document.getElementById('history-pagination');
      if (paginationEl) {
        const totalPages = Math.ceil(data.total / this.pageSize) || 1;
        paginationEl.innerHTML = `
          <span>Showing page ${data.page} of ${totalPages} (${data.total} total records)</span>
          <div class="pagination-btns">
            <button class="btn btn-secondary btn-sm" ${data.page <= 1 ? 'disabled' : ''} onclick="HistoryPage.changePage(${data.page - 1})">Previous</button>
            <button class="btn btn-secondary btn-sm" ${data.page >= totalPages ? 'disabled' : ''} onclick="HistoryPage.changePage(${data.page + 1})">Next</button>
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.currentPage = 1;
    this.loadHistory();
  },

  handleClassFilter(val) {
    this.classificationFilter = val;
    this.currentPage = 1;
    this.loadHistory();
  },

  handleRiskFilter(val) {
    this.riskFilter = val;
    this.currentPage = 1;
    this.loadHistory();
  },

  changePage(p) {
    this.currentPage = p;
    this.loadHistory();
  }
};

window.HistoryPage = HistoryPage;
