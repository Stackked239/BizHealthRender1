/**
 * BizHealth.ai SVG Gauge Renderer
 *
 * Renders speedometer-style gauge visualizations for health scores.
 * Produces brand-compliant SVG that is PDF-compatible.
 *
 * @module gauge
 * @version 1.0.0
 */

import {
  BIZHEALTH_COLORS,
  GaugeData,
  StatusBand,
  getStatusBandFromScore,
  getStatusBandColor,
} from '../../types/visualization.types.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for gauge rendering
 */
export interface GaugeOptions {
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show benchmark indicator */
  showBenchmark?: boolean;
  /** Whether to show trend indicator */
  showTrend?: boolean;
  /** Primary label */
  label?: string;
  /** Secondary label */
  sublabel?: string;
  /** Whether to show status text */
  showStatus?: boolean;
  /** Custom ID for the SVG element */
  svgId?: string;
}

/**
 * Size configuration for gauge variants
 */
interface SizeConfig {
  width: number;
  height: number;
  strokeWidth: number;
  fontSize: number;
  statusFontSize: number;
  labelFontSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Size configurations for gauge variants
 */
const SIZE_MAP: Record<'small' | 'medium' | 'large', SizeConfig> = {
  small: {
    width: 120,
    height: 80,
    strokeWidth: 8,
    fontSize: 14,
    statusFontSize: 9,
    labelFontSize: 8,
  },
  medium: {
    width: 180,
    height: 120,
    strokeWidth: 12,
    fontSize: 20,
    statusFontSize: 11,
    labelFontSize: 10,
  },
  large: {
    width: 240,
    height: 160,
    strokeWidth: 16,
    fontSize: 28,
    statusFontSize: 13,
    labelFontSize: 12,
  },
};

/**
 * Status labels for each band
 */
const STATUS_LABELS: Record<StatusBand, string> = {
  excellence: 'Excellence',
  proficiency: 'Proficiency',
  attention: 'Attention',
  critical: 'Critical',
};

/**
 * Trend symbols
 */
const TREND_SYMBOLS: Record<string, string> = {
  improving: '↑',
  declining: '↓',
  flat: '',
};

// ============================================================================
// SVG RENDERING FUNCTIONS
// ============================================================================

/**
 * Render a gauge visualization as SVG
 *
 * @param data - Gauge data including value, max, and optional benchmark
 * @param options - Rendering options
 * @returns SVG string
 */
export function renderGauge(data: GaugeData, options: GaugeOptions = {}): string {
  const size = options.size || 'medium';
  const config = SIZE_MAP[size];

  // Clamp and calculate percentage
  const value = Math.max(0, Math.min(data.max, data.value));
  const percentage = (value / data.max) * 100;
  const status = getStatusBandFromScore(percentage);
  const statusColor = getStatusBandColor(status);

  // Arc calculations
  const centerX = config.width / 2;
  const centerY = config.height - 10;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle

  // Calculate arc paths
  const backgroundArc = createArcPath(centerX, centerY, radius, 180, 0);
  const valueAngle = 180 - (percentage / 100) * 180;
  const valueArc = percentage > 0
    ? createArcPath(centerX, centerY, radius, 180, valueAngle)
    : '';

  // Trend indicator
  const trendSymbol = options.showTrend && data.trend
    ? TREND_SYMBOLS[data.trend] || ''
    : '';

  // Build accessible label
  const ariaLabel = buildAriaLabel(data, options);

  // Generate unique ID for gradients if needed
  const svgId = options.svgId || `gauge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const svg = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${config.width}"
  height="${config.height}"
  viewBox="0 0 ${config.width} ${config.height}"
  role="img"
  aria-label="${escapeXml(ariaLabel)}"
  id="${svgId}"
>
  <title>${escapeXml(options.label || 'Score')}: ${data.value}/${data.max}</title>
  <desc>A gauge visualization showing a score of ${data.value} out of ${data.max} (${Math.round(percentage)}%)</desc>

  <!-- Background arc -->
  <path
    d="${backgroundArc}"
    fill="none"
    stroke="${BIZHEALTH_COLORS.gray}"
    stroke-width="${config.strokeWidth}"
    stroke-linecap="round"
  />

  ${valueArc ? `
  <!-- Value arc -->
  <path
    d="${valueArc}"
    fill="none"
    stroke="${statusColor}"
    stroke-width="${config.strokeWidth}"
    stroke-linecap="round"
  />
  ` : ''}

  ${options.showBenchmark && data.benchmark !== undefined
    ? renderBenchmarkMarker(data.benchmark, data.max, centerX, centerY, radius, config.strokeWidth)
    : ''}

  <!-- Score value -->
  <text
    x="${centerX}"
    y="${centerY - config.strokeWidth - 15}"
    text-anchor="middle"
    font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif"
    font-size="${config.fontSize}"
    font-weight="600"
    fill="${BIZHEALTH_COLORS.textPrimary}"
  >${data.value}${trendSymbol}</text>

  ${options.showStatus !== false ? `
  <!-- Status label -->
  <text
    x="${centerX}"
    y="${centerY - 2}"
    text-anchor="middle"
    font-family="'Open Sans', 'Helvetica Neue', Arial, sans-serif"
    font-size="${config.statusFontSize}"
    font-weight="500"
    fill="${statusColor}"
  >${STATUS_LABELS[status]}</text>
  ` : ''}

  ${options.label ? `
  <!-- Label -->
  <text
    x="${centerX}"
    y="${centerY + config.labelFontSize + 2}"
    text-anchor="middle"
    font-family="'Open Sans', 'Helvetica Neue', Arial, sans-serif"
    font-size="${config.labelFontSize}"
    fill="${BIZHEALTH_COLORS.textSecondary}"
  >${escapeXml(options.label)}</text>
  ` : ''}
</svg>`;

  return svg.trim();
}

/**
 * Create an arc path for the gauge
 */
function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert angles to radians (0° = right, angles go clockwise)
  // For a gauge, we want 180° = left, 0° = right
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate start and end points
  const startX = centerX - radius * Math.cos(startRad);
  const startY = centerY - radius * Math.sin(startRad);
  const endX = centerX - radius * Math.cos(endRad);
  const endY = centerY - radius * Math.sin(endRad);

