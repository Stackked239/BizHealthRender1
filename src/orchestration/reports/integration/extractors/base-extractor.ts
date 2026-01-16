/**
 * Abstract base class for content extractors.
 * Implements the Strategy pattern for extraction logic.
 */

import type {
  ContentItem,
  ExtractedContent,
  IntermediateFileType,
  ContentType,
  ClientDeliverableType,
  VoiceProfile,
  DepthLevel,
  Severity
} from '../types/content.types.js';
import type { ExtractionConfig, ContentSelector } from '../types/registry.types.js';
import { generateContentItemId } from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';
import * as crypto from 'crypto';

const logger = createLogger('BaseExtractor');

/**
 * Abstract base class for content extraction.
 * Subclasses implement specific extraction strategies.
 */
export abstract class BaseExtractor {
  protected logger = logger;

  /**
   * Extract content from HTML using the provided configuration.
   */
  public async extract(
    html: string,
    sourceFile: IntermediateFileType,
    config: ExtractionConfig
  ): Promise<ExtractedContent> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Extract items using selectors
    const items: ContentItem[] = [];
    let index = 0;

    for (const selector of config.selectors) {
      try {
        const extractedItems = await this.extractWithSelector(
          html,
          sourceFile,
          selector,
          index
        );

        // Filter by confidence threshold
        const filteredItems = extractedItems.filter(
          item => item.confidenceScore >= config.minConfidenceThreshold
        );

        if (selector.required && filteredItems.length === 0) {
          warnings.push(`Required selector "${selector.selector}" returned no items`);
        }

        items.push(...filteredItems);
        index += extractedItems.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`Error extracting with selector "${selector.selector}": ${message}`);

        if (selector.required) {
          this.logger.error(`Required extraction failed`, { selector: selector.selector, error });
        }
      }
    }

    // Build summary
    const summary = this.buildSummary(items);

    // Determine extraction quality
    const requiredSelectors = config.selectors.filter(s => s.required);
    const successfulRequired = requiredSelectors.filter(s =>
      items.some(item => item.sourceSelector === s.selector)
    );
    const extractionQuality = this.determineQuality(
      requiredSelectors.length,
      successfulRequired.length,
      items.length
    );

    const durationMs = Date.now() - startTime;

    return {
      sourceFile,
      items,
      summary,
      metadata: {
        extractedAt: new Date().toISOString(),
        contentHash: this.hashContent(html),
        extractionQuality,
        extractionDurationMs: durationMs,
        warnings
      }
    };
  }

  /**
   * Extract items using a specific selector.
   * Must be implemented by subclasses.
   */
  protected abstract extractWithSelector(
    html: string,
    sourceFile: IntermediateFileType,
    selector: ContentSelector,
    startIndex: number
  ): Promise<ContentItem[]>;

  /**
   * Parse HTML and extract text content from an element.
   */
  protected extractTextContent(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Count words in plain text.
   */
  protected countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract severity from content or class names.
   */
  protected extractSeverity(html: string, element?: string): Severity | undefined {
    const lowerHtml = (html + (element || '')).toLowerCase();

    if (lowerHtml.includes('critical') || lowerHtml.includes('severe')) {
      return 'critical';
    }
    if (lowerHtml.includes('high') || lowerHtml.includes('major')) {
      return 'high';
    }
    if (lowerHtml.includes('medium') || lowerHtml.includes('moderate')) {
      return 'medium';
    }
    if (lowerHtml.includes('low') || lowerHtml.includes('minor')) {
      return 'low';
    }

    return undefined;
  }

  /**
   * Determine target deliverables based on content type and source file.
   * Must be implemented by subclasses.
   */
  protected abstract getTargetDeliverables(
    contentType: ContentType,
    sourceFile: IntermediateFileType
  ): ClientDeliverableType[];

  /**
   * Determine target sections for each deliverable.
   * Must be implemented by subclasses.
   */
  protected abstract getTargetSections(
    contentType: ContentType,
    sourceFile: IntermediateFileType,
    deliverables: ClientDeliverableType[]
  ): Partial<Record<ClientDeliverableType, string>>;

  /**
   * Get default voice profile for source file.
   */
  protected getDefaultVoice(sourceFile: IntermediateFileType): VoiceProfile {
    // Strategic files default to executive voice
    if (['quickWins', 'risk', 'roadmap', 'financial'].includes(sourceFile)) {
      return 'executive';
    }
    // Deep dives default to manager voice
    return 'manager';
  }

  /**
   * Get default depth level for source file.
   */
  protected getDefaultDepth(sourceFile: IntermediateFileType): DepthLevel {
    // Strategic files default to standard depth
    if (['quickWins', 'risk', 'roadmap', 'financial'].includes(sourceFile)) {
      return 'standard';
    }
    // Deep dives default to detailed depth
    return 'detailed';
  }

  /**
   * Build summary statistics for extracted items.
   */
  private buildSummary(items: ContentItem[]): ExtractedContent['summary'] {
    const byType: Partial<Record<ContentType, number>> = {};
    const byDeliverable: Partial<Record<ClientDeliverableType, number>> = {};

    let totalConfidence = 0;
    let totalWordCount = 0;

    for (const item of items) {
      // Count by type
      byType[item.contentType] = (byType[item.contentType] || 0) + 1;

      // Count by deliverable
      for (const deliverable of item.targetDeliverables) {
        byDeliverable[deliverable] = (byDeliverable[deliverable] || 0) + 1;
      }

      totalConfidence += item.confidenceScore;
      totalWordCount += item.wordCount;
    }

    return {
      totalItems: items.length,
      byType,
      byDeliverable,
      averageConfidence: items.length > 0 ? totalConfidence / items.length : 0,
      totalWordCount
    };
  }

  /**
   * Determine extraction quality based on results.
   */
  private determineQuality(
    requiredCount: number,
    successCount: number,
    totalItems: number
  ): 'complete' | 'partial' | 'minimal' {
    if (requiredCount === 0 || (requiredCount > 0 && successCount === requiredCount)) {
      if (totalItems >= 3) {
        return 'complete';
      }
    }

    if (successCount > 0 || totalItems > 0) {
      return 'partial';
    }

    return 'minimal';
  }

  /**
   * Generate a hash of the content for change detection.
   */
  private hashContent(html: string): string {
    return crypto.createHash('md5').update(html).digest('hex').substring(0, 16);
  }

  /**
   * Create a content item with common fields populated.
   */
  protected createContentItem(
    sourceFile: IntermediateFileType,
    contentType: ContentType,
    index: number,
    title: string,
    htmlContent: string,
    selector: string,
    additionalProps: Partial<ContentItem> = {}
  ): ContentItem {
    const plainText = this.extractTextContent(htmlContent);
    const targetDeliverables = this.getTargetDeliverables(contentType, sourceFile);

    return {
      id: generateContentItemId(sourceFile, contentType, index),
      title,
      content: htmlContent,
      plainText,
      contentType,
      sourceFile,
      sourceSelector: selector,
      targetDeliverables,
      targetSections: this.getTargetSections(contentType, sourceFile, targetDeliverables),
      impactAreas: [],
      sourceVoice: this.getDefaultVoice(sourceFile),
      sourceDepth: this.getDefaultDepth(sourceFile),
      wordCount: this.countWords(plainText),
      confidenceScore: 0.8, // Default confidence
      extractedAt: new Date().toISOString(),
      validationStatus: 'pending',
      ...additionalProps
    };
  }
}
