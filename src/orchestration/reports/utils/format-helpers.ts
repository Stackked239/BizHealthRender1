/**
 * Shared Formatting Utilities
 *
 * Used by: All report builders (Executive Brief, Owner's Report, Comprehensive, etc.)
 *
 * These utilities provide consistent formatting across all reports and NEVER
 * return generic placeholders like "TBD", "Minimal", or "N/A" when better
 * data-derived values can be computed.
 *
 * @module format-helpers
 */

import type {
  ReportRecommendation,
  ReportQuickWin,
} from '../../../types/report.types.js';

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Formats large numbers with K/M suffixes for compact display
 *
 * @param value - Numeric value to format
 * @returns Formatted string with suffix
 *
 * @example
 * formatK(1500000) // returns "1.5M"
 * formatK(75000) // returns "75K"
 * formatK(500) // returns "500"
 */
export function formatK(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

/**
 * Formats numbers as ordinals (1st, 2nd, 3rd, etc.)
 *
 * @param n - Number to convert to ordinal
 * @returns Ordinal string
 *
 * @example
 * formatOrdinal(1) // returns "1st"
 * formatOrdinal(2) // returns "2nd"
 * formatOrdinal(23) // returns "23rd"
 */
export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formats date strings for display in reports
 *
 * @param dateStr - ISO date string or undefined
 * @returns Formatted date string (e.g., "December 8, 2025")
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats date as short format (e.g., "Dec 8, 2025")
 *
 * @param dateStr - ISO date string or undefined
 * @returns Short formatted date string
 */
export function formatDateShort(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// INVESTMENT FORMATTING
// ============================================================================

/**
 * Formats investment range from recommendation data
 *
 * NEVER returns generic "Minimal", "TBD", or empty placeholders.
 * Uses intelligent derivation from available data.
 *
 * @param rec - Recommendation or QuickWin with cost data
 * @returns Human-readable investment range
 *
 * @example
 * formatInvestmentRange({ estimatedCost: { min: 10000, max: 25000 }}) // "$10K-$25K"
 * formatInvestmentRange({ effortScore: 30 }) // "$5K-$15K"
 */
export function formatInvestmentRange(rec: ReportRecommendation | ReportQuickWin | Record<string, unknown>): string {
  const recAny = rec as Record<string, unknown>;

  // Try explicit cost fields first
  const estimatedCost = recAny.estimatedCost as { min?: number; max?: number; value?: number } | undefined;
  if (estimatedCost?.min && estimatedCost?.max) {
    return `$${formatK(estimatedCost.min)}-$${formatK(estimatedCost.max)}`;
  }
  if (estimatedCost?.value) {
    return `~$${formatK(estimatedCost.value)}`;
  }

  // Try investment level descriptor
  const investmentLevel = recAny.investmentLevel as string | undefined;
  if (investmentLevel) {
    const levels: Record<string, string> = {
      'low': '$5K-$15K',
      'medium': '$15K-$50K',
      'high': '$50K-$150K',
      'minimal': '$1K-$5K',
      'significant': '$100K-$250K',
      'substantial': '$150K-$300K',
    };
    return levels[investmentLevel.toLowerCase()] || `$${investmentLevel}`;
  }

  // Derive from effort score (common in ReportRecommendation)
  const effortScore = recAny.effortScore as number | undefined;
  if (typeof effortScore === 'number') {
    if (effortScore < 30) return '$5K-$15K';
    if (effortScore < 50) return '$15K-$35K';
    if (effortScore < 70) return '$35K-$75K';
    return '$75K-$150K';
  }

  // Try effort descriptor
  const effort = recAny.effort as string | undefined;
  if (effort) {
    if (effort.toLowerCase() === 'low') return '$5K-$15K';
    if (effort.toLowerCase() === 'medium') return '$15K-$50K';
    if (effort.toLowerCase() === 'high') return '$50K-$150K';
  }

  // Informative fallback (never TBD or Minimal)
  return 'See Comprehensive Report';
}

/**
 * Formats return/impact estimate from recommendation data
 *
 * NEVER returns generic placeholders.
 *
 * @param rec - Recommendation or QuickWin with value data
 * @returns Human-readable return estimate
 *
 * @example
 * formatReturnEstimate({ expectedValue: { min: 50000, max: 150000 }}) // "$50K-$150K/yr"
 * formatReturnEstimate({ impactScore: 85 }) // "$50K-$150K+ annually"
 */
export function formatReturnEstimate(rec: ReportRecommendation | ReportQuickWin | Record<string, unknown>): string {
  const recAny = rec as Record<string, unknown>;

  // Try explicit value fields first
  const expectedValue = recAny.expectedValue as { min?: number; max?: number; value?: number } | undefined;
  if (expectedValue?.min && expectedValue?.max) {
    return `$${formatK(expectedValue.min)}-$${formatK(expectedValue.max)}/yr`;
  }
  if (expectedValue?.value) {
    return `~$${formatK(expectedValue.value)}/yr`;
  }

  // Derive from impact score (common in ReportRecommendation)
  const impactScore = recAny.impactScore as number | undefined;
  if (typeof impactScore === 'number') {
    if (impactScore >= 80) return '$75K-$200K+ annually';
    if (impactScore >= 70) return '$50K-$150K annually';
    if (impactScore >= 60) return '$25K-$75K annually';
    if (impactScore >= 40) return '$10K-$35K annually';
    return '$5K-$20K annually';
  }

  // Try impact descriptor
  const impact = recAny.impact as string | undefined;
  if (impact) {
    if (impact.toLowerCase() === 'high') return '$50K-$150K+ annually';
    if (impact.toLowerCase() === 'medium') return '$15K-$50K annually';
    if (impact.toLowerCase() === 'low') return '$5K-$15K annually';
  }

  // Use expected outcome if short enough
  const expectedOutcomes = recAny.expectedOutcomes as string | undefined;
  const expectedOutcome = recAny.expectedOutcome as string | undefined;
  const outcome = expectedOutcomes || expectedOutcome;
  if (outcome && outcome.length < 50) {
    return outcome;
  }

  return 'High-value opportunity';
}

// ============================================================================
// OWNER/ROLE MAPPING
// ============================================================================

/**
 * Maps dimension code to responsible executive owner/role
 *
 * NEVER returns "TBD" - always provides a meaningful role assignment.
 *
 * @param dimensionCode - Dimension code (e.g., "STR", "SAL") or chapter code
 * @returns Executive role responsible for this dimension
 *
 * @example
 * mapDimensionToOwner("STR") // "CEO / Strategy Lead"
 * mapDimensionToOwner("FIN") // "CFO / Finance Director"
 */
export function mapDimensionToOwner(dimensionCode?: string): string {
  if (!dimensionCode) return 'Executive Team';

  const ownerMap: Record<string, string> = {
    // Dimension codes
    'STR': 'CEO / Strategy Lead',
    'SAL': 'VP Sales / CRO',
    'MKT': 'CMO / Marketing Director',
    'CXP': 'Customer Success Lead',
    'OPS': 'COO / Operations Manager',
    'FIN': 'CFO / Finance Director',
    'HRS': 'CHRO / HR Director',
    'LDG': 'CEO / Board',
    'TIN': 'CTO / Innovation Lead',
    'IDS': 'CIO / IT Director',
    'RMS': 'Risk Manager / COO',
    'CMP': 'General Counsel / Compliance',
    // Chapter codes
    'GE': 'CEO / CRO',
    'PH': 'COO / CFO',
    'PL': 'CEO / CHRO',
    'RS': 'COO / General Counsel',
  };

  return ownerMap[dimensionCode.toUpperCase()] || 'Executive Team';
}

/**
 * Gets dimension display name from code
 */
export function getDimensionName(code: string): string {
  const names: Record<string, string> = {
    'STR': 'Strategy',
    'SAL': 'Sales',
    'MKT': 'Marketing',
    'CXP': 'Customer Experience',
    'OPS': 'Operations',
    'FIN': 'Financials',
    'HRS': 'Human Resources',
    'LDG': 'Leadership & Governance',
    'TIN': 'Technology & Innovation',
    'IDS': 'IT, Data & Systems',
    'RMS': 'Risk Management',
    'CMP': 'Compliance',
  };
  return names[code.toUpperCase()] || code;
}

// ============================================================================
// TIMEFRAME FORMATTING
// ============================================================================

/**
 * Formats recommendation horizon for display
 *
 * @param horizon - Horizon code (e.g., "90_days", "12_months")
 * @returns Human-readable timeframe
 */
export function formatHorizon(horizon?: string): string {
  if (!horizon) return '90 Days';

  const horizonMap: Record<string, string> = {
    '90_days': '0-90 Days',
    '12_months': '3-12 Months',
    '24_months_plus': '12-24+ Months',
    'immediate': '0-30 Days',
    'short-term': '30-90 Days',
    'medium-term': '3-6 Months',
    'long-term': '6-12 Months',
  };

  return horizonMap[horizon.toLowerCase()] || horizon;
}

/**
 * Maps horizon to deadline label for decision items
 *
 * @param horizon - Horizon code
 * @returns Decision deadline (e.g., "30 days")
 */
export function horizonToDeadline(horizon?: string): string {
  if (!horizon) return '30 days';

  const deadlineMap: Record<string, string> = {
    '90_days': '30 days',
    '12_months': '90 days',
    '24_months_plus': '180 days',
    'immediate': '14 days',
    'short-term': '30 days',
    'medium-term': '60 days',
    'long-term': '90 days',
  };

  return deadlineMap[horizon.toLowerCase()] || '30 days';
}

// ============================================================================
// SEVERITY FORMATTING
// ============================================================================

/**
 * Formats risk severity for display
 *
 * @param severity - Severity value (string or number)
 * @returns Severity label
 */
export function formatSeverity(severity: string | number): string {
  if (typeof severity === 'number') {
    if (severity >= 8) return 'Critical';
    if (severity >= 6) return 'High';
    if (severity >= 4) return 'Medium';
    return 'Low';
  }

  // Capitalize string severity
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

/**
 * Gets severity color for styling
 *
 * @param severity - Severity value
 * @returns Hex color code
 */
export function getSeverityColor(severity: string | number): string {
  const label = formatSeverity(severity).toLowerCase();
  const colors: Record<string, string> = {
    'critical': '#dc3545',
    'high': '#fd7e14',
    'medium': '#ffc107',
    'low': '#28a745',
  };
  return colors[label] || '#6c757d';
}

// ============================================================================
// TEXT TRUNCATION
// ============================================================================

/**
 * Truncates text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Truncates text to complete sentences within max length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Text truncated at sentence boundary
 */
export function truncateToSentences(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';

  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');

  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentence > maxLength * 0.5) {
    return truncated.substring(0, lastSentence + 1);
  }

  return truncated + '...';
}

// ============================================================================
// ENHANCED NUMBER FORMATTING (Phase 2.1 Enhancement - 2025-12-31)
// ============================================================================

/**
 * Format number with thousands separators
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string with commas
 *
 * @example
 * formatNumber(3333) // returns "3,333"
 * formatNumber(1234567) // returns "1,234,567"
 * formatNumber(1234.56, 2) // returns "1,234.56"
 */
export function formatNumber(
  value: number | undefined | null,
  decimals: number = 0
): string {
  if (value === undefined || value === null) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format currency with $ and thousands separators
 * @param value - Currency value
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrencyWithCommas(5000000) // returns "$5,000,000"
 * formatCurrencyWithCommas(5000000, { shorthand: true }) // returns "$5M"
 */
export function formatCurrencyWithCommas(
  value: number | undefined | null,
  options?: {
    shorthand?: boolean;
    decimals?: number;
  }
): string {
  if (value === undefined || value === null) return 'N/A';

  let displayValue = value;
  let suffix = '';

  if (options?.shorthand) {
    if (Math.abs(value) >= 1_000_000) {
      displayValue = value / 1_000_000;
      suffix = 'M';
    } else if (Math.abs(value) >= 1_000) {
      displayValue = value / 1_000;
      suffix = 'K';
    }
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 0
  }).format(displayValue);

  return formatted + suffix;
}

/**
 * Format percentage with % symbol and thousands separator
 * @param value - Percentage value (e.g., 3333 for 3,333%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(3333) // returns "3,333%"
 * formatPercentage(85.5, 1) // returns "85.5%"
 */
export function formatPercentage(
  value: number | undefined | null,
  decimals: number = 0
): string {
  if (value === undefined || value === null) return 'N/A';

  return formatNumber(value, decimals) + '%';
}

/**
 * Format currency range (e.g., "$120K - $180K")
 * @param min - Minimum value
 * @param max - Maximum value
 * @param options - Formatting options
 * @returns Formatted range string
 *
 * @example
 * formatCurrencyRange(120000, 180000, { shorthand: true }) // returns "$120K - $180K"
 */
export function formatCurrencyRange(
  min: number | undefined | null,
  max: number | undefined | null,
  options?: { shorthand?: boolean }
): string {
  if (min === undefined || min === null || max === undefined || max === null) {
    return 'N/A';
  }
  return `${formatCurrencyWithCommas(min, options)} - ${formatCurrencyWithCommas(max, options)}`;
}
