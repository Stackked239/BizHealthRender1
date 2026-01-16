/**
 * BizHealth.ai Visual Components - Table Component
 *
 * Data tables with optional highlighting and sorting
 * Used for detailed data presentation and comparisons
 */

import {
  getScoreBand,
  type ScoreBand,
} from '../../utils/color-utils.js';
import {
  getStatusSymbol,
  generateTableDescription,
} from '../../utils/accessibility-utils.js';

/**
 * Table component props
 */
export interface TableProps {
  /** Column headers */
  headers: string[];
  /** Data rows (each row is an array of cell values) */
  rows: Array<Array<string | number>>;
  /** Column index to apply status highlighting (0-based) */
  highlightColumn?: number;
  /** Make table sortable (future feature) */
  sortable?: boolean;
  /** Alternate row backgrounds */
  striped?: boolean;
  /** Compact padding */
  compact?: boolean;
  /** Optional table title/caption */
  title?: string;
  /** Optional footer row */
  footer?: Array<string | number>;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text && text !== 0) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get highlight class for a score value
 */
function getHighlightClass(value: string | number): { class: string; band: ScoreBand | null } {
  const numValue = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(numValue)) {
    return { class: '', band: null };
  }

  // Assume scores are 0-100
  if (numValue >= 0 && numValue <= 100) {
    const band = getScoreBand(numValue);
    return { class: `biz-table__cell--${band}`, band };
  }

  return { class: '', band: null };
}

/**
 * Render table component
 */
export function renderTable(props: TableProps): string {
  const {
    headers,
    rows,
    highlightColumn,
    sortable = false,
    striped = true,
    compact = false,
    title,
    footer,
  } = props;

  const tableClass = [
    'biz-table',
    striped ? 'biz-table--striped' : '',
    compact ? 'biz-table--compact' : '',
  ].filter(Boolean).join(' ');

  const description = generateTableDescription(rows.length, headers.length, title);

  // Render header row
  const headerCells = headers.map((header, index) => `
    <th scope="col" ${sortable ? 'role="columnheader" aria-sort="none"' : ''}>
      ${escapeHtml(header)}
    </th>
  `).join('');

  // Render data rows
  const dataRows = rows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const isHighlightCol = highlightColumn !== undefined && colIndex === highlightColumn;
      const highlight = isHighlightCol ? getHighlightClass(cell) : { class: '', band: null };
      const symbol = highlight.band ? getStatusSymbol(highlight.band) : '';

      return `
        <td class="${highlight.class}">
          ${escapeHtml(cell)}
          ${isHighlightCol && symbol ? ` <span aria-hidden="true">${symbol}</span>` : ''}
        </td>
      `;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  // Render footer row if provided
  const footerRow = footer ? `
    <tfoot>
      <tr>
        ${footer.map(cell => `<td style="font-weight: 600;">${escapeHtml(cell)}</td>`).join('')}
      </tr>
    </tfoot>
  ` : '';

  return `
    <div class="biz-table-container">
      ${title ? `
        <h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 12px;">
          ${escapeHtml(title)}
        </h4>
      ` : ''}
      <table class="${tableClass}" role="table" aria-label="${escapeHtml(description)}">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
        ${footerRow}
      </table>
    </div>
  `;
}

/**
 * Render a dimension scores table
 */
export function renderDimensionScoresTable(
  dimensions: Array<{
    name: string;
    score: number;
    band?: ScoreBand;
    benchmark?: number;
    trajectory?: 'improving' | 'flat' | 'declining';
  }>,
  title?: string
): string {
  const hasBenchmark = dimensions.some(d => d.benchmark !== undefined);
  const hasTrajectory = dimensions.some(d => d.trajectory !== undefined);

  const headers = ['Dimension', 'Score'];
  if (hasBenchmark) headers.push('Benchmark');
  if (hasTrajectory) headers.push('Trend');

  const rows = dimensions.map(dim => {
    const row: Array<string | number> = [dim.name, dim.score];
    if (hasBenchmark) row.push(dim.benchmark !== undefined ? dim.benchmark : '-');
    if (hasTrajectory) {
      const trendSymbol = dim.trajectory === 'improving' ? '+' : dim.trajectory === 'declining' ? '-' : '=';
      row.push(dim.trajectory ? `${trendSymbol} ${dim.trajectory}` : '-');
    }
    return row;
  });

  return renderTable({
    headers,
    rows,
    highlightColumn: 1,
    striped: true,
    compact: false,
    title: title || 'Dimension Scores',
  });
}

