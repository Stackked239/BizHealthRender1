/**
 * BizHealth Visualization Renderer Module
 *
 * Master module that generates all visualizations from ReportContext data.
 * This module integrates with existing visual components to render:
 * - Executive dashboards with critical metrics
 * - Risk heatmaps and matrices
 * - Implementation roadmap timelines
 * - Dimension gauges
 * - Benchmark comparisons
 *
 * @module render-visualizations
 */

import type { ReportContext, ReportRisk, ReportRoadmapPhase, ReportRecommendation } from '../../../types/report.types.js';
import type { DimensionCode } from '../../../types/idm.types.js';

// Import visual components
import { renderGauge, renderChapterGauges, renderOverallHealthGauge } from '../components/visual/gauge.component.js';
import { renderMetricCard, renderMetricCardGrid } from '../components/visual/metric-card.component.js';
import { renderKPIDashboard, renderQuickStatsRow } from '../components/visual/kpi-dashboard.component.js';
import { renderRiskMatrix, renderRiskSummary, type RiskItem } from '../components/visual/risk-matrix.component.js';
import { renderRoadmapTimeline, renderSimplifiedRoadmap, type RoadmapPhase } from '../components/visual/roadmap-timeline.component.js';
import { renderTimeline, renderQuickWinsTimeline } from '../components/visual/timeline.component.js';
import { renderBenchmarkBar, renderInlineBenchmark } from '../components/visual/benchmark-bar.component.js';
import { getScoreBand, type ScoreBand } from './color-utils.js';

/**
 * BizHealth Brand Colors
 */
const BRAND = {
  navy: '#212653',
  green: '#969423',
  critical: '#dc3545',
  warning: '#ffc107',
  caution: '#e67e22',
  success: '#28a745',
  proficiency: '#0d6efd'
};

/**
 * Bundle of all generated visualizations
 */
export interface VisualizationBundle {
  /** Executive summary metrics dashboard */
  executiveDashboard: string;
  /** Risk heatmap/matrix visualization */
  riskHeatmap: string;
  /** Risk summary statistics */
  riskSummary: string;
  /** Implementation roadmap timeline */
  roadmapTimeline: string;
  /** Simplified roadmap for executive views */
  simplifiedRoadmap: string;
  /** Quick wins timeline */
  quickWinsTimeline: string;
  /** Overall health gauge */
  overallHealthGauge: string;
  /** Chapter gauges grid */
  chapterGauges: string;
  /** Dimension-specific gauges */
  dimensionGauges: Record<string, string>;
  /** Key statistics row */
  keyStatsRow: string;
  /** Benchmark comparison bars */
  benchmarkBars: string;
}

/**
 * Render the Executive Summary Critical Metrics Dashboard
 *
 * @param ctx - Report context with all assessment data
 * @returns HTML string for the executive metrics dashboard
 */
export function renderExecutiveDashboard(ctx: ReportContext): string {
  const metrics = [
    {
      label: 'Overall Health',
      value: ctx.overallHealth.score,
      unit: '/100',
      status: getScoreBand(ctx.overallHealth.score) as ScoreBand,
      trend: ctx.overallHealth.trajectory === 'Improving' ? 'up' as const :
             ctx.overallHealth.trajectory === 'Declining' ? 'down' as const : 'flat' as const
    },
    ...ctx.chapters.map(chapter => ({
      label: chapter.name,
      value: chapter.score,
      unit: '/100',
      status: getScoreBand(chapter.score) as ScoreBand
    }))
  ];

  const dashboard = renderKPIDashboard({
    metrics,
    columns: Math.min(4, metrics.length) as 2 | 3 | 4,
    title: 'Critical Business Metrics',
    showBorder: true
  });

  return `
    <div class="executive-metrics-dashboard" role="region" aria-label="Critical Business Metrics">
      ${dashboard}
    </div>
  `;
}

/**
 * Render Risk Heat Map/Matrix for Risk Assessment section
 *
 * @param ctx - Report context with risks data
 * @returns HTML string for the risk heatmap visualization
 */
