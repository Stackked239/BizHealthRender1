/**
 * Benchmark Callout Component
 *
 * Generates benchmark comparison callout boxes that visually highlight
 * how the assessed company compares to industry standards and peers.
 */

import type { ReportContext, ReportChapter, ReportDimension } from '../../../types/report.types.js';
import { escapeHtml } from '../html-template.js';
import { formatScore, formatScoreInt, formatScoreWithMax, safeRound } from '../utils/number-formatter.js';

/**
 * Benchmark callout data structure
 */
export interface BenchmarkCalloutData {
  entityName: string;
  entityType: 'chapter' | 'dimension' | 'overall';
  score: number;
  benchmarkMedian: number;
  industryName: string;
  percentile?: number;
}

/**
 * Generate a benchmark callout box
 */
export function generateBenchmarkCallout(
  entityName: string,
  score: number,
  benchmarkMedian: number,
  industryName: string,
  percentile?: number
): string {
  const safeScore = safeRound(score, 1);
  const safeBenchmark = safeRound(benchmarkMedian, 1);
  const percentDiff = ((safeScore - safeBenchmark) / safeBenchmark * 100);
  const isAbove = safeScore > safeBenchmark;
  const diffAbs = Math.abs(Math.round(percentDiff));

  // Determine color based on comparison
  const comparisonColor = isAbove ? '#28a745' : percentDiff < -10 ? '#dc3545' : '#ffc107';
  const comparisonText = isAbove ? 'above' : 'below';

  return `
    <div class="benchmark-callout">
      <div class="benchmark-icon">📊</div>
      <div class="benchmark-content">
        <div class="benchmark-label">Industry Benchmark Comparison</div>
        <div class="benchmark-value">
          ${formatScoreWithMax(safeScore)}/100 vs ${formatScoreWithMax(safeBenchmark)}/100
        </div>
        <div class="benchmark-context">
          Your ${escapeHtml(entityName)} score is
          <strong style="color: ${comparisonColor}">
            ${diffAbs}% ${comparisonText}
          </strong>
          the ${escapeHtml(industryName)} industry median${percentile ? ` (${percentile}th percentile)` : ''}.
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate benchmark callout for a chapter
 */
export function generateChapterBenchmarkCallout(
  chapter: ReportChapter,
  industryName: string
): string {
  if (!chapter.benchmark) {
    return '';
  }

  // Use peer percentile to estimate industry median
  // If percentile is 50, median equals score; otherwise estimate
  const estimatedMedian = estimateMedianFromPercentile(chapter.score, chapter.benchmark.peerPercentile);

  return generateBenchmarkCallout(
    chapter.name,
    chapter.score,
    estimatedMedian,
    industryName,
    chapter.benchmark.peerPercentile
  );
}

/**
 * Generate benchmark callout for a dimension
 */
export function generateDimensionBenchmarkCallout(
  dimension: ReportDimension,
  industryName: string
): string {
  if (!dimension.benchmark) {
    return '';
  }

  const estimatedMedian = estimateMedianFromPercentile(dimension.score, dimension.benchmark.peerPercentile);

  return generateBenchmarkCallout(
    dimension.name,
    dimension.score,
    estimatedMedian,
    industryName,
    dimension.benchmark.peerPercentile
  );
}

/**
 * Generate overall health benchmark callout
 */
export function generateOverallBenchmarkCallout(ctx: ReportContext): string {
  const { overallHealth, companyProfile } = ctx;

  if (!overallHealth.benchmarks?.industryAverage) {
    return '';
  }

  return generateBenchmarkCallout(
    'Overall Business Health',
    overallHealth.score,
    overallHealth.benchmarks.industryAverage,
    companyProfile.industry,
    overallHealth.benchmarks.percentile
  );
}

/**
 * Generate all chapter benchmark callouts
 */
export function generateAllChapterBenchmarks(ctx: ReportContext): string {
  const { chapters, companyProfile } = ctx;

  const callouts = chapters
    .filter(ch => ch.benchmark)
    .map(ch => generateChapterBenchmarkCallout(ch, companyProfile.industry));

  return callouts.join('\n');
}

/**
 * Generate compact benchmark summary for multiple items
 */
export function generateBenchmarkSummaryTable(ctx: ReportContext): string {
  const { chapters, companyProfile } = ctx;

  const chaptersWithBenchmark = chapters.filter(ch => ch.benchmark);

  if (chaptersWithBenchmark.length === 0) {
    return '';
  }

  return `
    <div class="benchmark-summary">
      <h4>Benchmark Comparison Summary</h4>
      <table class="score-table">
        <thead>
          <tr>
            <th>Chapter</th>
            <th>Your Score</th>
            <th>Industry Median</th>
            <th>Percentile</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${chaptersWithBenchmark.map(ch => {
            const median = safeRound(estimateMedianFromPercentile(ch.score, ch.benchmark!.peerPercentile), 1);
            const safeChScore = safeRound(ch.score, 1);
            const isAbove = safeChScore > median;
            const statusColor = isAbove ? '#28a745' : safeChScore < median - 10 ? '#dc3545' : '#ffc107';
            const statusIcon = isAbove ? '↑' : safeChScore < median - 10 ? '↓' : '→';

            return `
              <tr>
                <td>${escapeHtml(ch.name)}</td>
                <td class="score">${formatScore(safeChScore)}/100</td>
                <td>${formatScoreInt(median)}/100</td>
                <td>${ch.benchmark!.peerPercentile}th</td>
                <td style="color: ${statusColor}; font-weight: 600;">
                  ${statusIcon} ${isAbove ? 'Above' : safeChScore < median - 10 ? 'Below' : 'At'} Median
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate visual score bar with benchmark indicator
 */
export function generateScoreBarWithBenchmark(
  score: number,
  benchmarkMedian: number,
  band: string
): string {
  const bandClass = band.toLowerCase();
  const safeScore = safeRound(score, 1);
  const safeBenchmark = safeRound(benchmarkMedian, 1);

  return `
    <div class="score-bar-container" style="position: relative;">
      <div class="score-bar-fill ${bandClass}" style="width: ${safeScore}%;">
        ${formatScoreInt(safeScore)}
      </div>
      <div style="
        position: absolute;
        left: ${safeBenchmark}%;
        top: -5px;
        bottom: -5px;
        width: 3px;
        background: #212653;
        border-radius: 2px;
      ">
        <div style="
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          color: #212653;
          white-space: nowrap;
        ">
          Median: ${formatScoreInt(safeBenchmark)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Estimate industry median from score and percentile
 * Uses approximation assuming normal distribution
 */
function estimateMedianFromPercentile(score: number, percentile: number): number {
  // Simple estimation: if at 50th percentile, median equals score
  // Otherwise, adjust based on distance from 50th percentile
  if (percentile === 50) return score;

  // Approximate standard deviation based on typical business health distributions
  const estimatedSD = 15;

  // Calculate z-score for the percentile (approximation)
  const zScore = percentileToZScore(percentile);

  // Estimate median: score = median + (z * SD), so median = score - (z * SD)
  const estimatedMedian = score - (zScore * estimatedSD);

  // Clamp between reasonable bounds
  return Math.max(20, Math.min(80, estimatedMedian));
}

/**
 * Convert percentile to approximate z-score
 */
function percentileToZScore(percentile: number): number {
  // Simplified lookup table for common percentiles
  const zScores: Record<number, number> = {
    5: -1.645,
    10: -1.282,
    15: -1.036,
    20: -0.842,
    25: -0.674,
    30: -0.524,
    35: -0.385,
    40: -0.253,
    45: -0.126,
    50: 0,
    55: 0.126,
    60: 0.253,
    65: 0.385,
    70: 0.524,
    75: 0.674,
    80: 0.842,
    85: 1.036,
    90: 1.282,
    95: 1.645,
  };

  // Find closest percentile in lookup table
  const closest = Object.keys(zScores)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - percentile) < Math.abs(prev - percentile) ? curr : prev
    );

  return zScores[closest] || 0;
}
