import { describe, it, expect } from 'vitest';
import {
  validateDashboardContrast,
  calculateContrastRatio,
  calculateContrastRatioWithAlpha,
  parseColor,
} from '../orchestration/reports/utils/contrast-validation.js';

describe('Dashboard Contrast Validation', () => {
  describe('validateDashboardContrast', () => {
    it('should pass all WCAG AA contrast checks', () => {
      const result = validateDashboardContrast();

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.passedChecks).toBe(result.totalChecks);
    });

    it('should return validation timestamp', () => {
      const result = validateDashboardContrast();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('should check all defined contrast pairs', () => {
      const result = validateDashboardContrast();

      // Should have multiple checks defined
      expect(result.totalChecks).toBeGreaterThan(10);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should correctly calculate BizNavy on white contrast', () => {
      const ratio = calculateContrastRatio('#212653', '#ffffff');

      // BizNavy on white should have high contrast (>4.5 for AA)
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      // Should be approximately 12.1:1
      expect(ratio).toBeGreaterThan(10);
    });

    it('should return maximum ratio for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');

      // Maximum contrast ratio is 21:1
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1:1 for same colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');

      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle 3-character hex colors', () => {
      const ratio = calculateContrastRatio('#000', '#fff');

      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should handle lowercase hex colors', () => {
      const ratio = calculateContrastRatio('#212653', '#ffffff');
      const ratioLower = calculateContrastRatio('#212653', '#FFFFFF');

      expect(ratio).toBeCloseTo(ratioLower, 2);
    });
  });

  describe('calculateContrastRatioWithAlpha', () => {
    it('should handle rgba colors with alpha blending', () => {
      // Semi-transparent white on dark navy
      const ratio = calculateContrastRatioWithAlpha(
        'rgba(255, 255, 255, 0.85)',
        '#212653'
      );

      // Should still have good contrast
      expect(ratio).toBeGreaterThan(4);
    });

    it('should handle fully opaque rgba colors', () => {
      const ratio = calculateContrastRatioWithAlpha(
        'rgba(255, 255, 255, 1)',
        '#212653'
      );

      const hexRatio = calculateContrastRatio('#ffffff', '#212653');

      expect(ratio).toBeCloseTo(hexRatio, 1);
    });

    it('should blend semi-transparent colors with background', () => {
      // Very transparent white on dark should have lower contrast
      const highAlpha = calculateContrastRatioWithAlpha(
        'rgba(255, 255, 255, 0.9)',
        '#212653'
      );
      const lowAlpha = calculateContrastRatioWithAlpha(
        'rgba(255, 255, 255, 0.5)',
        '#212653'
      );

      expect(highAlpha).toBeGreaterThan(lowAlpha);
    });
  });

  describe('parseColor', () => {
    it('should parse hex colors', () => {
      const rgb = parseColor('#212653');

      expect(rgb.r).toBe(33);
      expect(rgb.g).toBe(38);
      expect(rgb.b).toBe(83);
    });

    it('should parse short hex colors', () => {
      const rgb = parseColor('#fff');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should parse rgb colors', () => {
      const rgb = parseColor('rgb(33, 38, 83)');

      expect(rgb.r).toBe(33);
      expect(rgb.g).toBe(38);
      expect(rgb.b).toBe(83);
    });

    it('should parse rgba colors', () => {
      const rgb = parseColor('rgba(255, 255, 255, 1)');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should parse named colors', () => {
      const white = parseColor('white');
      const black = parseColor('black');

      expect(white.r).toBe(255);
      expect(black.r).toBe(0);
    });

    it('should throw on invalid color format', () => {
      expect(() => parseColor('invalid')).toThrow('Unsupported color format');
    });
  });

  describe('WCAG AA Compliance for Dashboard Elements', () => {
    it('should validate hero section white text meets contrast requirements', () => {
      // White text on BizNavy gradient (approximated)
      const ratio = calculateContrastRatio('#ffffff', '#212653');

      // WCAG AA for large text is 3:1, for normal text is 4.5:1
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate hero metric labels meet contrast requirements', () => {
      // rgba(255, 255, 255, 0.85) on dark navy
      const ratio = calculateContrastRatioWithAlpha(
        'rgba(255, 255, 255, 0.85)',
        '#212653'
      );

      // WCAG AA for normal text
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate status excellence color meets contrast requirements', () => {
      // Dark green text on light green background
      const ratio = calculateContrastRatioWithAlpha(
        '#15803d',
        'rgba(21, 128, 61, 0.1)'
      );

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate status attention color meets contrast requirements', () => {
      // Red text on light red background
      const ratio = calculateContrastRatioWithAlpha(
        '#dc2626',
        'rgba(220, 38, 38, 0.1)'
      );

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate metric card text on white background', () => {
      // BizNavy text on white
      const ratio = calculateContrastRatio('#212653', '#ffffff');

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should validate secondary text color contrast', () => {
      // Dark gray text on white
      const ratio = calculateContrastRatio('#525252', '#ffffff');

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
