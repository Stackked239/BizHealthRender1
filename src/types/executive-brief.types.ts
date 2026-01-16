/**
 * Executive Brief Enhanced Types
 *
 * Type definitions for the expanded 8-12 page Executive Brief report.
 * These types support the new sections: Benchmark Positioning, Risk Heat Map,
 * Strategic Roadmap, and enhanced Category Dashboard.
 *
 * @version 2.0.0
 * @since December 2025
 */

import type { DimensionCode, ScoreBand, ChapterCode } from './idm.types.js';
import type { ReportContext } from './report.types.js';

// ============================================================================
// BENCHMARK DATA STRUCTURES
// ============================================================================

/**
 * Industry and peer group benchmark data for competitive positioning
 */
export interface BenchmarkData {
  /** Industry average scores by category and overall */
  industryAverage: {
    overall: number;
    categories: Partial<Record<DimensionCode, number>>;
  };

  /** Growth stage/lifecycle average scores */
  growthStageAverage: {
    overall: number;
    categories: Partial<Record<DimensionCode, number>>;
  };

  /** Percentile rankings (1-100) */
  percentileRankings: {
    overall: number;
    categories: Partial<Record<DimensionCode, number>>;
  };

  /** Data source description for transparency */
  dataSource: string; // e.g., "250+ companies in General Services"

  /** Peer group definition */
  peerGroupDefinition?: string;

  /** Sample size for statistical validity */
  sampleSize?: number;

  /** Benchmark last updated date */
  benchmarkDate?: string;
}

// ============================================================================
// ENHANCED CATEGORY INSIGHT
// ============================================================================

/**
 * Enhanced category insight for dashboard display
 * Provides at-a-glance view of each business dimension
 */
export interface CategoryInsight {
  /** Dimension code (STR, SAL, MKT, etc.) */
  code: DimensionCode;

  /** Display name */
  name: string;

  /** Numeric score (0-100) */
  score: number;

  /** Score band classification */
  band: ScoreBand;

  /** One-line status summary (max 80 chars) */
  statusSummary: string;

  /** Key metric from this category (e.g., "Sales conversion: 18%") */
  keyMetric: string;

  /** Benchmark comparison statement (e.g., "vs. 24% industry avg") */
  benchmarkComparison: string;

  /** Strategic relevance/impact statement */
  strategicRelevance: string;

  /** Parent chapter code */
  chapterCode: ChapterCode;

  /** Trend indicator */
  trend?: 'improving' | 'stable' | 'declining';

  /** Percentile vs peers */
  percentile?: number;
}

// ============================================================================
// STRATEGIC RISK STRUCTURES
// ============================================================================

/**
 * Risk category classification
 */
export type RiskCategory = 'FINANCIAL' | 'OPERATIONAL' | 'COMPETITIVE' | 'REGULATORY';

/**
 * Risk likelihood/impact level
 */
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Strategic risk structure for heat map display
 */
export interface StrategicRisk {
  /** Unique risk identifier */
  id: string;

  /** Risk title (short, descriptive) */
  title: string;

  /** Risk category for color coding */
  category: RiskCategory;

  /** Likelihood of occurrence */
  likelihood: RiskLevel;

  /** Impact if risk materializes */
  impact: RiskLevel;

  /** Current mitigation status */
  currentStatus: string;

  /** Management response/action plan */
  managementResponse: string;

  /** Timeline for mitigation */
  timeline: string;

  /** Associated dimension code */
  dimensionCode?: DimensionCode;

  /** Severity score (1-10) */
  severityScore?: number;

  /** Financial exposure estimate */
  financialExposure?: string;
}

// ============================================================================
// STRATEGIC RECOMMENDATION STRUCTURES
// ============================================================================

/**
 * Implementation phase classification
 */
export type ImplementationPhase = 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';

/**
 * Impact/effort level
 */
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Quarter for timeline (1-4)
 */
export type Quarter = 1 | 2 | 3 | 4;

/**
 * Enhanced recommendation for strategic roadmap display
 */
