/**
 * BizHealth Enhanced Markdown Parser
 *
 * Converts AI-generated Markdown to styled HTML with BizHealth brand classes.
 * Includes normalization features to reduce excessive formatting (bold, lists, dividers)
 * that can occur in AI-generated content.
 *
 * Features:
 * - Custom BizHealth renderer with brand styling
 * - Bold/emphasis normalization (max per paragraph)
 * - List consolidation for long lists
 * - Section divider reduction
 * - Validation for leftover Markdown artifacts
 *
 * @module markdown-parser
 * @since 2025-12-06
 */

import { Marked, Renderer, type Tokens } from 'marked';
import { convertCodeBlocksToVisualizations } from './code-block-converter.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ParseOptions {
  /** Maximum bold elements per paragraph (default: 3) */
  maxBoldPerParagraph?: number;
  /** Maximum list items before consolidation (default: 8) */
  maxListItems?: number;
  /** Maximum dividers per 500 words (default: 3) */
  maxDividersPerSection?: number;
  /** Context for parsing (dimension/chapter specific) */
  context?: {
    dimension?: string;
    chapter?: string;
  };
}

export interface ValidationResult {
  /** Whether the HTML is free of Markdown artifacts */
  isValid: boolean;
  /** List of detected Markdown artifacts */
  artifacts: string[];
  /** Warnings about formatting density */
  warnings: string[];
}

export interface ParseResult {
  /** The parsed and normalized HTML */
  html: string;
  /** Validation results */
  validation: ValidationResult;
  /** Processing metrics */
  metrics: {
    processingTimeMs: number;
    originalLength: number;
    outputLength: number;
    boldCount: number;
    dividerCount: number;
    listCount: number;
  };
}

// ============================================================================
// HTML ESCAPE UTILITY
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// BIZHEALTH CUSTOM RENDERER
// ============================================================================

/**
 * Create BizHealth custom renderer with brand styling
 * Applies semantic HTML with BizHealth CSS classes
 */
function createBizHealthRenderer(): Renderer {
  const renderer = new Renderer();

  // Headers with semantic hierarchy
  renderer.heading = function(token: Tokens.Heading): string {
    const text = this.parser.parseInline(token.tokens);
    const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    const levelClass = token.depth <= 2 ? 'bh-section-heading' : 'bh-subsection-heading';
    return `<h${token.depth} class="${levelClass} bh-h${token.depth}" id="${id}">${text}</h${token.depth}>\n`;
  };

  // Tables with responsive wrapper
  renderer.table = function(token: Tokens.Table): string {
    let header = '';
    let body = '';

    // Build header
    let headerRow = '';
    for (const cell of token.header) {
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      headerRow += `<th class="bh-th"${align}>${this.parser.parseInline(cell.tokens)}</th>`;
    }
    header = `<tr class="bh-tr">${headerRow}</tr>`;

    // Build body
    for (const row of token.rows) {
      let rowHtml = '';
      for (const cell of row) {
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        rowHtml += `<td class="bh-td"${align}>${this.parser.parseInline(cell.tokens)}</td>`;
      }
      body += `<tr class="bh-tr">${rowHtml}</tr>`;
    }

    return `
      <div class="table-responsive">
        <table class="bh-table">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  };

  // Paragraphs with proper spacing
  renderer.paragraph = function(token: Tokens.Paragraph): string {
    return `<p class="bh-paragraph">${this.parser.parseInline(token.tokens)}</p>\n`;
  };

  // Strong text (bold) with emphasis class
  renderer.strong = function(token: Tokens.Strong): string {
    return `<strong class="bh-emphasis">${this.parser.parseInline(token.tokens)}</strong>`;
  };

  // Emphasis text (italic)
  renderer.em = function(token: Tokens.Em): string {
    return `<em class="bh-em">${this.parser.parseInline(token.tokens)}</em>`;
  };

  // Lists with proper styling
  renderer.list = function(token: Tokens.List): string {
    const tag = token.ordered ? 'ol' : 'ul';
    const className = token.ordered ? 'bh-list bh-list-ordered' : 'bh-list bh-list-unordered';
    let body = '';
    for (const item of token.items) {
      body += this.listitem(item);
    }
    return `<${tag} class="${className}">${body}</${tag}>\n`;
  };

  // List items with proper class
  renderer.listitem = function(item: Tokens.ListItem): string {
    const itemBody = this.parser.parse(item.tokens);
    return `<li class="bh-list-item">${itemBody}</li>`;
  };

  // Horizontal rules as section dividers
  renderer.hr = function(_token: Tokens.Hr): string {
    return '<hr class="bh-section-divider">\n';
  };

  // Code blocks - detect ASCII art vs regular code
  renderer.code = function(token: Tokens.Code): string {
    const code = token.text;
    // Detect ASCII art characters (box drawing, Unicode blocks, etc.)
    const isAsciiArt = /[═║╔╗╚╝┌┐└┘│─▓░█▲▼◄►●○■□╬╠╣╦╩┬┴├┤┼╭╮╯╰]/.test(code);

    if (isAsciiArt) {
      // STRIP ASCII art completely - should be rendered as proper SVG
      return '';
    }

    const lang = token.lang ? ` class="bh-code language-${token.lang}"` : ' class="bh-code"';
    return `<pre class="bh-code-block"><code${lang}>${escapeHtml(code)}</code></pre>\n`;
  };

  // Inline code
  renderer.codespan = function(token: Tokens.Codespan): string {
    return `<code class="bh-inline-code">${escapeHtml(token.text)}</code>`;
  };

  // Blockquotes for callouts
  renderer.blockquote = function(token: Tokens.Blockquote): string {
    const content = this.parser.parse(token.tokens);
    return `<blockquote class="bh-callout">${content}</blockquote>\n`;
  };

  // Links with proper styling
  renderer.link = function(token: Tokens.Link): string {
    const text = this.parser.parseInline(token.tokens);
    const href = token.href || '';
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<a class="bh-link" href="${escapeHtml(href)}"${title}>${text}</a>`;
  };

  return renderer;
}

