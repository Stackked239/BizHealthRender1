/**
 * BizHealth.ai Visualization Module
 *
 * This module provides visualization capabilities for BizHealth reports,
 * including ASCII detection diagnostics and SVG rendering components.
 *
 * @module visualization
 * @version 1.0.0
 */

// ============================================================================
// ASCII DETECTION (Diagnostic)
// ============================================================================

export {
  detectASCII,
  logASCIIDetection,
  generateASCIIReport,
  detectASCIIInFields,
  hasLikelyASCII,
  type ASCIIMatch,
  type ASCIIMatchType,
  type ASCIIDetectionResult,
  type ASCIIDetectionContext,
  type DetectionConfidence,
  type MatchLocation,
} from './ascii-detector.js';

// ============================================================================
// SVG COMPONENTS
// ============================================================================

export {
  renderGauge,
  renderGaugeHTML,
  renderGaugeGrid,
  generateASCIIFallback,
  validateSVG,
  type GaugeOptions,
} from './components/gauge.js';

// ============================================================================
// INTEGRATION
// ============================================================================

export {
  processVisualizations,
  renderVisualization,
  renderVisualizations,
  onPhase5Start,
  onPrePdfGeneration,
  type VisualizationProcessingOptions,
  type VisualizationProcessingResult,
} from './integration.js';

// ============================================================================
// TYPES (re-exported from types module)
// ============================================================================

export type {
  VisualizationType,
  StatusBand,
  GaugeData,
  BarData,
  HeatmapData,
  SparklineData,
  RadarData,
  ProgressData,
  VisualizationDataUnion,
  VisualizationContext,
  VisualizationOptions,
  VisualizationData,
  RenderMetrics,
  RenderedVisualization,
} from '../types/visualization.types.js';

export {
  BIZHEALTH_COLORS,
  STATUS_BAND_THRESHOLDS,
  getStatusBandFromScore,
  getStatusBandColor,
  createGaugeVisualization,
  createBarVisualization,
  createRadarVisualization,
  isGaugeData,
  isBarData,
  isHeatmapData,
  isSparklineData,
  isRadarData,
  isProgressData,
} from '../types/visualization.types.js';
