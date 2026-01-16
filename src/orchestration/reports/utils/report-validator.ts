/**
 * BizHealth.ai Report Validation Utilities
 * Ensures Manager Reports meet quality standards before output
 *
 * @description Validates HTML structure, content completeness, and brand compliance
 * @version 2.0.0
 * @brand BizNavy #212653, BizGreen #969423
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
  checkedAt: string;
}

export interface ValidationError {
  code: string;
  message: string;
  location?: string;
  severity: 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
  severity: 'warning';
}

export interface ValidationStats {
  totalSections: number;
  emptySections: number;
  quickWinsCount: number;
  roadmapPhasesCount: number;
  crossReferencesCount: number;
  keyTakeawaysCount: number;
  wordCount: number;
  estimatedPages: number;
}

export interface ManagerReportValidationOptions {
  reportType: string;
  minQuickWins?: number;
  maxQuickWins?: number;
  requirePhase1?: boolean;
  requirePhase2?: boolean;
  requireKeyTakeaways?: boolean;
  requireCrossReferences?: boolean;
  minWordCount?: number;
  maxWordCount?: number;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const BRAND_COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  excellence: '#059669',
  proficiency: '#2563eb',
  attention: '#d97706',
  critical: '#dc2626'
};

const DEFAULT_OPTIONS: ManagerReportValidationOptions = {
  reportType: 'manager',
  minQuickWins: 3,
  maxQuickWins: 5,
  requirePhase1: true,
  requirePhase2: true,
  requireKeyTakeaways: true,
  requireCrossReferences: true,
  minWordCount: 2000,
  maxWordCount: 15000
};

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a Manager Report HTML string
 */
export function validateManagerReport(
  html: string,
  options: Partial<ManagerReportValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Calculate stats first
  const stats = calculateStats(html);

  // Run all validations
  validateStructure(html, errors, warnings);
  validateQuickWins(html, opts, stats, errors, warnings);
  validateRoadmap(html, opts, errors, warnings);
  validateKeyTakeaways(html, opts, stats, errors, warnings);
  validateCrossReferences(html, opts, stats, errors, warnings);
  validateBrandCompliance(html, errors, warnings);
  validateAccessibility(html, errors, warnings);
  validateContentLength(html, opts, stats, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
    checkedAt: new Date().toISOString()
  };
}

// ============================================================================
// STATS CALCULATION
// ============================================================================

function calculateStats(html: string): ValidationStats {
  // Count sections
  const sectionMatches = html.match(/<section[^>]*class="[^"]*report-section[^"]*"[^>]*>/gi) || [];
  const totalSections = sectionMatches.length;

  // Count empty sections (sections with only a header and no substantial content)
  const emptySectionPattern = /<section[^>]*>[\s\S]*?<h2[^>]*>[^<]+<\/h2>\s*(?:<div[^>]*>[\s\S]{0,200}(?:pending|not available|being developed)[^<]*<\/div>\s*)?<\/section>/gi;
  const emptySections = (html.match(emptySectionPattern) || []).length;

  // Count quick wins
  const quickWinPatterns = [
    /class="[^"]*quick-win[^"]*"/gi,
    /Quick Win(?:s)?/gi,
    /<div[^>]*>[\s\S]*?Timeline[\s\S]*?Success Metric/gi
  ];
  let quickWinsCount = 0;
  for (const pattern of quickWinPatterns) {
    const matches = html.match(pattern) || [];
    quickWinsCount = Math.max(quickWinsCount, matches.length);
  }

  // Count roadmap phases
  const phase1Count = (html.match(/Phase\s*1[:\s]/gi) || []).length;
  const phase2Count = (html.match(/Phase\s*2[:\s]/gi) || []).length;
  const roadmapPhasesCount = (phase1Count > 0 ? 1 : 0) + (phase2Count > 0 ? 1 : 0);

  // Count cross-references
  const crossRefMatches = html.match(/class="[^"]*cross-reference[^"]*"/gi) || [];
  const seeAlsoMatches = html.match(/See also:/gi) || [];
  const crossReferencesCount = Math.max(crossRefMatches.length, seeAlsoMatches.length);

  // Count key takeaways
  const keyTakeawaysMatches = html.match(/class="[^"]*key-takeaways?[^"]*"/gi) || [];
  const keyTakeawaysSection = html.match(/Key Takeaways?/gi) || [];
  const keyTakeawaysCount = Math.max(keyTakeawaysMatches.length, keyTakeawaysSection.length > 0 ? 1 : 0);

  // Calculate word count (strip HTML tags)
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length;

  // Estimate pages (roughly 500 words per page)
  const estimatedPages = Math.ceil(wordCount / 500);

  return {
    totalSections,
    emptySections,
    quickWinsCount,
    roadmapPhasesCount,
    crossReferencesCount,
    keyTakeawaysCount,
    wordCount,
    estimatedPages
  };
}

