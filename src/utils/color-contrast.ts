/**
 * Color Contrast Utilities for WCAG Accessibility Compliance
 * BizHealth.ai - Client Portal Dashboard
 *
 * Provides functions to calculate color luminance and determine
 * appropriate text colors for accessibility compliance.
 *
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Calculate relative luminance of a color (WCAG 2.0 formula)
 * @param hexColor Color in format: #RRGGBB, RRGGBB, or #RRGGBBAA
 * @returns Number 0-1 (0=black, 1=white)
 */
export function getRelativeLuminance(hexColor: string): number {
  // Normalize input - remove # and alpha channel if present
  let hex = hexColor.replace('#', '');
  if (hex.length === 8) hex = hex.substring(0, 6); // Remove alpha
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

  // Handle invalid hex
  if (hex.length !== 6) {
    return 0.5; // Default to mid-gray for invalid input
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const getLuminance = (val: number): number => {
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);
}

/**
 * Determine optimal text color type for given background
 * Uses WCAG luminance threshold
 * @param backgroundColor Hex color of background (supports alpha: #RRGGBBAA)
 * @returns 'dark' for light backgrounds, 'light' for dark backgrounds
 */
export function getContrastColorType(backgroundColor: string): 'dark' | 'light' {
  const luminance = getRelativeLuminance(backgroundColor);
  // Threshold 0.179 optimized for WCAG AA compliance
  return luminance > 0.179 ? 'dark' : 'light';
}

/**
 * Get actual CSS color value for text based on background
 * @param backgroundColor Hex color of background
 * @returns BizNavy (#212653) for light backgrounds, white (#FFFFFF) for dark
 */
export function getContrastTextColor(backgroundColor: string): string {
  return getContrastColorType(backgroundColor) === 'dark'
    ? '#212653'  // BizNavy
    : '#FFFFFF'; // White
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param foreground Foreground color in hex
 * @param background Background color in hex
 * @returns Ratio from 1:1 to 21:1
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate if color combination meets WCAG AA standard (4.5:1 for normal text)
 * @param foreground Foreground color in hex
 * @param background Background color in hex
 * @returns true if contrast ratio >= 4.5
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Validate if color combination meets WCAG AAA standard (7:1 for normal text)
 * @param foreground Foreground color in hex
 * @param background Background color in hex
 * @returns true if contrast ratio >= 7
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * BizHealth brand colors for reference
 */
export const BIZHEATH_BRAND = {
  navy: '#212653',
  green: '#969423',
  white: '#FFFFFF',
} as const;
