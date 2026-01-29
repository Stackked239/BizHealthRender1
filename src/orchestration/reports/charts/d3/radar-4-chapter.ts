/**
 * BizHealth 4-Chapter Benchmark Radar
 *
 * Simplified radar showing 4 chapters (not 12 dimensions).
 * Use for: Quick overview, Owner's Report alternative view, chapter summaries.
 *
 * Provides a high-level view of business health across the four core chapters:
 * - Growth Engine (GE)
 * - Performance & Health (PH)
 * - People & Leadership (PL)
 * - Resilience & Safeguards (RS)
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';
import { extractNumericValue, formatBenchmark } from '../../utils/idm-extractors.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Chapter code type
 */
export type ChapterCode = 'GE' | 'PH' | 'PL' | 'RS';

/**
 * Chapter data for the radar
 */
export interface ChapterRadarItem {
  code: ChapterCode;
  name: string;
  score: number;
  benchmark: number;
  icon?: string;
}

/**
 * Chapter radar chart data
 */
export interface ChapterRadarData {
  companyName: string;
  chapters: ChapterRadarItem[];
}

/**
 * Rendering options
 */
export interface ChapterRadarOptions {
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Show benchmark overlay */
  showBenchmark?: boolean;
  /** Optional title */
  title?: string;
  /** Show score values in labels */
  showScores?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Chapter configuration with colors and icons
 */
export const CHAPTER_CONFIG: Record<
  ChapterCode,
  { name: string; fullName: string; icon: string; color: string }
> = {
  // Using abbreviated 'name' for radar chart labels to avoid truncation
  // 'fullName' contains the complete chapter name for other contexts
  GE: { name: 'Growth', fullName: 'Growth Engine', icon: '🚀', color: '#28a745' },
  PH: {
    name: 'Performance',
    fullName: 'Performance & Health',
    icon: '📊',
    color: '#0d6efd',
  },
  PL: {
    name: 'People',
    fullName: 'People & Leadership',
    icon: '👥',
    color: '#ffc107',
  },
  RS: {
    name: 'Resilience',
    fullName: 'Resilience & Safeguards',
    icon: '🛡️',
    color: '#dc3545',
  },
};

/**
 * Default chapter order
 */
export const CHAPTER_ORDER: ChapterCode[] = ['GE', 'PH', 'PL', 'RS'];

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

