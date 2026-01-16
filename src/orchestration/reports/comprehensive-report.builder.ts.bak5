/**
 * Comprehensive Assessment Report Builder
 *
 * Generates a full assessment report with all sections:
 * - Executive Summary with AI-generated narrative
 * - Health Scorecard
 * - Dimension Analysis with Tier 1 & Tier 2 narratives
 * - Strategic Synthesis (cross-dimensional analysis)
 * - Findings
 * - Recommendations
 * - Risks
 * - Roadmap
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta } from '../../types/report.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  generateScorecardSection,
  generateFindingsSection,
  generateRecommendationsSection,
  generateQuickWinsSection,
  generateRisksSection,
  generateRoadmapSection,
  generateChapterSection,
  generateFinancialSection,
  generateTableOfContents,
  escapeHtml,
  getTrajectoryIcon,
} from './html-template.js';
import { NarrativeExtractionService } from '../../services/narrative-extraction.service.js';
import { logger } from '../../utils/logger.js';

// Import visual enhancement components
import {
  generateKeyTakeaways,
  generateExecutiveHighlights,
  generateEvidenceCitationsForDimension,
  generateInsightCardWithEvidence,
  generateChapterBenchmarkCallout,
  generateOverallBenchmarkCallout,
  generateBenchmarkSummaryTable,
  renderComprehensiveRelationshipStatement,
  buildLegalTermsPage,
  // Clickwrap Legal UX Components
  generateClickwrapModal,
  generateClickwrapLegalContent,
  generateAcceptanceBanner,
  generateLegalAccordion,
  getDefaultLegalSections,
  type ClickwrapConfig,
} from './components/index.js';
import {
  getChapterIcon,
  getDimensionIcon,
  generateChapterHeaderHtml,
  generateDimensionHeaderHtml,
} from './constants/index.js';

// Import chart integration for visual charts
import {
  generateChapterOverviewRadar,
  generateAllChapterScoreBars,
  generateScoreBandDistribution,
  generateBenchmarkComparison,
  generateChapterDimensionBars,
  getReportChartStyles,
} from './charts/index.js';

// Import Phase 5 visualization utilities
import {
  sanitizeOrphanedVisualizationHeaders,
  generateAllVisualizations,
  countVisualizations,
  type VisualizationBundle,
  // New Phase 5 Visualization Mappers
  mapDimensionsToGauges,
  mapChaptersToGauges,
  mapRisksToRiskMatrix,
  mapRoadmapToRoadmapPhases,
  // Enhanced markdown parser
  parseMarkdownToHTML,
  validateReportContent,
  logValidationResults,
  // Data sanitization utilities
  resolveDimensionName,
} from './utils/index.js';

// Import risk heatmap component
import { renderRiskHeatmapFromRisks } from './components/visual/risk-heatmap.component.js';

// Import Phase 5 Visual Components Library
import {
  generateScorecardGrid,
  chaptersToScorecardItems,
  generateDimensionDetailCard,
  dimensionToDetailProps,
  generateFindingsGrid,
  findingsToGridProps,
  generateRiskMatrix,
  risksToMatrixItems,
  generateRecommendationsList,
  recommendationsToCardProps,
  generateRoadmapTimeline as generateRoadmapTimelineComponent,
  roadmapPhasesToDisplay,
  generateExecutiveHighlightsRow,
  generateKeyTakeawaysBox,
  generateChapterSummary,
  generateQuickWinsSummary,
  generateBenchmarkComparisonTable,
} from './components/index.js';

// Import Phase 5 SVG Chart Generators
import {
  generateRadarChartSVG,
  generateHorizontalBarChartSVG,
  generateDonutChartSVG,
  generateGaugeChartSVG,
  wrapChartInContainer,
} from './charts/index.js';

// Import KPI dashboard and roadmap components
import { renderKPIDashboard, renderQuickStatsRow } from './components/visual/kpi-dashboard.component.js';
import { renderRoadmapTimeline, type RoadmapPhase } from './components/visual/roadmap-timeline.component.js';
import { getScoreBand, type ScoreBand } from './utils/color-utils.js';

/**
 * Build comprehensive assessment report with integrated narrative content
 */
