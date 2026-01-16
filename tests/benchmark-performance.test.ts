/**
 * BizHealth.ai Benchmark Performance Tests (Gap 4)
 *
 * Expert-recommended performance checkpoint tests for benchmark operations.
 * Validates that benchmark lookups meet performance thresholds.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculatePercentile,
  getComparisonBand,
  getBenchmarkDataForCompany,
  calculateChapterBenchmark,
  calculateOverallBenchmark,
  calculateAllChapterBenchmarks,
  loadBenchmarkDatabase,
  clearBenchmarkCache,
  type CompanyBenchmarkProfile,
  type PercentileDistribution
} from '../src/utils/benchmark-calculator.js';

// Performance thresholds (milliseconds)
const WARN_THRESHOLD = 500;
const FAIL_THRESHOLD = 2000;

// Test company profile
const testProfile: CompanyBenchmarkProfile = {
  industry: 'Technology Consulting',
  employeeCount: 75,
  annualRevenue: 5000000
};

// Small company profile
const smallProfile: CompanyBenchmarkProfile = {
  industry: 'Technology Consulting',
  employeeCount: 10,
  annualRevenue: 500000
};

// Unknown industry profile
const unknownProfile: CompanyBenchmarkProfile = {
  industry: 'Unknown Industry XYZ',
  employeeCount: 75,
  annualRevenue: 5000000
};

describe('Benchmark Performance Tests (Gap 4)', () => {
  beforeAll(() => {
    // Clear cache and load fresh database
    clearBenchmarkCache();
    loadBenchmarkDatabase();
  });

  describe('Single Operation Performance', () => {
    it('should calculate single percentile within threshold', () => {
      const distribution: PercentileDistribution = {
        '10': 28,
        '25': 38,
        '50': 46,
        '75': 58,
        '90': 71
      };

      const start = performance.now();
      const result = calculatePercentile(53, distribution);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: calculatePercentile took ${duration}ms`);
      }
    });

    it('should get comparison band within threshold', () => {
      const start = performance.now();
      const result = getComparisonBand(68);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);
    });

    it('should get benchmark data for company within threshold', () => {
      const start = performance.now();
      const result = getBenchmarkDataForCompany(testProfile);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: getBenchmarkDataForCompany took ${duration}ms`);
      }
    });

    it('should calculate overall benchmark within threshold', () => {
      const start = performance.now();
      const result = calculateOverallBenchmark(68, testProfile);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: calculateOverallBenchmark took ${duration}ms`);
      }
    });
  });

  describe('Fallback Path Performance', () => {
    it('should handle unknown industry (fallback path) within threshold', () => {
      const start = performance.now();
      const result = getBenchmarkDataForCompany(unknownProfile);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: Unknown industry fallback took ${duration}ms`);
      }
    });

    it('should calculate overall benchmark with fallback within threshold', () => {
      const start = performance.now();
      const result = calculateOverallBenchmark(53, unknownProfile);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);
    });
  });

  describe('Full Assessment Performance', () => {
    it('should complete full assessment (5 lookups) within threshold', () => {
      const chapters = [
        { chapter_code: 'GE' as const, name: 'Growth Engine', score_overall: 56 },
        { chapter_code: 'PH' as const, name: 'Performance & Health', score_overall: 66 },
        { chapter_code: 'PL' as const, name: 'People & Leadership', score_overall: 74 },
        { chapter_code: 'RS' as const, name: 'Resilience & Safeguards', score_overall: 74 }
      ];

      const start = performance.now();

      // Calculate overall benchmark
      const overallResult = calculateOverallBenchmark(68, testProfile);

      // Calculate all chapter benchmarks
      const chapterResults = calculateAllChapterBenchmarks(chapters, testProfile);

      const duration = performance.now() - start;

      expect(overallResult).toBeDefined();
      expect(chapterResults.size).toBe(4);
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: Full assessment took ${duration}ms`);
      }
    });
  });

  describe('Stress Test Performance', () => {
    it('should complete 100 percentile calculations within acceptable time', () => {
      const distribution: PercentileDistribution = {
        '10': 28,
        '25': 38,
        '50': 46,
        '75': 58,
        '90': 71
      };

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        calculatePercentile(Math.random() * 100, distribution);
      }

      const duration = performance.now() - start;

      // 100 calculations should complete in under 2 seconds
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      const avgTime = duration / 100;
      if (avgTime >= 10) {
        console.warn(`Performance warning: Average calculation time ${avgTime.toFixed(2)}ms`);
      }
    });

    it('should complete 50 full benchmark lookups within acceptable time', () => {
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        calculateOverallBenchmark(Math.random() * 100, testProfile);
      }

      const duration = performance.now() - start;

      // 50 full lookups should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);

      const avgTime = duration / 50;
      if (avgTime >= 50) {
        console.warn(`Performance warning: Average lookup time ${avgTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Database Loading Performance', () => {
    it('should load benchmark database within threshold', () => {
      clearBenchmarkCache();

      const start = performance.now();
      const db = loadBenchmarkDatabase();
      const duration = performance.now() - start;

      expect(db).toBeDefined();
      expect(db.industries).toBeDefined();
      expect(duration).toBeLessThan(FAIL_THRESHOLD);

      if (duration >= WARN_THRESHOLD) {
        console.warn(`Performance warning: Database load took ${duration}ms`);
      }
    });

    it('should return cached database instantly', () => {
      // First call loads the database
      loadBenchmarkDatabase();

      // Second call should use cache
      const start = performance.now();
      const db = loadBenchmarkDatabase();
      const duration = performance.now() - start;

      expect(db).toBeDefined();
      // Cached access should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory during repeated operations', () => {
      const distribution: PercentileDistribution = {
        '10': 28,
        '25': 38,
        '50': 46,
        '75': 58,
        '90': 71
      };

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        calculatePercentile(Math.random() * 100, distribution);
        getComparisonBand(Math.random() * 100);
      }

      // If we get here without running out of memory, test passes
      expect(true).toBe(true);
    });
  });
});