export function renderRiskHeatmapSection(ctx: ReportContext): string {
  if (!ctx.risks || ctx.risks.length === 0) {
    return ''; // Don't render empty visualization
  }

  // Map risks to RiskItem format for the matrix
  const riskItems: RiskItem[] = ctx.risks.map(risk => ({
    id: risk.id,
    label: risk.narrative?.substring(0, 80) || `Risk: ${risk.dimensionName}`,
    likelihood: mapToScale5(risk.likelihood),
    impact: mapToScale5(risk.severity),
    category: risk.category || risk.dimensionName
  }));

  const matrix = renderRiskMatrix({
    risks: riskItems,
    showLegend: true,
    showLabels: true,
    title: 'Risk Assessment Matrix'
  });

  return `
    <div class="risk-heatmap-container" style="margin: 2rem 0; page-break-inside: avoid;">
      <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
        ${ctx.risks.length} risks plotted by impact (vertical) and likelihood (horizontal)
      </p>
      ${matrix}
    </div>
  `;
}

/**
 * Render Risk Summary Statistics
 *
 * @param ctx - Report context with risks data
 * @returns HTML string for risk summary
 */
export function renderRiskSummarySection(ctx: ReportContext): string {
  if (!ctx.risks || ctx.risks.length === 0) {
    return '';
  }

  const riskItems = ctx.risks.map(risk => ({
    label: risk.narrative?.substring(0, 50) || risk.id,
    likelihood: mapToScale5(risk.likelihood),
    impact: mapToScale5(risk.severity)
  }));

  return renderRiskSummary(riskItems);
}

/**
 * Render Implementation Roadmap Timeline
 *
 * @param ctx - Report context with roadmap phases
 * @returns HTML string for the roadmap timeline
 */
export function renderRoadmapTimelineSection(ctx: ReportContext): string {
  if (!ctx.roadmap?.phases || ctx.roadmap.phases.length === 0) {
    return '';
  }

  // Map phases to RoadmapPhase format
  const phases: RoadmapPhase[] = ctx.roadmap.phases.slice(0, 3).map((phase, index) => {
    const phaseNum = (index + 1) as 1 | 2 | 3;

    // Get linked recommendations for deliverables
    const linkedRecs = ctx.recommendations.filter(rec =>
      phase.linkedRecommendationIds?.includes(rec.id)
    );

    return {
      phaseNumber: phaseNum,
      name: phase.name || `Phase ${phaseNum}`,
      timeframe: formatTimeHorizon(phase.timeHorizon),
      focus: phase.narrative?.substring(0, 150) || 'Strategic implementation',
      keyDeliverables: linkedRecs.slice(0, 4).map(rec => rec.theme),
      successMetrics: linkedRecs.slice(0, 2).map(rec => rec.expectedOutcomes?.substring(0, 60))
    };
  });

  const timeline = renderRoadmapTimeline({
    phases,
    totalMonths: 18,
    showMilestones: true,
    showInvestment: false,
    title: '18-Month Transformation Roadmap'
  });

  return `
    <div class="roadmap-timeline-container" style="margin: 2rem 0; page-break-inside: avoid;">
      ${timeline}
    </div>
  `;
}

/**
 * Render Simplified Roadmap for executive views
 *
 * @param ctx - Report context with roadmap phases
 * @returns HTML string for simplified roadmap
 */
export function renderSimplifiedRoadmapSection(ctx: ReportContext): string {
  if (!ctx.roadmap?.phases || ctx.roadmap.phases.length === 0) {
    return '';
  }

  const phases = ctx.roadmap.phases.slice(0, 3).map(phase => {
    const linkedRecs = ctx.recommendations.filter(rec =>
      phase.linkedRecommendationIds?.includes(rec.id)
    );

    return {
      name: phase.name,
      timeframe: formatTimeHorizon(phase.timeHorizon),
      highlights: linkedRecs.slice(0, 3).map(rec => rec.theme)
    };
  });

  return renderSimplifiedRoadmap(phases);
}

/**
 * Render Quick Wins Timeline
 *
 * @param ctx - Report context with quick wins
 * @returns HTML string for quick wins timeline
 */
export function renderQuickWinsTimelineSection(ctx: ReportContext): string {
  if (!ctx.quickWins || ctx.quickWins.length === 0) {
    return '';
  }

  const quickWins = ctx.quickWins.slice(0, 6).map(qw => ({
    title: qw.theme,
    timeframeDays: parseTimeframeToDays(qw.timeframe),
    impactScore: qw.impactScore,
    effortScore: qw.effortScore
  }));

  return renderQuickWinsTimeline(quickWins);
}

/**
 * Render Overall Health Gauge
 *
 * @param ctx - Report context with overall health data
 * @returns HTML string for overall health gauge
 */
export function renderOverallHealthGaugeSection(ctx: ReportContext): string {
  return renderOverallHealthGauge(ctx.overallHealth.score, {
    benchmark: ctx.overallHealth.benchmarks?.industryAverage,
    trajectory: ctx.overallHealth.trajectory,
    companyName: ctx.companyProfile.name
  });
}