// ============================================================================
// STRUCTURE VALIDATION
// ============================================================================

function validateStructure(
  html: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check for empty section headers
  const emptySectionPattern = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>\s*<\/section>/gi;
  if (emptySectionPattern.test(html)) {
    errors.push({
      code: 'EMPTY_SECTION',
      message: 'Empty section headers detected - all sections must have content',
      severity: 'error'
    });
  }

  // Check div tag balance
  const openDivs = (html.match(/<div/gi) || []).length;
  const closeDivs = (html.match(/<\/div>/gi) || []).length;
  if (openDivs !== closeDivs) {
    errors.push({
      code: 'UNBALANCED_DIVS',
      message: `HTML structure issue: ${openDivs} opening div tags vs ${closeDivs} closing tags`,
      severity: 'error'
    });
  }

  // Check section tag balance
  const openSections = (html.match(/<section/gi) || []).length;
  const closeSections = (html.match(/<\/section>/gi) || []).length;
  if (openSections !== closeSections) {
    errors.push({
      code: 'UNBALANCED_SECTIONS',
      message: `HTML structure issue: ${openSections} opening section tags vs ${closeSections} closing tags`,
      severity: 'error'
    });
  }

  // Check for cover page
  if (!html.includes('cover-page')) {
    warnings.push({
      code: 'MISSING_COVER',
      message: 'Cover page class not detected - report may be missing cover page',
      severity: 'warning'
    });
  }

  // Check for table of contents
  if (!html.includes('toc-page') && !html.includes('table-of-contents') && !html.includes('Contents')) {
    warnings.push({
      code: 'MISSING_TOC',
      message: 'Table of contents not detected',
      severity: 'warning'
    });
  }
}

// ============================================================================
// QUICK WINS VALIDATION
// ============================================================================

function validateQuickWins(
  html: string,
  options: ManagerReportValidationOptions,
  stats: ValidationStats,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const { minQuickWins = 3, maxQuickWins = 5 } = options;

  if (stats.quickWinsCount < minQuickWins) {
    errors.push({
      code: 'INSUFFICIENT_QUICK_WINS',
      message: `Quick Wins section has ${stats.quickWinsCount} items - minimum ${minQuickWins} required`,
      severity: 'error'
    });
  }

  if (stats.quickWinsCount > maxQuickWins) {
    warnings.push({
      code: 'EXCESSIVE_QUICK_WINS',
      message: `Quick Wins section has ${stats.quickWinsCount} items - consider limiting to ${maxQuickWins}`,
      severity: 'warning'
    });
  }

  // Check for actionability elements
  const hasTimeline = /timeline/i.test(html);
  const hasOwner = /owner|accountable|responsible/i.test(html);
  const hasMetric = /success\s*metric|measure|kpi/i.test(html);

  if (!hasTimeline || !hasOwner || !hasMetric) {
    const missing = [];
    if (!hasTimeline) missing.push('timeline');
    if (!hasOwner) missing.push('owner/accountable role');
    if (!hasMetric) missing.push('success metric');

    warnings.push({
      code: 'INCOMPLETE_QUICK_WINS',
      message: `Quick wins may be missing actionability elements: ${missing.join(', ')}`,
      severity: 'warning'
    });
  }
}

// ============================================================================
// ROADMAP VALIDATION
// ============================================================================

function validateRoadmap(
  html: string,
  options: ManagerReportValidationOptions,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const hasPhase1 = /Phase\s*1[:\s]/i.test(html);
  const hasPhase2 = /Phase\s*2[:\s]/i.test(html);

  if (options.requirePhase1 && !hasPhase1) {
    errors.push({
      code: 'MISSING_PHASE1',
      message: 'Roadmap section must include Phase 1 (0-90 days)',
      severity: 'error'
    });
  }

  if (options.requirePhase2 && !hasPhase2) {
    errors.push({
      code: 'MISSING_PHASE2',
      message: 'Roadmap section must include Phase 2 (3-12 months)',
      severity: 'error'
    });
  }

  // Check for roadmap section existence
  const hasRoadmapSection = /roadmap|implementation/i.test(html);
  if (!hasRoadmapSection) {
    errors.push({
      code: 'MISSING_ROADMAP',
      message: 'No roadmap/implementation section detected in report',
      severity: 'error'
    });
  }
}

