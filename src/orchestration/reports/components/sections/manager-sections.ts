/**
 * Manager Report Section Renderers
 *
 * Consolidated section rendering functions for Manager Reports.
 * Each function generates HTML for a specific section type.
 *
 * Enhanced with Phase 1.5 integration features:
 * - Enterprise risk summary panel
 * - Score derivation explanation
 * - Functional prioritization panel
 * - Precise cross-references
 *
 * @module manager-sections
 */

import type { ReportContext, ReportDimension, ReportRecommendation, ReportRisk } from '../../../../types/report.types.js';
import type { DimensionCode } from '../../../../types/idm.types.js';
import type { CategoryCode } from '../../../../data/question-category-mapping.js';
import type {
  CompanySnapshotSection,
  DimensionDeepDiveSection,
  DepartmentRoadmapSection,
  RiskOverviewSection,
  MetricsDashboardSection,
  ManagerClosingSection,
  QuickWinsHighlightSection,
  CategoryAnalysisSection,
  ManagerReportRecipe,
} from '../../config/section-types.js';

// Phase 1.5 Category Visualization Components
import {
  generateCategoryRadarChart,
  generateSWOTQuadrant,
  generateCategoryBenchmarkBars,
} from '../category-visualizations.js';
import {
  safeStringValue,
  safeScore,
  safeScoreBand,
  safeScoreBandColor,
  safeArray,
  safeHtml,
} from '../../utils/safe-extract.js';
import {
  getDimensionsForManager,
  calculateDepartmentScore,
  filterFindingsByDimensions,
  filterRecommendationsByDimensions,
  filterQuickWinsByDimensions,
  filterRisksByDimensions,
  MANAGER_TITLES,
  MANAGER_DIMENSIONS,
  type ManagerType,
} from '../../utils/dimension-filters.js';
import {
  renderFindingsGrouped,
} from '../cards/finding-card.component.js';
import {
  renderRecommendationRow,
} from '../cards/recommendation-card.component.js';
import {
  renderManagerQuickWinCards,
  renderManagerQuickWinChecklist,
  renderQuickWinsSummaryStats,
} from '../cards/manager-quick-win-card.component.js';

// Manager Report Enhancement Modules
import {
  buildEnterpriseRiskSummary,
  renderEnterpriseRiskPanel,
  getScoreBandColor,
} from '../../managers/manager-risk-summary.js';
import {
  getManagerPriorities,
  buildPrioritiesFromCategories,
  renderPrioritizationPanel,
  type ManagerType as PrioritizationManagerType,
} from '../../managers/manager-prioritization.js';
import {
  type ManagerType as InitiativesManagerType,
} from '../../managers/manager-initiatives.js';
import {
  renderCrossReference,
  renderCrossReferenceList,
  type CrossRefKey,
} from '../../shared/cross-reference-config.js';

// Phase 2: Narrative Generation Utilities
import {
  generateCategorySynthesis,
  generateKeyTakeaways,
  generateRoadmapPhases,
  generateEnhancedQuickWin,
  generateCrossReference as generateNarrativeCrossReference,
  renderKeyTakeawaysBlock,
  renderRoadmapPhaseBlock,
  renderEnhancedQuickWinCard,
  buildNarrativeContext,
  type KeyTakeaway,
  type EnhancedQuickWin,
  type RoadmapPhase,
} from '../../utils/narrative-generators.js';

// ============================================================================
// COMPANY SNAPSHOT SECTION
// ============================================================================

/**
 * Render Company Health Snapshot section
 */
