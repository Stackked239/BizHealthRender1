/**
 * Client Portal Dashboard QA Validator
 * Validates report content before delivery
 *
 * Scope: executiveBrief-portal.html ONLY
 *
 * @version 1.0.0
 * @since December 2025
 */

import { detectMalformedCurrency } from '../../../utils/currency-formatter.js';
import { meetsWCAGAA, getContrastRatio } from '../../../utils/color-contrast.js';

export interface PortalValidationResult {
  passed: boolean;
  timestamp: string;
  checks: {
    currencyFormatting: CurrencyValidationResult;
    colorContrast: ContrastValidationResult;
  };
  summary: string;
}

export interface CurrencyValidationResult {
  passed: boolean;
  totalChecked: number;
  errors: Array<{ location: string; value: string; error: string }>;
}

export interface ContrastValidationResult {
  passed: boolean;
  totalChecked: number;
  failures: Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
  }>;
}

/**
 * Validate all currency displays in portal HTML content
 */
export function validatePortalCurrency(htmlContent: string): CurrencyValidationResult {
  const result: CurrencyValidationResult = {
    passed: true,
    totalChecked: 0,
    errors: [],
  };

  // Find all currency patterns in content
  const currencyPattern = /\$[\d,\.]+[KMB]?(-\$[\d,\.]+[KMB]?)?/gi;
  const matches = htmlContent.match(currencyPattern) || [];

  result.totalChecked = matches.length;

  for (const match of matches) {
    const malformError = detectMalformedCurrency(match);
    if (malformError) {
      result.passed = false;
      result.errors.push({
        location: 'Portal Dashboard',
        value: match,
        error: malformError,
      });
    }
  }

  return result;
}

/**
 * Validate color contrast in portal HTML
 * Checks health badges and inline styles
 */
export function validatePortalContrast(htmlContent: string): ContrastValidationResult {
  const result: ContrastValidationResult = {
    passed: true,
    totalChecked: 0,
    failures: [],
  };

  // Check style attributes with background-color and color
  // Pattern: style="...background-color: #XXXXXX...color: #XXXXXX..."
  const stylePattern =
    /style="[^"]*background-color:\s*([#\w]+)[^"]*color:\s*([#\w]+)[^"]*"|style="[^"]*color:\s*([#\w]+)[^"]*background-color:\s*([#\w]+)[^"]*"/gi;

  let match;
  while ((match = stylePattern.exec(htmlContent)) !== null) {
    result.totalChecked++;
    // Determine which capture groups matched (order varies)
    const background = match[1] || match[4];
    const foreground = match[2] || match[3];

    if (background && foreground) {
      const ratio = getContrastRatio(foreground, background);
      if (!meetsWCAGAA(foreground, background)) {
        result.passed = false;
        result.failures.push({
          element: 'inline-style',
          foreground,
          background,
          ratio: Math.round(ratio * 100) / 100,
        });
      }
    }
  }

  return result;
}

/**
 * Run full portal dashboard validation
 */
export function validatePortalDashboard(htmlContent: string): PortalValidationResult {
  const timestamp = new Date().toISOString();

  const currencyResult = validatePortalCurrency(htmlContent);
  const contrastResult = validatePortalContrast(htmlContent);

  const passed = currencyResult.passed && contrastResult.passed;

  let summary: string;
  if (passed) {
    summary = `✓ Portal Dashboard QA PASSED - ${currencyResult.totalChecked} currency values, ${contrastResult.totalChecked} contrast checks`;
  } else {
    const errors = currencyResult.errors.length + contrastResult.failures.length;
    summary = `✗ Portal Dashboard QA FAILED - ${errors} error(s) detected`;
  }

  return {
    passed,
    timestamp,
    checks: {
      currencyFormatting: currencyResult,
      colorContrast: contrastResult,
    },
    summary,
  };
}

/**
 * Log validation results to console
 */
export function logPortalValidation(result: PortalValidationResult): void {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       CLIENT PORTAL DASHBOARD QA VALIDATION              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Timestamp: ${result.timestamp}\n`);

  // Currency Results
  const curr = result.checks.currencyFormatting;
  console.log(`Currency Formatting: ${curr.passed ? '✓' : '✗'} (${curr.totalChecked} checked)`);
  if (curr.errors.length > 0) {
    console.log('  Errors:');
    curr.errors.forEach((e) => console.log(`    - ${e.value}: ${e.error}`));
  }

  // Contrast Results
  const cont = result.checks.colorContrast;
  console.log(`Color Contrast: ${cont.passed ? '✓' : '✗'} (${cont.totalChecked} checked)`);
  if (cont.failures.length > 0) {
    console.log('  Failures:');
    cont.failures.forEach((f) =>
      console.log(`    - ${f.element}: ${f.foreground} on ${f.background} (ratio: ${f.ratio})`)
    );
  }

  console.log(`\n${result.summary}\n`);
}
