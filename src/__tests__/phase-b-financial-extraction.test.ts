/**
 * Phase B: AI-Structured Financial Output Tests
 *
 * Tests the structured financial data extraction from Phase 2 AI analysis
 * and aggregation in the IDM consolidator.
 */

import { describe, it, expect } from 'vitest';
import {
  StrategicFinancialOpportunity,
  StrategicFinancialOpportunitySchema,
  FinancialImpactSummarySchema,
  calculateFiveYearValue,
  MINIMUM_FINANCIAL_IMPACT_THRESHOLD,
  validateStrategicFinancialOpportunity,
  safeValidateStrategicFinancialOpportunity
} from '../types/strategic-financial.types.js';
import { testExports } from '../orchestration/idm-consolidator.js';

const {
  aggregateFinancialImpact,
  buildCategoryBreakdown,
  calculateFinancialDataQualityScore
} = testExports;

describe('Phase B: Structured Financial Types', () => {
  describe('StrategicFinancialOpportunity Schema', () => {
    it('should validate a complete financial opportunity', () => {
      const opportunity: StrategicFinancialOpportunity = {
        opportunity_id: 'rec_001',
        opportunity_title: 'Improve Sales Close Rate',
        opportunity_description: 'Focus on sales training and process optimization',
        financial_impact: {
          annual_value_min: 250000,
          annual_value_max: 500000,
          annual_value_base: 375000,
          confidence_level: 'Medium',
          currency: 'USD',
          calculation_basis: 'Gap between 15% current and 25% benchmark on $5M pipeline',
          assumptions: ['Pipeline remains stable', 'Training improves close rate'],
          data_sources: ['questionnaire', 'benchmark']
        },
        impact_category: 'Revenue_Growth',
        affected_categories: ['SAL', 'MKT'],
        implementation_complexity: 'Medium',
        time_to_value_months: 6,
        prerequisites: ['Sales CRM setup'],
        key_milestones: ['Training complete', 'Process documented'],
        evidence_source: 'Phase 2 Strategic Recommendations',
        supporting_data_points: ['Current close rate: 15%']
      };

      const result = StrategicFinancialOpportunitySchema.safeParse(opportunity);
      expect(result.success).toBe(true);
    });

    it('should reject invalid confidence level', () => {
      const opportunity = {
        opportunity_id: 'rec_001',
        opportunity_title: 'Test',
        opportunity_description: 'Test',
        financial_impact: {
          annual_value_min: 100000,
          annual_value_max: 200000,
          annual_value_base: 150000,
          confidence_level: 'Invalid', // Invalid
          currency: 'USD',
          calculation_basis: 'Test'
        },
        impact_category: 'Revenue_Growth',
        implementation_complexity: 'Medium',
        time_to_value_months: 6
      };

      const result = StrategicFinancialOpportunitySchema.safeParse(opportunity);
      expect(result.success).toBe(false);
    });

    it('should reject negative financial values', () => {
      const opportunity = {
        opportunity_id: 'rec_001',
        opportunity_title: 'Test',
        opportunity_description: 'Test',
        financial_impact: {
          annual_value_min: -100000, // Invalid
          annual_value_max: 200000,
          annual_value_base: 150000,
          confidence_level: 'Medium',
          currency: 'USD',
          calculation_basis: 'Test'
        },
        impact_category: 'Revenue_Growth',
        implementation_complexity: 'Medium',
        time_to_value_months: 6
      };

      const result = StrategicFinancialOpportunitySchema.safeParse(opportunity);
      expect(result.success).toBe(false);
    });
  });

  describe('calculateFiveYearValue', () => {
    it('should calculate 5-year value with degradation', () => {
      const annualValue = 100000;
      // Year 1: 100%, Year 2: 95%, Year 3: 90%, Year 4: 85%, Year 5: 80%
      // Total: 100000 * (1 + 0.95 + 0.9 + 0.85 + 0.8) = 100000 * 4.5 = 450000
      const fiveYearValue = calculateFiveYearValue(annualValue);
      expect(fiveYearValue).toBe(450000);
    });

    it('should return 0 for 0 annual value', () => {
      expect(calculateFiveYearValue(0)).toBe(0);
    });
  });

  describe('MINIMUM_FINANCIAL_IMPACT_THRESHOLD', () => {
    it('should be $100,000', () => {
      expect(MINIMUM_FINANCIAL_IMPACT_THRESHOLD).toBe(100000);
    });
  });
});

