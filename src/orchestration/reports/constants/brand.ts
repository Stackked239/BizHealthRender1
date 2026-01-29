/**
 * BizHealth.ai Brand Standards
 * Single source of truth for all visual components
 *
 * @module brand
 */

/**
 * Core brand colors
 */
export const BIZHEALTH_COLORS = {
  // Primary Brand
  primary: '#212653',      // BizNavy - primary brand color
  accent: '#969423',       // BizGreen - accent color

  // Score Bands
  critical: '#dc3545',     // Red - Critical band (0-39)
  attention: '#ffc107',    // Yellow - Attention band (40-59)
  proficiency: '#0d6efd',  // Blue - Proficiency band (60-79)
  excellence: '#28a745',   // Green - Excellence band (80-100)

  // Utility Colors
  lightBg: '#f8f9fa',
  mediumBg: '#e9ecef',
  darkBg: '#212653',
  border: '#e9ecef',
  borderDark: '#dee2e6',

  // Text Colors
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  textOnDark: '#ffffff',

  // Chart Colors
  chartPrimary: '#212653',
  chartSecondary: '#969423',
  chartTertiary: '#3B82F6',
  chartQuaternary: '#8B5CF6',
  benchmarkLine: '#9CA3AF',

  // Risk Colors
  riskCritical: '#dc3545',
  riskHigh: '#e67e22',
  riskMedium: '#ffc107',
  riskLow: '#28a745',
} as const;

/**
 * Typography settings
 */
export const BIZHEALTH_TYPOGRAPHY = {
  heading: "'Montserrat', 'Open Sans', Arial, sans-serif",
  body: "'Open Sans', Arial, sans-serif",
  chart: "'Segoe UI', 'Open Sans', sans-serif",
  mono: "'Courier New', 'Monaco', monospace",
} as const;

/**
 * Score band thresholds
 */
export const SCORE_BAND_THRESHOLDS = {
  excellence: 80,
  proficiency: 60,
  attention: 40,
  critical: 0,
} as const;

/**
 * Score band type
 */
export type ScoreBandType = 'excellence' | 'proficiency' | 'attention' | 'critical';

/**
 * Get color for a score value
 */
export function getScoreBandColor(score: number, max: number = 100): string {
  const normalized = (score / max) * 100;
  if (normalized >= SCORE_BAND_THRESHOLDS.excellence) return BIZHEALTH_COLORS.excellence;
  if (normalized >= SCORE_BAND_THRESHOLDS.proficiency) return BIZHEALTH_COLORS.proficiency;
  if (normalized >= SCORE_BAND_THRESHOLDS.attention) return BIZHEALTH_COLORS.attention;
  return BIZHEALTH_COLORS.critical;
}

/**
 * Get band name for a score value
 */
export function getScoreBandName(score: number, max: number = 100): ScoreBandType {
  const normalized = (score / max) * 100;
  if (normalized >= SCORE_BAND_THRESHOLDS.excellence) return 'excellence';
  if (normalized >= SCORE_BAND_THRESHOLDS.proficiency) return 'proficiency';
  if (normalized >= SCORE_BAND_THRESHOLDS.attention) return 'attention';
  return 'critical';
}

/**
 * Get display label for a score band
 */
export function getScoreBandLabel(band: ScoreBandType): string {
  const labels: Record<ScoreBandType, string> = {
    excellence: 'Excellence',
    proficiency: 'Proficiency',
    attention: 'Needs Attention',
    critical: 'Critical',
  };
  return labels[band];
}

/**
 * Gauge size configurations
 */
export const GAUGE_SIZES = {
  large: { width: 180, height: 120, fontSize: 28, arcWidth: 12 },
  medium: { width: 120, height: 80, fontSize: 20, arcWidth: 10 },
  small: { width: 80, height: 60, fontSize: 16, arcWidth: 8 },
  mini: { width: 50, height: 40, fontSize: 12, arcWidth: 6 },
} as const;

export type GaugeSizeType = keyof typeof GAUGE_SIZES;

/**
 * Chart colors for consistent multi-series charts
 */
export const CHART_SERIES_COLORS = [
  BIZHEALTH_COLORS.primary,
  BIZHEALTH_COLORS.accent,
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
] as const;

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors: Record<string, string> = {
    low: BIZHEALTH_COLORS.riskLow,
    medium: BIZHEALTH_COLORS.riskMedium,
    high: BIZHEALTH_COLORS.riskHigh,
    critical: BIZHEALTH_COLORS.riskCritical,
  };
  return colors[level] || BIZHEALTH_COLORS.riskMedium;
}

/**
 * Brand configuration object for report options
 */
export const BIZHEALTH_BRAND = {
  colors: BIZHEALTH_COLORS,
  typography: BIZHEALTH_TYPOGRAPHY,
  scoreBands: {
    thresholds: SCORE_BAND_THRESHOLDS,
    getColor: getScoreBandColor,
    getBand: getScoreBandName,
    getLabel: getScoreBandLabel,
  },
  gauges: GAUGE_SIZES,
  charts: {
    seriesColors: CHART_SERIES_COLORS,
    getColor: getChartColor,
  },
  risk: {
    getColor: getRiskLevelColor,
  },
} as const;

export default BIZHEALTH_BRAND;
