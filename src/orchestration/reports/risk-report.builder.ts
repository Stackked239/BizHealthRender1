/**
 * Risk Assessment Report Builder
 *
 * Generates a comprehensive risk assessment report including:
 * - Risk summary dashboard
 * - Risk matrix (severity vs likelihood)
 * - Detailed risk analysis by category
 * - Mitigation strategies
 * - Early warning indicators
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta } from '../../types/report.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  escapeHtml,
} from './html-template.js';

// Import chart integration for visual charts
import {
  generateChapterOverviewRadar,
  generateAllChapterScoreBars,
  getReportChartStyles,
} from './charts/index.js';

/**
 * Build risk assessment report
 */
export async function buildRiskReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'risk';
  const reportName = 'Risk Assessment Report';

  // Generate visual charts asynchronously
  const [chapterRadar, chapterBars] = await Promise.all([
    generateChapterOverviewRadar(ctx, { width: 400, height: 300 }).catch(() => ''),
    generateAllChapterScoreBars(ctx, { width: 550, height: 200 }).catch(() => ''),
  ]);

  // Categorize risks by severity
  const getSeverityLevel = (severity: string | number): 'critical' | 'high' | 'medium' | 'low' => {
    const sev = typeof severity === 'number' ? severity : parseInt(String(severity)) || 5;
    if (sev >= 9) return 'critical';
    if (sev >= 7) return 'high';
    if (sev >= 4) return 'medium';
    return 'low';
  };

  const criticalRisks = ctx.risks.filter(r => getSeverityLevel(r.severity) === 'critical');
  const highRisks = ctx.risks.filter(r => getSeverityLevel(r.severity) === 'high');
  const mediumRisks = ctx.risks.filter(r => getSeverityLevel(r.severity) === 'medium');
  const lowRisks = ctx.risks.filter(r => getSeverityLevel(r.severity) === 'low');

  // Get risk-related findings
  const riskFindings = ctx.findings.filter(f => f.type === 'risk');

  // Group risks by dimension
  const risksByDimension = ctx.risks.reduce((acc, risk) => {
    const dim = risk.dimensionName;
    if (!acc[dim]) acc[dim] = [];
    acc[dim].push(risk);
    return acc;
  }, {} as Record<string, typeof ctx.risks>);

  const html = wrapHtmlDocument(`
    <style>
      /* Chart styles */
      ${getReportChartStyles()}

      .risk-chart-section {
        margin: 2rem 0;
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .risk-chart-section .chart-wrapper {
        flex: 1;
        min-width: 300px;
        max-width: 550px;
      }
    </style>

    ${generateReportHeader(ctx, reportName, 'Comprehensive Risk Analysis')}

    <section class="section">
      <h2>Risk Summary Dashboard</h2>

      <div class="grid grid-4">
        <div class="score-card small" style="background: linear-gradient(135deg, #dc3545, #c82333);">
          <div class="score-value">${criticalRisks.length}</div>
          <div class="score-label">Critical</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #fd7e14, #e55300);">
          <div class="score-value">${highRisks.length}</div>
          <div class="score-label">High</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #ffc107, #d39e00);">
          <div class="score-value">${mediumRisks.length}</div>
          <div class="score-label">Medium</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #28a745, #1e7e34);">
          <div class="score-value">${lowRisks.length}</div>
          <div class="score-label">Low</div>
        </div>
      </div>

      <div class="callout ${criticalRisks.length > 0 ? 'danger' : highRisks.length > 0 ? 'warning' : 'info'} mt-3">
        <div class="title">Overall Risk Assessment</div>
        <p>
          ${ctx.risks.length === 0
            ? 'No significant risks were identified in this assessment.'
            : criticalRisks.length > 0
              ? `${criticalRisks.length} critical risk(s) require immediate attention and mitigation.`
              : highRisks.length > 0
                ? `${highRisks.length} high-priority risk(s) should be addressed within the next 90 days.`
                : `${ctx.risks.length} risk(s) identified, all at manageable severity levels.`
          }
        </p>
      </div>

      ${(chapterRadar || chapterBars) ? `
        <div class="risk-chart-section">
          ${chapterRadar ? `<div class="chart-wrapper">${chapterRadar}</div>` : ''}
          ${chapterBars ? `<div class="chart-wrapper">${chapterBars}</div>` : ''}
        </div>
      ` : ''}
    </section>

    <section class="section page-break">
      <h2>Risk Matrix</h2>

      <style>
        .risk-matrix {
          display: grid;
          grid-template-columns: auto repeat(5, 1fr);
          gap: 2px;
          background: #ddd;
          padding: 2px;
          margin-bottom: 1.5rem;
        }
        .risk-matrix-cell {
          background: #fff;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.85rem;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .risk-matrix-header {
          background: ${options.brand.primaryColor};
          color: #fff;
          font-weight: 600;
        }
        .risk-matrix-label {
          background: #f8f9fa;
          font-weight: 600;
        }
        .risk-count {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .risk-high { background: #f8d7da; }
        .risk-medium { background: #fff3cd; }
        .risk-low { background: #d4edda; }
      </style>

      <div class="risk-matrix">
        <div class="risk-matrix-cell risk-matrix-header"></div>
        <div class="risk-matrix-cell risk-matrix-header">Very Low</div>
        <div class="risk-matrix-cell risk-matrix-header">Low</div>
        <div class="risk-matrix-cell risk-matrix-header">Medium</div>
        <div class="risk-matrix-cell risk-matrix-header">High</div>
        <div class="risk-matrix-cell risk-matrix-header">Very High</div>

        <div class="risk-matrix-cell risk-matrix-label">Critical</div>
        ${[1,2,3,4,5].map(likelihood => {
          const count = ctx.risks.filter(r =>
            getSeverityLevel(r.severity) === 'critical' &&
            Math.ceil((typeof r.likelihood === 'number' ? r.likelihood : parseInt(String(r.likelihood)) || 5) / 2) === likelihood
          ).length;
          return `<div class="risk-matrix-cell ${count > 0 ? 'risk-high' : ''}">${count > 0 ? `<span class="risk-count">${count}</span>` : '-'}</div>`;
        }).join('')}

        <div class="risk-matrix-cell risk-matrix-label">High</div>
        ${[1,2,3,4,5].map(likelihood => {
          const count = ctx.risks.filter(r =>
            getSeverityLevel(r.severity) === 'high' &&
            Math.ceil((typeof r.likelihood === 'number' ? r.likelihood : parseInt(String(r.likelihood)) || 5) / 2) === likelihood
          ).length;
          return `<div class="risk-matrix-cell ${count > 0 ? 'risk-medium' : ''}">${count > 0 ? `<span class="risk-count">${count}</span>` : '-'}</div>`;
        }).join('')}

        <div class="risk-matrix-cell risk-matrix-label">Medium</div>
        ${[1,2,3,4,5].map(likelihood => {
          const count = ctx.risks.filter(r =>
            getSeverityLevel(r.severity) === 'medium' &&
            Math.ceil((typeof r.likelihood === 'number' ? r.likelihood : parseInt(String(r.likelihood)) || 5) / 2) === likelihood
          ).length;
          return `<div class="risk-matrix-cell ${count > 0 ? 'risk-medium' : ''}">${count > 0 ? `<span class="risk-count">${count}</span>` : '-'}</div>`;
        }).join('')}

        <div class="risk-matrix-cell risk-matrix-label">Low</div>
        ${[1,2,3,4,5].map(likelihood => {
          const count = ctx.risks.filter(r =>
            getSeverityLevel(r.severity) === 'low' &&
            Math.ceil((typeof r.likelihood === 'number' ? r.likelihood : parseInt(String(r.likelihood)) || 5) / 2) === likelihood
          ).length;
          return `<div class="risk-matrix-cell ${count > 0 ? 'risk-low' : ''}">${count > 0 ? `<span class="risk-count">${count}</span>` : '-'}</div>`;
        }).join('')}
      </div>

      <p class="text-center"><em>Likelihood (Horizontal) vs Severity (Vertical)</em></p>
    </section>

    ${criticalRisks.length > 0 ? `
      <section class="section page-break">
        <h2>Critical Risks - Immediate Action Required</h2>
        ${criticalRisks.map(risk => `
          <div class="risk-card high">
            <div class="header">
              <span class="category">${escapeHtml(risk.category || risk.dimensionName)}</span>
              <span class="priority-badge high">Critical</span>
            </div>
            <p>${escapeHtml(risk.narrative)}</p>
            ${risk.mitigationSummary ? `
              <div class="callout warning mt-2" style="margin-bottom: 0;">
                <div class="title">Mitigation Strategy</div>
                <p style="margin-bottom: 0;">${escapeHtml(risk.mitigationSummary)}</p>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </section>
    ` : ''}

    <section class="section page-break">
      <h2>Detailed Risk Analysis by Dimension</h2>

      ${Object.entries(risksByDimension).map(([dimension, risks]) => `
        <div class="card mb-2">
          <div class="card-header">
            <span class="card-title">${escapeHtml(dimension)}</span>
            <span class="band-badge ${risks.some(r => getSeverityLevel(r.severity) === 'critical' || getSeverityLevel(r.severity) === 'high') ? 'Critical' : 'Attention'}">
              ${risks.length} Risk${risks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div class="card-body">
            ${risks.map(risk => `
              <div style="padding: 0.75rem 0; border-bottom: 1px solid #eee;">
                <div class="flex flex-between mb-1">
                  <strong>${escapeHtml(risk.category || 'General Risk')}</strong>
                  <span class="priority-badge ${getSeverityLevel(risk.severity)}">${risk.severity}</span>
                </div>
                <p style="margin-bottom: 0.5rem;">${escapeHtml(risk.narrative)}</p>
                <small style="color: #666;">Likelihood: ${risk.likelihood}</small>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      ${Object.keys(risksByDimension).length === 0 ? `
        <div class="callout info">
          <p>No specific risks were identified in the assessment.</p>
        </div>
      ` : ''}
    </section>

    ${riskFindings.length > 0 ? `
      <section class="section page-break">
        <h2>Risk-Related Findings</h2>
        ${riskFindings.map(f => `
          <div class="finding-card risk">
            <div class="label">${escapeHtml(f.shortLabel)}</div>
            <div class="dimension">${escapeHtml(f.dimensionName)}</div>
            <p>${escapeHtml(f.narrative)}</p>
          </div>
        `).join('')}
      </section>
    ` : ''}

    <section class="section">
      <h2>Risk Monitoring & Early Warning Indicators</h2>

      <div class="callout info">
        <div class="title">Recommended Monitoring Approach</div>
        <p>Implement regular risk reviews to track the status of identified risks and detect emerging threats:</p>
      </div>

      <table class="mt-2">
        <thead>
          <tr>
            <th>Frequency</th>
            <th>Activity</th>
            <th>Responsible</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Weekly</td>
            <td>Review critical risk indicators and status updates</td>
            <td>Risk Owner / Operations Lead</td>
          </tr>
          <tr>
            <td>Monthly</td>
            <td>Full risk register review and mitigation progress</td>
            <td>Leadership Team</td>
          </tr>
          <tr>
            <td>Quarterly</td>
            <td>Strategic risk assessment and emerging risk scan</td>
            <td>Executive Team / Board</td>
          </tr>
        </tbody>
      </table>

      <h3 class="mt-3">Early Warning Indicators</h3>
      <ul>
        <li>Decline in key performance metrics beyond threshold</li>
        <li>Customer complaints or satisfaction scores trending down</li>
        <li>Staff turnover exceeding industry benchmarks</li>
        <li>Delayed project deliverables or missed deadlines</li>
        <li>Cash flow deviations from forecast</li>
        <li>Regulatory or compliance notifications</li>
      </ul>
    </section>

    ${generateReportFooter(ctx)}
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    ctx: ctx,
  });

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: 'risk',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: Math.max(4, Math.ceil(ctx.risks.length / 3) + 3),
    sections: [
      { id: 'dashboard', title: 'Risk Summary Dashboard' },
      { id: 'matrix', title: 'Risk Matrix' },
      { id: 'critical', title: 'Critical Risks' },
      { id: 'detailed', title: 'Detailed Risk Analysis' },
      { id: 'monitoring', title: 'Risk Monitoring' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'risk',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}
