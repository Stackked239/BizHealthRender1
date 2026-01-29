/**
 * BizHealth.ai Visualization Type Definitions
 *
 * This module defines the core data structures for the visualization system.
 * These types serve as the source-of-truth for all structured visualization data
 * that will replace ASCII graphics in BizHealth reports.
 *
 * @module visualization.types
 * @version 1.0.0
 */

// ============================================================================
// VISUALIZATION TYPES
// ============================================================================

/**
 * Supported visualization types for BizHealth reports
 */
export type VisualizationType =
  | 'gauge' // Single value with max (health scores)
  | 'bar' // Client vs benchmark comparison
  | 'heatmap' // Matrix of values (dimension x chapter)
  | 'sparkline' // Trend over time
  | 'radar' // Multi-dimensional comparison
  | 'progress'; // Simple progress indicator

// ============================================================================
// BRAND-COMPLIANT COLOR PALETTE
// ============================================================================

/**
 * BizHealth brand-compliant color palette
 * These colors should be used consistently across all visualizations
 */
export const BIZHEALTH_COLORS = {
  /** BizNavy - Primary brand color */
  primary: '#212653',
  /** BizGreen - Accent color */
  accent: '#969423',
  /** Teal - Status indicator for good/excellence */
  statusGood: '#32808d',
  /** Orange - Status indicator for caution/attention */
  statusCaution: '#F39237',
  /** Red - Status indicator for critical issues */
  statusCritical: '#C01530',
  /** White - Background color */
  background: '#FFFFFF',
  /** Primary text color (matches BizNavy) */
  textPrimary: '#212653',
  /** Secondary text color for labels and sublabels */
  textSecondary: '#666666',
  /** Gray for backgrounds and inactive elements */
  gray: '#E5E7EB',
  /** Light gray for subtle backgrounds */
  grayLight: '#F3F4F6',
} as const;

/**
 * Type for BIZHEALTH_COLORS keys
 */
export type BizHealthColorKey = keyof typeof BIZHEALTH_COLORS;

// ============================================================================
// STATUS BANDS
// ============================================================================

/**
 * Status bands matching IDM score bands for performance tier classification
 */
export type StatusBand = 'excellence' | 'proficiency' | 'attention' | 'critical';

/**
 * Score thresholds for status band classification
 */
export const STATUS_BAND_THRESHOLDS = {
  excellence: 80,
  proficiency: 60,
  attention: 40,
  critical: 0,
} as const;

/**
 * Get status band from numeric score (0-100)
 */
export function getStatusBandFromScore(score: number): StatusBand {
  if (score >= STATUS_BAND_THRESHOLDS.excellence) return 'excellence';
  if (score >= STATUS_BAND_THRESHOLDS.proficiency) return 'proficiency';
  if (score >= STATUS_BAND_THRESHOLDS.attention) return 'attention';
  return 'critical';
}

/**
 * Get color for status band
 */
export function getStatusBandColor(band: StatusBand): string {
  const colors: Record<StatusBand, string> = {
    excellence: BIZHEALTH_COLORS.statusGood,
    proficiency: BIZHEALTH_COLORS.accent,
    attention: BIZHEALTH_COLORS.statusCaution,
    critical: BIZHEALTH_COLORS.statusCritical,
  };
  return colors[band];
}

// ============================================================================
// VISUALIZATION DATA STRUCTURES
// ============================================================================

/**
 * Gauge data for speedometer-style health score visualizations
 */
export interface GaugeData {
  /** Current value (typically 0-100) */
  value: number;
  /** Maximum value for the gauge */
  max: number;
  /** Optional benchmark value for comparison */
  benchmark?: number;
  /** Optional trend indicator */
  trend?: 'improving' | 'flat' | 'declining';
}

/**
 * Bar data for client vs benchmark comparisons
 */
export interface BarData {
  /** Client's value */
  clientValue: number;
  /** Benchmark/comparison value */
  benchmarkValue: number;
  /** Unit label (e.g., "%", "pts", "$") */
  unit?: string;
  /** Scale for the bar chart */
  scale?: { min: number; max: number };
}

/**
 * Heatmap data for matrix visualizations (dimension x chapter)
 */
export interface HeatmapData {
  /** Row labels (e.g., dimension names) */
  rows: string[];
  /** Column labels (e.g., chapter names) */
  columns: string[];
  /** Matrix of values [row][column] */
  values: number[][];
  /** Scale for color mapping */
  scale?: { min: number; max: number };
}

/**
 * Sparkline data for trend visualizations
 */
export interface SparklineData {
  /** Data points for the sparkline */
  points: number[];
  /** Optional x-axis labels */
  labels?: string[];
  /** Optional min/max for normalization */
  range?: { min: number; max: number };
}

