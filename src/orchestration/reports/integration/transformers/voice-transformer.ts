/**
 * Voice Transformer - Transforms content voice for target audiences.
 *
 * Voice Profiles:
 * - owner: Direct, action-oriented, ROI-focused
 * - executive: Strategic, concise, decision-focused
 * - manager: Operational, detailed, KPI-focused
 * - employee: Celebratory, accessible, motivational
 */

import type { ContentItem, VoiceProfile } from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('VoiceTransformer');

/**
 * Voice transformation patterns and rules.
 */
const VOICE_PATTERNS: Record<VoiceProfile, VoiceTransformationRules> = {
  owner: {
    replacements: [
      { from: /the organization/gi, to: 'your business' },
      { from: /the company/gi, to: 'your company' },
      { from: /stakeholders/gi, to: 'you and your team' },
      { from: /is recommended/gi, to: 'you should' },
      { from: /should be implemented/gi, to: 'you should implement' },
      { from: /it is advised/gi, to: 'we advise you' },
      { from: /analysis indicates/gi, to: 'the numbers show' },
      { from: /strategic initiative/gi, to: 'key action' }
    ],
    emphasisWords: ['ROI', 'profit', 'revenue', 'growth', 'savings', 'return', 'investment'],
    tone: 'direct',
    actionPrefix: 'Action: ',
    callToAction: true
  },
  executive: {
    replacements: [
      { from: /in order to/gi, to: 'to' },
      { from: /it should be noted that/gi, to: '' },
      { from: /the fact that/gi, to: '' },
      { from: /for the purpose of/gi, to: 'for' },
      { from: /with regards to/gi, to: 'regarding' },
      { from: /at this point in time/gi, to: 'now' },
      { from: /in the event that/gi, to: 'if' }
    ],
    emphasisWords: ['strategic', 'key', 'critical', 'priority', 'impact', 'decision'],
    tone: 'strategic',
    actionPrefix: '',
    callToAction: false
  },
  manager: {
    replacements: [
      { from: /the organization/gi, to: 'the department' },
      { from: /strategic initiative/gi, to: 'operational priority' },
      { from: /high-level/gi, to: 'detailed' },
      { from: /overview/gi, to: 'breakdown' },
      { from: /consider/gi, to: 'evaluate' }
    ],
    emphasisWords: ['KPI', 'metric', 'target', 'benchmark', 'performance', 'deadline', 'milestone'],
    tone: 'operational',
    actionPrefix: 'Task: ',
    callToAction: true
  },
  employee: {
    replacements: [
      { from: /the organization/gi, to: 'our company' },
      { from: /stakeholders/gi, to: 'everyone' },
      { from: /strategic initiative/gi, to: 'exciting project' },
      { from: /is required to/gi, to: 'will' },
      { from: /must/gi, to: 'will' },
      { from: /critical/gi, to: 'important' },
      { from: /urgent/gi, to: 'timely' }
    ],
    emphasisWords: ['together', 'team', 'success', 'achievement', 'celebration', 'progress'],
    tone: 'celebratory',
    actionPrefix: '',
    callToAction: false
  }
};

interface VoiceTransformationRules {
  replacements: Array<{ from: RegExp; to: string }>;
  emphasisWords: string[];
  tone: string;
  actionPrefix: string;
  callToAction: boolean;
}

/**
 * Transforms content voice for different target audiences.
 */
export class VoiceTransformer {
  /**
   * Transform an array of content items from source voice to target voice.
   */
  public transform(
    items: ContentItem[],
    sourceVoice: VoiceProfile,
    targetVoice: VoiceProfile
  ): string {
    if (sourceVoice === targetVoice) {
      // No transformation needed - return concatenated content
      return items.map(item => item.content).join('\n');
    }

    const transformedItems = items.map(item =>
      this.transformItem(item, sourceVoice, targetVoice)
    );

    return transformedItems.join('\n');
  }

  /**
   * Transform a single content item.
   */
  public transformItem(
    item: ContentItem,
    sourceVoice: VoiceProfile,
    targetVoice: VoiceProfile
  ): string {
    let content = item.content;

    // Apply target voice replacements
    const targetRules = VOICE_PATTERNS[targetVoice];
    for (const { from, to } of targetRules.replacements) {
      content = content.replace(from, to);
    }

    // Remove source voice patterns that don't apply to target
    const sourceRules = VOICE_PATTERNS[sourceVoice];
    if (sourceVoice !== targetVoice) {
      content = this.neutralizeSourcePatterns(content, sourceRules, targetRules);
    }

    // Apply tone adjustments
    content = this.applyToneAdjustments(content, targetVoice);

    // Add emphasis to important words
    content = this.applyEmphasis(content, targetRules.emphasisWords);

    // Add action prefix if configured
    if (targetRules.actionPrefix && this.isActionableContent(item)) {
      content = this.addActionPrefix(content, targetRules.actionPrefix);
    }

    // Add call to action if configured
    if (targetRules.callToAction && item.contentType === 'recommendation') {
      content = this.addCallToAction(content, targetVoice);
    }

    return content;
  }

