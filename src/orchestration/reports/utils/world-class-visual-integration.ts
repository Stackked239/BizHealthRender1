/**
 * BizHealth World-Class Visual Components Integration Utilities
 *
 * Provides helper functions to convert ReportContext data into the formats
 * expected by the new world-class visual components (Phase 1.5-2).
 *
 * Components integrated:
 * - 12-Dimension Executive Radar
 * - 4-Chapter Benchmark Radar
 * - Enhanced Section Headers with Percentile
 * - Action Plan Cards
 * - Financial Impact Dashboard
 * - Quick Wins Cards
 */

import type { ReportContext } from '../../../types/report.types.js';
import type {
  ExecutiveRadarChartData,
  ChapterRadarData,
  ChapterCode,
} from '../charts/d3/index.js';
import type {
  SectionHeaderConfig,
  FinancialImpactData,
  ActionPlanCard,
  CardPriority,
  CardCategory,
  CardHorizon,
  QuickWinCard,
} from '../components/index.js';
import { normalizeDimensionCode, CANONICAL_DIMENSION_CODES } from '../constants/dimension-codes.js';
import { getDimensionScore, type ScoreLookupResult } from './score-lookup.js';

// ============================================================================
// 12-DIMENSION EXECUTIVE RADAR INTEGRATION
// ============================================================================

/**
 * Map dimension codes to their full configuration
 * NOTE: ITD is the canonical code for IT & Data Security (Phase 1.5+)
 * IDS is included for backward compatibility
 */
const DIMENSION_MAP: Record<string, { fullName: string; chapter: ChapterCode }> = {
  STR: { fullName: 'Strategy', chapter: 'GE' },
  SAL: { fullName: 'Sales', chapter: 'GE' },
  MKT: { fullName: 'Marketing', chapter: 'GE' },
  CXP: { fullName: 'Customer Experience', chapter: 'GE' },
  OPS: { fullName: 'Operations', chapter: 'PH' },
  FIN: { fullName: 'Financial Health', chapter: 'PH' },
  HRS: { fullName: 'Human Resources', chapter: 'PL' },
  LDG: { fullName: 'Leadership & Governance', chapter: 'PL' },
  TIN: { fullName: 'Technology & Innovation', chapter: 'RS' },
  ITD: { fullName: 'IT & Data Security', chapter: 'RS' }, // Canonical code (Phase 1.5+)
  IDS: { fullName: 'IT & Data Security', chapter: 'RS' }, // Legacy alias
  RMS: { fullName: 'Risk Management', chapter: 'RS' },
  CMP: { fullName: 'Compliance', chapter: 'RS' },
};

/**
 * Convert ReportContext to ExecutiveRadarChartData for 12-dimension radar
 * Uses defensive score lookup with alias resolution (ITD/IDS, etc.)
 */
