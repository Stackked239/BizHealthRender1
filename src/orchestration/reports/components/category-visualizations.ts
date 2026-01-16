/**
 * Phase 5 Category Visualization Components
 *
 * These SVG generators consume Phase 1.5 output to create visual elements
 * for the Comprehensive Report and other category-focused reports.
 */

import type { CategoryAnalysis, ChapterSummary, CrossCategoryInsights } from '../../../types/phase1-5.types.js';
import { CHAPTER_CATEGORY_MAPPING, CATEGORY_CODES_ORDERED } from '../../../data/question-category-mapping.js';

// ============================================================================
// BRAND COLORS
// ============================================================================

const COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  excellent: '#28a745',
  good: '#5cb85c',
  developing: '#f0ad4e',
  needsImprovement: '#d9534f',
  critical: '#c9302c',
  gray: '#6c757d',
  lightGray: '#e9ecef',
  white: '#ffffff'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color based on score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.excellent;
  if (score >= 60) return COLORS.good;
  if (score >= 40) return COLORS.developing;
  if (score >= 20) return COLORS.needsImprovement;
  return COLORS.critical;
}

/**
 * Truncate text to max length (for non-SWOT uses)
 */
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength - 1) + '…' : text;
}

/**
 * Wraps text for SVG rendering with proper line breaks
 * @param text - Original text string
 * @param maxCharsPerLine - Maximum characters per line (default 28)
 * @param maxLines - Maximum number of lines (default 3)
 * @returns Array of line strings, truncated if necessary
 */
function wrapSvgText(
  text: string,
  maxCharsPerLine: number = 28,
  maxLines: number = 3
): string[] {
  if (!text) return [''];

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (lines.length < maxLines - 1) {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxCharsPerLine
          ? word.substring(0, maxCharsPerLine - 1) + '…'
          : word;
      } else {
        // Final line - truncate with ellipsis
        const remaining = currentLine ? `${currentLine} ${word}` : word;
        lines.push(
          remaining.length > maxCharsPerLine
            ? remaining.substring(0, maxCharsPerLine - 1) + '…'
            : remaining
        );
        return lines;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates SVG tspan elements for wrapped text
 * @param text - Original text string
 * @param x - X coordinate for text
 * @param startY - Starting Y coordinate
 * @param lineHeight - Height between lines (default 14)
 * @param fontSize - Font size (default 10)
 * @param fill - Text color (default bizNavy)
 * @returns SVG text element string with tspan children
 */
function renderWrappedSvgText(
  text: string,
  x: number,
  startY: number,
  lineHeight: number = 14,
  fontSize: number = 10,
  fill: string = '#212653'
): string {
  const lines = wrapSvgText(text);

  if (lines.length === 1) {
    return `<text x="${x}" y="${startY}" font-size="${fontSize}" fill="${fill}" font-family="Open Sans, sans-serif">${escapeHtml(lines[0])}</text>`;
  }

  return `<text x="${x}" y="${startY}" font-size="${fontSize}" fill="${fill}" font-family="Open Sans, sans-serif">
    ${lines.map((line, index) =>
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`
    ).join('\n    ')}
  </text>`;
}

/**
 * Escape HTML entities in text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// PHASE 1A: PLACEHOLDER CHART GENERATOR
// For graceful degradation when data is missing or visualization fails
// ============================================================================

/**
 * Generate a placeholder SVG chart when data is unavailable or chart fails
 * @param title - The chart title
 * @param message - Message explaining why chart is unavailable
 * @param width - Chart width (default 600)
 * @param height - Chart height (default 400)
 */
export function generatePlaceholderChart(
  title: string,
  message: string,
  width: number = 600,
  height: number = 400
): string {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="placeholder-chart">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2" rx="8"/>
      <text x="${width / 2}" y="${height / 2 - 30}" text-anchor="middle" font-size="18" fill="${COLORS.bizNavy}" font-weight="600" font-family="Montserrat, sans-serif">
        ${escapeHtml(title)}
      </text>
      <text x="${width / 2}" y="${height / 2 + 10}" text-anchor="middle" font-size="14" fill="${COLORS.gray}" font-family="Open Sans, sans-serif">
        ${escapeHtml(message)}
      </text>
      <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" font-size="12" fill="${COLORS.gray}" font-family="Open Sans, sans-serif" font-style="italic">
        (Chart will display when data is available)
      </text>
      <g transform="translate(${width / 2 - 30}, ${height / 2 - 100})">
        <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="${COLORS.lightGray}" stroke-width="2" stroke-dasharray="5,5"/>
        <circle cx="30" cy="30" r="10" fill="${COLORS.lightGray}"/>
      </g>
    </svg>
  `.trim();
}

/**
 * Safe wrapper for visualization generation
 * Catches errors and returns placeholder chart on failure
 */
export function safeGenerateVisualization<T>(
  generator: () => string,
  chartType: string,
  fallbackWidth: number = 600,
  fallbackHeight: number = 400
): string {
  try {
    return generator();
  } catch (error) {
    console.error(`[VISUALIZATION ERROR] Failed to generate ${chartType}:`, error);
    return generatePlaceholderChart(
      chartType,
      'Visualization generation failed',
      fallbackWidth,
      fallbackHeight
    );
  }
}

// ============================================================================
// 12-CATEGORY RADAR CHART (Spider Diagram)
// ============================================================================

export interface RadarChartOptions {
  width?: number;
  height?: number;
  showBenchmark?: boolean;
  benchmarkScores?: Record<string, number>;
  showLabels?: boolean;
  showScoreValues?: boolean;
}

