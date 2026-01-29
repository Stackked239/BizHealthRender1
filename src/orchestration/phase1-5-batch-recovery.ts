/**
 * Phase 1.5 Batch Error Recovery
 * Handles retry logic and fallback generation for failed category analyses
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CategoryAnalysis } from '../types/phase1-5.types.js';
import type { Phase0Output } from '../types/normalized.types.js';
import { getBenchmarksForCategory } from '../data/benchmark-library.js';
import { getCategoryName, getChapterForCategory, getChapterName } from '../data/question-category-mapping.js';
import type { CategoryCode, ChapterCode } from '../data/question-category-mapping.js';

export interface CategoryBatchRequest {
  custom_id: string;
  params: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: string; content: string }>;
  };
  categoryCode: CategoryCode;
}

export interface RecoveryResult {
  categoryCode: CategoryCode;
  status: 'ok' | 'retried' | 'fallback';
  attempts: number;
  errorMessages: string[];
}

export interface RecoveryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxAttempts: 3,
  backoffMs: 2000,
  backoffMultiplier: 2
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a failed category request with exponential backoff
 */
export async function retryFailedCategoryRequest(
  request: CategoryBatchRequest,
  _phase0Output: Phase0Output,
  config: RecoveryConfig = DEFAULT_RECOVERY_CONFIG
): Promise<{ analysis: CategoryAnalysis | null; recoveryResult: RecoveryResult }> {
  const { categoryCode } = request;
  const errorMessages: string[] = [];
  let currentBackoff = config.backoffMs;

  const anthropic = new Anthropic();

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`Phase 1.5 Recovery: Retrying ${categoryCode} (attempt ${attempt}/${config.maxAttempts})...`);

      const response = await anthropic.messages.create({
        model: request.params.model,
        max_tokens: request.params.max_tokens,
        system: request.params.system,
        messages: request.params.messages as Anthropic.MessageCreateParams['messages']
      });

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Clean up JSON response
      let analysisText = content.text.trim();
      if (analysisText.startsWith('```json')) {
        analysisText = analysisText.slice(7);
      }
      if (analysisText.startsWith('```')) {
        analysisText = analysisText.slice(3);
      }
      if (analysisText.endsWith('```')) {
        analysisText = analysisText.slice(0, -3);
      }

      const analysis = JSON.parse(analysisText) as CategoryAnalysis;

      // Validate basic structure
      if (!analysis.categoryCode || typeof analysis.overallScore !== 'number') {
        throw new Error('Invalid CategoryAnalysis structure');
      }

      console.log(`✓ Phase 1.5 Recovery: ${categoryCode} succeeded on attempt ${attempt}`);

      return {
        analysis,
        recoveryResult: {
          categoryCode,
          status: attempt === 1 ? 'ok' : 'retried',
          attempts: attempt,
          errorMessages
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errorMessages.push(`Attempt ${attempt}: ${message}`);

      if (attempt < config.maxAttempts) {
        console.warn(`⚠️ Phase 1.5 Recovery: ${categoryCode} failed, waiting ${currentBackoff}ms before retry`);
        await sleep(currentBackoff);
        currentBackoff *= config.backoffMultiplier;
      }
    }
  }

  // All retries exhausted - generate fallback
  console.warn(`⚠️ Phase 1.5 Recovery: Using fallback analysis for ${categoryCode} after ${config.maxAttempts} failed attempts`);

  const fallbackAnalysis = buildFallbackCategoryAnalysis(categoryCode);

  return {
    analysis: fallbackAnalysis,
    recoveryResult: {
      categoryCode,
      status: 'fallback',
      attempts: config.maxAttempts,
      errorMessages
    }
  };
}

/**
 * Build a fallback CategoryAnalysis using benchmarks when API fails
 */
