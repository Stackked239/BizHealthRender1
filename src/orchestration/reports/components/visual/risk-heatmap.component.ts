/**
 * BizHealth.ai Visual Components - Risk Heatmap Component
 *
 * 4x4 risk heatmap visualization for Phase 5 comprehensive reports.
 * Plots risks by severity (vertical) and likelihood (horizontal).
 *
 * This component differs from risk-matrix.component.ts:
 * - Uses a 4x4 grid instead of 5x5
 * - SVG-based rendering for PDF compatibility
 * - Color-coded background cells
 * - Designed for inline report integration
 *
 * @module risk-heatmap.component
 */

/**
 * Risk heatmap component options
 */
export interface RiskHeatmapOptions {
  /** Array of risk data points */
  data: RiskDataPoint[];
  /** Chart width in pixels */
  width: number;
  /** Chart height in pixels */
  height: number;
  /** Show legend */
  showLegend: boolean;
  /** Interactive mode (for web, false for PDF) */
  interactive: boolean;
  /** Color palette */
  colors: {
    critical: string;
    high: string;
    medium: string;
    low: string;
    grid: string;
  };
}

/**
 * Risk data point for heatmap
 */
export interface RiskDataPoint {
  /** Risk identifier */
  id: string;
  /** Risk label/title */
  label: string;
  /** X position (Likelihood 1-4) */
  x: number;
  /** Y position (Severity 1-4) */
  y: number;
  /** Risk category */
  category: string;
  /** Point color */
  color: string;
}

/**
 * Default color palette
 */
const DEFAULT_COLORS = {
  critical: '#dc3545',
  high: '#e67e22',
  medium: '#ffc107',
  low: '#28a745',
  grid: '#e9ecef'
};

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
 * Render risk heatmap component
 *
 * @param options - Heatmap configuration options
 * @returns HTML string with embedded SVG
 */
