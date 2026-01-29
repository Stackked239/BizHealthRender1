/**
 * Extractor for Deep Dive Reports (GE, PH, PL, RS).
 * These reports use the SUPPLEMENT integration pattern.
 */

import { BaseExtractor } from './base-extractor.js';
import type {
  ContentItem,
  IntermediateFileType,
  ContentType,
  ClientDeliverableType
} from '../types/content.types.js';
import type { ContentSelector } from '../types/registry.types.js';
import { getContentRegistry } from '../registries/content-registry.js';
import { getChapterForDeepDive } from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('DeepDiveExtractor');

/**
 * Dimension code mapping for deep dive extraction.
 */
const CHAPTER_DIMENSIONS: Record<string, string[]> = {
  GE: ['STR', 'SAL', 'MKT', 'CXP'],
  PH: ['OPS', 'FIN'],
  PL: ['HRS', 'LDG'],
  RS: ['TIN', 'IDS', 'RMS', 'CMP']
};

/**
 * Dimension to manager report mapping.
 */
const DIMENSION_TO_MANAGER: Record<string, ClientDeliverableType> = {
  STR: 'strategyLeadershipManager',
  SAL: 'salesMarketingManager',
  MKT: 'salesMarketingManager',
  CXP: 'salesMarketingManager',
  OPS: 'operationsManager',
  FIN: 'financialsManager',
  HRS: 'operationsManager',
  LDG: 'strategyLeadershipManager',
  TIN: 'itTechnologyManager',
  IDS: 'itTechnologyManager',
  RMS: 'strategyLeadershipManager',
  CMP: 'strategyLeadershipManager'
};

/**
 * Extracts content from Deep Dive Report intermediate files.
 */
export class DeepDiveExtractor extends BaseExtractor {
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

    // Extract dimension code from selector if present
    const dimensionCode = this.extractDimensionCode(selector.selector);

    // Find elements matching the selector
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

      // Calculate confidence
      const confidence = this.calculateConfidence(title, content, element);

      // Determine actual dimension code
      const actualDimensionCode = dimensionCode || this.inferDimensionCode(element, sourceFile);

      const item = this.createContentItem(
        sourceFile,
        selector.contentType,
        startIndex + i,
        title || `${actualDimensionCode} Analysis`,
        content,
        selector.selector,
        {
          confidenceScore: confidence,
          impactAreas: actualDimensionCode ? [this.getDimensionName(actualDimensionCode)] : [],
          visualizationData: {
            dimensionCode: actualDimensionCode,
            chapterCode: getChapterForDeepDive(sourceFile),
            ...this.extractVisualizationData(element)
          }
        }
      );

