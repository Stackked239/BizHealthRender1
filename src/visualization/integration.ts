/**
 * BizHealth.ai Visualization Integration Module
 *
 * Provides integration hooks for processing visualizations in the report pipeline.
 * Phase 1: Diagnostic logging of ASCII patterns
 * Phase 2: Replacement of ASCII with SVG renderings
 *
 * @module integration
 * @version 1.0.0
 */

import {
  detectASCII,
  logASCIIDetection,
  generateASCIIReport,
  hasLikelyASCII,
  type ASCIIDetectionResult,
  type ASCIIDetectionContext,
} from './ascii-detector.js';
import {
  renderGaugeHTML,
  generateASCIIFallback,
  validateSVG,
} from './components/gauge.js';
import type {
  VisualizationData,
  RenderedVisualization,
  GaugeData,
  VisualizationDataUnion,
  isGaugeData,
} from '../types/visualization.types.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for visualization processing
 */
export interface VisualizationProcessingOptions {
  /** Pipeline phase identifier */
  phase: string;
  /** Report type (e.g., 'comprehensive', 'summary') */
  reportType: string;
  /** Company identifier */
  companyId?: string;
  /** Whether to log ASCII detections */
  logDetections?: boolean;
  /** Whether to generate detailed reports */
  generateReports?: boolean;
}

/**
 * Result of visualization processing
 */
export interface VisualizationProcessingResult {
  /** Total ASCII patterns detected */
  asciiDetectedCount: number;
  /** Detection results by field */
  detectionsByField: Map<string, ASCIIDetectionResult>;
  /** Generated reports (if enabled) */
  reports: string[];
  /** Any processing errors */
  errors: string[];
}

// ============================================================================
// DIAGNOSTIC PROCESSING
// ============================================================================

/**
 * Process IDM content and detect ASCII visualizations
 *
 * Phase 1 (Current): Log ASCII detection for diagnostics
 * Phase 2 (Next): Replace ASCII with SVG using structured data
 *
 * @param idm - The Insights Data Model object
 * @param options - Processing options
 * @returns Processing result with detection summary
 */
export function processVisualizations(
  idm: unknown,
  options: VisualizationProcessingOptions
): VisualizationProcessingResult {
  const result: VisualizationProcessingResult = {
    asciiDetectedCount: 0,
    detectionsByField: new Map(),
    reports: [],
    errors: [],
  };

  try {
    // Extract all narrative fields from the IDM
    const narrativeFields = extractNarrativeFields(idm);

    for (const [fieldPath, content] of Object.entries(narrativeFields)) {
      if (typeof content !== 'string') continue;

      // Quick check before full detection
      if (!hasLikelyASCII(content)) continue;

      const detection = detectASCII(content);

      if (detection.totalMatches > 0) {
        result.asciiDetectedCount += detection.totalMatches;
        result.detectionsByField.set(fieldPath, detection);

        const context: ASCIIDetectionContext = {
          phase: options.phase,
          section: fieldPath,
          reportType: options.reportType,
          companyId: options.companyId,
        };

        // Log if enabled (default: true)
        if (options.logDetections !== false) {
          logASCIIDetection(detection, context);
        }

        // Generate report if enabled
        if (options.generateReports) {
          result.reports.push(generateASCIIReport(detection, context));
        }
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during processing';
    result.errors.push(errorMessage);
    console.error('[VISUALIZATION] Processing error:', errorMessage);
  }

  return result;
}

/**
 * Extract all narrative text fields from an IDM object
 *
 * @param obj - Object to extract fields from
 * @param path - Current path (for recursion)
 * @returns Object with field paths as keys and content as values
 */
function extractNarrativeFields(
  obj: unknown,
  path: string = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!obj || typeof obj !== 'object') return result;

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      Object.assign(result, extractNarrativeFields(item, itemPath));
    });
    return result;
  }

  // Handle objects
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      // Only include fields that are likely narratives (>50 chars)
      if (value.length > 50) {
        result[currentPath] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, extractNarrativeFields(value, currentPath));
    }
  }

  return result;
}

// ============================================================================
// VISUALIZATION RENDERING
// ============================================================================

/**
 * Render a visualization from structured data
 * Use this when IDM contains proper VisualizationData objects
 *
 * @param vizData - Structured visualization data
 * @returns Rendered visualization with SVG and HTML
 */
