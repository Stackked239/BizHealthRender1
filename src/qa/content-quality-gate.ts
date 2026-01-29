/**
 * Content Quality Gate
 *
 * Validates that generated Manager Report content meets consulting-grade standards.
 * Prevents regression to generic, templated content.
 *
 * @module content-quality-gate
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Individual quality check result
 */
export interface QualityCheck {
  name: string;
  passed: boolean;
  value: number | string;
  threshold: number | string;
  message: string;
}

/**
 * Overall content quality result
 */
export interface ContentQualityResult {
  passed: boolean;
  overallScore: number;
  checks: QualityCheck[];
  warnings: string[];
  blockers: string[];
}

// ============================================================================
// GENERIC PATTERN DETECTION
// ============================================================================

/**
 * Patterns that indicate generic/templated content (should be avoided)
 */
const GENERIC_PATTERNS: RegExp[] = [
  /strengthen .+ capabilities and processes/gi,
  /optimize .+ capabilities and processes/gi,
  /improve .+ capabilities and processes/gi,
  /enhance .+ capabilities and processes/gi,
  /requires attention with a score of/gi,
  /demonstrates strong performance at/gi,
  /shows solid performance/gi,
  /has room for improvement/gi,
  /would benefit from/gi,
  /consider implementing/gi,
  /may want to explore/gi,
];

/**
 * Patterns that indicate specific, evidence-based content (desirable)
 */
const EVIDENCE_PATTERNS: RegExp[] = [
  /evidence-citations/gi,
  /Assessment Evidence/gi,
  /assessment-sources/gi,
  /What's Driving This/gi,
  /Business Impact/gi,
  /Implementation Steps/gi,
  /Expected Outcomes/gi,
  /Target Metric/gi,
  /vs\.? median/gi,
  /industry median/gi,
];

/**
 * Patterns that indicate quantification (desirable)
 */
const QUANTIFICATION_PATTERNS: RegExp[] = [
  /\$\d+/g,           // Dollar amounts
  /\d+%/g,            // Percentages
  /\d+ weeks?/gi,     // Time estimates in weeks
  /\d+ days?/gi,      // Day estimates
  /\d+ months?/gi,    // Month estimates
  /\d+\/100/g,        // Scores
  /\d+x/gi,           // Multipliers
  /\d+-\d+/g,         // Ranges
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Count pattern matches in HTML
 */
function countPatternMatches(html: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = html.match(pattern) ?? [];
    count += matches.length;
  }
  return count;
}

/**
 * Extract finding cards from HTML
 */
function extractFindingCards(html: string): string[] {
  // Match finding-card divs including nested content
  const regex = /<div[^>]*class="[^"]*finding-card[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*finding-card|$)/gi;
  return html.match(regex) ?? [];
}

/**
 * Extract quick win cards from HTML
 */
function extractQuickWinCards(html: string): string[] {
  const regex = /<div[^>]*class="[^"]*quick-win-card[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*quick-win-card|$)/gi;
  return html.match(regex) ?? [];
}

/**
 * Calculate average text length (words) in cards
 */
function calculateAverageTextLength(cards: string[]): number {
  if (cards.length === 0) return 0;

  const totalWords = cards.reduce((sum, card) => {
    // Strip HTML tags and count words
    const textOnly = card.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return sum + textOnly.split(' ').filter(w => w.length > 0).length;
  }, 0);

  return Math.round(totalWords / cards.length);
}

/**
 * Check for presence of implementation steps
 */
