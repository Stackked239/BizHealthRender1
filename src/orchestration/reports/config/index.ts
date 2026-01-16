/**
 * Report Configuration Index
 *
 * Exports all configuration for Owner's Report and Comprehensive Report integration.
 */

export {
  SECTION_MAPPINGS,
  getSectionMapping,
  getComprehensiveTitle,
  getReference,
  getAllSectionMappings,
} from './section-mapping.js';

export type { SectionMapping } from './section-mapping.js';

export {
  OWNER_REPORT_CONSTRAINTS,
  INVESTMENT_BANDS,
  getInvestmentBand,
  formatCurrencyRange,
  formatCurrency,
} from './owner-report-constraints.js';

// Report Visual Configuration
export {
  REPORT_VISUAL_CONFIGS,
  getReportVisualConfig,
  getAllReportTypes,
  getTotalTargetVisualCount,
  getTotalMinVisualCount,
  validateReportVisuals,
} from './report-visuals.config.js';
export type { VisualDefinition, ReportVisualConfig } from './report-visuals.config.js';

// Manager Report Section Types (discriminated union)
export {
  isCompanySnapshotSection,
  isDimensionDeepDiveSection,
  isDepartmentRoadmapSection,
  isRiskOverviewSection,
  isMetricsDashboardSection,
  isManagerClosingSection,
  isQuickWinsHighlightSection,
  isRecommendationsSummarySection,
  isFindingsOverviewSection,
} from './section-types.js';

export type {
  BaseRecipeSection,
  CompanySnapshotSection,
  DimensionDeepDiveSection,
  DepartmentRoadmapSection,
  RiskOverviewSection,
  MetricsDashboardSection,
  ManagerClosingSection,
  QuickWinsHighlightSection,
  RecommendationsSummarySection,
  FindingsOverviewSection,
  GenericSection,
  ManagerRecipeSection,
  ManagerReportRecipe,
} from './section-types.js';

// Manager Report Recipes
export {
  OPERATIONS_MANAGER_RECIPE,
  SALES_MARKETING_MANAGER_RECIPE,
  FINANCIALS_MANAGER_RECIPE,
  STRATEGY_MANAGER_RECIPE,
  IT_TECHNOLOGY_MANAGER_RECIPE,
  MANAGER_RECIPES,
  getManagerRecipe,
  isManagerReport,
  getManagerReportTypes,
} from './manager-recipes.js';