/**
 * Render Chapter Gauges Grid
 *
 * @param ctx - Report context with chapter data
 * @returns HTML string for chapter gauges
 */
export function renderChapterGaugesSection(ctx: ReportContext): string {
  const chapters = ctx.chapters.map(ch => ({
    name: ch.name,
    score: ch.score,
    code: ch.code
  }));

  return renderChapterGauges(chapters, 'medium');
}

/**
 * Render dimension-specific gauge for section headers
 *
 * @param dimensionCode - The dimension code
 * @param score - The dimension score
 * @param benchmark - Optional benchmark value
 * @param label - Display label
 * @returns HTML string for the dimension gauge
 */
export function renderDimensionGauge(
  dimensionCode: string,
  score: number,
  benchmark: number | undefined,
  label: string
): string {
  const gauge = renderGauge({
    score: Math.round(score),
    size: 'small',
    label: label,
    benchmark: benchmark,
    showStatus: true,
    showAccessibilitySymbol: false
  });

  return `
    <div class="dimension-gauge" style="float: right; margin-left: 1rem;">
      ${gauge}
    </div>
  `;
}

/**
 * Render Key Statistics Row
 *
 * @param ctx - Report context
 * @returns HTML string for key stats
 */
export function renderKeyStatsRowSection(ctx: ReportContext): string {
  const stats = [
    {
      label: 'Health Score',
      value: ctx.overallHealth.score,
      color: getStatusColor(ctx.overallHealth.score)
    },
    {
      label: 'Dimensions Analyzed',
      value: ctx.dimensions.length
    },
    {
      label: 'Findings',
      value: ctx.findings.length
    },
    {
      label: 'Recommendations',
      value: ctx.recommendations.length
    },
    {
      label: 'Quick Wins',
      value: ctx.quickWins.length,
      color: BRAND.success
    }
  ];

  return renderQuickStatsRow(stats);
}

/**
 * Render Benchmark Comparison Bars
 *
 * @param ctx - Report context
 * @returns HTML string for benchmark bars
 */
export function renderBenchmarkBarsSection(ctx: ReportContext): string {
  const bars: string[] = [];

  // Add chapter benchmarks
  ctx.chapters.forEach(chapter => {
    if (chapter.benchmark) {
      bars.push(renderInlineBenchmark({
        label: chapter.name,
        clientScore: chapter.score,
        benchmarkScore: chapter.benchmark.peerPercentile,
        benchmarkLabel: 'Industry'
      }));
    }
  });

  if (bars.length === 0) {
    return '';
  }

  return `
    <div class="benchmark-bars-container" style="margin: 1.5rem 0;">
      <h4 style="color: ${BRAND.navy}; font-size: 0.95rem; margin-bottom: 1rem;">Performance vs. Industry Benchmarks</h4>
      ${bars.join('\n')}
    </div>
  `;
}

/**
 * Render benchmark comparison bar for inline metrics
 *
 * @param value - Current value
 * @param benchmark - Benchmark value
 * @param label - Display label
 * @param unit - Unit suffix
 * @returns HTML string for benchmark comparison
 */
export function renderBenchmarkComparison(
  value: number,
  benchmark: number,
  label: string,
  unit: string = ''
): string {
  const percentage = Math.min((value / benchmark) * 100, 150);
  const status = value >= benchmark ? 'success' : value >= benchmark * 0.7 ? 'warning' : 'critical';
  const statusColor = status === 'success' ? BRAND.success :
                      status === 'warning' ? BRAND.warning : BRAND.critical;

  return `
    <div class="benchmark-comparison" style="margin: 0.5rem 0;" role="figure" aria-label="${label}: ${value}${unit} vs benchmark ${benchmark}${unit}">
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;">
        <span style="color: #333;">${label}</span>
        <span style="font-weight: 600; color: ${statusColor};">${value}${unit}</span>
      </div>
      <div style="background: #e9ecef; border-radius: 4px; height: 8px; position: relative;">
        <div style="background: ${statusColor}; width: ${Math.min(percentage, 100)}%; height: 100%; border-radius: 4px;"></div>
        <div style="position: absolute; left: ${Math.min((benchmark / (benchmark * 1.5)) * 100, 100)}%; top: -2px; bottom: -2px; width: 2px; background: ${BRAND.navy};" title="Benchmark: ${benchmark}${unit}"></div>
      </div>
    </div>
  `;
}

