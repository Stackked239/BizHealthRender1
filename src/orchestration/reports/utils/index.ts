/**
 * Report Utilities
 *
 * Shared utility functions for all BizHealth report builders.
 */

// ============================================================================
// SAFE STRING UTILITIES (Type-safe string operations)
// ============================================================================

// Safe string utilities - prevent "text.replace is not a function" errors
export {
  safeString,
  safeReplace,
  safeTrim,
  safeLowerCase,
  safeUpperCase,
  extractNarrativeSection,
  isNonEmptyString,
  isString,
  safeEscapeHtml,
  safeJoin,
  safeExtract,
  safeTruncate,
  safeNormalizeWhitespace,
  safeDefault,
} from './safe-string.utils.js';

// ============================================================================
// SHARED IDM EXTRACTION & FORMATTING UTILITIES
// ============================================================================

// IDM data extraction utilities (null-safe, with fallbacks)
export {
  extractNumericValue,
  formatBenchmark,
  formatK,
  formatInvestmentRange,
  formatReturnEstimate,
  calculateROIDisplay,
  mapDimensionToOwner,
  getDimensionName,
  formatOrdinal,
  formatDate,
  getScoreBandFromScore,
  getScoreBandColor,
  buildQuickWinCardData,
  generateSafePolygonPoints,
  // Manager report filter utilities
  filterQuickWinsByDimensions,
  filterRisksByDimensions,
  filterRecommendationsByDimensions,
  computeDepartmentHealthScore,
  getDimensionFromChapters,
  getAllDimensionsFromChapters,
} from './idm-extractors.js';

export type { DimensionCode } from './idm-extractors.js';

// Formatting utilities (investment, dates, owners, etc.)
export {
  formatDateShort,
  formatHorizon,
  horizonToDeadline,
  formatSeverity,
  getSeverityColor,
  truncateText,
} from './format-helpers.js';

// ============================================================================
// LEGACY UTILITIES
// ============================================================================

// Legacy markdown sanitizer (basic conversion)
export {
  convertMarkdownToHtml,
  processNarrativeForReport,
  processNarrativeContent,
  validateNoRawMarkdown,
} from './markdown-sanitizer.js';

// Enhanced markdown parser with normalization
export {
  parseMarkdownToHTML,
  parseMarkdownWithValidation,
  processNarrativeForReport as processNarrativeWithNormalization,
  validateParsedHTML,
  cleanupRemainingMarkdown,
} from './markdown-parser.js';
export type { ParseOptions, ParseResult, ValidationResult } from './markdown-parser.js';

// Code block to visualization converter
export {
  convertCodeBlocksToVisualizations,
  hasConvertibleCodeBlocks,
  getCodeBlockStats,
} from './code-block-converter.js';

export {
  referenceLogger,
} from './reference-logger.js';

export type { ReferenceUsage } from './reference-logger.js';

export {
  transformToOwnerVoice,
  truncateToSentences,
  truncateToWords,
  capitalizeFirst,
  normalizeWhitespace,
} from './voice-transformer.js';

// Visual component utilities
export {
  BRAND_COLORS,
  SCORE_THRESHOLDS,
  SCORE_COLORS,
  getScoreBand,
  getScoreColor,
  getScoreColorRGB,
  interpolateColor,
  getRiskLevel,
  getRiskColor,
  getChapterColor,
  hexToRgb,
  rgbToHex,
} from './color-utils.js';

export type { ScoreBand, RGB } from './color-utils.js';

export {
  STATUS_SYMBOLS,
  getAccessibleSymbol,
  getColorblindSafeIndicator,
  getGaugeAriaLabel,
  getScoreTileAriaLabel,
  getHeatmapCellAriaLabel,
  getBarChartAriaLabel,
  getRadarChartAriaLabel,
  getRiskMatrixAriaLabel,
  getTableAriaLabel,
  createScreenReaderOnlyText,
  // WCAG 2.1 AA Enhancements
  wrapWithLandmark,
  generateSkipNavigation,
  getAccessibleColors,
  generateChartAltText,
  wrapAccessibleTable,
  generateAccessibleHeading,
  generateAccessibleButton,
  generateAccessibleLink,
  generateAccessibleList,
  generateAccessibleFormField,
  generateAccessibleProgress,
  generateAccessibleAlert,
  getCompleteAccessibilityStyles,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
} from './accessibility-utils.js';

// Number formatting utilities (fixes floating point display bug)
export {
  formatScore,
  formatScoreInt,
  formatPercentage,
  formatBenchmarkComparison,
  formatScoreWithMax,
  formatDelta,
  formatCurrency,
  formatCompactNumber,
  formatROI,
  safeRound,
  clampScore,
} from './number-formatter.js';

