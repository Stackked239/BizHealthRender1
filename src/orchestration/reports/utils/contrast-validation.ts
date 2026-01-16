/**
 * WCAG 2.1 Contrast Ratio Validation Utility
 * For Client Portal Dashboard Report
 *
 * @description Production-grade contrast validation with proper color parsing
 * @scope executiveBrief-portal report ONLY
 * @version 1.0.0
 * @since January 2026
 */

import { logger } from '../../../utils/logger.js';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface RGBA extends RGB {
  a: number;
}

interface ContrastCheck {
  selector: string;
  foreground: string;
  background: string;
  isLargeText: boolean;
  description?: string;
}

interface ContrastViolation {
  selector: string;
  foreground: string;
  background: string;
  actualRatio: number;
  requiredRatio: number;
  isLargeText: boolean;
  description: string;
}

interface ContrastValidationResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  violations: ContrastViolation[];
  timestamp: string;
}

// ============================================
// COLOR PARSING UTILITIES
// ============================================

/**
 * Parse hex color to RGB
 */
function parseHex(hex: string): RGB {
  const cleanHex = hex.replace('#', '');

  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }

  if (cleanHex.length === 6) {
    return {
      r: parseInt(cleanHex.slice(0, 2), 16),
      g: parseInt(cleanHex.slice(2, 4), 16),
      b: parseInt(cleanHex.slice(4, 6), 16),
    };
  }

  throw new Error(`Invalid hex color format: ${hex}`);
}

/**
 * Parse rgba() string to RGBA object
 */
function parseRgba(rgba: string): RGBA {
  const match = rgba.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );

  if (!match) {
    throw new Error(`Invalid rgba format: ${rgba}`);
  }

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Blend semi-transparent color with white background
 */
function blendWithWhite(rgba: RGBA): RGB {
  const alpha = rgba.a;
  return {
    r: Math.round(rgba.r * alpha + 255 * (1 - alpha)),
    g: Math.round(rgba.g * alpha + 255 * (1 - alpha)),
    b: Math.round(rgba.b * alpha + 255 * (1 - alpha)),
  };
}

/**
 * Blend semi-transparent color with a specific background color
 */
function blendWithBackground(rgba: RGBA, bgRgb: RGB): RGB {
  const alpha = rgba.a;
  return {
    r: Math.round(rgba.r * alpha + bgRgb.r * (1 - alpha)),
    g: Math.round(rgba.g * alpha + bgRgb.g * (1 - alpha)),
    b: Math.round(rgba.b * alpha + bgRgb.b * (1 - alpha)),
  };
}

/**
 * Parse any color format to RGB
 */
function parseColor(color: string, blendBackground?: RGB): RGB {
  const trimmed = color.trim().toLowerCase();

  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  if (trimmed.startsWith('rgb')) {
    const rgba = parseRgba(trimmed);
    // For semi-transparent colors, blend with background
    if (rgba.a < 1) {
      return blendBackground
        ? blendWithBackground(rgba, blendBackground)
        : blendWithWhite(rgba);
    }
    return { r: rgba.r, g: rgba.g, b: rgba.b };
  }

  // Named colors (common ones)
  const namedColors: Record<string, RGB> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
  };

  if (namedColors[trimmed]) {
    return namedColors[trimmed];
  }

  throw new Error(`Unsupported color format: ${color}`);
}

// ============================================
// WCAG CONTRAST CALCULATION
// ============================================

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio per WCAG 2.1
 * Returns ratio as X:1 where X >= 1
 */
