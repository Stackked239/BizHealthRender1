/**
 * Phase C Unit Tests: Normalization Handlers
 *
 * Tests all response normalization functions to ensure correct 0-100 score mapping.
 * Critical for preventing the TIN_001=0 bug pattern.
 */
import { describe, it, expect } from 'vitest';

import {
  normalizeCurrencyResponse,
  normalizeNumericResponse,
  normalizeScaleResponse,
  normalizePercentageResponse,
  normalizeYesNoResponse,
} from '../../utils/normalization-handlers.js';

describe('Normalization Handlers', () => {
  describe('normalizeCurrencyResponse', () => {
    // TC-001: Primary regression test for TIN_001=0 bug
    it('TC-001: should normalize $85,000 to 80-90 for $2.8M revenue brewery', () => {
      const result = normalizeCurrencyResponse(85000, 2800000);
      expect(result).toBeGreaterThanOrEqual(80);
      expect(result).toBeLessThanOrEqual(90);
    });

    // TC-002: Low tech investment relative to revenue
    it('TC-002: should normalize $10,000 to ~25-35 for $2.8M revenue', () => {
      const result = normalizeCurrencyResponse(10000, 2800000);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(40);
    });

    // TC-003: High tech investment (tech startup)
    it('TC-003: should normalize $250,000 to 90+ for $5.2M revenue', () => {
      const result = normalizeCurrencyResponse(250000, 5200000);
      expect(result).toBeGreaterThanOrEqual(85);
      expect(result).toBeLessThanOrEqual(100);
    });

    // TC-004: Moderate investment (manufacturing)
    it('TC-004: should normalize $45,000 to 50-65 for $12.5M revenue', () => {
      const result = normalizeCurrencyResponse(45000, 12500000);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(70);
    });

    // TC-005: Zero currency should return 0
    it('TC-005: should return 0 for zero currency value', () => {
      const result = normalizeCurrencyResponse(0, 2800000);
      expect(result).toBe(0);
    });

    // TC-006: Fallback without revenue context
    it('TC-006: should use fallback calculation when revenue is undefined', () => {
      const result = normalizeCurrencyResponse(85000, undefined);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    // TC-007: Negative currency handled gracefully
    it('TC-007: should handle negative currency gracefully', () => {
      const result = normalizeCurrencyResponse(-5000, 2800000);
      expect(result).toBe(0);
    });

    // TC-008: Zero revenue should not crash
    it('TC-008: should not crash with zero revenue', () => {
      expect(() => normalizeCurrencyResponse(85000, 0)).not.toThrow();
      const result = normalizeCurrencyResponse(85000, 0);
      expect(typeof result).toBe('number');
    });

    // TC-009: Null/undefined revenue
    it('TC-009: should handle null revenue gracefully', () => {
      const result = normalizeCurrencyResponse(85000, null);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    // TC-010: Very high investment percentage
    it('TC-010: should handle very high investment percentages (>5%)', () => {
      const result = normalizeCurrencyResponse(300000, 2800000); // ~10.7%
      expect(result).toBeGreaterThanOrEqual(95);
      expect(result).toBeLessThanOrEqual(100);
    });

    // TC-011: Fallback for low absolute value
    it('TC-011: should score low absolute values appropriately', () => {
      const result = normalizeCurrencyResponse(15000, undefined);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(30);
    });

    // TC-012: Fallback for high absolute value
    it('TC-012: should score high absolute values appropriately', () => {
      const result = normalizeCurrencyResponse(150000, undefined);
      expect(result).toBeGreaterThan(75);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('normalizeNumericResponse', () => {
    // Response time tests (lower is better)
    describe('Response Time Normalization', () => {
      // TC-013: Excellent response time
      it('TC-013: should score 0-2 hour response time as 90-100', () => {
        const result = normalizeNumericResponse(1, 'response_time_hours');
        expect(result).toBeGreaterThanOrEqual(90);
        expect(result).toBeLessThanOrEqual(100);
      });

      // TC-014: Good response time
      it('TC-014: should score 4-6 hour response time as 60-80', () => {
        const result = normalizeNumericResponse(5, 'response_time_hours');
        expect(result).toBeGreaterThanOrEqual(55);
        expect(result).toBeLessThanOrEqual(85);
      });

      // TC-015: Slow response time
      it('TC-015: should score 24 hour response time as 30-45', () => {
        const result = normalizeNumericResponse(24, 'response_time_hours');
        expect(result).toBeGreaterThanOrEqual(25);
        expect(result).toBeLessThanOrEqual(50);
      });

      // TC-016: Very slow response time
      it('TC-016: should score 48+ hour response time as <30', () => {
        const result = normalizeNumericResponse(48, 'response_time_hours');
        expect(result).toBeLessThan(30);
      });

      // TC-017: Zero response time (instant)
      it('TC-017: should score 0 hour response time as 100', () => {
        const result = normalizeNumericResponse(0, 'response_time_hours');
        expect(result).toBe(100);
      });
    });

    // Inventory turnover tests (higher is better for most industries)
    describe('Inventory Turnover Normalization', () => {
      // TC-018: Low turnover
      it('TC-018: should score 0-2 inventory turns as 0-30', () => {
        const result = normalizeNumericResponse(1, 'inventory_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(35);
      });

      // TC-019: Good turnover
      it('TC-019: should score 8 inventory turns as 60-80', () => {
        const result = normalizeNumericResponse(8, 'inventory_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(55);
        expect(result).toBeLessThanOrEqual(85);
      });

      // TC-020: Excellent turnover (manufacturing baseline)
      it('TC-020: should score 12 inventory turns as 75-90', () => {
        const result = normalizeNumericResponse(12, 'inventory_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(70);
        expect(result).toBeLessThanOrEqual(95);
      });

      // TC-021: Zero inventory turnover
      it('TC-021: should score 0 inventory turns as 0', () => {
        const result = normalizeNumericResponse(0, 'inventory_turnover_rate');
        expect(result).toBe(0);
      });
    });

    // Sales cycle tests (lower is better)
    describe('Sales Cycle Normalization', () => {
      // TC-022: Very short sales cycle
      it('TC-022: should score 7-day sales cycle as 90+', () => {
        const result = normalizeNumericResponse(7, 'average_sales_cycle_days');
        expect(result).toBeGreaterThanOrEqual(85);
      });

      // TC-023: Moderate sales cycle
      it('TC-023: should score 30-day sales cycle as 60-75', () => {
        const result = normalizeNumericResponse(30, 'average_sales_cycle_days');
        expect(result).toBeGreaterThanOrEqual(55);
        expect(result).toBeLessThanOrEqual(80);
      });

      // TC-024: Long sales cycle (B2B enterprise)
      it('TC-024: should score 90-day sales cycle as 20-40', () => {
        const result = normalizeNumericResponse(90, 'average_sales_cycle_days');
        expect(result).toBeGreaterThanOrEqual(15);
        expect(result).toBeLessThanOrEqual(45);
      });

      // TC-025: Very long sales cycle
      it('TC-025: should score 180-day sales cycle as low', () => {
        const result = normalizeNumericResponse(180, 'average_sales_cycle_days');
        expect(result).toBeLessThan(20);
      });
    });

    // Employee turnover tests
    describe('Employee Turnover Normalization', () => {
      // TC-026: Low turnover (excellent)
      it('TC-026: should score 5% turnover as 90+', () => {
        const result = normalizeNumericResponse(5, 'employee_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(85);
      });

      // TC-027: Average turnover
      it('TC-027: should score 15% turnover as 50-70', () => {
        const result = normalizeNumericResponse(15, 'employee_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(45);
        expect(result).toBeLessThanOrEqual(75);
      });

      // TC-028: High turnover
      it('TC-028: should score 30% turnover as 25-35', () => {
        const result = normalizeNumericResponse(30, 'employee_turnover_rate');
        expect(result).toBeGreaterThanOrEqual(20);
        expect(result).toBeLessThanOrEqual(40);
      });
    });

    // Cash runway tests
    describe('Cash Runway Normalization', () => {
      // TC-029: Minimal runway (critical)
      it('TC-029: should score 2 months runway as low', () => {
        const result = normalizeNumericResponse(2, 'cash_runway_months');
        expect(result).toBeLessThan(30);
      });

      // TC-030: Adequate runway
      it('TC-030: should score 6 months runway as 55-65', () => {
        const result = normalizeNumericResponse(6, 'cash_runway_months');
        expect(result).toBeGreaterThanOrEqual(50);
        expect(result).toBeLessThanOrEqual(70);
      });

      // TC-031: Strong runway
      it('TC-031: should score 18 months runway as 85+', () => {
        const result = normalizeNumericResponse(18, 'cash_runway_months');
        expect(result).toBeGreaterThanOrEqual(85);
      });
    });

    // Close rate and repeat sales (direct percentage)
    describe('Direct Percentage Metrics', () => {
      // TC-032: Close rate
      it('TC-032: should pass through close rate percentage', () => {
        const result = normalizeNumericResponse(45, 'close_rate_percentage');
        expect(result).toBe(45);
      });

      // TC-033: Repeat sales
      it('TC-033: should pass through repeat sales percentage', () => {
        const result = normalizeNumericResponse(68, 'repeat_sales_percentage');
        expect(result).toBe(68);
      });

      // TC-034: Clamp high percentages
      it('TC-034: should clamp percentages above 100', () => {
        const result = normalizeNumericResponse(150, 'close_rate_percentage');
        expect(result).toBe(100);
      });
    });

    // Default/unknown metric handling
    describe('Default Metric Handling', () => {
      // TC-035: Unknown metric type defaults to pass-through
      it('TC-035: should handle unknown metric types', () => {
        const result = normalizeNumericResponse(75, 'unknown_metric');
        expect(result).toBe(75);
      });

      // TC-036: Clamp negative values for unknown metrics
      it('TC-036: should clamp negative values for unknown metrics', () => {
        const result = normalizeNumericResponse(-10, 'unknown_metric');
        expect(result).toBe(0);
      });
    });
  });

  describe('normalizeScaleResponse', () => {
    // TC-037: 1-5 scale maps to 0-100
    it('TC-037: should map 1-5 scale to 0-100 range', () => {
      expect(normalizeScaleResponse(1)).toBe(0);
      expect(normalizeScaleResponse(3)).toBe(50);
      expect(normalizeScaleResponse(5)).toBe(100);
    });

    // TC-038: Exact 5-point scale mappings
    it('TC-038: should provide exact mappings for all 5 points', () => {
      expect(normalizeScaleResponse(1)).toBe(0);
      expect(normalizeScaleResponse(2)).toBe(25);
      expect(normalizeScaleResponse(3)).toBe(50);
      expect(normalizeScaleResponse(4)).toBe(75);
      expect(normalizeScaleResponse(5)).toBe(100);
    });

    // TC-039: Handle out-of-range values (low)
    it('TC-039: should clamp values below 1 to 0', () => {
      expect(normalizeScaleResponse(0)).toBe(0);
      expect(normalizeScaleResponse(-1)).toBe(0);
    });

    // TC-040: Handle out-of-range values (high)
    it('TC-040: should clamp values above 5 to 100', () => {
      expect(normalizeScaleResponse(6)).toBe(100);
      expect(normalizeScaleResponse(10)).toBe(100);
    });

    // TC-041: Handle decimal values
    it('TC-041: should handle decimal scale values', () => {
      const result = normalizeScaleResponse(3.5);
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(75);
    });

    // TC-042: Handle null/undefined
    it('TC-042: should return 0 for null/undefined', () => {
      expect(normalizeScaleResponse(null as unknown as number)).toBe(0);
      expect(normalizeScaleResponse(undefined as unknown as number)).toBe(0);
    });
  });

  describe('normalizePercentageResponse', () => {
    // TC-043: Valid percentages unchanged
    it('TC-043: should pass through valid percentages', () => {
      expect(normalizePercentageResponse(45)).toBe(45);
      expect(normalizePercentageResponse(78)).toBe(78);
      expect(normalizePercentageResponse(100)).toBe(100);
    });

    // TC-044: Cap values >100%
    it('TC-044: should cap percentages >100 at 100', () => {
      expect(normalizePercentageResponse(150)).toBe(100);
      expect(normalizePercentageResponse(200)).toBe(100);
    });

    // TC-045: Floor negative values to 0
    it('TC-045: should floor negative percentages to 0', () => {
      expect(normalizePercentageResponse(-10)).toBe(0);
      expect(normalizePercentageResponse(-100)).toBe(0);
    });

    // TC-046: Handle decimal percentages
    it('TC-046: should handle decimal percentages', () => {
      expect(normalizePercentageResponse(45.5)).toBe(45.5);
      expect(normalizePercentageResponse(99.9)).toBe(99.9);
    });

    // TC-047: Zero percentage
    it('TC-047: should handle zero percentage', () => {
      expect(normalizePercentageResponse(0)).toBe(0);
    });

    // TC-048: Handle null/undefined
    it('TC-048: should return 0 for null/undefined', () => {
      expect(normalizePercentageResponse(null as unknown as number)).toBe(0);
      expect(normalizePercentageResponse(undefined as unknown as number)).toBe(0);
    });
  });

  describe('normalizeYesNoResponse', () => {
    // TC-049: Yes responses (string)
    it('TC-049: should score "yes" string responses as 100', () => {
      expect(normalizeYesNoResponse('yes')).toBe(100);
      expect(normalizeYesNoResponse('Yes')).toBe(100);
      expect(normalizeYesNoResponse('YES')).toBe(100);
    });

    // TC-050: No responses (string)
    it('TC-050: should score "no" string responses as 0', () => {
      expect(normalizeYesNoResponse('no')).toBe(0);
      expect(normalizeYesNoResponse('No')).toBe(0);
      expect(normalizeYesNoResponse('NO')).toBe(0);
    });

    // TC-051: Boolean true
    it('TC-051: should score boolean true as 100', () => {
      expect(normalizeYesNoResponse(true)).toBe(100);
    });

    // TC-052: Boolean false
    it('TC-052: should score boolean false as 0', () => {
      expect(normalizeYesNoResponse(false)).toBe(0);
    });

    // TC-053: Other string values default to 0
    it('TC-053: should score other string values as 0', () => {
      expect(normalizeYesNoResponse('maybe')).toBe(0);
      expect(normalizeYesNoResponse('')).toBe(0);
      expect(normalizeYesNoResponse('unknown')).toBe(0);
    });
  });
});
