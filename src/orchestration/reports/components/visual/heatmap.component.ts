/**
 * BizHealth.ai Visual Components - Heatmap Component
 *
 * 12-category portfolio matrix across 4 chapters
 * Provides a comprehensive view of all dimension scores
 */

import {
  getScoreBand,
  bandToClass,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getStatusSymbol,
  getHeatmapCellAriaLabel,
  STATUS_LABELS,
} from '../../utils/accessibility-utils.js';

/**
 * Chapter definition for heatmap
 */
export interface HeatmapChapter {
  /** Chapter code (GE, PH, PL, RS) */
  code: string;
  /** Chapter display name */
  name: string;
  /** Chapter score */
  score: number;
  /** Status band */
  status?: ScoreBand;
  /** Dimensions in this chapter */
  dimensions: Array<{
    code: string;
    name: string;
    score: number;
    band?: ScoreBand;
    trajectory?: 'improving' | 'flat' | 'declining';
  }>;
}

/**
 * Heatmap component props
 */
export interface HeatmapProps {
  /** Array of chapters with their dimensions */
  chapters: HeatmapChapter[];
  /** Display variant */
  variant: 'full' | 'condensed';
  /** Show benchmark indicators */
  showBenchmarks?: boolean;
  /** Show accessibility symbols */
  showSymbols?: boolean;
  /** Optional title */
  title?: string;
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
 * Get background color for a band
 */
function getBandBackground(band: ScoreBand): string {
  const backgrounds = {
    excellence: '#DCFCE7',
    proficiency: '#DCFCE7',
    attention: '#FEF9C3',
    critical: '#FEE2E2',
  };
  return backgrounds[band];
}

/**
 * Get text color for a band
 */
function getBandTextColor(band: ScoreBand): string {
  const colors = {
    excellence: '#166534',
    proficiency: '#166534',
    attention: '#854D0E',
    critical: '#991B1B',
  };
  return colors[band];
}

/**
 * Render a single heatmap cell
 */
function renderHeatmapCell(
  dimension: { code: string; name: string; score: number; band?: ScoreBand },
  showSymbol: boolean,
  chapterName?: string
): string {
  const band = dimension.band || getScoreBand(dimension.score);
  const symbol = getStatusSymbol(band);
  const bgColor = getBandBackground(band);
  const textColor = getBandTextColor(band);
  const ariaLabel = getHeatmapCellAriaLabel(dimension.name, dimension.score, chapterName);

  // Truncate long names
  const displayName = dimension.name.length > 12
    ? dimension.name.substring(0, 11) + '...'
    : dimension.name;

  return `
    <div
      class="biz-heatmap__cell biz-heatmap__cell--${band}"
      role="gridcell"
      aria-label="${escapeHtml(ariaLabel)}"
      style="background: ${bgColor}; color: ${textColor};"
      title="${escapeHtml(dimension.name)}: ${dimension.score}"
    >
      <div class="biz-heatmap__cell-name">${escapeHtml(displayName)}</div>
      <span class="biz-heatmap__cell-score">${dimension.score}</span>
      ${showSymbol ? `<span class="biz-heatmap__cell-symbol" aria-hidden="true">${symbol}</span>` : ''}
    </div>
  `;
}

/**
 * Render a chapter row in the heatmap
 */
function renderHeatmapChapter(
  chapter: HeatmapChapter,
  showSymbols: boolean
): string {
  const cells = chapter.dimensions.map(dim =>
    renderHeatmapCell(dim, showSymbols, chapter.name)
  ).join('');

  // Determine grid class based on dimension count
  const gridClass = chapter.dimensions.length <= 2
    ? 'biz-heatmap__grid--2col'
    : 'biz-heatmap__grid';

  return `
    <div class="biz-heatmap__chapter" role="row">
      <div class="biz-heatmap__chapter-name">${escapeHtml(chapter.name)}</div>
      <div class="${gridClass}" role="rowgroup" style="grid-template-columns: repeat(${Math.min(4, chapter.dimensions.length)}, 1fr);">
        ${cells}
      </div>
    </div>
  `;
}

/**
 * Render full heatmap component
 */
export function renderHeatmap(props: HeatmapProps): string {
  const {
    chapters,
    variant,
    showBenchmarks = false,
    showSymbols = true,
    title = 'Business Health Portfolio',
  } = props;

  if (variant === 'condensed') {
    return renderCondensedHeatmap(chapters, showSymbols, title);
  }

  const chapterSections = chapters.map(chapter =>
    renderHeatmapChapter(chapter, showSymbols)
  ).join('');

  return `
    <div
      class="biz-heatmap biz-heatmap--${variant}"
      role="grid"
      aria-label="${escapeHtml(title)}"
    >
      <h3 class="biz-heatmap__title">${escapeHtml(title)}</h3>
      ${chapterSections}

      ${showSymbols ? `
        <div class="biz-heatmap__legend" style="display: flex; justify-content: center; gap: 24px; margin-top: 16px; font-size: 11px; color: #6B7280;">
          <span>✓ Excellence (80-100)</span>
          <span>! Proficiency (60-79)</span>
          <span>⚠ Attention (40-59)</span>
          <span>✗ Critical (0-39)</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render condensed heatmap (single row, smaller cells)
 */
function renderCondensedHeatmap(
  chapters: HeatmapChapter[],
  showSymbols: boolean,
  title: string
): string {
  // Flatten all dimensions into a single row
  const allDimensions: Array<{ code: string; name: string; score: number; band?: ScoreBand }> = [];

  for (const chapter of chapters) {
    for (const dim of chapter.dimensions) {
      allDimensions.push(dim);
    }
  }

  const cells = allDimensions.map(dim => {
    const band = dim.band || getScoreBand(dim.score);
    const bgColor = getBandBackground(band);
    const textColor = getBandTextColor(band);
    const symbol = showSymbols ? getStatusSymbol(band) : '';

    // Very short name for condensed view
    const shortName = dim.name.substring(0, 3).toUpperCase();

    return `
      <div
        class="biz-heatmap__cell biz-heatmap__cell--${band}"
        style="background: ${bgColor}; color: ${textColor}; min-width: 50px; padding: 4px;"
        title="${escapeHtml(dim.name)}: ${dim.score}"
      >
        <div style="font-size: 8px; font-weight: 600;">${shortName}</div>
        <span style="font-size: 14px; font-weight: 700;">${dim.score}</span>
        ${showSymbols ? `<span style="font-size: 10px;" aria-hidden="true">${symbol}</span>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="biz-heatmap biz-heatmap--condensed" role="grid" aria-label="${escapeHtml(title)}">
      <h4 class="biz-heatmap__title" style="font-size: 14px; margin-bottom: 12px;">${escapeHtml(title)}</h4>
      <div style="display: grid; grid-template-columns: repeat(${allDimensions.length}, 1fr); gap: 4px;">
        ${cells}
      </div>
    </div>
  `;
}

/**
 * Render heatmap from IDM chapters data
 */
export function renderHeatmapFromIDM(
  chapters: Array<{
    code: string;
    name: string;
    score: number;
    status?: ScoreBand;
    dimensions: Array<{
      code: string;
      name: string;
      score: number;
      band?: ScoreBand;
      trajectory?: 'improving' | 'flat' | 'declining';
    }>;
  }>,
  variant: 'full' | 'condensed' = 'full'
): string {
  const heatmapChapters: HeatmapChapter[] = chapters.map(ch => ({
    code: ch.code,
    name: ch.name,
    score: ch.score,
    status: ch.status,
    dimensions: ch.dimensions.map(dim => ({
      code: dim.code,
      name: dim.name,
      score: dim.score,
      band: dim.band,
      trajectory: dim.trajectory,
    })),
  }));

  return renderHeatmap({
    chapters: heatmapChapters,
    variant,
    showSymbols: true,
    showBenchmarks: false,
  });
}

/**
 * Render a mini heatmap for executive summaries
 */
export function renderMiniHeatmap(
  dimensions: Array<{ name: string; score: number }>,
  title?: string
): string {
  const cells = dimensions.map(dim => {
    const band = getScoreBand(dim.score);
    const bgColor = getBandBackground(band);
    const textColor = getBandTextColor(band);

    return `
      <div
        style="
          background: ${bgColor};
          color: ${textColor};
          padding: 6px 8px;
          border-radius: 4px;
          text-align: center;
        "
        title="${escapeHtml(dim.name)}: ${dim.score}"
      >
        <div style="font-size: 8px; font-weight: 600; text-transform: uppercase;">${escapeHtml(dim.name.substring(0, 4))}</div>
        <div style="font-size: 14px; font-weight: 700;">${dim.score}</div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 12px;">
      ${title ? `<h5 style="font-size: 12px; font-weight: 600; color: #212653; margin-bottom: 8px;">${escapeHtml(title)}</h5>` : ''}
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${cells}
      </div>
    </div>
  `;
}
