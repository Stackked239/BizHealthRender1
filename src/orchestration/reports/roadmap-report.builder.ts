/**
 * Implementation Roadmap Report Builder
 *
 * @deprecated This standalone roadmap report is deprecated.
 * Roadmap content is now integrated into:
 * - Owner's Report → Section 8: Strategic Implementation Roadmap (12-month view)
 * - Comprehensive Report → Section 8: 18-Month Implementation Roadmap
 *
 * See src/orchestration/reports/components/roadmap-data-builder.ts for new implementation.
 *
 * Original description:
 * Generates a phased implementation plan including:
 * - Roadmap overview
 * - Phase details with milestones
 * - Dependencies and prerequisites
 * - Resource requirements
 * - Timeline visualization
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
 * Build implementation roadmap report
 *
 * @deprecated Use Owner's Report Section 8 or Comprehensive Report Section 8 instead.
 * This standalone report will be removed in a future version.
 */
export async function buildRoadmapReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  // Deprecation warning
  console.log('⚠️  Standalone roadmap.html is DEPRECATED');
  console.log('   → Roadmap content is now available in:');
  console.log('     • Owner\'s Report → Section 8: Strategic Implementation Roadmap');
  console.log('     • Comprehensive Report → Section 8: 18-Month Implementation Roadmap');
  console.log('   → This standalone report will be removed in a future version.');

  const reportType = 'roadmap';
  const reportName = 'Implementation Roadmap';

  const { roadmap, recommendations } = ctx;

  // Generate visual charts asynchronously
  const [chapterRadar, chapterBars] = await Promise.all([
    generateChapterOverviewRadar(ctx, { width: 380, height: 280 }).catch(() => ''),
    generateAllChapterScoreBars(ctx, { width: 520, height: 180 }).catch(() => ''),
  ]);

  // Get recommendations by phase
  const getRecommendationsForPhase = (phase: typeof roadmap.phases[0]) => {
    return recommendations.filter(r => phase.linkedRecommendationIds.includes(r.id));
  };

  const html = wrapHtmlDocument(`
    <style>
      /* Chart styles */
      ${getReportChartStyles()}

      .roadmap-chart-section {
        margin: 2rem 0;
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .roadmap-chart-section .chart-wrapper {
        flex: 1;
        min-width: 280px;
        max-width: 520px;
      }
    </style>

    ${generateReportHeader(ctx, reportName, 'Strategic Implementation Plan')}

    <section class="section">
      <h2>Roadmap Overview</h2>

      <div class="callout info">
        <div class="title">Implementation Approach</div>
        <p>
          This roadmap provides a structured, phased approach to implementing the recommendations
          from your business health assessment. Each phase builds on the previous one, ensuring
          sustainable progress and measurable results.
        </p>
      </div>

      <div class="grid grid-${Math.min(roadmap.phases.length, 4)} mt-3">
        ${roadmap.phases.map((phase, i) => `
          <div class="card">
            <div class="card-header">
              <span class="card-title">Phase ${i + 1}</span>
            </div>
            <div class="card-body text-center">
              <h4 style="color: ${options.brand.primaryColor}; margin-bottom: 0.5rem;">${escapeHtml(phase.name)}</h4>
              <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">${escapeHtml(phase.timeHorizon)}</p>
              <p style="font-size: 0.85rem; margin: 0;">
                <strong>${phase.linkedRecommendationIds.length}</strong> initiatives
              </p>
            </div>
          </div>
        `).join('')}
      </div>

      ${(chapterRadar || chapterBars) ? `
        <div class="roadmap-chart-section">
          ${chapterRadar ? `<div class="chart-wrapper">${chapterRadar}</div>` : ''}
          ${chapterBars ? `<div class="chart-wrapper">${chapterBars}</div>` : ''}
        </div>
      ` : ''}
    </section>

    <section class="section page-break">
      <h2>Timeline Visualization</h2>

      <style>
        .gantt-container {
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }
        .gantt-chart {
          display: grid;
          grid-template-columns: 200px repeat(18, 40px);
          gap: 1px;
          background: #ddd;
          padding: 1px;
          min-width: 920px;
        }
        .gantt-header {
          background: ${options.brand.primaryColor};
          color: #fff;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .gantt-label {
          background: #f8f9fa;
          padding: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .gantt-cell {
          background: #fff;
          padding: 0.25rem;
        }
        .gantt-bar {
          height: 100%;
          border-radius: 3px;
          min-height: 20px;
        }
        .gantt-bar-1 { background: ${options.brand.primaryColor}; }
        .gantt-bar-2 { background: ${options.brand.accentColor}; }
        .gantt-bar-3 { background: #6c757d; }
      </style>

      <div class="gantt-container">
        <div class="gantt-chart">
          <div class="gantt-header">Phase / Month</div>
          ${Array.from({ length: 18 }, (_, i) => `<div class="gantt-header">M${i + 1}</div>`).join('')}

          ${roadmap.phases.map((phase, i) => {
            const startMonth = i === 0 ? 0 : i === 1 ? 3 : 12;
            const endMonth = i === 0 ? 3 : i === 1 ? 12 : 18;
            const duration = endMonth - startMonth;

            return `
              <div class="gantt-label">${escapeHtml(phase.name)}</div>
              ${Array.from({ length: 18 }, (_, m) => {
                const isInPhase = m >= startMonth && m < endMonth;
                return `<div class="gantt-cell">${isInPhase ? `<div class="gantt-bar gantt-bar-${(i % 3) + 1}"></div>` : ''}</div>`;
              }).join('')}
            `;
          }).join('')}
        </div>
      </div>

      <div class="flex gap-3">
        <span><span style="display: inline-block; width: 20px; height: 12px; background: ${options.brand.primaryColor}; border-radius: 2px; margin-right: 4px;"></span> Phase 1</span>
        <span><span style="display: inline-block; width: 20px; height: 12px; background: ${options.brand.accentColor}; border-radius: 2px; margin-right: 4px;"></span> Phase 2</span>
        <span><span style="display: inline-block; width: 20px; height: 12px; background: #6c757d; border-radius: 2px; margin-right: 4px;"></span> Phase 3+</span>
      </div>
    </section>

    ${roadmap.phases.map((phase, i) => `
      <section class="section page-break">
        <h2>Phase ${i + 1}: ${escapeHtml(phase.name)}</h2>

        <div class="flex gap-3 mb-3">
          <div class="score-card small">
            <div class="score-value">${escapeHtml(phase.timeHorizon.split(' ')[0])}</div>
            <div class="score-label">${escapeHtml(phase.timeHorizon.split(' ').slice(1).join(' ') || 'Timeline')}</div>
          </div>
          <div>
            <p><strong>Initiatives:</strong> ${phase.linkedRecommendationIds.length}</p>
            <p><strong>Focus:</strong> ${escapeHtml(phase.narrative.slice(0, 100))}${phase.narrative.length > 100 ? '...' : ''}</p>
          </div>
        </div>

        <h3>Phase Objectives</h3>
        <p>${escapeHtml(phase.narrative)}</p>

        ${phase.keyMilestones && phase.keyMilestones.length > 0 ? `
          <h3>Key Milestones</h3>
          <ul>
            ${phase.keyMilestones.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        ` : ''}

        <h3>Initiatives in This Phase</h3>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Initiative</th>
              <th>Impact</th>
              <th>Effort</th>
            </tr>
          </thead>
          <tbody>
            ${getRecommendationsForPhase(phase).map(rec => `
              <tr>
                <td><strong>#${rec.priorityRank}</strong></td>
                <td>
                  ${escapeHtml(rec.theme)}
                  ${rec.isQuickWin ? '<span class="band-badge Excellence" style="margin-left: 0.5rem; font-size: 0.7rem;">Quick Win</span>' : ''}
                </td>
                <td>${rec.impactScore}/100</td>
                <td>${rec.effortScore}/100</td>
              </tr>
            `).join('')}
            ${getRecommendationsForPhase(phase).length === 0 ? `
              <tr><td colspan="4" style="text-align: center; color: #666;">No specific initiatives linked to this phase</td></tr>
            ` : ''}
          </tbody>
        </table>

        ${phase.dependencies && phase.dependencies.length > 0 ? `
          <h3>Dependencies & Prerequisites</h3>
          <ul>
            ${phase.dependencies.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        ` : ''}

        ${phase.resourceRequirements ? `
          <h3>Resource Requirements</h3>
          <p>${escapeHtml(phase.resourceRequirements)}</p>
        ` : ''}
      </section>
    `).join('')}

    <section class="section page-break">
      <h2>Resource Planning Summary</h2>

      <h3>Estimated Resource Allocation by Phase</h3>
      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Timeline</th>
            <th>Initiatives</th>
            <th>Primary Focus</th>
          </tr>
        </thead>
        <tbody>
          ${roadmap.phases.map((phase, i) => `
            <tr>
              <td><strong>${escapeHtml(phase.name)}</strong></td>
              <td>${escapeHtml(phase.timeHorizon)}</td>
              <td>${phase.linkedRecommendationIds.length}</td>
              <td>${escapeHtml(phase.narrative.slice(0, 50))}...</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="mt-3">Success Factors</h3>
      <div class="callout success">
        <ul style="margin-bottom: 0;">
          <li><strong>Executive Sponsorship:</strong> Ensure C-level commitment and visibility</li>
          <li><strong>Clear Accountability:</strong> Assign owners for each initiative</li>
          <li><strong>Regular Reviews:</strong> Weekly check-ins, monthly progress reports</li>
          <li><strong>Change Management:</strong> Communicate early and often with stakeholders</li>
          <li><strong>Quick Wins First:</strong> Build momentum with early successes</li>
        </ul>
      </div>
    </section>

    <section class="section">
      <h2>Next Steps</h2>

      <div class="callout warning">
        <div class="title">Immediate Actions</div>
        <ol style="margin-bottom: 0;">
          <li>Review this roadmap with your leadership team</li>
          <li>Identify initiative owners and sponsors</li>
          <li>Schedule kick-off meeting for Phase 1</li>
          <li>Establish progress tracking mechanisms</li>
          <li>Communicate the roadmap to key stakeholders</li>
        </ol>
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
    reportType: 'roadmap',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: roadmap.phases.length + 4,
    sections: [
      { id: 'overview', title: 'Roadmap Overview' },
      { id: 'timeline', title: 'Timeline Visualization' },
      ...roadmap.phases.map((p, i) => ({ id: `phase-${i + 1}`, title: `Phase ${i + 1}: ${p.name}` })),
      { id: 'resources', title: 'Resource Planning' },
      { id: 'next-steps', title: 'Next Steps' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'roadmap',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}
