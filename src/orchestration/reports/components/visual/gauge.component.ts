/**
 * BizHealth.ai Visual Components - Gauge Component
 *
 * Speedometer-style health score visualization (0-100)
 * Used for overall/chapter/dimension health scores
 */

import {
  getScoreBand,
  getScoreColor,
  bandToClass,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getStatusSymbol,
  getGaugeAriaLabel,
  STATUS_LABELS,
} from '../../utils/accessibility-utils.js';

/**
 * Gauge component props
 */
export interface GaugeProps {
  /** Score value (0-100) */
  score: number;
  /** Size variant */
  size: 'large' | 'medium' | 'small';
  /** Optional label (e.g., "Overall Health", "Growth Engine") */
  label?: string;
  /** Optional benchmark indicator value */
  benchmark?: number;
  /** Show text status label (e.g., "Excellence", "Good") */
  showStatus?: boolean;
  /** Show accessibility symbol for colorblind users */
  showAccessibilitySymbol?: boolean;
}

/**
 * Size configurations for gauge variants
 */
const SIZE_CONFIG = {
  large: {
    width: 200,
    height: 120,
    strokeWidth: 14,
    radius: 70,
    fontSize: 36,
    statusFontSize: 12,
    labelFontSize: 11,
  },
  medium: {
    width: 120,
    height: 75,
    strokeWidth: 10,
    radius: 42,
    fontSize: 24,
    statusFontSize: 10,
    labelFontSize: 10,
  },
  small: {
    width: 80,
    height: 55,
    strokeWidth: 8,
    radius: 28,
    fontSize: 18,
    statusFontSize: 9,
    labelFontSize: 9,
  },
};

/**
 * Calculate SVG arc path for gauge
 */
function calculateArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

/**
 * Convert polar coordinates to cartesian
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
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
 * Render gauge component
 */
export function renderGauge(props: GaugeProps): string {
  const {
    score,
    size,
    label,
    benchmark,
    showStatus = true,
    showAccessibilitySymbol = true,
  } = props;

  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  const config = SIZE_CONFIG[size];
  const band = getScoreBand(clampedScore);
  const color = getScoreColor(clampedScore);
  const statusLabel = STATUS_LABELS[band];
  const symbol = getStatusSymbol(band);

  // Calculate arc angles (gauge spans from 180° to 0°, left to right)
  const startAngle = 180;
  const endAngle = 0;
  const scoreAngle = 180 - (clampedScore / 100) * 180;

  const centerX = config.width / 2;
  const centerY = config.height - 10;

  // Background arc path
  const backgroundPath = calculateArcPath(
    centerX,
    centerY,
    config.radius,
    startAngle,
    endAngle
  );

  // Score arc path (if score > 0)
  const scorePath = clampedScore > 0
    ? calculateArcPath(centerX, centerY, config.radius, startAngle, scoreAngle)
    : '';

  // Benchmark indicator (if provided)
  let benchmarkIndicator = '';
  if (benchmark !== undefined && benchmark >= 0 && benchmark <= 100) {
    const benchmarkAngle = 180 - (benchmark / 100) * 180;
    const benchmarkPos = polarToCartesian(centerX, centerY, config.radius, benchmarkAngle);
    const innerPos = polarToCartesian(centerX, centerY, config.radius - config.strokeWidth / 2 - 4, benchmarkAngle);
    const outerPos = polarToCartesian(centerX, centerY, config.radius + config.strokeWidth / 2 + 4, benchmarkAngle);

    benchmarkIndicator = `
      <line
        x1="${innerPos.x}"
        y1="${innerPos.y}"
        x2="${outerPos.x}"
        y2="${outerPos.y}"
        stroke="#6B7280"
        stroke-width="3"
        stroke-linecap="round"
        class="biz-gauge__benchmark"
      />
    `;
  }

  // Generate ARIA label
  const ariaLabel = getGaugeAriaLabel(clampedScore, label, benchmark);

  // Build the component HTML
  return `
    <div class="biz-gauge biz-gauge--${size} biz-gauge--${band}" role="figure" aria-label="${escapeHtml(ariaLabel)}">
      <svg
        class="biz-gauge__svg"
        width="${config.width}"
        height="${config.height}"
        viewBox="0 0 ${config.width} ${config.height}"
        role="img"
        aria-hidden="true"
      >
        <!-- Background arc -->
        <path
          class="biz-gauge__background"
          d="${backgroundPath}"
          fill="none"
          stroke="#E5E7EB"
          stroke-width="${config.strokeWidth}"
          stroke-linecap="round"
        />

        <!-- Score arc -->
        ${scorePath ? `
          <path
            class="biz-gauge__arc"
            d="${scorePath}"
            fill="none"
            stroke="${color}"
            stroke-width="${config.strokeWidth}"
            stroke-linecap="round"
          />
        ` : ''}

        ${benchmarkIndicator}

        <!-- Score text -->
        <text
          class="biz-gauge__score"
          x="${centerX}"
          y="${centerY - config.radius / 3}"
          text-anchor="middle"
          font-family="'Montserrat', sans-serif"
          font-size="${config.fontSize}"
          font-weight="700"
          fill="#111827"
        >
          ${clampedScore}
        </text>
      </svg>

      ${showStatus ? `
        <div class="biz-gauge__status" style="color: ${color}; font-size: ${config.statusFontSize}px;">
          ${showAccessibilitySymbol ? `<span class="biz-gauge__symbol">${symbol}</span> ` : ''}
          ${statusLabel}
        </div>
      ` : ''}

      ${label ? `
        <div class="biz-gauge__label" style="font-size: ${config.labelFontSize}px;">
          ${escapeHtml(label)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate multiple gauges for chapter scores
 */
export function renderChapterGauges(
  chapters: Array<{ name: string; score: number; code?: string }>,
  size: 'medium' | 'small' = 'medium'
): string {
  const gauges = chapters.map(chapter =>
    renderGauge({
      score: chapter.score,
      size,
      label: chapter.name,
      showStatus: true,
      showAccessibilitySymbol: true,
    })
  );

  return `
    <div class="biz-gauge-grid" style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
      ${gauges.join('')}
    </div>
  `;
}

/**
 * Generate a large overall health gauge with additional context
 */
export function renderOverallHealthGauge(
  score: number,
  options?: {
    benchmark?: number;
    trajectory?: 'Improving' | 'Flat' | 'Declining';
    companyName?: string;
  }
): string {
  const gauge = renderGauge({
    score,
    size: 'large',
    label: options?.companyName ? `${options.companyName} Health Score` : 'Overall Health Score',
    benchmark: options?.benchmark,
    showStatus: true,
    showAccessibilitySymbol: true,
  });

  const trajectoryIndicator = options?.trajectory
    ? `
      <div class="biz-gauge__trajectory" style="text-align: center; margin-top: 8px; font-size: 12px; color: #6B7280;">
        Trajectory: <span style="font-weight: 600; color: ${
          options.trajectory === 'Improving' ? '#22C55E' :
          options.trajectory === 'Declining' ? '#EF4444' : '#6B7280'
        };">
          ${options.trajectory === 'Improving' ? '+' : options.trajectory === 'Declining' ? '-' : '='}
          ${options.trajectory}
        </span>
      </div>
    `
    : '';

  return `
    <div class="biz-overall-health-gauge">
      ${gauge}
      ${trajectoryIndicator}
    </div>
  `;
}
