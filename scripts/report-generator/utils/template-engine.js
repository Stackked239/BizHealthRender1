/**
 * Template Engine
 *
 * Simple template engine for generating markdown reports
 * with variable substitution and conditional sections.
 */

/**
 * Replace variables in template string
 * @param {string} template - Template string with {variable} placeholders
 * @param {object} data - Data object with variable values
 * @returns {string} - Processed template
 */
export function replaceVariables(template, data) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined && value !== null ? value : match;
  });
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Format a table row
 */
export function tableRow(...cells) {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Format a table header
 */
export function tableHeader(...headers) {
  const headerRow = tableRow(...headers);
  const separatorRow = `|${headers.map(() => ':---').join('|')}|`;
  return `${headerRow}\n${separatorRow}`;
}

/**
 * Format a centered table header
 */
export function centeredTableHeader(...headers) {
  const headerRow = tableRow(...headers);
  const separatorRow = `|${headers.map(() => ':---:').join('|')}|`;
  return `${headerRow}\n${separatorRow}`;
}

/**
 * Generate a section divider
 */
export function divider() {
  return '\n---\n';
}

/**
 * Format bold text (limited to 3 words per BizHealth standard)
 */
export function bold(text) {
  return `**${text}**`;
}

/**
 * Format a heading
 */
export function heading(level, text, emoji = '') {
  const prefix = '#'.repeat(level);
  return emoji ? `${prefix} ${emoji} ${text}` : `${prefix} ${text}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(value) {
  if (typeof value === 'string') return value;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

/**
 * Format a score with /100
 */
export function formatScore(score) {
  return `${score}/100`;
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format ROI multiple
 */
export function formatROI(value) {
  return `${Number(value).toFixed(1)}x`;
}

/**
 * Generate bullet list
 */
export function bulletList(items) {
  return items.map(item => `- ${item}`).join('\n');
}

/**
 * Generate numbered list
 */
export function numberedList(items) {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/**
 * Conditional section - returns content only if condition is true
 */
export function conditionalSection(condition, content) {
  return condition ? content : '';
}

/**
 * Repeat a section for each item in array
 */
export function repeatSection(items, templateFn) {
  return items.map(templateFn).join('\n\n');
}

/**
 * TemplateEngine class for more complex operations
 */
export class TemplateEngine {
  constructor() {
    this.helpers = {
      formatCurrency,
      formatScore,
      formatPercent,
      formatROI,
      bold,
      tableRow,
      tableHeader,
      centeredTableHeader,
      bulletList,
      numberedList,
      divider,
      heading
    };
  }

  /**
   * Process a template with data
   */
  process(template, data) {
    let result = template;

    // Replace simple variables
    result = replaceVariables(result, data);

    // Process conditional blocks {{#if condition}}...{{/if}}
    result = this.processConditionals(result, data);

    // Process loops {{#each items}}...{{/each}}
    result = this.processLoops(result, data);

    return result;
  }

  processConditionals(template, data) {
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = getNestedValue(data, condition.trim());
      return value ? content : '';
    });
  }

  processLoops(template, data) {
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(loopRegex, (match, arrayPath, content) => {
      const items = getNestedValue(data, arrayPath.trim());
      if (!Array.isArray(items)) return '';

      return items.map((item, index) => {
        let itemContent = content;
        // Replace @index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, index);
        // Replace item properties
        itemContent = replaceVariables(itemContent, { item, ...item });
        return itemContent;
      }).join('\n');
    });
  }
}

export default TemplateEngine;
