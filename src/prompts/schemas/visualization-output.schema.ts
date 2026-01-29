/**
 * Schema for structured visualization output from Phase 1-3 analyses
 *
 * This schema defines the JSON structure that Claude must output
 * for all visualizations. Phase 5 uses this to render SVG graphics.
 *
 * @module visualization-output.schema
 * @version 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// PLACEMENT AND CONTEXT SCHEMAS
// ============================================================================

/**
 * Visualization placement hints for report layout
 */
export const PlacementSchema = z.enum([
  'section_header', // At top of a section
  'inline', // Within narrative flow
  'sidebar', // Alongside content
  'appendix', // End of section/report
  'comparison_block', // Grouped with other visualizations
]);

export type Placement = z.infer<typeof PlacementSchema>;

/**
 * Trend direction for time-series data
 */
export const TrendSchema = z.enum(['improving', 'flat', 'declining']);

export type Trend = z.infer<typeof TrendSchema>;

/**
 * Status classification for metrics
 */
export const StatusSchema = z.enum(['good', 'caution', 'critical']);

export type Status = z.infer<typeof StatusSchema>;

// ============================================================================
// BASE VISUALIZATION SCHEMA
// ============================================================================

/**
 * Base visualization structure that all types extend
 */
export const BaseVisualizationSchema = z.object({
  id: z
    .string()
    .describe('Unique identifier, e.g., "strategy_health_score"'),
  type: z.enum([
    'gauge',
    'bar',
    'heatmap',
    'sparkline',
    'radar',
    'progress',
    'comparison',
  ]),
  context: z.object({
    dimension: z
      .string()
      .optional()
      .describe('Dimension code: STR, SAL, MKT, etc.'),
    chapter: z.string().optional().describe('Chapter code: GE, PH, PL, RS'),
    label: z.string().describe('Display label for the visualization'),
    sublabel: z.string().optional().describe('Secondary label or unit'),
    placement: PlacementSchema.default('section_header'),
    narrativeRef: z
      .string()
      .optional()
      .describe('Reference to related narrative section'),
  }),
});

export type BaseVisualization = z.infer<typeof BaseVisualizationSchema>;

// ============================================================================
// SPECIFIC VISUALIZATION SCHEMAS
// ============================================================================

/**
 * Gauge visualization (single value with max)
 * Used for health scores, performance metrics, completion percentages
 */
export const GaugeVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('gauge'),
  data: z.object({
    value: z.number().min(0).max(100).describe('Current score value'),
    max: z.number().default(100).describe('Maximum possible value'),
    benchmark: z
      .number()
      .optional()
      .describe('Industry benchmark for comparison'),
    trend: TrendSchema.optional().describe('Direction of change'),
    previousValue: z
      .number()
      .optional()
      .describe('Previous period value for trend'),
  }),
});

export type GaugeVisualization = z.infer<typeof GaugeVisualizationSchema>;

/**
 * Bar comparison visualization (client vs benchmark)
 * Used for comparing company performance against industry standards
 */
export const BarVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('bar'),
  data: z.object({
    clientValue: z.number().describe('Client/company value'),
    benchmarkValue: z.number().describe('Industry benchmark value'),
    unit: z.string().optional().describe('Unit of measurement'),
    scale: z
      .object({
        min: z.number().default(0),
        max: z.number(),
      })
      .optional(),
    higherIsBetter: z
      .boolean()
      .default(true)
      .describe('Whether higher values are positive'),
  }),
});

export type BarVisualization = z.infer<typeof BarVisualizationSchema>;

/**
 * Heatmap visualization (matrix of values)
 * Used for dimension x chapter matrices, risk matrices
 */
export const HeatmapVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('heatmap'),
  data: z.object({
    rows: z.array(z.string()).describe('Row labels'),
    columns: z.array(z.string()).describe('Column labels'),
    values: z
      .array(z.array(z.number()))
      .describe('Matrix of values (rows x columns)'),
    scale: z
      .object({
        min: z.number().default(0),
        max: z.number().default(100),
      })
      .optional(),
  }),
});

export type HeatmapVisualization = z.infer<typeof HeatmapVisualizationSchema>;

/**
 * Sparkline visualization (trend over time)
 * Used for showing trends, historical data
 */
export const SparklineVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('sparkline'),
  data: z.object({
    points: z.array(z.number()).min(3).describe('Data points for the line'),
    labels: z.array(z.string()).optional().describe('Optional x-axis labels'),
    highlightLast: z
      .boolean()
      .default(true)
      .describe('Highlight the most recent point'),
  }),
});

export type SparklineVisualization = z.infer<
  typeof SparklineVisualizationSchema
