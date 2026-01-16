/**
 * Dimension Filter Utilities for Manager Reports
 *
 * Provides utilities for filtering IDM data by dimension codes,
 * manager types, and creating department-specific report content.
 *
 * @module dimension-filters
 */

import type {
  DimensionCode,
  ChapterCode,
} from '../../../types/idm.types.js';
import type {
  ReportContext,
  ReportDimension,
  ReportFinding,
  ReportRecommendation,
  ReportQuickWin,
  ReportRisk,
  ReportRoadmapPhase,
} from '../../../types/report.types.js';
import {
  safeArray,
  safeStringValue,
  safeScore,
} from './safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Manager type identifiers
 */
export type ManagerType =
  | 'operations'
  | 'salesMarketing'
  | 'financials'
  | 'strategy'
  | 'itTechnology'
  | 'employees';

/**
 * Filtered department data bundle
 */
export interface DepartmentData {
  managerType: ManagerType;
  dimensionCodes: DimensionCode[];
  chapterCodes: ChapterCode[];
  dimensions: ReportDimension[];
  findings: ReportFinding[];
  recommendations: ReportRecommendation[];
  quickWins: ReportQuickWin[];
  risks: ReportRisk[];
  roadmapPhases: ReportRoadmapPhase[];
  departmentScore: number;
  departmentBand: string;
}

// ============================================================================
// MANAGER-DIMENSION MAPPINGS
// ============================================================================

/**
 * Dimension codes relevant to each manager type
 * These determine which areas of the business each manager report focuses on
 */
// NOTE: Using ITD (canonical code for Phase 1.5+) for IT & Data dimension
export const MANAGER_DIMENSIONS: Record<ManagerType, DimensionCode[]> = {
  operations: ['OPS', 'TIN'],
  salesMarketing: ['STR', 'SAL', 'MKT', 'CXP'],
  financials: ['FIN', 'RMS', 'CMP'],
  strategy: ['STR', 'LDG', 'RMS'],
  itTechnology: ['TIN', 'ITD', 'RMS'],
  employees: ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'],
};

/**
 * Dimension to chapter mapping
 */
export const DIMENSION_CHAPTER_MAP: Record<DimensionCode, ChapterCode> = {
  STR: 'GE',
  SAL: 'GE',
  MKT: 'GE',
  CXP: 'GE',
  OPS: 'PH',
  FIN: 'PH',
  HRS: 'PL',
  LDG: 'PL',
  TIN: 'RS',
  ITD: 'RS', // Canonical code for Phase 1.5+
  IDS: 'RS', // Legacy alias
  RMS: 'RS',
  CMP: 'RS',
};

/**
 * Manager type display names
 */
export const MANAGER_TITLES: Record<ManagerType, string> = {
  operations: 'Operations',
  salesMarketing: 'Sales & Marketing',
  financials: 'Finance & Compliance',
  strategy: 'Strategy & Leadership',
  itTechnology: 'IT & Technology',
  employees: 'All Staff',
};

/**
 * Dimension keywords for fuzzy matching
 * Used when items don't have explicit dimension codes
 */
export const DIMENSION_KEYWORDS: Record<DimensionCode, string[]> = {
  STR: ['strategy', 'strategic', 'vision', 'planning', 'mission', 'goals', 'objectives'],
  SAL: ['sales', 'revenue', 'pipeline', 'deals', 'conversion', 'closing', 'prospects'],
  MKT: ['marketing', 'brand', 'campaign', 'awareness', 'leads', 'advertising', 'promotion'],
  CXP: ['customer', 'experience', 'satisfaction', 'nps', 'retention', 'loyalty', 'service'],
  OPS: ['operations', 'efficiency', 'process', 'workflow', 'productivity', 'supply chain'],
  FIN: ['financial', 'finance', 'budget', 'cost', 'profit', 'revenue', 'cash flow', 'accounting'],
  HRS: ['hr', 'human resources', 'employee', 'talent', 'hiring', 'recruitment', 'culture'],
  LDG: ['leadership', 'governance', 'management', 'decision', 'executive', 'board'],
  TIN: ['technology', 'innovation', 'digital', 'automation', 'transformation', 'ai'],
  ITD: ['it', 'data', 'security', 'systems', 'infrastructure', 'cyber', 'network'], // Canonical
  IDS: ['it', 'data', 'security', 'systems', 'infrastructure', 'cyber', 'network'], // Legacy alias
  RMS: ['risk', 'sustainability', 'compliance', 'mitigation', 'continuity', 'resilience'],
  CMP: ['compliance', 'regulatory', 'legal', 'audit', 'policy', 'governance', 'ethics'],
};