  /**
   * Transform plain text content (for non-HTML use cases).
   */
  public transformText(
    text: string,
    sourceVoice: VoiceProfile,
    targetVoice: VoiceProfile
  ): string {
    if (sourceVoice === targetVoice) {
      return text;
    }

    let content = text;
    const targetRules = VOICE_PATTERNS[targetVoice];

    // Apply replacements
    for (const { from, to } of targetRules.replacements) {
      content = content.replace(from, to);
    }

    // Apply tone adjustments
    content = this.applyToneAdjustments(content, targetVoice);

    return content;
  }

  /**
   * Neutralize patterns specific to source voice.
   */
  private neutralizeSourcePatterns(
    content: string,
    sourceRules: VoiceTransformationRules,
    targetRules: VoiceTransformationRules
  ): string {
    // Remove emphasis patterns that are source-specific
    const sourceEmphasis = sourceRules.emphasisWords.filter(
      word => !targetRules.emphasisWords.includes(word)
    );

    for (const word of sourceEmphasis) {
      // Remove strong/bold emphasis from source-specific words
      const strongRegex = new RegExp(`<strong>\\s*(${word})\\s*<\\/strong>`, 'gi');
      content = content.replace(strongRegex, '$1');

      const boldRegex = new RegExp(`<b>\\s*(${word})\\s*<\\/b>`, 'gi');
      content = content.replace(boldRegex, '$1');
    }

    return content;
  }

  /**
   * Apply tone-specific adjustments.
   */
  private applyToneAdjustments(content: string, targetVoice: VoiceProfile): string {
    switch (targetVoice) {
      case 'owner':
        // Make language more direct and action-oriented
        content = content.replace(/We recommend that/gi, 'You should');
        content = content.replace(/It would be beneficial to/gi, 'You can benefit by');
        content = content.replace(/There is an opportunity to/gi, 'You can');
        break;

      case 'executive':
        // Make language more concise and strategic
        content = content.replace(/In conclusion,?\s*/gi, '');
        content = content.replace(/To summarize,?\s*/gi, '');
        content = content.replace(/As mentioned (earlier|above|before),?\s*/gi, '');
        content = content.replace(/It is important to note that\s*/gi, '');
        break;

      case 'manager':
        // Make language more operational and metric-focused
        content = content.replace(/strategic goal/gi, 'target');
        content = content.replace(/business objective/gi, 'KPI');
        content = content.replace(/key performance/gi, 'performance');
        break;

      case 'employee':
        // Make language more inclusive and positive
        content = content.replace(/you must/gi, "let's");
        content = content.replace(/failure to/gi, 'opportunity for');
        content = content.replace(/problem/gi, 'challenge');
        content = content.replace(/weakness/gi, 'growth area');
        break;
    }

    return content;
  }

  /**
   * Apply emphasis to important words.
   */
  private applyEmphasis(content: string, emphasisWords: string[]): string {
    // Only emphasize in HTML content, not already emphasized
    for (const word of emphasisWords) {
      // Check if word exists and is not already emphasized
      const regex = new RegExp(
        `(?<![<>a-zA-Z])\\b(${word})\\b(?![<>a-zA-Z])`,
        'gi'
      );

      // Only emphasize first occurrence of each word
      let found = false;
      content = content.replace(regex, (match) => {
        if (!found) {
          found = true;
          return `<strong>${match}</strong>`;
        }
        return match;
      });
    }

    return content;
  }

  /**
   * Check if content is actionable (should have action prefix).
   */
  private isActionableContent(item: ContentItem): boolean {
    return ['quick_win', 'recommendation', 'risk'].includes(item.contentType);
  }

  /**
   * Add action prefix to content.
   */
  private addActionPrefix(content: string, prefix: string): string {
    // Only add prefix if content doesn't already start with similar prefix
    if (/^(Action:|Task:|Step:|To-do:)/i.test(content.trim())) {
      return content;
    }

    // Find first paragraph or div to add prefix
    const firstParagraphMatch = content.match(/^(\s*<p[^>]*>)([^<]*)/);
    if (firstParagraphMatch) {
      return content.replace(
        firstParagraphMatch[0],
        `${firstParagraphMatch[1]}<strong>${prefix}</strong>${firstParagraphMatch[2]}`
      );
    }

    return `<strong>${prefix}</strong>${content}`;
  }

  /**
   * Add call to action based on voice profile.
   */
  private addCallToAction(content: string, targetVoice: VoiceProfile): string {
    const ctas: Record<VoiceProfile, string> = {
      owner: '<p class="cta"><strong>Next Step:</strong> Review this recommendation and schedule implementation.</p>',
      executive: '',
      manager: '<p class="cta"><strong>Follow-up:</strong> Add to your operational dashboard for tracking.</p>',
      employee: ''
    };

    const cta = ctas[targetVoice];
    if (!cta) {
      return content;
    }

    // Append CTA after last closing tag
    const lastTagMatch = content.match(/<\/[a-z]+>\s*$/i);
    if (lastTagMatch) {
      return content.replace(lastTagMatch[0], `${lastTagMatch[0]}${cta}`);
    }

    return `${content}${cta}`;
  }

  /**
   * Get the transformation rules for a voice profile.
   */
  public getRules(voice: VoiceProfile): VoiceTransformationRules {
    return VOICE_PATTERNS[voice];
  }
}