function hasImplementationSteps(html: string): boolean {
  return /Implementation Steps|Week \d|Step \d/gi.test(html);
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate manager report content quality
 */
export function validateManagerReportQuality(
  reportHtml: string,
  reportType: string
): ContentQualityResult {
  const checks: QualityCheck[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  // ========================================================================
  // CHECK 1: Finding Narrative Depth
  // ========================================================================
  const findingCards = extractFindingCards(reportHtml);
  const avgFindingLength = calculateAverageTextLength(findingCards);

  checks.push({
    name: 'Finding Narrative Depth',
    passed: avgFindingLength >= 100,
    value: avgFindingLength,
    threshold: 100,
    message: avgFindingLength >= 100
      ? `Findings average ${avgFindingLength} words (meets depth requirement)`
      : `Findings average ${avgFindingLength} words (minimum 100 required)`,
  });

  if (avgFindingLength < 50) {
    blockers.push('Finding narratives critically shallow - likely template-only content');
  } else if (avgFindingLength < 100) {
    warnings.push('Finding narratives below depth target - may lack business context');
  }

  // ========================================================================
  // CHECK 2: Evidence Citations Present
  // ========================================================================
  const evidenceCount = countPatternMatches(reportHtml, EVIDENCE_PATTERNS);
  const expectedEvidenceMin = Math.max(1, findingCards.length * 0.8);

  checks.push({
    name: 'Evidence Citations',
    passed: evidenceCount >= expectedEvidenceMin,
    value: evidenceCount,
    threshold: `${Math.round(expectedEvidenceMin)}+ (80% of findings)`,
    message: evidenceCount >= expectedEvidenceMin
      ? `${evidenceCount} evidence patterns found`
      : `Only ${evidenceCount} evidence patterns found - need ${Math.round(expectedEvidenceMin)}+`,
  });

  if (evidenceCount === 0) {
    blockers.push('No evidence citations found - findings lack audit trail');
  }

  // ========================================================================
  // CHECK 3: Generic Pattern Detection
  // ========================================================================
  const genericMatchCount = countPatternMatches(reportHtml, GENERIC_PATTERNS);

  checks.push({
    name: 'Generic Content Detection',
    passed: genericMatchCount <= 2,
    value: genericMatchCount,
    threshold: '<=2 instances',
    message: genericMatchCount <= 2
      ? `Only ${genericMatchCount} generic patterns detected`
      : `${genericMatchCount} generic patterns found - content not sufficiently customized`,
  });

  if (genericMatchCount > 5) {
    blockers.push(`${genericMatchCount} generic patterns detected - report appears templated`);
  } else if (genericMatchCount > 2) {
    warnings.push('Some generic patterns present - review for customization opportunities');
  }

  // ========================================================================
  // CHECK 4: Quick Win Specificity
  // ========================================================================
  const quickWinCards = extractQuickWinCards(reportHtml);
  const quickWinsWithSteps = quickWinCards.filter(qw =>
    /Step \d|Week \d|Implementation Steps/i.test(qw)
  ).length;

  const qwStepsRatio = quickWinCards.length > 0
    ? quickWinsWithSteps / quickWinCards.length
    : 1;

  checks.push({
    name: 'Quick Win Specificity',
    passed: qwStepsRatio >= 0.8,
    value: `${quickWinsWithSteps}/${quickWinCards.length}`,
    threshold: '80%+ with implementation steps',
    message: qwStepsRatio >= 0.8
      ? `${quickWinsWithSteps} of ${quickWinCards.length} quick wins have implementation steps`
      : `Only ${quickWinsWithSteps} of ${quickWinCards.length} quick wins have specific steps`,
  });

  if (quickWinsWithSteps === 0 && quickWinCards.length > 0) {
    blockers.push('No quick wins have implementation steps - not actionable');
  }

  // ========================================================================
  // CHECK 5: Quantified Outcomes
  // ========================================================================
  const quantifiedCount = countPatternMatches(reportHtml, QUANTIFICATION_PATTERNS);
  const quickWinSections = Math.max(1, quickWinCards.length);
  const quantificationRatio = quantifiedCount / quickWinSections;

  checks.push({
    name: 'Outcome Quantification',
    passed: quantificationRatio >= 3,
    value: `${quantifiedCount} total (${quantificationRatio.toFixed(1)} per quick win)`,
    threshold: '3+ quantified values per quick win',
    message: quantificationRatio >= 3
      ? `Good quantification: ${quantifiedCount} quantified values`
      : `Insufficient quantification: only ${quantifiedCount} quantified values`,
  });

  if (quantifiedCount < 10) {
    warnings.push('Limited quantification - recommendations may lack business case clarity');
  }

  // ========================================================================
  // CHECK 6: Department-Specific Metrics
  // ========================================================================
  const departmentMetricPatterns = [
    /department-metric/gi,
    /metric-card/gi,
    /targetMetric/gi,
    /Target Metric/gi,
    /Current Baseline/gi,
    /Industry Median/gi,
  ];
  const departmentMetrics = countPatternMatches(reportHtml, departmentMetricPatterns);

  checks.push({
    name: 'Department-Specific Metrics',
    passed: departmentMetrics >= 3,
    value: departmentMetrics,
    threshold: '3+ department metrics',
    message: departmentMetrics >= 3
      ? `${departmentMetrics} department-specific metrics included`
      : `Only ${departmentMetrics} metrics - need department-specific KPIs`,
  });

  // ========================================================================
  // CHECK 7: Risk-Response Mapping
  // ========================================================================
  const riskMappingPatterns = [
    /risk-mapping/gi,
    /mitigation-action/gi,
    /leading-indicator/gi,
    /Mitigation Actions/gi,
    /Leading Indicator/gi,
    /Your Mitigation Actions/gi,
  ];
  const riskMappings = countPatternMatches(reportHtml, riskMappingPatterns);

  checks.push({
    name: 'Risk-Response Integration',
    passed: riskMappings >= 2,
    value: riskMappings,
    threshold: '2+ risk mappings',
    message: riskMappings >= 2
      ? `${riskMappings} risk-response mappings present`
      : `Only ${riskMappings} risk mappings - need department risk accountability`,
  });

  // ========================================================================
  // CHECK 8: Company Name Personalization
  // ========================================================================
  const companyNamePattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:'s|'s)/g;
  const companyNameCount = (reportHtml.match(companyNamePattern) ?? []).length;

  checks.push({
    name: 'Company Personalization',
    passed: companyNameCount >= 5,
    value: companyNameCount,
    threshold: '5+ company name mentions',
    message: companyNameCount >= 5
      ? `${companyNameCount} company name references (good personalization)`
      : `Only ${companyNameCount} company mentions - content may feel generic`,
  });

  // ========================================================================
  // CALCULATE OVERALL SCORE
  // ========================================================================
  const passedChecks = checks.filter(c => c.passed).length;
  const overallScore = Math.round((passedChecks / checks.length) * 100);

  return {
    passed: blockers.length === 0 && overallScore >= 70,
    overallScore,
    checks,
    warnings,
    blockers,
  };
}

/**
 * Format quality result for display
 */
export function formatQualityResult(result: ContentQualityResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('CONTENT QUALITY GATE RESULTS');
  lines.push('='.repeat(60));
  lines.push('');

  lines.push(`Overall Score: ${result.overallScore}%`);
  lines.push(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  lines.push('');

  // Checks
  lines.push('CHECKS:');
  for (const check of result.checks) {
    const status = check.passed ? '[PASS]' : '[FAIL]';
    lines.push(`  ${status} ${check.name}`);
    lines.push(`         Value: ${check.value} (threshold: ${check.threshold})`);
    lines.push(`         ${check.message}`);
  }
  lines.push('');

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    for (const warning of result.warnings) {
      lines.push(`  [!] ${warning}`);
    }
    lines.push('');
  }

  // Blockers
  if (result.blockers.length > 0) {
    lines.push('BLOCKERS:');
    for (const blocker of result.blockers) {
      lines.push(`  [X] ${blocker}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Validate multiple manager reports and return summary
 */
export function validateManagerReportSuite(
  reports: Array<{ type: string; html: string }>
): {
  allPassed: boolean;
  summary: string;
  results: Array<{ type: string; result: ContentQualityResult }>;
} {
  const results = reports.map(report => ({
    type: report.type,
    result: validateManagerReportQuality(report.html, report.type),
  }));

  const allPassed = results.every(r => r.result.passed);

  const summaryLines: string[] = [];
  summaryLines.push('MANAGER REPORT QUALITY SUMMARY');
  summaryLines.push('-'.repeat(40));

  for (const { type, result } of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    summaryLines.push(`${type}: ${status} (${result.overallScore}%)`);
    if (result.blockers.length > 0) {
      summaryLines.push(`  Blockers: ${result.blockers.length}`);
    }
    if (result.warnings.length > 0) {
      summaryLines.push(`  Warnings: ${result.warnings.length}`);
    }
  }

  summaryLines.push('-'.repeat(40));
  summaryLines.push(`Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);

  return {
    allPassed,
    summary: summaryLines.join('\n'),
    results,
  };
}
