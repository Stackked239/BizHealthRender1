/**
 * Score Bar Component
 *
 * Visual score bars for displaying dimension scores and benchmarks
 * with proper accessibility attributes and print styling.
 */

import { formatScore, formatScoreInt, clampScore } from '../utils/number-formatter.js';
import { getScoreBand, getScoreColor, type ScoreBand } from '../utils/color-utils.js';
import { getStatusSymbol } from '../utils/accessibility-utils.js';

/**
 * Score bar configuration
 */
export interface ScoreBarConfig {
  /** Score value (0-100) */
  score: number;
  /** Display label (e.g., dimension name) */
  label: string;
  /** Optional benchmark score to overlay */
  benchmark?: number;
  /** Show percentage value inside the bar */
  showPercentage?: boolean;
  /** Bar size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show accessibility symbols */
  showAccessibilitySymbols?: boolean;
  /** Custom aria label override */
  ariaLabel?: string;
}

/**
 * Score bar list configuration
 */
export interface ScoreBarListConfig {
  /** Array of score bar items */
  items: ScoreBarConfig[];
  /** Optional section title */
  title?: string;
  /** Show ranking numbers */
  showRanking?: boolean;
  /** Sort items by score */
  sortByScore?: 'asc' | 'desc' | 'none';
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
 * Get band color based on score
 */
function getBandColor(band: ScoreBand): string {
  const colors: Record<ScoreBand, string> = {
    'critical': '#dc3545',
    'attention': '#ffc107',
    'proficiency': '#969423',
    'excellence': '#28a745',
  };
  return colors[band] || '#6c757d';
}

/**
 * Get gradient for score bar fill
 */
function getBandGradient(band: ScoreBand): string {
  const gradients: Record<ScoreBand, string> = {
    'critical': 'linear-gradient(90deg, #dc3545, #e4606d)',
    'attention': 'linear-gradient(90deg, #ffc107, #ffcd39)',
    'proficiency': 'linear-gradient(90deg, #969423, #b0ad2e)',
    'excellence': 'linear-gradient(90deg, #28a745, #34ce57)',
  };
  return gradients[band] || 'linear-gradient(90deg, #6c757d, #868e96)';
}

/**
 * Get size dimensions
 */
function getSizeDimensions(size: 'small' | 'medium' | 'large'): {
  height: string;
  fontSize: string;
  labelFontSize: string;
  padding: string;
} {
  const dimensions = {
    small: { height: '20px', fontSize: '11px', labelFontSize: '12px', padding: '4px 8px' },
    medium: { height: '28px', fontSize: '13px', labelFontSize: '14px', padding: '6px 10px' },
    large: { height: '36px', fontSize: '15px', labelFontSize: '16px', padding: '8px 12px' },
  };
  return dimensions[size] || dimensions.medium;
}

/**
 * Render a benchmark marker line
 */
function renderBenchmarkMarker(benchmark: number): string {
  const position = clampScore(benchmark, 0, 100);

  return `
    <div
      class="score-bar-benchmark-marker"
      style="left: ${position}%;"
      title="Industry Benchmark: ${formatScore(benchmark)}"
      aria-hidden="true"
    >
      <div class="score-bar-benchmark-label">${formatScoreInt(benchmark)}</div>
    </div>
  `;
}

/**
 * Render a single score bar
 */
export function renderScoreBar(config: ScoreBarConfig): string {
  const {
    score,
    label,
    benchmark,
    showPercentage = true,
    size = 'medium',
    showAccessibilitySymbols = false,
    ariaLabel,
  } = config;

  const safeScore = clampScore(score, 0, 100);
  const band = getScoreBand(safeScore);
  const bandColor = getBandColor(band);
  const bandGradient = getBandGradient(band);
  const dimensions = getSizeDimensions(size);
  const accessibilitySymbol = showAccessibilitySymbols ? getStatusSymbol(band) : '';

  const defaultAriaLabel = `${label}: ${formatScore(safeScore)} out of 100, rated ${band}${
    benchmark !== undefined ? `, industry benchmark ${formatScore(benchmark)}` : ''
  }`;

  return `
    <div class="score-bar-container score-bar--${size}">
      <div class="score-bar-label-row">
        <span class="score-bar-label" style="font-size: ${dimensions.labelFontSize};">
          ${showAccessibilitySymbols ? `<span class="accessibility-symbol">${accessibilitySymbol}</span>` : ''}
          ${escapeHtml(label)}
        </span>
        <span class="score-bar-value" style="font-size: ${dimensions.labelFontSize};">
          ${formatScore(safeScore)}/100
        </span>
      </div>
      <div
        class="score-bar-track"
        role="progressbar"
        aria-valuenow="${safeScore}"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="${escapeHtml(ariaLabel || defaultAriaLabel)}"
        style="height: ${dimensions.height};"
      >
        <div
          class="score-bar-fill score-bar-fill--${band}"
          style="
            width: ${safeScore}%;
            background: ${bandGradient};
            height: 100%;
          "
        >
          ${showPercentage && safeScore > 15 ? `
            <span class="score-bar-percentage" style="font-size: ${dimensions.fontSize};">
              ${formatScoreInt(safeScore)}
            </span>
          ` : ''}
        </div>
        ${benchmark !== undefined ? renderBenchmarkMarker(benchmark) : ''}
      </div>
    </div>
  `;
}

/**
 * Render a list of score bars
 */
export function renderScoreBarList(config: ScoreBarListConfig): string {
  const { items, title, showRanking = false, sortByScore = 'none' } = config;

  // Sort items if requested
  let sortedItems = [...items];
  if (sortByScore === 'desc') {
    sortedItems.sort((a, b) => b.score - a.score);
  } else if (sortByScore === 'asc') {
    sortedItems.sort((a, b) => a.score - b.score);
  }

  const bars = sortedItems.map((item, index) => {
    const barHtml = renderScoreBar(item);
    if (showRanking) {
      return `
        <div class="score-bar-ranked-item">
          <span class="score-bar-rank">${index + 1}</span>
          ${barHtml}
        </div>
      `;
    }
    return barHtml;
  }).join('');

  return `
    <div class="score-bar-list" role="list" aria-label="${escapeHtml(title || 'Score bars')}">
      ${title ? `
        <h4 class="score-bar-list-title">${escapeHtml(title)}</h4>
      ` : ''}
      ${bars}
    </div>
  `;
}

/**
 * Render dimension scores as score bars
 */
export function renderDimensionScoreBars(
  dimensions: Array<{
    code: string;
    name: string;
    score: number;
    benchmark?: number;
  }>,
  options?: {
    title?: string;
    size?: 'small' | 'medium' | 'large';
    sortByScore?: 'asc' | 'desc' | 'none';
    showAccessibilitySymbols?: boolean;
  }
): string {
  const items: ScoreBarConfig[] = dimensions.map(dim => ({
    score: dim.score,
    label: dim.name,
    benchmark: dim.benchmark,
    size: options?.size || 'medium',
    showAccessibilitySymbols: options?.showAccessibilitySymbols || false,
  }));

  return renderScoreBarList({
    items,
    title: options?.title,
    sortByScore: options?.sortByScore || 'none',
  });
}

/**
 * Render chapter scores as score bars
 */
export function renderChapterScoreBars(
  chapters: Array<{
    code: string;
    name: string;
    score: number;
    benchmark?: number;
  }>,
  options?: {
    title?: string;
    size?: 'small' | 'medium' | 'large';
  }
): string {
  const items: ScoreBarConfig[] = chapters.map(ch => ({
    score: ch.score,
    label: ch.name,
    benchmark: ch.benchmark,
    size: options?.size || 'large',
  }));

  return renderScoreBarList({
    items,
    title: options?.title || 'Chapter Scores',
  });
}

/**
 * Generate CSS for score bar components
 */
export function generateScoreBarStyles(): string {
  return `
    /* Score Bar Container */
    .score-bar-container {
      margin-bottom: 16px;
    }

    .score-bar--small { margin-bottom: 12px; }
    .score-bar--large { margin-bottom: 20px; }

    /* Label Row */
    .score-bar-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .score-bar-label {
      font-family: 'Open Sans', Arial, sans-serif;
      font-weight: 500;
      color: #374151;
    }

    .score-bar-value {
      font-family: 'Montserrat', 'Open Sans', sans-serif;
      font-weight: 600;
      color: #212653;
    }

    .accessibility-symbol {
      margin-right: 4px;
    }

    /* Track */
    .score-bar-track {
      position: relative;
      background: #E5E7EB;
      border-radius: 6px;
      overflow: visible;
    }

    /* Fill */
    .score-bar-fill {
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      transition: width 0.3s ease;
    }

    .score-bar-fill--critical { background: linear-gradient(90deg, #dc3545, #e4606d); }
    .score-bar-fill--attention { background: linear-gradient(90deg, #ffc107, #ffcd39); }
    .score-bar-fill--proficiency { background: linear-gradient(90deg, #969423, #b0ad2e); }
    .score-bar-fill--excellence { background: linear-gradient(90deg, #28a745, #34ce57); }

    .score-bar-percentage {
      color: white;
      font-family: 'Montserrat', 'Open Sans', sans-serif;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    /* Benchmark Marker */
    .score-bar-benchmark-marker {
      position: absolute;
      top: -4px;
      bottom: -4px;
      width: 3px;
      background: #374151;
      border-radius: 2px;
      transform: translateX(-50%);
    }

    .score-bar-benchmark-label {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }

    /* Score Bar List */
    .score-bar-list {
      margin-bottom: 24px;
    }

    .score-bar-list-title {
      font-family: 'Montserrat', 'Open Sans', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #212653;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #969423;
    }

    /* Ranked Items */
    .score-bar-ranked-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .score-bar-rank {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #212653;
      color: white;
      border-radius: 50%;
      font-family: 'Montserrat', 'Open Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      margin-top: 2px;
    }

    .score-bar-ranked-item .score-bar-container {
      flex: 1;
    }

    /* Print Styles */
    @media print {
      .score-bar-track {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .score-bar-fill {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .score-bar-container {
        page-break-inside: avoid;
      }

      .score-bar-list {
        page-break-inside: avoid;
      }
    }
  `;
}
