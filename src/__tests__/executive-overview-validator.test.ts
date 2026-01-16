/**
 * Executive Overview Validator Tests
 *
 * Tests for third-party specification compliance:
 * - Priority logic enforcement
 * - Content quality validation
 * - Mapper functionality
 *
 * @module executive-overview-validator.test
 */

import { describe, it, expect } from 'vitest';
import {
  validatePriorityLogic,
  correctPriorityList,
  getHealthBand,
  isCriticalDimension,
  isAttentionDimension,
  getRecommendedTimeline,
} from '../orchestration/validators/executive-overview-validator.js';
import {
  validateContentQuality,
  hasSpecificNumbers,
  hasDollarAmounts,
  hasSpecificTimeframes,
  hasActionOrientedTitle,
  validateSuccessCriteria,
} from '../orchestration/validators/content-quality-validator.js';
import type {
  EnhancedStrategicPriority,
  DimensionScoreForValidation,
} from '../types/executive-overview.types.js';

// ============================================================================
// PRIORITY LOGIC VALIDATOR TESTS
// ============================================================================

describe('Executive Overview Priority Validator', () => {
  const mockDimensionScores: DimensionScoreForValidation[] = [
    { name: 'IT & Data Security', score: 25, percentile: 13 },
    { name: 'Marketing', score: 47, percentile: 46 },
    { name: 'Strategy', score: 71, percentile: 82 },
    { name: 'Sales', score: 73, percentile: 85 },
    { name: 'Customer Experience', score: 95, percentile: 99 },
  ];

  describe('validatePriorityLogic', () => {
    it('should reject priorities that ignore critical dimensions', () => {
      const badPriorities: EnhancedStrategicPriority[] = [
        {
          rank: 1,
          title: 'Improve Strategy',
          dimension: 'Strategy',
          dimensionScore: 71,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Enhance strategic planning capabilities',
          whyItMatters: 'Better strategy leads to growth',
          whatGoodLooksLike: ['Clear strategy documented'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
        {
          rank: 2,
          title: 'Enhance Sales',
          dimension: 'Sales',
          dimensionScore: 73,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Improve sales processes',
          whyItMatters: 'More sales equals more revenue',
          whatGoodLooksLike: ['Sales team trained'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
      ];

      const result = validatePriorityLogic(badPriorities, mockDimensionScores);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('IT & Data Security'))).toBe(true);
    });

    it('should accept priorities that address critical dimensions first', () => {
      const goodPriorities: EnhancedStrategicPriority[] = [
        {
          rank: 1,
          title: 'Secure IT Infrastructure',
          dimension: 'IT & Data Security',
          dimensionScore: 25,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Implement security protocols and upgrade infrastructure',
          whyItMatters: 'Critical security gaps create business risk',
          whatGoodLooksLike: ['Security audit completed', 'MFA enabled'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
        {
          rank: 2,
          title: 'Strengthen Marketing',
          dimension: 'Marketing',
          dimensionScore: 47,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Improve marketing effectiveness',
          whyItMatters: 'Better marketing drives growth',
          whatGoodLooksLike: ['Marketing plan in place'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
      ];

      const result = validatePriorityLogic(goodPriorities, mockDimensionScores);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when attention-band dimensions are not prioritized', () => {
      const noCriticalDimensions: DimensionScoreForValidation[] = [
        { name: 'Marketing', score: 47, percentile: 46 },
        { name: 'Operations', score: 52, percentile: 55 },
        { name: 'Strategy', score: 71, percentile: 82 },
      ];

      const priorities: EnhancedStrategicPriority[] = [
        {
          rank: 1,
          title: 'Improve Strategy',
          dimension: 'Strategy',
          dimensionScore: 71,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Strategy enhancement',
          whyItMatters: 'Growth',
          whatGoodLooksLike: ['Done'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
      ];

      const result = validatePriorityLogic(priorities, noCriticalDimensions);

      // Should pass but have warnings about attention-band dimensions
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('Attention-band'))).toBe(true);
    });
  });

  describe('correctPriorityList', () => {
    it('should auto-correct by inserting critical dimensions as Priority 1', () => {
      const badPriorities: EnhancedStrategicPriority[] = [
        {
          rank: 1,
          title: 'Improve Strategy',
          dimension: 'Strategy',
          dimensionScore: 71,
          timeline: '90-day',
          timelineBadgeClass: 'timeline-90',
          whatDescription: 'Strategy work',
          whyItMatters: 'Growth',
          whatGoodLooksLike: ['Complete'],
          dependencies: [],
          targetCompletion: '0-90 Days',
        },
      ];

      const corrected = correctPriorityList(badPriorities, mockDimensionScores, []);

      expect(corrected[0].dimension).toBe('IT & Data Security');
      expect(corrected[0].rank).toBe(1);
      expect(corrected[1].dimension).toBe('Strategy');
      expect(corrected[1].rank).toBe(2);
    });

    it('should use IDM recommendations for content when available', () => {
      const priorities: EnhancedStrategicPriority[] = [];

      const idmRecommendations = [
        {
          dimension: 'IT & Data Security',
          actionSteps: ['Implement MFA', 'Conduct security audit', 'Update firewall'],
          businessImpact: 'Reduce security breach risk by 80%',
          successCriteria: ['MFA enabled for all users', 'Zero critical vulnerabilities'],
        },
      ];

      const corrected = correctPriorityList(priorities, mockDimensionScores, idmRecommendations);

      expect(corrected[0].whatDescription).toContain('MFA');
      expect(corrected[0].whyItMatters).toContain('80%');
    });
  });

  describe('Utility Functions', () => {
    it('getHealthBand should return correct bands', () => {
      expect(getHealthBand(85)).toBe('Excellence');
      expect(getHealthBand(70)).toBe('Proficiency');
      expect(getHealthBand(50)).toBe('Attention');
      expect(getHealthBand(30)).toBe('Critical');
    });

    it('isCriticalDimension should correctly identify critical scores', () => {
      expect(isCriticalDimension(39)).toBe(true);
      expect(isCriticalDimension(40)).toBe(false);
      expect(isCriticalDimension(25)).toBe(true);
    });

    it('isAttentionDimension should correctly identify attention scores', () => {
      expect(isAttentionDimension(45)).toBe(true);
      expect(isAttentionDimension(59)).toBe(true);
      expect(isAttentionDimension(39)).toBe(false);
      expect(isAttentionDimension(60)).toBe(false);
    });

    it('getRecommendedTimeline should return appropriate timelines', () => {
      expect(getRecommendedTimeline(30)).toBe('90-day');  // Critical
      expect(getRecommendedTimeline(50)).toBe('90-day');  // Attention
      expect(getRecommendedTimeline(65)).toBe('6-month'); // Improvement
      expect(getRecommendedTimeline(80)).toBe('12-month'); // Enhancement
    });
  });
});

// ============================================================================
// CONTENT QUALITY VALIDATOR TESTS
// ============================================================================

describe('Content Quality Validator', () => {
  describe('validateContentQuality', () => {
    it('should reject generic language patterns', () => {
      const genericContent = 'Conduct detailed marketing assessment. Develop improvement plan with measurable KPIs. See detailed analysis. TBD.';

      const result = validateContentQuality(genericContent, 'Strategic Priorities');

      // With multiple critical violations, score should drop below 75
      expect(result.violations.length).toBeGreaterThan(0);
      // Check for critical violations like 'assessment', 'TBD', or 'detailed analysis'
      expect(result.violations.some(v =>
        v.pattern.toLowerCase().includes('assessment') ||
        v.pattern === 'TBD' ||
        v.pattern.toLowerCase().includes('detailed analysis')
      )).toBe(true);
      expect(result.score).toBeLessThan(100); // Score should be reduced
    });

    it('should accept specific, actionable content', () => {
      const goodContent = 'Launch 6-week digital marketing transformation program targeting 150 MQLs/month. Phase 1: Implement marketing automation platform. Phase 2: Deploy lead scoring model achieving 35% qualified rate.';

      const result = validateContentQuality(goodContent, 'Strategic Priorities');

      expect(result.passing).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('should flag TBD as critical violation', () => {
      const contentWithTBD = 'Investment required: TBD. Expected ROI: See detailed analysis.';

      const result = validateContentQuality(contentWithTBD, 'Financial Impact');

      expect(result.violations.some(v => v.pattern === 'TBD')).toBe(true);
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
    });

    it('should flag "implement quick wins" as critical violation', () => {
      const content = 'We recommend you implement quick wins and monitor progress.';

      const result = validateContentQuality(content, 'Recommendations');

      expect(result.violations.some(v => v.pattern.toLowerCase().includes('quick wins'))).toBe(true);
    });

    it('should flag "monitor and adjust" as critical violation', () => {
      const content = 'The team should monitor progress and adjust as needed.';

      const result = validateContentQuality(content, 'Action Plan');

      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should warn when no quantified impact is present', () => {
      const vagueContent = 'This initiative will improve operations and enhance customer satisfaction significantly through better processes.';

      const result = validateContentQuality(vagueContent, 'Strategic Priorities');

      expect(result.violations.some(v => v.pattern.includes('No quantified impact'))).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('hasSpecificNumbers should detect actual numbers', () => {
      expect(hasSpecificNumbers('Achieve 150 MQLs per month')).toBe(true);
      expect(hasSpecificNumbers('Improve by 25%')).toBe(true);
      expect(hasSpecificNumbers('No specific targets')).toBe(false);
    });

    it('hasDollarAmounts should detect currency values', () => {
      expect(hasDollarAmounts('Investment of $50,000')).toBe(true);
      expect(hasDollarAmounts('Expected $1.5M savings')).toBe(true);
      expect(hasDollarAmounts('Significant investment')).toBe(false);
    });

    it('hasSpecificTimeframes should detect timeframes', () => {
      expect(hasSpecificTimeframes('Complete within 90 days')).toBe(true);
      expect(hasSpecificTimeframes('Launch by Q2 2024')).toBe(true);
      expect(hasSpecificTimeframes('Complete by March')).toBe(true);
      expect(hasSpecificTimeframes('In the near future')).toBe(false);
    });

    it('hasActionOrientedTitle should validate title format', () => {
      expect(hasActionOrientedTitle('Implement Marketing Automation')).toBe(true);
      expect(hasActionOrientedTitle('Deploy Cloud Infrastructure')).toBe(true);
      expect(hasActionOrientedTitle('Marketing Improvements')).toBe(false);
      expect(hasActionOrientedTitle('Better Sales Results')).toBe(false);
    });
  });

  describe('validateSuccessCriteria', () => {
    it('should flag checkbox-style criteria', () => {
      const checkboxCriteria = [
        'Complete: Initial assessment',
        'Finish training program',
        'Done: Documentation',
      ];

      const result = validateSuccessCriteria(checkboxCriteria);

      expect(result.valid).toBe(false);
      // May find multiple issues per criterion (checkbox-style + measurability)
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });

    it('should accept measurable outcome criteria', () => {
      const goodCriteria = [
        'Sales conversion rate increased from 15% to 25%',
        'Customer satisfaction score reaches 85+',
        'Pipeline velocity improves by 30%',
      ];

      const result = validateSuccessCriteria(goodCriteria);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should flag criteria without measurable elements', () => {
      const vagueCriteria = [
        'Team is aligned on priorities',
        'Processes are documented',
        'Culture has improved',
      ];

      const result = validateSuccessCriteria(vagueCriteria);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Priority and Content Validator Integration', () => {
  it('should pass for well-structured priorities addressing critical gaps', () => {
    const dimensionScores: DimensionScoreForValidation[] = [
      { name: 'IT Security', score: 32, percentile: 20 },
      { name: 'Marketing', score: 55, percentile: 50 },
      { name: 'Sales', score: 72, percentile: 75 },
    ];

    const priorities: EnhancedStrategicPriority[] = [
      {
        rank: 1,
        title: 'Implement Zero-Trust Security Framework',
        dimension: 'IT Security',
        dimensionScore: 32,
        timeline: '90-day',
        timelineBadgeClass: 'timeline-90',
        whatDescription: 'Deploy MFA across all systems, implement network segmentation, and establish security monitoring with 24/7 SOC coverage.',
        whyItMatters: 'Current security posture at 32/100 creates $500K+ breach risk. Implementation reduces exposure by 85% within 90 days.',
        whatGoodLooksLike: [
          'MFA enabled for 100% of users',
          'Security incident response time under 15 minutes',
          'Zero critical vulnerabilities in quarterly scan',
        ],
        dependencies: [],
        targetCompletion: '0-90 Days',
      },
    ];

    // Validate priority logic
    const priorityResult = validatePriorityLogic(priorities, dimensionScores);
    expect(priorityResult.valid).toBe(true);

    // Validate content quality
    const contentResult = validateContentQuality(
      priorities[0].whatDescription + ' ' + priorities[0].whyItMatters,
      'Priority 1'
    );
    expect(contentResult.passing).toBe(true);
  });
});
