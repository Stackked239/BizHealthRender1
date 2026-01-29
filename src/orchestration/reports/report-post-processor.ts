/**
 * REPORT POST-PROCESSOR
 *
 * Final failsafe before report output. Performs two critical functions:
 * 1. Scans generated HTML for any ASCII diagram content and removes it
 * 2. Validates and enforces brand typography (Montserrat/Open Sans)
 *
 * This is the LAST LINE OF DEFENSE before client-facing output.
 *
 * ENHANCED (Phase A2): Added typography validation and CSS injection order management
 *
 * @version 1.1.0
 */

import { asciiSanitizer, SanitizationResult } from '../../services/ascii-sanitization.service.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('report-post-processor');

// ============================================================================
// BRAND TYPOGRAPHY CONSTANTS
// ============================================================================

/**
 * Brand Typography CSS - Required for all reports
 * This CSS MUST be present in the final HTML output
 */
const BRAND_TYPOGRAPHY_CSS = `
/* ============================================================
   BIZHEALTH BRAND TYPOGRAPHY - REQUIRED
   Ensures proper font usage throughout reports
   ============================================================ */

/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap');

/* Base Typography */
body, .report-content {
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  font-size: 14px;
  line-height: 1.6;
  color: #212653;
}

/* Heading Typography */
h1, h2, h3, h4, h5, h6, .heading, .section-title {
  font-family: 'Montserrat', sans-serif !important;
  font-weight: 600;
  color: #212653;
}

/* CRITICAL: Prevent monospace ANYWHERE except code blocks */
.metric-value, .benchmark-data, .score-display, .metric-card,
.benchmark-bar, .score-badge, .category-score, .health-score,
.biz-metric-card, .biz-metric-card__value, .biz-metric-card__label,
.score-tile, .scorecard-item, .kpi-value, .stat-value {
  font-family: 'Open Sans', sans-serif !important;
  font-variant-numeric: tabular-nums;
}

/* Only code blocks get monospace */
code, pre, .code-block {
  font-family: 'Courier New', Consolas, monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

/* Fix Score Circle Typography */
.health-score-circle .score,
.health-score-display .score,
.score-circle .score {
  font-family: 'Montserrat', sans-serif !important;
  font-weight: 700;
}
`;

export interface PostProcessingResult {
  html: string;
  asciiDetected: boolean;
  asciiRemoved: number;
  processingWarnings: string[];
  sanitizationReport?: {
    blocksRemoved: number;
    linesRemoved: number;
    charactersRemoved: number;
  };
  /** Typography validation result */
  typographyValid: boolean;
  /** Typography issues found */
  typographyIssues?: string[];
}

export interface PostProcessingOptions {
  /** If true, throw an error instead of sanitizing (for strict mode) */
  strictMode?: boolean;
  /** If true, log detailed sanitization info */
  verbose?: boolean;
  /** If true, inject brand typography CSS (default: true) */
  injectTypography?: boolean;
  /** If true, validate typography after processing (default: true) */
  validateTypography?: boolean;
}

// ============================================================================
// TYPOGRAPHY VALIDATION
// ============================================================================

/**
 * Validate that typography is correctly applied in the HTML
 * Checks for monospace fonts in metric areas and ensures brand fonts are used
 *
 * @param html - HTML content to validate
 * @returns Validation result with issues list
 */
