/**
 * BizHealth.ai Visual Components - Score Tile Component
 *
 * Individual dimension/KPI display card with status indicator
 * Used for displaying dimension scores, sub-indicators, and metrics
 */

import {
  getScoreBand,
  bandToClass,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getStatusSymbol,
  getTrendSymbol,
  STATUS_LABELS,
  TREND_LABELS,
} from '../../utils/accessibility-utils.js';

/**
 * Score tile component props
 */
export interface ScoreTileProps {
  /** Dimension/KPI code (e.g., "STR", "SAL") */
  code: string;
  /** Display name */
  name: string;
  /** Score value (0-100) */
  score: number;
  /** Status band */
  status: ScoreBand;
  /** Optional benchmark score */
  benchmarkScore?: number;
  /** Delta vs benchmark (+/-) */
  benchmarkDelta?: number;
  /** Trend direction */
  trend?: 'improving' | 'flat' | 'declining';
  /** Size variant */
  size?: 'standard' | 'compact';
}

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
 * Get score color based on band
 */
function getScoreColorClass(band: ScoreBand): string {
  const colors = {
    excellence: '#22C55E',
    proficiency: '#22C55E',
    attention: '#EAB308',
    critical: '#EF4444',
  };
  return colors[band];
}

/**
 * Render score tile component
 */
export function renderScoreTile(props: ScoreTileProps): string {
  const {
    code,
    name,
    score,
    status,
    benchmarkScore,
    benchmarkDelta,
    trend,
    size = 'standard',
  } = props;

  const band = status || getScoreBand(score);
  const statusSymbol = getStatusSymbol(band);
  const statusLabel = STATUS_LABELS[band];
  const scoreColor = getScoreColorClass(band);

  // Calculate benchmark delta if not provided
  const delta = benchmarkDelta ?? (benchmarkScore !== undefined ? score - benchmarkScore : undefined);

  // Build ARIA label
  const ariaLabel = `${name}: Score ${score} out of 100, rated ${statusLabel}` +
    (delta !== undefined ? `. ${Math.abs(delta)} points ${delta >= 0 ? 'above' : 'below'} benchmark` : '') +
    (trend ? `. Trend: ${TREND_LABELS[trend]}` : '');

  return `
    <div
      class="biz-score-tile biz-score-tile--${size} biz-score-tile--${band}"
      role="figure"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      <div class="biz-score-tile__header">
        <span class="biz-score-tile__name">${escapeHtml(name)}</span>
        <span class="biz-score-tile__status-icon" style="color: ${scoreColor};" aria-hidden="true">
          ${statusSymbol}
        </span>
      </div>

      <div class="biz-score-tile__score-container">
        <span class="biz-score-tile__score" style="color: ${scoreColor};">
          ${score}
        </span>
      </div>

      ${delta !== undefined || trend ? `
        <div class="biz-score-tile__benchmark">
          ${delta !== undefined ? `
            <span class="biz-score-tile__delta ${delta >= 0 ? 'biz-score-tile__delta--positive' : 'biz-score-tile__delta--negative'}">
              ${delta >= 0 ? '+' : '-'} ${delta >= 0 ? '+' : ''}${delta} vs industry
            </span>
          ` : ''}
          ${trend ? `
            <span class="biz-score-tile__trend biz-score-tile__trend--${trend}">
              ${getTrendSymbol(trend)} ${TREND_LABELS[trend]}
            </span>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple score tiles in a grid
 */
export function renderScoreTileGrid(
  tiles: Array<{
    code: string;
    name: string;
    score: number;
    status?: ScoreBand;
    benchmarkDelta?: number;
    trend?: 'improving' | 'flat' | 'declining';
  }>,
  columns: 2 | 3 | 4 | 6 = 4
): string {
  const tileHtml = tiles.map(tile =>
    renderScoreTile({
      code: tile.code,
      name: tile.name,
      score: tile.score,
      status: tile.status || getScoreBand(tile.score),
      benchmarkDelta: tile.benchmarkDelta,
      trend: tile.trend,
    })
  );

  return `
    <div
      class="biz-score-tile-grid"
      style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 16px;"
      role="group"
      aria-label="Dimension scores"
    >
      ${tileHtml.join('')}
    </div>
  `;
}

/**
 * Render dimension tiles for a chapter
 */
export function renderChapterDimensionTiles(
  chapterName: string,
  dimensions: Array<{
    code: string;
    name: string;
    score: number;
    band?: ScoreBand;
    trajectory?: 'improving' | 'flat' | 'declining';
    benchmark?: {
      industryAverage?: number;
      percentileRank?: number;
    };
  }>
): string {
  const tiles = dimensions.map(dim => {
    const benchmarkDelta = dim.benchmark?.industryAverage
      ? dim.score - dim.benchmark.industryAverage
      : undefined;

    return renderScoreTile({
      code: dim.code,
      name: dim.name,
      score: dim.score,
      status: dim.band || getScoreBand(dim.score),
      benchmarkDelta,
      trend: dim.trajectory,
    });
  });

  return `
    <div class="biz-chapter-dimensions" role="region" aria-label="${escapeHtml(chapterName)} dimensions">
      <h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${escapeHtml(chapterName)}
      </h4>
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        ${tiles.join('')}
      </div>
    </div>
  `;
}

/**
 * Compact score tile for inline use
 */
export function renderCompactScoreTile(
  name: string,
  score: number,
  status?: ScoreBand
): string {
  const band = status || getScoreBand(score);
  const symbol = getStatusSymbol(band);
  const scoreColor = getScoreColorClass(band);

  return `
    <span
      class="biz-score-tile-inline"
      style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: #F3F4F6;
        border-radius: 4px;
        font-size: 12px;
      "
      role="figure"
      aria-label="${escapeHtml(name)}: Score ${score}"
    >
      <span style="font-weight: 500; color: #374151;">${escapeHtml(name)}</span>
      <span style="font-weight: 700; color: ${scoreColor};">${score}</span>
      <span style="color: ${scoreColor};" aria-hidden="true">${symbol}</span>
    </span>
  `;
}