/**
 * Generate a 12-category radar chart (spider diagram)
 * P1A FIX: Added error handling and placeholder fallback for missing data
 */
export function generateCategoryRadarChart(
  categoryAnalyses: CategoryAnalysis[],
  options: RadarChartOptions = {}
): string {
  const {
    width = 500,
    height = 500,
    showBenchmark = true,
    benchmarkScores = {},
    showLabels = true,
    showScoreValues = false
  } = options;

  // P1A: Validate input data
  if (!categoryAnalyses || categoryAnalyses.length === 0) {
    console.warn('[VISUALIZATION WARNING] Cannot generate Radar Chart: No category analyses provided');
    return generatePlaceholderChart('12-Category Radar Chart', 'No category data available', width, height);
  }

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;

  // Sort categories by canonical order
  const sortedAnalyses = CATEGORY_CODES_ORDERED.map(code =>
    categoryAnalyses.find(ca => ca.categoryCode === code)
  ).filter((ca): ca is CategoryAnalysis => Boolean(ca));

  // P1A: Check if any valid categories found
  if (sortedAnalyses.length < 3) {
    console.warn('[VISUALIZATION WARNING] Insufficient category data for radar chart');
    return generatePlaceholderChart('12-Category Radar Chart', `Only ${sortedAnalyses.length} categories found (need 3+)`, width, height);
  }

  const angleStep = (2 * Math.PI) / sortedAnalyses.length;

  // Generate points for company scores
  const companyPoints = sortedAnalyses.map((ca, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const radius = (ca.overallScore / 100) * maxRadius;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      score: ca.overallScore,
      categoryCode: ca.categoryCode,
      categoryName: ca.categoryName
    };
  });

  // Generate benchmark points if requested
  const benchmarkPoints = showBenchmark
    ? sortedAnalyses.map((ca, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const benchScore = benchmarkScores[ca.categoryCode] || 60;
        const radius = (benchScore / 100) * maxRadius;
        return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
      })
    : [];

  // Generate grid circles
  const gridCircles = [20, 40, 60, 80, 100].map(score => {
    const radius = (score / 100) * maxRadius;
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${COLORS.lightGray}" stroke-width="1" />`;
  }).join('');

  // Generate axis lines
  const axisLines = sortedAnalyses.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x2 = cx + maxRadius * Math.cos(angle);
    const y2 = cy + maxRadius * Math.sin(angle);
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${COLORS.lightGray}" stroke-width="1" />`;
  }).join('');

  // Generate labels
  const labels = showLabels ? sortedAnalyses.map((ca, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const labelRadius = maxRadius + 30;
    const x = cx + labelRadius * Math.cos(angle);
    const y = cy + labelRadius * Math.sin(angle);
    const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' :
                       Math.cos(angle) > 0 ? 'start' : 'end';
    const scoreText = showScoreValues ? ` (${ca.overallScore})` : '';
    return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" font-size="11" fill="${COLORS.bizNavy}" font-family="Open Sans, sans-serif">${escapeHtml(ca.categoryCode)}${scoreText}</text>`;
  }).join('') : '';

  // Generate polygon for company scores
  const companyPolygon = companyPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Generate benchmark polygon if requested
  const benchmarkPolygon = benchmarkPoints.length > 0
    ? `<polygon points="${benchmarkPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"
         fill="none" stroke="${COLORS.gray}" stroke-width="2" stroke-dasharray="5,5" opacity="0.7" />`
    : '';

  // Generate score dots
  const scoreDots = companyPoints.map(p => {
    const color = getScoreColor(p.score);
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="${color}" stroke="${COLORS.white}" stroke-width="2" />`;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>12-Category Radar Chart</title>

      <!-- Background -->
      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Grid circles -->
      ${gridCircles}

      <!-- Score labels on grid -->
      <text x="${cx + 5}" y="${cy - (0.2 * maxRadius)}" font-size="10" fill="${COLORS.gray}">20</text>
      <text x="${cx + 5}" y="${cy - (0.4 * maxRadius)}" font-size="10" fill="${COLORS.gray}">40</text>
      <text x="${cx + 5}" y="${cy - (0.6 * maxRadius)}" font-size="10" fill="${COLORS.gray}">60</text>
      <text x="${cx + 5}" y="${cy - (0.8 * maxRadius)}" font-size="10" fill="${COLORS.gray}">80</text>
      <text x="${cx + 5}" y="${cy - maxRadius}" font-size="10" fill="${COLORS.gray}">100</text>

      <!-- Axis lines -->
      ${axisLines}

      <!-- Benchmark polygon -->
      ${benchmarkPolygon}

      <!-- Company polygon -->
      <polygon points="${companyPolygon}" fill="${COLORS.bizNavy}" fill-opacity="0.2"
               stroke="${COLORS.bizNavy}" stroke-width="2" />

      <!-- Score dots -->
      ${scoreDots}

      <!-- Category labels -->
      ${labels}

      <!-- Legend -->
      <g transform="translate(${width - 120}, ${height - 60})">
        <rect x="0" y="0" width="12" height="12" fill="${COLORS.bizNavy}" fill-opacity="0.2" stroke="${COLORS.bizNavy}" />
        <text x="18" y="10" font-size="10" fill="${COLORS.bizNavy}">Company Score</text>
        ${showBenchmark ? `
        <line x1="0" y1="24" x2="12" y2="24" stroke="${COLORS.gray}" stroke-width="2" stroke-dasharray="3,3" />
        <text x="18" y="28" font-size="10" fill="${COLORS.gray}">Industry Avg</text>
        ` : ''}
      </g>
    </svg>
  `.trim();
}

// ============================================================================
// CHAPTER HEATMAP (4 Chapters x Categories)
// ============================================================================

export interface ChapterHeatmapOptions {
  width?: number;
  height?: number;
  /** P0 FIX: Optional canonical chapter scores to ensure consistency with other visualizations */
  canonicalChapterScores?: Array<{ code: string; name: string; score: number }>;
}

/**
 * Generate a chapter heatmap showing all categories grouped by chapter
 * P0 FIX: Uses canonicalChapterScores when provided to ensure consistency
 * with radar charts and benchmark bars
 */
export function generateChapterHeatmap(
  categoryAnalyses: CategoryAnalysis[],
  chapterSummaries: ChapterSummary[],
  options: ChapterHeatmapOptions = {}
): string {
  const { width = 600, height = 300, canonicalChapterScores } = options;
  const cellWidth = (width - 100) / 4;  // 4 chapters
  const cellHeight = (height - 60) / 4;  // Max 4 categories per chapter

  const chapters = Object.entries(CHAPTER_CATEGORY_MAPPING);

  // Generate heatmap cells
  const cells = chapters.flatMap(([_chapterCode, chapter], chapterIdx) => {
    const chapterCategories = categoryAnalyses.filter(ca =>
      chapter.categories.includes(ca.categoryCode)
    );

    return chapterCategories.map((ca, catIdx) => {
      const x = 100 + chapterIdx * cellWidth;
      const y = 40 + catIdx * cellHeight;
      const color = getScoreColor(ca.overallScore);
      const textColor = ca.overallScore < 50 ? COLORS.white : COLORS.bizNavy;

      return `
        <g>
          <rect x="${x}" y="${y}" width="${cellWidth - 4}" height="${cellHeight - 4}"
                fill="${color}" rx="4" />
          <text x="${x + (cellWidth - 4) / 2}" y="${y + (cellHeight - 4) / 2}"
                text-anchor="middle" dominant-baseline="middle"
                fill="${textColor}"
                font-size="12" font-weight="bold" font-family="Montserrat, sans-serif">
            ${ca.overallScore}
          </text>
          <text x="${x + (cellWidth - 4) / 2}" y="${y + (cellHeight - 4) / 2 + 14}"
                text-anchor="middle" dominant-baseline="middle"
                fill="${textColor}"
                font-size="9" font-family="Open Sans, sans-serif">
            ${escapeHtml(ca.categoryCode)}
          </text>
        </g>
      `;
    });
  }).join('');

  // Generate chapter headers
  // P0 FIX: Use canonical scores if provided, fall back to chapterSummaries
  const chapterHeaders = chapters.map(([code, chapter], idx) => {
    const x = 100 + idx * cellWidth + (cellWidth - 4) / 2;

    // Priority: canonical scores > chapterSummaries > 0
    let chapterScore = 0;
    if (canonicalChapterScores && canonicalChapterScores.length > 0) {
      const canonical = canonicalChapterScores.find(cs => cs.code === code);
      chapterScore = canonical?.score || 0;
    } else {
      const summary = chapterSummaries.find(cs => cs.chapterCode === code);
      chapterScore = summary?.overallScore || 0;
    }

    return `
      <text x="${x}" y="20" text-anchor="middle" font-size="11" font-weight="bold"
            fill="${COLORS.bizNavy}" font-family="Montserrat, sans-serif">
        ${escapeHtml(chapter.name)}
      </text>
      <text x="${x}" y="32" text-anchor="middle" font-size="10" fill="${COLORS.gray}">
        ${chapterScore}/100
      </text>
    `;
  }).join('');

  // Generate legend
  const legendItems = [
    { label: 'Critical', color: COLORS.critical, range: '0-20' },
    { label: 'Needs Work', color: COLORS.needsImprovement, range: '21-40' },
    { label: 'Developing', color: COLORS.developing, range: '41-60' },
    { label: 'Good', color: COLORS.good, range: '61-80' },
    { label: 'Excellent', color: COLORS.excellent, range: '81-100' }
  ];

  const legend = legendItems.map((item, idx) => `
    <rect x="${100 + idx * 90}" y="${height - 25}" width="16" height="16" fill="${item.color}" rx="2" />
    <text x="${120 + idx * 90}" y="${height - 12}" font-size="9" fill="${COLORS.bizNavy}">${item.label}</text>
  `).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>Chapter-Category Heatmap</title>
      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Chapter headers -->
      ${chapterHeaders}

      <!-- Heatmap cells -->
      ${cells}

      <!-- Legend -->
      ${legend}
    </svg>
  `.trim();
}

// ============================================================================
// CATEGORY BENCHMARK BARS (Horizontal)
// ============================================================================

export interface BenchmarkBarsOptions {
  width?: number;
  barHeight?: number;
  showGap?: boolean;
  industryBenchmarks?: Record<string, number>;
}

/**
 * Generate horizontal benchmark comparison bars for all categories
 * P2.3 FIX: Enhanced spacing for better readability (2025-12-31)
 */
export function generateCategoryBenchmarkBars(
  categoryAnalyses: CategoryAnalysis[],
  options: BenchmarkBarsOptions = {}
): string {
  // P2.3 FIX: Increased row height from 36px to 46px, added explicit gap
  const {
    width = 600,
    barHeight = 28,  // Keep bar height
    showGap = true,
    industryBenchmarks = {}
  } = options;

  const rowHeight = 46;  // P2.3 FIX: Increased from 36 for better spacing
  const rowGap = 6;  // P2.3 FIX: Added explicit gap between rows
  const labelWidth = 140;
  const labelFontSize = 12;  // P2.3 FIX: Increased from 11 for better readability
  const barWidth = width - labelWidth - 100;
  const height = categoryAnalyses.length * (rowHeight + rowGap) + 50;

  // P2.3 FIX: Updated bar generation with new spacing values
  const bars = categoryAnalyses.map((ca, idx) => {
    const y = 40 + idx * (rowHeight + rowGap);  // P2.3 FIX: Use rowHeight + rowGap
    const barY = y + (rowHeight - barHeight) / 2;  // P2.3 FIX: Center bar within row
    const companyWidth = (ca.overallScore / 100) * barWidth;
    const benchScore = industryBenchmarks[ca.categoryCode] || 60;
    const benchX = labelWidth + (benchScore / 100) * barWidth;
    const color = getScoreColor(ca.overallScore);
    const gap = showGap ? ca.overallScore - benchScore : 0;

    return `
      <g>
        <!-- Category label (P2.3 FIX: Increased font size to ${labelFontSize}px) -->
        <text x="${labelWidth - 8}" y="${y + rowHeight / 2 + 4}"
              text-anchor="end" font-size="${labelFontSize}" fill="${COLORS.bizNavy}"
              font-family="Open Sans, sans-serif">
          ${escapeHtml(ca.categoryName)}
        </text>

        <!-- Background bar -->
        <rect x="${labelWidth}" y="${barY}" width="${barWidth}" height="${barHeight}"
              fill="${COLORS.lightGray}" rx="4" />

        <!-- Company score bar -->
        <rect x="${labelWidth}" y="${barY}" width="${companyWidth}" height="${barHeight}"
              fill="${color}" rx="4" />

        <!-- Benchmark line -->
        <line x1="${benchX}" y1="${barY - 4}" x2="${benchX}" y2="${barY + barHeight + 4}"
              stroke="${COLORS.bizNavy}" stroke-width="2" stroke-dasharray="4,2" />

        <!-- Score label -->
        <text x="${labelWidth + companyWidth + 8}" y="${y + rowHeight / 2 + 4}"
              font-size="${labelFontSize}" font-weight="bold" fill="${COLORS.bizNavy}">
          ${ca.overallScore}
        </text>

        <!-- Gap indicator -->
        ${showGap ? `
        <text x="${width - 40}" y="${y + rowHeight / 2 + 4}"
              font-size="11" fill="${gap >= 0 ? COLORS.good : COLORS.needsImprovement}"
              text-anchor="end">
          ${gap >= 0 ? '+' : ''}${gap}
        </text>
        ` : ''}
      </g>
    `;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>Category Benchmark Comparison</title>
      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Header -->
      <text x="${labelWidth}" y="18" font-size="10" fill="${COLORS.gray}">0</text>
      <text x="${labelWidth + barWidth / 2}" y="18" font-size="10" fill="${COLORS.gray}" text-anchor="middle">50</text>
      <text x="${labelWidth + barWidth}" y="18" font-size="10" fill="${COLORS.gray}" text-anchor="end">100</text>
      ${showGap ? `<text x="${width - 40}" y="18" font-size="10" fill="${COLORS.gray}" text-anchor="end">Gap</text>` : ''}

      <!-- Bars -->
      ${bars}

      <!-- Legend -->
      <g transform="translate(${labelWidth}, ${height - 20})">
        <line x1="0" y1="0" x2="20" y2="0" stroke="${COLORS.bizNavy}" stroke-width="2" stroke-dasharray="4,2" />
        <text x="28" y="4" font-size="10" fill="${COLORS.gray}">Industry Average</text>
      </g>
    </svg>
  `.trim();
}

// ============================================================================
// SWOT QUADRANT DIAGRAM
// ============================================================================

export interface SWOTOptions {
  width?: number;
  height?: number;
}

/**
 * Generate a SWOT analysis diagram for a single category
 * Uses multi-line text wrapping for better readability
 */
export function generateSWOTQuadrant(
  categoryAnalysis: CategoryAnalysis,
  options: SWOTOptions = {}
): string {
  const { width = 500, height = 400 } = options;
  const quadrantWidth = (width - 20) / 2;
  const quadrantHeight = (height - 60) / 2;

  const strengths = categoryAnalysis.strengths.slice(0, 3);
  const weaknesses = categoryAnalysis.weaknesses.slice(0, 3);
  const opportunities = categoryAnalysis.quickWins.slice(0, 3);
  const threats = categoryAnalysis.categoryRisks.slice(0, 3);

  // Calculate item height based on maximum lines needed (3 lines max, 14px line height)
  const maxLinesPerItem = 3;
  const lineHeight = 14;
  const itemSpacing = maxLinesPerItem * lineHeight + 8; // Extra padding between items

  /**
   * Render SWOT items with proper text wrapping
   * Uses bullet points and multi-line text for better readability
   */
  function renderWrappedItems(
    items: { title: string }[],
    x: number,
    baseY: number,
    textColor: string
  ): string {
    return items.map((item, idx) => {
      const itemY = baseY + idx * itemSpacing;
      // Add bullet point
      const bullet = `<text x="${x + 8}" y="${itemY}" font-size="10" fill="${textColor}" font-family="Open Sans, sans-serif">•</text>`;
      // Wrapped text starts after bullet
      const wrappedText = renderWrappedSvgText(item.title, x + 20, itemY, lineHeight, 10, textColor);
      return bullet + '\n      ' + wrappedText;
    }).join('\n      ');
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>SWOT Analysis: ${escapeHtml(categoryAnalysis.categoryName)}</title>
      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Title -->
      <text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold"
            fill="${COLORS.bizNavy}" font-family="Montserrat, sans-serif">
        ${escapeHtml(categoryAnalysis.categoryName)} SWOT Analysis
      </text>

      <!-- Strengths (Top Left) -->
      <rect x="10" y="40" width="${quadrantWidth}" height="${quadrantHeight}" fill="#d4edda" rx="8" />
      <text x="20" y="58" font-size="11" font-weight="bold" fill="#155724" font-family="Montserrat, sans-serif">STRENGTHS</text>
      ${renderWrappedItems(strengths, 10, 76, '#155724')}

      <!-- Weaknesses (Top Right) -->
      <rect x="${quadrantWidth + 10}" y="40" width="${quadrantWidth}" height="${quadrantHeight}" fill="#f8d7da" rx="8" />
      <text x="${quadrantWidth + 20}" y="58" font-size="11" font-weight="bold" fill="#721c24" font-family="Montserrat, sans-serif">WEAKNESSES</text>
      ${renderWrappedItems(weaknesses, quadrantWidth + 10, 76, '#721c24')}

      <!-- Opportunities (Bottom Left) -->
      <rect x="10" y="${quadrantHeight + 50}" width="${quadrantWidth}" height="${quadrantHeight}" fill="#cce5ff" rx="8" />
      <text x="20" y="${quadrantHeight + 68}" font-size="11" font-weight="bold" fill="#004085" font-family="Montserrat, sans-serif">OPPORTUNITIES</text>
      ${renderWrappedItems(opportunities, 10, quadrantHeight + 86, '#004085')}

      <!-- Threats (Bottom Right) -->
      <rect x="${quadrantWidth + 10}" y="${quadrantHeight + 50}" width="${quadrantWidth}" height="${quadrantHeight}" fill="#fff3cd" rx="8" />
      <text x="${quadrantWidth + 20}" y="${quadrantHeight + 68}" font-size="11" font-weight="bold" fill="#856404" font-family="Montserrat, sans-serif">RISKS</text>
      ${renderWrappedItems(threats, quadrantWidth + 10, quadrantHeight + 86, '#856404')}
    </svg>
  `.trim();
}

// ============================================================================
// INTERDEPENDENCY NETWORK DIAGRAM
// ============================================================================

export interface NetworkOptions {
  width?: number;
  height?: number;
}

/**
 * Generate an interdependency network diagram
 */
export function generateInterdependencyNetwork(
  crossCategoryInsights: CrossCategoryInsights,
  options: NetworkOptions = {}
): string {
  const { width = 600, height = 500 } = options;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 3;

  // Position categories in a circle
  const angleStep = (2 * Math.PI) / CATEGORY_CODES_ORDERED.length;

  const positions: Record<string, { x: number; y: number }> = {};
  CATEGORY_CODES_ORDERED.forEach((code, idx) => {
    const angle = -Math.PI / 2 + idx * angleStep;
    positions[code] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  // Draw connections
  const connections = crossCategoryInsights.interdependencyAnalysis.strongConnections.map(conn => {
    const source = positions[conn.source];
    const target = positions[conn.target];
    if (!source || !target) return '';

    const color = conn.type === 'enables' ? COLORS.good :
                  conn.type === 'constrains' ? COLORS.needsImprovement :
                  conn.type === 'amplifies' ? COLORS.bizGreen : COLORS.gray;

    return `
      <line x1="${source.x.toFixed(1)}" y1="${source.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}"
            stroke="${color}" stroke-width="2" opacity="0.6"
            marker-end="url(#arrowhead)" />
    `;
  }).join('');

  // Draw nodes
  const nodes = CATEGORY_CODES_ORDERED.map(code => {
    const pos = positions[code];
    return `
      <circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="24" fill="${COLORS.bizNavy}" stroke="${COLORS.white}" stroke-width="2" />
      <text x="${pos.x.toFixed(1)}" y="${(pos.y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${COLORS.white}">
        ${code}
      </text>
    `;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>Category Interdependency Network</title>

      <!-- Defs for arrows -->
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="${COLORS.gray}" />
        </marker>
      </defs>

      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Title -->
      <text x="${width / 2}" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="${COLORS.bizNavy}">
        Category Interdependency Map
      </text>

      <!-- Connections -->
      ${connections}

      <!-- Nodes -->
      ${nodes}

      <!-- Legend -->
      <g transform="translate(20, ${height - 70})">
        <line x1="0" y1="10" x2="20" y2="10" stroke="${COLORS.good}" stroke-width="2" />
        <text x="28" y="14" font-size="10">Enables</text>

        <line x1="0" y1="28" x2="20" y2="28" stroke="${COLORS.needsImprovement}" stroke-width="2" />
        <text x="28" y="32" font-size="10">Constrains</text>

        <line x1="100" y1="10" x2="120" y2="10" stroke="${COLORS.bizGreen}" stroke-width="2" />
        <text x="128" y="14" font-size="10">Amplifies</text>

        <line x1="100" y1="28" x2="120" y2="28" stroke="${COLORS.gray}" stroke-width="2" />
        <text x="128" y="32" font-size="10">Mitigates</text>
      </g>
    </svg>
  `.trim();
}

// ============================================================================
// PRIORITY MATRIX
// ============================================================================

export interface PriorityMatrixOptions {
  width?: number;
  height?: number;
}

/**
 * Generate a priority matrix (urgency vs impact)
 */
export function generatePriorityMatrix(
  crossCategoryInsights: CrossCategoryInsights,
  options: PriorityMatrixOptions = {}
): string {
  const { width = 500, height = 400 } = options;
  const margin = 60;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2;

  // Position categories based on their urgency (x) and impact (y)
  const points = crossCategoryInsights.prioritizationMatrix.map(item => {
    const x = margin + (item.urgency / 10) * plotWidth;
    const y = height - margin - (item.impact / 10) * plotHeight;
    const color = item.priorityScore >= 8 ? COLORS.critical :
                  item.priorityScore >= 5 ? COLORS.needsImprovement :
                  item.priorityScore >= 3 ? COLORS.developing : COLORS.good;

    return `
      <g>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20" fill="${color}" opacity="0.7" />
        <text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${COLORS.white}">
          ${item.categoryCode}
        </text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <title>Category Priority Matrix</title>
      <rect width="100%" height="100%" fill="${COLORS.white}" />

      <!-- Title -->
      <text x="${width / 2}" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="${COLORS.bizNavy}">
        Priority Matrix
      </text>

      <!-- Quadrant backgrounds -->
      <rect x="${margin}" y="${margin}" width="${plotWidth / 2}" height="${plotHeight / 2}" fill="#fff3cd" opacity="0.3" />
      <rect x="${margin + plotWidth / 2}" y="${margin}" width="${plotWidth / 2}" height="${plotHeight / 2}" fill="#f8d7da" opacity="0.3" />
      <rect x="${margin}" y="${margin + plotHeight / 2}" width="${plotWidth / 2}" height="${plotHeight / 2}" fill="#d4edda" opacity="0.3" />
      <rect x="${margin + plotWidth / 2}" y="${margin + plotHeight / 2}" width="${plotWidth / 2}" height="${plotHeight / 2}" fill="#cce5ff" opacity="0.3" />

      <!-- Quadrant labels -->
      <text x="${margin + plotWidth / 4}" y="${margin + 20}" text-anchor="middle" font-size="10" fill="${COLORS.gray}">Monitor</text>
      <text x="${margin + plotWidth * 3 / 4}" y="${margin + 20}" text-anchor="middle" font-size="10" fill="${COLORS.gray}">Urgent &amp; Critical</text>
      <text x="${margin + plotWidth / 4}" y="${height - margin - 10}" text-anchor="middle" font-size="10" fill="${COLORS.gray}">Low Priority</text>
      <text x="${margin + plotWidth * 3 / 4}" y="${height - margin - 10}" text-anchor="middle" font-size="10" fill="${COLORS.gray}">Schedule</text>

      <!-- Axes -->
      <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="${COLORS.bizNavy}" stroke-width="2" />
      <line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" stroke="${COLORS.bizNavy}" stroke-width="2" />

      <!-- Axis labels -->
      <text x="${width / 2}" y="${height - 15}" text-anchor="middle" font-size="12" fill="${COLORS.bizNavy}">Urgency</text>
      <text x="15" y="${height / 2}" text-anchor="middle" font-size="12" fill="${COLORS.bizNavy}" transform="rotate(-90, 15, ${height / 2})">Impact</text>

      <!-- Data points -->
      ${points}
    </svg>
  `.trim();
}

// ============================================================================
// IMPACT/EFFORT MATRIX (2x2 QUADRANT)
// Per North Star: "Visual 2x2 matrix showing actions by Impact/Effort"
// ============================================================================

export interface ImpactEffortMatrixOptions {
  width?: number;
  height?: number;
  title?: string;
}

export interface RecommendationItem {
  id?: string;
  title?: string;
  shortTitle?: string;
  impact?: number;
  impactScore?: number;
  effort?: number;
  effortScore?: number;
  category?: string;
  dimensionCode?: string;
}

/**
 * Generate Impact/Effort Quadrant Matrix SVG
 * Shows recommendations plotted by impact (Y-axis) vs effort (X-axis)
 * P1 ENHANCEMENT: Adds visual prioritization matrix to Owner's Report
 * P1A FIX: Added error handling and placeholder fallback for missing data
 */
export function generateImpactEffortMatrix(
  recommendations: RecommendationItem[],
  options: ImpactEffortMatrixOptions = {}
): string {
  const { width = 600, height = 500, title = 'Impact/Effort Prioritization Matrix' } = options;

  // P1A: Validate input data
  if (!recommendations || recommendations.length === 0) {
    console.warn('[VISUALIZATION WARNING] Cannot generate Impact/Effort Matrix: No recommendations provided');
    return generatePlaceholderChart(title, 'No recommendations available to visualize', width, height);
  }

  // Filter out recommendations without valid impact/effort data
  const validRecs = recommendations.filter(r =>
    (r.impactScore !== undefined && r.impactScore > 0) ||
    (r.effortScore !== undefined && r.effortScore > 0)
  );

  if (validRecs.length === 0) {
    console.warn('[VISUALIZATION WARNING] No recommendations with valid impact/effort scores');
    return generatePlaceholderChart(title, 'Recommendations missing impact/effort data', width, height);
  }

  const padding = { top: 60, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const midX = padding.left + chartWidth / 2;
  const midY = padding.top + chartHeight / 2;

  // Quadrant definitions
  const quadrants = [
    {
      name: 'Quick Wins',
      subtitle: 'Start Immediately',
      x: padding.left,
      y: padding.top,
      w: chartWidth / 2,
      h: chartHeight / 2,
      fill: 'rgba(40, 167, 69, 0.15)',
      border: '#28a745'
    },
    {
      name: 'Major Initiatives',
      subtitle: 'Phase Over Time',
      x: midX,
      y: padding.top,
      w: chartWidth / 2,
      h: chartHeight / 2,
      fill: 'rgba(0, 123, 255, 0.15)',
      border: '#007bff'
    },
    {
      name: 'Fill-Ins',
      subtitle: 'If Resources Allow',
      x: padding.left,
      y: midY,
      w: chartWidth / 2,
      h: chartHeight / 2,
      fill: 'rgba(108, 117, 125, 0.1)',
      border: '#6c757d'
    },
    {
      name: 'Reconsider',
      subtitle: 'Low Priority',
      x: midX,
      y: midY,
      w: chartWidth / 2,
      h: chartHeight / 2,
      fill: 'rgba(220, 53, 69, 0.1)',
      border: '#dc3545'
    }
  ];

  // P3.1 FIX: Check if effort values are missing or all identical (causing clustering)
  const recsToProcess = recommendations.slice(0, 12);
  const effortValues = recsToProcess
    .map(r => r.effort || r.effortScore)
    .filter(e => e !== undefined && e !== null && e > 0);
  const allEffortsIdentical = effortValues.length === 0 ||
    effortValues.every(e => e === effortValues[0]);

  // P3.1 FIX: Quadrant colors for consistency
  const QUADRANT_COLORS = {
    quickWins: '#28a745',   // Green
    strategic: '#007bff',   // Blue
    fillIns: '#6c757d',     // Gray
    avoid: '#dc3545'        // Red
  };

  // Plot data points (limit to 12 for readability)
  const dataPoints = recsToProcess.map((rec, i) => {
    // Normalize scores to chart coordinates
    // Impact: 0-100 maps to bottom-top (inverted Y)
    // Effort: 0-100 maps to left-right
    const impact = rec.impact || rec.impactScore || 50;

    // P3.1 FIX: Handle missing/identical effort values by distributing items
    let normalizedEffort: number;
    const rawEffort = rec.effort || rec.effortScore;
    if (allEffortsIdentical || rawEffort === undefined || rawEffort === null || rawEffort === 0) {
      // Distribute across effort axis based on index to prevent clustering
      const spreadFactor = 0.15; // How much to spread (0-1)
      const baseEffort = 0.5; // Center
      const offset = ((i % 5) - 2) * spreadFactor; // -0.3 to +0.3
      normalizedEffort = Math.max(0.1, Math.min(0.9, baseEffort + offset)) * 100;
    } else {
      normalizedEffort = rawEffort;
    }

    const x = padding.left + (normalizedEffort / 100) * chartWidth;
    const y = padding.top + chartHeight - (impact / 100) * chartHeight;

    // Determine quadrant and color
    const isHighImpact = impact >= 50;
    const isLowEffort = normalizedEffort < 50;
    let quadrant: 'quickWins' | 'strategic' | 'fillIns' | 'avoid';
    if (isHighImpact && isLowEffort) quadrant = 'quickWins';
    else if (isHighImpact && !isLowEffort) quadrant = 'strategic';
    else if (!isHighImpact && isLowEffort) quadrant = 'fillIns';
    else quadrant = 'avoid';

    const color = QUADRANT_COLORS[quadrant];

    return {
      x,
      y,
      color,
      quadrant,
      label: rec.shortTitle || rec.title || `Item ${i + 1}`,  // P3.1 FIX: Keep full title
      rec
    };
  });

  // Build SVG
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg"
         style="font-family: 'Open Sans', Arial, sans-serif; max-width: 100%; height: auto;">

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#fafbfc" rx="8"/>

      <!-- Title -->
      <text x="${width / 2}" y="30" text-anchor="middle"
            font-family="'Montserrat', sans-serif" font-size="16" font-weight="600" fill="${COLORS.bizNavy}">
        ${title}
      </text>

      <!-- Quadrants -->
      ${quadrants.map(q => `
        <rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}"
              fill="${q.fill}" stroke="${q.border}" stroke-width="1"/>
        <text x="${q.x + q.w / 2}" y="${q.y + 20}" text-anchor="middle"
              font-size="12" font-weight="600" fill="${q.border}">${q.name}</text>
        <text x="${q.x + q.w / 2}" y="${q.y + 35}" text-anchor="middle"
              font-size="9" fill="#666">${q.subtitle}</text>
      `).join('')}

      <!-- Axis Labels -->
      <text x="${width / 2}" y="${height - 15}" text-anchor="middle"
            font-size="11" fill="${COLORS.bizNavy}" font-weight="500">
        Implementation Effort →
      </text>
      <text x="15" y="${height / 2}" text-anchor="middle"
            font-size="11" fill="${COLORS.bizNavy}" font-weight="500"
            transform="rotate(-90, 15, ${height / 2})">
        ← Business Impact
      </text>

      <!-- Axis markers -->
      <text x="${padding.left}" y="${height - 40}" font-size="9" fill="#999">Low</text>
      <text x="${width - padding.right}" y="${height - 40}" text-anchor="end" font-size="9" fill="#999">High</text>
      <text x="${padding.left - 5}" y="${padding.top + 10}" text-anchor="end" font-size="9" fill="#999">High</text>
      <text x="${padding.left - 5}" y="${height - padding.bottom}" text-anchor="end" font-size="9" fill="#999">Low</text>

      <!-- Center lines -->
      <line x1="${midX}" y1="${padding.top}" x2="${midX}" y2="${height - padding.bottom}"
            stroke="#dee2e6" stroke-width="2" stroke-dasharray="4,4"/>
      <line x1="${padding.left}" y1="${midY}" x2="${width - padding.right}" y2="${midY}"
            stroke="#dee2e6" stroke-width="2" stroke-dasharray="4,4"/>

      <!-- Data Points -->
      ${dataPoints.map((pt, i) => `
        <g class="data-point">
          <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="18" fill="${pt.color}" opacity="0.9"/>
          <text x="${pt.x.toFixed(1)}" y="${(pt.y + 4).toFixed(1)}" text-anchor="middle"
                font-size="9" font-weight="600" fill="white">${i + 1}</text>
        </g>
      `).join('')}

      <!-- P3.1 FIX: Enhanced legend showing full titles -->
      <g transform="translate(${padding.left}, ${height - 50})">
        <text x="0" y="0" font-size="9" font-weight="600" fill="${COLORS.bizNavy}">Legend:</text>
        ${dataPoints.slice(0, 6).map((pt, i) => `
          <g transform="translate(${(i % 3) * 180}, ${Math.floor(i / 3) * 16 + 12})">
            <circle cx="6" cy="3" r="5" fill="${pt.color}"/>
            <text x="14" y="6" font-size="8" fill="#333">${i + 1}. ${escapeHtml(truncateText(pt.label, 22))}</text>
          </g>
        `).join('')}
      </g>
    </svg>

    <!-- P3.1 FIX: Full recommendation legend table (outside SVG for better formatting) -->
    <div class="matrix-legend-table" style="
      margin-top: 1rem;
      font-size: 0.8rem;
      max-width: ${width}px;
    ">
      <table style="width: 100%; border-collapse: collapse; font-family: 'Open Sans', sans-serif;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 6px 8px; text-align: left; width: 30px; font-size: 0.75rem;">#</th>
            <th style="padding: 6px 8px; text-align: left; font-size: 0.75rem;">Recommendation</th>
            <th style="padding: 6px 8px; text-align: left; width: 100px; font-size: 0.75rem;">Quadrant</th>
          </tr>
        </thead>
        <tbody>
          ${dataPoints.map((pt, idx) => {
            const quadrantLabels: Record<string, string> = {
              quickWins: 'Quick Win',
              strategic: 'Strategic',
              fillIns: 'Fill-In',
              avoid: 'Reconsider'
            };
            return `
            <tr style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 6px 8px;">
                <span style="
                  display: inline-block;
                  width: 18px;
                  height: 18px;
                  background: ${pt.color};
                  color: white;
                  border-radius: 50%;
                  text-align: center;
                  line-height: 18px;
                  font-size: 10px;
                  font-weight: 600;
                ">${idx + 1}</span>
              </td>
              <td style="padding: 6px 8px; font-size: 0.8rem;">${escapeHtml(pt.label)}</td>
              <td style="padding: 6px 8px;">
                <span style="
                  padding: 2px 6px;
                  background: ${pt.color}20;
                  color: ${pt.color};
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: 600;
                ">${quadrantLabels[pt.quadrant] || pt.quadrant}</span>
              </td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>
    </div>
  `.trim();
}

// ============================================================================
// NULL-SAFE VISUALIZATION HELPERS
// P1: Handle categories with no data properly
// ============================================================================

/**
 * Check if category has valid data for visualization
 */
export function hasValidCategoryData(category: CategoryAnalysis): boolean {
  if (!category) return false;
  if (category.overallScore === null || category.overallScore === undefined) return false;
  if (isNaN(category.overallScore)) return false;
  return true;
}

/**
 * Get display score with no-data handling
 */
export function getDisplayScore(category: CategoryAnalysis): { value: number | null; display: string; hasData: boolean } {
  if (!hasValidCategoryData(category)) {
    return { value: null, display: 'N/A', hasData: false };
  }
  return { value: category.overallScore, display: String(category.overallScore), hasData: true };
}

/**
 * SVG pattern definition for no-data cells (diagonal stripes)
 */
export const NO_DATA_PATTERN_DEF = `
  <defs>
    <pattern id="noDataPattern" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="#E0E0E0"/>
      <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
            stroke="#BDBDBD" stroke-width="1"/>
    </pattern>
  </defs>
`;

/**
 * Get cell style for heatmap with no-data handling
 */
export function getCellStyle(category: CategoryAnalysis): { fill: string; textColor: string; label: string } {
  if (!hasValidCategoryData(category)) {
    return {
      fill: 'url(#noDataPattern)',
      textColor: '#666',
      label: `${category?.categoryCode || '—'}\n(No Data)`
    };
  }

  const score = category.overallScore;
  const fill = getScoreColor(score);
  const textColor = score < 50 ? COLORS.white : COLORS.bizNavy;

  return { fill, textColor, label: `${category.categoryCode}` };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CategoryVisualizations = {
  generateCategoryRadarChart,
  generateChapterHeatmap,
  generateCategoryBenchmarkBars,
  generateSWOTQuadrant,
  generateInterdependencyNetwork,
  generatePriorityMatrix,
  generateImpactEffortMatrix,
  hasValidCategoryData,
  getDisplayScore,
  getCellStyle,
  NO_DATA_PATTERN_DEF
};

export default CategoryVisualizations;
