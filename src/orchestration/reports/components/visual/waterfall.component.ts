/**
 * BizHealth.ai Visual Components - Waterfall Chart Component
 *
 * Incremental value breakdown visualization
 * Shows how values build up or break down from start to end
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Waterfall bar data
 */
export interface WaterfallBar {
  /** Display label */
  label: string;
  /** Value (positive or negative) */
  value: number;
  /** Whether this is a total/subtotal bar */
  isTotal?: boolean;
  /** Optional color override */
  color?: string;
}

/**
 * Waterfall chart component props
 */
export interface WaterfallChartProps {
  /** Array of bars */
  bars: WaterfallBar[];
  /** Optional title */
  title?: string;
  /** Starting value (default 0) */
  startValue?: number;
  /** Format as currency */
  formatCurrency?: boolean;
  /** Show connectors between bars */
  showConnectors?: boolean;
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
 * Format value
 */
function formatValue(value: number, asCurrency: boolean): string {
  if (asCurrency) {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  }
  return value.toFixed(0);
}

/**
 * Render waterfall chart
 */
export function renderWaterfall(props: WaterfallChartProps): string {
  const {
    bars,
    title,
    startValue = 0,
    formatCurrency = false,
    showConnectors = true,
  } = props;

  // Calculate running totals and positions
  let runningTotal = startValue;
  const chartHeight = 200;
  const barData: Array<{
    label: string;
    value: number;
    start: number;
    end: number;
    isPositive: boolean;
    isTotal: boolean;
    color: string;
  }> = [];

  // Calculate min/max for scaling
  let minValue = startValue;
  let maxValue = startValue;

  bars.forEach(bar => {
    if (bar.isTotal) {
      // Total bar starts from 0
      const totalValue = runningTotal;
      minValue = Math.min(minValue, 0, totalValue);
      maxValue = Math.max(maxValue, 0, totalValue);
    } else {
      const endValue = runningTotal + bar.value;
      minValue = Math.min(minValue, runningTotal, endValue);
      maxValue = Math.max(maxValue, runningTotal, endValue);
      runningTotal = endValue;
    }
  });

  // Reset and build bar data
  runningTotal = startValue;
  const range = maxValue - minValue || 1;
  const zeroLine = ((maxValue - 0) / range) * chartHeight;

  bars.forEach(bar => {
    if (bar.isTotal) {
      const totalValue = runningTotal;
      barData.push({
        label: bar.label,
        value: totalValue,
        start: 0,
        end: totalValue,
        isPositive: totalValue >= 0,
        isTotal: true,
        color: bar.color || BRAND_COLORS.navy,
      });
    } else {
      const start = runningTotal;
      const end = runningTotal + bar.value;
      barData.push({
        label: bar.label,
        value: bar.value,
        start,
        end,
        isPositive: bar.value >= 0,
        isTotal: false,
        color: bar.color || (bar.value >= 0 ? '#22C55E' : '#EF4444'),
      });
      runningTotal = end;
    }
  });

  // Render bars
  const barWidth = Math.min(60, (300 - (barData.length - 1) * 8) / barData.length);

  const barsHtml = barData.map((bar, index) => {
    // Calculate positions
    const topValue = Math.max(bar.start, bar.end);
    const bottomValue = bar.isTotal ? 0 : Math.min(bar.start, bar.end);
    const barHeight = Math.abs(((topValue - bottomValue) / range) * chartHeight);
    const barTop = ((maxValue - topValue) / range) * chartHeight;

    // Connector to next bar
    let connector = '';
    if (showConnectors && index < barData.length - 1 && !bar.isTotal) {
      const nextBar = barData[index + 1];
      const connectorY = ((maxValue - bar.end) / range) * chartHeight;
      connector = `
        <div style="
          position: absolute;
          left: ${barWidth}px;
          top: ${connectorY}px;
          width: 8px;
          height: 1px;
          background: #D1D5DB;
        "></div>
      `;
    }

    return `
      <div class="biz-waterfall__bar-group" style="width: ${barWidth}px; position: relative;">
        <!-- Value label -->
        <div style="
          position: absolute;
          top: ${bar.isPositive || bar.isTotal ? barTop - 18 : barTop + barHeight + 4}px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: ${bar.color};
          white-space: nowrap;
        ">
          ${bar.isTotal ? '' : (bar.value >= 0 ? '+' : '')}${formatValue(bar.value, formatCurrency)}
        </div>

        <!-- Bar -->
        <div
          class="biz-waterfall__bar ${bar.isTotal ? 'biz-waterfall__bar--total' : bar.isPositive ? 'biz-waterfall__bar--positive' : 'biz-waterfall__bar--negative'}"
          style="
            position: absolute;
            top: ${barTop}px;
            left: 0;
            width: 100%;
            height: ${Math.max(barHeight, 2)}px;
            background: ${bar.color};
            border-radius: 2px;
          "
          title="${escapeHtml(bar.label)}: ${formatValue(bar.value, formatCurrency)}"
        ></div>

        ${connector}

        <!-- Label -->
        <div class="biz-waterfall__label" style="
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          color: #6B7280;
          white-space: nowrap;
          max-width: ${barWidth + 20}px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        ">
          ${escapeHtml(bar.label.length > 10 ? bar.label.substring(0, 9) + '...' : bar.label)}
        </div>
      </div>
    `;
  }).join('');

  // Zero line
  const zeroLineHtml = minValue < 0 && maxValue > 0 ? `
    <div style="
      position: absolute;
      left: 0;
      right: 0;
      top: ${zeroLine}px;
      height: 1px;
      background: #374151;
    ">
      <span style="position: absolute; left: -20px; top: -6px; font-size: 10px; color: #374151;">0</span>
    </div>
  ` : '';

  return `
    <div class="biz-waterfall" role="figure" aria-label="${escapeHtml(title || 'Waterfall chart')}">
      ${title ? `
        <div class="biz-waterfall__title">${escapeHtml(title)}</div>
      ` : ''}

      <div style="position: relative; height: ${chartHeight + 40}px; padding: 20px 30px 40px 30px;">
        ${zeroLineHtml}
        <div class="biz-waterfall__chart" style="display: flex; align-items: flex-end; gap: 8px; height: ${chartHeight}px; position: relative;">
          ${barsHtml}
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 24px; margin-top: 8px; font-size: 10px; color: #6B7280;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #22C55E; border-radius: 2px;"></span>
          Increase
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #EF4444; border-radius: 2px;"></span>
          Decrease
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: ${BRAND_COLORS.navy}; border-radius: 2px;"></span>
          Total
        </span>
      </div>
    </div>
  `;
}

/**
 * Render financial value waterfall
 */
export function renderValueWaterfall(
  items: Array<{ label: string; value: number }>,
  title?: string
): string {
  const bars: WaterfallBar[] = items.map(item => ({
    label: item.label,
    value: item.value,
    isTotal: false,
  }));

  // Add total bar
  const total = items.reduce((sum, item) => sum + item.value, 0);
  bars.push({
    label: 'Total',
    value: total,
    isTotal: true,
  });

  return renderWaterfall({
    bars,
    title: title || 'Value Breakdown',
    formatCurrency: true,
    showConnectors: true,
  });
}

/**
 * Render score breakdown waterfall
 */
export function renderScoreBreakdown(
  baseScore: number,
  adjustments: Array<{ label: string; impact: number }>,
  title?: string
): string {
  const bars: WaterfallBar[] = [
    { label: 'Base Score', value: baseScore, isTotal: true },
    ...adjustments.map(adj => ({
      label: adj.label,
      value: adj.impact,
      isTotal: false,
    })),
  ];

  // Final score
  const finalScore = baseScore + adjustments.reduce((sum, a) => sum + a.impact, 0);
  bars.push({
    label: 'Final Score',
    value: finalScore,
    isTotal: true,
  });

  return renderWaterfall({
    bars,
    title: title || 'Score Composition',
    startValue: 0,
    formatCurrency: false,
    showConnectors: true,
  });
}

/**
 * Render ROI waterfall
 */
export function renderROIWaterfall(
  components: {
    investment: number;
    quickWins: number;
    processEfficiency: number;
    revenueGrowth: number;
    costReduction: number;
    netValue?: number;
  }
): string {
  const bars: WaterfallBar[] = [
    { label: 'Investment', value: -Math.abs(components.investment), color: '#EF4444' },
    { label: 'Quick Wins', value: components.quickWins },
    { label: 'Efficiency', value: components.processEfficiency },
    { label: 'Revenue', value: components.revenueGrowth },
    { label: 'Cost Savings', value: components.costReduction },
  ];

  const netValue = components.netValue ??
    (components.quickWins + components.processEfficiency + components.revenueGrowth + components.costReduction - Math.abs(components.investment));

  bars.push({
    label: 'Net Value',
    value: netValue,
    isTotal: true,
  });

  return renderWaterfall({
    bars,
    title: 'Return on Investment Breakdown',
    formatCurrency: true,
    showConnectors: true,
  });
}
