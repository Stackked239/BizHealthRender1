/**
 * BizHealth.ai Visual Components - Bar Chart Component
 *
 * Horizontal/vertical comparison bars for dimension and metric comparisons
 * Supports benchmark overlays and color-coding by status
 */

import {
  getScoreBand,
  type ScoreBand,
} from '../../utils/color-utils.js';
import { getBarAriaLabel } from '../../utils/accessibility-utils.js';

/**
 * Bar chart item data
 */
export interface BarChartItem {
  /** Display label */
  label: string;
  /** Value (0-100 for scores, or any numeric value) */
  value: number;
  /** Optional benchmark value */
  benchmark?: number;
  /** Optional custom color */
  color?: string;
  /** Optional status band (for auto-coloring) */
  band?: ScoreBand;
}

/**
 * Bar chart component props
 */
export interface BarChartProps {
  /** Array of items to display */
  items: BarChartItem[];
  /** Bar orientation */
  orientation: 'horizontal' | 'vertical';
  /** Show benchmark indicators */
  showBenchmark?: boolean;
  /** Sort order */
  sortBy?: 'value' | 'label' | 'delta' | 'none';
  /** Maximum value for scale (default 100) */
  maxValue?: number;
  /** Optional title */
  title?: string;
  /** Show value labels */
  showValues?: boolean;
  /** Color bars by score band */
  colorByBand?: boolean;
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
 * Get bar color based on band
 */
function getBarColor(band: ScoreBand): string {
  const colors = {
    excellence: 'linear-gradient(90deg, #22C55E, #34d399)',
    proficiency: 'linear-gradient(90deg, #22C55E, #4ade80)',
    attention: 'linear-gradient(90deg, #EAB308, #fde047)',
    critical: 'linear-gradient(90deg, #EF4444, #f87171)',
  };
  return colors[band];
}

/**
 * Sort items based on sort order
 */
function sortItems(items: BarChartItem[], sortBy: BarChartProps['sortBy']): BarChartItem[] {
  if (!sortBy || sortBy === 'none') return items;

  const sorted = [...items];
  switch (sortBy) {
    case 'value':
      return sorted.sort((a, b) => b.value - a.value);
    case 'label':
      return sorted.sort((a, b) => a.label.localeCompare(b.label));
    case 'delta':
      return sorted.sort((a, b) => {
        const deltaA = a.benchmark !== undefined ? a.value - a.benchmark : 0;
        const deltaB = b.benchmark !== undefined ? b.value - b.benchmark : 0;
        return deltaB - deltaA;
      });
    default:
      return sorted;
  }
}

/**
 * Render horizontal bar chart
 */
export function renderBarChart(props: BarChartProps): string {
  const {
    items,
    orientation = 'horizontal',
    showBenchmark = false,
    sortBy = 'none',
    maxValue = 100,
    title,
    showValues = true,
    colorByBand = true,
  } = props;

  const sortedItems = sortItems(items, sortBy);

  if (orientation === 'vertical') {
    return renderVerticalBarChart({ ...props, items: sortedItems });
  }

  const bars = sortedItems.map(item => {
    const percentage = Math.min(100, (item.value / maxValue) * 100);
    const band = item.band || getScoreBand(item.value);
    const barColor = item.color || (colorByBand ? getBarColor(band) : 'linear-gradient(90deg, #212653, #2D3466)');
    const ariaLabel = getBarAriaLabel(item.label, item.value, item.benchmark);

    // Calculate benchmark position
    let benchmarkHtml = '';
    if (showBenchmark && item.benchmark !== undefined) {
      const benchmarkPos = Math.min(100, (item.benchmark / maxValue) * 100);
      benchmarkHtml = `
        <div
          class="biz-bar-chart__benchmark"
          style="left: ${benchmarkPos}%;"
          title="Industry benchmark: ${item.benchmark}"
          aria-hidden="true"
        ></div>
      `;
    }

    return `
      <div class="biz-bar-chart__row" role="listitem" aria-label="${escapeHtml(ariaLabel)}">
        <div class="biz-bar-chart__label" title="${escapeHtml(item.label)}">
          ${escapeHtml(item.label)}
        </div>
        <div class="biz-bar-chart__bar-container">
          <div
            class="biz-bar-chart__bar biz-bar-chart__bar--${band}"
            style="width: ${percentage}%; background: ${barColor};"
          ></div>
          ${benchmarkHtml}
        </div>
        ${showValues ? `
          <div class="biz-bar-chart__value">
            ${item.value}${showBenchmark && item.benchmark !== undefined ? ` <span style="color: #6B7280; font-size: 10px;">(${item.benchmark})</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="biz-bar-chart" role="list" aria-label="${escapeHtml(title || 'Bar chart')}">
      ${title ? `<h4 class="biz-bar-chart__title">${escapeHtml(title)}</h4>` : ''}
      <div class="biz-bar-chart__container">
        ${bars}
      </div>
      ${showBenchmark ? `
        <div class="biz-bar-chart__legend" style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: #6B7280;">
          <span><span style="display: inline-block; width: 12px; height: 12px; background: linear-gradient(90deg, #212653, #2D3466); border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Client Score</span>
          <span><span style="display: inline-block; width: 2px; height: 12px; background: #6B7280; vertical-align: middle; margin-right: 4px;"></span>Industry Benchmark</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render vertical bar chart
 */
function renderVerticalBarChart(props: BarChartProps): string {
  const {
    items,
    showBenchmark = false,
    maxValue = 100,
    title,
    showValues = true,
    colorByBand = true,
  } = props;

  const chartHeight = 200;

  const columns = items.map(item => {
    const percentage = Math.min(100, (item.value / maxValue) * 100);
    const height = (percentage / 100) * chartHeight;
    const band = item.band || getScoreBand(item.value);
    const barColor = item.color || (colorByBand ? getBarColor(band) : 'linear-gradient(180deg, #212653, #2D3466)');
    const ariaLabel = getBarAriaLabel(item.label, item.value, item.benchmark);

    // Truncate label for display
    const shortLabel = item.label.length > 10 ? item.label.substring(0, 9) + '...' : item.label;

    return `
      <div class="biz-bar-chart__column" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
        ${showValues ? `
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #212653;">
            ${item.value}
          </div>
        ` : ''}
        <div style="flex: 1; display: flex; align-items: flex-end; width: 100%;">
          <div
            style="
              width: 100%;
              height: ${height}px;
              background: ${barColor};
              border-radius: 4px 4px 0 0;
              transition: height 0.3s ease;
            "
            role="listitem"
            aria-label="${escapeHtml(ariaLabel)}"
            title="${escapeHtml(item.label)}: ${item.value}"
          ></div>
        </div>
        <div style="font-size: 10px; color: #6B7280; margin-top: 8px; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(shortLabel)}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-bar-chart biz-bar-chart--vertical" role="list" aria-label="${escapeHtml(title || 'Bar chart')}">
      ${title ? `<h4 class="biz-bar-chart__title">${escapeHtml(title)}</h4>` : ''}
      <div style="display: flex; gap: 16px; height: ${chartHeight + 40}px; align-items: flex-end; padding-bottom: 24px;">
        ${columns}
      </div>
    </div>
  `;
}

/**
 * Render dimension comparison bar chart
 */
export function renderDimensionComparisonChart(
  dimensions: Array<{
    name: string;
    score: number;
    benchmark?: number;
    band?: ScoreBand;
  }>,
  title?: string
): string {
  const items: BarChartItem[] = dimensions.map(dim => ({
    label: dim.name,
    value: dim.score,
    benchmark: dim.benchmark,
    band: dim.band,
  }));

  return renderBarChart({
    items,
    orientation: 'horizontal',
    showBenchmark: dimensions.some(d => d.benchmark !== undefined),
    sortBy: 'value',
    maxValue: 100,
    title: title || 'Dimension Scores',
    showValues: true,
    colorByBand: true,
  });
}

/**
 * Render chapter scores as a bar chart
 */
export function renderChapterBarChart(
  chapters: Array<{
    name: string;
    score: number;
    benchmark?: number;
  }>,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): string {
  const items: BarChartItem[] = chapters.map(ch => ({
    label: ch.name,
    value: ch.score,
    benchmark: ch.benchmark,
    band: getScoreBand(ch.score),
  }));

  return renderBarChart({
    items,
    orientation,
    showBenchmark: chapters.some(ch => ch.benchmark !== undefined),
    sortBy: 'none',
    maxValue: 100,
    title: 'Chapter Scores',
    showValues: true,
    colorByBand: true,
  });
}

/**
 * Render a stacked bar showing breakdown
 */
export function renderStackedBar(
  segments: Array<{ label: string; value: number; color: string }>,
  title?: string,
  total?: number
): string {
  const calculatedTotal = total || segments.reduce((sum, s) => sum + s.value, 0);

  const bars = segments.map(segment => {
    const percentage = (segment.value / calculatedTotal) * 100;
    return `
      <div
        style="
          width: ${percentage}%;
          height: 100%;
          background: ${segment.color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 600;
        "
        title="${escapeHtml(segment.label)}: ${segment.value} (${percentage.toFixed(1)}%)"
      >
        ${percentage > 10 ? `${percentage.toFixed(0)}%` : ''}
      </div>
    `;
  }).join('');

  const legend = segments.map(segment => `
    <span style="display: flex; align-items: center; gap: 4px;">
      <span style="width: 12px; height: 12px; background: ${segment.color}; border-radius: 2px;"></span>
      ${escapeHtml(segment.label)}
    </span>
  `).join('');

  return `
    <div class="biz-stacked-bar">
      ${title ? `<h4 style="font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 12px;">${escapeHtml(title)}</h4>` : ''}
      <div style="height: 28px; display: flex; border-radius: 4px; overflow: hidden;">
        ${bars}
      </div>
      <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #6B7280;">
        ${legend}
      </div>
    </div>
  `;
}
