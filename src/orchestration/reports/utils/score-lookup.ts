/**
 * Defensive Score Lookup Utility
 *
 * Provides safe, defensive functions for retrieving dimension scores with:
 * - Automatic alias resolution (IDS → ITD, etc.)
 * - Fallback chain support (primary → fallback scores)
 * - Detailed logging for debugging score lookup failures
 * - Validation against "Empty = Excellence" bugs
 *
 * @module score-lookup
 */

import {
  normalizeDimensionCode,
  isValidDimensionCode,
  DIMENSION_METADATA,
  type DimensionCode,
} from '../constants/dimension-codes.js';
import { extractNumericValue } from './idm-extractors.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a dimension score lookup
 */
export interface ScoreLookupResult {
  /** The score value (0-100) */
  score: number;
  /** How the score was obtained */
  source: 'direct' | 'alias' | 'fallback' | 'default';
  /** The original code that was requested */
  originalCode: string;
  /** The code that was actually used to find the score */
  resolvedCode: string;
  /** Whether the lookup found valid data */
  hasValidData: boolean;
}

/**
 * Options for score validation
 */
export interface ScoreValidationOptions {
  /** Maximum allowed deviation between Phase 1 and Phase 1.5 scores */
  maxDeviation?: number;
  /** Minimum score for Phase 1 to trigger "Empty = Excellence" check */
  criticalThreshold?: number;
  /** Score above which triggers "Empty = Excellence" check */
  excellenceThreshold?: number;
}

// ============================================================================
// MAIN LOOKUP FUNCTIONS
// ============================================================================

/**
 * Safely retrieve a dimension score with alias resolution and fallback
 *
 * This function handles:
 * - Alias resolution (e.g., ITD vs IDS mismatch)
 * - Case-insensitive matching
 * - Fallback to secondary scores if primary not found
 * - Detailed logging for debugging
 *
 * @param scores - Primary score lookup object (code → score)
 * @param requestedCode - The dimension code to look up
 * @param fallbackScores - Optional fallback scores (e.g., Phase 1 scores)
 * @returns ScoreLookupResult with score and metadata
 *
 * @example
 * // Direct lookup
 * const result = getDimensionScore({ 'ITD': 35 }, 'ITD');
 * // result.score === 35, result.source === 'direct'
 *
 * @example
 * // Alias resolution (ITD vs IDS)
 * const result = getDimensionScore({ 'IDS': 35 }, 'ITD');
 * // result.score === 35, result.source === 'alias'
 *
 * @example
 * // Fallback to Phase 1 scores
 * const result = getDimensionScore({}, 'ITD', { 'ITD': 35 });
 * // result.score === 35, result.source === 'fallback'
 */
export function getDimensionScore(
  scores: Record<string, number | unknown>,
  requestedCode: string,
  fallbackScores?: Record<string, number | unknown>
): ScoreLookupResult {
  const normalizedCode = normalizeDimensionCode(requestedCode);

  // Try 1: Look up by normalized code
  if (scores[normalizedCode] !== undefined) {
    const score = extractNumericValue(scores[normalizedCode], NaN);
    if (!isNaN(score)) {
      return {
        score,
        source: requestedCode.toUpperCase() === normalizedCode ? 'direct' : 'alias',
        originalCode: requestedCode,
        resolvedCode: normalizedCode,
        hasValidData: true,
      };
    }
  }

  // Try 2: Look up by original code (case-insensitive)
  for (const [key, value] of Object.entries(scores)) {
    if (key.toUpperCase() === requestedCode.toUpperCase()) {
      const score = extractNumericValue(value, NaN);
      if (!isNaN(score)) {
        return {
          score,
          source: 'direct',
          originalCode: requestedCode,
          resolvedCode: key,
          hasValidData: true,
        };
      }
    }
  }

  // Try 3: Look up by alternate codes (IDS ↔ ITD)
  // If requested ITD, also check IDS and vice versa
  const alternates = getAlternateCodes(normalizedCode);
  for (const altCode of alternates) {
    if (scores[altCode] !== undefined) {
      const score = extractNumericValue(scores[altCode], NaN);
      if (!isNaN(score)) {
        console.info(
          `[Score Lookup] Resolved "${requestedCode}" via alternate code "${altCode}": ${score}`
        );
        return {
          score,
          source: 'alias',
          originalCode: requestedCode,
          resolvedCode: altCode,
          hasValidData: true,
        };
      }
    }
  }

  // Try 4: Use fallback scores
  if (fallbackScores) {
    const fallbackResult = getDimensionScore(fallbackScores, requestedCode);
    if (fallbackResult.hasValidData) {
      console.warn(
        `[Score Lookup] Using fallback score for "${requestedCode}": ${fallbackResult.score}`
      );
      return {
        ...fallbackResult,
        source: 'fallback',
      };
    }
  }

  // Default case - LOG WARNING
  console.error(
    `[Score Lookup] NO SCORE FOUND for "${requestedCode}" (normalized: "${normalizedCode}")\n` +
      `  Available keys: ${Object.keys(scores).join(', ') || '(none)'}\n` +
      `  Defaulting to 0 - THIS NEEDS INVESTIGATION`
  );

  return {
    score: 0,
    source: 'default',
    originalCode: requestedCode,
    resolvedCode: normalizedCode,
    hasValidData: false,
  };
}