/**
 * Render a findings summary table
 */
export function renderFindingsTable(
  findings: Array<{
    type: 'strength' | 'gap' | 'risk' | 'opportunity';
    dimension: string;
    title: string;
    impact: 'high' | 'medium' | 'low';
  }>,
  title?: string
): string {
  const typeLabels = {
    strength: '✅ Strength',
    gap: '❌ Gap',
    risk: '⚠️ Risk',
    opportunity: '💡 Opportunity',
  };

  const impactColors = {
    high: '#EF4444',
    medium: '#EAB308',
    low: '#22C55E',
  };

  const headers = ['Type', 'Dimension', 'Finding', 'Impact'];
  const rows = findings.map(f => [
    typeLabels[f.type],
    f.dimension,
    f.title,
    f.impact.toUpperCase(),
  ]);

  return renderTable({
    headers,
    rows,
    striped: true,
    compact: false,
    title: title || 'Key Findings',
  });
}

/**
 * Render a recommendations table
 */
export function renderRecommendationsTable(
  recommendations: Array<{
    title: string;
    dimension: string;
    horizon: '90_days' | '12_months' | '24_months_plus';
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact: number;
    effort: number;
  }>,
  title?: string
): string {
  const horizonLabels = {
    '90_days': '90 Days',
    '12_months': '12 Months',
    '24_months_plus': '24+ Months',
  };

  const headers = ['Recommendation', 'Dimension', 'Timeline', 'Priority', 'Impact', 'Effort'];
  const rows = recommendations.map(rec => [
    rec.title,
    rec.dimension,
    horizonLabels[rec.horizon],
    rec.priority.toUpperCase(),
    rec.impact,
    rec.effort,
  ]);

  return renderTable({
    headers,
    rows,
    highlightColumn: 4,
    striped: true,
    compact: false,
    title: title || 'Strategic Recommendations',
  });
}

/**
 * Render a comparison table (before/after, client/benchmark)
 */
export function renderComparisonTable(
  items: Array<{
    label: string;
    valueA: number | string;
    valueB: number | string;
    delta?: number | string;
  }>,
  columnLabels: { labelCol: string; colA: string; colB: string; deltaCol?: string },
  title?: string
): string {
  const showDelta = items.some(item => item.delta !== undefined);

  const headers = [columnLabels.labelCol, columnLabels.colA, columnLabels.colB];
  if (showDelta && columnLabels.deltaCol) {
    headers.push(columnLabels.deltaCol);
  }

  const rows = items.map(item => {
    const row: Array<string | number> = [item.label, item.valueA, item.valueB];
    if (showDelta && item.delta !== undefined) {
      row.push(item.delta);
    }
    return row;
  });

  return renderTable({
    headers,
    rows,
    striped: true,
    compact: false,
    title,
  });
}

/**
 * Render a simple key-value table
 */
export function renderKeyValueTable(
  items: Array<{ key: string; value: string | number }>,
  title?: string
): string {
  const headers = ['Metric', 'Value'];
  const rows = items.map(item => [item.key, item.value]);

  return renderTable({
    headers,
    rows,
    striped: true,
    compact: true,
    title,
  });
}

/**
 * Render a risk register table
 */
export function renderRiskRegisterTable(
  risks: Array<{
    id: string;
    title: string;
    dimension: string;
    likelihood: 1 | 2 | 3 | 4 | 5;
    impact: 1 | 2 | 3 | 4 | 5;
    mitigation: string;
  }>,
  title?: string
): string {
  const headers = ['ID', 'Risk', 'Dimension', 'L', 'I', 'Score', 'Mitigation'];
  const rows = risks.map(risk => {
    const riskScore = risk.likelihood * risk.impact;
    return [
      risk.id,
      risk.title,
      risk.dimension,
      risk.likelihood,
      risk.impact,
      riskScore,
      risk.mitigation,
    ];
  });

  return renderTable({
    headers,
    rows,
    highlightColumn: 5,
    striped: true,
    compact: false,
    title: title || 'Risk Register',
  });
}
