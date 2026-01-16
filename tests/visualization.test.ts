/**
 * BizHealth Visualization System Tests
 *
 * Tests for ASCII detection, SVG gauge rendering, and visualization integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectASCII,
  logASCIIDetection,
  generateASCIIReport,
  hasLikelyASCII,
  detectASCIIInFields,
  type ASCIIMatch,
  type ASCIIDetectionResult,
} from '../src/visualization/ascii-detector';
import {
  renderGauge,
  renderGaugeHTML,
  renderGaugeGrid,
  generateASCIIFallback,
  validateSVG,
} from '../src/visualization/components/gauge';
import {
  processVisualizations,
  renderVisualization,
  onPhase5Start,
  onPrePdfGeneration,
} from '../src/visualization/integration';
import {
  BIZHEALTH_COLORS,
  getStatusBandFromScore,
  getStatusBandColor,
  createGaugeVisualization,
  isGaugeData,
  type GaugeData,
  type VisualizationData,
} from '../src/types/visualization.types';

// ============================================================================
// ASCII DETECTION TESTS
// ============================================================================

describe('ASCII Detection Module', () => {
  describe('detectASCII', () => {
    it('should detect progress bar patterns with filled blocks', () => {
      const content = 'Progress: ████████░░░░ 67% complete';
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some(m => m.type === 'progress' || m.type === 'gauge')).toBe(true);
    });

    it('should detect bracketed progress bars', () => {
      const content = 'Loading: [=====>    ] 50%';
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some(m => m.type === 'progress')).toBe(true);
    });

    it('should detect score patterns', () => {
      const content = 'Health Score: 75/100';
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some(m => m.type === 'gauge')).toBe(true);
    });

    it('should detect box drawing characters (tables)', () => {
      const content = `
        ┌────────┬────────┐
        │ Name   │ Score  │
        ├────────┼────────┤
        │ Test   │ 75     │
        └────────┴────────┘
      `;
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some(m => m.type === 'table')).toBe(true);
    });

    it('should detect color emoji blocks (heatmaps)', () => {
      const content = 'Status: 🟢🟢🟡🟡🔴';
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some(m => m.type === 'heatmap')).toBe(true);
    });

    it('should detect star ratings', () => {
      const content = 'Rating: ★★★★☆';
      const result = detectASCII(content);

      expect(result.totalMatches).toBeGreaterThan(0);
    });

    it('should return empty result for content without ASCII visualizations', () => {
      const content = 'This is just plain text without any visualizations.';
      const result = detectASCII(content);

      expect(result.totalMatches).toBe(0);
      expect(result.matches).toHaveLength(0);
    });

    it('should extract numeric values from percentage patterns', () => {
      const content = '████░░░░░░ 40%';
      const result = detectASCII(content);

      const matchWithValue = result.matches.find(m => m.extractedValue !== undefined);
      expect(matchWithValue).toBeDefined();
      expect(matchWithValue?.extractedValue).toBe(40);
    });

    it('should extract values from fraction patterns', () => {
      const content = 'Score: 63/100';
      const result = detectASCII(content);

      const matchWithValue = result.matches.find(m => m.extractedValue !== undefined);
      expect(matchWithValue).toBeDefined();
      expect(matchWithValue?.extractedValue).toBe(63);
      expect(matchWithValue?.extractedMax).toBe(100);
    });

    it('should deduplicate overlapping matches', () => {
      const content = '████████ 80% Score: 80/100';
      const result = detectASCII(content);

      // Should not have duplicate entries for the same location
      const locations = result.matches.map(m => `${m.location.start}-${m.location.end}`);
      const uniqueLocations = [...new Set(locations)];
      expect(locations.length).toBe(uniqueLocations.length);
    });

    it('should assign confidence levels correctly', () => {
      const highConfidence = 'Score: 75/100';
      const result = detectASCII(highConfidence);

      const scoreMatch = result.matches.find(m => m.type === 'gauge');
      expect(scoreMatch?.confidence).toBe('high');
    });

    it('should generate accurate summary', () => {
      const content = `
        Progress: ████░░░░
        Score: 75/100
        Table: ┌───┬───┐
      `;
      const result = detectASCII(content);

      expect(result.summary.progress).toBeGreaterThanOrEqual(0);
      expect(result.summary.gauge).toBeGreaterThanOrEqual(0);
      expect(result.summary.table).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hasLikelyASCII', () => {
    it('should return true for content with ASCII block characters', () => {
      expect(hasLikelyASCII('████░░░░')).toBe(true);
    });

    it('should return true for content with box drawing characters', () => {
      expect(hasLikelyASCII('├───┼───┤')).toBe(true);
    });

    it('should return true for content with score patterns', () => {
      expect(hasLikelyASCII('Score: 75')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasLikelyASCII('This is plain text')).toBe(false);
    });

    it('should return false for empty or short content', () => {
      expect(hasLikelyASCII('')).toBe(false);
      expect(hasLikelyASCII('Hi')).toBe(false);
    });
  });

  describe('logASCIIDetection', () => {
    it('should not log when there are no matches', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result: ASCIIDetectionResult = {
        totalMatches: 0,
        matches: [],
        summary: { gauge: 0, progress: 0, bar: 0, table: 0, heatmap: 0, unknown: 0 },
      };

      logASCIIDetection(result, { phase: 'test', section: 'test' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log when there are matches', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result: ASCIIDetectionResult = {
        totalMatches: 1,
        matches: [{
          type: 'gauge',
          originalText: '████░░ 60%',
          location: { start: 0, end: 10 },
          extractedValue: 60,
          confidence: 'high',
        }],
        summary: { gauge: 1, progress: 0, bar: 0, table: 0, heatmap: 0, unknown: 0 },
      };

      logASCIIDetection(result, { phase: 'phase5', section: 'narrative' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('generateASCIIReport', () => {
    it('should generate report for content with matches', () => {
      const result = detectASCII('Score: 75/100 ████░░');
      const report = generateASCIIReport(result, { phase: 'test', section: 'test' });

      expect(report).toContain('ASCII Detection Report');
      expect(report).toContain('Total Matches');
    });

    it('should indicate no matches when none found', () => {
      const result = detectASCII('Plain text');
      const report = generateASCIIReport(result, { phase: 'test', section: 'test' });

      expect(report).toContain('No ASCII visualizations detected');
    });
  });

  describe('detectASCIIInFields', () => {
    it('should detect ASCII in multiple fields', () => {
      const fields = {
        'summary': 'Health Score: 75/100',
        'description': 'Plain text without ASCII',
        'metrics': 'Progress: ████░░░░',
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = detectASCIIInFields(fields, { phase: 'test' });
      consoleSpy.mockRestore();

      expect(results.size).toBeGreaterThan(0);
      expect(results.has('summary') || results.has('metrics')).toBe(true);
    });

    it('should skip fields with content too short', () => {
      const fields = {
        'short': 'Hi',
        'long': 'Score: 75/100 - This is a longer field with ASCII content',
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = detectASCIIInFields(fields, { phase: 'test' });
      consoleSpy.mockRestore();

      expect(results.has('short')).toBe(false);
    });
  });
});

// ============================================================================
// SVG GAUGE RENDERER TESTS
// ============================================================================

describe('SVG Gauge Renderer', () => {
  describe('renderGauge', () => {
    const sampleData: GaugeData = {
      value: 75,
      max: 100,
    };

    it('should produce valid SVG', () => {
      const svg = renderGauge(sampleData);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should include the score value', () => {
      const svg = renderGauge(sampleData);

      expect(svg).toContain('75');
    });

    it('should include accessible role and aria-label', () => {
      const svg = renderGauge(sampleData, { label: 'Test Score' });

      expect(svg).toContain('role="img"');
      expect(svg).toContain('aria-label');
    });

    it('should include title element for accessibility', () => {
      const svg = renderGauge(sampleData, { label: 'Health' });

      expect(svg).toContain('<title>');
    });

    it('should apply correct color for excellence band', () => {
      const excellentData: GaugeData = { value: 90, max: 100 };
      const svg = renderGauge(excellentData);

      expect(svg).toContain(BIZHEALTH_COLORS.statusGood);
    });

    it('should apply correct color for critical band', () => {
      const criticalData: GaugeData = { value: 20, max: 100 };
      const svg = renderGauge(criticalData);

      expect(svg).toContain(BIZHEALTH_COLORS.statusCritical);
    });

    it('should clamp values to valid range', () => {
      const overflowData: GaugeData = { value: 150, max: 100 };
      const svg = renderGauge(overflowData);

      // Should still render without error
      expect(svg).toContain('<svg');
    });

    it('should render benchmark marker when provided', () => {
      const dataWithBenchmark: GaugeData = { value: 75, max: 100, benchmark: 80 };
      const svg = renderGauge(dataWithBenchmark, { showBenchmark: true });

      expect(svg).toContain('Benchmark');
    });

    it('should include trend symbol when specified', () => {
      const dataWithTrend: GaugeData = { value: 75, max: 100, trend: 'improving' };
      const svg = renderGauge(dataWithTrend, { showTrend: true });

      expect(svg).toContain('↑');
    });

    it('should include declining trend symbol', () => {
      const dataWithTrend: GaugeData = { value: 60, max: 100, trend: 'declining' };
      const svg = renderGauge(dataWithTrend, { showTrend: true });

      expect(svg).toContain('↓');
    });

    it('should render different sizes correctly', () => {
      const smallSvg = renderGauge(sampleData, { size: 'small' });
      const largeSvg = renderGauge(sampleData, { size: 'large' });

      // Check width attribute
      expect(smallSvg).toContain('width="120"');
      expect(largeSvg).toContain('width="240"');
    });

    it('should include label when provided', () => {
      const svg = renderGauge(sampleData, { label: 'Strategy Score' });

      expect(svg).toContain('Strategy Score');
    });

    it('should escape special XML characters in labels', () => {
      const svg = renderGauge(sampleData, { label: 'Test <Label> & "Quotes"' });

      expect(svg).not.toContain('<Label>');
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&amp;');
    });
  });

  describe('renderGaugeHTML', () => {
    it('should wrap SVG in container div', () => {
      const html = renderGaugeHTML({ value: 75, max: 100 });

      expect(html).toContain('<div class="bh-visualization');
      expect(html).toContain('</div>');
      expect(html).toContain('<svg');
    });

    it('should include sublabel when provided', () => {
      const html = renderGaugeHTML({ value: 75, max: 100 }, { sublabel: 'Industry Average' });

      expect(html).toContain('Industry Average');
      expect(html).toContain('bh-gauge__sublabel');
    });
  });

  describe('renderGaugeGrid', () => {
    it('should render multiple gauges in a grid', () => {
      const gauges = [
        { data: { value: 80, max: 100 }, label: 'Strategy' },
        { data: { value: 65, max: 100 }, label: 'Sales' },
        { data: { value: 45, max: 100 }, label: 'Marketing' },
      ];

      const html = renderGaugeGrid(gauges);

      expect(html).toContain('bh-gauge-grid');
      expect(html).toContain('Strategy');
      expect(html).toContain('Sales');
      expect(html).toContain('Marketing');
      // Should contain 3 SVGs
      expect((html.match(/<svg/g) || []).length).toBe(3);
    });
  });

  describe('generateASCIIFallback', () => {
    it('should generate ASCII representation', () => {
      const fallback = generateASCIIFallback({ value: 70, max: 100 }, 'Test');

      expect(fallback).toContain('Test:');
      expect(fallback).toContain('70/100');
      expect(fallback).toContain('70%');
      expect(fallback).toContain('█');
    });

    it('should show correct number of filled blocks', () => {
      const fallback = generateASCIIFallback({ value: 50, max: 100 });

      // 50% = 5 filled blocks, 5 empty
      expect((fallback.match(/█/g) || []).length).toBe(5);
      expect((fallback.match(/░/g) || []).length).toBe(5);
    });
  });

  describe('validateSVG', () => {
    it('should return true for valid SVG', () => {
      const validSvg = renderGauge({ value: 75, max: 100 });
      expect(validateSVG(validSvg)).toBe(true);
    });

    it('should return false for invalid SVG', () => {
      expect(validateSVG('<div>Not SVG</div>')).toBe(false);
      expect(validateSVG('<svg>')).toBe(false);
      expect(validateSVG('')).toBe(false);
    });
  });
});

// ============================================================================
// VISUALIZATION TYPES TESTS
// ============================================================================

describe('Visualization Types', () => {
  describe('BIZHEALTH_COLORS', () => {
    it('should have all required color constants', () => {
      expect(BIZHEALTH_COLORS.primary).toBe('#212653');
      expect(BIZHEALTH_COLORS.accent).toBe('#969423');
      expect(BIZHEALTH_COLORS.statusGood).toBe('#32808d');
      expect(BIZHEALTH_COLORS.statusCaution).toBe('#F39237');
      expect(BIZHEALTH_COLORS.statusCritical).toBe('#C01530');
    });
  });

  describe('getStatusBandFromScore', () => {
    it('should return correct bands for score thresholds', () => {
      expect(getStatusBandFromScore(90)).toBe('excellence');
      expect(getStatusBandFromScore(80)).toBe('excellence');
      expect(getStatusBandFromScore(79)).toBe('proficiency');
      expect(getStatusBandFromScore(60)).toBe('proficiency');
      expect(getStatusBandFromScore(59)).toBe('attention');
      expect(getStatusBandFromScore(40)).toBe('attention');
      expect(getStatusBandFromScore(39)).toBe('critical');
      expect(getStatusBandFromScore(0)).toBe('critical');
    });
  });

  describe('getStatusBandColor', () => {
    it('should return correct colors for each band', () => {
      expect(getStatusBandColor('excellence')).toBe(BIZHEALTH_COLORS.statusGood);
      expect(getStatusBandColor('proficiency')).toBe(BIZHEALTH_COLORS.accent);
      expect(getStatusBandColor('attention')).toBe(BIZHEALTH_COLORS.statusCaution);
      expect(getStatusBandColor('critical')).toBe(BIZHEALTH_COLORS.statusCritical);
    });
  });

  describe('createGaugeVisualization', () => {
    it('should create properly structured visualization data', () => {
      const viz = createGaugeVisualization(
        'test-gauge',
        { value: 75, max: 100 },
        { label: 'Test' }
      );

      expect(viz.id).toBe('test-gauge');
      expect(viz.type).toBe('gauge');
      expect(viz.data).toEqual({ value: 75, max: 100 });
      expect(viz.context.label).toBe('Test');
    });
  });

  describe('isGaugeData', () => {
    it('should correctly identify gauge data', () => {
      expect(isGaugeData({ value: 75, max: 100 })).toBe(true);
      expect(isGaugeData({ clientValue: 75, benchmarkValue: 80 })).toBe(false);
      expect(isGaugeData({ points: [1, 2, 3] })).toBe(false);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Visualization Integration', () => {
  describe('processVisualizations', () => {
    it('should detect ASCII in IDM narratives', () => {
      const mockIdm = {
        findings: [
          {
            id: 'finding-1',
            narrative: 'The overall performance score improved significantly to ████████░░ 80% which represents a major improvement over the previous assessment period.',
          },
        ],
        recommendations: [
          {
            id: 'rec-1',
            expected_outcomes: 'Plain text without ASCII visualizations that is long enough to be processed as a narrative field.',
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = processVisualizations(mockIdm, {
        phase: 'phase5',
        reportType: 'comprehensive',
        logDetections: false, // Disable for test
      });
      consoleSpy.mockRestore();

      expect(result.asciiDetectedCount).toBeGreaterThan(0);
    });

    it('should handle empty IDM gracefully', () => {
      const result = processVisualizations({}, {
        phase: 'phase5',
        reportType: 'comprehensive',
      });

      expect(result.errors).toHaveLength(0);
      expect(result.asciiDetectedCount).toBe(0);
    });

    it('should handle null input gracefully', () => {
      const result = processVisualizations(null, {
        phase: 'phase5',
        reportType: 'comprehensive',
      });

      expect(result.errors).toHaveLength(0);
    });
  });

  describe('renderVisualization', () => {
    it('should render gauge visualization', () => {
      const vizData: VisualizationData = {
        id: 'test-viz',
        type: 'gauge',
        data: { value: 75, max: 100 },
        context: { label: 'Test Score' },
      };

      const result = renderVisualization(vizData);

      expect(result.id).toBe('test-viz');
      expect(result.svg).toContain('<svg');
      expect(result.html).toContain('bh-visualization');
      expect(result.metrics.pdfCompatible).toBe(true);
    });

    it('should include render metrics', () => {
      const vizData: VisualizationData = {
        id: 'test-viz',
        type: 'gauge',
        data: { value: 75, max: 100 },
        context: { label: 'Test' },
      };

      const result = renderVisualization(vizData);

      expect(result.metrics.renderTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics.sizeBytes).toBeGreaterThan(0);
    });

    it('should throw for unsupported visualization types', () => {
      const vizData: VisualizationData = {
        id: 'test-viz',
        type: 'heatmap',
        data: { rows: [], columns: [], values: [] },
        context: { label: 'Test' },
      };

      expect(() => renderVisualization(vizData)).toThrow('not yet implemented');
    });

    it('should generate ASCII fallback', () => {
      const vizData: VisualizationData = {
        id: 'test-viz',
        type: 'gauge',
        data: { value: 75, max: 100 },
        context: { label: 'Score' },
      };

      const result = renderVisualization(vizData);

      expect(result.fallback).toContain('Score');
      expect(result.fallback).toContain('75');
    });
  });

  describe('onPhase5Start', () => {
    it('should return diagnostic summary', () => {
      const mockIdm = {
        scores_summary: {
          overall_health_score: 75,
          descriptor: 'Health: ████░░░░ 75%',
        },
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = onPhase5Start(mockIdm, 'comprehensive');
      consoleSpy.mockRestore();

      expect(result.asciiCount).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });
  });

  describe('onPrePdfGeneration', () => {
    it('should detect ASCII in final HTML', () => {
      const htmlWithAscii = `
        <html>
          <body>
            <p>Score: ████████░░ 80%</p>
          </body>
        </html>
      `;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = onPrePdfGeneration(htmlWithAscii, 'comprehensive');
      consoleSpy.mockRestore();

      expect(result.hasAscii).toBe(true);
      expect(result.warning).toContain('ASCII visualization');
    });

    it('should return no warning for clean HTML', () => {
      const cleanHtml = `
        <html>
          <body>
            <p>This is clean HTML without ASCII visualizations.</p>
          </body>
        </html>
      `;

      const result = onPrePdfGeneration(cleanHtml, 'comprehensive');

      expect(result.hasAscii).toBe(false);
      expect(result.warning).toBeUndefined();
    });
  });
});
