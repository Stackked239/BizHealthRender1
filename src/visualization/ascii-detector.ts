/**
 * ASCII Detection Module
 *
 * PURPOSE: Identify ASCII visualizations in Phase 1-3 output
 * NOTE: This is a DIAGNOSTIC tool, not the long-term solution.
 *       The goal is to track and eliminate ASCII at the source.
 *
 * ENHANCED: Added detailed logging for false positive diagnosis (Phase A1)
 *
 * @module ascii-detector
 * @version 1.1.0
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('ascii-detector');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of ASCII visualizations that can be detected
 */
export type ASCIIMatchType =
  | 'gauge'
  | 'progress'
  | 'bar'
  | 'table'
  | 'heatmap'
  | 'unknown';

/**
 * Confidence level for detection
 */
export type DetectionConfidence = 'high' | 'medium' | 'low';

/**
 * Location of a match within content
 */
export interface MatchLocation {
  /** Start index in the source string */
  start: number;
  /** End index in the source string */
  end: number;
}

/**
 * A single ASCII visualization match
 */
export interface ASCIIMatch {
  /** Type of ASCII visualization detected */
  type: ASCIIMatchType;
  /** The original matched text */
  originalText: string;
  /** Location in the source content */
  location: MatchLocation;
  /** Extracted numeric value if found */
  extractedValue?: number;
  /** Extracted maximum value if found (for gauges/progress) */
  extractedMax?: number;
  /** Confidence level of the detection */
  confidence: DetectionConfidence;
}

/**
 * Result of ASCII detection on content
 */
export interface ASCIIDetectionResult {
  /** Total number of matches found */
  totalMatches: number;
  /** Array of all matches */
  matches: ASCIIMatch[];
  /** Summary count by type */
  summary: Record<ASCIIMatchType, number>;
}

/**
 * Context for logging ASCII detection
 */
