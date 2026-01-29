/**
 * Financial Metrics Utility
 *
 * Provides safe financial calculations for reports, including:
 * - Payback period formatting (fixes "Infinitymo" bug)
 * - ROI calculations with safety guards
 * - Investment/return formatting
 *
 * @module utils/financial-metrics
 */

/**
 * Format payback period in months with proper handling of edge cases.
 * Fixes the "Infinitymo" bug by guarding against division by zero and infinity.
 *
 * @param investment - Total investment amount (can be null/undefined)
 * @param annualValue - Annual return value (can be null/undefined)
 * @param explicitTimeToValueMonths - Optional explicit time-to-value in months
 * @returns Formatted payback string (e.g., "6 months", "1.5 years", "Immediate", "N/A")
 *
 * @example
 * formatPaybackMonths(50000, 100000) // "6 months"
 * formatPaybackMonths(0, 50000) // "Immediate"
 * formatPaybackMonths(50000, 0) // "N/A"
 * formatPaybackMonths(1000000, 10000) // "10+ years"
 */
export function formatPaybackMonths(
  investment: number | null | undefined,
  annualValue: number | null | undefined,
  explicitTimeToValueMonths?: number | null
): string {
  // Priority: Use explicit time-to-value if provided and valid
  if (explicitTimeToValueMonths != null && explicitTimeToValueMonths > 0) {
    return formatMonthsDisplay(explicitTimeToValueMonths);
  }

  const inv = Number(investment) || 0;
  const annual = Number(annualValue) || 0;

  // No investment required
  if (inv <= 0) {
    return annual > 0 ? 'Immediate' : 'N/A';
  }

  // No return expected
  if (annual <= 0) {
    return 'N/A';
  }

  const monthlyBenefit = annual / 12;
  const months = inv / monthlyBenefit;

  // Guard against infinity/NaN
  if (!Number.isFinite(months) || months <= 0) {
    return 'N/A';
  }

  return formatMonthsDisplay(months);
}

/**
 * Format months into a human-readable display string
 *
 * @param months - Number of months
 * @returns Formatted string (e.g., "6 months", "1.5 years", "10+ years")
 */
function formatMonthsDisplay(months: number): string {
  // Guard against invalid input
  if (!Number.isFinite(months) || months <= 0) {
    return 'N/A';
  }

  // Very long payback periods
  if (months > 120) {
    return '10+ years';
  }

  // 2+ years: show in years with one decimal
  if (months >= 24) {
    const years = Math.round((months / 12) * 10) / 10;
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  // 12-23 months: show in years and months
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years}yr ${remainingMonths}mo`;
  }

  // Less than 12 months
  const roundedMonths = Math.ceil(months);
  return `${roundedMonths} month${roundedMonths !== 1 ? 's' : ''}`;
}

/**
 * Validate that a payback display string doesn't contain invalid values
 *
 * @param display - The formatted payback string to validate
 * @returns true if the display string is valid
 */
export function isValidPaybackDisplay(display: string): boolean {
  if (!display || typeof display !== 'string') {
    return false;
  }
  return !/infinity|nan|undefined|null/i.test(display);
}

/**
 * Calculate ROI multiplier with safety guards
 *
 * @param investment - Investment amount
 * @param returnValue - Return value
 * @returns ROI multiplier (e.g., 5.0 for 5x return) or null if invalid
 */
export function calculateROIMultiplier(
  investment: number | null | undefined,
  returnValue: number | null | undefined
): number | null {
  const inv = Number(investment) || 0;
  const ret = Number(returnValue) || 0;

  // Can't calculate ROI without investment
  if (inv <= 0) {
    return ret > 0 ? null : null; // Infinite ROI or undefined
  }

  const roi = ret / inv;

  // Guard against infinity/NaN
  if (!Number.isFinite(roi)) {
    return null;
  }

  return Math.round(roi * 10) / 10; // Round to 1 decimal place
}

/**
 * Format ROI for display with safety guards
 *
 * @param investment - Investment amount
 * @param returnValue - Return value
 * @returns Formatted ROI string (e.g., "5.0x", "N/A", "High")
 */
export function formatROIDisplay(
  investment: number | null | undefined,
  returnValue: number | null | undefined
): string {
  const inv = Number(investment) || 0;
  const ret = Number(returnValue) || 0;

  // No investment required - infinite ROI
  if (inv <= 0 && ret > 0) {
    return 'High';
  }

  // No return expected
  if (ret <= 0) {
    return 'N/A';
  }

  const roi = calculateROIMultiplier(investment, returnValue);

  if (roi === null) {
    return 'N/A';
  }

  // Very high ROI
  if (roi > 100) {
    return '100+x';
  }

  return `${roi.toFixed(1)}x`;
}

/**
 * Safe payback calculation that returns a number or null
 *
 * @param investment - Investment amount
 * @param annualValue - Annual return value
 * @returns Payback in months, or null if calculation is invalid
 */
export function calculatePaybackMonths(
  investment: number | null | undefined,
  annualValue: number | null | undefined
): number | null {
  const inv = Number(investment) || 0;
  const annual = Number(annualValue) || 0;

  // Edge cases
  if (inv <= 0) {
    return annual > 0 ? 0 : null;
  }

  if (annual <= 0) {
    return null;
  }

  const monthlyBenefit = annual / 12;
  const months = inv / monthlyBenefit;

  // Guard against infinity/NaN
  if (!Number.isFinite(months) || months < 0) {
    return null;
  }

  return Math.round(months * 10) / 10; // Round to 1 decimal
}

/**
 * Validate and sanitize a payback months value
 *
 * @param value - Raw payback value (could be any type from API)
 * @returns Safe number or null
 */
export function sanitizePaybackValue(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const num = Number(value);

  if (!Number.isFinite(num) || num < 0) {
    return null;
  }

  return num;
}

/**
 * Format currency amount for display
 *
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrencyAmount(
  amount: number | null | undefined,
  options: {
    abbreviate?: boolean;
    currency?: string;
    showZero?: boolean;
  } = {}
): string {
  const { abbreviate = true, currency = 'USD', showZero = false } = options;

  const num = Number(amount) || 0;

  if (num === 0 && !showZero) {
    return 'N/A';
  }

  if (!Number.isFinite(num)) {
    return 'N/A';
  }

  if (abbreviate) {
    if (Math.abs(num) >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1000) {
      return `$${Math.round(num / 1000)}K`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Calculate and format investment range display
 *
 * @param min - Minimum investment
 * @param max - Maximum investment
 * @returns Formatted range string
 */
export function formatInvestmentRangeDisplay(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const minVal = Number(min) || 0;
  const maxVal = Number(max) || 0;

  if (minVal <= 0 && maxVal <= 0) {
    return 'N/A';
  }

  if (minVal <= 0) {
    return formatCurrencyAmount(maxVal);
  }

  if (maxVal <= 0 || minVal === maxVal) {
    return formatCurrencyAmount(minVal);
  }

  return `${formatCurrencyAmount(minVal)}-${formatCurrencyAmount(maxVal)}`;
}