>;

/**
 * Radar visualization (multi-dimensional comparison)
 * Used for comparing performance across multiple dimensions
 */
export const RadarVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('radar'),
  data: z.object({
    dimensions: z.array(z.string()).min(3).describe('Dimension labels'),
    clientValues: z
      .array(z.number())
      .describe('Client values for each dimension'),
    benchmarkValues: z.array(z.number()).optional().describe('Benchmark values'),
    scale: z
      .object({
        min: z.number().default(0),
        max: z.number().default(100),
      })
      .optional(),
  }),
});

export type RadarVisualization = z.infer<typeof RadarVisualizationSchema>;

/**
 * Progress visualization (simple progress indicator)
 * Used for completion status, goal progress
 */
export const ProgressVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('progress'),
  data: z.object({
    current: z.number().describe('Current progress value'),
    target: z.number().describe('Target/total value'),
    milestones: z.array(z.number()).optional().describe('Milestone markers'),
  }),
});

export type ProgressVisualization = z.infer<typeof ProgressVisualizationSchema>;

/**
 * Comparison block (side-by-side metrics)
 * Used for comparing multiple related metrics
 */
export const ComparisonVisualizationSchema = BaseVisualizationSchema.extend({
  type: z.literal('comparison'),
  data: z.object({
    metrics: z
      .array(
        z.object({
          label: z.string(),
          clientValue: z.number(),
          benchmarkValue: z.number(),
          unit: z.string().optional(),
          status: StatusSchema.optional(),
        })
      )
      .min(2)
      .max(6),
  }),
});

export type ComparisonVisualization = z.infer<
  typeof ComparisonVisualizationSchema
>;

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union of all visualization types
 */
export const VisualizationSchema = z.discriminatedUnion('type', [
  GaugeVisualizationSchema,
  BarVisualizationSchema,
  HeatmapVisualizationSchema,
  SparklineVisualizationSchema,
  RadarVisualizationSchema,
  ProgressVisualizationSchema,
  ComparisonVisualizationSchema,
]);

export type Visualization = z.infer<typeof VisualizationSchema>;

// ============================================================================
// ANALYSIS OUTPUT SCHEMA
// ============================================================================

/**
 * Narrative section structure
 */
export const NarrativeSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().describe('Markdown-formatted narrative content'),
  visualizationRefs: z
    .array(z.string())
    .optional()
    .describe('IDs of related visualizations'),
});

export type NarrativeSection = z.infer<typeof NarrativeSectionSchema>;

/**
 * Complete analysis output structure
 */
export const AnalysisOutputSchema = z.object({
  analysisType: z.string().describe('Type of analysis performed'),
  narrative: z.object({
    executiveSummary: z.string().describe('2-3 sentence overview'),
    sections: z.array(NarrativeSectionSchema),
  }),
  visualizations: z.array(VisualizationSchema).describe('Structured visualization data'),
  metadata: z.object({
    dimensionsCovered: z.array(z.string()),
    confidenceLevel: z.enum(['high', 'medium', 'low']),
    dataQuality: z.enum(['complete', 'partial', 'limited']),
  }),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a single visualization
 */
export function validateVisualization(data: unknown): Visualization | null {
  const result = VisualizationSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate an array of visualizations
 */
export function validateVisualizations(data: unknown[]): {
  valid: Visualization[];
  invalid: number;
} {
  const valid: Visualization[] = [];
  let invalid = 0;

  for (const item of data) {
    const result = VisualizationSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid++;
    }
  }

  return { valid, invalid };
}

/**
 * Validate complete analysis output
 */
export function validateAnalysisOutput(data: unknown): {
  success: boolean;
  data?: AnalysisOutput;
  errors?: z.ZodError;
} {
  const result = AnalysisOutputSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGaugeVisualization(viz: Visualization): viz is GaugeVisualization {
  return viz.type === 'gauge';
}

export function isBarVisualization(viz: Visualization): viz is BarVisualization {
  return viz.type === 'bar';
}

export function isHeatmapVisualization(viz: Visualization): viz is HeatmapVisualization {
  return viz.type === 'heatmap';
}

export function isSparklineVisualization(viz: Visualization): viz is SparklineVisualization {
  return viz.type === 'sparkline';
}

export function isRadarVisualization(viz: Visualization): viz is RadarVisualization {
  return viz.type === 'radar';
}

export function isProgressVisualization(viz: Visualization): viz is ProgressVisualization {
  return viz.type === 'progress';
}

export function isComparisonVisualization(viz: Visualization): viz is ComparisonVisualization {
  return viz.type === 'comparison';
}