// ============================================================================
// DIMENSION RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get dimensions for a specific manager type
 */
export function getDimensionsForManager(
  ctx: ReportContext,
  managerType: ManagerType
): ReportDimension[] {
  const relevantCodes = MANAGER_DIMENSIONS[managerType] || [];
  const dimensions = safeArray(ctx.dimensions);

  return dimensions.filter(dim =>
    relevantCodes.includes(dim.code as DimensionCode)
  );
}

/**
 * Get dimensions by specific dimension codes
 */
export function getDimensionsByCodes(
  ctx: ReportContext,
  codes: DimensionCode[]
): ReportDimension[] {
  const dimensions = safeArray(ctx.dimensions);
  return dimensions.filter(dim => codes.includes(dim.code as DimensionCode));
}

/**
 * Get a single dimension by code
 */
export function getDimensionByCode(
  ctx: ReportContext,
  code: DimensionCode
): ReportDimension | null {
  const dimensions = safeArray(ctx.dimensions);
  return dimensions.find(dim => dim.code === code) || null;
}

/**
 * Get chapter codes for a set of dimension codes
 */
export function getChapterCodesForDimensions(
  dimensionCodes: DimensionCode[]
): ChapterCode[] {
  const chapters = new Set<ChapterCode>();

  for (const dimCode of dimensionCodes) {
    const chapter = DIMENSION_CHAPTER_MAP[dimCode];
    if (chapter) {
      chapters.add(chapter);
    }
  }

  return Array.from(chapters);
}

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Check if text matches any dimension keywords
 */
function matchesDimensionKeywords(
  text: string,
  dimensionCodes: DimensionCode[]
): boolean {
  if (!text) return false;
  const searchText = text.toLowerCase();

  for (const code of dimensionCodes) {
    // Direct code match
    if (searchText.includes(code.toLowerCase())) {
      return true;
    }

    // Keyword match
    const keywords = DIMENSION_KEYWORDS[code] || [];
    if (keywords.some(kw => searchText.includes(kw))) {
      return true;
    }
  }

  return false;
}

/**
 * Filter findings by dimension codes
 */
export function filterFindingsByDimensions(
  findings: ReportFinding[] | undefined,
  dimensionCodes: DimensionCode[]
): ReportFinding[] {
  const items = safeArray(findings);

  return items.filter(finding => {
    // Direct dimension code match
    if (dimensionCodes.includes(finding.dimensionCode)) {
      return true;
    }

    // Fuzzy match by keywords
    const searchText = `${safeStringValue(finding.shortLabel, '')} ${safeStringValue(finding.narrative, '')}`;
    return matchesDimensionKeywords(searchText, dimensionCodes);
  });
}

/**
 * Filter recommendations by dimension codes
 */
export function filterRecommendationsByDimensions(
  recommendations: ReportRecommendation[] | undefined,
  dimensionCodes: DimensionCode[]
): ReportRecommendation[] {
  const items = safeArray(recommendations);

  return items.filter(rec => {
    // Direct dimension code match
    if (dimensionCodes.includes(rec.dimensionCode)) {
      return true;
    }

    // Fuzzy match by keywords
    const searchText = `${safeStringValue(rec.theme, '')} ${safeStringValue(rec.expectedOutcomes, '')}`;
    return matchesDimensionKeywords(searchText, dimensionCodes);
  });
}

