/**
 * BizHealth.ai Visual Components - KPI Dashboard Component
 *
 * Multi-metric dashboard panel (6-8 KPIs)
 * Used for executive dashboards and summary views
 */

import {
  getScoreBand,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getTrendSymbol,
  TREND_LABELS,
} from '../../utils/accessibility-utils.js';

/**
 * KPI metric data
 */
export interface KPIMetric {
  /** Metric label/name */
  label: string;
  /** Current value */
  value: number | string;
  /** Optional target value */
  target?: number;
  /** Status band for coloring */
  status?: ScoreBand;
  /** Trend direction */
  trend?: 'up' | 'down' | 'flat';
  /** Unit (%, $, etc.) */
  unit?: string;
  /** Optional subtitle */
  subtitle?: string;
}

/**
 * KPI Dashboard component props
 */
export interface KPIDashboardProps {
  /** Array of KPI metrics */
  metrics: KPIMetric[];
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4;
  /** Dashboard title */
  title?: string;
  /** Show header border */
  showBorder?: boolean;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get status border color
 */
function getStatusBorderColor(status?: ScoreBand): string {
  if (!status) return '#212653';
  const colors = {
    excellence: '#22C55E',
    proficiency: '#22C55E',
    attention: '#EAB308',
    critical: '#EF4444',
  };
  return colors[status];
}

/**
 * Get trend color
 */
function getTrendColor(trend?: 'up' | 'down' | 'flat'): string {
  if (!trend) return '#6B7280';
  const colors = {
    up: '#22C55E',
    down: '#EF4444',
    flat: '#6B7280',
  };
  return colors[trend];
}

/**
 * Format value with unit
 */
function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
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
 * Render KPI dashboard component
 */
export function renderKPIDashboard(props: KPIDashboardProps): string {
  const {
    metrics,
    columns = 3,
    title,
    showBorder = true,
  } = props;

  const kpiItems = metrics.map(metric => {
    const borderColor = getStatusBorderColor(metric.status);
    const trendColor = getTrendColor(metric.trend);
    const trendSymbol = metric.trend ? getTrendSymbol(metric.trend as 'improving' | 'flat' | 'declining') : '';
    const trendLabel = metric.trend ? (metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 'Declining' : 'Stable') : '';

    return `
      <div class="biz-kpi-dashboard__item ${metric.status ? `biz-kpi-dashboard__item--${metric.status}` : ''}" style="border-left-color: ${borderColor};">
        <div class="biz-kpi-dashboard__item-label">${escapeHtml(metric.label)}</div>
        <div class="biz-kpi-dashboard__item-value">${formatValue(metric.value, metric.unit)}</div>
        ${metric.target !== undefined ? `
          <div class="biz-kpi-dashboard__item-target">Target: ${metric.target}${metric.unit || ''}</div>
        ` : ''}
        ${metric.subtitle ? `
          <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">${escapeHtml(metric.subtitle)}</div>
        ` : ''}
        ${metric.trend ? `
          <div class="biz-kpi-dashboard__item-trend" style="color: ${trendColor};">
            ${trendSymbol} ${trendLabel}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="biz-kpi-dashboard" role="region" aria-label="${escapeHtml(title || 'Key Performance Indicators')}">
      ${title ? `
        <div class="biz-kpi-dashboard__title" ${showBorder ? '' : 'style="border-bottom: none;"'}>
          ${escapeHtml(title)}
        </div>
      ` : ''}
      <div class="biz-kpi-dashboard__grid biz-kpi-dashboard__grid--${columns}cols">
        ${kpiItems}
      </div>
    </div>
  `;
}

/**
 * Render executive KPI dashboard with overall health
 */
export function renderExecutiveKPIDashboard(
  overallScore: number,
  metrics: Array<{
    label: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'flat';
  }>
): string {
  const band = getScoreBand(overallScore);

  const kpiMetrics: KPIMetric[] = metrics.map(m => ({
    label: m.label,
    value: m.value,
    unit: m.unit,
    trend: m.trend,
  }));

  // Add overall score as first metric
  kpiMetrics.unshift({
    label: 'Overall Health Score',
    value: overallScore,
    unit: '/100',
    status: band,
  });

  return renderKPIDashboard({
    metrics: kpiMetrics,
    columns: 4,
    title: 'Executive Dashboard',
  });
}

/**
 * Render financial KPI dashboard
 */
export function renderFinancialKPIDashboard(
  metrics: {
    day90Value?: number;
    annualValue?: number;
    roi90Day?: number;
    totalInvestment?: number;
    paybackPeriod?: string;
    costSavings?: number;
  },
  title?: string
): string {
  const kpiMetrics: KPIMetric[] = [];

  if (metrics.day90Value !== undefined) {
    kpiMetrics.push({
      label: '90-Day Value',
      value: metrics.day90Value >= 1000 ? `$${(metrics.day90Value / 1000).toFixed(0)}K` : `$${metrics.day90Value}`,
      status: 'excellence',
    });
  }

  if (metrics.annualValue !== undefined) {
    kpiMetrics.push({
      label: 'Annual Value',
      value: metrics.annualValue >= 1000000 ? `$${(metrics.annualValue / 1000000).toFixed(1)}M` : `$${(metrics.annualValue / 1000).toFixed(0)}K`,
      status: 'excellence',
    });
  }

  if (metrics.roi90Day !== undefined) {
    kpiMetrics.push({
      label: '90-Day ROI',
      value: `${metrics.roi90Day.toFixed(1)}x`,
      status: metrics.roi90Day >= 2 ? 'excellence' : metrics.roi90Day >= 1 ? 'proficiency' : 'attention',
    });
  }

  if (metrics.totalInvestment !== undefined) {
    kpiMetrics.push({
      label: 'Total Investment',
      value: metrics.totalInvestment >= 1000000 ? `$${(metrics.totalInvestment / 1000000).toFixed(1)}M` : `$${(metrics.totalInvestment / 1000).toFixed(0)}K`,
    });
  }

  if (metrics.paybackPeriod) {
    kpiMetrics.push({
      label: 'Payback Period',
      value: metrics.paybackPeriod,
    });
  }

  if (metrics.costSavings !== undefined) {
    kpiMetrics.push({
      label: 'Cost Savings',
      value: `$${(metrics.costSavings / 1000).toFixed(0)}K`,
      status: 'excellence',
    });
  }

  return renderKPIDashboard({
    metrics: kpiMetrics,
    columns: kpiMetrics.length <= 4 ? (kpiMetrics.length as 2 | 3 | 4) : 3,
    title: title || 'Financial Impact Summary',
  });
}

/**
 * Render chapter summary dashboard
 */
export function renderChapterSummaryDashboard(
  chapters: Array<{
    name: string;
    score: number;
    trend?: 'up' | 'down' | 'flat';
    benchmark?: number;
  }>
): string {
  const metrics: KPIMetric[] = chapters.map(ch => ({
    label: ch.name,
    value: ch.score,
    unit: '/100',
    status: getScoreBand(ch.score),
    trend: ch.trend,
    subtitle: ch.benchmark ? `Benchmark: ${ch.benchmark}` : undefined,
  }));

  return renderKPIDashboard({
    metrics,
    columns: chapters.length <= 4 ? (chapters.length as 2 | 3 | 4) : 4,
    title: 'Chapter Scores Overview',
  });
}

/**
 * Render quick stats row (compact horizontal layout)
 */
export function renderQuickStatsRow(
  stats: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>
): string {
  const statItems = stats.map(stat => `
    <div style="flex: 1; text-align: center; padding: 16px;">
      <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">
        ${escapeHtml(stat.label)}
      </div>
      <div style="font-size: 24px; font-weight: 700; color: ${stat.color || '#212653'}; font-family: 'Montserrat', sans-serif;">
        ${escapeHtml(String(stat.value))}
      </div>
    </div>
  `).join('<div style="width: 1px; background: #E5E7EB;"></div>');

  return `
    <div style="display: flex; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
      ${statItems}
    </div>
  `;
}
