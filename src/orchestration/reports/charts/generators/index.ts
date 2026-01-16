/**
 * BizHealth.ai Chart Generators Index
 *
 * Re-exports all chart generator functions for convenient importing.
 */

// Score bar chart generators
export {
  generateDimensionScoreChart,
  generateChapterScoreChart,
  generateStackedScoreChart,
  generateSingleScoreBar,
} from './score-bar-chart.generator.js';

// Radar chart generators
export {
  generateChapterRadarChart,
  generateDimensionRadarChart,
  generateComparisonRadarChart,
  generateMiniRadarChart,
} from './radar-chart.generator.js';

// Donut chart generators
export {
  generateScoreBandDonut,
  generateRiskDistributionDonut,
  generateCategoryDonut,
  generatePieChart,
  generateSemiDonut,
  generateMiniDonut,
  generateChapterCompositionDonut,
} from './donut-chart.generator.js';

// Comparison bar chart generators
export {
  generateGroupedBarChart,
  generateBenchmarkComparisonChart,
  generateGapAnalysisChart,
  generateStrengthWeaknessChart,
  generateProgressChart,
  generateWaterfallChart,
} from './comparison-bar.generator.js';

// Re-export types from comparison bar
export type { ComparisonDataItem } from './comparison-bar.generator.js';
