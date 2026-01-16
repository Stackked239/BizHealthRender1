/**
 * Report Constants Index
 *
 * Exports all constants for BizHealth reports.
 */

export {
  DIMENSION_ICONS,
  CHAPTER_ICONS,
  CHAPTER_NAMES,
  DIMENSION_NAMES,
  CHAPTER_DIMENSIONS,
  FINDING_TYPE_ICONS,
  PRIORITY_ICONS,
  BAND_ICONS,
  TRAJECTORY_ICONS,
  getDimensionIcon,
  getChapterIcon,
  getChapterName,
  getDimensionName,
  generateDimensionHeaderHtml,
  generateChapterHeaderHtml,
  getFindingTypeIcon,
  getPriorityIcon,
  getBandIcon,
  getTrajectoryIconEmoji,
} from './dimension-icons.js';

// Brand Standards
export {
  BIZHEALTH_COLORS,
  BIZHEALTH_TYPOGRAPHY,
  BIZHEALTH_BRAND,
  SCORE_BAND_THRESHOLDS,
  GAUGE_SIZES,
  CHART_SERIES_COLORS,
  getScoreBandColor,
  getScoreBandName,
  getScoreBandLabel,
  getChartColor,
  getRiskLevelColor,
} from './brand.js';
export type { ScoreBandType, GaugeSizeType } from './brand.js';

// Dimension Codes - Single Source of Truth
export {
  DIMENSION_CODES,
  CANONICAL_DIMENSION_CODES,
  CHAPTER_CODES,
  DIMENSION_ALIASES,
  DIMENSION_METADATA,
  CHAPTER_METADATA,
  DIMENSION_CHAPTER_MAP,
  normalizeDimensionCode,
  isValidDimensionCode,
  isValidChapterCode,
  getChapterForDimension,
  getDimensionsForChapter,
  getDimensionMetadata,
  getChapterMetadata,
} from './dimension-codes.js';
export type { DimensionCode, ChapterCode, DimensionMetadata, ChapterMetadata } from './dimension-codes.js';

// Industry Benchmark Defaults - PORTAL-FIX (2024-12)
export {
  INDUSTRY_BENCHMARK_DEFAULTS,
  getIndustryKey,
  getIndustryBenchmarkForCategory,
  getBenchmarkComparison,
  getAllIndustryBenchmarks,
} from './industry-benchmarks.js';
export type {
  IndustryBenchmark,
  CategoryBenchmark,
  PercentileThresholds,
  BenchmarkComparisonResult,
} from './industry-benchmarks.js';
