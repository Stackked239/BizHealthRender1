/**
 * Snapshot Normalizer
 *
 * Strips dynamic content from HTML to enable stable snapshot comparisons.
 * Preserves structure and class names while removing variable text.
 */

import { JSDOM } from 'jsdom';

export interface NormalizationOptions {
  stripTextContent?: boolean;      // Replace text with placeholder
  stripDynamicValues?: boolean;    // Replace numbers, dates, etc.
  preserveClassNames?: boolean;    // Keep all class names
  preserveIds?: boolean;           // Keep all IDs
  stripComments?: boolean;         // Remove HTML comments
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  stripTextContent: true,
  stripDynamicValues: true,
  preserveClassNames: true,
  preserveIds: true,
  stripComments: true,
};

/**
 * Normalize HTML for snapshot comparison
 */
export function normalizeForSnapshot(
  html: string,
  options: NormalizationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove comments
  if (opts.stripComments) {
    const walker = document.createTreeWalker(
      document.body,
      128, // NodeFilter.SHOW_COMMENT
      null
    );
    const comments: Comment[] = [];
    while (walker.nextNode()) {
      comments.push(walker.currentNode as Comment);
    }
    comments.forEach(c => c.remove());
  }

  // Process text nodes
  if (opts.stripTextContent) {
    const walker = document.createTreeWalker(
      document.body,
      4, // NodeFilter.SHOW_TEXT
      null
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    textNodes.forEach(node => {
      const text = node.textContent?.trim() || '';
      if (text) {
        // Keep short text (likely labels), replace long text
        if (text.length > 50) {
          node.textContent = '[CONTENT]';
        } else if (opts.stripDynamicValues) {
          // Replace numbers and dates
          node.textContent = text
            .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '[DATE]')
            .replace(/\d+(\.\d+)?%/g, '[PERCENT]')
            .replace(/\$[\d,]+(\.\d{2})?/g, '[CURRENCY]')
            .replace(/\b\d{2,}\b/g, '[NUMBER]');
        }
      }
    });
  }

  // Remove style content (CSS) but keep structure
  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    style.textContent = '[CSS STYLES]';
  });

  // Remove script content but keep structure
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    script.textContent = '[SCRIPT]';
  });

  // Serialize back to HTML
  let normalized = dom.serialize();

  // Normalize whitespace
  normalized = normalized
    .replace(/>\s+</g, '><')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return normalized;
}

/**
 * Extract structural skeleton only (tags and classes, no content)
 */
export function extractStructuralSkeleton(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  function serializeElement(el: Element, indent: string = ''): string {
    const tag = el.tagName.toLowerCase();
    const classes = el.className ? `.${el.className.toString().split(' ').join('.')}` : '';
    const id = el.id ? `#${el.id}` : '';

    const children = Array.from(el.children)
      .map(child => serializeElement(child, indent + '  '))
      .join('\n');

    if (children) {
      return `${indent}<${tag}${id}${classes}>\n${children}\n${indent}</${tag}>`;
    } else {
      return `${indent}<${tag}${id}${classes}/>`;
    }
  }

  return serializeElement(document.body);
}
