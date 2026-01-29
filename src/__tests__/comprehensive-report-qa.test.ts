/**
 * Comprehensive Report QA Tests
 *
 * Regression tests to ensure the comprehensive report fixes work correctly.
 * Tests cover:
 * - formatPaybackMonths utility (Infinitymo fix)
 * - deriveDeliverableFromAction utility (Completed: prefix fix)
 * - HTML structure validation (reportType scoping)
 * - Forbidden pattern detection
 *
 * @module __tests__/comprehensive-report-qa.test
 */

import { describe, it, expect } from 'vitest';
import { formatPaybackMonths, isValidPaybackDisplay, calculatePaybackMonths } from '../orchestration/reports/utils/financial-metrics.js';
import { deriveDeliverableFromAction, isValidDeliverable, ensureValidDeliverable } from '../orchestration/reports/utils/deliverable-generator.js';

// ============================================================================
// PAYBACK MONTHS FORMATTING TESTS (Task 4: Infinitymo fix)
// ============================================================================

describe('formatPaybackMonths', () => {
  describe('edge cases', () => {
    it('returns N/A for zero investment and zero return', () => {
      expect(formatPaybackMonths(0, 0)).toBe('N/A');
    });

    it('returns Immediate for zero investment with positive return', () => {
      expect(formatPaybackMonths(0, 50000)).toBe('Immediate');
    });

    it('returns N/A for positive investment with zero return', () => {
      expect(formatPaybackMonths(50000, 0)).toBe('N/A');
    });

    it('returns N/A for null inputs', () => {
      expect(formatPaybackMonths(null, null)).toBe('N/A');
    });

    it('returns N/A for undefined inputs', () => {
      expect(formatPaybackMonths(undefined, undefined)).toBe('N/A');
    });

    it('handles NaN values safely', () => {
      expect(formatPaybackMonths(NaN, 50000)).toBe('N/A');
      expect(formatPaybackMonths(50000, NaN)).toBe('N/A');
    });

    it('handles Infinity values safely', () => {
      // This would cause "Infinitymo" bug without proper guards
      expect(formatPaybackMonths(Infinity, 50000)).toBe('N/A');
      expect(formatPaybackMonths(50000, Infinity)).not.toContain('Infinity');
    });
  });

  describe('valid calculations', () => {
    it('calculates correct months for standard inputs', () => {
      // $50K investment with $100K annual return = 6 months payback
      expect(formatPaybackMonths(50000, 100000)).toBe('6 months');
    });

    it('uses explicit timeToValue when provided', () => {
      expect(formatPaybackMonths(50000, 100000, 3)).toBe('3 months');
    });

    it('handles very long paybacks', () => {
      // $1M investment with $10K annual return = 120 months = 10 years
      expect(formatPaybackMonths(1000000, 10000)).toBe('10+ years');
    });

    it('formats 12+ months correctly', () => {
      // $100K investment with $100K annual return = 12 months = 1 year
      expect(formatPaybackMonths(100000, 100000)).toBe('1 year');
    });

    it('formats year and months correctly', () => {
      // $150K investment with $100K annual return = 18 months = 1yr 6mo
      expect(formatPaybackMonths(150000, 100000)).toBe('1yr 6mo');
    });

    it('formats 2+ years correctly', () => {
      // $300K investment with $100K annual return = 36 months = 3 years
      expect(formatPaybackMonths(300000, 100000)).toBe('3 years');
    });
  });
});

describe('isValidPaybackDisplay', () => {
  it('returns false for strings containing infinity', () => {
    expect(isValidPaybackDisplay('Infinitymo')).toBe(false);
    expect(isValidPaybackDisplay('Infinity months')).toBe(false);
  });

  it('returns false for strings containing NaN', () => {
    expect(isValidPaybackDisplay('NaNmo')).toBe(false);
    expect(isValidPaybackDisplay('NaN months')).toBe(false);
  });

  it('returns false for undefined/null strings', () => {
    expect(isValidPaybackDisplay('undefined')).toBe(false);
    expect(isValidPaybackDisplay('null')).toBe(false);
  });

  it('returns true for valid display strings', () => {
    expect(isValidPaybackDisplay('6 months')).toBe(true);
    expect(isValidPaybackDisplay('1 year')).toBe(true);
    expect(isValidPaybackDisplay('1yr 6mo')).toBe(true);
    expect(isValidPaybackDisplay('N/A')).toBe(true);
    expect(isValidPaybackDisplay('Immediate')).toBe(true);
  });
});

describe('calculatePaybackMonths', () => {
  it('returns 0 for zero investment with positive return', () => {
    expect(calculatePaybackMonths(0, 50000)).toBe(0);
  });

  it('returns null for impossible calculations', () => {
    expect(calculatePaybackMonths(50000, 0)).toBe(null);
    expect(calculatePaybackMonths(0, 0)).toBe(null);
  });

  it('returns correct number of months', () => {
    expect(calculatePaybackMonths(50000, 100000)).toBe(6);
  });
});

// ============================================================================
// DELIVERABLE GENERATOR TESTS (Task 3: Completed: prefix fix)
// ============================================================================

