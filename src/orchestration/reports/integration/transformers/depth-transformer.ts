/**
 * Depth Transformer - Adjusts content depth for target sections.
 *
 * Depth Levels:
 * - headline: Single sentence/metric (max 15 words)
 * - summary: 2-3 sentences, key points (max 50 words)
 * - standard: Full section, moderate detail (max 150 words)
 * - detailed: Comprehensive with all supporting data (no limit)
 */

import type { DepthLevel } from '../types/content.types.js';
import { getWordLimitForDepth } from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('DepthTransformer');

/**
 * Depth transformation configuration.
 */
interface DepthConfig {
  maxWords: number;
  maxSentences: number;
  preserveStructure: boolean;
  includeVisuals: boolean;
  includeDetails: boolean;
}

const DEPTH_CONFIGS: Record<DepthLevel, DepthConfig> = {
  headline: {
    maxWords: 15,
    maxSentences: 1,
    preserveStructure: false,
    includeVisuals: false,
    includeDetails: false
  },
  summary: {
    maxWords: 50,
    maxSentences: 3,
    preserveStructure: false,
    includeVisuals: false,
    includeDetails: false
  },
  standard: {
    maxWords: 150,
    maxSentences: 10,
    preserveStructure: true,
    includeVisuals: true,
    includeDetails: false
  },
  detailed: {
    maxWords: Number.MAX_SAFE_INTEGER,
    maxSentences: Number.MAX_SAFE_INTEGER,
    preserveStructure: true,
    includeVisuals: true,
    includeDetails: true
  }
};

/**
 * Transforms content depth for different section requirements.
 */
export class DepthTransformer {
  /**
   * Transform content to target depth level.
   */
  public transform(
    content: string,
    targetDepth: DepthLevel,
    maxWords?: number
  ): string {
    const config = DEPTH_CONFIGS[targetDepth];
    const wordLimit = maxWords ?? config.maxWords;

    // Extract plain text for analysis
    const plainText = this.extractPlainText(content);
    const currentWordCount = this.countWords(plainText);

    // If already under limit, minimal transformation
    if (currentWordCount <= wordLimit) {
      return this.applyDepthFormatting(content, targetDepth, config);
    }

    // Apply condensation based on depth level
    let transformed: string;

    switch (targetDepth) {
      case 'headline':
        transformed = this.condenseToHeadline(content, wordLimit);
        break;
      case 'summary':
        transformed = this.condenseToSummary(content, wordLimit, config.maxSentences);
        break;
      case 'standard':
        transformed = this.condenseToStandard(content, wordLimit, config);
        break;
      case 'detailed':
      default:
        transformed = content;
        break;
    }

    return this.applyDepthFormatting(transformed, targetDepth, config);
  }

  /**
   * Condense content to headline format.
   */
  private condenseToHeadline(content: string, maxWords: number): string {
    const plainText = this.extractPlainText(content);

    // Try to extract a title or first strong/bold element
    const titleMatch = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    if (titleMatch) {
      return this.truncateToWords(titleMatch[1].trim(), maxWords);
    }

    const strongMatch = content.match(/<strong>([^<]+)<\/strong>/i);
    if (strongMatch) {
      return this.truncateToWords(strongMatch[1].trim(), maxWords);
    }

    // Get first sentence
    const firstSentence = this.extractFirstSentence(plainText);
    return this.truncateToWords(firstSentence, maxWords);
  }