describe('Phase B: Financial Aggregation', () => {
  const mockOpportunities: StrategicFinancialOpportunity[] = [
    {
      opportunity_id: 'rec_001',
      opportunity_title: 'Sales Improvement',
      opportunity_description: 'Improve sales close rate',
      financial_impact: {
        annual_value_min: 250000,
        annual_value_max: 500000,
        annual_value_base: 375000,
        confidence_level: 'Medium',
        currency: 'USD',
        calculation_basis: 'Gap analysis',
        assumptions: [],
        data_sources: ['questionnaire']
      },
      impact_category: 'Revenue_Growth',
      affected_categories: ['SAL'],
      implementation_complexity: 'Medium',
      time_to_value_months: 6,
      prerequisites: [],
      key_milestones: [],
      evidence_source: 'Phase 2 Strategic Recommendations',
      supporting_data_points: []
    },
    {
      opportunity_id: 'rec_002',
      opportunity_title: 'Cost Reduction',
      opportunity_description: 'Reduce operational costs',
      financial_impact: {
        annual_value_min: 150000,
        annual_value_max: 300000,
        annual_value_base: 225000,
        confidence_level: 'High',
        currency: 'USD',
        calculation_basis: 'Cost analysis',
        assumptions: [],
        data_sources: ['questionnaire']
      },
      impact_category: 'Cost_Efficiency',
      affected_categories: ['OPS'],
      implementation_complexity: 'Low',
      time_to_value_months: 3,
      prerequisites: [],
      key_milestones: [],
      evidence_source: 'Phase 2 Strategic Recommendations',
      supporting_data_points: []
    }
  ];

  describe('aggregateFinancialImpact', () => {
    it('should return undefined when no structured data available', () => {
      const phase2Results = {
        strategic_recommendations: {
          analysis_id: 'test',
          analysis_type: 'strategic_recommendations',
          status: 'complete' as const,
          content: 'test'
        }
        // No strategic_financial_opportunities
      };

      const result = aggregateFinancialImpact(phase2Results, [], [], []);
      expect(result).toBeUndefined();
    });

    it('should aggregate structured financial data', () => {
      const phase2Results = {
        strategic_recommendations: {
          analysis_id: 'test',
          analysis_type: 'strategic_recommendations',
          status: 'complete' as const,
          content: 'test'
        },
        strategic_financial_opportunities: mockOpportunities
      };

      const result = aggregateFinancialImpact(phase2Results, [], [], []);

      expect(result).toBeDefined();
      expect(result!.total_identified_annual_value).toBeGreaterThan(0);
      expect(result!._metadata?.data_source).toBe('structured');
      expect(result!._metadata?.structured_opportunities).toBe(2);
    });

    it('should calculate scenario analysis from AI ranges', () => {
      const phase2Results = {
        strategic_recommendations: {
          analysis_id: 'test',
          analysis_type: 'strategic_recommendations',
          status: 'complete' as const,
          content: 'test'
        },
        strategic_financial_opportunities: mockOpportunities
      };

      const result = aggregateFinancialImpact(phase2Results, [], [], []);

      expect(result).toBeDefined();
      // Conservative should be less than base
      expect(result!.scenario_analysis.conservative_annual)
        .toBeLessThanOrEqual(result!.scenario_analysis.base_annual);
      // Optimistic should be greater than base
      expect(result!.scenario_analysis.optimistic_annual)
        .toBeGreaterThanOrEqual(result!.scenario_analysis.base_annual);
    });
  });

  describe('buildCategoryBreakdown', () => {
    it('should group opportunities by category', () => {
      const breakdown = buildCategoryBreakdown(50000, mockOpportunities, 100000);

      expect(breakdown.length).toBeGreaterThan(0);

      // Should have Revenue_Growth category
      const revenueGrowth = breakdown.find(b => b.category === 'Revenue_Growth');
      expect(revenueGrowth).toBeDefined();
      expect(revenueGrowth!.annual_value).toBe(375000);

      // Should have Cost_Efficiency category
      const costEfficiency = breakdown.find(b => b.category === 'Cost_Efficiency');
      expect(costEfficiency).toBeDefined();
      expect(costEfficiency!.annual_value).toBe(225000);
    });

    it('should include quick wins and risk mitigation', () => {
      const breakdown = buildCategoryBreakdown(75000, mockOpportunities, 50000);

      const quickWins = breakdown.find(b => b.category === 'Quick Wins');
      expect(quickWins).toBeDefined();
      expect(quickWins!.annual_value).toBe(75000);

      const riskMitigation = breakdown.find(b => b.category === 'Risk Mitigation');
      expect(riskMitigation).toBeDefined();
      expect(riskMitigation!.annual_value).toBe(50000);
    });

    it('should calculate percentages correctly', () => {
      const breakdown = buildCategoryBreakdown(0, mockOpportunities, 0);

      const totalPercentage = breakdown.reduce((sum, b) => sum + b.percentage_of_total, 0);
      // Should be approximately 100 (may have rounding)
      expect(totalPercentage).toBeGreaterThanOrEqual(95);
      expect(totalPercentage).toBeLessThanOrEqual(105);
    });
  });

  describe('calculateFinancialDataQualityScore', () => {
    it('should return 0 for empty data', () => {
      const score = calculateFinancialDataQualityScore([], 0, 'structured');
      expect(score).toBe(0);
    });

    it('should score higher for high confidence opportunities', () => {
      const highConfidence: StrategicFinancialOpportunity[] = [
        {
          ...mockOpportunities[0],
          financial_impact: {
            ...mockOpportunities[0].financial_impact,
            confidence_level: 'High'
          }
        }
      ];

      const lowConfidence: StrategicFinancialOpportunity[] = [
        {
          ...mockOpportunities[0],
          financial_impact: {
            ...mockOpportunities[0].financial_impact,
            confidence_level: 'Low'
          }
        }
      ];

      const highScore = calculateFinancialDataQualityScore(highConfidence, 0, 'structured');
      const lowScore = calculateFinancialDataQualityScore(lowConfidence, 0, 'structured');

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should add bonus for structured data source', () => {
      const opportunities = mockOpportunities.slice(0, 1);

      const structuredScore = calculateFinancialDataQualityScore(opportunities, 0, 'structured');
      const parsedScore = calculateFinancialDataQualityScore(opportunities, 0, 'parsed');

      expect(structuredScore).toBeGreaterThan(parsedScore);
    });
  });
});