export function validateTypography(html: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for monospace in metric areas (inline styles)
  const monospaceInMetrics = /class="[^"]*(?:metric|score|kpi|benchmark)[^"]*"[^>]*style="[^"]*font-family:\s*[^"]*(?:mono|courier|consolas)/gi;
  if (monospaceInMetrics.test(html)) {
    issues.push('TYPOGRAPHY: Monospace font found in metric/score elements via inline style');
  }

  // Check for Courier/Consolas outside of code blocks
  const courierOutsideCode = /<(?!code|pre)[^>]*style="[^"]*font-family:\s*[^"]*(?:courier|consolas)[^"]*"[^>]*>/gi;
  if (courierOutsideCode.test(html)) {
    issues.push('TYPOGRAPHY: Courier/Consolas font used outside code blocks');
  }

  // Check for missing Google Fonts import
  if (!html.includes('fonts.googleapis.com') && !html.includes('Montserrat')) {
    issues.push('TYPOGRAPHY: Google Fonts import not found - brand fonts may not load');
  }

  // Check for generic monospace declarations in style blocks
  const monospaceInStyleBlock = /<style[^>]*>[\s\S]*?\.(?:metric|score|kpi|benchmark)[^{]*\{[^}]*font-family:\s*[^}]*mono/gi;
  if (monospaceInStyleBlock.test(html)) {
    issues.push('TYPOGRAPHY: Monospace font defined in CSS for metric/score classes');
  }

  // Log issues if found
  if (issues.length > 0) {
    logger.warn({ issues }, 'Typography validation issues detected');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Inject brand typography CSS into the HTML document
 * Ensures CSS is inserted in correct order (after reset, before component styles)
 *
 * @param html - HTML content to enhance
 * @returns HTML with brand typography CSS injected
 */
export function injectBrandTypography(html: string): string {
  // Check if typography already exists
  if (html.includes('BIZHEALTH BRAND TYPOGRAPHY')) {
    logger.debug('Brand typography CSS already present, skipping injection');
    return html;
  }

  // Find the best injection point
  // Priority: 1. After opening <style> tag, 2. Before </head>, 3. After <head>

  // Option 1: Inject after first <style> tag opening
  const styleOpenMatch = html.match(/<style[^>]*>/i);
  if (styleOpenMatch && styleOpenMatch.index !== undefined) {
    const insertPos = styleOpenMatch.index + styleOpenMatch[0].length;
    return html.slice(0, insertPos) + '\n' + BRAND_TYPOGRAPHY_CSS + '\n' + html.slice(insertPos);
  }

  // Option 2: Create a new style block before </head>
  const headCloseMatch = html.match(/<\/head>/i);
  if (headCloseMatch && headCloseMatch.index !== undefined) {
    const insertPos = headCloseMatch.index;
    return html.slice(0, insertPos) + `<style>${BRAND_TYPOGRAPHY_CSS}</style>\n` + html.slice(insertPos);
  }

  // Option 3: Inject after <head> tag
  const headOpenMatch = html.match(/<head[^>]*>/i);
  if (headOpenMatch && headOpenMatch.index !== undefined) {
    const insertPos = headOpenMatch.index + headOpenMatch[0].length;
    return html.slice(0, insertPos) + `\n<style>${BRAND_TYPOGRAPHY_CSS}</style>\n` + html.slice(insertPos);
  }

  // Fallback: Prepend to document
  logger.warn('Could not find standard injection point for typography CSS, prepending to document');
  return `<style>${BRAND_TYPOGRAPHY_CSS}</style>\n` + html;
}

/**
 * Post-process a generated report HTML to remove any ASCII diagram content
 * and ensure proper typography
 *
 * ENHANCED (Phase A2): Added typography injection and validation
 *
 * @param html The generated report HTML
 * @param reportType The type of report being processed
 * @param reportId Unique identifier for the report
 * @param options Processing options
 * @returns PostProcessingResult with sanitized HTML and metadata
 */
export async function postProcessReport(
  html: string,
  reportType: string,
  reportId: string,
  options: PostProcessingOptions = {}
): Promise<PostProcessingResult> {
  const {
    strictMode = false,
    verbose = false,
    injectTypography = true,
    validateTypography: shouldValidateTypography = true,
  } = options;

  const result: PostProcessingResult = {
    html,
    asciiDetected: false,
    asciiRemoved: 0,
    processingWarnings: [],
    typographyValid: true,
  };

  const context = `${reportType}:${reportId}`;
  let workingHtml = html;

  // ========================================
  // STEP 1: Inject Brand Typography CSS
  // ========================================
  if (injectTypography) {
    workingHtml = injectBrandTypography(workingHtml);
    logger.debug({ reportType, reportId }, 'Brand typography CSS injected');
  }

  // ========================================
  // STEP 2: ASCII Sanitization
  // ========================================
  if (asciiSanitizer.containsAscii(workingHtml)) {
    result.asciiDetected = true;

    const asciiCount = asciiSanitizer.countAsciiOccurrences(workingHtml);

    // In strict mode, throw an error instead of sanitizing
    if (strictMode) {
      const error = new Error(
        `ASCII DIAGRAM VIOLATION in ${context}: ` +
          `${asciiCount} forbidden characters detected. ` +
          `Report generation failed in strict mode.`
      );
      logger.error({ reportType, reportId, asciiCount }, error.message);
      throw error;
    }

    // Sanitize the HTML
    const sanitization = asciiSanitizer.sanitizeHtml(workingHtml, context);
    workingHtml = sanitization.sanitized;
    result.asciiRemoved = sanitization.removedBlocks.length;

    // Build sanitization report
    result.sanitizationReport = {
      blocksRemoved: sanitization.removedBlocks.length,
      linesRemoved: sanitization.removedBlocks.reduce((sum, b) => sum + b.lineCount, 0),
      charactersRemoved: sanitization.removedCharCount
    };

    // Generate warnings for each removed block
    for (const block of sanitization.removedBlocks) {
      result.processingWarnings.push(
        `Removed ${block.lineCount}-line ASCII block at position ${block.startIndex}`
      );
    }

    // Log critical warning - this indicates upstream failure
    logger.error(
      {
        reportType,
        reportId,
        asciiCount,
        blocksRemoved: result.asciiRemoved,
        linesRemoved: result.sanitizationReport.linesRemoved,
        charactersRemoved: result.sanitizationReport.charactersRemoved
      },
      'ASCII FAILSAFE ACTIVATED - Report required sanitization'
    );

    if (verbose) {
      logger.debug(
        {
          reportType,
          reportId,
          warnings: result.processingWarnings
        },
        'Detailed sanitization warnings'
      );
    }
  }

  // ========================================
  // STEP 3: Typography Validation
  // ========================================
  if (shouldValidateTypography) {
    const typographyResult = validateTypography(workingHtml);
    result.typographyValid = typographyResult.isValid;
    result.typographyIssues = typographyResult.issues;

    if (!typographyResult.isValid) {
      result.processingWarnings.push(
        ...typographyResult.issues.map(issue => `Typography: ${issue}`)
      );
      logger.warn(
        {
          reportType,
          reportId,
          issues: typographyResult.issues,
        },
        'Typography validation failed'
      );
    } else {
      logger.debug({ reportType, reportId }, 'Typography validation passed');
    }
  }

  // Update result with final HTML
  result.html = workingHtml;

  return result;
}

/**
 * Batch post-process multiple reports
 */
export async function postProcessReports(
  reports: Array<{ html: string; reportType: string; reportId: string }>,
  options: PostProcessingOptions = {}
): Promise<Array<{ reportType: string; reportId: string; result: PostProcessingResult }>> {
  const results: Array<{
    reportType: string;
    reportId: string;
    result: PostProcessingResult;
  }> = [];

  for (const report of reports) {
    const result = await postProcessReport(
      report.html,
      report.reportType,
      report.reportId,
      options
    );
    results.push({
      reportType: report.reportType,
      reportId: report.reportId,
      result
    });
  }

  // Summary log - ASCII
  const reportsWithAscii = results.filter((r) => r.result.asciiDetected);
  // Summary log - Typography
  const reportsWithTypographyIssues = results.filter((r) => !r.result.typographyValid);

  if (reportsWithAscii.length > 0 || reportsWithTypographyIssues.length > 0) {
    logger.warn(
      {
        totalReports: reports.length,
        reportsWithAscii: reportsWithAscii.length,
        reportsWithTypographyIssues: reportsWithTypographyIssues.length,
        asciiAffected: reportsWithAscii.map((r) => r.reportType),
        typographyAffected: reportsWithTypographyIssues.map((r) => r.reportType),
      },
      'Batch post-processing complete - Issues detected in some reports'
    );
  } else {
    logger.info(
      {
        totalReports: reports.length,
        allClean: true,
      },
      'Batch post-processing complete - All reports clean'
    );
  }

  return results;
}

/**
 * Validate that a report contains no ASCII diagrams (non-sanitizing)
 * Returns validation result without modifying content
 */
export function validateReportAscii(
  html: string,
  reportType: string,
  reportId: string
): {
  isValid: boolean;
  asciiCount: number;
  uniqueChars: string[];
  message: string;
} {
  const containsAscii = asciiSanitizer.containsAscii(html);
  const asciiCount = containsAscii ? asciiSanitizer.countAsciiOccurrences(html) : 0;
  const uniqueChars = containsAscii
    ? [...new Set(html.match(/[┌┐└┘│─┬┴├┤═║╔╗╚╝╠╣╦╩╬█▓░▲▼►◄●○■□▪▫╭╮╯╰┼]/g) || [])]
    : [];

  return {
    isValid: !containsAscii,
    asciiCount,
    uniqueChars,
    message: containsAscii
      ? `FAIL: ${reportType}:${reportId} contains ${asciiCount} ASCII diagram characters: ${uniqueChars.join('')}`
      : `PASS: ${reportType}:${reportId} is ASCII-free`
  };
}
