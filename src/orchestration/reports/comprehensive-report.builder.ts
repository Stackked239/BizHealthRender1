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
import { ScoreBands } from '../../utils/score-bands.js';

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
  // World-class visual components (Phase 1.5-2)
  generateEnhancedSectionHeader,
  generateActionPlanCardGrid,
  generateFinancialImpactDashboard,
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
  // World-class visual components (Phase 1.5-2)
  render12DimensionExecutiveRadar,
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
  // World-class visual components integration (Phase 1.5-2)
  contextToExecutiveRadarData,
  contextToFinancialImpactData,
  contextToActionPlanCards,
  chapterToSectionHeader,
  dimensionToSectionHeader,
} from './utils/index.js';

// Import risk heatmap component
import { renderRiskHeatmapFromRisks } from './components/visual/risk-heatmap.component.js';

// Import BLUF rendering for Phase 4.5 integration
import {
  renderBLUFForReport,
  createBLUFRenderContext,
  hasValidPhase45Output,
  getBLUFInlineStyles,
} from '../phase4-5b-renderer.js';
import type { Phase4_5A_Output } from '../../types/phase4-5.types.js';

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
  // World-class visual components (Phase 1.5-2)
  generateFinancialImpactDashboard,
  generateEnhancedSectionHeader,
  generateActionPlanCardGrid,
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

// Phase 1.5 Category Visualization Components
import {
  generateCategoryRadarChart,
  generateChapterHeatmap,
  generateCategoryBenchmarkBars,
  generateSWOTQuadrant,
  generateInterdependencyNetwork,
  generatePriorityMatrix,
} from './components/category-visualizations.js';

// Phase 1.5 Premium Content Styles + Comprehensive Report Overrides
import { getAllPhase15Styles, getComprehensiveOverrides } from './styles/index.js';

// Phase B: New Section Builders
import {
  buildInterdependencySynthesis,
  buildFinancialImpactAnalysis,
  buildCrossDimensionalSynthesisSection,
  buildPMOEstablishment,
  buildImplementationSummary,
} from './sections/index.js';

// Import IDM type for adapter function
import type { IDM } from '../../types/idm.types.js';

// Appendix A: Accelerated Action Plan Integration
import {
  buildAppendixAContentOnly,
  getAppendixAStyles,
} from './accelerated-action-appendix.builder.js';

// Phase 0: Premium Report Quality Enhancement imports
import {
  generateCoverPage,
  getCoverPageStyles,
  generateEnhancedRecommendationsSection,
} from './components/index.js';
import {
  generateChapterOpeningNarrative,
  createPersonalizationContext,
  personalizeNarrative,
  type ChapterNarrativeContext,
  type PersonalizationContext,
} from './utils/index.js';

// Phase 4.5 BLUF Rendering
import {
  renderBLUFForReport,
  createBLUFRenderContext,
  hasValidPhase45Output,
} from '../phase4-5b-renderer.js';
import type { Phase4_5A_Output } from '../../types/phase4-5.types.js';

/**
 * Convert ReportContext to a partial IDM for section builders.
 * This adapter allows the new section builders (which expect IDM) to work
 * with the ReportContext interface used by the comprehensive report builder.
 */
function reportContextToPartialIDM(ctx: ReportContext): IDM {
  return {
    crossDimensionalSynthesis: ctx.crossDimensionalSynthesis,
    pmoRequirements: ctx.pmoRequirements,
    implementationSummary: ctx.implementationSummary,
    // Map chapters for any builders that need chapter data
    chapters: ctx.chapters?.map(ch => ({
      code: ch.code,
      name: ch.name,
      score: ch.score,
      band: ch.band,
    })) || [],
  } as IDM;
}

/**
 * Build comprehensive assessment report with integrated narrative content
 */

// Helper functions for professional category headers
function getChapterColor(categoryCode: string): string {
  const chapterColors: Record<string, string> = {
    // Growth Engine - Blue
    'STR': '#0d6efd', 'SAL': '#0d6efd', 'MKT': '#0d6efd', 'CXP': '#0d6efd',
    // Performance & Health - Green
    'OPS': '#28a745', 'FIN': '#28a745',
    // People & Leadership - Purple
    'HRS': '#6f42c1', 'LDG': '#6f42c1',
    // Resilience & Safeguards - Orange
    'TIN': '#fd7e14', 'ITD': '#fd7e14', 'RMS': '#fd7e14', 'CMP': '#fd7e14',
  };
  return chapterColors[categoryCode] || '#212653';
}

