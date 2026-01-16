/**
 * ASCII SANITIZATION SERVICE
 *
 * This is the FAILSAFE layer. If ASCII somehow escapes Layer 1 (prevention)
 * and Layer 2 (validation), this service catches and removes it before
 * client-facing output.
 *
 * Every sanitization is logged as a WARNING because it indicates a
 * failure in the upstream layers.
 */

import { createLogger } from '../utils/logger';
import {
  FORBIDDEN_ASCII_PATTERN,
  ASCII_BLOCK_PATTERN,
  ASCII_BAR_PATTERN
} from '../contracts/visualization.contract';

const logger = createLogger('ascii-sanitization');

export interface SanitizationResult {
  sanitized: string;
  removedBlocks: Array<{
    content: string;
    startIndex: number;
    endIndex: number;
    lineCount: number;
  }>;
  wasModified: boolean;
  removedCharCount: number;
}

export interface SanitizationReport {
  context: string;
  originalLength: number;
  sanitizedLength: number;
  blocksRemoved: number;
  totalLinesRemoved: number;
  charactersRemoved: number;
  wasModified: boolean;
}

/**
 * ASCII Sanitization Service
 *
 * Detects and removes ASCII diagram content from pipeline output.
 * This is the last line of defense before client-facing reports.
 */
export class AsciiSanitizationService {
  // Pattern to match multi-line ASCII diagram blocks
  private readonly blockPattern = new RegExp(ASCII_BLOCK_PATTERN.source, 'gm');

  // Pattern to match inline ASCII elements
  private readonly inlinePattern = new RegExp(FORBIDDEN_ASCII_PATTERN.source, 'g');

  /**
   * Detect if content contains ANY ASCII diagram characters
   */
  containsAscii(content: string): boolean {
    return FORBIDDEN_ASCII_PATTERN.test(content);
  }

  /**
   * Count ASCII occurrences for reporting
   */
  countAsciiOccurrences(content: string): number {
    const matches = content.match(this.inlinePattern);
    return matches?.length || 0;
  }

  /**
   * Get unique ASCII characters found in content
   */
  getUniqueAsciiChars(content: string): string[] {
    const matches = content.match(this.inlinePattern);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Sanitize content by removing all ASCII diagram blocks
   * This is a FAILSAFE - ideally this should never need to remove anything
   */
  sanitize(content: string, context: string): SanitizationResult {
    const result: SanitizationResult = {
      sanitized: content,
      removedBlocks: [],
      wasModified: false,
      removedCharCount: 0
    };

    if (!this.containsAscii(content)) {
      return result;
    }

    // WARNING: This indicates upstream failure
    logger.warn(
      {
        context,
        asciiCount: this.countAsciiOccurrences(content),
        uniqueChars: this.getUniqueAsciiChars(content)
      },
      'ASCII FAILSAFE TRIGGERED - Upstream prevention/validation failed'
    );

    // Remove multi-line blocks first (process in reverse order to preserve indices)
    let workingContent = content;
    let match: RegExpExecArray | null;
    const blockMatches: Array<{ content: string; start: number; end: number }> = [];

    const blockRegex = new RegExp(this.blockPattern.source, 'gm');
    while ((match = blockRegex.exec(content)) !== null) {
      blockMatches.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    // Remove blocks in reverse order to preserve indices
    for (const block of blockMatches.reverse()) {
      result.removedBlocks.push({
        content: block.content,
        startIndex: block.start,
        endIndex: block.end,
        lineCount: block.content.split('\n').length
      });

      result.removedCharCount += block.content.length;
      workingContent = workingContent.slice(0, block.start) + workingContent.slice(block.end);
    }

    // Remove any remaining inline ASCII characters
    const beforeInlineRemoval = workingContent;
    workingContent = workingContent.replace(this.inlinePattern, '');
    result.removedCharCount += beforeInlineRemoval.length - workingContent.length;

    // Clean up resulting empty lines and excessive whitespace
    workingContent = workingContent
      .replace(/\n{3,}/g, '\n\n') // Collapse multiple blank lines
      .replace(/^\s+$/gm, '') // Remove whitespace-only lines
      .trim();

    result.sanitized = workingContent;
    result.wasModified =
      result.removedBlocks.length > 0 || workingContent !== content.trim();

    if (result.wasModified) {
      logger.warn(
        {
          context,
          blocksRemoved: result.removedBlocks.length,
          totalLinesRemoved: result.removedBlocks.reduce((sum, b) => sum + b.lineCount, 0),
          charactersRemoved: result.removedCharCount
        },
        'ASCII content removed by failsafe'
      );
    }

    return result;
  }

  /**
   * Generate a detailed sanitization report
   */
  generateReport(
    content: string,
    sanitizationResult: SanitizationResult,
    context: string
  ): SanitizationReport {
    return {
      context,
      originalLength: content.length,
      sanitizedLength: sanitizationResult.sanitized.length,
      blocksRemoved: sanitizationResult.removedBlocks.length,
      totalLinesRemoved: sanitizationResult.removedBlocks.reduce(
        (sum, b) => sum + b.lineCount,
        0
      ),
      charactersRemoved: sanitizationResult.removedCharCount,
      wasModified: sanitizationResult.wasModified
    };
  }

  /**
   * Sanitize HTML content specifically
   * Handles HTML-encoded ASCII characters as well
   */
  sanitizeHtml(html: string, context: string): SanitizationResult {
    // First decode any HTML entities that might contain ASCII chars
    const decodedHtml = html
      .replace(/&#x[0-9A-Fa-f]+;/g, (match) => {
        const codePoint = parseInt(match.slice(3, -1), 16);
        return String.fromCodePoint(codePoint);
      })
      .replace(/&#\d+;/g, (match) => {
        const codePoint = parseInt(match.slice(2, -1), 10);
        return String.fromCodePoint(codePoint);
      });

    // Now sanitize
    const result = this.sanitize(decodedHtml, context);

    // If we modified HTML, we need to ensure it's still valid
    if (result.wasModified) {
      // Clean up any broken HTML tags that might result from removal
      result.sanitized = this.cleanBrokenHtml(result.sanitized);
    }

    return result;
  }

  /**
   * Clean up potentially broken HTML after sanitization
   */
  private cleanBrokenHtml(html: string): string {
    // Remove any orphaned closing tags or broken tags
    return html
      .replace(/<\/?[^>]*$/gm, '') // Remove incomplete tags at end of lines
      .replace(/^[^<]*>/gm, '') // Remove incomplete tags at start of lines
      .replace(/<\/\s*>/g, '') // Remove empty closing tags
      .replace(/<\s*>/g, ''); // Remove empty opening tags
  }

  /**
   * Batch sanitize multiple content pieces
   */
  sanitizeBatch(
    contents: Array<{ content: string; context: string }>
  ): Array<{ context: string; result: SanitizationResult }> {
    return contents.map(({ content, context }) => ({
      context,
      result: this.sanitize(content, context)
    }));
  }
}

// Singleton export
export const asciiSanitizer = new AsciiSanitizationService();
