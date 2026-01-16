/**
 * BizHealth.ai Visual Components - Radar Chart Component
 *
 * Spider/web multi-dimensional balance visualization
 * Used for chapter balance and competitive positioning
 */

import {
  getScoreBand,
  type ScoreBand,
  BRAND_COLORS,
} from '../../utils/color-utils.js';
import { extractNumericValue, formatBenchmark } from '../../utils/idm-extractors.js';

/**
 * Radar chart dimension data
 */
export interface RadarDimension {
  /** Display label */
  label: string;
  /** Value (0-100) */
  value: number;
  /** Optional benchmark value */
  benchmark?: number;
}

/**
 * Radar chart component props
 */
export interface RadarChartProps {
  /** Array of dimensions (max 8 recommended for readability) */
  dimensions: RadarDimension[];
  /** Maximum dimensions to display (default 8) */
  maxDimensions?: number;
  /** Show benchmark overlay */
  showBenchmark?: boolean;
  /** Size variant */
  size?: 'large' | 'medium';
  /** Optional title */
  title?: string;
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
 * Generate polygon points from values
 */
function generatePolygonPoints(
  values: number[],
  centerX: number,
  centerY: number,
  maxRadius: number,
  maxValue: number = 100
): string {
  const angleStep = 360 / values.length;

  return values.map((value, index) => {
    const radius = (value / maxValue) * maxRadius;
    const angle = index * angleStep;
    const point = polarToCartesian(centerX, centerY, radius, angle);
    return `${point.x},${point.y}`;
  }).join(' ');
}

/**
 * Generate grid circles
 */
function generateGridCircles(
  centerX: number,
  centerY: number,
  maxRadius: number,
  steps: number = 4
): string {
  const circles: string[] = [];

  for (let i = 1; i <= steps; i++) {
    const radius = (i / steps) * maxRadius;
    circles.push(`
      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="#E5E7EB"
        stroke-width="1"
        class="biz-radar-chart__grid"
      />
    `);
  }

  return circles.join('');
}

/**
 * Generate axis lines
 */
function generateAxisLines(
  centerX: number,
  centerY: number,
  maxRadius: number,
  count: number
): string {
  const angleStep = 360 / count;
  const lines: string[] = [];

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const endPoint = polarToCartesian(centerX, centerY, maxRadius + 10, angle);
    lines.push(`
      <line
        x1="${centerX}"
        y1="${centerY}"
        x2="${endPoint.x}"
        y2="${endPoint.y}"
        stroke="#F3F4F6"
        stroke-width="1"
        class="biz-radar-chart__axis"
      />
    `);
  }

  return lines.join('');
}

/**
 * Generate data points
 */
function generateDataPoints(
  values: number[],
  centerX: number,
  centerY: number,
  maxRadius: number,
  maxValue: number = 100
): string {
  const angleStep = 360 / values.length;

  return values.map((value, index) => {
    const radius = (value / maxValue) * maxRadius;
    const angle = index * angleStep;
    const point = polarToCartesian(centerX, centerY, radius, angle);
    return `
      <circle
        cx="${point.x}"
        cy="${point.y}"
        r="4"
        fill="${BRAND_COLORS.navy}"
        stroke="white"
        stroke-width="2"
        class="biz-radar-chart__point"
      />
    `;
  }).join('');
}

/**
 * Intentional label abbreviations for radar chart display
 * These are designed to fit in limited SVG label space while remaining clear
 */
const RADAR_LABEL_ABBREVIATIONS: Record<string, string> = {
  // Chapter names
  'Growth Engine': 'Growth',
  'Performance & Health': 'Performance',
  'People & Leadership': 'People',
  'Resilience & Safeguards': 'Resilience',

  // Chapter name variations
  'growth-engine': 'Growth',
  'performance-health': 'Performance',
  'people-leadership': 'People',
  'resilience-safeguards': 'Resilience',

  // Dimension names (if passed directly)
  'Customer Experience': 'Customer',
  'Financial Health': 'Financial',
  'Human Resources': 'HR',
  'Leadership & Governance': 'Leadership',
  'Technology & Innovation': 'Technology',
  'IT & Data Security': 'IT/Data',
  'Risk Management': 'Risk',
  'Risk Management & Sustainability': 'Risk Mgmt',
};

