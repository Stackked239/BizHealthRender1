/**
 * BizHealth.ai Chart Accessibility Utilities
 *
 * Generates accessible content for chart visualizations including:
 * - ARIA labels for screen readers
 * - Alt text descriptions
 * - Data tables for detailed chart data access
 */

import type { ChartConfiguration, ChartDataset } from 'chart.js';

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate ARIA label for a chart
 */
export function generateChartAriaLabel(config: ChartConfiguration): string {
  const chartType = config.type || 'chart';
  const title = getChartTitle(config);
  const dataDescription = getChartDataDescription(config);

  if (title) {
    return `${title}. ${chartType} chart showing ${dataDescription}`;
  }

  return `${capitalizeFirst(chartType)} chart showing ${dataDescription}`;
}

/**
 * Generate alt text for a chart image
 */
export function generateChartAltText(config: ChartConfiguration): string {
  const chartType = config.type || 'chart';
  const title = getChartTitle(config);
  const summary = getChartSummary(config);

  if (title) {
    return `${title}: ${summary}`;
  }

  return `${capitalizeFirst(chartType)} visualization: ${summary}`;
}

/**
 * Generate data table HTML for screen readers
 */
export function generateChartDataTable(config: ChartConfiguration): string {
  const { data } = config;
  if (!data) return '';

  const labels = data.labels || [];
  const datasets = data.datasets || [];

  if (labels.length === 0 && datasets.length === 0) {
    return '';
  }

  const title = getChartTitle(config) || 'Chart Data';
  const chartType = config.type || 'chart';

  // Generate table based on chart type
  switch (chartType) {
    case 'radar':
    case 'polarArea':
      return generateRadarDataTable(title, labels, datasets);
    case 'pie':
    case 'doughnut':
      return generatePieDataTable(title, labels, datasets);
    case 'bar':
    case 'horizontalBar':
      return generateBarDataTable(title, labels, datasets, config.options);
    default:
      return generateDefaultDataTable(title, labels, datasets);
  }
}

/**
 * Generate data table for radar charts
 */
