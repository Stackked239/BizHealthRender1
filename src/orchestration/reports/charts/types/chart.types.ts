/**
 * BizHealth.ai Chart Visualization Types
 *
 * TypeScript interfaces for the server-side chart rendering system.
 */

import type { ChartConfiguration, ChartType } from 'chart.js';

/**
 * Chart render output format
 */
export type ChartOutputFormat = 'png' | 'svg' | 'pdf';

/**
 * Chart rendering options
 */
export interface ChartRenderOptions {
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Output format */
  format?: ChartOutputFormat;
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Device pixel ratio for retina displays */
  devicePixelRatio?: number;
}

/**
 * Rendered chart result
 */
export interface RenderedChart {
  /** HTML string with embedded chart image */
  html: string;
  /** Base64 encoded image data */
  base64Data?: string;
  /** Chart width */
  width: number;
  /** Chart height */
  height: number;
  /** Alt text for accessibility */
  altText: string;
  /** ARIA label */
  ariaLabel: string;
  /** Data table HTML for screen readers */
  dataTableHtml?: string;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  benchmark?: number;
}

/**
 * Score bar chart configuration
 */
export interface ScoreBarChartConfig {
  /** Chart title */
  title?: string;
  /** Show benchmark overlay */
  showBenchmark?: boolean;
  /** Maximum items to display */
  maxItems?: number;
  /** Sort direction */
  sortBy?: 'score' | 'name' | 'none';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Show score labels inside bars */
  showLabels?: boolean;
  /** Chart orientation */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Radar chart configuration
 */
export interface RadarChartConfig {
  /** Chart title */
  title?: string;
  /** Show benchmark data */
  showBenchmark?: boolean;
  /** Fill the radar area */
  fill?: boolean;
  /** Show point labels */
  showPointLabels?: boolean;
  /** Maximum value (default: 100) */
  maxValue?: number;
  /** Step size for grid lines */
  stepSize?: number;
}

/**
 * Donut chart configuration
 */
export interface DonutChartConfig {
  /** Chart title */
  title?: string;
  /** Inner radius percentage (0-100) */
  cutout?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Show center text */
  centerText?: string;
  /** Show percentage labels */
  showPercentages?: boolean;
}

/**
 * Comparison bar chart configuration
 */
export interface ComparisonBarChartConfig {
  /** Chart title */
  title?: string;
  /** Group labels */
  groupLabels?: string[];
  /** Show values on bars */
  showValues?: boolean;
  /** Bar thickness */
  barThickness?: number;
  /** Show grid lines */
  showGrid?: boolean;
}

/**
 * Gauge chart configuration
 */
export interface GaugeChartConfig {
  /** Chart title */
  title?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Score band thresholds */
  thresholds?: {
    critical: number;
    attention: number;
    proficiency: number;
    excellence: number;
  };
  /** Show needle */
  showNeedle?: boolean;
  /** Show score label */
  showScoreLabel?: boolean;
}

/**
 * Dimension data for charts
 */
export interface DimensionChartData {
  code: string;
  name: string;
  score: number;
  band?: string;
  benchmark?: number;
  percentile?: number;
}

/**
 * Chapter data for charts
 */
export interface ChapterChartData {
  code: string;
  name: string;
  score: number;
  band?: string;
  benchmark?: number;
  dimensions?: DimensionChartData[];
}

/**
 * Risk data for charts
 */
export interface RiskChartData {
  category: string;
  severity: number;
  likelihood?: number;
  impact?: number;
  count?: number;
}

/**
 * Distribution data for charts
 */
export interface DistributionChartData {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

/**
 * Chart theme configuration
 */
export interface ChartTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    grid: string;
  };
  scoreBands: {
    excellence: string;
    proficiency: string;
    attention: string;
    critical: string;
  };
  palettes: {
    dimensions: string[];
    sequential: string[];
    diverging: string[];
  };
  fonts: {
    heading: string;
    body: string;
    sizes: {
      title: number;
      label: number;
      tick: number;
      legend: number;
    };
  };
}

/**
 * Chart accessibility configuration
 */
export interface ChartAccessibilityConfig {
  /** Generate data table for screen readers */
  generateDataTable?: boolean;
  /** Custom alt text */
  altText?: string;
  /** Custom ARIA label */
  ariaLabel?: string;
  /** Include summary */
  includeSummary?: boolean;
}

/**
 * Chart generator function type
 */
export type ChartGenerator<TData, TConfig> = (
  data: TData,
  config?: TConfig
) => ChartConfiguration;

/**
 * Async chart renderer function type
 */
export type ChartRenderer = (
  config: ChartConfiguration,
  options?: ChartRenderOptions,
  accessibility?: ChartAccessibilityConfig
) => Promise<RenderedChart>;
