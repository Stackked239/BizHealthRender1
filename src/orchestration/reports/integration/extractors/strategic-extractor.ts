/**
 * Extractor for Strategic Reports (quickWins, risk, roadmap, financial).
 * These reports use the TRANSFORM integration pattern.
 */

import { BaseExtractor } from './base-extractor.js';
import type {
  ContentItem,
  IntermediateFileType,
  ContentType,
  ClientDeliverableType,
  Severity
} from '../types/content.types.js';
import type { ContentSelector } from '../types/registry.types.js';
import { getContentRegistry } from '../registries/content-registry.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('StrategicExtractor');

/**
 * Extracts content from Strategic Report intermediate files.
 */
export class StrategicExtractor extends BaseExtractor {
  protected logger = logger;

  /**
   * Extract items using a specific CSS selector pattern.
   */
  protected async extractWithSelector(
    html: string,
    sourceFile: IntermediateFileType,
    selector: ContentSelector,
    startIndex: number
  ): Promise<ContentItem[]> {
    const items: ContentItem[] = [];

    // Use regex-based extraction for server-side HTML parsing
    const elements = this.findElements(html, selector.selector);

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Extract title
      const title = selector.titleSelector
        ? this.extractNestedContent(element, selector.titleSelector)
        : this.extractFirstHeading(element);

      // Extract content
      const content = selector.contentSelector
        ? this.extractNestedContent(element, selector.contentSelector)
        : element;

      // Extract severity if specified
      const severity = selector.severitySelector
        ? this.extractSeverityFromElement(element, selector.severitySelector)
        : this.extractSeverity(element);

      // Calculate confidence based on content richness
      const confidence = this.calculateConfidence(title, content, element);

      const item = this.createContentItem(
        sourceFile,
        selector.contentType,
        startIndex + i,
        title || `${selector.contentType} ${i + 1}`,
        content,
        selector.selector,
        {
          severity,
          confidenceScore: confidence,
          impactAreas: this.extractImpactAreas(element, sourceFile),
          estimatedValue: this.extractEstimatedValue(element),
          visualizationData: this.extractVisualizationData(element)
        }
      );

      items.push(item);
    }

