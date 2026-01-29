/**
 * BizHealth.ai SVG Chart Renderer
 *
 * Pure SVG-based chart rendering that doesn't require native canvas dependencies.
 * Generates static SVG elements that can be embedded directly in HTML reports.
 */

// BizHealth brand colors
const COLORS = {
  primary: '#212653',      // BizNavy
  accent: '#969423',       // BizGreen
  excellence: '#27ae60',   // Green for excellence band
  proficiency: '#f39c12',  // Orange for proficiency
  attention: '#e67e22',    // Darker orange for attention
  critical: '#e74c3c',     // Red for critical
  background: '#f8f9fa',
  text: '#2c3e50',
  grid: '#e0e0e0',
  lightGray: '#95a5a6',
};

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
 * Escape text for SVG
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '...';
}

// ============================================================================
// HORIZONTAL BAR CHART
// ============================================================================

export interface BarChartData {
  label: string;
  value: number;
  maxValue?: number;
  benchmark?: number;
}

export interface BarChartOptions {
  title?: string;
  width?: number;
  height?: number;
  showValues?: boolean;
  showBenchmark?: boolean;
  colorByScore?: boolean;
  barHeight?: number;
}

/**
 * Generate horizontal bar chart SVG
 */
export function generateHorizontalBarChart(
  data: BarChartData[],
  options: BarChartOptions = {}
): string {
  const {
    title,
    width = 600,
    showValues = true,
    showBenchmark = false,
    colorByScore = true,
    barHeight = 30,
  } = options;

  const marginLeft = 140;
  const marginRight = 60;
  const marginTop = title ? 50 : 20;
  const marginBottom = 30;
  const chartWidth = width - marginLeft - marginRight;
  const spacing = 8;
  const height = marginTop + marginBottom + data.length * (barHeight + spacing);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="white" rx="4"/>`;

  // Title
  if (title) {
    svg += `<text x="${width / 2}" y="28" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(title)}</text>`;
  }

  // Bars
  data.forEach((item, i) => {
    const y = marginTop + i * (barHeight + spacing);
    const maxVal = item.maxValue || 100;
    const barWidth = (item.value / maxVal) * chartWidth;
    const color = colorByScore ? getBandColor(item.value) : COLORS.primary;

    // Label
    svg += `<text x="${marginLeft - 8}" y="${y + barHeight / 2 + 5}" text-anchor="end" font-family="'Segoe UI', sans-serif" font-size="12" fill="${COLORS.text}">${escapeXml(truncateText(item.label, 18))}</text>`;

    // Background bar
    svg += `<rect x="${marginLeft}" y="${y}" width="${chartWidth}" height="${barHeight}" fill="${COLORS.background}" rx="4"/>`;

    // Value bar
    svg += `<rect x="${marginLeft}" y="${y}" width="${Math.max(barWidth, 4)}" height="${barHeight}" fill="${color}" rx="4"/>`;

    // Benchmark line
    if (showBenchmark && item.benchmark !== undefined) {
      const benchX = marginLeft + (item.benchmark / maxVal) * chartWidth;
      svg += `<line x1="${benchX}" y1="${y}" x2="${benchX}" y2="${y + barHeight}" stroke="${COLORS.primary}" stroke-width="2" stroke-dasharray="4,2"/>`;
    }

    // Value label
    if (showValues) {
      const valueX = marginLeft + barWidth + 8;
      svg += `<text x="${valueX}" y="${y + barHeight / 2 + 5}" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="${COLORS.text}">${item.value}</text>`;
    }
  });

  svg += '</svg>';

  return wrapChart(svg, title || 'Bar Chart');
}

// ============================================================================
// RADAR CHART
// ============================================================================

export interface RadarChartData {
  label: string;
  value: number;
  maxValue?: number;
}

export interface RadarChartOptions {
  title?: string;
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  fillOpacity?: number;
}

/**
 * Generate radar/spider chart SVG
 */
export function generateRadarChart(
  data: RadarChartData[],
  options: RadarChartOptions = {}
): string {
  const {
    title,
    size = 350,
    showLabels = true,
    showValues = true,
    fillOpacity = 0.3,
  } = options;

  if (data.length < 3) {
    return generateFallbackSvg('Radar Chart', 'Requires at least 3 data points', size);
  }

  const centerX = size / 2;
  const centerY = size / 2 + (title ? 15 : 0);
  const radius = (size - 100) / 2;
  const titleOffset = title ? 30 : 0;
  const totalHeight = size + titleOffset;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalHeight}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${size}" height="${totalHeight}" fill="white" rx="4"/>`;

  // Title
  if (title) {
    svg += `<text x="${size / 2}" y="22" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(title)}</text>`;
  }

  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // Start from top

  // Draw grid circles
  [20, 40, 60, 80, 100].forEach((level) => {
    const r = (level / 100) * radius;
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${COLORS.grid}" stroke-width="1"/>`;
  });

  // Draw axis lines
  data.forEach((_, i) => {
    const angle = startAngle + i * angleStep;
    const x2 = centerX + radius * Math.cos(angle);
    const y2 = centerY + radius * Math.sin(angle);
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${x2}" y2="${y2}" stroke="${COLORS.grid}" stroke-width="1"/>`;
  });

  // Calculate data points
  const points: Array<{ x: number; y: number }> = [];
  data.forEach((item, i) => {
    const angle = startAngle + i * angleStep;
    const maxVal = item.maxValue || 100;
    const r = (item.value / maxVal) * radius;
    points.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    });
  });

  // Draw data polygon
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  svg += `<polygon points="${polygonPoints}" fill="${COLORS.primary}" fill-opacity="${fillOpacity}" stroke="${COLORS.primary}" stroke-width="2"/>`;

  // Draw data points
  points.forEach((p, i) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${COLORS.primary}"/>`;
  });

  // Draw labels
  if (showLabels) {
    data.forEach((item, i) => {
      const angle = startAngle + i * angleStep;
      const labelRadius = radius + 25;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);

      // Adjust text anchor based on position
      let anchor = 'middle';
      if (Math.cos(angle) > 0.3) anchor = 'start';
      else if (Math.cos(angle) < -0.3) anchor = 'end';

      const displayLabel = showValues
        ? `${truncateText(item.label, 12)} (${item.value})`
        : truncateText(item.label, 12);

      svg += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="'Segoe UI', sans-serif" font-size="11" fill="${COLORS.text}">${escapeXml(displayLabel)}</text>`;
    });
  }

  svg += '</svg>';

  return wrapChart(svg, title || 'Radar Chart');
}

// ============================================================================
// GAUGE / SEMI-DONUT CHART
// ============================================================================

export interface GaugeChartOptions {
  title?: string;
  size?: number;
  showLabel?: boolean;
  subtitle?: string;
}

/**
 * Generate semi-circular gauge chart SVG
 */
export function generateGaugeChart(
  value: number,
  maxValue: number = 100,
  options: GaugeChartOptions = {}
): string {
  const {
    title,
    size = 250,
    showLabel = true,
    subtitle,
  } = options;

  const titleOffset = title ? 30 : 0;
  const centerX = size / 2;
  const centerY = size / 2 + titleOffset;
  const radius = (size - 60) / 2;
  const strokeWidth = 20;
  const totalHeight = size / 2 + 60 + titleOffset;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalHeight}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${size}" height="${totalHeight}" fill="white" rx="4"/>`;

  // Title
  if (title) {
    svg += `<text x="${size / 2}" y="22" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(title)}</text>`;
  }

  // Background arc (semi-circle)
  const bgPath = describeArc(centerX, centerY, radius, 180, 360);
  svg += `<path d="${bgPath}" fill="none" stroke="${COLORS.background}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;

  // Value arc
  const percentage = Math.min(value / maxValue, 1);
  const endAngle = 180 + percentage * 180;
  const valuePath = describeArc(centerX, centerY, radius, 180, endAngle);
  const color = getBandColor(value);
  svg += `<path d="${valuePath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;

  // Center value
  if (showLabel) {
    svg += `<text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="36" font-weight="700" fill="${color}">${value}</text>`;
    svg += `<text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="14" fill="${COLORS.lightGray}">out of ${maxValue}</text>`;
  }

  // Subtitle
  if (subtitle) {
    svg += `<text x="${centerX}" y="${centerY + 40}" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="12" fill="${COLORS.text}">${escapeXml(subtitle)}</text>`;
  }

  svg += '</svg>';

  return wrapChart(svg, title || 'Gauge Chart');
}

/**
 * Helper function to describe an arc path
 */
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

// ============================================================================
// DONUT CHART
// ============================================================================

export interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartOptions {
  title?: string;
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
}

/**
 * Generate donut chart SVG
 */
export function generateDonutChart(
  data: DonutChartData[],
  options: DonutChartOptions = {}
): string {
  const {
    title,
    size = 300,
    showLegend = true,
    showPercentages = true,
  } = options;

  const defaultColors = [COLORS.excellence, COLORS.proficiency, COLORS.attention, COLORS.critical, COLORS.primary, COLORS.accent];
  const titleOffset = title ? 30 : 0;
  const legendOffset = showLegend ? 80 : 0;
  const centerX = size / 2;
  const centerY = size / 2 + titleOffset;
  const outerRadius = (size - 80) / 2;
  const innerRadius = outerRadius * 0.6;
  const totalHeight = size + titleOffset + legendOffset;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return generateFallbackSvg('Donut Chart', 'No data available', size);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalHeight}" style="max-width: 100%; height: auto;">`;
  svg += `<rect width="${size}" height="${totalHeight}" fill="white" rx="4"/>`;

  // Title
  if (title) {
    svg += `<text x="${size / 2}" y="22" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">${escapeXml(title)}</text>`;
  }

  // Draw segments
  let currentAngle = -90;
  data.forEach((item, i) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const color = item.color || defaultColors[i % defaultColors.length];

    if (angle > 0) {
      const path = describeDonutSegment(centerX, centerY, outerRadius, innerRadius, currentAngle, currentAngle + angle);
      svg += `<path d="${path}" fill="${color}"/>`;
    }

    currentAngle += angle;
  });

  // Center hole with total
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${innerRadius - 5}" fill="white"/>`;
  svg += `<text x="${centerX}" y="${centerY + 6}" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="24" font-weight="700" fill="${COLORS.primary}">${total}</text>`;

  // Legend
  if (showLegend) {
    const legendY = size + titleOffset + 10;
    const legendItemWidth = size / Math.min(data.length, 2);

    data.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col * legendItemWidth + 20;
      const y = legendY + row * 25;
      const color = item.color || defaultColors[i % defaultColors.length];
      const percentage = ((item.value / total) * 100).toFixed(0);

      svg += `<rect x="${x}" y="${y}" width="12" height="12" rx="2" fill="${color}"/>`;
      const label = showPercentages ? `${truncateText(item.label, 15)} (${percentage}%)` : truncateText(item.label, 15);
      svg += `<text x="${x + 18}" y="${y + 10}" font-family="'Segoe UI', sans-serif" font-size="11" fill="${COLORS.text}">${escapeXml(label)}</text>`;
    });
  }

  svg += '</svg>';

  return wrapChart(svg, title || 'Donut Chart');
}

