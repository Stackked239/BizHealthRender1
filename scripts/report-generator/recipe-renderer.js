/**
 * BizHealth Recipe-Based Report Renderer
 *
 * Renders HTML reports from IDM data using declarative recipe configurations.
 * This is the core rendering engine for the multi-report recipe system.
 */

import { wrapInHtmlDocument, footer, divider, section, heading, paragraph, bulletList, numberedList, calloutBox, table } from './utils/html-template.js';
import { generateRadarChart, generateBarChart, generateProgressBar, generateScoreTile, generateScoreTilesRow, generateRiskMatrix, generateTimeline, generateKPIDashboard } from './utils/svg-charts.js';

// ============================================================================
// DATA RESOLVER
// ============================================================================

/**
 * Resolve data from IDM using data source path
 * Supports JSONPath-like syntax with filters
 */
export function resolveDataSource(idm, dataSource) {
  const { from, filters, sort, limit, offset } = dataSource;

  // Parse the path and extract data
  let data = resolveIDMPath(idm, from);

  // Apply filters
  if (filters && filters.length > 0) {
    data = applyFilters(data, filters);
  }

  // Apply sorting
  if (sort) {
    data = applySorting(data, sort);
  }

  // Apply offset and limit
  if (Array.isArray(data)) {
    if (offset) {
      data = data.slice(offset);
    }
    if (limit) {
      data = data.slice(0, limit);
    }
  }

  return data;
}

/**
 * Parse and resolve IDM path
 */
function resolveIDMPath(idm, path) {
  // Handle special array filters like "dimensions[dimension_code=STR]"
  const arrayFilterMatch = path.match(/^([^[]+)\[([^\]]+)\](.*)$/);

  if (arrayFilterMatch) {
    const [, basePath, filterExpr, remainder] = arrayFilterMatch;
    let baseData = basePath.split('.').reduce((obj, key) => obj?.[key], idm);

    if (Array.isArray(baseData)) {
      // Parse filter expression (e.g., "dimension_code=STR")
      const [filterKey, filterValue] = filterExpr.split('=');
      baseData = baseData.find(item => String(item[filterKey]) === filterValue);

      // If there's a remainder path, continue resolving
      if (remainder && baseData) {
        const remainderPath = remainder.startsWith('.') ? remainder.slice(1) : remainder;
        if (remainderPath) {
          return remainderPath.split('.').reduce((obj, key) => obj?.[key], baseData);
        }
      }
    }

    return baseData;
  }

  // Simple dot notation path
  return path.split('.').reduce((obj, key) => obj?.[key], idm);
}

/**
 * Apply filters to data
 */
function applyFilters(data, filters) {
  if (!Array.isArray(data)) return data;

  return data.filter(item => {
    return filters.every(filter => {
      if (!filter) return true;

      // Dimension codes filter
      if (filter.dimension_codes) {
        return filter.dimension_codes.includes(item.dimension_code);
      }

      // Chapter codes filter
      if (filter.chapter_codes) {
        return filter.chapter_codes.includes(item.chapter_code);
      }

      // Type filter
      if (filter.type) {
        return item.type === filter.type;
      }

      // Score range filters
      if (filter.min_score !== undefined && item.score_overall !== undefined) {
        if (item.score_overall < filter.min_score) return false;
      }
      if (filter.max_score !== undefined && item.score_overall !== undefined) {
        if (item.score_overall > filter.max_score) return false;
      }

      // Field operator value filters
      if (filter.field && filter.operator && filter.value !== undefined) {
        const fieldValue = item[filter.field];
        switch (filter.operator) {
          case 'eq': return fieldValue === filter.value;
          case 'ne': return fieldValue !== filter.value;
          case 'gt': return fieldValue > filter.value;
          case 'gte': return fieldValue >= filter.value;
          case 'lt': return fieldValue < filter.value;
          case 'lte': return fieldValue <= filter.value;
          case 'in': return Array.isArray(filter.value) && filter.value.includes(fieldValue);
          case 'not_in': return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
          case 'contains': return String(fieldValue).includes(String(filter.value));
          default: return true;
        }
      }

      return true;
    });
  });
}

/**
 * Apply sorting to data
 */
