/**
 * BizHealth.ai Benchmark Boundary Value Tests (Gap 1)
 *
 * Expert-recommended validation tests for boundary conditions in the benchmark calculator.
 * Tests edge cases including minimum/maximum values, exact percentile thresholds, and invalid inputs.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculatePercentile,
  getComparisonBand,
  loadBenchmarkDatabase,
  clearBenchmarkCache,
  type PercentileDistribution
} from '../src/utils/benchmark-calculator.js';

// Standard test distribution (small_growth tier)
const testDistribution: PercentileDistribution = {
  '10': 28,
  '25': 38,
  '50': 46,
  '75': 58,
  '90': 71
};

// Chapter-scale distribution (1-5 scale converted to 0-100)
const chapterDistribution: PercentileDistribution = {
  '10': 16,
  '25': 22,
  '50': 28,
  '75': 34,
  '90': 41
};

describe('Benchmark Boundary Value Tests (Gap 1)', () => {
  beforeAll(() => {
    // Clear cache and load fresh database
    clearBenchmarkCache();
    loadBenchmarkDatabase();
  });

  describe('calculatePercentile - Extreme Values', () => {
    it('should handle score of 0 (minimum) gracefully', () => {
      const result = calculatePercentile(0, testDistribution);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should handle score of 100 (maximum) correctly', () => {
      const result = calculatePercentile(100, testDistribution);
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(99);
    });

    it('should handle negative score (-5) gracefully', () => {
      // Should either return minimum or handle edge case gracefully
      const result = calculatePercentile(-5, testDistribution);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should handle very high score (150) correctly', () => {
      const result = calculatePercentile(150, testDistribution);
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(99);
    });
  });

  describe('calculatePercentile - Exact Percentile Thresholds', () => {
    it('should return ~10 for score exactly at 10th percentile threshold', () => {
      const result = calculatePercentile(28, testDistribution);
      expect(result).toBeGreaterThanOrEqual(8);
      expect(result).toBeLessThanOrEqual(12);
    });

    it('should return ~25 for score exactly at 25th percentile threshold', () => {
      const result = calculatePercentile(38, testDistribution);
      expect(result).toBeGreaterThanOrEqual(23);
      expect(result).toBeLessThanOrEqual(27);
    });

    it('should return ~50 for score exactly at 50th percentile threshold', () => {
      const result = calculatePercentile(46, testDistribution);
      expect(result).toBeGreaterThanOrEqual(48);
      expect(result).toBeLessThanOrEqual(52);
    });

    it('should return ~75 for score exactly at 75th percentile threshold', () => {
      const result = calculatePercentile(58, testDistribution);
      expect(result).toBeGreaterThanOrEqual(73);
      expect(result).toBeLessThanOrEqual(77);
    });

    it('should return ~90 for score exactly at 90th percentile threshold', () => {
      const result = calculatePercentile(71, testDistribution);
      expect(result).toBeGreaterThanOrEqual(88);
      expect(result).toBeLessThanOrEqual(92);
    });
  });

  describe('calculatePercentile - Decimal Precision', () => {
    it('should handle decimal scores (46.5) correctly', () => {
      const result = calculatePercentile(46.5, testDistribution);
      // Just above median - should be slightly above 50
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(55);
    });

    it('should handle midpoint interpolation (40.5 between 25th and 50th)', () => {
      // Exactly between 25th (38) and 50th (46) percentile thresholds
      const midpoint = (38 + 46) / 2; // 42
      const result = calculatePercentile(midpoint, testDistribution);
      // Should be around 37.5 percentile
      expect(result).toBeGreaterThanOrEqual(35);
      expect(result).toBeLessThanOrEqual(42);
    });

    it('should handle very precise decimal (46.123456)', () => {
      const result = calculatePercentile(46.123456, testDistribution);
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(52);
    });
  });

  describe('calculatePercentile - Chapter Scale Values', () => {
    it('should handle chapter minimum (1.0 on 1-5 scale = ~16)', () => {
      const result = calculatePercentile(16, chapterDistribution);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(12);
    });

    it('should handle chapter maximum (5.0 on 1-5 scale = ~100)', () => {
      const result = calculatePercentile(100, chapterDistribution);
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(99);
    });

    it('should handle chapter median (2.8 on 1-5 scale = ~28)', () => {
      const result = calculatePercentile(28, chapterDistribution);
      expect(result).toBeGreaterThanOrEqual(48);
      expect(result).toBeLessThanOrEqual(52);
    });
  });

  describe('getComparisonBand - Boundary Tests', () => {
    it('should return below_average for percentile 0', () => {
      expect(getComparisonBand(0)).toBe('below_average');
    });

    it('should return below_average for percentile 24', () => {
      expect(getComparisonBand(24)).toBe('below_average');
    });

    it('should return average for percentile exactly 25 (boundary)', () => {
      expect(getComparisonBand(25)).toBe('average');
    });

    it('should return average for percentile 49', () => {
      expect(getComparisonBand(49)).toBe('average');
    });

    it('should return above_average for percentile exactly 50 (boundary)', () => {
      expect(getComparisonBand(50)).toBe('above_average');
    });

    it('should return above_average for percentile 74', () => {
      expect(getComparisonBand(74)).toBe('above_average');
    });

    it('should return top_quartile for percentile exactly 75 (boundary)', () => {
      expect(getComparisonBand(75)).toBe('top_quartile');
    });

    it('should return top_quartile for percentile 99', () => {
      expect(getComparisonBand(99)).toBe('top_quartile');
    });

    it('should return top_quartile for percentile 100', () => {
      expect(getComparisonBand(100)).toBe('top_quartile');
    });
  });

  describe('calculatePercentile - Result Range Validation', () => {
    it('should always return a value between 1 and 99', () => {
      const testScores = [0, 1, 10, 25, 50, 75, 90, 99, 100, -10, 150];

      for (const score of testScores) {
        const result = calculatePercentile(score, testDistribution);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(99);
      }
    });

    it('should be monotonically increasing for ascending scores', () => {
      const scores = [20, 30, 40, 50, 60, 70, 80];
      const results = scores.map(s => calculatePercentile(s, testDistribution));

      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i - 1]);
      }
    });
  });

  describe('Edge Cases - Unusual Distributions', () => {
    it('should handle distribution with very narrow range', () => {
      const narrowDistribution: PercentileDistribution = {
        '10': 45,
        '25': 47,
        '50': 50,
        '75': 53,
        '90': 55
      };

      const result = calculatePercentile(50, narrowDistribution);
      expect(result).toBeGreaterThanOrEqual(48);
      expect(result).toBeLessThanOrEqual(52);
    });

    it('should handle distribution with equal values at some percentiles', () => {
      const flatDistribution: PercentileDistribution = {
        '10': 30,
        '25': 30,
        '50': 50,
        '75': 70,
        '90': 70
      };

      // Score at the flat section
      const result = calculatePercentile(30, flatDistribution);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(25);
    });
  });
});
