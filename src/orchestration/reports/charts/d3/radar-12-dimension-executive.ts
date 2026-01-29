/**
 * BizHealth 12-Dimension Executive Radar Chart
 *
 * World-class executive visualization inspired by Affirm Consulting report.
 * Shows all 12 dimensions simultaneously with benchmark overlay.
 *
 * Key differentiator: Single comprehensive view (not split into multiple charts)
 * Target: CEO can identify strengths/gaps in <10 seconds
 *
 * Deploy to:
 * - Comprehensive Report: Executive Summary (Page 1)
 * - Owner's Report: Dashboard (Page 1)
 * - Executive Brief: Opening visual
 * - Category reports: Chapter overview
 *
 * NOT deployed to: Employee Reports
 */

import { BRAND_COLORS, getScoreColor, addAlpha } from '../../utils/color-utils.js';
import { normalizeDimensionCode, DIMENSION_ALIASES } from '../../constants/dimension-codes.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Dimension configuration with chapter grouping
 */
export interface DimensionConfig {
  name: string;
  shortName: string;
  icon: string;
  chapter: 'GE' | 'PH' | 'PL' | 'RS';
}

/**
 * Chapter configuration
 */
export interface ChapterConfig {
  name: string;
  fullName: string;
  icon: string;
  color: string;
}

/**
 * Radar chart data input
 */
export interface ExecutiveRadarChartData {
  companyName: string;
  overallScore: number;
  overallBand: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  dimensions: {
    code: string;
    score: number;
    benchmark: number;
    percentile: number;
  }[];
}

/**
 * Rendering options
 */