export function renderVisualization(
  vizData: VisualizationData
): RenderedVisualization {
  const startTime = performance.now();

  let svg: string;
  let html: string;
  let fallback: string;

  switch (vizData.type) {
    case 'gauge': {
      const gaugeData = vizData.data as GaugeData;
      html = renderGaugeHTML(gaugeData, {
        label: vizData.context.label,
        sublabel: vizData.context.sublabel,
        size: vizData.options?.size,
        showBenchmark: vizData.options?.showBenchmark,
        showTrend: vizData.options?.showTrend,
        showStatus: vizData.options?.showStatus,
      });
      // Extract SVG from HTML
      const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/);
      svg = svgMatch ? svgMatch[0] : '';
      fallback = generateASCIIFallback(gaugeData, vizData.context.label);
      break;
    }

    case 'bar':
    case 'heatmap':
    case 'sparkline':
    case 'radar':
    case 'progress':
      // These will be implemented in Phase 2
      throw new Error(`Visualization type '${vizData.type}' not yet implemented`);

    default:
      throw new Error(`Unsupported visualization type: ${vizData.type}`);
  }

  const endTime = performance.now();

  // Validate the SVG
  const isValidSvg = validateSVG(svg);
  if (!isValidSvg) {
    console.warn(`[VISUALIZATION] Generated SVG may be invalid for: ${vizData.id}`);
  }

  return {
    id: vizData.id,
    svg,
    html,
    fallback,
    metrics: {
      renderTimeMs: Math.round((endTime - startTime) * 100) / 100,
      sizeBytes: new TextEncoder().encode(html).length,
      pdfCompatible: isValidSvg,
    },
  };
}

/**
 * Batch render multiple visualizations
 *
 * @param visualizations - Array of visualization data
 * @returns Array of rendered visualizations
 */
export function renderVisualizations(
  visualizations: VisualizationData[]
): RenderedVisualization[] {
  const results: RenderedVisualization[] = [];

  for (const viz of visualizations) {
    try {
      results.push(renderVisualization(viz));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown rendering error';
      console.error(`[VISUALIZATION] Failed to render ${viz.id}:`, errorMessage);

      // Return error placeholder
      results.push({
        id: viz.id,
        svg: '',
        html: `<div class="bh-visualization-error">Visualization unavailable</div>`,
        fallback: `[Error: ${errorMessage}]`,
        metrics: {
          renderTimeMs: 0,
          sizeBytes: 0,
          pdfCompatible: false,
        },
      });
    }
  }

  return results;
}

// ============================================================================
// PHASE 5 INTEGRATION HOOKS
// ============================================================================

/**
 * Hook to be called at the start of Phase 5 processing
 * Performs diagnostic ASCII detection on incoming content
 *
 * @param idm - The IDM being processed
 * @param reportType - Type of report being generated
 * @returns Diagnostic summary
 */
export function onPhase5Start(
  idm: unknown,
  reportType: string
): { asciiCount: number; summary: string } {
  const result = processVisualizations(idm, {
    phase: 'phase5-start',
    reportType,
    logDetections: true,
    generateReports: false,
  });

  const summary =
    result.asciiDetectedCount > 0
      ? `Detected ${result.asciiDetectedCount} ASCII visualization(s) in ${result.detectionsByField.size} field(s)`
      : 'No ASCII visualizations detected';

  return {
    asciiCount: result.asciiDetectedCount,
    summary,
  };
}

/**
 * Hook to be called after narrative content is assembled
 * Final check for ASCII patterns before PDF generation
 *
 * @param htmlContent - Assembled HTML content
 * @param reportType - Type of report
 * @returns Warning if ASCII patterns found
 */
export function onPrePdfGeneration(
  htmlContent: string,
  reportType: string
): { hasAscii: boolean; warning?: string } {
  if (!hasLikelyASCII(htmlContent)) {
    return { hasAscii: false };
  }

  const detection = detectASCII(htmlContent);

  if (detection.totalMatches > 0) {
    logASCIIDetection(detection, {
      phase: 'pre-pdf',
      section: 'assembled-html',
      reportType,
    });

    return {
      hasAscii: true,
      warning: `WARNING: ${detection.totalMatches} ASCII visualization(s) detected in final HTML. These may not render correctly in PDF.`,
    };
  }

  return { hasAscii: false };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Re-export core types and functions for convenience
 */
export { detectASCII, logASCIIDetection, hasLikelyASCII } from './ascii-detector.js';
export {
  renderGauge,
  renderGaugeHTML,
  renderGaugeGrid,
  validateSVG,
} from './components/gauge.js';
export type {
  ASCIIMatch,
  ASCIIDetectionResult,
  ASCIIDetectionContext,
} from './ascii-detector.js';
export type { GaugeOptions } from './components/gauge.js';