describe('Phase B: Financial Impact Summary Schema', () => {
  it('should validate a complete financial impact summary', () => {
    const summary = {
      total_identified_annual_value: 600000,
      total_five_year_value: 2700000,
      breakdown_by_category: [
        {
          category: 'Revenue_Growth',
          annual_value: 375000,
          percentage_of_total: 62,
          opportunity_count: 1
        },
        {
          category: 'Cost_Efficiency',
          annual_value: 225000,
          percentage_of_total: 38,
          opportunity_count: 1
        }
      ],
      scenario_analysis: {
        conservative_annual: 400000,
        base_annual: 600000,
        optimistic_annual: 800000
      },
      data_quality_score: 75
    };

    const result = FinancialImpactSummarySchema.safeParse(summary);
    expect(result.success).toBe(true);
  });

  it('should reject data quality score out of range', () => {
    const summary = {
      total_identified_annual_value: 600000,
      total_five_year_value: 2700000,
      breakdown_by_category: [],
      scenario_analysis: {
        conservative_annual: 400000,
        base_annual: 600000,
        optimistic_annual: 800000
      },
      data_quality_score: 150 // Invalid - out of range
    };

    const result = FinancialImpactSummarySchema.safeParse(summary);
    expect(result.success).toBe(false);
  });
});

describe('Phase B: Validation Functions', () => {
  it('validateStrategicFinancialOpportunity should throw on invalid data', () => {
    expect(() => validateStrategicFinancialOpportunity({})).toThrow();
  });

  it('safeValidateStrategicFinancialOpportunity should return error on invalid data', () => {
    const result = safeValidateStrategicFinancialOpportunity({});
    expect(result.success).toBe(false);
  });

  it('safeValidateStrategicFinancialOpportunity should succeed on valid data', () => {
    const validData: StrategicFinancialOpportunity = {
      opportunity_id: 'test_001',
      opportunity_title: 'Test Opportunity',
      opportunity_description: 'A test opportunity',
      financial_impact: {
        annual_value_min: 100000,
        annual_value_max: 200000,
        annual_value_base: 150000,
        confidence_level: 'Medium',
        currency: 'USD',
        calculation_basis: 'Test calculation',
        assumptions: [],
        data_sources: []
      },
      impact_category: 'Revenue_Growth',
      affected_categories: [],
      implementation_complexity: 'Medium',
      time_to_value_months: 6,
      prerequisites: [],
      key_milestones: [],
      evidence_source: 'Test',
      supporting_data_points: []
    };

    const result = safeValidateStrategicFinancialOpportunity(validData);
    expect(result.success).toBe(true);
  });
});
