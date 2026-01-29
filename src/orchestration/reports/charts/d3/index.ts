/**
 * BizHealth.ai D3-Style SVG Chart Generators
 *
 * Pure SVG chart generators optimized for PDF output.
 * These charts don't require Canvas or external dependencies.
 *
 * Components:
 * - 12-Dimension Executive Radar: Signature executive visualization
 * - 4-Chapter Benchmark Radar: Simplified chapter overview
 */

// ============================================================================
// 12-DIMENSION EXECUTIVE RADAR
// ============================================================================

export {
  render12DimensionExecutiveRadar,
  render12DimensionRadarCompact,
  renderExecutiveRadarWithDimensions,
  // Constants
  DIMENSION_ORDER,
  DIMENSION_CONFIG,
  CHAPTER_COLORS,
  CHAPTER_CONFIG,
} from './radar-12-dimension-executive.js';

export type {
  DimensionConfig,
  ChapterConfig,
  ExecutiveRadarChartData,
  ExecutiveRadarOptions,
} from './radar-12-dimension-executive.js';

// ============================================================================
// 4-CHAPTER BENCHMARK RADAR
// ============================================================================

export {
  render4ChapterRadar,
  render4ChapterRadarCompact,
  renderChapterRadarFromScores,
  // Constants
  CHAPTER_CONFIG as FOUR_CHAPTER_CONFIG,
  CHAPTER_ORDER,
} from './radar-4-chapter.js';

export type {
  ChapterCode,
  ChapterRadarItem,
  ChapterRadarData,
  ChapterRadarOptions,
} from './radar-4-chapter.js';