export function contextToExecutiveRadarData(ctx: ReportContext): ExecutiveRadarChartData {
  const companyName = ctx.companyInfo?.name || ctx.metadata?.companyName || 'Company';
  const overallScore = ctx.overallScore ?? ctx.healthScore ?? 50;

  // Determine overall band from score
  let overallBand: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  if (overallScore >= 75) {
    overallBand = 'Excellence';
  } else if (overallScore >= 50) {
    overallBand = 'Proficiency';
  } else if (overallScore >= 25) {
    overallBand = 'Attention';
  } else {
    overallBand = 'Critical';
  }

  // Build a score map from all available sources for defensive lookup
  const scoreMap: Record<string, number> = {};
  const benchmarkMap: Record<string, number> = {};
  const percentileMap: Record<string, number> = {};

  // Extract from ctx.dimensions or ctx.dimensionScores
  const contextDimensions = ctx.dimensions || ctx.dimensionScores || [];
  for (const dim of contextDimensions) {
    const rawCode = dim.code || dim.dimensionCode || dim.id || dim.name?.substring(0, 3).toUpperCase();
    if (rawCode) {
      const normalizedCode = normalizeDimensionCode(rawCode);
      scoreMap[normalizedCode] = dim.score ?? dim.value ?? 50;
      benchmarkMap[normalizedCode] = dim.benchmark ?? dim.industryBenchmark ?? 50;
      percentileMap[normalizedCode] = dim.percentile ?? calculatePercentile(scoreMap[normalizedCode], benchmarkMap[normalizedCode]);
      // Also store original code for alias resolution
      if (rawCode !== normalizedCode) {
        scoreMap[rawCode] = scoreMap[normalizedCode];
        benchmarkMap[rawCode] = benchmarkMap[normalizedCode];
        percentileMap[rawCode] = percentileMap[normalizedCode];
      }
    }
  }

  // Extract from chapters if available
  if (ctx.chapters) {
    for (const chapter of ctx.chapters) {
      const chapterDimensions = chapter.dimensions || [];
      for (const dim of chapterDimensions) {
        const rawCode = dim.code || dim.dimensionCode;
        if (rawCode) {
          const normalizedCode = normalizeDimensionCode(rawCode);
          if (scoreMap[normalizedCode] === undefined) {
            scoreMap[normalizedCode] = dim.score ?? 50;
            benchmarkMap[normalizedCode] = dim.benchmark ?? 50;
            percentileMap[normalizedCode] = dim.percentile ?? calculatePercentile(scoreMap[normalizedCode], benchmarkMap[normalizedCode]);
          }
          // Also store original code for alias resolution
          if (rawCode !== normalizedCode && scoreMap[rawCode] === undefined) {
            scoreMap[rawCode] = scoreMap[normalizedCode];
            benchmarkMap[rawCode] = benchmarkMap[normalizedCode];
            percentileMap[rawCode] = percentileMap[normalizedCode];
          }
        }
      }
    }
  }

  // Build final dimensions using canonical codes with defensive lookup
  // Use CANONICAL_DIMENSION_CODES to ensure we use ITD (not IDS) in output
  const dimensions: ExecutiveRadarChartData['dimensions'] = CANONICAL_DIMENSION_CODES.map(code => {
    // Use defensive lookup that handles alias resolution
    const scoreResult = getDimensionScore(scoreMap, code);

    if (!scoreResult.hasValidData) {
      console.warn(
        `[contextToExecutiveRadarData] Missing score for ${code}. ` +
        `Available: ${Object.keys(scoreMap).join(', ')}`
      );
    }

    return {
      code, // Always use canonical code (ITD, not IDS)
      score: scoreResult.score,
      benchmark: benchmarkMap[scoreResult.resolvedCode] ?? benchmarkMap[code] ?? 50,
      percentile: percentileMap[scoreResult.resolvedCode] ?? percentileMap[code] ??
        calculatePercentile(scoreResult.score, benchmarkMap[scoreResult.resolvedCode] ?? 50),
    };
  });

  return {
    companyName,
    overallScore,
    overallBand,
    dimensions,
  };
}

/**
 * Calculate percentile from score relative to benchmark
 * This is a simple estimation; actual percentile would come from database
 */
