/**
 * ASCII VALIDATION TEST SUITE
 *
 * Comprehensive tests for the three-layer ASCII elimination defense:
 * - Layer 1: Prevention (prompt instructions)
 * - Layer 2: Validation (extraction and schema validation)
 * - Layer 3: Failsafe (sanitization before output)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FORBIDDEN_ASCII_PATTERN,
  ASCII_BLOCK_PATTERN,
  ASCII_BAR_PATTERN,
  assertNoAsciiDiagrams,
  containsAsciiDiagrams,
  countAsciiOccurrences,
  extractAsciiBlocks,
  generateAsciiViolationReport,
  VisualizationSpecSchema
} from '../../src/contracts/visualization.contract';
import { asciiSanitizer } from '../../src/services/ascii-sanitization.service';
import { visualizationExtractor } from '../../src/services/visualization-extractor.service';

// ============================================================================
// LAYER 1: PREVENTION (Pattern Detection)
// ============================================================================

describe('ASCII Detection - Prevention Layer', () => {
  describe('FORBIDDEN_ASCII_PATTERN', () => {
    it('should detect all box-drawing characters', () => {
      const boxChars = '┌┐└┘│─┬┴├┤═║╔╗╚╝╠╣╦╩╬';
      for (const char of boxChars) {
        expect(FORBIDDEN_ASCII_PATTERN.test(char)).toBe(true);
      }
    });

    it('should detect block/fill characters', () => {
      const blockChars = '█▓░';
      for (const char of blockChars) {
        expect(FORBIDDEN_ASCII_PATTERN.test(char)).toBe(true);
      }
    });

    it('should detect geometric and arrow characters', () => {
      const geoChars = '▲▼►◄●○■□▪▫';
      for (const char of geoChars) {
        expect(FORBIDDEN_ASCII_PATTERN.test(char)).toBe(true);
      }
    });

    it('should detect rounded corner characters', () => {
      const roundedChars = '╭╮╯╰';
      for (const char of roundedChars) {
        expect(FORBIDDEN_ASCII_PATTERN.test(char)).toBe(true);
      }
    });

    it('should allow normal text', () => {
      const normalTexts = [
        'This is a normal business assessment.',
        'Score: 72% - Revenue: $1.5M',
        'The company shows strong performance.',
        'Q1 2024 financial results',
        'Customer satisfaction index: 8.5/10'
      ];

      for (const text of normalTexts) {
        expect(FORBIDDEN_ASCII_PATTERN.test(text)).toBe(false);
      }
    });

    it('should allow standard punctuation and symbols', () => {
      const allowedSymbols = '+-*/=<>()[]{}&@#$%^!?|~`\'"';
      expect(FORBIDDEN_ASCII_PATTERN.test(allowedSymbols)).toBe(false);
    });
  });

  describe('assertNoAsciiDiagrams', () => {
    it('should throw on ASCII box-drawing', () => {
      const contentWithBox = 'Some text ╔════╗ more text';
      expect(() => assertNoAsciiDiagrams(contentWithBox, 'test')).toThrow(
        'ASCII DIAGRAM VIOLATION'
      );
    });

    it('should throw on ASCII block characters', () => {
      const contentWithBlock = 'Progress: ████░░░░';
      expect(() => assertNoAsciiDiagrams(contentWithBlock, 'test')).toThrow(
        'ASCII DIAGRAM VIOLATION'
      );
    });

    it('should not throw on clean content', () => {
      const cleanContent = 'Normal business report with scores and analysis.';
      expect(() => assertNoAsciiDiagrams(cleanContent, 'test')).not.toThrow();
    });
  });

  describe('containsAsciiDiagrams', () => {
    it('should return true for content with ASCII diagrams', () => {
      expect(containsAsciiDiagrams('┌───────┐')).toBe(true);
      expect(containsAsciiDiagrams('█████')).toBe(true);
      expect(containsAsciiDiagrams('●○●○●')).toBe(true);
    });

    it('should return false for clean content', () => {
      expect(containsAsciiDiagrams('Clean content')).toBe(false);
      expect(containsAsciiDiagrams('Score: 85%')).toBe(false);
    });
  });

  describe('countAsciiOccurrences', () => {
    it('should count all ASCII characters', () => {
      expect(countAsciiOccurrences('┌┐└┘')).toBe(4);
      expect(countAsciiOccurrences('████')).toBe(4);
      expect(countAsciiOccurrences('Normal text')).toBe(0);
    });

    it('should count repeated characters', () => {
      expect(countAsciiOccurrences('═══════')).toBe(7);
    });
  });

  describe('extractAsciiBlocks', () => {
    it('should extract multi-line ASCII blocks', () => {
      const content = `
Normal text here.

╔═══════════════╗
║  ASCII BOX    ║
╚═══════════════╝

More normal text.
      `;

      const blocks = extractAsciiBlocks(content);
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].lineCount).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for clean content', () => {
      const content = 'Just normal text without any ASCII diagrams.';
      const blocks = extractAsciiBlocks(content);
      expect(blocks).toHaveLength(0);
    });
  });

  describe('generateAsciiViolationReport', () => {
    it('should generate detailed violation report', () => {
      const content = `
Analysis:
╔════════════════════╗
║  Score: 72%        ║
╚════════════════════╝
      `;

      const report = generateAsciiViolationReport(content, 'test-analysis');

      expect(report.hasViolations).toBe(true);
      expect(report.totalOccurrences).toBeGreaterThan(0);
      expect(report.context).toBe('test-analysis');
    });

    it('should report no violations for clean content', () => {
      const report = generateAsciiViolationReport('Clean content', 'test');

      expect(report.hasViolations).toBe(false);
      expect(report.totalOccurrences).toBe(0);
    });
  });
});

