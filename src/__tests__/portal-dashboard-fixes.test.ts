import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyRange,
  detectMalformedCurrency,
  isValidCurrencyFormat,
} from '../utils/currency-formatter.js';
import {
  getContrastTextColor,
  meetsWCAGAA,
  getRelativeLuminance,
  getContrastRatio,
} from '../utils/color-contrast.js';
import { validatePortalCurrency } from '../orchestration/reports/validators/portal-dashboard.validator.js';

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    it('formats thousands correctly', () => {
      expect(formatCurrency(120000)).toBe('$120K');
      expect(formatCurrency(180000)).toBe('$180K');
      expect(formatCurrency(50000)).toBe('$50K');
      expect(formatCurrency(1000)).toBe('$1K');
    });

    it('formats millions correctly', () => {
      expect(formatCurrency(4000000)).toBe('$4M');
      expect(formatCurrency(6000000)).toBe('$6M');
      expect(formatCurrency(1500000)).toBe('$2M'); // Rounds to nearest whole
    });

    it('formats billions correctly', () => {
      expect(formatCurrency(1000000000)).toBe('$1B');
      expect(formatCurrency(2500000000)).toBe('$3B'); // Rounds
    });

    it('handles small values without suffix', () => {
      expect(formatCurrency(500)).toBe('$500');
      expect(formatCurrency(999)).toBe('$999');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatCurrency(null)).toBe('$0');
      expect(formatCurrency(undefined)).toBe('$0');
    });

    it('handles NaN gracefully', () => {
      expect(formatCurrency(NaN)).toBe('$0');
    });

    it('handles negative values', () => {
      expect(formatCurrency(-50000)).toBe('-$50K');
    });

    it('formats full style with commas', () => {
      expect(formatCurrency(120000, { style: 'full' })).toBe('$120,000');
      expect(formatCurrency(4000000, { style: 'full' })).toBe('$4,000,000');
    });

    it('shows decimals when requested', () => {
      expect(formatCurrency(1500000, { showDecimals: true })).toBe('$1.5M');
      expect(formatCurrency(1200000, { showDecimals: true })).toBe('$1.2M');
    });
  });

  describe('formatCurrencyRange', () => {
    it('formats ranges correctly', () => {
      expect(formatCurrencyRange(120000, 180000)).toBe('$120K-$180K');
      expect(formatCurrencyRange(4000000, 6000000)).toBe('$4M-$6M');
    });

    it('handles mixed magnitudes', () => {
      expect(formatCurrencyRange(500000, 2000000)).toBe('$500K-$2M');
    });

    it('handles null/undefined values', () => {
      expect(formatCurrencyRange(null, 100000)).toBe('$0-$100K');
      expect(formatCurrencyRange(50000, undefined)).toBe('$50K-$0');
    });
  });

  describe('detectMalformedCurrency', () => {
    it('detects malformed K suffix', () => {
      const error = detectMalformedCurrency('$120000K-$180000K');
      expect(error).toContain('Malformed');
    });

    it('detects malformed M suffix', () => {
      const error = detectMalformedCurrency('$4000000M');
      expect(error).toContain('Malformed');
    });

    it('accepts valid formats', () => {
      expect(detectMalformedCurrency('$120K-$180K')).toBe('');
      expect(detectMalformedCurrency('$120,000-$180,000')).toBe('');
      expect(detectMalformedCurrency('$4M-$6M')).toBe('');
      expect(detectMalformedCurrency('$500')).toBe('');
    });
  });

  describe('isValidCurrencyFormat', () => {
    it('validates correct formats', () => {
      expect(isValidCurrencyFormat('$120K')).toBe(true);
      expect(isValidCurrencyFormat('$120K-$180K')).toBe(true);
      expect(isValidCurrencyFormat('$120,000')).toBe(true);
      expect(isValidCurrencyFormat('$4M-$6M')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidCurrencyFormat('120K')).toBe(false); // Missing $
    });
  });
});

describe('Color Contrast', () => {
  describe('getRelativeLuminance', () => {
    it('calculates luminance for white', () => {
      const luminance = getRelativeLuminance('#FFFFFF');
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('calculates luminance for black', () => {
      const luminance = getRelativeLuminance('#000000');
      expect(luminance).toBeCloseTo(0, 2);
    });

    it('handles hex with alpha channel', () => {
      const luminance = getRelativeLuminance('#F59E0B20');
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });

    it('handles 3-character hex', () => {
      const luminance = getRelativeLuminance('#FFF');
      expect(luminance).toBeCloseTo(1, 2);
    });
  });

  describe('getContrastTextColor', () => {
    it('returns dark text for light backgrounds', () => {
      expect(getContrastTextColor('#FFFFFF')).toBe('#212653');
      expect(getContrastTextColor('#FEF3C7')).toBe('#212653'); // Light yellow
    });

    it('returns light text for dark backgrounds', () => {
      expect(getContrastTextColor('#212653')).toBe('#FFFFFF'); // BizNavy
      expect(getContrastTextColor('#000000')).toBe('#FFFFFF');
      expect(getContrastTextColor('#1a1f42')).toBe('#FFFFFF');
    });

    it('handles attention status color (amber)', () => {
      // Amber (#F59E0B) is a warm color - should return white for good contrast
      const textColor = getContrastTextColor('#F59E0B');
      expect(textColor).toBe('#FFFFFF'); // Amber is dark enough to need white text
    });
  });

  describe('getContrastRatio', () => {
    it('calculates ratio for black and white', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0); // Maximum possible ratio
    });

    it('calculates ratio for similar colors', () => {
      const ratio = getContrastRatio('#EEEEEE', '#FFFFFF');
      expect(ratio).toBeLessThan(2); // Low contrast
    });
  });

  describe('meetsWCAGAA', () => {
    it('validates WCAG AA compliance', () => {
      // White on dark navy should pass
      expect(meetsWCAGAA('#FFFFFF', '#212653')).toBe(true);

      // BizNavy on light yellow should pass
      expect(meetsWCAGAA('#212653', '#FEF3C7')).toBe(true);

      // White on light yellow should FAIL
      expect(meetsWCAGAA('#FFFFFF', '#FEF3C7')).toBe(false);
    });
  });
});

describe('Portal Dashboard Validation', () => {
  it('detects malformed currency in HTML content', () => {
    const badHtml = `
      <p>Investment: <strong>$120000K-$180000K</strong></p>
    `;

    const result = validatePortalCurrency(badHtml);
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes valid currency formats', () => {
    const goodHtml = `
      <p>Investment: <strong>$120K-$180K</strong></p>
      <p>Return: <strong>$4M-$6M</strong></p>
    `;

    const result = validatePortalCurrency(goodHtml);
    expect(result.passed).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('counts currency values checked', () => {
    const html = `
      <span>$50K</span>
      <span>$100K-$200K</span>
      <span>$1M</span>
    `;

    const result = validatePortalCurrency(html);
    expect(result.totalChecked).toBe(3);
  });
});