function applySorting(data, sort) {
  if (!Array.isArray(data) || !sort) return data;

  const { field, direction = 'desc' } = sort;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier;
    }

    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });
}

// ============================================================================
// SECTION RENDERERS
// ============================================================================

/**
 * Render a section based on visual type
 */
export function renderSection(sectionConfig, resolvedData, options = {}) {
  const { id, title, description, visual_type, layout_hints = {}, tone_tags = [] } = sectionConfig;

  let content = '';

  // Section header
  content += heading(2, title);
  if (description) {
    content += paragraph(description, 'section-description');
  }

  // Render content based on visual type
  const renderer = VISUAL_RENDERERS[visual_type || 'text_block'];
  if (renderer) {
    content += renderer(resolvedData, sectionConfig, options);
  } else {
    content += paragraph(`[Unsupported visual type: ${visual_type}]`);
  }

  // Apply layout hints
  const sectionClasses = ['report-section'];
  if (layout_hints.page_break_before) sectionClasses.push('page-break-before');
  if (layout_hints.page_break_after) sectionClasses.push('page-break-after');

  return section(content, sectionClasses.join(' '), id);
}

// ============================================================================
// VISUAL TYPE RENDERERS
// ============================================================================

const VISUAL_RENDERERS = {
  /**
   * Score tile - single large score display
   */
  score_tile: (data, config, options) => {
    const scoreData = data.health_score || data.overall_health_score || data;
    const score = typeof scoreData === 'number' ? scoreData : scoreData?.score || 0;
    const descriptor = data.descriptor || getScoreDescriptor(score);

    return `
      <div class="score-tile-large">
        <div class="score-value">${score}</div>
        <div class="score-descriptor">${descriptor}</div>
      </div>
    `;
  },

  /**
   * Score tiles row - multiple score tiles in a row
   */
  score_tiles_row: (data, config, options) => {
    const items = Array.isArray(data.chapters) ? data.chapters :
                  Array.isArray(data.dimensions) ? data.dimensions :
                  Array.isArray(data) ? data : [data];

    const columns = config.layout_hints?.columns || 4;
    const tiles = items.map(item => {
      const name = item.name || item.dimension_code || item.chapter_code;
      const score = item.score_overall || item.score || 0;
      const band = item.score_band || getScoreBand(score);

      return `
        <div class="score-tile" data-band="${band.toLowerCase()}">
          <div class="tile-name">${name}</div>
          <div class="tile-score">${score}</div>
          <div class="tile-band">${band}</div>
        </div>
      `;
    }).join('');

    return `<div class="score-tiles-row" style="grid-template-columns: repeat(${columns}, 1fr);">${tiles}</div>`;
  },

  /**
   * Radar chart for multi-dimensional view
   */
  radar_chart: (data, config, options) => {
    const items = Array.isArray(data.dimensions) ? data.dimensions :
                  Array.isArray(data.chapters) ? data.chapters :
                  Array.isArray(data) ? data : [];

    if (items.length === 0) return paragraph('No data available for radar chart.');

    const chartData = items.map(item => ({
      label: item.name || item.dimension_code,
      value: item.score_overall || item.score || 0
    }));

    return generateRadarChart(chartData, { width: 500, height: 400 });
  },

  /**
   * Bar chart for comparison
   */
  bar_chart: (data, config, options) => {
    const items = Array.isArray(data.dimensions) ? data.dimensions :
                  Array.isArray(data.sub_indicators) ? data.sub_indicators :
                  Array.isArray(data) ? data : [data];

    if (!items.length) return paragraph('No data available for bar chart.');

    const chartData = items.map(item => ({
      label: item.name || item.id,
      value: item.score_overall || item.score || 0,
      band: item.score_band || getScoreBand(item.score_overall || item.score || 0)
    }));

    return generateBarChart(chartData, { width: 600, height: Math.max(200, chartData.length * 40) });
  },

  /**
   * Progress bar for single metric
   */
  progress_bar: (data, config, options) => {
    const score = typeof data === 'number' ? data : data.score_overall || data.score || 0;
    const label = data.name || config.title;

    return generateProgressBar(score, label);
  },

  /**
   * Table for structured data
   */
  table: (data, config, options) => {
    const items = Array.isArray(data) ? data :
                  Array.isArray(data.sub_indicators) ? data.sub_indicators :
                  [data];

    if (!items.length) return paragraph('No data available for table.');

    // Determine columns based on first item
    const firstItem = items[0];
    const columns = Object.keys(firstItem)
      .filter(key => !['id', 'evidence_refs', 'contributing_question_ids', 'linked_finding_ids', 'linked_recommendation_ids'].includes(key))
      .slice(0, 6);

    const headers = columns.map(col => formatColumnHeader(col));
    const rows = items.map(item =>
      columns.map(col => formatCellValue(item[col]))
    );

    return table(headers, rows);
  },

  /**
   * Checklist for action items
   */
  checklist: (data, config, options) => {
    const items = getItems(data);

    if (!items.length) return paragraph('No items available.');

    const checklistItems = items.map(item => {
      const title = item.theme || item.short_label || item.name || item.title || 'Action Item';
      const description = item.expected_outcomes || item.narrative || item.description || '';

      return `
        <div class="checklist-item">
          <input type="checkbox" disabled>
          <div class="checklist-content">
            <strong>${title}</strong>
            ${description ? `<p>${description}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="checklist">${checklistItems}</div>`;
  },

  /**
   * Timeline for roadmap
   */
  timeline: (data, config, options) => {
    const phases = Array.isArray(data.phases) ? data.phases :
                   Array.isArray(data) ? data : [];

    if (!phases.length) return paragraph('No timeline data available.');

    return generateTimeline(phases);
  },

  /**
   * Risk matrix
   */
  risk_matrix: (data, config, options) => {
    const risks = Array.isArray(data) ? data : [data];

    if (!risks.length) return paragraph('No risks identified.');

    return generateRiskMatrix(risks);
  },

  /**
   * Roadmap timeline
   */
  roadmap_timeline: (data, config, options) => {
    const phases = Array.isArray(data.phases) ? data.phases :
                   Array.isArray(data) ? data : [];

    return generateTimeline(phases);
  },

  /**
   * KPI Dashboard
   */
  kpi_dashboard: (data, config, options) => {
    const items = Array.isArray(data.dimensions) ? data.dimensions :
                  Array.isArray(data) ? data : [data];

    return generateKPIDashboard(items);
  },

  /**
   * Text block for narrative content
   */
  text_block: (data, config, options) => {
    if (typeof data === 'string') return paragraph(data);
    if (data.narrative) return paragraph(data.narrative);
    if (data.content) return paragraph(data.content);
    return paragraph(JSON.stringify(data, null, 2));
  },

  /**
   * Narrative with formatted text
   */
  narrative: (data, config, options) => {
    let content = '';

    if (data.overall_health_score !== undefined) {
      content += `<p class="lead">Business Health Score: <strong>${data.overall_health_score}/100</strong> - ${data.descriptor || getScoreDescriptor(data.overall_health_score)}</p>`;
    }

    if (data.trajectory) {
      content += `<p>Trajectory: <span class="trajectory-${data.trajectory.toLowerCase()}">${data.trajectory}</span></p>`;
    }

    if (data.key_imperatives && data.key_imperatives.length > 0) {
      content += '<h4>Key Imperatives</h4>';
      content += bulletList(data.key_imperatives);
    }

    if (data.top_recommendations && data.top_recommendations.length > 0) {
      content += '<h4>Priority Recommendations</h4>';
      content += numberedList(data.top_recommendations.map(r => r.theme || r.title || 'Recommendation'));
    }

    return content || paragraph('No narrative data available.');
  },

  /**
   * Bullet list
   */
  bullet_list: (data, config, options) => {
    const items = getListItems(data);
    if (!items.length) return paragraph('No items available.');
    return bulletList(items);
  },

  /**
   * Numbered list
   */
  numbered_list: (data, config, options) => {
    const items = getListItems(data);
    if (!items.length) return paragraph('No items available.');
    return numberedList(items);
  },

  /**
   * Callout box for highlights
   */
  callout_box: (data, config, options) => {
    const items = getItems(data);
    if (!items.length) return paragraph('No items available.');

    const callouts = items.map(item => {
      const title = item.short_label || item.name || item.theme || 'Alert';
      const content = item.narrative || item.description || '';
      const severity = item.severity || 'Medium';

      return calloutBox(title, content, severity.toLowerCase());
    }).join('');

    return callouts;
  },

  /**
   * Metric card for single metrics
   */
  metric_card: (data, config, options) => {
    const metrics = [];

    if (data.health_score !== undefined || data.overall_health_score !== undefined) {
      metrics.push({ label: 'Health Score', value: data.health_score || data.overall_health_score, unit: '/100' });
    }
    if (data.descriptor) {
      metrics.push({ label: 'Status', value: data.descriptor, unit: '' });
    }
    if (data.trajectory) {
      metrics.push({ label: 'Trajectory', value: data.trajectory, unit: '' });
    }

    if (!metrics.length) return paragraph('No metrics available.');

    const columns = config.layout_hints?.columns || 3;
    const cards = metrics.map(m => `
      <div class="metric-card">
        <div class="metric-value">${m.value}${m.unit}</div>
        <div class="metric-label">${m.label}</div>
      </div>
    `).join('');

    return `<div class="metric-cards" style="grid-template-columns: repeat(${columns}, 1fr);">${cards}</div>`;
  },

  /**
   * Comparison table for side-by-side comparison
   */
  comparison_table: (data, config, options) => {
    const topItems = data.top_dims || data.strengths || [];
    const bottomItems = data.bottom_dims || data.challenges || [];

    const rows = [];
    const maxRows = Math.max(topItems.length, bottomItems.length);

    for (let i = 0; i < maxRows; i++) {
      const topItem = topItems[i];
      const bottomItem = bottomItems[i];

      rows.push([
        topItem ? `${topItem.name} (${topItem.score_overall || topItem.score}/100)` : '',
        bottomItem ? `${bottomItem.name} (${bottomItem.score_overall || bottomItem.score}/100)` : ''
      ]);
    }

    return table(['Strengths', 'Challenges'], rows);
  },

  /**
   * No visual - just data
   */
  none: (data, config, options) => {
    return '';
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreDescriptor(score) {
  if (score >= 85) return 'Excellent Health';
  if (score >= 75) return 'Good Health';
  if (score >= 65) return 'Fair Health';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical Condition';
}

function getScoreBand(score) {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

function formatColumnHeader(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatCellValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getItems(data) {
  if (Array.isArray(data)) return data;
  if (data.recommendations) return data.recommendations;
  if (data.findings) return data.findings;
  if (data.risks) return data.risks;
  if (data.quick_wins) return data.quick_wins;
  return [data];
}

function getListItems(data) {
  const items = getItems(data);
  return items.map(item => {
    if (typeof item === 'string') return item;
    return item.short_label || item.name || item.theme || item.narrative || item.title || String(item);
  });
}

// ============================================================================
// MAIN RENDERER
// ============================================================================

/**
 * Render a complete report from IDM and recipe
 */
export function renderReport(idm, recipe, options = {}) {
  const { brand_config = {}, sections = [], name, description } = recipe;

  let reportContent = '';

  // Render each section
  for (const sectionConfig of sections) {
    // Resolve data for all data sources in the section
    const resolvedData = {};
    for (const ds of sectionConfig.data_sources) {
      resolvedData[ds.id] = resolveDataSource(idm, ds);
    }

    // Render the section
    reportContent += renderSection(sectionConfig, resolvedData, options);
  }

  // Add footer
  const footerContent = footer([
    `${name} - BizHealth.ai`,
    `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    'BizHealth.ai - Proprietary and Confidential'
  ]);

  reportContent += divider();
  reportContent += footerContent;

  // Wrap in HTML document with styling
  return wrapInHtmlDocument(reportContent, name, {
    primaryColor: brand_config.primary_color || '#212653',
    accentColor: brand_config.accent_color || '#969423',
    fontHeading: brand_config.font_heading || 'Montserrat',
    fontBody: brand_config.font_body || 'Open Sans'
  });
}

export default {
  renderReport,
  renderSection,
  resolveDataSource
};
