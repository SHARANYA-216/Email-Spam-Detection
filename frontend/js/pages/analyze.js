// MailGuard AI - Analyze Email Page Controller

const AnalyzePage = {
  currentAnalysis: null,

  render() {
    return `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">Analyze an Email</h1>
          <p class="page-subtitle">Paste an email below or upload a raw file to detect spam, phishing lures, credential theft, and suspicious behavior.</p>
        </div>

        <div class="analyze-grid">
          <!-- Input Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>📥</span> Email Ingestion & Inspection Input</div>
            </div>
            <div class="card-body">
              <!-- Sample Loader Bar -->
              <div class="sample-bar">
                <span class="sample-title">⚡ Try a sample:</span>
                <button class="btn-sample btn-sample-safe" onclick="AnalyzePage.loadSample('safe')">🟢 Safe Email</button>
                <button class="btn-sample btn-sample-phishing" onclick="AnalyzePage.loadSample('phishing')">🟣 Phishing Email</button>
                <button class="btn-sample btn-sample-spam" onclick="AnalyzePage.loadSample('spam')">🔴 Spam Email</button>
                <button class="btn-sample btn-sample-promo" onclick="AnalyzePage.loadSample('promotional')">🟠 Promotional Email</button>
              </div>

              <!-- Upload Dropzone -->
              <div class="upload-dropzone" id="upload-dropzone" onclick="document.getElementById('email-file-input').click()">
                <div class="upload-icon">📂</div>
                <div class="upload-text">Upload Raw Email File (.eml, .txt)</div>
                <div class="upload-hint">Drag & drop or click to browse email files from your system</div>
                <input type="file" id="email-file-input" style="display: none;" accept=".eml,.txt" onchange="AnalyzePage.handleFileUpload(event)" />
              </div>

              <!-- Form Inputs -->
              <form id="analyze-form" onsubmit="AnalyzePage.handleSubmit(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div class="form-group">
                    <label class="form-label">Sender Email</label>
                    <input 
                      type="text" 
                      id="input-sender" 
                      class="form-control" 
                      placeholder="security-alert@microsoft-services-auth.com" 
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Subject Line</label>
                    <input 
                      type="text" 
                      id="input-subject" 
                      class="form-control" 
                      placeholder="URGENT: Office 365 Password Expiration Notice" 
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Email Body Content <span style="color: var(--danger-solid);">*</span></label>
                  <textarea 
                    id="input-body" 
                    class="form-control" 
                    placeholder="Paste the complete email text, headers, or body content here..." 
                    rows="8" 
                    required
                  ></textarea>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AnalyzePage.clearForm()">Clear Fields</button>
                  <button type="submit" class="btn btn-primary btn-lg" id="btn-analyze-submit">
                    <span>🔍</span> Analyze Email Threats
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Loading State (Hidden by default) -->
          <div class="card" id="analysis-loading-card" style="display: none;">
            <div class="analysis-loading-box">
              <div class="loading-spinner"></div>
              <div class="loading-step-text" id="loading-step-label">Analyzing email structure...</div>
              <div class="loading-sub-steps">
                <span id="step-1" class="loading-sub-step active">1. Extracting text & URLs</span>
                <span id="step-2" class="loading-sub-step">2. Evaluating threat vectors</span>
                <span id="step-3" class="loading-sub-step">3. Generating XAI explanations</span>
              </div>
            </div>
          </div>

          <!-- Result Container (Hidden until analysis completes) -->
          <div id="analysis-result-container" class="result-container" style="display: none;">
            <!-- Hero Result Card -->
            <div class="result-hero-card" id="result-hero-card">
              <!-- Visual Risk Gauge -->
              <div class="risk-gauge-wrap" id="risk-gauge-wrap">
                <div class="gauge-circle" id="gauge-circle-el">
                  <div class="gauge-inner">
                    <span class="gauge-score" id="res-risk-score">--</span>
                    <span class="gauge-max">/ 100</span>
                  </div>
                </div>
                <div class="gauge-label" id="res-risk-label">RISK LEVEL</div>
              </div>

              <!-- Details Column -->
              <div class="result-meta-column">
                <div>
                  <div class="result-tags-row">
                    <span class="badge" id="res-classification-badge">SPAM</span>
                    <span class="badge badge-purple" id="res-category-badge">CREDENTIAL THEFT</span>
                    <span style="font-size: 12px; color: var(--text-subtle); margin-left: auto;" id="res-model-ver">Model: v1.2.0-svm-prod</span>
                  </div>
                  <h2 class="result-classification-title" id="res-classification-heading" style="margin-top: 8px;">Suspicious Email Flagged</h2>
                  <p class="result-category-subtitle" id="res-category-desc">Multi-vector analysis detected phishing patterns and high-entropy manipulation.</p>
                </div>

                <div class="result-stats-pills">
                  <div class="stat-pill">
                    <div class="stat-pill-label">Confidence</div>
                    <div class="stat-pill-value" id="res-confidence-val">98.4%</div>
                  </div>
                  <div class="stat-pill">
                    <div class="stat-pill-label">Spam Probability</div>
                    <div class="stat-pill-value" id="res-spam-prob">94.2%</div>
                  </div>
                  <div class="stat-pill">
                    <div class="stat-pill-label">Ham Probability</div>
                    <div class="stat-pill-value" id="res-ham-prob">5.8%</div>
                  </div>
                  <div class="stat-pill">
                    <div class="stat-pill-label">Scanned URLs</div>
                    <div class="stat-pill-value" id="res-url-count">1 Link</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Explainable AI (XAI) Section -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <span>💡</span> Explainable AI: Why was this email flagged?
                </div>
              </div>
              <div class="card-body">
                <div class="xai-section" id="xai-reasons-container">
                  <!-- Dynamic explanation items -->
                </div>
              </div>
            </div>

            <!-- Highlighted Email Body -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <span>🖍️</span> Highlighted Email Analysis & Linguistic Breakdown
                </div>
                <div style="display: flex; gap: 10px; font-size: 11.5px; font-weight: 700;">
                  <span style="color: #991b1b; background: #fecaca; padding: 2px 8px; border-radius: 4px;">🔴 High-Risk Phrase</span>
                  <span style="color: #92400e; background: #fde68a; padding: 2px 8px; border-radius: 4px;">🟠 Suspicious Phrase</span>
                  <span style="color: #065f46; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">🟢 Normal Text</span>
                </div>
              </div>
              <div class="card-body">
                <div class="highlight-body-box" id="highlighted-email-body"></div>
              </div>
            </div>

            <!-- Multi-Factor Risk Score Breakdown -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <span>⚖️</span> Deterministic Multi-Factor Risk Scoring Breakdown
                </div>
              </div>
              <div class="card-body">
                <div id="risk-breakdown-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
              </div>
            </div>

            <!-- User Feedback & Continuous Learning Prompt -->
            <div class="feedback-box" id="feedback-section">
              <div>
                <div class="feedback-prompt">Was this prediction correct?</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  Your feedback helps MailGuard AI continuously retrain and improve detection accuracy.
                </div>
              </div>
              <div class="feedback-actions" id="feedback-action-btns">
                <button class="btn btn-secondary btn-sm" onclick="AnalyzePage.submitFeedbackDirect(true)">
                  👍 Correct Prediction
                </button>
                <button class="btn btn-secondary btn-sm" onclick="AnalyzePage.toggleIncorrectFeedbackForm()">
                  👎 Incorrect Classification
                </button>
              </div>

              <!-- Correction Form (Hidden by default) -->
              <div id="feedback-correction-form" style="display: none; width: 100%; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--primary-100);">
                <div style="font-size: 13px; font-weight: 700; color: var(--primary-800); margin-bottom: 8px;">
                  What should the correct classification be?
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <select id="correction-select" class="form-control" style="width: auto;">
                    <option value="Ham">Safe / Legitimate (Ham)</option>
                    <option value="Phishing">Phishing (Credential / Financial)</option>
                    <option value="Spam">Spam</option>
                    <option value="Promotional">Promotional / Marketing</option>
                    <option value="Suspicious">Suspicious / Scam</option>
                  </select>
                  <input type="text" id="correction-comment" class="form-control" placeholder="Optional notes for SecOps triage..." style="flex: 1;" />
                  <button class="btn btn-primary btn-sm" onclick="AnalyzePage.submitCorrectionFeedback()">Submit Feedback</button>
                </div>
              </div>

              <!-- Feedback Confirmation Message -->
              <div id="feedback-success-msg" style="display: none; color: var(--success-text); font-weight: 700; font-size: 13px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.setupDropzone();
  },

  loadSample(type) {
    const sample = window.DEMO_EMAILS?.[type];
    if (!sample) return;

    document.getElementById('input-sender').value = sample.sender;
    document.getElementById('input-subject').value = sample.subject;
    document.getElementById('input-body').value = sample.body;
  },

  clearForm() {
    document.getElementById('input-sender').value = '';
    document.getElementById('input-subject').value = '';
    document.getElementById('input-body').value = '';
    document.getElementById('analysis-result-container').style.display = 'none';
  },

  setupDropzone() {
    const dropzone = document.getElementById('upload-dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    });
  },

  async handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (file) {
      await this.processFile(file);
    }
  },

  async processFile(file) {
    try {
      this.showLoading(true);
      const res = await window.apiService.uploadEmailFile(file);
      this.renderAnalysisResult(res);
    } catch (err) {
      alert(err.message || 'Error processing email file');
    } finally {
      this.showLoading(false);
    }
  },

  async handleSubmit(event) {
    event.preventDefault();
    const sender = document.getElementById('input-sender').value;
    const subject = document.getElementById('input-subject').value;
    const body = document.getElementById('input-body').value;

    if (!body.trim()) {
      alert("Please enter an email body before analyzing.");
      return;
    }

    try {
      this.showLoading(true);
      const result = await window.apiService.analyzeEmail(sender, subject, body);
      this.renderAnalysisResult(result);
    } catch (err) {
      alert(err.message || 'Analysis failed. Please check inputs.');
    } finally {
      this.showLoading(false);
    }
  },

  showLoading(isLoading) {
    const loadingCard = document.getElementById('analysis-loading-card');
    const resultContainer = document.getElementById('analysis-result-container');
    const submitBtn = document.getElementById('btn-analyze-submit');

    if (isLoading) {
      if (loadingCard) loadingCard.style.display = 'block';
      if (resultContainer) resultContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;

      // Realistic Step Progression
      const stepLabel = document.getElementById('loading-step-label');
      const step1 = document.getElementById('step-1');
      const step2 = document.getElementById('step-2');
      const step3 = document.getElementById('step-3');

      setTimeout(() => {
        if (stepLabel) stepLabel.textContent = "Extracting text tokens & URL features...";
        if (step1) step1.className = 'loading-sub-step';
        if (step2) step2.className = 'loading-sub-step active';
      }, 250);

      setTimeout(() => {
        if (stepLabel) stepLabel.textContent = "Evaluating multi-vector threat signals...";
        if (step2) step2.className = 'loading-sub-step';
        if (step3) step3.className = 'loading-sub-step active';
      }, 500);
    } else {
      if (loadingCard) loadingCard.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  renderAnalysisResult(data) {
    this.currentAnalysis = data;
    const resultContainer = document.getElementById('analysis-result-container');
    if (!resultContainer) return;

    resultContainer.style.display = 'flex';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 1. Risk Score Gauge & Styling
    const heroCard = document.getElementById('result-hero-card');
    const gaugeWrap = document.getElementById('risk-gauge-wrap');
    const gaugeCircle = document.getElementById('gauge-circle-el');
    const riskScoreEl = document.getElementById('res-risk-score');
    const riskLabelEl = document.getElementById('res-risk-label');

    const score = data.risk_score;
    const level = data.risk_level;
    const deg = Math.round((score / 100) * 360);

    gaugeWrap.className = 'risk-gauge-wrap';
    if (level === 'HIGH') gaugeWrap.classList.add('risk-high-style');
    else if (level === 'MEDIUM') gaugeWrap.classList.add('risk-med-style');
    else gaugeWrap.classList.add('risk-low-style');

    gaugeCircle.style.setProperty('--risk-deg', deg);
    riskScoreEl.textContent = score;
    riskLabelEl.textContent = `${level} RISK`;

    // 2. Badges & Meta
    const classBadge = document.getElementById('res-classification-badge');
    const catBadge = document.getElementById('res-category-badge');
    const classHeading = document.getElementById('res-classification-heading');
    const catDesc = document.getElementById('res-category-desc');

    if (data.is_spam) {
      classBadge.className = 'badge badge-danger';
      classBadge.textContent = '🚨 SPAM / THREAT';
      classHeading.textContent = `${data.classification} Flagged`;
      catDesc.textContent = `Identified as ${data.category} threat pattern.`;
    } else {
      classBadge.className = 'badge badge-success';
      classBadge.textContent = '🛡️ SAFE / HAM';
      classHeading.textContent = 'Legitimate Communication';
      catDesc.textContent = 'Standard verified enterprise communication.';
    }

    catBadge.textContent = data.category;
    document.getElementById('res-confidence-val').textContent = `${data.confidence}%`;
    document.getElementById('res-spam-prob').textContent = `${(data.spam_probability * 100).toFixed(1)}%`;
    document.getElementById('res-ham-prob').textContent = `${(data.ham_probability * 100).toFixed(1)}%`;
    document.getElementById('res-url-count').textContent = `${data.signals?.url_count || 0} Link(s)`;

    // 3. Explainable AI Cards
    const xaiContainer = document.getElementById('xai-reasons-container');
    if (xaiContainer) {
      if (!data.explanations || data.explanations.length === 0) {
        xaiContainer.innerHTML = `<div style="color: var(--text-subtle);">No abnormal threat indicators detected.</div>`;
      } else {
        xaiContainer.innerHTML = data.explanations.map(exp => {
          let badgeClass = 'badge-info';
          if (exp.severity === 'CRITICAL' || exp.severity === 'HIGH') badgeClass = 'badge-danger';
          else if (exp.severity === 'MEDIUM') badgeClass = 'badge-warning';
          else if (exp.severity === 'LOW') badgeClass = 'badge-success';

          return `
            <div class="xai-card">
              <div class="xai-header">
                <div class="xai-title">
                  <span>${exp.severity === 'LOW' ? '✅' : '⚠️'}</span>
                  ${exp.title}
                </div>
                <span class="badge ${badgeClass}">${exp.severity}</span>
              </div>
              <div class="xai-body-text">${exp.explanation}</div>
              ${exp.evidence ? `<div class="xai-evidence"><strong>Evidence:</strong> ${exp.evidence}</div>` : ''}
            </div>
          `;
        }).join('');
      }
    }

    // 4. Highlighted Body Box
    const hlBody = document.getElementById('highlighted-email-body');
    if (hlBody) {
      if (data.highlight_spans && data.highlight_spans.length > 0) {
        hlBody.innerHTML = data.highlight_spans.map(span => {
          if (span.type === 'high_risk') {
            return `<mark class="hl-high-risk" title="${span.explanation}">${this.escapeHtml(span.text)}</mark>`;
          } else if (span.type === 'suspicious') {
            return `<mark class="hl-suspicious" title="${span.explanation}">${this.escapeHtml(span.text)}</mark>`;
          } else {
            return `<span class="hl-normal">${this.escapeHtml(span.text)}</span>`;
          }
        }).join('');
      } else {
        hlBody.textContent = data.body;
      }
    }

    // 5. Risk Breakdown List
    const breakdownList = document.getElementById('risk-breakdown-list');
    if (breakdownList) {
      breakdownList.innerHTML = (data.risk_breakdown || []).map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-subtle); border-radius: var(--radius-md);">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${item.factor}</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${item.detail}</div>
          </div>
          <div style="font-weight: 800; font-size: 14px; color: var(--primary-700);">+${item.points} pts</div>
        </div>
      `).join('');
    }

    // Reset feedback prompt
    document.getElementById('feedback-action-btns').style.display = 'flex';
    document.getElementById('feedback-correction-form').style.display = 'none';
    document.getElementById('feedback-success-msg').style.display = 'none';
  },

  toggleIncorrectFeedbackForm() {
    document.getElementById('feedback-action-btns').style.display = 'none';
    document.getElementById('feedback-correction-form').style.display = 'block';
  },

  async submitFeedbackDirect(isCorrect) {
    if (!this.currentAnalysis?.email_id) return;

    try {
      const res = await window.apiService.submitFeedback(this.currentAnalysis.email_id, {
        is_correct: isCorrect,
        user_correction: isCorrect ? (this.currentAnalysis.is_spam ? "Spam" : "Ham") : null,
        comment: "Direct confirmation by analyst."
      });

      const successMsg = document.getElementById('feedback-success-msg');
      successMsg.textContent = "✅ " + res.message;
      successMsg.style.display = 'block';
      document.getElementById('feedback-action-btns').style.display = 'none';
    } catch (err) {
      alert("Feedback failed: " + err.message);
    }
  },

  async submitCorrectionFeedback() {
    if (!this.currentAnalysis?.email_id) return;

    const correction = document.getElementById('correction-select').value;
    const comment = document.getElementById('correction-comment').value;

    try {
      const res = await window.apiService.submitFeedback(this.currentAnalysis.email_id, {
        is_correct: false,
        user_correction: correction,
        comment: comment || "User correction submitted."
      });

      const successMsg = document.getElementById('feedback-success-msg');
      successMsg.textContent = "✅ " + res.message;
      successMsg.style.display = 'block';
      document.getElementById('feedback-correction-form').style.display = 'none';
    } catch (err) {
      alert("Feedback submission failed: " + err.message);
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

window.AnalyzePage = AnalyzePage;