// Conditional rendering utilities
export {
  renderConditional,
  renderConditionalWithResult,
  createConditionalRenderer,
  renderIfHasItems,
  renderIfValidNumber,
  renderIfNonEmptyString,
  renderIfValidScore,
  renderIfMinItems,
  getValueByPath,
  isValidValue,
  hasMinLength,
  generateConditionalStyles,
  generateDataNotAvailableBox,
  generateComingSoonBox,
} from './conditional-renderer.js';

export type { ConditionalConfig, ConditionalRenderResult } from './conditional-renderer.js';

// ============================================================================
// PHASE 5 VISUALIZATION UTILITIES
// ============================================================================

// Content sanitizer for orphaned visualization headers
export {
  sanitizeOrphanedVisualizationHeaders,
  validateNoOrphanedHeaders,
  processNarrativeForVisualization,
  checkVisualizationIssues,
} from './content-sanitizer.js';
export type { SanitizationResult } from './content-sanitizer.js';

// Visualization data mappers (IDM to component props)
export {
  mapDimensionToGauge,
  mapRisksToHeatmap,
  mapTopRisksToHeatmap,
  mapRisksToRiskMatrix,
  mapRoadmapToTimeline,
  mapRoadmapToRoadmapPhases,
  mapCriticalMetrics,
  mapToKPIMetrics,
  mapRecommendationsToTimeline,
  mapDimensionsToGauges,
  mapChaptersToGauges,
} from './visualization-mappers.js';
export type {
  RiskHeatmapDataPoint,
  TimelinePhaseData,
  RoadmapTimelineData,
  CriticalMetricData,
} from './visualization-mappers.js';

// Visualization renderers (generate all visualizations)
export {
  renderExecutiveDashboard,
  renderRiskHeatmapSection,
  renderRiskSummarySection,
  renderRoadmapTimelineSection,
  renderSimplifiedRoadmapSection,
  renderQuickWinsTimelineSection,
  renderOverallHealthGaugeSection,
  renderChapterGaugesSection,
  renderDimensionGauge,
  renderKeyStatsRowSection,
  renderBenchmarkBarsSection,
  renderBenchmarkComparison,
  generateAllVisualizations,
  countVisualizations,
} from './render-visualizations.js';
export type { VisualizationBundle } from './render-visualizations.js';

// Content validation utilities
export {
  validateReportContent,
  logValidationResults,
  generateValidationReport,
  checkQualityThresholds,
  DEFAULT_THRESHOLDS,
} from './content-validator.js';
export type {
  ContentValidationSummary,
  QualityThresholds,
} from './content-validator.js';

// Data sanitization utilities (prevents undefined in templates)
export {
  sanitizeForTemplate,
  resolveDimensionName,
  validateNoUndefined,
  sanitizeQuickWins,
  sanitizeRecommendations,
  safeGet,
  formatImpactEffort,
} from './data-sanitizer.js';
export type {
  SanitizedQuickWin,
  SanitizedRecommendation,
} from './data-sanitizer.js';

// ============================================================================
// PHASE 0: PREMIUM REPORT NARRATIVE UTILITIES
// ============================================================================

// Narrative personalization utilities
export {
  personalizeNarrative,
  ensureCompanyNameFrequency,
  generateCompanySpecificCallout,
  generateChapterOpeningNarrative,
  generateEvidenceIntegratedParagraph,
  generateWhyThisMatters,
  generateRiskOfInaction,
  createPersonalizationContext,
  getScoreBandInterpretation,
  describeChapterPattern,
  getGapImpact,
} from './narrative-personalizer.js';

export type {
  PersonalizationContext,
  ChapterNarrativeContext,
  EvidenceSource,
} from './narrative-personalizer.js';

// ============================================================================
// WORLD-CLASS VISUAL COMPONENTS INTEGRATION (Phase 1.5-2)
// ============================================================================

export {
  // 12-Dimension Executive Radar integration
  contextToExecutiveRadarData,
  // 4-Chapter Radar integration
  contextToChapterRadarData,
  // Section Header integration
  dimensionToSectionHeader,
  chapterToSectionHeader,
  // Financial Impact Dashboard integration
  contextToFinancialImpactData,
  // Action Plan Cards integration
  contextToActionPlanCards,
  // Quick Wins Cards integration
  contextToQuickWinCards,
  // Convenience bundle generator
  generateWorldClassVisualsBundle,
} from './world-class-visual-integration.js';

// ============================================================================
// IDM DATA EXTRACTION UTILITIES (Phase 1 Bug Fixes)
// NOTE: All IDM extractor exports are already included above in lines 33-48
// ============================================================================

// ============================================================================
// MANAGER REPORT UTILITIES (Phase 1 Enhancement)
// ============================================================================

