/**
 * Deep Dive Report Builder
 *
 * Generates chapter-specific deep dive reports:
 * - Growth Engine (GE): Strategy, Sales, Marketing, Customer Experience
 * - Performance & Health (PH): Operations, Financials
 * - People & Leadership (PL): Human Resources, Leadership & Governance
 * - Resilience & Safeguards (RS): Technology, IT, Risk Management, Compliance
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ChapterCode } from '../../types/idm.types.js';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta, Phase5ReportType } from '../../types/report.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  generateDimensionCard,
  generateProgressBar,
  escapeHtml,
} from './html-template.js';
import { calculateROI } from '../../types/report.types.js';

// Import chart integration for visual charts
import {
  generateChapterDimensionBars,
  generateChapterDimensionRadar,
  getReportChartStyles,
} from './charts/index.js';

// Import world-class visual components (Phase 1.5-2)
import {
  generateEnhancedSectionHeader,
} from './components/index.js';
import {
  chapterToSectionHeader,
  dimensionToSectionHeader,
} from './utils/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Chapter metadata
 */
const CHAPTER_METADATA: Record<ChapterCode, {
  reportType: Phase5ReportType;
  reportName: string;
  subtitle: string;
  description: string;
}> = {
  GE: {
    reportType: 'deepDive:growthEngine',
    reportName: 'Growth Engine Deep Dive',
    subtitle: 'Strategy, Sales, Marketing & Customer Experience',
    description: 'This chapter analyzes your organization\'s ability to drive revenue growth through strategic positioning, sales effectiveness, marketing performance, and customer experience excellence.',
  },
  PH: {
    reportType: 'deepDive:performanceHealth',
    reportName: 'Performance & Health Deep Dive',
    subtitle: 'Operations & Financial Health',
    description: 'This chapter evaluates your organization\'s operational efficiency and financial health, including process effectiveness, resource utilization, profitability, and fiscal management.',
  },
  PL: {
    reportType: 'deepDive:peopleLeadership',
    reportName: 'People & Leadership Deep Dive',
    subtitle: 'Human Resources & Leadership',
    description: 'This chapter assesses your organization\'s human capital and leadership effectiveness, including talent management, company culture, employee engagement, and governance structures.',
  },
  RS: {
    reportType: 'deepDive:resilienceSafeguards',
    reportName: 'Resilience & Safeguards Deep Dive',
    subtitle: 'Technology, IT, Risk & Compliance',
    description: 'This chapter examines your organization\'s technological capabilities, IT infrastructure, risk management practices, and regulatory compliance status.',
  },
};

/**
 * Build deep dive report for a specific chapter
 */
