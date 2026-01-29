/**
 * Phase 1.5 → Phase 2 Contract Validation Tests
 *
 * Tests for:
 * - Contract validation between Phase 1.5 and Phase 2
 * - Issue detection for malformed outputs
 * - Contract mapping utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validatePhase15ToPhase2Contract,
  mapPhase15ToPhase2Input,
  assertPhase15ContractSafe,
  getContractValidationSummary,
  type ContractValidationResult
} from '../types/phase1-5-to-phase2-contract.js';

import type { Phase1_5Output, CategoryAnalysis, ChapterSummary } from '../types/phase1-5.types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createValidCategoryAnalysis = (code: string): CategoryAnalysis => ({
  categoryCode: code,
  categoryName: `${code} Category`,
  chapterCode: 'GE',
  chapterName: 'Growth Engine',
  overallScore: 72,
  confidenceLevel: 'high',
  status: 'Good',
  questionCount: 5,
  questionAnalyses: [],
  executiveSummary: 'This is an executive summary for the category analysis.',
  detailedAnalysis: 'This is a detailed analysis.',
  strengths: [{ title: 'Strength 1', description: 'Description', evidence: [], impactLevel: 'high' }],
  weaknesses: [{ title: 'Weakness 1', description: 'Description', evidence: [], severity: 'medium', rootCause: 'Root cause' }],
  quickWins: [{ title: 'Quick Win 1', description: 'Description', effort: 'low', impact: 'high', timeline: '30 days', estimatedROI: '100%' }],
  categoryRisks: [{ title: 'Risk 1', description: 'Description', likelihood: 'medium', impact: 'high', mitigation: 'Mitigation' }],
  benchmarkComparisons: [],
  analysisMetadata: { promptTokens: 100, completionTokens: 200, processingTimeMs: 1000, modelUsed: 'claude-3' }
});

const createValidChapterSummary = (code: string): ChapterSummary => ({
  chapterCode: code,
  chapterName: `${code} Chapter`,
  overallScore: 73,
  categoryScores: { STR: 72, SAL: 74, MKT: 73 },
  executiveSummary: 'Chapter summary',
  keyThemes: ['Theme 1', 'Theme 2'],
  crossCategoryPatterns: ['Pattern 1']
});

const createValidPhase15Output = (): Phase1_5Output => ({
  phase: 'phase_1_5',
  status: 'complete',
  companyId: 'test-company-123',
  companyName: 'Test Company Inc',
  industry: 'technology',
  companySize: 'medium',
  growthStage: 'growth',
  categoryAnalyses: [
    createValidCategoryAnalysis('STR'),
    createValidCategoryAnalysis('SAL'),
    createValidCategoryAnalysis('MKT'),
    createValidCategoryAnalysis('CXP'),
    createValidCategoryAnalysis('OPS'),
    createValidCategoryAnalysis('FIN'),
    createValidCategoryAnalysis('HRS'),
    createValidCategoryAnalysis('LDG'),
    createValidCategoryAnalysis('TIN'),
    createValidCategoryAnalysis('ITD'),
    createValidCategoryAnalysis('RMS'),
    createValidCategoryAnalysis('CMP')
  ],
  chapterSummaries: [
    createValidChapterSummary('GE'),
    createValidChapterSummary('PH'),
    createValidChapterSummary('PL'),
    createValidChapterSummary('RS')
  ],
  crossCategoryInsights: {
    systemicPatterns: [{ pattern: 'Pattern', affectedCategories: ['STR', 'SAL'], severity: 'medium', recommendation: 'Fix it' }],
    interdependencyAnalysis: {
      strongConnections: [{ from: 'STR', to: 'SAL', strength: 0.8, description: 'Strong connection' }],
      cascadeRisks: [{ triggerCategory: 'FIN', affectedCategories: ['OPS'], riskLevel: 'medium', description: 'Cascade risk' }]
    },
    prioritizationMatrix: [{ categoryCode: 'STR', urgency: 'high', impact: 'high', easeOfExecution: 'medium', recommendedPriority: 1 }]
  },
  overallSummary: {
    healthScore: 72,
    healthStatus: 'Good',
    trajectory: 'Improving',
    topStrengths: ['Strength 1'],
    topWeaknesses: ['Weakness 1'],
    topOpportunities: ['Opportunity 1'],
    topRisks: ['Risk 1']
  },
  metadata: {
    assessmentId: 'assessment-123',
    generatedAt: new Date().toISOString(),
    totalTokenUsage: { prompt: 1000, completion: 2000, total: 3000 },
    processingTimeMs: 60000,
    version: '1.0.0'
  }
});

// ============================================================================
// validatePhase15ToPhase2Contract Tests
// ============================================================================

describe('validatePhase15ToPhase2Contract', () => {
  it('should validate complete Phase 1.5 output successfully', () => {
    const phase15 = createValidPhase15Output();
    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect non-array categoryAnalyses', () => {
    const phase15 = createValidPhase15Output();
    (phase15 as any).categoryAnalyses = 'not an array';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'categoryAnalyses must be an array')).toBe(true);
  });

  it('should detect incorrect number of categories', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses = phase15.categoryAnalyses.slice(0, 10); // Only 10 categories

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('Expected 12 categories'))).toBe(true);
  });

  it('should detect missing category codes', () => {
    const phase15 = createValidPhase15Output();
    // Remove STR and add duplicate SAL
    phase15.categoryAnalyses[0] = createValidCategoryAnalysis('SAL');

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('Missing required category: STR'))).toBe(true);
  });

  it('should detect invalid categoryCode type', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).categoryCode = 123;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('categoryCode') && i.message.includes('must be a string'))).toBe(true);
  });

  it('should detect invalid overallScore type', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).overallScore = 'not a number';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('overallScore'))).toBe(true);
  });

  it('should detect overallScore out of range (below 0)', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses[0].overallScore = -5;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('between 0 and 100'))).toBe(true);
  });

  it('should detect overallScore out of range (above 100)', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses[0].overallScore = 150;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('between 0 and 100'))).toBe(true);
  });

  it('should detect invalid status', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).status = 'InvalidStatus';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('valid CategoryStatus'))).toBe(true);
  });

  it('should validate all valid statuses', () => {
    const validStatuses = ['Critical', 'Needs Improvement', 'Developing', 'Good', 'Excellent'];

    for (const status of validStatuses) {
      const phase15 = createValidPhase15Output();
      phase15.categoryAnalyses[0].status = status as any;

      const result = validatePhase15ToPhase2Contract(phase15);

      expect(result.issues.filter(i => i.path.includes('status') && i.path.includes('[0]'))).toHaveLength(0);
    }
  });

  it('should detect non-array strengths', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).strengths = 'not an array';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('strengths'))).toBe(true);
  });

  it('should detect non-array weaknesses', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).weaknesses = { not: 'an array' };

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('weaknesses'))).toBe(true);
  });

  it('should detect non-array quickWins', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).quickWins = null;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('quickWins'))).toBe(true);
  });

  it('should detect non-array categoryRisks', () => {
    const phase15 = createValidPhase15Output();
    (phase15.categoryAnalyses[0] as any).categoryRisks = undefined;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('categoryRisks'))).toBe(true);
  });

  it('should detect empty executiveSummary', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses[0].executiveSummary = '';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('executiveSummary'))).toBe(true);
  });

  it('should detect incorrect chapter summaries count', () => {
    const phase15 = createValidPhase15Output();
    phase15.chapterSummaries = phase15.chapterSummaries.slice(0, 2);

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message.includes('4 chapter summaries'))).toBe(true);
  });

  it('should detect missing overallSummary', () => {
    const phase15 = createValidPhase15Output();
    (phase15 as any).overallSummary = undefined;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'overallSummary is required')).toBe(true);
  });

  it('should detect missing healthScore in overallSummary', () => {
    const phase15 = createValidPhase15Output();
    (phase15.overallSummary as any).healthScore = undefined;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.path.includes('healthScore'))).toBe(true);
  });

  it('should detect missing healthStatus in overallSummary', () => {
    const phase15 = createValidPhase15Output();
    (phase15.overallSummary as any).healthStatus = '';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'healthStatus is required')).toBe(true);
  });

  it('should detect missing trajectory in overallSummary', () => {
    const phase15 = createValidPhase15Output();
    (phase15.overallSummary as any).trajectory = '';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'trajectory is required')).toBe(true);
  });

  it('should detect missing crossCategoryInsights', () => {
    const phase15 = createValidPhase15Output();
    (phase15 as any).crossCategoryInsights = undefined;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'crossCategoryInsights is required')).toBe(true);
  });

  it('should detect non-array systemicPatterns', () => {
    const phase15 = createValidPhase15Output();
    (phase15.crossCategoryInsights as any).systemicPatterns = 'not an array';

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'systemicPatterns must be an array')).toBe(true);
  });

  it('should detect missing interdependencyAnalysis', () => {
    const phase15 = createValidPhase15Output();
    (phase15.crossCategoryInsights as any).interdependencyAnalysis = undefined;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'interdependencyAnalysis is required')).toBe(true);
  });

  it('should detect non-array prioritizationMatrix', () => {
    const phase15 = createValidPhase15Output();
    (phase15.crossCategoryInsights as any).prioritizationMatrix = {};

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(false);
    expect(result.issues.some(i => i.message === 'prioritizationMatrix must be an array')).toBe(true);
  });
});

// ============================================================================
// mapPhase15ToPhase2Input Tests
// ============================================================================

describe('mapPhase15ToPhase2Input', () => {
  it('should map categories', () => {
    const phase15 = createValidPhase15Output();
    const mapped = mapPhase15ToPhase2Input(phase15);

    expect(mapped.categories).toEqual(phase15.categoryAnalyses);
  });

  it('should map overall score', () => {
    const phase15 = createValidPhase15Output();
    const mapped = mapPhase15ToPhase2Input(phase15);

    expect(mapped.overallScore).toBe(phase15.overallSummary.healthScore);
  });

  it('should map chapter summaries', () => {
    const phase15 = createValidPhase15Output();
    const mapped = mapPhase15ToPhase2Input(phase15);

    expect(mapped.chapterSummaries).toEqual(phase15.chapterSummaries);
  });

  it('should preserve all 12 categories', () => {
    const phase15 = createValidPhase15Output();
    const mapped = mapPhase15ToPhase2Input(phase15);

    expect(mapped.categories).toHaveLength(12);
  });

  it('should preserve all 4 chapter summaries', () => {
    const phase15 = createValidPhase15Output();
    const mapped = mapPhase15ToPhase2Input(phase15);

    expect(mapped.chapterSummaries).toHaveLength(4);
  });
});

// ============================================================================
// assertPhase15ContractSafe Tests
// ============================================================================

describe('assertPhase15ContractSafe', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should not throw for valid Phase 1.5 output', () => {
    const phase15 = createValidPhase15Output();

    expect(() => assertPhase15ContractSafe(phase15)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('✓ Phase 1.5 output validated for Phase 2 compatibility');
  });

  it('should throw for invalid Phase 1.5 output', () => {
    const phase15 = createValidPhase15Output();
    (phase15 as any).categoryAnalyses = undefined;

    expect(() => assertPhase15ContractSafe(phase15)).toThrow('Phase 1.5 → Phase 2 contract validation failed');
  });

  it('should include issue details in error message', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses[0].overallScore = -10;

    try {
      assertPhase15ContractSafe(phase15);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toContain('overallScore');
      expect((error as Error).message).toContain('between 0 and 100');
    }
  });
});

// ============================================================================
// getContractValidationSummary Tests
// ============================================================================

describe('getContractValidationSummary', () => {
  it('should return success message for compatible output', () => {
    const result: ContractValidationResult = {
      isCompatible: true,
      issues: []
    };

    const summary = getContractValidationSummary(result);

    expect(summary).toBe('Phase 1.5 output is fully compatible with Phase 2');
  });

  it('should return issue count for incompatible output', () => {
    const result: ContractValidationResult = {
      isCompatible: false,
      issues: [
        { path: 'test', expectedType: 'string', actualType: 'number', message: 'Test error' },
        { path: 'test2', expectedType: 'array', actualType: 'object', message: 'Test error 2' }
      ]
    };

    const summary = getContractValidationSummary(result);

    expect(summary).toContain('2 issues');
  });

  it('should identify critical errors', () => {
    const result: ContractValidationResult = {
      isCompatible: false,
      issues: [
        { path: 'categoryAnalyses', expectedType: 'array', actualType: 'undefined', message: 'Missing' },
        { path: 'categoryAnalyses[0].score', expectedType: 'number', actualType: 'string', message: 'Invalid' }
      ]
    };

    const summary = getContractValidationSummary(result);

    expect(summary).toContain('1 critical');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Phase 1.5 to Phase 2 Contract Integration', () => {
  it('should validate and map complete output', () => {
    const phase15 = createValidPhase15Output();

    // First validate
    const validation = validatePhase15ToPhase2Contract(phase15);
    expect(validation.isCompatible).toBe(true);

    // Then map
    const mapped = mapPhase15ToPhase2Input(phase15);
    expect(mapped.categories).toHaveLength(12);
    expect(mapped.chapterSummaries).toHaveLength(4);
    expect(mapped.overallScore).toBe(72);
  });

  it('should detect all 12 required category codes', () => {
    const requiredCodes = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'];
    const phase15 = createValidPhase15Output();

    const foundCodes = phase15.categoryAnalyses.map(c => c.categoryCode);

    for (const code of requiredCodes) {
      expect(foundCodes).toContain(code);
    }
  });

  it('should handle edge case scores (0 and 100)', () => {
    const phase15 = createValidPhase15Output();
    phase15.categoryAnalyses[0].overallScore = 0;
    phase15.categoryAnalyses[1].overallScore = 100;

    const result = validatePhase15ToPhase2Contract(phase15);

    expect(result.isCompatible).toBe(true);
  });
});
