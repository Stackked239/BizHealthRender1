/**
 * Supplement Builder - Builds enrichment subsections for SUPPLEMENT integration pattern.
 *
 * Used for Deep Dive Reports (GE, PH, PL, RS).
 * Adds supplementary insights as subsections after dimension content.
 */

import type { TransformedContent } from '../types/content.types.js';
import type { TargetMapping } from '../types/registry.types.js';
import { generateIntegrationId } from '../types/content.types.js';
import { CrossReferenceGenerator } from '../transformers/cross-reference-generator.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('SupplementBuilder');

/**
 * Configuration for supplement building.
 */
interface SupplementBuildConfig {
  /** Include supplementary header */
  includeHeader: boolean;
  /** Include cross-references */
  includeCrossReferences: boolean;
  /** CSS class prefix */
  classPrefix: string;
  /** Show visual indicator emoji */
  showIndicator: boolean;
  /** Custom indicator */
  indicator: string;
}

const DEFAULT_CONFIG: SupplementBuildConfig = {
  includeHeader: true,
  includeCrossReferences: true,
  classPrefix: 'deep-dive-supplement',
  showIndicator: true,
  indicator: '\u{1F4A1}' // Light bulb emoji
};

/**
 * Builds enrichment subsections for deep dive content.
 */
export class SupplementBuilder {
  private crossRefGenerator = new CrossReferenceGenerator();

  /**
   * Build and insert a supplement subsection into target HTML.
   */
  public build(
    targetHtml: string,
    transformed: TransformedContent,
    mapping: TargetMapping,
    config: Partial<SupplementBuildConfig> = {}
  ): string {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const integrationId = generateIntegrationId();

    // Build the supplement HTML
    const supplementHtml = this.buildSupplementHtml(transformed, mapping, integrationId, fullConfig);

    // Insert after target section
    return this.insertSupplement(targetHtml, supplementHtml, mapping.targetSection, mapping.insertionPoint);
  }

  /**
   * Build the complete supplement HTML.
   */
  private buildSupplementHtml(
    transformed: TransformedContent,
    mapping: TargetMapping,
    integrationId: string,
    config: SupplementBuildConfig
  ): string {
    const parts: string[] = [];

    // Open supplement wrapper
    parts.push(`<div class="${config.classPrefix}" data-source="${transformed.originalSource}" data-integration-id="${integrationId}" data-dimension="${this.extractDimensionCode(mapping.targetSection)}">`);

    // Build header if configured
    if (config.includeHeader && mapping.supplementHeader) {
      parts.push(this.buildHeader(mapping, config));
    }

    // Content wrapper
    parts.push(`<div class="supplement-content">`);
    parts.push(transformed.htmlContent);
    parts.push(`</div>`);

    // Cross-references if configured
    if (config.includeCrossReferences && transformed.crossReferences.length > 0) {
      parts.push(this.crossRefGenerator.generateHtml(transformed.crossReferences, 'supplement-references'));
    }

    // Close supplement wrapper
    parts.push(`</div>`);

    return parts.join('\n');
  }

  /**
   * Build the supplement header.
   */
  private buildHeader(mapping: TargetMapping, config: SupplementBuildConfig): string {
    const indicator = config.showIndicator ? `${config.indicator} ` : '';

    return `
      <div class="supplement-header">
        <h3>${indicator}${mapping.supplementHeader}</h3>
      </div>
    `.trim();
  }

