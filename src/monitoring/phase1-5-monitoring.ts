/**
 * Phase 1.5 Monitoring & Observability
 * Tracks execution metrics, costs, and anomalies
 */

import type { CategoryAnalysis, Phase1_5Output } from '../types/phase1-5.types.js';
import type { CategoryCode } from '../data/question-category-mapping.js';

export interface Phase15ExecutionMetrics {
  batchId: string;
  submittedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  categoriesRequested: number;
  categoriesSucceeded: number;
  categoriesFallback: number;
  categoriesRetried: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
}

export interface Phase15Anomaly {
  type: 'low_score' | 'high_variance' | 'multiple_critical' | 'missing_data' | 'extreme_gap';
  severity: 'info' | 'warning' | 'critical';
  affectedCategories: string[];
  description: string;
  recommendation: string;
}

// Claude Sonnet pricing (as of 2024)
const COST_PER_1K_INPUT_TOKENS = 0.003;
const COST_PER_1K_OUTPUT_TOKENS = 0.015;

// Thresholds for anomaly detection
const ANOMALY_THRESHOLDS = {
  lowScoreThreshold: 30,
  criticalCategoryCountThreshold: 2,
  highVarianceStdDev: 25,
  extremeGapThreshold: 40
};

/**
 * Log Phase 1.5 execution start
 */
export function logPhase15ExecutionStart(
  batchId: string,
  categoriesRequested: number
): Phase15ExecutionMetrics {
  const metrics: Phase15ExecutionMetrics = {
    batchId,
    submittedAt: new Date().toISOString(),
    categoriesRequested,
    categoriesSucceeded: 0,
    categoriesFallback: 0,
    categoriesRetried: 0,
    totalTokensUsed: 0,
    estimatedCostUsd: 0
  };

  console.log('\n📊 Phase 1.5 Execution Started');
  console.log(`   Batch ID: ${batchId}`);
  console.log(`   Categories: ${categoriesRequested}`);
  console.log(`   Started: ${metrics.submittedAt}`);

  return metrics;
}

/**
 * Log Phase 1.5 execution completion
 */
