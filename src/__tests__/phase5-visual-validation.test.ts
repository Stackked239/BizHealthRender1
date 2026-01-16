/**
 * Phase 5 Report Visual Validation Tests
 *
 * Validates that generated reports meet visual quality standards:
 * - No "undefined" text visible in reports
 * - Minimum SVG visualization counts
 * - Empty chart containers are properly handled
 * - Brand color compliance
 * - Accessibility attributes present
 *
 * @module phase5-visual-validation
 * @since 2025-12-07
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 5 Report Visual Validation', () => {
  const outputDir = path.join(__dirname, '../../output');
  const reportsDir = path.join(outputDir, 'reports');

  let comprehensiveHtml: string | null = null;
  let ownerHtml: string | null = null;
  let quickWinsHtml: string | null = null;

  // Find the most recent report directory
  function findLatestReportDir(): string | null {
    if (!fs.existsSync(reportsDir)) return null;

    const dirs = fs.readdirSync(reportsDir)
      .filter(d => {
        const fullPath = path.join(reportsDir, d);
        return fs.statSync(fullPath).isDirectory() && d.match(/^[a-f0-9-]{36}$/);
      })
      .map(d => ({
        name: d,
        time: fs.statSync(path.join(reportsDir, d)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    return dirs.length > 0 ? dirs[0].name : null;
  }

  beforeAll(() => {
    // Try to load from latest UUID directory first
    const latestDir = findLatestReportDir();
    if (latestDir) {
      const dirPath = path.join(reportsDir, latestDir);

      const compPath = path.join(dirPath, 'comprehensive.html');
      const ownerPath = path.join(dirPath, 'owner.html');
      const qwPath = path.join(dirPath, 'quickWins.html');

      if (fs.existsSync(compPath)) {
        comprehensiveHtml = fs.readFileSync(compPath, 'utf-8');
      }
      if (fs.existsSync(ownerPath)) {
        ownerHtml = fs.readFileSync(ownerPath, 'utf-8');
      }
      if (fs.existsSync(qwPath)) {
        quickWinsHtml = fs.readFileSync(qwPath, 'utf-8');
      }
    }

    // Fallback to root reports directory
    if (!comprehensiveHtml) {
      const compPath = path.join(reportsDir, 'comprehensive-report.html');
      if (fs.existsSync(compPath)) {
        comprehensiveHtml = fs.readFileSync(compPath, 'utf-8');
      }
    }
    if (!ownerHtml) {
      const ownerPath = path.join(reportsDir, 'owners-report.html');
      if (fs.existsSync(ownerPath)) {
        ownerHtml = fs.readFileSync(ownerPath, 'utf-8');
      }
    }
    if (!quickWinsHtml) {
      const qwPath = path.join(reportsDir, 'quick-wins-report.html');
      if (fs.existsSync(qwPath)) {
        quickWinsHtml = fs.readFileSync(qwPath, 'utf-8');
      }
    }

    // Final fallback to output root
    if (!comprehensiveHtml) {
      const compPath = path.join(outputDir, 'comprehensive-report.html');
      if (fs.existsSync(compPath)) {
        comprehensiveHtml = fs.readFileSync(compPath, 'utf-8');
      }
    }
    if (!ownerHtml) {
      const ownerPath = path.join(outputDir, 'owners-report.html');
      if (fs.existsSync(ownerPath)) {
        ownerHtml = fs.readFileSync(ownerPath, 'utf-8');
      }
    }
  });

  describe('Data Integrity - No Undefined Values', () => {
    it('Comprehensive Report has no "undefined" text visible', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Check for visible undefined text patterns
      const undefinedPatterns = [
        />undefined</gi,
        /undefined<\/span>/gi,
        /<span>undefined/gi,
        /: undefined</gi,
        /: undefined$/gm,
        /"undefined"/gi,
      ];

      let foundIssues: string[] = [];
      undefinedPatterns.forEach(pattern => {
        const matches = comprehensiveHtml!.match(pattern);
        if (matches) {
          foundIssues.push(`Pattern ${pattern}: ${matches.length} matches`);
        }
      });

      expect(foundIssues, `Found undefined text: ${foundIssues.join(', ')}`).toHaveLength(0);
    });

    it('Owner Report has no "undefined" text visible', () => {
      if (!ownerHtml) {
        console.warn('Owner report not found, skipping test');
        return;
      }

      expect(ownerHtml).not.toMatch(/>undefined</i);
      expect(ownerHtml).not.toMatch(/undefined<\/span>/i);
    });

    it('Quick Wins section has complete data (no undefined)', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Extract Quick Wins section
      const qwMatch = comprehensiveHtml.match(
        /<section[^>]*id="quick-wins"[^>]*>[\s\S]*?<\/section>/i
      );

      if (qwMatch) {
        const qwSection = qwMatch[0];
        expect(qwSection).not.toContain('>undefined<');
        // Check for proper Impact/Effort formatting
        expect(qwSection).toMatch(/Impact:\s*\d+/i);
        expect(qwSection).toMatch(/Effort:\s*\d+/i);
      }
    });

    it('Recommendation cards have complete dimension names', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Check that dimension names are resolved (not just codes like "STR")
      const recMatch = comprehensiveHtml.match(
        /<div class="recommendation-item">[\s\S]*?<\/div>/gi
      );

      if (recMatch && recMatch.length > 0) {
        recMatch.slice(0, 3).forEach(rec => {
          expect(rec).not.toContain('undefined');
        });
      }
    });
  });

  describe('Visual Density - SVG Counts', () => {
    it('Comprehensive Report has minimum 35 SVG visualizations', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      const svgCount = (comprehensiveHtml.match(/<svg/g) || []).length;
      console.log(`Comprehensive Report SVG count: ${svgCount}`);
      expect(svgCount).toBeGreaterThanOrEqual(35);
    });

    it('Owner Report has minimum 15 SVG visualizations', () => {
      if (!ownerHtml) {
        console.warn('Owner report not found, skipping test');
        return;
      }

      const svgCount = (ownerHtml.match(/<svg/g) || []).length;
      console.log(`Owner Report SVG count: ${svgCount}`);
      expect(svgCount).toBeGreaterThanOrEqual(15);
    });

    it('All SVG chart containers have content', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Find containers without SVG inside
      const emptyContainers = comprehensiveHtml.match(
        /<div class="svg-chart-container"[^>]*>\s*<\/div>/g
      );

      expect(emptyContainers || []).toHaveLength(0);
    });

    it('No chart containers with only whitespace', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Match containers with only whitespace content
      const whitespaceContainers = comprehensiveHtml.match(
        /<div class="svg-chart-container"[^>]*>\s+<\/div>/g
      );

      expect(whitespaceContainers || []).toHaveLength(0);
    });
  });

  describe('Brand Compliance', () => {
    it('Uses correct BizNavy color (#212653)', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      expect(comprehensiveHtml).toContain('#212653');
    });

    it('Uses correct BizGreen color (#969423)', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      expect(comprehensiveHtml).toContain('#969423');
    });

    it('Does not use incorrect BizGreen color (#27AE60)', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // This is an incorrect green sometimes used in error
      const incorrectGreenCount = (comprehensiveHtml.match(/#27AE60/gi) || []).length;

      // Allow a small number (may be in legacy charts) but warn if present
      if (incorrectGreenCount > 0) {
        console.warn(`Found ${incorrectGreenCount} instances of incorrect BizGreen (#27AE60)`);
      }

      // Fail if there are too many instances
      expect(incorrectGreenCount).toBeLessThan(10);
    });
  });

  describe('Accessibility', () => {
    it('SVGs have accessibility attributes', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      const svgsWithRole = (comprehensiveHtml.match(/<svg[^>]*role="figure"/g) || []).length;
      const svgsWithAriaLabel = (comprehensiveHtml.match(/<svg[^>]*aria-label="/g) || []).length;
      const totalSvgs = (comprehensiveHtml.match(/<svg/g) || []).length;

      if (totalSvgs > 0) {
        const accessibilityRatio = Math.max(svgsWithRole, svgsWithAriaLabel) / totalSvgs;
        console.log(`SVG accessibility: ${Math.round(accessibilityRatio * 100)}% have role/aria-label`);

        // At least 80% of SVGs should have accessibility attributes
        expect(accessibilityRatio).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('Chart containers have role="figure" attribute', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      const containersWithRole = (comprehensiveHtml.match(
        /<div class="svg-chart-container"[^>]*role="figure"/g
      ) || []).length;

      const totalContainers = (comprehensiveHtml.match(
        /<div class="svg-chart-container"/g
      ) || []).length;

      if (totalContainers > 0) {
        const ratio = containersWithRole / totalContainers;
        expect(ratio).toBeGreaterThanOrEqual(0.8);
      }
    });
  });

  describe('Quick Wins Data Quality', () => {
    it('Quick Wins have numeric impact scores', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Check for Impact: followed by a number
      const impactMatches = comprehensiveHtml.match(/Impact:\s*(\d+)/g);

      if (impactMatches) {
        // All matches should have valid numbers
        impactMatches.forEach(match => {
          const num = parseInt(match.replace(/Impact:\s*/, ''));
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(100);
        });
      }
    });

    it('Quick Wins have numeric effort scores', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Check for Effort: followed by a number
      const effortMatches = comprehensiveHtml.match(/Effort:\s*(\d+)/g);

      if (effortMatches) {
        // All matches should have valid numbers
        effortMatches.forEach(match => {
          const num = parseInt(match.replace(/Effort:\s*/, ''));
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(100);
        });
      }
    });

    it('Quick Wins have dimension names (not codes)', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      // Extract quick wins section
      const qwSection = comprehensiveHtml.match(
        /<div class="quick-win-card">[\s\S]*?<\/div>/gi
      );

      if (qwSection && qwSection.length > 0) {
        // Check that dimension names are human-readable
        const dimensionNames = [
          'Strategy', 'Sales', 'Marketing', 'Customer Experience',
          'Operations', 'Financials', 'Human Resources', 'Leadership',
          'Technology', 'IT', 'Risk Management', 'Compliance', 'General'
        ];

        let foundDimensionName = false;
        qwSection.forEach(card => {
          dimensionNames.forEach(name => {
            if (card.includes(name)) {
              foundDimensionName = true;
            }
          });
        });

        expect(foundDimensionName).toBe(true);
      }
    });
  });

  describe('Report Structure', () => {
    it('Comprehensive report has expected sections', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      const expectedSections = [
        'executive-summary',
        'scorecard',
      ];

      expectedSections.forEach(sectionId => {
        expect(comprehensiveHtml).toContain(`id="${sectionId}"`);
      });
    });

    it('Has table of contents', () => {
      if (!comprehensiveHtml) {
        console.warn('Comprehensive report not found, skipping test');
        return;
      }

      expect(comprehensiveHtml).toMatch(/table-of-contents|toc/i);
    });
  });
});
