/**
 * BizHealth.ai Visual Components - Benchmark Bar Component
 *
 * Client vs. industry benchmark comparison bars
 * Shows client score against benchmark with delta indicator
 */

import {
  getScoreBand,
  getBenchmarkComparison,
  type ScoreBand,
} from '../../utils/color-utils.js';
import { formatScore, formatScoreInt, safeRound } from '../../utils/number-formatter.js';

/**
 * Benchmark bar item data
 */
export interface BenchmarkBarItem {
  /** Display label */
  label: string;
  /** Client's score */
  clientScore: number;
  /** Industry benchmark score */
  benchmarkScore: number;
  /** Optional percentile rank */
  percentileRank?: number;
}

/**
 * Benchmark bar component props
 */
export interface BenchmarkBarProps {
  /** Single benchmark comparison */
  item: BenchmarkBarItem;
  /** Show delta badge */
  showDelta?: boolean;
  /** Maximum value (default 100) */
  maxValue?: number;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get delta class and color
 */
function getDeltaInfo(delta: number): { class: string; color: string; bgColor: string; symbol: string } {
  if (delta > 5) {
    return {
      class: 'positive',
      color: '#166534',
      bgColor: '#DCFCE7',
      symbol: '+',
    };
  }
  if (delta < -5) {
    return {
      class: 'negative',
      color: '#991B1B',
      bgColor: '#FEE2E2',
      symbol: '-',
    };
  }
  return {
    class: 'neutral',
    color: '#374151',
    bgColor: '#F3F4F6',
    symbol: '=',
  };
}

/**
 * Render single benchmark bar
 */
export function renderBenchmarkBar(props: BenchmarkBarProps): string {
  const { item, showDelta = true, maxValue = 100 } = props;

  const safeClientScore = safeRound(item.clientScore, 1);
  const safeBenchmarkScore = safeRound(item.benchmarkScore, 1);
  const clientPercent = Math.min(100, (safeClientScore / maxValue) * 100);
  const benchmarkPercent = Math.min(100, (safeBenchmarkScore / maxValue) * 100);
  const delta = safeRound(safeClientScore - safeBenchmarkScore, 1);
  const deltaInfo = getDeltaInfo(delta);

  const ariaLabel = `${item.label}: Client score ${formatScore(safeClientScore)}, Industry benchmark ${formatScore(safeBenchmarkScore)}, ${delta >= 0 ? 'above' : 'below'} by ${formatScore(Math.abs(delta))} points`;

  return `
    <div class="biz-benchmark-bar" role="figure" aria-label="${escapeHtml(ariaLabel)}">
      <div class="biz-benchmark-bar__label">${escapeHtml(item.label)}</div>
      <div class="biz-benchmark-bar__container">
        <div class="biz-benchmark-bar__bars">
          <!-- Client score bar -->
          <div class="biz-benchmark-bar__row">
            <div class="biz-benchmark-bar__row-label">Client</div>
            <div class="biz-benchmark-bar__bar-wrapper">
              <div
                class="biz-benchmark-bar__bar biz-benchmark-bar__bar--client"
                style="width: ${clientPercent}%;"
              ></div>
            </div>
            <div class="biz-benchmark-bar__value">${formatScore(safeClientScore)}</div>
          </div>

          <!-- Benchmark bar -->
          <div class="biz-benchmark-bar__row">
            <div class="biz-benchmark-bar__row-label">Industry</div>
            <div class="biz-benchmark-bar__bar-wrapper">
              <div
                class="biz-benchmark-bar__bar biz-benchmark-bar__bar--industry"
                style="width: ${benchmarkPercent}%;"
              ></div>
            </div>
            <div class="biz-benchmark-bar__value">${formatScore(safeBenchmarkScore)}</div>
          </div>
        </div>

        ${showDelta ? `
          <div
            class="biz-benchmark-bar__delta biz-benchmark-bar__delta--${deltaInfo.class}"
            style="background: ${deltaInfo.bgColor}; color: ${deltaInfo.color};"
          >
            ${deltaInfo.symbol} ${delta >= 0 ? '+' : ''}${formatScore(delta)}
          </div>
        ` : ''}
      </div>

      ${item.percentileRank !== undefined ? `
        <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
          ${item.percentileRank}th percentile vs. industry peers
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple benchmark bars
 */
export function renderBenchmarkBarList(
  items: BenchmarkBarItem[],
  title?: string
): string {
  const bars = items.map(item =>
    renderBenchmarkBar({ item, showDelta: true })
  ).join('');

  return `
    <div class="biz-benchmark-bar-list" role="group" aria-label="${escapeHtml(title || 'Benchmark comparisons')}">
      ${title ? `
        <h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px;">
          ${escapeHtml(title)}
        </h4>
      ` : ''}
      ${bars}
    </div>
  `;
}

/**
 * Render dimension benchmark comparison
 */
export function renderDimensionBenchmarks(
  dimensions: Array<{
    name: string;
    score: number;
    benchmarkMedian?: number;
    percentileRank?: number;
  }>,
  title?: string
): string {
  const items: BenchmarkBarItem[] = dimensions
    .filter(d => d.benchmarkMedian !== undefined)
    .map(d => ({
      label: d.name,
      clientScore: d.score,
      benchmarkScore: d.benchmarkMedian!,
      percentileRank: d.percentileRank,
    }));

  return renderBenchmarkBarList(items, title || 'Dimension Benchmarks');
}

/**
 * Render horizontal stacked comparison bar
 */
export function renderComparisonBar(
  label: string,
  clientScore: number,
  benchmarkScore: number,
  topQuartile?: number
): string {
  const safeClient = safeRound(clientScore, 1);
  const safeBenchmark = safeRound(benchmarkScore, 1);
  const safeTopQuartile = topQuartile ? safeRound(topQuartile, 1) : undefined;
  const maxVal = Math.max(safeClient, safeBenchmark, safeTopQuartile || 0, 100);

  return `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 8px;">
        ${escapeHtml(label)}
      </div>
      <div style="position: relative; height: 32px; background: #F3F4F6; border-radius: 4px;">
        <!-- Client bar -->
        <div
          style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${(safeClient / maxVal) * 100}%;
            background: linear-gradient(90deg, #212653, #2D3466);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            color: white;
            font-size: 12px;
            font-weight: 600;
          "
        >
          ${formatScore(safeClient)}
        </div>

        <!-- Benchmark line -->
        <div
          style="
            position: absolute;
            left: ${(safeBenchmark / maxVal) * 100}%;
            top: -4px;
            bottom: -4px;
            width: 3px;
            background: #6B7280;
            border-radius: 2px;
          "
          title="Industry Benchmark: ${formatScore(safeBenchmark)}"
        >
          <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #6B7280; white-space: nowrap;">
            ${formatScore(safeBenchmark)}
          </div>
        </div>

        ${safeTopQuartile ? `
          <!-- Top quartile line -->
          <div
            style="
              position: absolute;
              left: ${(safeTopQuartile / maxVal) * 100}%;
              top: -4px;
              bottom: -4px;
              width: 2px;
              background: #22C55E;
              border-radius: 2px;
            "
            title="Top Quartile: ${formatScore(safeTopQuartile)}"
          >
            <div style="position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #22C55E; white-space: nowrap;">
              ${formatScore(safeTopQuartile)}
            </div>
          </div>
        ` : ''}
      </div>

      <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 10px; color: #6B7280;">
        <span><span style="display: inline-block; width: 12px; height: 12px; background: linear-gradient(90deg, #212653, #2D3466); border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Client</span>
        <span><span style="display: inline-block; width: 2px; height: 12px; background: #6B7280; vertical-align: middle; margin-right: 4px;"></span>Industry Benchmark</span>
        ${safeTopQuartile ? '<span><span style="display: inline-block; width: 2px; height: 12px; background: #22C55E; vertical-align: middle; margin-right: 4px;"></span><span style="color: #22C55E;">Top Quartile</span></span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render compact benchmark indicator (inline)
 */
export function renderInlineBenchmark(
  score: number,
  benchmark: number
): string {
  const safeScore = safeRound(score, 1);
  const safeBenchmark = safeRound(benchmark, 1);
  const delta = safeRound(safeScore - safeBenchmark, 1);
  const deltaInfo = getDeltaInfo(delta);

  return `
    <span style="
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: ${deltaInfo.bgColor};
      color: ${deltaInfo.color};
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    ">
      ${deltaInfo.symbol} ${delta >= 0 ? '+' : ''}${formatScore(delta)} vs benchmark
    </span>
  `;
}
