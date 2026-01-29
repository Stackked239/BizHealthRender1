/**
 * BizHealth.ai Report Recipe Schema v1.0
 *
 * Defines the declarative recipe format for generating reports from the IDM.
 * Each recipe specifies:
 * - Target audience and report metadata
 * - Sections with data sources pointing into the IDM
 * - Layout hints and visual specifications
 * - Tone and formatting guidelines
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Primary audience types for reports
 */
export const AudienceSchema = z.enum([
  'owner',
  'executive',
  'employees',
  'manager_sales_marketing',
  'manager_operations',
  'manager_financials',
  'manager_it_technology',
  'manager_strategy'
]);
export type Audience = z.infer<typeof AudienceSchema>;

/**
 * Visual types for sections
 */
export const VisualTypeSchema = z.enum([
  'score_tile',
  'score_tiles_row',
  'radar_chart',
  'bar_chart',
  'progress_bar',
  'table',
  'checklist',
  'timeline',
  'matrix',
  'text_block',
  'narrative',
  'bullet_list',
  'numbered_list',
  'callout_box',
  'metric_card',
  'comparison_table',
  'risk_matrix',
  'roadmap_timeline',
  'kpi_dashboard',
  'none'
]);
export type VisualType = z.infer<typeof VisualTypeSchema>;

/**
 * Tone tags for content generation
 */
export const ToneTagSchema = z.enum([
  'executive',
  'strategic',
  'tactical',
  'technical',
  'supportive',
  'directive',
  'analytical',
  'motivational',
  'urgent',
  'neutral',
  'detailed',
  'summary',
  'action_oriented',
  'educational'
]);
export type ToneTag = z.infer<typeof ToneTagSchema>;

// ============================================================================
// DATA SOURCE SCHEMA
// ============================================================================

/**
 * Filter specification for data sources
 */
export const DataFilterSchema = z.object({
  field: z.string().optional(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains']).optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  dimension_codes: z.array(z.string()).optional(),
  chapter_codes: z.array(z.string()).optional(),
  type: z.string().optional(),
  min_score: z.number().optional(),
  max_score: z.number().optional()
}).optional();
export type DataFilter = z.infer<typeof DataFilterSchema>;

/**
 * Sort specification for data sources
 */
export const DataSortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc')
}).optional();
export type DataSort = z.infer<typeof DataSortSchema>;

/**
 * Data source specification
 * Points to data within the IDM using JSONPath-like syntax
 */
export const DataSourceSchema = z.object({
  id: z.string(),
  from: z.string().describe('JSONPath or DSL pointing into IDM, e.g., "scores_summary.overall_health_score", "dimensions[STR]", "recommendations"'),
  filters: z.array(DataFilterSchema).optional(),
  sort: DataSortSchema,
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});
export type DataSource = z.infer<typeof DataSourceSchema>;

// ============================================================================
// LAYOUT HINTS SCHEMA
// ============================================================================

/**
 * Layout hints for section rendering
 */
export const LayoutHintsSchema = z.object({
  columns: z.number().int().min(1).max(4).optional(),
  spacing: z.enum(['compact', 'normal', 'relaxed']).optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  page_break_before: z.boolean().optional(),
  page_break_after: z.boolean().optional(),
  max_items: z.number().int().positive().optional(),
  show_score_badge: z.boolean().optional(),
  show_trend_indicator: z.boolean().optional(),
  collapsible: z.boolean().optional(),
  highlight_threshold: z.number().optional()
}).optional();
export type LayoutHints = z.infer<typeof LayoutHintsSchema>;

// ============================================================================
// SECTION SCHEMA
// ============================================================================

/**
 * Report section specification
 */
export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  data_sources: z.array(DataSourceSchema),
  tone_tags: z.array(ToneTagSchema).optional(),
  visual_type: VisualTypeSchema.optional(),
  layout_hints: LayoutHintsSchema,
  subsections: z.array(z.lazy(() => SectionSchema)).optional()
});
export type Section = z.infer<typeof SectionSchema>;

// ============================================================================
// RECIPE SCHEMA
// ============================================================================

/**
 * Page range specification
 */
export const PageRangeSchema = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive()
});
export type PageRange = z.infer<typeof PageRangeSchema>;

/**
 * Brand configuration
 */
export const BrandConfigSchema = z.object({
  primary_color: z.string().default('#212653'),
  accent_color: z.string().default('#969423'),
  font_heading: z.string().default('Montserrat'),
  font_body: z.string().default('Open Sans'),
  logo_url: z.string().optional()
}).optional();
export type BrandConfig = z.infer<typeof BrandConfigSchema>;