function getChapterName(categoryCode: string): string {
  const chapterNames: Record<string, string> = {
    'STR': 'Growth Engine', 'SAL': 'Growth Engine', 'MKT': 'Growth Engine', 'CXP': 'Growth Engine',
    'OPS': 'Performance & Health', 'FIN': 'Performance & Health',
    'HRS': 'People & Leadership', 'LDG': 'People & Leadership',
    'TIN': 'Resilience & Safeguards', 'ITD': 'Resilience & Safeguards', 
    'RMS': 'Resilience & Safeguards', 'CMP': 'Resilience & Safeguards',
  };
  return chapterNames[categoryCode] || 'Business Health';
}


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
    // Phase 1.5: Category Analysis Overview (only if data is available)
    ...(ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0 ? [
      { id: 'category-overview', title: 'Category Health Overview' },
    ] : []),
    { id: 'scorecard', title: 'Business Health Scorecard' },
    { id: 'chapter-growth-engine', title: 'Chapter 1: Growth Engine Deep Dive' },
    { id: 'chapter-performance-health', title: 'Chapter 2: Performance & Health Deep Dive' },
    { id: 'chapter-people-leadership', title: 'Chapter 3: People & Leadership Deep Dive' },
    { id: 'chapter-resilience-safeguards', title: 'Chapter 4: Resilience & Safeguards Deep Dive' },
    // Phase 1.5: Cross-Category Insights (only if data is available)
    ...(ctx.crossCategoryInsights ? [
      { id: 'cross-category-insights', title: 'Cross-Category Analysis' },
    ] : []),
    // Phase 1.5: Category Deep Dives (only if data is available)
    ...(ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0 ? [
      { id: 'category-deep-dives', title: 'Category Deep Dives' },
    ] : []),
    // Phase B2: Interdependency Synthesis (NEW - always included if category data available)
    ...(ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0 ? [
      { id: 'interdependency-synthesis', title: 'Interdependency Synthesis' },
    ] : []),
    // Phase 1.5 Enhanced: Cross-Dimensional Synthesis (Sections 5.1-8.3)
    ...(ctx.crossDimensionalSynthesis ? [
      { id: 'cross-dimensional-synthesis', title: 'Cross-Dimensional Synthesis (Enhanced)' },
    ] : []),
    { id: 'cross-dimensional', title: 'Cross-Dimensional Synthesis' },
    { id: 'strategic-recommendations', title: 'Strategic Recommendations' },
    { id: 'risk-assessment', title: 'Risk Assessment' },
    { id: 'growth', title: 'Growth Opportunities' },
    { id: 'implementation-roadmap', title: 'Implementation Roadmap' },
    // Phase 1.5: PMO Establishment (if available)
    ...(ctx.pmoRequirements ? [
      { id: 'pmo-establishment', title: 'PMO Establishment Requirements' },
    ] : []),
    { id: 'findings', title: 'Detailed Findings' },
    { id: 'quick-wins', title: 'Quick Wins' },
    // Phase B3: Enhanced Financial Impact Analysis (NEW)
    { id: 'financial-impact-analysis', title: 'Financial Impact Analysis' },
    // Appendix A: Accelerated Action Plan (integrated from quickWins report)
    { id: 'appendix-a', title: 'Appendix A: Accelerated Action Plan (0-90 Days)' },
    // Phase 1.5: Implementation Summary (if available)
    ...(ctx.implementationSummary ? [
      { id: 'implementation-summary', title: 'Implementation Summary' },
    ] : []),
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

  // Phase 0: Create personalization context for company-specific language
  const personalizationCtx: PersonalizationContext = createPersonalizationContext({
    name: ctx.companyProfile.name,
    industry: ctx.companyProfile.industry,
    companySize: ctx.companyProfile.companySize,
    employeeCount: ctx.companyProfile.employeeCount,
    yearsInBusiness: ctx.companyProfile.yearsInBusiness,
    location: ctx.companyProfile.location,
    lifecycleStage: ctx.companyProfile.lifecycleStage,
  });

  // Phase 0: Generate cover page
  const coverPage = generateCoverPage(ctx, {
    reportType: 'comprehensive',
    showLogo: true,
    showConfidentialBadge: true,
  });

  // Build HTML content with integrated narratives
  const contentSections = [
    // Phase 0: Cover page appears first
    coverPage,

    generateReportHeader(ctx, reportName, 'Complete Business Health Assessment'),

    // Compact Terms Acceptance Banner (replaces lengthy legal block)
    acceptanceBanner,

    // Relationship statement explaining how Owner's and Comprehensive reports work together
    renderComprehensiveRelationshipStatement(),

    options.includeTOC ? generateTableOfContents(sections) : '',

    // Phase 4.5 BLUF (Bottom Line Up Front) - AI-generated executive summary
    generateBLUFSection(ctx),

    // Executive Summary with narrative and Phase 5 dashboard (with anchor ID for cross-references)
    `<section id="executive-summary" class="section">${generateExecutiveSummaryWithNarrative(ctx, narratives, phase5Visuals)}</section>`,

    // Phase 1.5: Category Analysis Overview (only if data is available)
    generateCategoryAnalysisOverviewSection(ctx, options),

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

      <!-- Phase 1B: Dimension Health Dashboard (12 gauge SVGs) -->
      ${phase5Visuals.dimensionGaugesGrid ? `
        <div class="dimension-health-dashboard" style="margin: 2rem 0;">
          <h3 style="color: ${options.brand.primaryColor}; margin: 0 0 1.5rem 0; font-family: 'Montserrat', sans-serif;">12-Dimension Health Overview</h3>
          ${phase5Visuals.dimensionGaugesGrid}
        </div>
      ` : ''}

      <!-- Phase 1B: Dimension Benchmark Comparison (12 bar SVGs) -->
      ${phase5Visuals.dimensionBenchmarkBars ? `
        <div class="dimension-benchmark-comparison" style="margin: 2rem 0;">
          <h3 style="color: ${options.brand.primaryColor}; margin: 0 0 1.5rem 0; font-family: 'Montserrat', sans-serif;">Dimension Benchmark Comparison</h3>
          ${phase5Visuals.dimensionBenchmarkBars}
        </div>
      ` : ''}
    </section>`,

    // Chapter Deep Dives with proper anchor IDs matching section-mapping.ts (now with dimension charts)
    narratives ? `
      <section id="chapter-growth-engine" class="section page-break">${generateNarrativeSection('Chapter 1: Growth Engine Deep Dive', narratives.phase1.tier1.revenueEngine, getChapterScore(ctx, 'GE'), 'GE', ctx, chapterDimensionCharts['GE'])}</section>
      <section id="chapter-performance-health" class="section page-break">${generateNarrativeSection('Chapter 2: Performance & Health Deep Dive', narratives.phase1.tier1.operationalExcellence, getChapterScore(ctx, 'PH'), 'PH', ctx, chapterDimensionCharts['PH'])}</section>
      <section id="chapter-people-leadership" class="section page-break">${generateNarrativeSection('Chapter 3: People & Leadership Deep Dive', narratives.phase1.tier1.peopleLeadership, getChapterScore(ctx, 'PL'), 'PL', ctx, chapterDimensionCharts['PL'])}</section>
      <section id="chapter-resilience-safeguards" class="section page-break">${generateNarrativeSection('Chapter 4: Resilience & Safeguards Deep Dive', narratives.phase1.tier1.complianceSustainability, getChapterScore(ctx, 'RS'), 'RS', ctx, chapterDimensionCharts['RS'])}</section>
    ` : '',

    // Phase 1.5: Cross-Category Insights Section (systemic patterns, cascade risks, priority table)
    generateCrossCategoryInsightsSection(ctx, options),

    // Phase 1.5: Category Deep Dives (SWOT, strengths, weaknesses, benchmarks per category)
    ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0 ? `
      <section id="category-deep-dives" class="section page-break">
        <div class="section-header">
          <h2>Category Deep Dives</h2>
          <p class="section-subtitle" style="color: #666; margin-top: 0.5rem;">Comprehensive analysis of all 12 business dimensions with SWOT, benchmarks, and actionable insights</p>
        </div>
        ${ctx.categoryAnalyses.map(cat => generateCategoryDeepDiveSection(cat, options)).join('')}
      </section>
    ` : '',

    // Phase B2: Interdependency Synthesis Section (NEW)
    ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0
      ? buildInterdependencySynthesis(ctx.categoryAnalyses, ctx.crossCategoryInsights)
      : '',

    // Phase 1.5 Enhanced: Cross-Dimensional Synthesis (Sections 5.1-8.3)
    ctx.crossDimensionalSynthesis
      ? buildCrossDimensionalSynthesisSection(reportContextToPartialIDM(ctx))
      : '',

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

    // Phase 1.5: PMO Establishment (if available)
    ctx.pmoRequirements
      ? buildPMOEstablishment(reportContextToPartialIDM(ctx))
      : '',

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
      <!-- World-Class: Action Plan Cards Overview -->
      ${phase5Visuals.actionPlanCards ? `
        <div class="action-plan-cards-section" style="margin-bottom: 2rem;">
          ${phase5Visuals.actionPlanCards}
        </div>
      ` : ''}
      <!-- Phase 0: Enhanced Recommendations with Strategic Context -->
      ${generateEnhancedRecommendationsSection(
        ctx.recommendations,
        ctx.findings,
        ctx.companyProfile.name,
        'Strategic Recommendations'
      )}
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
    // Phase B3: Enhanced Financial Impact Analysis (NEW)
    buildFinancialImpactAnalysis({
      recommendations: ctx.recommendations || [],
      quickWins: ctx.quickWins || [],
      companyProfile: ctx.companyProfile,
      overallHealth: ctx.overallHealth,
    }),

    // Legacy financial section (kept for backward compatibility)
    `<section id="financial-impact" class="section page-break">${generateFinancialSection(ctx)}</section>`,

    // Appendix A: Accelerated Action Plan (0-90 Days) - Integrated from quickWins
    // This replaces the need for a separate quickWins.html file
    (() => {
      const appendixA = buildAppendixAContentOnly(ctx);
      logger.info({ quickWinCount: appendixA.quickWinCount }, 'Building Appendix A section');
      return `<section id="appendix-a" class="section page-break">${appendixA.html}</section>`;
    })(),

    // Phase 1.5: Implementation Summary (if available)
    ctx.implementationSummary
      ? buildImplementationSummary(reportContextToPartialIDM(ctx))
      : '',

    // Legal Accordion (collapsible terms at bottom, collapsed by default)
    legalAccordion,

    // Footer with word count
    generateReportFooterWithStats(ctx, narratives),
  ];

  // Combine narrative styles with Phase 1.5 premium styles, Appendix A styles, BLUF styles, and comprehensive overrides
  const combinedStyles = `${narrativeStyles}\n${getAllPhase15Styles()}\n${getAppendixAStyles()}\n${getBLUFInlineStyles()}\n${getComprehensiveOverrides()}`;

  const rawHtml = wrapHtmlDocument(contentSections.join('\n'), {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: combinedStyles,
    legalAccess: ctx.legalAccess,
    ctx: ctx,
    reportType: 'comprehensive',  // Scoped CSS for comprehensive report
  });

  // Sanitize orphaned visualization headers from AI-generated content
  const { html: sanitizedHtml, removedCount, removedItems } = sanitizeOrphanedVisualizationHeaders(rawHtml);

  if (removedCount > 0) {
    logger.info({ removedCount, removedItems }, 'Sanitized orphaned visualization headers');
  }

  // Replace ASCII code blocks with branded HTML components (P1 Visual Patch)
  const { html, replacementCount } = replaceAsciiCodeBlocksWithBrandedHTML(sanitizedHtml);

  if (replacementCount > 0) {
    logger.info({ replacementCount }, 'Replaced ASCII code blocks with branded HTML components');
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

  // NOTE: Removed <section> wrapper - the calling code wraps this in a section
  return `
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

      <!-- World-Class: 12-Dimension Executive Radar (Signature Visualization) -->
      ${phase5Visuals?.executiveRadar12Dimension ? `
        <div class="executive-radar-section" style="margin: 2.5rem 0; padding: 1.5rem; background: #fafbfc; border-radius: 12px; border: 1px solid #e9ecef;">
          ${phase5Visuals.executiveRadar12Dimension}
        </div>
      ` : ''}

      <!-- World-Class: Financial Impact Dashboard -->
      ${phase5Visuals?.financialImpactDashboard ? `
        <div class="financial-impact-section" style="margin: 2rem 0;">
          ${phase5Visuals.financialImpactDashboard}
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

      ${keyImperatives && keyImperatives.length > 0 ? `
        <div class="callout warning mt-3">
          <div class="title">Strategic Imperatives</div>
          <ul>
            ${keyImperatives.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
  `;
}

/**
 * Generate a narrative section with optional score badge, benchmark callout, chart, and Phase 0 chapter opening narrative
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
  // P0 CRITICAL: Use enhanced section headers with percentile rankings (Phase 1.5-2)
  let headerHtml: string;
  if (chapterCode && ctx) {
    const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
    if (chapter) {
      // World-class enhanced section header with percentile
      const headerConfig = chapterToSectionHeader(
        {
          code: chapter.code,
          name: chapter.name,
          score: chapter.score,
          benchmark: chapter.industryBenchmark || chapter.benchmark?.peerPercentile,
          percentile: chapter.percentileRank,
        },
        ctx.companyProfile.industry
      );
      headerHtml = generateEnhancedSectionHeader(headerConfig, {
        size: 'large',
        showPercentile: true,
        showBand: true,
        showBenchmark: !!chapter.industryBenchmark,
        benchmark: chapter.industryBenchmark,
      });
    } else {
      // Fallback to standard header
      headerHtml = generateChapterHeaderHtml(
        chapterCode,
        title,
        score ?? undefined,
        ctx.companyProfile?.industry ? `${ctx.companyProfile.industry} Industry Analysis` : undefined
      );
    }
  } else if (chapterCode) {
    // Fallback when no ctx available
    headerHtml = generateChapterHeaderHtml(
      chapterCode,
      title,
      score ?? undefined
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

  // Phase 0: Generate chapter opening narrative for strategic context
  let chapterOpeningNarrativeHtml = '';
  if (chapterCode && ctx) {
    const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
    if (chapter) {
      // Get findings for this chapter
      const chapterDimensions = ctx.dimensions.filter(d => d.chapterCode === chapterCode);
      const chapterFindings = ctx.findings.filter(f =>
        chapterDimensions.some(d => d.code === f.dimensionCode)
      );

      const chapterNarrativeCtx: ChapterNarrativeContext = {
        chapterCode: chapter.code,
        chapterName: chapter.name,
        chapterScore: chapter.score,
        benchmarkPercentile: chapter.benchmark?.peerPercentile || 50,
        topStrengths: chapterFindings.filter(f => f.type === 'strength').slice(0, 2),
        topGaps: chapterFindings.filter(f => f.type === 'gap').slice(0, 2),
        companyName: ctx.companyProfile.name,
        industryContext: ctx.companyProfile.industry,
        overallHealthScore: ctx.overallHealth.score,
      };

      chapterOpeningNarrativeHtml = generateChapterOpeningNarrative(chapterNarrativeCtx);
    }
  }

  // NOTE: Removed <section> wrapper - the calling code wraps this in a section
  return `
      ${headerHtml}
      ${benchmarkHtml}
      ${chapterOpeningNarrativeHtml}
      ${chartHtml ? `
        <div class="chapter-dimension-chart">
          <h4 style="font-size: 0.95rem; color: #666; margin: 1.5rem 0 1rem 0;">Dimension Score Breakdown</h4>
          ${chartHtml}
        </div>
      ` : ''}
      <div class="narrative-content">
        ${narrativeHtml}
      </div>
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
    /* Phase 0: Cover Page Styles */
    ${getCoverPageStyles()}

    /* Phase 0: Chapter Strategic Context Styles */
    .chapter-strategic-context {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-left: 4px solid ${accentColor};
      border-radius: 0 8px 8px 0;
      padding: 1.5rem;
      margin: 1.5rem 0 2rem 0;
      page-break-inside: avoid;
    }

    .chapter-strategic-context p.lead-paragraph {
      font-size: 1.05rem;
      line-height: 1.7;
      color: #333;
      margin-bottom: 1rem;
    }

    .chapter-strategic-context p {
      font-size: 1rem;
      line-height: 1.7;
      color: #444;
      margin-bottom: 1rem;
    }

    .chapter-strategic-context p:last-child {
      margin-bottom: 0;
    }

    /* Phase 0: Enhanced Recommendation Styles */
    .recommendation-block {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 1.5rem;
      margin: 1.5rem 0;
      page-break-inside: avoid;
    }

    .recommendation-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .context-block {
      padding: 1rem 1.25rem;
      margin: 1rem 0;
      border-radius: 0 8px 8px 0;
    }

    .context-block.why-matters {
      background: #e7f3ff;
      border-left: 4px solid #0d6efd;
    }

    .context-block.what-we-found {
      background: #f8f9fa;
      border-left: 4px solid ${accentColor};
    }

    .risk-of-inaction {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
      border-radius: 0 8px 8px 0;
    }

    .action-steps-visual {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .action-step:nth-child(even) {
      background: #f8f9fa;
    }

    .success-criteria {
      margin: 1rem 0;
    }

    .success-criteria-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }

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
  // Dimension-level visualizations (Phase 1B - adds 24+ SVGs)
  dimensionGaugesGrid: string;
  dimensionBenchmarkBars: string;
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
  // World-class visual components (Phase 1.5-2)
  executiveRadar12Dimension: string;
  financialImpactDashboard: string;
  actionPlanCards: string;
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
  const scorecardGrid = ctx.chapters && ctx.chapters.length > 0
    ? generateScorecardGrid(chaptersToScorecardItems(ctx.chapters))
    : '';

  // Generate chapter radar chart (SVG)
  const chapterRadarChart = generateChapterRadarChartViz(ctx);

  // Generate overall health gauge chart (SVG)
  const overallGaugeChart = generateOverallGaugeViz(ctx);

  // Generate risk heatmap
  const riskHeatmap = ctx.risks && ctx.risks.length > 0 ? renderRiskHeatmapFromRisks(ctx.risks) : '';

  // Generate risk matrix visualization
  const riskMatrix = ctx.risks && ctx.risks.length > 0 ? generateRiskMatrix(risksToMatrixItems(ctx.risks)) : '';

  // Generate roadmap timeline
  const roadmapTimeline = generateRoadmapTimelineViz(ctx);

  // Generate recommendations list
  const quickWinIds = new Set(ctx.quickWins?.map(qw => qw.id) || []);
  const recommendationsList = ctx.recommendations && ctx.recommendations.length > 0
    ? generateRecommendationsList(recommendationsToCardProps(ctx.recommendations, quickWinIds))
    : '';

  // Generate quick wins summary - fix property mapping for QuickWinDisplay interface
  const quickWinsSummary = ctx.quickWins && ctx.quickWins.length > 0
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
  const findingsGrid = ctx.findings && ctx.findings.length > 0
    ? generateFindingsGrid(findingsToGridProps(ctx.findings))
    : '';

  // Generate benchmark comparison table
  const benchmarkTable = ctx.chapters && ctx.chapters.length > 0
    ? generateBenchmarkComparisonTable(
      ctx.chapters.map(ch => ({
      name: ch.name,
      score: ch.score,
      benchmark: ch.industryBenchmark || 65,
      delta: ch.score - (ch.industryBenchmark || 65),
    })))
    : '';

  // Generate executive highlights row
  const executiveHighlightsRow = generateExecutiveHighlightsRow([
    { icon: '📊', value: ctx.overallHealth?.score?.toString() || '0', label: 'Health Score', color: getScoreBandColor(ctx.overallHealth?.score || 0) },
    { icon: '📈', value: (ctx.findings?.filter(f => f.type === 'strength')?.length || 0).toString(), label: 'Strengths', color: '#28a745' },
    { icon: '⚠️', value: (ctx.risks?.length || 0).toString(), label: 'Risks', color: '#dc3545' },
    { icon: '🎯', value: (ctx.recommendations?.length || 0).toString(), label: 'Actions', color: '#212653' },
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

  // ============================================================================
  // PHASE 1B: DIMENSION-LEVEL VISUALIZATIONS (adds 24+ SVGs)
  // ============================================================================

  // Generate dimension gauges grid (12 SVGs - one per dimension)
  const dimensionGaugesGrid = generateDimensionGaugesGrid(ctx);

  // Generate dimension benchmark bars (12 SVGs - one per dimension)
  const dimensionBenchmarkBars = generateDimensionBenchmarkBarsViz(ctx);

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

  // ============================================================================
  // WORLD-CLASS VISUAL COMPONENTS (Phase 1.5-2)
  // ============================================================================

  // Generate 12-Dimension Executive Radar
  const executiveRadar12Dimension = generate12DimensionExecutiveRadarViz(ctx);

  // Generate Financial Impact Dashboard
  const financialImpactDashboard = generateFinancialImpactDashboardViz(ctx);

  // Generate Action Plan Cards
  const actionPlanCards = generateActionPlanCardsViz(ctx);

  logger.info({
    visualCount: Object.values({
      executiveDashboard, keyStatsRow, scorecardGrid, chapterRadarChart,
      overallGaugeChart, chapterGauges,
      // Phase 1B: Dimension-level visualizations
      dimensionGaugesGrid, dimensionBenchmarkBars,
      riskHeatmap, riskMatrix, riskSeverityDonut,
      roadmapTimeline, roadmapTimelineSVG, recommendationsList, recommendationsDonut,
      quickWinsSummary, investmentDonut, impactBars, findingsGrid, benchmarkTable,
      benchmarkBars, executiveHighlightsRow, keyTakeawaysBox,
      // World-class components
      executiveRadar12Dimension, financialImpactDashboard, actionPlanCards
    }).filter(v => v).length
  }, 'Phase 5 visualizations generated (including Phase 1B dimension visualizations)');

  return {
    executiveDashboard,
    keyStatsRow,
    scorecardGrid,
    chapterRadarChart,
    overallGaugeChart,
    chapterGauges,
    // Phase 1B: Dimension-level visualizations
    dimensionGaugesGrid,
    dimensionBenchmarkBars,
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
    // World-class visual components (Phase 1.5-2)
    executiveRadar12Dimension,
    financialImpactDashboard,
    actionPlanCards,
  };
}

/**
 * Get color based on score band - now using shared ScoreBands utility
 */
function getScoreBandColor(score: number): string {
  return ScoreBands.getColor(score);
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
 * Generate chapter radar chart visualization (SVG) with fallback support
 */
function generateChapterRadarChartViz(ctx: ReportContext): string {
  // Fallback if no chapter data
  if (!ctx.chapters || ctx.chapters.length === 0) {
    return generateChartFallback(
      'Chapter Performance Overview',
      'Chapter score comparison chart is unavailable due to missing data.'
    );
  }

  try {
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
  } catch (error) {
    logger.error({ error }, 'Failed to generate chapter radar chart');
    return generateChartFallback(
      'Chapter Performance Overview',
      'Unable to render chapter comparison chart. Please see the scorecard section for detailed scores.'
    );
  }
}

/**
 * Generate a user-friendly fallback when a chart cannot be rendered
 */
function generateChartFallback(title: string, message: string): string {
  return `
    <div class="chart-fallback" role="figure" aria-label="${escapeHtml(title)} - unavailable" style="
      background: #f8f9fa;
      border: 1px dashed #dee2e6;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      color: #666666;
      margin: 1rem 0;
    ">
      <div class="chart-fallback-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
      <h4 style="color: #212653; margin-bottom: 0.5rem; font-family: 'Montserrat', sans-serif;">${escapeHtml(title)}</h4>
      <p style="font-size: 0.9rem; color: #666; margin: 0;">${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Generate overall health gauge visualization (SVG)
 */
function generateOverallGaugeViz(ctx: ReportContext): string {
  if (!ctx.overallHealth) return '';

  const svg = generateGaugeChartSVG({
    value: ctx.overallHealth.score || 0,
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
  if (!ctx.overallHealth || !ctx.chapters) {
    return '<div class="metrics-unavailable">Executive metrics unavailable</div>';
  }

  const metrics = [
    {
      label: 'Overall Health',
      value: ctx.overallHealth.score || 0,
      unit: '/100',
      status: getScoreBand(ctx.overallHealth.score || 0) as ScoreBand,
      trend: ctx.overallHealth.trajectory === 'Improving' ? 'up' as const :
             ctx.overallHealth.trajectory === 'Declining' ? 'down' as const : 'flat' as const
    },
    ...ctx.chapters.map(chapter => ({
      label: chapter.name,
      value: chapter.score || 0,
      unit: '/100',
      status: getScoreBand(chapter.score || 0) as ScoreBand
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
  if (!ctx.overallHealth || !ctx.dimensions || !ctx.findings || !ctx.recommendations || !ctx.quickWins) {
    return '<div class="stats-unavailable">Statistics unavailable</div>';
  }

  const score = ctx.overallHealth.score || 0;
  const statusColor = score >= 80 ? '#28a745' :
                      score >= 60 ? '#969423' :
                      score >= 40 ? '#ffc107' : '#dc3545';

  return renderQuickStatsRow([
    { label: 'Health Score', value: score, color: statusColor },
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
  const riskMatrix = riskMatrixHtml || (ctx.risks && ctx.risks.length > 0
    ? generateRiskMatrix(risksToMatrixItems(ctx.risks))
    : '');

  // NOTE: Removed <section> wrapper - the calling code wraps this in a section
  return `
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
              ${ctx.risks?.length || 0} risks plotted by severity × likelihood
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

  // P2: Generate 90-Day Priority Actions table from recommendations
  const ninetyDayActionsTable = buildNinetyDayActionsTable(ctx);

  // NOTE: Removed <section> wrapper - the calling code wraps this in a section
  return `
      <div class="section-header">
        <h2>Implementation Roadmap</h2>
      </div>

      <!-- 18-Month Timeline Visualization -->
      ${timelineHtml ? `
        <div class="roadmap-timeline-container" style="margin: 1.5rem 0; page-break-inside: avoid;">
          ${timelineHtml}
        </div>
      ` : ''}

      <!-- P2: 90-Day Priority Actions Table -->
      ${ninetyDayActionsTable ? `
        <div class="ninety-day-actions" style="margin: 2rem 0; page-break-inside: avoid;">
          <h3 class="bh-subsection-heading bh-h3" style="
            font-family: 'Montserrat', sans-serif;
            font-size: 16pt;
            font-weight: 600;
            color: #212653;
            margin-bottom: 1rem;
          ">90-Day Priority Actions</h3>
          ${ninetyDayActionsTable}
        </div>
      ` : ''}

      ${sanitizedNarrative ? `
        <div class="narrative-content">
          ${sanitizedNarrative}
        </div>
      ` : structuredRoadmap}
  `;
}

// ============================================================================
// P2: 90-DAY PRIORITY ACTIONS TABLE (Implementation Roadmap Enhancement)
// ============================================================================

/**
 * Builds a data-driven 90-day priority actions table from IDM recommendations.
 * Only includes critical/high priority items with short-term horizons.
 *
 * @param ctx - Report context containing recommendations
 * @returns HTML string for the 90-day priority actions table
 */
function buildNinetyDayActionsTable(ctx: ReportContext): string {
  // Filter to critical/high priority recommendations with 90-day horizons
  const recs = (ctx.recommendations || [])
    .filter(r => {
      const priority = String(r.priority || '').toLowerCase();
      const horizon = String(r.timeHorizon || r.horizon || '').toLowerCase();
      const isCriticalOrHigh = priority === 'critical' || priority === 'high' ||
                                (r.priorityRank && r.priorityRank <= 5);
      const isShortTerm = horizon.includes('90') || horizon.includes('0-90') ||
                          horizon.includes('quick') || horizon.includes('immediate') ||
                          (r.paybackMonths && r.paybackMonths <= 3);
      return isCriticalOrHigh && isShortTerm;
    })
    .sort((a, b) => {
      // Sort critical before high
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
      const aPriority = priorityOrder[String(a.priority || 'medium').toLowerCase()] ?? 2;
      const bPriority = priorityOrder[String(b.priority || 'medium').toLowerCase()] ?? 2;
      return aPriority - bPriority;
    })
    .slice(0, 7); // Cap for readability

  if (!recs.length) {
    return `<p class="bh-paragraph" style="color: #666; font-style: italic;">
      No critical or high-priority 90-day actions identified. Review strategic recommendations for longer-term initiatives.
    </p>`;
  }

  const rows = recs.map(r => {
    const priority = String(r.priority || 'high').toLowerCase();
    const priorityBadge = priority === 'critical'
      ? '<span style="background: #dc3545; color: white; padding: 2pt 8pt; border-radius: 10pt; font-size: 8pt; text-transform: uppercase; font-weight: 600;">Critical</span>'
      : '<span style="background: #ffc107; color: #212653; padding: 2pt 8pt; border-radius: 10pt; font-size: 8pt; text-transform: uppercase; font-weight: 600;">High</span>';

    const title = r.title || r.theme || r.narrative?.substring(0, 60) || 'Untitled Action';
    const owner = r.owner || r.responsibleParty || 'TBD';
    const linkedArea = r.dimensionCode || r.linkedDimension || r.category || '—';

    return `
      <tr class="bh-tr">
        <td class="bh-td" style="font-weight: 600;">${escapeHtml(title)}</td>
        <td class="bh-td">${escapeHtml(owner)}</td>
        <td class="bh-td">${priorityBadge}</td>
        <td class="bh-td">${escapeHtml(linkedArea)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-responsive" style="margin: 16pt 0 24pt 0;">
      <table class="bh-table">
        <thead>
          <tr class="bh-tr">
            <th class="bh-th" style="width: 40%;">Action</th>
            <th class="bh-th" style="width: 20%;">Owner</th>
            <th class="bh-th" style="width: 15%;">Priority</th>
            <th class="bh-th" style="width: 25%;">Linked Area</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Get initiative timeframe from recommendation data
 * P3.2: Helper for Investment Summary timeframe column
 *
 * @param rec - Recommendation object
 * @returns Formatted timeframe string
 */
function getInitiativeTimeframe(rec: { timeHorizon?: string; horizon?: string }): string {
  const horizon = String(rec.timeHorizon || rec.horizon || '').toLowerCase();

  if (horizon.includes('90') || horizon.includes('0-90')) return '0–3 months';
  if (horizon.includes('6') && !horizon.includes('12')) return '3–6 months';
  if (horizon.includes('12') && !horizon.includes('18')) return '6–12 months';
  if (horizon.includes('18')) return '12–18 months';

  // Default formatting
  return rec.timeHorizon || rec.horizon || '—';
}

// ============================================================================
// NEW PHASE 5 VISUALIZATION FUNCTIONS (B1-B4)
// ============================================================================

/**
 * B1: Generate chapter gauges - one gauge per chapter
 */
function generateChapterGaugesViz(ctx: ReportContext): string {
  if (!ctx.chapters || ctx.chapters.length === 0) return '';

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
 * B1b: Generate 12-dimension gauges grid visualization
 * Adds 12 SVG gauges (one for each dimension) to reach 50+ total visualizations
 */
function generateDimensionGaugesGrid(ctx: ReportContext): string {
  if (!ctx.dimensions || ctx.dimensions.length === 0) return '';

  const gauges = ctx.dimensions.map(dimension => {
    const svg = generateGaugeChartSVG({
      value: dimension.score,
      maxValue: 100,
      label: dimension.name,
    }, {
      width: 120,
      height: 80,
      showValue: true,
      showLabel: true,
      colorBands: [
        { min: 0, max: 40, color: '#dc3545' },
        { min: 40, max: 60, color: '#ffc107' },
        { min: 60, max: 80, color: '#969423' },
        { min: 80, max: 100, color: '#28a745' },
      ],
    });

    return `
      <div class="dimension-gauge-item" style="text-align: center;">
        ${svg}
        <span class="dimension-code" style="font-size: 0.7rem; color: #666; display: block; margin-top: 4px;">${escapeHtml(dimension.code || '')}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="dimension-gauges-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 2rem 0;">
      ${gauges}
    </div>
  `;
}

/**
 * B1c: Generate dimension benchmark comparison bars
 * Adds 12 SVG benchmark bars (one for each dimension)
 */
function generateDimensionBenchmarkBarsViz(ctx: ReportContext): string {
  if (!ctx.dimensions || ctx.dimensions.length === 0) return '';

  const bars = ctx.dimensions.map(dimension => {
    const benchmarkScore = dimension.benchmark?.peerPercentile || 60;

    return generateHorizontalBarChartSVG({
      items: [{
        label: dimension.name,
        value: dimension.score,
        benchmark: benchmarkScore,
      }],
      maxValue: 100,
    }, {
      width: 280,
      height: 40,
      showBenchmark: true,
      showValues: true,
    });
  }).join('');

  return `
    <div class="dimension-benchmark-bars" style="margin: 2rem 0;">
      ${bars}
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
  if (!ctx.recommendations || ctx.recommendations.length === 0) return '';

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
  if (!ctx.recommendations || ctx.recommendations.length === 0) return '';

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
  if (!ctx.chapters || ctx.chapters.length === 0) return '';

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

// ============================================================================
// WORLD-CLASS VISUAL COMPONENTS (Phase 1.5-2) HELPER FUNCTIONS
// ============================================================================

/**
 * Generate 12-Dimension Executive Radar visualization
 * Signature visualization showing all 12 business dimensions in a radar chart
 */
function generate12DimensionExecutiveRadarViz(ctx: ReportContext): string {
  // Fallback if no dimension data
  if (!ctx.dimensions || ctx.dimensions.length === 0) {
    return generateChartFallback(
      '12-Dimension Business Health Overview',
      'Dimension comparison chart is unavailable due to missing data.'
    );
  }

  try {
    // Convert ReportContext to radar data format
    const radarData = contextToExecutiveRadarData(ctx);

    if (!radarData || radarData.dimensions.length === 0) {
      logger.warn('No radar data generated from context');
      return generateChartFallback(
        '12-Dimension Business Health Overview',
        'Unable to generate dimension data for radar chart.'
      );
    }

    // Render the 12-dimension executive radar
    const radarHtml = render12DimensionExecutiveRadar(radarData, {
      width: 600,
      height: 500,
      showBenchmark: true,
      showLegend: true,
      animated: false, // Static for PDF
    });

    return `
      <div class="world-class-executive-radar" style="margin: 2rem 0; page-break-inside: avoid;">
        <h3 style="color: #212653; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem; text-align: center;">
          12-Dimension Business Health Overview
        </h3>
        <div class="svg-chart-container" role="figure" aria-label="12-Dimension Executive Radar Chart" style="display: flex; justify-content: center;">
          ${radarHtml}
        </div>
        <p class="chart-caption" style="text-align: center; color: #666; font-size: 0.85rem; margin-top: 0.75rem;">
          ${ctx.companyProfile.name}'s performance across all 12 business dimensions vs. industry benchmark
        </p>
      </div>
    `;
  } catch (error) {
    logger.error({ error }, 'Failed to generate 12-dimension executive radar');
    return generateChartFallback(
      '12-Dimension Business Health Overview',
      'Unable to render dimension comparison chart. Please see the detailed dimension analysis sections.'
    );
  }
}

/**
 * Generate Financial Impact Dashboard visualization
 * 4-quadrant executive financial summary with ROI projections
 */
function generateFinancialImpactDashboardViz(ctx: ReportContext): string {
  try {
    // Convert ReportContext to financial impact data
    const financialData = contextToFinancialImpactData(ctx);

    if (!financialData) {
      logger.warn('No financial impact data generated from context');
      return '';
    }

    // Render the financial impact dashboard
    const dashboardHtml = generateFinancialImpactDashboard(financialData, {
      showROI: true,
      showTimeline: true,
      companyName: ctx.companyProfile.name,
    });

    return `
      <div class="world-class-financial-dashboard" style="margin: 2rem 0; page-break-inside: avoid;">
        ${dashboardHtml}
      </div>
    `;
  } catch (error) {
    logger.error({ error }, 'Failed to generate financial impact dashboard');
    return '';
  }
}

/**
 * Generate Action Plan Cards visualization
 * Strategic action cards with expandable details and priority indicators
 */
function generateActionPlanCardsViz(ctx: ReportContext): string {
  if (!ctx.recommendations || ctx.recommendations.length === 0) return '';

  try {
    // Convert ReportContext to action plan card data
    const actionCards = contextToActionPlanCards(ctx);

    if (!actionCards || actionCards.length === 0) {
      logger.warn('No action plan cards generated from context');
      return '';
    }

    // Render the action plan cards grid (top 6 cards)
    const cardsHtml = generateActionPlanCardGrid(actionCards.slice(0, 6), {
      columns: 2,
      showExpandedDetails: false, // Collapsed for overview
      showTimeline: true,
      showROI: true,
    });

    return `
      <div class="world-class-action-cards" style="margin: 2rem 0;">
        <h3 style="color: #212653; font-family: 'Montserrat', sans-serif; margin-bottom: 1.25rem;">
          Strategic Action Plan
        </h3>
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
          Top ${Math.min(actionCards.length, 6)} recommended initiatives for ${ctx.companyProfile.name}
        </p>
        ${cardsHtml}
      </div>
    `;
  } catch (error) {
    logger.error({ error }, 'Failed to generate action plan cards');
    return '';
  }
}

// ============================================================================
// ASCII CODE BLOCK REPLACEMENT (P1 Visual Patch)
// ============================================================================

/**
 * Replace ASCII code blocks with branded HTML components
 *
 * Targets four specific patterns from AI-generated content:
 * 1. Sales Velocity Calculation
 * 2. Revenue Impact of Loyalty
 * 3. Target State (Response Time Improvement Roadmap)
 * 4. ROI Projection (Response Time Improvement ROI)
 *
 * @param html - Raw HTML with potential ASCII code blocks
 * @returns Object with processed HTML and replacement count
 */
function replaceAsciiCodeBlocksWithBrandedHTML(html: string): { html: string; replacementCount: number } {
  let replacementCount = 0;
  let processedHtml = html;

  // Pattern 1: Sales Velocity Calculation
  const salesVelocityPattern = /<pre class="bh-code-block"><code class="bh-code">Sales Velocity = \(# Opportunities × Deal Value × Win Rate\) \/ Sales Cycle[\s\S]*?Current State:[\s\S]*?Velocity = [\s\S]*?<\/code><\/pre>/gi;

  processedHtml = processedHtml.replace(salesVelocityPattern, (match) => {
    replacementCount++;
    // Extract values from the matched content
    const pipelineMatch = match.match(/Estimated Active Pipeline:?\s*~?\$?([0-9.]+)M/i);
    const dealSizeMatch = match.match(/Average Deal Size:?\s*\$?([0-9,]+)/i);
    const closeRateMatch = match.match(/Close Rate:?\s*([0-9]+)%/i);
    const cycleMatch = match.match(/Sales Cycle:?\s*([0-9]+)\s*days/i);
    const velocityMatch = match.match(/~?\$?([0-9.]+)M\s*(?:in\s*)?(?:expected\s*)?(?:monthly\s*)?(?:closed\s*)?(?:revenue)?/i);

    const pipeline = pipelineMatch ? pipelineMatch[1] : '58';
    const dealSize = dealSizeMatch ? dealSizeMatch[1] : '425,000';
    const closeRate = closeRateMatch ? closeRateMatch[1] : '32';
    const cycle = cycleMatch ? cycleMatch[1] : '120';
    const velocity = velocityMatch ? velocityMatch[1] : '1.13';

    return generateSalesVelocityCallout(pipeline, dealSize, closeRate, cycle, velocity);
  });

  // Pattern 2: Revenue Impact of Loyalty
  const loyaltyPattern = /<p class="bh-paragraph"><strong class="bh-emphasis">Revenue Impact of Loyalty:<\/strong><\/p>\s*<pre class="bh-code-block"><code class="bh-code">[\s\S]*?repeat business[\s\S]*?from returning customers[\s\S]*?<\/code><\/pre>/gi;

  processedHtml = processedHtml.replace(loyaltyPattern, (match) => {
    replacementCount++;
    // Extract values
    const repeatMatch = match.match(/([0-9]+)%?\s*repeat business\s*=?\s*\$?([0-9.]+)M/i);
    const referralMatch = match.match(/Referral pipeline[\s\S]*?=?\s*([0-9]+)-?([0-9]+)?%/i);

    const repeatPercent = repeatMatch ? repeatMatch[1] : '55';
    const repeatRevenue = repeatMatch ? repeatMatch[2] : '10.2';
    const referralLow = referralMatch ? referralMatch[1] : '60';
    const referralHigh = referralMatch && referralMatch[2] ? referralMatch[2] : '70';

    return generateLoyaltyImpactCard(repeatPercent, repeatRevenue, referralLow, referralHigh);
  });

  // Pattern 3: Target State (Response Time Improvement Roadmap)
  const targetStatePattern = /<pre class="bh-code-block"><code class="bh-code">\s*RESPONSE TIME IMPROVEMENT ROADMAP[\s\S]*?Current State:[\s\S]*?Best-in-Class Target:[\s\S]*?<\/code><\/pre>/gi;

  processedHtml = processedHtml.replace(targetStatePattern, (match) => {
    replacementCount++;
    // Extract values
    const currentMatch = match.match(/Current State:\s*([0-9]+)\s*hours/i);
    const phase1Match = match.match(/Phase 1 Target:\s*([0-9]+)\s*hours\s*\(([0-9]+)-day/i);
    const phase2Match = match.match(/Phase 2 Target:\s*([0-9]+)\s*hours\s*\(([0-9]+)-day/i);
    const bestMatch = match.match(/Best-in-Class Target:\s*([0-9]+)\s*hours\s*\(([0-9]+)-month/i);

    const current = currentMatch ? currentMatch[1] : '16';
    const phase1Hours = phase1Match ? phase1Match[1] : '8';
    const phase1Days = phase1Match ? phase1Match[2] : '90';
    const phase2Hours = phase2Match ? phase2Match[1] : '4';
    const phase2Days = phase2Match ? phase2Match[2] : '180';
    const bestHours = bestMatch ? bestMatch[1] : '2';
    const bestMonths = bestMatch ? bestMatch[2] : '12';

    return generateResponseTimeTimeline(current, phase1Hours, phase1Days, phase2Hours, phase2Days, bestHours, bestMonths);
  });

  // Pattern 4: ROI Projection (Response Time Improvement ROI)
  const roiPattern = /<pre class="bh-code-block"><code class="bh-code">\s*RESPONSE TIME IMPROVEMENT ROI[\s\S]*?Assumption:[\s\S]*?ROI:[\s\S]*?<\/code><\/pre>/gi;

  processedHtml = processedHtml.replace(roiPattern, (match) => {
    replacementCount++;
    // Extract values
    const assumptionMatch = match.match(/([0-9]+)%\s*of lost leads/i);
    const leadVolumeMatch = match.match(/Current Annual Lead Volume:\s*~?([0-9]+)/i);
    const lostLeadsMatch = match.match(/Estimated Lost Leads:\s*([0-9]+)-?([0-9]+)?/i);
    const recoverableMatch = match.match(/Recoverable Leads[^:]*:\s*([0-9]+)-?([0-9]+)?/i);
    const revenueRecoveryMatch = match.match(/Revenue Recovery:\s*\$([0-9.]+)M\s*-\s*\$([0-9.]+)M/i);
    const actualClosedMatch = match.match(/Actual Closed[^:]*:\s*\$([0-9.]+)M\s*-\s*\$([0-9.]+)M/i);
    const investmentMatch = match.match(/Investment Required:\s*\$([0-9]+)K\s*-\s*\$([0-9]+)K/i);
    const roiMatch = match.match(/ROI:\s*([0-9]+)-([0-9]+)x/i);

    const assumption = assumptionMatch ? assumptionMatch[1] : '25';
    const leadVolume = leadVolumeMatch ? leadVolumeMatch[1] : '140';
    const lostLeadsLow = lostLeadsMatch ? lostLeadsMatch[1] : '35';
    const lostLeadsHigh = lostLeadsMatch && lostLeadsMatch[2] ? lostLeadsMatch[2] : '40';
    const recoverableLow = recoverableMatch ? recoverableMatch[1] : '17';
    const recoverableHigh = recoverableMatch && recoverableMatch[2] ? recoverableMatch[2] : '20';
    const revenueRecoveryLow = revenueRecoveryMatch ? revenueRecoveryMatch[1] : '7.2';
    const revenueRecoveryHigh = revenueRecoveryMatch ? revenueRecoveryMatch[2] : '8.5';
    const actualClosedLow = actualClosedMatch ? actualClosedMatch[1] : '2.3';
    const actualClosedHigh = actualClosedMatch ? actualClosedMatch[2] : '2.7';
    const investmentLow = investmentMatch ? investmentMatch[1] : '150';
    const investmentHigh = investmentMatch ? investmentMatch[2] : '200';
    const roiLow = roiMatch ? roiMatch[1] : '10';
    const roiHigh = roiMatch ? roiMatch[2] : '15';

    return generateROIProjectionBlock(
      assumption, leadVolume, lostLeadsLow, lostLeadsHigh,
      recoverableLow, recoverableHigh, revenueRecoveryLow, revenueRecoveryHigh,
      actualClosedLow, actualClosedHigh, investmentLow, investmentHigh, roiLow, roiHigh
    );
  });

  return { html: processedHtml, replacementCount };
}

/**
 * Generate Sales Velocity Calculation callout card
 */
function generateSalesVelocityCallout(
  pipeline: string, dealSize: string, closeRate: string, cycle: string, velocity: string
): string {
  return `
<div class="bh-callout bh-callout-math" style="
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 6px solid #212653;
  border-radius: 0 12pt 12pt 0;
  padding: 20pt 24pt;
  margin: 16pt 0 24pt 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  page-break-inside: avoid;
">
  <div class="bh-callout-header" style="display: flex; align-items: center; gap: 12pt; margin-bottom: 12pt;">
    <div class="bh-callout-icon" style="font-size: 18pt;">📊</div>
    <div>
      <div style="
        font-family: 'Montserrat', sans-serif;
        font-size: 14pt;
        font-weight: 600;
        color: #212653;
      ">Sales Velocity Analysis</div>
      <div style="
        font-family: 'Open Sans', sans-serif;
        font-size: 10pt;
        color: #666;
      ">How quickly opportunities convert into revenue</div>
    </div>
  </div>

  <div class="bh-callout-formula" style="
    font-family: 'Open Sans', sans-serif;
    font-size: 10pt;
    color: #444;
    margin-bottom: 12pt;
    padding: 10pt 14pt;
    background: #f8f9fa;
    border-radius: 6pt;
  ">
    <strong>Formula:</strong> Sales Velocity = (# Opportunities × Deal Value × Win Rate) / Sales Cycle
  </div>

  <div class="bh-metrics-grid" style="display: flex; flex-wrap: wrap; gap: 12pt; margin-bottom: 12pt;">
    <div style="flex: 1 1 180pt; min-width: 160pt; padding: 12pt; border-radius: 8pt; background: #fff; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; text-transform: uppercase; color: #666; letter-spacing: 0.5px;">Estimated Active Pipeline</div>
      <div style="font-size: 16pt; font-weight: 700; color: #212653;">~$${pipeline}M</div>
      <div style="font-size: 9pt; color: #888;">Based on revenue and cycle</div>
    </div>
    <div style="flex: 1 1 180pt; min-width: 160pt; padding: 12pt; border-radius: 8pt; background: #fff; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; text-transform: uppercase; color: #666; letter-spacing: 0.5px;">Average Deal Size</div>
      <div style="font-size: 16pt; font-weight: 700; color: #212653;">$${dealSize}</div>
    </div>
    <div style="flex: 1 1 180pt; min-width: 160pt; padding: 12pt; border-radius: 8pt; background: #fff; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; text-transform: uppercase; color: #666; letter-spacing: 0.5px;">Close Rate</div>
      <div style="font-size: 16pt; font-weight: 700; color: #212653;">${closeRate}%</div>
    </div>
    <div style="flex: 1 1 180pt; min-width: 160pt; padding: 12pt; border-radius: 8pt; background: #fff; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; text-transform: uppercase; color: #666; letter-spacing: 0.5px;">Sales Cycle</div>
      <div style="font-size: 16pt; font-weight: 700; color: #212653;">${cycle} days</div>
    </div>
  </div>

  <div class="bh-callout-result" style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12pt;
    padding: 14pt 18pt;
    background: #e9f7ef;
    border-radius: 8pt;
    border: 1px solid #28a745;
  ">
    <div>
      <div style="font-size: 10pt; color: #155724; text-transform: uppercase; letter-spacing: 0.5px;">Current Velocity</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 20pt; font-weight: 700; color: #155724;">~$${velocity}M</div>
      <div style="font-size: 10pt; color: #155724;">Expected monthly closed revenue</div>
    </div>
    <div style="
      padding: 6pt 14pt;
      border-radius: 20pt;
      background: #28a745;
      color: white;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    ">Moderate for Construction Industry</div>
  </div>
</div>`;
}

/**
 * Generate Revenue Impact of Loyalty financial card
 */
function generateLoyaltyImpactCard(
  repeatPercent: string, repeatRevenue: string, referralLow: string, referralHigh: string
): string {
  return `
<div class="bh-card bh-card-financial" style="
  border-radius: 12pt;
  border: 1px solid #e0e0e0;
  padding: 20pt 24pt;
  margin: 16pt 0 24pt 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  page-break-inside: avoid;
">
  <div style="display: flex; align-items: center; gap: 12pt; margin-bottom: 16pt;">
    <div style="font-size: 24pt;">💰</div>
    <div style="
      font-family: 'Montserrat', sans-serif;
      font-size: 16pt;
      font-weight: 700;
      color: #212653;
    ">Revenue Impact of Customer Loyalty</div>
  </div>

  <div style="display: flex; flex-wrap: wrap; gap: 16pt; margin-bottom: 16pt;">
    <div style="flex: 1 1 200pt; padding: 16pt; background: #fff; border-radius: 8pt; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Repeat Business Revenue</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 24pt; font-weight: 700; color: #28a745;">$${repeatRevenue}M</div>
      <div style="font-size: 11pt; color: #333;">${repeatPercent}% of total revenue from returning customers</div>
      <div style="font-size: 10pt; color: #666; margin-top: 4pt;">Annual retention baseline</div>
    </div>
    <div style="flex: 1 1 200pt; padding: 16pt; background: #fff; border-radius: 8pt; border: 1px solid #e9ecef;">
      <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Referral Pipeline</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 24pt; font-weight: 700; color: #212653;">${referralLow}–${referralHigh}%</div>
      <div style="font-size: 11pt; color: #333;">Of new business from referrals</div>
      <div style="font-size: 10pt; color: #666; margin-top: 4pt;">Organic acquisition channel</div>
    </div>
  </div>

  <div style="
    padding: 14pt 18pt;
    background: #f8f9fa;
    border-radius: 8pt;
    border-left: 4px solid #969423;
  ">
    <div style="font-size: 11pt; font-weight: 600; color: #212653; margin-bottom: 8pt;">High Loyalty Creates:</div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8pt;">
      <div style="display: flex; align-items: center; gap: 8pt; font-size: 10pt; color: #333;">
        <span style="color: #28a745; font-size: 14pt;">✓</span> Lower acquisition costs on repeat business
      </div>
      <div style="display: flex; align-items: center; gap: 8pt; font-size: 10pt; color: #333;">
        <span style="color: #28a745; font-size: 14pt;">✓</span> Predictable revenue baseline
      </div>
      <div style="display: flex; align-items: center; gap: 8pt; font-size: 10pt; color: #333;">
        <span style="color: #28a745; font-size: 14pt;">✓</span> Organic referral pipeline
      </div>
      <div style="display: flex; align-items: center; gap: 8pt; font-size: 10pt; color: #333;">
        <span style="color: #28a745; font-size: 14pt;">✓</span> Cross-sell/upsell opportunities
      </div>
    </div>
  </div>
</div>`;
}

/**
 * Generate Response Time Improvement Timeline
 */
function generateResponseTimeTimeline(
  current: string, phase1Hours: string, phase1Days: string,
  phase2Hours: string, phase2Days: string, bestHours: string, bestMonths: string
): string {
  return `
<div class="bh-timeline bh-timeline-horizontal" style="
  margin: 16pt 0 24pt 0;
  padding: 20pt 24pt;
  border-radius: 12pt;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 6px solid #969423;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  page-break-inside: avoid;
">
  <div style="
    font-family: 'Montserrat', sans-serif;
    font-size: 14pt;
    font-weight: 700;
    color: #212653;
    margin-bottom: 16pt;
    display: flex;
    align-items: center;
    gap: 10pt;
  ">
    <span style="font-size: 20pt;">⏱️</span>
    Response Time Improvement Roadmap
  </div>

  <div style="display: flex; flex-wrap: wrap; gap: 12pt;">
    <!-- Current State -->
    <div style="flex: 1 1 140pt; min-width: 130pt; padding: 14pt; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #856404; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4pt;">Current State</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 28pt; font-weight: 700; color: #856404; line-height: 1;">${current}</div>
      <div style="font-size: 11pt; color: #856404;">hours</div>
    </div>

    <!-- Arrow -->
    <div style="display: flex; align-items: center; color: #ccc; font-size: 20pt;">→</div>

    <!-- Phase 1 -->
    <div style="flex: 1 1 140pt; min-width: 130pt; padding: 14pt; background: #e7f1ff; border: 2px solid #0d6efd; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #0a58ca; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4pt;">Phase 1 (${phase1Days} days)</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 28pt; font-weight: 700; color: #0a58ca; line-height: 1;">${phase1Hours}</div>
      <div style="font-size: 11pt; color: #0a58ca;">hours</div>
    </div>

    <!-- Arrow -->
    <div style="display: flex; align-items: center; color: #ccc; font-size: 20pt;">→</div>

    <!-- Phase 2 -->
    <div style="flex: 1 1 140pt; min-width: 130pt; padding: 14pt; background: #e7f1ff; border: 2px solid #0d6efd; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #0a58ca; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4pt;">Phase 2 (${phase2Days} days)</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 28pt; font-weight: 700; color: #0a58ca; line-height: 1;">${phase2Hours}</div>
      <div style="font-size: 11pt; color: #0a58ca;">hours</div>
    </div>

    <!-- Arrow -->
    <div style="display: flex; align-items: center; color: #ccc; font-size: 20pt;">→</div>

    <!-- Best-in-Class -->
    <div style="flex: 1 1 140pt; min-width: 130pt; padding: 14pt; background: #d4edda; border: 2px solid #28a745; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #155724; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4pt;">Best-in-Class (${bestMonths} mo)</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 28pt; font-weight: 700; color: #155724; line-height: 1;">${bestHours}</div>
      <div style="font-size: 11pt; color: #155724;">hours</div>
    </div>
  </div>
</div>`;
}

/**
 * Generate ROI Projection summary block
 */
function generateROIProjectionBlock(
  assumption: string, leadVolume: string, lostLeadsLow: string, lostLeadsHigh: string,
  recoverableLow: string, recoverableHigh: string, revenueRecoveryLow: string, revenueRecoveryHigh: string,
  actualClosedLow: string, actualClosedHigh: string, investmentLow: string, investmentHigh: string,
  roiLow: string, roiHigh: string
): string {
  return `
<div class="bh-roi-summary" style="
  margin: 16pt 0 24pt 0;
  padding: 20pt 24pt;
  border-radius: 12pt;
  border: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  page-break-inside: avoid;
">
  <div style="display: flex; align-items: center; gap: 12pt; margin-bottom: 16pt;">
    <div style="font-size: 24pt;">💵</div>
    <div style="
      font-family: 'Montserrat', sans-serif;
      font-size: 16pt;
      font-weight: 700;
      color: #212653;
    ">Response Time Improvement ROI</div>
  </div>

  <!-- Key Assumption Callout -->
  <div style="
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6pt;
    padding: 10pt 14pt;
    margin-bottom: 16pt;
    font-size: 10pt;
    color: #856404;
  ">
    <strong>Key Assumption:</strong> ${assumption}% of lost leads attributable to slow response
  </div>

  <!-- Calculation Waterfall -->
  <div style="margin-bottom: 16pt;">
    <div style="display: flex; justify-content: space-between; padding: 8pt 12pt; background: #f8f9fa; border-left: 3px solid #6c757d; margin-bottom: 4pt; border-radius: 0 4pt 4pt 0;">
      <span style="font-size: 10pt; color: #333;">Current Annual Lead Volume</span>
      <span style="font-size: 10pt; font-weight: 600; color: #212653;">~${leadVolume} leads</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8pt 12pt; background: #f8f9fa; border-left: 3px solid #6c757d; margin-bottom: 4pt; border-radius: 0 4pt 4pt 0;">
      <span style="font-size: 10pt; color: #333;">Estimated Lost Leads</span>
      <span style="font-size: 10pt; font-weight: 600; color: #212653;">${lostLeadsLow}–${lostLeadsHigh} annually</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8pt 12pt; background: #f8f9fa; border-left: 3px solid #6c757d; margin-bottom: 4pt; border-radius: 0 4pt 4pt 0;">
      <span style="font-size: 10pt; color: #333;">Recoverable Leads (50%)</span>
      <span style="font-size: 10pt; font-weight: 600; color: #212653;">${recoverableLow}–${recoverableHigh} leads</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8pt 12pt; background: #e7f1ff; border-left: 3px solid #0d6efd; margin-bottom: 4pt; border-radius: 0 4pt 4pt 0;">
      <span style="font-size: 10pt; color: #333;">Revenue Recovery Potential</span>
      <span style="font-size: 10pt; font-weight: 600; color: #0a58ca;">$${revenueRecoveryLow}M – $${revenueRecoveryHigh}M</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8pt 12pt; background: #d4edda; border-left: 3px solid #28a745; border-radius: 0 4pt 4pt 0;">
      <span style="font-size: 10pt; color: #333;">Actual Closed (32% rate)</span>
      <span style="font-size: 10pt; font-weight: 700; color: #155724;">$${actualClosedLow}M – $${actualClosedHigh}M additional revenue</span>
    </div>
  </div>

  <!-- Investment vs Return Summary -->
  <div style="display: flex; flex-wrap: wrap; gap: 12pt;">
    <div style="flex: 1 1 160pt; padding: 16pt; background: #f8d7da; border: 2px solid #dc3545; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #721c24; text-transform: uppercase; letter-spacing: 0.5px;">Investment Required</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 18pt; font-weight: 700; color: #721c24;">$${investmentLow}K – $${investmentHigh}K</div>
    </div>
    <div style="flex: 1 1 160pt; padding: 16pt; background: #d4edda; border: 2px solid #28a745; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: #155724; text-transform: uppercase; letter-spacing: 0.5px;">Expected Return</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 18pt; font-weight: 700; color: #155724;">$${actualClosedLow}M – $${actualClosedHigh}M</div>
    </div>
    <div style="flex: 1 1 160pt; padding: 16pt; background: #212653; border-radius: 8pt; text-align: center;">
      <div style="font-size: 9pt; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">ROI Multiple</div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 24pt; font-weight: 700; color: #969423;">${roiLow}–${roiHigh}x</div>
    </div>
  </div>
</div>`;
}

// ============================================================================
// Phase 1.5: Category Analysis Overview Section
// ============================================================================

/**
 * Generate Category Analysis Overview Section
 * Displays Phase 1.5 visualizations including radar chart, heatmap, and benchmark bars
 */
function generateCategoryAnalysisOverviewSection(
  ctx: ReportContext,
  options: ReportRenderOptions
): string {
  // Skip if no Phase 1.5 data
  if (!ctx.categoryAnalyses || ctx.categoryAnalyses.length === 0) {
    return '';
  }

  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;

  // Generate visualizations
  const radarChart = generateCategoryRadarChart(ctx.categoryAnalyses, {
    showBenchmark: true,
    showScoreValues: true
  });

  const heatmap = ctx.chapterSummaries && ctx.chapterSummaries.length > 0
    ? generateChapterHeatmap(ctx.categoryAnalyses, ctx.chapterSummaries)
    : '';

  const benchmarkBars = generateCategoryBenchmarkBars(ctx.categoryAnalyses);

  const networkDiagram = ctx.crossCategoryInsights
    ? generateInterdependencyNetwork(ctx.crossCategoryInsights)
    : '';

  const priorityMatrix = ctx.crossCategoryInsights
    ? generatePriorityMatrix(ctx.crossCategoryInsights)
    : '';

  return `
    <section id="category-overview" class="section page-break">
      <h2 style="color: ${primaryColor}; border-bottom: 3px solid ${accentColor}; padding-bottom: 10px; margin-bottom: 1.5rem; font-family: 'Montserrat', sans-serif;">
        Category Health Overview
      </h2>

      <p style="color: #666; margin-bottom: 2rem; font-size: 1rem; line-height: 1.6;">
        This section provides a comprehensive view of performance across all 12 business categories,
        grouped into 4 strategic chapters. The analysis reveals patterns, interdependencies, and
        priority areas for improvement.
      </p>

      <div class="visualization-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">
        <div class="viz-panel">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">12-Category Performance Radar</h3>
          <div class="radar-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${radarChart}
          </div>
        </div>

        ${heatmap ? `
        <div class="viz-panel">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Chapter & Category Heatmap</h3>
          <div class="heatmap-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${heatmap}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="benchmark-section" style="margin: 30px 0;">
        <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Performance vs. Industry Benchmarks</h3>
        <div class="benchmark-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          ${benchmarkBars}
        </div>
      </div>

      ${networkDiagram ? `
      <div class="interdependency-section" style="margin: 30px 0;">
        <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Category Interdependencies</h3>
        <p style="color: #666; margin-bottom: 15px; font-size: 0.95rem;">
          This diagram shows how different business categories influence each other.
          Strong connections indicate where improvements can have cascading positive effects.
        </p>
        <div class="network-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          ${networkDiagram}
        </div>
      </div>
      ` : ''}

      ${priorityMatrix ? `
      <div class="priority-section" style="margin: 30px 0;">
        <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Category Priority Matrix</h3>
        <p style="color: #666; margin-bottom: 15px; font-size: 0.95rem;">
          This matrix helps prioritize focus areas based on urgency and potential impact.
          Categories in the upper-right quadrant require immediate attention.
        </p>
        <div class="priority-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          ${priorityMatrix}
        </div>
      </div>
      ` : ''}

      ${generateCategorySummaryCards(ctx, primaryColor, accentColor)}
    </section>
  `;
}

/**
 * Generate summary cards for each category
 */
function generateCategorySummaryCards(
  ctx: ReportContext,
  primaryColor: string,
  accentColor: string
): string {
  if (!ctx.categoryAnalyses || ctx.categoryAnalyses.length === 0) {
    return '';
  }

  // Group categories by chapter
  const chapterGroups: Record<string, typeof ctx.categoryAnalyses> = {};
  for (const cat of ctx.categoryAnalyses) {
    const chapter = cat.chapterCode || 'Other';
    if (!chapterGroups[chapter]) {
      chapterGroups[chapter] = [];
    }
    chapterGroups[chapter].push(cat);
  }

  const chapterNames: Record<string, string> = {
    'GE': 'Growth Engine',
    'PH': 'Performance & Health',
    'PL': 'People & Leadership',
    'RS': 'Resilience & Safeguards'
  };

  let html = `
    <div class="category-summary-section" style="margin-top: 40px;">
      <h3 style="color: ${primaryColor}; margin-bottom: 1.5rem; font-family: 'Montserrat', sans-serif;">Category Summaries by Chapter</h3>
  `;

  for (const [chapterCode, categories] of Object.entries(chapterGroups)) {
    const chapterName = chapterNames[chapterCode] || chapterCode;

    html += `
      <div class="chapter-category-group" style="margin-bottom: 2rem; page-break-inside: avoid;">
        <h4 style="color: ${primaryColor}; margin-bottom: 1rem; padding: 0.5rem 1rem; background: #f0f4f8; border-left: 4px solid ${accentColor};">
          ${chapterName}
        </h4>
        <div class="category-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
    `;

    for (const cat of categories) {
      const scoreColor = cat.overallScore >= 80 ? '#28a745' :
                         cat.overallScore >= 60 ? '#5cb85c' :
                         cat.overallScore >= 40 ? '#f0ad4e' :
                         cat.overallScore >= 20 ? '#d9534f' : '#c9302c';

      html += `
          <div class="category-card" style="
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h5 style="margin: 0; color: ${primaryColor}; font-size: 1rem;">${escapeHtml(cat.categoryName)}</h5>
              <div style="
                background: ${scoreColor};
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-weight: bold;
                font-size: 0.9rem;
              ">${cat.overallScore}</div>
            </div>
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">
              Status: <strong style="color: ${cat.status === 'Critical' ? '#c9302c' : cat.status === 'Excellent' ? '#28a745' : primaryColor};">${cat.status}</strong>
            </div>
            ${cat.executiveSummary ? `
              <p style="font-size: 0.85rem; color: #555; line-height: 1.5; margin: 0.75rem 0 0 0;">
                ${escapeHtml(cat.executiveSummary.substring(0, 200))}${cat.executiveSummary.length > 200 ? '...' : ''}
              </p>
            ` : ''}
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`;

  return html;
}

// ============================================================================
// Phase 1.5: Cross-Category Insights Section
// ============================================================================

/**
 * Generate Cross-Category Insights Section
 * Displays systemic patterns, cascade risks, and prioritization matrix
 */
function generateCrossCategoryInsightsSection(
  ctx: ReportContext,
  options: ReportRenderOptions
): string {
  // Skip if no cross-category insights data
  if (!ctx.crossCategoryInsights) {
    return '';
  }

  const insights = ctx.crossCategoryInsights;
  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;

  // Get category name helper
  const getCategoryName = (code: string): string => {
    const analysis = ctx.categoryAnalyses?.find(ca => ca.categoryCode === code);
    return analysis?.categoryName || code;
  };

  // Get priority class helper
  const getPriorityClass = (score: number): string => {
    if (score >= 8) return 'priority-critical';
    if (score >= 6) return 'priority-high';
    if (score >= 4) return 'priority-medium';
    return 'priority-low';
  };

  return `
    <section id="cross-category-insights" class="section page-break phase15-cross-category-insights">
      <h2 style="color: ${primaryColor}; border-bottom: 3px solid ${accentColor}; padding-bottom: 10px; margin-bottom: 1.5rem; font-family: 'Montserrat', sans-serif;">
        Cross-Category Analysis
      </h2>
      <p class="phase15-section-intro" style="color: #666; margin-bottom: 2rem; font-size: 1rem; line-height: 1.6;">
        Understanding how business categories interact reveals systemic patterns and helps
        prioritize improvements for maximum organizational impact. This analysis identifies
        recurring themes, cascade risks, and optimal improvement sequencing.
      </p>

      <!-- Systemic Patterns -->
      ${insights.systemicPatterns && insights.systemicPatterns.length > 0 ? `
        <div class="systemic-patterns" style="margin-bottom: 2.5rem;">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">
            Systemic Patterns Identified
          </h3>
          <p class="phase15-subsection-intro" style="color: #666; margin-bottom: 1rem; font-size: 0.95rem;">
            These patterns represent recurring themes that affect multiple areas of the business.
            Addressing systemic issues creates broad organizational benefits.
          </p>
          <div class="phase15-patterns-grid">
            ${insights.systemicPatterns.map(pattern => `
              <div class="phase15-pattern-card" style="
                padding: 1.25rem;
                background: white;
                border-radius: 8px;
                border-left: 4px solid ${primaryColor};
                margin-bottom: 1rem;
              ">
                <h4 style="margin: 0 0 0.5rem 0; color: ${primaryColor}; font-size: 1.1rem;">
                  ${escapeHtml(pattern.pattern)}
                </h4>
                <p style="color: #333; line-height: 1.6; margin-bottom: 0.75rem;">
                  ${escapeHtml(pattern.description)}
                </p>
                <div class="phase15-affected-categories" style="margin-top: 0.75rem;">
                  <span style="font-weight: 600; font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.25rem;">
                    Affected Categories:
                  </span>
                  <div class="phase15-category-tags" style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    ${pattern.affectedCategories.map(c => `
                      <span class="phase15-category-tag" style="
                        padding: 0.2rem 0.5rem;
                        background: ${primaryColor};
                        color: white;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: 600;
                      ">${getCategoryName(c)}</span>
                    `).join('')}
                  </div>
                </div>
                <div class="phase15-pattern-recommendation" style="
                  margin-top: 0.75rem;
                  padding: 0.75rem;
                  background: #e8f5e9;
                  border-radius: 4px;
                ">
                  <span style="font-weight: 600; color: #2e7d32; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">
                    Recommendation:
                  </span>
                  <p style="margin: 0; color: #333; font-size: 0.9rem; line-height: 1.5;">
                    ${escapeHtml(pattern.recommendation)}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Cascade Risks -->
      ${insights.interdependencyAnalysis?.cascadeRisks && insights.interdependencyAnalysis.cascadeRisks.length > 0 ? `
        <div class="cascade-risks" style="margin-bottom: 2.5rem;">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">
            Cascade Risk Alerts
          </h3>
          <p class="phase15-subsection-intro" style="color: #666; margin-bottom: 1rem; font-size: 0.95rem;">
            These alerts identify categories where poor performance may negatively impact other areas.
            Addressing trigger categories first prevents downstream issues.
          </p>
          <div class="phase15-cascade-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${insights.interdependencyAnalysis.cascadeRisks.map(risk => `
              <div class="phase15-cascade-card" style="
                padding: 1rem;
                background: white;
                border-radius: 8px;
                border: 1px solid #f8d7da;
                text-align: center;
              ">
                <div class="trigger" style="margin-bottom: 0.5rem;">
                  <span style="font-weight: 600; font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.25rem;">
                    Trigger Category:
                  </span>
                  <span class="phase15-category-tag trigger" style="
                    padding: 0.3rem 0.75rem;
                    background: #dc3545;
                    color: white;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                  ">${getCategoryName(risk.triggerCategory)}</span>
                </div>
                <div class="phase15-cascade-arrow" style="font-size: 1.5rem; color: #dc3545; margin: 0.5rem 0;">
                  ↓
                </div>
                <div class="affected" style="margin-bottom: 0.75rem;">
                  <span style="font-weight: 600; font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.25rem;">
                    At Risk Categories:
                  </span>
                  <div class="phase15-category-tags" style="display: flex; gap: 0.25rem; flex-wrap: wrap; justify-content: center;">
                    ${risk.affectedCategories.map(c => `
                      <span class="phase15-category-tag affected" style="
                        padding: 0.2rem 0.5rem;
                        background: #fd7e14;
                        color: white;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: 600;
                      ">${getCategoryName(c)}</span>
                    `).join('')}
                  </div>
                </div>
                <p class="phase15-risk-description" style="
                  margin-top: 0.75rem;
                  font-size: 0.9rem;
                  color: #555;
                  text-align: left;
                  line-height: 1.5;
                ">
                  ${escapeHtml(risk.riskDescription)}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Prioritization Matrix Table -->
      ${insights.prioritizationMatrix && insights.prioritizationMatrix.length > 0 ? `
        <div class="prioritization-section" style="margin-bottom: 2rem;">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">
            Improvement Prioritization Matrix
          </h3>
          <p class="phase15-subsection-intro" style="color: #666; margin-bottom: 1rem; font-size: 0.95rem;">
            Categories are ranked by a composite score considering urgency, potential impact, and implementation effort.
            Focus on high-priority categories for maximum ROI.
          </p>
          <div style="overflow-x: auto;">
            <table class="phase15-priority-table" style="
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            ">
              <thead>
                <tr>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: left; font-weight: 600;">Rank</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: left; font-weight: 600;">Category</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: center; font-weight: 600;">Urgency</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: center; font-weight: 600;">Impact</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: center; font-weight: 600;">Effort</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: center; font-weight: 600;">Priority</th>
                  <th style="background: ${primaryColor}; color: white; padding: 0.75rem; text-align: left; font-weight: 600;">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                ${insights.prioritizationMatrix
                  .sort((a, b) => b.priorityScore - a.priorityScore)
                  .map((item, index) => {
                    const priorityClass = getPriorityClass(item.priorityScore);
                    const bgColor = priorityClass === 'priority-critical' ? '#f8d7da' :
                                    priorityClass === 'priority-high' ? '#fff3cd' :
                                    priorityClass === 'priority-medium' ? '#d1ecf1' : '#f8f9fa';
                    return `
                      <tr style="background: ${bgColor};">
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; font-weight: 700; color: ${primaryColor};">
                          ${index + 1}
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">
                          <strong>${escapeHtml(item.categoryCode)}</strong>
                          <span style="display: block; font-size: 0.8rem; color: #666;">
                            ${getCategoryName(item.categoryCode)}
                          </span>
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; text-align: center;">
                          ${item.urgency}/10
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; text-align: center;">
                          ${item.impact}/10
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; text-align: center;">
                          ${item.effort}/10
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; text-align: center; font-weight: 700; color: ${primaryColor};">
                          ${item.priorityScore.toFixed(1)}
                        </td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; font-size: 0.9rem;">
                          ${escapeHtml(item.recommendation)}
                        </td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem;">
            <span style="display: flex; align-items: center; gap: 0.25rem;">
              <span style="width: 16px; height: 16px; background: #f8d7da; border-radius: 3px;"></span>
              Critical Priority (8-10)
            </span>
            <span style="display: flex; align-items: center; gap: 0.25rem;">
              <span style="width: 16px; height: 16px; background: #fff3cd; border-radius: 3px;"></span>
              High Priority (6-8)
            </span>
            <span style="display: flex; align-items: center; gap: 0.25rem;">
              <span style="width: 16px; height: 16px; background: #d1ecf1; border-radius: 3px;"></span>
              Medium Priority (4-6)
            </span>
            <span style="display: flex; align-items: center; gap: 0.25rem;">
              <span style="width: 16px; height: 16px; background: #f8f9fa; border-radius: 3px;"></span>
              Low Priority (0-4)
            </span>
          </div>
        </div>
      ` : ''}

      <!-- Chapter Summaries from Phase 1.5 -->
      ${ctx.chapterSummaries && ctx.chapterSummaries.length > 0 ? `
        <div class="chapter-summaries-section" style="margin-top: 2.5rem;">
          <h3 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">
            Chapter-Level Strategic Insights
          </h3>
          <p class="phase15-subsection-intro" style="color: #666; margin-bottom: 1.5rem; font-size: 0.95rem;">
            Each chapter represents a strategic area of the business. These summaries highlight
            the key strengths, challenges, and priority actions for each domain.
          </p>
          ${ctx.chapterSummaries.map(chapter => `
            <div class="chapter-summary-card" style="
              margin-bottom: 1.5rem;
              padding: 1.5rem;
              background: white;
              border-radius: 12px;
              border: 1px solid #e0e0e0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: ${primaryColor}; font-family: 'Montserrat', sans-serif; font-size: 1.1rem;">
                  ${escapeHtml(chapter.chapterName)}
                </h4>
                <div style="
                  background: ${chapter.overallScore >= 80 ? '#28a745' : chapter.overallScore >= 60 ? accentColor : chapter.overallScore >= 40 ? '#f0ad4e' : '#dc3545'};
                  color: white;
                  padding: 0.4rem 1rem;
                  border-radius: 20px;
                  font-weight: 600;
                ">${chapter.overallScore}/100</div>
              </div>

              ${chapter.executiveSummary ? `
                <p style="color: #333; line-height: 1.6; margin-bottom: 1rem; font-size: 0.95rem;">
                  ${escapeHtml(chapter.executiveSummary)}
                </p>
              ` : ''}

              <div class="phase15-chapter-insights-grid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
              ">
                <div class="phase15-insight-panel strengths" style="padding: 1rem; border-radius: 8px; background: #d4edda;">
                  <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #155724;">Key Strengths</h5>
                  <ul style="margin: 0; padding-left: 1rem; font-size: 0.85rem; color: #155724;">
                    ${(chapter.keyStrengths || []).slice(0, 3).map(s => `<li style="margin-bottom: 0.25rem;">${escapeHtml(s)}</li>`).join('') || '<li>No critical strengths identified</li>'}
                  </ul>
                </div>
                <div class="phase15-insight-panel weaknesses" style="padding: 1rem; border-radius: 8px; background: #f8d7da;">
                  <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #721c24;">Key Challenges</h5>
                  <ul style="margin: 0; padding-left: 1rem; font-size: 0.85rem; color: #721c24;">
                    ${(chapter.keyWeaknesses || []).slice(0, 3).map(w => `<li style="margin-bottom: 0.25rem;">${escapeHtml(w)}</li>`).join('') || '<li>No critical challenges identified</li>'}
                  </ul>
                </div>
                <div class="phase15-insight-panel actions" style="padding: 1rem; border-radius: 8px; background: #cce5ff;">
                  <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #004085;">Priority Actions</h5>
                  <ol style="margin: 0; padding-left: 1.25rem; font-size: 0.85rem; color: #004085;">
                    ${(chapter.priorityActions || []).slice(0, 3).map(a => `<li style="margin-bottom: 0.25rem;">${escapeHtml(a)}</li>`).join('') || '<li>Continue current trajectory</li>'}
                  </ol>
                </div>
              </div>

              <!-- Category Scores Bar -->
              ${chapter.categoryScores && chapter.categoryScores.length > 0 ? `
                <div style="margin-top: 1rem;">
                  <h5 style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: ${primaryColor};">Category Performance</h5>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${chapter.categoryScores.map(cs => {
                      const fillColor = cs.score >= 80 ? '#28a745' : cs.score >= 60 ? accentColor : cs.score >= 40 ? '#f0ad4e' : '#dc3545';
                      return `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span style="width: 40px; font-weight: 600; color: ${primaryColor}; font-size: 0.8rem;">${cs.categoryCode}</span>
                          <div style="flex: 1; height: 16px; background: #e9ecef; border-radius: 8px; overflow: hidden;">
                            <div style="width: ${cs.score}%; height: 100%; background: ${fillColor}; border-radius: 8px;"></div>
                          </div>
                          <span style="width: 30px; text-align: right; font-weight: 600; font-size: 0.8rem;">${cs.score}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

// ============================================================================
// Phase 1.5: Enhanced Category Deep-Dive with SWOT and Full Narratives
// ============================================================================

/**
 * Generate Enhanced Category Deep-Dive with SWOT and Full Narratives
 * Displays full narrative content including SWOT, strengths, weaknesses, etc.
 * @param categoryAnalysis - The category analysis data from Phase 1.5
 * @param options - Report render options
 * @returns HTML string for the category deep-dive section
 */
function generateCategoryDeepDiveSection(
  categoryAnalysis: any,
  options: ReportRenderOptions
): string {
  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;
  const cat = categoryAnalysis;

  // Use shared ScoreBands utility for consistent score-to-color mapping
  const scoreColor = ScoreBands.getColor(cat.overallScore);

  // Generate category score gauge (SVG)
  const categoryGauge = generateGaugeChartSVG({
    value: cat.overallScore || 0,
    maxValue: 100,
    label: cat.categoryCode,
  }, {
    width: 120,
    height: 80,
    showValue: true,
    showLabel: false,
    colorBands: [
      { min: 0, max: 40, color: '#dc3545' },
      { min: 40, max: 60, color: '#ffc107' },
      { min: 60, max: 80, color: '#969423' },
      { min: 80, max: 100, color: '#28a745' },
    ],
  });

  // Generate benchmark comparison bar (SVG)
  const industryBenchmark = cat.industryBenchmark || 65;
  const benchmarkBarSVG = generateCategoryBenchmarkBarSVG(cat.overallScore, industryBenchmark, cat.categoryCode);

  return `
    <div class="phase15-category-section" id="category-${cat.categoryCode}" style="margin: 2rem 0; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); page-break-inside: avoid;">
      <div class="phase15-category-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid ${primaryColor};">
        <div>
          <h3 style="margin: 0; color: ${primaryColor}; font-family: 'Montserrat', sans-serif;">${escapeHtml(cat.categoryName)}</h3>
          <span style="font-size: 0.9rem; color: #666;">Category Code: ${cat.categoryCode}</span>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          ${categoryGauge}
          <span style="padding: 0.4rem 0.8rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: white; background: ${scoreColor};">${cat.overallScore}/100</span>
          <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; background: ${cat.status === 'Critical' ? '#f8d7da' : cat.status === 'Excellent' ? '#d4edda' : '#fff3cd'}; color: ${cat.status === 'Critical' ? '#721c24' : cat.status === 'Excellent' ? '#155724' : '#856404'};">${cat.status}</span>
        </div>
      </div>

      <!-- Benchmark Comparison Bar (SVG) -->
      <div class="category-benchmark-visual" style="margin: 1rem 0; padding: 0.75rem; background: #f8f9fa; border-radius: 8px;">
        ${benchmarkBarSVG}
      </div>

      ${cat.executiveSummary ? `<div style="margin-bottom: 1.5rem;"><p style="font-size: 1.05rem; color: #333; line-height: 1.7;">${escapeHtml(cat.executiveSummary)}</p></div>` : ''}

      <div style="margin: 1.5rem 0; page-break-inside: avoid;">
        <h4 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">SWOT Analysis</h4>
        <div style="display: flex; justify-content: center; padding: 1rem 0;">${generateSWOTQuadrant(cat)}</div>
      </div>

      ${cat.detailedAnalysis ? `
        <div style="margin: 1.5rem 0; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${primaryColor};">
          <h4 style="color: ${primaryColor}; margin: 0 0 1rem 0; font-family: 'Montserrat', sans-serif;">Detailed Analysis</h4>
          <div>${cat.detailedAnalysis.split('\n').filter((p: string) => p.trim()).map((p: string) => `<p style="color: #333; line-height: 1.7; margin-bottom: 1rem;">${escapeHtml(p)}</p>`).join('')}</div>
        </div>
      ` : ''}

      ${cat.strengths && cat.strengths.length > 0 ? `
        <div style="margin: 1.5rem 0;">
          <h4 style="color: ${primaryColor}; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e9ecef; font-family: 'Montserrat', sans-serif;">Key Strengths</h4>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${cat.strengths.map((s: any) => `
              <div style="padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #28a745;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <h5 style="margin: 0; color: ${primaryColor}; font-size: 1rem;">${escapeHtml(s.title)}</h5>
                  <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background: ${accentColor}; color: white;">${s.impactLevel || 'medium'} impact</span>
                </div>
                <p style="color: #333; line-height: 1.6; margin: 0.5rem 0;">${escapeHtml(s.description)}</p>
                ${s.evidence && s.evidence.length > 0 ? `<div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #dee2e6; font-size: 0.85rem;"><span style="font-weight: 600; color: #666; font-size: 0.8rem;">Evidence:</span><ul style="margin: 0.25rem 0 0 1rem; padding: 0; color: #555;">${s.evidence.map((e: string) => `<li style="margin-bottom: 0.25rem;">${escapeHtml(e)}</li>`).join('')}</ul></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${cat.weaknesses && cat.weaknesses.length > 0 ? `
        <div style="margin: 1.5rem 0;">
          <h4 style="color: ${primaryColor}; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e9ecef; font-family: 'Montserrat', sans-serif;">Areas for Improvement</h4>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${cat.weaknesses.map((w: any) => `
              <div style="padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid ${w.severity === 'critical' ? '#dc3545' : w.severity === 'high' ? '#fd7e14' : '#f0ad4e'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <h5 style="margin: 0; color: ${primaryColor}; font-size: 1rem;">${escapeHtml(w.title)}</h5>
                  <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background: ${w.severity === 'critical' ? '#dc3545' : w.severity === 'high' ? '#fd7e14' : '#f0ad4e'}; color: ${w.severity === 'medium' ? '#333' : 'white'};">${w.severity || 'medium'}</span>
                </div>
                <p style="color: #333; line-height: 1.6; margin: 0.5rem 0;">${escapeHtml(w.description)}</p>
                ${w.rootCause ? `<div style="margin-top: 0.75rem; padding: 0.75rem; background: #fff3cd; border-radius: 4px;"><span style="font-weight: 600; color: #856404; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Root Cause:</span><p style="margin: 0; color: #333; line-height: 1.5;">${escapeHtml(w.rootCause)}</p></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${cat.benchmarkComparisons && cat.benchmarkComparisons.length > 0 ? `
        <div style="margin: 1.5rem 0;">
          <h4 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Industry Benchmarking</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${cat.benchmarkComparisons.map((bm: any) => {
              const position = bm.position || (bm.gap > 10 ? 'excellent' : bm.gap > 0 ? 'good' : bm.gap > -10 ? 'average' : 'poor');
              const borderColor = position === 'excellent' ? '#28a745' : position === 'good' ? accentColor : position === 'average' ? '#f0ad4e' : '#dc3545';
              return `
                <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${borderColor};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-weight: 600; color: ${primaryColor};">${escapeHtml(bm.metricName)}</span>
                    <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background: ${borderColor}; color: white;">${position}</span>
                  </div>
                  <div style="font-size: 0.9rem; margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #e9ecef;"><span>Your Value:</span><strong>${bm.companyValue ?? 'N/A'}</strong></div>
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #e9ecef;"><span>Industry Avg:</span><span>${bm.industryAverage ?? 'N/A'}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-weight: 600;"><span>Gap:</span><span style="color: ${bm.gap >= 0 ? '#28a745' : '#dc3545'};">${bm.gap !== undefined && bm.gap !== null ? (bm.gap >= 0 ? '+' : '') + bm.gap : 'N/A'}</span></div>
                  </div>
                  ${bm.gapInterpretation ? `<div style="padding: 0.75rem; background: white; border-radius: 4px; font-size: 0.85rem; font-style: italic; color: #555; line-height: 1.5;">${escapeHtml(bm.gapInterpretation)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${cat.quickWins && cat.quickWins.length > 0 ? `
        <div style="margin: 1.5rem 0;">
          <h4 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Quick Wins for ${escapeHtml(cat.categoryName)}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            ${cat.quickWins.map((qw: any) => `
              <div style="padding: 1rem; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
                <h5 style="margin: 0 0 0.5rem 0; color: ${primaryColor}; font-size: 0.95rem;">${escapeHtml(qw.title)}</h5>
                <p style="color: #333; line-height: 1.5; font-size: 0.9rem; margin: 0.5rem 0;">${escapeHtml(qw.description)}</p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">
                  <span style="padding: 0.2rem 0.5rem; background: white; border-radius: 4px; font-size: 0.75rem;">Effort: ${qw.effort || 'medium'}</span>
                  <span style="padding: 0.2rem 0.5rem; background: white; border-radius: 4px; font-size: 0.75rem;">Impact: ${qw.impact || 'medium'}</span>
                </div>
                ${qw.estimatedROI ? `<div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed #dee2e6;"><span style="color: #666; font-size: 0.8rem;">Expected ROI: </span><span style="color: #28a745; font-weight: 600;">${escapeHtml(qw.estimatedROI)}</span></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${cat.categoryRisks && cat.categoryRisks.length > 0 ? `
        <div style="margin: 1.5rem 0;">
          <h4 style="color: ${primaryColor}; margin-bottom: 1rem; font-family: 'Montserrat', sans-serif;">Risk Factors</h4>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${cat.categoryRisks.map((r: any) => `
              <div style="padding: 1rem; background: #fff5f5; border-radius: 8px; border-left: 4px solid #dc3545;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <h5 style="margin: 0; color: ${primaryColor}; font-size: 0.95rem;">${escapeHtml(r.title)}</h5>
                  <div style="display: flex; gap: 0.5rem; font-size: 0.75rem;">
                    <span style="padding: 0.2rem 0.5rem; background: white; border-radius: 4px;">Likelihood: ${r.likelihood || 'medium'}</span>
                    <span style="padding: 0.2rem 0.5rem; background: white; border-radius: 4px;">Impact: ${r.impact || 'medium'}</span>
                  </div>
                </div>
                <p style="color: #333; line-height: 1.5; margin: 0.5rem 0; font-size: 0.9rem;">${escapeHtml(r.description)}</p>
                ${r.mitigation ? `<div style="margin-top: 0.75rem; padding: 0.75rem; background: #e8f5e9; border-radius: 4px;"><span style="font-weight: 600; color: #2e7d32; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Mitigation:</span><p style="margin: 0; color: #333; font-size: 0.9rem; line-height: 1.5;">${escapeHtml(r.mitigation)}</p></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate a fallback SVG visualization when chart generation fails
 * CRITICAL: Never fall back to ASCII - always return valid SVG
 *
 * @param context - Context for the failed visualization (e.g., category code, chart type)
 * @param score - Optional score to display
 * @returns A simple but valid SVG fallback
 */
function generateFallbackSVG(context: string, score?: number): string {
  const width = 200;
  const height = 100;
  const displayScore = score !== undefined ? score : 0;
  const scoreColor = ScoreBands.getColor(displayScore);

  logger.warn({ context, score: displayScore }, 'Generating fallback SVG due to visualization failure');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="fallback-visualization" role="img" aria-label="Score visualization for ${context}">
      <!-- Background -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f8f9fa" rx="8"/>

      <!-- Score circle -->
      <circle cx="${width / 2}" cy="${height / 2 - 5}" r="30" fill="${scoreColor}" opacity="0.9"/>

      <!-- Score text -->
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="18" font-weight="700" fill="white" font-family="Montserrat, sans-serif">${displayScore}</text>

      <!-- Context label -->
      <text x="${width / 2}" y="${height - 15}" text-anchor="middle" font-size="10" fill="#666" font-family="Open Sans, sans-serif">${context}</text>
    </svg>
  `;
}

/**
 * Safe visualization wrapper - catches errors and returns fallback SVG
 * NEVER returns ASCII content
 *
 * @param generatorFn - The visualization generator function
 * @param context - Context for logging and fallback
 * @param score - Optional score for fallback display
 * @returns Valid SVG string (either generated or fallback)
 */
function safeGenerateVisualization(
  generatorFn: () => string,
  context: string,
  score?: number
): string {
  try {
    const result = generatorFn();

    // Validate result is SVG
    if (!result || !result.trim().startsWith('<svg')) {
      logger.warn({ context }, 'Chart generation returned non-SVG content, using fallback');
      return generateFallbackSVG(context, score);
    }

    return result;
  } catch (error) {
    logger.error({ context, error }, 'Chart generation failed, using fallback');
    return generateFallbackSVG(context, score);
  }
}

/**
 * Generate a benchmark comparison bar SVG for a category
 * Shows company score vs industry benchmark with visual comparison
 *
 * @param companyScore - The company's score for this category (0-100)
 * @param industryBenchmark - The industry benchmark score (0-100)
 * @param categoryCode - The category code for labeling
 * @returns SVG string for the benchmark comparison bar
 */
function generateCategoryBenchmarkBarSVG(
  companyScore: number,
  industryBenchmark: number,
  categoryCode: string
): string {
  const width = 300;
  const height = 50;
  const barHeight = 20;
  const barY = 15;

  // Calculate widths
  const maxScore = 100;
  const companyWidth = (companyScore / maxScore) * (width - 20);
  const benchmarkX = (industryBenchmark / maxScore) * (width - 20) + 10;

  // Determine color based on position vs benchmark
  const scoreColor = companyScore >= industryBenchmark
    ? (companyScore >= industryBenchmark + 10 ? '#28a745' : '#969423')
    : (companyScore < industryBenchmark - 10 ? '#dc3545' : '#ffc107');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="category-benchmark-svg" role="img" aria-label="Benchmark comparison for ${categoryCode}: Your score ${companyScore} vs Industry ${industryBenchmark}">
      <!-- Background bar -->
      <rect x="10" y="${barY}" width="${width - 20}" height="${barHeight}" fill="#e9ecef" rx="4"/>

      <!-- Company score bar -->
      <rect x="10" y="${barY}" width="${companyWidth}" height="${barHeight}" fill="${scoreColor}" rx="4"/>

      <!-- Industry benchmark marker -->
      <line x1="${benchmarkX}" y1="${barY - 5}" x2="${benchmarkX}" y2="${barY + barHeight + 5}"
            stroke="#212653" stroke-width="2" stroke-dasharray="3,2"/>

      <!-- Labels -->
      <text x="10" y="${barY - 3}" font-size="9" fill="#666" font-family="Open Sans, sans-serif">Your Score</text>
      <text x="${companyWidth + 15}" y="${barY + barHeight / 2 + 4}" font-size="10" fill="#212653" font-weight="600" font-family="Open Sans, sans-serif">${companyScore}</text>

      <!-- Benchmark label -->
      <text x="${benchmarkX}" y="${height - 3}" font-size="8" fill="#212653" text-anchor="middle" font-family="Open Sans, sans-serif">Industry: ${industryBenchmark}</text>

      <!-- Delta indicator -->
      ${companyScore !== industryBenchmark ? `
        <text x="${width - 10}" y="${barY + barHeight / 2 + 4}" font-size="9" fill="${scoreColor}" text-anchor="end" font-weight="600" font-family="Open Sans, sans-serif">
          ${companyScore > industryBenchmark ? '+' : ''}${companyScore - industryBenchmark}
        </text>
      ` : ''}
    </svg>
  `;
}

// ============================================================================
// PHASE 4.5 BLUF INTEGRATION
// ============================================================================

/**
 * Generate BLUF (Bottom Line Up Front) section from Phase 4.5 output
 * Returns empty string if Phase 4.5 output is not available
 */
function generateBLUFSection(ctx: ReportContext): string {
  // Check if Phase 4.5 output is available
  if (!ctx.phase45Output || !hasValidPhase45Output(ctx.phase45Output)) {
    logger.info('Phase 4.5 output not available - skipping BLUF section');
    return '';
  }

  try {
    // Create render context
    const blufContext = createBLUFRenderContext(
      ctx as any, // IDM is embedded in context
      ctx.phase45Output as Phase4_5A_Output,
      'comprehensive',
      { includeMetadata: false }
    );

    // Render the comprehensive report BLUF
    const blufHTML = renderBLUFForReport(blufContext, 'comprehensive_report');

    if (!blufHTML || blufHTML.trim() === '') {
      logger.info('BLUF content is empty for comprehensive report');
      return '';
    }

    logger.info('BLUF section generated for comprehensive report');

    return `
      <section id="bluf-summary" class="section bluf-executive-section" style="page-break-after: always;">
        ${blufHTML}
      </section>
    `;
  } catch (error) {
    logger.error({ error }, 'Failed to generate BLUF section');
    return '';
  }
}