export function logPhase15ExecutionComplete(
  metrics: Phase15ExecutionMetrics,
  categoryAnalyses: CategoryAnalysis[],
  recoveryStats: { succeeded: number; retried: number; fallback: number }
): void {
  metrics.completedAt = new Date().toISOString();

  const startTime = new Date(metrics.submittedAt).getTime();
  const endTime = new Date(metrics.completedAt).getTime();
  metrics.durationMinutes = Math.round((endTime - startTime) / 60000 * 100) / 100;

  metrics.categoriesSucceeded = recoveryStats.succeeded;
  metrics.categoriesRetried = recoveryStats.retried;
  metrics.categoriesFallback = recoveryStats.fallback;

  // Calculate token usage and cost
  metrics.totalTokensUsed = categoryAnalyses.reduce(
    (sum, cat) => sum + ((cat.analysisMetadata?.promptTokens || 0) + (cat.analysisMetadata?.completionTokens || 0)),
    0
  );

  // Estimate cost (simplified - assumes ~2000 input tokens, ~4000 output tokens per category)
  const inputTokens = categoryAnalyses.length * 2000;
  const outputTokens = metrics.totalTokensUsed || categoryAnalyses.length * 4000;
  metrics.estimatedCostUsd = Math.round(
    ((inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS +
     (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS) * 100
  ) / 100;

  console.log('\n📊 Phase 1.5 Execution Complete');
  console.log('─'.repeat(50));
  console.log(`   Duration: ${metrics.durationMinutes} minutes`);
  console.log(`   Categories: ${metrics.categoriesSucceeded}/${metrics.categoriesRequested} succeeded`);
  if (metrics.categoriesRetried > 0) {
    console.log(`   Retried: ${metrics.categoriesRetried}`);
  }
  if (metrics.categoriesFallback > 0) {
    console.warn(`   ⚠️ Fallback: ${metrics.categoriesFallback}`);
  }
  console.log(`   Tokens: ${metrics.totalTokensUsed.toLocaleString()}`);
  console.log(`   Est. Cost: $${metrics.estimatedCostUsd.toFixed(2)}`);
  console.log('─'.repeat(50));
}

/**
 * Detect anomalies in Phase 1.5 output
 */
export function detectPhase15Anomalies(
  categoryAnalyses: CategoryAnalysis[]
): Phase15Anomaly[] {
  const anomalies: Phase15Anomaly[] = [];

  if (categoryAnalyses.length === 0) {
    return anomalies;
  }

  // Check for very low scores
  const lowScoreCategories = categoryAnalyses.filter(c => c.overallScore < ANOMALY_THRESHOLDS.lowScoreThreshold);
  if (lowScoreCategories.length > 0) {
    anomalies.push({
      type: 'low_score',
      severity: lowScoreCategories.length >= 3 ? 'critical' : 'warning',
      affectedCategories: lowScoreCategories.map(c => c.categoryCode),
      description: `${lowScoreCategories.length} categories have critically low scores (<${ANOMALY_THRESHOLDS.lowScoreThreshold})`,
      recommendation: 'Prioritize immediate intervention in these areas'
    });
  }

  // Check for high variance
  const scores = categoryAnalyses.map(c => c.overallScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > ANOMALY_THRESHOLDS.highVarianceStdDev) {
    anomalies.push({
      type: 'high_variance',
      severity: 'warning',
      affectedCategories: categoryAnalyses.map(c => c.categoryCode),
      description: `High variance across categories (σ=${stdDev.toFixed(1)})`,
      recommendation: 'Investigate root causes of performance disparities'
    });
  }

  // Check for multiple critical status categories
  const criticalCategories = categoryAnalyses.filter(c => c.status === 'Critical');
  if (criticalCategories.length >= ANOMALY_THRESHOLDS.criticalCategoryCountThreshold) {
    anomalies.push({
      type: 'multiple_critical',
      severity: 'critical',
      affectedCategories: criticalCategories.map(c => c.categoryCode),
      description: `${criticalCategories.length} categories in Critical status`,
      recommendation: 'Executive escalation recommended for systemic issues'
    });
  }

  // Check for categories with no strengths or weaknesses (data quality issue)
  const emptyCategories = categoryAnalyses.filter(
    c => c.strengths.length === 0 || c.weaknesses.length === 0
  );
  if (emptyCategories.length > 0) {
    anomalies.push({
      type: 'missing_data',
      severity: 'info',
      affectedCategories: emptyCategories.map(c => c.categoryCode),
      description: `${emptyCategories.length} categories have incomplete strength/weakness data`,
      recommendation: 'Review questionnaire responses for completeness'
    });
  }

  // Check for extreme gaps between best and worst categories
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const gap = maxScore - minScore;

  if (gap >= ANOMALY_THRESHOLDS.extremeGapThreshold) {
    const bestCategory = categoryAnalyses.find(c => c.overallScore === maxScore);
    const worstCategory = categoryAnalyses.find(c => c.overallScore === minScore);

    anomalies.push({
      type: 'extreme_gap',
      severity: 'warning',
      affectedCategories: [bestCategory?.categoryCode || '', worstCategory?.categoryCode || ''].filter(Boolean),
      description: `Extreme performance gap (${gap} points) between ${bestCategory?.categoryCode} (${maxScore}) and ${worstCategory?.categoryCode} (${minScore})`,
      recommendation: 'Consider resource reallocation from high-performing to struggling areas'
    });
  }

  return anomalies;
}

/**
 * Log detected anomalies
 */
export function logPhase15Anomalies(categoryAnalyses: CategoryAnalysis[]): void {
  const anomalies = detectPhase15Anomalies(categoryAnalyses);

  if (anomalies.length === 0) {
    console.log('✓ No anomalies detected in Phase 1.5 output');
    return;
  }

  console.log(`\n⚠️ Phase 1.5 Anomalies Detected (${anomalies.length}):`);

  for (const anomaly of anomalies) {
    const icon = anomaly.severity === 'critical' ? '🔴' :
                 anomaly.severity === 'warning' ? '🟡' : '🔵';

    console.log(`\n${icon} ${anomaly.type.toUpperCase()}`);
    console.log(`   ${anomaly.description}`);
    console.log(`   Categories: ${anomaly.affectedCategories.join(', ')}`);
    console.log(`   → ${anomaly.recommendation}`);
  }
}

/**
 * Generate metrics summary for logging/reporting
 */
export function generateMetricsSummary(
  metrics: Phase15ExecutionMetrics,
  categoryAnalyses: CategoryAnalysis[]
): string {
  const scores = categoryAnalyses.map(c => c.overallScore);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  return [
    '=== Phase 1.5 Metrics Summary ===',
    `Batch ID: ${metrics.batchId}`,
    `Duration: ${metrics.durationMinutes ?? 'N/A'} minutes`,
    `Categories: ${metrics.categoriesSucceeded}/${metrics.categoriesRequested}`,
    `Retried: ${metrics.categoriesRetried}`,
    `Fallback: ${metrics.categoriesFallback}`,
    `Tokens Used: ${metrics.totalTokensUsed.toLocaleString()}`,
    `Est. Cost: $${metrics.estimatedCostUsd.toFixed(2)}`,
    `Avg Score: ${avgScore.toFixed(1)}`,
    `Score Range: ${minScore} - ${maxScore}`,
    '================================='
  ].join('\n');
}

/**
 * Get category score distribution
 */
export function getCategoryScoreDistribution(categoryAnalyses: CategoryAnalysis[]): {
  critical: string[];
  needsImprovement: string[];
  developing: string[];
  good: string[];
  excellent: string[];
} {
  return {
    critical: categoryAnalyses.filter(c => c.overallScore < 20).map(c => c.categoryCode),
    needsImprovement: categoryAnalyses.filter(c => c.overallScore >= 20 && c.overallScore < 40).map(c => c.categoryCode),
    developing: categoryAnalyses.filter(c => c.overallScore >= 40 && c.overallScore < 60).map(c => c.categoryCode),
    good: categoryAnalyses.filter(c => c.overallScore >= 60 && c.overallScore < 80).map(c => c.categoryCode),
    excellent: categoryAnalyses.filter(c => c.overallScore >= 80).map(c => c.categoryCode)
  };
}

/**
 * Calculate health trend across chapters
 */
export function calculateChapterTrends(
  categoryAnalyses: CategoryAnalysis[]
): Record<string, { avg: number; categories: string[]; status: 'strong' | 'moderate' | 'weak' }> {
  const chapterGroups: Record<string, CategoryAnalysis[]> = {};

  for (const cat of categoryAnalyses) {
    const chapter = cat.chapterCode;
    if (!chapterGroups[chapter]) {
      chapterGroups[chapter] = [];
    }
    chapterGroups[chapter].push(cat);
  }

  const result: Record<string, { avg: number; categories: string[]; status: 'strong' | 'moderate' | 'weak' }> = {};

  for (const [chapter, cats] of Object.entries(chapterGroups)) {
    const scores = cats.map(c => c.overallScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    result[chapter] = {
      avg: Math.round(avg * 10) / 10,
      categories: cats.map(c => c.categoryCode),
      status: avg >= 65 ? 'strong' : avg >= 45 ? 'moderate' : 'weak'
    };
  }

  return result;
}