export function renderCompanySnapshotSection(
  ctx: ReportContext,
  section: CompanySnapshotSection,
  recipe: ManagerReportRecipe
): string {
  const overallScore = safeScore(ctx.overallHealth?.score, 0);
  const overallBand = safeScoreBand(overallScore);
  const companyName = safeStringValue(ctx.companyProfile?.name, 'Your Company');
  // Default to 'Initial' for first assessments (no prior data)
  const trajectory = ctx.overallHealth?.trajectory || 'Initial';

  // Get department-specific data
  const managerType = recipe.managerType as ManagerType;
  const dimensions = getDimensionsForManager(ctx, managerType);
  const { score: deptScore, band: deptBand } = calculateDepartmentScore(dimensions);

  const managerTitle = MANAGER_TITLES[managerType] || 'Your Department';

  // Get key company highlights
  const strengths = safeArray(ctx.executiveSummary?.keyStrengths).slice(0, 3);
  const priorities = safeArray(ctx.executiveSummary?.keyPriorities).slice(0, 3);

  return `
    <section id="${section.id}" class="report-section company-snapshot-section" style="padding: 2rem; margin-bottom: 2rem; page-break-inside: avoid;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <!-- Score Comparison Grid -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      ">
        <!-- Overall Company Health -->
        <div style="
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            color: #6b7280;
            margin: 0 0 1rem 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Overall Company Health</h3>
          <div style="
            font-size: 3.5rem;
            font-weight: 700;
            color: ${safeScoreBandColor(overallScore)};
            margin-bottom: 0.5rem;
          ">${overallScore}</div>
          <div style="
            display: inline-block;
            padding: 0.375rem 1rem;
            background: ${safeScoreBandColor(overallScore)};
            color: white;
            border-radius: 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
          ">${overallBand}</div>
          ${section.showTrajectory ? renderTrajectoryDisplay(trajectory) : ''}
        </div>

        <!-- Department Health -->
        <div style="
          background: linear-gradient(135deg, ${deptBand === 'Excellence' ? '#f0fdf4' : deptBand === 'Proficiency' ? '#eff6ff' : deptBand === 'Attention' ? '#fffbeb' : '#fef2f2'} 0%, #ffffff 100%);
          border: 2px solid ${safeScoreBandColor(deptScore)};
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        ">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            color: #6b7280;
            margin: 0 0 1rem 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${safeHtml(managerTitle)} Health</h3>
          <div style="
            font-size: 3.5rem;
            font-weight: 700;
            color: ${safeScoreBandColor(deptScore)};
            margin-bottom: 0.5rem;
          ">${deptScore}</div>
          <div style="
            display: inline-block;
            padding: 0.375rem 1rem;
            background: ${safeScoreBandColor(deptScore)};
            color: white;
            border-radius: 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
          ">${deptBand}</div>
          <div style="margin-top: 0.75rem; font-size: 0.8125rem; color: #6b7280;">
            Based on ${dimensions.length} focus dimension${dimensions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <!-- BLUF Section: What This Means for [Department] -->
      ${renderExpandedBLUF(ctx, managerType, managerTitle, overallScore, deptScore, deptBand, companyName)}

      <!-- Company Context -->
      ${strengths.length > 0 || priorities.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
          ${strengths.length > 0 ? `
            <div style="
              background: #f0fdf4;
              border-left: 4px solid #059669;
              border-radius: 0 8px 8px 0;
              padding: 1rem;
            ">
              <h4 style="
                font-size: 0.875rem;
                font-weight: 600;
                color: #059669;
                margin: 0 0 0.75rem 0;
              ">✓ Company Strengths</h4>
              <ul style="margin: 0; padding-left: 1.25rem; color: #374151; font-size: 0.875rem; line-height: 1.6;">
                ${strengths.map(s => `<li>${safeHtml(s)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${priorities.length > 0 ? `
            <div style="
              background: #eff6ff;
              border-left: 4px solid #2563eb;
              border-radius: 0 8px 8px 0;
              padding: 1rem;
            ">
              <h4 style="
                font-size: 0.875rem;
                font-weight: 600;
                color: #2563eb;
                margin: 0 0 0.75rem 0;
              ">↗ Company Priorities</h4>
              <ul style="margin: 0; padding-left: 1.25rem; color: #374151; font-size: 0.875rem; line-height: 1.6;">
                ${priorities.map(p => `<li>${safeHtml(p)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${renderQuickWinsPreview(ctx, managerType)}

      ${renderEnterpriseRiskSection(ctx)}

      ${renderScoreDerivation(dimensions, deptScore, managerTitle)}

      ${renderManagerPrioritizationSection(ctx, managerType)}
    </section>
  `;
}

/**
 * Render expanded BLUF section with Company Snapshot + Department Focus structure
 */
function renderExpandedBLUF(
  ctx: ReportContext,
  managerType: ManagerType,
  managerTitle: string,
  overallScore: number,
  deptScore: number,
  deptBand: string,
  companyName: string
): string {
  // Map manager type to BLUF key
  const blufKeyMap: Record<ManagerType, string> = {
    operations: 'operations_manager',
    salesMarketing: 'sales_marketing_manager',
    financials: 'financials_manager',
    strategy: 'strategy_manager',
    itTechnology: 'it_technology_manager',
    employees: 'strategy_manager' // Fallback
  };

  const blufKey = blufKeyMap[managerType] || 'strategy_manager';

  // Try to get AI-generated BLUF from Phase 4.5A output
  const managerBlufs = ctx.phase45Output?.manager_report_blufs;
  const rawBluf = managerBlufs ? (managerBlufs as Record<string, any>)[blufKey] : null;
  const blufContent = rawBluf?.paragraphs?.[0]?.content || rawBluf?.content || null;

  // If we have AI-generated BLUF with section structure
  if (blufContent && typeof blufContent === 'string') {
    const { companySnapshot, departmentFocus } = parseBLUFSections(blufContent, managerTitle);

    if (companySnapshot || departmentFocus) {
      return `
        <div class="bluf-section" style="margin-bottom: 2rem;">
          <h4 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 1rem 0;
          ">What This Means for ${safeHtml(managerTitle)}</h4>

          <!-- Company Health Snapshot -->
          ${companySnapshot ? `
            <div style="
              background: #f9fafb;
              padding: 1rem 1.25rem;
              border-radius: 8px;
              margin-bottom: 1rem;
            ">
              <h5 style="
                font-size: 0.875rem;
                font-weight: 600;
                color: #6b7280;
                margin: 0 0 0.5rem 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Company Health Snapshot</h5>
              <div style="color: #374151; line-height: 1.6; font-size: 0.9375rem;">
                ${formatBLUFParagraphs(companySnapshot)}
              </div>
            </div>
          ` : ''}

          <!-- Department Strategic Focus -->
          ${departmentFocus ? `
            <div style="
              border-left: 4px solid #969423;
              padding-left: 1.25rem;
            ">
              <h5 style="
                font-size: 0.875rem;
                font-weight: 600;
                color: #969423;
                margin: 0 0 0.5rem 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">${safeHtml(managerTitle)} Strategic Focus</h5>
              <div style="color: #374151; line-height: 1.6; font-size: 0.9375rem;">
                ${formatBLUFParagraphs(departmentFocus)}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Fallback to generated interpretation if no AI BLUF available
  return `
    <div style="
      background: #f9fafb;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #212653;
        margin: 0 0 0.75rem 0;
      ">What This Means for ${safeHtml(managerTitle)}</h4>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        ${generateDepartmentInterpretation(overallScore, deptScore, deptBand, managerTitle, companyName)}
      </p>
    </div>
  `;
}

/**
 * Parse BLUF content into Company Snapshot and Department Focus sections
 */
function parseBLUFSections(content: string, _managerTitle: string): {
  companySnapshot: string | null;
  departmentFocus: string | null;
} {
  // Try to parse section markers from AI output
  const section1Match = content.match(/##\s*SECTION\s*1[:\s]*[^#]*([\s\S]*?)(?=##\s*SECTION\s*2|$)/i);
  const section2Match = content.match(/##\s*SECTION\s*2[:\s]*[^#]*([\s\S]*?)$/i);

  if (section1Match || section2Match) {
    return {
      companySnapshot: section1Match ? section1Match[1].trim().replace(/^[:\s]+/, '') : null,
      departmentFocus: section2Match ? section2Match[1].trim().replace(/^[:\s]+/, '') : null
    };
  }

  // If no section markers, try to split by paragraph count (first 1-2 are snapshot, rest are focus)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (paragraphs.length >= 3) {
    return {
      companySnapshot: paragraphs.slice(0, Math.min(2, Math.ceil(paragraphs.length / 2))).join('\n\n'),
      departmentFocus: paragraphs.slice(Math.min(2, Math.ceil(paragraphs.length / 2))).join('\n\n')
    };
  }

  // If only 1-2 paragraphs, use as department focus (backward compatible)
  return {
    companySnapshot: null,
    departmentFocus: content
  };
}

/**
 * Format BLUF paragraphs for HTML rendering
 */
function formatBLUFParagraphs(content: string): string {
  return content
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0)
    .map(p => `<p style="margin: 0 0 0.75rem 0;">${safeHtml(p.trim())}</p>`)
    .join('');
}

function generateDepartmentInterpretation(
  overallScore: number,
  deptScore: number,
  deptBand: string,
  managerTitle: string,
  companyName: string
): string {
  const diff = deptScore - overallScore;
  const diffText = diff >= 0
    ? `${diff} points above the company average`
    : `${Math.abs(diff)} points below the company average`;

  if (deptBand === 'Excellence') {
    return `${managerTitle} is performing at an excellent level (${deptScore}/100), ${diffText}. Your team's strong performance is contributing positively to ${companyName}'s overall health. Focus on sustaining these strengths while identifying opportunities to mentor other areas of the business.`;
  } else if (deptBand === 'Proficiency') {
    return `${managerTitle} shows solid performance (${deptScore}/100), ${diffText}. There's room for targeted improvements to elevate from Proficiency to Excellence. The recommendations in this report identify specific opportunities to drive measurable improvement.`;
  } else if (deptBand === 'Attention') {
    return `${managerTitle} requires focused attention (${deptScore}/100), ${diffText}. Several areas need improvement to reach competitive benchmarks. Prioritize the quick wins identified in this report for rapid progress, then address longer-term strategic initiatives.`;
  } else {
    return `${managerTitle} faces critical challenges (${deptScore}/100) that require immediate action. Focus on stabilization initiatives first, then systematic improvement. The roadmap section provides a structured approach to recovery and growth.`;
  }
}

/**
 * Render Quick Wins preview panel with navigation links
 */
function renderQuickWinsPreview(ctx: ReportContext, managerType: ManagerType): string {
  // Get quick wins for this manager's dimensions
  const dimensionCodes = MANAGER_DIMENSIONS[managerType] || [];
  const quickWins = filterQuickWinsByDimensions(ctx.quickWins, dimensionCodes, ctx);

  if (quickWins.length === 0) {
    return '';
  }

  // Show top 3 quick wins as preview
  const previewWins = quickWins.slice(0, 3);

  return `
    <div style="
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
      border: 1px solid #fde047;
      border-left: 4px solid #eab308;
      border-radius: 0 8px 8px 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        color: #854d0e;
        margin: 0 0 0.75rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span style="font-size: 1.25rem;">&#9889;</span>
        Top Quick Wins Identified
      </h4>
      <ul style="margin: 0 0 1rem 0; padding-left: 1.25rem; list-style: none;">
        ${previewWins.map((qw, i) => `
          <li style="margin-bottom: 0.5rem; padding-left: 0;">
            <a href="#quick-win-${i + 1}" style="
              color: #969423;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.875rem;
            ">${i + 1}. ${safeHtml(qw.theme || 'Quick Win')}</a>
            <span style="color: #6b7280; font-size: 0.8125rem;"> - ${safeHtml(qw.timeframe || '90 days')}</span>
          </li>
        `).join('')}
      </ul>
      <a href="#quick-wins" style="
        display: inline-block;
        padding: 0.5rem 1rem;
        background: #969423;
        color: white;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.8125rem;
        font-weight: 600;
      ">View All Quick Wins &rarr;</a>
    </div>
  `;
}

/**
 * Render Enterprise Risk Section with consolidated risk summary
 */
function renderEnterpriseRiskSection(ctx: ReportContext): string {
  // Only render if Phase 1.5 data is available
  if (!ctx.categoryAnalyses || ctx.categoryAnalyses.length === 0) {
    return '';
  }

  const riskSummary = buildEnterpriseRiskSummary(ctx.categoryAnalyses);
  return renderEnterpriseRiskPanel(riskSummary);
}

/**
 * Render Score Derivation explanation
 */
function renderScoreDerivation(
  dimensions: ReportDimension[],
  departmentScore: number,
  managerTitle: string
): string {
  if (dimensions.length === 0) {
    return '';
  }

  const dimScores = dimensions.map(d => `${safeHtml(d.name)} (${safeScore(d.score, 0)})`);

  return `
    <div class="score-derivation" style="
      font-size: 0.8125rem;
      color: #6b7280;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
    ">
      <strong>Score Derivation:</strong> ${safeHtml(managerTitle)} health score (${departmentScore})
      reflects weighted performance across:
      ${dimScores.join(', ')}.
    </div>
  `;
}

/**
 * Render Manager Prioritization Section
 */
function renderManagerPrioritizationSection(ctx: ReportContext, managerType: ManagerType): string {
  // Map dimension manager type to prioritization manager type
  const prioritizationManagerType = mapToPrioritizationManagerType(managerType);

  // Try to use Phase 1.5 prioritization matrix if available
  if (ctx.crossCategoryInsights?.prioritizationMatrix && ctx.categoryAnalyses) {
    const priorities = getManagerPriorities(
      ctx.crossCategoryInsights.prioritizationMatrix,
      ctx.categoryAnalyses,
      prioritizationManagerType,
      5
    );

    if (priorities.length > 0) {
      return renderPrioritizationPanel(priorities, prioritizationManagerType);
    }
  }

  // Fallback: build priorities from category analyses
  if (ctx.categoryAnalyses && ctx.categoryAnalyses.length > 0) {
    const priorities = buildPrioritiesFromCategories(
      ctx.categoryAnalyses,
      prioritizationManagerType,
      5
    );

    if (priorities.length > 0) {
      return renderPrioritizationPanel(priorities, prioritizationManagerType);
    }
  }

  return '';
}

/**
 * Map dimension-filters ManagerType to prioritization ManagerType
 */
function mapToPrioritizationManagerType(managerType: ManagerType): PrioritizationManagerType {
  const mapping: Record<ManagerType, PrioritizationManagerType> = {
    operations: 'Operations',
    salesMarketing: 'SalesMarketing',
    financials: 'Financials',
    strategy: 'StrategyLeadership',
    itTechnology: 'ITTechnology',
    employees: 'StrategyLeadership'  // Fallback
  };
  return mapping[managerType] || 'StrategyLeadership';
}

// ============================================================================
// DIMENSION DEEP DIVE SECTION
// ============================================================================

/**
 * Render Dimension Deep Dive section
 */
export function renderDimensionDeepDiveSection(
  ctx: ReportContext,
  section: DimensionDeepDiveSection
): string {
  const dimensions = getDimensionsByCodes(ctx, section.dimensionCodes);

  if (dimensions.length === 0) {
    return renderEmptySection(section, 'Dimension data not available in current assessment.');
  }

  const dimensionBlocks = dimensions.map(dim =>
    renderDimensionBlock(ctx, dim, section)
  ).join('');

  return `
    <section id="${section.id}" class="report-section deep-dive-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      ${dimensionBlocks}
    </section>
  `;
}

function getDimensionsByCodes(ctx: ReportContext, codes: DimensionCode[]): ReportDimension[] {
  return safeArray(ctx.dimensions).filter(dim => codes.includes(dim.code as DimensionCode));
}

function renderDimensionBlock(
  ctx: ReportContext,
  dimension: ReportDimension,
  section: DimensionDeepDiveSection
): string {
  const dimName = safeStringValue(dimension.name, 'Dimension');
  const dimCode = safeStringValue(dimension.code, 'DIM');
  const dimScore = safeScore(dimension.score, 0);
  const dimBand = safeScoreBand(dimScore);
  const dimDescription = safeStringValue(dimension.description, '');

  // Get findings for this dimension
  const findings = filterFindingsByDimensions(ctx.findings, [dimension.code as DimensionCode]);

  // Get quick wins if enabled
  const quickWins = section.showQuickWins
    ? filterQuickWinsByDimensions(ctx.quickWins, [dimension.code as DimensionCode], ctx)
    : [];

  // Get benchmark data if available
  const benchmarkPercentile = dimension.benchmark?.peerPercentile;

  return `
    <div class="dimension-block" style="
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    ">
      <!-- Dimension Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: #212653;
            margin: 0;
          ">${safeHtml(dimName)} <span style="font-size: 0.875rem; color: #6b7280; font-weight: 400;">(${dimCode})</span></h3>
          ${dimDescription ? `<p style="margin: 0.5rem 0 0 0; color: #6b7280; font-size: 0.875rem;">${safeHtml(dimDescription)}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="
            font-size: 2.5rem;
            font-weight: 700;
            color: ${safeScoreBandColor(dimScore)};
            line-height: 1;
          ">${dimScore}</div>
          <div style="
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: ${safeScoreBandColor(dimScore)};
            color: white;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 0.25rem;
          ">${dimBand}</div>
        </div>
      </div>

      ${section.showBenchmarks && benchmarkPercentile !== undefined ? `
        <!-- Benchmark Comparison -->
        <div style="
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8125rem; color: #6b7280;">Industry Benchmark</span>
            <span style="font-size: 0.875rem; font-weight: 600; color: #212653;">${benchmarkPercentile}th percentile</span>
          </div>
          <div style="
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
          ">
            <div style="
              width: ${benchmarkPercentile}%;
              height: 100%;
              background: ${safeScoreBandColor(dimScore)};
              border-radius: 4px;
            "></div>
          </div>
        </div>
      ` : ''}

      ${section.showSubIndicators && dimension.subIndicators?.length > 0 ? `
        <!-- Sub-Indicators -->
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0 0 0.75rem 0;">Sub-Indicators</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${safeArray(dimension.subIndicators).map(sub => {
              const subScore = safeScore(sub.score, 0);
              return `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="flex: 1; font-size: 0.8125rem; color: #374151;">${safeHtml(sub.name)}</span>
                  <div style="width: 100px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${subScore}%; height: 100%; background: ${safeScoreBandColor(subScore)};"></div>
                  </div>
                  <span style="width: 2rem; text-align: right; font-size: 0.8125rem; font-weight: 600; color: ${safeScoreBandColor(subScore)};">${subScore}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Findings -->
      ${findings.length > 0 ? `
        <div style="margin-bottom: ${quickWins.length > 0 ? '1rem' : '0'};">
          <h4 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0 0 0.75rem 0;">Key Findings</h4>
          ${renderFindingsGrouped(findings, {
            maxStrengths: section.maxFindings || 3,
            maxGaps: section.maxFindings || 3,
            showDimension: false,
          })}
        </div>
      ` : ''}

      <!-- Quick Wins -->
      ${quickWins.length > 0 ? `
        <div>
          <h4 style="font-size: 0.875rem; font-weight: 600; color: #059669; margin: 0 0 0.75rem 0;">⚡ Quick Wins for ${safeHtml(dimName)}</h4>
          ${renderManagerQuickWinChecklist(quickWins, { maxItems: 3 })}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// QUICK WINS HIGHLIGHT SECTION
// ============================================================================

/**
 * Map string manager type to InitiativesManagerType
 */
function mapToInitiativesManagerType(managerType: string | undefined): InitiativesManagerType | undefined {
  if (!managerType) return undefined;
  const mapping: Record<string, InitiativesManagerType> = {
    'Operations': 'Operations',
    'SalesMarketing': 'SalesMarketing',
    'Financials': 'Financials',
    'StrategyLeadership': 'StrategyLeadership',
    'ITTechnology': 'ITTechnology',
    'operations': 'Operations',
    'salesMarketing': 'SalesMarketing',
    'financials': 'Financials',
    'strategy': 'StrategyLeadership',
    'itTechnology': 'ITTechnology',
  };
  return mapping[managerType];
}

/**
 * Render Quick Wins Highlight section
 * Enhanced with Phase 2: Full actionability (timeline, owner, success metric, expected outcome)
 */
export function renderQuickWinsHighlightSection(
  ctx: ReportContext,
  section: QuickWinsHighlightSection
): string {
  const quickWins = filterQuickWinsByDimensions(ctx.quickWins, section.dimensionCodes, ctx);
  const companyName = safeStringValue(ctx.companyProfile?.name, 'Your Company');

  // Get dimensions for enhanced quick wins generation
  const dimensions = safeArray(ctx.dimensions).filter(dim =>
    section.dimensionCodes.includes(dim.code as DimensionCode)
  );

  // Generate enhanced quick wins with full actionability
  const enhancedQuickWins: EnhancedQuickWin[] = [];
  const sortedDimensions = [...dimensions].sort((a, b) => safeScore(a.score, 0) - safeScore(b.score, 0));

  // Build enhanced quick wins from lowest-scoring dimensions
  const managerTitle = section.managerType || 'Department';
  const defaultOwner = `${managerTitle} Lead`;

  for (const dim of sortedDimensions) {
    if (enhancedQuickWins.length >= (section.maxQuickWins || 5)) break;

    const context = buildNarrativeContext(dim, ctx);
    const baseQuickWin = quickWins.find(qw => qw.theme?.includes(dim.name || '')) || quickWins[0];

    if (baseQuickWin || dim.score < 70) {
      const enhanced = generateEnhancedQuickWin(
        baseQuickWin || { id: dim.id, recommendationId: '', theme: dim.name || '', impactScore: 70, effortScore: 30, actionSteps: [], expectedOutcomes: '', timeframe: '90_days' },
        context,
        { type: managerTitle, defaultOwner }
      );
      enhancedQuickWins.push(enhanced);
    }
  }

  // Ensure minimum of 3 quick wins
  while (enhancedQuickWins.length < 3 && enhancedQuickWins.length < (section.maxQuickWins || 5)) {
    enhancedQuickWins.push({
      title: `${managerTitle} Process Optimization`,
      description: `Conduct systematic review of ${managerTitle.toLowerCase()} processes ` +
        `to identify efficiency gains and standardization opportunities.`,
      accountableRole: defaultOwner,
      timeline: '60-90 days',
      resourceRequirement: '0.25 FTE + departmental participation',
      successMetric: 'Document 5+ process improvements with implementation plan',
      expectedOutcome: 'Foundation for sustained capability improvement',
      linkedGapScore: 50,
      linkedGapName: managerTitle
    });
  }

  // Warn if original quick wins are less than 3
  const quickWinWarning = quickWins.length < 3
    ? `<div style="
        padding: 0.75rem;
        background: #fef3c7;
        border-left: 3px solid #d97706;
        border-radius: 0 6px 6px 0;
        font-size: 0.875rem;
        color: #92400e;
        margin-bottom: 1rem;
      ">Note: Additional quick wins have been generated based on your dimension scores. See Comprehensive Report for more opportunities.</div>`
    : '';

  // Calculate potential points
  const potentialPoints = enhancedQuickWins.reduce((sum, qw) =>
    sum + (qw.linkedGapScore < 50 ? 15 : 10), 0
  );

  // Map manager type for ownership badges
  const currentManager = mapToInitiativesManagerType(section.managerType);

  return `
    <section id="${section.id}" class="report-section quick-wins-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      ${quickWinWarning}

      <!-- Enhanced Summary stats -->
      <div style="
        display: flex;
        gap: 1.5rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #86efac;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      ">
        <div style="text-align: center;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #22c55e;">&#9889; ${enhancedQuickWins.length}</div>
          <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase;">Quick Wins Identified</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #22c55e;">+${potentialPoints}</div>
          <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase;">Potential Points</div>
        </div>
      </div>

      <!-- Enhanced quick win cards with full actionability -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${enhancedQuickWins.map((qw, index) => renderEnhancedQuickWinCard(qw, index + 1)).join('')}
      </div>

      <!-- Cross-reference -->
      ${generateNarrativeCrossReference('roadmap', 'implementation-timeline', 'full implementation sequencing and dependencies')}
    </section>
  `;
}

// ============================================================================
// DEPARTMENT ROADMAP SECTION
// ============================================================================

/**
 * Render Department Roadmap section
 * Enhanced with Phase 2: Phase 1/Phase 2 structure with rich details
 */
export function renderDepartmentRoadmapSection(
  ctx: ReportContext,
  section: DepartmentRoadmapSection
): string {
  const horizonDays = section.horizonDays || 180;
  const companyName = safeStringValue(ctx.companyProfile?.name, 'Your Company');

  // Get dimensions for this manager
  const dimensions = getDimensionsByCodes(ctx, section.dimensionCodes);

  // Generate Phase 1 and Phase 2 roadmap using narrative generator
  const roadmapPhases = generateRoadmapPhases(
    dimensions,
    companyName,
    section.title?.replace(' Roadmap', '') || 'Department'
  );

  // Also get recommendations for fallback display
  const recommendations = filterRecommendationsByDimensions(ctx.recommendations, section.dimensionCodes);
  const immediate = recommendations.filter(r => r.horizon === '90_days');
  const shortTerm = recommendations.filter(r => r.horizon === '12_months');
  const longTerm = recommendations.filter(r => r.horizon === '24_months_plus');

  const hasRoadmapPhases = roadmapPhases.length > 0 && roadmapPhases.some(p => p.items.length > 0);
  const hasRecommendations = immediate.length > 0 || shortTerm.length > 0 || longTerm.length > 0;

  if (!hasRoadmapPhases && !hasRecommendations) {
    return renderEmptySection(section, 'No specific roadmap items identified for your department. See the Company Roadmap Report for organization-wide initiatives.');
  }

  return `
    <section id="${section.id}" class="report-section roadmap-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <p style="color: #374151; line-height: 1.6; margin-bottom: 1.5rem;">
        This implementation roadmap sequences your ${section.title?.toLowerCase().replace(' roadmap', '') || 'department'}
        improvement initiatives based on gap severity, dependencies, and resource requirements.
        Phase 1 focuses on stabilization and quick wins; Phase 2 builds sustainable capability.
      </p>

      <!-- Phase-based roadmap with rich details -->
      ${hasRoadmapPhases ? `
        <div style="display: flex; flex-direction: column; gap: 2rem;">
          ${roadmapPhases.map(phase => renderRoadmapPhaseBlock(phase)).join('')}
        </div>
      ` : `
        <!-- Fallback to recommendation-based roadmap -->
        ${immediate.length > 0 ? renderRoadmapPhaseLegacy(immediate, 'Phase 1: Next 90 Days', '#f59e0b', section.maxItemsPerPhase || 5) : ''}
        ${shortTerm.length > 0 ? renderRoadmapPhaseLegacy(shortTerm, 'Phase 2: 3-12 Months', '#3b82f6', section.maxItemsPerPhase || 5) : ''}
        ${horizonDays > 180 && longTerm.length > 0 ? renderRoadmapPhaseLegacy(longTerm, 'Phase 3: 12-24+ Months', '#7c3aed', section.maxItemsPerPhase || 5) : ''}
      `}

      <!-- Cross-references -->
      ${generateNarrativeCrossReference('risk', 'risk-mitigation', 'enterprise risk factors influencing timeline priorities')}
      ${generateNarrativeCrossReference('roadmap', 'implementation-timeline', 'company-wide initiative sequencing')}
    </section>
  `;
}

/**
 * Legacy roadmap phase renderer for fallback
 */
function renderRoadmapPhaseLegacy(
  recommendations: ReportRecommendation[],
  phaseName: string,
  color: string,
  maxItems: number
): string {
  const items = recommendations.slice(0, maxItems);

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.125rem;
        font-weight: 600;
        color: ${color};
        margin: 0 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid ${color}30;
      ">${phaseName}</h3>
      <div>
        ${items.map(rec => renderRecommendationRow(rec)).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// RISK OVERVIEW SECTION
// ============================================================================

/**
 * Render Risk Overview section
 */
export function renderRiskOverviewSection(
  ctx: ReportContext,
  section: RiskOverviewSection
): string {
  const risks = filterRisksByDimensions(ctx.risks, section.dimensionCodes);

  if (risks.length === 0) {
    return `
      <section id="${section.id}" class="report-section risk-section" style="padding: 2rem; margin-bottom: 2rem;">
        <h2 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #212653;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #969423;
        ">${safeHtml(section.title)}</h2>

        <div style="
          padding: 2rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          text-align: center;
        ">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">✓</span>
          <p style="margin: 0 0 0.5rem 0; color: #166534; font-weight: 600;">No critical department-specific risks identified</p>
          <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
            ${renderCrossReference('RISK_SUMMARY', 'for company-wide risk analysis', 'compact')}
          </p>
        </div>
      </section>
    `;
  }

  // Sort by severity
  const sortedRisks = [...risks].sort((a, b) => {
    const getSeverityValue = (sev: string | number): number => {
      if (typeof sev === 'number') return sev;
      const lower = String(sev).toLowerCase();
      if (lower.includes('critical') || lower === '10') return 10;
      if (lower.includes('high')) return 8;
      if (lower.includes('medium')) return 5;
      return 3;
    };
    return getSeverityValue(b.severity) - getSeverityValue(a.severity);
  }).slice(0, section.maxRisks || 5);

  return `
    <section id="${section.id}" class="report-section risk-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      ${section.showHeatmap ? renderRiskHeatmapSummary(sortedRisks) : ''}

      <div style="margin-top: 1.5rem;">
        ${sortedRisks.map((risk, i) => renderRiskCard(risk, i)).join('')}
      </div>

      ${renderCrossReference('RISK_SUMMARY', 'for mitigation strategies')}
    </section>
  `;
}

function renderRiskHeatmapSummary(risks: ReportRisk[]): string {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  risks.forEach(risk => {
    const sev = typeof risk.severity === 'number' ? risk.severity : parseInt(String(risk.severity)) || 5;
    if (sev >= 9) counts.critical++;
    else if (sev >= 7) counts.high++;
    else if (sev >= 4) counts.medium++;
    else counts.low++;
  });

  return `
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
      <div style="
        flex: 1;
        min-width: 100px;
        padding: 0.75rem;
        background: #dc2626;
        color: white;
        border-radius: 8px;
        text-align: center;
      ">
        <div style="font-size: 1.5rem; font-weight: 700;">${counts.critical}</div>
        <div style="font-size: 0.75rem; text-transform: uppercase;">Critical</div>
      </div>
      <div style="
        flex: 1;
        min-width: 100px;
        padding: 0.75rem;
        background: #ea580c;
        color: white;
        border-radius: 8px;
        text-align: center;
      ">
        <div style="font-size: 1.5rem; font-weight: 700;">${counts.high}</div>
        <div style="font-size: 0.75rem; text-transform: uppercase;">High</div>
      </div>
      <div style="
        flex: 1;
        min-width: 100px;
        padding: 0.75rem;
        background: #d97706;
        color: white;
        border-radius: 8px;
        text-align: center;
      ">
        <div style="font-size: 1.5rem; font-weight: 700;">${counts.medium}</div>
        <div style="font-size: 0.75rem; text-transform: uppercase;">Medium</div>
      </div>
      <div style="
        flex: 1;
        min-width: 100px;
        padding: 0.75rem;
        background: #059669;
        color: white;
        border-radius: 8px;
        text-align: center;
      ">
        <div style="font-size: 1.5rem; font-weight: 700;">${counts.low}</div>
        <div style="font-size: 0.75rem; text-transform: uppercase;">Low</div>
      </div>
    </div>
  `;
}

function renderRiskCard(risk: ReportRisk, index: number): string {
  const narrative = safeStringValue(risk.narrative, 'Risk details pending');
  const dimensionName = safeStringValue(risk.dimensionName, '');
  const mitigation = safeStringValue(risk.mitigationSummary || '', '');

  const sevValue = typeof risk.severity === 'number' ? risk.severity : parseInt(String(risk.severity)) || 5;
  let sevLabel: string, sevColor: string;
  if (sevValue >= 9) { sevLabel = 'Critical'; sevColor = '#dc2626'; }
  else if (sevValue >= 7) { sevLabel = 'High'; sevColor = '#ea580c'; }
  else if (sevValue >= 4) { sevLabel = 'Medium'; sevColor = '#d97706'; }
  else { sevLabel = 'Low'; sevColor = '#059669'; }

  return `
    <div style="
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${sevColor};
      border-radius: 0 8px 8px 0;
      padding: 1rem;
      margin-bottom: 0.75rem;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
        <div>
          <span style="
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background: ${sevColor};
            color: white;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
          ">${sevLabel}</span>
          ${dimensionName ? `<span style="margin-left: 0.5rem; font-size: 0.8125rem; color: #6b7280;">${safeHtml(dimensionName)}</span>` : ''}
        </div>
        <span style="font-size: 0.8125rem; color: #6b7280;">#${index + 1}</span>
      </div>
      <p style="margin: 0 0 ${mitigation ? '0.75rem' : '0'} 0; color: #374151; font-size: 0.9375rem; line-height: 1.5;">
        ${safeHtml(narrative)}
      </p>
      ${mitigation ? `
        <div style="
          padding: 0.75rem;
          background: #f0fdf4;
          border-radius: 6px;
        ">
          <span style="font-weight: 600; color: #166534; font-size: 0.8125rem;">Recommended Action:</span>
          <span style="color: #374151; font-size: 0.8125rem;"> ${safeHtml(mitigation)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// METRICS DASHBOARD SECTION
// ============================================================================

/**
 * Render Metrics Dashboard section
 */
export function renderMetricsDashboardSection(
  ctx: ReportContext,
  section: MetricsDashboardSection
): string {
  const dimensions = getDimensionsByCodes(ctx, section.dimensionCodes);

  if (dimensions.length === 0) {
    return renderEmptySection(section, 'Metrics data not available for this assessment.');
  }

  return `
    <section id="${section.id}" class="report-section metrics-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
      ">
        ${dimensions.map(dim => renderMetricCard(dim, section)).join('')}
      </div>

      <!-- Legend -->
      <div style="
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        margin-top: 1.5rem;
        flex-wrap: wrap;
        font-size: 0.8125rem;
        color: #6b7280;
      ">
        <span style="display: flex; align-items: center; gap: 0.375rem;">
          <span style="width: 12px; height: 12px; background: #059669; border-radius: 50%;"></span>
          Excellence (80-100)
        </span>
        <span style="display: flex; align-items: center; gap: 0.375rem;">
          <span style="width: 12px; height: 12px; background: #2563eb; border-radius: 50%;"></span>
          Proficiency (60-79)
        </span>
        <span style="display: flex; align-items: center; gap: 0.375rem;">
          <span style="width: 12px; height: 12px; background: #d97706; border-radius: 50%;"></span>
          Attention (40-59)
        </span>
        <span style="display: flex; align-items: center; gap: 0.375rem;">
          <span style="width: 12px; height: 12px; background: #dc2626; border-radius: 50%;"></span>
          Critical (0-39)
        </span>
      </div>
    </section>
  `;
}

function renderMetricCard(dimension: ReportDimension, section: MetricsDashboardSection): string {
  const name = safeStringValue(dimension.name, 'Metric');
  const code = safeStringValue(dimension.code, '');
  const score = safeScore(dimension.score, 0);
  const band = safeScoreBand(score);

  const benchmarkPercentile = dimension.benchmark?.peerPercentile;
  const showBenchmark = section.showBenchmark && benchmarkPercentile !== undefined;

  return `
    <div style="
      background: #f9fafb;
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
    ">
      <div style="
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      ">${code}</div>
      <div style="
        font-family: 'Montserrat', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        color: #212653;
        margin-bottom: 0.75rem;
      ">${safeHtml(name)}</div>
      <div style="
        font-size: 2.5rem;
        font-weight: 700;
        color: ${safeScoreBandColor(score)};
        line-height: 1;
      ">${score}</div>
      <div style="
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: ${safeScoreBandColor(score)};
        color: white;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        margin-top: 0.5rem;
      ">${band}</div>
      ${showBenchmark ? `
        <div style="
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.75rem;
          color: #6b7280;
        ">
          Industry: ${benchmarkPercentile}th percentile
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// MANAGER CLOSING SECTION
// ============================================================================

/**
 * Render Manager Closing section
 */
export function renderManagerClosingSection(
  ctx: ReportContext,
  section: ManagerClosingSection,
  _recipe: ManagerReportRecipe
): string {
  const companyName = safeStringValue(ctx.companyProfile?.name, 'your organization');
  const content = getClosingContent(section.managerType, companyName);

  return `
    <section id="${section.id}" class="report-section closing-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <!-- Acknowledgement -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 0.75rem 0;
        ">Your Role in ${safeHtml(companyName)}'s Success</h3>
        <p style="color: #374151; line-height: 1.6; margin: 0;">${content.acknowledgement}</p>
      </div>

      <!-- Next Steps -->
      ${section.showNextSteps !== false ? `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 0.75rem 0;
          ">Recommended Next 30-90 Days</h3>
          <ol style="
            padding-left: 1.25rem;
            color: #374151;
            line-height: 1.7;
            margin: 0;
          ">
            ${content.nextSteps.map(step => `<li style="margin-bottom: 0.5rem;">${step}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <!-- Resources Reference -->
      ${section.showResources !== false ? `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 0.75rem 0;
          ">Additional Resources</h3>
          <p style="color: #374151; line-height: 1.6; margin: 0;">
            For comprehensive analysis and full implementation details, refer to your <strong>Comprehensive Report</strong> provided with your assessment package. This document contains the complete analysis of all business health dimensions, detailed recommendations, and the full implementation roadmap.
          </p>
        </div>
      ` : ''}

      <!-- Empowerment Message -->
      <div style="
        padding: 1.5rem;
        background: #f9fafb;
        border-left: 4px solid #969423;
        border-radius: 0 8px 8px 0;
      ">
        <p style="
          font-size: 1.0625rem;
          font-style: italic;
          color: #212653;
          margin: 0;
          line-height: 1.6;
        ">"${content.empowerment}"</p>
      </div>
    </section>
  `;
}

interface ClosingContent {
  acknowledgement: string;
  nextSteps: string[];
  empowerment: string;
}

function getClosingContent(managerType: string, companyName: string): ClosingContent {
  const contentMap: Record<string, ClosingContent> = {
    operations: {
      acknowledgement: `As Operations leader, you are the backbone of ${companyName}'s ability to deliver on promises to customers. Your focus on efficiency, quality, and continuous improvement directly impacts every aspect of business performance.`,
      nextSteps: [
        'Review the quick wins identified in this report and select 2-3 for immediate implementation',
        'Schedule a team meeting to discuss the key findings and gather frontline input',
        'Establish baseline metrics for the top improvement areas identified',
        'Coordinate with other department heads on cross-functional dependencies',
        'Set up a 30-day check-in to assess progress on priority initiatives'
      ],
      empowerment: 'Your operational excellence creates the foundation for sustainable growth. The improvements you drive will ripple across the entire organization.'
    },
    salesMarketing: {
      acknowledgement: `As the driver of ${companyName}'s revenue engine, your strategic decisions about market positioning, customer acquisition, and sales effectiveness directly shape the company's growth trajectory.`,
      nextSteps: [
        'Analyze the Growth Engine dimension scores and identify the largest gaps',
        'Review customer experience metrics and develop targeted improvement plans',
        'Align sales and marketing initiatives for maximum impact',
        'Implement quick wins that can accelerate pipeline velocity',
        'Schedule strategy sessions with leadership to align on growth priorities'
      ],
      empowerment: 'Your ability to connect the company with customers and drive revenue is essential to achieving strategic goals. Lead with confidence and focus on high-impact opportunities.'
    },
    financials: {
      acknowledgement: `As the steward of ${companyName}'s financial health, your analysis and guidance ensures the company has the resources to execute its strategy and weather challenges.`,
      nextSteps: [
        'Review financial health metrics against industry benchmarks',
        'Identify opportunities to improve cash flow and working capital',
        'Assess risk exposure and ensure appropriate mitigation strategies',
        'Align budget allocations with strategic priorities identified in this assessment',
        'Develop financial models for key improvement initiatives'
      ],
      empowerment: 'Your financial acumen and discipline provides the stability and insight needed for confident decision-making. Your guidance turns strategy into sustainable results.'
    },
    strategy: {
      acknowledgement: `As the architect of ${companyName}'s strategic direction, your vision and leadership alignment ensures all efforts across the organization drive toward shared goals.`,
      nextSteps: [
        'Review strategy and leadership scores in context of competitive position',
        'Facilitate leadership alignment on top 3-5 strategic priorities',
        'Develop communication plan to cascade strategic focus across organization',
        'Establish governance mechanisms to track progress on key initiatives',
        'Schedule quarterly strategy reviews to adapt to changing conditions'
      ],
      empowerment: 'Your strategic clarity creates the north star that guides every team member. Lead with vision, communicate with purpose, and adapt with agility.'
    },
    itTechnology: {
      acknowledgement: `As the enabler of ${companyName}'s digital capabilities, your technology decisions create the infrastructure for efficiency, innovation, and competitive advantage.`,
      nextSteps: [
        'Assess technology and data security scores against evolving threats',
        'Prioritize technology modernization initiatives by business impact',
        'Review data management practices and identify improvement opportunities',
        'Develop technology roadmap aligned with business strategy',
        'Ensure adequate resources for security and compliance requirements'
      ],
      empowerment: 'Your technology leadership transforms how the business operates and competes. Build the digital foundation that enables everyone to do their best work.'
    }
  };

  return contentMap[managerType] || contentMap.operations;
}

// ============================================================================
// PHASE 1.5 CATEGORY ANALYSIS SECTION
// ============================================================================

/**
 * Get score band for CSS class assignment
 */
function getCategoryScoreBand(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'developing';
  if (score >= 20) return 'needs-improvement';
  return 'critical';
}

/**
 * Render Phase 1.5 Category Analysis section for Manager Reports
 * Enhanced with Phase 2: Key Takeaways, Synthesis Narrative, Cross-References
 */
export function renderCategoryAnalysisSection(
  ctx: ReportContext,
  section: CategoryAnalysisSection
): string {
  // Graceful fallback if Phase 1.5 data unavailable
  if (!ctx.categoryAnalyses || ctx.categoryAnalyses.length === 0) {
    return renderEmptySection(section, 'Category analysis data is not available for this assessment.');
  }

  // Filter to categories relevant to this manager
  const relevantCategories = ctx.categoryAnalyses.filter(
    cat => section.categoryCodes.includes(cat.categoryCode)
  );

  if (relevantCategories.length === 0) {
    return renderEmptySection(section, 'No category data available for your department focus areas.');
  }

  // Get company name for personalization
  const companyName = safeStringValue(ctx.companyProfile?.name, 'Your Company');

  // Convert category analyses to dimensions for narrative generators
  const dimensionsFromCategories: ReportDimension[] = relevantCategories.map(cat => ({
    id: cat.categoryCode,
    code: cat.categoryCode as any,
    chapterCode: 'GE' as any, // Default
    name: cat.categoryName,
    description: cat.executiveSummary || '',
    score: cat.overallScore,
    band: safeScoreBand(cat.overallScore) as any,
    subIndicators: [],
    keyFindings: cat.strengths?.map(s => s.title) || [],
    keyRisks: cat.risks?.map(r => r.title) || [],
    keyOpportunities: cat.opportunities?.map(o => o.title) || [],
  }));

  // Generate Key Takeaways
  const keyTakeaways = generateKeyTakeaways(
    dimensionsFromCategories,
    safeArray(ctx.findings),
    companyName
  );

  // Generate Category Synthesis Narrative
  const synthesisNarrative = generateCategorySynthesis(
    dimensionsFromCategories,
    section.title || 'Department',
    companyName
  );

  // Generate visualizations
  const radarChart = section.showRadarChart !== false
    ? generateCategoryRadarChart(relevantCategories, { showBenchmark: true, showScoreValues: true })
    : '';

  const benchmarkBars = section.showBenchmarks !== false
    ? generateCategoryBenchmarkBars(relevantCategories)
    : '';

  // Generate category detail cards
  const categoryCards = relevantCategories.map(cat => {
    const scoreBand = getCategoryScoreBand(cat.overallScore);
    const topStrength = cat.strengths?.[0]?.title || 'N/A';
    const topGap = cat.weaknesses?.[0]?.title || 'N/A';
    const topQuickWin = cat.quickWins?.[0]?.title || 'N/A';

    // Generate SWOT if enabled
    const swotDiagram = section.showSWOT !== false
      ? generateSWOTQuadrant(cat, { width: 400, height: 300 })
      : '';

    return `
      <div class="category-detail-card" style="
        background: white;
        border: 1px solid #e5e7eb;
        border-left: 4px solid ${cat.overallScore >= 60 ? '#059669' : cat.overallScore >= 40 ? '#d97706' : '#dc2626'};
        border-radius: 0 8px 8px 0;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        page-break-inside: avoid;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0;
          ">${safeHtml(cat.categoryName)} (${safeHtml(cat.categoryCode)})</h3>
          <div style="
            background: ${cat.overallScore >= 60 ? '#059669' : cat.overallScore >= 40 ? '#d97706' : '#dc2626'};
            color: white;
            padding: 0.375rem 0.875rem;
            border-radius: 2rem;
            font-weight: 600;
            font-size: 0.9rem;
          ">${cat.overallScore}/100</div>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.875rem;">
          <span><strong>Status:</strong> ${safeHtml(cat.status)}</span>
          ${cat.confidenceLevel ? `<span><strong>Confidence:</strong> ${safeHtml(cat.confidenceLevel)}</span>` : ''}
        </div>

        ${cat.executiveSummary ? `
          <p style="color: #374151; line-height: 1.6; margin: 0 0 1rem 0;">
            ${safeHtml(cat.executiveSummary)}
          </p>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
          <div style="background: #d1fae5; padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #059669; text-transform: uppercase; margin-bottom: 0.25rem;">Top Strength</div>
            <div style="font-size: 0.875rem; color: #065f46; font-weight: 500;">${safeHtml(topStrength)}</div>
          </div>
          <div style="background: #fee2e2; padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #dc2626; text-transform: uppercase; margin-bottom: 0.25rem;">Priority Gap</div>
            <div style="font-size: 0.875rem; color: #991b1b; font-weight: 500;">${safeHtml(topGap)}</div>
          </div>
          <div style="background: #dbeafe; padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #2563eb; text-transform: uppercase; margin-bottom: 0.25rem;">Quick Win</div>
            <div style="font-size: 0.875rem; color: #1e40af; font-weight: 500;">${safeHtml(topQuickWin)}</div>
          </div>
        </div>

        ${swotDiagram ? `
          <div style="margin-top: 1rem; background: #f9fafb; padding: 1rem; border-radius: 8px;">
            <h4 style="font-size: 0.875rem; color: #374151; margin: 0 0 0.75rem 0;">SWOT Analysis</h4>
            <div style="display: flex; justify-content: center;">
              ${swotDiagram}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <section id="${section.id}" class="report-section category-analysis-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <!-- KEY TAKEAWAYS OPENER -->
      ${renderKeyTakeawaysBlock(keyTakeaways)}

      <!-- CATEGORY SYNTHESIS NARRATIVE -->
      <div style="
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border-left: 4px solid #212653;
        padding: 1.25rem 1.5rem;
        border-radius: 0 8px 8px 0;
        margin-bottom: 1.5rem;
      ">
        <h3 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 0.75rem 0;
        ">Executive Summary</h3>
        <p style="
          color: #374151;
          line-height: 1.7;
          margin: 0;
          font-size: 0.9375rem;
        ">${safeHtml(synthesisNarrative)}</p>
      </div>

      <!-- CROSS-REFERENCE TO COMPREHENSIVE -->
      ${generateNarrativeCrossReference('comprehensive', 'dimensional-analysis', 'detailed dimensional analysis and benchmarking')}

      ${radarChart ? `
        <div style="margin-bottom: 2rem; background: #f9fafb; padding: 1.5rem; border-radius: 8px;">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 1rem 0;
          ">Department Category Radar</h3>
          <div style="display: flex; justify-content: center;">
            ${radarChart}
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 0.85rem; margin-top: 0.75rem;">
            Your performance across department-relevant categories vs. industry benchmarks
          </p>
        </div>
      ` : ''}

      ${benchmarkBars ? `
        <div style="margin-bottom: 2rem; background: #f9fafb; padding: 1.5rem; border-radius: 8px;">
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 1rem 0;
          ">Benchmark Comparison</h3>
          <div style="overflow-x: auto;">
            ${benchmarkBars}
          </div>
        </div>
      ` : ''}

      <div class="category-details">
        <h3 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 1rem 0;
        ">Category Deep Dives</h3>
        ${categoryCards}
      </div>
    </section>
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render trajectory display with proper handling for Initial assessments
 *
 * - 'Initial': Shows "Baseline Established" with chart icon (green)
 * - 'Improving': Shows "Improving" with up arrow (green)
 * - 'Stable'/'Flat': Shows "Stable" with right arrow (gray)
 * - 'Declining': Shows "Declining" with down arrow (red)
 */
function renderTrajectoryDisplay(trajectory: string): string {
  // Configuration for each trajectory type
  const trajectoryConfig: Record<string, { label: string; icon: string; color: string; description?: string }> = {
    'Initial': {
      label: 'Baseline Established',
      icon: '📊',
      color: '#059669',
      description: 'Initial assessment — trajectory tracking begins with next assessment'
    },
    'Improving': {
      label: 'Improving',
      icon: '↑',
      color: '#059669'
    },
    'Stable': {
      label: 'Stable',
      icon: '→',
      color: '#6b7280'
    },
    'Declining': {
      label: 'Declining',
      icon: '↓',
      color: '#dc2626'
    },
    // DEPRECATED: Map 'Flat' to 'Stable' for backward compatibility
    'Flat': {
      label: 'Stable',
      icon: '→',
      color: '#6b7280'
    }
  };

  const config = trajectoryConfig[trajectory] || trajectoryConfig['Initial'];

  if (trajectory === 'Initial') {
    return `
      <div style="margin-top: 0.75rem; font-size: 0.875rem;">
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: rgba(5, 150, 105, 0.1);
          border-radius: 1rem;
        ">
          <span style="font-size: 1rem;">${config.icon}</span>
          <span style="font-weight: 600; color: ${config.color};">${config.label}</span>
        </div>
        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
          ${config.description}
        </div>
      </div>
    `;
  }

  return `
    <div style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Trajectory: <span style="font-weight: 600; color: ${config.color};">
        ${config.icon} ${config.label}
      </span>
    </div>
  `;
}

/**
 * Render empty section placeholder
 */
function renderEmptySection(section: { id: string; title: string }, message: string): string {
  return `
    <section id="${section.id}" class="report-section" style="padding: 2rem; margin-bottom: 2rem;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #212653;
        margin: 0 0 1.5rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #969423;
      ">${safeHtml(section.title)}</h2>

      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">${message}</p>
      </div>
    </section>
  `;
}