      items.push(item);
    }

    return items;
  }

  /**
   * Get target deliverables for deep dive content.
   */
  protected getTargetDeliverables(
    contentType: ContentType,
    sourceFile: IntermediateFileType
  ): ClientDeliverableType[] {
    const registry = getContentRegistry();
    const entry = registry.getEntry(sourceFile);

    if (!entry) {
      // Default: target relevant manager report based on chapter
      const chapterCode = getChapterForDeepDive(sourceFile);
      if (chapterCode) {
        return this.getManagersForChapter(chapterCode);
      }
      return ['comprehensive'];
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
   * Find elements matching a CSS selector pattern.
   */
  private findElements(html: string, selectorPattern: string): string[] {
    const elements: string[] = [];
    const selectors = selectorPattern.split(',').map(s => s.trim());

    for (const selector of selectors) {
      // Handle dimension section with data attribute
      if (selector.includes('[data-dimension=')) {
        const dimMatch = selector.match(/\[data-dimension=["']?(\w+)["']?\]/);
        if (dimMatch) {
          const dimCode = dimMatch[1];
          // Match elements with the dimension attribute
          const regex = new RegExp(
            `<([a-z][a-z0-9]*)\\s+[^>]*data-dimension\\s*=\\s*["']${dimCode}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
            'gi'
          );
          let match;
          while ((match = regex.exec(html)) !== null) {
            elements.push(match[0]);
          }
        }
      }
      // Handle ID selectors
      else if (selector.startsWith('#dimension-')) {
        const dimCode = selector.replace('#dimension-', '');
        // Look for section with id="dimension-XXX"
        const idRegex = new RegExp(
          `<([a-z][a-z0-9]*)\\s+[^>]*id\\s*=\\s*["']dimension-${dimCode}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi'
        );
        let match;
        while ((match = idRegex.exec(html)) !== null) {
          elements.push(match[0]);
        }
        // Also try without the dimension- prefix
        const directIdRegex = new RegExp(
          `<([a-z][a-z0-9]*)\\s+[^>]*id\\s*=\\s*["']${dimCode}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi'
        );
        while ((match = directIdRegex.exec(html)) !== null) {
          elements.push(match[0]);
        }
      }
      // Handle class selectors
      else if (selector.startsWith('.')) {
        const className = selector.substring(1).split('[')[0]; // Handle .class[attr] patterns
        const classRegex = new RegExp(
          `<([a-z][a-z0-9]*)\\s+[^>]*class\\s*=\\s*["'][^"']*\\b${this.escapeRegex(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi'
        );
        let match;
        while ((match = classRegex.exec(html)) !== null) {
          elements.push(match[0]);
        }
      }
    }

    return elements;
  }

  /**
   * Extract nested content from an element.
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
   * Extract dimension code from selector pattern.
   */
  private extractDimensionCode(selector: string): string | undefined {
    // Check for data-dimension attribute
    const dimAttrMatch = selector.match(/data-dimension=["']?(\w+)["']?/);
    if (dimAttrMatch) {
      return dimAttrMatch[1];
    }

    // Check for #dimension-XXX pattern
    const idMatch = selector.match(/#dimension-(\w+)/);
    if (idMatch) {
      return idMatch[1];
    }

    return undefined;
  }

  /**
   * Infer dimension code from element content.
   */
  private inferDimensionCode(html: string, sourceFile: IntermediateFileType): string | undefined {
    const chapterCode = getChapterForDeepDive(sourceFile);
    if (!chapterCode) return undefined;

    const dimensions = CHAPTER_DIMENSIONS[chapterCode] || [];

    for (const dim of dimensions) {
      const dimName = this.getDimensionName(dim);
      if (html.toLowerCase().includes(dimName.toLowerCase())) {
        return dim;
      }
    }

    return undefined;
  }

  /**
   * Get dimension name from code.
   */
  private getDimensionName(code: string): string {
    const names: Record<string, string> = {
      STR: 'Strategy',
      SAL: 'Sales',
      MKT: 'Marketing',
      CXP: 'Customer Experience',
      OPS: 'Operations',
      FIN: 'Financials',
      HRS: 'Human Resources',
      LDG: 'Leadership & Governance',
      TIN: 'Technology & Innovation',
      IDS: 'IT & Data Security',
      RMS: 'Risk Management',
      CMP: 'Compliance'
    };
    return names[code] || code;
  }

  /**
   * Get manager reports for a chapter.
   */
  private getManagersForChapter(chapterCode: string): ClientDeliverableType[] {
    const dimensions = CHAPTER_DIMENSIONS[chapterCode] || [];
    const managers = new Set<ClientDeliverableType>();

    for (const dim of dimensions) {
      const manager = DIMENSION_TO_MANAGER[dim];
      if (manager) {
        managers.add(manager);
      }
    }

    return Array.from(managers);
  }

  /**
   * Calculate confidence score.
   */
  private calculateConfidence(title: string, content: string, fullElement: string): number {
    let score = 0.5;

    if (title && title.length > 3) {
      score += 0.15;
    }

    const wordCount = this.countWords(this.extractTextContent(content));
    if (wordCount > 20) score += 0.1;
    if (wordCount > 100) score += 0.1;

    // Has dimension-specific content
    if (fullElement.includes('data-dimension') || fullElement.includes('dimension-')) {
      score += 0.1;
    }

    // Has findings or recommendations
    if (/finding|recommendation|insight|strength|gap|risk|opportunity/i.test(fullElement)) {
      score += 0.05;
    }

    return Math.min(1, score);
  }

  /**
   * Extract visualization data from element.
   */
  private extractVisualizationData(html: string): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Extract all data attributes
    const dataAttrRegex = /data-([a-z-]+)=["']([^"']+)["']/gi;
    let match;
    while ((match = dataAttrRegex.exec(html)) !== null) {
      const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      data[key] = match[2];
    }

    // Extract score if present
    const scoreMatch = html.match(/data-score=["']?(\d+)["']?/i);
    if (scoreMatch) {
      data.score = parseInt(scoreMatch[1]);
    }

    // Extract band if present
    const bandMatch = html.match(/data-band=["']?(\w+)["']?/i);
    if (bandMatch) {
      data.band = bandMatch[1];
    }

    return data;
  }

  /**
   * Escape special regex characters.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
