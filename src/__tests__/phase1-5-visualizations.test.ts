/**
 * Phase 1.5 Visualization Tests
 *
 * Tests for:
 * - VisualizationRenderer service
 * - Various chart type renderers
 * - Chart theme and color utilities
 */

import { describe, it, expect } from 'vitest';

import { VisualizationRenderer, visualizationRenderer } from '../orchestration/reports/visualization-renderer.service.js';
import type { VisualizationSpec, VizType, DataPoint } from '../contracts/visualization.contract.js';
import { BIZHEALTH_CHART_THEME, getScoreBandColor, getScoreBandName } from '../orchestration/reports/charts/chart-theme.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createDataPoint = (overrides: Partial<DataPoint> = {}): DataPoint => ({
  label: 'Test Label',
  value: 75,
  ...overrides
});

const createVisualizationSpec = (vizType: VizType, overrides: Partial<VisualizationSpec> = {}): VisualizationSpec => ({
  vizType,
  vizId: `test-${vizType}-001`,
  title: `Test ${vizType} Chart`,
  data: [createDataPoint()],
  ...overrides
});

// ============================================================================
// VisualizationRenderer Instance Tests
// ============================================================================

describe('VisualizationRenderer', () => {
  it('should export a singleton instance', () => {
    expect(visualizationRenderer).toBeInstanceOf(VisualizationRenderer);
  });

  it('should render with container wrapper', () => {
    const spec = createVisualizationSpec('gauge');
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('visualization-container');
    expect(html).toContain('data-viz-type="gauge"');
    expect(html).toContain('data-viz-id="test-gauge-001"');
  });

  it('should include title in header', () => {
    const spec = createVisualizationSpec('gauge', { title: 'My Custom Title' });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('My Custom Title');
    expect(html).toContain('viz-title');
  });

  it('should include subtitle when provided', () => {
    const spec = createVisualizationSpec('gauge', { subtitle: 'My Subtitle' });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('My Subtitle');
    expect(html).toContain('viz-subtitle');
  });

  it('should include source in footer when provided', () => {
    const spec = createVisualizationSpec('gauge', {
      metadata: { source: 'BizHealth Assessment' }
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Source: BizHealth Assessment');
    expect(html).toContain('viz-footer');
  });
});

// ============================================================================
// Gauge Chart Tests
// ============================================================================

describe('Gauge Chart Renderer', () => {
  it('should render gauge SVG', () => {
    const spec = createVisualizationSpec('gauge', {
      data: [createDataPoint({ value: 75 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('</svg>');
    expect(html).toContain('gauge-container');
  });

  it('should display score value', () => {
    const spec = createVisualizationSpec('gauge', {
      data: [createDataPoint({ value: 85 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('>85</text>');
  });

  it('should display band name', () => {
    const spec = createVisualizationSpec('gauge', {
      data: [createDataPoint({ value: 85 })]
    });
    const html = visualizationRenderer.render(spec);

    // 85 should be "Excellence" band
    expect(html).toContain('Excellence');
  });

  it('should render arc path', () => {
    const spec = createVisualizationSpec('gauge');
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<path');
    expect(html).toContain('stroke-linecap="round"');
  });
});

// ============================================================================
// Bar Chart Tests
// ============================================================================

describe('Bar Chart Renderer', () => {
  it('should render bar chart SVG', () => {
    const spec = createVisualizationSpec('bar_chart', {
      data: [
        createDataPoint({ label: 'Item 1', value: 80 }),
        createDataPoint({ label: 'Item 2', value: 60 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('<rect');
  });

  it('should display labels', () => {
    const spec = createVisualizationSpec('bar_chart', {
      data: [createDataPoint({ label: 'Category A', value: 70 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Category A');
  });

  it('should display values', () => {
    const spec = createVisualizationSpec('bar_chart', {
      data: [createDataPoint({ label: 'Item', value: 65 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('>65');
  });

  it('should apply category colors', () => {
    const spec = createVisualizationSpec('bar_chart', {
      data: [createDataPoint({ category: 'strength', value: 80 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('fill=');
  });
});

// ============================================================================
// Horizontal Bar Chart Tests
// ============================================================================

describe('Horizontal Bar Chart Renderer', () => {
  it('should render horizontal bars', () => {
    const spec = createVisualizationSpec('horizontal_bar', {
      data: [
        createDataPoint({ label: 'Metric 1', value: 70 }),
        createDataPoint({ label: 'Metric 2', value: 55 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('Metric 1');
    expect(html).toContain('Metric 2');
  });

  it('should render benchmark lines when provided', () => {
    const spec = createVisualizationSpec('horizontal_bar', {
      data: [createDataPoint({ label: 'Metric', value: 70, benchmark: 80 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<line');
    expect(html).toContain('stroke-dasharray');
  });

  it('should include legend for benchmarks', () => {
    const spec = createVisualizationSpec('horizontal_bar', {
      data: [createDataPoint({ benchmark: 75 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Benchmark');
  });
});

// ============================================================================
// Radar Chart Tests
// ============================================================================

describe('Radar Chart Renderer', () => {
  it('should render radar chart with polygon', () => {
    const spec = createVisualizationSpec('radar_chart', {
      data: [
        createDataPoint({ label: 'STR', value: 75 }),
        createDataPoint({ label: 'SAL', value: 65 }),
        createDataPoint({ label: 'MKT', value: 80 }),
        createDataPoint({ label: 'CXP', value: 70 }),
        createDataPoint({ label: 'OPS', value: 72 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('<polygon');
  });

  it('should render grid circles', () => {
    const spec = createVisualizationSpec('radar_chart', {
      data: [
        createDataPoint({ label: 'A', value: 60 }),
        createDataPoint({ label: 'B', value: 70 }),
        createDataPoint({ label: 'C', value: 80 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<circle');
    expect(html).toContain('fill="none"');
  });

  it('should render axis labels', () => {
    const spec = createVisualizationSpec('radar_chart', {
      data: [
        createDataPoint({ label: 'Strategy', value: 60 }),
        createDataPoint({ label: 'Sales', value: 70 }),
        createDataPoint({ label: 'Marketing', value: 80 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Strategy');
    expect(html).toContain('Sales');
    expect(html).toContain('Marketing');
  });
});

// ============================================================================
// Heatmap Tests
// ============================================================================

describe('Heatmap Renderer', () => {
  it('should render heatmap grid', () => {
    const spec = createVisualizationSpec('heatmap', {
      data: [
        createDataPoint({ label: 'A', value: 30 }),
        createDataPoint({ label: 'B', value: 60 }),
        createDataPoint({ label: 'C', value: 90 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('<rect');
  });

  it('should display score values in cells', () => {
    const spec = createVisualizationSpec('heatmap', {
      data: [createDataPoint({ value: 85 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('>85</text>');
  });

  it('should render labels', () => {
    const spec = createVisualizationSpec('heatmap', {
      data: [
        createDataPoint({ label: 'Strategy' }),
        createDataPoint({ label: 'Sales' })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Strategy');
    expect(html).toContain('Sales');
  });
});

// ============================================================================
// Score Tiles Tests
// ============================================================================

describe('Score Tiles Renderer', () => {
  it('should render score tiles container', () => {
    const spec = createVisualizationSpec('score_tiles', {
      data: [
        createDataPoint({ label: 'Score 1', value: 75 }),
        createDataPoint({ label: 'Score 2', value: 80 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('display: flex');
    expect(html).toContain('flex-wrap: wrap');
  });

  it('should display tile values', () => {
    const spec = createVisualizationSpec('score_tiles', {
      data: [createDataPoint({ value: 88 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('>88');
  });

  it('should display trend indicators', () => {
    const spec = createVisualizationSpec('score_tiles', {
      data: [
        createDataPoint({ trend: 'up' }),
        createDataPoint({ trend: 'down' })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('&#9650;'); // Up arrow
    expect(html).toContain('&#9660;'); // Down arrow
  });
});

// ============================================================================
// KPI Card Tests
// ============================================================================

describe('KPI Card Renderer', () => {
  it('should render KPI card', () => {
    const spec = createVisualizationSpec('kpi_card', {
      data: [createDataPoint({ label: 'Overall Health', value: 72 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Overall Health');
    expect(html).toContain('>72');
  });

  it('should display benchmark when provided', () => {
    const spec = createVisualizationSpec('kpi_card', {
      data: [createDataPoint({ benchmark: 70 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Benchmark: 70');
  });

  it('should display trend indicator', () => {
    const spec = createVisualizationSpec('kpi_card', {
      data: [createDataPoint({ trend: 'up' })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Improving');
  });

  it('should handle empty data gracefully', () => {
    const spec = createVisualizationSpec('kpi_card', { data: [] });
    const html = visualizationRenderer.render(spec);

    // Should not throw, just return empty/minimal content
    expect(html).toContain('visualization-container');
  });
});

// ============================================================================
// Timeline Tests
// ============================================================================

describe('Timeline Renderer', () => {
  it('should render timeline phases', () => {
    const spec = createVisualizationSpec('timeline', {
      data: [
        createDataPoint({ label: 'Phase 1', value: 30 }),
        createDataPoint({ label: 'Phase 2', value: 60 }),
        createDataPoint({ label: 'Phase 3', value: 90 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Phase 1');
    expect(html).toContain('Phase 2');
    expect(html).toContain('Phase 3');
  });

  it('should display duration values', () => {
    const spec = createVisualizationSpec('timeline', {
      data: [createDataPoint({ value: 45, unit: 'days' })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('45');
    expect(html).toContain('days');
  });
});

// ============================================================================
// Comparison Matrix Tests
// ============================================================================

describe('Comparison Matrix Renderer', () => {
  it('should render table structure', () => {
    const spec = createVisualizationSpec('comparison_matrix', {
      data: [createDataPoint({ label: 'Metric', value: 75, benchmark: 70 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
  });

  it('should display column headers', () => {
    const spec = createVisualizationSpec('comparison_matrix', {
      data: [createDataPoint()]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Indicator');
    expect(html).toContain('Score');
    expect(html).toContain('Benchmark');
    expect(html).toContain('Trend');
  });

  it('should display trend arrows', () => {
    const spec = createVisualizationSpec('comparison_matrix', {
      data: [
        createDataPoint({ trend: 'up' }),
        createDataPoint({ trend: 'down' })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('color: green');
    expect(html).toContain('color: red');
  });
});

// ============================================================================
// Risk Matrix Tests
// ============================================================================

describe('Risk Matrix Renderer', () => {
  it('should render 3x3 grid', () => {
    const spec = createVisualizationSpec('risk_matrix', {
      data: [createDataPoint({ value: 50, secondaryValue: 50 })]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<svg');
    expect(html).toContain('<rect');
    expect(html).toContain('<line');
  });

  it('should display axis labels', () => {
    const spec = createVisualizationSpec('risk_matrix', {
      data: [createDataPoint()]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('Probability');
    expect(html).toContain('Impact');
  });

  it('should render risk items as circles', () => {
    const spec = createVisualizationSpec('risk_matrix', {
      data: [
        createDataPoint({ value: 80, secondaryValue: 80 }),
        createDataPoint({ value: 30, secondaryValue: 30 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    // Should have circles for risk items
    const circleCount = (html.match(/<circle/g) || []).length;
    expect(circleCount).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// Chart Theme Tests
// ============================================================================

describe('Chart Theme', () => {
  it('should export BizHealth chart theme', () => {
    expect(BIZHEALTH_CHART_THEME).toBeDefined();
    expect(BIZHEALTH_CHART_THEME.colors).toBeDefined();
    expect(BIZHEALTH_CHART_THEME.scoreBands).toBeDefined();
  });

  it('should have BizNavy primary color', () => {
    expect(BIZHEALTH_CHART_THEME.colors.primary).toBe('#212653');
  });

  it('should have score band colors', () => {
    expect(BIZHEALTH_CHART_THEME.scoreBands.excellence).toBeDefined();
    expect(BIZHEALTH_CHART_THEME.scoreBands.proficiency).toBeDefined();
    expect(BIZHEALTH_CHART_THEME.scoreBands.attention).toBeDefined();
    expect(BIZHEALTH_CHART_THEME.scoreBands.critical).toBeDefined();
  });
});

describe('getScoreBandColor', () => {
  it('should return critical color for scores 0-39', () => {
    expect(getScoreBandColor(0)).toBe(BIZHEALTH_CHART_THEME.scoreBands.critical);
    expect(getScoreBandColor(39)).toBe(BIZHEALTH_CHART_THEME.scoreBands.critical);
  });

  it('should return attention color for scores 40-59', () => {
    expect(getScoreBandColor(40)).toBe(BIZHEALTH_CHART_THEME.scoreBands.attention);
    expect(getScoreBandColor(59)).toBe(BIZHEALTH_CHART_THEME.scoreBands.attention);
  });

  it('should return proficiency color for scores 60-79', () => {
    expect(getScoreBandColor(60)).toBe(BIZHEALTH_CHART_THEME.scoreBands.proficiency);
    expect(getScoreBandColor(79)).toBe(BIZHEALTH_CHART_THEME.scoreBands.proficiency);
  });

  it('should return excellence color for scores 80-100', () => {
    expect(getScoreBandColor(80)).toBe(BIZHEALTH_CHART_THEME.scoreBands.excellence);
    expect(getScoreBandColor(100)).toBe(BIZHEALTH_CHART_THEME.scoreBands.excellence);
  });
});

describe('getScoreBandName', () => {
  it('should return Critical for scores 0-39', () => {
    expect(getScoreBandName(0)).toBe('Critical');
    expect(getScoreBandName(39)).toBe('Critical');
  });

  it('should return Needs Attention for scores 40-59', () => {
    expect(getScoreBandName(40)).toBe('Needs Attention');
    expect(getScoreBandName(59)).toBe('Needs Attention');
  });

  it('should return Proficiency for scores 60-79', () => {
    expect(getScoreBandName(60)).toBe('Proficiency');
    expect(getScoreBandName(79)).toBe('Proficiency');
  });

  it('should return Excellence for scores 80-100', () => {
    expect(getScoreBandName(80)).toBe('Excellence');
    expect(getScoreBandName(100)).toBe('Excellence');
  });
});

// ============================================================================
// renderAll Tests
// ============================================================================

describe('renderAll', () => {
  it('should render multiple visualizations', () => {
    const specs = [
      createVisualizationSpec('gauge', { vizId: 'gauge-1' }),
      createVisualizationSpec('bar_chart', { vizId: 'bar-1' })
    ];
    const html = visualizationRenderer.renderAll(specs);

    expect(html).toContain('data-viz-id="gauge-1"');
    expect(html).toContain('data-viz-id="bar-1"');
  });

  it('should handle empty array', () => {
    const html = visualizationRenderer.renderAll([]);

    expect(html).toBe('');
  });
});

// ============================================================================
// replacePlaceholders Tests
// ============================================================================

describe('replacePlaceholders', () => {
  it('should replace visualization placeholders', () => {
    const content = `
      <div>Before</div>
      <!-- VISUALIZATION_PLACEHOLDER_0 -->
      <div>After</div>
    `;
    const visualizations = [createVisualizationSpec('gauge')];

    const result = visualizationRenderer.replacePlaceholders(content, visualizations);

    expect(result).not.toContain('VISUALIZATION_PLACEHOLDER_0');
    expect(result).toContain('visualization-container');
  });

  it('should replace multiple placeholders', () => {
    const content = `
      <!-- VISUALIZATION_PLACEHOLDER_0 -->
      <!-- VISUALIZATION_PLACEHOLDER_1 -->
    `;
    const visualizations = [
      createVisualizationSpec('gauge', { vizId: 'viz-0' }),
      createVisualizationSpec('bar_chart', { vizId: 'viz-1' })
    ];

    const result = visualizationRenderer.replacePlaceholders(content, visualizations);

    expect(result).toContain('data-viz-id="viz-0"');
    expect(result).toContain('data-viz-id="viz-1"');
  });

  it('should preserve content when no placeholders', () => {
    const content = '<div>No placeholders here</div>';
    const visualizations = [createVisualizationSpec('gauge')];

    const result = visualizationRenderer.replacePlaceholders(content, visualizations);

    expect(result).toBe(content);
  });
});

// ============================================================================
// Fallback Data Table Tests
// ============================================================================

describe('Fallback Data Table Renderer', () => {
  it('should render unknown viz types as data table', () => {
    const spec = createVisualizationSpec('unknown_type' as VizType, {
      data: [
        createDataPoint({ label: 'Row 1', value: 100 }),
        createDataPoint({ label: 'Row 2', value: 200 })
      ]
    });
    const html = visualizationRenderer.render(spec);

    expect(html).toContain('<table');
    expect(html).toContain('Row 1');
    expect(html).toContain('Row 2');
    expect(html).toContain('>100');
    expect(html).toContain('>200');
  });
});
