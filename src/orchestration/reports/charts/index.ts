/**
 * BizHealth.ai Server-Side Chart Visualization System
 *
 * This module provides server-side chart rendering using Chart.js
 * and chartjs-node-canvas for generating static chart images
 * suitable for PDF export and print media.
 *
 * Features:
 * - Server-side PNG/SVG rendering without browser dependency
 * - BizHealth brand-consistent styling
 * - Accessibility support (ARIA labels, alt text, data tables)
 * - Print-optimized output
 *
 * @example
 * ```typescript
 * import {
 *   renderChart,
 *   generateDimensionScoreChart,
 *   BIZHEALTH_CHART_THEME
 * } from './charts/index.js';
 *
 * const config = generateDimensionScoreChart(dimensions, benchmarks, {
 *   title: 'Dimension Scores',
 *   showBenchmark: true
 * });
 *
 * const rendered = await renderChart(config, { width: 600, height: 400 });
 * const html = rendered.html; // <figure> with embedded PNG
 * ```
 */

// Core renderer
export {
  renderChart,
  renderChartToBuffer,
  renderChartToDataUrl,
  generateChartStyles,
  clearRendererCache,
} from './chart-renderer.js';

// Theme and styling
export {
  BIZHEALTH_CHART_THEME,
  DEFAULT_CHART_OPTIONS,
  getScoreBandColor,
  colorWithOpacity,
  BAR_CHART_DEFAULTS,
} from './chart-theme.js';

// Accessibility utilities
export {
  generateChartAriaLabel,
  generateChartAltText,
  generateChartDataTable,
  generateDataTableStyles,
} from './chart-accessibility.js';

// All generators
export * from './generators/index.js';

// Report integration utilities
export {
  generateChapterOverviewRadar,
  generateChapterDimensionBars,
  generateAllChapterScoreBars,
  generateScoreBandDistribution,
  generateBenchmarkComparison,
  generateGapAnalysis,
  generateStrengthsWeaknessesChart,
  generateHealthScoreGauge,
  generateChapterDimensionRadar,
  generateChapterRadarGrid,
  generateExecutiveDashboard,
  getReportChartStyles,
  CHART_SIZES,
} from './report-chart-integration.js';

// Types
export type {
  ChartOutputFormat,
  ChartRenderOptions,
  RenderedChart,
  ChartDataPoint,
  ScoreBarChartConfig,
  RadarChartConfig,
  DonutChartConfig,
  ComparisonBarChartConfig,
  GaugeChartConfig,
  DimensionChartData,
  ChapterChartData,
  RiskChartData,
  DistributionChartData,
  ChartTheme,
  ChartAccessibilityConfig,
  ChartGenerator,
  ChartRenderer,
} from './types/chart.types.js';

// ============================================================================
// PHASE 5 SERVER-SIDE SVG CHART GENERATORS
// Expanded chart library for PDF-compatible visualizations
// ============================================================================

export {
  // Radar Charts
  generateRadarChartSVG,
  // Horizontal Bar Charts
  generateHorizontalBarChartSVG,
  // Donut Charts
  generateDonutChartSVG,
  // Gauge Charts
  generateGaugeChartSVG,
  // Score Distribution Charts
  generateScoreDistributionSVG,
  // Sparkline Charts
  generateSparklineSVG,
  // Placeholder/Fallback
  generatePlaceholderSVG,
  safeGenerateChart,
  // Utility functions
  wrapChartInContainer,
} from './svg-chart-generators.js';

export type {
  RadarChartData,
  RadarChartOptions,
  BarChartData,
  BarChartOptions,
  DonutChartData,
  DonutChartOptions,
  GaugeChartData,
  GaugeChartOptions,
  ScoreDistributionData,
  SparklineData,
  ChartContainerOptions,
} from './svg-chart-generators.js';

// ============================================================================
// WORLD-CLASS D3-STYLE SVG CHART GENERATORS (Phase 1.5-2)
// Executive-grade radar visualizations optimized for PDF output
// ============================================================================

export {
  // 12-Dimension Executive Radar
  render12DimensionExecutiveRadar,
  render12DimensionRadarCompact,
  renderExecutiveRadarWithDimensions,
  // 4-Chapter Benchmark Radar
  render4ChapterRadar,
  render4ChapterRadarCompact,
  renderChapterRadarFromScores,
  // Constants
  DIMENSION_ORDER,
  DIMENSION_CONFIG,
  CHAPTER_COLORS,
  CHAPTER_CONFIG,
  CHAPTER_ORDER,
} from './d3/index.js';

export type {
  // 12-Dimension Types
  DimensionConfig,
  ChapterConfig,
  ExecutiveRadarChartData,
  ExecutiveRadarOptions,
  // 4-Chapter Types
  ChapterCode,
  ChapterRadarItem,
  ChapterRadarData,
  ChapterRadarOptions,
} from './d3/index.js';
