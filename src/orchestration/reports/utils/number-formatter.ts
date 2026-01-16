/**
 * Number Formatter Utilities
 *
 * Handles floating point precision issues and provides consistent
 * number formatting for all report outputs.
 *
 * This addresses the critical bug where benchmark values display as
 * "61.629999999999995/100" instead of "61.6/100"
 */

/**
 * Format a numeric score for display, handling floating point precision
 *
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string or 'N/A' for invalid values
 *
 * @example
 * formatScore(61.629999999999995) // "61.6"
 * formatScore(null) // "N/A"
 * formatScore(100, 0) // "100"
 */
export function formatScore(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  // Handle edge cases
  if (!isFinite(value)) {
    return 'N/A';
  }

  // Round to specified decimal places to avoid floating point artifacts
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(value * multiplier) / multiplier;

  return rounded.toFixed(decimals);
}

/**
 * Format a score as an integer (no decimal places)
 *
 * @param value - The numeric value to format
 * @returns Formatted integer string or 'N/A'
 *
 * @example
 * formatScoreInt(61.6) // "62"
 * formatScoreInt(61.4) // "61"
 */
export function formatScoreInt(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return 'N/A';
  }

  return Math.round(value).toString();
}

/**
 * Format a value as a percentage
 *
 * @param value - The numeric value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @param isDecimal - If true, treats value as 0-1 range
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(61.629999999999995) // "61.6%"
 * formatPercentage(0.616, 1, true) // "61.6%"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  isDecimal: boolean = false
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const percent = isDecimal ? value * 100 : value;
  return `${formatScore(percent, decimals)}%`;
}

/**
 * Format a benchmark comparison
 *
 * @param actual - Client's actual score
 * @param benchmark - Industry benchmark score
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted comparison string
 *
 * @example
 * formatBenchmarkComparison(61.629999999999995, 55.5) // "61.6/100 vs 55.5/100"
 */
export function formatBenchmarkComparison(
  actual: number | null | undefined,
  benchmark: number | null | undefined,
  decimals: number = 1
): string {
  const formattedActual = formatScore(actual, decimals);
  const formattedBenchmark = formatScore(benchmark, decimals);

  if (formattedActual === 'N/A' || formattedBenchmark === 'N/A') {
    return 'N/A';
  }

  return `${formattedActual}/100 vs ${formattedBenchmark}/100`;
}

/**
 * Format a score with the "/100" suffix
 *
 * @param value - The numeric score (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted score with suffix
 *
 * @example
 * formatScoreWithMax(61.629999999999995) // "61.6/100"
 */
export function formatScoreWithMax(
  value: number | null | undefined,
  decimals: number = 1,
  max: number = 100
): string {
  const formatted = formatScore(value, decimals);
  if (formatted === 'N/A') {
    return 'N/A';
  }
  return `${formatted}/${max}`;
}

/**
 * Format a delta/change value with sign
 *
 * @param value - The delta value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted delta with sign prefix
 *
 * @example
 * formatDelta(5.629999999999995) // "+5.6"
 * formatDelta(-3.14159) // "-3.1"
 */
export function formatDelta(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return 'N/A';
  }

  const formatted = formatScore(Math.abs(value), decimals);
  if (value >= 0) {
    return `+${formatted}`;
  }
  return `-${formatted}`;
}

/**
 * Format currency value
 *
 * @param value - The numeric value
 * @param currency - Currency code (default: 'USD')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234567.89) // "$1,234,568"
 * formatCurrency(1234.56, 'USD', 2) // "$1,234.56"
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return 'N/A';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `$${formatScore(value, decimals)}`;
  }
}

/**
 * Format a large number with K/M/B suffixes
 *
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number with suffix
 *
 * @example
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(12345) // "12.3K"
 */
export function formatCompactNumber(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return 'N/A';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${formatScore(absValue / 1e9, decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${formatScore(absValue / 1e6, decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${formatScore(absValue / 1e3, decimals)}K`;
  }

  return formatScore(value, decimals);
}

/**
 * Format a ROI multiplier
 *
 * @param value - The ROI value (e.g., 2.5 for 2.5x)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted ROI string
 *
 * @example
 * formatROI(2.569999999999995) // "2.6x"
 */
export function formatROI(
  value: number | null | undefined,
  decimals: number = 1
): string {
  const formatted = formatScore(value, decimals);
  if (formatted === 'N/A') {
    return 'N/A';
  }
  return `${formatted}x`;
}

/**
 * Safely round a number to avoid floating point issues
 *
 * @param value - The numeric value
 * @param decimals - Number of decimal places
 * @returns Rounded number or NaN for invalid inputs
 */
export function safeRound(value: number | null | undefined, decimals: number = 0): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return NaN;
  }

  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamp a value between min and max
 *
 * @param value - The value to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 100)
 * @returns Clamped value
 */
export function clampScore(
  value: number | null | undefined,
  min: number = 0,
  max: number = 100
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
