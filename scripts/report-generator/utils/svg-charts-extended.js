/**
 * Extended SVG Chart Generators for Recipe-Based Reports
 *
 * Additional chart types for the IDM recipe-based report system.
 */

const COLORS = {
  navy: '#212653',
  navyLight: '#2d3470',
  gold: '#c9a227',
  goldLight: '#d4b23a',
  green: '#969423',
  grey: '#7C7C7C',
  white: '#FFFFFF',
  surface: '#f8fafc',
  tierExcellence: '#10b981',
  tierProficiency: '#f59e0b',
  tierAttention: '#f97316',
  tierCritical: '#ef4444',
  gridLine: '#e2e8f0'
};

/**
 * Generate a horizontal bar chart
 */
export function generateBarChart(data, options = {}) {
  const { width = 600, height = 300 } = options;
  const padding = { top: 30, right: 80, bottom: 30, left: 180 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!data || data.length === 0) {
    return `<svg viewBox="0 0 ${width} ${height}"><text x="${width/2}" y="${height/2}" text-anchor="middle">No data available</text></svg>`;
  }

  const barHeight = Math.min(30, (chartHeight - (data.length - 1) * 8) / data.length);
  const gap = 8;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: 'Open Sans', sans-serif;">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${COLORS.white}"/>`;

  // Draw bars
  data.forEach((item, i) => {
    const y = padding.top + i * (barHeight + gap);
    const barWidth = (item.value / 100) * chartWidth;
    const color = getColorForScore(item.value);

    // Label
    svg += `<text x="${padding.left - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" fill="${COLORS.navy}" font-weight="500">${item.label}</text>`;

    // Bar background
    svg += `<rect x="${padding.left}" y="${y}" width="${chartWidth}" height="${barHeight}" fill="${COLORS.gridLine}" rx="4"/>`;

    // Bar fill
    svg += `<rect x="${padding.left}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>`;

    // Score
    svg += `<text x="${padding.left + barWidth + 8}" y="${y + barHeight / 2 + 4}" font-size="12" fill="${COLORS.navy}" font-weight="600">${item.value}/100</text>`;
  });

  svg += '</svg>';
  return `<div class="chart-container">${svg}</div>`;
}

/**
 * Generate a progress bar
 */
export function generateProgressBar(score, label) {
  const tierClass = score >= 80 ? 'excellence' : score >= 60 ? 'proficiency' : score >= 40 ? 'attention' : 'critical';
  const color = getColorForScore(score);

  return `
    <div class="progress-bar-container">
      <div class="progress-bar-header">
        <span class="progress-bar-label">${escapeHtml(label)}</span>
        <span class="progress-bar-value">${score}/100</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill ${tierClass}" style="width: ${score}%; background: ${color};"></div>
      </div>
    </div>
  `;
}

/**
 * Generate a timeline/roadmap visualization
 */