  /**
   * Condense content to summary format.
   */
  private condenseToSummary(
    content: string,
    maxWords: number,
    maxSentences: number
  ): string {
    const plainText = this.extractPlainText(content);

    // Extract key sentences
    const sentences = this.extractSentences(plainText);
    const selectedSentences: string[] = [];
    let currentWordCount = 0;

    // Score sentences by importance
    const scoredSentences = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentenceImportance(sentence, index, sentences.length)
    })).sort((a, b) => b.score - a.score);

    // Select top sentences within limits
    for (const { sentence } of scoredSentences) {
      const sentenceWords = this.countWords(sentence);
      if (
        selectedSentences.length < maxSentences &&
        currentWordCount + sentenceWords <= maxWords
      ) {
        selectedSentences.push(sentence);
        currentWordCount += sentenceWords;
      }
    }

    // Re-order by original position
    const orderedSentences = selectedSentences.sort((a, b) => {
      return sentences.indexOf(a) - sentences.indexOf(b);
    });

    return `<p>${orderedSentences.join(' ')}</p>`;
  }

  /**
   * Condense content to standard format.
   */
  private condenseToStandard(
    content: string,
    maxWords: number,
    config: DepthConfig
  ): string {
    // If preserving structure, try to keep key elements
    if (config.preserveStructure) {
      return this.condensePreservingStructure(content, maxWords);
    }

    const plainText = this.extractPlainText(content);
    const sentences = this.extractSentences(plainText);

    // Keep approximately 60% of content, prioritizing important sentences
    const targetSentences = Math.ceil(sentences.length * 0.6);
    const selectedSentences: string[] = [];
    let currentWordCount = 0;

    const scoredSentences = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentenceImportance(sentence, index, sentences.length),
      index
    })).sort((a, b) => b.score - a.score);

    for (const { sentence, index } of scoredSentences) {
      const sentenceWords = this.countWords(sentence);
      if (
        selectedSentences.length < targetSentences &&
        currentWordCount + sentenceWords <= maxWords
      ) {
        selectedSentences.push(sentence);
        currentWordCount += sentenceWords;
      }
    }

    // Re-order by original position
    const orderedSentences = selectedSentences.sort((a, b) => {
      const aIndex = scoredSentences.find(s => s.sentence === a)?.index ?? 0;
      const bIndex = scoredSentences.find(s => s.sentence === b)?.index ?? 0;
      return aIndex - bIndex;
    });

    // Rebuild with paragraph structure
    return this.rebuildParagraphs(orderedSentences);
  }

  /**
   * Condense while preserving HTML structure.
   */
  private condensePreservingStructure(content: string, maxWords: number): string {
    // Parse structure
    const elements = this.parseHtmlElements(content);
    let currentWordCount = 0;
    const preservedElements: string[] = [];

    // Priority order for elements
    const priorityOrder = ['h1', 'h2', 'h3', 'h4', 'strong', 'b', 'li', 'p'];

    // Sort elements by priority
    const sortedElements = elements.sort((a, b) => {
      const aTag = a.match(/<([a-z]+)/i)?.[1]?.toLowerCase() || 'p';
      const bTag = b.match(/<([a-z]+)/i)?.[1]?.toLowerCase() || 'p';
      return priorityOrder.indexOf(aTag) - priorityOrder.indexOf(bTag);
    });

    for (const element of sortedElements) {
      const elementText = this.extractPlainText(element);
      const elementWords = this.countWords(elementText);

      if (currentWordCount + elementWords <= maxWords) {
        preservedElements.push(element);
        currentWordCount += elementWords;
      } else if (currentWordCount < maxWords) {
        // Truncate last element
        const remainingWords = maxWords - currentWordCount;
        const truncated = this.truncateElement(element, remainingWords);
        preservedElements.push(truncated);
        break;
      }
    }

    return preservedElements.join('\n');
  }

  /**
   * Apply depth-specific formatting.
   */
  private applyDepthFormatting(
    content: string,
    depth: DepthLevel,
    config: DepthConfig
  ): string {
    let formatted = content;

    // Remove visuals if not included
    if (!config.includeVisuals) {
      formatted = formatted.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
      formatted = formatted.replace(/<img[^>]*>/gi, '');
      formatted = formatted.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
      formatted = formatted.replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '');
    }

    // Remove detailed elements if not included
    if (!config.includeDetails) {
      formatted = formatted.replace(/<details[^>]*>[\s\S]*?<\/details>/gi, '');
      formatted = formatted.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
      formatted = formatted.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Add wrapper class for styling
    formatted = `<div class="depth-${depth}">${formatted}</div>`;

    return formatted;
  }

  /**
   * Extract plain text from HTML.
   */
  private extractPlainText(html: string): string {
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
   * Count words in text.
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract sentences from text.
   */
  private extractSentences(text: string): string[] {
    // Split on sentence boundaries
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    return sentences.filter(s => s.trim().length > 0);
  }

  /**
   * Extract first sentence from text.
   */
  private extractFirstSentence(text: string): string {
    const match = text.match(/^[^.!?]*[.!?]/);
    return match ? match[0].trim() : text.split(' ').slice(0, 15).join(' ');
  }

  /**
   * Score sentence importance.
   */
  private scoreSentenceImportance(
    sentence: string,
    index: number,
    totalSentences: number
  ): number {
    let score = 0;

    // Position bonus (first and last sentences are often important)
    if (index === 0) score += 3;
    if (index === totalSentences - 1) score += 1;

    // Length penalty (very short or very long sentences less important)
    const wordCount = this.countWords(sentence);
    if (wordCount >= 10 && wordCount <= 25) score += 2;
    if (wordCount < 5) score -= 1;
    if (wordCount > 40) score -= 1;

    // Key indicators
    const importancePatterns = [
      /\b(critical|important|key|essential|priority|significant)\b/i,
      /\b(must|should|recommend|require)\b/i,
      /\b(\d+%|\$[\d,]+|ROI|revenue|profit)\b/i,
      /\b(risk|opportunity|strength|gap)\b/i
    ];

    for (const pattern of importancePatterns) {
      if (pattern.test(sentence)) score += 1;
    }

    return score;
  }

  /**
   * Truncate text to word limit.
   */
  private truncateToWords(text: string, maxWords: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) {
      return text;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  /**
   * Truncate HTML element to word limit.
   */
  private truncateElement(element: string, maxWords: number): string {
    const tagMatch = element.match(/^<([a-z]+)([^>]*)>/i);
    if (!tagMatch) {
      return this.truncateToWords(element, maxWords);
    }

    const tag = tagMatch[1];
    const attrs = tagMatch[2];
    const content = element.replace(tagMatch[0], '').replace(new RegExp(`</${tag}>$`, 'i'), '');

    const truncatedContent = this.truncateToWords(this.extractPlainText(content), maxWords);
    return `<${tag}${attrs}>${truncatedContent}</${tag}>`;
  }

  /**
   * Rebuild paragraphs from sentences.
   */
  private rebuildParagraphs(sentences: string[]): string {
    if (sentences.length === 0) return '';

    // Group into paragraphs of 3-4 sentences
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      const group = sentences.slice(i, i + 3);
      paragraphs.push(`<p>${group.join(' ')}</p>`);
    }

    return paragraphs.join('\n');
  }

  /**
   * Parse HTML into elements.
   */
  private parseHtmlElements(html: string): string[] {
    const elements: string[] = [];
    const regex = /<([a-z][a-z0-9]*)[^>]*>[\s\S]*?<\/\1>|<[a-z][a-z0-9]*[^>]*\/>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      elements.push(match[0]);
    }

    return elements;
  }
}