/**
 * Get alternate codes for a dimension (handles ITD/IDS specifically)
 */
function getAlternateCodes(code: string): string[] {
  const alternates: string[] = [];
  const upper = code.toUpperCase();

  // ITD ↔ IDS bidirectional mapping
  if (upper === 'ITD') {
    alternates.push('IDS', 'ids');
  } else if (upper === 'IDS') {
    alternates.push('ITD', 'itd');
  }

  return alternates;
}

/**
 * Get multiple dimension scores at once
 *
 * @param scores - Score lookup object
 * @param codes - Array of dimension codes to look up
 * @param fallbackScores - Optional fallback scores
 * @returns Map of code → ScoreLookupResult
 */
export function getDimensionScores(
  scores: Record<string, number | unknown>,
  codes: string[],
  fallbackScores?: Record<string, number | unknown>
): Map<string, ScoreLookupResult> {
  const results = new Map<string, ScoreLookupResult>();

  for (const code of codes) {
    results.set(code, getDimensionScore(scores, code, fallbackScores));
  }

  return results;
}

/**
 * Get all 12 dimension scores with defensive lookup
 *
 * @param scores - Score lookup object
 * @param fallbackScores - Optional fallback scores
 * @returns Array of ScoreLookupResult for all 12 dimensions
 */
export function getAllDimensionScores(
  scores: Record<string, number | unknown>,
  fallbackScores?: Record<string, number | unknown>
): ScoreLookupResult[] {
  const dimensionCodes: DimensionCode[] = [
    'STR',
    'SAL',
    'MKT',
    'CXP',
    'OPS',
    'FIN',
    'HRS',
    'LDG',
    'TIN',
    'ITD',
    'RMS',
    'CMP',
  ];

  return dimensionCodes.map(code =>
    getDimensionScore(scores, code, fallbackScores)
  );
}

// ============================================================================
// SCORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate score consistency between Phase 1 and Phase 1.5
 * Guards against "Empty = Excellence" or "Empty = Zero" bugs
 *
 * @param phase15Scores - Scores from Phase 1.5 analysis
 * @param phase1Scores - Scores from Phase 1 analysis
 * @param options - Validation options
 * @returns Array of validation warnings
 */
export function validateScoreConsistency(
  phase15Scores: Record<string, number | unknown>,
  phase1Scores: Record<string, number | unknown>,
  options: ScoreValidationOptions = {}
): string[] {
  const {
    maxDeviation = 30,
    criticalThreshold = 40,
    excellenceThreshold = 80,
  } = options;

  const warnings: string[] = [];

  for (const [code, phase15Value] of Object.entries(phase15Scores)) {
    const phase15Score = extractNumericValue(phase15Value, NaN);
    if (isNaN(phase15Score)) continue;

    const phase1Result = getDimensionScore(phase1Scores, code);

    if (phase1Result.hasValidData) {
      const deviation = Math.abs(phase15Score - phase1Result.score);

      // Check for large deviation
      if (deviation > maxDeviation) {
        warnings.push(
          `[Score Consistency] Large deviation for ${code}:\n` +
            `  Phase 1: ${phase1Result.score}\n` +
            `  Phase 1.5: ${phase15Score}\n` +
            `  Deviation: ${deviation} points`
        );
      }

      // Check for "Empty = Excellence" bug
      // If Phase 1 says Critical (<40) but Phase 1.5 says Excellence (>80), something is wrong
      if (phase1Result.score < criticalThreshold && phase15Score > excellenceThreshold) {
        warnings.push(
          `[SCORING BUG DETECTED] ${code}:\n` +
            `  Phase 1: ${phase1Result.score} (Critical)\n` +
            `  Phase 1.5: ${phase15Score} (Excellence)\n` +
            `  This is likely an "Empty = Excellence" bug.`
        );
      }

      // Check for "Empty = Zero" bug (opposite case)
      if (phase1Result.score > excellenceThreshold && phase15Score < criticalThreshold) {
        warnings.push(
          `[SCORING BUG DETECTED] ${code}:\n` +
            `  Phase 1: ${phase1Result.score} (Excellence)\n` +
            `  Phase 1.5: ${phase15Score} (Critical)\n` +
            `  This is likely an "Empty = Zero" bug.`
        );
      }
    }
  }

  // Log all warnings
  for (const warning of warnings) {
    console.warn(warning);
  }

  return warnings;
}

