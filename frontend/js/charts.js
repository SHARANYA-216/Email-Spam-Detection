// MailGuard AI - Enterprise Lightweight Chart Engine
// Self-contained, responsive SVG and Canvas chart components

class ChartEngine {
  /**
   * Renders interactive Donut Chart for Email Classifications
   */
  static renderDonutChart(containerEl, categories, totalCount) {
    if (!containerEl) return;
    
    if (!categories || categories.length === 0 || totalCount === 0) {
      containerEl.innerHTML = `
        <div style="text-align: center; color: var(--text-subtle); padding: 40px 0;">
          No classification telemetry available yet.
        </div>
      `;
      return;
    }

    const size = 180;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;
    let svgPaths = '';

    categories.forEach((cat, idx) => {
      const pct = cat.percentage / 100;
      const strokeDasharray = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += pct * circumference;

      svgPaths += `
        <circle
          cx="${size / 2}" cy="${size / 2}" r="${radius}"
          fill="transparent"
          stroke="${cat.color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round"
          style="transition: all 0.5s ease; cursor: pointer;"
          data-name="${cat.name}"
          data-count="${cat.count}"
          data-pct="${cat.percentage}%"
          class="donut-segment"
        />
      `;
    });

    let legendHtml = '';
    categories.forEach(cat => {
      legendHtml += `
        <div class="legend-item" title="${cat.name}: ${cat.count} emails (${cat.percentage}%)">
          <span class="legend-label">
            <span class="legend-color-dot" style="background-color: ${cat.color};"></span>
            ${cat.name}
          </span>
          <span class="legend-count">${cat.count} <small style="color: var(--text-subtle); font-weight: normal;">(${cat.percentage}%)</small></span>
        </div>
      `;
    });

    containerEl.innerHTML = `
      <div class="donut-container">
        <div class="donut-chart-wrap">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
            ${svgPaths}
          </svg>
          <div class="donut-center-text">
            <div class="donut-total-num">${totalCount.toLocaleString()}</div>
            <div class="donut-total-lbl">Total Scanned</div>
          </div>
        </div>
        <div class="donut-legend">
          ${legendHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders Line Chart for Detection Trends (7d / 30d)
   */
  static renderTrendChart(canvasEl, points) {
    if (!canvasEl || !points || points.length === 0) return;

    const ctx = canvasEl.getContext('2d');
    const width = canvasEl.parentElement.clientWidth || 600;
    const height = 220;

    canvasEl.width = width * window.devicePixelRatio;
    canvasEl.height = height * window.devicePixelRatio;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 35, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Find max value
    const maxVal = Math.max(...points.map(p => Math.max(p.total, p.spam, p.safe, 5))) * 1.15;

    // Draw Y-axis gridlines & labels
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((maxVal / ySteps) * i);
      const y = padding.top + chartH - (i / ySteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(val, padding.left - 8, y + 3);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    const xStep = chartW / (points.length - 1 || 1);
    const labelSkip = Math.ceil(points.length / 8);

    points.forEach((p, idx) => {
      if (idx % labelSkip === 0 || idx === points.length - 1) {
        const x = padding.left + idx * xStep;
        ctx.fillText(p.date, x, height - 12);
      }
    });

    // Helper to draw a line series
    const drawSeries = (key, strokeColor, fillColor) => {
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = padding.left + idx * xStep;
        const y = padding.top + chartH - (p[key] / maxVal) * chartH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Points
      points.forEach((p, idx) => {
        const x = padding.left + idx * xStep;
        const y = padding.top + chartH - (p[key] / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    };

    // Draw Series
    drawSeries('safe', '#10B981'); // Safe / Ham Green
    drawSeries('spam', '#EF4444'); // Spam / Threat Red
    drawSeries('total', '#3B82F6'); // Total Blue
  }

  /**
   * Renders Confusion Matrix Visualizer
   */
  static renderConfusionMatrix(containerEl, cm) {
    if (!containerEl || !cm) return;

    const tn = cm[0][0];
    const fp = cm[0][1];
    const fn = cm[1][0];
    const tp = cm[1][1];
    const total = tn + fp + fn + tp;

    containerEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 8px; text-align: center; font-size: 12px; font-weight: 700;">
          <div></div>
          <div style="color: var(--text-subtle); padding: 4px;">PREDICTED HAM</div>
          <div style="color: var(--text-subtle); padding: 4px;">PREDICTED SPAM</div>
          
          <div style="display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: var(--text-subtle);">ACTUAL HAM</div>
          <div style="background-color: var(--success-bg); border: 1px solid var(--success-border); padding: 18px 12px; border-radius: var(--radius-md);">
            <div style="font-size: 20px; font-weight: 800; color: var(--success-text);">${tn.toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--success-text); font-weight: 600; margin-top: 2px;">True Negative (${((tn/total)*100).toFixed(1)}%)</div>
          </div>
          <div style="background-color: var(--danger-bg); border: 1px solid var(--danger-border); padding: 18px 12px; border-radius: var(--radius-md);">
            <div style="font-size: 20px; font-weight: 800; color: var(--danger-text);">${fp.toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--danger-text); font-weight: 600; margin-top: 2px;">False Positive (${((fp/total)*100).toFixed(1)}%)</div>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: var(--text-subtle);">ACTUAL SPAM</div>
          <div style="background-color: var(--danger-bg); border: 1px solid var(--danger-border); padding: 18px 12px; border-radius: var(--radius-md);">
            <div style="font-size: 20px; font-weight: 800; color: var(--danger-text);">${fn.toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--danger-text); font-weight: 600; margin-top: 2px;">False Negative (${((fn/total)*100).toFixed(1)}%)</div>
          </div>
          <div style="background-color: var(--success-bg); border: 1px solid var(--success-border); padding: 18px 12px; border-radius: var(--radius-md);">
            <div style="font-size: 20px; font-weight: 800; color: var(--success-text);">${tp.toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--success-text); font-weight: 600; margin-top: 2px;">True Positive (${((tp/total)*100).toFixed(1)}%)</div>
          </div>
        </div>
      </div>
    `;
  }
}

window.ChartEngine = ChartEngine;