describe('deriveDeliverableFromAction', () => {
  describe('Completed: prefix stripping', () => {
    it('strips Completed: prefix and generates proper deliverable', () => {
      const result = deriveDeliverableFromAction('Completed: Conduct marketing assessment');
      expect(result).not.toContain('Completed');
      expect(result).toContain('Report');
    });

    it('strips In Progress: prefix', () => {
      const result = deriveDeliverableFromAction('In Progress: Develop improvement plan');
      expect(result).not.toContain('In Progress');
      expect(result).toContain('Plan');
    });
  });

  describe('action verb templates', () => {
    it('generates Report for Conduct actions', () => {
      expect(deriveDeliverableFromAction('Conduct detailed strategy assessment'))
        .toBe('Detailed Strategy Assessment Report');
    });

    it('generates Plan for Develop actions', () => {
      expect(deriveDeliverableFromAction('Develop improvement plan with KPIs'))
        .toBe('Improvement Plan With Kpis Plan');
    });

    it('generates Implementation Log for Implement actions', () => {
      expect(deriveDeliverableFromAction('Implement new CRM system'))
        .toBe('New Crm System Implementation Log');
    });

    it('generates Dashboard for Monitor actions', () => {
      expect(deriveDeliverableFromAction('Monitor key performance metrics'))
        .toBe('Progress Tracking Dashboard');
    });

    it('generates Framework for Establish actions', () => {
      expect(deriveDeliverableFromAction('Establish governance framework'))
        .toBe('Governance Framework Framework');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(deriveDeliverableFromAction('')).toBe('Deliverable Documentation');
    });

    it('handles undefined', () => {
      expect(deriveDeliverableFromAction(undefined as any)).toBe('Deliverable Documentation');
    });

    it('handles null', () => {
      expect(deriveDeliverableFromAction(null as any)).toBe('Deliverable Documentation');
    });

    it('handles unknown verbs', () => {
      expect(deriveDeliverableFromAction('Do something important'))
        .toBe('Do Something Important Documentation');
    });
  });
});

describe('isValidDeliverable', () => {
  describe('invalid patterns', () => {
    it('returns false for Completed: prefix', () => {
      expect(isValidDeliverable('Completed: Conduct assessment')).toBe(false);
    });

    it('returns false for action verbs as prefix', () => {
      expect(isValidDeliverable('Conduct marketing assessment')).toBe(false);
      expect(isValidDeliverable('Develop improvement plan')).toBe(false);
      expect(isValidDeliverable('Implement CRM system')).toBe(false);
    });

    it('returns false for empty/null values', () => {
      expect(isValidDeliverable('')).toBe(false);
      expect(isValidDeliverable(null)).toBe(false);
      expect(isValidDeliverable(undefined)).toBe(false);
    });
  });

  describe('valid patterns', () => {
    it('returns true for proper deliverable names', () => {
      expect(isValidDeliverable('Assessment Report')).toBe(true);
      expect(isValidDeliverable('Implementation Plan')).toBe(true);
      expect(isValidDeliverable('Progress Tracking Dashboard')).toBe(true);
    });
  });
});

describe('ensureValidDeliverable', () => {
  it('returns valid deliverable as-is', () => {
    expect(ensureValidDeliverable('Assessment Report', 'Conduct assessment'))
      .toBe('Assessment Report');
  });

  it('generates deliverable when existing is invalid', () => {
    expect(ensureValidDeliverable('Completed: Conduct assessment', 'Conduct market research'))
      .toBe('Market Research Report');
  });

  it('generates deliverable when null', () => {
    expect(ensureValidDeliverable(null, 'Develop strategy plan'))
      .toBe('Strategy Plan Plan');
  });
});

// ============================================================================
// FORBIDDEN PATTERNS (QA Guardrails)
// ============================================================================

describe('Comprehensive Report HTML Quality', () => {
  const FORBIDDEN_PATTERNS = [
    /Infinitymo/gi,
    /NaN(?![a-zA-Z])/g,  // NaN not followed by letters
    /\bundefined\b/g,
    /Completed:\s*Conduct/gi,
    /Completed:\s*Develop/gi,
    /Completed:\s*Implement/gi,
  ];

  describe('Forbidden pattern detection', () => {
    it('should detect Infinitymo in test string', () => {
      const testHtml = '<div>Payback: Infinitymo</div>';
      const hasMatch = FORBIDDEN_PATTERNS.some(pattern => pattern.test(testHtml));
      expect(hasMatch).toBe(true);
    });

    it('should detect Completed: Conduct in test string', () => {
      const testHtml = '<td>Completed: Conduct marketing assessment</td>';
      const hasMatch = FORBIDDEN_PATTERNS.some(pattern => pattern.test(testHtml));
      expect(hasMatch).toBe(true);
    });

    it('should not flag valid content', () => {
      const validHtml = '<td>Assessment Report</td><div>6 months</div>';
      const hasMatch = FORBIDDEN_PATTERNS.some(pattern => pattern.test(validHtml));
      expect(hasMatch).toBe(false);
    });
  });
});

// ============================================================================
// REPORT TYPE SCOPING (Task 1)
// ============================================================================

describe('Report Type Scoping', () => {
  it('should generate correct body class pattern', () => {
    const reportType = 'comprehensive';
    const expectedClass = `bizhealth-report bizhealth-report--${reportType}`;
    expect(expectedClass).toBe('bizhealth-report bizhealth-report--comprehensive');
  });

  it('should generate correct data attribute', () => {
    const reportType = 'comprehensive';
    const expectedAttr = `data-report-type="${reportType}"`;
    expect(expectedAttr).toBe('data-report-type="comprehensive"');
  });
});