function calculatePercentile(score: number, benchmark: number): number {
  const delta = score - benchmark;
  // Simple linear mapping: benchmark = 50th percentile
  // Every 10 points above/below = ~15 percentile points
  const percentile = 50 + delta * 1.5;
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

// ============================================================================
// 4-CHAPTER RADAR INTEGRATION
// ============================================================================

/**
 * Convert ReportContext to ChapterRadarData for 4-chapter radar
 */
export function contextToChapterRadarData(ctx: ReportContext): ChapterRadarData {
  const companyName = ctx.companyInfo?.name || ctx.metadata?.companyName || 'Company';

  const chapterScores = ctx.chapters || ctx.chapterScores || [];
  const chapterCodes: ChapterCode[] = ['GE', 'PH', 'PL', 'RS'];
  const chapterNames: Record<ChapterCode, string> = {
    GE: 'Growth Engine',
    PH: 'Performance & Health',
    PL: 'People & Leadership',
    RS: 'Resilience & Safeguards',
  };

  const chapters: ChapterRadarData['chapters'] = chapterCodes.map(code => {
    // Find matching chapter in context
    const ch = chapterScores.find(
      c =>
        c.code === code ||
        c.chapterCode === code ||
        c.name?.toLowerCase().includes(chapterNames[code].toLowerCase().split(' ')[0])
    );

    return {
      code,
      name: chapterNames[code],
      score: ch?.score ?? ch?.overallScore ?? 50,
      benchmark: ch?.benchmark ?? ch?.industryBenchmark ?? 50,
    };
  });

  return {
    companyName,
    chapters,
  };
}

// ============================================================================
// SECTION HEADER INTEGRATION
// ============================================================================

/**
 * Dimension icon mapping
 */
const DIMENSION_ICONS: Record<string, string> = {
  STR: '🎯',
  SAL: '💰',
  MKT: '📢',
  CXP: '😊',
  OPS: '⚙️',
  FIN: '💵',
  HRS: '👥',
  LDG: '🎖️',
  TIN: '💻',
  IDS: '🖥️',
  RMS: '⚠️',
  CMP: '📋',
};

/**
 * Chapter icon mapping
 */
const CHAPTER_ICONS: Record<string, string> = {
  GE: '🚀',
  PH: '📊',
  PL: '👥',
  RS: '🛡️',
};

/**
 * Create section header config from dimension data
 */
export function dimensionToSectionHeader(
  dimension: {
    code?: string;
    name: string;
    score: number;
    benchmark?: number;
    percentile?: number;
  },
  industryLabel?: string
): SectionHeaderConfig {
  const code = dimension.code || dimension.name.substring(0, 3).toUpperCase();
  const icon = DIMENSION_ICONS[code] || '📋';
  const percentile =
    dimension.percentile ||
    calculatePercentile(dimension.score, dimension.benchmark || 50);

  return {
    icon,
    sectionName: dimension.name,
    sectionCode: code,
    score: dimension.score,
    percentileRank: percentile,
    industryLabel,
  };
}

/**
 * Create section header config from chapter data
 */
export function chapterToSectionHeader(
  chapter: {
    code?: string;
    name: string;
    score: number;
    benchmark?: number;
    percentile?: number;
  },
  industryLabel?: string
): SectionHeaderConfig {
  const code = chapter.code || chapter.name.substring(0, 2).toUpperCase();
  const icon = CHAPTER_ICONS[code] || '📊';
  const percentile =
    chapter.percentile || calculatePercentile(chapter.score, chapter.benchmark || 50);

  return {
    icon,
    sectionName: chapter.name,
    sectionCode: code,
    score: chapter.score,
    percentileRank: percentile,
    industryLabel,
  };
}

// ============================================================================
// FINANCIAL IMPACT DASHBOARD INTEGRATION
// ============================================================================

/**
 * Convert ReportContext to FinancialImpactData
 */
export function contextToFinancialImpactData(ctx: ReportContext): FinancialImpactData {
  const companyName = ctx.companyInfo?.name || ctx.metadata?.companyName || 'Company';

  // Extract financial data from various possible locations
  const financialMetrics = ctx.financialMetrics || ctx.financial || {};
  const recommendations = ctx.recommendations || [];

  // Calculate investment totals from recommendations
  let investmentMin = 0;
  let investmentMax = 0;
  let opportunityMin = 0;
  let opportunityMax = 0;

  for (const rec of recommendations) {
    const inv = rec.investment || rec.estimatedInvestment || {};
    const ret = rec.expectedReturn || rec.estimatedReturn || {};

    investmentMin += inv.min || inv.low || 0;
    investmentMax += inv.max || inv.high || inv.min || inv.low || 0;
    opportunityMin += ret.min || ret.low || 0;
    opportunityMax += ret.max || ret.high || ret.min || ret.low || 0;
  }

  // Fallback to financial metrics if no recommendation data
  if (investmentMin === 0 && financialMetrics.totalInvestment) {
    investmentMin = financialMetrics.totalInvestment.min || financialMetrics.totalInvestment * 0.8;
    investmentMax = financialMetrics.totalInvestment.max || financialMetrics.totalInvestment * 1.2;
  }

  if (opportunityMin === 0 && financialMetrics.totalOpportunity) {
    opportunityMin = financialMetrics.totalOpportunity.min || financialMetrics.totalOpportunity * 0.8;
    opportunityMax = financialMetrics.totalOpportunity.max || financialMetrics.totalOpportunity * 1.2;
  }

  // Get current revenue
  const currentRevenue =
    financialMetrics.currentRevenue ||
    financialMetrics.annualRevenue ||
    ctx.companyInfo?.revenue ||
    0;

  // Calculate projected revenue
  const growthRate = (opportunityMin + opportunityMax) / 2 / (currentRevenue || 1);
  const projectedRevenueMin = currentRevenue + opportunityMin;
  const projectedRevenueMax = currentRevenue + opportunityMax;

  // Implementation months from roadmap
  const roadmap = ctx.roadmap || ctx.implementationRoadmap || [];
  const implementationMonths =
    roadmap.length > 0 ? (roadmap.length * 3) : financialMetrics.implementationMonths || 12;

  return {
    companyName,
    currentRevenue: currentRevenue || 1000000,
    opportunityValueMin: opportunityMin || 100000,
    opportunityValueMax: opportunityMax || 200000,
    investmentMin: investmentMin || 25000,
    investmentMax: investmentMax || 50000,
    projectedRevenueMin: projectedRevenueMin || 1100000,
    projectedRevenueMax: projectedRevenueMax || 1200000,
    implementationMonths: implementationMonths,
  };
}

// ============================================================================
// ACTION PLAN CARDS INTEGRATION
// ============================================================================

/**
 * Map priority string to CardPriority type
 */
function mapPriority(priority: string | number | undefined): CardPriority {
  if (typeof priority === 'number') {
    if (priority >= 4) return 'critical';
    if (priority >= 3) return 'high';
    if (priority >= 2) return 'medium';
    return 'low';
  }

  const p = (priority || '').toLowerCase();
  if (p.includes('critical') || p === 'p1' || p === '1') return 'critical';
  if (p.includes('high') || p === 'p2' || p === '2') return 'high';
  if (p.includes('medium') || p.includes('moderate') || p === 'p3' || p === '3') return 'medium';
  return 'low';
}

/**
 * Map category string to CardCategory type
 */
function mapCategory(
  category: string | undefined,
  dimensionCode?: string
): CardCategory {
  if (category) {
    const c = category.toLowerCase();
    if (c.includes('people') || c.includes('hr')) return 'People';
    if (c.includes('ops') || c.includes('operations')) return 'Operations';
    if (c.includes('fin')) return 'Finance';
    if (c.includes('market')) return 'Marketing';
    if (c.includes('tech')) return 'Technology';
    if (c.includes('govern') || c.includes('compliance')) return 'Governance';
    if (c.includes('strat')) return 'Strategy';
    if (c.includes('sales')) return 'Sales';
    if (c.includes('custom')) return 'Customer';
    if (c.includes('risk')) return 'Risk';
  }

  // Map from dimension code
  if (dimensionCode) {
    const dimMap: Record<string, CardCategory> = {
      STR: 'Strategy',
      SAL: 'Sales',
      MKT: 'Marketing',
      CXP: 'Customer',
      OPS: 'Operations',
      FIN: 'Finance',
      HRS: 'People',
      LDG: 'Governance',
      TIN: 'Technology',
      IDS: 'Technology',
      RMS: 'Risk',
      CMP: 'Governance',
    };
    return dimMap[dimensionCode] || 'Operations';
  }

  return 'Operations';
}

/**
 * Map horizon/timeline to CardHorizon type
 */
function mapHorizon(timeline: string | number | undefined): CardHorizon {
  if (typeof timeline === 'number') {
    if (timeline <= 30) return '30-day';
    if (timeline <= 90) return '90-day';
    if (timeline <= 180) return '6-month';
    if (timeline <= 365) return '12-month';
    return '18-month';
  }

  const t = (timeline || '').toLowerCase();
  if (t.includes('immediate') || t.includes('30') || t.includes('month 1')) return '30-day';
  if (t.includes('90') || t.includes('quarter') || t.includes('q1')) return '90-day';
  if (t.includes('6') || t.includes('half')) return '6-month';
  if (t.includes('year') || t.includes('12') || t.includes('annual')) return '12-month';
  return '18-month';
}

/**
 * Convert recommendations from ReportContext to ActionPlanCard format
 */
export function contextToActionPlanCards(
  ctx: ReportContext
): ActionPlanCard[] {
  const recommendations = ctx.recommendations || [];

  return recommendations.map((rec, index) => {
    const investment = rec.investment || rec.estimatedInvestment || { min: 0, max: 0 };
    const returns = rec.expectedReturn || rec.estimatedReturn || { min: 0, max: 0 };

    const invMin = investment.min || investment.low || 0;
    const invMax = investment.max || investment.high || invMin;
    const retMin = returns.min || returns.low || 0;
    const retMax = returns.max || returns.high || retMin;

    const avgInv = (invMin + invMax) / 2 || 1;
    const avgRet = (retMin + retMax) / 2;
    const roi = avgRet / avgInv;
    const paybackMonths = Math.ceil(avgInv / (avgRet / 12)) || 12;

    // Extract action steps
    const actionSteps = (rec.actionSteps || rec.steps || []).map(
      (step: any, stepIndex: number) => ({
        step: stepIndex + 1,
        title: step.title || step.action || step.description || `Step ${stepIndex + 1}`,
        timeline: step.timeline || step.duration || 'TBD',
        description: step.description || step.details,
      })
    );

    // If no steps, create default from description
    if (actionSteps.length === 0 && rec.description) {
      actionSteps.push({
        step: 1,
        title: 'Implement recommendation',
        timeline: 'As scheduled',
        description: rec.description,
      });
    }

    return {
      id: rec.id || `rec-${index + 1}`,
      title: rec.title || rec.name || `Recommendation ${index + 1}`,
      description: rec.summary || rec.description || '',
      priority: mapPriority(rec.priority),
      category: mapCategory(rec.category, rec.dimensionCode),
      horizon: mapHorizon(rec.timeline || rec.horizon),
      investment: { min: invMin, max: invMax },
      expectedReturn: { min: retMin, max: retMax },
      roi: roi || 1,
      paybackMonths: paybackMonths,
      owner: rec.owner || rec.responsibleParty || 'TBD',
      whyItMatters: rec.rationale || rec.whyItMatters,
      whatWeFound: rec.finding || rec.whatWeFound,
      actionSteps,
      successCriteria: rec.successCriteria || rec.kpis || [],
      riskOfInaction: rec.riskOfInaction || rec.consequences,
      linkedDimension: rec.dimensionCode || rec.dimension,
      linkedFinding: rec.findingId,
      comprehensiveReportPage: rec.pageNumber,
    };
  });
}

// ============================================================================
// QUICK WINS CARDS INTEGRATION
// ============================================================================

/**
 * Convert quick wins from ReportContext to QuickWinCard format
 * ENHANCED: Uses buildQuickWinCardData for better data extraction
 */
export function contextToQuickWinCards(ctx: ReportContext): QuickWinCard[] {
  // Import buildQuickWinCardData dynamically to avoid circular dependency
  const { buildQuickWinCardData } = require('./idm-extractors.js');

  // Get quick wins from various possible sources
  const quickWins =
    ctx.quickWins ||
    (ctx.recommendations || []).filter(
      (r: any) =>
        r.isQuickWin ||
        r.effort === 'low' ||
        r.effortScore !== undefined && r.effortScore <= 40 ||
        (r.timeline && (r.timeline.includes('90') || r.timeline.includes('immediate') || r.timeline.includes('30')))
    ) ||
    [];

  return quickWins.slice(0, 5).map((qw: any, index: number) => {
    // Use the enhanced buildQuickWinCardData function for proper data extraction
    const cardData = buildQuickWinCardData(qw, index);

    return {
      id: cardData.id,
      title: cardData.title,
      currentState: cardData.currentState,
      targetState: cardData.targetState,
      timeline: cardData.timeframe,
      investment: cardData.investment,
      expectedReturn: cardData.expectedReturn,
      roi: cardData.roi,
      owner: cardData.owner,
      comprehensiveReportPage: cardData.comprehensiveReportPage,
      icon: cardData.icon,
    };
  });
}

/**
 * Format currency range as string
 */
function formatCurrencyRange(min: number, max: number): string {
  const format = (n: number): string => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n.toLocaleString()}`;
  };

  if (min === 0 && max === 0) return 'Minimal';
  if (min === max) return format(min);
  return `${format(min)}-${format(max)}`;
}

/**
 * Get appropriate icon for quick win based on category
 */
function getQuickWinIcon(category?: string): string {
  if (!category) return '⚡';

  const iconMap: Record<string, string> = {
    STR: '🎯',
    SAL: '💰',
    MKT: '📢',
    CXP: '😊',
    OPS: '⚙️',
    FIN: '💵',
    HRS: '👥',
    LDG: '🎖️',
    TIN: '💻',
    IDS: '🔒',
    RMS: '⚠️',
    CMP: '📋',
    strategy: '🎯',
    sales: '💰',
    marketing: '📢',
    customer: '😊',
    operations: '⚙️',
    finance: '💵',
    people: '👥',
    technology: '💻',
    risk: '⚠️',
  };

  return iconMap[category.toLowerCase()] || iconMap[category] || '⚡';
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Generate all world-class visuals for a report context
 */
export function generateWorldClassVisualsBundle(ctx: ReportContext): {
  executiveRadarData: ExecutiveRadarChartData;
  chapterRadarData: ChapterRadarData;
  financialImpactData: FinancialImpactData;
  actionPlanCards: ActionPlanCard[];
  quickWinCards: QuickWinCard[];
} {
  return {
    executiveRadarData: contextToExecutiveRadarData(ctx),
    chapterRadarData: contextToChapterRadarData(ctx),
    financialImpactData: contextToFinancialImpactData(ctx),
    actionPlanCards: contextToActionPlanCards(ctx),
    quickWinCards: contextToQuickWinCards(ctx),
  };
}