export async function buildComprehensiveReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'comprehensive';
  const reportName = 'Comprehensive Assessment Report';

  logger.info('Building comprehensive report with narrative integration');

  // Get narrative content from context
  const narratives = ctx.narrativeContent;
  const hasNarratives = narratives && narratives.metadata?.contentSufficient;

  if (!hasNarratives) {
    logger.warn('No narrative content available, using structured data only');
  }

  // Define sections for TOC with anchor IDs matching section-mapping.ts
  const sections = [
    { id: 'executive-summary', title: 'Executive Summary' },
    { id: 'scorecard', title: 'Business Health Scorecard' },
    { id: 'chapter-growth-engine', title: 'Chapter 1: Growth Engine Deep Dive' },
    { id: 'chapter-performance-health', title: 'Chapter 2: Performance & Health Deep Dive' },
    { id: 'chapter-people-leadership', title: 'Chapter 3: People & Leadership Deep Dive' },
    { id: 'chapter-resilience-safeguards', title: 'Chapter 4: Resilience & Safeguards Deep Dive' },
    { id: 'cross-dimensional', title: 'Cross-Dimensional Synthesis' },
    { id: 'strategic-recommendations', title: 'Strategic Recommendations' },
    { id: 'risk-assessment', title: 'Risk Assessment' },
    { id: 'growth', title: 'Growth Opportunities' },
    { id: 'implementation-roadmap', title: 'Implementation Roadmap' },
    { id: 'findings', title: 'Detailed Findings' },
    { id: 'quick-wins', title: 'Quick Wins' },
    { id: 'financial-impact', title: 'Financial Impact Analysis' },
  ];

  // Generate narrative styles for proper markdown rendering
  const narrativeStyles = generateNarrativeStyles(options.brand.primaryColor, options.brand.accentColor);

  // Generate charts asynchronously
  logger.info('Generating visual charts for comprehensive report');
  const [
    chapterOverviewRadar,
    chapterScoreBars,
    scoreBandDistribution,
    benchmarkComparison,
    geDimensionBars,
    phDimensionBars,
    plDimensionBars,
    rsDimensionBars,
  ] = await Promise.all([
    generateChapterOverviewRadar(ctx).catch(() => ''),
    generateAllChapterScoreBars(ctx).catch(() => ''),
    generateScoreBandDistribution(ctx).catch(() => ''),
    generateBenchmarkComparison(ctx).catch(() => ''),
    generateChapterDimensionBars(ctx, 'GE').catch(() => ''),
    generateChapterDimensionBars(ctx, 'PH').catch(() => ''),
    generateChapterDimensionBars(ctx, 'PL').catch(() => ''),
    generateChapterDimensionBars(ctx, 'RS').catch(() => ''),
  ]);

  // Map chapter codes to their dimension bar charts
  const chapterDimensionCharts: Record<string, string> = {
    'GE': geDimensionBars,
    'PH': phDimensionBars,
    'PL': plDimensionBars,
    'RS': rsDimensionBars,
  };

  // Generate Phase 5 visualizations
  logger.info('Generating Phase 5 enhanced visualizations');
  const phase5Visuals = generatePhase5Visualizations(ctx);

  // Check Beta mode status from context
  const betaDisableBlur = ctx.legalAccess?.betaDisableBlur ?? false;
  const termsVersion = ctx.legalAccess?.termsVersion || '2025.1';

  // Generate Clickwrap Legal UX Components (only when NOT in Beta mode)
  const generatedDate = new Date(ctx.metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let clickwrapModal = '';
  let acceptanceBanner = '';
  let legalAccordion = '';

  if (!betaDisableBlur) {
    // PRODUCTION MODE: Generate full legal protection components
    const clickwrapConfig: ClickwrapConfig = {
      reportId: ctx.runId,
      reportType: 'comprehensive',
      companyName: ctx.companyProfile.name,
      termsVersion,
      generatedDate,
    };

    // Generate legal content for clickwrap modal
    const clickwrapLegalContent = generateClickwrapLegalContent();

    // Generate clickwrap modal (gates content until accepted)
    clickwrapModal = generateClickwrapModal(clickwrapConfig, clickwrapLegalContent);

    // Generate acceptance banner (compact replacement for legal block)
    acceptanceBanner = generateAcceptanceBanner({
      termsVersion,
      showViewTermsLink: true,
    });

    // Generate legal accordion (collapsible sections at bottom)
    const legalSections = getDefaultLegalSections();
    legalAccordion = generateLegalAccordion(legalSections);

    logger.info('Production mode: Full legal protection enabled');
  } else {
    logger.info('Beta mode: Clickwrap/blur protection bypassed');
  }

  // Build HTML content with integrated narratives
  const contentSections = [
    // Clickwrap Modal (rendered outside report-container, gates access)
    clickwrapModal,

    generateReportHeader(ctx, reportName, 'Complete Business Health Assessment'),

    // Compact Terms Acceptance Banner (replaces lengthy legal block)
    acceptanceBanner,

    // Relationship statement explaining how Owner's and Comprehensive reports work together
    renderComprehensiveRelationshipStatement(),

    options.includeTOC ? generateTableOfContents(sections) : '',

    // Executive Summary with narrative and Phase 5 dashboard (with anchor ID for cross-references)
    `<section id="executive-summary" class="section">${generateExecutiveSummaryWithNarrative(ctx, narratives, phase5Visuals)}</section>`,

    // Scorecard with visual charts and benchmark summary
    `<section id="scorecard" class="section page-break">
      ${generateScorecardSection(ctx)}

      <!-- Phase 5: Scorecard Grid -->
      ${phase5Visuals.scorecardGrid ? `
        <div class="phase5-scorecard-grid" style="margin: 2rem 0;">
          <h3 style="color: ${options.brand.primaryColor}; margin: 0 0 1.5rem 0; font-family: 'Montserrat', sans-serif;">Chapter Performance Scorecard</h3>
          ${phase5Visuals.scorecardGrid}
        </div>
      ` : ''}

      <!-- Visual Charts Dashboard -->
      <div class="scorecard-charts">
        <h3 style="color: ${options.brand.primaryColor}; margin: 2rem 0 1rem 0; font-family: 'Montserrat', sans-serif;">Visual Performance Overview</h3>
        <div class="chart-dashboard">
          <div class="chart-row">
            <div class="chart-main">${chapterOverviewRadar}</div>
            <div class="chart-side">${scoreBandDistribution}</div>
          </div>
          <div class="chart-full">${chapterScoreBars}</div>
          ${benchmarkComparison ? `<div class="chart-full">${benchmarkComparison}</div>` : ''}
        </div>
      </div>

      <!-- Phase 5: Benchmark Comparison Table -->
      ${phase5Visuals.benchmarkTable ? `
        <div class="phase5-benchmark-table" style="margin: 2rem 0;">
          ${phase5Visuals.benchmarkTable}
        </div>
      ` : generateBenchmarkSummaryTable(ctx)}
    </section>`,

    // Chapter Deep Dives with proper anchor IDs matching section-mapping.ts (now with dimension charts)
    narratives ? `
      <section id="chapter-growth-engine" class="section page-break">${generateNarrativeSection('Chapter 1: Growth Engine Deep Dive', narratives.phase1.tier1.revenueEngine, getChapterScore(ctx, 'GE'), 'GE', ctx, chapterDimensionCharts['GE'])}</section>
      <section id="chapter-performance-health" class="section page-break">${generateNarrativeSection('Chapter 2: Performance & Health Deep Dive', narratives.phase1.tier1.operationalExcellence, getChapterScore(ctx, 'PH'), 'PH', ctx, chapterDimensionCharts['PH'])}</section>
      <section id="chapter-people-leadership" class="section page-break">${generateNarrativeSection('Chapter 3: People & Leadership Deep Dive', narratives.phase1.tier1.peopleLeadership, getChapterScore(ctx, 'PL'), 'PL', ctx, chapterDimensionCharts['PL'])}</section>
      <section id="chapter-resilience-safeguards" class="section page-break">${generateNarrativeSection('Chapter 4: Resilience & Safeguards Deep Dive', narratives.phase1.tier1.complianceSustainability, getChapterScore(ctx, 'RS'), 'RS', ctx, chapterDimensionCharts['RS'])}</section>
    ` : '',

    // Cross-Dimensional Synthesis (Phase 2) with Phase 5 visualizations
    narratives ? `
      <section id="cross-dimensional" class="section page-break">${generateNarrativeSection('Cross-Dimensional Strategic Synthesis', narratives.phase2.crossDimensional, null)}</section>
      <section id="strategic-recommendations" class="section page-break">${generateNarrativeSection('Strategic Recommendations', narratives.phase2.strategicRecommendations, null)}</section>
      <section id="risk-assessment" class="section page-break">${generateRiskAssessmentWithHeatmap(ctx, narratives.phase2.consolidatedRisks, phase5Visuals.riskHeatmap, phase5Visuals.riskMatrix)}</section>
      <section id="growth" class="section page-break">${generateNarrativeSection('Growth Opportunities', narratives.phase2.growthOpportunities, null)}</section>
      <section id="implementation-roadmap" class="section page-break">${generateImplementationRoadmapWithTimeline(ctx, narratives.phase2.implementationRoadmap, phase5Visuals.roadmapTimeline)}</section>
    ` : `
      <section id="risk-assessment" class="section page-break">${generateRiskAssessmentWithHeatmap(ctx, '', phase5Visuals.riskHeatmap, phase5Visuals.riskMatrix)}</section>
      <section id="implementation-roadmap" class="section page-break">${generateImplementationRoadmapWithTimeline(ctx, '', phase5Visuals.roadmapTimeline)}</section>
    `,

    // Detailed sections with Phase 5 enhancements
    `<section id="findings" class="section page-break">
      <div class="section-header">
        <h2>Detailed Findings</h2>
      </div>
      <!-- Phase 5: Findings Grid -->
      ${phase5Visuals.findingsGrid ? `
        <div class="phase5-findings-grid" style="margin: 1.5rem 0;">
          ${phase5Visuals.findingsGrid}
        </div>
      ` : generateFindingsSection(ctx)}
    </section>`,
    `<section id="recommendations" class="section page-break">
      <div class="section-header">
        <h2>Strategic Recommendations</h2>
      </div>
      <!-- Phase 5: Recommendations List -->
      ${phase5Visuals.recommendationsList ? `
        <div class="phase5-recommendations" style="margin: 1.5rem 0;">
          ${phase5Visuals.recommendationsList}
        </div>
      ` : generateRecommendationsSection(ctx)}
    </section>`,
    `<section id="quick-wins" class="section page-break">
      <div class="section-header">
        <h2>Quick Wins</h2>
        <p class="section-subtitle" style="color: #666; margin-top: 0.5rem;">High-impact, low-effort actions for immediate results</p>
      </div>
      <!-- Phase 5: Quick Wins Summary -->
      ${phase5Visuals.quickWinsSummary ? `
        <div class="phase5-quick-wins" style="margin: 1.5rem 0;">
          ${phase5Visuals.quickWinsSummary}
        </div>
      ` : generateQuickWinsSection(ctx)}
    </section>`,
    `<section id="financial-impact" class="section page-break">${generateFinancialSection(ctx)}</section>`,

    // Legal Accordion (collapsible terms at bottom, collapsed by default)
    legalAccordion,

    // Footer with word count
    generateReportFooterWithStats(ctx, narratives),
  ];

  const rawHtml = wrapHtmlDocument(contentSections.join('\n'), {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: narrativeStyles,
    legalAccess: ctx.legalAccess,
    ctx: ctx,
  });

  // Sanitize orphaned visualization headers from AI-generated content
  const { html, removedCount, removedItems } = sanitizeOrphanedVisualizationHeaders(rawHtml);

  if (removedCount > 0) {
    logger.info({ removedCount, removedItems }, 'Sanitized orphaned visualization headers');
  }

  // Count total visualizations
  const visualCount = countVisualizations(html);
  logger.info({ visualCount }, 'Total visualizations in report');

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: 'comprehensive',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: estimatePageCount(html),
    sections,
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  logger.info({
    contentWords: narratives?.metadata?.totalWords || 0,
    overallScore: ctx.overallHealth.score,
    visualCount
  }, 'Comprehensive report built');

  return {
    reportType: 'comprehensive',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

/**
 * Generate executive summary with integrated narrative content and Phase 5 visualizations
 */
function generateExecutiveSummaryWithNarrative(ctx: ReportContext, narratives: any, phase5Visuals?: Phase5Visuals): string {
  const { overallHealth, executiveSummary, keyImperatives } = ctx;
  const rawNarrativeHtml = narratives?.phase3?.executive
    ? parseMarkdownToHTML(narratives.phase3.executive, { maxBoldPerParagraph: 3, maxListItems: 8 })
    : '';

  // Sanitize narrative content to remove orphaned visualization headers
  const narrativeHtml = rawNarrativeHtml
    ? sanitizeOrphanedVisualizationHeaders(rawNarrativeHtml).html
    : '';

  // Generate Key Takeaways box
  const keyTakeawaysHtml = generateKeyTakeaways(ctx);

  // Generate executive highlights
  const executiveHighlightsHtml = generateExecutiveHighlights(ctx);

  // Generate overall benchmark callout
  const overallBenchmarkHtml = generateOverallBenchmarkCallout(ctx);

  return `
    <section class="section">
      <div class="section-header">
        <h2>Executive Summary</h2>
      </div>

      <div class="health-score-display">
        <div class="health-score-circle">
          <span class="score">${overallHealth.score}</span>
          <span class="out-of">/ 100</span>
        </div>
        <div class="health-score-details">
          <p class="status">${escapeHtml(overallHealth.status)}</p>
          <p class="trajectory">
            ${getTrajectoryIcon(overallHealth.trajectory)}
            Trajectory: ${overallHealth.trajectory}
          </p>
          <p class="band">
            <span class="band-badge ${overallHealth.band}">${overallHealth.band}</span>
          </p>
        </div>
      </div>

      <!-- Phase 5: Executive Highlights Row -->
      ${phase5Visuals?.executiveHighlightsRow ? `
        <div class="phase5-highlights-row" style="margin: 1.5rem 0;">
          ${phase5Visuals.executiveHighlightsRow}
        </div>
      ` : executiveHighlightsHtml}

      <!-- Phase 5: Overall Gauge + Radar Dashboard -->
      ${phase5Visuals?.overallGaugeChart || phase5Visuals?.chapterRadarChart ? `
        <div class="executive-charts-dashboard" style="display: flex; gap: 2rem; margin: 2rem 0; flex-wrap: wrap; align-items: flex-start;">
          ${phase5Visuals.overallGaugeChart ? `
            <div class="gauge-container" style="flex: 0 0 auto;">
              ${phase5Visuals.overallGaugeChart}
            </div>
          ` : ''}
          ${phase5Visuals.chapterRadarChart ? `
            <div class="radar-container" style="flex: 1; min-width: 350px;">
              ${phase5Visuals.chapterRadarChart}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Phase 5: Critical Metrics Dashboard -->
      ${phase5Visuals?.executiveDashboard ? `
        <div class="executive-metrics-dashboard" style="margin: 2rem 0;">
          ${phase5Visuals.executiveDashboard}
        </div>
      ` : ''}

      <!-- Phase 5: Key Stats Row -->
      ${phase5Visuals?.keyStatsRow ? `
        <div class="key-stats-row" style="margin: 1.5rem 0;">
          ${phase5Visuals.keyStatsRow}
        </div>
      ` : ''}

      <!-- Phase 5: Key Takeaways Box -->
      ${phase5Visuals?.keyTakeawaysBox || keyTakeawaysHtml}

      <!-- Overall Benchmark Callout -->
      ${overallBenchmarkHtml}

      ${narrativeHtml ? `
        <div class="narrative-content">
          ${narrativeHtml}
        </div>
      ` : executiveSummary ? `
        <div class="mb-3">
          <p>${escapeHtml(executiveSummary.overview)}</p>
        </div>
        <div class="grid grid-2">
          <div class="card">
            <h4>Key Strengths</h4>
            <ul>
              ${executiveSummary.keyStrengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
          <div class="card">
            <h4>Priority Areas</h4>
            <ul>
              ${executiveSummary.keyPriorities.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      ${keyImperatives.length > 0 ? `
        <div class="callout warning mt-3">
          <div class="title">Strategic Imperatives</div>
          <ul>
            ${keyImperatives.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </section>
  `;
}

/**
 * Generate a narrative section with optional score badge, benchmark callout, and chart
 */
function generateNarrativeSection(
  title: string,
  content: string,
  score: number | null,
  chapterCode?: string,
  ctx?: ReportContext,
  chartHtml?: string
): string {
  const narrativeHtml = parseMarkdownToHTML(content, { maxBoldPerParagraph: 3, maxListItems: 8 });

  // Generate chapter header with icon if chapter code provided
  let headerHtml: string;
  if (chapterCode) {
    headerHtml = generateChapterHeaderHtml(
      chapterCode,
      title,
      score ?? undefined,
      ctx?.companyProfile?.industry ? `${ctx.companyProfile.industry} Industry Analysis` : undefined
    );
  } else {
    headerHtml = `
      <div class="section-header">
        <h2>${escapeHtml(title)}</h2>
        ${score !== null ? `<span class="section-score">${score}/100</span>` : ''}
      </div>
    `;
  }

  // Generate benchmark callout for chapters
  let benchmarkHtml = '';
  if (chapterCode && ctx) {
    const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
    if (chapter) {
      benchmarkHtml = generateChapterBenchmarkCallout(chapter, ctx.companyProfile.industry);
    }
  }

  return `
    <section class="section page-break">
      ${headerHtml}
      ${benchmarkHtml}
      ${chartHtml ? `
        <div class="chapter-dimension-chart">
          <h4 style="font-size: 0.95rem; color: #666; margin: 1.5rem 0 1rem 0;">Dimension Score Breakdown</h4>
          ${chartHtml}
        </div>
      ` : ''}
      <div class="narrative-content">
        ${narrativeHtml}
      </div>
    </section>
  `;
}

/**
 * Get chapter score by chapter code
 */
function getChapterScore(ctx: ReportContext, chapterCode: string): number | null {
  const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
  return chapter ? chapter.score : null;
}

/**
 * Generate report footer with statistics
 */
function generateReportFooterWithStats(ctx: ReportContext, narratives: any): string {
  const year = new Date().getFullYear();
  const wordCount = narratives?.metadata?.totalWords || 0;

  return `
    <footer class="report-footer">
      <p>&copy; ${year} BizHealth.ai - Confidential Business Assessment Report</p>
      <p>Assessment ID: ${ctx.runId}</p>
      ${wordCount > 0 ? `<p>Narrative Content: ${wordCount.toLocaleString()} words</p>` : ''}
    </footer>
  `;
}

/**
 * Generate CSS styles for narrative content and visual enhancements
 */
function generateNarrativeStyles(primaryColor: string, accentColor: string): string {
  return `
    /* Narrative Content Styles */
    .narrative-content {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
      border-left: 4px solid ${accentColor};
    }

    .section-score {
      background: ${primaryColor};
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 1rem;
      font-weight: 600;
    }

    .narrative-content .bh-h2 {
      font-size: 1.5rem;
      color: ${primaryColor};
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .narrative-content .bh-h3 {
      font-size: 1.25rem;
      color: ${primaryColor};
      margin-top: 1.25em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-h4 {
      font-size: 1.1rem;
      color: #555;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-h5 {
      font-size: 1rem;
      color: #666;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-p {
      margin: 1em 0;
      line-height: 1.7;
    }

    .narrative-content .bh-ul,
    .narrative-content .bh-ol {
      margin: 1em 0;
      padding-left: 1.5em;
    }

    .narrative-content .bh-li,
    .narrative-content .bh-li-num {
      margin: 0.5em 0;
      line-height: 1.6;
    }

    .narrative-content .bh-empty {
      color: #999;
      font-style: italic;
    }

    .narrative-content strong {
      color: ${primaryColor};
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* ============================================
       VISUAL ENHANCEMENT STYLES
       ============================================ */

    /* KEY TAKEAWAYS BOX */
    .key-takeaways {
      background: linear-gradient(135deg, ${primaryColor} 0%, #2a3366 100%);
      color: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 4px 12px rgba(33, 38, 83, 0.3);
    }

    .key-takeaways .takeaway-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid rgba(150, 148, 35, 0.5);
      padding-bottom: 0.75rem;
    }

    .key-takeaways .takeaway-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin: 0.75rem 0;
      padding: 0.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
    }

    .key-takeaways .takeaway-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .key-takeaways .takeaway-text {
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* EVIDENCE CITATION BLOCKS */
    .evidence-citation {
      background: #f8f9fa;
      border-left: 4px solid ${accentColor};
      border-radius: 0 8px 8px 0;
      padding: 0.75rem 1rem;
      margin: 0.75rem 0 1.25rem 0;
      font-size: 0.9rem;
    }

    .evidence-citation .citation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 0.5rem;
    }

    .evidence-citation .citation-icon {
      color: ${accentColor};
    }

    .evidence-citation .question-ref {
      color: #666;
      font-size: 0.85rem;
    }

    .evidence-citation .response-text {
      color: #333;
      font-style: italic;
      margin: 0.5rem 0;
      padding-left: 1rem;
      border-left: 2px solid #ddd;
    }

    .evidence-citation .benchmark-comparison {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e0e0e0;
      font-size: 0.85rem;
    }

    .evidence-citation .benchmark-comparison.above { color: #28a745; }
    .evidence-citation .benchmark-comparison.below { color: #dc3545; }
    .evidence-citation .benchmark-comparison.at { color: #6c757d; }

    /* BENCHMARK CALLOUT BOXES */
    .benchmark-callout {
      background: #e7f3ff;
      border: 1px solid #b8daff;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .benchmark-callout .benchmark-icon {
      font-size: 2rem;
      color: ${primaryColor};
    }

    .benchmark-callout .benchmark-content { flex: 1; }

    .benchmark-callout .benchmark-label {
      font-size: 0.85rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .benchmark-callout .benchmark-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .benchmark-callout .benchmark-context {
      font-size: 0.9rem;
      color: #555;
    }

    /* COLOR-CODED INSIGHT CARDS */
    .insight-card {
      border-radius: 8px;
      padding: 1rem;
      margin: 0.75rem 0;
      border-left: 4px solid;
    }

    .insight-card.strength { background: #d4edda; border-left-color: #28a745; }
    .insight-card.strength .insight-label { color: #155724; }

    .insight-card.weakness { background: #f8d7da; border-left-color: #dc3545; }
    .insight-card.weakness .insight-label { color: #721c24; }

    .insight-card.opportunity { background: #cce5ff; border-left-color: #0d6efd; }
    .insight-card.opportunity .insight-label { color: #004085; }

    .insight-card.warning { background: #fff3cd; border-left-color: #ffc107; }
    .insight-card.warning .insight-label { color: #856404; }

    .insight-card .insight-label {
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .insight-card .insight-title {
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 0.5rem;
    }

    .insight-card .insight-detail {
      font-size: 0.95rem;
      color: #333;
    }

    /* CHAPTER HEADER ENHANCEMENTS */
    .chapter-header-enhanced {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid ${accentColor};
    }

    .chapter-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: linear-gradient(135deg, ${primaryColor} 0%, #2a3366 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 2px 8px rgba(33, 38, 83, 0.3);
    }

    .chapter-title-group { flex: 1; }

    .chapter-title-group h2 {
      margin: 0;
      font-size: 1.75rem;
      color: ${primaryColor};
      page-break-before: auto;
    }

    .chapter-subtitle {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.25rem;
    }

    /* DIMENSION HEADER */
    .dimension-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dimension-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: ${primaryColor};
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    /* EXECUTIVE HIGHLIGHTS */
    .executive-highlights {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .highlight-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      border-top: 4px solid ${primaryColor};
    }

    .highlight-card .highlight-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .highlight-card .highlight-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .highlight-card .highlight-label {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.25rem;
    }

    /* SCORE BAR ENHANCEMENTS */
    .score-bar-container {
      background: #e9ecef;
      border-radius: 12px;
      height: 24px;
      overflow: hidden;
      margin: 0.5rem 0;
    }

    .score-bar-fill {
      height: 100%;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.75rem;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      transition: width 0.3s ease;
    }

    .score-bar-fill.critical { background: linear-gradient(90deg, #dc3545, #e4606d); }
    .score-bar-fill.attention { background: linear-gradient(90deg, #ffc107, #ffcd39); color: #333; }
    .score-bar-fill.proficiency { background: linear-gradient(90deg, ${accentColor}, #b0ad2e); }
    .score-bar-fill.excellence { background: linear-gradient(90deg, #28a745, #34ce57); }

    /* FINDINGS GRID LAYOUT */
    .findings-grid {
      margin-top: 1rem;
    }

    .insight-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .insight-cards-container .insight-card {
      margin: 0;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .executive-highlights { grid-template-columns: repeat(2, 1fr); }
      .benchmark-callout { flex-direction: column; text-align: center; }
      .key-takeaways .takeaway-item { flex-direction: column; align-items: flex-start; }
      .insight-cards-container { grid-template-columns: 1fr; }
    }

    /* PRINT OPTIMIZATIONS */
    @media print {
      .key-takeaways {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .evidence-citation {
        border-left-color: ${accentColor} !important;
        background: #f8f9fa !important;
      }

      .insight-card { page-break-inside: avoid; }
      .benchmark-callout { page-break-inside: avoid; }

      .chapter-icon, .dimension-icon {
        background: ${primaryColor} !important;
      }

      .executive-highlights { grid-template-columns: repeat(4, 1fr); }
    }

    /* ================================================================
       OPUS 4.5 MARKDOWN ELEMENT STYLING
       Added 2025-12-02 to support rich markdown output (tables, ASCII art, etc.)
       ================================================================ */

    /* Responsive Table Container */
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 1.5rem 0;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .bh-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
      min-width: 400px;
      background: #fff;
    }

    .bh-table th {
      background: ${primaryColor};
      color: #fff;
      font-weight: 600;
      padding: 0.75rem 1rem;
      text-align: left;
      font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
      white-space: nowrap;
    }

    .bh-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
      color: #333;
    }

    .bh-table tr:nth-child(even) {
      background: #f8f9fa;
    }

    .bh-table tr:hover {
      background: #f0f4f8;
    }

    .bh-table td:first-child {
      font-weight: 500;
      color: ${primaryColor};
    }

    /* ASCII Visualization Container */
    .visual-framework {
      background: ${primaryColor};
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(33, 38, 83, 0.2);
    }

    .ascii-viz {
      color: #e8e8e8;
      font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
      font-size: 0.75rem;
      line-height: 1.3;
      white-space: pre;
      margin: 0;
      overflow-x: auto;
    }

    /* Regular Code Block */
    .bh-code {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.9rem;
      margin: 1rem 0;
      font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
    }

    .bh-code code {
      background: transparent;
      padding: 0;
    }

    /* Blockquote/Callout */
    .bh-callout {
      background: #f8f9fa;
      border-left: 4px solid ${accentColor};
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #555;
      border-radius: 0 8px 8px 0;
    }

    .bh-callout p {
      margin: 0;
    }

    .bh-callout strong {
      color: ${primaryColor};
    }

    /* Section Divider */
    .bh-section-divider {
      border: none;
      height: 2px;
      background: linear-gradient(to right, ${primaryColor}, ${accentColor}, ${primaryColor});
      margin: 2rem 0;
    }

    /* Typography - ensure consistency */
    .bh-h1 {
      font-size: 2rem;
      color: ${primaryColor};
      margin-top: 2em;
      margin-bottom: 0.75em;
      font-weight: 700;
      font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
      border-bottom: 3px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .bh-strong {
      color: ${primaryColor};
      font-weight: 600;
    }

    /* Print styles for markdown elements */
    @media print {
      .visual-framework {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-inside: avoid;
      }

      .ascii-viz {
        color: #e8e8e8 !important;
        font-size: 0.65rem;
      }

      .bh-table th {
        background: ${primaryColor} !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .bh-table tr:nth-child(even) {
        background: #f8f9fa !important;
      }

      .table-responsive {
        overflow: visible;
        box-shadow: none;
      }

      .bh-section-divider {
        background: ${primaryColor} !important;
      }

      .bh-callout {
        border-left-color: ${accentColor} !important;
        page-break-inside: avoid;
      }

      .bh-code {
        page-break-inside: avoid;
      }
    }

    /* ================================================================
       CHART DASHBOARD STYLES
       Added for server-side rendered Chart.js visualizations
       ================================================================ */

    .scorecard-charts {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #fafbfc;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .chart-dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .chart-row {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .chart-main {
      flex: 2;
      min-width: 350px;
    }

    .chart-side {
      flex: 1;
      min-width: 280px;
    }

    .chart-full {
      width: 100%;
    }

    .chapter-dimension-chart {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    /* Import chart component styles */
    ${getReportChartStyles()}

    @media (max-width: 768px) {
      .chart-row {
        flex-direction: column;
      }

      .chart-main,
      .chart-side {
        min-width: 100%;
      }
    }

    @media print {
      .scorecard-charts {
        background: #fafbfc !important;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .chart-dashboard {
        page-break-inside: avoid;
      }

      .chapter-dimension-chart {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Estimate page count from HTML content
 */
function estimatePageCount(html: string): number {
  // Rough estimate: ~3000 characters per page
  return Math.ceil(html.length / 3000);
}

// ============================================================================
// PHASE 5 VISUALIZATION INTEGRATION
// ============================================================================

/**
 * Phase 5 Visualizations Bundle (Enhanced)
 */
interface Phase5Visuals {
  // Core dashboards
  executiveDashboard: string;
  keyStatsRow: string;
  // Scorecard components
  scorecardGrid: string;
  chapterRadarChart: string;
  overallGaugeChart: string;
  // Chapter gauges (individual gauges for each chapter)
  chapterGauges: string;
  // Risk visualizations
  riskHeatmap: string;
  riskMatrix: string;
  riskSeverityDonut: string;
  // Roadmap & Recommendations
  roadmapTimeline: string;
  roadmapTimelineSVG: string;
  recommendationsList: string;
  recommendationsDonut: string;
  quickWinsSummary: string;
  // Financial & Impact
  investmentDonut: string;
  impactBars: string;
  // Findings & Benchmarks
  findingsGrid: string;
  benchmarkTable: string;
  benchmarkBars: string;
  // Executive highlights
  executiveHighlightsRow: string;
  keyTakeawaysBox: string;
}

/**
 * Generate Phase 5 enhanced visualizations from ReportContext
 */
function generatePhase5Visualizations(ctx: ReportContext): Phase5Visuals {
  logger.info('Generating Phase 5 enhanced visualizations bundle');

  // Generate executive metrics dashboard
  const executiveDashboard = generateExecutiveMetricsDashboard(ctx);

  // Generate key stats row
  const keyStatsRow = generateKeyStatsRow(ctx);

  // Generate scorecard grid from chapters
  const scorecardGrid = generateScorecardGrid(chaptersToScorecardItems(ctx.chapters, ctx.dimensions));

  // Generate chapter radar chart (SVG)
  const chapterRadarChart = generateChapterRadarChartViz(ctx);

  // Generate overall health gauge chart (SVG)
  const overallGaugeChart = generateOverallGaugeViz(ctx);

  // Generate risk heatmap
  const riskHeatmap = ctx.risks.length > 0 ? renderRiskHeatmapFromRisks(ctx.risks) : '';

  // Generate risk matrix visualization
  const riskMatrix = ctx.risks.length > 0 ? generateRiskMatrix(risksToMatrixItems(ctx.risks)) : '';

  // Generate roadmap timeline
  const roadmapTimeline = generateRoadmapTimelineViz(ctx);

  // Generate recommendations list
  const quickWinIds = new Set(ctx.quickWins?.map(qw => qw.id) || []);
  const recommendationsList = ctx.recommendations.length > 0
    ? generateRecommendationsList(recommendationsToCardProps(ctx.recommendations, quickWinIds))
    : '';

  // Generate quick wins summary - fix property mapping for QuickWinDisplay interface
  const quickWinsSummary = ctx.quickWins.length > 0
    ? generateQuickWinsSummary(ctx.quickWins.map(qw => {
        // Find the linked recommendation to get dimension info
        const linkedRec = ctx.recommendations.find(r => r.id === qw.recommendationId);
        const dimensionCode = linkedRec?.dimensionCode || '';
        return {
          title: qw.theme || 'Quick Win',
          impact: qw.impactScore ?? 50,  // Use impactScore (number), not impact
          effort: qw.effortScore ?? 50,   // Use effortScore (number), not effort
          dimension: resolveDimensionName(dimensionCode) || 'General',
          timeframe: qw.timeframe || '30 days',
        };
      }))
    : '';

  // Generate findings grid
  const findingsGrid = ctx.findings.length > 0
    ? generateFindingsGrid(findingsToGridProps(ctx.findings))
    : '';

  // Generate benchmark comparison table
  const benchmarkTable = generateBenchmarkComparisonTable(
    ctx.chapters.map(ch => ({
      name: ch.name,
      score: ch.score,
      benchmark: ch.industryBenchmark || 65,
      delta: ch.score - (ch.industryBenchmark || 65),
    }))
  );

  // Generate executive highlights row
  const executiveHighlightsRow = generateExecutiveHighlightsRow([
    { icon: '📊', value: ctx.overallHealth.score.toString(), label: 'Health Score', color: getScoreBandColor(ctx.overallHealth.score) },
    { icon: '📈', value: ctx.findings.filter(f => f.type === 'strength').length.toString(), label: 'Strengths', color: '#28a745' },
    { icon: '⚠️', value: ctx.risks.length.toString(), label: 'Risks', color: '#dc3545' },
    { icon: '🎯', value: ctx.recommendations.length.toString(), label: 'Actions', color: '#212653' },
  ]);

  // Generate key takeaways box
  const keyTakeawaysBox = generateKeyTakeawaysBox(
    ctx.keyTakeaways?.slice(0, 5).map(t => ({
      icon: getTakeawayIcon(t.type),
      text: t.text,
      type: t.type as 'strength' | 'weakness' | 'opportunity' | 'risk',
    })) || []
  );

  // Generate chapter gauges (one gauge per chapter)
  const chapterGauges = generateChapterGaugesViz(ctx);

  // Generate risk severity donut chart
  const riskSeverityDonut = generateRiskSeverityDonutViz(ctx);

  // Generate roadmap timeline SVG
  const roadmapTimelineSVG = generateRoadmapTimelineSVGViz(ctx);

  // Generate recommendations donut by priority/horizon
  const recommendationsDonut = generateRecommendationsDonutViz(ctx);

  // Generate investment allocation donut
  const investmentDonut = generateInvestmentDonutViz(ctx);

  // Generate impact bars chart
  const impactBars = generateImpactBarsViz(ctx);

  // Generate benchmark bars chart
  const benchmarkBars = generateBenchmarkBarsViz(ctx);

  logger.info({
    visualCount: Object.values({
      executiveDashboard, keyStatsRow, scorecardGrid, chapterRadarChart,
      overallGaugeChart, chapterGauges, riskHeatmap, riskMatrix, riskSeverityDonut,
      roadmapTimeline, roadmapTimelineSVG, recommendationsList, recommendationsDonut,
      quickWinsSummary, investmentDonut, impactBars, findingsGrid, benchmarkTable,
      benchmarkBars, executiveHighlightsRow, keyTakeawaysBox
    }).filter(v => v).length
  }, 'Phase 5 visualizations generated');

  return {
    executiveDashboard,
    keyStatsRow,
    scorecardGrid,
    chapterRadarChart,
    overallGaugeChart,
    chapterGauges,
    riskHeatmap,
    riskMatrix,
    riskSeverityDonut,
    roadmapTimeline,
    roadmapTimelineSVG,
    recommendationsList,
    recommendationsDonut,
    quickWinsSummary,
    investmentDonut,
    impactBars,
    findingsGrid,
    benchmarkTable,
    benchmarkBars,
    executiveHighlightsRow,
    keyTakeawaysBox,
  };
}

/**
 * Get color based on score band
 */
function getScoreBandColor(score: number): string {
  if (score >= 80) return '#28a745';
  if (score >= 60) return '#969423';
  if (score >= 40) return '#ffc107';
  return '#dc3545';
}

/**
 * Get icon for takeaway type
 */
function getTakeawayIcon(type: string): string {
  const icons: Record<string, string> = {
    strength: '✓',
    weakness: '!',
    opportunity: '→',
    risk: '⚠',
  };
  return icons[type] || '•';
}

/**
 * Generate chapter radar chart visualization (SVG)
 */
function generateChapterRadarChartViz(ctx: ReportContext): string {
  if (ctx.chapters.length === 0) return '';

  // Use the format expected by generateRadarChartSVG
  const data = {
    labels: ctx.chapters.map(ch => ch.name),
    values: ctx.chapters.map(ch => ch.score),
    benchmarkValues: ctx.chapters.map(ch => (ch as any).industryBenchmark || 65),
    title: 'Chapter Performance',
  };

  const svg = generateRadarChartSVG(data, {
    width: 400,
    height: 350,
    showLegend: true,
    showGrid: true,
    gridLevels: 5,
  });

  return wrapChartInContainer(svg, {
    title: 'Chapter Performance Overview',
    caption: 'Score comparison across all business chapters',
    width: '100%',
  });
}

/**
 * Generate overall health gauge visualization (SVG)
 */
function generateOverallGaugeViz(ctx: ReportContext): string {
  const svg = generateGaugeChartSVG({
    value: ctx.overallHealth.score,
    maxValue: 100,
    label: 'Overall Health',
  }, {
    width: 220,
    height: 140,
    showValue: true,
    showLabel: true,
    colorBands: [
      { min: 0, max: 40, color: '#dc3545' },
      { min: 40, max: 60, color: '#ffc107' },
      { min: 60, max: 80, color: '#969423' },
      { min: 80, max: 100, color: '#28a745' },
    ],
  });

  return wrapChartInContainer(svg, {
    title: 'Business Health Score',
    width: '220px',
  });
}

/**
 * Generate executive metrics dashboard
 */
function generateExecutiveMetricsDashboard(ctx: ReportContext): string {
  const metrics = [
    {
      label: 'Overall Health',
      value: ctx.overallHealth.score,
      unit: '/100',
      status: getScoreBand(ctx.overallHealth.score) as ScoreBand,
      trend: ctx.overallHealth.trajectory === 'Improving' ? 'up' as const :
             ctx.overallHealth.trajectory === 'Declining' ? 'down' as const : 'flat' as const
    },
    ...ctx.chapters.map(chapter => ({
      label: chapter.name,
      value: chapter.score,
      unit: '/100',
      status: getScoreBand(chapter.score) as ScoreBand
    }))
  ];

  return renderKPIDashboard({
    metrics,
    columns: Math.min(4, metrics.length) as 2 | 3 | 4,
    title: 'Critical Business Metrics',
    showBorder: true
  });
}

/**
 * Generate roadmap timeline visualization
 */
function generateRoadmapTimelineViz(ctx: ReportContext): string {
  if (!ctx.roadmap?.phases || ctx.roadmap.phases.length === 0) {
    return '';
  }

  const phases: RoadmapPhase[] = ctx.roadmap.phases.slice(0, 3).map((phase, index) => {
    const phaseNum = (index + 1) as 1 | 2 | 3;
    const linkedRecs = ctx.recommendations.filter(rec =>
      phase.linkedRecommendationIds?.includes(rec.id)
    );

    return {
      phaseNumber: phaseNum,
      name: phase.name || `Phase ${phaseNum}`,
      timeframe: formatTimeHorizon(phase.timeHorizon),
      focus: phase.narrative?.substring(0, 150) || 'Strategic implementation',
      keyDeliverables: linkedRecs.slice(0, 4).map(rec => rec.theme),
      successMetrics: linkedRecs.slice(0, 2).map(rec => rec.expectedOutcomes?.substring(0, 60))
    };
  });

  return renderRoadmapTimeline({
    phases,
    totalMonths: 18,
    showMilestones: true,
    showInvestment: false,
    title: '18-Month Transformation Roadmap'
  });
}

/**
 * Generate key stats row
 */
function generateKeyStatsRow(ctx: ReportContext): string {
  const statusColor = ctx.overallHealth.score >= 80 ? '#28a745' :
                      ctx.overallHealth.score >= 60 ? '#969423' :
                      ctx.overallHealth.score >= 40 ? '#ffc107' : '#dc3545';

  return renderQuickStatsRow([
    { label: 'Health Score', value: ctx.overallHealth.score, color: statusColor },
    { label: 'Dimensions', value: ctx.dimensions.length },
    { label: 'Findings', value: ctx.findings.length },
    { label: 'Recommendations', value: ctx.recommendations.length },
    { label: 'Quick Wins', value: ctx.quickWins.length, color: '#28a745' }
  ]);
}

/**
 * Format time horizon for display
 */
function formatTimeHorizon(horizon: string): string {
  const formats: Record<string, string> = {
    '90_days': 'Months 1-3',
    '0-90 days': 'Months 1-3',
    '90 days': 'Months 1-3',
    '6_months': 'Months 1-6',
    '12_months': 'Months 4-12',
    '6-12 months': 'Months 4-12',
    '18_months': 'Months 7-18',
    '12-18 months': 'Months 7-18',
    '24_months_plus': 'Months 13-24',
    '18-24 months': 'Months 13-24',
    '24 months+': 'Months 13-24'
  };
  return formats[horizon?.toLowerCase()] || horizon || 'TBD';
}

/**
 * Generate Risk Assessment section with Heat Map and Risk Matrix visualizations
 */
function generateRiskAssessmentWithHeatmap(
  ctx: ReportContext,
  narrativeContent: string,
  heatmapHtml: string,
  riskMatrixHtml?: string
): string {
  const sanitizedNarrative = narrativeContent
    ? sanitizeOrphanedVisualizationHeaders(
        parseMarkdownToHTML(narrativeContent, { maxBoldPerParagraph: 3, maxListItems: 8 })
      ).html
    : '';

  // Fallback to structured data if no narrative
  const structuredRisks = !sanitizedNarrative ? generateRisksSection(ctx) : '';

  // Generate risk matrix if not provided
  const riskMatrix = riskMatrixHtml || (ctx.risks.length > 0
    ? generateRiskMatrix(risksToMatrixItems(ctx.risks))
    : '');

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Risk Assessment</h2>
      </div>

      <!-- Risk Visualization Dashboard -->
      <div class="risk-viz-dashboard" style="display: flex; gap: 2rem; margin: 1.5rem 0; flex-wrap: wrap;">
        <!-- Risk Heat Map -->
        ${heatmapHtml ? `
          <div class="risk-heatmap-container" style="flex: 1; min-width: 300px; page-break-inside: avoid;">
            <h4 style="margin: 0 0 0.75rem 0; color: #212653; font-size: 1rem;">Risk Heat Map</h4>
            <p style="color: #666; font-size: 0.85rem; margin-bottom: 1rem;">
              ${ctx.risks.length} risks plotted by severity × likelihood
            </p>
            ${heatmapHtml}
          </div>
        ` : ''}

        <!-- Risk Matrix -->
        ${riskMatrix ? `
          <div class="risk-matrix-container" style="flex: 1; min-width: 300px; page-break-inside: avoid;">
            ${riskMatrix}
          </div>
        ` : ''}
      </div>

      ${sanitizedNarrative ? `
        <div class="narrative-content">
          ${sanitizedNarrative}
        </div>
      ` : structuredRisks}
    </section>
  `;
}

/**
 * Generate Implementation Roadmap section with Timeline visualization
 */
function generateImplementationRoadmapWithTimeline(
  ctx: ReportContext,
  narrativeContent: string,
  timelineHtml: string
): string {
  const sanitizedNarrative = narrativeContent
    ? sanitizeOrphanedVisualizationHeaders(
        parseMarkdownToHTML(narrativeContent, { maxBoldPerParagraph: 3, maxListItems: 8 })
      ).html
    : '';

  // Fallback to structured data if no narrative
  const structuredRoadmap = !sanitizedNarrative ? generateRoadmapSection(ctx) : '';

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Implementation Roadmap</h2>
      </div>

      <!-- 18-Month Timeline Visualization -->
      ${timelineHtml ? `
        <div class="roadmap-timeline-container" style="margin: 1.5rem 0; page-break-inside: avoid;">
          ${timelineHtml}
        </div>
      ` : ''}

      ${sanitizedNarrative ? `
        <div class="narrative-content">
          ${sanitizedNarrative}
        </div>
      ` : structuredRoadmap}
    </section>
  `;
}

// ============================================================================
// NEW PHASE 5 VISUALIZATION FUNCTIONS (B1-B4)
// ============================================================================

/**
 * B1: Generate chapter gauges - one gauge per chapter
 */
function generateChapterGaugesViz(ctx: ReportContext): string {
  if (ctx.chapters.length === 0) return '';

  const gauges = ctx.chapters.map(chapter => {
    const svg = generateGaugeChartSVG({
      value: chapter.score,
      maxValue: 100,
      label: chapter.name,
    }, {
      width: 160,
      height: 100,
      showValue: true,
      showLabel: true,
      colorBands: [
        { min: 0, max: 40, color: '#dc3545' },
        { min: 40, max: 60, color: '#ffc107' },
        { min: 60, max: 80, color: '#969423' },
        { min: 80, max: 100, color: '#28a745' },
      ],
    });

    return wrapChartInContainer(svg, {
      title: chapter.name,
      width: '160px',
    });
  }).join('');

  return `
    <div class="chapter-gauges-row" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin: 1.5rem 0;">
      ${gauges}
    </div>
  `;
}

/**
 * B2: Generate risk severity donut visualization
 */
function generateRiskSeverityDonutViz(ctx: ReportContext): string {
  if (!ctx.risks || ctx.risks.length === 0) return '';

  // Categorize risks by severity
  const critical = ctx.risks.filter(r => {
    const sev = String(r.severity || '').toLowerCase();
    return sev === 'critical' || sev === '4' || sev === '5';
  }).length;
  const high = ctx.risks.filter(r => {
    const sev = String(r.severity || '').toLowerCase();
    return sev === 'high' || sev === '3';
  }).length;
  const medium = ctx.risks.filter(r => {
    const sev = String(r.severity || '').toLowerCase();
    return sev === 'medium' || sev === '2';
  }).length;
  const low = ctx.risks.length - critical - high - medium;

  const segments = [
    { label: 'Critical', value: critical, color: '#dc3545' },
    { label: 'High', value: high, color: '#fd7e14' },
    { label: 'Medium', value: medium, color: '#ffc107' },
    { label: 'Low', value: low, color: '#28a745' },
  ].filter(s => s.value > 0);

  if (segments.length === 0) return '';

  const svg = generateDonutChartSVG({
    segments,
    centerLabel: `${ctx.risks.length}`,
    centerSubLabel: 'Risks',
  }, {
    width: 280,
    height: 280,
    showLegend: true,
  });

  return wrapChartInContainer(svg, {
    title: 'Risk Severity Distribution',
    caption: `${ctx.risks.length} risks identified across the organization`,
  });
}

/**
 * B2: Generate risk matrix SVG visualization
 */
function generateRiskMatrixSVGViz(ctx: ReportContext): string {
  if (!ctx.risks || ctx.risks.length === 0) return '';

  const width = 400;
  const height = 350;
  const margin = { top: 50, left: 80, right: 20, bottom: 50 };
  const cellSize = 100;

  // Categorize risks into matrix cells
  const categorize = (risk: any) => {
    const sev = String(risk.severity || '').toLowerCase();
    const lik = String(risk.likelihood || '').toLowerCase();
    const sevLevel = sev.includes('critical') || sev === '4' || sev === '5' ? 2 :
                     sev.includes('high') || sev === '3' ? 2 :
                     sev.includes('medium') || sev === '2' ? 1 : 0;
    const likLevel = lik.includes('high') || lik === '3' ? 2 :
                     lik.includes('medium') || lik === '2' ? 1 : 0;
    return { sev: sevLevel, lik: likLevel };
  };

  // Count risks in each cell
  const matrix = Array(3).fill(null).map(() => Array(3).fill(0));
  ctx.risks.forEach(r => {
    const { sev, lik } = categorize(r);
    matrix[2 - lik][sev]++; // Flip Y for visual (high at top)
  });

  const colors = [
    ['#28a745', '#ffc107', '#fd7e14'],  // Low likelihood
    ['#ffc107', '#fd7e14', '#dc3545'],  // Medium likelihood
    ['#fd7e14', '#dc3545', '#dc3545'],  // High likelihood
  ];

  let cellsHtml = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = margin.left + col * cellSize;
      const y = margin.top + row * cellSize;
      const count = matrix[row][col];
      const color = colors[row][col];

      cellsHtml += `
        <rect x="${x}" y="${y}" width="${cellSize - 4}" height="${cellSize - 4}"
              fill="${color}" fill-opacity="0.2" stroke="${color}"
              stroke-width="2" rx="4"/>
      `;
      if (count > 0) {
        cellsHtml += `
          <circle cx="${x + cellSize/2}" cy="${y + cellSize/2}" r="20" fill="${color}"/>
          <text x="${x + cellSize/2}" y="${y + cellSize/2 + 6}" text-anchor="middle"
                font-family="'Montserrat', sans-serif" font-size="16" font-weight="700"
                fill="white">${count}</text>
        `;
      }
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"
         style="max-width: 100%; height: auto;" role="figure"
         aria-label="Risk Matrix">
      <rect width="${width}" height="${height}" fill="white" rx="4"/>

      <!-- Title -->
      <text x="${width/2}" y="25" text-anchor="middle" font-family="'Montserrat', sans-serif"
            font-size="14" font-weight="600" fill="#212653">Risk Matrix</text>

      <!-- Y-axis label -->
      <text x="20" y="${margin.top + cellSize * 1.5}" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="11" fill="#666"
            transform="rotate(-90, 20, ${margin.top + cellSize * 1.5})">Likelihood</text>

      <!-- X-axis label -->
      <text x="${margin.left + cellSize * 1.5}" y="${height - 10}" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="11" fill="#666">Severity</text>

      <!-- Y-axis markers -->
      <text x="${margin.left - 10}" y="${margin.top + cellSize * 0.5 + 5}" text-anchor="end"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">High</text>
      <text x="${margin.left - 10}" y="${margin.top + cellSize * 1.5 + 5}" text-anchor="end"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">Medium</text>
      <text x="${margin.left - 10}" y="${margin.top + cellSize * 2.5 + 5}" text-anchor="end"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">Low</text>

      <!-- X-axis markers -->
      <text x="${margin.left + cellSize * 0.5}" y="${margin.top + cellSize * 3 + 15}" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">Low</text>
      <text x="${margin.left + cellSize * 1.5}" y="${margin.top + cellSize * 3 + 15}" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">Medium</text>
      <text x="${margin.left + cellSize * 2.5}" y="${margin.top + cellSize * 3 + 15}" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">High</text>

      <!-- Cells -->
      ${cellsHtml}
    </svg>
  `;

  return wrapChartInContainer(svg, {
    title: 'Risk Matrix',
    caption: 'Risk distribution by severity and likelihood',
  });
}

/**
 * B3: Generate investment allocation donut
 */
function generateInvestmentDonutViz(ctx: ReportContext): string {
  // Group recommendations by dimension for investment allocation
  const dimCounts: Record<string, number> = {};
  ctx.recommendations.forEach(rec => {
    const dim = rec.dimensionCode || 'Other';
    dimCounts[dim] = (dimCounts[dim] || 0) + 1;
  });

  const segments = Object.entries(dimCounts).map(([code, count], idx) => {
    const colors = ['#212653', '#969423', '#0d6efd', '#28a745', '#fd7e14', '#6c757d'];
    return {
      label: resolveDimensionName(code),
      value: count,
      color: colors[idx % colors.length],
    };
  }).slice(0, 6);

  if (segments.length === 0) return '';

  const svg = generateDonutChartSVG({
    segments,
    centerLabel: `${ctx.recommendations.length}`,
    centerSubLabel: 'Initiatives',
  }, {
    width: 280,
    height: 280,
    showLegend: true,
  });

  return wrapChartInContainer(svg, {
    title: 'Investment Allocation',
    caption: 'Recommended investment distribution by dimension',
  });
}

/**
 * B3: Generate impact bars visualization
 */
function generateImpactBarsViz(ctx: ReportContext): string {
  if (ctx.recommendations.length === 0) return '';

  const topRecs = ctx.recommendations
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, 6)
    .map(r => ({
      label: r.theme?.substring(0, 25) || 'Recommendation',
      value: r.impactScore || 50,
    }));

  const svg = generateHorizontalBarChartSVG({
    items: topRecs,
    maxValue: 100,
  }, {
    width: 450,
    height: 220,
    showValues: true,
    barHeight: 28,
    colorByValue: true,
  });

  return wrapChartInContainer(svg, {
    title: 'Top Recommendations by Impact',
    caption: 'Highest impact initiatives prioritized for implementation',
  });
}

/**
 * B3: Generate recommendations donut by horizon
 */
function generateRecommendationsDonutViz(ctx: ReportContext): string {
  if (ctx.recommendations.length === 0) return '';

  // Group by horizon
  const horizonCounts = {
    '90 Days': 0,
    '12 Months': 0,
    '24+ Months': 0,
  };

  ctx.recommendations.forEach(rec => {
    const horizon = String(rec.horizon || '').toLowerCase();
    if (horizon.includes('90') || horizon.includes('0-90')) {
      horizonCounts['90 Days']++;
    } else if (horizon.includes('12') || horizon.includes('6-12')) {
      horizonCounts['12 Months']++;
    } else {
      horizonCounts['24+ Months']++;
    }
  });

  const segments = [
    { label: '0-90 Days', value: horizonCounts['90 Days'], color: '#dc3545' },
    { label: '3-12 Months', value: horizonCounts['12 Months'], color: '#fd7e14' },
    { label: '12-24+ Months', value: horizonCounts['24+ Months'], color: '#28a745' },
  ].filter(s => s.value > 0);

  if (segments.length === 0) return '';

  const svg = generateDonutChartSVG({
    segments,
    centerLabel: `${ctx.recommendations.length}`,
    centerSubLabel: 'Actions',
  }, {
    width: 280,
    height: 280,
    showLegend: true,
  });

  return wrapChartInContainer(svg, {
    title: 'Recommendations by Timeline',
    caption: 'Distribution of actions across implementation phases',
  });
}

/**
 * B4: Generate roadmap timeline SVG visualization
 */
function generateRoadmapTimelineSVGViz(ctx: ReportContext): string {
  if (!ctx.roadmap?.phases || ctx.roadmap.phases.length === 0) return '';

  const width = 800;
  const height = 200;
  const phases = ctx.roadmap.phases.slice(0, 4);
  const phaseWidth = (width - 100) / phases.length;

  const phaseColors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
  const phaseBars = phases.map((phase, idx) => {
    const x = 50 + idx * phaseWidth;
    const color = phaseColors[idx % phaseColors.length];
    const initiativeCount = phase.linkedRecommendationIds?.length || 0;

    return `
      <!-- Phase ${idx + 1} -->
      <rect x="${x}" y="80" width="${phaseWidth - 10}" height="40"
            fill="${color}" rx="4"/>
      <text x="${x + phaseWidth/2 - 5}" y="105" text-anchor="middle"
            font-family="'Montserrat', sans-serif" font-size="11"
            font-weight="600" fill="white">${phase.name || `Phase ${idx + 1}`}</text>
      <text x="${x + phaseWidth/2 - 5}" y="145" text-anchor="middle"
            font-family="'Open Sans', sans-serif" font-size="10" fill="#666">
        ${initiativeCount} initiatives
      </text>
    `;
  }).join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"
         style="max-width: 100%; height: auto;" role="figure"
         aria-label="Implementation Roadmap Timeline">
      <rect width="${width}" height="${height}" fill="white" rx="4"/>

      <!-- Title -->
      <text x="${width/2}" y="30" text-anchor="middle" font-family="'Montserrat', sans-serif"
            font-size="16" font-weight="600" fill="#212653">Implementation Phases</text>

      <!-- Timeline base -->
      <line x1="40" y1="100" x2="${width - 40}" y2="100" stroke="#e9ecef" stroke-width="4"/>

      <!-- Phase blocks -->
      ${phaseBars}

      <!-- Start/End markers -->
      <circle cx="50" cy="100" r="8" fill="#212653"/>
      <text x="50" y="175" text-anchor="middle" font-family="'Open Sans', sans-serif"
            font-size="10" fill="#212653">Start</text>

      <circle cx="${width - 50}" cy="100" r="8" fill="#969423"/>
      <text x="${width - 50}" y="175" text-anchor="middle" font-family="'Open Sans', sans-serif"
            font-size="10" fill="#969423">18 Months</text>
    </svg>
  `;

  return wrapChartInContainer(svg, {
    title: '18-Month Implementation Timeline',
    caption: 'Strategic phases for business transformation',
  });
}

/**
 * B4: Generate benchmark comparison bars
 */
function generateBenchmarkBarsViz(ctx: ReportContext): string {
  if (ctx.chapters.length === 0) return '';

  const items = ctx.chapters.map(ch => ({
    label: ch.name,
    value: ch.score,
    benchmark: ch.industryBenchmark || 65,
  }));

  const svg = generateHorizontalBarChartSVG({
    items,
    maxValue: 100,
  }, {
    width: 500,
    height: 200,
    showValues: true,
    barHeight: 32,
    showBenchmark: true,
    colorByValue: true,
  });

  return wrapChartInContainer(svg, {
    title: 'Performance vs. Industry Benchmark',
    caption: 'Chapter scores compared to industry averages',
  });
}