// ============================================================================
// KEY TAKEAWAYS VALIDATION
// ============================================================================

function validateKeyTakeaways(
  html: string,
  options: ManagerReportValidationOptions,
  stats: ValidationStats,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (options.requireKeyTakeaways && stats.keyTakeawaysCount === 0) {
    warnings.push({
      code: 'MISSING_KEY_TAKEAWAYS',
      message: 'Key Takeaways section not found - recommended for scanability',
      severity: 'warning'
    });
  }

  // Check takeaways content quality
  if (stats.keyTakeawaysCount > 0) {
    // Look for severity indicators
    const hasSeverityIndicators = /positive|caution|critical|excellent|attention/i.test(html);
    if (!hasSeverityIndicators) {
      warnings.push({
        code: 'WEAK_TAKEAWAYS',
        message: 'Key takeaways may lack severity/priority indicators',
        severity: 'warning'
      });
    }
  }
}

// ============================================================================
// CROSS-REFERENCE VALIDATION
// ============================================================================

function validateCrossReferences(
  html: string,
  options: ManagerReportValidationOptions,
  stats: ValidationStats,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (options.requireCrossReferences && stats.crossReferencesCount === 0) {
    warnings.push({
      code: 'MISSING_CROSS_REFERENCES',
      message: 'No cross-references to other reports detected',
      severity: 'warning'
    });
  }

  // Check for links to key reports
  const hasComprehensiveLink = /comprehensive\.html|comprehensive\s*report/i.test(html);
  const hasRoadmapLink = /roadmap\.html|roadmap\s*report/i.test(html);
  const hasRiskLink = /risk\.html|risk\s*report/i.test(html);

  if (!hasComprehensiveLink && !hasRoadmapLink && !hasRiskLink) {
    warnings.push({
      code: 'WEAK_CROSS_REFERENCES',
      message: 'Consider adding links to Comprehensive, Roadmap, or Risk reports',
      severity: 'warning'
    });
  }
}

// ============================================================================
// BRAND COMPLIANCE VALIDATION
// ============================================================================

function validateBrandCompliance(
  html: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check for primary brand colors
  const hasBizNavy = html.includes(BRAND_COLORS.bizNavy) || html.includes('biz-navy') || html.includes('--biz-navy');
  const hasBizGreen = html.includes(BRAND_COLORS.bizGreen) || html.includes('biz-green') || html.includes('--biz-green');

  if (!hasBizNavy || !hasBizGreen) {
    warnings.push({
      code: 'BRAND_COLORS_MISSING',
      message: `Brand colors may not be consistently applied (BizNavy: ${hasBizNavy}, BizGreen: ${hasBizGreen})`,
      severity: 'warning'
    });
  }

  // Check for brand fonts
  const hasMontserrat = /montserrat/i.test(html);
  const hasOpenSans = /open\s*sans/i.test(html);

  if (!hasMontserrat) {
    warnings.push({
      code: 'MISSING_HEADER_FONT',
      message: 'Montserrat font for headers not detected',
      severity: 'warning'
    });
  }

  if (!hasOpenSans) {
    warnings.push({
      code: 'MISSING_BODY_FONT',
      message: 'Open Sans font for body text not detected',
      severity: 'warning'
    });
  }

  // Check for score band colors
  const scoreColors = [
    BRAND_COLORS.excellence,
    BRAND_COLORS.proficiency,
    BRAND_COLORS.attention,
    BRAND_COLORS.critical
  ];
  const hasScoreColors = scoreColors.some(color => html.includes(color));

  if (!hasScoreColors) {
    warnings.push({
      code: 'MISSING_SCORE_COLORS',
      message: 'Score band colors (Excellence, Proficiency, Attention, Critical) not detected',
      severity: 'warning'
    });
  }
}

// ============================================================================
// ACCESSIBILITY VALIDATION
// ============================================================================