/**
 * Complete report recipe
 */
export const RecipeSchema = z.object({
  report_id: z.string(),
  name: z.string(),
  version: z.string().default('1.0.0'),
  primary_audience: AudienceSchema,
  description: z.string().optional(),
  target_page_range: PageRangeSchema,
  brand_config: BrandConfigSchema,
  default_tone_tags: z.array(ToneTagSchema).optional(),
  sections: z.array(SectionSchema)
});
export type Recipe = z.infer<typeof RecipeSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate and parse recipe
 */
export function validateRecipe(data: unknown): Recipe {
  return RecipeSchema.parse(data);
}

/**
 * Safe validate recipe without throwing
 */
export function safeValidateRecipe(data: unknown) {
  return RecipeSchema.safeParse(data);
}

/**
 * Validate data source
 */
export function validateDataSource(data: unknown): DataSource {
  return DataSourceSchema.parse(data);
}

/**
 * Validate section
 */
export function validateSection(data: unknown): Section {
  return SectionSchema.parse(data);
}

// ============================================================================
// HELPER TYPES FOR RECIPE BUILDER
// ============================================================================

/**
 * Recipe builder options
 */
export interface RecipeBuilderOptions {
  reportId: string;
  name: string;
  audience: Audience;
  pageRange: PageRange;
  description?: string;
}

/**
 * Section builder options
 */
export interface SectionBuilderOptions {
  id: string;
  title: string;
  description?: string;
  visualType?: VisualType;
  toneTag?: ToneTag[];
  layoutHints?: LayoutHints;
}

// ============================================================================
// DATA SOURCE PATH CONSTANTS
// ============================================================================

/**
 * Common IDM paths for data sources
 */
export const IDM_PATHS = {
  // Meta
  META: 'meta',
  ASSESSMENT_RUN_ID: 'meta.assessment_run_id',
  COMPANY_PROFILE_ID: 'meta.company_profile_id',
  CREATED_AT: 'meta.created_at',

  // Scores Summary
  SCORES_SUMMARY: 'scores_summary',
  OVERALL_HEALTH_SCORE: 'scores_summary.overall_health_score',
  HEALTH_DESCRIPTOR: 'scores_summary.descriptor',
  TRAJECTORY: 'scores_summary.trajectory',
  KEY_IMPERATIVES: 'scores_summary.key_imperatives',

  // Chapters
  CHAPTERS: 'chapters',
  CHAPTER_BY_CODE: (code: string) => `chapters[chapter_code=${code}]`,

  // Dimensions
  DIMENSIONS: 'dimensions',
  DIMENSION_BY_CODE: (code: string) => `dimensions[dimension_code=${code}]`,
  DIMENSIONS_BY_CHAPTER: (chapterCode: string) => `dimensions[chapter_code=${chapterCode}]`,

  // Sub-indicators
  SUB_INDICATORS: (dimensionCode: string) => `dimensions[dimension_code=${dimensionCode}].sub_indicators`,

  // Questions
  QUESTIONS: 'questions',
  QUESTIONS_BY_DIMENSION: (dimensionCode: string) => `questions[dimension_code=${dimensionCode}]`,

  // Findings
  FINDINGS: 'findings',
  FINDINGS_STRENGTHS: 'findings[type=strength]',
  FINDINGS_GAPS: 'findings[type=gap]',
  FINDINGS_RISKS: 'findings[type=risk]',
  FINDINGS_OPPORTUNITIES: 'findings[type=opportunity]',
  FINDINGS_BY_DIMENSION: (dimensionCode: string) => `findings[dimension_code=${dimensionCode}]`,

  // Recommendations
  RECOMMENDATIONS: 'recommendations',
  RECOMMENDATIONS_90_DAYS: 'recommendations[horizon=90_days]',
  RECOMMENDATIONS_12_MONTHS: 'recommendations[horizon=12_months]',
  RECOMMENDATIONS_24_MONTHS_PLUS: 'recommendations[horizon=24_months_plus]',
  RECOMMENDATIONS_BY_DIMENSION: (dimensionCode: string) => `recommendations[dimension_code=${dimensionCode}]`,

  // Quick Wins
  QUICK_WINS: 'quick_wins',

  // Risks
  RISKS: 'risks',
  RISKS_BY_DIMENSION: (dimensionCode: string) => `risks[dimension_code=${dimensionCode}]`,

  // Roadmap
  ROADMAP: 'roadmap',
  ROADMAP_PHASES: 'roadmap.phases'
} as const;

