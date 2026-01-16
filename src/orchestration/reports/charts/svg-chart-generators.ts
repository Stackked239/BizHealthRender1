/**
 * Server-Side SVG Chart Generators
 *
 * All charts render as pure SVG strings - no client-side JavaScript required.
 * PDF-compatible, print-ready output with BizHealth brand styling.
 *
 * Chart Types:
 * - Radar Chart: Chapter/dimension comparison with optional benchmark overlay
 * - Horizontal Bar Chart: Dimension scores with benchmark markers
 * - Donut Chart: Score distribution visualization
 * - Gauge Chart: Single score display
 * - Grouped Bar Chart: Multi-series comparison
 * - Stacked Bar Chart: Component breakdown
 * - Trend Line: Simple trend visualization
 *
 * @module svg-chart-generators
 * @since 2025-12-06
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** BizHealth brand colors */
const COLORS = {
  primary: '#212653',      // BizNavy
  accent: '#969423',       // BizGreen
  excellence: '#28a745',   // Green for excellence band
  proficiency: '#0d6efd',  // Blue for proficiency
  attention: '#ffc107',    // Yellow/orange for attention
  critical: '#dc3545',     // Red for critical
  background: '#f8f9fa',
  text: '#2c3e50',
  grid: '#e0e0e0',
  lightGray: '#95a5a6',
  white: '#ffffff',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color for a score band
 */
function getBandColor(score: number): string {
  if (score >= 80) return COLORS.excellence;
  if (score >= 60) return COLORS.proficiency;
  if (score >= 40) return COLORS.attention;
  return COLORS.critical;
}

/**
 * Escape text for SVG/XML
 */
function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Intentional abbreviations for chapter and dimension labels
 * These are designed to be readable without ellipsis truncation
 */
const LABEL_ABBREVIATIONS: Record<string, string> = {
  // Chapter names (full -> short)
  'Growth Engine': 'Growth',
  'Performance & Health': 'Performance',
  'People & Leadership': 'People',
  'Resilience & Safeguards': 'Resilience',
  // Common dimension names
  'Customer Experience': 'Customer Exp',
  'Leadership & Governance': 'Leadership',
  'Technology & Innovation': 'Tech & Innov',
  'IT & Data Security': 'IT & Data',
  'Risk Management & Sustainability': 'Risk Mgmt',
  'Human Resources': 'HR',
  'Compliance & Legal': 'Compliance',
};

/**
 * Get abbreviated label for a dimension or chapter
 * Uses intentional abbreviations when available, otherwise truncates
 */
function getAbbreviatedLabel(text: string, maxLength: number): string {
  // Check if we have an intentional abbreviation
  if (LABEL_ABBREVIATIONS[text]) {
    return LABEL_ABBREVIATIONS[text];
  }
  // Otherwise truncate if needed
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '...';
}

/**
 * Truncate text with ellipsis
 * @deprecated Use getAbbreviatedLabel for better results
 */
function truncateText(text: string, maxLength: number): string {
  // Use abbreviated label if available
  return getAbbreviatedLabel(text, maxLength);
}

/**
 * Convert polar coordinates to Cartesian
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

/**
 * Describe an arc path for SVG
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// ============================================================================
// RADAR CHART
// ============================================================================

export interface RadarChartData {
  labels: string[];
  values: number[];
  benchmarkValues?: number[];
  title?: string;
}

export interface RadarChartOptions {
  width?: number;
  height?: number;
  colors?: { primary: string; benchmark: string };
  showLabels?: boolean;
  showValues?: boolean;
  fillOpacity?: number;
  levels?: number;
}

/**
 * Generate radar/spider chart SVG with optional benchmark overlay
 */
export function generateRadarChartSVG(
  data: RadarChartData,
  options?: RadarChartOptions
): string {
  const opts = {
    width: options?.width ?? 350,
    height: options?.height ?? 380,
    colors: options?.colors ?? { primary: COLORS.primary, benchmark: COLORS.accent },
    showLabels: options?.showLabels ?? true,
    showValues: options?.showValues ?? true,
    fillOpacity: options?.fillOpacity ?? 0.3,
    levels: options?.levels ?? 5,
  };

  if (data.labels.length < 3) {
    return generateFallbackSvg('Radar Chart', 'Requires at least 3 data points', opts.width);
  }

  const centerX = opts.width / 2;
  const centerY = opts.height / 2 + 10;
  const radius = Math.min(opts.width, opts.height) / 2 - 60;
  const angleSlice = (Math.PI * 2) / data.labels.length;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${opts.width}" height="${opts.height}" fill="white" rx="4"/>`;

  // Title
  if (data.title) {
    svg += `<text x="${centerX}" y="22" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(data.title)}</text>`;
  }

  // Circular grid
  for (let level = 1; level <= opts.levels; level++) {
    const r = (radius / opts.levels) * level;
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${COLORS.grid}" stroke-width="1"/>`;
    // Level labels
    if (level === opts.levels) {
      svg += `<text x="${centerX + 5}" y="${centerY - r + 12}" font-family="'Open Sans', sans-serif" font-size="10" fill="${COLORS.lightGray}">${(level * 20)}</text>`;
    }
  }

  // Axis lines
  data.labels.forEach((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x2 = centerX + Math.cos(angle) * radius;
    const y2 = centerY + Math.sin(angle) * radius;
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${x2}" y2="${y2}" stroke="${COLORS.grid}" stroke-width="1"/>`;
  });

  // Benchmark polygon (if provided) - draw first so data is on top
  if (data.benchmarkValues && data.benchmarkValues.length === data.labels.length) {
    const benchmarkPoints = data.benchmarkValues.map((val, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (val / 100) * radius;
      return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
    }).join(' ');
    svg += `<polygon points="${benchmarkPoints}" fill="none" stroke="${opts.colors.benchmark}" stroke-width="2" stroke-dasharray="5,3"/>`;
  }

  // Data polygon
  const dataPoints = data.values.map((val, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = (val / 100) * radius;
    return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
  }).join(' ');
  svg += `<polygon points="${dataPoints}" fill="${opts.colors.primary}" fill-opacity="${opts.fillOpacity}" stroke="${opts.colors.primary}" stroke-width="2"/>`;

  // Data points
  data.values.forEach((val, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    svg += `<circle cx="${x}" cy="${y}" r="4" fill="${opts.colors.primary}"/>`;
  });

  // Labels
  if (opts.showLabels) {
    data.labels.forEach((label, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Adjust text anchor based on position
      let anchor = 'middle';
      if (Math.cos(angle) > 0.3) anchor = 'start';
      else if (Math.cos(angle) < -0.3) anchor = 'end';

      const displayLabel = opts.showValues
        ? `${truncateText(label, 12)} (${data.values[i]})`
        : truncateText(label, 12);

      svg += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="'Open Sans', sans-serif" font-size="11" fill="${COLORS.text}">${escapeXml(displayLabel)}</text>`;
    });
  }

  // Legend for benchmark
  if (data.benchmarkValues) {
    const legendY = opts.height - 15;
    svg += `<line x1="20" y1="${legendY}" x2="50" y2="${legendY}" stroke="${opts.colors.primary}" stroke-width="2"/>`;
    svg += `<text x="55" y="${legendY + 4}" font-family="'Open Sans', sans-serif" font-size="10" fill="${COLORS.text}">Your Score</text>`;
    svg += `<line x1="130" y1="${legendY}" x2="160" y2="${legendY}" stroke="${opts.colors.benchmark}" stroke-width="2" stroke-dasharray="5,3"/>`;
    svg += `<text x="165" y="${legendY + 4}" font-family="'Open Sans', sans-serif" font-size="10" fill="${COLORS.text}">Benchmark</text>`;
  }

  svg += '</svg>';
  return wrapChartInContainer(svg, { title: data.title || 'Radar Chart' });
}

// ============================================================================
// HORIZONTAL BAR CHART
// ============================================================================

export interface BarChartDataItem {
  label: string;
  value: number;
  benchmark?: number;
  color?: string;
}

export interface BarChartData {
  items: BarChartDataItem[];
  title?: string;
  maxValue?: number;
}

export interface BarChartOptions {
  width?: number;
  barHeight?: number;
  showBenchmark?: boolean;
  showValues?: boolean;
  colorByScore?: boolean;
}

/**
 * Generate horizontal bar chart SVG
 */
export function generateHorizontalBarChartSVG(
  data: BarChartData,
  options?: BarChartOptions
): string {
  const opts = {
    width: options?.width ?? 600,
    barHeight: options?.barHeight ?? 30,
    showBenchmark: options?.showBenchmark ?? true,
    showValues: options?.showValues ?? true,
    colorByScore: options?.colorByScore ?? true,
  };

  const labelWidth = 140;
  const valueWidth = 50;
  const chartWidth = opts.width - labelWidth - valueWidth - 20;
  const barGap = 8;
  const height = 50 + data.items.length * (opts.barHeight + barGap) + 30;
  const maxVal = data.maxValue ?? 100;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${height}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${opts.width}" height="${height}" fill="white" rx="4"/>`;

  // Title
  if (data.title) {
    svg += `<text x="${opts.width / 2}" y="28" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(data.title)}</text>`;
  }

  // Bars
  data.items.forEach((item, i) => {
    const y = 50 + i * (opts.barHeight + barGap);
    const barWidth = (item.value / maxVal) * chartWidth;
    const color = item.color || (opts.colorByScore ? getBandColor(item.value) : COLORS.primary);

    // Label
    const displayLabel = truncateText(item.label, 18);
    svg += `<text x="${labelWidth - 8}" y="${y + opts.barHeight / 2 + 5}" text-anchor="end" font-family="'Open Sans', sans-serif" font-size="12" fill="${COLORS.text}">${escapeXml(displayLabel)}</text>`;

    // Background bar
    svg += `<rect x="${labelWidth}" y="${y}" width="${chartWidth}" height="${opts.barHeight}" fill="${COLORS.background}" rx="4"/>`;

    // Value bar
    svg += `<rect x="${labelWidth}" y="${y}" width="${Math.max(barWidth, 4)}" height="${opts.barHeight}" fill="${color}" rx="4"/>`;

    // Benchmark line (if provided)
    if (opts.showBenchmark && item.benchmark !== undefined) {
      const benchmarkX = labelWidth + (item.benchmark / maxVal) * chartWidth;
      svg += `<line x1="${benchmarkX}" y1="${y}" x2="${benchmarkX}" y2="${y + opts.barHeight}" stroke="${COLORS.primary}" stroke-width="2" stroke-dasharray="4,2"/>`;
      svg += `<circle cx="${benchmarkX}" cy="${y + opts.barHeight / 2}" r="4" fill="${COLORS.primary}"/>`;
    }

    // Value label
    if (opts.showValues) {
      const valueX = labelWidth + chartWidth + 8;
      svg += `<text x="${valueX}" y="${y + opts.barHeight / 2 + 5}" font-family="'Open Sans', sans-serif" font-size="12" font-weight="600" fill="${COLORS.text}">${item.value}</text>`;
    }
  });

  // Legend for benchmark
  if (opts.showBenchmark && data.items.some(i => i.benchmark !== undefined)) {
    const legendY = height - 15;
    svg += `<line x1="${labelWidth}" y1="${legendY}" x2="${labelWidth + 25}" y2="${legendY}" stroke="${COLORS.primary}" stroke-width="2" stroke-dasharray="4,2"/>`;
    svg += `<circle cx="${labelWidth + 12.5}" cy="${legendY}" r="3" fill="${COLORS.primary}"/>`;
    svg += `<text x="${labelWidth + 32}" y="${legendY + 4}" font-family="'Open Sans', sans-serif" font-size="10" fill="${COLORS.text}">Industry Benchmark</text>`;
  }

  svg += '</svg>';
  return wrapChartInContainer(svg, { title: data.title || 'Bar Chart' });
}

// ============================================================================
// DONUT CHART
// ============================================================================

export interface DonutChartSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartData {
  segments: DonutChartSegment[];
  centerValue?: string;
  centerLabel?: string;
  title?: string;
}

export interface DonutChartOptions {
  width?: number;
  height?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
}

/**
 * Generate donut chart SVG
 */
export function generateDonutChartSVG(
  data: DonutChartData,
  options?: DonutChartOptions
): string {
  const opts = {
    width: options?.width ?? 300,
    height: options?.height ?? 300,
    showLegend: options?.showLegend ?? true,
    showPercentages: options?.showPercentages ?? true,
  };

  const defaultColors = [COLORS.excellence, COLORS.proficiency, COLORS.attention, COLORS.critical, COLORS.primary, COLORS.accent];
  const legendOffset = opts.showLegend ? 60 : 0;
  const titleOffset = data.title ? 30 : 0;
  const centerX = opts.width / 2;
  const centerY = (opts.height - legendOffset) / 2 + titleOffset;
  const outerRadius = Math.min(opts.width, opts.height - legendOffset - titleOffset) / 2 - 30;
  const innerRadius = outerRadius * 0.6;
  const totalHeight = opts.height;

  const total = data.segments.reduce((sum, seg) => sum + seg.value, 0);
  if (total === 0) {
    return generateFallbackSvg('Donut Chart', 'No data available', opts.width);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${totalHeight}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${opts.width}" height="${totalHeight}" fill="white" rx="4"/>`;

  // Title
  if (data.title) {
    svg += `<text x="${centerX}" y="22" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="14" font-weight="600" fill="${COLORS.primary}">${escapeXml(data.title)}</text>`;
  }

  // Draw segments
  let currentAngle = -90;
  data.segments.forEach((segment, i) => {
    const percentage = segment.value / total;
    const angle = percentage * 360;
    const color = segment.color || defaultColors[i % defaultColors.length];

    if (angle > 0.5) { // Only draw if segment is significant
      const outerStart = polarToCartesian(centerX, centerY, outerRadius, currentAngle);
      const outerEnd = polarToCartesian(centerX, centerY, outerRadius, currentAngle + angle);
      const innerStart = polarToCartesian(centerX, centerY, innerRadius, currentAngle);
      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, currentAngle + angle);

      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${outerStart.x} ${outerStart.y}
              A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
              L ${innerEnd.x} ${innerEnd.y}
              A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
              Z`;
      svg += `<path d="${path}" fill="${color}"/>`;
    }

    currentAngle += angle;
  });

  // Center circle (white)
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${innerRadius - 5}" fill="white"/>`;

  // Center text
  if (data.centerValue) {
    svg += `<text x="${centerX}" y="${centerY + 8}" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="24" font-weight="700" fill="${COLORS.primary}">${escapeXml(data.centerValue)}</text>`;
  }
  if (data.centerLabel) {
    svg += `<text x="${centerX}" y="${centerY + 28}" text-anchor="middle" font-family="'Open Sans', sans-serif" font-size="11" fill="${COLORS.lightGray}">${escapeXml(data.centerLabel)}</text>`;
  }

  // Legend
  if (opts.showLegend) {
    const legendY = opts.height - legendOffset + 15;
    const legendItemWidth = opts.width / Math.min(data.segments.length, 2);

    data.segments.forEach((segment, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col * legendItemWidth + 20;
      const y = legendY + row * 22;
      const color = segment.color || defaultColors[i % defaultColors.length];
      const percentage = ((segment.value / total) * 100).toFixed(0);

      svg += `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="2" fill="${color}"/>`;
      const label = opts.showPercentages
        ? `${truncateText(segment.label, 12)} (${percentage}%)`
        : truncateText(segment.label, 15);
      svg += `<text x="${x + 18}" y="${y}" font-family="'Open Sans', sans-serif" font-size="11" fill="${COLORS.text}">${escapeXml(label)}</text>`;
    });
  }

  svg += '</svg>';
  return wrapChartInContainer(svg, { title: data.title || 'Donut Chart' });
}

// ============================================================================
// GAUGE CHART
// ============================================================================

export interface GaugeChartData {
  value: number;
  label: string;
  benchmark?: number;
  maxValue?: number;
}

export interface GaugeChartOptions {
  width?: number;
  height?: number;
  showBenchmark?: boolean;
}

/**
 * Generate semi-circular gauge chart SVG
 */
export function generateGaugeChartSVG(
  data: GaugeChartData,
  options?: GaugeChartOptions
): string {
  const opts = {
    width: options?.width ?? 200,
    height: options?.height ?? 140,
    showBenchmark: options?.showBenchmark ?? true,
  };

  const centerX = opts.width / 2;
  const centerY = opts.height - 30;
  const radius = Math.min(opts.width / 2, opts.height) - 35;
  const strokeWidth = 20;
  const maxVal = data.maxValue ?? 100;
  const color = getBandColor(data.value);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${opts.width}" height="${opts.height}" fill="white" rx="4"/>`;

  // Background arc (semi-circle)
  const bgPath = describeArc(centerX, centerY, radius, 180, 360);
  svg += `<path d="${bgPath}" fill="none" stroke="${COLORS.background}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;

  // Value arc
  const percentage = Math.min(data.value / maxVal, 1);
  const endAngle = 180 + percentage * 180;
  if (percentage > 0) {
    const valuePath = describeArc(centerX, centerY, radius, 180, endAngle);
    svg += `<path d="${valuePath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
  }

  // Benchmark marker
  if (opts.showBenchmark && data.benchmark !== undefined) {
    const benchmarkPercentage = Math.min(data.benchmark / maxVal, 1);
    const benchmarkAngle = 180 + benchmarkPercentage * 180;
    const marker = polarToCartesian(centerX, centerY, radius, benchmarkAngle);
    svg += `<circle cx="${marker.x}" cy="${marker.y}" r="6" fill="${COLORS.primary}" stroke="white" stroke-width="2"/>`;
  }

  // Center value
  svg += `<text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="28" font-weight="700" fill="${color}">${data.value}</text>`;
  svg += `<text x="${centerX}" y="${centerY + 10}" text-anchor="middle" font-family="'Open Sans', sans-serif" font-size="11" fill="${COLORS.lightGray}">out of ${maxVal}</text>`;

  // Label
  svg += `<text x="${centerX}" y="${opts.height - 8}" text-anchor="middle" font-family="'Open Sans', sans-serif" font-size="12" fill="${COLORS.text}">${escapeXml(data.label)}</text>`;

  svg += '</svg>';
  return wrapChartInContainer(svg, { title: data.label });
}

// ============================================================================
// SCORE DISTRIBUTION CHART
// ============================================================================

export interface ScoreDistributionData {
  excellence: number;
  proficiency: number;
  attention: number;
  critical: number;
  title?: string;
}

/**
 * Generate score band distribution chart
 */
export function generateScoreDistributionSVG(data: ScoreDistributionData): string {
  const total = data.excellence + data.proficiency + data.attention + data.critical;

  return generateDonutChartSVG({
    segments: [
      { label: 'Excellence', value: data.excellence, color: COLORS.excellence },
      { label: 'Proficiency', value: data.proficiency, color: COLORS.proficiency },
      { label: 'Attention', value: data.attention, color: COLORS.attention },
      { label: 'Critical', value: data.critical, color: COLORS.critical },
    ].filter(s => s.value > 0),
    centerValue: String(total),
    centerLabel: 'Total',
    title: data.title || 'Score Distribution'
  }, {
    showLegend: true,
    showPercentages: true
  });
}

// ============================================================================
// MINI SPARKLINE
// ============================================================================

export interface SparklineData {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Generate simple sparkline SVG
 */
export function generateSparklineSVG(data: SparklineData): string {
  const width = data.width ?? 100;
  const height = data.height ?? 30;
  const color = data.color ?? COLORS.primary;

  if (data.values.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"></svg>`;
  }

  const min = Math.min(...data.values);
  const max = Math.max(...data.values);
  const range = max - min || 1;
  const padding = 2;

  const points = data.values.map((val, i) => {
    const x = padding + (i / (data.values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

// ============================================================================
// WRAPPER UTILITIES
// ============================================================================

export interface ChartContainerOptions {
  title?: string;
  caption?: string;
  id?: string;
}

/**
 * Wrap SVG chart in accessible container
 */
export function wrapChartInContainer(
  svgContent: string,
  options?: ChartContainerOptions
): string {
  const title = options?.title ? escapeXml(options.title) : 'Chart';
  return `
    <div class="svg-chart-container" ${options?.id ? `id="${options.id}"` : ''} role="figure" aria-label="${title}">
      ${svgContent}
      ${options?.caption ? `<p class="chart-caption">${escapeXml(options.caption)}</p>` : ''}
    </div>
  `;
}

/**
 * Generate fallback SVG when chart can't be rendered (internal)
 */
function generateFallbackSvg(chartType: string, message: string, width: number = 300): string {
  return generatePlaceholderSVG(chartType, message, width, width * 0.5);
}

/**
 * Generates a branded placeholder SVG when chart data is insufficient
 * Maintains visual consistency even when charts can't render
 * Exported for use in report builders and error handling
 */
export function generatePlaceholderSVG(
  title: string = 'Visualization',
  reason: string = 'Data being processed',
  width: number = 400,
  height: number = 200
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"
         style="max-width: 100%; height: auto;" role="figure"
         aria-label="${escapeXml(title)} - ${escapeXml(reason)}">
      <rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>

      <!-- Decorative chart icon -->
      <g transform="translate(${width/2 - 30}, ${height/2 - 40})">
        <rect x="0" y="40" width="12" height="20" fill="${COLORS.primary}" opacity="0.3" rx="2"/>
        <rect x="16" y="25" width="12" height="35" fill="${COLORS.primary}" opacity="0.4" rx="2"/>
        <rect x="32" y="10" width="12" height="50" fill="${COLORS.primary}" opacity="0.5" rx="2"/>
        <rect x="48" y="30" width="12" height="30" fill="${COLORS.accent}" opacity="0.6" rx="2"/>
      </g>

      <!-- Title -->
      <text x="${width/2}" y="${height - 50}" text-anchor="middle"
            font-family="'Montserrat', 'Segoe UI', sans-serif" font-size="14"
            font-weight="600" fill="${COLORS.primary}">${escapeXml(title)}</text>

      <!-- Status message -->
      <text x="${width/2}" y="${height - 28}" text-anchor="middle"
            font-family="'Open Sans', 'Segoe UI', sans-serif" font-size="11"
            fill="${COLORS.lightGray}">${escapeXml(reason)}</text>
    </svg>
  `;

  return wrapChartInContainer(svg, { title });
}

/**
 * Safe chart generator that wraps any chart generation with fallback handling
 * Use this to ensure charts never break the report layout
 */
export function safeGenerateChart(
  generator: () => string,
  chartTitle: string,
  fallbackReason: string = 'Chart temporarily unavailable'
): string {
  try {
    const result = generator();
    if (!result || result.trim().length === 0) {
      return generatePlaceholderSVG(chartTitle, 'No content generated');
    }
    return result;
  } catch (error) {
    console.error(`Chart generation error for ${chartTitle}:`, error);
    return generatePlaceholderSVG(chartTitle, fallbackReason);
  }
}

// ============================================================================
// CHART STYLES
// ============================================================================

/**
 * Get CSS styles for SVG charts
 */
export function getSvgChartStyles(): string {
  return `
    .svg-chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .svg-chart-container svg {
      max-width: 100%;
      height: auto;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
    }

    .chart-caption {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.5rem;
      text-align: center;
      font-style: italic;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    @media print {
      .svg-chart-container {
        page-break-inside: avoid;
      }

      .svg-chart-container svg {
        box-shadow: none;
        border: 1px solid #e0e0e0;
      }
    }

    @media (max-width: 768px) {
      .chart-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Charts
  generateRadarChartSVG,
  generateHorizontalBarChartSVG,
  generateDonutChartSVG,
  generateGaugeChartSVG,
  generateScoreDistributionSVG,
  generateSparklineSVG,

  // Placeholder/Fallback
  generatePlaceholderSVG,
  safeGenerateChart,

  // Utilities
  wrapChartInContainer,
  getSvgChartStyles,
  getBandColor,
};
