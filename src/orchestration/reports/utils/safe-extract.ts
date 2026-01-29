/**
 * Safe Extraction Utilities for Manager Reports
 *
 * Provides type-safe extraction utilities to prevent undefined/null values
 * in rendered report output. ALL IDM access MUST use these utilities.
 *
 * @module safe-extract
 */

/**
 * Generic safe extraction with type safety
 * Returns fallback if value is null or undefined
 */
export function safeExtractValue<T>(
  value: T | null | undefined,
  fallback: T
): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  return value;
}

/**
 * Safe string extraction with meaningful fallback
 * Ensures non-empty string output
 */
export function safeStringValue(
  value: string | null | undefined,
  fallback: string = 'Information pending analysis'
): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  return value.trim();
}

/**
 * Safe number extraction with validation
 * Handles NaN and non-numeric values
 */
export function safeNumber(
  value: number | null | undefined,
  fallback: number = 0
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value;
}

/**
 * Safe score extraction (clamped to 0-100 range)
 * Rounds to integer and clamps within valid score range
 */
export function safeScore(
  value: number | null | undefined,
  fallback: number = 0
): number {
  const num = safeNumber(value, fallback);
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Safe array extraction
 * Returns empty array if value is not an array
 */
export function safeArray<T>(
  value: T[] | null | undefined,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value;
}

/**
 * Safe object property access with deep path support
 * Navigates nested objects safely using dot notation
 *
 * @example
 * safeGetPath(obj, 'chapters.GE.score', 0)
 * safeGetPath(obj, 'dimensions.0.name', 'Unknown')
 */
export function safeGetPath<T>(
  obj: unknown,
  path: string,
  fallback: T
): T {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current ?? fallback) as T;
}

/**
 * Safe score band determination
 * Maps numeric score to performance tier
 */
