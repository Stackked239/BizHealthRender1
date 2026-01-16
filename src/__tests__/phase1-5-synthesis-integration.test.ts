/**
 * Phase 1.5 Cross-Dimensional Synthesis Integration Tests
 *
 * Tests the synthesis generation, validation, and report building pipeline.
 *
 * @module phase1-5-synthesis-integration.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IDM, CrossDimensionalSynthesis } from '../types/idm.types.js';
import type { Phase1_5Output, CategoryAnalysis } from '../types/phase1-5.types.js';
import {
  validatePreGeneration,
  validatePostGeneration,
  validateSynthesis,
  validatePMORequirements,
  validateImplementationSummary,
  scanReportHTML,
} from '../orchestration/validation/synthesis-validation.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockIDM = (options: {
  categoryCount?: number;
  withCrossCategory?: boolean;
  withChapters?: boolean;
} = {}): IDM => {
  const { categoryCount = 12, withCrossCategory = true, withChapters = true } = options;

  const categories: CategoryAnalysis[] = [];
  const categoryIds = ['RGP', 'MKT', 'OPS', 'FMG', 'WCP', 'OCE', 'TAM', 'PME', 'CPL', 'LEG', 'SNV', 'ITD'];

  for (let i = 0; i < categoryCount && i < categoryIds.length; i++) {
    categories.push({
      categoryId: categoryIds[i],
      categoryName: `Category ${categoryIds[i]}`,
      overallScore: 60 + Math.random() * 30,
      scoreBand: 'Proficiency',
      tier1Narrative: `Tier 1 narrative for ${categoryIds[i]}`,
      tier2Narrative: `Tier 2 narrative for ${categoryIds[i]}`,
      swot: {
        strengths: ['Strength 1', 'Strength 2'],
        weaknesses: ['Weakness 1'],
        opportunities: ['Opportunity 1'],
        threats: ['Threat 1'],
      },
      keyMetrics: [],
      recommendations: [],
      benchmarks: {
        industryAverage: 65,
        topPerformer: 85,
        percentile: 55,
      },
    } as CategoryAnalysis);
  }

  return {
    categoryAnalyses: categories,
    crossCategoryInsights: withCrossCategory ? {
      systemicPatterns: [
        { pattern: 'Pattern 1', affectedCategories: ['RGP', 'MKT'], severity: 'high' },
      ],
      cascadeRisks: [
        { risk: 'Risk 1', originCategory: 'OPS', affectedCategories: ['FMG'], probability: 0.7 },
      ],
      priorityMatrix: [],
    } : undefined,
    chapters: withChapters ? [
      { code: 'GE', name: 'Growth Engine', score: 72, band: 'Proficiency' },
      { code: 'PH', name: 'Performance & Health', score: 68, band: 'Proficiency' },
      { code: 'PL', name: 'People & Leadership', score: 75, band: 'Proficiency' },
      { code: 'RS', name: 'Resilience & Safeguards', score: 65, band: 'Attention' },
    ] : [],
    dimensions: [],
    findings: [],
    recommendations: [],
    risks: [],
  } as unknown as IDM;
};

const createMockSynthesis = (options: {
  quality?: 'complete' | 'partial' | 'minimal';
  withBlankSections?: boolean;
} = {}): CrossDimensionalSynthesis => {
  const { quality = 'complete', withBlankSections = false } = options;

  return {
    rootCauseHierarchy: withBlankSections ? [] : [
      {
        issue: 'Root cause 1',
        category: 'RGP',
        severity: 'high',
        cascadeRisk: 0.8,
        contributingFactors: ['Factor 1', 'Factor 2'],
      },
    ],
    systematicIssueImpactCascade: withBlankSections ? [] : [
      {
        issue: 'Systematic issue',
        originCategory: 'OPS',
        impactLevel: 'critical',
        cascadeSteps: [
          { fromCategory: 'OPS', toCategory: 'FMG', impact: 'Financial impact', probability: 0.7 },
        ],
        mitigationStrategies: ['Strategy 1'],
      },
    ],
    leveragePointImplementationSequence: withBlankSections ? [] : [
      {
        category: 'RGP',
        intervention: 'Intervention 1',
        impact: 85,
        effort: 60,
        dependencies: [],
        implementationOrder: 1,
        expectedOutcome: 'Outcome 1',
      },
    ],
    integratedInvestmentSummary: {
      totalInvestment: 250000,
      expectedROI: 3.5,
      paybackPeriod: '18 months',
      investmentsByPhase: [
        { phase: 'Phase 1', investment: 100000, expectedReturn: 150000 },
      ],
      riskAdjustedReturn: 3.2,
    },
    overallHealthScorecard: {
      overallScore: 72,
      dimensionScores: {},
      categoryScores: { RGP: 75, MKT: 70 },
      trajectory: 'improving',
      benchmarkComparison: { industry: 'General Business', percentile: 65 },
      strengthAreas: ['Category 1', 'Category 2'],
      riskAreas: ['Category 3'],
    },
    interdependencyMapData: withBlankSections ? { nodes: [], edges: [], clusters: [] } : {
      nodes: [
        { id: 'RGP', label: 'Revenue Growth', score: 75, cluster: 'growth' },
        { id: 'MKT', label: 'Marketing', score: 70, cluster: 'growth' },
      ],
      edges: [
        { source: 'RGP', target: 'MKT', weight: 0.8, type: 'strong' },
      ],
      clusters: [
        { id: 'growth', name: 'Growth Cluster', categories: ['RGP', 'MKT'] },
      ],
    },
    coreStrategicNarrative: {
      situationSummary: 'Current situation summary',
      coreChallenge: 'Core challenge description',
      strategicOpportunity: 'Strategic opportunity',
      recommendedApproach: 'Recommended approach',
    },
    criticalQuestionsOfLeadership: withBlankSections ? [] : [
      {
        question: 'Strategic question 1',
        context: 'Context for question',
        decisionOptions: [
          { option: 'Option A', pros: ['Pro 1'], cons: ['Con 1'], recommendation: 'Recommended' },
        ],
        urgency: 'high',
      },
    ],
    pathForward: {
      phases: [
        {
          name: 'Stabilization',
          duration: '0-90 days',
          objectives: ['Objective 1'],
          keyInitiatives: ['Initiative 1'],
          successMetrics: ['Metric 1'],
        },
      ],
      criticalMilestones: [
        { milestone: 'Milestone 1', targetDate: '2024-Q1', dependencies: [] },
      ],
      riskMitigations: ['Mitigation 1'],
      resourceRequirements: 'Resource requirements summary',
    },
    synthesisQuality: quality,
    dataCompleteness: quality === 'complete' ? 95 : quality === 'partial' ? 70 : 40,
    generatedAt: new Date().toISOString(),
  };
};

// ============================================================================
// PRE-GENERATION VALIDATION TESTS
// ============================================================================

describe('Pre-Generation Validation', () => {
  it('should approve complete IDM with full category coverage', () => {
    const idm = createMockIDM({ categoryCount: 12, withCrossCategory: true });
    const result = validatePreGeneration(idm);

    expect(result.canProceed).toBe(true);
    expect(result.recommendedQuality).toBe('complete');
    expect(result.categoryCount).toBe(12);
    expect(result.crossCategoryInsightsAvailable).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should recommend partial quality for 6-9 categories', () => {
    const idm = createMockIDM({ categoryCount: 8, withCrossCategory: false });
    const result = validatePreGeneration(idm);

    expect(result.canProceed).toBe(true);
    expect(result.recommendedQuality).toBe('partial');
    expect(result.categoryCount).toBe(8);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should recommend minimal quality for fewer than 6 categories', () => {
    const idm = createMockIDM({ categoryCount: 3, withCrossCategory: false });
    const result = validatePreGeneration(idm);

    expect(result.canProceed).toBe(true);
    expect(result.recommendedQuality).toBe('minimal');
    expect(result.warnings).toContain('Only 3 categories available - synthesis will be partial');
  });

  it('should still proceed with chapters when no categories available', () => {
    const idm = createMockIDM({ categoryCount: 0, withChapters: true });
    const result = validatePreGeneration(idm);

    expect(result.canProceed).toBe(true);
    expect(result.recommendedQuality).toBe('minimal');
  });

  it('should not proceed when no data available', () => {
    const idm = createMockIDM({ categoryCount: 0, withChapters: false });
    idm.chapters = [];
    const result = validatePreGeneration(idm);

    expect(result.canProceed).toBe(false);
  });
});

// ============================================================================
// POST-GENERATION VALIDATION TESTS
// ============================================================================

describe('Post-Generation Validation', () => {
  it('should pass for complete synthesis', () => {
    const idm = createMockIDM();
    idm.crossDimensionalSynthesis = createMockSynthesis({ quality: 'complete' });

    const result = validatePostGeneration(idm);

    expect(result.passed).toBe(true);
    expect(result.blankSections).toHaveLength(0);
    expect(result.undefinedValues).toHaveLength(0);
    expect(result.qualityScore).toBeGreaterThan(80);
  });

  it('should detect blank sections', () => {
    const idm = createMockIDM();
    idm.crossDimensionalSynthesis = createMockSynthesis({ withBlankSections: true });

    const result = validatePostGeneration(idm);

    expect(result.passed).toBe(false);
    expect(result.blankSections.length).toBeGreaterThan(0);
  });

  it('should detect missing synthesis', () => {
    const idm = createMockIDM();
    idm.crossDimensionalSynthesis = undefined;

    const result = validatePostGeneration(idm);

    expect(result.passed).toBe(false);
    expect(result.blankSections).toContain('crossDimensionalSynthesis (entire section missing)');
    expect(result.qualityScore).toBe(0);
  });
});

// ============================================================================
// COMPREHENSIVE SYNTHESIS VALIDATION TESTS
// ============================================================================

describe('Comprehensive Synthesis Validation', () => {
  it('should validate complete synthesis', () => {
    const synthesis = createMockSynthesis({ quality: 'complete' });
    const result = validateSynthesis(synthesis);

    expect(result.valid).toBe(true);
    expect(result.quality).toBe('complete');
    expect(result.errors).toHaveLength(0);
    expect(result.metrics.sectionCoverage).toBeGreaterThan(80);
  });

  it('should identify partial synthesis', () => {
    const synthesis = createMockSynthesis({ quality: 'partial', withBlankSections: true });
    const result = validateSynthesis(synthesis);

    expect(result.quality).toBe('partial');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should return invalid for undefined synthesis', () => {
    const result = validateSynthesis(undefined);

    expect(result.valid).toBe(false);
    expect(result.quality).toBe('invalid');
    expect(result.errors).toContain('Cross-dimensional synthesis is undefined');
  });
});

// ============================================================================
// PMO REQUIREMENTS VALIDATION TESTS
// ============================================================================

describe('PMO Requirements Validation', () => {
  it('should validate complete PMO requirements', () => {
    const pmo = {
      phase1: {
        resourceRequirements: [{ role: 'PM', fte: 1, skills: [], duration: '90 days', estimatedCost: 50000 }],
        riskConsiderations: ['Risk 1'],
        successMetrics: [{ metric: 'Metric 1', baseline: '0', target: '100', measurementFrequency: 'Monthly', owner: 'PM' }],
      },
      phase4: {
        resourceRequirements: [{ role: 'Architect', fte: 2, skills: [], duration: '6 months', estimatedCost: 200000 }],
        successMetrics: [{ metric: 'Metric 2', baseline: '50', target: '90', measurementFrequency: 'Quarterly', owner: 'COO' }],
      },
    };

    const result = validatePMORequirements(pmo);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect missing phases', () => {
    const pmo = {
      phase1: {
        resourceRequirements: [],
        riskConsiderations: [],
        successMetrics: [],
      },
      phase4: undefined,
    };

    const result = validatePMORequirements(pmo as any);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should return invalid for undefined PMO', () => {
    const result = validatePMORequirements(undefined);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('PMO requirements is undefined');
  });
});

// ============================================================================
// IMPLEMENTATION SUMMARY VALIDATION TESTS
// ============================================================================

describe('Implementation Summary Validation', () => {
  it('should validate complete implementation summary', () => {
    const summary = {
      initiatives: [
        { name: 'Initiative 1', phase: 'Phase 1', investment: 50000, roi: 2.5, priority: 'high' },
      ],
      totalInvestment: 250000,
      expectedROI: 3.5,
      resourceSummary: 'Summary',
      topRisks: ['Risk 1'],
      businessImpact: 'High positive impact',
    };

    const result = validateImplementationSummary(summary);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect missing initiatives', () => {
    const summary = {
      initiatives: [],
      totalInvestment: 0,
      expectedROI: 0,
      resourceSummary: '',
      topRisks: [],
      businessImpact: '',
    };

    const result = validateImplementationSummary(summary);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('No initiatives defined');
  });
});

// ============================================================================
// HTML REPORT SCANNING TESTS
// ============================================================================

describe('HTML Report Scanning', () => {
  it('should pass for clean HTML', () => {
    const html = `
      <html>
        <body>
          <section id="test">
            <h1>Test Section</h1>
            <p>Valid content here.</p>
          </section>
        </body>
      </html>
    `;

    const result = scanReportHTML(html);
    expect(result.clean).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect undefined values', () => {
    const html = `
      <html>
        <body>
          <section id="test">
            <p>Score: undefined</p>
            <p>Value: null</p>
          </section>
        </body>
      </html>
    `;

    const result = scanReportHTML(html);
    expect(result.clean).toBe(false);
    expect(result.issues[0]).toContain('undefined/null/NaN');
  });

  it('should detect empty sections', () => {
    const html = `
      <html>
        <body>
          <section id="test">  </section>
          <section id="test2">Valid content</section>
        </body>
      </html>
    `;

    const result = scanReportHTML(html);
    expect(result.clean).toBe(false);
    expect(result.issues[0]).toContain('empty sections');
  });

  it('should detect placeholder text', () => {
    const html = `
      <html>
        <body>
          <section id="test">
            <p>[TODO] Add content here</p>
            <p>[PLACEHOLDER] for data</p>
          </section>
        </body>
      </html>
    `;

    const result = scanReportHTML(html);
    expect(result.clean).toBe(false);
    expect(result.issues.some(i => i.includes('placeholder'))).toBe(true);
  });
});
