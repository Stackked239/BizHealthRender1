/**
 * BizHealth.ai Visual Components - Metric Card Component
 *
 * Single KPI display with optional trend indicator
 * Used for displaying key metrics in dashboards and summaries
 */

import {
  getScoreBand,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getTrendSymbol,
  getMetricAriaLabel,
  TREND_LABELS,
} from '../../utils/accessibility-utils.js';

/**
 * Metric card component props
 */
export interface MetricCardProps {
  /** Metric label/name */
  label: string;
  /** Metric value (number or string for formatted values) */
  value: number | string;
  /** Optional unit (e.g., "%", "$", "days") */
  unit?: string;
  /** Trend change value (+/-) */
  trend?: number;
  /** Trend direction */
  trendDirection?: 'up' | 'down' | 'flat';
  /** Optional status band for coloring */
  status?: ScoreBand;
  /** Optional subtitle/context */
  subtitle?: string;
  /** Size variant */
  size?: 'standard' | 'large' | 'compact';
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
 * Get trend color
 */
function getTrendColor(direction: 'up' | 'down' | 'flat'): string {
  switch (direction) {
    case 'up':
      return '#22C55E';
    case 'down':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

/**
 * Get status border color
 */
function getStatusBorderColor(status: ScoreBand): string {
  const colors = {
    excellence: '#22C55E',
    proficiency: '#22C55E',
    attention: '#EAB308',
    critical: '#EF4444',
  };
  return colors[status];
}

/**
 * Format value with unit
 */
function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    // Format large numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit || ''}`;
    }
    return `${value}${unit || ''}`;
  }
  return `${value}${unit || ''}`;
}

/**
 * Render metric card component
 */
export function renderMetricCard(props: MetricCardProps): string {
  const {
    label,
    value,
    unit,
    trend,
    trendDirection,
    status,
    subtitle,
    size = 'standard',
  } = props;

  // Determine trend direction from value if not provided
  const direction = trendDirection || (trend !== undefined ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat') : undefined);
  const trendColor = direction ? getTrendColor(direction) : '';
  const trendSymbol = direction ? getTrendSymbol(direction) : '';
  const trendLabel = direction ? TREND_LABELS[direction === 'up' ? 'improving' : direction === 'down' ? 'declining' : 'flat'] : '';

  // Status border
  const statusClass = status ? `biz-metric-card--${status}` : '';
  const borderStyle = status ? `border-top: 3px solid ${getStatusBorderColor(status)};` : '';

  // Size-based styles
  const sizeStyles = {
    standard: { valueSize: '28px', labelSize: '11px' },
    large: { valueSize: '36px', labelSize: '12px' },
    compact: { valueSize: '20px', labelSize: '10px' },
  };
  const styles = sizeStyles[size];

  // ARIA label
  const ariaLabel = getMetricAriaLabel(
    label,
    value,
    unit,
    direction ? { direction, value: trend } : undefined
  );

  return `
    <div
      class="biz-metric-card ${statusClass}"
      style="${borderStyle}"
      role="figure"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      <div class="biz-metric-card__label" style="font-size: ${styles.labelSize};">
        ${escapeHtml(label)}
      </div>
      <div class="biz-metric-card__value" style="font-size: ${styles.valueSize};">
        ${formatValue(value, unit)}
      </div>
      ${subtitle ? `
        <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">
          ${escapeHtml(subtitle)}
        </div>
      ` : ''}
      ${direction ? `
        <div class="biz-metric-card__trend biz-metric-card__trend--${direction}" style="color: ${trendColor};">
          ${trendSymbol} ${trend !== undefined ? (trend >= 0 ? '+' : '') + trend : ''} ${unit || ''} ${trendLabel}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple metric cards in a grid
 */
export function renderMetricCardGrid(
  metrics: Array<{
    label: string;
    value: number | string;
    unit?: string;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'flat';
    status?: ScoreBand;
  }>,
  columns: 2 | 3 | 4 | 6 = 4
): string {
  const cards = metrics.map(metric =>
    renderMetricCard({
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
      trend: metric.trend,
      trendDirection: metric.trendDirection,
      status: metric.status,
    })
  ).join('');

  return `
    <div
      class="biz-metric-card-grid"
      style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 16px;"
      role="group"
      aria-label="Key metrics"
    >
      ${cards}
    </div>
  `;
}

/**
 * Render financial metric card with currency formatting
 */
export function renderFinancialMetricCard(
  label: string,
  value: number,
  currency: string = 'USD',
  trend?: number
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedValue = formatter.format(value);
  const formattedTrend = trend !== undefined ? formatter.format(Math.abs(trend)) : undefined;

  return `
    <div
      class="biz-metric-card"
      style="border-top: 3px solid #212653;"
      role="figure"
      aria-label="${escapeHtml(label)}: ${formattedValue}"
    >
      <div class="biz-metric-card__label" style="font-size: 11px;">
        ${escapeHtml(label)}
      </div>
      <div class="biz-metric-card__value" style="font-size: 24px;">
        ${formattedValue}
      </div>
      ${trend !== undefined ? `
        <div
          class="biz-metric-card__trend biz-metric-card__trend--${trend >= 0 ? 'up' : 'down'}"
          style="color: ${trend >= 0 ? '#22C55E' : '#EF4444'};"
        >
          ${trend >= 0 ? '+' : '-'} ${trend >= 0 ? '+' : ''}${formattedTrend}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render ROI metric card
 */
export function renderROIMetricCard(
  roi: number,
  label: string = 'Expected ROI'
): string {
  const status: ScoreBand = roi >= 3 ? 'excellence' : roi >= 1.5 ? 'proficiency' : roi >= 1 ? 'attention' : 'critical';

  return renderMetricCard({
    label,
    value: `${roi.toFixed(1)}x`,
    status,
    subtitle: roi >= 2 ? 'Strong return' : roi >= 1 ? 'Positive return' : 'Consider alternatives',
  });
}

/**
 * Render percentage metric card
 */
export function renderPercentageMetricCard(
  label: string,
  value: number,
  trend?: number,
  target?: number
): string {
  const status: ScoreBand = target
    ? (value >= target ? 'excellence' : value >= target * 0.8 ? 'proficiency' : value >= target * 0.5 ? 'attention' : 'critical')
    : getScoreBand(value);

  return renderMetricCard({
    label,
    value,
    unit: '%',
    trend,
    trendDirection: trend !== undefined ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat') : undefined,
    status,
    subtitle: target ? `Target: ${target}%` : undefined,
  });
}

/**
 * Render a hero metric card (larger, emphasized)
 */
export function renderHeroMetricCard(
  label: string,
  value: number | string,
  unit?: string,
  subtitle?: string
): string {
  return `
    <div
      class="biz-metric-card-hero"
      style="
        background: linear-gradient(135deg, #212653 0%, #2D3466 100%);
        color: white;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        min-width: 200px;
      "
      role="figure"
      aria-label="${escapeHtml(label)}: ${value}${unit || ''}"
    >
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 8px;">
        ${escapeHtml(label)}
      </div>
      <div style="font-size: 48px; font-weight: 700; font-family: 'Montserrat', sans-serif; line-height: 1;">
        ${value}${unit ? `<span style="font-size: 24px; opacity: 0.8;">${escapeHtml(unit)}</span>` : ''}
      </div>
      ${subtitle ? `
        <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">
          ${escapeHtml(subtitle)}
        </div>
      ` : ''}
    </div>
  `;
}
