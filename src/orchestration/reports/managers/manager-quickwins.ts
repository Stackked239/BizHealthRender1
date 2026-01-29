/**
 * Manager Quick Wins Selection and Enrichment
 *
 * Provides enhanced quick win selection logic for manager reports.
 * Extends Phase 1.5 QuickWin data with manager-specific metadata
 * without modifying the underlying Phase 1.5 schema.
 *
 * @module manager-quickwins
 */

import type { CategoryCode } from '../../../data/question-category-mapping.js';
import type { QuickWin as Phase15QuickWin } from '../../../types/phase1-5.types.js';
import type { ReportQuickWin } from '../../../types/report.types.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Manager type identifiers (aligned with dimension-filters.ts)
 */
export type ManagerType =
  | 'SalesMarketing'
  | 'Operations'
  | 'Financials'
  | 'ITTechnology'
  | 'StrategyLeadership';

/**
 * Manager-specific quick win with enhanced metadata
 */
export interface ManagerQuickWin {
  id: string;
  title: string;                    // Imperative action, 10-15 words max
  description: string;              // 1-2 sentences: what to do + why it matters
  sourceCategory: CategoryCode;
  categoryName?: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;                 // "0-90 days" | "3-12 months" | "12-24 months"
  keyMetric?: string;               // Optional: metric that should move
  targetChange?: string;            // Optional: specific improvement target
  priorityScore: number;            // Computed ranking score
  estimatedROI?: string;
}

// ============================================================================
// CATEGORY MAPPINGS
// ============================================================================

/**
 * Category codes relevant to each manager type
 * Aligns with dimension-filters.ts MANAGER_DIMENSIONS
 */
export const MANAGER_CATEGORY_MAP: Record<ManagerType, CategoryCode[]> = {
  SalesMarketing: ['SAL', 'MKT', 'CXP', 'STR'],
  Operations: ['OPS', 'HRS', 'CXP', 'CMP'],
  Financials: ['FIN', 'CMP', 'RMS'],
  ITTechnology: ['TIN', 'ITD', 'RMS'],
  StrategyLeadership: ['STR', 'LDG', 'RMS']
};

/**
 * Category display names for context
 */
const CATEGORY_DISPLAY_NAMES: Record<CategoryCode, string> = {
  STR: 'Strategy & Vision',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Finance',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Security',
  RMS: 'Risk Management',
  CMP: 'Compliance'
};

/**
 * Manager type to dimension-filters manager type mapping
 */
export const MANAGER_TYPE_TO_DIMENSION_TYPE: Record<ManagerType, string> = {
  SalesMarketing: 'salesMarketing',
  Operations: 'operations',
  Financials: 'financials',
  ITTechnology: 'itTechnology',
  StrategyLeadership: 'strategy'
};

// ============================================================================
// TITLE GENERATION
// ============================================================================

/**
 * Imperative action fallbacks by category code
 * Used when Phase 1.5 data lacks specific titles
 */
const CATEGORY_IMPERATIVE_ACTIONS: Record<string, string> = {
  MKT: 'Implement marketing measurement and channel optimization',
  SAL: 'Strengthen sales pipeline discipline and forecasting accuracy',
  STR: 'Clarify strategic positioning and growth priorities',
  FIN: 'Establish cash flow controls and financial visibility',
  OPS: 'Streamline operational workflows and capacity planning',
  TIN: 'Modernize technology stack and automation capabilities',
  ITD: 'Strengthen cybersecurity posture and data governance',
  RMS: 'Build risk mitigation and business continuity protocols',
  LDG: 'Develop leadership decision-making frameworks',
  HRS: 'Improve talent retention and engagement systems',
  CMP: 'Enhance compliance monitoring and audit readiness',
  CXP: 'Optimize customer response and satisfaction processes'
};

/**
 * Generate a specific, actionable title for quick wins
 * Falls back to imperative category-specific actions if Phase 1.5 data lacks specificity
 */