/**
 * Filter quick wins by dimension codes
 */
export function filterQuickWinsByDimensions(
  quickWins: ReportQuickWin[] | undefined,
  dimensionCodes: DimensionCode[],
  ctx?: ReportContext
): ReportQuickWin[] {
  const items = safeArray(quickWins);

  return items.filter(qw => {
    // Try to find the linked recommendation for dimension info
    if (ctx) {
      const rec = ctx.recommendations.find(r => r.id === qw.recommendationId);
      if (rec && dimensionCodes.includes(rec.dimensionCode)) {
        return true;
      }
    }

    // Fuzzy match by keywords in theme and outcomes
    const searchText = `${safeStringValue(qw.theme, '')} ${safeStringValue(qw.expectedOutcomes, '')}`;
    return matchesDimensionKeywords(searchText, dimensionCodes);
  });
}

/**
 * Filter risks by dimension codes
 */
export function filterRisksByDimensions(
  risks: ReportRisk[] | undefined,
  dimensionCodes: DimensionCode[]
): ReportRisk[] {
  const items = safeArray(risks);

  return items.filter(risk => {
    // Direct dimension code match
    if (dimensionCodes.includes(risk.dimensionCode)) {
      return true;
    }

    // Fuzzy match by keywords
    const searchText = `${safeStringValue(risk.narrative, '')} ${safeStringValue(risk.category || '', '')}`;
    return matchesDimensionKeywords(searchText, dimensionCodes);
  });
}

/**
 * Filter roadmap phases by dimension codes
 * Filters phases to only include items relevant to the specified dimensions
 */
export function filterRoadmapByDimensions(
  phases: ReportRoadmapPhase[] | undefined,
  dimensionCodes: DimensionCode[],
  ctx?: ReportContext
): ReportRoadmapPhase[] {
  const items = safeArray(phases);

  return items.map(phase => {
    // Filter linked recommendations to only include relevant ones
    const relevantRecIds = phase.linkedRecommendationIds?.filter(recId => {
      if (!ctx) return true;
      const rec = ctx.recommendations.find(r => r.id === recId);
      if (!rec) return false;

      // Check if recommendation is relevant to dimensions
      if (dimensionCodes.includes(rec.dimensionCode)) {
        return true;
      }

      // Fuzzy match
      const searchText = `${safeStringValue(rec.theme, '')} ${safeStringValue(rec.expectedOutcomes, '')}`;
      return matchesDimensionKeywords(searchText, dimensionCodes);
    }) || [];

    return {
      ...phase,
      linkedRecommendationIds: relevantRecIds,
    };
  }).filter(phase => phase.linkedRecommendationIds.length > 0);
}

// ============================================================================
// SCORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate department health score from relevant dimensions
 */
export function calculateDepartmentScore(
  dimensions: ReportDimension[]
): { score: number; band: string } {
  if (dimensions.length === 0) {
    return { score: 0, band: 'Critical' };
  }

  const scores = dimensions.map(d => safeScore(d.score, 0));
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let band: string;
  if (avgScore >= 80) band = 'Excellence';
  else if (avgScore >= 60) band = 'Proficiency';
  else if (avgScore >= 40) band = 'Attention';
  else band = 'Critical';

  return { score: avgScore, band };
}

/**
 * Get the weakest dimension from a set
 */
export function getWeakestDimension(
  dimensions: ReportDimension[]
): ReportDimension | null {
  if (dimensions.length === 0) return null;

  return dimensions.reduce((weakest, current) =>
    (current.score < weakest.score) ? current : weakest
  );
}

/**
 * Get the strongest dimension from a set
 */
export function getStrongestDimension(
  dimensions: ReportDimension[]
): ReportDimension | null {
  if (dimensions.length === 0) return null;

  return dimensions.reduce((strongest, current) =>
    (current.score > strongest.score) ? current : strongest
  );
}