/**
 * Get display label for radar chart - uses intentional abbreviations, not truncation
 */
function getRadarDisplayLabel(label: string): string {
  // Try exact match first
  if (RADAR_LABEL_ABBREVIATIONS[label]) {
    return RADAR_LABEL_ABBREVIATIONS[label];
  }

  // Try case-insensitive match
  const lowerLabel = label.toLowerCase();
  for (const [key, value] of Object.entries(RADAR_LABEL_ABBREVIATIONS)) {
    if (key.toLowerCase() === lowerLabel) {
      return value;
    }
  }

  // If label is already short enough, use as-is
  if (label.length <= 12) {
    return label;
  }

  // Fallback: use first word only (better than substring with ellipsis)
  const firstWord = label.split(/[\s&\-\/]+/)[0];
  if (firstWord && firstWord.length >= 3) {
    console.warn(
      `[Radar Labels] Unknown label "${label}". Using first word: "${firstWord}"`
    );
    return firstWord;
  }

  // Last resort: truncate at word boundary if possible
  const words = label.split(/\s+/);
  let result = '';
  for (const word of words) {
    if ((result + ' ' + word).trim().length <= 12) {
      result = (result + ' ' + word).trim();
    } else {
      break;
    }
  }

  return result || label.substring(0, 10);
}

/**
 * Generate labels
 */
function generateLabels(
  labels: string[],
  centerX: number,
  centerY: number,
  maxRadius: number
): string {
  const angleStep = 360 / labels.length;
  const labelRadius = maxRadius + 25;

  return labels.map((label, index) => {
    const angle = index * angleStep;
    const point = polarToCartesian(centerX, centerY, labelRadius, angle);

    // Determine text anchor based on position
    let textAnchor = 'middle';
    let dx = 0;
    if (angle > 45 && angle < 135) {
      textAnchor = 'start';
      dx = 5;
    } else if (angle > 225 && angle < 315) {
      textAnchor = 'end';
      dx = -5;
    }

    // Get intentional abbreviation instead of truncating with ellipsis
    const displayLabel = getRadarDisplayLabel(label);

    return `
      <text
        x="${point.x}"
        y="${point.y}"
        dx="${dx}"
        dy="4"
        text-anchor="${textAnchor}"
        font-family="'Open Sans', sans-serif"
        font-size="10"
        fill="#6B7280"
        class="biz-radar-chart__label"
      >
        ${escapeHtml(displayLabel)}
      </text>
    `;
  }).join('');
}

/**
 * Render radar chart component
 */
