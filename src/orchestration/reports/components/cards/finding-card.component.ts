/**
 * Finding Card Component for Manager Reports
 *
 * Rich finding cards for displaying:
 * - Strengths
 * - Gaps/Weaknesses
 * - Risks
 * - Opportunities
 *
 * Enhanced with:
 * - Evidence-based narratives with assessment citations
 * - Business impact statements
 * - Benchmark comparisons
 * - Driver analysis
 *
 * @module finding-card
 */

import type { ReportFinding, ReportContext, ReportDimension } from '../../../../types/report.types.js';
// DimensionCode used for type discrimination in enhanced findings
import type { DimensionCode as _DimensionCode } from '../../../../types/idm.types.js';
import {
  safeStringValue,
  safeArray,
  safeHtml,
  safeScore,
} from '../../utils/safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Finding type for styling
 */
export type FindingType = 'strength' | 'gap' | 'risk' | 'opportunity';

/**
 * Finding card rendering options
 */
export interface FindingCardOptions {
  /** Show evidence references */
  showEvidence?: boolean;
  /** Show dimension context */
  showDimension?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Finding type configuration
 */
interface FindingTypeConfig {
  icon: string;
  borderColor: string;
  bgColor: string;
  labelColor: string;
  label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Configuration for each finding type
 */
const FINDING_TYPE_CONFIG: Record<FindingType, FindingTypeConfig> = {
  strength: {
    icon: '✓',
    borderColor: '#059669',
    bgColor: '#f0fdf4',
    labelColor: '#059669',
    label: 'Strength'
  },
  gap: {
    icon: '⚠',
    borderColor: '#d97706',
    bgColor: '#fffbeb',
    labelColor: '#d97706',
    label: 'Area for Improvement'
  },
  risk: {
    icon: '⚡',
    borderColor: '#dc2626',
    bgColor: '#fef2f2',
    labelColor: '#dc2626',
    label: 'Risk'
  },
  opportunity: {
    icon: '↗',
    borderColor: '#2563eb',
    bgColor: '#eff6ff',
    labelColor: '#2563eb',
    label: 'Opportunity'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine finding type from ReportFinding
 */
function getFindingType(finding: ReportFinding): FindingType {
  const type = finding.type?.toLowerCase() || 'gap';
  if (type === 'strength') return 'strength';
  if (type === 'gap' || type === 'weakness') return 'gap';
  if (type === 'risk') return 'risk';
  if (type === 'opportunity') return 'opportunity';
  return 'gap';
}

/**
 * Get configuration for a finding type
 */
function getTypeConfig(type: FindingType): FindingTypeConfig {
  return FINDING_TYPE_CONFIG[type] || FINDING_TYPE_CONFIG.gap;
}

// ============================================================================
// MAIN RENDER FUNCTIONS
// ============================================================================

/**
 * Render a single finding card
 */
export function renderFindingCard(
  finding: ReportFinding,
  options: FindingCardOptions = {}
): string {
  const {
    showEvidence = false,
    showDimension = true,
    className = ''
  } = options;

  const type = getFindingType(finding);
  const config = getTypeConfig(type);

  const shortLabel = safeStringValue(finding.shortLabel, 'Finding');
  const narrative = safeStringValue(finding.narrative, 'Details pending analysis');
  const dimensionName = safeStringValue(finding.dimensionName, '');

  // Extract evidence if available
  const evidenceRefs = finding.evidenceRefs || {};
  const hasEvidence = showEvidence && (
    (evidenceRefs.metrics?.length || 0) > 0 ||
    (evidenceRefs.benchmarks?.length || 0) > 0
  );

  return `
    <div class="finding-card ${className}" style="
      border-left: 4px solid ${config.borderColor};
      background: ${config.bgColor};
      border-radius: 0 8px 8px 0;
      padding: 1rem;
      margin-bottom: 0.75rem;
      page-break-inside: avoid;
    ">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
        <span style="
          font-size: 1.25rem;
          color: ${config.borderColor};
          line-height: 1;
        ">${config.icon}</span>

        <div style="flex: 1;">
          <div style="
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
          ">
            <span style="
              font-size: 0.7rem;
              font-weight: 600;
              color: ${config.labelColor};
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${config.label}</span>
            ${showDimension && dimensionName ? `
              <span style="
                font-size: 0.7rem;
                color: #6b7280;
                padding-left: 0.5rem;
                border-left: 1px solid #d1d5db;
              ">${safeHtml(dimensionName)}</span>
            ` : ''}
          </div>
          <h4 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 0.9375rem;
            font-weight: 600;
            color: #212653;
            margin: 0;
            line-height: 1.4;
          ">${safeHtml(shortLabel)}</h4>
        </div>
      </div>

      <!-- Narrative -->
      <p style="
        margin: 0;
        font-size: 0.875rem;
        color: #374151;
        line-height: 1.6;
      ">${safeHtml(narrative)}</p>

      <!-- Evidence (if shown) -->
      ${hasEvidence ? `
        <div style="
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed ${config.borderColor}40;
          font-size: 0.75rem;
          color: #6b7280;
        ">
          <span style="font-weight: 600;">Supporting Evidence:</span>
          ${evidenceRefs.metrics?.length ? `<span style="margin-left: 0.5rem;">${safeArray(evidenceRefs.metrics).join(', ')}</span>` : ''}
          ${evidenceRefs.benchmarks?.length ? `<span style="margin-left: 0.5rem;">Benchmarks: ${safeArray(evidenceRefs.benchmarks).join(', ')}</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render findings grouped by type
 */
export function renderFindingsGrouped(
  findings: ReportFinding[],
  options: FindingCardOptions & {
    maxStrengths?: number;
    maxGaps?: number;
    maxRisks?: number;
    maxOpportunities?: number;
  } = {}
): string {
  const {
    maxStrengths = 3,
    maxGaps = 3,
    maxRisks = 3,
    maxOpportunities = 3,
    ...cardOptions
  } = options;

  const items = safeArray(findings);

  if (items.length === 0) {
    return `
      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">No findings available for this dimension.</p>
      </div>
    `;
  }

  const strengths = items.filter(f => f.type === 'strength').slice(0, maxStrengths);
  const gaps = items.filter(f => f.type === 'gap').slice(0, maxGaps);
  const risks = items.filter(f => f.type === 'risk').slice(0, maxRisks);
  const opportunities = items.filter(f => f.type === 'opportunity').slice(0, maxOpportunities);

  let html = '';

  // Strengths
  if (strengths.length > 0) {
    html += `
      <div class="findings-section strengths-section" style="margin-bottom: 1.5rem;">
        <h5 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #059669;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1rem;">✓</span>
          Key Strengths
        </h5>
        ${strengths.map(f => renderFindingCard(f, cardOptions)).join('')}
      </div>
    `;
  }

  // Gaps
  if (gaps.length > 0) {
    html += `
      <div class="findings-section gaps-section" style="margin-bottom: 1.5rem;">
        <h5 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #d97706;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1rem;">⚠</span>
          Areas for Improvement
        </h5>
        ${gaps.map(f => renderFindingCard(f, cardOptions)).join('')}
      </div>
    `;
  }

  // Risks
  if (risks.length > 0) {
    html += `
      <div class="findings-section risks-section" style="margin-bottom: 1.5rem;">
        <h5 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1rem;">⚡</span>
          Key Risks
        </h5>
        ${risks.map(f => renderFindingCard(f, cardOptions)).join('')}
      </div>
    `;
  }

  // Opportunities
  if (opportunities.length > 0) {
    html += `
      <div class="findings-section opportunities-section" style="margin-bottom: 1.5rem;">
        <h5 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563eb;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1rem;">↗</span>
          Opportunities
        </h5>
        ${opportunities.map(f => renderFindingCard(f, cardOptions)).join('')}
      </div>
    `;
  }

  if (html === '') {
    return `
      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">Detailed findings pending analysis.</p>
      </div>
    `;
  }

  return html;
}

/**
 * Render findings as a simple list (for compact display)
 */
export function renderFindingsList(
  findings: ReportFinding[],
  options: { maxItems?: number; showType?: boolean } = {}
): string {
  const { maxItems = 5, showType = true } = options;
  const items = safeArray(findings).slice(0, maxItems);

  if (items.length === 0) {
    return `<p style="color: #6b7280; font-style: italic;">No findings available.</p>`;
  }

  return `
    <ul style="
      list-style: none;
      margin: 0;
      padding: 0;
    ">
      ${items.map(finding => {
        const type = getFindingType(finding);
        const config = getTypeConfig(type);
        const shortLabel = safeStringValue(finding.shortLabel, 'Finding');

        return `
          <li style="
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
          ">
            <span style="color: ${config.borderColor}; font-size: 1rem; line-height: 1.4;">${config.icon}</span>
            <div>
              ${showType ? `<span style="font-size: 0.7rem; color: ${config.labelColor}; font-weight: 600; text-transform: uppercase;">${config.label}: </span>` : ''}
              <span style="font-size: 0.875rem; color: #374151;">${safeHtml(shortLabel)}</span>
            </div>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

/**
 * Render a compact finding row
 */
export function renderFindingRow(finding: ReportFinding): string {
  const type = getFindingType(finding);
  const config = getTypeConfig(type);
  const shortLabel = safeStringValue(finding.shortLabel, 'Finding');
  const dimensionName = safeStringValue(finding.dimensionName, '');

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      background: ${config.bgColor};
      border-left: 3px solid ${config.borderColor};
      border-radius: 0 6px 6px 0;
      margin-bottom: 0.5rem;
    ">
      <span style="font-size: 1rem; color: ${config.borderColor};">${config.icon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.875rem; color: #212653;">${safeHtml(shortLabel)}</div>
        ${dimensionName ? `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem;">${safeHtml(dimensionName)}</div>` : ''}
      </div>
      <span style="
        font-size: 0.7rem;
        font-weight: 600;
        color: ${config.labelColor};
        text-transform: uppercase;
      ">${config.label}</span>
    </div>
  `;
}

/**
 * Count findings by type
 */
export function countFindingsByType(findings: ReportFinding[]): {
  strengths: number;
  gaps: number;
  risks: number;
  opportunities: number;
  total: number;
} {
  const items = safeArray(findings);
  return {
    strengths: items.filter(f => f.type === 'strength').length,
    gaps: items.filter(f => f.type === 'gap').length,
    risks: items.filter(f => f.type === 'risk').length,
    opportunities: items.filter(f => f.type === 'opportunity').length,
    total: items.length
  };
}

/**
 * Render findings summary badges
 */
export function renderFindingsSummaryBadges(findings: ReportFinding[]): string {
  const counts = countFindingsByType(findings);

  return `
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      ${counts.strengths > 0 ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #f0fdf4;
          color: #059669;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">✓ ${counts.strengths} Strength${counts.strengths !== 1 ? 's' : ''}</span>
      ` : ''}
      ${counts.gaps > 0 ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #fffbeb;
          color: #d97706;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">⚠ ${counts.gaps} Gap${counts.gaps !== 1 ? 's' : ''}</span>
      ` : ''}
      ${counts.risks > 0 ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #fef2f2;
          color: #dc2626;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">⚡ ${counts.risks} Risk${counts.risks !== 1 ? 's' : ''}</span>
      ` : ''}
      ${counts.opportunities > 0 ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">↗ ${counts.opportunities} Opportunit${counts.opportunities !== 1 ? 'ies' : 'y'}</span>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// ENHANCED FINDING TYPES & FUNCTIONS
// ============================================================================

/**
 * Score tier classification
 */
export type FindingTier = 'Excellence' | 'Proficiency' | 'Attention' | 'Critical';

/**
 * Evidence citation from assessment
 */
export interface EvidenceCitation {
  questionId: string;
  questionText: string;
  responseValue: string;
  relevance: string;
}

/**
 * Enhanced finding with rich narrative content
 */
export interface EnhancedFinding {
  id: string;
  title: string;
  categoryCode: string;
  categoryName: string;
  score: number;
  tier: FindingTier;

  /** Rich narrative content */
  narrative: {
    currentState: string;
    driverAnalysis: string;
    businessImpact: string;
    evidenceCitations: EvidenceCitation[];
  };

  /** Benchmark context */
  benchmark: {
    industryMedian: number;
    companyPosition: string;
    gap: number;
    gapDirection: 'above' | 'below' | 'at';
  };

  /** Cross-category connections */
  relatedCategories: Array<{
    categoryCode: string;
    relationship: string;
    impact: string;
  }>;
}

/**
 * Get tier from score
 */
function getTierFromScore(score: number): FindingTier {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Get tier configuration
 */
function getTierConfig(tier: FindingTier): { bg: string; border: string; icon: string } {
  const configs: Record<FindingTier, { bg: string; border: string; icon: string }> = {
    Excellence: { bg: '#e8f5e9', border: '#2e7d32', icon: '&#10003;' },
    Proficiency: { bg: '#e3f2fd', border: '#1976d2', icon: '&#9680;' },
    Attention: { bg: '#fff3e0', border: '#f57c00', icon: '&#9888;' },
    Critical: { bg: '#ffebee', border: '#c62828', icon: '&#10007;' },
  };
  return configs[tier] || configs.Attention;
}

/**
 * Get percentile description from score
 */
function getPercentileDescription(score: number): string {
  if (score >= 80) return 'top quartile';
  if (score >= 60) return 'upper-middle range';
  if (score >= 40) return 'lower-middle range';
  return 'bottom quartile';
}

/**
 * Generate current state narrative
 */
function generateCurrentStateNarrative(
  dimension: ReportDimension,
  benchmark: { industryMedian: number },
  companyName: string,
  industry: string
): string {
  const score = safeScore(dimension.score, 50);
  const tier = getTierFromScore(score);
  const gap = score - benchmark.industryMedian;
  const gapDirection = gap >= 0 ? 'above' : 'below';
  const gapMagnitude = Math.abs(gap);

  const tierDescriptions: Record<FindingTier, string> = {
    Excellence: 'demonstrates industry-leading performance',
    Proficiency: 'shows solid competitive positioning',
    Attention: 'indicates meaningful gaps versus peers',
    Critical: 'reveals significant deficiencies requiring urgent attention',
  };

  return `${companyName}'s ${dimension.name} score of ${score}/100 ${tierDescriptions[tier]}. ` +
         `This positions the company ${gapMagnitude} points ${gapDirection} the industry median of ` +
         `${benchmark.industryMedian}, placing ${companyName} in the ${getPercentileDescription(score)} ` +
         `of ${industry} companies.`;
}

/**
 * Generate driver analysis from evidence
 */
function generateDriverAnalysis(
  dimension: ReportDimension,
  evidenceCitations: EvidenceCitation[],
  companyName: string
): string {
  const tier = getTierFromScore(dimension.score);

  if (evidenceCitations.length === 0) {
    return `Assessment data for ${dimension.name} was limited. ` +
           `Recommend gathering additional metrics to enable deeper analysis.`;
  }

  const topDrivers = evidenceCitations.slice(0, 3);
  const driverList = topDrivers
    .map((e, i) => `(${i + 1}) ${e.relevance}: "${e.responseValue}"`)
    .join('; ');

  const outcomeText = tier === 'Excellence' || tier === 'Proficiency'
    ? 'established capabilities that can be leveraged for growth'
    : 'specific areas where targeted investment would yield improvement';

  return `${companyName}'s ${dimension.name} performance is primarily driven by: ${driverList}. ` +
         `These assessment responses indicate ${outcomeText}.`;
}

/**
 * Generate business impact statement
 */
function generateBusinessImpactStatement(
  dimension: ReportDimension,
  companyName: string,
  industry: string
): string {
  const tier = getTierFromScore(dimension.score);

  const impactTemplates: Record<FindingTier, string[]> = {
    Excellence: [
      `This strength positions ${companyName} to capture market share from competitors lagging in ${dimension.name}.`,
      `Maintaining excellence in ${dimension.name} provides sustainable competitive advantage in the ${industry} sector.`,
    ],
    Proficiency: [
      `Current ${dimension.name} performance supports growth but incremental improvement could unlock additional value.`,
      `Targeted enhancement of ${dimension.name} could elevate ${companyName} from competitive to industry-leading.`,
    ],
    Attention: [
      `${dimension.name} gaps may be limiting revenue growth and operational efficiency.`,
      `Addressing ${dimension.name} weaknesses could prevent customer attrition and margin erosion.`,
    ],
    Critical: [
      `Critical ${dimension.name} deficiencies pose material risk to business continuity and growth.`,
      `Urgent remediation of ${dimension.name} is required to protect ${companyName}'s market position.`,
    ],
  };

  const templates = impactTemplates[tier];
  // Use dimension score to pick template deterministically
  return templates[dimension.score % templates.length];
}

/**
 * Generate enhanced finding from dimension
 */
export function generateEnhancedFinding(
  dimension: ReportDimension,
  ctx: ReportContext,
  benchmarkData?: Record<string, { industryMedian: number }>
): EnhancedFinding {
  const companyName = safeStringValue(ctx.companyProfile?.name, 'The Company');
  const industry = safeStringValue(ctx.companyProfile?.industry, 'Business Services');
  const score = safeScore(dimension.score, 50);

  // Get or default benchmark
  const benchmark = benchmarkData?.[dimension.code] || { industryMedian: 50 };
  const gap = score - benchmark.industryMedian;

  // Build evidence citations from sub-indicators
  const evidenceCitations: EvidenceCitation[] = safeArray(dimension.subIndicators)
    .slice(0, 4)
    .map(sub => ({
      questionId: sub.id,
      questionText: safeStringValue(sub.name, 'Sub-indicator'),
      responseValue: `${safeScore(sub.score, 0)}/100`,
      relevance: `${sub.name} contributes to overall ${dimension.name} score`,
    }));

  // Generate narrative components
  const currentState = generateCurrentStateNarrative(dimension, benchmark, companyName, industry);
  const driverAnalysis = generateDriverAnalysis(dimension, evidenceCitations, companyName);
  const businessImpact = generateBusinessImpactStatement(dimension, companyName, industry);

  return {
    id: dimension.id,
    title: safeStringValue(dimension.name, 'Finding'),
    categoryCode: dimension.code,
    categoryName: safeStringValue(dimension.name, 'Category'),
    score,
    tier: getTierFromScore(score),
    narrative: {
      currentState,
      driverAnalysis,
      businessImpact,
      evidenceCitations,
    },
    benchmark: {
      industryMedian: benchmark.industryMedian,
      companyPosition: score > benchmark.industryMedian
        ? 'Above Average'
        : score < benchmark.industryMedian
          ? 'Below Average'
          : 'At Median',
      gap: Math.abs(gap),
      gapDirection: gap > 0 ? 'above' : gap < 0 ? 'below' : 'at',
    },
    relatedCategories: [], // Could be populated from cross-category insights
  };
}

/**
 * Render enhanced finding card HTML
 */
export function renderEnhancedFindingCard(finding: EnhancedFinding): string {
  const tierConfig = getTierConfig(finding.tier);

  return `
    <div class="finding-card enhanced" style="
      background: ${tierConfig.bg};
      border-left: 4px solid ${tierConfig.border};
      padding: 20px;
      margin: 16px 0;
      border-radius: 8px;
      page-break-inside: avoid;
    ">
      <!-- Header with Score Badge -->
      <div class="finding-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="
          margin: 0;
          color: #212653;
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
        ">
          <span style="margin-right: 8px;">${tierConfig.icon}</span>
          ${safeHtml(finding.title)}
        </h4>
        <div class="score-badge" style="
          background: ${tierConfig.border};
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: bold;
          font-size: 0.875rem;
        ">${finding.score}/100</div>
      </div>

      <!-- Current State Narrative -->
      <div class="current-state" style="margin-bottom: 16px;">
        <p style="
          margin: 0;
          line-height: 1.6;
          color: #333;
          font-family: 'Open Sans', sans-serif;
          font-size: 0.9rem;
        ">${safeHtml(finding.narrative.currentState)}</p>
      </div>

      <!-- Driver Analysis -->
      <div class="driver-analysis" style="
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(255,255,255,0.7);
        border-radius: 4px;
      ">
        <strong style="color: #212653; font-size: 0.85rem;">What's Driving This:</strong>
        <p style="
          margin: 8px 0 0 0;
          line-height: 1.5;
          color: #555;
          font-size: 0.85rem;
        ">${safeHtml(finding.narrative.driverAnalysis)}</p>
      </div>

      <!-- Business Impact -->
      <div class="business-impact" style="margin-bottom: 16px;">
        <strong style="color: #212653; font-size: 0.85rem;">Business Impact:</strong>
        <p style="
          margin: 8px 0 0 0;
          line-height: 1.5;
          color: #555;
          font-size: 0.85rem;
        ">${safeHtml(finding.narrative.businessImpact)}</p>
      </div>

      <!-- Evidence Citations (Collapsible) -->
      ${finding.narrative.evidenceCitations.length > 0 ? `
        <details class="evidence-citations" style="margin-bottom: 12px;">
          <summary style="
            cursor: pointer;
            color: #969423;
            font-weight: 600;
            font-size: 0.85rem;
          ">View Assessment Evidence (${finding.narrative.evidenceCitations.length} sources)</summary>
          <ul style="
            margin: 8px 0 0 0;
            padding-left: 20px;
            font-size: 0.8rem;
          ">
            ${finding.narrative.evidenceCitations.map(e => `
              <li style="margin: 8px 0; color: #666;">
                <strong>${safeHtml(e.questionId)}:</strong> "${safeHtml(e.questionText)}"
                <br><em style="color: #888;">Response: ${safeHtml(e.responseValue)}</em>
                <br><span style="color: #969423;">${safeHtml(e.relevance)}</span>
              </li>
            `).join('')}
          </ul>
        </details>
      ` : ''}

      <!-- Benchmark Comparison -->
      <div class="benchmark-comparison" style="
        padding: 12px;
        background: #f5f5f5;
        border-radius: 4px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #666; font-size: 0.85rem;">Industry Benchmark:</span>
          <span style="font-weight: bold; color: ${tierConfig.border}; font-size: 0.85rem;">
            ${finding.benchmark.companyPosition}
            (${finding.benchmark.gapDirection === 'above' ? '+' : finding.benchmark.gapDirection === 'below' ? '-' : ''}${finding.benchmark.gap} vs median)
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render enhanced findings section
 */
export function renderEnhancedFindingsSection(
  dimensions: ReportDimension[],
  ctx: ReportContext,
  options: { maxFindings?: number; benchmarkData?: Record<string, { industryMedian: number }> } = {}
): string {
  const { maxFindings = 5, benchmarkData } = options;

  if (dimensions.length === 0) {
    return `
      <div style="
        padding: 24px;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">No findings available for this department.</p>
      </div>
    `;
  }

  // Sort dimensions by score (lowest first for attention areas)
  const sortedDimensions = [...dimensions]
    .sort((a, b) => a.score - b.score)
    .slice(0, maxFindings);

  const enhancedFindings = sortedDimensions.map(dim =>
    generateEnhancedFinding(dim, ctx, benchmarkData)
  );

  return `
    <div class="enhanced-findings-section">
      ${enhancedFindings.map(f => renderEnhancedFindingCard(f)).join('')}
    </div>
  `;
}
