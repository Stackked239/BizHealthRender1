/**
 * VISUALIZATION EXTRACTOR SERVICE
 *
 * Extracts and validates visualization specifications from AI output.
 *
 * This service:
 * 1. Extracts ```json:visualization``` blocks from AI response
 * 2. Validates each block against VisualizationSpecSchema
 * 3. Detects any ASCII diagram violations
 * 4. Returns cleaned text + validated visualizations
 *
 * ASCII violations cause hard failures - they are NOT silently ignored.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VisualizationSpec,
  VisualizationSpecSchema,
  FORBIDDEN_ASCII_PATTERN,
  ASCII_BLOCK_PATTERN,
  ASCII_BAR_PATTERN
} from '../contracts/visualization.contract';
import { createLogger } from '../utils/logger';

const logger = createLogger('visualization-extractor');

export interface ExtractionResult {
  cleanedText: string;
  visualizations: VisualizationSpec[];
  extractionErrors: string[];
  asciiViolations: string[];
}

/**
 * Extracts and validates visualization specifications from AI output.
 */
export class VisualizationExtractorService {
  private readonly vizBlockPattern = /```json:visualization\s*([\s\S]*?)```/g;

  /**
   * Extract and validate visualizations from AI output
   * @param aiOutput Raw AI response text
   * @param analysisId Identifier for the source analysis
   * @returns ExtractionResult containing cleaned text and validated visualizations
   */
  extract(aiOutput: string, analysisId: string): ExtractionResult {
    const result: ExtractionResult = {
      cleanedText: aiOutput,
      visualizations: [],
      extractionErrors: [],
      asciiViolations: []
    };

    // STEP 1: Check for ASCII violations FIRST
    this.detectAsciiViolations(aiOutput, analysisId, result);

    // STEP 2: Extract visualization blocks
    let match: RegExpExecArray | null;
    const vizBlockPattern = new RegExp(this.vizBlockPattern.source, 'g');

    while ((match = vizBlockPattern.exec(aiOutput)) !== null) {
      const jsonContent = match[1].trim();
      const fullMatch = match[0];

      try {
        // Parse JSON
        const parsed = JSON.parse(jsonContent);

        // Validate against schema
        const validated = VisualizationSpecSchema.parse({
          ...parsed,
          vizId: parsed.vizId || uuidv4()
        });

        result.visualizations.push(validated);

        // Replace block with placeholder in cleaned text
        const placeholderIndex = result.visualizations.length - 1;
        result.cleanedText = result.cleanedText.replace(
          fullMatch,
          `<!-- VISUALIZATION_PLACEHOLDER_${placeholderIndex} -->`
        );

        logger.debug(
          {
            analysisId,
            vizType: validated.vizType,
            title: validated.title
          },
          'Visualization extracted and validated'
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.extractionErrors.push(
          `Failed to parse visualization block: ${errorMsg}\nContent: ${jsonContent.substring(0, 200)}...`
        );
        logger.warn({ analysisId, error: errorMsg }, 'Visualization extraction failed');
      }
    }

    // STEP 3: Final ASCII check on cleaned text (catch any outside viz blocks)
    if (FORBIDDEN_ASCII_PATTERN.test(result.cleanedText)) {
      const matches = result.cleanedText.match(new RegExp(FORBIDDEN_ASCII_PATTERN.source, 'g'));
      if (matches) {
        result.asciiViolations.push(
          `ASCII characters found outside visualization blocks: ${[...new Set(matches)].join(', ')}`
        );
      }
    }

    // Log summary
    logger.info(
      {
        analysisId,
        visualizationsExtracted: result.visualizations.length,
        extractionErrors: result.extractionErrors.length,
        asciiViolations: result.asciiViolations.length
      },
      'Visualization extraction complete'
    );

    return result;
  }

  /**
   * Detect ASCII diagram patterns and record violations
   */
  private detectAsciiViolations(
    content: string,
    analysisId: string,
    result: ExtractionResult
  ): void {
    // Check for multi-line ASCII blocks (3+ lines with forbidden chars)
    const blockPattern = new RegExp(ASCII_BLOCK_PATTERN.source, 'gm');
    const blocks = content.match(blockPattern);

    if (blocks) {
      for (const block of blocks) {
        result.asciiViolations.push(
          `ASCII diagram block detected (${block.split('\n').length} lines):\n${block.substring(0, 200)}...`
        );
        logger.error(
          {
            analysisId,
            blockPreview: block.substring(0, 100)
          },
          'ASCII DIAGRAM VIOLATION DETECTED'
        );
      }
    }

    // Check for bar chart patterns
    const barPattern = new RegExp(ASCII_BAR_PATTERN.source, 'g');
    const bars = content.match(barPattern);

    if (bars) {
      result.asciiViolations.push(`ASCII bar chart pattern detected: ${bars.join(', ')}`);
    }
  }

  /**
   * Validate that extraction result meets quality standards
   * @throws Error if ASCII violations present or too many extraction errors
   */
  assertQuality(result: ExtractionResult, analysisId: string): void {
    if (result.asciiViolations.length > 0) {
      throw new Error(
        `ASCII DIAGRAM VIOLATIONS in ${analysisId}:\n` +
          result.asciiViolations.map((v, i) => `  ${i + 1}. ${v}`).join('\n') +
          `\n\nThis analysis must be regenerated with proper visualization format.`
      );
    }

    if (result.extractionErrors.length > result.visualizations.length) {
      logger.warn(
        {
          analysisId,
          errors: result.extractionErrors.length,
          successes: result.visualizations.length
        },
        'High visualization extraction error rate'
      );
    }
  }

  /**
   * Check if content contains any ASCII diagram characters (non-throwing)
   */
  containsAscii(content: string): boolean {
    return FORBIDDEN_ASCII_PATTERN.test(content);
  }

  /**
   * Count ASCII occurrences for reporting
   */
  countAsciiOccurrences(content: string): number {
    const matches = content.match(new RegExp(FORBIDDEN_ASCII_PATTERN.source, 'g'));
    return matches?.length || 0;
  }
}

// Singleton export
export const visualizationExtractor = new VisualizationExtractorService();