export interface ASCIIDetectionContext {
  /** Pipeline phase (e.g., 'phase1', 'phase2', 'phase3', 'phase5') */
  phase: string;
  /** Section or field path where ASCII was detected */
  section: string;
  /** Optional report type */
  reportType?: string;
  /** Optional company identifier */
  companyId?: string;
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * EXCLUSION PATTERNS - Content that should NOT trigger ASCII detection
 * These patterns identify legitimate content that may contain characters
 * that look like ASCII art but are actually styled text or data
 */
const EXCLUSION_PATTERNS = {
  // SVG content should be excluded
  svgContent: /<svg[\s\S]*?<\/svg>/gi,

  // HTML tags with class/style attributes
  htmlTags: /<[^>]*class="[^"]*(?:metric|score|badge)[^"]*"[^>]*>/gi,

  // Styled score displays (e.g., "Score: 85/100" in proper context)
  styledScoreDisplay: /class="[^"]*score[^"]*"[^>]*>\s*\d{1,3}\s*(?:\/\s*\d{1,3})?\s*</gi,

  // CSS property values
  cssValues: /(?:font-family|color|background):\s*[^;]+;/gi,
};

/**
 * Minimum consecutive characters required for box drawing detection
 * Increased from 3 to 5 to reduce false positives
 */
const MIN_BOX_DRAWING_CHARS = 5;

/**
 * Patterns for detecting ASCII visualizations
 * Each pattern targets a specific type of text-based visualization
 *
 * ENHANCED: More precise patterns to reduce false positives
 */
const PATTERNS: Record<string, RegExp> = {
  // Progress bar patterns: ████████░░░░ or ▓▓▓▓▓░░░░░
  // Require at least 5 consecutive characters to reduce false positives
  progressFilled: /[█▓▒░■□◼◻]{5,}/g,

  // Bracketed progress: [=====>    ] or [###------]
  // Must have at least 5 characters inside brackets
  progressBracket: /\[[=\-\#\>]{5,}\s*\]/g,

  // Percentage with visual bar: ████░░ 67% or ▓▓▓ 45%
  // Require at least 4 block characters
  percentageWithBar: /[█▓▒░]{4,}\s*\d{1,3}%/g,

  // Score patterns: Score: 63/100 or Rating: 85
  // NOTE: This is now EXCLUDED from detection as it's legitimate text
  // scorePattern: /(?:score|rating|health|grade)[:\s]+\d{1,3}(?:\/\d{1,3})?/gi,

  // Box drawing characters (tables): ┌┐└┘├┤┬┴┼─│
  // Require at least MIN_BOX_DRAWING_CHARS consecutive box characters
  boxDrawing: /[┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║]{5,}/g,

  // ASCII table borders: +---+---+ or |---|---|
  // Require at least 5 dashes for a table border
  asciiTableBorder: /[+|][-=]{5,}[+|]/g,

  // Colored block patterns (heatmaps): 🟢🟡🔴 or ⬛⬜
  // Require at least 3 consecutive emoji blocks
  colorBlocks: /(?:🟢|🟡|🔴|🟠|⬛|⬜|🔵|⚪|🟣){3,}/g,

  // Star ratings: ★★★☆☆ or ⭐⭐⭐
  // Require at least 3 stars
  starRating: /[★☆⭐]{3,}/g,

  // Horizontal bar made of repeated characters: ▐▐▐▐▐ or =====
  // Require at least 6 characters
  horizontalBar: /(?:▐|▌|▀|▄|▬|═){6,}/g,

  // Percentage bars with visual: [####....] 40%
  // Require at least 6 characters inside brackets
  percentageBarBracket: /\[[#.=\-]{6,}\]\s*\d{1,3}%/g,

  // Simple ASCII progress: ..... or ***** with percentage
  // Require at least 8 dots/asterisks (more strict)
  dotProgress: /[.*]{8,}\s*\d{1,3}%/g,
};

/**
 * Map pattern names to visualization types
 */
const PATTERN_TYPE_MAP: Record<string, ASCIIMatchType> = {
  progressFilled: 'progress',
  progressBracket: 'progress',
  percentageWithBar: 'gauge',
  // scorePattern removed - legitimate text pattern
  boxDrawing: 'table',
  asciiTableBorder: 'table',
  colorBlocks: 'heatmap',
  starRating: 'gauge',
  horizontalBar: 'bar',
  percentageBarBracket: 'progress',
  dotProgress: 'progress',
};

/**
 * Pre-process content to exclude legitimate HTML/SVG content from detection
 * Returns content with excluded regions replaced by spaces (preserving indices)
 */
function preprocessForExclusion(content: string): string {
  let processed = content;

  // Remove SVG content from detection (preserve spacing for index alignment)
  for (const [name, pattern] of Object.entries(EXCLUSION_PATTERNS)) {
    pattern.lastIndex = 0;
    processed = processed.replace(pattern, (match) => ' '.repeat(match.length));
  }

  return processed;
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect ASCII visualizations in content
 *
 * ENHANCED: Uses exclusion patterns to reduce false positives
 * and adds detailed logging for diagnostic purposes
 *
 * @param content - The text content to analyze
 * @returns ASCIIDetectionResult with all matches
 */
export function detectASCII(content: string): ASCIIDetectionResult {
  const matches: ASCIIMatch[] = [];

  // Pre-process content to exclude legitimate HTML/SVG
  const processedContent = preprocessForExclusion(content);

  // Detect each pattern type
  for (const [patternName, regex] of Object.entries(PATTERNS)) {
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(processedContent)) !== null) {
      const matchedText = match[0];
      const matchIndex = match.index;

      // Get the original text from the unprocessed content for accurate reporting
      const originalMatchedText = content.substring(matchIndex, matchIndex + matchedText.length);

      // Skip if the matched region was excluded (filled with spaces)
      if (matchedText.trim() === '') {
        continue;
      }

      // Enhanced logging for diagnostics
      logger.debug({
        pattern: patternName,
        content: originalMatchedText.substring(0, 100),
        triggered: true,
        position: matchIndex,
        length: matchedText.length,
      }, 'ASCII detection check - pattern matched');

      matches.push({
        type: classifyPattern(patternName),
        originalText: originalMatchedText,
        location: {
          start: matchIndex,
          end: matchIndex + matchedText.length,
        },
        extractedValue: extractNumericValue(originalMatchedText, content, matchIndex),
        extractedMax: extractMaxValue(originalMatchedText, content, matchIndex),
        confidence: assessConfidence(patternName, originalMatchedText),
      });
    }
  }

  // Deduplicate overlapping matches
  const dedupedMatches = deduplicateMatches(matches);

  // Generate summary
  const summary = generateSummary(dedupedMatches);

  // Log summary if matches were found
  if (dedupedMatches.length > 0) {
    logger.info({
      totalMatches: dedupedMatches.length,
      summary: Object.fromEntries(Object.entries(summary).filter(([, count]) => count > 0)),
    }, 'ASCII detection completed with matches');
  }

  return {
    totalMatches: dedupedMatches.length,
    matches: dedupedMatches,
    summary,
  };
}

/**
 * Classify a pattern name to its visualization type
 */
function classifyPattern(patternName: string): ASCIIMatchType {
  return PATTERN_TYPE_MAP[patternName] || 'unknown';
}

/**
 * Extract a numeric value from the match or surrounding context
 */
function extractNumericValue(
  match: string,
  fullContent: string,
  index: number
): number | undefined {
  // Try to find percentage in the match itself
  const percentMatch = match.match(/(\d{1,3})%/);
  if (percentMatch) {
    return parseInt(percentMatch[1], 10);
  }

  // Try to find fraction (e.g., 63/100)
  const fractionMatch = match.match(/(\d{1,3})\/(\d{1,3})/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1], 10);
  }

  // Try to find standalone number in the match
  const standaloneNumber = match.match(/\b(\d{1,3})\b/);
  if (standaloneNumber) {
    const num = parseInt(standaloneNumber[1], 10);
    if (num <= 100) {
      return num;
    }
  }

  // Look in surrounding context (50 chars before/after)
  const contextStart = Math.max(0, index - 50);
  const contextEnd = Math.min(fullContent.length, index + match.length + 50);
  const context = fullContent.slice(contextStart, contextEnd);

  // Look for percentage in context
  const contextPercent = context.match(/(\d{1,3})%/);
  if (contextPercent) {
    return parseInt(contextPercent[1], 10);
  }

  // Look for fraction in context
  const contextFraction = context.match(/(\d{1,3})\/(\d{1,3})/);
  if (contextFraction) {
    return parseInt(contextFraction[1], 10);
  }

  return undefined;
}

/**
 * Extract the maximum value from fraction patterns
 */
function extractMaxValue(
  match: string,
  fullContent: string,
  index: number
): number | undefined {
  // Try to find fraction (e.g., 63/100)
  const fractionMatch = match.match(/(\d{1,3})\/(\d{1,3})/);
  if (fractionMatch) {
    return parseInt(fractionMatch[2], 10);
  }

  // Look in surrounding context
  const contextStart = Math.max(0, index - 50);
  const contextEnd = Math.min(fullContent.length, index + match.length + 50);
  const context = fullContent.slice(contextStart, contextEnd);

  const contextFraction = context.match(/(\d{1,3})\/(\d{1,3})/);
  if (contextFraction) {
    return parseInt(contextFraction[2], 10);
  }

  // Default to 100 for percentage-based visualizations
  if (match.includes('%') || context.includes('%')) {
    return 100;
  }

  return undefined;
}

/**
 * Assess confidence level of the detection
 *
 * ENHANCED: Removed score/rating keyword matching as it causes false positives
 * on legitimate text content like "Score: 85/100"
 */
function assessConfidence(
  patternName: string,
  match: string
): DetectionConfidence {
  // High confidence: clear percentage with visual bar (not just text)
  if (/[█▓▒░]{3,}\s*\d{1,3}%/.test(match)) {
    return 'high';
  }

  // High confidence: box drawing multi-line structures (5+ chars)
  if (patternName === 'boxDrawing' && match.length >= 5) {
    return 'high';
  }

  // Medium confidence: progress bars with clear structure (5+ chars)
  if (patternName === 'progressFilled' && match.length >= 5) {
    return 'medium';
  }

  // Medium confidence: bracketed patterns (6+ chars inside)
  if (patternName === 'progressBracket' || patternName === 'percentageBarBracket') {
    return 'medium';
  }

  // Medium confidence: color blocks (3+ consecutive)
  if (patternName === 'colorBlocks' && match.length >= 3) {
    return 'medium';
  }

  // Medium confidence: star ratings (3+ stars)
  if (patternName === 'starRating' && match.length >= 3) {
    return 'medium';
  }

  // Low confidence: everything else
  return 'low';
}

/**
 * Remove overlapping matches, keeping the first/more specific one
 */
function deduplicateMatches(matches: ASCIIMatch[]): ASCIIMatch[] {
  if (matches.length === 0) return [];

  // Sort by start position, then by length (longer first)
  const sorted = [...matches].sort((a, b) => {
    if (a.location.start !== b.location.start) {
      return a.location.start - b.location.start;
    }
    return (b.location.end - b.location.start) - (a.location.end - a.location.start);
  });

  // Remove overlapping matches
  const result: ASCIIMatch[] = [];
  for (const match of sorted) {
    const lastMatch = result[result.length - 1];
    if (!lastMatch || match.location.start >= lastMatch.location.end) {
      result.push(match);
    } else {
      // Overlapping - keep the one with higher confidence or more extracted data
      const lastScore = getMatchScore(lastMatch);
      const currentScore = getMatchScore(match);
      if (currentScore > lastScore) {
        result[result.length - 1] = match;
      }
    }
  }

  return result;
}

/**
 * Score a match for deduplication priority
 */
function getMatchScore(match: ASCIIMatch): number {
  let score = 0;
  if (match.confidence === 'high') score += 3;
  else if (match.confidence === 'medium') score += 2;
  else score += 1;

  if (match.extractedValue !== undefined) score += 2;
  if (match.extractedMax !== undefined) score += 1;

  return score;
}

/**
 * Generate summary of matches by type
 */
function generateSummary(matches: ASCIIMatch[]): Record<ASCIIMatchType, number> {
  const summary: Record<ASCIIMatchType, number> = {
    gauge: 0,
    progress: 0,
    bar: 0,
    table: 0,
    heatmap: 0,
    unknown: 0,
  };

  for (const match of matches) {
    summary[match.type]++;
  }

  return summary;
}

// ============================================================================
// LOGGING AND REPORTING
// ============================================================================

/**
 * Log ASCII detection results for diagnostics
 *
 * @param result - The detection result to log
 * @param context - Context information for the log
 */
export function logASCIIDetection(
  result: ASCIIDetectionResult,
  context: ASCIIDetectionContext
): void {
  if (result.totalMatches === 0) return;

  // Create sample previews for logging
  const samples = result.matches.slice(0, 3).map((m) => ({
    type: m.type,
    preview: m.originalText.slice(0, 50) + (m.originalText.length > 50 ? '...' : ''),
    value: m.extractedValue,
    confidence: m.confidence,
  }));

  // Filter summary to only show non-zero counts
  const nonZeroSummary = Object.fromEntries(
    Object.entries(result.summary).filter(([, count]) => count > 0)
  );

  console.warn(
    `[ASCII DETECTION] Found ${result.totalMatches} ASCII visualization(s)`,
    {
      phase: context.phase,
      section: context.section,
      reportType: context.reportType,
      summary: nonZeroSummary,
      samples,
    }
  );
}

/**
 * Generate a detailed report of ASCII detections
 *
 * @param result - The detection result
 * @param context - Context information
 * @returns Formatted report string
 */
export function generateASCIIReport(
  result: ASCIIDetectionResult,
  context: ASCIIDetectionContext
): string {
  if (result.totalMatches === 0) {
    return `[${context.phase}/${context.section}] No ASCII visualizations detected.`;
  }

  const lines: string[] = [
    `=== ASCII Detection Report ===`,
    `Phase: ${context.phase}`,
    `Section: ${context.section}`,
    context.reportType ? `Report Type: ${context.reportType}` : '',
    context.companyId ? `Company: ${context.companyId}` : '',
    ``,
    `Total Matches: ${result.totalMatches}`,
    ``,
    `Summary by Type:`,
    ...Object.entries(result.summary)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `  - ${type}: ${count}`),
    ``,
    `Matches:`,
    ...result.matches.map((m, i) => [
      `  ${i + 1}. [${m.type}] (${m.confidence} confidence)`,
      `     Location: ${m.location.start}-${m.location.end}`,
      `     Text: "${m.originalText.slice(0, 60)}${m.originalText.length > 60 ? '...' : ''}"`,
      m.extractedValue !== undefined
        ? `     Value: ${m.extractedValue}${m.extractedMax ? `/${m.extractedMax}` : ''}`
        : '',
    ].filter(Boolean).join('\n')),
  ].filter(Boolean);

  return lines.join('\n');
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Detect ASCII in multiple content fields
 *
 * @param fields - Object with field names as keys and content as values
 * @param baseContext - Base context to apply to all detections
 * @returns Map of field names to detection results
 */
export function detectASCIIInFields(
  fields: Record<string, string>,
  baseContext: Omit<ASCIIDetectionContext, 'section'>
): Map<string, ASCIIDetectionResult> {
  const results = new Map<string, ASCIIDetectionResult>();

  for (const [fieldName, content] of Object.entries(fields)) {
    if (typeof content !== 'string' || content.length < 10) {
      continue;
    }

    const result = detectASCII(content);
    if (result.totalMatches > 0) {
      results.set(fieldName, result);
      logASCIIDetection(result, { ...baseContext, section: fieldName });
    }
  }

  return results;
}

/**
 * Check if content likely contains ASCII visualizations
 * Quick check before full detection
 *
 * ENHANCED: Excludes SVG content and removes false-positive score pattern
 *
 * @param content - Content to check
 * @returns true if ASCII visualization patterns might be present
 */
export function hasLikelyASCII(content: string): boolean {
  if (!content || content.length < 5) return false;

  // Pre-process to exclude SVG content
  const processedContent = preprocessForExclusion(content);

  // Quick character-based checks for actual ASCII art characters
  // Note: Stars and emoji blocks are included as they represent visual charts
  const asciiChars = /[█▓▒░■□◼◻┌┐└┘├┤┬┴┼─│═║★☆⭐🟢🟡🔴🟠⬛⬜]/;
  if (asciiChars.test(processedContent)) return true;

  // Check for bracketed progress patterns (must have 5+ chars to be significant)
  if (/\[[=\-\#\>]{5,}\]/.test(processedContent)) return true;

  // NOTE: Score patterns like "Score: 85/100" are NOT detected as ASCII
  // because they are legitimate text content

  return false;
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Test helper: Verify that styled metric text does NOT trigger ASCII detection
 *
 * This function is used in unit tests to ensure that legitimate styled
 * content (metric cards, score displays, etc.) is not flagged as ASCII art.
 *
 * @param content - The styled metric text content to test
 * @returns Object with detection result and pass/fail status
 */
export function testStyledMetricTextNoDetection(content: string): {
  passed: boolean;
  matches: ASCIIMatch[];
  message: string;
} {
  const result = detectASCII(content);

  if (result.totalMatches === 0) {
    return {
      passed: true,
      matches: [],
      message: 'PASS: Styled metric text correctly NOT detected as ASCII',
    };
  }

  return {
    passed: false,
    matches: result.matches,
    message: `FAIL: Styled metric text incorrectly detected as ASCII. Found ${result.totalMatches} match(es): ${result.matches.map(m => m.type).join(', ')}`,
  };
}

/**
 * Test helper: Verify that actual ASCII art IS detected
 *
 * @param content - The ASCII art content to test
 * @returns Object with detection result and pass/fail status
 */
export function testAsciiArtIsDetected(content: string): {
  passed: boolean;
  matches: ASCIIMatch[];
  message: string;
} {
  const result = detectASCII(content);

  if (result.totalMatches > 0) {
    return {
      passed: true,
      matches: result.matches,
      message: `PASS: ASCII art correctly detected. Found ${result.totalMatches} match(es)`,
    };
  }

  return {
    passed: false,
    matches: [],
    message: 'FAIL: ASCII art NOT detected when it should have been',
  };
}
