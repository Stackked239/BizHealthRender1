/**
 * BizHealth.ai Chart Renderer
 *
 * Server-side rendering of Chart.js configurations to static PNG images
 * for embedding in HTML reports. Uses chartjs-node-canvas for headless rendering.
 */

import { ChartJSNodeCanvas, ChartCallback } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';
import type {
  ChartRenderOptions,
  RenderedChart,
  ChartAccessibilityConfig,
} from './types/chart.types.js';
import { BIZHEALTH_CHART_THEME, DEFAULT_CHART_OPTIONS, applyTheme } from './chart-theme.js';
import { generateChartDataTable, generateChartAriaLabel, generateChartAltText } from './chart-accessibility.js';

// Default dimensions
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_DEVICE_PIXEL_RATIO = 2;

// Renderer instance cache (keyed by width-height)
const rendererCache = new Map<string, ChartJSNodeCanvas>();

/**
 * Get or create a ChartJSNodeCanvas instance for given dimensions
 */
function getRenderer(width: number, height: number): ChartJSNodeCanvas {
  const key = `${width}x${height}`;

  if (!rendererCache.has(key)) {
    const renderer = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
      plugins: {
        // Register any global plugins here if needed
      },
    });

    // Cache the renderer for reuse
    rendererCache.set(key, renderer);
  }

  return rendererCache.get(key)!;
}

/**
 * Apply BizHealth theme and defaults to chart configuration
 */
function prepareChartConfig(config: ChartConfiguration): ChartConfiguration {
  // Deep merge with theme defaults
  const themedConfig = applyTheme(config);

  // Ensure animation is disabled for static rendering
  themedConfig.options = {
    ...themedConfig.options,
    animation: false,
    responsive: false,
  };

  return themedConfig;
}

/**
 * Render a Chart.js configuration to a static image
 *
 * @param config - Chart.js configuration object
 * @param options - Rendering options (dimensions, format)
 * @param accessibility - Accessibility options (alt text, data table)
 * @returns RenderedChart with HTML and metadata
 */
export async function renderChart(
  config: ChartConfiguration,
  options: ChartRenderOptions = {},
  accessibility: ChartAccessibilityConfig = {}
): Promise<RenderedChart> {
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;

  try {
    // Get renderer for these dimensions
    const renderer = getRenderer(width, height);

    // Prepare configuration with theme
    const themedConfig = prepareChartConfig(config);

    // Render to PNG buffer
    const buffer = await renderer.renderToBuffer(themedConfig);

    // Convert to base64
    const base64Data = buffer.toString('base64');

    // Generate accessibility content
    const altText = accessibility.altText || generateChartAltText(config);
    const ariaLabel = accessibility.ariaLabel || generateChartAriaLabel(config);
    const dataTableHtml = accessibility.generateDataTable
      ? generateChartDataTable(config)
      : undefined;

    // Generate HTML with embedded image
    const html = generateChartHtml({
      base64Data,
      width,
      height,
      altText,
      ariaLabel,
      dataTableHtml,
    });

    return {
      html,
      base64Data,
      width,
      height,
      altText,
      ariaLabel,
      dataTableHtml,
    };
  } catch (error) {
    console.error('Chart rendering failed:', error);

    // Return fallback HTML
    return {
      html: generateFallbackHtml(config),
      width,
      height,
      altText: 'Chart visualization unavailable',
      ariaLabel: 'Chart could not be rendered',
    };
  }
}

/**
 * Render chart directly to PNG buffer (for advanced use cases)
 */
export async function renderChartToBuffer(
  config: ChartConfiguration,
  options: ChartRenderOptions = {}
): Promise<Buffer> {
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;

  const renderer = getRenderer(width, height);
  const themedConfig = prepareChartConfig(config);

  return renderer.renderToBuffer(themedConfig);
}

/**
 * Render chart to base64 data URL
 */
export async function renderChartToDataUrl(
  config: ChartConfiguration,
  options: ChartRenderOptions = {}
): Promise<string> {
  const buffer = await renderChartToBuffer(config, options);
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate HTML for embedded chart image
 */
function generateChartHtml(params: {
  base64Data: string;
  width: number;
  height: number;
  altText: string;
  ariaLabel: string;
  dataTableHtml?: string;
}): string {
  const { base64Data, width, height, altText, ariaLabel, dataTableHtml } = params;

  return `
    <div class="biz-chart-container" role="figure" aria-label="${escapeHtml(ariaLabel)}">
      <img
        src="data:image/png;base64,${base64Data}"
        alt="${escapeHtml(altText)}"
        width="${width}"
        height="${height}"
        style="max-width: 100%; height: auto; display: block;"
        loading="lazy"
      />
      ${dataTableHtml ? `
        <div class="sr-only" aria-hidden="false">
          ${dataTableHtml}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate fallback HTML when chart rendering fails
 */
function generateFallbackHtml(config: ChartConfiguration): string {
  const title = getChartTitle(config);

  return `
    <div class="biz-chart-fallback" role="img" aria-label="Chart unavailable">
      <div class="chart-fallback-icon">📊</div>
      <div class="chart-fallback-content">
        <span class="chart-fallback-title">${escapeHtml(title || 'Chart')}</span>
        <span class="chart-fallback-message">Visualization could not be rendered</span>
      </div>
    </div>
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
 * Generate CSS styles for chart containers
 */
export function generateChartStyles(): string {
  return `
    /* BizHealth Chart Container Styles */
    .biz-chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 1.5rem 0;
      padding: 1rem;
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .biz-chart-container img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    /* Fallback styles */
    .biz-chart-fallback {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: #F8F9FA;
      border: 2px dashed #DEE2E6;
      border-radius: 8px;
      color: #6C757D;
      min-height: 200px;
      justify-content: center;
    }

    .chart-fallback-icon {
      font-size: 2.5rem;
    }

    .chart-fallback-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .chart-fallback-title {
      font-weight: 600;
      font-size: 1rem;
      color: #495057;
    }

    .chart-fallback-message {
      font-size: 0.875rem;
      font-style: italic;
    }

    /* Chart grid layout */
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin: 2rem 0;
    }

    .chart-grid-1 {
      grid-template-columns: 1fr;
    }

    .chart-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .chart-cell {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .chart-cell h3,
    .chart-cell h4 {
      margin: 0 0 1rem 0;
      font-family: 'Montserrat', Arial, sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${BIZHEALTH_CHART_THEME.colors.primary};
      text-align: center;
    }

    /* Screen reader only content */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Print styles */
    @media print {
      .biz-chart-container {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #DEE2E6;
        margin: 1rem 0;
      }

      .biz-chart-fallback {
        page-break-inside: avoid;
      }

      .chart-grid {
        page-break-inside: avoid;
      }

      .chart-cell {
        box-shadow: none;
        border: 1px solid #DEE2E6;
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .chart-grid,
      .chart-grid-3 {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Clear renderer cache (useful for testing or memory management)
 */
export function clearRendererCache(): void {
  rendererCache.clear();
}