// ============================================================================
// LAYER 2: VALIDATION (Extraction and Schema)
// ============================================================================

describe('Visualization Extraction - Validation Layer', () => {
  describe('extract', () => {
    it('should extract valid visualization blocks correctly', () => {
      const input = `
Some narrative text.

\`\`\`json:visualization
{
  "vizType": "gauge",
  "title": "Test Score",
  "data": [{ "label": "Score", "value": 72, "unit": "%" }]
}
\`\`\`

More narrative.
      `;

      const result = visualizationExtractor.extract(input, 'test-analysis');

      expect(result.visualizations).toHaveLength(1);
      expect(result.visualizations[0].vizType).toBe('gauge');
      expect(result.visualizations[0].title).toBe('Test Score');
      expect(result.asciiViolations).toHaveLength(0);
    });

    it('should extract multiple visualization blocks', () => {
      const input = `
\`\`\`json:visualization
{
  "vizType": "gauge",
  "title": "First",
  "data": [{ "label": "A", "value": 50 }]
}
\`\`\`

Text between.

\`\`\`json:visualization
{
  "vizType": "bar_chart",
  "title": "Second",
  "data": [{ "label": "B", "value": 75 }]
}
\`\`\`
      `;

      const result = visualizationExtractor.extract(input, 'test');

      expect(result.visualizations).toHaveLength(2);
      expect(result.visualizations[0].vizType).toBe('gauge');
      expect(result.visualizations[1].vizType).toBe('bar_chart');
    });

    it('should record ASCII violations in extraction result', () => {
      const input = `
Analysis with ASCII:
╔════════════════════╗
║  Score: 72%        ║
╚════════════════════╝
      `;

      const result = visualizationExtractor.extract(input, 'test-analysis');

      expect(result.asciiViolations.length).toBeGreaterThan(0);
    });

    it('should handle malformed JSON gracefully', () => {
      const input = `
\`\`\`json:visualization
{ "vizType": "gauge", "title": "Bad JSON"
\`\`\`
      `;

      const result = visualizationExtractor.extract(input, 'test');

      expect(result.visualizations).toHaveLength(0);
      expect(result.extractionErrors.length).toBeGreaterThan(0);
    });

    it('should replace visualization blocks with placeholders', () => {
      const input = `
Before.
\`\`\`json:visualization
{"vizType": "gauge", "title": "Test", "data": [{"label": "X", "value": 50}]}
\`\`\`
After.
      `;

      const result = visualizationExtractor.extract(input, 'test');

      expect(result.cleanedText).toContain('<!-- VISUALIZATION_PLACEHOLDER_0 -->');
      expect(result.cleanedText).not.toContain('```json:visualization');
    });
  });

  describe('assertQuality', () => {
    it('should throw on ASCII violations', () => {
      const resultWithViolations = {
        cleanedText: 'text',
        visualizations: [],
        extractionErrors: [],
        asciiViolations: ['Detected ASCII box']
      };

      expect(() => {
        visualizationExtractor.assertQuality(resultWithViolations, 'test');
      }).toThrow('ASCII DIAGRAM VIOLATIONS');
    });

    it('should not throw when clean', () => {
      const cleanResult = {
        cleanedText: 'text',
        visualizations: [],
        extractionErrors: [],
        asciiViolations: []
      };

      expect(() => {
        visualizationExtractor.assertQuality(cleanResult, 'test');
      }).not.toThrow();
    });
  });
});