  /**
   * Insert supplement into target HTML.
   */
  private insertSupplement(
    targetHtml: string,
    supplementHtml: string,
    targetSelector: string,
    insertionPoint: TargetMapping['insertionPoint']
  ): string {
    // Find target element (dimension section)
    const selectorId = targetSelector.replace(/^#/, '');
    const selectorClass = targetSelector.replace(/^\./, '');

    // Build regex patterns for finding target
    const patterns = [
      // ID-based: #dimension-XXX
      new RegExp(`(<[^>]+id=["']${this.escapeRegex(selectorId)}["'][^>]*>)([\\s\\S]*?)(<\\/[a-z]+>)`, 'i'),
      // Class with dimension data attribute
      new RegExp(`(<[^>]+data-dimension=["']${this.escapeRegex(selectorId.replace('dimension-', ''))}["'][^>]*>)([\\s\\S]*?)(<\\/[a-z]+>)`, 'i'),
      // Class-based
      new RegExp(`(<[^>]+class=["'][^"']*\\b${this.escapeRegex(selectorClass)}\\b[^"']*["'][^>]*>)([\\s\\S]*?)(<\\/[a-z]+>)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = targetHtml.match(pattern);
      if (match) {
        const [fullMatch, openTag, content, closeTag] = match;

        switch (insertionPoint) {
          case 'after':
          default:
            // Insert after the element (default for supplements)
            return targetHtml.replace(fullMatch, `${fullMatch}\n${supplementHtml}`);

          case 'within':
            // Append within the element
            return targetHtml.replace(fullMatch, `${openTag}${content}\n${supplementHtml}\n${closeTag}`);

          case 'before':
            // Insert before the element
            return targetHtml.replace(fullMatch, `${supplementHtml}\n${fullMatch}`);

          case 'replace':
            // Replace the content (unusual for supplements)
            logger.warn(`Replace insertion point used for supplement - this may overwrite dimension content`);
            return targetHtml.replace(fullMatch, `${openTag}\n${supplementHtml}\n${closeTag}`);
        }
      }
    }

    // Target not found - try to find closest match
    const fuzzyMatch = this.findFuzzyMatch(targetHtml, targetSelector);
    if (fuzzyMatch) {
      logger.warn(`Exact target "${targetSelector}" not found. Using fuzzy match.`);
      return targetHtml.replace(fuzzyMatch, `${fuzzyMatch}\n${supplementHtml}`);
    }

    // Completely not found - log error and append to end
    logger.error(`Target section "${targetSelector}" not found. Appending supplement to end.`);
    return `${targetHtml}\n${supplementHtml}`;
  }

  /**
   * Find fuzzy match for target selector.
   */
  private findFuzzyMatch(html: string, targetSelector: string): string | null {
    // Try to find any dimension section
    const dimensionCode = this.extractDimensionCode(targetSelector);
    if (dimensionCode) {
      const fuzzyPatterns = [
        new RegExp(`<[^>]*(?:id|data-dimension)=["'][^"']*${dimensionCode}[^"']*["'][^>]*>[\\s\\S]*?<\\/[a-z]+>`, 'i'),
        new RegExp(`<section[^>]*>\\s*<h[23][^>]*>[^<]*${dimensionCode}[^<]*<\\/h[23]>[\\s\\S]*?<\\/section>`, 'i')
      ];

      for (const pattern of fuzzyPatterns) {
        const match = html.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }

    return null;
  }

  /**
   * Extract dimension code from selector.
   */
  private extractDimensionCode(selector: string): string {
    // Handle #dimension-XXX or [data-dimension="XXX"]
    const idMatch = selector.match(/#?dimension-(\w+)/i);
    if (idMatch) return idMatch[1];

    const attrMatch = selector.match(/data-dimension=["']?(\w+)["']?/i);
    if (attrMatch) return attrMatch[1];

    return '';
  }

  /**
   * Build multiple supplements at once.
   */
  public buildMultiple(
    targetHtml: string,
    transformedItems: Array<{
      content: TransformedContent;
      mapping: TargetMapping;
    }>,
    config: Partial<SupplementBuildConfig> = {}
  ): string {
    let html = targetHtml;

    // Sort by target section to ensure consistent ordering
    const sorted = [...transformedItems].sort((a, b) =>
      a.mapping.targetSection.localeCompare(b.mapping.targetSection)
    );

    for (const { content, mapping } of sorted) {
      html = this.build(html, content, mapping, config);
    }

    return html;
  }

  /**
   * Check if a supplement already exists for a target.
   */
  public supplementExists(targetHtml: string, source: string, targetSection: string): boolean {
    const dimensionCode = this.extractDimensionCode(targetSection);
    const pattern = new RegExp(
      `data-source=["']${this.escapeRegex(source)}["'][^>]*data-dimension=["']${dimensionCode}["']`,
      'i'
    );
    return pattern.test(targetHtml);
  }

  /**
   * Remove an existing supplement.
   */
  public removeSupplement(targetHtml: string, integrationId: string): string {
    const pattern = new RegExp(
      `<div[^>]*data-integration-id=["']${this.escapeRegex(integrationId)}["'][^>]*class=["'][^"']*deep-dive-supplement[^"']*["'][^>]*>[\\s\\S]*?<\\/div>`,
      'gi'
    );

    return targetHtml.replace(pattern, '');
  }

  /**
   * Build a standalone supplement (not inserted into target).
   */
  public buildStandalone(
    transformed: TransformedContent,
    mapping: TargetMapping,
    config: Partial<SupplementBuildConfig> = {}
  ): string {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const integrationId = generateIntegrationId();

    return this.buildSupplementHtml(transformed, mapping, integrationId, fullConfig);
  }

  /**
   * Get all supplement integration IDs from HTML.
   */
  public getSupplementIds(html: string): string[] {
    const ids: string[] = [];
    const regex = /class=["'][^"']*deep-dive-supplement[^"']*["'][^>]*data-integration-id=["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      ids.push(match[1]);
    }

    // Also check reverse order of attributes
    const reverseRegex = /data-integration-id=["']([^"']+)["'][^>]*class=["'][^"']*deep-dive-supplement[^"']*["']/g;
    while ((match = reverseRegex.exec(html)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }

    return ids;
  }

  /**
   * Escape special regex characters.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
