/**
 * BizHealth.ai Report Chart Integration
 *
 * High-level functions for integrating charts into report builders.
 * Uses SVG-based rendering for cross-platform compatibility (no native canvas dependencies).
 */

import type { ReportContext, ReportChapter, ReportDimension } from '../../../types/report.types.js';
import {
  generateHorizontalBarChart,
  generateRadarChart,
  generateGaugeChart,
  generateDonutChart,
  getSvgChartStyles,
  type BarChartData,
  type RadarChartData,
  type DonutChartData,
} from './svg-chart-renderer.js';
import { logger } from '../../../utils/logger.js';

// Default chart dimensions for different contexts
export const CHART_SIZES = {
  small: { width: 300, height: 200 },
  medium: { width: 500, height: 350 },
  large: { width: 700, height: 450 },
  wide: { width: 800, height: 300 },
  square: { width: 400, height: 400 },
} as const;

export interface ChartRenderOptions {
  width?: number;
  height?: number;
}

/**
 * Generate chapter overview radar chart
 * Shows all 4 chapters in a spider/radar view
 */
export async function generateChapterOverviewRadar(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    const data: RadarChartData[] = ctx.chapters.map(ch => ({
      label: ch.name,
      value: ch.score,
      maxValue: 100,
    }));

    return generateRadarChart(data, {
      title: 'Business Health Overview',
      size: options.width || 350,
      showLabels: true,
      showValues: true,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate chapter overview radar');
    return generateChartFallback('Chapter Overview', 'radar');
  }
}

/**
 * Generate dimension scores bar chart for a chapter
 */
export async function generateChapterDimensionBars(
  ctx: ReportContext,
  chapterCode: string,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
    if (!chapter) {
      return generateChartFallback(`${chapterCode} Dimensions`, 'bar');
    }

    // Get dimensions for this chapter
    const chapterDimensions = ctx.dimensions.filter(d => d.chapterCode === chapterCode);
    if (chapterDimensions.length === 0) {
      return generateChartFallback(`${chapter.name} Dimensions`, 'bar');
    }

    const data: BarChartData[] = chapterDimensions.map(d => ({
      label: d.name,
      value: d.score,
      maxValue: 100,
    }));

    return generateHorizontalBarChart(data, {
      title: `${chapter.name} - Dimension Scores`,
      width: options.width || 600,
      showValues: true,
      colorByScore: true,
    });
  } catch (error) {
    logger.error({ error, chapterCode }, 'Failed to generate chapter dimension bars');
    return generateChartFallback('Dimension Scores', 'bar');
  }
}

/**
 * Generate all chapter bar charts
 */
