/**
 * BizHealth.ai Visualization Aggregator
 *
 * Aggregates visualizations from Phase 1-3 analysis outputs into
 * a structured collection for Phase 5 rendering.
 *
 * Works alongside the IDM Consolidator to extend IDM with visualization data.
 *
 * @module visualization-aggregator
 * @version 1.0.0
 */

import type { Visualization } from '../prompts/schemas/visualization-output.schema.js';
import type { ParseResult } from '../prompts/parsers/analysis-response-parser.js';
import type { IDM, ChapterCode, DimensionCode } from '../types/idm.types.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Aggregated visualizations from all analysis phases
 */
export interface VisualizationAggregation {
  /** All visualizations from all sources */
  all: Visualization[];
  /** Visualizations grouped by dimension code */
  byDimension: Map<string, Visualization[]>;
  /** Visualizations grouped by chapter code */
  byChapter: Map<string, Visualization[]>;
  /** Visualizations grouped by type */
  byType: Map<string, Visualization[]>;
  /** Key visualizations for executive summary (gauges at section_header) */
  heroVisualizations: Visualization[];
  /** Metadata about the aggregation */
  metadata: {
    totalCount: number;
    byType: Record<string, number>;
    sources: string[];
    generatedAt: string;
  };
}

/**
 * IDM extended with visualization data
 */