describe('Visualization Schema', () => {
  it('should validate correct visualization spec', () => {
    const validSpec = {
      vizType: 'gauge',
      title: 'Health Score',
      data: [{ label: 'Overall', value: 72, unit: '%' }]
    };

    const result = VisualizationSpecSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });

  it('should reject invalid vizType', () => {
    const invalidSpec = {
      vizType: 'invalid_type',
      title: 'Test',
      data: [{ label: 'X', value: 50 }]
    };

    const result = VisualizationSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
  });

  it('should reject empty data array', () => {
    const invalidSpec = {
      vizType: 'gauge',
      title: 'Test',
      data: []
    };

    const result = VisualizationSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
  });

  it('should accept all valid vizTypes', () => {
    const validTypes = [
      'gauge',
      'bar_chart',
      'horizontal_bar',
      'comparison_matrix',
      'score_tiles',
      'timeline',
      'risk_matrix',
      'heatmap',
      'radar_chart',
      'priority_table',
      'progress_indicator',
      'trend_sparkline',
      'kpi_card'
    ];

    for (const vizType of validTypes) {
      const spec = {
        vizType,
        title: 'Test',
        data: [{ label: 'X', value: 50 }]
      };

      const result = VisualizationSpecSchema.safeParse(spec);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// LAYER 3: FAILSAFE (Sanitization)
// ============================================================================

describe('ASCII Sanitization - Failsafe Layer', () => {
  describe('containsAscii', () => {
    it('should detect ASCII content', () => {
      expect(asciiSanitizer.containsAscii('╔═══╗')).toBe(true);
      expect(asciiSanitizer.containsAscii('Normal text')).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should remove ASCII blocks and return clean content', () => {
      const input = `
Clean paragraph.

╔════════════════════╗
║  ASCII DIAGRAM     ║
╚════════════════════╝

Another clean paragraph.
      `;

      const result = asciiSanitizer.sanitize(input, 'test');

      expect(result.wasModified).toBe(true);
      expect(result.removedBlocks.length).toBeGreaterThan(0);
      expect(FORBIDDEN_ASCII_PATTERN.test(result.sanitized)).toBe(false);
    });

    it('should preserve clean content unchanged', () => {
      const cleanContent = 'This is perfectly clean content with no ASCII diagrams.';

      const result = asciiSanitizer.sanitize(cleanContent, 'test');

      expect(result.wasModified).toBe(false);
      expect(result.sanitized.trim()).toBe(cleanContent);
    });

    it('should remove inline ASCII characters', () => {
      const input = 'Score: ███░░ 60%';

      const result = asciiSanitizer.sanitize(input, 'test');

      expect(result.wasModified).toBe(true);
      expect(FORBIDDEN_ASCII_PATTERN.test(result.sanitized)).toBe(false);
    });

    it('should clean up excessive whitespace after removal', () => {
      const input = `
Line 1.


╔═══╗
║ X ║
╚═══╝



Line 2.
      `;

      const result = asciiSanitizer.sanitize(input, 'test');

      // Should not have more than 2 consecutive newlines
      expect(result.sanitized.match(/\n{3,}/)).toBeNull();
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML content with embedded ASCII', () => {
      const html = `
<div class="content">
  <p>Normal paragraph.</p>
  <pre>╔════════╗
║ Chart  ║
╚════════╝</pre>
  <p>More content.</p>
</div>
      `;

      const result = asciiSanitizer.sanitizeHtml(html, 'test');

      expect(result.wasModified).toBe(true);
      expect(FORBIDDEN_ASCII_PATTERN.test(result.sanitized)).toBe(false);
    });
  });

  describe('generateReport', () => {
    it('should generate accurate sanitization report', () => {
      const content = '╔═══╗\n║ X ║\n╚═══╝';
      const sanitization = asciiSanitizer.sanitize(content, 'test');
      const report = asciiSanitizer.generateReport(content, sanitization, 'test-context');

      expect(report.wasModified).toBe(true);
      expect(report.originalLength).toBeGreaterThan(report.sanitizedLength);
      expect(report.context).toBe('test-context');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('ASCII Elimination - Integration', () => {
  it('should handle complete workflow from extraction to sanitization', () => {
    // Content with both viz blocks and ASCII art
    const input = `
# Analysis Results

\`\`\`json:visualization
{
  "vizType": "gauge",
  "title": "Health Score",
  "data": [{ "label": "Overall", "value": 78, "category": "proficiency" }]
}
\`\`\`

The analysis shows strong performance:

╔════════════════════════╗
║  OLD ASCII CHART       ║
║  █████████░░░ 75%     ║
╚════════════════════════╝

See the visualization above for details.
    `;

    // Step 1: Extract visualizations
    const extraction = visualizationExtractor.extract(input, 'integration-test');

    // Should extract the viz block
    expect(extraction.visualizations).toHaveLength(1);

    // Should detect ASCII violations
    expect(extraction.asciiViolations.length).toBeGreaterThan(0);

    // Step 2: Sanitize remaining content (failsafe)
    const sanitization = asciiSanitizer.sanitize(extraction.cleanedText, 'integration-test');

    // Should have removed ASCII
    expect(FORBIDDEN_ASCII_PATTERN.test(sanitization.sanitized)).toBe(false);

    // Visualization placeholder should remain
    expect(sanitization.sanitized).toContain('<!-- VISUALIZATION_PLACEHOLDER_0 -->');
  });

  it('should pass clean content through without modification', () => {
    const cleanInput = `
# Analysis Results

\`\`\`json:visualization
{
  "vizType": "bar_chart",
  "title": "Performance Metrics",
  "data": [
    { "label": "Sales", "value": 85, "category": "excellence" },
    { "label": "Marketing", "value": 62, "category": "proficiency" }
  ]
}
\`\`\`

The analysis shows varying performance across dimensions.
Sales demonstrates excellence while marketing shows room for improvement.
    `;

    const extraction = visualizationExtractor.extract(cleanInput, 'clean-test');

    expect(extraction.visualizations).toHaveLength(1);
    expect(extraction.asciiViolations).toHaveLength(0);
    expect(extraction.extractionErrors).toHaveLength(0);

    // Quality assertion should pass
    expect(() => {
      visualizationExtractor.assertQuality(extraction, 'clean-test');
    }).not.toThrow();
  });
});
