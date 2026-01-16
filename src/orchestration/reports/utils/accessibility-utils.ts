/**
 * BizHealth.ai Visual Components - Accessibility Utilities
 *
 * Provides accessibility helpers including WCAG-compliant symbols,
 * ARIA labels, and colorblind-friendly patterns.
 */

import type { ScoreBand } from './color-utils.js';

/**
 * Accessibility symbols for score bands
 * These symbols work without color to support colorblind users
 */
export const STATUS_SYMBOLS: Record<ScoreBand, string> = {
  excellence: '✓',   // Checkmark - clearly positive
  proficiency: '!',  // Exclamation - good but monitor
  attention: '⚠',   // Warning triangle - needs attention
  critical: '✗',    // X mark - critical issue
};

/**
 * Alternative text-based symbols (ASCII-safe)
 */
export const STATUS_SYMBOLS_ASCII: Record<ScoreBand, string> = {
  excellence: '[+]',
  proficiency: '[!]',
  attention: '[~]',
  critical: '[-]',
};

/**
 * Trend direction symbols
 */
export const TREND_SYMBOLS = {
  improving: '▲',
  flat: '▬',
  declining: '▼',
} as const;

/**
 * Alternative trend symbols (ASCII-safe)
 */
export const TREND_SYMBOLS_ASCII = {
  improving: '^',
  flat: '-',
  declining: 'v',
} as const;

/**
 * Status labels for screen readers and display
 */
export const STATUS_LABELS: Record<ScoreBand, string> = {
  excellence: 'Excellence',
  proficiency: 'Good',
  attention: 'Needs Attention',
  critical: 'Critical',
};

/**
 * Trend labels for screen readers and display
 */
export const TREND_LABELS = {
  improving: 'Improving',
  flat: 'Stable',
  declining: 'Declining',
} as const;

/**
 * Get accessibility symbol for a score band
 */
export function getStatusSymbol(band: ScoreBand, asciiOnly: boolean = false): string {
  return asciiOnly ? STATUS_SYMBOLS_ASCII[band] : STATUS_SYMBOLS[band];
}

/**
 * Alias for getStatusSymbol - Get accessibility symbol for a score band
 */
export function getAccessibleSymbol(band: ScoreBand, asciiOnly: boolean = false): string {
  return getStatusSymbol(band, asciiOnly);
}

/**
 * Get accessibility symbol for a numeric score
 */
export function getScoreSymbol(score: number, asciiOnly: boolean = false): string {
  const band = getScoreBandFromScore(score);
  return getStatusSymbol(band, asciiOnly);
}

/**
 * Get trend symbol
 */
export function getTrendSymbol(
  trend: 'improving' | 'flat' | 'declining',
  asciiOnly: boolean = false
): string {
  return asciiOnly ? TREND_SYMBOLS_ASCII[trend] : TREND_SYMBOLS[trend];
}

// getScoreBandFromScore is defined at the end of this file

/**
 * Generate ARIA label for a score display
 */
export function getScoreAriaLabel(
  score: number,
  context?: string
): string {
  const band = getScoreBandFromScore(score);
  const label = STATUS_LABELS[band];
  const baseLabel = `Score: ${score} out of 100, rated as ${label}`;
  return context ? `${context}: ${baseLabel}` : baseLabel;
}

/**
 * Generate ARIA label for a gauge component
 */
export function getGaugeAriaLabel(
  score: number,
  label?: string,
  benchmark?: number
): string {
  const band = getScoreBandFromScore(score);
  const status = STATUS_LABELS[band];

  let ariaLabel = label
    ? `${label}: ${score} out of 100, ${status}`
    : `Score: ${score} out of 100, ${status}`;

  if (benchmark !== undefined) {
    const comparison = score > benchmark ? 'above' : score < benchmark ? 'below' : 'at';
    const delta = Math.abs(score - benchmark);
    ariaLabel += `. ${delta} points ${comparison} industry benchmark of ${benchmark}`;
  }

  return ariaLabel;
}

/**
 * Generate ARIA label for a heatmap cell
 */
export function getHeatmapCellAriaLabel(
  dimensionName: string,
  score: number,
  chapterName?: string
): string {
  const band = getScoreBandFromScore(score);
  const status = STATUS_LABELS[band];
  const prefix = chapterName ? `${chapterName}, ` : '';
  return `${prefix}${dimensionName}: Score ${score}, ${status}`;
}

/**
 * Generate ARIA label for a risk matrix cell
 */
export function getRiskMatrixAriaLabel(
  riskLabel: string,
  likelihood: number,
  impact: number
): string {
  const riskLevel = getRiskLevel(likelihood, impact);
  return `Risk: ${riskLabel}. Likelihood: ${likelihood} out of 5. Impact: ${impact} out of 5. Risk level: ${riskLevel}`;
}

