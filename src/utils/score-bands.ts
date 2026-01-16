/**
 * BizHealth Score Band Utilities
 * Centralized score-to-visual mapping for consistent report styling
 *
 * Band Thresholds:
 * - Excellence: 80-100 (Green)
 * - Proficiency: 60-79 (Blue)
 * - Attention: 40-59 (Yellow)
 * - Critical: 0-39 (Red)
 *
 * @version 1.5.0
 * @since Phase 1.5 Integration (December 2025)
 */

export type BandName = 'Excellence' | 'Proficiency' | 'Attention' | 'Critical';

export interface BandInfo {
  name: BandName;
  color: string;
  backgroundColor: string;
  textColor: string;
}

// Brand Colors
const BAND_COLORS = {
  excellence: '#28a745', // Green
  proficiency: '#0d6efd', // Blue
  attention: '#ffc107', // Yellow/Amber
  critical: '#dc3545', // Red
} as const;

const BAND_BACKGROUNDS = {
  excellence: '#28a74520',
  proficiency: '#0d6efd20',
  attention: '#ffc10720',
  critical: '#dc354520',
} as const;

/**
 * Get the band name for a given score
 */
export function getBandName(score: number): BandName {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Get the primary color for a score band
 */
export function getBandColor(score: number): string {
  if (score >= 80) return BAND_COLORS.excellence;
  if (score >= 60) return BAND_COLORS.proficiency;
  if (score >= 40) return BAND_COLORS.attention;
  return BAND_COLORS.critical;
}

/**
 * Get the background color (20% opacity) for a score band
 */
export function getBandBackgroundColor(score: number): string {
  if (score >= 80) return BAND_BACKGROUNDS.excellence;
  if (score >= 60) return BAND_BACKGROUNDS.proficiency;
  if (score >= 40) return BAND_BACKGROUNDS.attention;
  return BAND_BACKGROUNDS.critical;
}

/**
 * Get appropriate text color for contrast on band background
 * Yellow band needs dark text; others use white
 */
export function getBandTextColor(score: number): string {
  if (score >= 40 && score < 60) return '#212653'; // Dark text on yellow
  return '#ffffff'; // White text on other colors
}

/**
 * Get complete band information for a score
 */
export function getBandInfo(score: number): BandInfo {
  return {
    name: getBandName(score),
    color: getBandColor(score),
    backgroundColor: getBandBackgroundColor(score),
    textColor: getBandTextColor(score),
  };
}

/**
 * ScoreBands object for backward compatibility
 * Matches the inline implementation pattern
 */
export const ScoreBands = {
  getColor: getBandColor,
  getLabel: getBandName,
  getBackgroundColor: getBandBackgroundColor,
  getTextColor: getBandTextColor,
  getInfo: getBandInfo,

  // Direct access to constants
  colors: BAND_COLORS,
  backgrounds: BAND_BACKGROUNDS,
};

export default ScoreBands;
