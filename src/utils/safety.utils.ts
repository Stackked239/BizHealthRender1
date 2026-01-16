/**
 * PHASE 4 IDM CONSOLIDATION - SAFETY UTILITIES
 *
 * Defensive data extraction and validation functions to prevent:
 * - Null/undefined propagation
 * - NaN calculation results
 * - Type mismatches in templates
 * - Ghost arrays ([undefined] instead of [])
 *
 * @module safety.utils
 * @version 1.0.0
 */

// ============================================================
// 1. NUMERIC EXTRACTION - PREVENTS NaN
// ============================================================

/**
 * Safely extract numeric values, handling all "dirty" data types.
 * Converts strings, handles null/undefined, prevents NaN.
 */
export function extractNumericValueSafe(
  value: unknown,
  fallback: number = 0
): number {
  if (value === null || value === undefined) return fallback;

  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  try {
    const converted = Number(value);
    return Number.isNaN(converted) ? fallback : converted;
  } catch {
    return fallback;
  }
}

// ============================================================
// 2. STRING EXTRACTION - PREVENTS .replace() ERRORS
// ============================================================

/**
 * Safely extract string values.
 * Handles null, undefined, numbers, arrays, objects.
 */
export function extractStringSafe(
  value: unknown,
  fallback: string = ''
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.filter(v => v != null).join(', ');
  if (typeof value === 'object') return fallback; // Prevent [object Object]
  return fallback;
}

// ============================================================
// 3. SAFE STRING REPLACE - FIXES text.replace ERRORS
// ============================================================

/**
 * Safe string replace that handles non-string inputs gracefully.
 */
export function safeReplace(
  value: unknown,
  pattern: string | RegExp,
  replacement: string
): string {
  const str = extractStringSafe(value, '');
  return str.replace(pattern, replacement);
}

// ============================================================
// 4. ARRAY EXTRACTION - PREVENTS GHOST ARRAYS
// ============================================================

/**
 * Safely extract and filter arrays.
 * Removes undefined, null, and items that fail validation.
 */
export function extractArraySafe<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(value)) return fallback;

  const filtered = value.filter(
    (item): item is T => item != null && itemValidator(item)
  );

  return filtered.length === 0 ? fallback : filtered;
}

// ============================================================
// 5. WEIGHTED SCORE CALCULATION - PREVENTS NaN & DIV/0
// ============================================================

/**
 * Calculate weighted average score with full protection against:
 * - Empty arrays, Invalid weight values, Division by zero, NaN propagation
 */
export function calculateWeightedScoreSafe(
  scores: Array<{ score?: number; weight?: number }> | undefined | null,
  fallback: number = 0
): number {
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return fallback;
  }

  const validScores = scores.filter(
    (s): s is { score: number; weight: number } =>
      s != null &&
      typeof s.score === 'number' &&
      !Number.isNaN(s.score) &&
      typeof s.weight === 'number' &&
      !Number.isNaN(s.weight) &&
      s.weight > 0
  );

  if (validScores.length === 0) return fallback;

  const totalWeight = validScores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return fallback;

  const weightedSum = validScores.reduce(
    (sum, s) => sum + s.score * s.weight,
    0
  );

  const result = weightedSum / totalWeight;
  return Number.isNaN(result) ? fallback : Math.round(result * 10) / 10;
}

// ============================================================
// 6. SCORE BAND DETERMINATION
// ============================================================

export type ScoreBand = 'Excellence' | 'Proficiency' | 'Attention' | 'Critical';

/**
 * Safely determine score band with null handling.
 */
export function getScoreBandSafe(score: number | undefined | null): ScoreBand {
  const safeScore = extractNumericValueSafe(score, 0);
  if (safeScore >= 80) return 'Excellence';
  if (safeScore >= 60) return 'Proficiency';
  if (safeScore >= 40) return 'Attention';
  return 'Critical';
}

// ============================================================
// 7. VALIDATION HELPERS
// ============================================================

export function validatePrioritySafe(
  value: unknown
): 'Critical' | 'High' | 'Medium' | 'Low' {
  const valid = ['Critical', 'High', 'Medium', 'Low'];
  return valid.includes(value as string)
    ? (value as 'Critical' | 'High' | 'Medium' | 'Low')
    : 'Medium';
}

export function validateSeveritySafe(
  value: unknown
): 'Critical' | 'High' | 'Medium' | 'Low' {
  const valid = ['Critical', 'High', 'Medium', 'Low'];
  return valid.includes(value as string)
    ? (value as 'Critical' | 'High' | 'Medium' | 'Low')
    : 'Medium';
}

export function validateProbabilitySafe(
  value: unknown
): 'High' | 'Medium' | 'Low' {
  const valid = ['High', 'Medium', 'Low'];
  return valid.includes(value as string)
    ? (value as 'High' | 'Medium' | 'Low')
    : 'Medium';
}

// ============================================================
// 8. TYPE GUARDS
// ============================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isValidDimensionCode(value: unknown): value is string {
  // NOTE: Both ITD (canonical) and IDS (legacy) are accepted for backward compatibility
  const valid = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'IDS', 'RMS', 'CMP'];
  return typeof value === 'string' && valid.includes(value);
}

