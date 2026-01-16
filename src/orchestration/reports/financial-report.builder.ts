/**
 * Financial Impact Analysis Report Builder
 *
 * Generates a financial impact report including:
 * - Investment summary
 * - ROI projections
 * - Cost-benefit analysis
 * - Cash flow impact
 * - Sensitivity analysis
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
import { calculateROI } from '../../types/report.types.js';

// Import chart integration for visual charts
import {
  generateAllChapterScoreBars,
  getReportChartStyles,
} from './charts/index.js';

/**
 * Build financial impact report
 */
export async function buildFinancialReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'financial';
  const reportName = 'Financial Impact Analysis';

  const { recommendations, quickWins, financialProjections } = ctx;

  // Generate visual charts asynchronously
  const [chapterBars] = await Promise.all([
    generateAllChapterScoreBars(ctx, { width: 650, height: 200 }).catch(() => ''),
  ]);

  // Sort recommendations by ROI
  const sortedByROI = [...recommendations].sort((a, b) =>
    calculateROI(b.impactScore, b.effortScore) - calculateROI(a.impactScore, a.effortScore)
  );

  // Calculate totals
  const totalImpact = recommendations.reduce((sum, r) => sum + r.impactScore, 0);
  const totalEffort = recommendations.reduce((sum, r) => sum + r.effortScore, 0);
  const avgROI = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + calculateROI(r.impactScore, r.effortScore), 0) / recommendations.length
    : 0;

  // Group by horizon
  const immediateRecs = recommendations.filter(r => r.horizon === '90_days');
  const shortTermRecs = recommendations.filter(r => r.horizon === '12_months');
  const longTermRecs = recommendations.filter(r => r.horizon === '24_months_plus');

  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const html = wrapHtmlDocument(`
    <style>
      /* Chart styles */
      ${getReportChartStyles()}

      .financial-chart-section {
        margin: 2rem 0;
        text-align: center;
      }

      .financial-chart-section .chart-wrapper {
        display: inline-block;
        max-width: 100%;
      }
    </style>

    ${generateReportHeader(ctx, reportName, 'ROI Projections & Investment Analysis')}

    <section class="section">
      <h2>Financial Summary</h2>

      <div class="grid grid-4">
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections?.day90Value)}</div>
          <div class="score-label">90-Day Value</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections?.annualValue)}</div>
          <div class="score-label">Annual Value</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${financialProjections?.roi90Day ? `${financialProjections.roi90Day}x` : `${avgROI.toFixed(1)}x`}</div>
          <div class="score-label">Expected ROI</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections?.totalInvestmentRequired)}</div>
          <div class="score-label">Investment Req'd</div>
        </div>
      </div>

      ${financialProjections ? `
        <div class="callout success mt-3">
          <div class="title">Investment Opportunity</div>
          <p>
            Based on this assessment, implementing the recommended improvements could generate
            <strong>${formatCurrency(financialProjections.annualValue)}</strong> in annual value
            with an estimated ROI of <strong>${financialProjections.roi90Day || avgROI.toFixed(1)}x</strong>
            within the first 90 days.
          </p>
        </div>
      ` : `
        <div class="callout info mt-3">
          <p>
            Financial projections are based on the impact and effort scores of recommended initiatives.
            Actual results will depend on implementation quality and market conditions.
          </p>
        </div>
      `}

      ${chapterBars ? `
        <div class="financial-chart-section">
          <h3>Current Business Health by Chapter</h3>
          <div class="chart-wrapper">
            ${chapterBars}
          </div>
        </div>
      ` : ''}
    </section>

    <section class="section page-break">
      <h2>ROI Analysis by Recommendation</h2>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Recommendation</th>
            <th>Impact</th>
            <th>Effort</th>
            <th>ROI</th>
            <th>Timeline</th>
          </tr>
        </thead>
        <tbody>
          ${sortedByROI.map((rec, i) => {
            const roi = calculateROI(rec.impactScore, rec.effortScore);
            return `
              <tr>
                <td><strong>#${i + 1}</strong></td>
                <td>
                  ${escapeHtml(rec.theme)}
                  ${rec.isQuickWin ? '<span class="band-badge Excellence" style="margin-left: 0.5rem; font-size: 0.7rem;">QW</span>' : ''}
                </td>
                <td>${rec.impactScore}/100</td>
                <td>${rec.effortScore}/100</td>
                <td><strong style="color: ${roi >= 2 ? '#28a745' : roi >= 1 ? '#ffc107' : '#dc3545'};">${roi}x</strong></td>
                <td>${escapeHtml(rec.horizonLabel)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="mt-2" style="font-size: 0.85rem; color: #666;">
        <strong>ROI Legend:</strong>
        <span style="color: #28a745; margin-left: 1rem;">2x+ = Excellent</span>
        <span style="color: #ffc107; margin-left: 1rem;">1-2x = Good</span>
        <span style="color: #dc3545; margin-left: 1rem;">&lt;1x = Low</span>
      </div>
    </section>

    <section class="section page-break">
      <h2>Investment Timeline</h2>

      <h3>Phase 1: Immediate (0-90 Days)</h3>
      <div class="card mb-2">
        <div class="card-body">
          <div class="flex flex-between mb-2">
            <span><strong>Initiatives:</strong> ${immediateRecs.length}</span>
            <span><strong>Avg Impact:</strong> ${immediateRecs.length > 0 ? Math.round(immediateRecs.reduce((s, r) => s + r.impactScore, 0) / immediateRecs.length) : 0}/100</span>
            <span><strong>Avg ROI:</strong> ${immediateRecs.length > 0 ? (immediateRecs.reduce((s, r) => s + calculateROI(r.impactScore, r.effortScore), 0) / immediateRecs.length).toFixed(1) : 0}x</span>
          </div>
          ${immediateRecs.length > 0 ? `
            <ul>
              ${immediateRecs.slice(0, 5).map(r => `<li>${escapeHtml(r.theme)} (ROI: ${calculateROI(r.impactScore, r.effortScore)}x)</li>`).join('')}
            </ul>
          ` : '<p style="color: #666;">No initiatives in this phase.</p>'}
        </div>
      </div>

      <h3>Phase 2: Short-Term (3-12 Months)</h3>
      <div class="card mb-2">
        <div class="card-body">
          <div class="flex flex-between mb-2">
            <span><strong>Initiatives:</strong> ${shortTermRecs.length}</span>
            <span><strong>Avg Impact:</strong> ${shortTermRecs.length > 0 ? Math.round(shortTermRecs.reduce((s, r) => s + r.impactScore, 0) / shortTermRecs.length) : 0}/100</span>
            <span><strong>Avg ROI:</strong> ${shortTermRecs.length > 0 ? (shortTermRecs.reduce((s, r) => s + calculateROI(r.impactScore, r.effortScore), 0) / shortTermRecs.length).toFixed(1) : 0}x</span>
          </div>
          ${shortTermRecs.length > 0 ? `
            <ul>
              ${shortTermRecs.slice(0, 5).map(r => `<li>${escapeHtml(r.theme)} (ROI: ${calculateROI(r.impactScore, r.effortScore)}x)</li>`).join('')}
            </ul>
          ` : '<p style="color: #666;">No initiatives in this phase.</p>'}
        </div>
      </div>

      <h3>Phase 3: Long-Term (12-24+ Months)</h3>
      <div class="card mb-2">
        <div class="card-body">
          <div class="flex flex-between mb-2">
            <span><strong>Initiatives:</strong> ${longTermRecs.length}</span>
            <span><strong>Avg Impact:</strong> ${longTermRecs.length > 0 ? Math.round(longTermRecs.reduce((s, r) => s + r.impactScore, 0) / longTermRecs.length) : 0}/100</span>
            <span><strong>Avg ROI:</strong> ${longTermRecs.length > 0 ? (longTermRecs.reduce((s, r) => s + calculateROI(r.impactScore, r.effortScore), 0) / longTermRecs.length).toFixed(1) : 0}x</span>
          </div>
          ${longTermRecs.length > 0 ? `
            <ul>
              ${longTermRecs.slice(0, 5).map(r => `<li>${escapeHtml(r.theme)} (ROI: ${calculateROI(r.impactScore, r.effortScore)}x)</li>`).join('')}
            </ul>
          ` : '<p style="color: #666;">No initiatives in this phase.</p>'}
        </div>
      </div>
    </section>

    <section class="section page-break">
      <h2>Quick Wins Financial Impact</h2>

      ${quickWins.length > 0 ? `
        <div class="callout success mb-3">
          <div class="title">Quick Win Opportunity</div>
          <p>
            ${quickWins.length} quick win(s) identified with an average ROI of
            <strong>${(quickWins.reduce((s, qw) => s + calculateROI(qw.impactScore, qw.effortScore), 0) / quickWins.length).toFixed(1)}x</strong>.
            These represent the highest-value, lowest-effort improvements available.
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Quick Win</th>
              <th>Impact</th>
              <th>Effort</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            ${quickWins.map(qw => `
              <tr>
                <td>${escapeHtml(qw.theme)}</td>
                <td>${qw.impactScore}/100</td>
                <td>${qw.effortScore}/100</td>
                <td><strong style="color: #28a745;">${calculateROI(qw.impactScore, qw.effortScore)}x</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="callout info">
          <p>No quick wins were identified in this assessment.</p>
        </div>
      `}
    </section>

    <section class="section page-break">
      <h2>Sensitivity Analysis</h2>

      <p>
        The following table shows projected value under different implementation scenarios:
      </p>

      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Implementation Rate</th>
            <th>Projected 90-Day Value</th>
            <th>Projected Annual Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Conservative</td>
            <td>50%</td>
            <td>${formatCurrency((financialProjections?.day90Value || 0) * 0.5)}</td>
            <td>${formatCurrency((financialProjections?.annualValue || 0) * 0.5)}</td>
          </tr>
          <tr style="background: #d4edda;">
            <td><strong>Base Case</strong></td>
            <td>75%</td>
            <td><strong>${formatCurrency((financialProjections?.day90Value || 0) * 0.75)}</strong></td>
            <td><strong>${formatCurrency((financialProjections?.annualValue || 0) * 0.75)}</strong></td>
          </tr>
          <tr>
            <td>Optimistic</td>
            <td>100%</td>
            <td>${formatCurrency(financialProjections?.day90Value)}</td>
            <td>${formatCurrency(financialProjections?.annualValue)}</td>
          </tr>
        </tbody>
      </table>

      <div class="callout info mt-3">
        <div class="title">Key Assumptions</div>
        <ul style="margin-bottom: 0;">
          <li>Impact scores are realized proportionally to implementation quality</li>
          <li>Market conditions remain stable</li>
          <li>Resources are allocated as planned</li>
          <li>No major disruptions to business operations</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <h2>Funding Considerations</h2>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Internal Funding</span>
          </div>
          <div class="card-body">
            <ul>
              <li>Reallocate existing budget from lower-priority initiatives</li>
              <li>Use operational savings from quick wins</li>
              <li>Defer non-critical expenditures</li>
              <li>Cross-functional resource sharing</li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">External Funding</span>
          </div>
          <div class="card-body">
            <ul>
              <li>Business line of credit</li>
              <li>SBA loans or grants</li>
              <li>Strategic investor or partner</li>
              <li>Phased payment arrangements with vendors</li>
            </ul>
          </div>
        </div>
      </div>
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
    reportType: 'financial',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 6,
    sections: [
      { id: 'summary', title: 'Financial Summary' },
      { id: 'roi', title: 'ROI Analysis' },
      { id: 'timeline', title: 'Investment Timeline' },
      { id: 'quick-wins', title: 'Quick Wins Impact' },
      { id: 'sensitivity', title: 'Sensitivity Analysis' },
      { id: 'funding', title: 'Funding Considerations' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'financial',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}