export async function generateAllChapterScoreBars(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    const data: BarChartData[] = ctx.chapters.map(ch => ({
      label: ch.name,
      value: ch.score,
      maxValue: 100,
    }));

    return generateHorizontalBarChart(data, {
      title: 'Chapter Performance Overview',
      width: options.width || 600,
      showValues: true,
      colorByScore: true,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate chapter score bars');
    return generateChartFallback('Chapter Scores', 'bar');
  }
}

/**
 * Generate score band distribution donut
 */
export async function generateScoreBandDistribution(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    // Count dimensions by score band
    const bandCounts: Record<string, number> = {
      Excellence: 0,
      Proficiency: 0,
      Attention: 0,
      Critical: 0,
    };

    ctx.dimensions.forEach(d => {
      const band = d.band;
      if (band in bandCounts) {
        bandCounts[band]++;
      }
    });

    const bandColors: Record<string, string> = {
      Excellence: '#27ae60',
      Proficiency: '#f39c12',
      Attention: '#e67e22',
      Critical: '#e74c3c',
    };

    const data: DonutChartData[] = Object.entries(bandCounts)
      .filter(([_, count]) => count > 0)
      .map(([band, count]) => ({
        label: band,
        value: count,
        color: bandColors[band],
      }));

    if (data.length === 0) {
      return generateChartFallback('Score Distribution', 'donut');
    }

    return generateDonutChart(data, {
      title: 'Dimension Score Distribution',
      size: options.width || 300,
      showLegend: true,
      showPercentages: true,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate score band distribution');
    return generateChartFallback('Score Distribution', 'donut');
  }
}

/**
 * Generate benchmark comparison chart
 */
export async function generateBenchmarkComparison(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    // Build comparison data from chapters with benchmarks
    const data: BarChartData[] = ctx.chapters
      .filter(ch => ch.benchmark)
      .map(ch => ({
        label: ch.name,
        value: ch.score,
        benchmark: estimateBenchmarkScore(ch.score, ch.benchmark!.peerPercentile),
        maxValue: 100,
      }));

    if (data.length === 0) {
      return generateChartFallback('Benchmark Comparison', 'bar');
    }

    return generateHorizontalBarChart(data, {
      title: 'Your Scores vs Industry Benchmark',
      width: options.width || 600,
      showValues: true,
      showBenchmark: true,
      colorByScore: true,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate benchmark comparison');
    return generateChartFallback('Benchmark Comparison', 'bar');
  }
}

/**
 * Generate gap analysis chart showing delta from benchmarks
 */
export async function generateGapAnalysis(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    const data: BarChartData[] = ctx.chapters
      .filter(ch => ch.benchmark)
      .map(ch => {
        const benchmark = estimateBenchmarkScore(ch.score, ch.benchmark!.peerPercentile);
        return {
          label: ch.name,
          value: ch.score - benchmark,
          maxValue: 50, // Gap range -50 to +50
        };
      });

    if (data.length === 0) {
      return generateChartFallback('Gap Analysis', 'bar');
    }

    return generateHorizontalBarChart(data, {
      title: 'Gap Analysis vs Industry Benchmark',
      width: options.width || 600,
      showValues: true,
      colorByScore: false,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate gap analysis');
    return generateChartFallback('Gap Analysis', 'bar');
  }
}

/**
 * Generate strengths and weaknesses chart
 */
export async function generateStrengthsWeaknessesChart(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    // Sort dimensions by score
    const sortedDims = [...ctx.dimensions].sort((a, b) => b.score - a.score);

    const data: BarChartData[] = sortedDims.map(d => ({
      label: d.name,
      value: d.score,
      maxValue: 100,
    }));

    if (data.length === 0) {
      return generateChartFallback('Strengths & Improvements', 'bar');
    }

    return generateHorizontalBarChart(data, {
      title: 'Strengths & Areas for Improvement',
      width: options.width || 700,
      showValues: true,
      colorByScore: true,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate strengths/weaknesses chart');
    return generateChartFallback('Strengths & Improvements', 'bar');
  }
}

/**
 * Generate overall health score gauge
 */
export async function generateHealthScoreGauge(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    return generateGaugeChart(ctx.overallHealth.score, 100, {
      title: 'Overall Business Health',
      size: options.width || 250,
      showLabel: true,
      subtitle: ctx.overallHealth.status,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate health score gauge');
    return generateChartFallback('Health Score', 'gauge');
  }
}

/**
 * Generate dimension radar for a specific chapter
 */
export async function generateChapterDimensionRadar(
  ctx: ReportContext,
  chapterCode: string,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  try {
    const chapter = ctx.chapters.find(ch => ch.code === chapterCode);
    if (!chapter) {
      return generateChartFallback(`${chapterCode} Radar`, 'radar');
    }

    const chapterDimensions = ctx.dimensions.filter(d => d.chapterCode === chapterCode);
    if (chapterDimensions.length < 3) {
      // Need at least 3 dimensions for a meaningful radar
      return generateChartFallback(`${chapter.name}`, 'radar');
    }

    const data: RadarChartData[] = chapterDimensions.map(d => ({
      label: d.name,
      value: d.score,
      maxValue: 100,
    }));

    return generateRadarChart(data, {
      title: `${chapter.name} Dimensions`,
      size: options.width || 350,
      showLabels: true,
      showValues: true,
    });
  } catch (error) {
    logger.error({ error, chapterCode }, 'Failed to generate chapter dimension radar');
    return generateChartFallback('Dimension Overview', 'radar');
  }
}

/**
 * Generate a grid of chapter mini-radars
 */
export async function generateChapterRadarGrid(
  ctx: ReportContext,
  options: Partial<ChartRenderOptions> = {}
): Promise<string> {
  const chartPromises = ctx.chapters.map(ch =>
    generateChapterDimensionRadar(ctx, ch.code, { width: 280 })
  );

  const charts = await Promise.all(chartPromises);

  return `
    <div class="chart-grid" role="group" aria-label="Chapter dimension radar charts">
      ${charts.map((chart) => `
        <div class="chart-cell">
          ${chart}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Generate complete visual dashboard for executive summary
 */
export async function generateExecutiveDashboard(
  ctx: ReportContext
): Promise<string> {
  try {
    const [overviewRadar, scoreBars, distribution] = await Promise.all([
      generateChapterOverviewRadar(ctx, { width: 400 }),
      generateAllChapterScoreBars(ctx, { width: 600 }),
      generateScoreBandDistribution(ctx, { width: 300 }),
    ]);

    return `
      <div class="executive-dashboard" role="region" aria-label="Executive dashboard visualizations">
        <div class="dashboard-row">
          <div class="dashboard-main">
            ${overviewRadar}
          </div>
          <div class="dashboard-side">
            ${distribution}
          </div>
        </div>
        <div class="dashboard-full">
          ${scoreBars}
        </div>
      </div>
    `;
  } catch (error) {
    logger.error({ error }, 'Failed to generate executive dashboard');
    return '<div class="chart-error">Dashboard visualization unavailable</div>';
  }
}

/**
 * Get all chart CSS styles needed for reports
 */
export function getReportChartStyles(): string {
  return `
    ${getSvgChartStyles()}

    /* Executive Dashboard Styles */
    .executive-dashboard {
      margin: 2rem 0;
    }

    .dashboard-row {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .dashboard-main {
      flex: 2;
      min-width: 350px;
    }

    .dashboard-side {
      flex: 1;
      min-width: 280px;
    }

    .dashboard-full {
      width: 100%;
    }

    /* Chart grid layout */
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin: 2rem 0;
    }

    .chart-cell {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    /* Chart error fallback */
    .chart-error,
    .chart-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      color: #6c757d;
      min-height: 200px;
      text-align: center;
    }

    .chart-fallback-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    @media print {
      .executive-dashboard,
      .chart-grid,
      .svg-chart-container {
        page-break-inside: avoid;
      }

      .chart-cell {
        box-shadow: none;
        border: 1px solid #dee2e6;
      }
    }

    @media (max-width: 768px) {
      .dashboard-row {
        flex-direction: column;
      }

      .dashboard-main,
      .dashboard-side {
        min-width: 100%;
      }

      .chart-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

// Helper functions

/**
 * Estimate benchmark score from percentile
 */
function estimateBenchmarkScore(score: number, percentile: number): number {
  if (percentile === 50) return score;

  const estimatedSD = 15;
  const zScore = percentileToZScore(percentile);
  const estimatedMedian = score - (zScore * estimatedSD);

  return Math.max(20, Math.min(80, Math.round(estimatedMedian)));
}

/**
 * Convert percentile to z-score (approximation)
 */
function percentileToZScore(percentile: number): number {
  const zScores: Record<number, number> = {
    5: -1.645, 10: -1.282, 15: -1.036, 20: -0.842,
    25: -0.674, 30: -0.524, 35: -0.385, 40: -0.253,
    45: -0.126, 50: 0, 55: 0.126, 60: 0.253,
    65: 0.385, 70: 0.524, 75: 0.674, 80: 0.842,
    85: 1.036, 90: 1.282, 95: 1.645,
  };

  const closest = Object.keys(zScores)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - percentile) < Math.abs(prev - percentile) ? curr : prev
    );

  return zScores[closest] || 0;
}

/**
 * Generate fallback HTML when chart rendering fails
 */
function generateChartFallback(title: string, type: string): string {
  const icons: Record<string, string> = {
    radar: '🕸️',
    bar: '📊',
    donut: '🍩',
    gauge: '🎯',
    default: '📈',
  };

  return `
    <div class="chart-fallback" role="img" aria-label="${title} chart unavailable">
      <div>
        <div class="chart-fallback-icon">${icons[type] || icons.default}</div>
        <div><strong>${title}</strong></div>
        <div style="font-size: 0.85rem;">Chart visualization unavailable</div>
      </div>
    </div>
  `;
}
