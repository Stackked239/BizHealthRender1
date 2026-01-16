/**
 * PHASE 4 IDM CONSOLIDATOR - SAFETY PATCHES
 *
 * This module contains safety utility functions to prevent null value
 * vulnerabilities, calculation errors, and data binding failures in
 * Phase 4 IDM consolidation and Phase 5 report generation.
 *
 * These functions provide:
 * - Safe numeric extraction with fallbacks
 * - Safe string operations preventing "is not a function" errors
 * - Safe array operations preventing ghost arrays
 * - Type validation and normalization
 *
 * @module phase4-safety-patches
 */

import type {
  DimensionCode,
  ChapterCode,
  ScoreBand,
  Recommendation,
  Risk,
  QuickWin,
} from '../types/idm.types.js';

// ============================================================================
// SAFE NUMERIC EXTRACTION
// ============================================================================

/**
 * Safely extract a numeric value from various input types.
 * Handles null, undefined, NaN, strings, and objects with value properties.
 *
 * @param value - The value to extract (unknown type)
 * @param fallback - Fallback value if extraction fails (default: 0)
 * @returns The extracted numeric value or fallback
 *
 * @example
 * extractNumericValueSafe(75) // 75
 * extractNumericValueSafe("85") // 85
 * extractNumericValueSafe({ value: 75 }) // 75
 * extractNumericValueSafe(null, 50) // 50
 * extractNumericValueSafe(NaN, 0) // 0
 */
export function extractNumericValueSafe(
  value: unknown,
  fallback: number = 0
): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Handle number directly
  if (typeof value === 'number') {
    return Number.isNaN(value) || !Number.isFinite(value) ? fallback : value;
  }

  // Handle string that looks like a number
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'NaN' || trimmed === 'undefined') {
      return fallback;
    }
    const parsed = parseFloat(trimmed);
    return Number.isNaN(parsed) || !Number.isFinite(parsed) ? fallback : parsed;
  }

  // Handle object with value/score/percentile property
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const propertyNames = [
      'value',
      'score',
      'score_overall',
      'percentile',
      'industry_average',
      'industryAverage',
      'peerPercentile',
    ];

    for (const prop of propertyNames) {
      if (prop in obj) {
        const propValue = obj[prop];
        if (typeof propValue === 'number' && !Number.isNaN(propValue)) {
          return propValue;
        }
        if (typeof propValue === 'string') {
          const parsed = parseFloat(propValue);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      }
    }
  }

  return fallback;
}

// ============================================================================
// SAFE WEIGHTED SCORE CALCULATION
// ============================================================================

/**
 * Safely calculate weighted score with comprehensive null handling.
 *
 * @param scores - Array of score objects with score and weight properties
 * @param fallback - Fallback value if calculation fails (default: 0)
 * @returns Weighted average score or fallback
 *
 * @example
 * calculateWeightedScoreSafe([
 *   { score: 80, weight: 0.5 },
 *   { score: 60, weight: 0.5 }
 * ]) // 70
 */
export function calculateWeightedScoreSafe(
  scores: Array<{ score?: unknown; weight?: unknown }> | undefined | null,
  fallback: number = 0
): number {
  // Guard: null/undefined/not-array
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return fallback;
  }

  // Filter and validate each score entry
  const validScores: Array<{ score: number; weight: number }> = [];

  for (const entry of scores) {
    if (entry == null || typeof entry !== 'object') continue;

    const score = extractNumericValueSafe(entry.score, NaN);
    const weight = extractNumericValueSafe(entry.weight, NaN);

    if (
      !Number.isNaN(score) &&
      !Number.isNaN(weight) &&
      weight > 0 &&
      Number.isFinite(score) &&
      Number.isFinite(weight)
    ) {
      validScores.push({ score, weight });
    }
  }

  if (validScores.length === 0) {
    return fallback;
  }

  // Calculate weighted sum
  const totalWeight = validScores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) {
    return fallback;
  }

  const weightedSum = validScores.reduce(
    (sum, s) => sum + s.score * s.weight,
    0
  );

  const result = weightedSum / totalWeight;
  return Number.isNaN(result) || !Number.isFinite(result)
    ? fallback
    : Math.round(result * 10) / 10;
}