/**
 * Sort dimensions by score
 */
export function sortDimensionsByScore(
  dimensions: ReportDimension[],
  direction: 'asc' | 'desc' = 'desc'
): ReportDimension[] {
  return [...dimensions].sort((a, b) =>
    direction === 'desc' ? b.score - a.score : a.score - b.score
  );
}

// ============================================================================
// AGGREGATE DATA FUNCTIONS
// ============================================================================

/**
 * Get complete filtered department data for a manager type
 * This is the primary function for gathering all department-specific content
 */
export function getDepartmentData(
  ctx: ReportContext,
  managerType: ManagerType
): DepartmentData {
  const dimensionCodes = MANAGER_DIMENSIONS[managerType] || [];
  const chapterCodes = getChapterCodesForDimensions(dimensionCodes);
  const dimensions = getDimensionsForManager(ctx, managerType);
  const { score: departmentScore, band: departmentBand } = calculateDepartmentScore(dimensions);

  return {
    managerType,
    dimensionCodes,
    chapterCodes,
    dimensions,
    findings: filterFindingsByDimensions(ctx.findings, dimensionCodes),
    recommendations: filterRecommendationsByDimensions(ctx.recommendations, dimensionCodes),
    quickWins: filterQuickWinsByDimensions(ctx.quickWins, dimensionCodes, ctx),
    risks: filterRisksByDimensions(ctx.risks, dimensionCodes),
    roadmapPhases: filterRoadmapByDimensions(ctx.roadmap?.phases, dimensionCodes, ctx),
    departmentScore,
    departmentBand,
  };
}

/**
 * Get findings grouped by type for a manager
 */
export function getGroupedFindings(
  findings: ReportFinding[]
): {
  strengths: ReportFinding[];
  gaps: ReportFinding[];
  risks: ReportFinding[];
  opportunities: ReportFinding[];
} {
  return {
    strengths: findings.filter(f => f.type === 'strength'),
    gaps: findings.filter(f => f.type === 'gap'),
    risks: findings.filter(f => f.type === 'risk'),
    opportunities: findings.filter(f => f.type === 'opportunity'),
  };
}

/**
 * Get recommendations grouped by horizon
 */
export function getGroupedRecommendations(
  recommendations: ReportRecommendation[]
): {
  immediate: ReportRecommendation[];
  shortTerm: ReportRecommendation[];
  longTerm: ReportRecommendation[];
} {
  return {
    immediate: recommendations.filter(r => r.horizon === '90_days'),
    shortTerm: recommendations.filter(r => r.horizon === '12_months'),
    longTerm: recommendations.filter(r => r.horizon === '24_months_plus'),
  };
}

/**
 * Get top N items by priority or score
 */
export function getTopItems<T extends { priorityRank?: number; score?: number }>(
  items: T[],
  count: number = 5
): T[] {
  return [...items]
    .sort((a, b) => {
      // Sort by priority rank if available (lower is better)
      if (a.priorityRank !== undefined && b.priorityRank !== undefined) {
        return a.priorityRank - b.priorityRank;
      }
      // Fall back to score (higher is better)
      if (a.score !== undefined && b.score !== undefined) {
        return b.score - a.score;
      }
      return 0;
    })
    .slice(0, count);
}

/**
 * Check if manager type has sufficient data
 */
export function hasSufficientData(data: DepartmentData): boolean {
  return (
    data.dimensions.length > 0 &&
    (data.findings.length > 0 || data.recommendations.length > 0)
  );
}

/**
 * Get cross-reference link for deep dive report
 */
export function getDeepDiveLink(chapterCode: ChapterCode): string {
  const linkMap: Record<ChapterCode, string> = {
    'GE': 'deepDive:growthEngine.html',
    'PH': 'deepDive:performanceHealth.html',
    'PL': 'deepDive:peopleLeadership.html',
    'RS': 'deepDive:resilienceSafeguards.html',
  };
  return linkMap[chapterCode] || 'comprehensive.html';
}