/**
 * Radar data for multi-dimensional comparisons
 */
export interface RadarData {
  /** Dimension labels around the radar */
  dimensions: string[];
  /** Client values for each dimension */
  clientValues: number[];
  /** Optional benchmark values for comparison */
  benchmarkValues?: number[];
  /** Maximum value for the radar scale */
  maxValue?: number;
}

/**
 * Progress data for simple progress indicators
 */
export interface ProgressData {
  /** Current progress value */
  current: number;
  /** Target/total value */
  target: number;
  /** Optional milestone markers */
  milestones?: number[];
}

/**
 * Union type for all visualization data types
 */
export type VisualizationDataUnion =
  | GaugeData
  | BarData
  | HeatmapData
  | SparklineData
  | RadarData
  | ProgressData;

// ============================================================================
// VISUALIZATION CONTEXT
// ============================================================================

/**
 * Context information for a visualization
 */
export interface VisualizationContext {
  /** Dimension code (e.g., 'STR', 'SAL') */
  dimension?: string;
  /** Chapter code (e.g., 'GE', 'PH') */
  chapter?: string;
  /** Primary label for the visualization */
  label: string;
  /** Secondary label or description */
  sublabel?: string;
}

/**
 * Options for visualization rendering
 */
export interface VisualizationOptions {
  /** Whether to show benchmark indicator */
  showBenchmark?: boolean;
  /** Whether to show trend indicator */
  showTrend?: boolean;
  /** Size variant for the visualization */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show status label */
  showStatus?: boolean;
  /** Whether to show accessibility features */
  showAccessibility?: boolean;
}

// ============================================================================
// STRUCTURED VISUALIZATION DATA
// ============================================================================

/**
 * Structured visualization data (what IDM should contain)
 * This is the primary interface for visualization data in the system
 */
export interface VisualizationData {
  /** Unique identifier for this visualization */
  id: string;
  /** Type of visualization */
  type: VisualizationType;
  /** Data payload (typed based on visualization type) */
  data: VisualizationDataUnion;
  /** Context information for labeling */
  context: VisualizationContext;
  /** Rendering options */
  options?: VisualizationOptions;
}

/**
 * Type guard functions for visualization data types
 */
export function isGaugeData(data: VisualizationDataUnion): data is GaugeData {
  return 'value' in data && 'max' in data && !('clientValue' in data);
}

export function isBarData(data: VisualizationDataUnion): data is BarData {
  return 'clientValue' in data && 'benchmarkValue' in data;
}

export function isHeatmapData(data: VisualizationDataUnion): data is HeatmapData {
  return 'rows' in data && 'columns' in data && 'values' in data;
}

export function isSparklineData(data: VisualizationDataUnion): data is SparklineData {
  return 'points' in data && !('dimensions' in data);
}

export function isRadarData(data: VisualizationDataUnion): data is RadarData {
  return 'dimensions' in data && 'clientValues' in data;
}

export function isProgressData(data: VisualizationDataUnion): data is ProgressData {
  return 'current' in data && 'target' in data;
}

// ============================================================================
// RENDER OUTPUT FORMAT
// ============================================================================

/**
 * Metrics about the rendered visualization
 */
export interface RenderMetrics {
  /** Time taken to render in milliseconds */
  renderTimeMs: number;
  /** Size of the rendered output in bytes */
  sizeBytes: number;
  /** Whether the output is PDF-compatible */
  pdfCompatible: boolean;
}

/**
 * Rendered visualization output
 */
export interface RenderedVisualization {
  /** Unique identifier matching the source VisualizationData */
  id: string;
  /** Inline SVG string */
  svg: string;
  /** Wrapped HTML with container */
  html: string;
  /** ASCII fallback (for logging/debug only) */
  fallback: string;
  /** Rendering performance metrics */
  metrics: RenderMetrics;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a gauge visualization data object
 */
export function createGaugeVisualization(
  id: string,
  data: GaugeData,
  context: VisualizationContext,
  options?: VisualizationOptions
): VisualizationData {
  return {
    id,
    type: 'gauge',
    data,
    context,
    options,
  };
}

/**
 * Create a bar visualization data object
 */
export function createBarVisualization(
  id: string,
  data: BarData,
  context: VisualizationContext,
  options?: VisualizationOptions
): VisualizationData {
  return {
    id,
    type: 'bar',
    data,
    context,
    options,
  };
}

/**
 * Create a radar visualization data object
 */
export function createRadarVisualization(
  id: string,
  data: RadarData,
  context: VisualizationContext,
  options?: VisualizationOptions
): VisualizationData {
  return {
    id,
    type: 'radar',
    data,
    context,
    options,
  };
}
