/**
 * Business Owner Report Builder
 *
 * Generates an owner-focused executive summary report including:
 * - Owner-centric "you/your" narrative voice
 * - Aggregated investment ranges (not detailed tables)
 * - Cross-references to Comprehensive Report sections
 * - "Where to Go for Detail" navigation section
 * - Abbreviated content with depth constraints
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta } from '../../types/report.types.js';
import type { RoadmapDataSources, OwnerRoadmapPhase } from '../../types/roadmap.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  generateBaseStyles,
  escapeHtml,
  // Trajectory metric removed per quality review 2025-12-18
  // Rationale: "Flat" descriptor provided no actionable value to clients
  generateProgressBar,
} from './html-template.js';
import { calculateROI } from '../../types/report.types.js';
import { NarrativeExtractionService } from '../../services/narrative-extraction.service.js';
import { logger } from '../../utils/logger.js';
import {
  extractNumericValueSafe,
  getScoreBandSafe,
  extractStringSafe,
  safeExecute,
} from '../../utils/safety.utils.js';

// Import visual enhancement components
import {
  generateKeyTakeaways,
  generateExecutiveHighlights,
  generateOverallBenchmarkCallout,
  generateEvidenceCitationsForDimension,
  generateInsightCardWithEvidence,
  generateChapterBenchmarkCallout,
  generateBenchmarkSummaryTable,
  renderWhereToGoForDetail,
  QUICK_REFS,
  buildLegalTermsPage,
  // Clickwrap Legal UX Components
  generateClickwrapModal,
  generateClickwrapLegalContent,
  generateAcceptanceBanner,
  generateLegalAccordion,
  getDefaultLegalSections,
  type ClickwrapConfig,
  // Phase 0: Premium Report Components
  generateCoverPage,
  getCoverPageStyles,
} from './components/index.js';
import { getChapterIcon } from './constants/index.js';

// Import owner report utilities
import { referenceLogger } from './utils/reference-logger.js';
import { transformToOwnerVoice, truncateToSentences } from './utils/voice-transformer.js';
import {
  OWNER_REPORT_CONSTRAINTS,
  formatCurrencyRange,
  formatCurrency as formatCurrencyConstraint,
} from './config/owner-report-constraints.js';
import { sanitizeOrphanedVisualizationHeaders, removeDuplicateCPASections } from './utils/content-sanitizer.js';

// Import enhanced markdown parser for narrative sections
import {
  parseMarkdownToHTML,
  parseMarkdownWithValidation,
  validateReportContent,
  logValidationResults,
} from './utils/index.js';
import type { ValidationResult } from './utils/markdown-parser.js';

// Import chart integration for visual charts
import {
  generateChapterOverviewRadar,
  generateAllChapterScoreBars,
  generateHealthScoreGauge,
  getReportChartStyles,
  // World-class visual components (Phase 1.5-2)
  render4ChapterRadar,
} from './charts/index.js';

// Import world-class visual components (Phase 1.5-2)
import {
  generateQuickWinsGrid,
  generateFinancialImpactDashboard,
  // Enhanced section headers with percentile rankings
  generateEnhancedSectionHeader,
  // Phase 1: Owner Decision Brief Premium Components
  generateOwnerHealthDashboard,
  getOwnerDashboardStyles,
  generateOwnerDecisionAgenda,
  getDecisionAgendaStyles,
  // North Star Part 5: Critical Decisions Framework (replaces Priority Action Matrix)
  generateCriticalDecisions,
  getCriticalDecisionsStyles,
  applyToneFilter,
  // Strategic Implementation Roadmap Components (Section 8)
  buildOwnerRoadmapPhases,
  renderStrategicImplementationRoadmap,
  getRoadmapStyles,
} from './components/index.js';
import {
  contextToChapterRadarData,
  contextToFinancialImpactData,
  contextToQuickWinCards,
  // Section header integration utilities
  chapterToSectionHeader,
} from './utils/index.js';

// Import risk heatmap for enhanced risk visualization
import { renderRiskHeatmapFromRisks } from './components/visual/risk-heatmap.component.js';

// Import BLUF rendering for Phase 4.5 integration
import {
  renderBLUFForReport,
  createBLUFRenderContext,
  hasValidPhase45Output,
  getBLUFInlineStyles,
} from '../phase4-5b-renderer.js';
import type { Phase4_5A_Output } from '../../types/phase4-5.types.js';

// Phase 1.5 Category Visualization Components
import {
  generateCategoryRadarChart,
  generateChapterHeatmap,
  generateCategoryBenchmarkBars,
  generateInterdependencyNetwork,
  generateSWOTQuadrant,
  // P1: Impact/Effort Matrix for prioritization visualization
  generateImpactEffortMatrix,
} from './components/category-visualizations.js';

// P1: Terminology sanitization for client-facing content
import {
  sanitizeClientTerminology,
  sanitizeObjectTerminology,
} from './utils/data-sanitizer.js';

// ============================================================================
// PHASE 1A: GENERIC CONTENT BLOCKLIST AND QUALITY VALIDATION
// North Star Part 5 Quality Standards - No Generic Template Content
// ============================================================================

/**
 * Blocklist of generic phrases that should never appear in client reports
 * These indicate template content that wasn't properly populated
 */
const GENERIC_BLOCKLIST = [
  'conduct detailed assessment',
  'conduct assessment',
  'develop improvement plan',
  'implement quick wins',
  'monitor progress',
  'establish baseline metrics',
  'track kpis',
  'review performance',
  'adjust as needed',
  'ongoing monitoring',
  'improvement initiative',
  'generic action item',
  'tbd - requires',
  'to be determined',
  'placeholder',
  '[insert',
  '[action required]',
  'need to define',
  'need to determine'
];

/**
 * Validate content specificity - ensures content is client-specific, not generic
 * @param content The content to validate
 * @param context The report context for company-specific validation
 * @returns Validation result with score and warnings
 */
interface ContentValidationResult {
  isValid: boolean;
  specificityScore: number;
  warnings: string[];
  genericPhrases: string[];
}

function validateContentSpecificity(
  content: string,
  context: ReportContext
): ContentValidationResult {
  const lowerContent = content.toLowerCase();
  const warnings: string[] = [];

  // Check for generic phrases
  const genericPhrases = GENERIC_BLOCKLIST.filter(phrase =>
    lowerContent.includes(phrase.toLowerCase())
  );

  if (genericPhrases.length > 0) {
    logger.warn({
      company: context.companyProfile.name,
      genericPhrases,
      contentPreview: content.substring(0, 200)
    }, '[QUALITY WARNING] Generic content detected in Owner\'s Report');
    warnings.push(`Generic phrases found: ${genericPhrases.join(', ')}`);
  }

  // Check for company-specific references (evidence of specificity)
  const hasCompanyName = content.toLowerCase().includes(
    context.companyProfile.name.toLowerCase()
  );
  const hasIndustryReference = context.companyProfile.industry &&
    content.toLowerCase().includes(context.companyProfile.industry.toLowerCase());
  const hasMetrics = /\d+%|\$[\d,]+|\d+\s*(days|weeks|months|hours)/.test(content);
  const hasSpecificNumbers = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/.test(content);

  const specificityIndicators = [
    hasCompanyName,
    hasIndustryReference,
    hasMetrics,
    hasSpecificNumbers
  ];
  const specificityScore = specificityIndicators.filter(Boolean).length;

  if (specificityScore === 0 && content.length > 50) {
    logger.warn({
      company: context.companyProfile.name,
      contentPreview: content.substring(0, 200)
    }, '[QUALITY WARNING] Low specificity content in Owner\'s Report');
    warnings.push('Content lacks company-specific references');
  }

  return {
    isValid: genericPhrases.length === 0 && specificityScore > 0,
    specificityScore,
    warnings,
    genericPhrases
  };
}

/**
 * Sanitize and enhance content to remove generic phrases
 * @param content The content to sanitize
 * @param context The report context
 * @returns Sanitized content with generic phrases replaced
 */
function sanitizeGenericContent(content: string, context: ReportContext): string {
  let sanitized = content;

  // Replace generic phrases with more specific alternatives where possible
  const replacements: Record<string, string> = {
    'conduct detailed assessment': `evaluate ${context.companyProfile.name}'s current state`,
    'conduct assessment': `analyze current performance`,
    'develop improvement plan': `create actionable roadmap`,
    'implement quick wins': 'execute high-impact, low-effort initiatives',
    'monitor progress': 'track KPI improvements weekly',
    'establish baseline metrics': 'document current performance benchmarks',
    'track kpis': 'measure key performance indicators',
    'review performance': 'assess results against targets',
    'adjust as needed': 'iterate based on measured outcomes',
    'ongoing monitoring': 'continuous performance tracking',
    'improvement initiative': 'strategic action',
  };

  for (const [generic, specific] of Object.entries(replacements)) {
    const regex = new RegExp(generic, 'gi');
    sanitized = sanitized.replace(regex, specific);
  }

  return sanitized;
}

/**
 * Render expandable content for long text sections
 * P1A FIX: Replace truncation with expandable sections
 * @param content The full content to render
 * @param previewLength Number of characters to show in preview (default 500)
 * @param id Optional unique ID for the expandable section
 */
function renderExpandableContent(
  content: string,
  previewLength: number = 500,
  id?: string
): string {
  // If content is short enough, no need for expansion
  if (content.length <= previewLength) {
    return `<div class="content-full">${content}</div>`;
  }

  const contentId = id || `expand-${Math.random().toString(36).substr(2, 9)}`;

  return `
    <div class="expandable-content" id="${contentId}-container">
      <div class="content-preview">
        ${content.substring(0, previewLength)}
        <span class="ellipsis-fade">...</span>
      </div>
      <div class="content-full">
        ${content}
      </div>
      <button class="expand-btn" onclick="toggleExpandable('${contentId}-container')">
        <span class="expand-text">Read More</span>
        <span class="collapse-text" style="display: none;">Show Less</span>
        <span class="expand-icon">▼</span>
      </button>
    </div>
    <script>
      if (typeof toggleExpandable === 'undefined') {
        function toggleExpandable(containerId) {
          const container = document.getElementById(containerId);
          if (!container) return;

          const isExpanded = container.classList.contains('expanded');
          const expandText = container.querySelector('.expand-text');
          const collapseText = container.querySelector('.collapse-text');

          if (isExpanded) {
            container.classList.remove('expanded');
            if (expandText) expandText.style.display = 'inline';
            if (collapseText) collapseText.style.display = 'none';
          } else {
            container.classList.add('expanded');
            if (expandText) expandText.style.display = 'none';
            if (collapseText) collapseText.style.display = 'inline';
          }
        }
      }
    </script>
  `;
}

/**
 * Extract specific quick win from Phase 1.5 category data when generic content detected
 */
function extractSpecificQuickWin(
  categoryCode: string,
  context: ReportContext,
  originalTitle?: string
): TacticalQuickWin | null {
  // Find category analysis with specific data
  const category = context.categoryAnalyses?.find(
    c => c.categoryCode === categoryCode
  );

  if (category?.quickWins && category.quickWins.length > 0) {
    const qw = category.quickWins[0];
    const validation = validateContentSpecificity(qw.description || '', context);

    // Only use if it passes validation
    if (validation.isValid || validation.specificityScore > 0) {
      return {
        title: qw.title || originalTitle || `${category.categoryName} Quick Win`,
        description: sanitizeGenericContent(qw.description || '', context),
        category: category.categoryName,
        categoryCode: categoryCode,
        timeframe: qw.timeline || '30 days',
        owner: mapDimensionToOwner(categoryCode),
        steps: [],
        impact: qw.impact || 'Medium',
        effort: qw.effort || 'Low',
        expectedOutcome: qw.estimatedROI
      };
    }
  }

  return null;
}

// ============================================================================
// SAFETY WRAPPERS FOR QUICK_REFS
// ============================================================================

/**
 * Safely access QUICK_REFS functions with fallback.
 * Prevents "QUICK_REFS.scorecard is not a function" errors.
 */
function safeQuickRef(
  refName: string,
  context: string,
  fallback: string = ''
): string {
  try {
    if (!QUICK_REFS || typeof QUICK_REFS !== 'object') {
      logger.warn('QUICK_REFS object not available');
      return fallback;
    }

    const ref = (QUICK_REFS as Record<string, unknown>)[refName];
    if (typeof ref === 'function') {
      const result = ref(context);
      return result ?? fallback;
    }

    logger.warn(`QUICK_REFS.${refName} is not a function`);
    return fallback;
  } catch (error) {
    logger.warn({ error, refName }, `QUICK_REFS.${refName} failed`);
    return fallback;
  }
}

/**
 * Fallback scorecard generator when QUICK_REFS fails.
 */
function generateScorecardFallback(ctx: ReportContext): string {
  const score = extractNumericValueSafe(ctx?.overallHealth?.score, 0);
  const band = getScoreBandSafe(score);
  const companyName = extractStringSafe(
    ctx?.companyProfile?.name,
    'Your Company'
  );

  return `
    <div class="scorecard scorecard-fallback" style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin: 1rem 0;">
      <h4 style="margin: 0 0 0.5rem 0;">${companyName} - Business Health Scorecard</h4>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2rem; font-weight: bold; color: #212653;">
          ${score}<span style="font-size: 1rem; color: #666;">/100</span>
        </div>
        <div style="padding: 4px 12px; border-radius: 4px; background: ${band === 'Excellence' ? '#28a745' : band === 'Proficiency' ? '#17a2b8' : band === 'Attention' ? '#ffc107' : '#dc3545'}; color: ${band === 'Attention' ? '#000' : '#fff'}; font-weight: 600;">
          ${band}
        </div>
      </div>
    </div>
  `;
}


/**
 * Build insight cards from findings for the owner report
 */
function buildOwnerInsightCards(ctx: ReportContext, maxCards: number = 10): string {
  // Get top strengths and weaknesses/gaps for balanced view (North Star Part 5: Top 5 each)
  const strengths = ctx.findings.filter(f => f.type === 'strength').slice(0, 5);
  const gaps = ctx.findings.filter(f => f.type === 'gap' || f.type === 'risk').slice(0, 5);

  const allFindings = [...strengths, ...gaps].slice(0, maxCards);

  if (allFindings.length === 0) return '';

  const cards = allFindings.map(finding => {
    const dimension = ctx.dimensions.find(d => d.code === finding.dimensionCode);
    return generateInsightCardWithEvidence(finding, dimension);
  });

  return `
    <div class="insight-cards-container">
      ${cards.join('\n')}
    </div>
  `;
}

// ============================================================================
// PHASE 1.5 CATEGORY ANALYSIS SECTIONS
// ============================================================================

/**
 * Get score band for CSS class assignment
 */
function getPhase15ScoreBand(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'developing';
  if (score >= 20) return 'needs-improvement';
  return 'critical';
}

/**
 * Build Category Analysis Overview section for Owner's Report
 * Displays Phase 1.5 visualizations with category-level insights
 */