export interface ExecutiveRadarOptions {
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Show chapter quadrant backgrounds */
  showQuadrantBackgrounds?: boolean;
  /** Show benchmark overlay */
  showBenchmark?: boolean;
  /** Show percentile in labels */
  showPercentile?: boolean;
  /** Custom title */
  title?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Dimension ordering (critical for pattern recognition)
 * Grouped by chapter quadrant
 */
// NOTE: Using ITD (canonical code for Phase 1.5+) for IT & Data dimension
export const DIMENSION_ORDER = [
  'STR',
  'SAL',
  'MKT',
  'CXP', // Growth Engine quadrant (top-right)
  'OPS',
  'FIN', // Performance Health quadrant (bottom-right)
  'HRS',
  'LDG', // People Leadership quadrant (bottom-left)
  'TIN',
  'ITD', // IT & Data Security (canonical code)
  'RMS',
  'CMP', // Resilience Safeguards quadrant (top-left)
] as const;

/**
 * Dimension metadata configuration
 */
export const DIMENSION_CONFIG: Record<string, DimensionConfig> = {
  STR: { name: 'Strategy', shortName: 'Strategy', icon: '🎯', chapter: 'GE' },
  SAL: { name: 'Sales', shortName: 'Sales', icon: '💰', chapter: 'GE' },
  MKT: { name: 'Marketing', shortName: 'Marketing', icon: '📢', chapter: 'GE' },
  CXP: { name: 'Customer Experience', shortName: 'Customer', icon: '😊', chapter: 'GE' },
  OPS: { name: 'Operations', shortName: 'Operations', icon: '⚙️', chapter: 'PH' },
  FIN: { name: 'Financial Health', shortName: 'Financial', icon: '💵', chapter: 'PH' },
  HRS: { name: 'Human Resources', shortName: 'HR', icon: '👥', chapter: 'PL' },
  LDG: {
    name: 'Leadership & Governance',
    shortName: 'Leadership',
    icon: '🎖️',
    chapter: 'PL',
  },
  TIN: {
    name: 'Technology & Innovation',
    shortName: 'Technology',
    icon: '💻',
    chapter: 'RS',
  },
  ITD: { name: 'IT & Data Security', shortName: 'IT/Data', icon: '🖥️', chapter: 'RS' },
  IDS: { name: 'IT & Data Security', shortName: 'IT/Data', icon: '🖥️', chapter: 'RS' }, // Legacy alias
  RMS: { name: 'Risk Management', shortName: 'Risk', icon: '⚠️', chapter: 'RS' },
  CMP: { name: 'Compliance', shortName: 'Compliance', icon: '📋', chapter: 'RS' },
};

/**
 * Chapter color configuration
 */
export const CHAPTER_COLORS: Record<string, string> = {
  GE: '#28a745', // Growth Engine - Green
  PH: '#0d6efd', // Performance Health - Blue
  PL: '#ffc107', // People Leadership - Yellow/Gold
  RS: '#dc3545', // Resilience Safeguards - Red
};

/**
 * Chapter metadata
 */
export const CHAPTER_CONFIG: Record<string, ChapterConfig> = {
  GE: { name: 'Growth', fullName: 'Growth Engine', icon: '🚀', color: '#28a745' },
  PH: {
    name: 'Performance',
    fullName: 'Performance & Health',
    icon: '📊',
    color: '#0d6efd',
  },
  PL: { name: 'People', fullName: 'People & Leadership', icon: '👥', color: '#ffc107' },
  RS: {
    name: 'Resilience',
    fullName: 'Resilience & Safeguards',
    icon: '🛡️',
    color: '#dc3545',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Get score band color
 */
function getScoreBandColor(score: number): string {
  if (score >= 75) return '#28a745';
  if (score >= 50) return '#0d6efd';
  if (score >= 25) return '#ffc107';
  return '#dc3545';
}

/**
 * Get band background color with transparency
 */
function getBandBackgroundColor(score: number): string {
  if (score >= 75) return '#28a745';
  if (score >= 50) return '#0d6efd';
  if (score >= 25) return '#ffc107';
  return '#dc3545';
}

/**
 * Get ordinal suffix for a number
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Get text anchor based on angle position
 */
function getTextAnchor(angle: number): string {
  const degrees = ((angle * 180) / Math.PI + 90) % 360;
  if (degrees > 45 && degrees < 135) return 'start';
  if (degrees > 225 && degrees < 315) return 'end';
  return 'middle';
}

/**
 * Get chapter display name
 */
function getChapterName(code: string): string {
  return CHAPTER_CONFIG[code]?.name || code;
}

/**
 * Generate quadrant background paths for chapter groupings
 */
function generateQuadrantBackgrounds(
  cx: number,
  cy: number,
  radius: number
): string {
  // Each quadrant covers a portion of the 12 dimensions
  // GE: 4 dims (STR, SAL, MKT, CXP) - angles 0-120 from top
  // PH: 2 dims (OPS, FIN) - angles 120-180
  // PL: 2 dims (HRS, LDG) - angles 180-240
  // RS: 4 dims (TIN, IDS, RMS, CMP) - angles 240-360

  const quadrants = [
    { chapter: 'GE', startAngle: -90, endAngle: 30 },
    { chapter: 'PH', startAngle: 30, endAngle: 90 },
    { chapter: 'PL', startAngle: 90, endAngle: 150 },
    { chapter: 'RS', startAngle: 150, endAngle: 270 },
  ];

  return quadrants
    .map(q => {
      const color = CHAPTER_COLORS[q.chapter];
      const startRad = (q.startAngle * Math.PI) / 180;
      const endRad = (q.endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = q.endAngle - q.startAngle > 180 ? 1 : 0;

      return `
      <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
            fill="${color}" fill-opacity="0.03"/>
    `;
    })
    .join('');
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Render the 12-Dimension Executive Radar Chart
 *
 * @param data - Chart data containing company name, scores, and dimensions
 * @param options - Optional rendering configuration
 * @returns HTML string containing the SVG radar chart
 *
 * @example
 * ```typescript
 * const html = render12DimensionExecutiveRadar({
 *   companyName: 'Acme Corp',
 *   overallScore: 67,
 *   overallBand: 'Proficiency',
 *   dimensions: [
 *     { code: 'STR', score: 72, benchmark: 65, percentile: 68 },
 *     // ... 11 more dimensions
 *   ]
 * });
 * ```
 */
export function render12DimensionExecutiveRadar(
  data: ExecutiveRadarChartData,
  options: ExecutiveRadarOptions = {}
): string {
  const {
    width = 650,
    height = 650,
    showQuadrantBackgrounds = true,
    showBenchmark = true,
    showPercentile = true,
    title,
  } = options;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = 220;
  const levels = 5; // Concentric circles at 20, 40, 60, 80, 100
  const labelRadius = maxRadius + 55;

  const numDimensions = DIMENSION_ORDER.length;
  const angleStep = (2 * Math.PI) / numDimensions;

  // Map data to ordered dimensions with defensive lookup
  // Handles ITD/IDS mismatch and other alias variations
  const orderedData = DIMENSION_ORDER.map(code => {
    // Try direct match first
    let dim = data.dimensions.find(d => d.code === code);

    // If not found, try normalized matching (handles IDS → ITD, etc.)
    if (!dim) {
      dim = data.dimensions.find(d => {
        const normalizedDataCode = normalizeDimensionCode(d.code);
        const normalizedTargetCode = normalizeDimensionCode(code);
        return normalizedDataCode === normalizedTargetCode;
      });

      // Log if we resolved via alias
      if (dim) {
        console.info(
          `[Radar] Dimension ${code} resolved via alias from "${dim.code}"`
        );
      }
    }

    // If still not found, log warning
    if (!dim) {
      console.warn(
        `[Radar] No data found for dimension ${code}. ` +
        `Available codes: ${data.dimensions.map(d => d.code).join(', ')}`
      );
    }

    return {
      code,
      config: DIMENSION_CONFIG[code] || DIMENSION_CONFIG['ITD'], // Fallback for safety
      score: dim?.score ?? 0,
      benchmark: dim?.benchmark ?? 50,
      percentile: dim?.percentile ?? 50,
      hasValidData: !!dim,
    };
  });

  // Generate concentric level circles with score band colors
  const levelCircles = Array.from({ length: levels }, (_, i) => {
    const radius = (maxRadius / levels) * (i + 1);
    const levelValue = ((i + 1) * 100) / levels;
    const bandColor = getBandBackgroundColor(levelValue);

    return `
      <circle cx="${centerX}" cy="${centerY}" r="${radius}"
              fill="${bandColor}" fill-opacity="0.03"
              stroke="#e9ecef" stroke-width="1"
              stroke-dasharray="${i < levels - 1 ? '4,4' : 'none'}"/>
      <text x="${centerX + 8}" y="${centerY - radius + 5}"
            font-size="9" fill="#999" font-family="Open Sans, Arial, sans-serif">${levelValue}</text>
    `;
  }).join('');

  // Generate chapter quadrant backgrounds (subtle)
  const quadrantBackgrounds = showQuadrantBackgrounds
    ? generateQuadrantBackgrounds(centerX, centerY, maxRadius)
    : '';

  // Generate axis lines and dimension labels
  const axisElements = orderedData
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const axisEndX = centerX + maxRadius * Math.cos(angle);
      const axisEndY = centerY + maxRadius * Math.sin(angle);
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      const chapterColor = CHAPTER_COLORS[dim.config.chapter];
      const scoreColor = getScoreBandColor(dim.score);

      // Determine text anchor based on position
      const textAnchor = getTextAnchor(angle);

      return `
      <!-- Axis line -->
      <line x1="${centerX}" y1="${centerY}" x2="${axisEndX}" y2="${axisEndY}"
            stroke="#ddd" stroke-width="1"/>

      <!-- Dimension label group -->
      <g class="dimension-label" data-dimension="${dim.code}">
        <!-- Icon -->
        <text x="${labelX}" y="${labelY - 12}" text-anchor="${textAnchor}"
              font-size="16">${dim.config.icon}</text>

        <!-- Dimension name -->
        <text x="${labelX}" y="${labelY + 4}" text-anchor="${textAnchor}"
              font-size="10" fill="${BRAND_COLORS.navy}" font-family="Montserrat, Arial, sans-serif" font-weight="600">
          ${escapeHtml(dim.config.shortName)}
        </text>

        <!-- Score -->
        <text x="${labelX}" y="${labelY + 18}" text-anchor="${textAnchor}"
              font-size="13" fill="${scoreColor}" font-family="Montserrat, Arial, sans-serif" font-weight="700">
          ${dim.score}
        </text>

        ${
          showPercentile
            ? `
          <!-- Percentile (small) -->
          <text x="${labelX}" y="${labelY + 30}" text-anchor="${textAnchor}"
                font-size="9" fill="#999" font-family="Open Sans, Arial, sans-serif">
            ${dim.percentile}${getOrdinalSuffix(dim.percentile)} %ile
          </text>
        `
            : ''
        }
      </g>
    `;
    })
    .join('');

  // Generate benchmark polygon points
  const benchmarkPoints = orderedData
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (dim.benchmark / 100) * maxRadius;
      return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
    })
    .join(' ');

  // Generate company polygon points
  const companyPoints = orderedData
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (dim.score / 100) * maxRadius;
      return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
    })
    .join(' ');

  // Generate score dots at each vertex
  const scoreDots = orderedData
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (dim.score / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const scoreColor = getScoreBandColor(dim.score);

      return `
      <circle cx="${x}" cy="${y}" r="7"
              fill="${scoreColor}" stroke="white" stroke-width="2"
              class="score-dot" data-dimension="${dim.code}" data-score="${dim.score}"/>
    `;
    })
    .join('');

  // Center overall score display
  const overallColor = getScoreBandColor(data.overallScore);

  // Generate ARIA description for accessibility
  const ariaDescription = orderedData
    .map(
      d =>
        `${d.config.name}: ${d.score}/100 (${d.percentile}th percentile, benchmark: ${d.benchmark})`
    )
    .join('. ');

  return `
    <div class="executive-radar-container" style="
      text-align: center;
      margin: 32pt 0;
      page-break-inside: avoid;
    " role="figure" aria-label="12-Dimension Executive Radar Chart for ${escapeHtml(data.companyName)}: Overall score ${data.overallScore}/100 (${data.overallBand}). ${ariaDescription}">
      ${title ? `<h3 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 18pt; font-weight: 700; color: ${BRAND_COLORS.navy}; margin-bottom: 16pt;">${escapeHtml(title)}</h3>` : ''}

      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
           xmlns="http://www.w3.org/2000/svg"
           style="font-family: 'Open Sans', Arial, sans-serif; max-width: 100%; height: auto;"
           role="img" aria-hidden="true">

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#fafbfc" rx="16"/>

        <!-- Quadrant backgrounds (subtle chapter colors) -->
        ${quadrantBackgrounds}

        <!-- Concentric level circles -->
        ${levelCircles}

        <!-- Axis lines and labels -->
        ${axisElements}

        ${
          showBenchmark
            ? `
          <!-- Benchmark polygon (dashed, behind company) -->
          <polygon points="${benchmarkPoints}"
                   fill="none"
                   stroke="#999"
                   stroke-width="2"
                   stroke-dasharray="8,4"
                   opacity="0.6"/>
        `
            : ''
        }

        <!-- Company polygon (filled) -->
        <polygon points="${companyPoints}"
                 fill="${BRAND_COLORS.navy}"
                 fill-opacity="0.25"
                 stroke="${BRAND_COLORS.navy}"
                 stroke-width="3"/>

        <!-- Score dots at vertices -->
        ${scoreDots}

        <!-- Center overall score -->
        <circle cx="${centerX}" cy="${centerY}" r="50"
                fill="white" stroke="${overallColor}" stroke-width="5"/>
        <text x="${centerX}" y="${centerY - 8}" text-anchor="middle"
              font-family="Montserrat, Arial, sans-serif" font-size="32" font-weight="700" fill="${overallColor}">
          ${data.overallScore}
        </text>
        <text x="${centerX}" y="${centerY + 12}" text-anchor="middle"
              font-family="Open Sans, Arial, sans-serif" font-size="11" fill="#666">
          /100
        </text>
        <text x="${centerX}" y="${centerY + 28}" text-anchor="middle"
              font-family="Montserrat, Arial, sans-serif" font-size="10" font-weight="600" fill="${overallColor}">
          ${data.overallBand.toUpperCase()}
        </text>

        <!-- Legend -->
        <g transform="translate(${width - 160}, ${height - 70})">
          <rect x="-10" y="-15" width="160" height="60" fill="white" fill-opacity="0.9" rx="8"/>
          <line x1="0" y1="0" x2="30" y2="0" stroke="${BRAND_COLORS.navy}" stroke-width="3"/>
          <text x="38" y="4" font-size="11" fill="${BRAND_COLORS.navy}" font-weight="600">${escapeHtml(data.companyName)}</text>
          ${
            showBenchmark
              ? `
            <line x1="0" y1="22" x2="30" y2="22" stroke="#999" stroke-width="2" stroke-dasharray="8,4"/>
            <text x="38" y="26" font-size="11" fill="#666">Industry Benchmark</text>
          `
              : ''
          }
        </g>

        <!-- Chapter legend (bottom) -->
        <g transform="translate(${centerX - 200}, ${height - 25})">
          ${Object.entries(CHAPTER_CONFIG)
            .map(
              ([ch, config], i) => `
            <circle cx="${i * 100}" cy="0" r="6" fill="${config.color}"/>
            <text x="${i * 100 + 12}" y="4" font-size="9" fill="#666">${config.name}</text>
          `
            )
            .join('')}
        </g>

      </svg>
    </div>
  `;
}

/**
 * Render a compact version of the 12-dimension radar (for smaller spaces)
 */
export function render12DimensionRadarCompact(
  data: ExecutiveRadarChartData,
  options: Omit<ExecutiveRadarOptions, 'width' | 'height'> = {}
): string {
  return render12DimensionExecutiveRadar(data, {
    ...options,
    width: 450,
    height: 450,
    showPercentile: false,
    showQuadrantBackgrounds: false,
  });
}

/**
 * Render the radar chart with custom dimension subset
 */
export function renderExecutiveRadarWithDimensions(
  data: Omit<ExecutiveRadarChartData, 'dimensions'>,
  dimensions: ExecutiveRadarChartData['dimensions'],
  options: ExecutiveRadarOptions = {}
): string {
  return render12DimensionExecutiveRadar(
    {
      ...data,
      dimensions,
    },
    options
  );
}
