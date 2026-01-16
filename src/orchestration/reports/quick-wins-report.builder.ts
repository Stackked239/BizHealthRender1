/**
 * Quick Wins Report Builder
 *
 * Generates a focused quick wins report including:
 * - Introduction to quick win methodology
 * - Prioritized list of quick wins
 * - 30-60-90 day action plan
 * - Resource requirements summary
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
 * Build quick wins report
 */
export async function buildQuickWinsReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'quickWins';
  const reportName = 'Quick Wins Action Plan';

  // Generate visual charts asynchronously
  const [chapterBars] = await Promise.all([
    generateAllChapterScoreBars(ctx, { width: 600, height: 180 }).catch(() => ''),
  ]);

  // Get quick wins and sort by ROI
  const quickWins = [...ctx.quickWins].sort((a, b) => {
    const roiA = calculateROI(a.impactScore, a.effortScore);
    const roiB = calculateROI(b.impactScore, b.effortScore);
    return roiB - roiA;
  });

  // Categorize by timeframe
  const immediate = quickWins.filter(qw => qw.effortScore <= 30);
  const shortTerm = quickWins.filter(qw => qw.effortScore > 30 && qw.effortScore <= 60);
  const midTerm = quickWins.filter(qw => qw.effortScore > 60);

  const html = wrapHtmlDocument(`
    <style>
      /* Chart styles */
      ${getReportChartStyles()}

      .quickwins-chart-section {
        margin: 2rem 0;
        text-align: center;
      }

      .quickwins-chart-section .chart-wrapper {
        display: inline-block;
        max-width: 100%;
      }
    </style>

    ${generateReportHeader(ctx, reportName, 'High-Impact, Low-Effort Improvements')}

    <section class="section">
      <h2>Quick Wins Overview</h2>

      <div class="callout info">
        <div class="title">What are Quick Wins?</div>
        <p>Quick Wins are high-impact, low-effort improvements that can be implemented within 90 days to generate immediate value. They are characterized by:</p>
        <ul>
          <li><strong>High Impact Score:</strong> Significant positive effect on business performance</li>
          <li><strong>Low Effort Score:</strong> Minimal resources, time, and complexity required</li>
          <li><strong>Strong ROI:</strong> Excellent return on investment ratio</li>
        </ul>
      </div>

      <div class="grid grid-3 mt-3">
        <div class="score-card small">
          <div class="score-value">${quickWins.length}</div>
          <div class="score-label">Quick Wins Identified</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${Math.round(quickWins.reduce((sum, qw) => sum + qw.impactScore, 0) / Math.max(quickWins.length, 1))}</div>
          <div class="score-label">Avg Impact Score</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${(quickWins.reduce((sum, qw) => sum + calculateROI(qw.impactScore, qw.effortScore), 0) / Math.max(quickWins.length, 1)).toFixed(1)}x</div>
          <div class="score-label">Avg ROI</div>
        </div>
      </div>

      ${chapterBars ? `
        <div class="quickwins-chart-section">
          <h3>Current Business Health by Chapter</h3>
          <div class="chart-wrapper">
            ${chapterBars}
          </div>
        </div>
      ` : ''}
    </section>

    <section class="section page-break">
      <h2>Quick Wins Prioritized List</h2>

      ${quickWins.length === 0 ? `
        <div class="callout warning">
          <p>No quick wins were identified in this assessment. This may indicate that improvements require more substantial effort or time investment.</p>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Quick Win</th>
              <th>Impact</th>
              <th>Effort</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            ${quickWins.map((qw, i) => `
              <tr>
                <td><strong>#${i + 1}</strong></td>
                <td>${escapeHtml(qw.theme)}</td>
                <td>${qw.impactScore}/100</td>
                <td>${qw.effortScore}/100</td>
                <td><strong>${calculateROI(qw.impactScore, qw.effortScore)}x</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </section>

    ${quickWins.length > 0 ? `
      <section class="section page-break">
        <h2>Detailed Quick Win Analysis</h2>

        ${quickWins.map((qw, i) => `
          <div class="card mb-2">
            <div class="card-header">
              <span class="card-title">#${i + 1}. ${escapeHtml(qw.theme)}</span>
              <span class="band-badge Excellence">ROI: ${calculateROI(qw.impactScore, qw.effortScore)}x</span>
            </div>
            <div class="card-body">
              <div class="flex gap-3 mb-2">
                <span><strong>Impact:</strong> ${qw.impactScore}/100</span>
                <span><strong>Effort:</strong> ${qw.effortScore}/100</span>
                <span><strong>Timeframe:</strong> ${escapeHtml(qw.timeframe)}</span>
              </div>

              <h5>Expected Outcomes</h5>
              <p>${escapeHtml(qw.expectedOutcomes)}</p>

              ${qw.actionSteps.length > 0 ? `
                <h5>Implementation Steps</h5>
                <ol>
                  ${qw.actionSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                </ol>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </section>
    ` : ''}

    <section class="section page-break">
      <h2>30-60-90 Day Action Plan</h2>

      <div class="timeline">
        <div class="timeline-item">
          <div class="phase-name">Days 1-30: Immediate Actions</div>
          <div class="time-horizon">Quick Start Phase</div>
          ${immediate.length > 0 ? `
            <ul>
              ${immediate.map(qw => `<li>${escapeHtml(qw.theme)}</li>`).join('')}
            </ul>
          ` : `
            <p>Focus on planning and resource allocation for upcoming quick wins.</p>
          `}
        </div>

        <div class="timeline-item">
          <div class="phase-name">Days 31-60: Short-Term Wins</div>
          <div class="time-horizon">Momentum Building Phase</div>
          ${shortTerm.length > 0 ? `
            <ul>
              ${shortTerm.map(qw => `<li>${escapeHtml(qw.theme)}</li>`).join('')}
            </ul>
          ` : `
            <p>Continue implementation and measure results from Day 1-30 initiatives.</p>
          `}
        </div>

        <div class="timeline-item">
          <div class="phase-name">Days 61-90: Mid-Term Completion</div>
          <div class="time-horizon">Value Realization Phase</div>
          ${midTerm.length > 0 ? `
            <ul>
              ${midTerm.map(qw => `<li>${escapeHtml(qw.theme)}</li>`).join('')}
            </ul>
          ` : `
            <p>Complete remaining quick wins and document success metrics.</p>
          `}
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Success Metrics & Tracking</h2>

      <div class="callout success">
        <div class="title">Recommended KPIs</div>
        <ul>
          <li><strong>Completion Rate:</strong> Percentage of quick wins implemented on schedule</li>
          <li><strong>Impact Realization:</strong> Actual vs. projected improvement in affected areas</li>
          <li><strong>Time to Value:</strong> Days from initiation to measurable results</li>
          <li><strong>Resource Efficiency:</strong> Actual vs. budgeted effort and costs</li>
        </ul>
      </div>

      <h3>Tracking Template</h3>
      <table>
        <thead>
          <tr>
            <th>Quick Win</th>
            <th>Start Date</th>
            <th>Target Date</th>
            <th>Status</th>
            <th>Results</th>
          </tr>
        </thead>
        <tbody>
          ${quickWins.slice(0, 5).map(qw => `
            <tr>
              <td>${escapeHtml(qw.theme)}</td>
              <td>_________</td>
              <td>_________</td>
              <td>_________</td>
              <td>_________</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
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
    reportType: 'quickWins',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: Math.max(3, Math.ceil(quickWins.length / 2) + 2),
    sections: [
      { id: 'overview', title: 'Quick Wins Overview' },
      { id: 'list', title: 'Prioritized List' },
      { id: 'details', title: 'Detailed Analysis' },
      { id: 'action-plan', title: '30-60-90 Day Action Plan' },
      { id: 'tracking', title: 'Success Metrics' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'quickWins',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}
