/**
 * BizHealth.ai Reporting Module
 *
 * This module provides report generation capabilities for the BizHealth platform.
 * It includes lifecycle and tier-aware prompt generation and report generation services.
 *
 * Main exports:
 * - ReportGenerator: Main class for generating reports
 * - buildReportPrompt: Function for building report prompts
 * - REPORT_RECIPES: Pre-defined recipes for each report type
 * - Helper functions for context extraction and HTML generation
 */

// ============================================================================
// Report Prompts (Lifecycle & Tier-aware)
// ============================================================================

export {
  // Main function
  buildReportPrompt as buildLifecycleReportPrompt,

  // Utility functions
  createLifecycleContext,
  extractTier2Summary,
  recipeToReportRecipe,

  // Constants
  REPORT_RECIPES as LIFECYCLE_REPORT_RECIPES,

  // Enums
  ReportType as LifecycleReportType,

  // Types
  type ReportRecipe as LifecycleReportRecipe,
  type ReportLength,
  type ReportLayout,
  type ConfidenceDisplayMode,
  type UIPreferences,
  type LifecycleContext,
  type Tier2Summary,
  type ResourceOptimizationSummary,
  type RiskResilienceSummary,
  type ScalabilityReadinessSummary,
  type GrowthReadinessSummary,
  type MarketPositionSummary,
  type BuildReportPromptArgs,
} from './report-prompts.js';

// ============================================================================
// Report Generator Service
// ============================================================================

// Main class
export { ReportGenerator } from './report-generator.js';

// Types - Report Type
export {
  ReportType,
  ReportTypeSchema,
  REPORT_TYPE_NAMES
} from './report-generator.js';

// Types - Recipes
export type {
  ReportRecipe,
  PromptGuidelines,
  HTMLConfig
} from './report-generator.js';

// Recipe registry
export { REPORT_RECIPES } from './report-generator.js';

// Types - Input/Output
export type {
  ReportGenerationInput,
  ReportGenerationOptions,
  GeneratedReport,
  ReportMetadata
} from './report-generator.js';

// Types - Anthropic Client Interface
export type {
  AnthropicClientLike,
  ClaudeReportResponse,
  GeneratedSection
} from './report-generator.js';

// Types - Context Extraction
export type {
  LifecycleAndBenchmarkContext,
  Tier2DimensionSummary,
  Tier2Summaries,
  ChapterSummary
} from './report-generator.js';

// Helper functions
export {
  extractLifecycleAndBenchmarkContext,
  extractTier2Summaries,
  buildReportPrompt,
  buildSystemPrompt,
  wrapInBizHealthShell
} from './report-generator.js';
