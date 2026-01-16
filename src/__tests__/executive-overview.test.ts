/**
 * Executive Overview Report Tests
 *
 * Validates the Executive Overview report generation:
 * - Data extraction from ReportContext
 * - Validation logic
 * - Section rendering
 * - HTML generation
 *
 * @module executive-overview
 * @since 2026-01-05
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import type { ReportContext, ReportCompanyProfile, ReportOverallHealth } from '../types/report.types.js';
import type { ExecutiveOverviewData } from '../types/executive-overview.types.js';

// Data extraction
import { extractExecutiveOverviewData } from '../orchestration/reports/executive-overview/data-extractor.js';

// Validation
import {
  validateExecutiveOverviewData,
  validatePrerequisites,
  meetsWordCountTargets,
} from '../orchestration/reports/executive-overview/executive-overview.validator.js';

// Constants
import { ROUTING_MAP_ENTRIES } from '../orchestration/reports/executive-overview/executive-overview.constants.js';

/**
 * Create a mock ReportContext for testing
 */
function createMockReportContext(overrides?: Partial<ReportContext>): ReportContext {
  const companyProfile: ReportCompanyProfile = {
    name: 'Test Company Inc',
    industry: 'Technology',
    companySize: 'Medium',
    employeeCount: 150,
    annualRevenue: '$10-50M',
    yearsInBusiness: 10,
    lifecycleStage: 'Growth',
  };

  const overallHealth: ReportOverallHealth = {
    score: 68,
    band: 'Proficiency',
    status: 'Solid foundations with room for optimization',
    trajectory: 'Improving',
  };

  const mockDimensions = [
    { id: 'STR', code: 'STR' as const, chapterCode: 'GE' as const, name: 'Strategy', description: 'Strategic planning', score: 75, band: 'Proficiency' as const, subIndicators: [], keyFindings: ['Strong strategic vision'], keyRisks: [], keyOpportunities: ['Market expansion'] },
    { id: 'SAL', code: 'SAL' as const, chapterCode: 'GE' as const, name: 'Sales', description: 'Sales effectiveness', score: 72, band: 'Proficiency' as const, subIndicators: [], keyFindings: ['Good pipeline management'], keyRisks: [], keyOpportunities: [] },
    { id: 'MKT', code: 'MKT' as const, chapterCode: 'GE' as const, name: 'Marketing', description: 'Marketing effectiveness', score: 65, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: ['Limited brand awareness'], keyOpportunities: [] },
    { id: 'CXP', code: 'CXP' as const, chapterCode: 'GE' as const, name: 'Customer Experience', description: 'CX quality', score: 70, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
    { id: 'OPS', code: 'OPS' as const, chapterCode: 'PH' as const, name: 'Operations', description: 'Operational efficiency', score: 58, band: 'Attention' as const, subIndicators: [], keyFindings: [], keyRisks: ['Process inefficiencies'], keyOpportunities: [] },
    { id: 'FIN', code: 'FIN' as const, chapterCode: 'PH' as const, name: 'Financials', description: 'Financial health', score: 80, band: 'Excellence' as const, subIndicators: [], keyFindings: ['Strong cash position'], keyRisks: [], keyOpportunities: [] },
    { id: 'HRS', code: 'HRS' as const, chapterCode: 'PL' as const, name: 'Human Resources', description: 'HR effectiveness', score: 62, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
    { id: 'LDG', code: 'LDG' as const, chapterCode: 'PL' as const, name: 'Leadership', description: 'Leadership effectiveness', score: 74, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
    { id: 'TIN', code: 'TIN' as const, chapterCode: 'RS' as const, name: 'Technology & Innovation', description: 'Tech adoption', score: 55, band: 'Attention' as const, subIndicators: [], keyFindings: [], keyRisks: ['Legacy systems'], keyOpportunities: [] },
    { id: 'ITD', code: 'ITD' as const, chapterCode: 'RS' as const, name: 'IT & Data Security', description: 'IT security', score: 60, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
    { id: 'RMS', code: 'RMS' as const, chapterCode: 'RS' as const, name: 'Risk Management', description: 'Risk management', score: 65, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
    { id: 'CMP', code: 'CMP' as const, chapterCode: 'RS' as const, name: 'Compliance', description: 'Regulatory compliance', score: 78, band: 'Proficiency' as const, subIndicators: [], keyFindings: [], keyRisks: [], keyOpportunities: [] },
  ];

  const mockFindings = [
    { id: 'f1', type: 'strength' as const, dimensionCode: 'FIN' as const, dimensionName: 'Financials', severity: 2, confidenceLevel: 0.9, shortLabel: 'Strong cash position', narrative: 'Company maintains healthy cash reserves' },
    { id: 'f2', type: 'gap' as const, dimensionCode: 'OPS' as const, dimensionName: 'Operations', severity: 7, confidenceLevel: 0.85, shortLabel: 'Process inefficiencies', narrative: 'Operational processes need optimization' },
    { id: 'f3', type: 'gap' as const, dimensionCode: 'TIN' as const, dimensionName: 'Technology', severity: 6, confidenceLevel: 0.8, shortLabel: 'Legacy systems', narrative: 'Technology stack requires modernization' },
    { id: 'f4', type: 'risk' as const, dimensionCode: 'MKT' as const, dimensionName: 'Marketing', severity: 5, confidenceLevel: 0.75, shortLabel: 'Limited brand awareness', narrative: 'Brand visibility needs improvement' },
    { id: 'f5', type: 'opportunity' as const, dimensionCode: 'STR' as const, dimensionName: 'Strategy', severity: 3, confidenceLevel: 0.9, shortLabel: 'Market expansion', narrative: 'Clear opportunities for market growth' },
  ];

  const mockRecommendations = [
    { id: 'r1', dimensionCode: 'OPS' as const, dimensionName: 'Operations', linkedFindingIds: ['f2'], theme: 'Streamline Operations', priorityRank: 1, impactScore: 85, effortScore: 60, horizon: '90_days' as const, horizonLabel: '0-90 Days', actionSteps: ['Map current processes', 'Identify bottlenecks', 'Implement improvements'], expectedOutcomes: 'Improved efficiency and reduced costs', isQuickWin: true },
    { id: 'r2', dimensionCode: 'TIN' as const, dimensionName: 'Technology', linkedFindingIds: ['f3'], theme: 'Technology Modernization', priorityRank: 2, impactScore: 75, effortScore: 80, horizon: '12_months' as const, horizonLabel: '3-12 Months', actionSteps: ['Assess current systems', 'Create migration plan', 'Execute phased rollout'], expectedOutcomes: 'Modern, scalable technology infrastructure', isQuickWin: false },
    { id: 'r3', dimensionCode: 'MKT' as const, dimensionName: 'Marketing', linkedFindingIds: ['f4'], theme: 'Brand Awareness Campaign', priorityRank: 3, impactScore: 70, effortScore: 50, horizon: '90_days' as const, horizonLabel: '0-90 Days', actionSteps: ['Develop brand strategy', 'Create content calendar', 'Launch campaigns'], expectedOutcomes: 'Increased market visibility', isQuickWin: true },
    { id: 'r4', dimensionCode: 'STR' as const, dimensionName: 'Strategy', linkedFindingIds: ['f5'], theme: 'Market Expansion Strategy', priorityRank: 4, impactScore: 80, effortScore: 70, horizon: '12_months' as const, horizonLabel: '3-12 Months', actionSteps: ['Research new markets', 'Develop entry plan', 'Pilot expansion'], expectedOutcomes: 'New revenue streams', isQuickWin: false },
  ];

  const mockRisks = [
    { id: 'risk1', dimensionCode: 'OPS' as const, dimensionName: 'Operations', category: 'Operational', severity: 7, likelihood: 6, narrative: 'Operational disruptions could impact delivery', mitigationSummary: 'Implement redundancy and backup processes' },
    { id: 'risk2', dimensionCode: 'TIN' as const, dimensionName: 'Technology', category: 'Technology', severity: 6, likelihood: 5, narrative: 'Legacy systems may fail', mitigationSummary: 'Accelerate modernization timeline' },
    { id: 'risk3', dimensionCode: 'MKT' as const, dimensionName: 'Marketing', category: 'Market', severity: 5, likelihood: 7, narrative: 'Competitors gaining market share', mitigationSummary: 'Increase marketing investment' },
  ];

  return {
    runId: 'test-run-12345',
    companyProfile,
    overallHealth,
    executiveSummary: {
      overview: 'Test Company demonstrates solid business health.',
      keyStrengths: ['Strong financials', 'Good strategy'],
      keyPriorities: ['Improve operations', 'Modernize technology'],
      criticalActions: ['Streamline processes', 'Update systems'],
    },
    chapters: [
      { code: 'GE' as const, name: 'Growth Engine', score: 70, band: 'Proficiency' as const, keyFindings: [], keyRisks: [], keyOpportunities: [] },
      { code: 'PH' as const, name: 'Performance & Health', score: 69, band: 'Proficiency' as const, keyFindings: [], keyRisks: [], keyOpportunities: [] },
      { code: 'PL' as const, name: 'People & Leadership', score: 68, band: 'Proficiency' as const, keyFindings: [], keyRisks: [], keyOpportunities: [] },
      { code: 'RS' as const, name: 'Resilience & Safeguards', score: 65, band: 'Proficiency' as const, keyFindings: [], keyRisks: [], keyOpportunities: [] },
    ],
    dimensions: mockDimensions,
    findings: mockFindings,
    recommendations: mockRecommendations,
    quickWins: mockRecommendations.filter(r => r.isQuickWin).map(r => ({
      id: r.id,
      recommendationId: r.id,
      theme: r.theme,
      impactScore: r.impactScore,
      effortScore: r.effortScore,
      actionSteps: r.actionSteps,
      expectedOutcomes: r.expectedOutcomes,
      timeframe: r.horizonLabel,
    })),
    risks: mockRisks,
    roadmap: {
      phases: [
        { id: 'p1', name: 'Phase 1: Foundation', timeHorizon: '0-90 Days', linkedRecommendationIds: ['r1', 'r3'], narrative: 'Establish foundations' },
        { id: 'p2', name: 'Phase 2: Build', timeHorizon: '3-12 Months', linkedRecommendationIds: ['r2', 'r4'], narrative: 'Build on momentum' },
      ],
    },
    financialProjections: {
      day90Value: 250000,
      annualValue: 1500000,
      roi90Day: 2.5,
      totalInvestmentRequired: 100000,
      paybackPeriod: '8 months',
    },
    keyImperatives: ['Focus on operational excellence', 'Invest in technology'],
    metadata: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: '1.5.0',
      assessmentRunId: 'test-run-12345',
      companyProfileId: 'test-company-id',
      reportType: 'executiveOverview',
    },
    ...overrides,
  };
}

describe('Executive Overview Report', () => {

  describe('Data Extraction', () => {
    it('extracts 3-5 material findings from ReportContext', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.materialFindings.length).toBeGreaterThanOrEqual(3);
      expect(data.materialFindings.length).toBeLessThanOrEqual(5);
    });

    it('extracts 3-5 strategic priorities', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.strategicPriorities.length).toBeGreaterThanOrEqual(3);
      expect(data.strategicPriorities.length).toBeLessThanOrEqual(5);
    });

    it('builds 3-phase execution roadmap', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executionRoadmap).toHaveLength(3);
      expect(data.executionRoadmap[0].phase).toBe('days_1_30');
      expect(data.executionRoadmap[1].phase).toBe('days_31_60');
      expect(data.executionRoadmap[2].phase).toBe('days_61_90');
    });

    it('includes routing map entries', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.reportRouteGuide.length).toBeGreaterThanOrEqual(7);
      expect(data.reportRouteGuide).toEqual(ROUTING_MAP_ENTRIES);
    });

    it('extracts company metadata correctly', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.meta.companyName).toBe('Test Company Inc');
      expect(data.meta.industry).toBe('Technology');
    });

    it('synthesizes BLUF when Phase 4.5 not available', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.bluf).toBeTruthy();
      expect(data.executiveSnapshot.bluf.length).toBeGreaterThan(100);
      expect(data.executiveSnapshot.bluf).toContain('Test Company Inc');
    });

    it('uses BLUF from Phase 4.5 when available', () => {
      const blufContent = 'This is a custom BLUF from Phase 4.5';
      const ctx = createMockReportContext({
        phase45Output: {
          meta: { phase: '4.5A' as const, total_blufs_generated: 1, validation_passed: true },
          executive_blufs: {
            executive_overview: { content: blufContent },
          },
        },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.bluf).toBe(blufContent);
    });
  });

  describe('Validation', () => {
    it('passes validation with complete data', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);
      const result = validateExecutiveOverviewData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails validation with missing findings', () => {
      const ctx = createMockReportContext({ findings: [] });
      const prereq = validatePrerequisites(ctx);

      expect(prereq.isValid).toBe(false);
      expect(prereq.errors.some(e => e.includes('findings'))).toBe(true);
    });

    it('fails validation with missing recommendations', () => {
      const ctx = createMockReportContext({ recommendations: [] });
      const prereq = validatePrerequisites(ctx);

      expect(prereq.isValid).toBe(false);
      expect(prereq.errors.some(e => e.includes('recommendations'))).toBe(true);
    });

    it('validates word count targets correctly', () => {
      const belowMin = meetsWordCountTargets(1500);
      expect(belowMin.meetsMinimum).toBe(false);
      expect(belowMin.message).toContain('too brief');

      const aboveMax = meetsWordCountTargets(4000);
      expect(aboveMax.meetsMaximum).toBe(false);
      expect(aboveMax.message).toContain('exceed');

      const inRange = meetsWordCountTargets(2500);
      expect(inRange.meetsMinimum).toBe(true);
      expect(inRange.meetsMaximum).toBe(true);
      expect(inRange.message).toContain('meets');
    });
  });

  describe('Trajectory Determination', () => {
    it('determines growing trajectory for high score with improving trend', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 75, band: 'Proficiency', status: 'Growing', trajectory: 'Improving' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.trajectory).toBe('growing');
    });

    it('determines stable trajectory for moderate conditions', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 55, band: 'Attention', status: 'Stable', trajectory: 'Flat' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.trajectory).toBe('stable');
    });

    it('determines stagnating trajectory for low score', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 42, band: 'Attention', status: 'Needs improvement', trajectory: 'Flat' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.trajectory).toBe('stagnating');
    });

    it('determines declining trajectory for low score with negative trend', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 35, band: 'Critical', status: 'Declining', trajectory: 'Declining' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.executiveSnapshot.trajectory).toBe('declining');
    });
  });

  describe('Priority Calculation', () => {
    it('ranks priorities by impact and feasibility', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      // Priorities should be ranked
      for (let i = 0; i < data.strategicPriorities.length - 1; i++) {
        expect(data.strategicPriorities[i].rank).toBe(i + 1);
      }
    });

    it('maps timelines correctly', () => {
      const ctx = createMockReportContext();
      const data = extractExecutiveOverviewData(ctx);

      // Check that timelines are valid
      const validTimelines = ['30-day', '60-day', '90-day', '6-month', '12-month'];
      data.strategicPriorities.forEach(p => {
        expect(validTimelines).toContain(p.timeline);
      });
    });
  });

  describe('Bottom Line Generation', () => {
    it('generates appropriate bottom line for high score', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 75, band: 'Proficiency', status: 'Strong', trajectory: 'Improving' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.bottomLine).toContain('strong foundations');
      expect(data.bottomLine).toContain('Next step');
    });

    it('generates appropriate bottom line for medium score', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 55, band: 'Attention', status: 'Moderate', trajectory: 'Flat' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.bottomLine).toContain('solid potential');
    });

    it('generates appropriate bottom line for low score', () => {
      const ctx = createMockReportContext({
        overallHealth: { score: 35, band: 'Critical', status: 'Needs work', trajectory: 'Declining' },
      });
      const data = extractExecutiveOverviewData(ctx);

      expect(data.bottomLine).toContain('inflection point');
      expect(data.bottomLine).toContain('decisive action');
    });
  });

  describe('Integration with Output Files', () => {
    const outputDir = path.join(__dirname, '../output');

    let executiveOverviewHtml: string | null = null;
    let reportDirPath: string | null = null;

    function findLatestReportDir(): string | null {
      if (!fs.existsSync(outputDir)) return null;

      const runDirs = fs.readdirSync(outputDir)
        .filter(d => {
          const fullPath = path.join(outputDir, d);
          return fs.statSync(fullPath).isDirectory() && d.match(/^[a-f0-9-]{36}$/);
        });

      for (const runDir of runDirs) {
        const reportsPath = path.join(outputDir, runDir, 'reports');
        if (fs.existsSync(reportsPath)) {
          const reportDirs = fs.readdirSync(reportsPath)
            .filter(d => d.startsWith('report-'))
            .map(d => ({
              name: d,
              path: path.join(reportsPath, d),
              time: fs.statSync(path.join(reportsPath, d)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          if (reportDirs.length > 0) {
            return reportDirs[0].path;
          }
        }
      }
      return null;
    }

    beforeAll(() => {
      reportDirPath = findLatestReportDir();

      if (reportDirPath) {
        const eoPath = path.join(reportDirPath, 'executive-overview.html');
        if (fs.existsSync(eoPath)) {
          executiveOverviewHtml = fs.readFileSync(eoPath, 'utf-8');
        }
      }
    });

    it('should have executive-overview.html available after pipeline run', () => {
      if (!executiveOverviewHtml) {
        console.warn('No executive-overview.html found - run the pipeline first');
        return;
      }
      expect(executiveOverviewHtml).toBeDefined();
      expect(executiveOverviewHtml!.length).toBeGreaterThan(10000);
    });

    it('should include Executive Snapshot section', () => {
      if (!executiveOverviewHtml) return;
      expect(executiveOverviewHtml).toContain('Executive Snapshot');
      expect(executiveOverviewHtml).toContain('bluf-box');
    });

    it('should include Strategic Priorities section', () => {
      if (!executiveOverviewHtml) return;
      expect(executiveOverviewHtml).toContain('Strategic Priorities');
      expect(executiveOverviewHtml).toContain('priority-card');
    });

    it('should include routing map table', () => {
      if (!executiveOverviewHtml) return;
      expect(executiveOverviewHtml).toContain('Where to Go Deeper');
      expect(executiveOverviewHtml).toContain('route-guide-table');
    });

    it('should include Bottom Line section', () => {
      if (!executiveOverviewHtml) return;
      expect(executiveOverviewHtml).toContain('The Bottom Line');
      expect(executiveOverviewHtml).toContain('bottom-line');
    });

    it('should include BizHealth brand styling', () => {
      if (!executiveOverviewHtml) return;
      expect(executiveOverviewHtml).toContain('#212653'); // BizNavy
      expect(executiveOverviewHtml).toContain('#969423'); // BizGreen
      expect(executiveOverviewHtml).toContain('Montserrat');
    });
  });
});
