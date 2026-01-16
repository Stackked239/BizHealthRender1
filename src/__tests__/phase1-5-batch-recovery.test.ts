/**
 * Phase 1.5 Batch Recovery Tests
 *
 * Tests for:
 * - Fallback analysis generation
 * - Recovery statistics
 * - Recovery logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  buildFallbackCategoryAnalysis,
  logRecoverySummary,
  getRecoveryStats,
  type RecoveryResult
} from '../orchestration/phase1-5-batch-recovery.js';

import type { CategoryCode } from '../data/question-category-mapping.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createRecoveryResults = (): RecoveryResult[] => [
  { categoryCode: 'STR', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'SAL', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'MKT', status: 'retried', attempts: 2, errorMessages: ['Attempt 1: Rate limit'] },
  { categoryCode: 'CXP', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'OPS', status: 'fallback', attempts: 3, errorMessages: ['Attempt 1: Error', 'Attempt 2: Error', 'Attempt 3: Error'] },
  { categoryCode: 'FIN', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'HRS', status: 'retried', attempts: 2, errorMessages: ['Attempt 1: Timeout'] },
  { categoryCode: 'LDG', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'TIN', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'ITD', status: 'ok', attempts: 1, errorMessages: [] },
  { categoryCode: 'RMS', status: 'fallback', attempts: 3, errorMessages: ['Attempt 1: Error', 'Attempt 2: Error', 'Attempt 3: Error'] },
  { categoryCode: 'CMP', status: 'ok', attempts: 1, errorMessages: [] }
];

// ============================================================================
// buildFallbackCategoryAnalysis Tests
// ============================================================================

describe('buildFallbackCategoryAnalysis', () => {
  it('should generate valid CategoryAnalysis for STR', () => {
    const analysis = buildFallbackCategoryAnalysis('STR');

    expect(analysis.categoryCode).toBe('STR');
    expect(analysis.categoryName).toBe('Strategy');
    expect(analysis.chapterCode).toBe('GE');
    expect(analysis.chapterName).toBe('Growth Engine');
  });

  it('should set fallback score to 55', () => {
    const analysis = buildFallbackCategoryAnalysis('SAL');

    expect(analysis.overallScore).toBe(55);
  });

  it('should set low confidence level', () => {
    const analysis = buildFallbackCategoryAnalysis('MKT');

    expect(analysis.confidenceLevel).toBe('low');
  });

  it('should set Developing status', () => {
    const analysis = buildFallbackCategoryAnalysis('CXP');

    expect(analysis.status).toBe('Developing');
  });

  it('should include executive summary explaining fallback', () => {
    const analysis = buildFallbackCategoryAnalysis('OPS');

    expect(analysis.executiveSummary).toContain('could not be completed');
    expect(analysis.executiveSummary).toContain('benchmark data');
  });

  it('should include detailed analysis explaining fallback', () => {
    const analysis = buildFallbackCategoryAnalysis('FIN');

    expect(analysis.detailedAnalysis).toContain('technical limitations');
    expect(analysis.detailedAnalysis).toContain('reassessment is recommended');
  });

  it('should include at least one strength', () => {
    const analysis = buildFallbackCategoryAnalysis('HRS');

    expect(analysis.strengths).toHaveLength(1);
    expect(analysis.strengths[0].title).toBe('Benchmark Baseline Available');
  });

  it('should include at least one weakness', () => {
    const analysis = buildFallbackCategoryAnalysis('LDG');

    expect(analysis.weaknesses).toHaveLength(1);
    expect(analysis.weaknesses[0].title).toBe('Limited Data Available');
  });

  it('should include quick win to complete assessment', () => {
    const analysis = buildFallbackCategoryAnalysis('TIN');

    expect(analysis.quickWins).toHaveLength(1);
    expect(analysis.quickWins[0].title).toBe('Complete Full Assessment');
    expect(analysis.quickWins[0].effort).toBe('low');
    expect(analysis.quickWins[0].impact).toBe('high');
  });

  it('should include risk about incomplete analysis', () => {
    const analysis = buildFallbackCategoryAnalysis('ITD');

    expect(analysis.categoryRisks).toHaveLength(1);
    expect(analysis.categoryRisks[0].title).toBe('Incomplete Analysis');
  });

  it('should include benchmark comparisons', () => {
    const analysis = buildFallbackCategoryAnalysis('RMS');

    expect(Array.isArray(analysis.benchmarkComparisons)).toBe(true);
    // May have 0-3 comparisons depending on benchmark data available
    expect(analysis.benchmarkComparisons.length).toBeLessThanOrEqual(3);
  });

  it('should set zero token usage in metadata', () => {
    const analysis = buildFallbackCategoryAnalysis('CMP');

    expect(analysis.analysisMetadata.promptTokens).toBe(0);
    expect(analysis.analysisMetadata.completionTokens).toBe(0);
    expect(analysis.analysisMetadata.processingTimeMs).toBe(0);
    expect(analysis.analysisMetadata.modelUsed).toBe('fallback');
  });

  it('should set zero question count', () => {
    const analysis = buildFallbackCategoryAnalysis('STR');

    expect(analysis.questionCount).toBe(0);
    expect(analysis.questionAnalyses).toHaveLength(0);
  });

  it('should work for all 12 category codes', () => {
    const categoryCodes: CategoryCode[] = [
      'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
      'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
    ];

    for (const code of categoryCodes) {
      const analysis = buildFallbackCategoryAnalysis(code);
      expect(analysis.categoryCode).toBe(code);
      expect(analysis.overallScore).toBe(55);
    }
  });
});

// ============================================================================
// getRecoveryStats Tests
// ============================================================================

describe('getRecoveryStats', () => {
  it('should count succeeded categories', () => {
    const results = createRecoveryResults();
    const stats = getRecoveryStats(results);

    expect(stats.succeeded).toBe(8); // 8 'ok' statuses
  });

  it('should count retried categories', () => {
    const results = createRecoveryResults();
    const stats = getRecoveryStats(results);

    expect(stats.retried).toBe(2); // MKT and HRS
  });

  it('should count fallback categories', () => {
    const results = createRecoveryResults();
    const stats = getRecoveryStats(results);

    expect(stats.fallback).toBe(2); // OPS and RMS
  });

  it('should calculate total attempts', () => {
    const results = createRecoveryResults();
    const stats = getRecoveryStats(results);

    // 8*1 + 2*2 + 2*3 = 8 + 4 + 6 = 18
    expect(stats.totalAttempts).toBe(18);
  });

  it('should handle empty results', () => {
    const stats = getRecoveryStats([]);

    expect(stats.succeeded).toBe(0);
    expect(stats.retried).toBe(0);
    expect(stats.fallback).toBe(0);
    expect(stats.totalAttempts).toBe(0);
  });

  it('should handle all successful results', () => {
    const results: RecoveryResult[] = [
      { categoryCode: 'STR', status: 'ok', attempts: 1, errorMessages: [] },
      { categoryCode: 'SAL', status: 'ok', attempts: 1, errorMessages: [] }
    ];
    const stats = getRecoveryStats(results);

    expect(stats.succeeded).toBe(2);
    expect(stats.retried).toBe(0);
    expect(stats.fallback).toBe(0);
    expect(stats.totalAttempts).toBe(2);
  });

  it('should handle all fallback results', () => {
    const results: RecoveryResult[] = [
      { categoryCode: 'STR', status: 'fallback', attempts: 3, errorMessages: ['e1', 'e2', 'e3'] },
      { categoryCode: 'SAL', status: 'fallback', attempts: 3, errorMessages: ['e1', 'e2', 'e3'] }
    ];
    const stats = getRecoveryStats(results);

    expect(stats.succeeded).toBe(0);
    expect(stats.retried).toBe(0);
    expect(stats.fallback).toBe(2);
    expect(stats.totalAttempts).toBe(6);
  });
});

// ============================================================================
// logRecoverySummary Tests
// ============================================================================

describe('logRecoverySummary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should log recovery summary header', () => {
    const results = createRecoveryResults();
    logRecoverySummary(results);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Phase 1.5 Recovery Summary'));
  });

  it('should log each category result', () => {
    const results: RecoveryResult[] = [
      { categoryCode: 'STR', status: 'ok', attempts: 1, errorMessages: [] }
    ];
    logRecoverySummary(results);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('STR'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ok'));
  });

  it('should warn about fallback categories', () => {
    const results = createRecoveryResults(); // Contains 2 fallbacks
    logRecoverySummary(results);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('2 categories using fallback'));
  });

  it('should not warn when no fallbacks', () => {
    const results: RecoveryResult[] = [
      { categoryCode: 'STR', status: 'ok', attempts: 1, errorMessages: [] },
      { categoryCode: 'SAL', status: 'retried', attempts: 2, errorMessages: ['Rate limit'] }
    ];
    logRecoverySummary(results);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should handle empty results', () => {
    logRecoverySummary([]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Phase 1.5 Recovery Summary'));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should display status emoji correctly', () => {
    const results: RecoveryResult[] = [
      { categoryCode: 'STR', status: 'ok', attempts: 1, errorMessages: [] },
      { categoryCode: 'SAL', status: 'retried', attempts: 2, errorMessages: ['Error'] },
      { categoryCode: 'MKT', status: 'fallback', attempts: 3, errorMessages: ['Error'] }
    ];
    logRecoverySummary(results);

    // Should have logged rows containing the category codes
    const allCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(allCalls).toContain('STR');
    expect(allCalls).toContain('SAL');
    expect(allCalls).toContain('MKT');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Phase 1.5 Batch Recovery Integration', () => {
  it('should generate consistent fallback analyses for all categories', () => {
    const categoryCodes: CategoryCode[] = [
      'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
      'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
    ];

    const analyses = categoryCodes.map(code => buildFallbackCategoryAnalysis(code));

    // All should have consistent structure
    for (const analysis of analyses) {
      expect(analysis.overallScore).toBe(55);
      expect(analysis.confidenceLevel).toBe('low');
      expect(analysis.status).toBe('Developing');
      expect(analysis.strengths).toHaveLength(1);
      expect(analysis.weaknesses).toHaveLength(1);
      expect(analysis.quickWins).toHaveLength(1);
      expect(analysis.categoryRisks).toHaveLength(1);
    }
  });

  it('should provide meaningful stats for mixed recovery scenarios', () => {
    const results = createRecoveryResults();
    const stats = getRecoveryStats(results);

    // Verify overall success rate
    const successRate = (stats.succeeded + stats.retried) / results.length;
    expect(successRate).toBeGreaterThan(0.8); // 10/12 = 83%

    // Verify fallback rate is manageable
    const fallbackRate = stats.fallback / results.length;
    expect(fallbackRate).toBeLessThan(0.2); // 2/12 = 17%
  });
});