  return values
    .map((value, index) => {
      const radius = (value / maxValue) * maxRadius;
      const angle = index * angleStep;
      const point = polarToCartesian(centerX, centerY, radius, angle);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

/**
 * Generate concentric grid circles
 */
function generateGridCircles(
  centerX: number,
  centerY: number,
  maxRadius: number,
  steps: number = 5
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
        stroke="#e9ecef"
        stroke-width="1"
      />
    `);
  }

  return circles.join('');
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Render the 4-Chapter Benchmark Radar
 *
 * @param data - Chart data containing company name and chapter scores
 * @param options - Optional rendering configuration
 * @returns HTML string containing the SVG radar chart
 *
 * @example
 * ```typescript
 * const html = render4ChapterRadar({
 *   companyName: 'Acme Corp',
 *   chapters: [
 *     { code: 'GE', name: 'Growth Engine', score: 72, benchmark: 65 },
 *     { code: 'PH', name: 'Performance & Health', score: 58, benchmark: 60 },
 *     { code: 'PL', name: 'People & Leadership', score: 81, benchmark: 55 },
 *     { code: 'RS', name: 'Resilience & Safeguards', score: 45, benchmark: 50 },
 *   ]
 * });
 * ```
 */
export function render4ChapterRadar(
  data: ChapterRadarData,
  options: ChapterRadarOptions = {}
): string {
  // P2.2 FIX: Enhanced spacing to ensure labels stay within viewBox (2025-12-31)
  const {
    width = 500,
    height = 560,  // Increased height to accommodate enhanced legend
    showBenchmark = true,
    showScores = true,
    title = 'Strategic Balance Overview',
  } = options;

  const centerX = width / 2;
  const centerY = 210;  // P2.2 FIX: Adjusted center for better vertical distribution
  const maxRadius = 150;  // P2.2 FIX: Reduced from 160 to ensure labels fit within bounds
  const labelRadius = maxRadius + 45;  // P2.2 FIX: Adjusted label offset

  const numChapters = 4;
  const angleStep = 360 / numChapters;

  // Ensure chapters are in correct order
  // FIX: Use extractNumericValue to handle object benchmarks properly
  const orderedChapters = CHAPTER_ORDER.map(code => {
    const ch = data.chapters.find(c => c.code === code);
    const config = CHAPTER_CONFIG[code];
    return {
      code,
      name: ch?.name || config.name,
      score: extractNumericValue(ch?.score, 0),
      benchmark: extractNumericValue(ch?.benchmark, 50),
      icon: ch?.icon || config.icon,
      color: config.color,
    };
  });

  // Generate level circles
  const levelCircles = generateGridCircles(centerX, centerY, maxRadius, 5);

  // Generate axes and labels
  const axisElements = orderedChapters
    .map((ch, i) => {
      const angle = i * angleStep;
      const endPoint = polarToCartesian(centerX, centerY, maxRadius, angle);
      const labelPoint = polarToCartesian(centerX, centerY, labelRadius, angle);

      // Determine text anchor based on position
      let textAnchor = 'middle';
      if (angle > 45 && angle < 135) {
        textAnchor = 'start';
      } else if (angle > 225 && angle < 315) {
        textAnchor = 'end';
      }

      return `
      <line x1="${centerX}" y1="${centerY}" x2="${endPoint.x}" y2="${endPoint.y}"
            stroke="${ch.color}" stroke-width="2" opacity="0.5"/>
      <text x="${labelPoint.x}" y="${labelPoint.y - 10}" text-anchor="${textAnchor}" font-size="18">
        ${ch.icon}
      </text>
      <text x="${labelPoint.x}" y="${labelPoint.y + 8}" text-anchor="${textAnchor}"
            font-size="11" fill="${BRAND_COLORS.navy}" font-family="Montserrat, Arial, sans-serif" font-weight="600">
        ${escapeHtml(ch.name)}
      </text>
      ${
        showScores
          ? `
        <text x="${labelPoint.x}" y="${labelPoint.y + 24}" text-anchor="${textAnchor}"
              font-size="14" fill="${ch.color}" font-family="Montserrat, Arial, sans-serif" font-weight="700">
          ${ch.score}/100
        </text>
      `
          : ''
      }
    `;
    })
    .join('');

  // Benchmark polygon
  const benchmarkPoints = generatePolygonPoints(
    orderedChapters.map(ch => ch.benchmark),
    centerX,
    centerY,
    maxRadius
  );

  // Company polygon
  const companyPoints = generatePolygonPoints(
    orderedChapters.map(ch => ch.score),
    centerX,
    centerY,
    maxRadius
  );

  // Score point markers
  const scoreMarkers = orderedChapters
    .map((ch, i) => {
      const angle = i * angleStep;
      const radius = (ch.score / 100) * maxRadius;
      const point = polarToCartesian(centerX, centerY, radius, angle);

      return `
      <circle cx="${point.x}" cy="${point.y}" r="6"
              fill="${ch.color}" stroke="white" stroke-width="2"/>
    `;
    })
    .join('');

  // Generate ARIA description
  // FIX: Benchmark values are now guaranteed to be numbers after extraction
  const ariaDescription = orderedChapters
    .map(ch => `${ch.name}: ${ch.score}/100 (benchmark: ${ch.benchmark}/100)`)
    .join('. ');

  return `
    <div class="chapter-radar-container" style="text-align: center; margin: 24pt 0; page-break-inside: avoid;"
         role="figure" aria-label="4-Chapter Radar Chart for ${escapeHtml(data.companyName)}: ${ariaDescription}">
      ${title ? `<h3 style="font-family: 'Montserrat', Arial, sans-serif; font-size: 16pt; font-weight: 700; color: ${BRAND_COLORS.navy}; margin-bottom: 16pt;">${escapeHtml(title)}</h3>` : ''}

      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
           xmlns="http://www.w3.org/2000/svg"
           style="font-family: 'Open Sans', Arial, sans-serif; max-width: 100%; height: auto;"
           role="img" aria-hidden="true">

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#fafbfc" rx="12"/>

        <!-- Grid circles -->
        ${levelCircles}

        <!-- Axes and labels -->
        ${axisElements}

        ${
          showBenchmark
            ? `
          <!-- Benchmark polygon -->
          <polygon points="${benchmarkPoints}" fill="none" stroke="#999"
                   stroke-width="2" stroke-dasharray="6,3" opacity="0.6"/>
        `
            : ''
        }

        <!-- Company polygon -->
        <polygon points="${companyPoints}" fill="${BRAND_COLORS.navy}" fill-opacity="0.2"
                 stroke="${BRAND_COLORS.navy}" stroke-width="3"/>

        <!-- Score markers -->
        ${scoreMarkers}

        <!-- P2.2 FIX: Enhanced Legend with improved spacing (30px row height) -->
        <g class="radar-legend" transform="translate(40, ${height - 80})">
          <!-- Row 1: Chapter Colors -->
          <text x="0" y="0" font-size="10" font-weight="600" fill="${BRAND_COLORS.navy}">Chapter Colors:</text>

          <circle cx="95" cy="-3" r="6" fill="#28a745"/>
          <text x="105" y="1" font-size="9" fill="#666">Growth Engine</text>

          <circle cx="195" cy="-3" r="6" fill="#0d6efd"/>
          <text x="205" y="1" font-size="9" fill="#666">Perf. &amp; Health</text>

          <circle cx="300" cy="-3" r="6" fill="#ffc107"/>
          <text x="310" y="1" font-size="9" fill="#666">People &amp; Lead.</text>

          <circle cx="400" cy="-3" r="6" fill="#dc3545"/>
          <text x="410" y="1" font-size="9" fill="#666">Resilience</text>

          <!-- Row 2: Line Types (P2.2 FIX: 30px row height for better readability) -->
          <g transform="translate(0, 30)">
            <text x="0" y="0" font-size="10" font-weight="600" fill="${BRAND_COLORS.navy}">Data Series:</text>

            <line x1="95" y1="-3" x2="125" y2="-3" stroke="${BRAND_COLORS.navy}" stroke-width="3"/>
            <text x="130" y="1" font-size="9" fill="#666">Your Company</text>

            ${
              showBenchmark
                ? `
              <line x1="235" y1="-3" x2="265" y2="-3" stroke="#999" stroke-width="2" stroke-dasharray="6,3"/>
              <text x="270" y="1" font-size="9" fill="#666">Industry Benchmark</text>
            `
                : ''
            }
          </g>
        </g>
      </svg>
    </div>
  `;
}

/**
 * Render a compact 4-chapter radar (for smaller spaces)
 */
export function render4ChapterRadarCompact(
  data: ChapterRadarData,
  options: Omit<ChapterRadarOptions, 'width' | 'height'> = {}
): string {
  return render4ChapterRadar(data, {
    ...options,
    width: 350,
    height: 350,
    showScores: false,
  });
}

/**
 * Render chapter radar from chapter scores array
 */
export function renderChapterRadarFromScores(
  companyName: string,
  chapters: Array<{
    name: string;
    score: number;
    benchmark?: number;
  }>,
  options: ChapterRadarOptions = {}
): string {
  // Map generic chapters to chapter codes
  const chapterCodes: ChapterCode[] = ['GE', 'PH', 'PL', 'RS'];
  const mappedChapters: ChapterRadarItem[] = chapters.slice(0, 4).map((ch, i) => ({
    code: chapterCodes[i],
    name: ch.name,
    score: ch.score,
    benchmark: ch.benchmark || 50,
  }));

  return render4ChapterRadar(
    {
      companyName,
      chapters: mappedChapters,
    },
    options
  );
}