export function safeScoreBand(score: number | null | undefined): string {
  const safeVal = safeScore(score, 0);
  if (safeVal >= 80) return 'Excellence';
  if (safeVal >= 60) return 'Proficiency';
  if (safeVal >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Get score band CSS class (lowercase for CSS compatibility)
 */
export function safeScoreBandClass(score: number | null | undefined): string {
  return safeScoreBand(score).toLowerCase();
}

/**
 * Get score band color for inline styles
 */
export function safeScoreBandColor(score: number | null | undefined): string {
  const band = safeScoreBand(score);
  const colors: Record<string, string> = {
    'Excellence': '#059669',
    'Proficiency': '#2563eb',
    'Attention': '#d97706',
    'Critical': '#dc2626'
  };
  return colors[band] || '#6b7280';
}

/**
 * Safe effort level normalization
 * Converts various effort representations to standardized levels
 */
export function safeEffortLevel(
  effort: string | number | null | undefined
): 'Low' | 'Medium' | 'High' {
  if (typeof effort === 'number') {
    if (effort <= 3 || effort <= 33) return 'Low';
    if (effort <= 6 || effort <= 66) return 'Medium';
    return 'High';
  }
  if (typeof effort === 'string') {
    const lower = effort.toLowerCase();
    if (lower.includes('low') || lower === 'l' || lower === '1') return 'Low';
    if (lower.includes('high') || lower === 'h' || lower === '3') return 'High';
    return 'Medium';
  }
  return 'Medium';
}

/**
 * Safe impact level normalization
 * Converts various impact representations to standardized levels
 */
export function safeImpactLevel(
  impact: string | number | null | undefined
): 'Low' | 'Medium' | 'High' {
  if (typeof impact === 'number') {
    if (impact <= 3 || impact <= 33) return 'Low';
    if (impact <= 6 || impact <= 66) return 'Medium';
    return 'High';
  }
  if (typeof impact === 'string') {
    const lower = impact.toLowerCase();
    if (lower.includes('low') || lower === 'l' || lower === '1') return 'Low';
    if (lower.includes('high') || lower === 'h' || lower === '3') return 'High';
    return 'Medium';
  }
  return 'Medium';
}

/**
 * Safe severity extraction
 * Normalizes severity from various formats
 */
export function safeSeverity(
  severity: string | number | null | undefined
): 'critical' | 'high' | 'medium' | 'low' {
  if (typeof severity === 'number') {
    if (severity >= 9) return 'critical';
    if (severity >= 7) return 'high';
    if (severity >= 4) return 'medium';
    return 'low';
  }
  if (typeof severity === 'string') {
    const lower = severity.toLowerCase();
    if (lower.includes('critical') || lower === '10' || lower === '9') return 'critical';
    if (lower.includes('high') || lower === '8' || lower === '7') return 'high';
    if (lower.includes('medium') || lower === 'med') return 'medium';
    return 'low';
  }
  return 'medium';
}

/**
 * Safe percentage formatting
 * Ensures clean percentage display
 */
export function safePercentage(
  value: number | null | undefined,
  decimals: number = 0
): string {
  const num = safeNumber(value, 0);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Safe delta/difference formatting
 * Formats score differences with +/- prefix
 */
export function safeDelta(
  current: number | null | undefined,
  baseline: number | null | undefined
): string {
  const curr = safeNumber(current, 0);
  const base = safeNumber(baseline, 0);
  const diff = curr - base;
  const prefix = diff >= 0 ? '+' : '';
  return `${prefix}${diff.toFixed(0)}`;
}

/**
 * Safe date formatting
 * Returns formatted date string or fallback
 */
export function safeDate(
  value: string | Date | null | undefined,
  fallback: string = 'Date pending'
): string {
  if (!value) return fallback;

  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fallback;
  }
}

/**
 * Safe truncation with ellipsis
 * Truncates text to specified length
 */
export function safeTruncate(
  value: string | null | undefined,
  maxLength: number = 100,
  suffix: string = '...'
): string {
  const str = safeStringValue(value, '');
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Safe HTML attribute escaping
 * Prevents XSS in attribute values
 */
export function safeAttr(value: string | null | undefined): string {
  const str = safeStringValue(value, '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Safe HTML content escaping
 * Prevents XSS in text content
 */
export function safeHtml(value: string | null | undefined): string {
  const str = safeStringValue(value, '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safe boolean extraction
 * Returns boolean from various truthy/falsy values
 */
export function safeBoolean(
  value: boolean | string | number | null | undefined,
  fallback: boolean = false
): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  return fallback;
}

/**
 * Safe first item extraction from array
 * Returns first element or fallback
 */
export function safeFirst<T>(
  array: T[] | null | undefined,
  fallback: T
): T {
  const arr = safeArray(array);
  return arr.length > 0 ? arr[0] : fallback;
}

/**
 * Safe count with fallback
 * Returns array length or 0
 */
export function safeCount(array: unknown[] | null | undefined): number {
  return safeArray(array).length;
}

/**
 * Safe object extraction
 * Ensures a valid object is returned
 */
export function safeObject<T extends Record<string, unknown>>(
  value: T | null | undefined,
  fallback: T
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }
  return value;
}

/**
 * Create a safe data extractor for a specific context
 * Returns a curried function bound to the context
 */
export function createSafeExtractor<T extends Record<string, unknown>>(context: T) {
  return {
    string: (path: string, fallback: string = '') => safeGetPath(context, path, fallback),
    number: (path: string, fallback: number = 0) => safeNumber(safeGetPath(context, path, fallback), fallback),
    score: (path: string, fallback: number = 0) => safeScore(safeGetPath(context, path, fallback), fallback),
    array: <U>(path: string, fallback: U[] = []) => safeArray(safeGetPath(context, path, fallback), fallback),
    boolean: (path: string, fallback: boolean = false) => safeBoolean(safeGetPath(context, path, fallback), fallback),
  };
}