/**
 * Calculate risk level (helper)
 */
function getRiskLevel(
  likelihood: number,
  impact: number
): 'low' | 'medium' | 'high' {
  const riskScore = likelihood * impact;
  if (riskScore >= 15) return 'high';
  if (riskScore >= 8) return 'medium';
  return 'low';
}

/**
 * Generate ARIA label for a bar in a chart
 */
export function getBarAriaLabel(
  label: string,
  value: number,
  benchmark?: number,
  unit?: string
): string {
  const valueText = unit ? `${value}${unit}` : value.toString();
  let ariaLabel = `${label}: ${valueText}`;

  if (benchmark !== undefined) {
    const benchmarkText = unit ? `${benchmark}${unit}` : benchmark.toString();
    const comparison = value > benchmark ? 'above' : value < benchmark ? 'below' : 'at';
    ariaLabel += `. ${comparison} benchmark of ${benchmarkText}`;
  }

  return ariaLabel;
}

/**
 * Generate ARIA label for a metric card
 */
export function getMetricAriaLabel(
  label: string,
  value: number | string,
  unit?: string,
  trend?: { direction: 'up' | 'down' | 'flat'; value?: number }
): string {
  const valueText = unit ? `${value}${unit}` : value.toString();
  let ariaLabel = `${label}: ${valueText}`;

  if (trend) {
    const trendLabel = trend.direction === 'up' ? 'increasing' :
                       trend.direction === 'down' ? 'decreasing' : 'stable';
    if (trend.value !== undefined) {
      ariaLabel += `. Trend: ${trendLabel} by ${Math.abs(trend.value)}`;
    } else {
      ariaLabel += `. Trend: ${trendLabel}`;
    }
  }

  return ariaLabel;
}

/**
 * Generate skip link HTML for long content
 */
export function generateSkipLink(targetId: string, label: string = 'Skip to main content'): string {
  return `<a href="#${targetId}" class="biz-skip-link">${escapeHtml(label)}</a>`;
}

/**
 * Generate visually hidden text for screen readers
 */
export function generateScreenReaderOnly(text: string): string {
  return `<span class="biz-sr-only">${escapeHtml(text)}</span>`;
}

/**
 * Generate accessible data table description
 */
export function generateTableDescription(
  rowCount: number,
  columnCount: number,
  tablePurpose?: string
): string {
  const purpose = tablePurpose || 'Data table';
  return `${purpose} with ${rowCount} rows and ${columnCount} columns`;
}

/**
 * Generate figure/chart description for screen readers
 */
export function generateChartDescription(
  chartType: string,
  dataDescription: string
): string {
  return `${chartType} chart showing ${dataDescription}`;
}

/**
 * Validate color contrast ratio for WCAG compliance
 * Returns the contrast ratio between two colors
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLum = getRelativeLuminance(foreground);
  const bgLum = getRelativeLuminance(background);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio Contrast ratio
 * @param isLargeText Whether text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Calculate relative luminance for a color
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    const sRGB = v / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * HTML escape for safe rendering
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
 * Generate focus-visible CSS class
 */
export function generateFocusStyles(): string {
  return `
    .biz-focus-visible:focus {
      outline: 2px solid #212653;
      outline-offset: 2px;
    }

    .biz-focus-visible:focus:not(:focus-visible) {
      outline: none;
    }
  `;
}

/**
 * Generate screen reader only CSS
 */