function validateAccessibility(
  html: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check for ARIA landmarks
  const hasMain = /<main/i.test(html) || /role="main"/i.test(html);
  const hasNav = /<nav/i.test(html) || /role="navigation"/i.test(html);

  if (!hasMain) {
    warnings.push({
      code: 'MISSING_MAIN_LANDMARK',
      message: 'No main content landmark detected - consider adding <main> element',
      severity: 'warning'
    });
  }

  // Check for skip links
  const hasSkipLink = /skip-link|skip\s*to\s*main/i.test(html);
  if (!hasSkipLink) {
    warnings.push({
      code: 'MISSING_SKIP_LINK',
      message: 'No skip navigation link detected for accessibility',
      severity: 'warning'
    });
  }

  // Check for alt text on images/SVGs
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='));
  if (imgsWithoutAlt.length > 0) {
    warnings.push({
      code: 'IMAGES_WITHOUT_ALT',
      message: `${imgsWithoutAlt.length} image(s) may be missing alt text`,
      severity: 'warning'
    });
  }

  // Check SVG accessibility
  const svgTags = html.match(/<svg[^>]*>/gi) || [];
  const svgsWithoutAriaLabel = svgTags.filter(svg => !svg.includes('aria-label') && !svg.includes('role='));
  if (svgsWithoutAriaLabel.length > 0) {
    warnings.push({
      code: 'SVGS_WITHOUT_ARIA',
      message: `${svgsWithoutAriaLabel.length} SVG(s) may be missing aria-label or role attributes`,
      severity: 'warning'
    });
  }

  // Check for screen reader text
  const hasSrOnly = /sr-only|screen-reader-only|visually-hidden/i.test(html);
  if (!hasSrOnly) {
    warnings.push({
      code: 'NO_SR_TEXT',
      message: 'No screen reader only text classes detected',
      severity: 'warning'
    });
  }
}

// ============================================================================
// CONTENT LENGTH VALIDATION
// ============================================================================

function validateContentLength(
  html: string,
  options: ManagerReportValidationOptions,
  stats: ValidationStats,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const { minWordCount = 2000, maxWordCount = 15000 } = options;

  if (stats.wordCount < minWordCount) {
    warnings.push({
      code: 'CONTENT_TOO_SHORT',
      message: `Report has ${stats.wordCount} words - may be missing content (minimum recommended: ${minWordCount})`,
      severity: 'warning'
    });
  }

  if (stats.wordCount > maxWordCount) {
    warnings.push({
      code: 'CONTENT_TOO_LONG',
      message: `Report has ${stats.wordCount} words - consider condensing (maximum recommended: ${maxWordCount})`,
      severity: 'warning'
    });
  }

  // Check for excessive empty sections
  if (stats.emptySections > 0) {
    const emptyPercentage = Math.round((stats.emptySections / stats.totalSections) * 100);
    if (emptyPercentage > 20) {
      errors.push({
        code: 'TOO_MANY_EMPTY_SECTIONS',
        message: `${stats.emptySections} of ${stats.totalSections} sections (${emptyPercentage}%) appear empty`,
        severity: 'error'
      });
    } else if (stats.emptySections > 0) {
      warnings.push({
        code: 'EMPTY_SECTIONS_PRESENT',
        message: `${stats.emptySections} section(s) appear to have minimal content`,
        severity: 'warning'
      });
    }
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format validation result as a human-readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    MANAGER REPORT VALIDATION');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
  lines.push(`Checked at: ${result.checkedAt}`);
  lines.push('');

  // Stats section
  lines.push('─── STATS ───────────────────────────────────────────────────────');
  lines.push(`  Total Sections: ${result.stats.totalSections}`);
  lines.push(`  Empty Sections: ${result.stats.emptySections}`);
  lines.push(`  Quick Wins: ${result.stats.quickWinsCount}`);
  lines.push(`  Roadmap Phases: ${result.stats.roadmapPhasesCount}`);
  lines.push(`  Cross-References: ${result.stats.crossReferencesCount}`);
  lines.push(`  Key Takeaways: ${result.stats.keyTakeawaysCount}`);
  lines.push(`  Word Count: ${result.stats.wordCount.toLocaleString()}`);
  lines.push(`  Estimated Pages: ${result.stats.estimatedPages}`);
  lines.push('');

  // Errors section
  if (result.errors.length > 0) {
    lines.push('─── ERRORS ──────────────────────────────────────────────────────');
    result.errors.forEach((error, i) => {
      lines.push(`  ${i + 1}. [${error.code}] ${error.message}`);
      if (error.location) {
        lines.push(`     Location: ${error.location}`);
      }
    });
    lines.push('');
  }

  // Warnings section
  if (result.warnings.length > 0) {
    lines.push('─── WARNINGS ────────────────────────────────────────────────────');
    result.warnings.forEach((warning, i) => {
      lines.push(`  ${i + 1}. [${warning.code}] ${warning.message}`);
      if (warning.location) {
        lines.push(`     Location: ${warning.location}`);
      }
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Check if validation result passes minimum quality threshold
 */
export function meetsQualityThreshold(
  result: ValidationResult,
  maxErrors: number = 0,
  maxWarnings: number = 5
): boolean {
  return result.errors.length <= maxErrors && result.warnings.length <= maxWarnings;
}