  // Determine if we need the large arc flag
  const angleDiff = startAngle - endAngle;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  // Build path
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
}

/**
 * Render a benchmark marker on the gauge
 */
function renderBenchmarkMarker(
  benchmark: number,
  max: number,
  centerX: number,
  centerY: number,
  radius: number,
  strokeWidth: number
): string {
  const benchmarkPct = Math.min(100, Math.max(0, (benchmark / max) * 100));
  const angle = 180 - (benchmarkPct / 100) * 180;
  const angleRad = (angle * Math.PI) / 180;

  // Calculate marker position on the arc
  const markerX = centerX - radius * Math.cos(angleRad);
  const markerY = centerY - radius * Math.sin(angleRad);

  // Marker size
  const markerRadius = strokeWidth / 2 + 2;

  return `
  <!-- Benchmark marker -->
  <circle
    cx="${markerX}"
    cy="${markerY}"
    r="${markerRadius}"
    fill="${BIZHEALTH_COLORS.primary}"
    stroke="${BIZHEALTH_COLORS.background}"
    stroke-width="2"
  >
    <title>Industry Benchmark: ${benchmark}</title>
  </circle>`;
}

/**
 * Build ARIA label for accessibility
 */
function buildAriaLabel(data: GaugeData, options: GaugeOptions): string {
  const percentage = Math.round((data.value / data.max) * 100);
  const status = getStatusBandFromScore(percentage);

  let label = options.label
    ? `${options.label}: ${data.value} out of ${data.max}`
    : `Score: ${data.value} out of ${data.max}`;

  label += ` (${percentage}%, ${STATUS_LABELS[status]})`;

  if (data.benchmark !== undefined) {
    label += `. Industry benchmark: ${data.benchmark}`;
  }

  if (data.trend && data.trend !== 'flat') {
    label += `. Trend: ${data.trend}`;
  }

  return label;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// HTML WRAPPER
// ============================================================================

/**
 * Render gauge with HTML wrapper for report embedding
 *
 * @param data - Gauge data
 * @param options - Rendering options
 * @returns HTML string with embedded SVG
 */
export function renderGaugeHTML(data: GaugeData, options: GaugeOptions = {}): string {
  const svg = renderGauge(data, options);
  const size = options.size || 'medium';

  return `
<div class="bh-visualization bh-gauge bh-gauge--${size}" style="text-align: center; margin: 20px 0;">
  ${svg}
  ${options.sublabel ? `
  <div class="bh-gauge__sublabel" style="font-size: 10px; color: ${BIZHEALTH_COLORS.textSecondary}; margin-top: 4px;">
    ${escapeXml(options.sublabel)}
  </div>
  ` : ''}
</div>`.trim();
}

// ============================================================================
// BATCH RENDERING
// ============================================================================

/**
 * Render multiple gauges in a grid layout
 *
 * @param gauges - Array of gauge data with labels
 * @param options - Common rendering options
 * @returns HTML string with gauge grid
 */
export function renderGaugeGrid(
  gauges: Array<{ data: GaugeData; label: string; sublabel?: string }>,
  options: Omit<GaugeOptions, 'label' | 'sublabel'> = {}
): string {
  const gaugeHtml = gauges.map((g) =>
    renderGaugeHTML(g.data, { ...options, label: g.label, sublabel: g.sublabel })
  );

  return `
<div class="bh-gauge-grid" style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; padding: 16px 0;">
  ${gaugeHtml.join('\n')}
</div>`.trim();
}

// ============================================================================
// ASCII FALLBACK (for debugging/logging only)
// ============================================================================

/**
 * Generate ASCII fallback representation (for debugging)
 *
 * @param data - Gauge data
 * @param label - Optional label
 * @returns ASCII representation
 */
export function generateASCIIFallback(data: GaugeData, label?: string): string {
  const percentage = Math.round((data.value / data.max) * 100);
  const filledBlocks = Math.round(percentage / 10);
  const emptyBlocks = 10 - filledBlocks;

  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  const labelPart = label ? `${label}: ` : '';

  return `${labelPart}${bar} ${data.value}/${data.max} (${percentage}%)`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that rendered SVG is well-formed XML
 *
 * @param svg - SVG string to validate
 * @returns true if valid
 */
export function validateSVG(svg: string): boolean {
  // Basic validation checks
  if (!svg.includes('<svg')) return false;
  if (!svg.includes('</svg>')) return false;
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) return false;

  // Check for balanced tags (simple check)
  const openTags = (svg.match(/<[a-z][^/>]*/gi) || []).length;
  const closeTags = (svg.match(/<\/[a-z]+>/gi) || []).length;
  const selfClosing = (svg.match(/<[a-z][^>]*\/>/gi) || []).length;

  return (openTags - selfClosing) === closeTags;
}