export function renderRiskHeatmap(options: RiskHeatmapOptions): string {
  const {
    data,
    width = 600,
    height = 400,
    showLegend = true,
    interactive = false,
    colors = DEFAULT_COLORS
  } = options;

  const padding = { top: 40, right: 20, bottom: 60, left: 80 };
  const gridWidth = width - padding.left - padding.right;
  const gridHeight = height - padding.top - padding.bottom;
  const cellWidth = gridWidth / 4;
  const cellHeight = gridHeight / 4;

  // Generate grid cells with background colors
  // Color matrix: severity (rows) x likelihood (cols)
  // Row 0 = Severity 4 (Critical), Row 3 = Severity 1 (Low)
  // Col 0 = Likelihood 1 (Low), Col 3 = Likelihood 4 (High)
  const cellColors = [
    // Severity 4 (Critical) row - top
    [colors.medium, colors.high, colors.critical, colors.critical],
    // Severity 3 (High) row
    [colors.low, colors.medium, colors.high, colors.critical],
    // Severity 2 (Medium) row
    [colors.low, colors.low, colors.medium, colors.high],
    // Severity 1 (Low) row - bottom
    [colors.low, colors.low, colors.low, colors.medium]
  ];

  const gridCells: string[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = padding.left + col * cellWidth;
      const y = padding.top + row * cellHeight;
      gridCells.push(`
        <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}"
              fill="${cellColors[row][col]}" fill-opacity="0.25"
              stroke="${colors.grid}" stroke-width="1"/>
      `);
    }
  }

  // Plot risk points
  // Note: y=4 (Critical) should be at top (row 0), y=1 (Low) at bottom (row 3)
  const riskPoints = data.map((risk, index) => {
    // Clamp values to 1-4 range
    const xVal = Math.max(1, Math.min(4, risk.x));
    const yVal = Math.max(1, Math.min(4, risk.y));

    // Calculate center position of the cell
    const cx = padding.left + (xVal - 0.5) * cellWidth;
    const cy = padding.top + (4 - yVal + 0.5) * cellHeight;

    // Determine color based on risk score
    const riskScore = xVal * yVal;
    const pointColor = riskScore >= 12 ? colors.critical :
                       riskScore >= 6 ? colors.high :
                       riskScore >= 3 ? colors.medium : colors.low;

    const riskNumber = index + 1;

    return `
      <g class="risk-point" ${interactive ? `style="cursor: pointer;"` : ''}>
        <circle cx="${cx}" cy="${cy}" r="14" fill="${pointColor}" stroke="#fff" stroke-width="2"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="600">
          ${riskNumber}
        </text>
        ${interactive ? `<title>${escapeHtml(risk.label)}</title>` : ''}
      </g>
    `;
  }).join('');

  // Axis labels
  const xLabels = ['Low', 'Medium', 'Med-High', 'High'];
  const yLabels = ['Low', 'Medium', 'High', 'Critical'];

  const xAxisLabels = xLabels.map((label, i) => `
    <text x="${padding.left + (i + 0.5) * cellWidth}" y="${height - 25}"
          text-anchor="middle" font-size="11" fill="#666" font-family="'Segoe UI', sans-serif">${label}</text>
  `).join('');

  const yAxisLabels = yLabels.map((label, i) => `
    <text x="${padding.left - 10}" y="${padding.top + (3 - i + 0.5) * cellHeight + 4}"
          text-anchor="end" font-size="11" fill="#666" font-family="'Segoe UI', sans-serif">${label}</text>
  `).join('');

  // Legend
  const legendHtml = showLegend ? `
    <g transform="translate(${width - 180}, ${height - 55})">
      <text x="0" y="0" font-size="10" font-weight="600" fill="#333" font-family="'Segoe UI', sans-serif">Risk Count by Severity</text>
      <g transform="translate(0, 12)">
        <circle cx="8" cy="6" r="6" fill="${colors.critical}"/>
        <text x="20" y="10" font-size="9" fill="#666">Critical (${data.filter(d => d.y === 4).length})</text>
      </g>
      <g transform="translate(0, 26)">
        <circle cx="8" cy="6" r="6" fill="${colors.high}"/>
        <text x="20" y="10" font-size="9" fill="#666">High (${data.filter(d => d.y === 3).length})</text>
      </g>
      <g transform="translate(80, 12)">
        <circle cx="8" cy="6" r="6" fill="${colors.medium}"/>
        <text x="20" y="10" font-size="9" fill="#666">Medium (${data.filter(d => d.y === 2).length})</text>
      </g>
      <g transform="translate(80, 26)">
        <circle cx="8" cy="6" r="6" fill="${colors.low}"/>
        <text x="20" y="10" font-size="9" fill="#666">Low (${data.filter(d => d.y === 1).length})</text>
      </g>
    </g>
  ` : '';

  return `
    <div class="svg-chart-container risk-heatmap" role="figure" aria-label="Risk Heat Map showing ${data.length} risks by severity and likelihood">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="white" rx="4"/>

        <!-- Title -->
        <text x="${width / 2}" y="24" text-anchor="middle" font-family="'Segoe UI', sans-serif"
              font-size="16" font-weight="600" fill="#212653">Risk Heat Map</text>

        <!-- Grid Cells -->
        ${gridCells.join('')}

        <!-- Risk Points -->
        ${riskPoints}

        <!-- X-Axis Labels -->
        ${xAxisLabels}

        <!-- Y-Axis Labels -->
        ${yAxisLabels}

        <!-- Axis Titles -->
        <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="12" font-weight="500" fill="#333"
              font-family="'Segoe UI', sans-serif">
          Likelihood &rarr;
        </text>
        <text x="15" y="${height / 2}" text-anchor="middle" font-size="12" font-weight="500" fill="#333"
              font-family="'Segoe UI', sans-serif"
              transform="rotate(-90, 15, ${height / 2})">
          Severity &rarr;
        </text>

        ${legendHtml}
      </svg>
    </div>
  `;
}

/**
 * Render risk heatmap from IDM risk data
 * P3.2 FIX: Added handling for empty risks array with informative fallback message
 *
 * @param risks - Array of risks from IDM/ReportContext
 * @returns HTML string for risk heatmap
 */
