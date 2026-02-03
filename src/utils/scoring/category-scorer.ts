/**
 * Category Scoring Engine
 * BizHealth.ai Unified Pipeline
 *
 * Calculates category scores from normalized responses.
 * Used by Phase 1.5 in both BIG and LIL pipelines.
 */

import { NormalizedResponse } from '../../types/schemas/questionnaire-response.schema.js';
import { CategoryCode, HEALTH_BANDS, HealthBand } from '../../types/question-mapping.types.js';
import { logger } from '../logging/pipeline-logger.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Confidence = 'high' | 'medium' | 'low' | 'none';
export type HealthStatus = 'Critical' | 'Attention' | 'Proficiency' | 'Excellence' | 'NO_DATA';

export interface CategoryScoreResult {
  categoryCode: CategoryCode;
  score: number | null;
  status: HealthStatus;
  confidence: Confidence;
  questionCount: number;
  validQuestionCount: number;
  weightedAverage: number | null;
  scoreBreakdown: {
    minScore: number | null;
    maxScore: number | null;
    standardDeviation: number | null;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get health status from score
 */
export function getHealthStatus(score: number): HealthStatus {
  if (score >= HEALTH_BANDS.EXCELLENCE.min) return 'Excellence';
  if (score >= HEALTH_BANDS.PROFICIENCY.min) return 'Proficiency';
  if (score >= HEALTH_BANDS.ATTENTION.min) return 'Attention';
  return 'Critical';
}

/**
 * Get health band details from score
 */
export function getHealthBand(score: number): typeof HEALTH_BANDS[HealthBand] {
  if (score >= HEALTH_BANDS.EXCELLENCE.min) return HEALTH_BANDS.EXCELLENCE;
  if (score >= HEALTH_BANDS.PROFICIENCY.min) return HEALTH_BANDS.PROFICIENCY;
  if (score >= HEALTH_BANDS.ATTENTION.min) return HEALTH_BANDS.ATTENTION;
  return HEALTH_BANDS.CRITICAL;
}

/**
 * Get confidence level based on question coverage
 */
export function getConfidence(validCount: number, expectedCount: number): Confidence {
  if (validCount === 0) return 'none';
  const coverage = validCount / expectedCount;
  if (coverage >= 0.8) return 'high';
  if (coverage >= 0.5) return 'medium';
  return 'low';
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// =============================================================================
// MAIN SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate score for a single category
 */
export function calculateCategoryScore(
  categoryCode: CategoryCode,
  responses: NormalizedResponse[],
  expectedQuestionCount: number
): CategoryScoreResult {
  const validResponses = responses.filter(r => r.isValid && r.normalizedScore !== null);

  // Handle no data case
  if (validResponses.length === 0) {
    logger.warn({ categoryCode, totalResponses: responses.length }, 'No valid responses for category');
    return {
      categoryCode,
      score: null,
      status: 'NO_DATA',
      confidence: 'none',
      questionCount: responses.length,
      validQuestionCount: 0,
      weightedAverage: null,
      scoreBreakdown: {
        minScore: null,
        maxScore: null,
        standardDeviation: null
      }
    };
  }

  // Calculate weighted average
  const totalWeight = validResponses.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = validResponses.reduce((sum, r) => sum + (r.normalizedScore * r.weight), 0);
  const weightedAverage = weightedSum / totalWeight;
  const score = Math.round(weightedAverage);

  // Calculate score breakdown
  const scores = validResponses.map(r => r.normalizedScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const standardDeviation = calculateStandardDeviation(scores);

  const result: CategoryScoreResult = {
    categoryCode,
    score,
    status: getHealthStatus(score),
    confidence: getConfidence(validResponses.length, expectedQuestionCount),
    questionCount: responses.length,
    validQuestionCount: validResponses.length,
    weightedAverage,
    scoreBreakdown: {
      minScore,
      maxScore,
      standardDeviation: Math.round(standardDeviation * 100) / 100
    }
  };

  logger.info({
    categoryCode,
    score,
    status: result.status,
    confidence: result.confidence,
    validQuestions: `${validResponses.length}/${responses.length}`
  }, 'Category score calculated');

  return result;
}

/**
 * Calculate scores for all categories
 */
export function calculateAllCategoryScores(
  normalizedResponses: Record<string, NormalizedResponse>,
  categoryConfigs: Array<{ code: CategoryCode; expectedQuestionCount: number }>
): Map<CategoryCode, CategoryScoreResult> {
  const results = new Map<CategoryCode, CategoryScoreResult>();

  for (const config of categoryConfigs) {
    // Filter responses for this category
    const categoryResponses = Object.values(normalizedResponses)
      .filter(r => r.categoryCode === config.code);

    const result = calculateCategoryScore(
      config.code,
      categoryResponses,
      config.expectedQuestionCount
    );
    results.set(config.code, result);
  }

  // Log summary
  const validCategories = Array.from(results.values()).filter(r => r.score !== null);
  logger.info({
    totalCategories: results.size,
    categoriesWithScores: validCategories.length,
    categoriesWithoutData: results.size - validCategories.length
  }, 'All category scores calculated');

  return results;
}
