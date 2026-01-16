/**
 * BizHealth.ai Visual Components Index
 *
 * Exports all 16 visual components for the report generation pipeline.
 * Components consume IDM (Insights Data Model) output and render
 * professional-grade HTML visualizations optimized for PDF conversion.
 */

// ============================================================================
// TIER 1: CORE COMPONENTS (Used in 6+ Reports)
// ============================================================================

// 1. Gauge Component - Speedometer-style health score (0-100)
export {
  renderGauge,
  renderChapterGauges,
  renderOverallHealthGauge,
} from './gauge.component.js';
export type { GaugeProps } from './gauge.component.js';

// 2. Score Tile Component - Individual dimension/KPI with status indicator
export {
  renderScoreTile,
  renderScoreTileGrid,
  renderChapterDimensionTiles,
  renderCompactScoreTile,
} from './score-tile.component.js';
export type { ScoreTileProps } from './score-tile.component.js';

// 3. Heatmap Component - 12-category portfolio matrix (color-coded)
export {
  renderHeatmap,
  renderHeatmapFromIDM,
  renderMiniHeatmap,
} from './heatmap.component.js';
export type { HeatmapProps, HeatmapChapter } from './heatmap.component.js';

// 4. Bar Chart Component - Horizontal/vertical comparison bars
export {
  renderBarChart,
  renderDimensionComparisonChart,
  renderChapterBarChart,
  renderStackedBar,
} from './bar-chart.component.js';
export type { BarChartProps, BarChartItem } from './bar-chart.component.js';

// 5. Metric Card Component - Single KPI display with trend
export {
  renderMetricCard,
  renderMetricCardGrid,
  renderFinancialMetricCard,
  renderROIMetricCard,
  renderPercentageMetricCard,
  renderHeroMetricCard,
} from './metric-card.component.js';
export type { MetricCardProps } from './metric-card.component.js';

// 6. Table Component - Data tables with highlighting
export {
  renderTable,
  renderDimensionScoresTable,
  renderFindingsTable,
  renderRecommendationsTable,
  renderComparisonTable,
  renderKeyValueTable,
  renderRiskRegisterTable,
} from './table.component.js';
export type { TableProps } from './table.component.js';

// ============================================================================
// TIER 2: ACTION COMPONENTS (Used in 3-5 Reports)
// ============================================================================

// 7. Radar Chart Component - Spider/web multi-dimensional balance
export {
  renderRadarChart,
  renderChapterBalanceRadar,
  renderDimensionRadar,
  renderCompetencyRadar,
} from './radar-chart.component.js';
export type { RadarChartProps, RadarDimension } from './radar-chart.component.js';

// 8. Timeline Component - Initiative/project timelines
export {
  renderTimeline,
  renderVerticalTimeline,
  renderQuickWinsTimeline,
  renderRecommendationsTimeline,
} from './timeline.component.js';
export type { TimelineProps, TimelineItem } from './timeline.component.js';

// 9. Roadmap Timeline Component - Strategic roadmap with milestones
export {
  renderRoadmapTimeline,
  renderRoadmapFromIDM,
  renderSimplifiedRoadmap,
} from './roadmap-timeline.component.js';
export type { RoadmapTimelineProps, RoadmapPhase } from './roadmap-timeline.component.js';

// 10. KPI Dashboard Component - Multi-metric dashboard panel
export {
  renderKPIDashboard,
  renderExecutiveKPIDashboard,
  renderFinancialKPIDashboard,
  renderChapterSummaryDashboard,
  renderQuickStatsRow,
} from './kpi-dashboard.component.js';
export type { KPIDashboardProps, KPIMetric } from './kpi-dashboard.component.js';

// 11. Risk Matrix Component - Likelihood × Impact grid (5×5)
export {
  renderRiskMatrix,
  renderRiskMatrixFromIDM,
  renderRiskSummary,
} from './risk-matrix.component.js';
export type { RiskMatrixProps, RiskItem } from './risk-matrix.component.js';

// ============================================================================
// TIER 3: SPECIALIZED COMPONENTS (Used in 1-2 Reports)
// ============================================================================

// 12. Benchmark Bar Component - Client vs. industry benchmark comparison
export {
  renderBenchmarkBar,
  renderBenchmarkBarList,
  renderDimensionBenchmarks,
  renderComparisonBar,
  renderInlineBenchmark,
} from './benchmark-bar.component.js';
export type { BenchmarkBarProps, BenchmarkBarItem } from './benchmark-bar.component.js';

// 13. Waterfall Component - Incremental value breakdown chart
export {
  renderWaterfall,
  renderValueWaterfall,
  renderScoreBreakdown,
  renderROIWaterfall,
} from './waterfall.component.js';
export type { WaterfallChartProps, WaterfallBar } from './waterfall.component.js';

// 14. Funnel Component - Conversion/pipeline visualization
export {
  renderFunnel,
  renderSalesFunnel,
  renderCustomerJourneyFunnel,
  renderHorizontalFunnel,
} from './funnel.component.js';
export type { FunnelChartProps, FunnelStage } from './funnel.component.js';

// 15. Sparkline Component - Compact mini trend charts
export {
  renderSparkline,
  renderLabeledSparkline,
  renderSparklineList,
  renderMetricWithSparkline,
  generateSampleSparklineData,
} from './sparkline.component.js';
export type { SparklineProps } from './sparkline.component.js';

// 16. Action Card Component - Quick win/initiative summary cards
export {
  renderActionCard,
  renderActionCardList,
  renderQuickWinCard,
  renderQuickWinsFromIDM,
  renderCompactActionItem,
} from './action-card.component.js';
export type { ActionCardProps } from './action-card.component.js';

// ============================================================================
// PHASE 5 VISUALIZATION COMPONENTS
// ============================================================================

// 17. Risk Heatmap Component - 4x4 severity × likelihood grid (Phase 5)
export {
  renderRiskHeatmap,
  renderRiskHeatmapFromRisks,
  renderCompactRiskHeatmap,
} from './risk-heatmap.component.js';
export type { RiskHeatmapOptions, RiskDataPoint } from './risk-heatmap.component.js';

// ============================================================================
// WORLD-CLASS VISUAL COMPONENTS (Phase 1.5-2)
// ============================================================================

// 18. Enhanced Section Header - Section headers with percentile ranking
export {
  generateEnhancedSectionHeader,
  generateCompactSectionHeader,
  generateChapterHeader,
  generateDimensionHeader,
  generateMinimalSectionHeader,
  generateInlineScoreBadge,
  generatePercentileBadge,
} from './section-header-percentile.component.js';
export type {
  SectionHeaderConfig,
  SectionHeaderOptions,
} from './section-header-percentile.component.js';

// 19. Financial Impact Dashboard - Board-ready financial summary
export {
  generateFinancialImpactDashboard,
  generateFinancialImpactSummary,
  generateFinancialMetricCard,
  generateROIBreakdown,
  generateInvestmentReturnBar,
} from './financial-impact-dashboard.component.js';
export type {
  FinancialImpactData,
  FinancialImpactDashboardOptions,
  MetricCardData,
} from './financial-impact-dashboard.component.js';