export async function buildDeepDiveReport(
  ctx: ReportContext,
  options: ReportRenderOptions,
  chapterCode: ChapterCode
): Promise<GeneratedReport> {
  const chapterMeta = CHAPTER_METADATA[chapterCode];
  const chapter = ctx.chapters.find(ch => ch.code === chapterCode);

  if (!chapter) {
    throw new Error(`Chapter ${chapterCode} not found in report context`);
  }

  // Generate visual charts asynchronously
  const [dimensionBars, dimensionRadar] = await Promise.all([
    generateChapterDimensionBars(ctx, chapterCode, { width: 550, height: 220 }).catch(() => ''),
    generateChapterDimensionRadar(ctx, chapterCode, { width: 380, height: 280 }).catch(() => ''),
  ]);

  // Get chapter-specific data
  const chapterDimensions = ctx.dimensions.filter(d => d.chapterCode === chapterCode);
  const chapterFindings = ctx.findings.filter(f =>
    chapterDimensions.some(d => d.code === f.dimensionCode)
  );
  const chapterRecommendations = ctx.recommendations.filter(r =>
    chapterDimensions.some(d => d.code === r.dimensionCode)
  );
  const chapterRisks = ctx.risks.filter(r =>
    chapterDimensions.some(d => d.code === r.dimensionCode)
  );

  // Categorize findings
  const strengths = chapterFindings.filter(f => f.type === 'strength');
  const gaps = chapterFindings.filter(f => f.type === 'gap');
  const risks = chapterFindings.filter(f => f.type === 'risk');
  const opportunities = chapterFindings.filter(f => f.type === 'opportunity');

  const html = wrapHtmlDocument(`
    <style>
      /* Chart styles */
      ${getReportChartStyles()}

      .deepdive-chart-section {
        margin: 2rem 0;
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .deepdive-chart-section .chart-wrapper {
        flex: 1;
        min-width: 300px;
        max-width: 550px;
      }
    </style>

    ${generateReportHeader(ctx, chapterMeta.reportName, chapterMeta.subtitle)}

    <section class="section">
      <!-- World-Class: Enhanced Chapter Header with Percentile (Phase 1.5-2) -->
      ${generateEnhancedSectionHeader(
        chapterToSectionHeader(
          {
            code: chapter.code,
            name: chapter.name,
            score: chapter.score,
            benchmark: chapter.industryBenchmark || chapter.benchmark?.peerPercentile,
            percentile: chapter.percentileRank,
          },
          ctx.companyProfile.industry
        ),
        {
          size: 'large',
          showPercentile: true,
          showBand: true,
          showBenchmark: !!chapter.industryBenchmark,
          benchmark: chapter.industryBenchmark,
        }
      )}

      <p class="mt-3">${chapterMeta.description}</p>

      <div class="callout ${chapter.score >= 70 ? 'success' : chapter.score >= 50 ? 'warning' : 'danger'} mt-3">
        <div class="title">Chapter Assessment</div>
        <p>
          ${chapter.score >= 70
            ? 'This chapter shows strong performance. Focus on maintaining excellence and optimizing for continued growth.'
            : chapter.score >= 50
              ? 'This chapter shows moderate performance with room for improvement. Targeted interventions can yield significant gains.'
              : 'This chapter requires immediate attention. Multiple dimensions show critical gaps that impact overall business health.'
          }
        </p>
      </div>

      ${(dimensionRadar || dimensionBars) ? `
        <div class="deepdive-chart-section">
          ${dimensionRadar ? `<div class="chart-wrapper">${dimensionRadar}</div>` : ''}
          ${dimensionBars ? `<div class="chart-wrapper">${dimensionBars}</div>` : ''}
        </div>
      ` : ''}
    </section>

    <section class="section page-break">
      <h2>Dimension Scorecard</h2>

      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Score</th>
            <th>Band</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${chapterDimensions.map(dim => `
            <tr>
              <td><strong>${escapeHtml(dim.name)}</strong></td>
              <td class="score">${dim.score}/100</td>
              <td><span class="band-badge ${dim.band}">${dim.band}</span></td>
              <td style="width: 200px;">${generateProgressBar(dim.score, 100, options.brand)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    ${chapterDimensions.map(dim => `
      <section class="section page-break">
        <!-- World-Class: Enhanced Dimension Header with Percentile (Phase 1.5-2) -->
        ${generateEnhancedSectionHeader(
          dimensionToSectionHeader(
            {
              code: dim.code,
              name: dim.name,
              score: dim.score,
              benchmark: dim.industryBenchmark || dim.benchmark?.peerPercentile,
              percentile: dim.percentileRank,
            },
            ctx.companyProfile.industry
          ),
          {
            size: 'medium',
            showPercentile: true,
            showBand: true,
            showBenchmark: !!dim.industryBenchmark,
            benchmark: dim.industryBenchmark,
          }
        )}

        <p class="mb-3">${escapeHtml(dim.description)}</p>

        ${dim.subIndicators.length > 0 ? `
          <h3>Sub-Indicators</h3>
          <table class="mb-3">
            <thead>
              <tr>
                <th>Sub-Indicator</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dim.subIndicators.map(si => `
                <tr>
                  <td>${escapeHtml(si.name)}</td>
                  <td class="score">${si.score}/100</td>
                  <td>${si.band ? `<span class="band-badge ${si.band}">${si.band}</span>` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${dim.keyFindings.length > 0 ? `
          <h3>Key Strengths</h3>
          <ul class="mb-3">
            ${dim.keyFindings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
          </ul>
        ` : ''}

        ${dim.keyRisks.length > 0 ? `
          <h3>Key Risks</h3>
          <ul class="mb-3">
            ${dim.keyRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>
        ` : ''}

        ${dim.keyOpportunities.length > 0 ? `
          <h3>Key Opportunities</h3>
          <ul class="mb-3">
            ${dim.keyOpportunities.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
          </ul>
        ` : ''}
      </section>
    `).join('')}

    <section class="section page-break">
      <h2>Chapter Findings Summary</h2>

      <div class="grid grid-4 mb-3">
        <div class="score-card small" style="background: linear-gradient(135deg, #28a745, #1e7e34);">
          <div class="score-value">${strengths.length}</div>
          <div class="score-label">Strengths</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #dc3545, #c82333);">
          <div class="score-value">${gaps.length}</div>
          <div class="score-label">Gaps</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #ffc107, #d39e00);">
          <div class="score-value">${risks.length}</div>
          <div class="score-label">Risks</div>
        </div>
        <div class="score-card small" style="background: linear-gradient(135deg, #0d6efd, #0b5ed7);">
          <div class="score-value">${opportunities.length}</div>
          <div class="score-label">Opportunities</div>
        </div>
      </div>

      ${strengths.length > 0 ? `
        <h3>Strengths</h3>
        ${strengths.map(f => `
          <div class="finding-card strength">
            <div class="label">${escapeHtml(f.shortLabel)}</div>
            <div class="dimension">${escapeHtml(f.dimensionName)}</div>
            <p>${escapeHtml(f.narrative)}</p>
          </div>
        `).join('')}
      ` : ''}

      ${gaps.length > 0 ? `
        <h3 class="mt-3">Gaps</h3>
        ${gaps.map(f => `
          <div class="finding-card gap">
            <div class="label">${escapeHtml(f.shortLabel)}</div>
            <div class="dimension">${escapeHtml(f.dimensionName)}</div>
            <p>${escapeHtml(f.narrative)}</p>
          </div>
        `).join('')}
      ` : ''}

      ${risks.length > 0 ? `
        <h3 class="mt-3">Risks</h3>
        ${risks.map(f => `
          <div class="finding-card risk">
            <div class="label">${escapeHtml(f.shortLabel)}</div>
            <div class="dimension">${escapeHtml(f.dimensionName)}</div>
            <p>${escapeHtml(f.narrative)}</p>
          </div>
        `).join('')}
      ` : ''}

      ${opportunities.length > 0 ? `
        <h3 class="mt-3">Opportunities</h3>
        ${opportunities.map(f => `
          <div class="finding-card opportunity">
            <div class="label">${escapeHtml(f.shortLabel)}</div>
            <div class="dimension">${escapeHtml(f.dimensionName)}</div>
            <p>${escapeHtml(f.narrative)}</p>
          </div>
        `).join('')}
      ` : ''}
    </section>

    ${chapterRecommendations.length > 0 ? `
      <section class="section page-break">
        <h2>Chapter Recommendations</h2>

        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Recommendation</th>
              <th>Dimension</th>
              <th>Timeline</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            ${chapterRecommendations.map(rec => `
              <tr>
                <td><strong>#${rec.priorityRank}</strong></td>
                <td>
                  ${escapeHtml(rec.theme)}
                  ${rec.isQuickWin ? '<span class="band-badge Excellence" style="margin-left: 0.5rem; font-size: 0.7rem;">QW</span>' : ''}
                </td>
                <td>${escapeHtml(rec.dimensionName)}</td>
                <td>${escapeHtml(rec.horizonLabel)}</td>
                <td><strong>${calculateROI(rec.impactScore, rec.effortScore)}x</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 class="mt-3">Top Recommendation Details</h3>
        ${chapterRecommendations.slice(0, 3).map(rec => `
          <div class="card mb-2">
            <div class="card-header">
              <span class="card-title">${escapeHtml(rec.theme)}</span>
              <span class="band-badge ${rec.horizon === '90_days' ? 'Excellence' : rec.horizon === '12_months' ? 'Proficiency' : 'Attention'}">
                ${escapeHtml(rec.horizonLabel)}
              </span>
            </div>
            <div class="card-body">
              <div class="flex gap-3 mb-2">
                <span><strong>Impact:</strong> ${rec.impactScore}/100</span>
                <span><strong>Effort:</strong> ${rec.effortScore}/100</span>
                <span><strong>ROI:</strong> ${calculateROI(rec.impactScore, rec.effortScore)}x</span>
              </div>

              <h5>Action Steps:</h5>
              <ol>
                ${rec.actionSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
              </ol>

              <p class="mt-2"><strong>Expected Outcomes:</strong> ${escapeHtml(rec.expectedOutcomes)}</p>
            </div>
          </div>
        `).join('')}
      </section>
    ` : ''}

    ${chapterRisks.length > 0 ? `
      <section class="section">
        <h2>Chapter Risk Assessment</h2>

        ${chapterRisks.map(risk => `
          <div class="risk-card ${typeof risk.severity === 'number' && risk.severity >= 7 ? 'high' : typeof risk.severity === 'number' && risk.severity >= 4 ? 'medium' : 'low'}">
            <div class="header">
              <span class="category">${escapeHtml(risk.category || risk.dimensionName)}</span>
              <span class="priority-badge ${typeof risk.severity === 'number' && risk.severity >= 7 ? 'high' : 'medium'}">
                Severity: ${risk.severity}
              </span>
            </div>
            <p>${escapeHtml(risk.narrative)}</p>
          </div>
        `).join('')}
      </section>
    ` : ''}

    <section class="section">
      <h2>Next Steps</h2>

      <div class="callout success">
        <div class="title">Recommended Actions for ${escapeHtml(chapter.name)}</div>
        <ol style="margin-bottom: 0;">
          <li>Review the dimension analysis to understand specific strengths and gaps</li>
          <li>Prioritize quick wins for immediate impact</li>
          <li>Address critical risks within the next 30-90 days</li>
          <li>Develop detailed implementation plans for top recommendations</li>
          <li>Establish KPIs and tracking mechanisms for ongoing improvement</li>
        </ol>
      </div>
    </section>

    ${generateReportFooter(ctx)}
  `, {
    title: `${chapterMeta.reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    ctx: ctx,
  });

  // Write HTML file
  const htmlFilename = `deep-dive-${chapterCode.toLowerCase()}.html`;
  const htmlPath = path.join(options.outputDir, htmlFilename);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: chapterMeta.reportType,
    reportName: chapterMeta.reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: chapter.score,
    healthBand: chapter.band,
    pageSuggestionEstimate: chapterDimensions.length * 2 + 4,
    sections: [
      { id: 'overview', title: 'Chapter Overview' },
      { id: 'scorecard', title: 'Dimension Scorecard' },
      ...chapterDimensions.map(d => ({ id: `dim-${d.code}`, title: d.name })),
      { id: 'findings', title: 'Findings Summary' },
      { id: 'recommendations', title: 'Recommendations' },
      { id: 'risks', title: 'Risk Assessment' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaFilename = `deep-dive-${chapterCode.toLowerCase()}.meta.json`;
  const metaPath = path.join(options.outputDir, metaFilename);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: chapterMeta.reportType,
    reportName: chapterMeta.reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}
