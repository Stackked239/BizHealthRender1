/**
 * Recipe-Based Report Builder
 *
 * Generates reports from declarative JSON recipe files.
 * Loads recipes from config/report-recipes/ and builds HTML reports
 * using the recipe's sections, visual types, and data sources.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta, Phase5ReportType } from '../../types/report.types.js';
import type { Recipe, Section, VisualType } from '../../types/recipe.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  escapeHtml,
  getTrajectoryIcon,
  generateProgressBar,
} from './html-template.js';

// Import chart integration for visual charts
import {
  renderChart,
  generateDimensionScoreChart,
  generateChapterRadarChart,
  getReportChartStyles,
  type DimensionChartData,
  type ChapterChartData,
} from './charts/index.js';
import { logger } from '../../utils/logger.js';
import {
  safeReplace,
  extractStringSafe,
  extractNumericValueSafe,
} from '../../utils/safety.utils.js';
import { ScoreBands } from '../../utils/score-bands.js';

// Import manager report utilities and config
import {
  filterQuickWinsByDimensions,
  filterRisksByDimensions,
  filterRecommendationsByDimensions,
  computeDepartmentHealthScore,
  getDimensionFromChapters,
  getDimensionName,
  getScoreBandFromScore,
  safeString,
  type DimensionCode,
} from './utils/index.js';
import {
  getManagerRecipe,
  isManagerReport,
  type ManagerRecipe,
} from './config/index.js';
import {
  generateGaugeChartSVG,
} from './charts/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recipe file mapping
const RECIPE_FILE_MAP: Record<string, string> = {
  'employees': 'employees.json',
  'managersOperations': 'managers-operations.json',
  'managersSalesMarketing': 'managers-sales-marketing.json',
  'managersFinancials': 'managers-financials.json',
  'managersStrategy': 'managers-strategy.json',
  'managersItTechnology': 'managers-it-technology.json',
};

/**
 * Load a recipe from the config directory
 */