export function generateSROnlyStyles(): string {
  return `
    .biz-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
}

/**
 * Generate skip link CSS
 */
export function generateSkipLinkStyles(): string {
  return `
    .biz-skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #212653;
      color: white;
      padding: 8px 16px;
      z-index: 100;
      transition: top 0.2s ease;
    }

    .biz-skip-link:focus {
      top: 0;
    }
  `;
}

/**
 * Combined accessibility CSS helper
 */
export function getAllAccessibilityStyles(): string {
  return `
    ${generateFocusStyles()}
    ${generateSROnlyStyles()}
    ${generateSkipLinkStyles()}
  `;
}

// ============================================================================
// ADDITIONAL EXPORTS FOR PHASE 5 COMPATIBILITY
// ============================================================================

/**
 * Alias for generateScreenReaderOnly
 */
export function createScreenReaderOnlyText(text: string): string {
  return generateScreenReaderOnly(text);
}

/**
 * Get colorblind-safe indicator for score band
 */
export function getColorblindSafeIndicator(band: ScoreBand): { symbol: string; pattern: string; label: string } {
  const indicators: Record<ScoreBand, { symbol: string; pattern: string; label: string }> = {
    excellence: { symbol: '●', pattern: 'solid', label: 'Excellent' },
    proficiency: { symbol: '◐', pattern: 'half-filled', label: 'Good' },
    attention: { symbol: '◯', pattern: 'outline', label: 'Needs Attention' },
    critical: { symbol: '✕', pattern: 'crossed', label: 'Critical' },
  };
  return indicators[band];
}

/**
 * Generate ARIA label for score tile component
 */
export function getScoreTileAriaLabel(
  name: string,
  score: number,
  description?: string
): string {
  const band = getScoreBandFromScore(score);
  const status = STATUS_LABELS[band];
  let label = `${name}: ${score} out of 100, ${status}`;
  if (description) {
    label += `. ${description}`;
  }
  return label;
}

/**
 * Generate ARIA label for bar chart
 */
export function getBarChartAriaLabel(
  title: string,
  itemCount: number,
  description?: string
): string {
  let label = `Bar chart: ${title} with ${itemCount} items`;
  if (description) {
    label += `. ${description}`;
  }
  return label;
}

/**
 * Generate ARIA label for radar chart
 */
export function getRadarChartAriaLabel(
  title: string,
  dimensionCount: number,
  averageScore?: number
): string {
  let label = `Radar chart: ${title} showing ${dimensionCount} dimensions`;
  if (averageScore !== undefined) {
    label += `. Average score: ${averageScore}`;
  }
  return label;
}

/**
 * Generate ARIA label for data table
 */
export function getTableAriaLabel(
  title: string,
  rowCount: number,
  columnCount: number,
  description?: string
): string {
  let label = `Data table: ${title} with ${rowCount} rows and ${columnCount} columns`;
  if (description) {
    label += `. ${description}`;
  }
  return label;
}

/**
 * Helper for getScoreTileAriaLabel etc.
 */
function getScoreBandFromScore(score: number): ScoreBand {
  if (score >= 80) return 'excellence';
  if (score >= 60) return 'proficiency';
  if (score >= 40) return 'attention';
  return 'critical';
}

// ============================================================================
// WCAG 2.1 AA ACCESSIBILITY ENHANCEMENTS
// ============================================================================

/**
 * Generate ARIA landmarks for screen readers
 * WCAG 2.4.1 - Bypass Blocks
 */
export function wrapWithLandmark(
  content: string,
  role: 'main' | 'navigation' | 'complementary' | 'region' | 'banner' | 'contentinfo',
  label: string
): string {
  return `<div role="${role}" aria-label="${escapeHtml(label)}">${content}</div>`;
}

/**
 * Add skip navigation link (WCAG 2.4.1)
 */
export function generateSkipNavigation(targetId: string = 'main-content'): string {
  return `
    <a href="#${targetId}" class="biz-skip-link" style="
      position: absolute;
      top: -40px;
      left: 0;
      background: #212653;
      color: white;
      padding: 8px 16px;
      z-index: 100;
      transition: top 0.3s;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0 0 4px 0;
    " onfocus="this.style.top='0'" onblur="this.style.top='-40px'">
      Skip to main content
    </a>
  `;
}

/**
 * Ensure color contrast meets WCAG AA (4.5:1 for normal text)
 * Returns accessible color pair
 */
export function getAccessibleColors(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: '#f0fdf4', text: '#166534', border: '#22c55e' };
  if (score >= 60) return { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' };
  if (score >= 40) return { bg: '#fffbeb', text: '#92400e', border: '#f59e0b' };
  return { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' };
}

/**
 * Add alt text for SVG charts (WCAG 1.1.1)
 */
export function generateChartAltText(
  chartType: string,
  dimensions: Array<{ name: string; score: number }>
): string {
  if (!dimensions || dimensions.length === 0) {
    return `${chartType} showing no data available`;
  }
  const summary = dimensions
    .map(d => `${d.name}: ${d.score} out of 100`)
    .join('; ');
  return `${chartType} showing: ${summary}`;
}

/**
 * Wrap tables with proper accessibility markup
 */
export function wrapAccessibleTable(
  tableContent: string,
  caption: string,
  summary: string
): string {
  return `
    <table role="table" aria-label="${escapeHtml(caption)}">
      <caption class="biz-sr-only">${escapeHtml(caption)}. ${escapeHtml(summary)}</caption>
      ${tableContent}
    </table>
  `;
}

/**
 * Generate accessible heading structure
 */
export function generateAccessibleHeading(
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6,
  id?: string
): string {
  const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
  return `<h${level}${idAttr}>${escapeHtml(text)}</h${level}>`;
}

/**
 * Generate accessible button with proper aria attributes
 */
export function generateAccessibleButton(
  text: string,
  ariaLabel?: string,
  additionalAttributes?: Record<string, string>
): string {
  const label = ariaLabel || text;
  const attrs = additionalAttributes
    ? Object.entries(additionalAttributes)
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(' ')
    : '';
  return `<button type="button" aria-label="${escapeHtml(label)}" ${attrs}>${escapeHtml(text)}</button>`;
}

/**
 * Generate accessible link with proper attributes
 */
export function generateAccessibleLink(
  text: string,
  href: string,
  ariaLabel?: string,
  opensInNewTab: boolean = false
): string {
  const label = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  const newTabAttrs = opensInNewTab
    ? ' target="_blank" rel="noopener noreferrer" aria-describedby="new-tab-notice"'
    : '';
  const newTabIndicator = opensInNewTab ? ' <span class="biz-sr-only">(opens in new tab)</span>' : '';
  return `<a href="${escapeHtml(href)}"${label}${newTabAttrs}>${escapeHtml(text)}${newTabIndicator}</a>`;
}

/**
 * Generate accessible list
 */
export function generateAccessibleList(
  items: string[],
  ordered: boolean = false,
  ariaLabel?: string
): string {
  if (!items || items.length === 0) return '';
  const tag = ordered ? 'ol' : 'ul';
  const labelAttr = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  const listItems = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  return `<${tag}${labelAttr}>${listItems}</${tag}>`;
}

/**
 * Generate accessible form field with label
 */
export function generateAccessibleFormField(
  id: string,
  label: string,
  inputType: string = 'text',
  required: boolean = false,
  helpText?: string
): string {
  const requiredAttr = required ? ' required aria-required="true"' : '';
  const helpId = helpText ? `${id}-help` : '';
  const ariaDescribedBy = helpText ? ` aria-describedby="${helpId}"` : '';

  return `
    <div class="biz-form-field">
      <label for="${escapeHtml(id)}">${escapeHtml(label)}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      <input type="${inputType}" id="${escapeHtml(id)}" name="${escapeHtml(id)}"${requiredAttr}${ariaDescribedBy}>
      ${helpText ? `<span id="${helpId}" class="biz-help-text">${escapeHtml(helpText)}</span>` : ''}
    </div>
  `;
}

/**
 * Generate accessible progress indicator
 */
export function generateAccessibleProgress(
  value: number,
  max: number = 100,
  label: string
): string {
  const percentage = Math.round((value / max) * 100);
  return `
    <div role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" aria-label="${escapeHtml(label)}: ${percentage}%">
      <span class="biz-sr-only">${escapeHtml(label)}: ${percentage}% complete</span>
      <div class="biz-progress-bar" style="width: ${percentage}%"></div>
    </div>
  `;
}

/**
 * Generate accessible alert/notification
 */
export function generateAccessibleAlert(
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): string {
  const roleAttr = type === 'error' || type === 'warning' ? 'role="alert"' : 'role="status"';
  const ariaLive = type === 'error' ? 'aria-live="assertive"' : 'aria-live="polite"';
  return `<div class="biz-alert biz-alert-${type}" ${roleAttr} ${ariaLive}>${escapeHtml(message)}</div>`;
}

/**
 * Generate complete accessibility CSS for report
 */
export function getCompleteAccessibilityStyles(): string {
  return `
    /* Skip Link Styles */
    .biz-skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #212653;
      color: white;
      padding: 8px 16px;
      z-index: 100;
      transition: top 0.2s ease;
      font-weight: 600;
      text-decoration: none;
    }

    .biz-skip-link:focus {
      top: 0;
    }

    /* Screen Reader Only */
    .biz-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Focus Styles */
    .biz-focus-visible:focus,
    a:focus,
    button:focus,
    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid #212653;
      outline-offset: 2px;
    }

    .biz-focus-visible:focus:not(:focus-visible),
    a:focus:not(:focus-visible),
    button:focus:not(:focus-visible) {
      outline: none;
    }

    /* High Contrast Mode Support */
    @media (forced-colors: active) {
      .biz-score-band,
      .biz-alert {
        border: 2px solid currentColor;
      }
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }

    /* Print Accessibility */
    @media print {
      .biz-skip-link,
      .biz-sr-only {
        display: none !important;
      }
    }

    /* Progress Bar Styles */
    .biz-progress-bar {
      height: 8px;
      background: #212653;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    /* Alert Styles */
    .biz-alert {
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .biz-alert-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .biz-alert-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    .biz-alert-error {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .biz-alert-success {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      color: #166534;
    }

    /* Help Text Styles */
    .biz-help-text {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
      display: block;
    }
  `;
}