export function generateSpecificTitle(
  quickWin: { title?: string; theme?: string; description?: string; rationale?: string; expectedOutcomes?: string },
  categoryCode: string
): string {
  // Check if existing title is specific (not generic fallback patterns)
  const existingTitle = quickWin.title || quickWin.theme;
  if (existingTitle &&
      !existingTitle.toLowerCase().includes('improvement initiative') &&
      !existingTitle.toLowerCase().includes('quick win opportunity') &&
      existingTitle.length > 15) {
    return existingTitle;
  }

  // Extract from description: take first 10-15 meaningful words
  const description = quickWin.description || quickWin.expectedOutcomes;
  if (description && description.length > 30) {
    const cleanDesc = description
      .replace(/^(The company should|We recommend|Consider|Focus on|Implement|Improve)/i, '')
      .trim();
    const words = cleanDesc.split(/\s+/).slice(0, 12);
    const title = words.join(' ');
    // Capitalize first letter and add ellipsis if truncated
    const finalTitle = title.charAt(0).toUpperCase() + title.slice(1);
    return cleanDesc.split(/\s+/).length > 12 ? finalTitle + '…' : finalTitle;
  }

  // Extract from rationale if description unavailable
  if (quickWin.rationale && quickWin.rationale.length > 30) {
    const words = quickWin.rationale.split(/\s+/).slice(0, 10);
    return words.join(' ') + '…';
  }

  // Fallback: Category-specific imperative actions
  return CATEGORY_IMPERATIVE_ACTIONS[categoryCode] || `Address ${categoryCode} performance gaps`;
}

// ============================================================================
// METRIC EXTRACTION
// ============================================================================

/**
 * Extract key metric from benchmark comparisons
 * Returns formatted string like "Current: 45% vs Industry: 72%"
 */
export function extractKeyMetric(
  benchmarks: any[] | undefined,
  categoryCode: string
): string | undefined {
  if (!benchmarks || benchmarks.length === 0) return undefined;

  // Find relevant benchmark for this category
  const relevant = benchmarks.find(b =>
    b.categoryCode === categoryCode ||
    b.indicatorCode?.startsWith(categoryCode)
  );

  if (!relevant) return undefined;

  // Format metric with current and benchmark values
  if (relevant.companyValue !== undefined && relevant.benchmarkValue !== undefined) {
    const formatValue = (v: number) => {
      if (v > 100) return v.toLocaleString();
      if (v < 1) return `${(v * 100).toFixed(0)}%`;
      return v.toFixed(0);
    };
    return `Current: ${formatValue(relevant.companyValue)} vs Industry: ${formatValue(relevant.benchmarkValue)}`;
  }

  return undefined;
}

/**
 * Extract target change from weaknesses or quick win data
 * Returns formatted improvement target like "Improve by 25%"
 */
export function extractTargetChange(
  quickWin: Phase15QuickWin | any,
  categoryAnalysis?: any
): string | undefined {
  // Check quick win's own targetChange or estimatedROI
  if (quickWin.targetChange) {
    return quickWin.targetChange;
  }

  if (quickWin.estimatedROI) {
    return typeof quickWin.estimatedROI === 'number'
      ? `${quickWin.estimatedROI.toFixed(0)}% ROI potential`
      : quickWin.estimatedROI;
  }

  // Check for improvement targets in weaknesses
  if (categoryAnalysis?.weaknesses && categoryAnalysis.weaknesses.length > 0) {
    const weakness = categoryAnalysis.weaknesses[0];
    if (weakness.improvementTarget) {
      return weakness.improvementTarget;
    }
    // Generate target from severity
    if (weakness.severity === 'high') {
      return 'Target: Move to proficiency band';
    } else if (weakness.severity === 'critical') {
      return 'Target: Stabilize within 90 days';
    }
  }

  return undefined;
}

// ============================================================================
// PRIORITY SCORING
// ============================================================================

/**
 * Compute priority score for ranking quick wins
 * Higher score = higher priority
 */
function computePriorityScore(effort: string, impact: string, timeline?: string): number {
  let score = 0;

  // Impact scoring (higher impact = higher priority)
  switch (impact?.toLowerCase()) {
    case 'high': score += 3; break;
    case 'medium': score += 2; break;
    case 'low': score += 1; break;
    default: score += 1.5;
  }

  // Effort scoring (lower effort = higher priority)
  switch (effort?.toLowerCase()) {
    case 'low': score += 3; break;
    case 'medium': score += 2; break;
    case 'high': score += 1; break;
    default: score += 1.5;
  }

  // Timeline scoring (earlier = higher priority)
  if (timeline) {
    const lowerTimeline = timeline.toLowerCase();
    if (lowerTimeline.includes('0-90') || lowerTimeline.includes('immediate') || lowerTimeline.includes('30')) {
      score += 3;
    } else if (lowerTimeline.includes('3-12') || lowerTimeline.includes('6 month') || lowerTimeline.includes('quarter')) {
      score += 2;
    } else {
      score += 1;
    }
  } else {
    score += 2; // Default to medium timeline
  }

  return score;
}