async function loadRecipe(recipeId: string): Promise<Recipe & { visuals?: any }> {
  const fileName = RECIPE_FILE_MAP[recipeId];
  if (!fileName) {
    throw new Error(`Unknown recipe ID: ${recipeId}`);
  }

  // Navigate from src/orchestration/reports to config/report-recipes
  const recipePath = path.resolve(__dirname, '../../../config/report-recipes', fileName);
  const content = await fs.readFile(recipePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Extract data from ReportContext using simplified path
 */
function extractData(ctx: ReportContext, fromPath: string): any {
  // Handle common IDM paths
  const pathMappings: Record<string, () => any> = {
    'scores_summary.overall_health_score': () => ctx.overallHealth.score,
    'scores_summary.descriptor': () => ctx.overallHealth.status,
    'scores_summary.trajectory': () => ctx.overallHealth.trajectory,
    'scores_summary.key_imperatives': () => ctx.keyImperatives,
    'scores_summary': () => ctx.overallHealth,
    'chapters': () => ctx.chapters,
    'dimensions': () => ctx.dimensions,
    'findings': () => ctx.findings,
    'recommendations': () => ctx.recommendations,
    'quick_wins': () => ctx.quickWins,
    'risks': () => ctx.risks,
    'roadmap': () => ctx.roadmap,
    'roadmap.phases': () => ctx.roadmap?.phases || [],
  };

  // Direct match
  if (pathMappings[fromPath]) {
    return pathMappings[fromPath]();
  }

  // Handle dimension code filtering like dimensions[dimension_code=HRS]
  const dimMatch = fromPath.match(/dimensions\[dimension_code=(\w+)\]/);
  if (dimMatch) {
    return ctx.dimensions.find(d => d.code === dimMatch[1]);
  }

  // Handle chapter code filtering like chapters[chapter_code=GE]
  const chapterMatch = fromPath.match(/chapters\[chapter_code=(\w+)\]/);
  if (chapterMatch) {
    return ctx.chapters.find(c => c.code === chapterMatch[1]);
  }

  // Default: return undefined for unknown paths
  return undefined;
}

/**
 * Apply filters and sorting to data array
 */
function applyFiltersAndSort(data: any[], dataSource: any): any[] {
  if (!Array.isArray(data)) return data ? [data] : [];

  let result = [...data];

  // Apply filters
  if (dataSource.filters) {
    for (const filter of dataSource.filters) {
      if (filter.type) {
        result = result.filter(item => item.type === filter.type);
      }
      if (filter.dimension_codes) {
        result = result.filter(item => filter.dimension_codes.includes(item.dimensionCode));
      }
      if (filter.min_score !== undefined) {
        result = result.filter(item => (item.score || item.score_overall) >= filter.min_score);
      }
      if (filter.max_score !== undefined) {
        result = result.filter(item => (item.score || item.score_overall) <= filter.max_score);
      }
    }
  }

  // Apply sorting
  if (dataSource.sort) {
    const { field, direction } = dataSource.sort;
    result.sort((a, b) => {
      const aVal = a[field] ?? a.score ?? 0;
      const bVal = b[field] ?? b.score ?? 0;
      return direction === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }

  // Apply limit
  if (dataSource.limit) {
    result = result.slice(0, dataSource.limit);
  }

  return result;
}

/**
 * Generate HTML for a section based on its visual type
 */
function generateSectionHtml(
  section: Section,
  ctx: ReportContext,
  options: ReportRenderOptions,
  recipe: Recipe & { visuals?: any }
): string {
  // Gather data from all data sources
  const sectionData: Record<string, any> = {};
  for (const ds of section.data_sources || []) {
    let data = extractData(ctx, ds.from);
    data = applyFiltersAndSort(data, ds);
    sectionData[ds.id] = data;
  }

  const visualType = section.visual_type || 'narrative';
  const styleModifiers = recipe.visuals?.global_settings?.style_modifiers || {};
  const isEmployeeStyle = styleModifiers.friendly_language || styleModifiers.celebratory_style;

  return `
    <section class="section recipe-section" id="${section.id}">
      <div class="section-header">
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
      ${renderVisual(visualType, sectionData, ctx, options, section, isEmployeeStyle)}
    </section>
  `;
}

/**
 * Render a visual component based on type
 */
function renderVisual(
  visualType: VisualType,
  data: Record<string, any>,
  ctx: ReportContext,
  options: ReportRenderOptions,
  section: Section,
  isEmployeeStyle: boolean = false
): string {
  switch (visualType) {
    case 'score_tile':
      return renderScoreTile(data, ctx, options, isEmployeeStyle);

    case 'score_tiles_row':
      return renderScoreTilesRow(data, ctx, options);

    case 'bullet_list':
      return renderBulletList(data, isEmployeeStyle);

    case 'numbered_list':
      return renderNumberedList(data);

    case 'checklist':
      return renderChecklist(data, isEmployeeStyle);

    case 'table':
      return renderTable(data, ctx);

    case 'narrative':
      return renderNarrative(data, isEmployeeStyle);

    case 'timeline':
      return renderTimeline(data, options);

    case 'metric_card':
      return renderMetricCards(data, options);

    case 'bar_chart':
      return renderBarChart(data, options);

    case 'radar_chart':
      return renderRadarChart(data, options);

    case 'risk_matrix':
      return renderRiskMatrix(data, options);

    case 'kpi_dashboard':
      return renderKPIDashboard(data, ctx, options);

    case 'roadmap_timeline':
      return renderRoadmapTimeline(data, options);

    case 'progress_bar':
      return renderProgressBars(data, options);

    case 'callout_box':
      return renderCalloutBox(data, section);

    case 'comparison_table':
      return renderComparisonTable(data, ctx);

    default:
      return renderNarrative(data, isEmployeeStyle);
  }
}

// Visual rendering helpers

function renderScoreTile(data: Record<string, any>, ctx: ReportContext, options: ReportRenderOptions, isEmployeeStyle: boolean): string {
  const score = data.health_score || ctx.overallHealth.score;
  const descriptor = data.descriptor || ctx.overallHealth.status;

  const emoji = isEmployeeStyle ? getScoreEmoji(score) : '';

  return `
    <div class="health-score-display">
      <div class="health-score-circle">
        <span class="score">${score}</span>
        <span class="out-of">/ 100</span>
      </div>
      <div class="health-score-details">
        <p class="status">${emoji ? emoji + ' ' : ''}${escapeHtml(descriptor)}</p>
        <p class="trajectory">
          ${getTrajectoryIcon(ctx.overallHealth.trajectory)}
          Trajectory: ${ctx.overallHealth.trajectory}
        </p>
        <p><span class="band-badge ${ctx.overallHealth.band}">${ctx.overallHealth.band}</span></p>
      </div>
    </div>
  `;
}

function renderScoreTilesRow(data: Record<string, any>, ctx: ReportContext, options: ReportRenderOptions): string {
  const items = Object.values(data).flat().filter(Boolean);

  return `
    <div class="grid grid-4">
      ${items.slice(0, 4).map((item: any) => `
        <div class="score-card small">
          <div class="score-value">${item.score || item.score_overall || 0}</div>
          <div class="score-label">${escapeHtml(item.name || item.shortLabel || 'Score')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBulletList(data: Record<string, any>, isEmployeeStyle: boolean): string {
  const items = Object.values(data).flat().filter(Boolean);

  if (items.length === 0) {
    return '<p>No items to display.</p>';
  }

  return `
    <ul class="styled-list">
      ${items.map((item: any) => {
        let text = '';
        if (typeof item === 'string') {
          text = item;
        } else if (typeof item === 'object' && item !== null) {
          text = item.shortLabel || item.short_label || item.name || item.narrative || '';
        }
        if (!text && item) {
          text = String(item);
        }
        const emoji = isEmployeeStyle && item.type === 'strength' ? '🌟 ' : '';
        return `<li>${emoji}${escapeHtml(text || '')}</li>`;
      }).join('')}
    </ul>
  `;
}

function renderNumberedList(data: Record<string, any>): string {
  const items = Object.values(data).flat().filter(Boolean);

  if (items.length === 0) {
    return '<p>No items to display.</p>';
  }

  return `
    <ol class="styled-list">
      ${items.map((item: any) => {
        let text = '';
        if (typeof item === 'string') {
          text = item;
        } else if (typeof item === 'object' && item !== null) {
          text = item.theme || item.shortLabel || item.name || item.narrative || '';
        }
        if (!text && item) {
          text = String(item);
        }
        return `<li>${escapeHtml(text || '')}</li>`;
      }).join('')}
    </ol>
  `;
}

function renderChecklist(data: Record<string, any>, isEmployeeStyle: boolean): string {
  const items = Object.values(data).flat().filter(Boolean);

  if (items.length === 0) {
    return '<p>No action items available.</p>';
  }

  return `
    <div class="checklist">
      ${items.map((item: any) => {
        let text = '';
        if (typeof item === 'string') {
          text = item;
        } else if (typeof item === 'object' && item !== null) {
          text = item.theme || item.actionSteps?.[0] || item.expectedOutcomes || item.name || '';
        }
        if (!text && item) {
          text = String(item);
        }
        const icon = isEmployeeStyle ? '👍' : '☐';
        return `
          <div class="checklist-item">
            <span class="check-icon">${icon}</span>
            <span>${escapeHtml(text || '')}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTable(data: Record<string, any>, ctx: ReportContext): string {
  const items = Object.values(data).flat().filter(Boolean);

  if (items.length === 0) {
    return '<p>No data available.</p>';
  }

  // Determine columns based on first item
  const firstItem = items[0];
  const columns = getTableColumns(firstItem);

  return `
    <table class="score-table">
      <thead>
        <tr>
          ${columns.map(col => `<th>${escapeHtml(col.header)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            ${columns.map(col => `<td>${col.render(item)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getTableColumns(item: any): Array<{ header: string; render: (item: any) => string }> {
  if (item.score !== undefined || item.score_overall !== undefined) {
    return [
      { header: 'Name', render: (i) => {
        const name = (typeof i === 'object' && i !== null) ? (i.name || i.shortLabel || '') : '';
        return escapeHtml(String(name));
      }},
      { header: 'Score', render: (i) => `<strong>${i.score || i.score_overall || 0}</strong>` },
      { header: 'Status', render: (i) => `<span class="band-badge ${i.band || i.score_band || ''}">${i.band || i.score_band || '-'}</span>` },
    ];
  }
  return [
    { header: 'Item', render: (i) => {
      let text = '';
      if (typeof i === 'string') {
        text = i;
      } else if (typeof i === 'object' && i !== null) {
        text = i.name || i.theme || i.shortLabel || '';
      }
      if (!text) text = String(i);
      return escapeHtml(text);
    }},
    { header: 'Details', render: (i) => {
      const details = (typeof i === 'object' && i !== null) ? (i.narrative || i.description || '-') : '-';
      return escapeHtml(String(details));
    }},
  ];
}

function renderNarrative(data: Record<string, any>, isEmployeeStyle: boolean): string {
  const items = Object.values(data).flat().filter(Boolean);

  if (items.length === 0) {
    return '<p>No information available for this section.</p>';
  }

  return items.map((item: any) => {
    if (typeof item === 'string') {
      return `<p>${escapeHtml(item)}</p>`;
    }

    const title = item.name || item.shortLabel || item.theme || '';
    const narrative = item.narrative || item.description || item.expectedOutcomes || '';
    const score = item.score || item.score_overall;

    return `
      <div class="narrative-item card mb-2">
        ${title ? `<h4>${escapeHtml(title)}${score ? ` <span class="band-badge ${item.band || item.score_band || ''}">${score}/100</span>` : ''}</h4>` : ''}
        ${narrative ? `<p>${escapeHtml(narrative)}</p>` : ''}
      </div>
    `;
  }).join('');
}

function renderTimeline(data: Record<string, any>, options: ReportRenderOptions): string {
  const phases = data.roadmap || Object.values(data).flat().filter(Boolean);

  if (!phases || phases.length === 0) {
    return '<p>No timeline data available.</p>';
  }

  return `
    <div class="timeline">
      ${phases.map((phase: any) => `
        <div class="timeline-item">
          <div class="phase-name">${escapeHtml(phase.name || 'Phase')}</div>
          <div class="time-horizon">${escapeHtml(phase.timeHorizon || phase.time_horizon || '')}</div>
          <p>${escapeHtml(phase.narrative || '')}</p>
          ${phase.keyMilestones?.length > 0 ? `
            <ul>
              ${phase.keyMilestones.map((m: string) => `<li>${escapeHtml(m)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderMetricCards(data: Record<string, any>, options: ReportRenderOptions): string {
  const items = Object.values(data).flat().filter(Boolean);

  return `
    <div class="grid grid-3">
      ${items.slice(0, 6).map((item: any) => `
        <div class="card">
          <div class="card-title">${escapeHtml(item.name || item.theme || 'Metric')}</div>
          <div class="card-body">
            ${item.score !== undefined ? `<div class="metric-value">${item.score}/100</div>` : ''}
            ${item.narrative ? `<p>${escapeHtml(item.narrative)}</p>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBarChart(data: Record<string, any>, options: ReportRenderOptions): string {
  const items = Object.values(data).flat().filter(Boolean);

  return `
    <div class="bar-chart-container">
      ${items.slice(0, 10).map((item: any) => {
        const score = item.score || item.score_overall || 0;
        const name = item.name || item.shortLabel || 'Item';
        const color = getScoreColor(score, options);
        return `
          <div class="bar-row">
            <div class="bar-label">${escapeHtml(name)}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${score}%; background: ${color};">
                <span class="bar-value">${score}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRadarChart(data: Record<string, any>, options: ReportRenderOptions): string {
  // Placeholder for radar chart - would need SVG or chart library
  const items = Object.values(data).flat().filter(Boolean);

  return `
    <div class="radar-placeholder card">
      <p class="text-center"><em>Radar chart visualization</em></p>
      <div class="grid grid-4 mt-2">
        ${items.slice(0, 4).map((item: any) => `
          <div class="text-center">
            <strong>${item.score || item.score_overall || 0}</strong>
            <br><small>${escapeHtml(item.name || '')}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRiskMatrix(data: Record<string, any>, options: ReportRenderOptions): string {
  const risks = Object.values(data).flat().filter(Boolean);

  const getSeverityLevel = (sev: any): 'high' | 'medium' | 'low' => {
    const s = typeof sev === 'number' ? sev : parseInt(sev) || 0;
    if (s >= 8) return 'high';
    if (s >= 5) return 'medium';
    return 'low';
  };

  // Helper to format severity safely
  const formatSeverity = (sev: any): string => {
    if (sev === null || sev === undefined) return 'N/A';
    const num = typeof sev === 'number' ? sev : parseInt(sev);
    if (isNaN(num)) return 'N/A';
    return `${num}/10`;
  };

  return `
    <div class="risk-matrix-container">
      ${risks.map((risk: any) => `
        <div class="risk-card ${getSeverityLevel(risk.severity)}">
          <div class="header">
            <span class="category">${escapeHtml(risk.category || risk.dimensionName || 'Risk')}</span>
            <span class="priority-badge ${getSeverityLevel(risk.severity)}">
              ${formatSeverity(risk.severity)}
            </span>
          </div>
          <p>${escapeHtml(risk.narrative || '')}</p>
          ${risk.mitigationSummary ? `<p><strong>Mitigation:</strong> ${escapeHtml(risk.mitigationSummary)}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderKPIDashboard(data: Record<string, any>, ctx: ReportContext, options: ReportRenderOptions): string {
  return `
    <div class="kpi-dashboard">
      <div class="grid grid-4">
        <div class="score-card">
          <div class="score-value">${ctx.overallHealth.score}</div>
          <div class="score-label">Health Score</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${ctx.findings.filter(f => f.type === 'strength').length}</div>
          <div class="score-label">Strengths</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${ctx.findings.filter(f => f.type === 'gap' || f.type === 'risk').length}</div>
          <div class="score-label">Focus Areas</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${ctx.recommendations.length}</div>
          <div class="score-label">Actions</div>
        </div>
      </div>
    </div>
  `;
}

function renderRoadmapTimeline(data: Record<string, any>, options: ReportRenderOptions): string {
  return renderTimeline(data, options);
}

function renderProgressBars(data: Record<string, any>, options: ReportRenderOptions): string {
  const items = Object.values(data).flat().filter(Boolean);

  return `
    <div class="progress-bars-container">
      ${items.map((item: any) => {
        const score = item.score || item.score_overall || 0;
        return `
          <div class="progress-item mb-2">
            <div class="flex flex-between mb-1">
              <span>${escapeHtml(item.name || 'Item')}</span>
              <span><strong>${score}/100</strong></span>
            </div>
            ${generateProgressBar(score)}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCalloutBox(data: Record<string, any>, section: Section): string {
  const items = Object.values(data).flat().filter(Boolean);
  const text = items.map((item: any) =>
    item.narrative || item.shortLabel || item.name || String(item)
  ).join(' ');

  return `
    <div class="callout warning">
      <div class="title">${escapeHtml(section.title)}</div>
      <p>${escapeHtml(text || 'Important information.')}</p>
    </div>
  `;
}

function renderComparisonTable(data: Record<string, any>, ctx: ReportContext): string {
  return renderTable(data, ctx);
}

// Utility functions

function getScoreEmoji(score: number): string {
  if (score >= 80) return '🌟';
  if (score >= 60) return '👍';
  if (score >= 40) return '📈';
  return '🎯';
}

function getScoreColor(score: number, _options: ReportRenderOptions): string {
  // Use shared ScoreBands utility for consistent score-to-color mapping
  return ScoreBands.getColor(score);
}

/**
 * Generate custom CSS for recipe-based reports
 */
function generateRecipeStyles(options: ReportRenderOptions): string {
  return `
    .recipe-section {
      margin-bottom: 2rem;
    }

    .section-description {
      color: #666;
      font-style: italic;
      margin-bottom: 1rem;
    }

    .styled-list {
      list-style: none;
      padding: 0;
    }

    .styled-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      border-bottom: 1px solid #eee;
    }

    .styled-list li:before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${options.brand.accentColor};
    }

    .checklist {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid ${options.brand.accentColor};
    }

    .check-icon {
      font-size: 1.25rem;
    }

    .bar-chart-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      width: 150px;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .bar-track {
      flex: 1;
      height: 24px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.5rem;
      border-radius: 12px;
      transition: width 0.3s ease;
    }

    .bar-value {
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .narrative-item {
      padding: 1rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: ${options.brand.primaryColor};
    }

    /* Enhanced radar placeholder */
    .radar-placeholder {
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      text-align: center;
    }

    .radar-placeholder .radar-title {
      font-weight: 600;
      color: ${options.brand.primaryColor};
      margin-bottom: 1rem;
    }

    .radar-scores {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .radar-score-item {
      background: #fff;
      padding: 0.75rem;
      border-radius: 8px;
      border-left: 3px solid ${options.brand.accentColor};
    }

    .radar-score-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${options.brand.primaryColor};
    }

    .radar-score-label {
      font-size: 0.75rem;
      color: #666;
    }

    /* Import chart component styles for any embedded charts */
    ${getReportChartStyles()}

    @media print {
      .bar-chart-container,
      .radar-placeholder {
        page-break-inside: avoid;
      }
    }

    @media (max-width: 768px) {
      .radar-scores {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;
}

/**
 * Build a report from a recipe file
 */
export async function buildRecipeReport(
  ctx: ReportContext,
  options: ReportRenderOptions,
  recipeId: string,
  reportType: Phase5ReportType
): Promise<GeneratedReport> {
  // Load the recipe
  const recipe = await loadRecipe(recipeId);
  const reportName = recipe.name;

  // Generate sections
  const sectionsHtml = recipe.sections.map(section =>
    generateSectionHtml(section, ctx, options, recipe)
  ).join('\n');

  // Build the full HTML
  const html = wrapHtmlDocument(`
    ${generateReportHeader(ctx, reportName, recipe.description)}
    ${sectionsHtml}
    ${generateReportFooter(ctx)}
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: generateRecipeStyles(options),
    ctx: ctx,
  });

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType,
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: recipe.target_page_range.max,
    sections: recipe.sections.map(s => ({
      id: s.id,
      title: s.title,
    })),
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType,
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

// Export individual builder functions for each recipe-based report type

export async function buildEmployeesReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'employees', 'employees');
}

export async function buildManagersOperationsReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'managersOperations', 'managersOperations');
}

export async function buildManagersSalesMarketingReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'managersSalesMarketing', 'managersSalesMarketing');
}

export async function buildManagersFinancialsReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'managersFinancials', 'managersFinancials');
}

export async function buildManagersStrategyReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'managersStrategy', 'managersStrategy');
}

export async function buildManagersItTechnologyReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  return buildRecipeReport(ctx, options, 'managersItTechnology', 'managersItTechnology');
}

// ============================================================================
// PHASE 2B: ENHANCED SECTION RENDERERS FOR MANAGER REPORTS
// ============================================================================

/**
 * Render Company Snapshot section for manager reports.
 * Shows overall company health + manager's department health.
 */
export function renderCompanySnapshotSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  const overallScore = ctx.overallHealth.score;
  const overallBand = ctx.overallHealth.band || getScoreBandFromScore(overallScore);

  // Calculate department-specific health
  const allDimensions = [...recipe.primaryDimensions, ...recipe.secondaryDimensions];
  const departmentScore = computeDepartmentHealthScore(
    Object.fromEntries(ctx.chapters.map(ch => [ch.code, ch])),
    allDimensions
  );
  const departmentBand = getScoreBandFromScore(departmentScore);

  const overallGauge = generateGaugeChartSVG({
    value: overallScore,
    maxValue: 100,
    label: 'Company Health',
  }, {
    width: 150,
    height: 100,
    showValue: true,
    showLabel: true,
  });

  const departmentGauge = generateGaugeChartSVG({
    value: departmentScore,
    maxValue: 100,
    label: 'Department Health',
  }, {
    width: 150,
    height: 100,
    showValue: true,
    showLabel: true,
  });

  return `
    <section id="company-snapshot" class="report-section">
      <h2>Company Health Snapshot</h2>

      <div class="health-gauges-row" style="display: flex; gap: 48px; justify-content: center; margin: 32px 0;">
        <div class="gauge-container">
          ${overallGauge}
          <p class="gauge-context" style="text-align: center; margin-top: 8px;">Overall Business Health</p>
        </div>
        <div class="gauge-container">
          ${departmentGauge}
          <p class="gauge-context" style="text-align: center; margin-top: 8px;">Your Department's Health</p>
        </div>
      </div>

      <div class="snapshot-summary">
        <h3>Key Context for ${recipe.title.replace(' Report', '')}</h3>
        <ul>
          <li>Company overall health: <span class="score-value" style="font-weight: 700; color: ${getScoreColor(overallScore)};">${Math.round(overallScore)}/100</span> (${overallBand})</li>
          <li>Your department health: <span class="score-value" style="font-weight: 700; color: ${getScoreColor(departmentScore)};">${Math.round(departmentScore)}/100</span> (${departmentBand})</li>
          <li>Primary focus areas: ${recipe.primaryDimensions.map(d => getDimensionName(d)).join(', ')}</li>
        </ul>
      </div>

      <div class="department-impact-callout" style="background: #f8f9fa; padding: 16px; border-left: 4px solid ${options.brand.primaryColor}; margin-top: 24px;">
        <strong>Your Department's Impact:</strong>
        <p style="margin: 8px 0 0 0;">As ${recipe.targetAudience.split(',')[0]}, your focus areas directly influence company performance in ${recipe.focusAreas.slice(0, 2).join(' and ').replace(/_/g, ' ')}.</p>
      </div>
    </section>
  `;
}

/**
 * Render dimension deep-dive sections for the manager's relevant dimensions.
 */
export function renderDimensionDeepDiveSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  const sections: string[] = [];
  const chaptersMap = Object.fromEntries(ctx.chapters.map(ch => [ch.code, ch]));

  // Primary dimensions get full deep-dive
  for (const dimCode of recipe.primaryDimensions) {
    const dimData = getDimensionFromChapters(chaptersMap, dimCode);
    if (!dimData) continue;

    const { dimension, chapter } = dimData;

    const gaugeSvg = generateGaugeChartSVG({
      value: dimension.score || 0,
      maxValue: 100,
      label: dimension.name || dimCode,
    }, {
      width: 120,
      height: 80,
      showValue: true,
      showLabel: true,
    });

    // Get dimension-specific findings and recommendations
    const dimensionFindings = ctx.findings?.filter(f =>
      f.dimensionCode === dimCode || f.dimension === dimCode
    ) || [];
    const dimensionRecs = filterRecommendationsByDimensions(
      ctx.recommendations || [],
      [dimCode]
    );

    sections.push(`
      <div class="dimension-deep-dive primary-dimension" style="margin-bottom: 32px; padding: 24px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="color: ${options.brand.primaryColor}; margin: 0 0 16px 0;">${dimension.name || dimCode} (${dimCode})</h3>

        <div class="dimension-header" style="display: flex; gap: 24px; align-items: center; margin-bottom: 16px;">
          ${gaugeSvg}
          <div class="dimension-summary">
            <p style="margin: 0 0 4px 0;">Score: <span style="font-weight: 700; color: ${getScoreColor(dimension.score || 0)};">${Math.round(dimension.score || 0)}/100</span></p>
            <p style="margin: 0; color: #666;">Chapter: ${chapter.name || ''}</p>
          </div>
        </div>

        ${dimensionFindings.length > 0 ? `
          <div class="dimension-findings" style="margin-top: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 1rem;">Key Findings</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${dimensionFindings.slice(0, 3).map(f => `<li>${escapeHtml(safeString(f.description || f.finding || ''))}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${dimensionRecs.length > 0 ? `
          <div class="dimension-recommendations" style="margin-top: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 1rem;">Recommendations</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${dimensionRecs.slice(0, 3).map(r => `<li>${escapeHtml(safeString(r.title || r.recommendation || ''))}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `);
  }

  // Secondary dimensions get lighter treatment
  if (recipe.secondaryDimensions.length > 0) {
    const secondaryItems = recipe.secondaryDimensions.map(dimCode => {
      const dimData = getDimensionFromChapters(chaptersMap, dimCode);
      if (!dimData) return '';

      return `
        <div class="secondary-dimension-item" style="padding: 12px; background: #fff; border-radius: 4px; margin-bottom: 8px;">
          <span style="font-weight: 600;">${dimData.dimension.name || dimCode}</span>:
          <span style="font-weight: 700; color: ${getScoreColor(dimData.dimension.score || 0)};">${Math.round(dimData.dimension.score || 0)}/100</span>
        </div>
      `;
    }).filter(Boolean);

    if (secondaryItems.length > 0) {
      sections.push(`
        <div class="secondary-dimensions" style="margin-top: 24px;">
          <h4 style="margin: 0 0 12px 0;">Related Areas</h4>
          ${secondaryItems.join('')}
        </div>
      `);
    }
  }

  return `
    <section id="dimension-deep-dive" class="report-section">
      <h2>Dimension Analysis</h2>
      ${sections.join('')}
    </section>
  `;
}

/**
 * Render the department-specific roadmap section.
 */
export function renderDepartmentRoadmapSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  const allDimensions = [...recipe.primaryDimensions, ...recipe.secondaryDimensions];

  // Filter recommendations and quick wins for this department
  const departmentRecs = filterRecommendationsByDimensions(
    ctx.recommendations || [],
    allDimensions
  );
  const departmentQuickWins = filterQuickWinsByDimensions(
    ctx.quickWins || [],
    allDimensions
  );

  return `
    <section id="department-roadmap" class="report-section">
      <h2>Your Implementation Roadmap</h2>

      ${departmentQuickWins.length > 0 ? `
        <div class="quick-wins-section" style="margin-bottom: 32px;">
          <h3 style="color: ${options.brand.accentColor}; margin: 0 0 16px 0;">Quick Wins (0-30 Days)</h3>
          <ul class="quick-wins-list" style="list-style: none; padding: 0;">
            ${departmentQuickWins.slice(0, 5).map(qw => `
              <li class="quick-win-item" style="margin-bottom: 12px; padding: 12px; background: #f0f9f0; border-left: 4px solid ${options.brand.accentColor}; border-radius: 4px;">
                <strong>${escapeHtml(safeString(qw.title || qw.theme || qw.name || ''))}</strong>
                ${qw.impactScore ? `<span style="display: inline-block; padding: 2px 8px; background: #e3f2fd; border-radius: 12px; font-size: 0.8em; margin-left: 8px;">Impact: ${qw.impactScore}/10</span>` : ''}
                <p style="margin: 8px 0 0 0; color: #555;">${escapeHtml(safeString(qw.description || ''))}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : '<p>No department-specific quick wins identified.</p>'}

      ${departmentRecs.length > 0 ? `
        <div class="recommendations-section">
          <h3 style="color: ${options.brand.primaryColor}; margin: 0 0 16px 0;">Strategic Recommendations</h3>
          <ol class="recommendations-list" style="padding-left: 20px;">
            ${departmentRecs.slice(0, 5).map(rec => `
              <li class="recommendation-item" style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 4px;">
                <strong>${escapeHtml(safeString(rec.title || rec.recommendation || ''))}</strong>
                ${rec.priority ? `<span style="display: inline-block; padding: 2px 8px; background: #fff3e0; color: #e65100; border-radius: 12px; font-size: 0.8em; margin-left: 8px;">${rec.priority} Priority</span>` : ''}
                <p style="margin: 8px 0 0 0; color: #555;">${escapeHtml(safeString(rec.description || rec.rationale || ''))}</p>
              </li>
            `).join('')}
          </ol>
        </div>
      ` : '<p>No department-specific recommendations available.</p>'}
    </section>
  `;
}

/**
 * Render the risk overview section filtered for this department.
 */
export function renderRiskOverviewSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  const allDimensions = [...recipe.primaryDimensions, ...recipe.secondaryDimensions];

  const departmentRisks = filterRisksByDimensions(
    ctx.risks || [],
    allDimensions
  );

  // Group by severity
  const criticalRisks = departmentRisks.filter(r => {
    const sev = String(r.severity || '').toLowerCase();
    return sev === 'critical' || sev === '4' || sev === '5';
  });
  const highRisks = departmentRisks.filter(r => {
    const sev = String(r.severity || '').toLowerCase();
    return sev === 'high' || sev === '3';
  });

  return `
    <section id="risk-overview" class="report-section">
      <h2>Risk Overview</h2>

      ${criticalRisks.length > 0 ? `
        <div class="critical-risks" style="border-left: 4px solid #dc3545; padding-left: 16px; margin-bottom: 24px;">
          <h3 style="color: #dc3545; margin: 0 0 12px 0;">Critical Risks Requiring Immediate Attention</h3>
          ${criticalRisks.map(risk => `
            <div class="risk-item critical" style="margin-bottom: 12px; padding: 12px; background: #fff5f5; border-radius: 4px;">
              <strong>${escapeHtml(safeString(risk.title || risk.name || ''))}</strong>
              <p style="margin: 8px 0 0 0;">${escapeHtml(safeString(risk.description || ''))}</p>
              ${risk.mitigation ? `<p style="margin: 8px 0 0 0; font-style: italic;"><em>Mitigation:</em> ${escapeHtml(safeString(risk.mitigation || ''))}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${highRisks.length > 0 ? `
        <div class="high-risks" style="border-left: 4px solid #ffc107; padding-left: 16px; margin-bottom: 24px;">
          <h3 style="color: #856404; margin: 0 0 12px 0;">High Priority Risks</h3>
          ${highRisks.map(risk => `
            <div class="risk-item high" style="margin-bottom: 12px; padding: 12px; background: #fffbf0; border-radius: 4px;">
              <strong>${escapeHtml(safeString(risk.title || risk.name || ''))}</strong>
              <p style="margin: 8px 0 0 0;">${escapeHtml(safeString(risk.description || ''))}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${departmentRisks.length === 0 ? `
        <p class="no-risks-message" style="padding: 16px; background: #f0fff0; border-radius: 4px;">No significant department-specific risks identified. Continue monitoring as part of ongoing operations.</p>
      ` : ''}

      <div class="risk-summary" style="margin-top: 24px; padding: 12px; background: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0;"><strong>Total department-related risks:</strong> ${departmentRisks.length}</p>
      </div>
    </section>
  `;
}

/**
 * Render a metrics dashboard for the manager's KPIs.
 */
export function renderMetricsDashboardSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  const chaptersMap = Object.fromEntries(ctx.chapters.map(ch => [ch.code, ch]));

  // Build dimension score cards
  const dimensionScores = recipe.primaryDimensions.map(dimCode => {
    const dimData = getDimensionFromChapters(chaptersMap, dimCode);
    if (!dimData) return null;

    return {
      code: dimCode,
      name: dimData.dimension.name || dimCode,
      score: dimData.dimension.score || 0,
      benchmark: dimData.dimension.benchmark?.industryAverage || dimData.dimension.industryBenchmark || 60,
    };
  }).filter(Boolean) as Array<{code: string; name: string; score: number; benchmark: number}>;

  return `
    <section id="metrics-dashboard" class="report-section">
      <h2>Key Metrics Dashboard</h2>

      <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
        ${dimensionScores.map(dim => {
          const delta = dim.score - dim.benchmark;
          return `
          <div class="metric-card" style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">${escapeHtml(dim.name)}</h4>
            <div class="metric-score" style="font-size: 2em; font-weight: 700; color: ${getScoreColor(dim.score)};">
              ${Math.round(dim.score)}
            </div>
            <div class="metric-benchmark" style="font-size: 0.9em; color: #666; margin-top: 4px;">
              Industry avg: ${Math.round(dim.benchmark)}
            </div>
            <div class="metric-delta" style="font-size: 0.9em; color: ${delta >= 0 ? '#28a745' : '#dc3545'}; margin-top: 4px;">
              ${delta >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(delta))} points ${delta >= 0 ? 'above' : 'below'}
            </div>
          </div>
        `;
        }).join('')}
      </div>
    </section>
  `;
}

/**
 * Render the closing section with motivation and next steps.
 */
export function renderManagerClosingSection(
  ctx: ReportContext,
  recipe: ManagerRecipe,
  options: ReportRenderOptions
): string {
  return `
    <section id="manager-closing" class="report-section">
      <h2>Next Steps & Resources</h2>

      <div class="closing-content">
        <h3>You're Equipped for Impact</h3>
        <p>As ${recipe.targetAudience.split(',')[0]}, you play a critical role in driving ${recipe.focusAreas[0]?.replace(/_/g, ' ')} and overall business success. This report provides your roadmap for the next 90-180 days.</p>

        <h3 style="margin-top: 24px;">Recommended Actions</h3>
        <ol>
          <li><strong>Review Quick Wins:</strong> Identify 2-3 items to implement in the next 30 days</li>
          <li><strong>Schedule Team Alignment:</strong> Share relevant findings with your team</li>
          <li><strong>Set Metrics Targets:</strong> Establish quarterly goals based on benchmark gaps</li>
          <li><strong>Track Progress:</strong> Use the metrics dashboard as your ongoing scorecard</li>
        </ol>

        <h3 style="margin-top: 24px;">Cross-References</h3>
        <p>For deeper analysis, refer to:</p>
        <ul>
          <li><a href="comprehensive.html">Comprehensive Report</a> - Full business analysis</li>
          <li><a href="owner.html">Owner's Report</a> - Strategic overview and priorities</li>
          <li><a href="risk.html">Risk Report</a> - Complete risk assessment</li>
          <li><a href="roadmap.html">Roadmap Report</a> - Implementation timeline</li>
        </ul>
      </div>

      <div class="closing-motivation" style="background: linear-gradient(135deg, ${options.brand.primaryColor}, ${options.brand.accentColor}); color: white; padding: 24px; border-radius: 8px; margin-top: 32px; text-align: center;">
        <p style="font-size: 1.2em; font-weight: 600; margin: 0;">
          "Excellence is not a destination but a continuous journey."
        </p>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">
          — Your BizHealth.ai Assessment Team
        </p>
      </div>
    </section>
  `;
}

/**
 * Build an enhanced manager report using the recipe configuration.
 * This augments the base recipe report with department-specific filtering and visualizations.
 */
export async function buildEnhancedManagerReport(
  ctx: ReportContext,
  options: ReportRenderOptions,
  recipeId: string,
  reportType: Phase5ReportType
): Promise<GeneratedReport> {
  const recipe = getManagerRecipe(recipeId);

  if (!recipe) {
    // Fall back to standard recipe report if no enhanced recipe available
    return buildRecipeReport(ctx, options, recipeId, reportType);
  }

  // Generate enhanced sections based on recipe configuration
  const sectionHtml: string[] = [];

  for (const sectionType of recipe.sections) {
    switch (sectionType) {
      case 'companySnapshot':
        sectionHtml.push(renderCompanySnapshotSection(ctx, recipe, options));
        break;
      case 'dimensionDeepDive':
        sectionHtml.push(renderDimensionDeepDiveSection(ctx, recipe, options));
        break;
      case 'departmentRoadmap':
        sectionHtml.push(renderDepartmentRoadmapSection(ctx, recipe, options));
        break;
      case 'riskOverview':
        sectionHtml.push(renderRiskOverviewSection(ctx, recipe, options));
        break;
      case 'metricsDashboard':
        sectionHtml.push(renderMetricsDashboardSection(ctx, recipe, options));
        break;
      case 'managerClosing':
        sectionHtml.push(renderManagerClosingSection(ctx, recipe, options));
        break;
      default:
        // Unknown section type - skip
        logger.warn(`Unknown manager section type: ${sectionType}`);
    }
  }

  // Build the full HTML document
  const html = wrapHtmlDocument(`
    ${generateReportHeader(ctx, recipe.title, recipe.subtitle)}
    ${sectionHtml.join('\n')}
    ${generateReportFooter(ctx)}
  `, {
    title: `${recipe.title} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: generateEnhancedManagerStyles(options),
    ctx: ctx,
  });

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType,
    reportName: recipe.title,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 25, // Manager reports target ~25 pages
    sections: recipe.sections.map(s => ({
      id: s,
      title: s.replace(/([A-Z])/g, ' $1').trim(),
    })),
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType,
    reportName: recipe.title,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

/**
 * Generate enhanced styles for manager reports
 */
function generateEnhancedManagerStyles(options: ReportRenderOptions): string {
  const primaryColor = options.brand.primaryColor || '#212653';
  const accentColor = options.brand.accentColor || '#969423';

  return `
    :root {
      --biz-navy: ${primaryColor};
      --biz-green: ${accentColor};
    }

    .report-section {
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .report-section h2 {
      color: var(--biz-navy);
      font-family: 'Montserrat', sans-serif;
      margin: 0 0 24px 0;
    }

    .score-value {
      font-weight: 700;
      font-size: 1.1em;
    }

    .quick-win-item, .recommendation-item, .risk-item {
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    @media print {
      .report-section {
        page-break-inside: avoid;
      }
    }
  `;
}
