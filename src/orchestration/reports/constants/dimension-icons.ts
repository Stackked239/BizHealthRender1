/**
 * Dimension and Chapter Icons Constants
 *
 * Provides visual icons for each dimension and chapter to enhance
 * report visual differentiation and navigation.
 */

import type { DimensionCode, ChapterCode } from '../../../types/idm.types.js';

/**
 * Icons for each dimension code
 */
export const DIMENSION_ICONS: Record<string, string> = {
  // Strategy & Revenue Engine
  'STR': '🎯',  // Strategy
  'SAL': '💰',  // Sales
  'MKT': '📢',  // Marketing

  // Performance & Health
  'CXP': '⭐',  // Customer Experience
  'OPS': '⚙️',  // Operations
  'FIN': '📊',  // Financials

  // People & Leadership
  'HRS': '👥',  // Human Resources
  'LDR': '👔',  // Leadership & Governance

  // Technology & Resilience
  'TIN': '💡',  // Technology & Innovation
  'ITS': '🖥️',  // IT, Data & Systems

  // Risk & Compliance
  'RSK': '🛡️',  // Risk Management
  'CMP': '📋',  // Compliance
};

/**
 * Icons for each chapter code
 */
export const CHAPTER_ICONS: Record<string, string> = {
  'GE': '🚀',   // Growth Engine
  'PH': '💪',   // Performance & Health
  'PL': '👥',   // People & Leadership
  'RS': '🛡️',   // Resilience & Safeguards
};

/**
 * Chapter names mapping
 */
export const CHAPTER_NAMES: Record<string, string> = {
  'GE': 'Growth Engine',
  'PH': 'Performance & Health',
  'PL': 'People & Leadership',
  'RS': 'Resilience & Safeguards',
};

/**
 * Dimension names mapping
 */
export const DIMENSION_NAMES: Record<string, string> = {
  'STR': 'Strategy',
  'SAL': 'Sales',
  'MKT': 'Marketing',
  'CXP': 'Customer Experience',
  'OPS': 'Operations',
  'FIN': 'Financials',
  'HRS': 'Human Resources',
  'LDR': 'Leadership & Governance',
  'TIN': 'Technology & Innovation',
  'ITS': 'IT, Data & Systems',
  'RSK': 'Risk Management',
  'CMP': 'Compliance',
};

/**
 * Chapter to dimensions mapping
 */
export const CHAPTER_DIMENSIONS: Record<string, string[]> = {
  'GE': ['STR', 'SAL', 'MKT'],           // Growth Engine
  'PH': ['CXP', 'OPS', 'FIN'],           // Performance & Health
  'PL': ['HRS', 'LDR'],                   // People & Leadership
  'RS': ['TIN', 'ITS', 'RSK', 'CMP'],    // Resilience & Safeguards
};

/**
 * Get icon for a dimension code
 */
export function getDimensionIcon(dimensionCode: string): string {
  return DIMENSION_ICONS[dimensionCode] || '📌';
}

/**
 * Get icon for a chapter code
 */
export function getChapterIcon(chapterCode: string): string {
  return CHAPTER_ICONS[chapterCode] || '📁';
}

/**
 * Get chapter name from code
 */
export function getChapterName(chapterCode: string): string {
  return CHAPTER_NAMES[chapterCode] || chapterCode;
}

/**
 * Get dimension name from code
 */
export function getDimensionName(dimensionCode: string): string {
  return DIMENSION_NAMES[dimensionCode] || dimensionCode;
}

/**
 * Generate dimension header with icon
 */
export function generateDimensionHeaderHtml(
  dimensionCode: string,
  dimensionName: string,
  score?: number
): string {
  const icon = getDimensionIcon(dimensionCode);

  return `
    <div class="dimension-header">
      <div class="dimension-icon">${icon}</div>
      <h3>${dimensionName}</h3>
      ${score !== undefined ? `<span class="section-score">${score}/100</span>` : ''}
    </div>
  `;
}

/**
 * Generate chapter header with icon
 */
export function generateChapterHeaderHtml(
  chapterCode: string,
  chapterName: string,
  score?: number,
  subtitle?: string
): string {
  const icon = getChapterIcon(chapterCode);

  return `
    <div class="chapter-header-enhanced">
      <div class="chapter-icon">${icon}</div>
      <div class="chapter-title-group">
        <h2>${chapterName}</h2>
        ${subtitle ? `<div class="chapter-subtitle">${subtitle}</div>` : ''}
      </div>
      ${score !== undefined ? `<span class="section-score">${score}/100</span>` : ''}
    </div>
  `;
}

/**
 * Finding type icons
 */
export const FINDING_TYPE_ICONS: Record<string, string> = {
  'strength': '✅',
  'gap': '❌',
  'risk': '⚠️',
  'opportunity': '📈',
};

/**
 * Get finding type icon
 */
export function getFindingTypeIcon(findingType: string): string {
  return FINDING_TYPE_ICONS[findingType] || '📌';
}

/**
 * Priority icons
 */
export const PRIORITY_ICONS: Record<string, string> = {
  'critical': '🔴',
  'high': '🟠',
  'medium': '🟡',
  'low': '🟢',
};

/**
 * Get priority icon
 */
export function getPriorityIcon(priority: string): string {
  return PRIORITY_ICONS[priority.toLowerCase()] || '⚪';
}

/**
 * Band status icons
 */
export const BAND_ICONS: Record<string, string> = {
  'Excellence': '🏆',
  'Proficiency': '✓',
  'Attention': '⚡',
  'Critical': '🚨',
};

/**
 * Get band status icon
 */
export function getBandIcon(band: string): string {
  return BAND_ICONS[band] || '📊';
}

/**
 * Trajectory icons
 *
 * - 'Initial': First assessment (baseline established)
 * - 'Improving': Positive trend from prior assessment
 * - 'Stable': No significant change from prior assessment
 * - 'Declining': Negative trend from prior assessment
 * - 'Flat': DEPRECATED - use 'Stable' instead
 */
export const TRAJECTORY_ICONS: Record<string, string> = {
  'Initial': '📊',   // Chart - baseline established
  'Improving': '📈',
  'Stable': '➡️',
  'Declining': '📉',
  'Flat': '➡️',      // DEPRECATED - kept for backward compatibility
};

/**
 * Trajectory display labels (user-friendly text)
 */
export const TRAJECTORY_LABELS: Record<string, string> = {
  'Initial': 'Baseline Established',
  'Improving': 'Improving',
  'Stable': 'Stable',
  'Declining': 'Declining',
  'Flat': 'Stable',  // DEPRECATED - map to Stable
};

/**
 * Get trajectory icon
 */
export function getTrajectoryIconEmoji(trajectory: string): string {
  return TRAJECTORY_ICONS[trajectory] || '📊';
}

/**
 * Get trajectory display label
 */
export function getTrajectoryLabel(trajectory: string): string {
  return TRAJECTORY_LABELS[trajectory] || trajectory;
}