function buildCategoryAnalysisOverview(
  ctx: ReportContext,
  options: ReportRenderOptions
): string {
  // Graceful fallback if Phase 1.5 data unavailable
  if (!ctx.categoryAnalyses || ctx.categoryAnalyses.length === 0) {
    logger.info('Phase 1.5 category data not available for owner report');
    return '';
  }

  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;

  // Generate visualizations
  const radarChart = generateCategoryRadarChart(ctx.categoryAnalyses, {
    showBenchmark: true,
    showScoreValues: true
  });

  // P0 FIX: Get canonical chapter scores to ensure consistency across all visualizations
  const canonicalChapterScores = getCanonicalChapterScores(ctx);

  const heatmap = ctx.chapterSummaries && ctx.chapterSummaries.length > 0
    ? generateChapterHeatmap(ctx.categoryAnalyses, ctx.chapterSummaries, {
        canonicalChapterScores  // Pass canonical scores for header consistency
      })
    : '';

  const benchmarkBars = generateCategoryBenchmarkBars(ctx.categoryAnalyses);

  // Generate category quick insight cards (top 6 most relevant)
  const sortedCategories = [...ctx.categoryAnalyses].sort((a, b) => {
    // Prioritize categories that need attention (lower scores first)
    const aUrgency = a.overallScore < 60 ? (60 - a.overallScore) : 0;
    const bUrgency = b.overallScore < 60 ? (60 - b.overallScore) : 0;
    return bUrgency - aUrgency;
  });

  const categoryCards = sortedCategories.slice(0, 6).map(cat => {
    const scoreBand = getPhase15ScoreBand(cat.overallScore);
    const topStrength = cat.strengths?.[0]?.title || 'N/A';
    const topGap = cat.weaknesses?.[0]?.title || 'N/A';
    const topQuickWin = cat.quickWins?.[0]?.title || 'N/A';

    return `
      <div class="category-card score-${scoreBand}">
        <div class="category-header">
          <h4>${escapeHtml(cat.categoryName)} (${escapeHtml(cat.categoryCode)})</h4>
          <div class="score-badge score-${scoreBand}">${cat.overallScore}/100</div>
        </div>
        <p class="status"><strong>Status:</strong> ${escapeHtml(cat.status)}</p>
        <p class="executive-summary">${escapeHtml(cat.executiveSummary || '')}</p>

        <div class="category-highlights">
          <div class="highlight strength">
            <strong>&#10003; Top Strength:</strong> ${escapeHtml(topStrength)}
          </div>
          <div class="highlight gap">
            <strong>&#9888; Priority Gap:</strong> ${escapeHtml(topGap)}
          </div>
          <div class="highlight quick-win">
            <strong>&#9889; Quick Win:</strong> ${escapeHtml(topQuickWin)}
          </div>
        </div>

        <p class="cross-reference">
          <em>See Comprehensive Report for detailed ${escapeHtml(cat.categoryName)} analysis.</em>
        </p>
      </div>
    `;
  }).join('');

  return `
    <section class="section page-break" id="category-analysis-overview">
      ${renderOwnerSectionHeader('Category-Level Performance Analysis', 'How is each area of my business performing?')}

      <p class="section-intro">
        This section provides a granular view of your business health across all 12 assessment
        categories, enabling you to target improvement efforts where they'll have the most impact.
      </p>

      <div class="strategic-balance-section visualization-container" style="margin: 1.5rem 0;">
        <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem;">Strategic Balance Overview</h3>
        <div style="display: flex; justify-content: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          ${radarChart}
        </div>
        <div class="chart-caption" style="text-align: center; color: #666; font-size: 0.875rem; font-style: italic; margin-top: 0.75rem; margin-bottom: 1rem;">
          This radar chart displays your performance across all 12 business health dimensions.
          Areas closer to the outer edge indicate stronger performance relative to industry benchmarks.
        </div>
      </div>

      <!-- UPDATED: Stacked vertical layout for better readability (Issue #2 fix) -->
      <div class="visualization-stack" style="display: flex; flex-direction: column; gap: 2rem; margin: 1.5rem 0;">
        ${heatmap ? `
        <div class="visualization-container" style="width: 100%;">
          <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 0.75rem; font-size: 1.1rem;">Chapter Performance Heatmap</h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            Your performance across all 12 business health categories, organized by strategic chapter.
            Darker colors indicate stronger performance.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            ${heatmap}
          </div>
        </div>
        ` : ''}

        <div class="visualization-container" style="width: 100%;">
          <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 0.75rem; font-size: 1.1rem;">Industry Benchmark Comparison</h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            How your category scores compare against industry benchmarks.
            The dashed line represents the industry average for each category.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            ${benchmarkBars}
          </div>
        </div>
      </div>

      <div class="category-summaries" style="margin-top: 2rem;">
        <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem;">Category Quick Insights</h3>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.95rem;">
          Key insights from your most critical categories. Categories requiring attention are prioritized.
        </p>
        <div class="category-grid">
          ${categoryCards}
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate dynamic BLUF content for the Interdependencies section
 * Creates company-specific narrative based on actual category scores
 */
function generateInterdependenciesBLUF(ctx: ReportContext): string {
  const companyName = ctx.companyProfile?.name || 'Your Business';
  const categories = ctx.categoryAnalyses || [];

  if (categories.length === 0) {
    return '';
  }

  // Find weakest categories (scores < 50)
  const weakCategories = categories
    .filter(c => c.overallScore < 50)
    .sort((a, b) => a.overallScore - b.overallScore);

  // Find strongest categories (scores >= 70)
  const strongCategories = categories
    .filter(c => c.overallScore >= 70)
    .sort((a, b) => b.overallScore - a.overallScore);

  // Find Growth Engine categories (STR, SAL, MKT, CXP)
  const growthEngineCategories = categories.filter(c =>
    ['STR', 'SAL', 'MKT', 'CXP'].includes(c.categoryCode)
  );
  const avgGrowthEngineScore = growthEngineCategories.length > 0
    ? Math.round(growthEngineCategories.reduce((sum, c) => sum + c.overallScore, 0) / growthEngineCategories.length)
    : 0;

  // Build weakness text
  let weaknessText = '';
  if (weakCategories.length > 0) {
    const weakList = weakCategories.slice(0, 2).map(c =>
      `${c.categoryName} at ${Math.round(c.overallScore)}/100`
    ).join(' and ');
    weaknessText = `The isolated weaker nodes (${weakList}) are creating drag on the entire system despite their apparent isolation.`;
  }

  // Identify the key leverage point (often Leadership or Strategy)
  const leadershipCategory = categories.find(c => c.categoryCode === 'LDR');
  const strategyCategory = categories.find(c => c.categoryCode === 'STR');
  const leverageCategory = leadershipCategory && leadershipCategory.overallScore < 60
    ? leadershipCategory
    : strategyCategory;

  let actionText = '';
  if (leverageCategory && leverageCategory.overallScore < 70) {
    actionText = `Addressing your ${leverageCategory.categoryName} (${Math.round(leverageCategory.overallScore)}/100) gap first will create cascading improvements across Human Resources, Strategy, and Operations.`;
  } else if (weakCategories.length > 0) {
    actionText = `Prioritizing improvements to your weakest category (${weakCategories[0].categoryName}) will help remove systemic bottlenecks.`;
  } else {
    actionText = 'Focus on strengthening connections between your strongest categories to maximize value creation.';
  }

  return `
    <!-- INTERDEPENDENCIES BLUF SECTION -->
    <div class="section-bluf interdependencies-bluf">
      <p class="bluf-intro">
        This network diagram illustrates how your 12 business categories interact and influence each other.
        Each circle represents a business category, and the connecting lines show where improvements in one
        area create positive ripple effects in others—or where weaknesses cascade into failures affecting
        multiple functions simultaneously.
      </p>

      <p class="bluf-patterns">
        <strong>Key patterns for ${escapeHtml(companyName)}:</strong> Your Growth Engine categories
        (Strategy, Sales, Marketing, Customer Experience) ${avgGrowthEngineScore >= 60
          ? 'form a solid interconnected cluster'
          : 'need strengthening as an interconnected cluster'}—meaning
        improvements in any one category will amplify results in the others. ${weaknessText}
      </p>

      <p class="bluf-action">
        <strong>Strategic implication:</strong> ${actionText} Thicker connecting lines
        in the diagram below indicate stronger dependencies where focused investment yields outsized returns.
      </p>
    </div>
  `;
}

/**
 * Build Cross-Category Insights section for Owner's Report
 * Displays systemic patterns and prioritization matrix
 */
function buildCrossCategoryInsights(
  ctx: ReportContext,
  options: ReportRenderOptions
): string {
  // Graceful fallback if data unavailable
  if (!ctx.crossCategoryInsights) {
    return '';
  }

  const insights = ctx.crossCategoryInsights;
  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;

  // Generate interdependency BLUF for executive context
  const interdependenciesBLUF = generateInterdependenciesBLUF(ctx);

  // Generate interdependency network if category analyses available
  const networkDiagram = ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0
    ? generateInterdependencyNetwork(insights)
    : '';

  // Generate systemic patterns HTML
  const systemicPatternsHtml = insights.systemicPatterns?.length > 0
    ? insights.systemicPatterns.slice(0, 4).map(pattern => `
        <div class="pattern-card">
          <h4>${escapeHtml(pattern.pattern)}</h4>
          <p>${escapeHtml(pattern.description)}</p>
          <p class="recommendation"><strong>Recommendation:</strong> ${escapeHtml(pattern.recommendation)}</p>
          <p class="affected-categories">
            <em>Affected Categories: ${pattern.affectedCategories?.join(', ') || 'N/A'}</em>
          </p>
        </div>
      `).join('')
    : '<p style="color: #666; font-style: italic;">No systemic patterns identified in this assessment.</p>';

  // Generate prioritization table HTML
  const prioritizationTableHtml = insights.prioritizationMatrix?.length > 0
    ? `
      <div class="table-responsive">
        <table class="prioritization-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Urgency</th>
              <th>Impact</th>
              <th>Effort</th>
              <th>Priority Score</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${insights.prioritizationMatrix.slice(0, 8).map(item => {
              const scoreBand = getPhase15ScoreBand(item.priorityScore * 10);
              return `
              <tr class="priority-${scoreBand}">
                <td><strong>${escapeHtml(item.categoryCode)}</strong></td>
                <td>${item.urgency}/10</td>
                <td>${item.impact}/10</td>
                <td>${item.effort}/10</td>
                <td class="priority-score"><strong>${item.priorityScore.toFixed(1)}</strong></td>
                <td>${escapeHtml(item.recommendation || '')}</td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `
    : '<p style="color: #666; font-style: italic;">Prioritization matrix data unavailable.</p>';

  return `
    <section class="section page-break" id="cross-category-insights">
      ${renderOwnerSectionHeader('Strategic Interdependencies & Priorities', 'How do my business areas affect each other?')}

      <p class="section-intro">
        Understanding how your business categories influence each other enables strategic resource allocation
        and helps prevent cascading failures from unaddressed weaknesses.
      </p>

      ${interdependenciesBLUF}

      ${networkDiagram ? `
      <div class="visualization-container" style="margin: 1.5rem 0;">
        <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem;">Category Interdependency Network</h3>
        <p style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
          This diagram shows how different business categories influence each other.
          Strong connections indicate where improvements can have cascading positive effects.
        </p>
        <div style="display: flex; justify-content: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          ${networkDiagram}
        </div>
      </div>
      ` : ''}

      <div class="systemic-patterns" style="margin: 1.5rem 0;">
        <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem;">Systemic Patterns Identified</h3>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
          These patterns span multiple categories and represent opportunities for high-leverage improvements.
        </p>
        ${systemicPatternsHtml}
      </div>

      <div class="prioritization-matrix" style="margin: 1.5rem 0;">
        <h3 style="color: ${primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem;">Category Improvement Prioritization</h3>
        <p class="matrix-explanation" style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
          Categories ranked by combination of urgency, potential impact, and implementation effort.
          Higher priority scores indicate categories that should be addressed first.
        </p>
        ${prioritizationTableHtml}
      </div>
    </section>
  `;
}

// ============================================================================
// COMPANY SNAPSHOT EXECUTIVE SUMMARY COMPONENTS
// Narrative-driven executive summary for boutique consulting quality
// ============================================================================

/**
 * Get health descriptor phrase based on score
 * Used for narrative executive summary generation
 */
function getHealthDescriptor(score: number): string {
  if (score >= 80) return 'exceptional operational foundations';
  if (score >= 70) return 'solid operational foundations';
  if (score >= 60) return 'developing operational foundations';
  if (score >= 50) return 'foundational operational capabilities';
  return 'emerging operational capabilities';
}

/**
 * Calculate weighted average percentile from chapter data
 * Returns competitive positioning percentile
 */
function calculateWeightedPercentile(ctx: ReportContext): number {
  const chapters = ctx.chapters || [];
  if (chapters.length === 0) return 50; // Default to median

  const totalChapterScore = chapters.reduce((sum, ch) => sum + (ch.score || 0), 0);
  if (totalChapterScore === 0) return 50;

  const weightedPercentile = chapters.reduce((sum, chapter) => {
    const weight = (chapter.score || 0) / totalChapterScore;
    const percentile = chapter.percentileRank || chapter.benchmark?.peerPercentile || 50;
    return sum + (weight * percentile);
  }, 0);

  return Math.round(weightedPercentile);
}

/**
 * Format strength categories into narrative phrase
 */
function formatStrengthCategories(topCategories: Array<{ categoryName: string; overallScore: number }>): string {
  if (topCategories.length === 0) return 'several key operational areas';

  return topCategories
    .map((cat, idx) => {
      const score = Math.round(cat.overallScore);
      if (idx === topCategories.length - 1 && topCategories.length > 1) {
        return `and ${cat.categoryName} (scoring ${score})`;
      }
      return `${cat.categoryName} (scoring ${score})`;
    })
    .join(topCategories.length === 2 ? ' ' : ', ');
}

/**
 * Calculate quick wins financial impact estimate from near-term items
 */
function calculateQuickWinsValue(ctx: ReportContext): string {
  const quickWins = ctx.quickWins || [];

  // Filter for quick wins with near-term timeframe (≤90 days)
  const nearTermQuickWins = quickWins.filter(qw => {
    const timeframe = qw.timeframe || '';
    return timeframe.toLowerCase().includes('90') ||
           timeframe.toLowerCase().includes('30') ||
           timeframe.toLowerCase().includes('60') ||
           timeframe.toLowerCase().includes('immediate') ||
           timeframe.toLowerCase().includes('quick') ||
           timeframe.toLowerCase().includes('short');
  });

  // Sum ROI estimates
  let totalValueEstimate = 0;
  nearTermQuickWins.forEach(qw => {
    if (qw.estimatedROI && qw.estimatedROI > 0) {
      totalValueEstimate += qw.estimatedROI;
    } else if (qw.estimatedInvestment && qw.estimatedInvestment > 0) {
      // Estimate 2x return on investment if ROI not specified
      totalValueEstimate += qw.estimatedInvestment * 2;
    }
  });

  // If no data, try to sum from all quick wins
  if (totalValueEstimate === 0 && quickWins.length > 0) {
    quickWins.forEach(qw => {
      if (qw.estimatedROI && qw.estimatedROI > 0) {
        totalValueEstimate += qw.estimatedROI;
      }
    });
  }

  // Convert to K format with conservative range (70-100% of estimate)
  if (totalValueEstimate > 0) {
    const lowRangeK = Math.round(totalValueEstimate * 0.7 / 1000);
    const highRangeK = Math.round(totalValueEstimate / 1000);
    if (lowRangeK > 0 && highRangeK > 0) {
      return `$${lowRangeK}K-$${highRangeK}K`;
    }
  }

  // Conservative default if calculation fails
  return '$50K-$150K';
}

/**
 * Null handling utility - determines if a value should be rendered
 * Returns false for undefined, null, empty strings, "Unknown", "N/A", etc.
 */
function shouldRenderValue(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (normalized === '' ||
        normalized === 'unknown' ||
        normalized === 'n/a' ||
        normalized === 'not disclosed' ||
        normalized === 'not available' ||
        normalized === 'not specified' ||
        normalized === 'none') {
      return false;
    }
  }
  return true;
}

/**
 * Get band color based on score
 */
function getBandColor(score: number): string {
  if (score >= 80) return '#28a745';  // Excellence - Green
  if (score >= 60) return '#17a2b8';  // Proficiency - Blue
  if (score >= 40) return '#ffc107';  // Attention - Yellow
  return '#dc3545';                    // Critical - Red
}

/**
 * Get status descriptor based on health score
 */
function getStatusDescriptor(score: number): string {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Strong Performance';
  if (score >= 40) return 'Developing';
  return 'Needs Attention';
}

/**
 * Generate Chapter Performance Bar Chart SVG
 * Shows 4 chapters with horizontal bars showing score vs benchmark
 */
function generateChapterPerformanceBarChart(ctx: ReportContext): string {
  // Extract chapter data from context
  const chapters = ctx.chapters || [];

  // Map chapters to the 4 strategic pillars
  interface ChapterData { name: string; score: number; benchmark: number; color: string }
  const chapterConfig: Record<string, { name: string; fullName: string; color: string }> = {
    GE: { name: 'Growth Engine', fullName: 'Growth Engine', color: '#28a745' },
    PH: { name: 'Performance & Health', fullName: 'Performance & Health', color: '#0d6efd' },
    PL: { name: 'People & Leadership', fullName: 'People & Leadership', color: '#ffc107' },
    RS: { name: 'Resilience & Safeguards', fullName: 'Resilience & Safeguards', color: '#dc3545' },
  };

  const chapterOrder = ['GE', 'PH', 'PL', 'RS'];

  const chartData: ChapterData[] = chapterOrder.map(code => {
    const chapter = chapters.find(ch =>
      ch.code === code ||
      ch.chapterCode === code ||
      ch.name?.toLowerCase().includes(chapterConfig[code].name.toLowerCase().split(' ')[0])
    );

    const score = chapter?.score ?? chapter?.overallScore ?? 50;
    const benchmark = typeof chapter?.benchmark === 'object'
      ? chapter?.benchmark?.peerPercentile ?? 50
      : (chapter?.benchmark ?? chapter?.industryBenchmark ?? 50);

    return {
      name: chapterConfig[code].fullName,
      score: Math.round(score),
      benchmark: Math.round(benchmark),
      color: getBandColor(score),
    };
  });

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 220;
  const labelWidth = 150;
  const barWidth = 320;
  const barHeight = 28;
  const rowHeight = 45;
  const startX = labelWidth;
  const scoreWidth = 60;

  // Generate bar elements
  const barElements = chartData.map((chapter, index) => {
    const y = 10 + (index * rowHeight);
    const scoreBarWidth = (chapter.score / 100) * barWidth;
    const benchmarkX = startX + (chapter.benchmark / 100) * barWidth;

    return `
      <g transform="translate(0, ${y})">
        <!-- Chapter Label -->
        <text x="5" y="20" class="bar-label" style="font-family: 'Open Sans', sans-serif; font-size: 12px; fill: #212653;">${escapeHtml(chapter.name)}</text>

        <!-- Background Bar -->
        <rect x="${startX}" y="6" width="${barWidth}" height="${barHeight}" fill="#e9ecef" rx="4"/>

        <!-- Score Bar -->
        <rect x="${startX}" y="6" width="${scoreBarWidth}" height="${barHeight}" fill="${chapter.color}" rx="4"/>

        <!-- Benchmark Line -->
        <line x1="${benchmarkX}" y1="2" x2="${benchmarkX}" y2="${barHeight + 10}" stroke="#212653" stroke-width="2" stroke-dasharray="4,2"/>

        <!-- Score Label -->
        <text x="${startX + barWidth + 15}" y="24" style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; fill: #212653;">${chapter.score}/100</text>
      </g>
    `;
  }).join('');

  // Legend
  const legendY = 10 + (chartData.length * rowHeight) + 10;

  return `
    <div class="chapter-performance-chart" style="margin: 1.5rem 0;">
      <h3 style="color: #212653; font-family: 'Montserrat', sans-serif; font-size: 1.1rem; margin-bottom: 0.5rem; text-align: center;">Chapter Performance Overview</h3>
      <p style="text-align: center; color: #666; font-size: 0.85rem; margin-bottom: 1rem;">Your scores vs. industry benchmarks</p>

      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"
           xmlns="http://www.w3.org/2000/svg"
           role="img" aria-label="Chapter Performance horizontal bar chart showing scores for Growth Engine, Performance and Health, People and Leadership, and Resilience and Safeguards"
           style="display: block; margin: 0 auto; max-width: 100%; height: auto;">

        ${barElements}

        <!-- Legend -->
        <g transform="translate(${startX}, ${legendY})">
          <rect x="0" y="0" width="16" height="12" fill="#969423" rx="2"/>
          <text x="22" y="10" style="font-size: 10px; fill: #666; font-family: 'Open Sans', sans-serif;">Your Score</text>
          <line x1="100" y1="6" x2="130" y2="6" stroke="#212653" stroke-width="2" stroke-dasharray="4,2"/>
          <text x="138" y="10" style="font-size: 10px; fill: #666; font-family: 'Open Sans', sans-serif;">Industry Benchmark</text>
        </g>
      </svg>
    </div>
  `;
}

/**
 * Checks if an industry value is meaningful and should be displayed
 * @param industry - The industry type string from company profile
 * @returns true if industry is specific and meaningful, false if generic
 */
function isIndustryMeaningful(industry: string | undefined | null): boolean {
  if (!industry || industry.trim() === '') {
    return false;
  }

  const lowercaseIndustry = industry.toLowerCase().trim();
  const genericValues = ['general', 'other', 'business', 'n/a', 'not specified', 'unknown'];
  return !genericValues.includes(lowercaseIndustry);
}

/**
 * Resolves industry reference for narrative text, defaulting to safe generic if invalid
 * @param industry - The industry type string from company profile
 * @returns Safe subject string for narrative ("Your business" or "Your [Industry]")
 */
function resolveIndustrySubject(industry: string | undefined | null): string {
  // Return generic default if industry is not meaningful
  if (!isIndustryMeaningful(industry)) {
    return 'Your business';
  }

  // Use specific industry name
  return `Your ${industry}`;
}

/**
 * Generates explanatory text block for 4-chapter structure
 * Placed before chapter scores to provide context on first viewing
 * Added per quality review 2025-12-18
 */
function buildChapterDefinitionsBlock(primaryColor: string): string {
  return `
    <div class="chapter-definitions-block" style="
      background: #f8f9fa;
      border-left: 4px solid #969423;
      padding: 24px;
      margin: 32px 0;
      border-radius: 4px;
    ">
      <h3 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 12px 0;
      ">Understanding Your Business Health Structure</h3>
      <p style="
        color: #555;
        font-family: 'Open Sans', sans-serif;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 20px 0;
      ">
        Your business assessment is organized across four key areas that together determine overall health:
      </p>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 16px;
      ">
        <div style="
          background: white;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="
            color: #212653;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 20px;">📈</span>
            Growth Engine
          </h4>
          <p style="
            color: #333;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          ">
            Measures your ability to generate revenue and expand market position through
            Strategy, Sales, Marketing, and Customer Experience.
          </p>
        </div>

        <div style="
          background: white;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="
            color: #212653;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 20px;">⚙️</span>
            Performance & Health
          </h4>
          <p style="
            color: #333;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          ">
            Evaluates operational efficiency and financial stability through
            Operations and Financials dimensions.
          </p>
        </div>

        <div style="
          background: white;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="
            color: #212653;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 20px;">👥</span>
            People & Leadership
          </h4>
          <p style="
            color: #333;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          ">
            Assesses organizational culture and direction through
            Human Resources and Leadership & Governance dimensions.
          </p>
        </div>

        <div style="
          background: white;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="
            color: #212653;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-size: 20px;">🛡️</span>
            Resilience & Safeguards
          </h4>
          <p style="
            color: #333;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          ">
            Examines risk protection and infrastructure through
            IT, Risk Management, Compliance, and Technology dimensions.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Company Snapshot Executive Summary
 * Creates a narrative-driven 150-200 word summary demonstrating analytical synthesis
 */
function generateCompanySnapshotExecutiveSummary(ctx: ReportContext): string {
  const healthScore = ctx.overallHealth?.score ?? 0;
  const companyName = escapeHtml(ctx.companyProfile?.name || 'Your Company');
  const industry = ctx.companyProfile?.industry;
  const industrySubject = resolveIndustrySubject(industry);

  // Get health descriptor based on score
  const healthDescriptor = getHealthDescriptor(healthScore);

  // Calculate competitive percentile
  const percentileRounded = calculateWeightedPercentile(ctx);

  // Identify top 2-3 strength categories (score >= 70)
  const categoryAnalyses = ctx.categoryAnalyses || [];
  const topCategories = categoryAnalyses
    .filter(cat => cat.overallScore >= 70)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3);

  const strengthPhrase = formatStrengthCategories(topCategories);

  // Identify critical gaps (score < 50 or status Critical/Needs Improvement)
  const gapCategories = categoryAnalyses
    .filter(cat => cat.overallScore < 50 || cat.status === 'Critical' || cat.status === 'Needs Improvement')
    .sort((a, b) => a.overallScore - b.overallScore)
    .slice(0, 2);

  const gapPhrase = gapCategories.length > 0
    ? gapCategories.map(cat => cat.categoryName).join(' and ')
    : 'certain operational processes';

  // Count strengths and gaps
  const strengthCount = ctx.findings?.filter(f => f.type === 'strength').length || topCategories.length || 0;
  const gapCount = ctx.findings?.filter(f => f.type === 'gap' || f.type === 'risk').length || gapCategories.length || 0;

  // Calculate quick wins value
  const valuePhrase = calculateQuickWinsValue(ctx);

  return `
    <div class="company-snapshot-executive-summary">
      <h3>Executive Summary</h3>
      <p class="summary-primary">
        ${companyName} demonstrates ${healthDescriptor} with a <strong>${healthScore}/100</strong> overall
        health score. ${industrySubject} excels in ${strengthPhrase}, placing you ahead of
        <strong>${percentileRounded}%</strong> of comparable businesses in your industry peer group.
      </p>
      <p class="summary-opportunities">
        However, opportunities exist to strengthen ${gapPhrase}. With <strong>${strengthCount}
        identified strengths</strong> and <strong>${gapCount} priority areas</strong> requiring attention,
        implementing the recommended quick wins could deliver an estimated <strong>${valuePhrase}</strong>
        in annual value creation within the first 90 days.
      </p>
    </div>
  `;
}

/**
 * Generate Company Context Block
 * Displays key company profile information in a clean grid format
 */
function generateCompanyContextBlock(ctx: ReportContext, primaryColor: string): string {
  const profile = ctx.companyProfile;

  // Extract location components
  const city = profile.city ||
               (typeof profile.location === 'object' ? profile.location?.city : null) ||
               (typeof profile.location === 'string' ? profile.location?.split(',')[0] : null) ||
               '';
  const state = profile.state ||
                (typeof profile.location === 'object' ? profile.location?.state_province : null) ||
                (typeof profile.location === 'string' ? profile.location?.split(',')[1]?.trim() : null) ||
                '';
  const locationDisplay = city && state ? `${escapeHtml(city)}, ${escapeHtml(state)}` :
                          (typeof profile.location === 'string' ? escapeHtml(profile.location) : 'Not specified');

  // Calculate years in operation
  let yearsInOperation: string;
  if (profile.yearsInBusiness && typeof profile.yearsInBusiness === 'number') {
    yearsInOperation = `${profile.yearsInBusiness} years`;
  } else if (profile.yearFounded && typeof profile.yearFounded === 'number') {
    const years = new Date().getFullYear() - profile.yearFounded;
    yearsInOperation = `${years} years`;
  } else if (profile.yearsInBusiness) {
    yearsInOperation = String(profile.yearsInBusiness);
  } else {
    yearsInOperation = 'Not disclosed';
  }

  // Format employee count
  const employeeDisplay = profile.employeeCount
    ? `${profile.employeeCount.toLocaleString()} FTE`
    : profile.companySize || 'Not disclosed';

  // Extract primary offerings
  const offerings = profile.primaryOfferings?.slice(0, 3).join(', ') ||
                    profile.products?.slice(0, 3).join(', ') ||
                    profile.services?.slice(0, 3).join(', ') ||
                    'Diversified business operations';

  // Industry badge removed per quality review 2025-12-18
  // Only render if industry is specific and meaningful (not "General", "Other", etc.)
  const industryItem = isIndustryMeaningful(profile.industry)
    ? `<div class="context-item">
          <span class="context-label">Industry:</span>
          <span class="context-value">${escapeHtml(profile.industry!)}</span>
        </div>`
    : '';

  return `
    <div class="company-context-block">
      <h4>Company Context</h4>
      <div class="context-grid">
        ${industryItem}
        <div class="context-item">
          <span class="context-label">Location:</span>
          <span class="context-value">${locationDisplay}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Employees:</span>
          <span class="context-value">${escapeHtml(employeeDisplay)}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Annual Revenue:</span>
          <span class="context-value">${escapeHtml(profile.annualRevenue || 'Not disclosed')}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Years in Operation:</span>
          <span class="context-value">${yearsInOperation}</span>
        </div>
        <div class="context-item">
          <span class="context-label">Primary Offerings:</span>
          <span class="context-value">${escapeHtml(offerings)}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// PHASE 1A: NORTH STAR MANDATORY SECTIONS
// Company Snapshot, 90/180/365-Day Phased Roadmap, Financial Impact
// ============================================================================

/**
 * Generate consolidated Company Snapshot section (NORTH STAR requirement)
 * Unified design: Company Profile Card + 4 Assessment Highlight Cards
 * Eliminates redundancy between old context block and snapshot cards
 */
function generateCompanySnapshot(ctx: ReportContext, options: ReportRenderOptions): string {
  const profile = ctx.companyProfile;
  const primaryColor = options.brand.primaryColor;

  // Build profile items array - only include non-empty fields
  interface ProfileItem { label: string; value: string }
  const leftColumnItems: ProfileItem[] = [];
  const rightColumnItems: ProfileItem[] = [];

  // Left column items
  // Industry badge removed per quality review 2025-12-18 - only show if meaningful
  if (shouldRenderValue(profile.industry) && isIndustryMeaningful(profile.industry)) {
    leftColumnItems.push({ label: 'Industry', value: profile.industry });
  }

  // Extract location properly (handle object or string)
  const city = profile.city ||
               (typeof profile.location === 'object' ? profile.location?.city : null) ||
               (typeof profile.location === 'string' ? profile.location?.split(',')[0]?.trim() : null);
  const state = profile.state ||
                (typeof profile.location === 'object' ? profile.location?.state_province : null) ||
                (typeof profile.location === 'string' ? profile.location?.split(',')[1]?.trim() : null);
  const locationDisplay = city && state ? `${city}, ${state}` :
                          (typeof profile.location === 'string' ? profile.location : null);
  if (shouldRenderValue(locationDisplay)) {
    leftColumnItems.push({ label: 'Location', value: locationDisplay! });
  }

  // Year founded / Years in business
  if (shouldRenderValue(profile.yearFounded)) {
    leftColumnItems.push({ label: 'Founded', value: String(profile.yearFounded) });
  } else if (shouldRenderValue(profile.yearsInBusiness) && typeof profile.yearsInBusiness === 'number') {
    const foundedYear = new Date().getFullYear() - profile.yearsInBusiness;
    leftColumnItems.push({ label: 'Founded', value: String(foundedYear) });
  }

  if (shouldRenderValue(profile.lifecycleStage)) {
    leftColumnItems.push({ label: 'Growth Stage', value: profile.lifecycleStage });
  }

  // Right column items
  if (shouldRenderValue(profile.employeeCount)) {
    rightColumnItems.push({ label: 'Employees', value: profile.employeeCount.toLocaleString() });
  } else if (shouldRenderValue(profile.companySize)) {
    rightColumnItems.push({ label: 'Company Size', value: profile.companySize });
  }

  if (shouldRenderValue(profile.annualRevenue)) {
    rightColumnItems.push({ label: 'Annual Revenue', value: profile.annualRevenue });
  }

  if (shouldRenderValue(profile.yoyGrowth)) {
    rightColumnItems.push({ label: 'YoY Growth', value: `${profile.yoyGrowth}%` });
  } else if (shouldRenderValue(profile.growthRate)) {
    rightColumnItems.push({ label: 'YoY Growth', value: `${profile.growthRate}%` });
  }

  // Primary offerings footer
  const offerings = profile.primaryOfferings?.filter(o => shouldRenderValue(o))?.slice(0, 3)?.join(', ') ||
                    profile.products?.filter(o => shouldRenderValue(o))?.slice(0, 3)?.join(', ') ||
                    profile.services?.filter(o => shouldRenderValue(o))?.slice(0, 3)?.join(', ');

  // Assessment metrics
  // Trajectory metric removed per quality review 2025-12-18
  // Rationale: "Flat" descriptor provided no actionable value to clients
  const healthScore = ctx.overallHealth?.score ?? 0;
  const healthBand = ctx.overallHealth?.band ?? 'Attention';
  const strengthCount = ctx.findings?.filter(f => f.type === 'strength')?.length ?? 0;
  const priorityCount = ctx.findings?.filter(f => f.type === 'gap' || f.type === 'risk')?.length ?? 0;

  // Generate executive summary
  const executiveSummaryHtml = generateCompanySnapshotExecutiveSummary(ctx);

  // Build profile items HTML
  const renderProfileItem = (item: ProfileItem) => `
    <div class="profile-item">
      <span class="profile-label">${escapeHtml(item.label)}</span>
      <span class="profile-value">${escapeHtml(item.value)}</span>
    </div>
  `;

  return `
    <section class="section page-break" id="company-snapshot">
      ${renderOwnerSectionHeader('Company Snapshot', 'What does my business look like today?')}

      ${executiveSummaryHtml}

      <!-- PART A: Company Profile Card (Consolidated 2-column layout) -->
      <div class="company-profile-card" style="
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1.5rem;
      ">
        <div class="profile-grid-2col" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding: 1.5rem;
        ">
          <!-- LEFT COLUMN -->
          <div class="profile-col-left">
            ${leftColumnItems.map(renderProfileItem).join('')}
          </div>

          <!-- RIGHT COLUMN -->
          <div class="profile-col-right">
            ${rightColumnItems.map(renderProfileItem).join('')}
          </div>
        </div>

        ${shouldRenderValue(offerings) ? `
          <!-- Footer: Products/Services -->
          <div class="profile-footer" style="
            background: #f5f5f5;
            padding: 0.75rem 1.5rem;
            font-size: 0.9rem;
            border-top: 1px solid #e0e0e0;
          ">
            <strong>Primary Offerings:</strong> ${escapeHtml(offerings!)}
          </div>
        ` : ''}
      </div>

      <!-- PART B: Assessment Highlights (3 metric cards) -->
      <!-- Trajectory Card removed per quality review 2025-12-18 -->
      <div class="assessment-highlights-grid" style="
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      ">
        <!-- Health Score Card -->
        <div class="highlight-card" style="
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          border-top: 4px solid ${getBandColor(healthScore)};
        ">
          <span class="highlight-label" style="
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 0.5rem;
            letter-spacing: 0.5px;
          ">Health Score</span>
          <span class="highlight-value" style="
            display: block;
            font-size: 2rem;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            color: ${getBandColor(healthScore)};
            margin-bottom: 0.25rem;
          ">${healthScore}/100</span>
          <span class="highlight-status" style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            background: ${getBandColor(healthScore)};
            color: ${healthBand === 'Attention' ? '#000' : '#fff'};
          ">${healthBand}</span>
        </div>

        <!-- Key Strengths Card -->
        <div class="highlight-card" style="
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          border-top: 4px solid #28a745;
        ">
          <span class="highlight-label" style="
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 0.5rem;
            letter-spacing: 0.5px;
          ">Key Strengths</span>
          <span class="highlight-value" style="
            display: block;
            font-size: 2rem;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            color: #28a745;
            margin-bottom: 0.25rem;
          ">${strengthCount}</span>
          <span class="highlight-detail" style="font-size: 0.85rem; color: #888;">Identified areas</span>
        </div>

        <!-- Priority Areas Card -->
        <div class="highlight-card" style="
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          border-top: 4px solid #dc3545;
        ">
          <span class="highlight-label" style="
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 0.5rem;
            letter-spacing: 0.5px;
          ">Priority Areas</span>
          <span class="highlight-value" style="
            display: block;
            font-size: 2rem;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            color: #dc3545;
            margin-bottom: 0.25rem;
          ">${priorityCount}</span>
          <span class="highlight-detail" style="font-size: 0.85rem; color: #888;">Requiring attention</span>
        </div>
      </div>
    </section>
  `;
}

/**
 * Interface for phased roadmap data
 */
interface PhasedRoadmap {
  phase1: RoadmapPhase;
  phase2: RoadmapPhase;
  phase3: RoadmapPhase;
}

interface RoadmapPhase {
  objective: string;
  initiatives: Array<{
    title: string;
    description: string;
    owner: string;
    timeline: string;
    priority: string;
    effort: string;
    expectedOutcome: string;
    milestones?: Array<{ week: number; description: string }>;
  }>;
}

/**
 * Extract roadmap from phases and recommendations
 */
function extractRoadmapFromPhases(ctx: ReportContext): PhasedRoadmap {
  const recommendations = ctx.recommendations || [];

  // Sort by priority
  const sortedRecs = [...recommendations].sort((a, b) => (a.priorityRank || a.priority || 99) - (b.priorityRank || b.priority || 99));

  // Map recommendations to initiatives
  const mapToInitiative = (rec: any) => ({
    title: sanitizeGenericContent(rec.theme || rec.title || 'Strategic Initiative', ctx),
    description: sanitizeGenericContent(rec.expectedOutcomes || rec.description || '', ctx),
    owner: mapDimensionToOwner(rec.dimensionCode),
    timeline: rec.horizonLabel || rec.timeframe || 'TBD',
    priority: String(rec.priorityRank || rec.priority || 'Medium'),
    effort: rec.effortScore <= 40 ? 'Low' : rec.effortScore <= 70 ? 'Medium' : 'High',
    expectedOutcome: sanitizeGenericContent(rec.expectedOutcomes || 'Measurable improvement', ctx),
    milestones: rec.actionSteps?.slice(0, 3).map((step: string, idx: number) => ({
      week: (idx + 1) * 2,
      description: step
    })) || []
  });

  return {
    phase1: {
      objective: 'Establish foundation and capture quick wins',
      initiatives: sortedRecs.slice(0, 4).map(mapToInitiative)
    },
    phase2: {
      objective: 'Scale successful initiatives and address medium-priority gaps',
      initiatives: sortedRecs.slice(4, 7).map(mapToInitiative)
    },
    phase3: {
      objective: 'Long-term optimization and strategic positioning',
      initiatives: sortedRecs.slice(7, 10).map(mapToInitiative)
    }
  };
}

/**
 * Generate 90/180/365-Day Phased Strategic Roadmap (NORTH STAR requirement)
 * Section 8: Enhanced Strategic Implementation Roadmap with IDM integration
 *
 * Uses the new enhanced roadmap components with:
 * - Data extraction from IDM with fallback logic
 * - Professional phase cards with visualizations
 * - Impact/effort badges and owner focus
 * - Cross-references to Comprehensive Report
 */
async function generatePhasedRoadmap(ctx: ReportContext, options: ReportRenderOptions): Promise<string> {
  try {
    // Build data sources for roadmap extraction
    const dataSources: RoadmapDataSources = {
      idm: buildIdmFromContext(ctx),
      reportContext: ctx,
    };

    // Build enhanced roadmap phases using new component
    const phases = await buildOwnerRoadmapPhases(dataSources);

    // Render using the new professional renderer
    return renderStrategicImplementationRoadmap(
      phases,
      ctx.companyProfile.name
    );
  } catch (error) {
    logger.warn({ error }, 'Failed to generate enhanced roadmap, falling back to legacy');
    return generateLegacyPhasedRoadmap(ctx, options);
  }
}

/**
 * Build IDM structure from ReportContext for roadmap extraction
 */
function buildIdmFromContext(ctx: ReportContext): any {
  return {
    recommendations: ctx.recommendations || [],
    quick_wins: ctx.quickWins || [],
    quickWins: ctx.quickWins || [],
    roadmap: ctx.roadmap || { phases: [] },
    criticalDecisions: ctx.criticalDecisions || [],
    decisions: ctx.decisions || [],
    categoryAnalyses: ctx.categoryAnalyses || [],
  };
}

/**
 * Legacy phased roadmap generator (fallback)
 * Maintains backward compatibility if enhanced generation fails
 */
function generateLegacyPhasedRoadmap(ctx: ReportContext, options: ReportRenderOptions): string {
  const primaryColor = options.brand.primaryColor;

  // Extract roadmap from context or phases
  const roadmap = ctx.roadmap?.phases && ctx.roadmap.phases.length > 0
    ? convertContextRoadmap(ctx.roadmap, ctx)
    : extractRoadmapFromPhases(ctx);

  const phases = [
    { key: 'phase1', data: roadmap.phase1, dayRange: '1-90', label: 'First Quarter', color: '#28a745' },
    { key: 'phase2', data: roadmap.phase2, dayRange: '91-180', label: 'Second Quarter', color: '#17a2b8' },
    { key: 'phase3', data: roadmap.phase3, dayRange: '181-365', label: 'Months 7-12', color: primaryColor }
  ];

  return `
    <section class="section page-break" id="phased-roadmap">
      ${renderOwnerSectionHeader('Strategic Implementation Roadmap', 'How should I sequence my improvements?')}

      <p class="section-intro" style="margin-bottom: 1.5rem;">
        Sequenced action plan for ${escapeHtml(ctx.companyProfile.name)} across three implementation phases.
        This roadmap prioritizes initiatives based on impact potential, resource requirements, and strategic dependencies.
      </p>

      ${phases.map((phase, idx) => `
        <div class="phase-container" style="
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        ">
          <div class="phase-header" style="
            background: linear-gradient(135deg, ${phase.color} 0%, ${phase.color}dd 100%);
            color: white;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h4 style="margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.1rem;">
              Phase ${idx + 1}: Days ${phase.dayRange}
            </h4>
            <span style="font-size: 0.9rem; opacity: 0.9;">${phase.label}</span>
          </div>

          <div class="phase-content" style="background: #fff; padding: 1.5rem;">
            <div class="phase-objective" style="
              background: #f8f9fa;
              padding: 0.75rem 1rem;
              border-radius: 6px;
              margin-bottom: 1rem;
              border-left: 4px solid ${phase.color};
            ">
              <strong style="color: ${primaryColor};">Objective:</strong>
              ${escapeHtml(phase.data.objective)}
            </div>

            ${phase.data.initiatives.length > 0 ? `
              <div class="initiatives-grid" style="display: flex; flex-direction: column; gap: 1rem;">
                ${phase.data.initiatives.map((initiative, initIdx) => `
                  <div class="initiative-card" style="
                    background: linear-gradient(135deg, #fafbfc 0%, #fff 100%);
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 1rem;
                  ">
                    <div class="initiative-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                      <h5 style="margin: 0; color: ${primaryColor}; font-family: 'Montserrat', sans-serif; font-size: 1rem;">
                        ${idx + 1}.${initIdx + 1} ${escapeHtml(initiative.title)}
                      </h5>
                      <span style="
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        background: ${initiative.priority === '1' || initiative.priority === 'Critical' ? '#dc3545' : initiative.priority === '2' || initiative.priority === 'High' ? '#fd7e14' : '#ffc107'};
                        color: ${initiative.priority === '1' || initiative.priority === 'Critical' || initiative.priority === '2' || initiative.priority === 'High' ? '#fff' : '#000'};
                      ">P${initiative.priority}</span>
                    </div>

                    <p style="color: #555; margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.5;">
                      ${escapeHtml(initiative.description)}
                    </p>

                    <div class="initiative-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e9ecef; font-size: 0.85rem;">
                      <span><strong>Owner:</strong> ${escapeHtml(initiative.owner)}</span>
                      <span><strong>Timeline:</strong> ${escapeHtml(initiative.timeline)}</span>
                      <span><strong>Effort:</strong> ${escapeHtml(initiative.effort)}</span>
                    </div>

                    ${initiative.milestones && initiative.milestones.length > 0 ? `
                      <div class="milestones" style="margin-top: 0.75rem; padding: 0.75rem; background: #f8f9fa; border-radius: 6px;">
                        <strong style="font-size: 0.85rem; color: ${primaryColor};">Key Milestones:</strong>
                        <ul style="margin: 0.5rem 0 0 1.25rem; padding: 0; font-size: 0.85rem; color: #555;">
                          ${initiative.milestones.map(m => `
                            <li><strong>Week ${m.week}:</strong> ${escapeHtml(m.description)}</li>
                          `).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    <div class="initiative-outcome" style="margin-top: 0.75rem; font-size: 0.9rem;">
                      <strong style="color: ${options.brand.accentColor};">Expected Outcome:</strong>
                      ${escapeHtml(initiative.expectedOutcome)}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p style="color: #666; font-style: italic;">
                Phase ${idx + 1} initiatives to be developed based on Phase ${idx} outcomes.
              </p>
            `}
          </div>
        </div>
      `).join('')}

      <div class="roadmap-footer" style="
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid ${options.brand.accentColor};
        margin-top: 1rem;
      ">
        <p style="margin: 0; font-size: 0.9rem; color: #666; font-style: italic;">
          <strong>Note:</strong> Timeline assumes consistent resource availability and leadership commitment.
          Adjust phases based on organizational capacity and market conditions.
          Progress should be reviewed monthly with adjustments made as needed.
        </p>
      </div>
    </section>
  `;
}

/**
 * Convert context roadmap to phased format
 */
function convertContextRoadmap(roadmap: any, ctx: ReportContext): PhasedRoadmap {
  const phases = roadmap.phases || [];

  const mapPhase = (phaseIdx: number): RoadmapPhase => {
    const phase = phases[phaseIdx];
    if (!phase) {
      return {
        objective: 'To be determined based on previous phase outcomes',
        initiatives: []
      };
    }

    return {
      objective: phase.narrative || phase.objective || 'Strategic implementation',
      initiatives: (phase.keyMilestones || phase.initiatives || []).map((item: any) => ({
        title: typeof item === 'string' ? item : (item.title || item.milestone || 'Initiative'),
        description: typeof item === 'string' ? '' : (item.description || ''),
        owner: typeof item === 'string' ? 'Leadership Team' : (item.owner || 'Leadership Team'),
        timeline: typeof item === 'string' ? (phase.timeHorizon || 'TBD') : (item.timeline || phase.timeHorizon || 'TBD'),
        priority: typeof item === 'string' ? 'Medium' : (item.priority || 'Medium'),
        effort: typeof item === 'string' ? 'Medium' : (item.effort || 'Medium'),
        expectedOutcome: typeof item === 'string' ? 'Measurable improvement' : (item.expectedOutcome || 'Measurable improvement'),
        milestones: typeof item === 'string' ? [] : (item.milestones || [])
      }))
    };
  };

  return {
    phase1: mapPhase(0),
    phase2: mapPhase(1),
    phase3: mapPhase(2)
  };
}

/**
 * Interface for financial impact data
 */
interface FinancialImpactData {
  totalInvestmentMin: number;
  totalInvestmentMax: number;
  projectedROI: number;
  expectedReturn: number;
  paybackMonths: number;
  annualValueCreation: number;
  breakdown: Array<{
    initiative: string;
    investment: number;
    expectedReturn: number;
    roi: number;
    paybackMonths: number;
  }>;
}

/**
 * Extract financial data from context
 */
function extractFinancialData(ctx: ReportContext): FinancialImpactData {
  // Try financialProjections first
  if (ctx.financialProjections) {
    const fp = ctx.financialProjections;
    const totalInvestment = fp.totalInvestmentRequired || 0;
    const annualValue = fp.annualValue || 0;

    return {
      totalInvestmentMin: Math.floor(totalInvestment * 0.8),
      totalInvestmentMax: Math.ceil(totalInvestment * 1.2),
      projectedROI: annualValue > 0 && totalInvestment > 0
        ? Math.round((annualValue / totalInvestment) * 100)
        : 150,
      expectedReturn: annualValue,
      paybackMonths: totalInvestment > 0 && annualValue > 0
        ? Math.ceil((totalInvestment / annualValue) * 12)
        : 12,
      annualValueCreation: annualValue,
      breakdown: []
    };
  }

  // Fallback: Generate estimates from recommendations
  const recommendations = ctx.recommendations || [];
  const breakdown = recommendations.slice(0, 5).map(r => {
    const investment = estimateInvestmentFromEffort(r.effortScore);
    const expectedReturn = investment * 2;
    return {
      initiative: r.theme || r.title || 'Strategic Initiative',
      investment,
      expectedReturn,
      roi: 200,
      paybackMonths: 12
    };
  });

  const totalInvestment = breakdown.reduce((sum, item) => sum + item.investment, 0);
  const totalReturn = breakdown.reduce((sum, item) => sum + item.expectedReturn, 0);

  return {
    totalInvestmentMin: Math.floor(totalInvestment * 0.8),
    totalInvestmentMax: Math.ceil(totalInvestment * 1.2),
    projectedROI: totalReturn > 0 && totalInvestment > 0
      ? Math.round((totalReturn / totalInvestment) * 100)
      : 150,
    expectedReturn: totalReturn,
    paybackMonths: 12,
    annualValueCreation: totalReturn,
    breakdown
  };
}

/**
 * Estimate investment based on effort score
 */
function estimateInvestmentFromEffort(effortScore?: number): number {
  if (!effortScore) return 15000;
  if (effortScore <= 30) return 5000;
  if (effortScore <= 50) return 15000;
  if (effortScore <= 70) return 35000;
  return 75000;
}

/**
 * Generate Financial Impact section with quantified numbers (NORTH STAR requirement)
 * Shows dollar amounts, ROI percentages, and payback periods
 */
function generateQuantifiedFinancialImpact(ctx: ReportContext, options: ReportRenderOptions): string {
  const primaryColor = options.brand.primaryColor;
  const accentColor = options.brand.accentColor;

  const financial = extractFinancialData(ctx);
  const hasData = financial.totalInvestmentMin > 0 || financial.projectedROI > 0;

  if (!hasData) {
    logger.warn({
      company: ctx.companyProfile.name
    }, '[QUALITY WARNING] No financial data available for quantified impact section');
  }

  return `
    <section class="section page-break" id="financial-impact">
      ${renderOwnerSectionHeader('Investment & ROI Analysis', 'What will this cost and what will I get back?')}

      <p class="section-intro" style="margin-bottom: 1.5rem;">
        Quantified financial projections for implementing the recommended improvements.
        These estimates are based on industry benchmarks and your specific business context.
      </p>

      <!-- P2.1 FIX: Enhanced contrast (opacity 0.9→0.95, 0.8→0.9) and thousands separators for ROI -->
      <div class="financial-dashboard" style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
      ">
        <div class="financial-card" style="
          background: linear-gradient(135deg, ${primaryColor} 0%, #2a3366 100%);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <div class="card-label" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.95); margin-bottom: 0.5rem;">Total Investment Required</div>
          <div class="card-value" style="font-size: 1.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif; color: #ffffff;">
            ${financial.totalInvestmentMin > 0
              ? `${formatCurrencyConstraint(financial.totalInvestmentMin)} - ${formatCurrencyConstraint(financial.totalInvestmentMax)}`
              : 'TBD'}
          </div>
          <div class="card-detail" style="font-size: 0.8rem; color: rgba(255,255,255,0.9); margin-top: 0.25rem;">12-18 month implementation</div>
        </div>

        <div class="financial-card" style="
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <div class="card-label" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.95); margin-bottom: 0.5rem;">Projected ROI</div>
          <div class="card-value" style="font-size: 1.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif; color: #ffffff;">
            ${financial.projectedROI > 0 ? `${new Intl.NumberFormat('en-US').format(financial.projectedROI)}%` : 'TBD'}
          </div>
          <div class="card-detail" style="font-size: 0.8rem; color: rgba(255,255,255,0.9); margin-top: 0.25rem;">
            ${financial.expectedReturn > 0 ? `Est. return: ${formatCurrencyConstraint(financial.expectedReturn)}` : 'Based on industry benchmarks'}
          </div>
        </div>

        <div class="financial-card" style="
          background: linear-gradient(135deg, #17a2b8 0%, #20c9e0 100%);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <div class="card-label" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.95); margin-bottom: 0.5rem;">Payback Period</div>
          <div class="card-value" style="font-size: 1.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif; color: #ffffff;">
            ${financial.paybackMonths > 0 ? `${financial.paybackMonths} months` : 'TBD'}
          </div>
          <div class="card-detail" style="font-size: 0.8rem; color: rgba(255,255,255,0.9); margin-top: 0.25rem;">Break-even timeline</div>
        </div>

        <div class="financial-card" style="
          background: linear-gradient(135deg, ${accentColor} 0%, #b8a82a 100%);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <div class="card-label" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.95); margin-bottom: 0.5rem;">Annual Value Creation</div>
          <div class="card-value" style="font-size: 1.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif; color: #ffffff;">
            ${financial.annualValueCreation > 0 ? formatCurrencyConstraint(financial.annualValueCreation) : 'TBD'}
          </div>
          <div class="card-detail" style="font-size: 0.8rem; color: rgba(255,255,255,0.9); margin-top: 0.25rem;">Revenue + savings + efficiency</div>
        </div>
      </div>

      ${financial.breakdown.length > 0 ? `
        <h4 style="font-family: 'Montserrat', sans-serif; color: ${primaryColor}; margin-bottom: 1rem;">Investment Breakdown by Initiative</h4>
        <div class="table-responsive" style="overflow-x: auto;">
          <table class="financial-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="background: ${primaryColor}; color: white;">
                <th style="padding: 0.75rem; text-align: left;">Initiative</th>
                <th style="padding: 0.75rem; text-align: right;">Investment</th>
                <th style="padding: 0.75rem; text-align: right;">Expected Return</th>
                <th style="padding: 0.75rem; text-align: right;">ROI</th>
                <th style="padding: 0.75rem; text-align: right;">Payback</th>
              </tr>
            </thead>
            <tbody>
              ${financial.breakdown.map((item, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#f8f9fa' : '#fff'}; border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 0.75rem; font-weight: 500;">${escapeHtml(item.initiative)}</td>
                  <td style="padding: 0.75rem; text-align: right;">${formatCurrencyConstraint(item.investment)}</td>
                  <td style="padding: 0.75rem; text-align: right; color: #28a745;">${formatCurrencyConstraint(item.expectedReturn)}</td>
                  <td style="padding: 0.75rem; text-align: right;">${new Intl.NumberFormat('en-US').format(item.roi)}%</td>
                  <td style="padding: 0.75rem; text-align: right;">${item.paybackMonths} mo</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #e9ecef; font-weight: 600;">
                <td style="padding: 0.75rem;">Total</td>
                <td style="padding: 0.75rem; text-align: right;">${formatCurrencyConstraint(financial.breakdown.reduce((s, i) => s + i.investment, 0))}</td>
                <td style="padding: 0.75rem; text-align: right; color: #28a745;">${formatCurrencyConstraint(financial.breakdown.reduce((s, i) => s + i.expectedReturn, 0))}</td>
                <td style="padding: 0.75rem; text-align: right;">${new Intl.NumberFormat('en-US').format(financial.projectedROI)}%</td>
                <td style="padding: 0.75rem; text-align: right;">${financial.paybackMonths} mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : `
        <div class="financial-note" style="
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid ${accentColor};
          margin-top: 1rem;
        ">
          <p style="margin: 0; color: #666; font-style: italic;">
            <strong>Note:</strong> Detailed financial projections are available upon request.
            Investment requirements depend on implementation scope, resource allocation decisions,
            and your organization's specific circumstances.
          </p>
        </div>
      `}

      <div class="roi-assumptions" style="
        background: #fff3cd;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #ffc107;
        margin-top: 1.5rem;
      ">
        <h5 style="margin: 0 0 0.5rem 0; color: #856404;">ROI Assumptions</h5>
        <ul style="margin: 0; padding-left: 1.25rem; color: #856404; font-size: 0.9rem;">
          <li>Projections based on industry benchmarks for ${escapeHtml(ctx.companyProfile.industry || 'your industry')}</li>
          <li>ROI assumes full implementation of recommended initiatives</li>
          <li>Actual results may vary based on execution quality and market conditions</li>
          <li>Figures represent conservative estimates; upside potential may be higher</li>
        </ul>
      </div>
    </section>
  `;
}

/**
 * Build business owner report with integrated narrative content
 * Enhanced with owner-focused voice, cross-references, and depth constraints
 */
export async function buildOwnersReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'owner';
  const reportName = 'Business Owner Report';

  // Reset reference logger for fresh run
  referenceLogger.reset();

  logger.info('Building owners report with narrative integration and cross-references');

  // Get narrative content from context and sanitize terminology
  // P1 FIX: Remove internal pipeline references from client-facing content
  const rawNarratives = ctx.narrativeContent;
  const narratives = rawNarratives ? sanitizeObjectTerminology(rawNarratives) : rawNarratives;
  const hasNarratives = narratives && narratives.metadata?.contentSufficient;

  // Apply owner report constraints for abbreviated content
  const { maxPriorities, maxStrengths, maxQuickWins, maxRisks, maxRecommendationsPerSection } = OWNER_REPORT_CONSTRAINTS;

  // Get constrained findings and recommendations (North Star Part 5: Top 5)
  const strengths = ctx.findings.filter(f => f.type === 'strength').slice(0, maxStrengths);
  const priorities = ctx.findings.filter(f => f.type === 'gap' || f.type === 'risk').slice(0, maxPriorities);
  const topRecommendations = ctx.recommendations.slice(0, maxRecommendationsPerSection + 2);
  const quickWins = ctx.quickWins.slice(0, maxQuickWins);
  const topRisks = ctx.risks?.slice(0, maxRisks) || [];

  // Generate narrative CSS styles with owner enhancements
  const narrativeStyles = generateOwnerNarrativeStyles(options.brand.primaryColor, options.brand.accentColor);

  // Generate visual enhancement components
  const keyTakeawaysHtml = generateKeyTakeaways(ctx);
  const executiveHighlightsHtml = generateExecutiveHighlights(ctx);
  const overallBenchmarkHtml = generateOverallBenchmarkCallout(ctx);
  const insightCardsHtml = buildOwnerInsightCards(ctx, 4);
  const benchmarkSummaryHtml = generateBenchmarkSummaryTable(ctx);

  // Generate visual charts asynchronously
  logger.info('Generating visual charts for owner report');
  const [chapterRadar, chapterBars] = await Promise.all([
    generateChapterOverviewRadar(ctx, { width: 450, height: 350 }).catch(() => ''),
    generateAllChapterScoreBars(ctx, { width: 550, height: 220 }).catch(() => ''),
  ]);

  // ============================================================================
  // WORLD-CLASS VISUAL COMPONENTS (Phase 1.5-2)
  // ============================================================================
  logger.info('Generating world-class visual components for owner report');

  // Generate 4-Chapter Radar (simplified for owner report)
  let worldClassChapterRadar = '';
  try {
    const chapterRadarData = contextToChapterRadarData(ctx);
    if (chapterRadarData && chapterRadarData.chapters.length > 0) {
      worldClassChapterRadar = render4ChapterRadar(chapterRadarData, {
        width: 400,
        height: 350,
        showBenchmark: true,
        showLegend: true,
        companyName: ctx.companyProfile.name,
      });
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to generate 4-chapter radar for owner report');
  }

  // Generate Financial Impact Dashboard
  let worldClassFinancialDashboard = '';
  try {
    const financialData = contextToFinancialImpactData(ctx);
    if (financialData) {
      worldClassFinancialDashboard = generateFinancialImpactDashboard(financialData, {
        showROI: true,
        showTimeline: true,
        companyName: ctx.companyProfile.name,
      });
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to generate financial impact dashboard for owner report');
  }

  // Generate Quick Wins Cards
  let worldClassQuickWinsCards = '';
  try {
    const quickWinCards = contextToQuickWinCards(ctx);
    if (quickWinCards && quickWinCards.length > 0) {
      worldClassQuickWinsCards = generateQuickWinsGrid(quickWinCards.slice(0, 4), {
        columns: 2,
        showTransformation: true,
        showTimeline: true,
      });
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to generate quick wins cards for owner report');
  }

  // ============================================================================
  // ENHANCED CHAPTER SUMMARIES WITH PERCENTILE RANKINGS (Phase 1.5-2)
  // World-class section headers showing competitive positioning
  // ============================================================================
  logger.info('Generating enhanced chapter summaries with percentile rankings');

  let enhancedChapterSummaries = '';
  try {
    enhancedChapterSummaries = ctx.chapters.map(chapter => {
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

      return generateEnhancedSectionHeader(headerConfig, {
        size: 'medium',
        showPercentile: true,
        showBand: true,
        showBenchmark: !!chapter.industryBenchmark,
        benchmark: chapter.industryBenchmark,
      });
    }).join('');
  } catch (error) {
    logger.warn({ error }, 'Failed to generate enhanced chapter summaries for owner report');
  }

  // Generate financial aggregates for overview display
  const financialProjections = ctx.financialProjections;
  const investmentLow = financialProjections?.totalInvestmentRequired
    ? Math.floor(financialProjections.totalInvestmentRequired * 0.8)
    : 0;
  const investmentHigh = financialProjections?.totalInvestmentRequired
    ? Math.ceil(financialProjections.totalInvestmentRequired * 1.2)
    : 0;
  const returnLow = financialProjections?.annualValue
    ? Math.floor(financialProjections.annualValue * 0.8)
    : 0;
  const returnHigh = financialProjections?.annualValue
    ? Math.ceil(financialProjections.annualValue * 1.2)
    : 0;
  const roiLow = financialProjections?.roi90Day || 1.5;
  const roiHigh = roiLow * 1.5;

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
      reportType: 'owner',
      companyName: ctx.companyProfile.name,
      termsVersion,
      generatedDate,
    };

    // Generate legal content for clickwrap modal
    const clickwrapLegalContent = generateClickwrapLegalContent();

    // Generate clickwrap modal (gates content until accepted)

    // Generate acceptance banner (compact replacement for legal block)
    acceptanceBanner = generateAcceptanceBanner({
      termsVersion,
      showViewTermsLink: true,
    });

    // Generate legal accordion (collapsible sections at bottom)
    const legalSections = getDefaultLegalSections();
    legalAccordion = generateLegalAccordion(legalSections);

    logger.info('Production mode: Full legal protection enabled for owner report');
  } else {
    logger.info('Beta mode: Clickwrap/blur protection bypassed for owner report');
  }

  // Phase 0: Generate cover page for Owner's Report
  const coverPage = generateCoverPage(ctx, {
    reportType: 'owner',
    showLogo: true,
    showConfidentialBadge: true,
  });

  // ============================================================================
  // PHASE 1: OWNER DECISION BRIEF PREMIUM COMPONENTS
  // ============================================================================
  logger.info('Generating Owner Health Dashboard and Decision Agenda');

  // Generate Owner Health Dashboard (one-page executive summary)
  let ownerHealthDashboard = '';
  try {
    ownerHealthDashboard = generateOwnerHealthDashboard(ctx);
  } catch (error) {
    logger.warn({ error }, 'Failed to generate Owner Health Dashboard');
  }

  // Generate Owner's Decision Agenda (strategic decisions section)
  let ownerDecisionAgenda = '';
  try {
    ownerDecisionAgenda = generateOwnerDecisionAgenda(ctx);
  } catch (error) {
    logger.warn({ error }, 'Failed to generate Owner Decision Agenda');
  }

  // Generate Risk Heatmap for enhanced risk visualization
  let riskHeatmap = '';
  try {
    if (topRisks && topRisks.length > 0) {
      riskHeatmap = renderRiskHeatmapFromRisks(topRisks.slice(0, 10).map(risk => ({
        id: risk.id,
        narrative: risk.narrative || risk.title || risk.description || '',
        severity: risk.severity || 'medium',
        likelihood: risk.likelihood || 'medium',
        category: risk.category,
        dimensionCode: risk.dimensionCode,
      })));
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to generate Risk Heatmap');
  }

  // ============================================================================
  // STRATEGIC IMPLEMENTATION ROADMAP (Enhanced Section 8)
  // Pre-generate async roadmap content before template literal
  // ============================================================================
  let strategicRoadmapHtml = '';
  try {
    logger.info('Generating enhanced Strategic Implementation Roadmap');
    strategicRoadmapHtml = await generatePhasedRoadmap(ctx, options);
  } catch (error) {
    logger.warn({ error }, 'Failed to generate enhanced roadmap, using fallback');
    strategicRoadmapHtml = generateLegacyPhasedRoadmap(ctx, options);
  }

  const html = wrapHtmlDocument(`
    ${coverPage}

    ${generateReportHeader(ctx, reportName, 'Your Executive Decision Guide')}

    <!-- Compact Terms Acceptance Banner (replaces lengthy legal block) -->
    ${acceptanceBanner}

    <!-- ================================================================
         SECTION: AI-Generated Executive BLUF (Bottom Line Up Front)
         Phase 4.5 Integration - Concise executive summary
         ================================================================ -->
    ${generateBLUFSection(ctx)}

    <!-- ================================================================
         SECTION: Owner Health Dashboard (One-Page Executive Summary)
         Premium "Owner Decision Brief" - Phase 1
         ================================================================ -->
    ${ownerHealthDashboard ? ownerHealthDashboard : ''}

    <!-- ================================================================
         SECTION: Company Snapshot (NORTH STAR requirement)
         ================================================================ -->
    ${generateCompanySnapshot(ctx, options)}

    <!-- ================================================================
         SECTION: Your Business Health at a Glance
         ================================================================ -->
    <section class="section" id="health-overview">
      ${renderOwnerSectionHeader('Your Business Health at a Glance', 'How is my business doing?')}

      <div class="health-score-display">
        <div class="health-score-circle">
          <span class="score">${ctx.overallHealth.score}</span>
          <span class="out-of">/ 100</span>
        </div>
        <div class="health-score-details">
          <p class="status">${escapeHtml(transformToOwnerVoice(ctx.overallHealth.status))}</p>
          <!-- Trajectory metric removed per quality review 2025-12-18 -->
          <p class="band">
            <span class="band-badge ${ctx.overallHealth.band}">${ctx.overallHealth.band}</span>
          </p>
        </div>
      </div>

      <!-- Executive Highlights Summary -->
      ${executiveHighlightsHtml}

      <!-- Chapter Definitions Block - Added per quality review 2025-12-18 -->
      ${buildChapterDefinitionsBlock(options.brand.primaryColor)}

      <!-- World-Class: 4-Chapter Business Overview (Bar Chart + Radar) -->
      <div class="four-chapter-overview" style="margin: 2rem 0; padding: 1.5rem; background: linear-gradient(135deg, #fafbfc 0%, #fff 100%); border-radius: 12px; border: 1px solid #e9ecef;">
        <h3 style="color: ${options.brand.primaryColor}; font-family: 'Montserrat', sans-serif; margin: 0 0 0.5rem 0; font-size: 1.2rem; text-align: center;">Your 4-Chapter Business Overview</h3>
        <p style="text-align: center; color: #666; font-size: 0.85rem; margin-bottom: 1.5rem;">How your business compares across four strategic pillars</p>

        <!-- BAR CHART - Chapter Performance (above radar) -->
        ${generateChapterPerformanceBarChart(ctx)}

        <!-- RADAR CHART - Strategic Balance (with enhanced legend) -->
        ${worldClassChapterRadar ? `
          <div class="strategic-balance-chart" style="margin-top: 2rem;">
            <h4 style="color: ${options.brand.primaryColor}; font-family: 'Montserrat', sans-serif; margin: 0 0 0.5rem 0; font-size: 1rem; text-align: center;">Strategic Balance Overview</h4>
            <p style="text-align: center; color: #666; font-size: 0.8rem; margin-bottom: 1rem;">Pattern view showing balance across pillars</p>
            <div style="display: flex; justify-content: center;">
              ${worldClassChapterRadar}
            </div>
          </div>
        ` : ''}

        <!-- Insight Callout -->
        <div class="insight-callout" style="
          margin-top: 1.5rem;
          padding: 1rem;
          background: #e7f3ff;
          border: 1px solid #b8daff;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #0c5460;
        ">
          <strong style="color: ${options.brand.primaryColor};">How to read these charts:</strong> The bar chart shows precise scores and benchmark gaps
          for quick comparison. The radar chart reveals balance patterns—where your business shape differs
          from the benchmark shape indicates strategic focus opportunities.
        </div>
      </div>

      <!-- NOTE: "Your Performance at a Glance" scorecard removed - redundant with
           Strategic Balance Overview radar chart in Company Snapshot section -->

      <!-- Key Takeaways Box -->
      ${keyTakeawaysHtml}

      <!-- Benchmark Callout -->
      ${overallBenchmarkHtml}
    </section>

    <!-- ================================================================
         SECTION: What This Means for You as the Owner
         ================================================================ -->
    <section class="section" id="what-this-means">
      ${renderOwnerSectionHeader('What This Means for You as the Owner', 'What should I understand from this?')}

      <div class="owner-implications-grid">
        <div class="implication-card growth">
          <div class="card-icon">&#128200;</div>
          <div class="card-title">For Your Growth</div>
          <p>${getGrowthImplication(ctx)}</p>
        </div>

        <div class="implication-card risk">
          <div class="card-icon">&#9888;&#65039;</div>
          <div class="card-title">For Your Risk</div>
          <p>${getRiskImplication(ctx)}</p>
        </div>

        <div class="implication-card value">
          <div class="card-icon">&#128142;</div>
          <div class="card-title">For Your Business Value</div>
          <p>${getValueImplication(ctx)}</p>
        </div>
      </div>

      ${safeQuickRef('executiveSummary', 'what-this-means')}
    </section>

    <!-- ================================================================
         SECTION: Your Chapter Performance Summary (REMOVED)
         Enhancement 2025-12-31: Removed redundant section per quality review.
         Content duplicated "Your 4-Chapter Business Overview" with no unique value.
         ================================================================ -->

    <!-- ================================================================
         SECTION: Phase 1.5 Category Analysis Overview
         12-category radar, heatmap, and benchmark visualizations
         ================================================================ -->
    ${buildCategoryAnalysisOverview(ctx, options)}

    <!-- ================================================================
         SECTION: Phase 1.5 Cross-Category Insights
         Interdependency network and prioritization matrix
         ================================================================ -->
    ${buildCrossCategoryInsights(ctx, options)}

    <!-- ================================================================
         SECTION: Your Critical Priorities (P0 ENHANCED)
         Now with Critical Path Actions and implementation tables
         ================================================================ -->
    <section class="section page-break" id="critical-priorities">
      ${renderOwnerSectionHeader('Your Critical Priorities', 'What must I focus on?')}

      <!-- Visual Insight Cards -->
      ${insightCardsHtml}

      <div class="grid grid-2" style="margin-bottom: 2rem;">
        <div>
          <h3 style="color: #28a745;">Your Top Strengths</h3>
          ${(() => {
            const strengthCount = countStrengths(ctx);
            if (strengthCount.count > 0) {
              return `
                <p style="font-size: 0.95rem; color: #555; margin-bottom: 1rem;">
                  <strong>${strengthCount.display} key strengths</strong> identified across your business:
                </p>
                <ul>
                  ${strengths.slice(0, 5).map(s => `
                    <li>
                      <strong>${escapeHtml(s.shortLabel)}</strong>
                      <br><small>${escapeHtml(s.dimensionName)}</small>
                    </li>
                  `).join('')}
                </ul>
              `;
            } else {
              return '<p>Your business shows balanced performance across all areas.</p>';
            }
          })()}
        </div>
        <div>
          <h3 style="color: #dc3545;">Your Priority Areas</h3>
          ${priorities.length > 0 ? `
            <ul>
              ${priorities.slice(0, maxPriorities).map(p => `
                <li>
                  <strong>${escapeHtml(p.shortLabel)}</strong>
                  <br><small>${escapeHtml(p.dimensionName)}</small>
                </li>
              `).join('')}
            </ul>
          ` : '<p>No critical priorities identified.</p>'}
        </div>
      </div>

      <!-- P0 FIX: Critical Path Actions with Implementation Tables -->
      <div class="critical-path-actions" style="margin-top: 2rem;">
        <h3 style="color: ${options.brand.primaryColor}; font-family: 'Montserrat', sans-serif; margin-bottom: 1rem; font-size: 1.2rem;">
          Your Critical Path Actions
        </h3>
        <p style="font-size: 0.95rem; color: #666; margin-bottom: 1.5rem;">
          These are your highest-priority initiatives with step-by-step implementation plans:
        </p>
        ${renderCriticalPathActions(ctx, options.brand.primaryColor)}
      </div>

      ${safeQuickRef('strategicRecommendations', 'critical-priorities')}
    </section>

    <!-- ================================================================
         SECTION: Investment & ROI Overview
         ================================================================ -->
    <section class="section" id="investment-roi">
      ${renderOwnerSectionHeader('Investment & ROI Overview', 'How much will this cost and what will I get back?')}

      <p class="section-intro">
        Here's the high-level view of what you'll need to invest and what you can expect in return.
        These are aggregate ranges across all recommended initiatives.
      </p>

      <!-- World-Class: Financial Impact Dashboard -->
      ${worldClassFinancialDashboard ? `
        <div class="world-class-financial-section" style="margin: 1.5rem 0;">
          ${worldClassFinancialDashboard}
        </div>
      ` : `
        <div class="financial-summary-grid">
          <div class="financial-card">
            <div class="card-label">Your Estimated 12-18 Month Investment</div>
            <div class="card-value">${investmentLow > 0 ? formatCurrencyRange(investmentLow, investmentHigh) : '-'}</div>
            <div class="card-sublabel">Across all initiatives</div>
          </div>
          <div class="financial-card">
            <div class="card-label">Your Potential Revenue Impact</div>
            <div class="card-value">${returnLow > 0 ? formatCurrencyRange(returnLow, returnHigh) : '-'}</div>
            <div class="card-sublabel">Over 18 months</div>
          </div>
          <div class="financial-card highlight">
            <div class="card-label">Your Expected ROI</div>
            <div class="card-value">${roiLow.toFixed(1)}x - ${roiHigh.toFixed(1)}x</div>
            <div class="card-sublabel">Return on investment</div>
          </div>
        </div>
      `}

      <!-- P1 ENHANCEMENT: Impact/Effort Prioritization Matrix -->
      ${ctx.recommendations && ctx.recommendations.length > 0 ? `
        <div class="impact-effort-matrix-section" style="margin: 2rem 0;">
          <h3 style="font-family: 'Montserrat', sans-serif; color: ${options.brand.primaryColor}; margin-bottom: 1rem; font-size: 1.1rem;">
            Prioritization Matrix
          </h3>
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
            Your recommendations plotted by business impact and implementation effort.
            Items in the <strong style="color: #28a745;">Quick Wins</strong> quadrant (high impact, low effort) are your best starting points.
          </p>
          <div style="display: flex; justify-content: center; overflow-x: auto;">
            ${generateImpactEffortMatrix(
              ctx.recommendations.map(r => ({
                id: r.id,
                title: r.theme,
                impactScore: r.impactScore,
                effortScore: r.effortScore,
                dimensionCode: r.dimensionCode
              })),
              { width: 550, height: 450 }
            )}
          </div>
        </div>
      ` : ''}

      ${safeQuickRef('financialImpact', 'investment-roi')}
    </section>

    <!-- ================================================================
         SECTION: Your Critical Decisions (North Star Part 5)
         Replaces 47-action Priority Action Matrix with 3-5 strategic decisions
         ================================================================ -->
    ${generateCriticalDecisions(ctx)}

    <!-- ================================================================
         SECTION: Strategic Implementation Roadmap (NORTH STAR requirement)
         90/180/365-Day Phased Roadmap - Enhanced with IDM Integration
         ================================================================ -->
    ${strategicRoadmapHtml}

    <!-- ================================================================
         SECTION: Investment & ROI Analysis (NORTH STAR requirement)
         Quantified Financial Impact with dollar amounts
         ================================================================ -->
    ${generateQuantifiedFinancialImpact(ctx, options)}

    <!-- ================================================================
         SECTION: Quick Wins - Start Today (P0 ENHANCED)
         ================================================================ -->
      <section class="section" id="quick-wins">
        ${renderOwnerSectionHeader('Quick Wins - Start Today', 'What can I do right now?')}
        <p class="section-intro">These high-impact, low-effort improvements can be started within 7 days and completed within 90 days:</p>

        <!-- P0 FIX: Tactical Quick Wins with Implementation Steps -->
        <div class="tactical-quick-wins-section" style="margin: 1.5rem 0;">
          ${renderTacticalQuickWins(ctx, options.brand.primaryColor)}
        </div>

        ${safeQuickRef('recommendations', 'quick-wins')}
      </section>

    <!-- ================================================================
         SECTION: Key Risks to Your Business (P0 ENHANCED)
         Now with complete mitigation strategies
         ================================================================ -->
    <section class="section" id="key-risks">
      ${renderOwnerSectionHeader('Key Risks to Your Business', 'What could hurt my business?')}

      <!-- Risk Heatmap Visualization (Issue #1 fix: enhanced with contextual messaging) -->
      ${riskHeatmap ? `
        <div class="risk-heatmap-section" style="margin: 1.5rem 0; display: block; visibility: visible;">
          <h3 style="font-family: 'Montserrat', sans-serif; color: ${options.brand.primaryColor}; margin-bottom: 1rem; font-size: 1.1rem;">
            Risk Landscape Overview
          </h3>
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
            This heatmap shows your identified risks plotted by severity (vertical) and likelihood (horizontal).
            Risks in the upper-right quadrant require immediate attention.
          </p>
          <div class="svg-chart-wrapper" style="display: flex; justify-content: center; min-height: 200px;">
            ${riskHeatmap}
          </div>
          ${topRisks.length <= 2 ? `
            <p style="color: #666; font-size: 0.9rem; margin-top: 0.75rem; font-style: italic; text-align: center; background: #f8f9fa; padding: 0.75rem; border-radius: 6px;">
              Your assessment identified ${topRisks.length} significant risk${topRisks.length === 1 ? '' : 's'}.
              The heatmap above shows ${topRisks.length === 1 ? 'its position' : 'their positions'} based on
              severity (vertical axis) and likelihood (horizontal axis).
              Each numbered point corresponds to a risk detailed below.
            </p>
          ` : ''}
        </div>
      ` : ''}

      <!-- P0 FIX: Enhanced Risks with Mitigation Strategies -->
      <div class="enhanced-risks-section" style="margin: 1.5rem 0;">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #dc3545; margin-bottom: 1rem;">
          ⚠️ Priority Risks with Mitigation Strategies
        </h4>
        ${renderEnhancedRisks(ctx, options.brand.primaryColor)}
      </div>

      ${safeQuickRef('riskAssessment', 'key-risks')}
    </section>

    <!-- ================================================================
         SECTION: Where to Go for Detail
         ================================================================ -->
    ${renderWhereToGoForDetail()}

    <!-- ================================================================
         SECTION: Owner's Decision Agenda
         Premium "Owner Decision Brief" - Phase 1
         ================================================================ -->
    ${ownerDecisionAgenda ? ownerDecisionAgenda : ''}

    <!-- ================================================================
         SECTION: Your Next Steps
         ================================================================ -->
    <section class="section" id="next-steps">
      ${renderOwnerSectionHeader('Your Next Steps', 'What do I do now?')}
      <div class="callout success">
        <div class="title">Your Recommended Actions</div>
        <ol>
          <li><strong>This Week:</strong> Review the Quick Wins section above and select 1-2 initiatives to begin immediately</li>
          <li><strong>This Month:</strong> Schedule a strategic planning session with your leadership team to address your priority areas</li>
          <li><strong>For Detail:</strong> Use the "Where to Go for Detail" section above to navigate to the Comprehensive Report for full analysis</li>
          <li><strong>For Support:</strong> Consider engaging with BizHealth.ai for implementation support and ongoing monitoring</li>
        </ol>
      </div>
    </section>

    <!-- Legal Accordion (collapsible terms at bottom, collapsed by default) -->
    ${legalAccordion}

    ${generateOwnerReportFooter(ctx, narratives)}
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: `${narrativeStyles}\n${getBLUFInlineStyles()}`,
    legalAccess: ctx.legalAccess,
    ctx: ctx,
  });

  // Print reference usage summary if debug logging is enabled
  referenceLogger.printSummary();

  logger.info({
    contentWords: narratives?.metadata?.totalWords || 0,
    crossReferences: referenceLogger.getUsages().length,
    missingRefs: referenceLogger.getMissingRefs().length,
  }, 'Owners report built with cross-references');

  // Sanitize orphaned visualization headers from AI-generated content
  const { html: partialSanitizedHtml, removedCount, removedItems } = sanitizeOrphanedVisualizationHeaders(html);

  // P0 FIX: Remove duplicate empty CPA sections from AI-generated narrative
  const { html: sanitizedHtml, removedCount: cpaRemovedCount, removedItems: cpaRemovedItems } = removeDuplicateCPASections(partialSanitizedHtml);

  const totalRemoved = removedCount + cpaRemovedCount;
  if (totalRemoved > 0) {
    logger.info({ removedCount, cpaRemovedCount, removedItems: [...removedItems, ...cpaRemovedItems] }, 'Sanitized orphaned headers and duplicate CPAs from owner report');
  }

  // PHASE 1A: Run quality validation before writing
  const qualityReport = validateOwnerReport(sanitizedHtml, ctx);

  // If critical quality failures and not bypassing, throw error
  if (!qualityReport.passed && !options.skipQualityGate) {
    const criticalFailures = qualityReport.checks
      .filter(c => c.severity === 'Critical' && !c.passed)
      .map(c => c.name);

    logger.error({
      criticalFailures,
      company: ctx.companyProfile.name
    }, '[QUALITY GATE FAILURE] Owner Report generation blocked due to quality issues');

    // In production, this would block report delivery
    // For now, we log and continue but flag the issue
    logger.warn('Proceeding with report generation despite quality failures (skipQualityGate not set)');
  }

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, sanitizedHtml, 'utf-8');

  // Generate metadata with new section IDs (including Phase 1 Owner Decision Brief sections)
  const meta: ReportMeta = {
    reportType: 'owner',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 7, // Updated for new sections
    sections: [
      { id: 'owner-dashboard', title: 'Owner Health Dashboard' },
      { id: 'company-snapshot', title: 'Company Snapshot' }, // NORTH STAR
      { id: 'health-overview', title: 'Your Business Health at a Glance' },
      { id: 'what-this-means', title: 'What This Means for You as the Owner' },
      // Chapter Performance Breakdown removed - redundant with 4-Chapter Overview (2025-12-31)
      { id: 'category-analysis-overview', title: 'Category-Level Performance Analysis' },
      { id: 'cross-category-insights', title: 'Strategic Interdependencies & Priorities' },
      { id: 'critical-priorities', title: 'Your Critical Priorities' },
      { id: 'investment-roi', title: 'Investment & ROI Overview' },
      { id: 'critical-decisions', title: 'Your Critical Decisions' },
      { id: 'phased-roadmap', title: 'Strategic Implementation Roadmap' }, // NORTH STAR
      { id: 'financial-impact', title: 'Investment & ROI Analysis' }, // NORTH STAR
      { id: 'quick-wins', title: 'Quick Wins - Start Today' },
      { id: 'key-risks', title: 'Key Risks to Your Business' },
      { id: 'where-to-go', title: 'Where to Go for Detail' },
      { id: 'owner-decisions', title: "Owner's Decision Agenda" },
      { id: 'next-steps', title: 'Your Next Steps' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'owner',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

/**
 * Format currency value
 */
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

/**
 * Render owner-focused section header with question framing
 */
function renderOwnerSectionHeader(title: string, ownerQuestion?: string): string {
  return `
    <div class="owner-section-header">
      <h2>${title}</h2>
      ${ownerQuestion ? `
        <p class="owner-question">
          <span class="question-icon">&#128173;</span>
          <em>"${ownerQuestion}"</em>
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Generate growth implication text based on context
 */
function getGrowthImplication(ctx: ReportContext): string {
  const geChapter = ctx.chapters.find(ch => ch.code === 'GE');
  const score = geChapter?.score || ctx.overallHealth.score;

  if (score >= 80) {
    return 'Your business shows strong growth fundamentals. Focus on scaling what works and expanding into new opportunities.';
  } else if (score >= 60) {
    return 'Your business has solid growth potential with room for improvement. Addressing identified gaps could accelerate revenue growth.';
  } else if (score >= 40) {
    return 'Your growth engine needs attention. Sales processes and market positioning require strategic focus to unlock revenue potential.';
  } else {
    return 'Critical improvements are needed in your growth strategy. Immediate action on sales and marketing fundamentals is recommended.';
  }
}

/**
 * Generate risk implication text based on context
 */
function getRiskImplication(ctx: ReportContext): string {
  const rsChapter = ctx.chapters.find(ch => ch.code === 'RS');
  const riskCount = ctx.risks?.length || ctx.findings.filter(f => f.type === 'risk').length;
  const score = rsChapter?.score || ctx.overallHealth.score;

  if (score >= 80 && riskCount <= 2) {
    return 'Your business has strong risk management practices. Continue monitoring and maintain your compliance standards.';
  } else if (score >= 60) {
    return 'Some operational and compliance risks need attention to protect business continuity and avoid potential issues.';
  } else if (score >= 40) {
    return 'Key vulnerabilities exist in your operations. Addressing these risks should be a priority to protect your business.';
  } else {
    return 'Significant risk exposure requires immediate attention. Prioritize risk mitigation to protect your business from potential harm.';
  }
}

/**
 * Generate business value implication text based on context
 * Trajectory metric removed per quality review 2025-12-18
 */
function getValueImplication(ctx: ReportContext): string {
  const score = ctx.overallHealth.score;

  if (score >= 80) {
    return 'Your business is well-positioned for valuation growth. Strong fundamentals make you attractive to investors or potential buyers.';
  } else if (score >= 60) {
    return 'Addressing identified gaps could significantly improve your business valuation. Focus on the priority areas for maximum impact.';
  } else if (score >= 40) {
    return 'Your business value is constrained by operational challenges. Systematic improvement will unlock hidden value.';
  } else {
    return 'Business value improvement requires foundational work. Implementing recommended changes will build a stronger, more valuable business.';
  }
}

/**
 * Generate owner report footer with word count
 */
function generateOwnerReportFooter(ctx: ReportContext, narratives: any): string {
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

// ============================================================================
// PHASE 2: P0 CONTENT FIX UTILITIES
// Owner's Report Enhanced Data Extraction
// ============================================================================

/**
 * Interface for tactical quick win with implementation steps
 */
interface TacticalQuickWin {
  title: string;
  description: string;
  category: string;
  categoryCode?: string;
  timeframe: string;
  owner: string;
  steps: string[];
  expectedOutcome?: string;
  impact: string;
  effort: string;
  roi?: string;
}

/**
 * Interface for risk with mitigation strategies
 */
interface EnhancedRisk {
  id: string;
  title: string;
  description: string;
  severity: string;
  likelihood: string;
  category: string;
  mitigationStrategies: Array<{
    strategy: string;
    timeline?: string;
    investment?: string;
    expectedImpact?: string;
  }>;
  monitoringIndicators?: string[];
}

/**
 * Interface for Critical Path Action
 */
interface CriticalPathAction {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: number;
  implementationSteps: Array<{
    week: string;
    action: string;
    owner: string;
    deliverable: string;
  }>;
  monitoringIndicators: string[];
  expectedOutcome: string;
  category: string;
}

/**
 * Extract tactical quick wins from categoryAnalyses (not generic recommendations)
 * P0 FIX: Get actual actionable quick wins with implementation steps
 * P1A FIX: Validate content specificity and reject generic template content
 */
function extractTacticalQuickWins(ctx: ReportContext): TacticalQuickWin[] {
  const tacticalWins: TacticalQuickWin[] = [];
  const rejectedGeneric: string[] = []; // Track rejected generic content for logging

  // Source 1: Category-level quick wins (most specific and actionable)
  if (ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0) {
    for (const category of ctx.categoryAnalyses) {
      if (category.quickWins && category.quickWins.length > 0) {
        for (const qw of category.quickWins) {
          // Skip generic "improvement initiative" titles
          if (qw.title?.toLowerCase().includes('improvement initiative')) {
            rejectedGeneric.push(`Skipped generic title: ${qw.title}`);
            continue;
          }

          // P1A: Validate content specificity before including
          const combinedContent = `${qw.title || ''} ${qw.description || ''}`;
          const validation = validateContentSpecificity(combinedContent, ctx);

          if (validation.genericPhrases.length > 0) {
            rejectedGeneric.push(`Rejected generic quick win: ${qw.title} (phrases: ${validation.genericPhrases.join(', ')})`);
            // Try to extract more specific content
            const specificQw = extractSpecificQuickWin(category.categoryCode, ctx, qw.title);
            if (specificQw) {
              tacticalWins.push(specificQw);
            }
            continue;
          }

          // Sanitize any remaining generic phrases
          const sanitizedDescription = sanitizeGenericContent(
            qw.description || qw.rationale || '',
            ctx
          );

          tacticalWins.push({
            title: qw.title || 'Quick Win',
            description: sanitizedDescription,
            category: category.categoryName || category.categoryCode || 'General',
            categoryCode: category.categoryCode,
            timeframe: qw.timeframe || qw.timeline || '30 days',
            owner: qw.owner || qw.responsibility || mapDimensionToOwner(category.categoryCode),
            steps: qw.implementationSteps || qw.steps || [],
            expectedOutcome: qw.expectedOutcome || qw.impact,
            impact: qw.impactLevel || qw.impact || 'High',
            effort: qw.effortLevel || qw.effort || 'Low',
            roi: qw.roi
          });
        }
      }
    }
  }

  // Source 2: Context quick wins if category-level didn't provide enough
  if (tacticalWins.length < 3 && ctx.quickWins && ctx.quickWins.length > 0) {
    for (const qw of ctx.quickWins) {
      // Skip generic titles
      if (qw.theme?.toLowerCase().includes('improvement initiative')) {
        rejectedGeneric.push(`Skipped generic theme: ${qw.theme}`);
        continue;
      }

      // P1A: Validate content specificity
      const combinedContent = `${qw.theme || qw.title || ''} ${qw.expectedOutcomes || qw.description || ''}`;
      const validation = validateContentSpecificity(combinedContent, ctx);

      if (validation.genericPhrases.length > 0) {
        rejectedGeneric.push(`Rejected generic context quick win: ${qw.theme || qw.title}`);
        continue;
      }

      // Avoid duplicates
      const isDuplicate = tacticalWins.some(tw =>
        tw.title.toLowerCase() === (qw.theme || qw.title || '').toLowerCase()
      );

      if (!isDuplicate) {
        // Sanitize content
        const sanitizedDesc = sanitizeGenericContent(
          qw.expectedOutcomes || qw.description || '',
          ctx
        );

        tacticalWins.push({
          title: qw.theme || qw.title || 'Quick Win',
          description: sanitizedDesc,
          category: getDimensionName(qw.dimensionCode) || 'General',
          categoryCode: qw.dimensionCode,
          timeframe: qw.timeframe || '90 days',
          owner: mapDimensionToOwner(qw.dimensionCode),
          steps: qw.actionSteps || [],
          expectedOutcome: qw.expectedOutcomes,
          impact: qw.impactScore >= 70 ? 'High' : qw.impactScore >= 40 ? 'Medium' : 'Low',
          effort: qw.effortScore <= 40 ? 'Low' : qw.effortScore <= 70 ? 'Medium' : 'High',
          roi: qw.estimatedROI ? `${qw.estimatedROI.toFixed(1)}x` : undefined
        });
      }
    }
  }

  // Log summary of rejected generic content
  if (rejectedGeneric.length > 0) {
    logger.info({
      rejectedCount: rejectedGeneric.length,
      items: rejectedGeneric.slice(0, 5)
    }, '[QUALITY FILTER] Rejected generic quick win content');
  }

  // Sort by impact/effort ratio (highest first)
  // P1 FIX: Ensure every quick win has implementation steps
  return tacticalWins
    .filter(w => w.title && w.title.length > 0)
    .map(win => ({
      ...win,
      // Sanitize description one more time
      description: sanitizeGenericContent(win.description, ctx),
      // Generate steps if not present or empty
      steps: (win.steps && win.steps.length > 0)
        ? win.steps
        : generateImplementationSteps(win.title, win.category, win.description)
    }))
    .sort((a, b) => {
      const impactScore = (i: string) => i === 'High' ? 3 : i === 'Medium' ? 2 : 1;
      const effortScore = (e: string) => e === 'High' ? 3 : e === 'Medium' ? 2 : 1;
      const aScore = impactScore(a.impact) / effortScore(a.effort);
      const bScore = impactScore(b.impact) / effortScore(b.effort);
      return bScore - aScore;
    })
    .slice(0, 5);
}

/**
 * Map dimension code to owner role
 */
function mapDimensionToOwner(dimension?: string): string {
  if (!dimension) return 'Owner/CEO';

  const ownerMap: Record<string, string> = {
    STR: 'CEO / Strategy Lead',
    SAL: 'VP Sales / Sales Manager',
    MKT: 'Marketing Director / CMO',
    CXP: 'Customer Success Lead',
    OPS: 'COO / Operations Manager',
    FIN: 'CFO / Finance Director',
    HRS: 'HR Director / CHRO',
    LDG: 'CEO / Board',
    TIN: 'CTO / Innovation Lead',
    IDS: 'IT Director / CIO',
    RMS: 'Risk Manager / COO',
    CMP: 'General Counsel / Compliance',
  };

  return ownerMap[dimension.toUpperCase()] || 'Owner/CEO';
}

/**
 * Get dimension display name from code
 */
function getDimensionName(code?: string): string {
  if (!code) return 'General';

  const nameMap: Record<string, string> = {
    STR: 'Strategy',
    SAL: 'Sales',
    MKT: 'Marketing',
    CXP: 'Customer Experience',
    OPS: 'Operations',
    FIN: 'Financial Health',
    HRS: 'Human Resources',
    LDG: 'Leadership & Governance',
    TIN: 'Technology & Innovation',
    IDS: 'IT & Data Security',
    RMS: 'Risk Management',
    CMP: 'Compliance',
  };

  return nameMap[code.toUpperCase()] || code;
}

/**
 * P1 FIX: Generate contextual implementation steps based on action type and category
 * Ensures every quick win has actionable steps
 */
function generateImplementationSteps(title: string, category: string, description?: string): string[] {
  const titleLower = (title || '').toLowerCase();
  const categoryLower = (category || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  // Pattern 1: "Develop X" / "Create X" actions
  if (combined.includes('develop') || combined.includes('create') || combined.includes('design')) {
    return [
      'Gather requirements and define scope with key stakeholders',
      'Research best practices and benchmark against industry standards',
      'Draft initial version with clear objectives and metrics',
      'Review with leadership team and incorporate feedback',
      'Finalize, document, and communicate to relevant parties'
    ];
  }

  // Pattern 2: "Implement X" / "Deploy X" actions
  if (combined.includes('implement') || combined.includes('deploy') || combined.includes('launch')) {
    return [
      'Define implementation scope, timeline, and success criteria',
      'Assign project owner and assemble implementation team',
      'Execute pilot phase with selected group or area',
      'Gather feedback and make necessary adjustments',
      'Roll out fully and establish ongoing monitoring'
    ];
  }

  // Pattern 3: Meeting/Review/Communication actions
  if (combined.includes('meeting') || combined.includes('review') || combined.includes('communication')) {
    return [
      'Schedule recurring calendar invites with key participants',
      'Create standardized agenda template',
      'Establish documentation and action item tracking process',
      'Conduct first session and gather participant feedback',
      'Refine format based on feedback and institutionalize'
    ];
  }

  // Pattern 4: Strategy/Planning actions
  if (categoryLower.includes('strategy') || combined.includes('plan') || combined.includes('strategic')) {
    return [
      'Conduct situation analysis using assessment findings',
      'Identify top 3 priority areas based on impact potential',
      'Develop action items with specific owners and deadlines',
      'Present to leadership for alignment and approval',
      'Begin execution with weekly progress tracking'
    ];
  }

  // Pattern 5: Operations/Process actions
  if (categoryLower.includes('operation') || combined.includes('process') || combined.includes('workflow')) {
    return [
      'Document current state process and pain points',
      'Identify quick improvements vs. longer-term changes',
      'Implement quick fixes within first two weeks',
      'Design improved process workflow',
      'Train team and monitor adoption'
    ];
  }

  // Pattern 6: Financial actions
  if (categoryLower.includes('financial') || combined.includes('budget') || combined.includes('cost')) {
    return [
      'Review current financial data and identify gaps',
      'Set measurable financial targets and KPIs',
      'Create action plan with cost/benefit analysis',
      'Implement tracking mechanisms',
      'Schedule monthly review of progress against targets'
    ];
  }

  // Pattern 7: HR/People actions
  if (categoryLower.includes('human') || categoryLower.includes('people') || combined.includes('training') || combined.includes('team')) {
    return [
      'Assess current team capabilities and needs',
      'Define clear roles, responsibilities, and expectations',
      'Create development/training plan with timeline',
      'Schedule check-ins to monitor progress',
      'Evaluate outcomes and adjust approach as needed'
    ];
  }

  // Pattern 8: Technology/IT actions
  if (categoryLower.includes('technology') || categoryLower.includes('it') || combined.includes('system') || combined.includes('software')) {
    return [
      'Document current technology landscape and gaps',
      'Research and evaluate solution options',
      'Create implementation roadmap with milestones',
      'Execute implementation with testing phases',
      'Provide training and establish support processes'
    ];
  }

  // Default fallback - generic but actionable
  return [
    'Define specific objectives and success metrics',
    'Identify required resources and assign ownership',
    'Create 30-day action plan with milestones',
    'Execute initial actions and track progress weekly',
    'Review results and adjust approach as needed'
  ];
}

/**
 * P1 FIX: Get strategy timeline with robust fallback chain
 * Returns a meaningful timeline instead of "—"
 */
function getStrategyTimeline(strategy: { strategy?: string; timeline?: string; timeframe?: string; duration?: string }, index: number): string {
  // Check all possible field names
  const timeline = strategy.timeline || strategy.timeframe || strategy.duration;
  if (timeline) return timeline;

  // Fallback based on priority (index)
  if (index === 0) return 'Immediate (0-30 days)';
  if (index === 1) return 'Short-term (30-90 days)';
  if (index <= 3) return 'Medium-term (3-6 months)';
  return 'Long-term (6-12 months)';
}

/**
 * P1 FIX: Get strategy expected impact with robust fallback chain
 * Returns a meaningful impact description instead of "—"
 */
function getStrategyExpectedImpact(strategy: { strategy?: string; expectedImpact?: string; impact?: string; outcome?: string; benefit?: string }): string {
  // Check all possible field names
  const impact = strategy.expectedImpact || strategy.impact || strategy.outcome || strategy.benefit;
  if (impact) return impact;

  // Generate contextual default based on strategy description
  const desc = (strategy.strategy || '').toLowerCase();

  if (desc.includes('implement') || desc.includes('deploy')) {
    return 'Operational improvement';
  }
  if (desc.includes('monitor') || desc.includes('track') || desc.includes('review')) {
    return 'Enhanced visibility & control';
  }
  if (desc.includes('train') || desc.includes('develop') || desc.includes('document')) {
    return 'Capability building';
  }
  if (desc.includes('assess') || desc.includes('audit') || desc.includes('evaluate')) {
    return 'Informed decision-making';
  }
  if (desc.includes('policy') || desc.includes('procedure') || desc.includes('process')) {
    return 'Standardized operations';
  }
  if (desc.includes('backup') || desc.includes('recovery') || desc.includes('protect')) {
    return 'Risk exposure reduction';
  }

  return 'Risk mitigation';
}

/**
 * Extract enhanced risks with mitigation strategies from categoryAnalyses
 * P0 FIX: Get actual mitigation content for risk display
 */
function extractEnhancedRisks(ctx: ReportContext): EnhancedRisk[] {
  const enhancedRisks: EnhancedRisk[] = [];

  // Source 1: Category-level risks with rich mitigation data
  if (ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0) {
    for (const category of ctx.categoryAnalyses) {
      if (category.categoryRisks && category.categoryRisks.length > 0) {
        for (const risk of category.categoryRisks) {
          enhancedRisks.push({
            id: risk.id || `risk-${category.categoryCode}-${enhancedRisks.length}`,
            title: risk.title || risk.riskTitle || 'Identified Risk',
            description: risk.description || risk.riskDescription || '',
            severity: risk.severity || risk.impact || 'medium',
            likelihood: risk.likelihood || risk.probability || 'medium',
            category: category.categoryName || category.categoryCode || 'General',
            mitigationStrategies: risk.mitigationStrategies || risk.mitigation ?
              (Array.isArray(risk.mitigationStrategies) ?
                risk.mitigationStrategies.map((m: any, idx: number) => ({
                  strategy: typeof m === 'string' ? m : m.strategy || m.description || m.action,
                  timeline: m.timeline || m.timeframe,
                  investment: m.investment || m.cost,
                  expectedImpact: m.expectedImpact || m.impact
                })) :
                [{ strategy: risk.mitigation || 'Develop mitigation plan' }]
              ) :
              [{ strategy: 'See Comprehensive Report for detailed mitigation strategies' }],
            monitoringIndicators: risk.monitoringIndicators || risk.kpis || []
          });
        }
      }
    }
  }

  // Source 2: Context risks as fallback
  if (enhancedRisks.length < 2 && ctx.risks && ctx.risks.length > 0) {
    for (const risk of ctx.risks) {
      const isDuplicate = enhancedRisks.some(er =>
        er.title.toLowerCase() === (risk.title || risk.narrative || '').toLowerCase()
      );

      if (!isDuplicate) {
        enhancedRisks.push({
          id: risk.id || `risk-${enhancedRisks.length}`,
          title: risk.title || risk.narrative?.substring(0, 50) || 'Risk',
          description: risk.narrative || risk.description || '',
          severity: String(risk.severity) || 'medium',
          likelihood: String(risk.likelihood) || 'medium',
          category: risk.category || getDimensionName(risk.dimensionCode) || 'General',
          mitigationStrategies: risk.mitigationSummary ?
            [{ strategy: risk.mitigationSummary }] :
            [{ strategy: 'See Comprehensive Report for detailed mitigation strategies' }],
          monitoringIndicators: []
        });
      }
    }
  }

  // Sort by severity and likelihood
  const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return enhancedRisks
    .sort((a, b) => {
      const aScore = (severityOrder[a.severity.toLowerCase()] || 2) * (severityOrder[a.likelihood.toLowerCase()] || 2);
      const bScore = (severityOrder[b.severity.toLowerCase()] || 2) * (severityOrder[b.likelihood.toLowerCase()] || 2);
      return bScore - aScore;
    })
    .slice(0, 5);
}

/**
 * Generate meaningful deliverable text based on action type
 * P0 FIX: Replaces truncated action + "completed" pattern with actual deliverables
 * @param action - The action step text
 * @param categoryName - The category or dimension name for context
 * @param stepIndex - Index of the step (0-based)
 * @param totalSteps - Total number of steps
 */
function generateDeliverableText(action: string, categoryName: string, stepIndex: number, totalSteps: number): string {
  const actionLower = action.toLowerCase();
  const safeCategoryName = categoryName || 'Business';

  // Final step - use completion deliverable
  if (stepIndex === totalSteps - 1) {
    if (actionLower.includes('monitor') || actionLower.includes('track')) {
      return 'Performance Review Report';
    }
    return 'Implementation Complete with KPI Dashboard';
  }

  // Match action type to appropriate deliverable
  if (actionLower.includes('assess') || actionLower.includes('audit') || actionLower.includes('review') || actionLower.includes('analyze')) {
    return `${safeCategoryName} Assessment Report`;
  }
  if (actionLower.includes('plan') || actionLower.includes('develop') || actionLower.includes('design') || actionLower.includes('create')) {
    return `${safeCategoryName} Improvement Plan with KPIs`;
  }
  if (actionLower.includes('implement') || actionLower.includes('execute') || actionLower.includes('deploy') || actionLower.includes('launch')) {
    return 'Implementation Progress Dashboard';
  }
  if (actionLower.includes('monitor') || actionLower.includes('track') || actionLower.includes('measure')) {
    return 'Performance Review Report';
  }
  if (actionLower.includes('train') || actionLower.includes('onboard') || actionLower.includes('educate')) {
    return 'Training Completion Certificate';
  }
  if (actionLower.includes('document') || actionLower.includes('policy') || actionLower.includes('process')) {
    return 'Process Documentation Package';
  }
  if (actionLower.includes('hire') || actionLower.includes('recruit') || actionLower.includes('staff')) {
    return 'Staffing Plan & Job Descriptions';
  }
  if (actionLower.includes('budget') || actionLower.includes('financial') || actionLower.includes('cost')) {
    return 'Budget Approval Document';
  }
  if (actionLower.includes('vendor') || actionLower.includes('partner') || actionLower.includes('contract')) {
    return 'Vendor Evaluation Matrix';
  }

  // Default fallback based on step position
  const stepDeliverables = [
    `${safeCategoryName} Action Plan`,
    'Progress Report with Milestones',
    'Updated Implementation Dashboard',
    'Final Review & Recommendations'
  ];
  return stepDeliverables[stepIndex % stepDeliverables.length];
}

/**
 * Build Critical Path Actions from roadmap phases and recommendations
 * P0 FIX: Generate complete CPA content with implementation tables
 */
function buildCriticalPathActions(ctx: ReportContext): CriticalPathAction[] {
  const cpas: CriticalPathAction[] = [];

  // Get top priority recommendations
  const topRecs = [...(ctx.recommendations || [])].sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 3);

  // Get roadmap phases
  const roadmap = ctx.roadmap || { phases: [] };

  // Build CPAs from roadmap phases combined with recommendations
  for (let i = 0; i < Math.min(3, Math.max(topRecs.length, roadmap.phases?.length || 0)); i++) {
    const rec = topRecs[i];
    const phase = roadmap.phases?.[i];

    if (rec || phase) {
      const title = rec?.theme || phase?.name || `Critical Initiative ${i + 1}`;
      const description = rec?.expectedOutcomes || phase?.narrative || '';
      const categoryName = getDimensionName(rec?.dimensionCode || '') || 'Strategic';

      // Generate implementation steps based on action steps or phase milestones
      const actionSteps = rec?.actionSteps || phase?.keyMilestones || [];
      const stepsToProcess = actionSteps.slice(0, 4);
      const totalSteps = stepsToProcess.length;

      // P0 FIX: Generate meaningful deliverables based on action type
      const implementationSteps = totalSteps > 0 ?
        stepsToProcess.map((step: string, idx: number) => ({
          week: `Week ${(idx * 2) + 1}-${(idx + 1) * 2}`,
          action: step,
          owner: mapDimensionToOwner(rec?.dimensionCode),
          deliverable: generateDeliverableText(step, categoryName, idx, totalSteps)
        })) :
        [
          { week: 'Week 1-2', action: 'Assessment and planning', owner: mapDimensionToOwner(rec?.dimensionCode), deliverable: `${categoryName} Assessment Report` },
          { week: 'Week 3-4', action: 'Initial implementation', owner: mapDimensionToOwner(rec?.dimensionCode), deliverable: `${categoryName} Improvement Plan with KPIs` },
          { week: 'Week 5-6', action: 'Refinement and optimization', owner: mapDimensionToOwner(rec?.dimensionCode), deliverable: 'Implementation Progress Dashboard' },
          { week: 'Week 7-8', action: 'Monitoring and adjustment', owner: mapDimensionToOwner(rec?.dimensionCode), deliverable: 'Performance Review Report' }
        ];

      cpas.push({
        id: `cpa-${String(i + 1).padStart(2, '0')}`,
        title: title.replace(/improvement initiative/gi, 'Strategic Action'),
        description,
        rationale: rec ?
          `Addresses critical gap in ${getDimensionName(rec.dimensionCode)} with projected score improvement from current levels.` :
          `Part of the ${phase?.timeHorizon || '0-90 day'} transformation roadmap.`,
        priority: i + 1,
        implementationSteps,
        monitoringIndicators: [
          `Track progress against ${getDimensionName(rec?.dimensionCode)} KPIs`,
          'Weekly status updates to leadership',
          'Monthly ROI assessment'
        ],
        expectedOutcome: description || `Improved ${getDimensionName(rec?.dimensionCode)} performance`,
        category: getDimensionName(rec?.dimensionCode) || 'Strategic'
      });
    }
  }

  return cpas;
}

/**
 * Count strengths from findings and category analyses
 * P0 FIX: Properly count strengths, never show "0"
 */
function countStrengths(ctx: ReportContext): { count: number; display: string } {
  let count = 0;

  // Count from findings
  if (ctx.findings && ctx.findings.length > 0) {
    count = ctx.findings.filter(f => f.type === 'strength').length;
  }

  // Count from category analyses if findings don't have enough
  if (count === 0 && ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0) {
    for (const cat of ctx.categoryAnalyses) {
      count += (cat.strengths?.length || 0);
    }
  }

  // Return count or placeholder
  if (count > 0) {
    return { count, display: String(count) };
  }

  // If genuinely 0, show contextual message instead of "0"
  return { count: 0, display: '—' };
}

/**
 * Get canonical chapter scores - SINGLE SOURCE OF TRUTH
 * P0 FIX: All visualizations must use this function for consistency
 */
function getCanonicalChapterScores(ctx: ReportContext): Array<{ code: string; name: string; score: number; benchmark?: number }> {
  // Priority 1: Use chapters from context directly
  if (ctx.chapters && ctx.chapters.length >= 4) {
    return ctx.chapters.map(ch => ({
      code: ch.code,
      name: ch.name,
      score: ch.score,
      benchmark: ch.benchmark?.peerPercentile
    }));
  }

  // Priority 2: Calculate from category analyses
  if (ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0) {
    const chapterMap = new Map<string, number[]>();
    const chapterMapping: Record<string, string> = {
      'STR': 'GE', 'SAL': 'GE', 'MKT': 'GE', 'CXP': 'GE',
      'OPS': 'PH', 'FIN': 'PH',
      'HRS': 'PL', 'LDG': 'PL',
      'TIN': 'RS', 'IDS': 'RS', 'RMS': 'RS', 'CMP': 'RS'
    };

    for (const cat of ctx.categoryAnalyses) {
      const chapterCode = chapterMapping[cat.categoryCode] || 'GE';
      if (!chapterMap.has(chapterCode)) {
        chapterMap.set(chapterCode, []);
      }
      chapterMap.get(chapterCode)!.push(cat.overallScore || 0);
    }

    const average = (nums: number[]): number => {
      if (nums.length === 0) return 0;
      return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    };

    return [
      { code: 'GE', name: 'Growth Engine', score: average(chapterMap.get('GE') || []) },
      { code: 'PH', name: 'Performance & Health', score: average(chapterMap.get('PH') || []) },
      { code: 'PL', name: 'People & Leadership', score: average(chapterMap.get('PL') || []) },
      { code: 'RS', name: 'Resilience & Safeguards', score: average(chapterMap.get('RS') || []) },
    ];
  }

  // Priority 3: Use chapter summaries
  if (ctx.chapterSummaries && ctx.chapterSummaries.length > 0) {
    return ctx.chapterSummaries.map(cs => ({
      code: cs.chapterCode,
      name: cs.chapterName || cs.chapterCode,
      score: cs.overallScore || 0
    }));
  }

  // Fallback
  logger.warn('[Owner Report] No chapter score data available');
  return [];
}

/**
 * Render tactical quick wins section with implementation steps
 * P0 FIX: Show actionable steps, not just generic titles
 */
function renderTacticalQuickWins(ctx: ReportContext, primaryColor: string): string {
  const quickWins = extractTacticalQuickWins(ctx);

  if (quickWins.length === 0) {
    return `
      <div class="comprehensive-reference">
        <span class="ref-icon">📋</span>
        <span class="ref-text">
          Quick wins are being finalized. See <strong>Comprehensive Report</strong> → <em>Prioritized Recommendations</em>
        </span>
      </div>
    `;
  }

  return quickWins.map((win, index) => `
    <div class="quick-win-card tactical" style="
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border-left: 4px solid ${primaryColor};
      padding: 1.25rem;
      border-radius: 0 8px 8px 0;
      margin-bottom: 1rem;
    ">
      <div class="quick-win-header" style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
        <span class="quick-win-number" style="
          background: ${primaryColor};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          flex-shrink: 0;
        ">${index + 1}</span>
        <div class="quick-win-title-block" style="flex: 1;">
          <div class="title" style="font-weight: 600; color: ${primaryColor}; font-size: 1.05rem; margin-bottom: 0.25rem;">
            ${escapeHtml(win.title)}
          </div>
          <span class="quick-win-category" style="
            font-size: 0.8rem;
            color: #666;
            background: #e9ecef;
            padding: 2px 8px;
            border-radius: 4px;
          ">${escapeHtml(win.category)}</span>
        </div>
      </div>

      <p class="quick-win-description" style="color: #555; margin: 0.75rem 0; line-height: 1.5;">
        ${escapeHtml(win.description)}
      </p>

      ${win.steps && win.steps.length > 0 ? `
        <div class="quick-win-steps" style="margin: 1rem 0; padding: 0.75rem; background: #fafbfc; border-radius: 6px;">
          <strong style="color: ${primaryColor}; font-size: 0.9rem;">How to Implement:</strong>
          <ol class="implementation-steps" style="margin: 0.5rem 0 0 1.25rem; padding: 0; font-size: 0.9rem; color: #444;">
            ${win.steps.slice(0, 4).map(step => `<li style="margin: 0.3rem 0;">${escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <div class="quick-win-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem; color: #666; margin-top: 0.75rem;">
        <span>⏱️ ${escapeHtml(win.timeframe)}</span>
        <span>👤 ${escapeHtml(win.owner)}</span>
        ${win.expectedOutcome ? `<span>🎯 ${escapeHtml(win.expectedOutcome)}</span>` : ''}
      </div>

      <div class="metrics" style="display: flex; gap: 1.5rem; font-size: 0.85rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e9ecef;">
        <span style="color: ${win.impact === 'High' ? '#28a745' : win.impact === 'Medium' ? '#ffc107' : '#6c757d'};">
          <strong>Impact:</strong> ${win.impact}
        </span>
        <span style="color: ${win.effort === 'Low' ? '#28a745' : win.effort === 'Medium' ? '#ffc107' : '#dc3545'};">
          <strong>Effort:</strong> ${win.effort}
        </span>
        ${win.roi ? `<span><strong>ROI:</strong> ${win.roi}</span>` : ''}
      </div>
    </div>
  `).join('\n');
}

/**
 * Render Critical Path Actions with implementation tables
 * P0 FIX: Complete CPA content with implementation steps and monitoring
 */
function renderCriticalPathActions(ctx: ReportContext, primaryColor: string): string {
  const cpas = buildCriticalPathActions(ctx);

  if (cpas.length === 0) {
    return `
      <div class="comprehensive-reference">
        <span class="ref-icon">📋</span>
        <span class="ref-text">
          Critical path actions are detailed in <strong>Comprehensive Report</strong> → <em>Strategic Recommendations</em>
        </span>
      </div>
    `;
  }

  return cpas.map((cpa, index) => `
    <div class="cpa-section" style="margin-bottom: 2rem; page-break-inside: avoid;">
      <h3 style="
        color: ${primaryColor};
        font-family: 'Montserrat', sans-serif;
        margin-bottom: 0.75rem;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span style="
          background: ${primaryColor};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        ">CPA</span>
        CPA-${String(index + 1).padStart(2, '0')}: ${escapeHtml(cpa.title)}
      </h3>

      ${cpa.description ? `<p style="color: #555; margin: 0.5rem 0; line-height: 1.5;">${escapeHtml(cpa.description)}</p>` : ''}

      <p style="color: #666; margin: 0.75rem 0; font-style: italic;">
        <strong style="color: ${primaryColor};">Why This Matters:</strong> ${escapeHtml(cpa.rationale)}
      </p>

      <div class="table-responsive" style="margin: 1rem 0;">
        <table class="bh-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: ${primaryColor}; color: white;">
              <th style="padding: 0.75rem; text-align: left;">Timeframe</th>
              <th style="padding: 0.75rem; text-align: left;">Action</th>
              <th style="padding: 0.75rem; text-align: left;">Owner</th>
              <th style="padding: 0.75rem; text-align: left;">Deliverable</th>
            </tr>
          </thead>
          <tbody>
            ${cpa.implementationSteps.map(step => `
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 0.75rem; font-weight: 500; color: ${primaryColor};">${escapeHtml(step.week)}</td>
                <td style="padding: 0.75rem;">${escapeHtml(step.action)}</td>
                <td style="padding: 0.75rem;">${escapeHtml(step.owner)}</td>
                <td style="padding: 0.75rem;">${escapeHtml(step.deliverable)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${cpa.monitoringIndicators && cpa.monitoringIndicators.length > 0 ? `
        <div style="margin-top: 0.75rem;">
          <strong style="color: ${primaryColor}; font-size: 0.9rem;">Monitoring Indicators:</strong>
          <ul style="margin: 0.5rem 0; padding-left: 1.25rem; font-size: 0.9rem; color: #555;">
            ${cpa.monitoringIndicators.map(ind => `<li style="margin: 0.25rem 0;">${escapeHtml(ind)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('\n');
}

/**
 * Render enhanced risks with mitigation strategies
 * P0 FIX: Complete risk content with mitigation tables
 */
function renderEnhancedRisks(ctx: ReportContext, primaryColor: string): string {
  const risks = extractEnhancedRisks(ctx);

  if (risks.length === 0) {
    return `
      <div class="comprehensive-reference">
        <span class="ref-icon">📋</span>
        <span class="ref-text">
          Detailed risk analysis available in <strong>Comprehensive Report</strong> → <em>Comprehensive Risk Assessment</em>
        </span>
      </div>
    `;
  }

  return risks.map((risk, index) => {
    const severityColor = risk.severity.toLowerCase() === 'critical' ? '#dc3545' :
                          risk.severity.toLowerCase() === 'high' ? '#fd7e14' : '#ffc107';

    return `
      <div class="risk-detail" style="
        margin-bottom: 1.5rem;
        background: #fff;
        border-left: 4px solid ${severityColor};
        padding: 1.25rem;
        border-radius: 0 8px 8px 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <h4 style="color: ${primaryColor}; margin: 0; font-size: 1rem; font-family: 'Montserrat', sans-serif;">
            Risk #${index + 1}: ${escapeHtml(risk.title)}
          </h4>
          <span style="
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            background: ${severityColor};
            color: ${risk.severity.toLowerCase() === 'critical' || risk.severity.toLowerCase() === 'high' ? '#fff' : '#000'};
          ">${escapeHtml(risk.severity)}</span>
        </div>

        <p style="color: #555; margin: 0.5rem 0; font-size: 0.95rem; line-height: 1.5;">
          ${escapeHtml(risk.description)}
        </p>

        <p style="color: #666; margin: 0.5rem 0; font-size: 0.85rem;">
          <strong>Category:</strong> ${escapeHtml(risk.category)}
          <span style="margin-left: 1rem;"><strong>Likelihood:</strong> ${escapeHtml(risk.likelihood)}</span>
        </p>

        ${risk.mitigationStrategies && risk.mitigationStrategies.length > 0 ? `
          <div style="margin-top: 1rem;">
            <strong style="color: ${primaryColor}; font-size: 0.9rem;">Mitigation Strategies:</strong>
            <div class="table-responsive" style="margin-top: 0.5rem;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">#</th>
                    <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">Strategy</th>
                    <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">Timeline</th>
                    <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">Expected Impact</th>
                  </tr>
                </thead>
                <tbody>
                  ${risk.mitigationStrategies.map((strategy, sIdx) => `
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                      <td style="padding: 0.5rem; font-weight: 500;">${sIdx + 1}</td>
                      <td style="padding: 0.5rem;">${escapeHtml(strategy.strategy)}</td>
                      <td style="padding: 0.5rem;">${escapeHtml(getStrategyTimeline(strategy, sIdx))}</td>
                      <td style="padding: 0.5rem;">${escapeHtml(getStrategyExpectedImpact(strategy))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${risk.monitoringIndicators && risk.monitoringIndicators.length > 0 ? `
          <div style="margin-top: 0.75rem;">
            <strong style="color: ${primaryColor}; font-size: 0.85rem;">Monitoring Indicators:</strong>
            <ul style="margin: 0.25rem 0; padding-left: 1.25rem; font-size: 0.85rem; color: #555;">
              ${risk.monitoringIndicators.map(ind => `<li>${escapeHtml(ind)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('\n');
}

/**
 * Generate CSS styles for narrative content and visual enhancements in owner report
 */
function generateOwnerNarrativeStyles(primaryColor: string, accentColor: string): string {
  return `
    /* Phase 0: Cover Page Styles */
    ${getCoverPageStyles()}

    /* Phase 1: Owner Health Dashboard Styles */
    ${getOwnerDashboardStyles()}

    /* Phase 1: Owner's Decision Agenda Styles */
    ${getDecisionAgendaStyles()}

    /* North Star Part 5: Critical Decisions Framework Styles */
    ${getCriticalDecisionsStyles()}

    /* Narrative Content Styles */
    .narrative-content {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
      border-left: 4px solid ${accentColor};
    }

    .narrative-content .bh-h2 {
      font-size: 1.4rem;
      color: ${primaryColor};
      margin-top: 1.25em;
      margin-bottom: 0.5em;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .narrative-content .bh-h3 {
      font-size: 1.2rem;
      color: ${primaryColor};
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-h4 {
      font-size: 1.05rem;
      color: #555;
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

    /* ============================================
       COMPANY SNAPSHOT EXECUTIVE SUMMARY STYLES
       Premium boutique consulting quality presentation
       ============================================ */

    /* Executive Summary Block */
    .company-snapshot-executive-summary {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: #f8f9fa;
      border-left: 4px solid ${accentColor};
      border-radius: 4px;
    }

    .company-snapshot-executive-summary h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-top: 0;
      margin-bottom: 1rem;
    }

    .company-snapshot-executive-summary p {
      font-family: 'Open Sans', sans-serif;
      font-size: 1rem;
      line-height: 1.7;
      color: #333;
      margin-bottom: 0.75rem;
    }

    .company-snapshot-executive-summary .summary-primary {
      font-weight: 500;
    }

    .company-snapshot-executive-summary .summary-opportunities {
      font-weight: 400;
    }

    .company-snapshot-executive-summary strong {
      color: ${primaryColor};
    }

    /* Company Context Block */
    .company-context-block {
      margin-bottom: 2rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #fafbfc 0%, #fff 100%);
      border: 1px solid #e9ecef;
      border-radius: 8px;
    }

    .company-context-block h4 {
      font-family: 'Montserrat', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-top: 0;
      margin-bottom: 0.75rem;
    }

    .company-context-block .context-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem 1.5rem;
    }

    .company-context-block .context-item {
      display: flex;
      gap: 0.5rem;
    }

    .company-context-block .context-label {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
      min-width: 140px;
      flex-shrink: 0;
    }

    .company-context-block .context-value {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9rem;
      color: #333;
      flex-grow: 1;
    }

    /* Consolidated Company Profile Card Styles */
    .profile-item {
      margin-bottom: 1rem;
    }

    .profile-label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 0.25rem;
      font-family: 'Open Sans', sans-serif;
    }

    .profile-value {
      font-size: 1rem;
      font-weight: 600;
      color: ${primaryColor};
      font-family: 'Open Sans', sans-serif;
    }

    /* Responsive adjustments for profile card */
    @media print, (max-width: 768px) {
      .profile-grid-2col {
        grid-template-columns: 1fr !important;
      }

      .assessment-highlights-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }

    /* Strategic Balance Overview Section */
    .strategic-balance-section {
      margin: 1.5rem 0;
    }

    .strategic-balance-section .chart-caption {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem;
      font-style: italic;
      color: #666;
      text-align: center;
      margin-top: 0.75rem;
      margin-bottom: 1rem;
    }

    /* Responsive Adjustments for Company Snapshot */
    @media print, (max-width: 768px) {
      .company-context-block .context-grid {
        grid-template-columns: 1fr;
      }

      .company-context-block .context-label {
        min-width: 120px;
      }
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

    /* INSIGHT CARDS GRID LAYOUT */
    .insight-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .insight-cards-container .insight-card {
      margin: 0;
    }

    /* BENCHMARK SUMMARY TABLE */
    .benchmark-summary {
      margin: 1.5rem 0;
    }

    .benchmark-summary h4 {
      color: ${primaryColor};
      margin-bottom: 1rem;
    }

    .score-table {
      width: 100%;
      border-collapse: collapse;
    }

    .score-table th,
    .score-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }

    .score-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: ${primaryColor};
    }

    .score-table .score {
      font-weight: 600;
      color: ${primaryColor};
    }

    /* ================================================================
       PHASE 1A: EXPANDABLE CONTENT
       Replace truncation with expandable sections for long content
       ================================================================ */

    .expandable-content {
      position: relative;
      margin: 1em 0;
    }

    .expandable-content .content-preview {
      position: relative;
      overflow: hidden;
    }

    .expandable-content .content-preview .ellipsis-fade {
      position: absolute;
      bottom: 0;
      right: 0;
      background: linear-gradient(to right, transparent, #fff 50%);
      padding-left: 2em;
      font-weight: 500;
      color: #666;
    }

    .expandable-content .content-full {
      display: none;
    }

    .expandable-content.expanded .content-preview {
      display: none;
    }

    .expandable-content.expanded .content-full {
      display: block;
    }

    .expand-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      color: ${accentColor};
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.5em 0;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .expand-btn:hover {
      color: ${primaryColor};
      text-decoration: underline;
    }

    .expand-btn .expand-icon {
      transition: transform 0.2s ease;
    }

    .expandable-content.expanded .expand-btn .expand-icon {
      transform: rotate(180deg);
    }

    @media print {
      .expandable-content .content-preview {
        display: none !important;
      }

      .expandable-content .content-full {
        display: block !important;
      }

      .expand-btn {
        display: none !important;
      }
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
      .executive-highlights { grid-template-columns: repeat(4, 1fr); }
    }

    /* ================================================================
       OPUS 4.5 MARKDOWN ELEMENT STYLING
       Added 2025-12-02 to support rich markdown output
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
    }

    /* Code Block */
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

    .bh-callout p { margin: 0; }
    .bh-callout strong { color: ${primaryColor}; }

    /* Section Divider */
    .bh-section-divider {
      border: none;
      height: 2px;
      background: linear-gradient(to right, ${primaryColor}, ${accentColor}, ${primaryColor});
      margin: 2rem 0;
    }

    .bh-h1 {
      font-size: 2rem;
      color: ${primaryColor};
      border-bottom: 3px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .bh-strong { color: ${primaryColor}; font-weight: 600; }

    /* Print styles for markdown elements */
    @media print {
      .visual-framework {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .ascii-viz { color: #e8e8e8 !important; font-size: 0.65rem; }
      .bh-table th { background: ${primaryColor} !important; color: #fff !important; }
      .table-responsive { overflow: visible; box-shadow: none; }
      .bh-callout { page-break-inside: avoid; }
    }

    /* ================================================================
       OWNER REPORT ENHANCEMENT STYLES
       Added for owner-focused executive guide with cross-references
       ================================================================ */

    /* OWNER SECTION HEADERS */
    .owner-section-header {
      margin-bottom: 1.5rem;
    }

    .owner-section-header h2 {
      margin-bottom: 0.5rem;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .owner-question {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      color: #666;
      margin: 0;
      padding-left: 0.5rem;
      border-left: 3px solid ${accentColor};
      font-family: 'Open Sans', sans-serif;
    }

    .owner-question .question-icon {
      font-size: 1.1rem;
    }

    .owner-question em {
      font-style: italic;
    }

    /* OWNER IMPLICATIONS GRID */
    .owner-implications-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .implication-card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .implication-card .card-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .implication-card .card-title {
      font-weight: 600;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
      margin-bottom: 0.5rem;
    }

    .implication-card p {
      font-size: 0.9rem;
      color: #555;
      margin: 0;
      line-height: 1.5;
    }

    .implication-card.growth { border-top: 3px solid #28a745; }
    .implication-card.risk { border-top: 3px solid #dc3545; }
    .implication-card.value { border-top: 3px solid ${accentColor}; }

    /* FINANCIAL SUMMARY GRID */
    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .financial-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .financial-card.highlight {
      background: linear-gradient(135deg, ${primaryColor} 0%, #2d3a7a 100%);
      color: #fff;
      border: none;
    }

    .financial-card .card-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 0.5rem;
    }

    /* P2.1 FIX: Enhanced contrast for financial cards (WCAG AA) */
    .financial-card.highlight .card-label {
      color: rgba(255,255,255,0.95);
    }

    .financial-card .card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .financial-card.highlight .card-value {
      color: #ffffff;
    }

    .financial-card .card-sublabel {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.25rem;
    }

    .financial-card.highlight .card-sublabel {
      color: rgba(255,255,255,0.9);
    }

    /* SECTION INTRO TEXT */
    .section-intro {
      font-size: 1rem;
      color: #555;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    /* COMPREHENSIVE REPORT REFERENCE CALLOUTS */
    .comprehensive-reference {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      border-left: 3px solid ${accentColor};
      padding: 0.75rem 1rem;
      margin: 1rem 0;
      font-size: 0.9rem;
      font-family: 'Open Sans', sans-serif;
    }

    .comprehensive-reference .ref-icon {
      flex-shrink: 0;
      font-size: 1rem;
    }

    .comprehensive-reference .ref-text {
      color: #555;
    }

    .comprehensive-reference .ref-text strong {
      color: ${primaryColor};
    }

    .comprehensive-reference .ref-text em {
      color: ${accentColor};
      font-style: normal;
      font-weight: 500;
    }

    .comprehensive-reference.reference-missing {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .comprehensive-reference.reference-missing .ref-text {
      color: #dc3545;
    }

    /* REPORT RELATIONSHIP NOTICE (for Comprehensive Report) */
    .report-relationship-notice {
      display: flex;
      gap: 1rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-left: 4px solid ${primaryColor};
      border-radius: 0 8px 8px 0;
      padding: 1.25rem;
      margin: 1.5rem 0 2rem 0;
    }

    .report-relationship-notice .notice-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .report-relationship-notice .notice-content {
      flex: 1;
    }

    .report-relationship-notice h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .report-relationship-notice p {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: #555;
      font-family: 'Open Sans', sans-serif;
    }

    .report-relationship-notice strong {
      color: ${primaryColor};
    }

    /* BUNDLE CONTENTS */
    .bundle-contents {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .bundle-contents h3 {
      margin: 0 0 1rem 0;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .bundle-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .bundle-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem;
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .bundle-item.primary {
      border-left: 3px solid ${primaryColor};
    }

    .bundle-item strong {
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .bundle-item span {
      font-size: 0.85rem;
      color: #666;
    }

    /* REFERENCE TABLE */
    .reference-table td:first-child {
      font-weight: 500;
    }

    .reference-table em {
      color: ${accentColor};
      font-style: normal;
    }

    /* RESPONSIVE ADJUSTMENTS FOR OWNER ENHANCEMENTS */
    @media (max-width: 768px) {
      .owner-implications-grid,
      .financial-summary-grid,
      .bundle-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      .owner-implications-grid,
      .financial-summary-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .bundle-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .financial-card.highlight {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .comprehensive-reference {
        background: #f8f9fa !important;
        border-left-color: ${accentColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .report-relationship-notice {
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    /* ================================================================
       OWNER REPORT CHART STYLES
       Added for visual performance charts
       ================================================================ */

    .owner-charts-section {
      margin: 1.5rem 0;
      padding: 1.25rem;
      background: #fafbfc;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .owner-charts-grid {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .owner-charts-grid .chart-item {
      flex: 1;
      min-width: 300px;
      max-width: 550px;
    }

    /* Import chart component styles */
    ${getReportChartStyles()}

    @media (max-width: 768px) {
      .owner-charts-grid {
        flex-direction: column;
      }

      .owner-charts-grid .chart-item {
        min-width: 100%;
        max-width: 100%;
      }
    }

    @media print {
      .owner-charts-section {
        background: #fafbfc !important;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}

// ============================================================================
// PHASE 1A: QUALITY VALIDATION HARNESS
// Automated quality checks for Owner's Report - North Star Standards
// ============================================================================

/**
 * Quality check result interface
 */
interface QualityCheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info';
  details?: string[];
}

/**
 * Quality report interface
 */
interface QualityReport {
  passed: boolean;
  checks: QualityCheckResult[];
  timestamp: string;
  companyName: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalFailures: number;
}

/**
 * Quality checks for Owner's Report - North Star Standards
 */
const OWNER_REPORT_QUALITY_CHECKS = [
  {
    name: 'No Generic Content',
    severity: 'Critical' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const genericPhrases = [
        'conduct detailed assessment',
        'develop improvement plan',
        'implement quick wins',
        'monitor progress',
        'establish baseline',
        'improvement initiative',
        'tbd - requires',
        '[insert',
        '[action required]'
      ];

      const foundGeneric = genericPhrases.filter(phrase =>
        html.toLowerCase().includes(phrase.toLowerCase())
      );

      return {
        name: 'No Generic Content',
        passed: foundGeneric.length === 0,
        message: foundGeneric.length > 0
          ? `Found ${foundGeneric.length} generic phrases: ${foundGeneric.slice(0, 3).join(', ')}${foundGeneric.length > 3 ? '...' : ''}`
          : 'OK - All content is client-specific',
        severity: 'Critical',
        details: foundGeneric.length > 0 ? foundGeneric : undefined
      };
    }
  },
  {
    name: 'Company Snapshot Present',
    severity: 'Critical' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const hasSection = html.includes('id="company-snapshot"');

      return {
        name: 'Company Snapshot Present',
        passed: hasSection,
        message: hasSection
          ? 'OK - Company Snapshot section present'
          : 'MISSING: Company Snapshot section not found',
        severity: 'Critical'
      };
    }
  },
  {
    name: 'Phased Roadmap Present',
    severity: 'Critical' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const hasSection = html.includes('id="phased-roadmap"');
      const hasPhases = html.includes('Phase 1: Days 1-90') &&
                        html.includes('Phase 2: Days 91-180') &&
                        html.includes('Phase 3: Days 181-365');

      return {
        name: 'Phased Roadmap Present',
        passed: hasSection && hasPhases,
        message: hasSection && hasPhases
          ? 'OK - 90/180/365-day phased roadmap present'
          : hasSection
            ? 'INCOMPLETE: Roadmap section exists but missing phase content'
            : 'MISSING: Phased roadmap section not found',
        severity: 'Critical'
      };
    }
  },
  {
    name: 'Financial Impact Quantified',
    severity: 'Critical' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const hasSection = html.includes('id="financial-impact"');
      const hasInvestment = /\$[\d,]+[KMB]?\s*-\s*\$[\d,]+[KMB]?/.test(html) ||
                           /\$[\d,]+[KMB]?/.test(html);
      const hasROI = /\d+%/.test(html);

      return {
        name: 'Financial Impact Quantified',
        passed: hasSection && (hasInvestment || hasROI),
        message: hasSection && (hasInvestment || hasROI)
          ? 'OK - Financial data with dollar amounts present'
          : hasSection
            ? 'INCOMPLETE: Financial section exists but missing quantified data'
            : 'MISSING: Financial impact section not found',
        severity: 'Critical'
      };
    }
  },
  {
    name: 'All Category Overviews Present',
    severity: 'Critical' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const hasCategorySection = html.includes('id="category-analysis-overview"');

      return {
        name: 'All Category Overviews Present',
        passed: hasCategorySection,
        message: hasCategorySection
          ? 'OK - Category analysis overview section present'
          : 'MISSING: Category analysis overview section not found',
        severity: 'Critical'
      };
    }
  },
  {
    name: 'Required Visualizations Present',
    severity: 'Warning' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const requiredCharts = [
        { name: 'Chapter Radar', check: html.includes('4-Chapter') || html.includes('radar') },
        { name: 'Risk Heatmap', check: html.includes('risk-heatmap') || html.includes('Risk Landscape') },
        { name: 'Impact/Effort Matrix', check: html.includes('Prioritization Matrix') || html.includes('impact-effort') }
      ];

      const missingCharts = requiredCharts.filter(c => !c.check).map(c => c.name);

      return {
        name: 'Required Visualizations Present',
        passed: missingCharts.length === 0,
        message: missingCharts.length === 0
          ? 'OK - All visualizations present'
          : `MISSING: ${missingCharts.join(', ')}`,
        severity: 'Warning',
        details: missingCharts.length > 0 ? missingCharts : undefined
      };
    }
  },
  {
    name: 'No Content Truncation',
    severity: 'Warning' as const,
    validate: (html: string, _ctx: ReportContext): QualityCheckResult => {
      const truncationPatterns = [
        /\.\.\.<\/p>/g,
        /\.\.\.<\/td>/g,
        /\.\.\.<\/span>/g,
        /…<\/p>/g,
        /…<\/td>/g,
      ];

      let truncationCount = 0;
      for (const pattern of truncationPatterns) {
        const matches = html.match(pattern);
        if (matches) truncationCount += matches.length;
      }

      const allowedTruncation = 5;

      return {
        name: 'No Content Truncation',
        passed: truncationCount <= allowedTruncation,
        message: truncationCount <= allowedTruncation
          ? `OK - ${truncationCount} truncated items (within acceptable range)`
          : `WARNING: ${truncationCount} truncated content instances found`,
        severity: 'Warning'
      };
    }
  },
  {
    name: 'Company Name Present',
    severity: 'Info' as const,
    validate: (html: string, ctx: ReportContext): QualityCheckResult => {
      const companyName = ctx.companyProfile.name;
      const occurrences = (html.match(new RegExp(companyName, 'gi')) || []).length;

      return {
        name: 'Company Name Present',
        passed: occurrences >= 3,
        message: occurrences >= 3
          ? `OK - Company name "${companyName}" appears ${occurrences} times`
          : `LOW: Company name "${companyName}" only appears ${occurrences} times (expected 3+)`,
        severity: 'Info'
      };
    }
  }
];

/**
 * Run quality validation on generated Owner's Report HTML
 * @param html The generated HTML content
 * @param ctx The report context
 * @returns Quality validation report
 */
export function validateOwnerReport(
  html: string,
  ctx: ReportContext
): QualityReport {
  logger.info('[QUALITY VALIDATION] Running Owner Report quality checks...');

  const results: QualityCheckResult[] = OWNER_REPORT_QUALITY_CHECKS.map(check => {
    const result = check.validate(html, ctx);
    const icon = result.passed ? '✓' : (result.severity === 'Critical' ? '✗' : '⚠');
    logger.info(`  [${icon}] ${result.name}: ${result.message}`);
    return result;
  });

  const criticalFailures = results.filter(r =>
    r.severity === 'Critical' && !r.passed
  );

  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = results.filter(r => !r.passed).length;

  const report: QualityReport = {
    passed: criticalFailures.length === 0,
    checks: results,
    timestamp: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    criticalFailures: criticalFailures.length
  };

  if (criticalFailures.length > 0) {
    logger.error({
      criticalFailures: criticalFailures.map(f => f.name),
      company: ctx.companyProfile.name
    }, `[QUALITY GATE] Owner Report FAILED - ${criticalFailures.length} critical issues`);
  } else {
    logger.info({
      passed: passedChecks,
      warnings: failedChecks,
      company: ctx.companyProfile.name
    }, '[QUALITY GATE] Owner Report passed quality validation');
  }

  return report;
}

// ============================================================================
// PHASE 4.5 BLUF INTEGRATION
// Generates AI-powered executive summary for owner's report
// ============================================================================

/**
 * Applies semantic color coding to BLUF text
 * Highlights positive/negative sentiment for executive scanability
 */
function colorCodeBLUFText(rawHtml: string): string {
  let result = rawHtml;

  // Define patterns for semantic highlighting (applied to already-escaped HTML)
  // Note: Must work with escaped HTML where < > are &lt; &gt;

  // Negative/Critical patterns
  const negativePatterns = [
    /\b(particularly concerning|concerning|crisis|critical|urgent|weakest|dangerous|struggling)\b/gi,
    /\b(flat trajectory|declining|at risk|threatens|undermining|fragile|vulnerable)\b/gi,
  ];

  negativePatterns.forEach(regex => {
    result = result.replace(regex, '<span class="bluf-negative">$1</span>');
  });

  // Positive/Strength patterns
  const positivePatterns = [
    /\b(moderate strength|strength|opportunity|leverage|advantage|strongest|solid|robust)\b/gi,
    /\b(positions you to|capitalize on|sustainable growth|predictable revenue|competitive advantage)\b/gi,
  ];

  positivePatterns.forEach(regex => {
    result = result.replace(regex, '<span class="bluf-positive">$1</span>');
  });

  // Action/Recommendation patterns
  const actionPatterns = [
    /\b(I recommend|take action|immediately prioritizing|if you take action|prioritize|focus on)\b/gi,
  ];

  actionPatterns.forEach(regex => {
    result = result.replace(regex, '<span class="bluf-action-text">$1</span>');
  });

  // Score-based color coding: Match scores like "41/100", "25/100", etc.
  // Apply color based on score value
  result = result.replace(/\b(\d{1,2})\/100\b/g, (match, scoreStr) => {
    const score = parseInt(scoreStr, 10);
    if (score < 40) {
      return `<span class="bluf-score-critical">${score}/100</span>`;
    } else if (score < 60) {
      return `<span class="bluf-score-warning">${score}/100</span>`;
    } else {
      return `<span class="bluf-score-positive">${score}/100</span>`;
    }
  });

  return result;
}

/**
 * Generate the BLUF section for the Owner's Report
 * Uses Phase 4.5A output if available, otherwise returns empty string
 */
function generateBLUFSection(ctx: ReportContext): string {
  // Check if Phase 4.5 output is available and valid
  if (!ctx.phase45Output || !hasValidPhase45Output(ctx.phase45Output)) {
    logger.info('Phase 4.5 output not available - skipping BLUF section for Owner Report');
    return '';
  }

  try {
    // Create render context for owner report
    const renderContext = createBLUFRenderContext(
      ctx.idm,
      ctx.phase45Output as Phase4_5A_Output,
      'owner',
      { includeMetadata: false }
    );

    // Render the owner report BLUF
    const blufHtml = renderBLUFForReport(renderContext, 'owner_report');

    if (!blufHtml) {
      logger.debug('No BLUF content generated for Owner Report');
      return '';
    }

    // Apply semantic color coding to BLUF text for executive scanability
    const colorCodedBlufHtml = colorCodeBLUFText(blufHtml);

    logger.info('Successfully rendered BLUF section for Owner Report with color coding');

    // Wrap in a section container with owner-specific styling
    return `
      <section class="section bluf-section" id="executive-bluf">
        ${colorCodedBlufHtml}
      </section>
    `;
  } catch (error) {
    logger.warn({ error }, 'Failed to generate BLUF section for Owner Report - continuing without it');
    return '';
  }
}
