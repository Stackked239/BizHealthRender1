/**
 * Overall Health Score Calculator
 * BizHealth.ai Unified Pipeline
 *
 * Calculates the overall business health score from category scores.
 * Implements weighted average with configurable category weights.
 */

import { CategoryCode } from '../../types/question-mapping.types.js';
import { CategoryScoreResult, getHealthStatus, HealthStatus } from './category-scorer.js';
import { logger } from '../logging/pipeline-logger.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface OverallHealthResult {
  overallScore: number | null;
  descriptor: HealthStatus | 'INSUFFICIENT_DATA';
  trajectory: 'Improving' | 'Stable' | 'Declining' | 'Unknown';
  categoriesWithScores: number;
  totalCategories: number;
  categoryContributions: Array<{
    categoryCode: CategoryCode;
    score: number | null;
    weight: number;
    contribution: number | null;
  }>;
  confidenceLevel: 'high' | 'medium' | 'low';
  warnings: string[];
}

// =============================================================================
// CATEGORY WEIGHTS
// =============================================================================

// Default weights (can be overridden by config)
const DEFAULT_CATEGORY_WEIGHTS: Record<CategoryCode, number> = {
  STR: 1.2,  // Strategy - high importance
  SAL: 1.3,  // Sales - critical for survival
  MKT: 1.1,  // Marketing
  CXP: 1.2,  // Customer Experience - retention critical
  OPS: 1.1,  // Operations
  FIN: 1.4,  // Financials - survival critical
  HRS: 0.8,  // HR - less complex for micro
  LDG: 0.9,  // Leadership
  TIN: 0.9,  // Technology
  ITD: 0.8,  // IT/Data
  RMS: 1.0,  // Risk Management
  CMP: 1.0   // Compliance
};

// =============================================================================
// MAIN CALCULATION FUNCTION
// =============================================================================

/**
 * Calculate overall health score from category results
 */
export function calculateOverallHealthScore(
  categoryResults: Map<CategoryCode, CategoryScoreResult>,
  categoryWeights: Record<CategoryCode, number> = DEFAULT_CATEGORY_WEIGHTS
): OverallHealthResult {
  const warnings: string[] = [];
  const totalCategories = categoryResults.size;

  // Filter categories with valid scores
  const validCategories = Array.from(categoryResults.entries())
    .filter(([_, result]) => result.score !== null);

  // Handle insufficient data
  if (validCategories.length === 0) {
    logger.error({ totalCategories }, 'No categories have valid scores');
    return {
      overallScore: null,
      descriptor: 'INSUFFICIENT_DATA',
      trajectory: 'Unknown',
      categoriesWithScores: 0,
      totalCategories,
      categoryContributions: [],
      confidenceLevel: 'low',
      warnings: ['No category data available for health score calculation']
    };
  }

  // Calculate coverage and confidence
  const coverageRatio = validCategories.length / totalCategories;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';

  if (coverageRatio < 0.5) {
    confidenceLevel = 'low';
    warnings.push(`Only ${validCategories.length}/${totalCategories} categories have data - result may be unreliable`);
  } else if (coverageRatio < 0.8) {
    confidenceLevel = 'medium';
    warnings.push(`${totalCategories - validCategories.length} categories missing data`);
  }

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;
  const categoryContributions: OverallHealthResult['categoryContributions'] = [];

  for (const [categoryCode, result] of categoryResults.entries()) {
    const weight = categoryWeights[categoryCode] || 1.0;

    if (result.score !== null) {
      const contribution = result.score * weight;
      weightedSum += contribution;
      totalWeight += weight;

      categoryContributions.push({
        categoryCode,
        score: result.score,
        weight,
        contribution: Math.round(contribution * 100) / 100
      });
    } else {
      categoryContributions.push({
        categoryCode,
        score: null,
        weight,
        contribution: null
      });
    }
  }

  const overallScore = Math.round(weightedSum / totalWeight);
  const descriptor = getHealthStatus(overallScore);

  // Sort contributions by absolute contribution (descending)
  categoryContributions.sort((a, b) => {
    const aContrib = a.contribution ?? 0;
    const bContrib = b.contribution ?? 0;
    return bContrib - aContrib;
  });

  const result: OverallHealthResult = {
    overallScore,
    descriptor,
    trajectory: 'Unknown',  // Would need historical data to determine
    categoriesWithScores: validCategories.length,
    totalCategories,
    categoryContributions,
    confidenceLevel,
    warnings
  };

  logger.info({
    overallScore,
    descriptor,
    categoriesWithScores: validCategories.length,
    totalCategories,
    confidenceLevel
  }, 'Overall health score calculated');

  return result;
}

/**
 * Get top strengths (highest scoring categories)
 */
export function getTopStrengths(
  categoryResults: Map<CategoryCode, CategoryScoreResult>,
  limit: number = 3
): Array<{ categoryCode: CategoryCode; score: number; status: string }> {
  return Array.from(categoryResults.entries())
    .filter(([_, result]) => result.score !== null && result.score >= 60)
    .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))
    .slice(0, limit)
    .map(([code, result]) => ({
      categoryCode: code,
      score: result.score!,
      status: result.status
    }));
}

/**
 * Get top weaknesses (lowest scoring categories)
 */
export function getTopWeaknesses(
  categoryResults: Map<CategoryCode, CategoryScoreResult>,
  limit: number = 3
): Array<{ categoryCode: CategoryCode; score: number; status: string }> {
  return Array.from(categoryResults.entries())
    .filter(([_, result]) => result.score !== null)
    .sort((a, b) => (a[1].score ?? 100) - (b[1].score ?? 100))
    .slice(0, limit)
    .map(([code, result]) => ({
      categoryCode: code,
      score: result.score!,
      status: result.status
    }));
}
