/**
 * BizHealth Enhanced Section Header with Percentile Ranking
 *
 * World-class pattern from Affirm Consulting report:
 * [Icon] [Section Name] | [Percentile Badge] | [Score/100] | [Band Badge]
 *
 * Provides instant competitive context without reading any prose.
 * Designed for scanability - executive should understand section status in <2 seconds.
 *
 * Deploy to:
 * - Comprehensive Report: All chapter and dimension sections
 * - Owner's Report: Chapter sections
 * - Category Reports: All sections
 *
 * NOT deployed to: Executive Brief (too detailed)
 */

import { BRAND_COLORS, type ScoreBand } from '../../utils/color-utils.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Section header configuration
 */
export interface SectionHeaderConfig {
  /** Section icon (emoji) */
  icon: string;
  /** Section name/title */
  sectionName: string;
  /** Section code (e.g., 'STR', 'GE') */
  sectionCode?: string;
  /** Score out of 100 */
  score: number;
  /** Percentile rank (0-100) */
  percentileRank: number;
  /** Industry label for context */
  industryLabel?: string;
}

/**
 * Section header rendering options
 */
export interface SectionHeaderOptions {
  /** Size variant */
  size?: 'large' | 'medium' | 'small';
  /** Show percentile badge */
  showPercentile?: boolean;
  /** Show band badge */
  showBand?: boolean;
  /** Show benchmark indicator */
  showBenchmark?: boolean;
  /** Benchmark value */
  benchmark?: number;
  /** Custom CSS class */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Band color mapping
 */
const BAND_COLORS: Record<string, string> = {
  Excellence: '#28a745',
  Proficiency: '#0d6efd',
  Attention: '#ffc107',
  Critical: '#dc3545',
};

/**
 * Size configurations
 */
const SIZE_CONFIG = {
  large: {
    iconSize: '40pt',
    titleSize: '24pt',
    scoreSize: '36pt',
    percentileSize: '16pt',
    bandSize: '12pt',
    padding: '20pt 28pt',
    borderWidth: '8px',
  },
  medium: {
    iconSize: '32pt',
    titleSize: '18pt',
    scoreSize: '28pt',
    percentileSize: '14pt',
    bandSize: '10pt',
    padding: '16pt 24pt',
    borderWidth: '6px',
  },
  small: {
    iconSize: '24pt',
    titleSize: '14pt',
    scoreSize: '22pt',
    percentileSize: '12pt',
    bandSize: '9pt',
    padding: '12pt 18pt',
    borderWidth: '4px',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get score band from numeric score (0-100)
 */
function getScoreBand(score: number): string {
  if (score >= 75) return 'Excellence';
  if (score >= 50) return 'Proficiency';
  if (score >= 25) return 'Attention';
  return 'Critical';
}

/**
 * Get band color
 */
function getBandColor(band: string): string {
  return BAND_COLORS[band] || '#666';
}

/**
 * Get percentile color
 */
function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return '#28a745';
  if (percentile >= 50) return '#0d6efd';
  if (percentile >= 25) return '#ffc107';
  return '#dc3545';
}

/**
 * Get percentile label
 */
function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top Quartile';
  if (percentile >= 50) return 'Above Median';
  if (percentile >= 25) return 'Below Median';
  return 'Bottom Quartile';
}

/**
 * Get ordinal suffix for a number
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Generate Enhanced Section Header with Percentile Ranking
 *
 * @param config - Section header configuration
 * @param options - Optional rendering configuration
 * @returns HTML string containing the section header
 *
 * @example
 * ```typescript
 * const html = generateEnhancedSectionHeader({
 *   icon: '🎯',
 *   sectionName: 'Strategy',
 *   sectionCode: 'STR',
 *   score: 72,
 *   percentileRank: 68,
 *   industryLabel: 'Professional Services'
 * });
 * ```
 */
export function generateEnhancedSectionHeader(
  config: SectionHeaderConfig,
  options: SectionHeaderOptions = {}
): string {
  const {
    size = 'large',
    showPercentile = true,
    showBand = true,
    showBenchmark = false,
    benchmark,
    className = '',
  } = options;

  const sizeConfig = SIZE_CONFIG[size];
  const band = getScoreBand(config.score);
  const bandColor = getBandColor(band);
  const percentileColor = getPercentileColor(config.percentileRank);
  const percentileLabel = getPercentileLabel(config.percentileRank);

  // Calculate benchmark delta if provided
  const benchmarkDelta = benchmark ? config.score - benchmark : 0;
  const benchmarkIndicator =
    showBenchmark && benchmark
      ? `
    <span style="
      font-size: 10pt;
      color: ${benchmarkDelta >= 0 ? '#28a745' : '#dc3545'};
      margin-left: 8pt;
    ">
      ${benchmarkDelta >= 0 ? '▲' : '▼'} ${Math.abs(benchmarkDelta)} vs benchmark
    </span>
  `
      : '';

  return `
    <div class="section-header-enhanced ${className}" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16pt;
      padding: ${sizeConfig.padding};
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-left: ${sizeConfig.borderWidth} solid ${bandColor};
      border-radius: 0 16pt 16pt 0;
      margin: 40pt 0 28pt 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    ">
      <!-- Left Section: Icon + Title -->
      <div style="display: flex; align-items: center; gap: 20pt;">
        <span style="
          font-size: ${sizeConfig.iconSize};
          line-height: 1;
        ">${config.icon}</span>
        <div>
          <div class="section-header-title" style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${sizeConfig.titleSize};
            font-weight: 700;
            color: ${BRAND_COLORS.navy};
            margin: 0;
            line-height: 1.2;
          ">${escapeHtml(config.sectionName)}</div>
          ${
            config.sectionCode
              ? `
            <span style="
              font-size: 10pt;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              font-family: 'Open Sans', Arial, sans-serif;
            ">${escapeHtml(config.sectionCode)}</span>
          `
              : ''
          }
        </div>
      </div>

      <!-- Right Section: Percentile + Score + Band -->
      <div style="display: flex; align-items: center; gap: 24pt; flex-wrap: wrap;">

        ${
          showPercentile
            ? `
          <!-- Percentile Badge -->
          <div style="
            padding: 8pt 18pt;
            background: ${percentileColor}15;
            border: 2px solid ${percentileColor};
            border-radius: 24pt;
            text-align: center;
          ">
            <div style="
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: ${sizeConfig.percentileSize};
              font-weight: 700;
              color: ${percentileColor};
              line-height: 1;
            ">${config.percentileRank}${getOrdinalSuffix(config.percentileRank)}</div>
            <div style="
              font-size: 9pt;
              color: ${percentileColor};
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2pt;
            ">Percentile</div>
          </div>
        `
            : ''
        }

        <!-- Score Display -->
        <div style="text-align: center;">
          <div style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${sizeConfig.scoreSize};
            font-weight: 700;
            color: ${bandColor};
            line-height: 1;
          ">${config.score}</div>
          <div style="
            font-size: 12pt;
            color: #666;
          ">/100</div>
          ${benchmarkIndicator}
        </div>

        ${
          showBand
            ? `
          <!-- Band Badge -->
          <div style="
            padding: 10pt 20pt;
            background: ${bandColor};
            border-radius: 8pt;
            text-align: center;
          ">
            <div style="
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: ${sizeConfig.bandSize};
              font-weight: 700;
              color: white;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            ">${band}</div>
            ${
              config.industryLabel
                ? `
              <div style="
                font-size: 8pt;
                color: rgba(255,255,255,0.8);
                margin-top: 2pt;
              ">vs. ${escapeHtml(config.industryLabel)}</div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

      </div>
    </div>
  `;
}

/**
 * Generate a compact section header (for smaller sections)
 */
export function generateCompactSectionHeader(
  config: SectionHeaderConfig,
  options: Omit<SectionHeaderOptions, 'size'> = {}
): string {
  return generateEnhancedSectionHeader(config, { ...options, size: 'small' });
}

/**
 * Generate section header for chapter
 */
export function generateChapterHeader(
  chapterName: string,
  chapterCode: string,
  icon: string,
  score: number,
  percentile: number,
  options: SectionHeaderOptions = {}
): string {
  return generateEnhancedSectionHeader(
    {
      icon,
      sectionName: chapterName,
      sectionCode: chapterCode,
      score,
      percentileRank: percentile,
    },
    { ...options, size: 'large' }
  );
}

/**
 * Generate section header for dimension
 */
export function generateDimensionHeader(
  dimensionName: string,
  dimensionCode: string,
  icon: string,
  score: number,
  percentile: number,
  benchmark?: number,
  industryLabel?: string
): string {
  return generateEnhancedSectionHeader(
    {
      icon,
      sectionName: dimensionName,
      sectionCode: dimensionCode,
      score,
      percentileRank: percentile,
      industryLabel,
    },
    {
      size: 'medium',
      showBenchmark: !!benchmark,
      benchmark,
    }
  );
}

/**
 * Generate a minimal section header (just title and score)
 */
export function generateMinimalSectionHeader(
  title: string,
  icon: string,
  score: number
): string {
  const band = getScoreBand(score);
  const bandColor = getBandColor(band);

  return `
    <div class="section-header-minimal" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12pt 20pt;
      background: #f8f9fa;
      border-left: 4px solid ${bandColor};
      border-radius: 0 8pt 8pt 0;
      margin: 24pt 0 16pt 0;
    ">
      <div style="display: flex; align-items: center; gap: 12pt;">
        <span style="font-size: 20pt;">${icon}</span>
        <div class="section-header-title" style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 16pt;
          font-weight: 600;
          color: ${BRAND_COLORS.navy};
          margin: 0;
        ">${escapeHtml(title)}</div>
      </div>
      <div style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 20pt;
        font-weight: 700;
        color: ${bandColor};
      ">${score}/100</div>
    </div>
  `;
}

/**
 * Generate inline score badge (for use within text)
 */
export function generateInlineScoreBadge(score: number, label?: string): string {
  const band = getScoreBand(score);
  const bandColor = getBandColor(band);

  return `
    <span class="inline-score-badge" style="
      display: inline-flex;
      align-items: center;
      gap: 6pt;
      padding: 2pt 8pt;
      background: ${bandColor}15;
      border: 1px solid ${bandColor};
      border-radius: 12pt;
      font-family: 'Montserrat', Arial, sans-serif;
      font-size: 11pt;
      font-weight: 600;
      color: ${bandColor};
    ">
      ${label ? `<span>${escapeHtml(label)}:</span>` : ''}
      <span>${score}</span>
    </span>
  `;
}

/**
 * Generate percentile badge (standalone)
 */
export function generatePercentileBadge(
  percentile: number,
  size: 'large' | 'medium' | 'small' = 'medium'
): string {
  const percentileColor = getPercentileColor(percentile);
  const fontSizes = { large: '18pt', medium: '14pt', small: '11pt' };
  const padding = { large: '10pt 20pt', medium: '6pt 14pt', small: '4pt 10pt' };

  return `
    <span class="percentile-badge" style="
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: ${padding[size]};
      background: ${percentileColor}15;
      border: 2px solid ${percentileColor};
      border-radius: 20pt;
    ">
      <span style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: ${fontSizes[size]};
        font-weight: 700;
        color: ${percentileColor};
        line-height: 1;
      ">${percentile}${getOrdinalSuffix(percentile)}</span>
      <span style="
        font-size: 8pt;
        color: ${percentileColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2pt;
      ">%ile</span>
    </span>
  `;
}