// ============================================================================
// SAFE STRING EXTRACTION
// ============================================================================

/**
 * Safely extract a string value from various input types.
 *
 * @param value - The value to extract
 * @param fallback - Fallback string if extraction fails (default: '')
 * @returns The extracted string or fallback
 *
 * @example
 * extractStringSafe("hello") // "hello"
 * extractStringSafe(42) // "42"
 * extractStringSafe(null) // ""
 * extractStringSafe({ toString: () => "test" }) // "test"
 * extractStringSafe({}) // "" (avoids [object Object])
 */
export function extractStringSafe(
  value: unknown,
  fallback: string = ''
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value.length > 0 ? value : fallback;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : String(value);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const filtered = value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => extractStringSafe(item, ''))
      .filter((s) => s.length > 0);
    return filtered.length > 0 ? filtered.join(', ') : fallback;
  }

  if (typeof value === 'object') {
    // Avoid [object Object]
    const str = String(value);
    if (str === '[object Object]') {
      return fallback;
    }
    return str;
  }

  return fallback;
}

// ============================================================================
// SAFE ARRAY EXTRACTION (Prevents Ghost Arrays)
// ============================================================================

/**
 * Safely extract and filter an array, removing null/undefined values.
 * Prevents "ghost arrays" containing [undefined, undefined, ...]
 *
 * @param value - The value to extract as array
 * @param itemValidator - Optional function to validate each item
 * @param fallback - Fallback array if extraction fails (default: [])
 * @returns Clean array without null/undefined values
 *
 * @example
 * extractArraySafe([1, null, 2, undefined, 3]) // [1, 2, 3]
 * extractArraySafe(null) // []
 */
export function extractArraySafe<T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  // Filter out null/undefined
  const filtered = value.filter(
    (item): item is NonNullable<typeof item> =>
      item !== null && item !== undefined
  );

  // Apply optional validator
  if (itemValidator) {
    return filtered.filter(itemValidator);
  }

  return filtered as T[];
}

// ============================================================================
// SAFE SCORE BAND DETERMINATION
// ============================================================================

/**
 * Safely determine score band from a numeric score.
 *
 * @param score - The score value (may be null/undefined/NaN)
 * @returns ScoreBand enum value
 *
 * @example
 * getScoreBandSafe(85) // 'Excellence'
 * getScoreBandSafe(65) // 'Proficiency'
 * getScoreBandSafe(45) // 'Attention'
 * getScoreBandSafe(null) // 'Critical'
 */
export function getScoreBandSafe(score: unknown): ScoreBand {
  const safeScore = extractNumericValueSafe(score, 0);

  if (safeScore >= 80) return 'Excellence';
  if (safeScore >= 60) return 'Proficiency';
  if (safeScore >= 40) return 'Attention';
  return 'Critical';
}

// ============================================================================
// SAFE PRIORITY VALIDATION
// ============================================================================

/**
 * Validate and normalize priority value.
 *
 * @param value - The priority value to validate
 * @returns Validated priority string
 */
export function validatePrioritySafe(
  value: unknown
): 'Critical' | 'High' | 'Medium' | 'Low' {
  const valid = ['Critical', 'High', 'Medium', 'Low'] as const;
  if (typeof value === 'string' && valid.includes(value as typeof valid[number])) {
    return value as typeof valid[number];
  }
  return 'Medium';
}

/**
 * Validate and normalize severity value.
 *
 * @param value - The severity value to validate
 * @returns Validated severity string
 */
export function validateSeveritySafe(
  value: unknown
): 'Critical' | 'High' | 'Medium' | 'Low' {
  return validatePrioritySafe(value);
}

/**
 * Validate and normalize probability/likelihood value.
 *
 * @param value - The probability value to validate
 * @returns Validated probability string
 */
export function validateProbabilitySafe(
  value: unknown
): 'High' | 'Medium' | 'Low' {
  const valid = ['High', 'Medium', 'Low'] as const;
  if (typeof value === 'string' && valid.includes(value as typeof valid[number])) {
    return value as typeof valid[number];
  }
  return 'Medium';
}

// ============================================================================
// DIMENSION CODE VALIDATION
// ============================================================================

const VALID_DIMENSION_CODES: DimensionCode[] = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'IDS', 'RMS', 'CMP',
];