export interface IDMWithVisualizations extends IDM {
  visualizations: {
    all: Visualization[];
    heroVisualizations: Visualization[];
    byChapter: Record<string, Visualization[]>;
    byDimension: Record<string, Visualization[]>;
    metadata: {
      totalCount: number;
      byType: Record<string, number>;
      generatedAt: string;
    };
  };
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate visualizations from all Phase 1-3 parse results
 *
 * @param parseResults - Map of analysis type to parse result
 * @returns Aggregated visualization collection
 */
export function aggregateVisualizations(
  parseResults: Map<string, ParseResult>
): VisualizationAggregation {
  const all: Visualization[] = [];
  const byDimension = new Map<string, Visualization[]>();
  const byChapter = new Map<string, Visualization[]>();
  const byType = new Map<string, Visualization[]>();
  const heroVisualizations: Visualization[] = [];
  const sources: string[] = [];

  // Track seen IDs to handle duplicates
  const seenIds = new Set<string>();

  for (const [analysisType, result] of parseResults) {
    sources.push(analysisType);

    for (const viz of result.visualizations) {
      // Handle duplicate IDs by prefixing with analysis type
      let id = viz.id;
      if (seenIds.has(id)) {
        id = `${analysisType}_${viz.id}`;
        console.warn(
          `[VIZ AGGREGATOR] Duplicate ID resolved: ${viz.id} -> ${id}`
        );
      }
      seenIds.add(id);

      // Create visualization with potentially updated ID
      const vizWithId = { ...viz, id };
      all.push(vizWithId);

      // Index by dimension
      if (viz.context.dimension) {
        const dimViz = byDimension.get(viz.context.dimension) || [];
        dimViz.push(vizWithId);
        byDimension.set(viz.context.dimension, dimViz);
      }

      // Index by chapter
      if (viz.context.chapter) {
        const chapViz = byChapter.get(viz.context.chapter) || [];
        chapViz.push(vizWithId);
        byChapter.set(viz.context.chapter, chapViz);
      }

      // Index by type
      const typeViz = byType.get(viz.type) || [];
      typeViz.push(vizWithId);
      byType.set(viz.type, typeViz);

      // Identify hero visualizations (gauges at section_header placement)
      if (viz.type === 'gauge' && viz.context.placement === 'section_header') {
        heroVisualizations.push(vizWithId);
      }
    }
  }

  // Build type count summary
  const typeCount: Record<string, number> = {};
  for (const [type, vizs] of byType) {
    typeCount[type] = vizs.length;
  }

  return {
    all,
    byDimension,
    byChapter,
    byType,
    heroVisualizations,
    metadata: {
      totalCount: all.length,
      byType: typeCount,
      sources,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Aggregate visualizations from raw analysis results
 *
 * @param analysisResults - Array of analysis results with response content
 * @param parser - Parser function to extract visualizations
 * @returns Aggregated visualization collection
 */
export function aggregateFromAnalysisResults(
  analysisResults: Array<{ analysisType: string; response: string }>,
  parser: (response: string, type: string) => ParseResult
): VisualizationAggregation {
  const parseResults = new Map<string, ParseResult>();

  for (const { analysisType, response } of analysisResults) {
    const result = parser(response, analysisType);
    parseResults.set(analysisType, result);
  }

  return aggregateVisualizations(parseResults);
}

// ============================================================================
// IDM EXTENSION
// ============================================================================

/**
 * Extend an IDM with visualization data
 *
 * @param idm - The base IDM
 * @param visualizations - Aggregated visualizations
 * @returns IDM extended with visualization data
 */
export function extendIDMWithVisualizations(
  idm: IDM,
  visualizations: VisualizationAggregation
): IDMWithVisualizations {
  return {
    ...idm,
    visualizations: {
      all: visualizations.all,
      heroVisualizations: visualizations.heroVisualizations,
      byChapter: Object.fromEntries(visualizations.byChapter),
      byDimension: Object.fromEntries(visualizations.byDimension),
      metadata: {
        totalCount: visualizations.metadata.totalCount,
        byType: visualizations.metadata.byType,
        generatedAt: visualizations.metadata.generatedAt,
      },
    },
  };
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get visualization by ID
 */
export function getVisualizationById(
  aggregation: VisualizationAggregation,
  id: string
): Visualization | undefined {
  return aggregation.all.find((v) => v.id === id);
}

/**
 * Get visualizations for a specific chapter
 */
export function getVisualizationsForChapter(
  aggregation: VisualizationAggregation,
  chapter: ChapterCode
): Visualization[] {
  return aggregation.byChapter.get(chapter) || [];
}

/**
 * Get visualizations for a specific dimension
 */
export function getVisualizationsForDimension(
  aggregation: VisualizationAggregation,
  dimension: DimensionCode
): Visualization[] {
  return aggregation.byDimension.get(dimension) || [];
}

/**
 * Get all gauge visualizations (for score displays)
 */
export function getGaugeVisualizations(
  aggregation: VisualizationAggregation
): Visualization[] {
  return aggregation.byType.get('gauge') || [];
}

/**
 * Get all comparison visualizations
 */
export function getComparisonVisualizations(
  aggregation: VisualizationAggregation
): Visualization[] {
  return aggregation.byType.get('comparison') || [];
}

/**
 * Get all radar visualizations
 */
export function getRadarVisualizations(
  aggregation: VisualizationAggregation
): Visualization[] {
  return aggregation.byType.get('radar') || [];
}

/**
 * Get visualizations by placement type
 */
export function getVisualizationsByPlacement(
  aggregation: VisualizationAggregation,
  placement: 'section_header' | 'inline' | 'sidebar' | 'appendix' | 'comparison_block'
): Visualization[] {
  return aggregation.all.filter((v) => v.context.placement === placement);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate visualization aggregation for completeness
 */
export function validateAggregation(
  aggregation: VisualizationAggregation,
  requiredTypes: string[] = ['gauge']
): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check for required types
  for (const type of requiredTypes) {
    if (!aggregation.byType.has(type) || aggregation.byType.get(type)!.length === 0) {
      missing.push(`No ${type} visualizations found`);
    }
  }

  // Check for hero visualizations
  if (aggregation.heroVisualizations.length === 0) {
    warnings.push('No hero visualizations (section_header gauges) found');
  }

  // Check for orphaned references (visualizations with chapter/dimension that don't exist)
  // This would require IDM data to validate against

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate a summary of the visualization aggregation
 */
export function generateAggregationSummary(
  aggregation: VisualizationAggregation
): string {
  const lines: string[] = [
    `=== Visualization Aggregation Summary ===`,
    `Total Visualizations: ${aggregation.metadata.totalCount}`,
    `Hero Visualizations: ${aggregation.heroVisualizations.length}`,
    ``,
    `By Type:`,
    ...Object.entries(aggregation.metadata.byType).map(
      ([type, count]) => `  - ${type}: ${count}`
    ),
    ``,
    `By Chapter:`,
    ...Array.from(aggregation.byChapter.entries()).map(
      ([chapter, vizs]) => `  - ${chapter}: ${vizs.length}`
    ),
    ``,
    `By Dimension:`,
    ...Array.from(aggregation.byDimension.entries()).map(
      ([dim, vizs]) => `  - ${dim}: ${vizs.length}`
    ),
    ``,
    `Sources: ${aggregation.metadata.sources.join(', ')}`,
    `Generated: ${aggregation.metadata.generatedAt}`,
  ];

  return lines.join('\n');
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Export visualizations to a flat array for JSON serialization
 */
export function exportVisualizationsForJSON(
  aggregation: VisualizationAggregation
): Visualization[] {
  return aggregation.all;
}

/**
 * Export visualizations grouped by chapter for report sections
 */
export function exportVisualizationsByChapter(
  aggregation: VisualizationAggregation
): Record<string, Visualization[]> {
  return Object.fromEntries(aggregation.byChapter);
}