export function isValidChapterCode(value: unknown): value is string {
  const valid = ['GE', 'PH', 'PL', 'RS'];
  return typeof value === 'string' && valid.includes(value);
}

// ============================================================
// 9. UTILITY HELPERS
// ============================================================

export function clampScoreSafe(
  value: number,
  min: number = 0,
  max: number = 100
): number {
  const safe = extractNumericValueSafe(value, min);
  return Math.max(min, Math.min(max, safe));
}

export function normalizeScoreSafe(
  value: number,
  fromMin: number = 1,
  fromMax: number = 5,
  toMin: number = 0,
  toMax: number = 100
): number {
  const safe = extractNumericValueSafe(value, fromMin);
  const clamped = Math.max(fromMin, Math.min(fromMax, safe));
  return ((clamped - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
}

// ============================================================
// 10. CONSOLIDATION HELPERS - RECOMMENDATIONS
// ============================================================

export interface SafeRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: number;
  effort: number;
  roi_estimate?: number;
  dimension_codes: string[];
  implementation_steps: string[];
}

/**
 * Safely consolidate recommendations with fallbacks for missing fields.
 */
export function consolidateRecommendationsSafe(
  rawRecommendations: unknown[] | undefined | null
): SafeRecommendation[] {
  if (!Array.isArray(rawRecommendations)) return [];

  return rawRecommendations
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((r, index) => {
      const title = extractStringSafe(r.title, 'Untitled Recommendation');
      const description = extractStringSafe(r.description, 'No description available');

      return {
        id: extractStringSafe(r.id, `rec-${index + 1}`),
        title,
        description,
        priority: validatePrioritySafe(r.priority),
        impact: clampScoreSafe(extractNumericValueSafe(r.impact, 3), 1, 5),
        effort: clampScoreSafe(extractNumericValueSafe(r.effort, 3), 1, 5),
        roi_estimate: r.roi_estimate != null
          ? extractNumericValueSafe(r.roi_estimate)
          : undefined,
        dimension_codes: extractArraySafe(
          r.dimension_codes,
          isValidDimensionCode,
          []
        ),
        implementation_steps: extractArraySafe(
          r.implementation_steps,
          isString,
          []
        ),
      };
    })
    .filter(r => r.title !== 'Untitled Recommendation' || r.description !== 'No description available');
}

// ============================================================
// 11. CONSOLIDATION HELPERS - RISKS
// ============================================================

export interface SafeRisk {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  probability: 'High' | 'Medium' | 'Low';
  impact_areas: string[];
  mitigation: string;
  dimension_code?: string;
}

/**
 * Safely compile risks with fallbacks for missing fields.
 */
export function compileRisksSafe(
  rawRisks: unknown[] | undefined | null
): SafeRisk[] {
  if (!Array.isArray(rawRisks)) return [];

  return rawRisks
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((r, index) => ({
      id: extractStringSafe(r.id, `risk-${index + 1}`),
      title: extractStringSafe(r.title, 'Unspecified Risk'),
      description: extractStringSafe(r.description, 'No description available'),
      severity: validateSeveritySafe(r.severity),
      probability: validateProbabilitySafe(r.probability),
      impact_areas: extractArraySafe(r.impact_areas, isString, []),
      mitigation: extractStringSafe(
        r.mitigation,
        'Mitigation strategy to be determined'
      ),
      dimension_code: isValidDimensionCode(r.dimension_code)
        ? (r.dimension_code as string)
        : undefined,
    }));
}

// ============================================================
// 12. QUICK WIN ENRICHMENT
// ============================================================

export interface SafeQuickWin {
  id: string;
  title: string;
  description: string;
  impact: number;
  effort: number;
  horizon: string;
  dimension_code?: string;
  expected_outcome: string;
}

/**
 * Safely enrich quick wins with fallbacks.
 */
export function enrichQuickWinsSafe(
  rawQuickWins: unknown[] | undefined | null
): SafeQuickWin[] {
  if (!Array.isArray(rawQuickWins)) return [];

  return rawQuickWins
    .filter((q): q is Record<string, unknown> => q != null && typeof q === 'object')
    .map((q, index) => ({
      id: extractStringSafe(q.id, `qw-${index + 1}`),
      title: extractStringSafe(q.title, 'Quick Win Opportunity'),
      description: extractStringSafe(q.description, 'No description available'),
      impact: clampScoreSafe(extractNumericValueSafe(q.impact, 4), 1, 5),
      effort: clampScoreSafe(extractNumericValueSafe(q.effort, 2), 1, 5),
      horizon: extractStringSafe(q.horizon, '30 days'),
      dimension_code: isValidDimensionCode(q.dimension_code)
        ? (q.dimension_code as string)
        : undefined,
      expected_outcome: extractStringSafe(
        q.expected_outcome,
        'Improvement expected upon implementation'
      ),
    }));
}

// ============================================================
// 13. SAFE OBJECT ACCESS
// ============================================================

/**
 * Safely access nested object properties.
 * Returns fallback if any part of the path is null/undefined.
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  fallback: T
): T {
  if (obj === null || obj === undefined) return fallback;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return fallback;
    if (typeof current !== 'object') return fallback;
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? fallback;
}

/**
 * Safely execute a function that might access undefined properties.
 * Returns fallback on any error.
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T
): T {
  try {
    const result = fn();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}