const VALID_CHAPTER_CODES: ChapterCode[] = ['GE', 'PH', 'PL', 'RS'];

/**
 * Type guard to check if value is a valid dimension code.
 */
export function isValidDimensionCode(value: unknown): value is DimensionCode {
  return (
    typeof value === 'string' &&
    VALID_DIMENSION_CODES.includes(value as DimensionCode)
  );
}

/**
 * Type guard to check if value is a valid chapter code.
 */
export function isValidChapterCode(value: unknown): value is ChapterCode {
  return (
    typeof value === 'string' &&
    VALID_CHAPTER_CODES.includes(value as ChapterCode)
  );
}

/**
 * Type guard to check if value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================================
// SAFE RECOMMENDATION CONSOLIDATION
// ============================================================================

/**
 * Safely consolidate recommendations with full null protection.
 *
 * @param rawRecommendations - Array of raw recommendation objects
 * @returns Clean array of validated recommendations
 */
export function consolidateRecommendationsSafe(
  rawRecommendations: unknown[] | undefined | null
): Partial<Recommendation>[] {
  if (!Array.isArray(rawRecommendations)) {
    return [];
  }

  return rawRecommendations
    .filter(
      (r): r is Record<string, unknown> => r != null && typeof r === 'object'
    )
    .map((r, index) => ({
      id: extractStringSafe(r.id, `rec-${index + 1}`),
      dimension_code: isValidDimensionCode(r.dimension_code)
        ? r.dimension_code
        : ('STR' as DimensionCode),
      theme: extractStringSafe(r.theme, 'Untitled Recommendation'),
      priority_rank: extractNumericValueSafe(r.priority_rank, index + 1),
      impact_score: clampScore(extractNumericValueSafe(r.impact_score, 50)),
      effort_score: clampScore(extractNumericValueSafe(r.effort_score, 50)),
      horizon: validateHorizon(r.horizon),
      linked_finding_ids: extractArraySafe<string>(
        r.linked_finding_ids,
        isNonEmptyString,
        []
      ),
      required_capabilities: extractArraySafe<string>(
        r.required_capabilities,
        isNonEmptyString,
        []
      ),
      action_steps: extractArraySafe<string>(
        r.action_steps,
        isNonEmptyString,
        ['Review and assess current state', 'Develop improvement plan']
      ),
      expected_outcomes: extractStringSafe(
        r.expected_outcomes,
        'Improved performance in target dimension.'
      ),
    }))
    .filter(
      (r) =>
        r.theme !== 'Untitled Recommendation' ||
        r.expected_outcomes !== 'Improved performance in target dimension.'
    );
}

// ============================================================================
// SAFE RISK COMPILATION
// ============================================================================

/**
 * Safely compile risks with full null protection.
 *
 * @param rawRisks - Array of raw risk objects
 * @returns Clean array of validated risks
 */
export function compileRisksSafe(
  rawRisks: unknown[] | undefined | null
): Partial<Risk>[] {
  if (!Array.isArray(rawRisks)) {
    return [];
  }

  return rawRisks
    .filter(
      (r): r is Record<string, unknown> => r != null && typeof r === 'object'
    )
    .map((r, index) => ({
      id: extractStringSafe(r.id, `risk-${index + 1}`),
      dimension_code: isValidDimensionCode(r.dimension_code)
        ? r.dimension_code
        : ('STR' as DimensionCode),
      severity: validateSeveritySafe(r.severity),
      likelihood: validateProbabilitySafe(r.likelihood),
      narrative: extractStringSafe(
        r.narrative,
        'Risk identified requiring attention.'
      ),
      mitigation: extractStringSafe(
        r.mitigation,
        'Mitigation strategy to be determined.'
      ),
      category: extractStringSafe(r.category, 'General'),
      linked_recommendation_ids: extractArraySafe<string>(
        r.linked_recommendation_ids,
        isNonEmptyString,
        []
      ),
    }));
}

// ============================================================================
// SAFE QUICK WIN ENRICHMENT
// ============================================================================

/**
 * Enrich quick win with full recommendation data.
 *
 * @param quickWin - Quick win object with recommendation_id
 * @param recommendations - Array of recommendations to lookup
 * @returns Enriched quick win object
 */
