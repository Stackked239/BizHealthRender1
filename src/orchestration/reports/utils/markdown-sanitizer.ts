/**
 * BizHealth Markdown Sanitizer
 *
 * Converts Opus 4.5 rich markdown output (tables, code blocks, ASCII art)
 * to properly styled HTML for report templates.
 *
 * @since 2025-12-02 - Initial implementation to fix broken report templates
 */

import { Marked, Renderer, type Tokens } from 'marked';

/**
 * Helper to escape HTML in code blocks
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create BizHealth custom renderer with brand styling
 * Uses marked v17 approach: create renderer instance and override methods
 */
function createBizHealthRenderer(): Renderer {
  const renderer = new Renderer();

  // Tables with BizHealth styling
  renderer.table = function(token: Tokens.Table): string {
    let header = '';
    let body = '';

    // Build header
    let headerRow = '';
    for (const cell of token.header) {
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      headerRow += `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
    }
    header = `<tr>${headerRow}</tr>`;

    // Build body
    for (const row of token.rows) {
      let rowHtml = '';
      for (const cell of row) {
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        rowHtml += `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
      }
      body += `<tr>${rowHtml}</tr>`;
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

  // Code blocks - detect ASCII art vs regular code
  // ASCII art is STRIPPED to eliminate visual noise - data should be rendered with SVG components
  renderer.code = function(token: Tokens.Code): string {
    const code = token.text;
    // Detect ASCII art characters (box drawing, Unicode blocks, etc.)
    const isAsciiArt = /[═║╔╗╚╝┌┐└┘│─▓░█▲▼◄►●○■□╬╠╣╦╩┬┴├┤┼╭╮╯╰]/.test(code);

    if (isAsciiArt) {
      // STRIP ASCII art completely - do not render it
      // The data should be extracted and rendered as proper SVG visualizations
      // Return empty string to eliminate ASCII art from output
      return '';
    }

    const lang = token.lang ? ` class="language-${token.lang}"` : '';
    return `<pre class="bh-code"><code${lang}>${escapeHtml(code)}</code></pre>`;
  };

  // Blockquotes with callout styling
  renderer.blockquote = function(token: Tokens.Blockquote): string {
    const body = this.parser.parse(token.tokens);
    return `<blockquote class="bh-callout">${body}</blockquote>`;
  };

  // Horizontal rules as section dividers
  renderer.hr = function(_token: Tokens.Hr): string {
    return '<hr class="bh-section-divider">';
  };

  // Paragraphs with proper class
  renderer.paragraph = function(token: Tokens.Paragraph): string {
    return `<p class="bh-p">${this.parser.parseInline(token.tokens)}</p>`;
  };

  // Headers with proper classes
  renderer.heading = function(token: Tokens.Heading): string {
    return `<h${token.depth} class="bh-h${token.depth}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
  };

  // Lists with proper classes
  renderer.list = function(token: Tokens.List): string {
    const tag = token.ordered ? 'ol' : 'ul';
    const className = token.ordered ? 'bh-ol' : 'bh-ul';
    let body = '';
    for (const item of token.items) {
      body += this.listitem(item);
    }
    return `<${tag} class="${className}">${body}</${tag}>`;
  };

  // List items with proper class
  renderer.listitem = function(item: Tokens.ListItem): string {
    const itemBody = this.parser.parse(item.tokens);
    return `<li class="bh-li">${itemBody}</li>`;
  };

  // Strong text (bold)
  renderer.strong = function(token: Tokens.Strong): string {
    return `<strong class="bh-strong">${this.parser.parseInline(token.tokens)}</strong>`;
  };

  // Emphasis text (italic)
  renderer.em = function(token: Tokens.Em): string {
    return `<em class="bh-em">${this.parser.parseInline(token.tokens)}</em>`;
  };

  return renderer;
}

// Create configured marked instance with BizHealth renderer
function createConfiguredMarked(): Marked {
  const configuredMarked = new Marked();
  const bizHealthRenderer = createBizHealthRenderer();

  configuredMarked.use({
    renderer: bizHealthRenderer,
    gfm: true,        // GitHub Flavored Markdown (tables, strikethrough, etc.)
    breaks: true,     // Convert single line breaks to <br>
  });

  return configuredMarked;
}

// Singleton instance
const bhMarked = createConfiguredMarked();

/**
 * Main conversion function - converts raw markdown to styled HTML
 *
 * @param markdown - Raw markdown string from Opus 4.5 output
 * @returns Styled HTML string ready for report templates
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '<p class="bh-empty">No content available.</p>';
  }

  try {
    // Normalize line endings
    const normalized = markdown.replace(/\r\n/g, '\n');

    // Parse markdown to HTML using configured instance
    const html = bhMarked.parse(normalized) as string;

    return html;
  } catch (error) {
    console.error('[BizHealth] Markdown conversion error:', error);
    // Fallback: escape HTML and wrap in paragraph
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p class="bh-p">${escaped}</p>`;
  }
}

/**
 * Validation function to detect residual raw markdown
 * Returns warnings if unconverted markdown patterns are found
 *
 * @param html - Converted HTML to validate
 * @returns Array of warning messages for any detected issues
 */
export function validateNoRawMarkdown(html: string): string[] {
  const warnings: string[] = [];

  // Only flag patterns that should NOT appear in rendered HTML
  const patterns = [
    { regex: /\|[\s]*:?-+:?[\s]*\|/g, name: 'table delimiter row' },
    { regex: /```/g, name: 'code fence' },
    { regex: /^#{1,6}\s/gm, name: 'markdown header' },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(html)) {
      warnings.push(`Detected unconverted ${name}`);
    }
    regex.lastIndex = 0; // Reset regex state
  }

  return warnings;
}

/**
 * Combined process function with timing and validation
 *
 * @param rawMarkdown - Raw markdown string to process
 * @returns Object containing HTML, warnings, and processing time
 */
export function processNarrativeContent(rawMarkdown: string): {
  html: string;
  warnings: string[];
  processingTimeMs: number;
} {
  const startTime = Date.now();
  const html = convertMarkdownToHtml(rawMarkdown);
  const warnings = validateNoRawMarkdown(html);
  const processingTimeMs = Date.now() - startTime;

  if (warnings.length > 0) {
    console.warn('[BizHealth] Markdown warnings:', warnings);
  }

  return { html, warnings, processingTimeMs };
}

/**
 * Convenience wrapper for report builders
 * Simply converts markdown to HTML without additional metadata
 *
 * @param rawNarrative - Raw markdown narrative content
 * @returns Styled HTML string
 */
export function processNarrativeForReport(rawNarrative: string): string {
  const { html } = processNarrativeContent(rawNarrative);
  return html;
}

// Export default for simple imports
export default {
  convertMarkdownToHtml,
  processNarrativeForReport,
  processNarrativeContent,
  validateNoRawMarkdown,
};