export function renderRadarChart(props: RadarChartProps): string {
  const {
    dimensions,
    maxDimensions = 8,
    showBenchmark = false,
    size = 'medium',
    title,
  } = props;

  // Limit dimensions
  const displayDimensions = dimensions.slice(0, maxDimensions);

  // Size configurations
  const sizeConfig = {
    large: { width: 400, height: 400, radius: 140 },
    medium: { width: 300, height: 300, radius: 100 },
  };
  const config = sizeConfig[size];
  const centerX = config.width / 2;
  const centerY = config.height / 2;

  // Extract values
  // FIX: Use extractNumericValue to handle object benchmarks and prevent NaN
  const values = displayDimensions.map(d => extractNumericValue(d.value, 0));
  const labels = displayDimensions.map(d => d.label);
  const benchmarks = showBenchmark ? displayDimensions.map(d => extractNumericValue(d.benchmark, 50)) : [];

  // Generate SVG elements
  const gridCircles = generateGridCircles(centerX, centerY, config.radius);
  const axisLines = generateAxisLines(centerX, centerY, config.radius, values.length);
  const labelElements = generateLabels(labels, centerX, centerY, config.radius);

  // Main data polygon
  const dataPoints = generatePolygonPoints(values, centerX, centerY, config.radius);
  const dataPointMarkers = generateDataPoints(values, centerX, centerY, config.radius);

  // Benchmark polygon (if applicable)
  let benchmarkPolygon = '';
  if (showBenchmark && benchmarks.length === values.length) {
    const benchmarkPoints = generatePolygonPoints(benchmarks, centerX, centerY, config.radius);
    benchmarkPolygon = `
      <polygon
        points="${benchmarkPoints}"
        fill="none"
        stroke="#9CA3AF"
        stroke-width="2"
        stroke-dasharray="4,2"
        class="biz-radar-chart__benchmark-area"
      />
    `;
  }

  // Generate ARIA description
  // FIX: Use formatBenchmark to handle object benchmarks properly
  const ariaDescription = displayDimensions
    .map(d => `${d.label}: ${d.value}${d.benchmark !== undefined ? ` (benchmark: ${formatBenchmark(d.benchmark)})` : ''}`)
    .join(', ');

  return `
    <div class="biz-radar-chart biz-radar-chart--${size}" role="figure" aria-label="${escapeHtml(title || 'Radar chart')}: ${escapeHtml(ariaDescription)}">
      ${title ? `<h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px; text-align: center;">${escapeHtml(title)}</h4>` : ''}

      <svg
        class="biz-radar-chart__svg"
        width="${config.width}"
        height="${config.height}"
        viewBox="0 0 ${config.width} ${config.height}"
        role="img"
        aria-hidden="true"
      >
        <!-- Grid circles -->
        ${gridCircles}

        <!-- Axis lines -->
        ${axisLines}

        <!-- Benchmark polygon -->
        ${benchmarkPolygon}

        <!-- Data polygon -->
        <polygon
          points="${dataPoints}"
          fill="rgba(33, 38, 83, 0.25)"
          stroke="${BRAND_COLORS.navy}"
          stroke-width="2"
          class="biz-radar-chart__area"
        />

        <!-- Data points -->
        ${dataPointMarkers}

        <!-- Labels -->
        ${labelElements}

        <!-- Center grid labels -->
        <text x="${centerX}" y="${centerY + config.radius + 8}" text-anchor="middle" font-size="8" fill="#9CA3AF">0</text>
        <text x="${centerX}" y="${centerY - config.radius - 4}" text-anchor="middle" font-size="8" fill="#9CA3AF">100</text>
      </svg>

      ${showBenchmark ? `
        <div class="biz-radar-chart__legend" style="display: flex; justify-content: center; gap: 24px; margin-top: 12px; font-size: 11px;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 20px; height: 3px; background: ${BRAND_COLORS.navy};"></span>
            Client
          </span>
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 20px; height: 3px; background: #9CA3AF; border-top: 2px dashed #9CA3AF;"></span>
            Benchmark
          </span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render chapter balance radar chart
 */
export function renderChapterBalanceRadar(
  chapters: Array<{
    name: string;
    score: number;
    benchmark?: number;
  }>,
  showBenchmark: boolean = false
): string {
  const dimensions = chapters.map(ch => ({
    label: ch.name,
    value: ch.score,
    benchmark: ch.benchmark,
  }));

  return renderRadarChart({
    dimensions,
    showBenchmark,
    size: 'medium',
    title: 'Strategic Balance',
  });
}

/**
 * Render dimension radar chart for a chapter
 */
export function renderDimensionRadar(
  chapterName: string,
  dimensions: Array<{
    name: string;
    score: number;
    benchmark?: number;
  }>,
  showBenchmark: boolean = false
): string {
  const radarDimensions = dimensions.map(dim => ({
    label: dim.name,
    value: dim.score,
    benchmark: dim.benchmark,
  }));

  return renderRadarChart({
    dimensions: radarDimensions,
    showBenchmark,
    size: 'medium',
    title: `${chapterName} Dimensions`,
  });
}

/**
 * Render competency radar (for HR/Leadership)
 */
export function renderCompetencyRadar(
  competencies: Array<{
    name: string;
    currentScore: number;
    targetScore: number;
  }>
): string {
  const dimensions = competencies.map(c => ({
    label: c.name,
    value: c.currentScore,
    benchmark: c.targetScore,
  }));

  return renderRadarChart({
    dimensions,
    showBenchmark: true,
    size: 'medium',
    title: 'Competency Assessment',
  });
}
