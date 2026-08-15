// MailGuard AI - Model Performance & Retraining Page Controller

const PerformancePage = {
  render() {
    return `
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">AI Model Performance & Continuous Learning</h1>
          <p class="page-subtitle">Inspect live benchmark metrics, confusion matrices, multi-model comparisons, and trigger continuous retraining.</p>
        </div>

        <!-- Champion Model Metrics Card -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title"><span>🏆</span> Active Production Champion Model</div>
            <span class="badge badge-success" id="perf-model-badge">● Deployed to Production</span>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
              <div class="stat-pill">
                <div class="stat-pill-label">Algorithm</div>
                <div class="stat-pill-value" id="perf-algorithm" style="font-size: 14px;">Support Vector Machine (SVM)</div>
              </div>
              <div class="stat-pill">
                <div class="stat-pill-label">Model Version</div>
                <div class="stat-pill-value" id="perf-version" style="font-size: 14px;">v1.2.0-svm-prod</div>
              </div>
              <div class="stat-pill">
                <div class="stat-pill-label">Total Corpus Size</div>
                <div class="stat-pill-value" id="perf-corpus-size">5,949 Emails</div>
              </div>
              <div class="stat-pill">
                <div class="stat-pill-label">Training Date</div>
                <div class="stat-pill-value" id="perf-train-date" style="font-size: 13px;">2026-08-14 UTC</div>
              </div>
            </div>

            <!-- Metric Cards -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
              <div style="background: var(--primary-50); border: 1px solid var(--primary-100); padding: 18px; border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: var(--primary-800); text-transform: uppercase;">Accuracy</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--primary-700); margin-top: 4px;" id="metric-acc">98.99%</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Holdout test split</div>
              </div>

              <div style="background: var(--success-bg); border: 1px solid var(--success-border); padding: 18px; border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: var(--success-text); text-transform: uppercase;">Precision</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--success-text); margin-top: 4px;" id="metric-prec">98.97%</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Low False-Positive rate</div>
              </div>

              <div style="background: var(--warning-bg); border: 1px solid var(--warning-border); padding: 18px; border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: var(--warning-text); text-transform: uppercase;">Recall</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--warning-text); margin-top: 4px;" id="metric-rec">98.97%</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">High threat coverage</div>
              </div>

              <div style="background: var(--purple-bg); border: 1px solid var(--purple-border); padding: 18px; border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: var(--purple-text); text-transform: uppercase;">F1-Score</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--purple-text); margin-top: 4px;" id="metric-f1">0.9897</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Harmonic mean</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confusion Matrix & Benchmark Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; margin-bottom: 24px;">
          <!-- Confusion Matrix -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>🧮</span> Confusion Matrix (1,190 Unseen Test Samples)</div>
            </div>
            <div class="card-body" id="perf-cm-container">
              <div style="color: var(--text-subtle);">Loading confusion matrix...</div>
            </div>
          </div>

          <!-- Continuous Retraining Panel -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><span>🔄</span> Dynamic Continuous Learning Pipeline</div>
            </div>
            <div class="card-body">
              <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
                User corrections and verified SecOps triage tickets are queued in the feedback store. When triggered, the system retrains candidate models and automatically promotes the highest-performing pipeline to production.
              </p>

              <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 18px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
                  <span>Queued Approved Feedback:</span>
                  <span id="perf-feedback-count" style="color: var(--primary-700);">--</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-top: 6px;">
                  <span>Retraining Strategy:</span>
                  <span style="color: var(--success-text);">Batch Holdout Stratification</span>
                </div>
              </div>

              <button class="btn btn-primary" id="btn-trigger-retrain" onclick="PerformancePage.triggerRetrain()">
                <span>⚡</span> Execute Batch Retraining Now
              </button>
              <div id="retrain-status-msg" style="margin-top: 12px; font-size: 13px; font-weight: 700; display: none;"></div>
            </div>
          </div>
        </div>

        <!-- Model Comparison Benchmark Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>📊</span> Multi-Model Evaluation & Benchmark Comparison</div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Model Architecture</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="model-comparison-tbody">
                <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-subtle);">Loading benchmarks...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadPerformance();
  },

  async loadPerformance() {
    try {
      const data = await window.apiService.getModelPerformance();

      document.getElementById('perf-algorithm').textContent = data.algorithm;
      document.getElementById('perf-version').textContent = data.model_version;
      document.getElementById('perf-corpus-size').textContent = `${data.total_dataset_size.toLocaleString()} Emails (${data.train_samples} Train / ${data.test_samples} Test)`;
      document.getElementById('perf-train-date').textContent = data.training_date;
      document.getElementById('perf-feedback-count').textContent = `${data.feedback_samples_integrated} Verified Samples`;

      const champ = data.champion_metrics;
      document.getElementById('metric-acc').textContent = `${(champ.accuracy * 100).toFixed(2)}%`;
      document.getElementById('metric-prec').textContent = `${(champ.precision * 100).toFixed(2)}%`;
      document.getElementById('metric-rec').textContent = `${(champ.recall * 100).toFixed(2)}%`;
      document.getElementById('metric-f1').textContent = champ.f1_score.toFixed(4);

      // Render Confusion Matrix
      const cmContainer = document.getElementById('perf-cm-container');
      window.ChartEngine.renderConfusionMatrix(cmContainer, champ.confusion_matrix);

      // Render Model Comparison Table
      const tbody = document.getElementById('model-comparison-tbody');
      if (tbody && data.model_comparisons) {
        tbody.innerHTML = data.model_comparisons.map(m => {
          const isChampion = m.name.includes("SVM");
          return `
            <tr style="${isChampion ? 'background-color: var(--primary-50); font-weight: 600;' : ''}">
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>${isChampion ? '🌟' : '🔹'}</span>
                  <strong>${m.name}</strong>
                </div>
              </td>
              <td>${(m.accuracy * 100).toFixed(2)}%</td>
              <td>${(m.precision * 100).toFixed(2)}%</td>
              <td>${(m.recall * 100).toFixed(2)}%</td>
              <td>${m.f1_score.toFixed(4)}</td>
              <td>
                ${isChampion 
                  ? `<span class="badge badge-success">Selected Champion (Production)</span>` 
                  : `<span class="badge badge-info">Evaluated Baseline</span>`}
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load performance:', err);
    }
  },

  async triggerRetrain() {
    const btn = document.getElementById('btn-trigger-retrain');
    const msg = document.getElementById('retrain-status-msg');
    
    if (btn) btn.disabled = true;
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = 'var(--primary-700)';
      msg.textContent = '⏳ Executing continuous retraining pipeline...';
    }

    try {
      const res = await window.apiService.triggerRetrain();
      if (msg) {
        msg.style.color = 'var(--success-text)';
        msg.textContent = `✅ ${res.message} (Accuracy: ${(res.metrics.champion_metrics.accuracy * 100).toFixed(2)}%)`;
      }
      await this.loadPerformance();
    } catch (err) {
      if (msg) {
        msg.style.color = 'var(--danger-solid)';
        msg.textContent = `❌ Retraining failed: ${err.message}`;
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }
};

window.PerformancePage = PerformancePage;
