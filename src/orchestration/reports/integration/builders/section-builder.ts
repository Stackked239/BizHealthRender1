/**
 * Section Builder - Builds labeled sections for TRANSFORM integration pattern.
 *
 * Used for Strategic Reports (quickWins, risk, roadmap, financial).
 * Embeds transformed content as clearly labeled sections.
 */

import type { TransformedContent } from '../types/content.types.js';
import type { TargetMapping } from '../types/registry.types.js';
import { generateIntegrationId } from '../types/content.types.js';
import { CrossReferenceGenerator } from '../transformers/cross-reference-generator.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('SectionBuilder');

/**
 * Configuration for section building.
 */
interface SectionBuildConfig {
  /** Include section header */
  includeHeader: boolean;
  /** Include integration badge */
  includeBadge: boolean;
  /** Include cross-references */
  includeCrossReferences: boolean;
  /** CSS class prefix */
  classPrefix: string;
}

const DEFAULT_CONFIG: SectionBuildConfig = {
  includeHeader: true,
  includeBadge: true,
  includeCrossReferences: true,
  classPrefix: 'integrated-section'
};

/**
 * Builds labeled sections for strategic content integration.
 */
export class SectionBuilder {
  private crossRefGenerator = new CrossReferenceGenerator();

  /**
   * Build and insert a labeled section into target HTML.
   */
  public build(
    targetHtml: string,
    transformed: TransformedContent,
    mapping: TargetMapping,
    config: Partial<SectionBuildConfig> = {}
  ): string {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const integrationId = generateIntegrationId();

    // Build the section HTML
    const sectionHtml = this.buildSectionHtml(transformed, mapping, integrationId, fullConfig);

    // Insert into target HTML based on insertion point
    return this.insertSection(targetHtml, sectionHtml, mapping.targetSection, mapping.insertionPoint);
  }

  /**
   * Build the complete section HTML.
   */
  private buildSectionHtml(
    transformed: TransformedContent,
    mapping: TargetMapping,
    integrationId: string,
    config: SectionBuildConfig
  ): string {
    const parts: string[] = [];

    // Open section wrapper
    parts.push(`<div class="${config.classPrefix}" data-source="${transformed.originalSource}" data-integration-id="${integrationId}">`);

    // Build header if configured
    if (config.includeHeader) {
      parts.push(this.buildHeader(mapping, config));
    }

    // Content wrapper
    parts.push(`<div class="integration-content">`);
    parts.push(transformed.htmlContent);
    parts.push(`</div>`);

    // Cross-references if configured
    if (config.includeCrossReferences && transformed.crossReferences.length > 0) {
      parts.push(this.crossRefGenerator.generateHtml(transformed.crossReferences));
    }

    // Close section wrapper
    parts.push(`</div>`);

    return parts.join('\n');
  }

  /**
   * Build the section header.
   */
  private buildHeader(mapping: TargetMapping, config: SectionBuildConfig): string {
    const badge = config.includeBadge
      ? `<span class="integration-badge strategic">${mapping.sectionNumber}</span>`
      : '';

    return `
      <div class="integration-header">
        <h2>${mapping.label}</h2>
        ${badge}
      </div>
    `.trim();
  }

  /**
   * Insert section into target HTML at specified point.
   */
  private insertSection(
    targetHtml: string,
    sectionHtml: string,
    targetSelector: string,
    insertionPoint: TargetMapping['insertionPoint']
  ): string {
    // Find target element
    const selectorId = targetSelector.replace(/^#/, '');
    const selectorClass = targetSelector.replace(/^\./, '');

    // Build regex patterns for finding target
    const patterns = [
      // ID-based
      new RegExp(`(<[^>]+id=["']${this.escapeRegex(selectorId)}["'][^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`, 'i'),
      // Class-based
      new RegExp(`(<[^>]+class=["'][^"']*\\b${this.escapeRegex(selectorClass)}\\b[^"']*["'][^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = targetHtml.match(pattern);
      if (match) {
        const [fullMatch, openTag, content, closeTag] = match;

        switch (insertionPoint) {
          case 'replace':
            // Replace entire content
            return targetHtml.replace(fullMatch, `${openTag}\n${sectionHtml}\n${closeTag}`);

          case 'before':
            // Insert before the element
            return targetHtml.replace(fullMatch, `${sectionHtml}\n${fullMatch}`);

          case 'after':
            // Insert after the element
            return targetHtml.replace(fullMatch, `${fullMatch}\n${sectionHtml}`);

          case 'within':
          default:
            // Append within the element
            return targetHtml.replace(fullMatch, `${openTag}${content}\n${sectionHtml}\n${closeTag}`);
        }
      }
    }

    // Target not found - log warning and append to end
    logger.warn(`Target section "${targetSelector}" not found. Appending to end.`);
    return `${targetHtml}\n${sectionHtml}`;
  }

  /**
   * Build multiple sections at once.
   */
  public buildMultiple(
    targetHtml: string,
    transformedItems: Array<{
      content: TransformedContent;
      mapping: TargetMapping;
    }>,
    config: Partial<SectionBuildConfig> = {}
  ): string {
    let html = targetHtml;

    // Sort by priority (high first)
    const sorted = [...transformedItems].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.mapping.priority] - priorityOrder[b.mapping.priority];
    });

    for (const { content, mapping } of sorted) {
      html = this.build(html, content, mapping, config);
    }

    return html;
  }

  /**
   * Check if a section already exists in the HTML.
   */
  public sectionExists(targetHtml: string, integrationId: string): boolean {
    return targetHtml.includes(`data-integration-id="${integrationId}"`);
  }

  /**
   * Remove an existing integrated section.
   */
  public removeSection(targetHtml: string, integrationId: string): string {
    const pattern = new RegExp(
      `<div[^>]*data-integration-id=["']${this.escapeRegex(integrationId)}["'][^>]*>[\\s\\S]*?<\\/div>`,
      'gi'
    );

    return targetHtml.replace(pattern, '');
  }

  /**
   * Update an existing section.
   */
  public updateSection(
    targetHtml: string,
    transformed: TransformedContent,
    mapping: TargetMapping,
    existingIntegrationId: string,
    config: Partial<SectionBuildConfig> = {}
  ): string {
    // Remove existing section
    let html = this.removeSection(targetHtml, existingIntegrationId);

    // Build new section with same ID
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const sectionHtml = this.buildSectionHtml(transformed, mapping, existingIntegrationId, fullConfig);

    // Insert at target location
    return this.insertSection(html, sectionHtml, mapping.targetSection, mapping.insertionPoint);
  }

  /**
   * Build a standalone section (not inserted into target).
   */
  public buildStandalone(
    transformed: TransformedContent,
    mapping: TargetMapping,
    config: Partial<SectionBuildConfig> = {}
  ): string {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const integrationId = generateIntegrationId();

    return this.buildSectionHtml(transformed, mapping, integrationId, fullConfig);
  }

  /**
   * Get all integration IDs from HTML.
   */
  public getIntegrationIds(html: string): string[] {
    const ids: string[] = [];
    const regex = /data-integration-id=["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      ids.push(match[1]);
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