export function buildFallbackCategoryAnalysis(
  categoryCode: CategoryCode
): CategoryAnalysis {
  const categoryName = getCategoryName(categoryCode);
  const chapterCode = getChapterForCategory(categoryCode);
  const chapterName = getChapterName(chapterCode);
  const benchmarks = getBenchmarksForCategory(categoryCode);

  // Use industry average benchmark as fallback score
  const fallbackScore = 55; // Mid-range default

  return {
    categoryCode,
    categoryName,
    chapterCode,
    chapterName,
    overallScore: fallbackScore,
    confidenceLevel: 'low',
    status: 'Developing',
    questionCount: 0,
    questionAnalyses: [],
    executiveSummary: `Analysis for ${categoryName} could not be completed due to processing errors. This assessment uses industry benchmark data as a baseline.`,
    detailedAnalysis: `Due to technical limitations, this category analysis is based on industry benchmark data rather than questionnaire responses. The score of ${fallbackScore} represents an industry-average baseline. A full reassessment is recommended to obtain accurate, company-specific insights.`,
    strengths: [{
      title: 'Benchmark Baseline Available',
      description: 'Industry benchmark data provides a reference point for this category.',
      evidence: ['Based on industry standard metrics'],
      impactLevel: 'medium'
    }],
    weaknesses: [{
      title: 'Limited Data Available',
      description: 'Full questionnaire analysis could not be completed.',
      evidence: ['Processing error during batch analysis'],
      severity: 'medium',
      rootCause: 'Technical processing error'
    }],
    quickWins: [{
      title: 'Complete Full Assessment',
      description: 'Re-run the assessment to obtain complete analysis for this category.',
      effort: 'low',
      impact: 'high',
      timeline: '1-2 days',
      estimatedROI: 'Accurate insights for strategic planning'
    }],
    categoryRisks: [{
      title: 'Incomplete Analysis',
      description: 'Strategic decisions should not be based solely on this fallback analysis.',
      likelihood: 'high',
      impact: 'medium',
      mitigation: 'Schedule reassessment for complete data'
    }],
    benchmarkComparisons: benchmarks.slice(0, 3).map(b => ({
      metricName: b.metricName,
      companyValue: 0,
      industryAverage: b.benchmarks.industry.average,
      industryExcellent: b.benchmarks.industry.excellent,
      position: 'average' as const,
      gap: 0,
      gapInterpretation: 'Unable to calculate gap without company data'
    })),
    analysisMetadata: {
      promptTokens: 0,
      completionTokens: 0,
      processingTimeMs: 0,
      modelUsed: 'fallback'
    }
  };
}

/**
 * Log recovery summary table
 */
export function logRecoverySummary(results: RecoveryResult[]): void {
  console.log('\nPhase 1.5 Recovery Summary:');
  console.log('─'.repeat(70));
  console.log('Category │ Status   │ Attempts │ Notes');
  console.log('─'.repeat(70));

  for (const result of results) {
    const statusEmoji = result.status === 'ok' ? '✓' :
                        result.status === 'retried' ? '↻' : '⚠';
    const notes = result.errorMessages.length > 0
      ? result.errorMessages[result.errorMessages.length - 1].substring(0, 30) + '...'
      : 'Success';

    console.log(
      `${result.categoryCode.padEnd(8)} │ ${statusEmoji} ${result.status.padEnd(7)} │ ${String(result.attempts).padEnd(8)} │ ${notes}`
    );
  }
  console.log('─'.repeat(70));

  const fallbackCount = results.filter(r => r.status === 'fallback').length;
  if (fallbackCount > 0) {
    console.warn(`⚠️ ${fallbackCount} categories using fallback analysis - consider re-running`);
  }
}

/**
 * Get recovery statistics
 */
export function getRecoveryStats(results: RecoveryResult[]): {
  succeeded: number;
  retried: number;
  fallback: number;
  totalAttempts: number;
} {
  return {
    succeeded: results.filter(r => r.status === 'ok').length,
    retried: results.filter(r => r.status === 'retried').length,
    fallback: results.filter(r => r.status === 'fallback').length,
    totalAttempts: results.reduce((sum, r) => sum + r.attempts, 0)
  };
}
