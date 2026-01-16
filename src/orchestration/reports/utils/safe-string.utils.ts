/**
 * Safe String Utilities for Report Generation
 *
 * Prevents "text.replace is not a function" errors by validating
 * input types before string operations. These utilities provide
 * defensive string handling for all report builders.
 *
 * @module safe-string.utils
 */

/**
 * Safely converts any value to a string with fallback.
 * Handles null, undefined, numbers, objects, and arrays gracefully.
 *
 * @param value - Value to convert (may be null, undefined, number, object)
 * @param fallback - Default string if conversion fails or value is empty
 * @returns Guaranteed string value
 *
 * @example
 * safeString("hello") // "hello"
 * safeString(42) // "42"
 * safeString(null) // ""
 * safeString(undefined, "N/A") // "N/A"
 * safeString({}) // ""
 * safeString([1, 2]) // "1,2"
 */
export function safeString(value: unknown, fallback: string = ''): string {
  // Handle null/undefined explicitly
  if (value === null || value === undefined) {
    return fallback;
  }

  // Already a string
  if (typeof value === 'string') {
    return value || fallback;
  }

  // Numbers (including 0, but not NaN)
  if (typeof value === 'number') {
    return isNaN(value) ? fallback : String(value);
  }

  // Booleans
  if (typeof value === 'boolean') {
    return String(value);
  }

  // Arrays - join with comma
  if (Array.isArray(value)) {
    const joined = value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => safeString(item))
      .filter((s) => s.length > 0)
      .join(', ');
    return joined || fallback;
  }

  // Objects - try toString, avoid [object Object]
  if (typeof value === 'object') {
    try {
      const str = String(value);
      // Avoid useless [object Object] representation
      if (str === '[object Object]') {
        return fallback;
      }
      return str || fallback;
    } catch {
      return fallback;
    }
  }

  // Fallback for any other types
  try {
    return String(value) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely performs string.replace() with type validation.
 * Converts input to string before applying replace operation.
 *
 * @param value - Value to perform replace on
 * @param searchValue - Pattern to search for (string or RegExp)
 * @param replaceValue - Replacement string
 * @param fallback - Default if value cannot be converted to string
 * @returns Result of replace operation or fallback
 *
 * @example
 * safeReplace("hello world", "world", "there") // "hello there"
 * safeReplace(null, "x", "y") // ""
 * safeReplace(42, /\d/g, "#") // "##"
 */
export function safeReplace(
  value: unknown,
  searchValue: string | RegExp,
  replaceValue: string,
  fallback: string = ''
): string {
  const str = safeString(value, fallback);
  return str.replace(searchValue, replaceValue);
}

/**
 * Safely trims whitespace from a value.
 *
 * @param value - Value to trim
 * @param fallback - Default if value is not a string
 * @returns Trimmed string or fallback
 *
 * @example
 * safeTrim("  hello  ") // "hello"
 * safeTrim(null) // ""
 * safeTrim(undefined, "N/A") // "N/A"
 */
export function safeTrim(value: unknown, fallback: string = ''): string {
  return safeString(value, fallback).trim();
}

/**
 * Safely converts value to lowercase.
 *
 * @param value - Value to convert
 * @param fallback - Default if value cannot be converted
 * @returns Lowercase string or fallback
 */
export function safeLowerCase(value: unknown, fallback: string = ''): string {
  return safeString(value, fallback).toLowerCase();
}

/**
 * Safely converts value to uppercase.
 *
 * @param value - Value to convert
 * @param fallback - Default if value cannot be converted
 * @returns Uppercase string or fallback
 */
export function safeUpperCase(value: unknown, fallback: string = ''): string {
  return safeString(value, fallback).toUpperCase();
}

/**
 * Validates and extracts narrative content for a specific section.
 *
 * @param narrativeContent - The narrative content object from context
 * @param sectionKey - Key to extract (e.g., 'employees', 'hrSummary')
 * @param fallbackContent - Default content if section missing
 * @returns Validated string content
 *
 * @example
 * extractNarrativeSection(ctx.narrativeContent, 'summary', 'No summary available')
 */
export function extractNarrativeSection(
  narrativeContent: Record<string, unknown> | null | undefined,
  sectionKey: string,
  fallbackContent: string = 'Content not available for this section.'
): string {
  if (!narrativeContent || typeof narrativeContent !== 'object') {
    return fallbackContent;
  }

  const section = narrativeContent[sectionKey];
  return safeString(section, fallbackContent);
}

/**
 * Type guard to check if value is a non-empty string.
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 *
 * @example
 * isNonEmptyString("hello") // true
 * isNonEmptyString("") // false
 * isNonEmptyString(null) // false
 * isNonEmptyString(42) // false
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if value is a string (including empty strings).
 *
 * @param value - Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Escapes HTML special characters safely, handling non-string inputs.
 * This is a defensive wrapper that ensures the input is converted to
 * a string before escaping.
 *
 * @param value - Any value to escape for HTML rendering
 * @param fallback - Default string if value cannot be converted
 * @returns HTML-escaped string
 *
 * @example
 * safeEscapeHtml("<script>alert('xss')</script>") // "&lt;script&gt;..."
 * safeEscapeHtml(null) // ""
 * safeEscapeHtml({ name: "test" }) // ""
 * safeEscapeHtml(42) // "42"
 */
export function safeEscapeHtml(value: unknown, fallback: string = ''): string {
  const str = safeString(value, fallback);
  if (!str) return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely joins an array of values into a string.
 *
 * @param values - Array of values to join
 * @param separator - Separator between values (default: ', ')
 * @param fallback - Default if array is empty or invalid
 * @returns Joined string or fallback
 *
 * @example
 * safeJoin(["a", "b", "c"]) // "a, b, c"
 * safeJoin([1, null, 2, undefined, 3], " | ") // "1 | 2 | 3"
 * safeJoin(null, ", ", "No items") // "No items"
 */
export function safeJoin(
  values: unknown[] | null | undefined,
  separator: string = ', ',
  fallback: string = ''
): string {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  const joined = values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => safeString(v))
    .filter((s) => s.length > 0)
    .join(separator);

  return joined || fallback;
}

/**
 * Extracts a property value safely from an object.
 *
 * @param obj - Object to extract from
 * @param key - Property key
 * @param fallback - Default if property doesn't exist or is invalid
 * @returns String value of the property or fallback
 *
 * @example
 * safeExtract({ name: "John" }, "name") // "John"
 * safeExtract({ count: 42 }, "count") // "42"
 * safeExtract(null, "name", "Unknown") // "Unknown"
 */
export function safeExtract(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string = ''
): string {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  return safeString(obj[key], fallback);
}

/**
 * Truncates a string to a maximum length, adding ellipsis if needed.
 *
 * @param value - Value to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 *
 * @example
 * safeTruncate("Hello World", 5) // "Hello..."
 * safeTruncate(null, 10, "N/A") // ""
 */
export function safeTruncate(
  value: unknown,
  maxLength: number = 100,
  suffix: string = '...'
): string {
  const str = safeString(value);
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Normalizes whitespace in a string (replaces multiple spaces with single).
 *
 * @param value - Value to normalize
 * @param fallback - Default if value cannot be converted
 * @returns Normalized string
 *
 * @example
 * safeNormalizeWhitespace("hello    world") // "hello world"
 * safeNormalizeWhitespace("  trim  me  ") // "trim me"
 */
export function safeNormalizeWhitespace(
  value: unknown,
  fallback: string = ''
): string {
  return safeString(value, fallback).replace(/\s+/g, ' ').trim();
}

/**
 * Provides a default value if the input is empty or invalid.
 *
 * @param value - Value to check
 * @param defaultValue - Default to return if value is empty
 * @returns The value as string or the default
 *
 * @example
 * safeDefault("hello", "world") // "hello"
 * safeDefault("", "world") // "world"
 * safeDefault(null, "world") // "world"
 */
export function safeDefault(value: unknown, defaultValue: string): string {
  const str = safeString(value);
  return str.trim().length > 0 ? str : defaultValue;
}