export function generateTimeline(phases) {
  if (!phases || phases.length === 0) {
    return '<p>No timeline data available.</p>';
  }

  let html = '<div class="timeline">';

  phases.forEach((phase, i) => {
    const isLast = i === phases.length - 1;

    html += `
      <div class="timeline-item ${isLast ? 'timeline-item-last' : ''}">
        <div class="timeline-marker">
          <div class="timeline-dot">${i + 1}</div>
          ${!isLast ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">${escapeHtml(phase.name)}</span>
            <span class="timeline-horizon">${escapeHtml(phase.time_horizon)}</span>
          </div>
          <p class="timeline-narrative">${escapeHtml(phase.narrative)}</p>
          ${phase.linked_recommendation_ids && phase.linked_recommendation_ids.length > 0 ?
            `<p class="timeline-meta">${phase.linked_recommendation_ids.length} linked recommendations</p>` : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';

  // Add timeline styles
  html += `
    <style>
      .timeline { margin: 24px 0; }
      .timeline-item { display: flex; gap: 16px; margin-bottom: 24px; }
      .timeline-item-last { margin-bottom: 0; }
      .timeline-marker { display: flex; flex-direction: column; align-items: center; }
      .timeline-dot {
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--biz-navy, #212653); color: white;
        display: flex; align-items: center; justify-content: center;
        font-weight: 600; font-size: 14px;
      }
      .timeline-line { width: 2px; flex: 1; background: var(--border-light, #e2e8f0); margin-top: 8px; }
      .timeline-content { flex: 1; padding-bottom: 16px; }
      .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .timeline-title { font-weight: 600; font-size: 16px; color: var(--biz-navy, #212653); }
      .timeline-horizon { font-size: 13px; color: var(--text-secondary, #64748b); background: var(--surface-muted, #f1f5f9); padding: 4px 12px; border-radius: 12px; }
      .timeline-narrative { font-size: 14px; color: var(--text-primary, #1e293b); line-height: 1.6; margin: 0; }
      .timeline-meta { font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 8px; }
    </style>
  `;

  return html;
}

/**
 * Generate a risk matrix
 */
export function generateRiskMatrix(risks) {
  if (!risks || risks.length === 0) {
    return '<p>No risks identified.</p>';
  }

  // Group risks by severity
  const criticalRisks = risks.filter(r => r.severity === 'Critical' || r.severity === 'High' || r.severity > 70);
  const mediumRisks = risks.filter(r => r.severity === 'Medium' || (typeof r.severity === 'number' && r.severity >= 40 && r.severity < 70));
  const lowRisks = risks.filter(r => r.severity === 'Low' || (typeof r.severity === 'number' && r.severity < 40));

  let html = '<div class="risk-matrix-container">';

  // Summary
  html += `
    <div class="risk-summary">
      <div class="risk-count critical">${criticalRisks.length} Critical</div>
      <div class="risk-count medium">${mediumRisks.length} Medium</div>
      <div class="risk-count low">${lowRisks.length} Low</div>
    </div>
  `;

  // Risk list
  html += '<div class="risk-list">';
  risks.slice(0, 10).forEach(risk => {
    const severityClass = getSeverityClass(risk.severity);
    html += `
      <div class="risk-item ${severityClass}">
        <div class="risk-header">
          <span class="risk-badge">${risk.severity}</span>
          <span class="risk-dimension">${risk.dimension_code || ''}</span>
        </div>
        <p class="risk-narrative">${escapeHtml(risk.narrative)}</p>
        ${risk.category ? `<span class="risk-category">${escapeHtml(risk.category)}</span>` : ''}
      </div>
    `;
  });
  html += '</div></div>';

  // Add styles
  html += `
    <style>
      .risk-matrix-container { margin: 24px 0; }
      .risk-summary { display: flex; gap: 16px; margin-bottom: 24px; }
      .risk-count { padding: 12px 20px; border-radius: 8px; font-weight: 600; }
      .risk-count.critical { background: #fee2e2; color: #dc2626; }
      .risk-count.medium { background: #fef3c7; color: #d97706; }
      .risk-count.low { background: #d1fae5; color: #059669; }
      .risk-list { display: flex; flex-direction: column; gap: 12px; }
      .risk-item { padding: 16px; border-radius: 8px; border-left: 4px solid; }
      .risk-item.critical { background: #fef2f2; border-color: #ef4444; }
      .risk-item.medium { background: #fffbeb; border-color: #f59e0b; }
      .risk-item.low { background: #f0fdf4; border-color: #10b981; }
      .risk-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .risk-badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
      .risk-dimension { font-size: 12px; color: var(--text-secondary); }
      .risk-narrative { font-size: 14px; margin: 0; line-height: 1.5; }
      .risk-category { font-size: 11px; color: var(--text-muted); margin-top: 8px; display: inline-block; }
    </style>
  `;

  return html;
}

/**
 * Generate a KPI dashboard
 */
export function generateKPIDashboard(items) {
  if (!items || items.length === 0) {
    return '<p>No KPI data available.</p>';
  }

  let html = '<div class="kpi-dashboard">';

  items.forEach(item => {
    const score = item.score_overall || item.score || 0;
    const color = getColorForScore(score);
    const band = item.score_band || getScoreBand(score);

    html += `
      <div class="kpi-card">
        <div class="kpi-score" style="color: ${color};">${score}</div>
        <div class="kpi-name">${escapeHtml(item.name || item.dimension_code || 'KPI')}</div>
        <div class="kpi-band" style="background: ${color}20; color: ${color};">${band}</div>
      </div>
    `;
  });

  html += '</div>';

  // Add styles
  html += `
    <style>
      .kpi-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin: 24px 0; }
      .kpi-card { background: white; border: 1px solid var(--border-light, #e2e8f0); border-radius: 12px; padding: 20px; text-align: center; }
      .kpi-score { font-size: 36px; font-weight: 700; line-height: 1; }
      .kpi-name { font-size: 13px; color: var(--text-secondary, #64748b); margin: 8px 0; }
      .kpi-band { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 12px; display: inline-block; }
    </style>
  `;

  return html;
}

/**
 * Generate score tiles in a row
 */
export function generateScoreTilesRow(data, options = {}) {
  const items = data.chapters || data.dimensions || (Array.isArray(data) ? data : [data]);
  const columns = options.columns || 4;

  let html = `<div class="score-tiles-row" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 16px; margin: 24px 0;">`;

  items.forEach(item => {
    const score = item.score_overall || item.score || 0;
    const name = item.name || item.chapter_code || item.dimension_code;
    const band = item.score_band || getScoreBand(score);
    const color = getColorForScore(score);

    html += `
      <div class="score-tile" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; border-top: 4px solid ${color};">
        <div style="font-size: 32px; font-weight: 700; color: ${color};">${score}</div>
        <div style="font-size: 14px; font-weight: 600; color: #212653; margin: 8px 0;">${escapeHtml(name)}</div>
        <div style="font-size: 11px; color: ${color}; background: ${color}20; padding: 4px 12px; border-radius: 12px; display: inline-block;">${band}</div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

/**
 * Generate a single large score tile
 */
export function generateScoreTile(score, descriptor) {
  const color = getColorForScore(score);

  return `
    <div class="score-tile-large" style="background: linear-gradient(135deg, #212653 0%, #2d3470 100%); border-radius: 16px; padding: 40px; text-align: center; color: white; margin: 24px 0;">
      <div style="font-size: 72px; font-weight: 800; line-height: 1;">${score}</div>
      <div style="font-size: 18px; opacity: 0.8; margin-top: 8px;">${escapeHtml(descriptor || getScoreDescriptor(score))}</div>
    </div>
  `;
}

// Helper functions
function getColorForScore(score) {
  if (score >= 80) return COLORS.tierExcellence;
  if (score >= 60) return COLORS.tierProficiency;
  if (score >= 40) return COLORS.tierAttention;
  return COLORS.tierCritical;
}

function getScoreBand(score) {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

function getScoreDescriptor(score) {
  if (score >= 85) return 'Excellent Health';
  if (score >= 75) return 'Good Health';
  if (score >= 65) return 'Fair Health';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical Condition';
}

function getSeverityClass(severity) {
  if (severity === 'Critical' || severity === 'High' || severity > 70) return 'critical';
  if (severity === 'Medium' || (typeof severity === 'number' && severity >= 40)) return 'medium';
  return 'low';
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text || '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  generateBarChart,
  generateProgressBar,
  generateTimeline,
  generateRiskMatrix,
  generateKPIDashboard,
  generateScoreTilesRow,
  generateScoreTile
};