export function enrichQuickWinSafe(
  quickWin: QuickWin | undefined | null,
  recommendations: Recommendation[]
): Record<string, unknown> {
  if (!quickWin || !quickWin.recommendation_id) {
    return {
      id: 'qw-unknown',
      title: 'Quick Win',
      description: 'No description available',
      investment: 'See detailed analysis',
      expectedReturn: 'See ROI analysis',
      roi: 'TBD',
      owner: 'To be assigned',
      timeframe: '90 days',
    };
  }

  const rec = recommendations.find((r) => r.id === quickWin.recommendation_id);

  if (!rec) {
    return {
      id: quickWin.recommendation_id,
      title: 'Quick Win',
      description: 'Recommendation details not found',
      investment: 'See detailed analysis',
      expectedReturn: 'See ROI analysis',
      roi: 'TBD',
      owner: 'To be assigned',
      timeframe: '90 days',
    };
  }

  return {
    id: rec.id,
    title: extractStringSafe(rec.theme, 'Quick Win Initiative'),
    description: extractStringSafe(
      rec.expected_outcomes,
      'Improve performance in target area'
    ),
    dimension_code: rec.dimension_code,
    impact_score: rec.impact_score,
    effort_score: rec.effort_score,
    horizon: rec.horizon,
    action_steps: rec.action_steps,
    investment: estimateInvestmentRange(rec.effort_score),
    expectedReturn: estimateReturnRange(rec.impact_score),
    roi: calculateROIEstimate(rec.impact_score, rec.effort_score),
    owner: mapDimensionToOwner(rec.dimension_code),
    timeframe: mapHorizonToTimeframe(rec.horizon),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clamp a score to 0-100 range.
 */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Validate recommendation horizon.
 */
function validateHorizon(
  value: unknown
): '90_days' | '12_months' | '24_months_plus' {
  const valid = ['90_days', '12_months', '24_months_plus'] as const;
  if (typeof value === 'string' && valid.includes(value as typeof valid[number])) {
    return value as typeof valid[number];
  }
  return '12_months';
}

/**
 * Estimate investment range from effort score.
 */
function estimateInvestmentRange(effortScore: number): string {
  if (effortScore <= 30) return '$5K-$15K';
  if (effortScore <= 50) return '$15K-$50K';
  if (effortScore <= 70) return '$50K-$100K';
  return '$100K+';
}

/**
 * Estimate return range from impact score.
 */
function estimateReturnRange(impactScore: number): string {
  if (impactScore >= 80) return '$100K+ annual impact';
  if (impactScore >= 60) return '$50K-$100K annual impact';
  if (impactScore >= 40) return '$25K-$50K annual impact';
  return '$10K-$25K annual impact';
}

/**
 * Calculate ROI estimate from impact and effort scores.
 */
function calculateROIEstimate(impactScore: number, effortScore: number): string {
  if (effortScore === 0) return 'High ROI';
  const ratio = impactScore / effortScore;
  if (ratio >= 2) return `${ratio.toFixed(1)}x`;
  if (ratio >= 1) return `${ratio.toFixed(1)}x`;
  return 'Moderate ROI';
}

/**
 * Map dimension code to suggested owner role.
 */
function mapDimensionToOwner(dimensionCode: DimensionCode): string {
  const ownerMap: Record<DimensionCode, string> = {
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
  return ownerMap[dimensionCode] || 'Executive Team';
}

/**
 * Map horizon to human-readable timeframe.
 */
function mapHorizonToTimeframe(
  horizon: '90_days' | '12_months' | '24_months_plus'
): string {
  const timeframeMap = {
    '90_days': '0-90 days',
    '12_months': '3-12 months',
    '24_months_plus': '12-24+ months',
  };
  return timeframeMap[horizon] || '3-12 months';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractNumericValueSafe,
  calculateWeightedScoreSafe,
  extractStringSafe,
  extractArraySafe,
  getScoreBandSafe,
  validatePrioritySafe,
  validateSeveritySafe,
  validateProbabilitySafe,
  isValidDimensionCode,
  isValidChapterCode,
  isNonEmptyString,
  consolidateRecommendationsSafe,
  compileRisksSafe,
  enrichQuickWinSafe,
};
