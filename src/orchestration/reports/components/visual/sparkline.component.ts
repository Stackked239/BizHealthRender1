/**
 * BizHealth.ai Visual Components - Sparkline Component
 *
 * Compact mini trend chart (3-12 data points)
 * Used for inline trend indicators
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Sparkline component props
 */
export interface SparklineProps {
  /** Data points (array of numbers) */
  data: number[];
  /** Width in pixels (default 60) */
  width?: number;
  /** Height in pixels (default 20) */
  height?: number;
  /** Line color (auto-detected from trend if not specified) */
  color?: string;
  /** Show area fill under line */
  showArea?: boolean;
  /** Show end point marker */
  showEndPoint?: boolean;
  /** Show current value next to sparkline */
  showValue?: boolean;
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
 * Determine trend from data
 */
function getTrend(data: number[]): 'positive' | 'negative' | 'neutral' {
  if (data.length < 2) return 'neutral';

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;
  const threshold = (Math.max(...data) - Math.min(...data)) * 0.1;

  if (difference > threshold) return 'positive';
  if (difference < -threshold) return 'negative';
  return 'neutral';
}

/**
 * Get trend color
 */
function getTrendColor(trend: 'positive' | 'negative' | 'neutral'): string {
  switch (trend) {
    case 'positive':
      return '#22C55E';
    case 'negative':
      return '#EF4444';
    default:
      return BRAND_COLORS.navy;
  }
}

/**
 * Render sparkline component
 */
export function renderSparkline(props: SparklineProps): string {
  const {
    data,
    width = 60,
    height = 20,
    color,
    showArea = true,
    showEndPoint = true,
    showValue = false,
  } = props;

  if (data.length === 0) {
    return '<span class="biz-sparkline">No data</span>';
  }

  // Calculate trend and color
  const trend = getTrend(data);
  const lineColor = color || getTrendColor(trend);

  // Calculate SVG path
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const padding = 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (val - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  // Generate path
  const linePath = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  // Generate area path (closed polygon)
  const areaPath = showArea
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  // End point
  const endPoint = points[points.length - 1];
  const endPointHtml = showEndPoint
    ? `<circle cx="${endPoint.x}" cy="${endPoint.y}" r="2" fill="${lineColor}" class="biz-sparkline__point" />`
    : '';

  // Current value display
  const currentValue = data[data.length - 1];
  const valueHtml = showValue
    ? `<span class="biz-sparkline__value" style="font-size: 12px; font-weight: 600; color: ${lineColor}; margin-left: 4px;">${currentValue}</span>`
    : '';

  return `
    <span class="biz-sparkline biz-sparkline--${trend}" style="display: inline-flex; align-items: center;">
      <svg
        class="biz-sparkline__svg"
        width="${width}"
        height="${height}"
        viewBox="0 0 ${width} ${height}"
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend: ${trend}, current value: ${currentValue}"
      >
        ${showArea ? `
          <path
            class="biz-sparkline__area"
            d="${areaPath}"
            fill="${lineColor}15"
          />
        ` : ''}
        <path
          class="biz-sparkline__line"
          d="${linePath}"
          fill="none"
          stroke="${lineColor}"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        ${endPointHtml}
      </svg>
      ${valueHtml}
    </span>
  `;
}

/**
 * Render sparkline with label
 */
export function renderLabeledSparkline(
  label: string,
  data: number[],
  unit?: string
): string {
  const sparkline = renderSparkline({
    data,
    width: 60,
    height: 20,
    showArea: true,
    showEndPoint: true,
    showValue: true,
  });

  const currentValue = data[data.length - 1];

  return `
    <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
      <span style="font-size: 12px; color: #374151; min-width: 80px;">${escapeHtml(label)}</span>
      ${sparkline}
      ${unit ? `<span style="font-size: 10px; color: #6B7280;">${escapeHtml(unit)}</span>` : ''}
    </div>
  `;
}

/**
 * Render multiple sparklines in a list
 */
export function renderSparklineList(
  items: Array<{
    label: string;
    data: number[];
    unit?: string;
  }>,
  title?: string
): string {
  const sparklines = items.map(item =>
    renderLabeledSparkline(item.label, item.data, item.unit)
  ).join('');

  return `
    <div class="biz-sparkline-list">
      ${title ? `
        <h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 12px;">
          ${escapeHtml(title)}
        </h4>
      ` : ''}
      ${sparklines}
    </div>
  `;
}

/**
 * Render inline metric with sparkline
 */
export function renderMetricWithSparkline(
  label: string,
  value: number | string,
  data: number[],
  trend?: 'up' | 'down' | 'flat'
): string {
  const sparkline = renderSparkline({
    data,
    width: 50,
    height: 16,
    showArea: false,
    showEndPoint: false,
    showValue: false,
  });

  const trendSymbol = trend === 'up' ? '+' : trend === 'down' ? '-' : '=';
  const trendColor = trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#6B7280';

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 8px;
      border-left: 3px solid ${trendColor};
    ">
      <div style="flex: 1;">
        <div style="font-size: 10px; color: #6B7280; text-transform: uppercase; margin-bottom: 4px;">
          ${escapeHtml(label)}
        </div>
        <div style="font-size: 20px; font-weight: 700; color: #212653; font-family: 'Montserrat', sans-serif;">
          ${escapeHtml(String(value))}
        </div>
      </div>
      <div style="text-align: right;">
        ${sparkline}
        ${trend ? `
          <div style="font-size: 10px; color: ${trendColor}; margin-top: 4px;">
            ${trendSymbol} ${trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate sample data for demo/testing
 */
export function generateSampleSparklineData(
  trend: 'up' | 'down' | 'volatile' | 'flat',
  length: number = 12
): number[] {
  const data: number[] = [];
  let value = 50;

  for (let i = 0; i < length; i++) {
    const noise = (Math.random() - 0.5) * 10;

    switch (trend) {
      case 'up':
        value += 3 + noise;
        break;
      case 'down':
        value -= 3 + noise;
        break;
      case 'volatile':
        value += (Math.random() - 0.5) * 20;
        break;
      case 'flat':
        value += noise;
        break;
    }

    data.push(Math.max(0, Math.min(100, value)));
  }

  return data;
}
