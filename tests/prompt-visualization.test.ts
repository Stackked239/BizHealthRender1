/**
 * Tests for Prompt Visualization System
 *
 * Tests for schemas, templates, parsers, and aggregation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VisualizationSchema,
  GaugeVisualizationSchema,
  BarVisualizationSchema,
  RadarVisualizationSchema,
  ComparisonVisualizationSchema,
  HeatmapVisualizationSchema,
  SparklineVisualizationSchema,
  AnalysisOutputSchema,
  validateVisualization,
  validateVisualizations,
  validateAnalysisOutput,
  isGaugeVisualization,
  isBarVisualization,
  isRadarVisualization,
  type Visualization,
} from '../src/prompts/schemas/visualization-output.schema';
import {
  VISUALIZATION_OUTPUT_INSTRUCTIONS,
  ANALYSIS_QUALITY_STANDARDS,
  buildAnalysisPrompt,
  REQUIRED_VISUALIZATIONS,
  getRequiredVisualizations,
} from '../src/prompts/templates/base-analysis-prompt';
import {
  VISUALIZATION_SUPPLEMENT,
  getVisualizationRequirements,
  buildVisualizationSupplement,
  appendVisualizationRequirements,
} from '../src/prompts/templates/visualization-supplement';
import {
  parseAnalysisResponse,
  parseMultipleResponses,
  combineVisualizations,
  getVisualizationById,
  getVisualizationsByType,
  type ParseResult,
} from '../src/prompts/parsers/analysis-response-parser';
import {
  aggregateVisualizations,
  extendIDMWithVisualizations,
  getVisualizationById as getVizById,
  getVisualizationsForChapter,
  validateAggregation,
  generateAggregationSummary,
  type VisualizationAggregation,
} from '../src/orchestration/visualization-aggregator';

// ============================================================================
// SCHEMA TESTS
// ============================================================================

describe('Visualization Output Schema', () => {
  describe('GaugeVisualizationSchema', () => {
    it('should validate a valid gauge visualization', () => {
      const gauge = {
        id: 'test_gauge',
        type: 'gauge',
        data: {
          value: 75,
          max: 100,
          benchmark: 80,
          trend: 'improving',
        },
        context: {
          dimension: 'STR',
          chapter: 'GE',
          label: 'Test Gauge',
          placement: 'section_header',
        },
      };

      const result = GaugeVisualizationSchema.safeParse(gauge);
      expect(result.success).toBe(true);
    });

    it('should reject invalid gauge with value > 100', () => {
      const gauge = {
        id: 'test_gauge',
        type: 'gauge',
        data: {
          value: 150,
          max: 100,
        },
        context: {
          label: 'Test',
        },
      };

      const result = GaugeVisualizationSchema.safeParse(gauge);
      expect(result.success).toBe(false);
    });

    it('should accept gauge without optional fields', () => {
      const gauge = {
        id: 'minimal_gauge',
        type: 'gauge',
        data: {
          value: 50,
          max: 100,
        },
        context: {
          label: 'Minimal',
        },
      };

      const result = GaugeVisualizationSchema.safeParse(gauge);
      expect(result.success).toBe(true);
    });
  });

  describe('BarVisualizationSchema', () => {
    it('should validate a valid bar visualization', () => {
      const bar = {
        id: 'test_bar',
        type: 'bar',
        data: {
          clientValue: 22,
          benchmarkValue: 27,
          unit: '%',
          higherIsBetter: true,
        },
        context: {
          dimension: 'SAL',
          label: 'Conversion Rate',
          placement: 'inline',
        },
      };

      const result = BarVisualizationSchema.safeParse(bar);
      expect(result.success).toBe(true);
    });
  });

  describe('RadarVisualizationSchema', () => {
    it('should validate a valid radar visualization', () => {
      const radar = {
        id: 'test_radar',
        type: 'radar',
        data: {
          dimensions: ['Process', 'Technology', 'People', 'Data'],
          clientValues: [65, 45, 72, 38],
          benchmarkValues: [70, 60, 65, 55],
        },
        context: {
          chapter: 'PH',
          label: 'Maturity Profile',
          placement: 'section_header',
        },
      };

      const result = RadarVisualizationSchema.safeParse(radar);
      expect(result.success).toBe(true);
    });

    it('should require minimum 3 dimensions', () => {
      const radar = {
        id: 'test_radar',
        type: 'radar',
        data: {
          dimensions: ['A', 'B'],
          clientValues: [50, 50],
        },
        context: {
          label: 'Test',
        },
      };

      const result = RadarVisualizationSchema.safeParse(radar);
      expect(result.success).toBe(false);
    });
  });

  describe('ComparisonVisualizationSchema', () => {
    it('should validate a valid comparison visualization', () => {
      const comparison = {
        id: 'test_comparison',
        type: 'comparison',
        data: {
          metrics: [
            { label: 'Metric 1', clientValue: 1.2, benchmarkValue: 1.5, status: 'caution' },
            { label: 'Metric 2', clientValue: 0.8, benchmarkValue: 1.0, status: 'critical' },
          ],
        },
        context: {
          dimension: 'FIN',
          label: 'Key Ratios',
          placement: 'comparison_block',
        },
      };

      const result = ComparisonVisualizationSchema.safeParse(comparison);
      expect(result.success).toBe(true);
    });

    it('should require minimum 2 metrics', () => {
      const comparison = {
        id: 'test_comparison',
        type: 'comparison',
        data: {
          metrics: [{ label: 'Only One', clientValue: 1, benchmarkValue: 1 }],
        },
        context: {
          label: 'Test',
        },
      };

      const result = ComparisonVisualizationSchema.safeParse(comparison);
      expect(result.success).toBe(false);
    });
  });

  describe('VisualizationSchema (discriminated union)', () => {
    it('should correctly identify gauge type', () => {
      const viz = {
        id: 'gauge_1',
        type: 'gauge',
        data: { value: 75, max: 100 },
        context: { label: 'Test' },
      };

      const result = VisualizationSchema.safeParse(viz);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('gauge');
      }
    });

    it('should reject unknown type', () => {
      const viz = {
        id: 'unknown_1',
        type: 'pie_chart', // Not supported
        data: {},
        context: { label: 'Test' },
      };

      const result = VisualizationSchema.safeParse(viz);
      expect(result.success).toBe(false);
    });
  });

  describe('AnalysisOutputSchema', () => {
    it('should validate a complete analysis output', () => {
      const output = {
        analysisType: 'revenue_engine',
        narrative: {
          executiveSummary: 'Test summary',
          sections: [
            {
              id: 'section_1',
              title: 'Overview',
              content: 'Test content with [viz:test_gauge]',
              visualizationRefs: ['test_gauge'],
            },
          ],
        },
        visualizations: [
          {
            id: 'test_gauge',
            type: 'gauge',
            data: { value: 75, max: 100 },
            context: { label: 'Test', placement: 'section_header' },
          },
        ],
        metadata: {
          dimensionsCovered: ['STR', 'SAL'],
          confidenceLevel: 'high',
          dataQuality: 'complete',
        },
      };

      const result = AnalysisOutputSchema.safeParse(output);
      expect(result.success).toBe(true);
    });
  });

  describe('Validation helpers', () => {
    it('validateVisualization should return visualization or null', () => {
      const valid = { id: 'test', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test' } };
      const invalid = { id: 'test', type: 'invalid' };

      expect(validateVisualization(valid)).not.toBeNull();
      expect(validateVisualization(invalid)).toBeNull();
    });

    it('validateVisualizations should count valid and invalid', () => {
      const visualizations = [
        { id: 'valid1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test1' } },
        { id: 'invalid1', type: 'pie' },
        { id: 'valid2', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test2' } },
      ];

      const result = validateVisualizations(visualizations);
      expect(result.valid.length).toBe(2);
      expect(result.invalid).toBe(1);
    });
  });

  describe('Type guards', () => {
    it('isGaugeVisualization should correctly identify gauges', () => {
      const gauge: Visualization = {
        id: 'test',
        type: 'gauge',
        data: { value: 50, max: 100 },
        context: { label: 'Test', placement: 'section_header' },
      };

      expect(isGaugeVisualization(gauge)).toBe(true);
    });

    it('isBarVisualization should correctly identify bars', () => {
      const bar: Visualization = {
        id: 'test',
        type: 'bar',
        data: { clientValue: 10, benchmarkValue: 20 },
        context: { label: 'Test', placement: 'inline' },
      };

      expect(isBarVisualization(bar)).toBe(true);
      expect(isGaugeVisualization(bar)).toBe(false);
    });
  });
});

// ============================================================================
// TEMPLATE TESTS
// ============================================================================

describe('Prompt Templates', () => {
  describe('VISUALIZATION_OUTPUT_INSTRUCTIONS', () => {
    it('should contain key instruction elements', () => {
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('OUTPUT FORMAT REQUIREMENTS');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('Do NOT use ASCII');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('gauge');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('bar');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('radar');
    });

    it('should explicitly prohibit ASCII characters', () => {
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('█');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('░');
      expect(VISUALIZATION_OUTPUT_INSTRUCTIONS).toContain('─');
    });
  });

  describe('ANALYSIS_QUALITY_STANDARDS', () => {
    it('should contain quality guidance', () => {
      expect(ANALYSIS_QUALITY_STANDARDS).toContain('Narrative Requirements');
      expect(ANALYSIS_QUALITY_STANDARDS).toContain('Visualization Requirements');
      expect(ANALYSIS_QUALITY_STANDARDS).toContain('Evidence Standards');
    });
  });

  describe('buildAnalysisPrompt', () => {
    it('should build a complete prompt with all sections', () => {
      const prompt = buildAnalysisPrompt(
        'Revenue Engine',
        'Analyze the revenue operations',
        'Company: Test Corp',
        '{"strategy": {}}',
        '{"benchmarks": {}}'
      );

      expect(prompt).toContain('REVENUE ENGINE ANALYSIS');
      expect(prompt).toContain('COMPANY CONTEXT');
      expect(prompt).toContain('QUESTIONNAIRE DATA');
      expect(prompt).toContain('BENCHMARK DATA');
      expect(prompt).toContain('ANALYSIS INSTRUCTIONS');
      expect(prompt).toContain('OUTPUT FORMAT REQUIREMENTS');
    });
  });

  describe('REQUIRED_VISUALIZATIONS', () => {
    it('should define requirements for revenue_engine', () => {
      expect(REQUIRED_VISUALIZATIONS.revenue_engine).toBeDefined();
      expect(REQUIRED_VISUALIZATIONS.revenue_engine.length).toBeGreaterThan(0);
      expect(REQUIRED_VISUALIZATIONS.revenue_engine.some(v => v.type === 'gauge')).toBe(true);
    });

    it('should define requirements for operational_excellence', () => {
      expect(REQUIRED_VISUALIZATIONS.operational_excellence).toBeDefined();
      expect(REQUIRED_VISUALIZATIONS.operational_excellence.length).toBeGreaterThan(0);
    });
  });

  describe('getRequiredVisualizations', () => {
    it('should return visualizations for valid analysis type', () => {
      const vizs = getRequiredVisualizations('revenue_engine');
      expect(vizs.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// VISUALIZATION SUPPLEMENT TESTS
// ============================================================================

describe('Visualization Supplement', () => {
  describe('VISUALIZATION_SUPPLEMENT', () => {
    it('should contain override instructions', () => {
      expect(VISUALIZATION_SUPPLEMENT).toContain('OVERRIDE');
      expect(VISUALIZATION_SUPPLEMENT).toContain('ASCII GRAPHICS ARE PROHIBITED');
    });
  });

  describe('getVisualizationRequirements', () => {
    it('should return requirements for each analysis type', () => {
      expect(getVisualizationRequirements('revenue_engine')).toContain('revenue_engine_score');
      expect(getVisualizationRequirements('operational_excellence')).toContain('operational_excellence_score');
      expect(getVisualizationRequirements('financial_strategic')).toContain('financial_health_score');
      expect(getVisualizationRequirements('people_leadership')).toContain('people_health_score');
      expect(getVisualizationRequirements('compliance_sustainability')).toContain('compliance_health_score');
    });
  });

  describe('buildVisualizationSupplement', () => {
    it('should combine supplement with type-specific requirements', () => {
      const supplement = buildVisualizationSupplement('revenue_engine');
      expect(supplement).toContain('VISUALIZATION OUTPUT REQUIREMENTS');
      expect(supplement).toContain('revenue_engine_score');
    });
  });

  describe('appendVisualizationRequirements', () => {
    it('should append supplement to existing prompt', () => {
      const originalPrompt = 'Original prompt content. Begin your analysis now.';
      const result = appendVisualizationRequirements(originalPrompt, 'revenue_engine');

      expect(result).toContain('Original prompt content');
      expect(result).toContain('VISUALIZATION OUTPUT REQUIREMENTS');
      expect(result).toContain('Begin your analysis now');
    });

    it('should work with prompts without end marker', () => {
      const originalPrompt = 'Simple prompt without marker.';
      const result = appendVisualizationRequirements(originalPrompt, 'revenue_engine');

      expect(result).toContain('Simple prompt');
      expect(result).toContain('VISUALIZATION OUTPUT REQUIREMENTS');
    });
  });
});

// ============================================================================
// PARSER TESTS
// ============================================================================

describe('Analysis Response Parser', () => {
  describe('parseAnalysisResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        analysisType: 'revenue_engine',
        narrative: {
          executiveSummary: 'Test summary',
          sections: [{ id: 's1', title: 'Test', content: 'Content', visualizationRefs: [] }],
        },
        visualizations: [
          { id: 'test_gauge', type: 'gauge', data: { value: 75, max: 100 }, context: { label: 'Test', placement: 'section_header' } },
        ],
        metadata: {
          dimensionsCovered: ['STR'],
          confidenceLevel: 'high',
          dataQuality: 'complete',
        },
      });

      const result = parseAnalysisResponse(response, 'revenue_engine');

      expect(result.success).toBe(true);
      expect(result.visualizations.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should handle JSON in markdown block', () => {
      const response = `
Some text before

\`\`\`json
{
  "analysisType": "test",
  "narrative": {
    "executiveSummary": "Test",
    "sections": []
  },
  "visualizations": [
    { "id": "g1", "type": "gauge", "data": { "value": 50, "max": 100 }, "context": { "label": "Test", "placement": "inline" } }
  ],
  "metadata": { "dimensionsCovered": [], "confidenceLevel": "medium", "dataQuality": "partial" }
}
\`\`\`

Some text after
`;

      const result = parseAnalysisResponse(response, 'test');
      expect(result.success).toBe(true);
      expect(result.visualizations.length).toBe(1);
    });

    it('should extract visualizations even if full schema fails', () => {
      const response = JSON.stringify({
        analysisType: 'test',
        // Missing narrative
        visualizations: [
          { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'inline' } },
          { id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { label: 'Test2', placement: 'inline' } },
        ],
      });

      const result = parseAnalysisResponse(response, 'test');

      expect(result.success).toBe(false);
      expect(result.visualizations.length).toBe(2);
      expect(result.metrics.fallbackUsed).toBe(true);
    });

    it('should detect ASCII patterns in narrative', () => {
      const response = JSON.stringify({
        analysisType: 'test',
        narrative: {
          executiveSummary: 'Score: ████░░░░ 60%',
          sections: [],
        },
        visualizations: [],
        metadata: { dimensionsCovered: [], confidenceLevel: 'high', dataQuality: 'complete' },
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = parseAnalysisResponse(response, 'test');
      consoleSpy.mockRestore();

      expect(result.metrics.asciiDetected).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('ASCII'))).toBe(true);
    });

    it('should warn about duplicate visualization IDs', () => {
      const response = JSON.stringify({
        analysisType: 'test',
        narrative: { executiveSummary: 'Test', sections: [] },
        visualizations: [
          { id: 'same_id', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test1', placement: 'inline' } },
          { id: 'same_id', type: 'gauge', data: { value: 60, max: 100 }, context: { label: 'Test2', placement: 'inline' } },
        ],
        metadata: { dimensionsCovered: [], confidenceLevel: 'high', dataQuality: 'complete' },
      });

      const result = parseAnalysisResponse(response, 'test');

      expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
    });

    it('should handle completely invalid input gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = parseAnalysisResponse('Not JSON at all', 'test');
      consoleSpy.mockRestore();

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('No valid JSON'))).toBe(true);
      expect(result.metrics.fallbackUsed).toBe(true);
    });

    it('should provide render metrics', () => {
      const response = JSON.stringify({
        analysisType: 'test',
        narrative: { executiveSummary: 'Test', sections: [] },
        visualizations: [],
        metadata: { dimensionsCovered: [], confidenceLevel: 'high', dataQuality: 'complete' },
      });

      const result = parseAnalysisResponse(response, 'test');

      expect(result.metrics.parseTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics.visualizationCount).toBe(0);
    });
  });

  describe('parseMultipleResponses', () => {
    it('should parse multiple responses', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const responses = [
        {
          analysisType: 'type1',
          response: JSON.stringify({
            analysisType: 'type1',
            narrative: { executiveSummary: 'Test 1', sections: [] },
            visualizations: [{ id: 't1_g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'inline' } }],
            metadata: { dimensionsCovered: [], confidenceLevel: 'high', dataQuality: 'complete' },
          }),
        },
        {
          analysisType: 'type2',
          response: JSON.stringify({
            analysisType: 'type2',
            narrative: { executiveSummary: 'Test 2', sections: [] },
            visualizations: [{ id: 't2_g1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test', placement: 'inline' } }],
            metadata: { dimensionsCovered: [], confidenceLevel: 'high', dataQuality: 'complete' },
          }),
        },
      ];

      const results = parseMultipleResponses(responses);
      consoleSpy.mockRestore();

      expect(results.size).toBe(2);
      expect(results.get('type1')?.visualizations.length).toBe(1);
      expect(results.get('type2')?.visualizations.length).toBe(1);
    });
  });

  describe('combineVisualizations', () => {
    it('should combine visualizations from multiple results', () => {
      const results = new Map<string, ParseResult>();
      results.set('type1', {
        success: true,
        visualizations: [{ id: 'viz1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'inline' } }],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });
      results.set('type2', {
        success: true,
        visualizations: [{ id: 'viz2', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test', placement: 'inline' } }],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });

      const combined = combineVisualizations(results);

      expect(combined.length).toBe(2);
    });

    it('should handle duplicate IDs across results', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = new Map<string, ParseResult>();
      results.set('type1', {
        success: true,
        visualizations: [{ id: 'same_id', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test1', placement: 'inline' } }],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });
      results.set('type2', {
        success: true,
        visualizations: [{ id: 'same_id', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test2', placement: 'inline' } }],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });

      const combined = combineVisualizations(results);
      consoleSpy.mockRestore();

      expect(combined.length).toBe(2);
      // Second one should be prefixed
      expect(combined.some(v => v.id === 'type2_same_id')).toBe(true);
    });
  });
});

// ============================================================================
// AGGREGATOR TESTS
// ============================================================================

describe('Visualization Aggregator', () => {
  describe('aggregateVisualizations', () => {
    it('should aggregate from parse results', () => {
      const results = new Map<string, ParseResult>();
      results.set('analysis1', {
        success: true,
        visualizations: [
          { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test', placement: 'section_header' } },
          { id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { dimension: 'SAL', label: 'Test', placement: 'inline' } },
        ],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 2, asciiDetected: 0, fallbackUsed: false },
      });

      const aggregation = aggregateVisualizations(results);

      expect(aggregation.all.length).toBe(2);
      expect(aggregation.byDimension.get('STR')?.length).toBe(1);
      expect(aggregation.byDimension.get('SAL')?.length).toBe(1);
      expect(aggregation.byChapter.get('GE')?.length).toBe(1);
      expect(aggregation.byType.get('gauge')?.length).toBe(1);
      expect(aggregation.byType.get('bar')?.length).toBe(1);
      expect(aggregation.heroVisualizations.length).toBe(1);
      expect(aggregation.metadata.totalCount).toBe(2);
    });

    it('should handle duplicate IDs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = new Map<string, ParseResult>();
      results.set('analysis1', {
        success: true,
        visualizations: [
          { id: 'dup', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test1', placement: 'inline' } },
        ],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });
      results.set('analysis2', {
        success: true,
        visualizations: [
          { id: 'dup', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test2', placement: 'inline' } },
        ],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 1, asciiDetected: 0, fallbackUsed: false },
      });

      const aggregation = aggregateVisualizations(results);
      consoleSpy.mockRestore();

      expect(aggregation.all.length).toBe(2);
    });

    it('should track sources', () => {
      const results = new Map<string, ParseResult>();
      results.set('revenue_engine', {
        success: true,
        visualizations: [],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 0, asciiDetected: 0, fallbackUsed: false },
      });
      results.set('operational_excellence', {
        success: true,
        visualizations: [],
        errors: [],
        warnings: [],
        metrics: { parseTimeMs: 0, visualizationCount: 0, asciiDetected: 0, fallbackUsed: false },
      });

      const aggregation = aggregateVisualizations(results);

      expect(aggregation.metadata.sources).toContain('revenue_engine');
      expect(aggregation.metadata.sources).toContain('operational_excellence');
    });
  });

  describe('extendIDMWithVisualizations', () => {
    it('should add visualizations field to IDM', () => {
      const mockIdm = { meta: {}, chapters: [], dimensions: [] } as any;
      const aggregation: VisualizationAggregation = {
        all: [{ id: 'test', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'inline' } }],
        byDimension: new Map(),
        byChapter: new Map([['GE', [{ id: 'test', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'inline' } }]]]),
        byType: new Map(),
        heroVisualizations: [],
        metadata: { totalCount: 1, byType: { gauge: 1 }, sources: ['test'], generatedAt: new Date().toISOString() },
      };

      const extended = extendIDMWithVisualizations(mockIdm, aggregation);

      expect(extended.visualizations).toBeDefined();
      expect(extended.visualizations.all.length).toBe(1);
      expect(extended.visualizations.byChapter['GE']?.length).toBe(1);
    });
  });

  describe('Query functions', () => {
    const aggregation: VisualizationAggregation = {
      all: [
        { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test1', placement: 'section_header' } },
        { id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { dimension: 'SAL', chapter: 'GE', label: 'Test2', placement: 'inline' } },
        { id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { dimension: 'OPS', chapter: 'PH', label: 'Test3', placement: 'section_header' } },
      ],
      byDimension: new Map([
        ['STR', [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test1', placement: 'section_header' } }]],
        ['SAL', [{ id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { dimension: 'SAL', chapter: 'GE', label: 'Test2', placement: 'inline' } }]],
        ['OPS', [{ id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { dimension: 'OPS', chapter: 'PH', label: 'Test3', placement: 'section_header' } }]],
      ]),
      byChapter: new Map([
        ['GE', [
          { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test1', placement: 'section_header' } },
          { id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { dimension: 'SAL', chapter: 'GE', label: 'Test2', placement: 'inline' } },
        ]],
        ['PH', [{ id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { dimension: 'OPS', chapter: 'PH', label: 'Test3', placement: 'section_header' } }]],
      ]),
      byType: new Map([
        ['gauge', [
          { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test1', placement: 'section_header' } },
          { id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { dimension: 'OPS', chapter: 'PH', label: 'Test3', placement: 'section_header' } },
        ]],
        ['bar', [{ id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { dimension: 'SAL', chapter: 'GE', label: 'Test2', placement: 'inline' } }]],
      ]),
      heroVisualizations: [
        { id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test1', placement: 'section_header' } },
        { id: 'g2', type: 'gauge', data: { value: 60, max: 100 }, context: { dimension: 'OPS', chapter: 'PH', label: 'Test3', placement: 'section_header' } },
      ],
      metadata: { totalCount: 3, byType: { gauge: 2, bar: 1 }, sources: ['test'], generatedAt: new Date().toISOString() },
    };

    it('getVizById should find visualization by ID', () => {
      expect(getVizById(aggregation, 'g1')?.id).toBe('g1');
      expect(getVizById(aggregation, 'nonexistent')).toBeUndefined();
    });

    it('getVisualizationsForChapter should return chapter visualizations', () => {
      const geVizs = getVisualizationsForChapter(aggregation, 'GE');
      expect(geVizs.length).toBe(2);
    });
  });

  describe('validateAggregation', () => {
    it('should validate required types', () => {
      const aggregation: VisualizationAggregation = {
        all: [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }],
        byDimension: new Map(),
        byChapter: new Map(),
        byType: new Map([['gauge', [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }]]]),
        heroVisualizations: [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }],
        metadata: { totalCount: 1, byType: { gauge: 1 }, sources: ['test'], generatedAt: new Date().toISOString() },
      };

      const result = validateAggregation(aggregation, ['gauge']);
      expect(result.valid).toBe(true);
    });

    it('should report missing required types', () => {
      const aggregation: VisualizationAggregation = {
        all: [],
        byDimension: new Map(),
        byChapter: new Map(),
        byType: new Map(),
        heroVisualizations: [],
        metadata: { totalCount: 0, byType: {}, sources: ['test'], generatedAt: new Date().toISOString() },
      };

      const result = validateAggregation(aggregation, ['gauge', 'radar']);
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBe(2);
    });

    it('should warn about missing hero visualizations', () => {
      const aggregation: VisualizationAggregation = {
        all: [{ id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test', placement: 'inline' } }],
        byDimension: new Map(),
        byChapter: new Map(),
        byType: new Map([['bar', [{ id: 'b1', type: 'bar', data: { clientValue: 10, benchmarkValue: 20 }, context: { label: 'Test', placement: 'inline' } }]]]),
        heroVisualizations: [],
        metadata: { totalCount: 1, byType: { bar: 1 }, sources: ['test'], generatedAt: new Date().toISOString() },
      };

      const result = validateAggregation(aggregation, []);
      expect(result.warnings.some(w => w.includes('hero'))).toBe(true);
    });
  });

  describe('generateAggregationSummary', () => {
    it('should generate readable summary', () => {
      const aggregation: VisualizationAggregation = {
        all: [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { dimension: 'STR', chapter: 'GE', label: 'Test', placement: 'section_header' } }],
        byDimension: new Map([['STR', [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }]]]),
        byChapter: new Map([['GE', [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }]]]),
        byType: new Map([['gauge', [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }]]]),
        heroVisualizations: [{ id: 'g1', type: 'gauge', data: { value: 50, max: 100 }, context: { label: 'Test', placement: 'section_header' } }],
        metadata: { totalCount: 1, byType: { gauge: 1 }, sources: ['test_analysis'], generatedAt: new Date().toISOString() },
      };

      const summary = generateAggregationSummary(aggregation);

      expect(summary).toContain('Total Visualizations: 1');
      expect(summary).toContain('Hero Visualizations: 1');
      expect(summary).toContain('gauge: 1');
      expect(summary).toContain('STR: 1');
      expect(summary).toContain('GE: 1');
      expect(summary).toContain('test_analysis');
    });
  });
});