/**
 * Normalize effort/impact string to standard format
 */
function normalizeLevel(level: string | undefined): 'low' | 'medium' | 'high' {
  if (!level) return 'medium';
  const lower = level.toLowerCase();
  if (lower === 'low' || lower === 'l') return 'low';
  if (lower === 'high' || lower === 'h') return 'high';
  return 'medium';
}

/**
 * Normalize timeline string
 */
function normalizeTimeline(timeline: string | undefined): string {
  if (!timeline) return '3-12 months';
  const lower = timeline.toLowerCase();
  if (lower.includes('immediate') || lower.includes('30') || lower.includes('0-90')) {
    return '0-90 days';
  }
  if (lower.includes('12-24') || lower.includes('long') || lower.includes('year')) {
    return '12-24 months';
  }
  return '3-12 months';
}

// ============================================================================
// QUICK WIN SELECTION
// ============================================================================

/**
 * Convert Phase 1.5 QuickWin to ManagerQuickWin
 * @param qw - The quick win data
 * @param categoryCode - Category code for the quick win
 * @param index - Index for ID generation
 * @param categoryAnalysis - Optional category analysis for metric extraction
 */
function convertPhase15QuickWin(
  qw: Phase15QuickWin,
  categoryCode: CategoryCode,
  index: number,
  categoryAnalysis?: any
): ManagerQuickWin {
  // Generate specific title using helper function
  const title = generateSpecificTitle(
    { title: qw.title, description: qw.description, rationale: qw.rationale },
    categoryCode
  );

  // Extract metrics from category analysis if available
  const keyMetric = extractKeyMetric(categoryAnalysis?.benchmarkComparisons, categoryCode);
  const targetChange = extractTargetChange(qw, categoryAnalysis) ||
    (qw.estimatedROI ? `ROI: ${qw.estimatedROI}` : undefined);

  return {
    id: `qw-${categoryCode}-${index}`,
    title,
    description: qw.description || '',
    sourceCategory: categoryCode,
    categoryName: CATEGORY_DISPLAY_NAMES[categoryCode],
    effort: normalizeLevel(qw.effort),
    impact: normalizeLevel(qw.impact),
    timeline: normalizeTimeline(qw.timeline),
    keyMetric,
    targetChange,
    priorityScore: computePriorityScore(qw.effort, qw.impact, qw.timeline),
    estimatedROI: qw.estimatedROI
  };
}

/**
 * Convert ReportQuickWin to ManagerQuickWin
 */
function convertReportQuickWin(
  qw: ReportQuickWin,
  categoryCode: CategoryCode,
  index: number
): ManagerQuickWin {
  const effort = qw.effortScore < 40 ? 'low' : qw.effortScore < 70 ? 'medium' : 'high';
  const impact = qw.impactScore > 60 ? 'high' : qw.impactScore > 30 ? 'medium' : 'low';

  // Generate specific title using helper function
  const title = generateSpecificTitle(
    { theme: qw.theme, expectedOutcomes: qw.expectedOutcomes },
    categoryCode
  );

  return {
    id: qw.id || `qw-${categoryCode}-${index}`,
    title,
    description: qw.expectedOutcomes || '',
    sourceCategory: categoryCode,
    categoryName: CATEGORY_DISPLAY_NAMES[categoryCode],
    effort,
    impact,
    timeline: normalizeTimeline(qw.timeframe),
    keyMetric: undefined,
    targetChange: qw.estimatedROI ? `${qw.estimatedROI.toFixed(0)}% ROI` : undefined,
    priorityScore: computePriorityScore(effort, impact, qw.timeframe),
    estimatedROI: qw.estimatedROI?.toFixed(0) + '%'
  };
}

/**
 * Select and rank quick wins for a specific manager type from Phase 1.5 data
 * @param categoryAnalyses - Phase 1.5 category analyses (full objects with benchmarks, weaknesses, etc.)
 * @param managerType - Manager type to filter for
 * @param maxCount - Maximum quick wins to return (default 5)
 */