/**
 * Get final category score with fallback chain and validation
 *
 * @param categoryCode - The dimension/category code
 * @param phase15Analysis - Phase 1.5 analysis data (optional)
 * @param phase1Scores - Phase 1 scores for fallback
 * @returns The final validated score
 */
export function getFinalCategoryScore(
  categoryCode: string,
  phase15Analysis: {
    score?: number;
    status?: string;
    executiveSummary?: string;
    questionAnalyses?: unknown[];
  } | undefined,
  phase1Scores: Record<string, number | unknown>
): number {
  const phase1Result = getDimensionScore(phase1Scores, categoryCode);

  // Check for "Insufficient Data" conditions
  if (!phase15Analysis) {
    console.warn(
      `[Scoring] No Phase 1.5 analysis for ${categoryCode}. Using Phase 1 fallback: ${phase1Result.score}`
    );
    return phase1Result.score;
  }

  if (
    phase15Analysis.status === 'Insufficient Data' ||
    phase15Analysis.executiveSummary?.includes('cannot be completed') ||
    (phase15Analysis.questionAnalyses &&
      phase15Analysis.questionAnalyses.length === 0)
  ) {
    console.warn(
      `[Scoring] Insufficient data for ${categoryCode}. Using Phase 1 fallback: ${phase1Result.score}`
    );
    return phase1Result.score;
  }

  const phase15Score = extractNumericValue(phase15Analysis.score, NaN);

  // Validate score is reasonable
  if (isNaN(phase15Score)) {
    console.warn(
      `[Scoring] Invalid Phase 1.5 score for ${categoryCode}. Using Phase 1 fallback: ${phase1Result.score}`
    );
    return phase1Result.score;
  }

  // Guard against "Empty = Excellence" bug
  if (phase1Result.hasValidData) {
    if (phase1Result.score < 40 && phase15Score > 80) {
      console.error(
        `[SCORING BUG DETECTED] ${categoryCode}:\n` +
          `  Phase 1: ${phase1Result.score} (Critical)\n` +
          `  Phase 1.5: ${phase15Score} (Excellence)\n` +
          `  This is likely an "Empty = Excellence" bug. Using Phase 1 score.`
      );
      return phase1Result.score;
    }
  }

  return phase15Score;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a score map from dimension array
 *
 * @param dimensions - Array of dimension objects with code and score
 * @returns Score map (code → score)
 */
export function createScoreMap(
  dimensions: Array<{ code?: string; dimension_code?: string; score?: number | unknown }>
): Record<string, number> {
  const scoreMap: Record<string, number> = {};

  for (const dim of dimensions) {
    const code = dim.code || dim.dimension_code;
    if (code) {
      const normalizedCode = normalizeDimensionCode(code);
      const score = extractNumericValue(dim.score, NaN);
      if (!isNaN(score)) {
        scoreMap[normalizedCode] = score;
      }
    }
  }

  return scoreMap;
}

/**
 * Get dimension display name with fallback
 *
 * @param code - Dimension code
 * @returns Display name or the code itself if not found
 */
export function getDimensionDisplayName(code: string): string {
  const normalized = normalizeDimensionCode(code);
  return DIMENSION_METADATA[normalized]?.name || code;
}

/**
 * Check if a score indicates missing data (defaults)
 *
 * @param result - ScoreLookupResult to check
 * @returns true if the score was defaulted due to missing data
 */
export function isDefaultedScore(result: ScoreLookupResult): boolean {
  return result.source === 'default' || !result.hasValidData;
}

/**
 * Log a summary of all score lookups for debugging
 *
 * @param results - Array of ScoreLookupResult
 */
export function logScoreLookupSummary(results: ScoreLookupResult[]): void {
  const direct = results.filter(r => r.source === 'direct').length;
  const alias = results.filter(r => r.source === 'alias').length;
  const fallback = results.filter(r => r.source === 'fallback').length;
  const defaulted = results.filter(r => r.source === 'default').length;

  console.info(
    `[Score Lookup Summary]\n` +
      `  Direct lookups: ${direct}\n` +
      `  Alias resolutions: ${alias}\n` +
      `  Fallback used: ${fallback}\n` +
      `  Defaulted (missing): ${defaulted}`
  );

  if (defaulted > 0) {
    const missingCodes = results
      .filter(r => r.source === 'default')
      .map(r => r.originalCode)
      .join(', ');
    console.warn(`  Missing scores for: ${missingCodes}`);
  }
}