/**
 * Master function to generate all visualizations for a report
 *
 * @param ctx - Report context with all assessment data
 * @returns VisualizationBundle with all generated visualizations
 */
export function generateAllVisualizations(ctx: ReportContext): VisualizationBundle {
  // Generate dimension gauges for each dimension
  const dimensionGauges: Record<string, string> = {};
  ctx.dimensions.forEach(dim => {
    dimensionGauges[dim.code] = renderDimensionGauge(
      dim.code,
      dim.score,
      dim.benchmark?.peerPercentile,
      dim.name
    );
  });

  return {
    executiveDashboard: renderExecutiveDashboard(ctx),
    riskHeatmap: renderRiskHeatmapSection(ctx),
    riskSummary: renderRiskSummarySection(ctx),
    roadmapTimeline: renderRoadmapTimelineSection(ctx),
    simplifiedRoadmap: renderSimplifiedRoadmapSection(ctx),
    quickWinsTimeline: renderQuickWinsTimelineSection(ctx),
    overallHealthGauge: renderOverallHealthGaugeSection(ctx),
    chapterGauges: renderChapterGaugesSection(ctx),
    dimensionGauges,
    keyStatsRow: renderKeyStatsRowSection(ctx),
    benchmarkBars: renderBenchmarkBarsSection(ctx)
  };
}

/**
 * Count total visualizations in HTML content
 *
 * @param html - HTML content to analyze
 * @returns Count of visualization elements
 */
export function countVisualizations(html: string): number {
  const patterns = [
    /class="[^"]*svg-chart-container/g,
    /class="[^"]*biz-gauge/g,
    /class="[^"]*biz-kpi-dashboard/g,
    /class="[^"]*biz-risk-matrix/g,
    /class="[^"]*biz-roadmap-timeline/g,
    /class="[^"]*biz-timeline/g,
    /class="[^"]*biz-heatmap/g,
    /class="[^"]*dimension-gauge/g,
    /class="[^"]*executive-metrics-dashboard/g,
    /class="[^"]*benchmark-comparison/g,
    /class="[^"]*chart-container/g,
    /<svg[^>]*viewBox/g
  ];

  let count = 0;
  patterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });

  return count;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map severity/likelihood to 1-5 scale
 */
function mapToScale5(value: string | number): 1 | 2 | 3 | 4 | 5 {
  if (typeof value === 'number') {
    return Math.max(1, Math.min(5, Math.ceil(value / 20))) as 1 | 2 | 3 | 4 | 5;
  }

  const map: Record<string, 1 | 2 | 3 | 4 | 5> = {
    'critical': 5,
    'high': 4,
    'medium-high': 3,
    'medium': 3,
    'low-medium': 2,
    'low': 2,
    'minimal': 1
  };

  return map[String(value).toLowerCase()] || 3;
}

/**
 * Get status color from score
 */
function getStatusColor(score: number): string {
  if (score >= 80) return BRAND.success;
  if (score >= 60) return BRAND.green;
  if (score >= 40) return BRAND.warning;
  return BRAND.critical;
}

/**
 * Format time horizon for display
 */
function formatTimeHorizon(horizon: string): string {
  const formats: Record<string, string> = {
    '90_days': 'Months 1-3',
    '0-90 days': 'Months 1-3',
    '90 days': 'Months 1-3',
    '6_months': 'Months 1-6',
    '12_months': 'Months 4-12',
    '6-12 months': 'Months 4-12',
    '18_months': 'Months 7-18',
    '12-18 months': 'Months 7-18',
    '24_months_plus': 'Months 13-24',
    '18-24 months': 'Months 13-24',
    '24 months+': 'Months 13-24'
  };

  return formats[horizon?.toLowerCase()] || horizon || 'TBD';
}

/**
 * Parse timeframe string to days
 */
function parseTimeframeToDays(timeframe: string): number {
  if (!timeframe) return 30;

  const lower = timeframe.toLowerCase();

  if (lower.includes('week')) {
    const weeks = parseInt(lower) || 2;
    return weeks * 7;
  }
  if (lower.includes('day')) {
    return parseInt(lower) || 30;
  }
  if (lower.includes('month')) {
    const months = parseInt(lower) || 1;
    return months * 30;
  }

  // Default patterns
  if (lower.includes('immediate') || lower.includes('quick')) return 14;
  if (lower.includes('30')) return 30;
  if (lower.includes('60')) return 60;
  if (lower.includes('90')) return 90;

  return 30; // Default
}