export function selectManagerQuickWinsFromPhase15(
  categoryAnalyses: Array<{ categoryCode: CategoryCode; quickWins: Phase15QuickWin[]; [key: string]: any }>,
  managerType: ManagerType,
  maxCount: number = 5
): ManagerQuickWin[] {
  const relevantCategories = MANAGER_CATEGORY_MAP[managerType];

  // Gather quick wins from relevant categories
  const allQuickWins: ManagerQuickWin[] = [];

  for (const analysis of categoryAnalyses) {
    if (!relevantCategories.includes(analysis.categoryCode)) continue;

    const quickWins = analysis.quickWins || [];
    quickWins.forEach((qw, index) => {
      // Pass full category analysis for metric extraction
      allQuickWins.push(convertPhase15QuickWin(qw, analysis.categoryCode, index, analysis));
    });
  }

  // Sort by priority score (descending) and return top N
  return allQuickWins
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, maxCount);
}

/**
 * Select and rank quick wins for a specific manager type from ReportQuickWin data
 * @param quickWins - Report quick wins
 * @param categoryCode - Category to associate (fallback)
 * @param managerType - Manager type to filter for
 * @param maxCount - Maximum quick wins to return (default 5)
 */
export function selectManagerQuickWins(
  quickWins: ReportQuickWin[],
  managerType: ManagerType,
  maxCount: number = 5
): ManagerQuickWin[] {
  if (!quickWins || quickWins.length === 0) {
    return [];
  }

  // Convert all quick wins
  const converted: ManagerQuickWin[] = quickWins.map((qw, index) => {
    // Try to determine category from theme keywords
    const category = inferCategoryFromContent(qw.theme || '', qw.expectedOutcomes || '');
    return convertReportQuickWin(qw, category, index);
  });

  // Filter by manager's relevant categories
  const relevantCategories = MANAGER_CATEGORY_MAP[managerType];
  const filtered = converted.filter(qw =>
    relevantCategories.includes(qw.sourceCategory)
  );

  // If no filtered results, return top general quick wins
  if (filtered.length === 0) {
    return converted
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, maxCount);
  }

  // Sort by priority score and return
  return filtered
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, maxCount);
}

/**
 * Infer category from content keywords
 */
function inferCategoryFromContent(theme: string, outcomes: string): CategoryCode {
  const text = `${theme} ${outcomes}`.toLowerCase();

  // Check for category keywords
  if (/\b(sales|revenue|pipeline|deal|conversion|prospect)\b/.test(text)) return 'SAL';
  if (/\b(marketing|brand|campaign|leads?|awareness|advertising)\b/.test(text)) return 'MKT';
  if (/\b(customer|experience|satisfaction|nps|retention|loyalty)\b/.test(text)) return 'CXP';
  if (/\b(operation|efficiency|process|workflow|productivity|supply)\b/.test(text)) return 'OPS';
  if (/\b(financial?|budget|cost|profit|cash\s?flow|accounting)\b/.test(text)) return 'FIN';
  if (/\b(hr|human\s?resource|employee|talent|hiring|culture)\b/.test(text)) return 'HRS';
  if (/\b(leadership|governance|management|executive|board)\b/.test(text)) return 'LDG';
  if (/\b(strateg|vision|planning|mission|goals?|objectives?)\b/.test(text)) return 'STR';
  if (/\b(technolog|innovation|digital|automation|ai)\b/.test(text)) return 'TIN';
  if (/\b(it\b|data|security|systems?|infrastructure|cyber)\b/.test(text)) return 'ITD';
  if (/\b(risk|sustainability|continuity|resilience)\b/.test(text)) return 'RMS';
  if (/\b(compliance|regulatory|legal|audit|policy|ethics)\b/.test(text)) return 'CMP';

  return 'STR'; // Default to Strategy
}

/**
 * Check if quick wins count meets minimum threshold
 */
export function validateQuickWinsCount(
  quickWins: ManagerQuickWin[],
  managerType: ManagerType,
  minCount: number = 3
): { isValid: boolean; message?: string } {
  if (quickWins.length >= minCount) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: `[${managerType}] Only ${quickWins.length} quick wins available (minimum: ${minCount})`
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CATEGORY_DISPLAY_NAMES,
  computePriorityScore,
  normalizeLevel,
  normalizeTimeline,
  inferCategoryFromContent
};