export function calculateContrastRatio(fg: string, bg: string): number {
  const fgRgb = parseColor(fg);
  const bgRgb = parseColor(bg);

  const fgLum = getRelativeLuminance(fgRgb);
  const bgLum = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate contrast ratio with alpha blending support
 * For semi-transparent foreground colors on solid backgrounds
 */
export function calculateContrastRatioWithAlpha(
  fg: string,
  bg: string
): number {
  const bgRgb = parseColor(bg);
  const fgRgb = parseColor(fg, bgRgb);

  const fgLum = getRelativeLuminance(fgRgb);
  const bgLum = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================
// DASHBOARD-SPECIFIC VALIDATION
// ============================================

/**
 * Define all contrast checks for Client Portal Dashboard
 */
function getDashboardContrastChecks(): ContrastCheck[] {
  return [
    // Hero section - white text on dark backgrounds
    {
      selector: '.section-hero .metric-value',
      foreground: '#ffffff',
      background: '#212653', // Approximating gradient
      isLargeText: true,
      description: 'Hero metric values',
    },
    {
      selector: '.section-hero .metric-label',
      foreground: 'rgba(255, 255, 255, 0.85)',
      background: '#212653',
      isLargeText: false,
      description: 'Hero metric labels',
    },
    {
      selector: '.section-hero .investment-value',
      foreground: '#ffffff',
      background: '#212653',
      isLargeText: true,
      description: 'Hero investment values',
    },
    {
      selector: '.section-hero .investment-label',
      foreground: 'rgba(255, 255, 255, 0.9)',
      background: '#212653',
      isLargeText: false,
      description: 'Hero investment labels',
    },

    // Non-hero sections - dark text on light backgrounds
    {
      selector: '.metric-card .metric-category',
      foreground: '#212653',
      background: '#ffffff',
      isLargeText: false,
      description: 'Metric card category labels',
    },
    {
      selector: '.metric-card .score-value',
      foreground: '#212653',
      background: '#ffffff',
      isLargeText: true,
      description: 'Metric card score values',
    },
    {
      selector: '.metric-card .score-label',
      foreground: '#525252',
      background: '#ffffff',
      isLargeText: false,
      description: 'Metric card score labels',
    },

    // Status badges - using WCAG AA compliant colors
    {
      selector: '.status-excellence',
      foreground: '#15803d',
      background: 'rgba(21, 128, 61, 0.1)',
      isLargeText: false,
      description: 'Excellence status badge',
    },
    {
      selector: '.status-proficiency',
      foreground: '#b45309',
      background: 'rgba(180, 83, 9, 0.1)',
      isLargeText: false,
      description: 'Proficiency status badge',
    },
    {
      selector: '.status-attention',
      foreground: '#dc2626',
      background: 'rgba(220, 38, 38, 0.1)',
      isLargeText: false,
      description: 'Attention status badge',
    },
    {
      selector: '.status-critical',
      foreground: '#991b1b',
      background: 'rgba(153, 27, 27, 0.15)',
      isLargeText: false,
      description: 'Critical status badge',
    },

    // Pillar cards
    {
      selector: '.pillar-name',
      foreground: '#262626',
      background: '#DBEAFE',
      isLargeText: false,
      description: 'Pillar card names',
    },
    {
      selector: '.pillar-score',
      foreground: '#3B82F6',
      background: '#DBEAFE',
      isLargeText: true,
      description: 'Pillar card scores',
    },

    // Finding cards
    {
      selector: '.finding-text',
      foreground: '#525252',
      background: '#ffffff',
      isLargeText: false,
      description: 'Finding card text',
    },

    // Section titles
    {
      selector: '.section-title',
      foreground: '#212653',
      background: '#ffffff',
      isLargeText: true,
      description: 'Section titles',
    },
  ];
}

/**
 * Validate all dashboard contrast requirements
 */
export function validateDashboardContrast(): ContrastValidationResult {
  const checks = getDashboardContrastChecks();
  const violations: ContrastViolation[] = [];
  let passedChecks = 0;

  for (const check of checks) {
    try {
      const ratio = calculateContrastRatioWithAlpha(
        check.foreground,
        check.background
      );
      const requiredRatio = check.isLargeText ? 3.0 : 4.5;
      const passed = ratio >= requiredRatio;

      if (passed) {
        passedChecks++;
      } else {
        violations.push({
          selector: check.selector,
          foreground: check.foreground,
          background: check.background,
          actualRatio: Math.round(ratio * 100) / 100,
          requiredRatio,
          isLargeText: check.isLargeText,
          description: check.description || check.selector,
        });
      }
    } catch (error) {
      logger.warn(`Contrast check failed for ${check.selector}`, { error });
      violations.push({
        selector: check.selector,
        foreground: check.foreground,
        background: check.background,
        actualRatio: 0,
        requiredRatio: check.isLargeText ? 3.0 : 4.5,
        isLargeText: check.isLargeText,
        description: `Parse error: ${(error as Error).message}`,
      });
    }
  }

  return {
    passed: violations.length === 0,
    totalChecks: checks.length,
    passedChecks,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Enforce contrast compliance - throws if violations found
 */
export function enforceContrastCompliance(reportType: string): void {
  if (reportType !== 'executiveBrief-portal') {
    // Only validate dashboard portal reports
    return;
  }

  const result = validateDashboardContrast();

  logger.info('Dashboard contrast validation', {
    reportType,
    passed: result.passed,
    totalChecks: result.totalChecks,
    passedChecks: result.passedChecks,
    violationCount: result.violations.length,
  });

  if (!result.passed) {
    const violationDetails = result.violations
      .map(
        (v) =>
          `  • ${v.description}: ${v.actualRatio}:1 (need ${v.requiredRatio}:1)`
      )
      .join('\n');

    const errorMessage =
      `\n═══════════════════════════════════════════════════════════════\n` +
      `  WCAG 2.1 CONTRAST COMPLIANCE FAILURE\n` +
      `  Report: ${reportType}\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      `${result.violations.length} contrast violation(s) detected:\n\n` +
      `${violationDetails}\n\n` +
      `Required: WCAG 2.1 Level AA\n` +
      `  • Normal text: 4.5:1 minimum\n` +
      `  • Large text (18pt+): 3:1 minimum\n\n` +
      `Brand colors: BizNavy #212653, BizGreen #969423\n` +
      `═══════════════════════════════════════════════════════════════\n`;

    logger.error('Contrast compliance failure', {
      reportType,
      violations: result.violations,
    });

    throw new Error(errorMessage);
  }

  logger.info('✓ Dashboard contrast validation passed', {
    reportType,
    checksRun: result.totalChecks,
  });
}

/**
 * Log contrast validation results in a formatted way
 */
export function logContrastValidation(result: ContrastValidationResult): void {
  console.log(
    '\n╔═══════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║       DASHBOARD CONTRAST VALIDATION (WCAG 2.1 AA)        ║'
  );
  console.log(
    '╚═══════════════════════════════════════════════════════════╝\n'
  );

  console.log(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(
    `Checks: ${result.passedChecks}/${result.totalChecks} passed`
  );
  console.log(`Timestamp: ${result.timestamp}\n`);

  if (result.violations.length > 0) {
    console.log('Violations:');
    result.violations.forEach((v) =>
      console.log(
        `  • ${v.description}: ${v.actualRatio}:1 (need ${v.requiredRatio}:1)`
      )
    );
    console.log('');
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  parseColor,
  type ContrastValidationResult,
  type ContrastViolation,
  type ContrastCheck,
};