    return items;
  }

  /**
   * Get target deliverables for strategic content.
   */
  protected getTargetDeliverables(
    contentType: ContentType,
    sourceFile: IntermediateFileType
  ): ClientDeliverableType[] {
    const registry = getContentRegistry();
    const entry = registry.getEntry(sourceFile);

    if (!entry) {
      // Default targets based on content type
      return this.getDefaultTargetsForContentType(contentType);
    }

    // Get unique deliverables from target mappings
    const deliverables = new Set<ClientDeliverableType>();
    for (const mapping of entry.targetMappings) {
      deliverables.add(mapping.deliverable);
    }

    return Array.from(deliverables);
  }

  /**
   * Get target sections for each deliverable.
   */
  protected getTargetSections(
    contentType: ContentType,
    sourceFile: IntermediateFileType,
    deliverables: ClientDeliverableType[]
  ): Partial<Record<ClientDeliverableType, string>> {
    const registry = getContentRegistry();
    const entry = registry.getEntry(sourceFile);
    const sections: Partial<Record<ClientDeliverableType, string>> = {};

    if (!entry) {
      return sections;
    }

    for (const deliverable of deliverables) {
      const mapping = entry.targetMappings.find(m => m.deliverable === deliverable);
      if (mapping) {
        sections[deliverable] = mapping.targetSection;
      }
    }

    return sections;
  }

  /**
   * Find elements matching a CSS selector pattern using regex.
   */
  private findElements(html: string, selectorPattern: string): string[] {
    const elements: string[] = [];
    const selectors = selectorPattern.split(',').map(s => s.trim());

    for (const selector of selectors) {
      // Handle class selectors (.class-name)
      if (selector.startsWith('.')) {
        const className = selector.substring(1).replace(/[[\]]/g, '');
        const classRegex = new RegExp(
          `<([a-z][a-z0-9]*)\\s+[^>]*class\\s*=\\s*["'][^"']*\\b${this.escapeRegex(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi'
        );
        let match;
        while ((match = classRegex.exec(html)) !== null) {
          elements.push(match[0]);
        }
      }
      // Handle ID selectors (#id-name)
      else if (selector.startsWith('#')) {
        const id = selector.substring(1);
        const idRegex = new RegExp(
          `<([a-z][a-z0-9]*)\\s+[^>]*id\\s*=\\s*["']${this.escapeRegex(id)}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi'
        );
        let match;
        while ((match = idRegex.exec(html)) !== null) {
          elements.push(match[0]);
        }
      }
      // Handle data attribute selectors ([data-*="value"])
      else if (selector.startsWith('[') && selector.includes('data-')) {
        const attrMatch = selector.match(/\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]/);
        if (attrMatch) {
          const attr = attrMatch[1];
          const value = attrMatch[2];
          const attrRegex = value
            ? new RegExp(
              `<([a-z][a-z0-9]*)\\s+[^>]*${this.escapeRegex(attr)}\\s*=\\s*["']${this.escapeRegex(value)}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
              'gi'
            )
            : new RegExp(
              `<([a-z][a-z0-9]*)\\s+[^>]*${this.escapeRegex(attr)}\\s*=\\s*["'][^"']+["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
              'gi'
            );
          let match;
          while ((match = attrRegex.exec(html)) !== null) {
            elements.push(match[0]);
          }
        }
      }
    }

    return elements;
  }

  /**
   * Extract nested content from an element using a selector pattern.
   */
  private extractNestedContent(html: string, selectorPattern: string): string {
    const selectors = selectorPattern.split(',').map(s => s.trim());

    for (const selector of selectors) {
      let content = '';

      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        const regex = new RegExp(
          `<[^>]+class\\s*=\\s*["'][^"']*\\b${this.escapeRegex(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<`,
          'i'
        );
        const match = html.match(regex);
        if (match) {
          content = this.extractTextContent(match[1]);
        }
      } else if (selector.match(/^h[1-6]$/i)) {
        const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
        const match = html.match(regex);
        if (match) {
          content = this.extractTextContent(match[1]);
        }
      }

      if (content) {
        return content;
      }
    }

    return this.extractTextContent(html);
  }

  /**
   * Extract the first heading from an element.
   */
  private extractFirstHeading(html: string): string {
    const headingRegex = /<h([1-6])[^>]*>([^<]*(?:<(?!\/h\1)[^<]*)*)<\/h\1>/i;
    const match = html.match(headingRegex);
    if (match) {
      return this.extractTextContent(match[2]);
    }
    return '';
  }

  /**
   * Extract severity from a specific element or class.
   */
  private extractSeverityFromElement(html: string, selectorPattern: string): Severity | undefined {
    const content = this.extractNestedContent(html, selectorPattern);
    return this.extractSeverity(content, html);
  }

  /**
   * Calculate confidence score based on content richness.
   */
  private calculateConfidence(title: string, content: string, fullElement: string): number {
    let score = 0.5; // Base score

    // Title present and meaningful
    if (title && title.length > 3) {
      score += 0.15;
    }

    // Content has substantial text
    const wordCount = this.countWords(this.extractTextContent(content));
    if (wordCount > 10) {
      score += 0.1;
    }
    if (wordCount > 50) {
      score += 0.1;
    }

    // Has structured data attributes
    if (fullElement.includes('data-')) {
      score += 0.05;
    }

    // Has metrics or numbers
    if (/\d+%|\$\d+|[\d,]+\s*(days?|months?|years?)/i.test(fullElement)) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Extract impact areas from content.
   */
  private extractImpactAreas(html: string, sourceFile: IntermediateFileType): string[] {
    const areas: string[] = [];

    // Check for dimension mentions
    const dimensionPatterns = [
      { pattern: /strateg/i, area: 'Strategy' },
      { pattern: /sales|revenue/i, area: 'Sales' },
      { pattern: /market/i, area: 'Marketing' },
      { pattern: /customer/i, area: 'Customer Experience' },
      { pattern: /operat/i, area: 'Operations' },
      { pattern: /financ|profit|cost/i, area: 'Financials' },
      { pattern: /hr|human|talent|employee/i, area: 'Human Resources' },
      { pattern: /leader|govern/i, area: 'Leadership' },
      { pattern: /technolog|innovat|digital/i, area: 'Technology' },
      { pattern: /it|data|security|cyber/i, area: 'IT & Data' },
      { pattern: /risk/i, area: 'Risk Management' },
      { pattern: /compli/i, area: 'Compliance' }
    ];

    for (const { pattern, area } of dimensionPatterns) {
      if (pattern.test(html) && !areas.includes(area)) {
        areas.push(area);
      }
    }

    // Add default area based on source file
    const sourceAreaMap: Record<string, string> = {
      quickWins: 'Quick Wins',
      risk: 'Risk Management',
      roadmap: 'Strategic Planning',
      financial: 'Financial Impact'
    };

    if (sourceAreaMap[sourceFile] && !areas.includes(sourceAreaMap[sourceFile])) {
      areas.unshift(sourceAreaMap[sourceFile]);
    }

    return areas;
  }

  /**
   * Extract estimated value from content.
   */
  private extractEstimatedValue(html: string): ContentItem['estimatedValue'] | undefined {
    // Look for currency values
    const currencyMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)\s*(?:K|M|B)?/i);
    if (currencyMatch) {
      let value = parseFloat(currencyMatch[1].replace(/,/g, ''));
      const suffix = currencyMatch[0].toUpperCase();
      if (suffix.includes('K')) value *= 1000;
      if (suffix.includes('M')) value *= 1000000;
      if (suffix.includes('B')) value *= 1000000000;

      return {
        type: 'currency',
        value,
        unit: 'USD'
      };
    }

    // Look for percentage values
    const percentMatch = html.match(/(\d+(?:\.\d+)?)\s*%\s*(?:increase|decrease|improvement|growth|reduction)?/i);
    if (percentMatch) {
      return {
        type: 'percentage',
        value: parseFloat(percentMatch[1]),
        unit: '%'
      };
    }

    // Look for time values
    const timeMatch = html.match(/(\d+)\s*(days?|weeks?|months?|years?)/i);
    if (timeMatch) {
      return {
        type: 'time',
        value: parseInt(timeMatch[1]),
        unit: timeMatch[2].toLowerCase()
      };
    }

    return undefined;
  }

  /**
   * Extract visualization data from content.
   */
  private extractVisualizationData(html: string): Record<string, unknown> | undefined {
    const data: Record<string, unknown> = {};

    // Extract data attributes
    const dataAttrRegex = /data-([a-z-]+)=["']([^"']+)["']/gi;
    let match;
    while ((match = dataAttrRegex.exec(html)) !== null) {
      const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      data[key] = match[2];
    }

    // Extract score values
    const scoreMatch = html.match(/data-score=["']?(\d+)["']?/i);
    if (scoreMatch) {
      data.score = parseInt(scoreMatch[1]);
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  /**
   * Get default target deliverables for a content type.
   */
  private getDefaultTargetsForContentType(contentType: ContentType): ClientDeliverableType[] {
    switch (contentType) {
      case 'quick_win':
        return ['comprehensive', 'owner', 'executiveBrief'];
      case 'risk':
        return ['comprehensive', 'owner', 'executiveBrief', 'financialsManager'];
      case 'roadmap_phase':
        return ['comprehensive', 'owner', 'strategyLeadershipManager'];
      case 'financial_metric':
      case 'financial_projection':
        return ['comprehensive', 'owner', 'financialsManager'];
      case 'recommendation':
        return ['comprehensive', 'owner'];
      default:
        return ['comprehensive'];
    }
  }

  /**
   * Escape special regex characters.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