export interface StrategicRecommendation {
  /** Unique recommendation identifier */
  id: string;

  /** Recommendation title */
  title: string;

  /** Associated category */
  category: DimensionCode;

  /** Impact level for prioritization */
  impactLevel: ImpactLevel;

  /** Effort level for planning */
  effortLevel: ImpactLevel;

  /** Implementation timeline description */
  timeline: string;

  /** Investment range (e.g., "$25K-$50K") */
  investmentRange: string;

  /** Expected ROI (e.g., "$150K-$300K annual value") */
  expectedROI: string;

  /** Responsible owner/role (specific, not "Executive Team") */
  owner: string;

  /** Implementation phase */
  phase: ImplementationPhase;

  /** IDs of blocking/dependent recommendations */
  dependencies: string[];

  /** Start quarter (1-4) */
  quarterStart: Quarter;

  /** End quarter (1-4) */
  quarterEnd: Quarter;

  /** Action steps */
  actionSteps?: string[];

  /** Success metrics */
  successMetrics?: string[];

  /** Required capabilities */
  requiredCapabilities?: string[];
}

// ============================================================================
// FINANCIAL OUTLOOK
// ============================================================================

/**
 * Optional financial outlook section for executive brief
 */
export interface FinancialOutlook {
  /** Whether to include in executive report */
  includeInExecutiveReport: boolean;

  /** Revenue trend description */
  revenueTrend: string;

  /** Profitability status */
  profitabilityStatus: string;

  /** Cash position summary */
  cashPosition: string;

  /** Investment needs summary */
  investmentNeeds: string;

  /** Key financial metrics */
  keyMetrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }[];

  /** Financial health score (if available) */
  healthScore?: number;
}

// ============================================================================
// ENHANCED QUICK WIN
// ============================================================================

/**
 * Enhanced quick win with specific ownership and next steps
 */
export interface EnhancedQuickWin {
  /** Quick win title */
  title: string;

  /** Specific owner role (e.g., "Sales Director") */
  owner: string;

  /** Timeline (e.g., "4-6 weeks") */
  timeline: string;

  /** First actionable step */
  firstStep: string;

  /** Impact level */
  impact: ImpactLevel;

  /** Associated dimension */
  dimensionCode?: DimensionCode;

  /** Expected outcome */
  expectedOutcome?: string;

  /** Estimated investment */
  estimatedInvestment?: string;
}

// ============================================================================
// EXECUTIVE BRIEF CONTEXT
// ============================================================================

/**
 * Extended ReportContext for Executive Brief
 * Includes all fields needed for the enhanced 8-12 page report
 */
export interface ExecutiveBriefContext extends ReportContext {
  /** Benchmark data for competitive positioning */
  benchmarks?: BenchmarkData;

  /** Category insights for dashboard */
  categoryInsights: CategoryInsight[];

  /** Strategic risks for heat map */
  strategicRisks: StrategicRisk[];

  /** Strategic recommendations for roadmap */
  strategicRecommendations: StrategicRecommendation[];

  /** Optional financial outlook */
  financialOutlook?: FinancialOutlook;

  /** Enhanced quick wins with specific owners */
  enhancedQuickWins?: EnhancedQuickWin[];
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Validation result for Executive Brief content
 */
export interface ExecutiveBriefValidation {
  /** Overall validity */
  valid: boolean;

  /** List of issues (prefixed with CRITICAL, WARNING, INFO) */
  issues: string[];

  /** Sections that will be rendered */
  sectionsAvailable: string[];