export function renderRiskHeatmapFromRisks(
  risks: Array<{
    id: string;
    narrative: string;
    severity: string | number;
    likelihood: string | number;
    category?: string;
    dimensionCode?: string;
  }>
): string {
  // P3.2 FIX: Handle empty risks array with informative message
  if (!risks || risks.length === 0) {
    return `
      <div class="no-risks-message" style="
        padding: 2rem;
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 1px solid #28a745;
        border-radius: 8px;
        text-align: center;
        margin: 1rem 0;
      ">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">✅</span>
        <p style="margin: 0.5rem 0 0 0; font-weight: 600; color: #155724; font-family: 'Montserrat', sans-serif; font-size: 1.1rem;">
          No Significant Risks Identified
        </p>
        <p style="font-size: 0.9rem; color: #1e7e34; margin-top: 0.5rem; font-family: 'Open Sans', sans-serif;">
          Your assessment did not identify any high-priority risks requiring immediate attention.
          Continue monitoring through regular reassessments.
        </p>
      </div>
    `;
  }

  // Convert risks to heatmap data points
  const data: RiskDataPoint[] = risks.map((risk, index) => {
    const severityVal = mapValueToScale4(risk.severity, 'severity');
    const likelihoodVal = mapValueToScale4(risk.likelihood, 'likelihood');

    // Determine color based on combined risk score
    const riskScore = severityVal * likelihoodVal;
    const color = riskScore >= 12 ? DEFAULT_COLORS.critical :
                  riskScore >= 6 ? DEFAULT_COLORS.high :
                  riskScore >= 3 ? DEFAULT_COLORS.medium : DEFAULT_COLORS.low;

    return {
      id: risk.id || `R${index + 1}`,
      label: risk.narrative?.substring(0, 80) || `Risk ${index + 1}`,
      x: likelihoodVal,
      y: severityVal,
      category: risk.category || risk.dimensionCode || 'General',
      color
    };
  });

  return renderRiskHeatmap({
    data,
    width: 600,
    height: 400,
    showLegend: true,
    interactive: false,
    colors: DEFAULT_COLORS
  });
}

/**
 * Render compact risk heatmap for inline use
 *
 * @param risks - Array of risks
 * @returns HTML string for compact heatmap
 */
export function renderCompactRiskHeatmap(
  risks: Array<{
    id: string;
    severity: string | number;
    likelihood: string | number;
  }>
): string {
  const data: RiskDataPoint[] = risks.map((risk, index) => ({
    id: risk.id || `R${index + 1}`,
    label: `Risk ${index + 1}`,
    x: mapValueToScale4(risk.likelihood, 'likelihood'),
    y: mapValueToScale4(risk.severity, 'severity'),
    category: '',
    color: DEFAULT_COLORS.critical
  }));

  return renderRiskHeatmap({
    data,
    width: 400,
    height: 280,
    showLegend: false,
    interactive: false,
    colors: DEFAULT_COLORS
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map string or numeric value to 1-4 scale
 */
function mapValueToScale4(
  value: string | number,
  type: 'severity' | 'likelihood'
): number {
  if (typeof value === 'number') {
    // Assume 0-100 scale, map to 1-4
    if (value <= 25) return 1;
    if (value <= 50) return 2;
    if (value <= 75) return 3;
    return 4;
  }

  const lower = String(value).toLowerCase();

  if (type === 'severity') {
    if (lower.includes('critical') || lower.includes('very high')) return 4;
    if (lower.includes('high')) return 3;
    if (lower.includes('medium') || lower.includes('moderate')) return 2;
    return 1; // low, minimal
  } else {
    // likelihood
    if (lower.includes('almost certain') || lower.includes('very high') || lower === 'high') return 4;
    if (lower.includes('likely') || lower.includes('medium-high')) return 3;
    if (lower.includes('possible') || lower.includes('medium') || lower.includes('moderate')) return 2;
    return 1; // unlikely, rare, low
  }
}