// ============================================================================
// POST-PROCESSING FUNCTIONS
// ============================================================================

/**
 * Reduce excessive bold emphasis - keep only most important per paragraph
 */
function normalizeEmphasis(html: string, maxPerParagraph: number): string {
  return html.replace(
    /(<p[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (match, openTag: string, content: string, closeTag: string) => {
      let boldCount = 0;
      const normalized = content.replace(
        /<strong[^>]*>([\s\S]*?)<\/strong>/gi,
        (boldMatch: string, boldContent: string) => {
          boldCount++;
          // Keep first N bold elements, remove emphasis from rest
          if (boldCount <= maxPerParagraph) {
            return boldMatch;
          }
          return boldContent; // Remove <strong> wrapper
        }
      );
      return openTag + normalized + closeTag;
    }
  );
}

/**
 * Consolidate long lists into summary + details pattern
 */
function consolidateLongLists(html: string, maxItems: number): string {
  return html.replace(
    /<(ul|ol)[^>]*class="bh-list[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi,
    (match: string, tag: string, content: string) => {
      const items = content.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];

      if (items.length <= maxItems) {
        return match; // Keep as-is
      }

      // Show first N items, collapse rest
      const visibleItems = items.slice(0, maxItems).join('');
      const hiddenCount = items.length - maxItems;

      return `
        <${tag} class="bh-list bh-list-consolidated">
          ${visibleItems}
          <li class="bh-list-item bh-list-more">
            <em>...and ${hiddenCount} additional items</em>
          </li>
        </${tag}>
      `;
    }
  );
}

/**
 * Reduce excessive section dividers (max N per section)
 */
function reduceExcessiveDividers(html: string, maxDividersPerSection: number): string {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
  const maxDividers = Math.max(maxDividersPerSection, Math.floor(words / 500));

  let dividerCount = 0;
  return html.replace(/<hr[^>]*class="bh-section-divider"[^>]*\/?>/gi, (match) => {
    dividerCount++;
    if (dividerCount > maxDividers) {
      return ''; // Remove excess dividers
    }
    return match;
  });
}

/**
 * Count specific elements in HTML
 */
function countElements(html: string): { bold: number; dividers: number; lists: number } {
  const bold = (html.match(/<strong/gi) || []).length;
  const dividers = (html.match(/bh-section-divider/gi) || []).length;
  const lists = (html.match(/<(ul|ol)[^>]*class="bh-list/gi) || []).length;
  return { bold, dividers, lists };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation: Check for leftover Markdown artifacts
 */
export function validateParsedHTML(html: string): ValidationResult {
  const artifacts: string[] = [];
  const warnings: string[] = [];

  // Check for raw Markdown patterns that shouldn't appear in output
  const patterns = [
    { regex: /\*\*[^*]+\*\*/g, name: 'Bold markdown (**)' },
    { regex: /\|[\s]*:?-+:?[\s]*\|/g, name: 'Table delimiter row (|---|)' },
    { regex: /^#{1,6}\s/gm, name: 'Header markdown (#)' },
    { regex: /```[\s\S]*?```/g, name: 'Code fences (```)' },
    { regex: /\[([^\]]+)\]\([^)]+\)/g, name: 'Link markdown []()' },
  ];

  for (const { regex, name } of patterns) {
    const matches = html.match(regex);
    if (matches && matches.length > 0) {
      artifacts.push(`${name}: ${matches.length} instances`);
    }
    regex.lastIndex = 0; // Reset regex state
  }

  // Check for excessive elements
  const counts = countElements(html);

  if (counts.bold > 200) {
    warnings.push(`High bold count: ${counts.bold} (target: <200)`);
  }

  if (counts.dividers > 30) {
    warnings.push(`High divider count: ${counts.dividers} (target: <30)`);
  }

  return {
    isValid: artifacts.length === 0,
    artifacts,
    warnings
  };
}

// ============================================================================
// MAIN PARSER
// ============================================================================

// Create configured marked instance
function createConfiguredMarked(): Marked {
  const configuredMarked = new Marked();
  const bizHealthRenderer = createBizHealthRenderer();

  configuredMarked.use({
    renderer: bizHealthRenderer,
    gfm: true,        // GitHub Flavored Markdown
    breaks: true,     // Convert single line breaks to <br>
  });

  return configuredMarked;
}

// Singleton instance
const bhMarked = createConfiguredMarked();

/**
 * Parse Markdown to BizHealth-styled HTML with normalization
 *
 * @param markdown - Raw markdown string from AI output
 * @param options - Parsing and normalization options
 * @returns Styled HTML string with excessive formatting normalized
 */
export function parseMarkdownToHTML(
  markdown: string,
  options?: ParseOptions
): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  const opts = {
    maxBoldPerParagraph: options?.maxBoldPerParagraph ?? 3,
    maxListItems: options?.maxListItems ?? 8,
    maxDividersPerSection: options?.maxDividersPerSection ?? 3,
    ...options
  };

  try {
    // Normalize line endings
    const normalized = markdown.replace(/\r\n/g, '\n');

    // Parse markdown to HTML
    let html = bhMarked.parse(normalized) as string;

    // Post-processing: Normalize excessive formatting
    html = normalizeEmphasis(html, opts.maxBoldPerParagraph);
    html = consolidateLongLists(html, opts.maxListItems);
    html = reduceExcessiveDividers(html, opts.maxDividersPerSection);

    // Final cleanup for any escaped markdown (safety net)
    html = cleanupRemainingMarkdown(html);

    // Convert code blocks containing metrics to proper visualizations
    // This transforms patterns like Growth Gap, Sales Velocity, etc. into visual components
    html = convertCodeBlocksToVisualizations(html);

    return html;
  } catch (error) {
    console.error('[BizHealth] Markdown parser error:', error);
    // Fallback: escape HTML and wrap in paragraph
    return `<p class="bh-paragraph">${escapeHtml(markdown)}</p>`;
  }
}

/**
 * Parse Markdown with full result including validation and metrics
 *
 * @param markdown - Raw markdown string from AI output
 * @param options - Parsing and normalization options
 * @returns Full parse result with HTML, validation, and metrics
 */
export function parseMarkdownWithValidation(
  markdown: string,
  options?: ParseOptions
): ParseResult {
  const startTime = Date.now();
  const originalLength = markdown?.length || 0;

  const html = parseMarkdownToHTML(markdown, options);
  const validation = validateParsedHTML(html);
  const counts = countElements(html);

  return {
    html,
    validation,
    metrics: {
      processingTimeMs: Date.now() - startTime,
      originalLength,
      outputLength: html.length,
      boldCount: counts.bold,
      dividerCount: counts.dividers,
      listCount: counts.lists
    }
  };
}

/**
 * Convenience wrapper for report builders
 * Simply converts markdown to HTML without additional metadata
 *
 * @param rawNarrative - Raw markdown narrative content
 * @param options - Optional parsing options
 * @returns Styled HTML string
 */
export function processNarrativeForReport(
  rawNarrative: string,
  options?: ParseOptions
): string {
  return parseMarkdownToHTML(rawNarrative, options);
}

// ============================================================================
// MARKDOWN CLEANUP SAFETY NET
// ============================================================================

/**
 * Final cleanup for any markdown syntax that escaped the parser
 * Called as last step before returning HTML
 */
export function cleanupRemainingMarkdown(html: string): string {
  if (!html) return html;

  // Replace any remaining ** (bold) that weren't caught
  // But be careful not to break existing <strong> tags
  html = html.replace(/(?<!<[^>]*)\*\*([^*]+)\*\*(?![^<]*>)/g, '<strong class="bh-emphasis">$1</strong>');

  // Replace any remaining * (italic) that weren't caught
  // Exclude cases that look like multiplication or CSS units
  html = html.replace(/(?<!<[^>]*)(?<![0-9px%])\*([^*\n]+)\*(?![^<]*>)/g, '<em class="bh-em">$1</em>');

  // Clean up any double-escaped asterisks
  html = html.replace(/\\\*/g, '*');

  return html;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  parseMarkdownToHTML,
  parseMarkdownWithValidation,
  validateParsedHTML,
  processNarrativeForReport,
  cleanupRemainingMarkdown,
};