  /** Sections that will show placeholders */
  sectionsWithPlaceholders: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get risk category color
 */
export function getRiskCategoryColor(category: RiskCategory): string {
  const colors: Record<RiskCategory, string> = {
    FINANCIAL: '#dc3545',
    OPERATIONAL: '#fd7e14',
    COMPETITIVE: '#6f42c1',
    REGULATORY: '#20c997',
  };
  return colors[category] || '#6c757d';
}

/**
 * Get risk category short code
 */
export function getRiskCategoryCode(category: RiskCategory): string {
  const codes: Record<RiskCategory, string> = {
    FINANCIAL: 'FIN',
    OPERATIONAL: 'OPS',
    COMPETITIVE: 'CMP',
    REGULATORY: 'REG',
  };
  return codes[category] || '???';
}

/**
 * Calculate risk matrix cell key
 */
export function getRiskMatrixKey(likelihood: RiskLevel, impact: RiskLevel): string {
  return `${likelihood}-${impact}`;
}

/**
 * Get phase display label
 */
export function getPhaseLabel(phase: ImplementationPhase): string {
  const labels: Record<ImplementationPhase, string> = {
    IMMEDIATE: 'Immediate (0-30 days)',
    SHORT_TERM: 'Short-term (1-3 months)',
    MEDIUM_TERM: 'Medium-term (3-6 months)',
    LONG_TERM: 'Long-term (6-12+ months)',
  };
  return labels[phase] || phase;
}

/**
 * Get impact/effort color
 */
export function getImpactLevelColor(level: ImpactLevel): string {
  const colors: Record<ImpactLevel, string> = {
    HIGH: '#dc3545',
    MEDIUM: '#ffc107',
    LOW: '#0d6efd',
  };
  return colors[level] || '#6c757d';
}

/**
 * Calculate percentile interpretation
 */
export function getPercentileInterpretation(percentile: number): string {
  if (percentile >= 90) return 'Top 10% performer - Industry leader position';
  if (percentile >= 75) return 'Strong performer relative to peers';
  if (percentile >= 50) return 'Competitive parity with room for differentiation';
  if (percentile >= 25) return 'Opportunities to close gaps with industry leaders';
  return 'Significant improvement opportunities across multiple dimensions';
}

/**
 * Validate Executive Brief context
 */
export function validateExecutiveBriefContext(
  context: ExecutiveBriefContext
): ExecutiveBriefValidation {
  const issues: string[] = [];
  const sectionsAvailable: string[] = ['cover', 'toc', 'summary'];
  const sectionsWithPlaceholders: string[] = [];

  // Check for strategic recommendations (required for roadmap)
  if (!context.strategicRecommendations?.length) {
    issues.push('CRITICAL: No recommendations available for roadmap');
  } else {
    sectionsAvailable.push('roadmap');
  }

  // Check for strategic risks (optional - will show confidence statement if empty)
  if (!context.strategicRisks?.length) {
    issues.push('INFO: No risks identified - will show confidence statement');
    sectionsWithPlaceholders.push('risks');
  } else {
    sectionsAvailable.push('risks');
  }

  // Check for benchmarks (optional - will show placeholder if missing)
  if (!context.benchmarks) {
    issues.push('WARNING: Benchmark data unavailable - will show placeholder');
    sectionsWithPlaceholders.push('benchmarks');
  } else {
    sectionsAvailable.push('benchmarks');
  }

  // Check for category insights
  if (!context.categoryInsights?.length) {
    issues.push('WARNING: Category insights missing');
    sectionsWithPlaceholders.push('dashboard');
  } else if (!context.categoryInsights.every((c) => c.statusSummary)) {
    issues.push('WARNING: Some categories missing status summaries');
    sectionsAvailable.push('dashboard');
  } else {
    sectionsAvailable.push('dashboard');
  }

  // Check for financial outlook
  if (context.financialOutlook?.includeInExecutiveReport) {
    sectionsAvailable.push('financial');
  }

  // Always include methods & legal
  sectionsAvailable.push('methods', 'legal');

  const hasCriticalIssues = issues.some((i) => i.startsWith('CRITICAL'));

  return {
    valid: !hasCriticalIssues,
    issues,
    sectionsAvailable,
    sectionsWithPlaceholders,
  };
}

/**
 * Transform ReportContext to ExecutiveBriefContext
 * Extracts and enhances data for the executive brief format
 */
export function transformToExecutiveBriefContext(
  ctx: ReportContext
): ExecutiveBriefContext {
  // Transform dimensions to category insights
  const categoryInsights: CategoryInsight[] = ctx.dimensions.map((dim) => ({
    code: dim.code,
    name: dim.name,
    score: dim.score,
    band: dim.band,
    statusSummary: generateStatusSummary(dim),
    keyMetric: extractKeyMetric(dim, ctx),
    // PORTAL-FIX: Pass full dim object and industry for dynamic benchmark comparison (2024-12)
    benchmarkComparison: generateBenchmarkComparison(
      { code: dim.code, score: dim.score, benchmark: dim.benchmark },
      ctx.companyProfile?.industry
    ),
    strategicRelevance: generateStrategicRelevance(dim, ctx),
    chapterCode: dim.chapterCode,
    trend: extractTrend(dim),
    percentile: dim.benchmark?.peerPercentile,
  }));

  // Transform risks to strategic risks
  const strategicRisks: StrategicRisk[] = ctx.risks
    .filter((r) => {
      const severity =
        typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
      return severity >= 5; // Only include moderate+ risks
    })
    .slice(0, 7) // Top 7 risks
    .map((risk) => ({
      id: risk.id,
      title: risk.narrative?.substring(0, 60) || 'Risk identified',
      category: mapRiskCategory(risk.category),
      likelihood: mapRiskLevel(risk.likelihood),
      impact: mapSeverityToImpact(risk.severity),
      currentStatus: 'Under assessment',
      managementResponse: risk.mitigationSummary || 'Response plan in development',
      timeline: 'TBD',
      dimensionCode: risk.dimensionCode,
    }));

  // Transform recommendations to strategic recommendations
  const strategicRecommendations: StrategicRecommendation[] = ctx.recommendations
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .slice(0, 10) // Top 10 recommendations
    .map((rec, index) => ({
      id: rec.id,
      title: rec.theme,
      category: rec.dimensionCode,
      impactLevel: mapScoreToLevel(rec.impactScore),
      effortLevel: mapScoreToLevel(rec.effortScore),
      timeline: rec.horizonLabel,
      investmentRange: estimateInvestment(rec),
      expectedROI: estimateROI(rec),
      owner: mapDimensionToOwner(rec.dimensionCode),
      phase: mapHorizonToPhase(rec.horizon),
      dependencies: [],
      quarterStart: mapHorizonToQuarterStart(rec.horizon),
      quarterEnd: mapHorizonToQuarterEnd(rec.horizon),
      actionSteps: rec.actionSteps,
    }));

  // Transform quick wins to enhanced quick wins
  const enhancedQuickWins: EnhancedQuickWin[] = ctx.quickWins.slice(0, 5).map((qw) => ({
    title: qw.theme,
    owner: mapDimensionToOwner(qw.id.split('-')[0] as DimensionCode),
    timeline: qw.timeframe || '4-6 weeks',
    firstStep: qw.actionSteps?.[0] || 'Begin implementation planning',
    impact: mapScoreToLevel(qw.impactScore),
    expectedOutcome: qw.expectedOutcomes,
  }));

  return {
    ...ctx,
    categoryInsights,
    strategicRisks,
    strategicRecommendations,
    enhancedQuickWins,
  };
}

// Helper functions for transformation

function generateStatusSummary(dim: { name: string; score: number; band: string }): string {
  const bandDescriptions: Record<string, string> = {
    Excellence: 'performing strongly',
    Proficiency: 'operating effectively',
    Attention: 'needs improvement',
    Critical: 'requires urgent attention',
  };
  return `${dim.name} is ${bandDescriptions[dim.band] || 'under assessment'}`;
}

function extractKeyMetric(
  dim: { code: DimensionCode },
  _ctx: ReportContext
): string {
  // Default metrics by dimension
  const defaultMetrics: Partial<Record<DimensionCode, string>> = {
    SAL: 'Pipeline coverage ratio',
    MKT: 'Marketing ROI',
    CXP: 'NPS Score',
    OPS: 'Process efficiency',
    FIN: 'Profit margin',
    HRS: 'Employee engagement',
  };
  return defaultMetrics[dim.code] || 'Key indicator';
}

/**
 * Generate benchmark comparison text for a dimension
 * PORTAL-FIX: Now uses industry benchmark defaults when dynamic data unavailable (2024-12)
 */
function generateBenchmarkComparison(dim: {
  code: DimensionCode;
  score: number;
  benchmark?: { peerPercentile: number };
}, industry?: string): string {
  // If we have dynamic benchmark data, use it
  if (dim.benchmark && dim.benchmark.peerPercentile) {
    const percentile = dim.benchmark.peerPercentile;
    if (percentile >= 75) return `Top quartile (${percentile}th pctl)`;
    if (percentile >= 50) return `Above median (${percentile}th pctl)`;
    if (percentile >= 25) return `Below median (${percentile}th pctl)`;
    return `Bottom quartile (${percentile}th pctl)`;
  }

  // PORTAL-FIX: Fall back to industry benchmark defaults
  // Import dynamically to avoid circular dependency
  const industryBenchmarks = getIndustryBenchmarkDefaults();
  const industryKey = getIndustryKeyFromName(industry);
  const industryData = industryBenchmarks[industryKey] || industryBenchmarks['default'];
  const categoryBenchmark = industryData?.categories?.[dim.code];

  if (categoryBenchmark) {
    const benchmark = categoryBenchmark.benchmark;
    const delta = dim.score - benchmark;

    if (delta > 5) {
      return `+${delta} above avg`;
    } else if (delta < -5) {
      return `${delta} below avg`;
    } else {
      return 'At benchmark';
    }
  }

  // Final fallback using generic calculation
  const defaultBenchmark = 60;
  const delta = dim.score - defaultBenchmark;
  if (delta > 5) return `+${delta} above avg`;
  if (delta < -5) return `${delta} below avg`;
  return 'At benchmark';
}

/**
 * Helper to get industry benchmarks without circular import
 * PORTAL-FIX: Inline benchmark defaults for transformation layer (2024-12)
 */
function getIndustryBenchmarkDefaults(): Record<string, { categories: Record<string, { benchmark: number }> }> {
  return {
    'legal-services': {
      categories: {
        STR: { benchmark: 62 }, SAL: { benchmark: 70 }, MKT: { benchmark: 65 }, CXP: { benchmark: 80 },
        OPS: { benchmark: 75 }, FIN: { benchmark: 70 }, HRS: { benchmark: 68 }, LDG: { benchmark: 65 },
        TIN: { benchmark: 50 }, ITD: { benchmark: 52 }, RMS: { benchmark: 82 }, CMP: { benchmark: 90 },
      }
    },
    'healthcare': {
      categories: {
        STR: { benchmark: 65 }, SAL: { benchmark: 60 }, MKT: { benchmark: 55 }, CXP: { benchmark: 75 },
        OPS: { benchmark: 70 }, FIN: { benchmark: 65 }, HRS: { benchmark: 70 }, LDG: { benchmark: 68 },
        TIN: { benchmark: 58 }, ITD: { benchmark: 62 }, RMS: { benchmark: 78 }, CMP: { benchmark: 88 },
      }
    },
    'default': {
      categories: {
        STR: { benchmark: 60 }, SAL: { benchmark: 65 }, MKT: { benchmark: 60 }, CXP: { benchmark: 70 },
        OPS: { benchmark: 65 }, FIN: { benchmark: 65 }, HRS: { benchmark: 62 }, LDG: { benchmark: 60 },
        TIN: { benchmark: 55 }, ITD: { benchmark: 55 }, RMS: { benchmark: 70 }, CMP: { benchmark: 75 },
      }
    }
  };
}

/**
 * Helper to get industry key from name
 * PORTAL-FIX: Maps industry names to lookup keys (2024-12)
 */
function getIndustryKeyFromName(industry?: string): string {
  if (!industry) return 'default';
  const normalized = industry.toLowerCase();
  if (normalized.includes('legal') || normalized.includes('law')) return 'legal-services';
  if (normalized.includes('health') || normalized.includes('medical')) return 'healthcare';
  return 'default';
}

function generateStrategicRelevance(
  dim: { code: DimensionCode; score: number },
  ctx: ReportContext
): string {
  const relevance = ctx.recommendations.filter((r) => r.dimensionCode === dim.code).length;
  if (relevance > 2) return 'Critical focus area';
  if (relevance > 0) return 'Improvement opportunity';
  if (dim.score >= 80) return 'Competitive advantage';
  return 'Monitor and maintain';
}

function extractTrend(dim: { benchmark?: unknown }): 'improving' | 'stable' | 'declining' {
  // Default to stable if no trend data
  return 'stable';
}

function mapRiskCategory(category?: string): RiskCategory {
  if (!category) return 'OPERATIONAL';
  const upper = category.toUpperCase();
  if (upper.includes('FINANC')) return 'FINANCIAL';
  if (upper.includes('COMPET') || upper.includes('MARKET')) return 'COMPETITIVE';
  if (upper.includes('REGUL') || upper.includes('COMPLI')) return 'REGULATORY';
  return 'OPERATIONAL';
}

function mapRiskLevel(level: string | number | undefined): RiskLevel {
  if (typeof level === 'number') {
    if (level >= 7) return 'HIGH';
    if (level >= 4) return 'MEDIUM';
    return 'LOW';
  }
  const str = String(level || '').toUpperCase();
  if (str.includes('HIGH') || str.includes('CRITICAL')) return 'HIGH';
  if (str.includes('MED')) return 'MEDIUM';
  return 'LOW';
}

function mapSeverityToImpact(severity: string | number): RiskLevel {
  const num = typeof severity === 'number' ? severity : parseInt(String(severity)) || 5;
  if (num >= 7) return 'HIGH';
  if (num >= 4) return 'MEDIUM';
  return 'LOW';
}

function mapScoreToLevel(score: number): ImpactLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function mapHorizonToPhase(horizon: string): ImplementationPhase {
  if (horizon === '90_days') return 'IMMEDIATE';
  if (horizon === '12_months') return 'SHORT_TERM';
  return 'MEDIUM_TERM';
}

function mapHorizonToQuarterStart(horizon: string): Quarter {
  if (horizon === '90_days') return 1;
  if (horizon === '12_months') return 2;
  return 3;
}

function mapHorizonToQuarterEnd(horizon: string): Quarter {
  if (horizon === '90_days') return 1;
  if (horizon === '12_months') return 3;
  return 4;
}

function estimateInvestment(rec: { impactScore: number; effortScore: number }): string {
  const base = rec.effortScore * 1000;
  const low = Math.round(base * 0.8 / 1000) * 1000;
  const high = Math.round(base * 1.5 / 1000) * 1000;
  return `$${formatCompact(low)}-$${formatCompact(high)}`;
}

function estimateROI(rec: { impactScore: number; effortScore: number }): string {
  const base = rec.impactScore * 5000;
  const low = Math.round(base * 0.8 / 1000) * 1000;
  const high = Math.round(base * 2 / 1000) * 1000;
  return `$${formatCompact(low)}-$${formatCompact(high)} annual`;
}

function formatCompact(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return String(num);
}

function mapDimensionToOwner(dimCode: DimensionCode | string): string {
  const owners: Partial<Record<DimensionCode, string>> = {
    STR: 'CEO/Strategy Lead',
    SAL: 'Sales Director',
    MKT: 'Marketing Director',
    CXP: 'Customer Success Lead',
    OPS: 'Operations Director',
    FIN: 'CFO/Finance Director',
    HRS: 'HR Director',
    LDG: 'CEO/Board',
    TIN: 'CTO/IT Director',
    ITD: 'IT Director',
    RMS: 'Risk Manager',
    CMP: 'Compliance Officer',
  };
  return owners[dimCode as DimensionCode] || 'Executive Team';
}
