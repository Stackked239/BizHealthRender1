/**
 * Currency Formatting Utility
 * BizHealth.ai - Consistent financial number formatting
 *
 * IMPORTANT: Input values are raw numbers (e.g., 120000 = $120,000)
 * The formatter handles conversion to abbreviated format (e.g., $120K)
 *
 * @version 1.0.0
 * @since December 2025
 */

export type CurrencyStyle = 'abbreviated' | 'full';

export interface CurrencyFormatOptions {
  style?: CurrencyStyle;
  locale?: string;
  symbol?: string;
  showDecimals?: boolean;
}

const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  style: 'abbreviated',
  locale: 'en-US',
  symbol: '$',
  showDecimals: false,
};

/**
 * Format a single number as currency
 * @param value Raw numeric value (e.g., 120000 for $120K)
 * @param options Formatting options
 * @returns Formatted string (e.g., "$120K" or "$120,000")
 *
 * @example
 * formatCurrency(120000) // "$120K"
 * formatCurrency(4000000) // "$4M"
 * formatCurrency(120000, { style: 'full' }) // "$120,000"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Handle null/undefined/NaN
  if (value === null || value === undefined || isNaN(value)) {
    return `${opts.symbol}0`;
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (opts.style === 'full') {
    // Full comma-separated format
    return `${sign}${opts.symbol}${absValue.toLocaleString(opts.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Abbreviated format
  let formatted: string;

  if (absValue >= 1_000_000_000) {
    // Billions
    const billions = absValue / 1_000_000_000;
    formatted = `${billions.toFixed(opts.showDecimals ? 1 : 0).replace(/\.0$/, '')}B`;
  } else if (absValue >= 1_000_000) {
    // Millions
    const millions = absValue / 1_000_000;
    formatted = `${millions.toFixed(opts.showDecimals ? 1 : 0).replace(/\.0$/, '')}M`;
  } else if (absValue >= 1_000) {
    // Thousands
    const thousands = absValue / 1_000;
    formatted = `${thousands.toFixed(opts.showDecimals ? 1 : 0).replace(/\.0$/, '')}K`;
  } else {
    // Raw value (under 1000)
    formatted = absValue.toFixed(0);
  }

  return `${sign}${opts.symbol}${formatted}`;
}

/**
 * Format a currency range (min-max)
 * @param min Minimum value (raw number)
 * @param max Maximum value (raw number)
 * @param options Formatting options
 * @returns Formatted range string (e.g., "$120K-$180K")
 *
 * @example
 * formatCurrencyRange(120000, 180000) // "$120K-$180K"
 * formatCurrencyRange(4000000, 6000000) // "$4M-$6M"
 */
export function formatCurrencyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  const minFormatted = formatCurrency(min, options);
  const maxFormatted = formatCurrency(max, options);
  return `${minFormatted}-${maxFormatted}`;
}

/**
 * Detect malformed currency patterns
 * Returns error message if malformed, empty string if valid
 *
 * Common malformation: "$120000K" (should be "$120K")
 */
export function detectMalformedCurrency(value: string): string {
  // Pattern: 4+ consecutive digits followed by K/M/B suffix
  // e.g., $120000K, $4000000M
  if (/\$\d{4,}[KMB]/i.test(value)) {
    return (
      `Malformed currency: "${value}" appears to mix raw number with K/M suffix. ` +
      `Example: "$120000K" should be "$120K" or "$120,000"`
    );
  }

  // Pattern: Missing $ symbol for values that look like currency
  if (/^\d+[KMB]?\s*-\s*\d+[KMB]?$/i.test(value)) {
    return `Missing currency symbol: "${value}" should include $ prefix`;
  }

  return ''; // Valid
}

/**
 * Validate currency format matches expected patterns
 */
export function isValidCurrencyFormat(value: string): boolean {
  // Valid patterns:
  // $120K, $4M, $500
  // $120K-$180K, $4M-$6M
  // $120,000, $120,000-$180,000
  const validPatterns = [
    /^\$[\d.]+[KMB]?$/i, // Single abbreviated
    /^\$[\d,]+$/, // Single full
    /^\$[\d.]+[KMB]?-\$[\d.]+[KMB]?$/i, // Range abbreviated
    /^\$[\d,]+-\$[\d,]+$/, // Range full
  ];

  return validPatterns.some((pattern) => pattern.test(value));
}