/**
 * Helper function to describe a donut segment
 */
function describeDonutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${outerStart.x} ${outerStart.y}
          A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
          Z`;
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

export interface ProgressBarOptions {
  width?: number;
  height?: number;
  showLabel?: boolean;
  showValue?: boolean;
  colorByScore?: boolean;
}

/**
 * Generate a simple progress bar SVG
 */
export function generateProgressBar(
  value: number,
  maxValue: number = 100,
  label?: string,
  options: ProgressBarOptions = {}
): string {
  const {
    width = 200,
    height = 24,
    showLabel = true,
    showValue = true,
    colorByScore = true,
  } = options;

  const percentage = Math.min(value / maxValue, 1);
  const barWidth = width - 60;
  const color = colorByScore ? getBandColor(value) : COLORS.primary;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">`;

  // Background bar
  svg += `<rect x="0" y="${height / 2 - 6}" width="${barWidth}" height="12" fill="${COLORS.background}" rx="6"/>`;

  // Value bar
  svg += `<rect x="0" y="${height / 2 - 6}" width="${Math.max(percentage * barWidth, 12)}" height="12" fill="${color}" rx="6"/>`;

  // Value label
  if (showValue) {
    svg += `<text x="${barWidth + 8}" y="${height / 2 + 4}" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="${COLORS.text}">${value}/${maxValue}</text>`;
  }

  svg += '</svg>';

  return svg;
}

// ============================================================================
// FALLBACK / PLACEHOLDER SVG
// ============================================================================

/**
 * Generate fallback SVG when chart can't be rendered (internal)
 */
function generateFallbackSvg(chartType: string, message: string, size: number = 300): string {
  return generatePlaceholderSVG(chartType, message, size, size * 0.6);
}

/**
 * Generates a branded placeholder SVG when chart data is insufficient
 * Maintains visual consistency even when charts can't render
 * @export - available for external use in report builders
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

  return wrapChart(svg, title);
}

/**
 * Safe chart generator that wraps any chart generation with fallback handling
 * Use this to ensure charts never break the report layout
 */
export function safeGenerateChart<T>(
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

/**
 * Wrap SVG in a container with accessibility attributes
 */
function wrapChart(svg: string, title: string): string {
  return `
    <div class="svg-chart-container" role="figure" aria-label="${escapeXml(title)}">
      ${svg}
    </div>
  `;
}

/**
 * Generate CSS styles for SVG charts
 */
export function getSvgChartStyles(): string {
  return `
    .svg-chart-container {
      display: flex;
      justify-content: center;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .svg-chart-container svg {
      max-width: 100%;
      height: auto;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
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
  `;
}