function generateRadarDataTable(
  title: string,
  labels: unknown[],
  datasets: ChartDataset[]
): string {
  const headers = ['Dimension', ...datasets.map(ds => ds.label || 'Value')];

  return `
    <table class="chart-data-table" aria-label="${escapeHtml(title)} data">
      <caption>${escapeHtml(title)}</caption>
      <thead>
        <tr>
          ${headers.map(h => `<th scope="col">${escapeHtml(String(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${labels.map((label, i) => `
          <tr>
            <th scope="row">${escapeHtml(String(label))}</th>
            ${datasets.map(ds => {
              const value = Array.isArray(ds.data) ? ds.data[i] : undefined;
              return `<td>${formatValue(value)}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Generate data table for pie/doughnut charts
 */
function generatePieDataTable(
  title: string,
  labels: unknown[],
  datasets: ChartDataset[]
): string {
  const dataset = datasets[0];
  if (!dataset || !Array.isArray(dataset.data)) return '';

  const total = (dataset.data as number[]).reduce((sum, val) => sum + (Number(val) || 0), 0);

  return `
    <table class="chart-data-table" aria-label="${escapeHtml(title)} data">
      <caption>${escapeHtml(title)}</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Value</th>
          <th scope="col">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${labels.map((label, i) => {
          const value = (dataset.data as number[])[i] || 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return `
            <tr>
              <th scope="row">${escapeHtml(String(label))}</th>
              <td>${formatValue(value)}</td>
              <td>${percentage}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td>${formatValue(total)}</td>
          <td>100%</td>
        </tr>
      </tfoot>
    </table>
  `;
}

/**
 * Generate data table for bar charts
 */
function generateBarDataTable(
  title: string,
  labels: unknown[],
  datasets: ChartDataset[],
  options?: any
): string {
  const isHorizontal = options?.indexAxis === 'y';
  const headers = ['Item', ...datasets.map(ds => ds.label || 'Value')];

  return `
    <table class="chart-data-table" aria-label="${escapeHtml(title)} data">
      <caption>${escapeHtml(title)}</caption>
      <thead>
        <tr>
          ${headers.map(h => `<th scope="col">${escapeHtml(String(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${labels.map((label, i) => `
          <tr>
            <th scope="row">${escapeHtml(String(label))}</th>
            ${datasets.map(ds => {
              const value = Array.isArray(ds.data) ? ds.data[i] : undefined;
              return `<td>${formatValue(value)}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Generate default data table for other chart types
 */
function generateDefaultDataTable(
  title: string,
  labels: unknown[],
  datasets: ChartDataset[]
): string {
  if (datasets.length === 1) {
    return generateSingleDatasetTable(title, labels, datasets[0]);
  }

  return generateMultiDatasetTable(title, labels, datasets);
}

/**
 * Generate table for single dataset
 */
function generateSingleDatasetTable(
  title: string,
  labels: unknown[],
  dataset: ChartDataset
): string {
  return `
    <table class="chart-data-table" aria-label="${escapeHtml(title)} data">
      <caption>${escapeHtml(title)}</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th scope="col">${escapeHtml(dataset.label || 'Value')}</th>
        </tr>
      </thead>
      <tbody>
        ${labels.map((label, i) => {
          const value = Array.isArray(dataset.data) ? dataset.data[i] : undefined;
          return `
            <tr>
              <th scope="row">${escapeHtml(String(label))}</th>
              <td>${formatValue(value)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Generate table for multiple datasets
 */
function generateMultiDatasetTable(
  title: string,
  labels: unknown[],
  datasets: ChartDataset[]
): string {
  const headers = ['Label', ...datasets.map(ds => ds.label || 'Dataset')];

  return `
    <table class="chart-data-table" aria-label="${escapeHtml(title)} data">
      <caption>${escapeHtml(title)}</caption>
      <thead>
        <tr>
          ${headers.map(h => `<th scope="col">${escapeHtml(String(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${labels.map((label, i) => `
          <tr>
            <th scope="row">${escapeHtml(String(label))}</th>
            ${datasets.map(ds => {
              const value = Array.isArray(ds.data) ? ds.data[i] : undefined;
              return `<td>${formatValue(value)}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Get chart title from configuration
 */
function getChartTitle(config: ChartConfiguration): string | undefined {
  const titleConfig = config.options?.plugins?.title;
  if (titleConfig && typeof titleConfig === 'object' && 'text' in titleConfig) {
    const text = titleConfig.text;
    return typeof text === 'string' ? text : Array.isArray(text) ? text.join(' ') : undefined;
  }
  return undefined;
}

/**
 * Get description of chart data for ARIA
 */
function getChartDataDescription(config: ChartConfiguration): string {
  const { data } = config;
  if (!data) return 'data visualization';

  const datasetCount = data.datasets?.length || 0;
  const labelCount = data.labels?.length || 0;

  if (datasetCount === 0) {
    return 'data visualization';
  }

  if (datasetCount === 1) {
    const datasetLabel = data.datasets?.[0]?.label;
    if (datasetLabel) {
      return `${datasetLabel} across ${labelCount} categories`;
    }
    return `${labelCount} data points`;
  }

  return `${datasetCount} datasets across ${labelCount} categories`;
}

/**
 * Get summary of chart data for alt text
 */
function getChartSummary(config: ChartConfiguration): string {
  const { data, type } = config;
  if (!data || !data.datasets?.length) {
    return 'No data available';
  }

  const dataset = data.datasets[0];
  if (!dataset.data || !Array.isArray(dataset.data)) {
    return 'Chart data';
  }

  const values = dataset.data.filter((v): v is number => typeof v === 'number');
  if (values.length === 0) {
    return 'Chart data';
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Find label for max value
  const maxIndex = values.indexOf(max);
  const maxLabel = data.labels?.[maxIndex];

  switch (type) {
    case 'radar':
      return `Scores ranging from ${formatValue(min)} to ${formatValue(max)}, highest: ${maxLabel || 'N/A'}`;
    case 'pie':
    case 'doughnut':
      return `Distribution across ${data.labels?.length || 0} categories, largest: ${maxLabel || 'N/A'}`;
    case 'bar':
      return `Values from ${formatValue(min)} to ${formatValue(max)}, highest: ${maxLabel || 'N/A'} at ${formatValue(max)}`;
    default:
      return `Data ranging from ${formatValue(min)} to ${formatValue(max)}, average: ${formatValue(avg)}`;
  }
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    // Round to 1 decimal place
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(value);
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate CSS for data tables (screen reader accessible)
 */
export function generateDataTableStyles(): string {
  return `
    /* Chart data table styles (visible when sr-only is removed for debugging) */
    .chart-data-table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
      font-size: 0.875rem;
    }

    .chart-data-table caption {
      font-weight: 600;
      text-align: left;
      padding: 0.5rem 0;
      color: #212653;
    }

    .chart-data-table th,
    .chart-data-table td {
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      text-align: left;
    }

    .chart-data-table thead th {
      background: #f8f9fa;
      font-weight: 600;
    }

    .chart-data-table tbody th {
      background: #fff;
      font-weight: 500;
    }

    .chart-data-table tfoot th,
    .chart-data-table tfoot td {
      background: #f8f9fa;
      font-weight: 600;
    }
  `;
}