// Safe extraction utilities - prevent undefined/null in rendered output
export {
  safeExtractValue,
  safeStringValue,
  safeNumber,
  safeScore,
  safeArray,
  safeGetPath,
  safeScoreBand,
  safeScoreBandClass,
  safeScoreBandColor,
  safeEffortLevel,
  safeImpactLevel,
  safeSeverity,
  safePercentage,
  safeDelta,
  safeDate,
  safeTruncate as safeTruncateManager,
  safeAttr,
  safeHtml,
  safeBoolean,
  safeFirst,
  safeCount,
  safeObject,
  createSafeExtractor,
} from './safe-extract.js';

// Dimension filter utilities - filter content by manager type
export {
  MANAGER_DIMENSIONS,
  MANAGER_TITLES,
  DIMENSION_CHAPTER_MAP,
  DIMENSION_KEYWORDS,
  getDimensionsForManager,
  filterFindingsByDimensions,
  filterRoadmapByDimensions,
  calculateDepartmentScore,
  getDepartmentData,
} from './dimension-filters.js';

export type { ManagerType, ManagerDimensionMap } from './dimension-filters.js';

// ============================================================================
// DEFENSIVE SCORE LOOKUP UTILITIES (Phase 1.5 Enhancement)
// ============================================================================

// Score lookup utilities - defensive lookups with alias resolution
export {
  getDimensionScore,
  getDimensionScores,
  getAllDimensionScores,
  validateScoreConsistency,
  getFinalCategoryScore,
  createScoreMap,
  getDimensionDisplayName,
  isDefaultedScore,
  logScoreLookupSummary,
} from './score-lookup.js';

export type { ScoreLookupResult, ScoreValidationOptions } from './score-lookup.js';

// ============================================================================
// COMPANY NAME VALIDATION UTILITIES
// ============================================================================

// Company name validation - ensures consistent company name usage
export {
  validateCompanyName,
  validateAndGetCompanyName,
  getCanonicalCompanyName,
  normalizeCompanyName,
  isAcceptableVariation,
  extractCompanyReferences,
} from './company-name-validator.js';

export type {
  CompanyNameValidationResult,
  CompanyNameValidationOptions,
} from './company-name-validator.js';

// ============================================================================
// NARRATIVE GENERATION UTILITIES (Phase 2 Enhancement)
// ============================================================================

// Narrative generators - rich company-specific consulting narratives
export {
  generateFindingNarrative,
  generateCategorySynthesis,
  generateEnhancedQuickWin,
  generateRoadmapPhases,
  generateKeyTakeaways,
  generateEvidenceCitation,
  generateCrossReference,
  generateConfidenceFlag,
  renderKeyTakeawaysBlock,
  renderEnhancedQuickWinCard,
  renderRoadmapPhaseBlock,
  buildNarrativeContext,
} from './narrative-generators.js';

export type {
  NarrativeContext,
  EnhancedQuickWin,
  RoadmapPhase,
  KeyTakeaway,
} from './narrative-generators.js';

// ============================================================================
// MANAGER REPORT VALIDATION UTILITIES (Phase 2 Enhancement)
// ============================================================================

// Report validation - ensures quality standards before output
export {
  validateManagerReport,
  formatValidationResult,
  meetsQualityThreshold,
} from './report-validator.js';

export type {
  ValidationResult as ManagerValidationResult,
  ValidationError as ManagerValidationError,
  ValidationWarning as ManagerValidationWarning,
  ValidationStats as ManagerValidationStats,
  ManagerReportValidationOptions,
} from './report-validator.js';

// ============================================================================
// CONTRAST VALIDATION UTILITIES (Dashboard Portal)
// ============================================================================

// Contrast validation for Client Portal Dashboard - WCAG 2.1 AA compliance
export {
  calculateContrastRatio,
  calculateContrastRatioWithAlpha,
  validateDashboardContrast,
  enforceContrastCompliance,
  logContrastValidation,
  parseColor,
} from './contrast-validation.js';

export type {
  ContrastValidationResult,
  ContrastViolation,
  ContrastCheck,
} from './contrast-validation.js';

// ============================================================================
// DELIVERABLE GENERATOR UTILITIES
// ============================================================================

// Deliverable generator - fixes "Completed: Conduct..." bug in Implementation Steps
export {
  deriveDeliverableFromAction,
  isValidDeliverable,
  ensureValidDeliverable,
  sanitizeImplementationSteps,
  generateContextualDeliverable,
} from './deliverable-generator.js';

// ============================================================================
// FINANCIAL METRICS UTILITIES
// ============================================================================

// Financial metrics - fixes "Infinitymo" payback bug
export {
  formatPaybackMonths,
  isValidPaybackDisplay,
  calculateROIMultiplier,
  formatROIDisplay,
  calculatePaybackMonths,
  sanitizePaybackValue,
  formatCurrencyAmount,
  formatInvestmentRangeDisplay,
} from './financial-metrics.js';
