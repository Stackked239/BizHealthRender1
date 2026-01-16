/**
 * Benchmark Data Service
 *
 * Retrieves and filters industry benchmark data based on Company Profile characteristics.
 * Implements multi-dimensional filtering with hierarchical fallback logic to ensure
 * relevant benchmarks are always available.
 *
 * Based on: "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

import { BenchmarkSelectors } from '../types/company-profile.types.js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PercentileDistribution {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface BenchmarkMetric {
  metric_name: string;
  percentiles: PercentileDistribution;
  mean: number;
  std_dev?: number;
  unit: string;
  context?: string;
}

export interface CategoryBenchmarks {
  [metricKey: string]: BenchmarkMetric;
}

export interface CrossFunctionalBenchmark {
  metric_name: string;
  percentiles: PercentileDistribution;
  mean: number;
  unit: string;
  context?: string;
}

export interface CrossFunctionalBenchmarks {
  revenue_engine?: {
    revenue_per_employee?: CrossFunctionalBenchmark;
    marketing_spend_as_percent_revenue?: CrossFunctionalBenchmark;
    sales_marketing_spend_ratio?: CrossFunctionalBenchmark;
    customer_acquisition_payback_months?: CrossFunctionalBenchmark;
  };
  operational_excellence?: {
    technology_spend_per_employee?: CrossFunctionalBenchmark;
    operational_downtime_hours_annual?: CrossFunctionalBenchmark;
    process_automation_percentage?: CrossFunctionalBenchmark;
  };
  growth_readiness?: {
    sustainable_annual_growth_rate?: CrossFunctionalBenchmark;
    scaling_capacity_score?: CrossFunctionalBenchmark;
    talent_bench_strength?: CrossFunctionalBenchmark;
    technology_scalability?: CrossFunctionalBenchmark;
  };
}

export interface BenchmarkDataset {
  metadata: {
    benchmark_id: string;
    data_source: string;
    last_updated: string;
    coverage_period: string;
    reliability_score: number;
  };
  dimension_filters: {
    industry_code: string;
    industry_name: string;
    industry_vertical: string;
    revenue_cohort: string;
    employee_cohort: string;
    growth_phase: string;
    geographic_market: string;
    business_model: string;
  };
  sample_characteristics: {
    number_of_companies: number;
    median_revenue: number;
    median_employees: number;
    data_quality_score: number;
  };
  benchmarks: {
    strategy?: CategoryBenchmarks;
    sales?: CategoryBenchmarks;
    marketing?: CategoryBenchmarks;
    customer_experience?: CategoryBenchmarks;
    operations?: CategoryBenchmarks;
    financials?: CategoryBenchmarks;
    human_resources?: CategoryBenchmarks;
    leadership_governance?: CategoryBenchmarks;
    technology_innovation?: CategoryBenchmarks;
    it_data_systems?: CategoryBenchmarks;
    risk_sustainability?: CategoryBenchmarks;
    compliance_legal?: CategoryBenchmarks;
  };
  cross_functional?: CrossFunctionalBenchmarks;
}

export interface BenchmarkMatchResult {
  dataset: BenchmarkDataset;
  match_level: 'exact' | 'fallback_1' | 'fallback_2' | 'fallback_3' | 'fallback_4';
  match_description: string;
}

// ============================================================================
// Mock Benchmark Data
// ============================================================================

/**
 * Mock benchmark data for Professional Services industry
 * In production, this would be retrieved from a benchmark database
 */
function getMockBenchmarkData(
  industry_code: string,
  revenue_cohort: string,
  employee_cohort: string,
  growth_phase: string,
  geographic_market: string,
  business_model: string
): BenchmarkDataset | null {
  // Simplified mock - return professional services benchmark data
  // In production, this would query a database with actual benchmark data

  return {
    metadata: {
      benchmark_id: `bench_${industry_code}_${revenue_cohort}_${Date.now()}`,
      data_source: 'RMA Annual Statement Studies 2025',
      last_updated: '2025-06-01',
      coverage_period: '2024 fiscal year data',
      reliability_score: 0.92,
    },
    dimension_filters: {
      industry_code,
      industry_name: 'Professional Services',
      industry_vertical: 'Services',
      revenue_cohort,
      employee_cohort,
      growth_phase,
      geographic_market,
      business_model,
    },
    sample_characteristics: {
      number_of_companies: 87,
      median_revenue: 7200000,
      median_employees: 68,
      data_quality_score: 0.92,
    },
    benchmarks: {
      strategy: {
        competitive_differentiation_clarity: {
          metric_name: 'Competitive Differentiation Understanding',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.5, p90: 5.0 },
          mean: 3.7,
          std_dev: 0.9,
          unit: 'scale_1_to_5',
        },
        market_share_typical: {
          metric_name: 'Local Market Share',
          percentiles: { p10: 3.0, p25: 5.5, p50: 9.0, p75: 15.0, p90: 25.0 },
          mean: 11.3,
          std_dev: 8.7,
          unit: 'percent',
        },
        yoy_sales_growth: {
          metric_name: 'Year-over-Year Sales Growth',
          percentiles: { p10: -2.0, p25: 5.0, p50: 12.0, p75: 22.0, p90: 35.0 },
          mean: 13.8,
          std_dev: 15.2,
          unit: 'percent',
        },
        documented_goals_prevalence: {
          metric_name: 'Business Goals Documentation',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.2,
          std_dev: 1.3,
          unit: 'scale_1_to_5',
        },
        strategic_review_frequency: {
          metric_name: 'Business Strategy Review Frequency',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.1,
          std_dev: 1.2,
          unit: 'scale_1_to_5',
        },
        exit_strategy_readiness: {
          metric_name: 'Growth/Exit Plan Documentation',
          percentiles: { p10: 1.0, p25: 1.0, p50: 2.0, p75: 3.0, p90: 4.0 },
          mean: 2.3,
          std_dev: 1.4,
          unit: 'scale_1_to_5',
        },
      },
      sales: {
        sales_target_alignment: {
          metric_name: 'Sales Target Alignment with Business Needs',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.6,
          std_dev: 1.0,
          unit: 'scale_1_to_5',
        },
        pipeline_management_effectiveness: {
          metric_name: 'Sales Pipeline Organization',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          std_dev: 1.1,
          unit: 'scale_1_to_5',
        },
        avg_sales_cycle_days: {
          metric_name: 'Average Sales Cycle Duration',
          percentiles: { p10: 14.0, p25: 25.0, p50: 38.0, p75: 55.0, p90: 75.0 },
          mean: 41.3,
          std_dev: 22.1,
          unit: 'days',
        },
        close_rate: {
          metric_name: 'Sales Close Rate',
          percentiles: { p10: 12.0, p25: 18.0, p50: 25.0, p75: 35.0, p90: 45.0 },
          mean: 26.7,
          std_dev: 12.3,
          unit: 'percent',
        },
        avg_deal_size: {
          metric_name: 'Average Deal Size',
          percentiles: { p10: 3500.0, p25: 5500.0, p50: 8000.0, p75: 12000.0, p90: 18000.0 },
          mean: 9200.0,
          std_dev: 5800.0,
          unit: 'USD',
        },
        repeat_customer_rate: {
          metric_name: 'Repeat Customer Sales Percentage',
          percentiles: { p10: 15.0, p25: 25.0, p50: 40.0, p75: 55.0, p90: 70.0 },
          mean: 41.5,
          std_dev: 18.2,
          unit: 'percent',
        },
        upsell_focus: {
          metric_name: 'Focus on Existing Customer Upsells',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          std_dev: 1.0,
          unit: 'scale_1_to_5',
        },
        sales_velocity: {
          metric_name: 'Sales Velocity',
          percentiles: { p10: 25.0, p25: 42.0, p50: 68.0, p75: 105.0, p90: 155.0 },
          mean: 76.3,
          std_dev: 45.2,
          unit: 'index',
        },
      },
      marketing: {
        brand_awareness: {
          metric_name: 'Brand Awareness Level',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 3.2,
          unit: 'scale_1_to_5',
        },
        channel_diversity: {
          metric_name: 'Marketing Channel Diversity',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        target_customer_clarity: {
          metric_name: 'Target Customer Definition Clarity',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.5,
          unit: 'scale_1_to_5',
        },
        customer_acquisition_cost: {
          metric_name: 'Customer Acquisition Cost',
          percentiles: { p10: 250.0, p25: 450.0, p50: 750.0, p75: 1200.0, p90: 2000.0 },
          mean: 890.0,
          unit: 'USD',
        },
        customer_lifetime_value: {
          metric_name: 'Customer Lifetime Value',
          percentiles: { p10: 2500.0, p25: 4000.0, p50: 6500.0, p75: 10000.0, p90: 15000.0 },
          mean: 7200.0,
          unit: 'USD',
        },
        cac_ltv_ratio: {
          metric_name: 'CAC to LTV Ratio',
          percentiles: { p10: 2.5, p25: 4.0, p50: 6.0, p75: 9.0, p90: 12.0 },
          mean: 6.8,
          unit: 'ratio',
        },
        marketing_roi: {
          metric_name: 'Marketing Return on Investment',
          percentiles: { p10: 110.0, p25: 150.0, p50: 200.0, p75: 275.0, p90: 400.0 },
          mean: 215.0,
          unit: 'percent',
        },
        feedback_tracking_usage: {
          metric_name: 'Customer Feedback Tracking Usage',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.6,
          unit: 'scale_1_to_5',
        },
      },
      customer_experience: {
        customer_satisfaction: {
          metric_name: 'Customer Satisfaction Score',
          percentiles: { p10: 3.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.7,
          unit: 'scale_1_to_5',
        },
        nps_likelihood_to_recommend: {
          metric_name: 'Net Promoter Score Likelihood',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.6,
          unit: 'scale_1_to_5',
        },
        customer_effort_score: {
          metric_name: 'Customer Effort Score',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.5,
          unit: 'scale_1_to_5',
        },
        competitive_strength: {
          metric_name: 'Competitive Strength vs Peers',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          unit: 'scale_1_to_5',
        },
        first_contact_resolution_rate: {
          metric_name: 'First Contact Resolution Rate',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        response_time_hours: {
          metric_name: 'Customer Response Time',
          percentiles: { p10: 1.0, p25: 2.0, p50: 4.0, p75: 8.0, p90: 16.0 },
          mean: 5.2,
          unit: 'hours',
        },
      },
      operations: {
        operational_efficiency_percent: {
          metric_name: 'Operational Efficiency Rating',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        workflow_documentation: {
          metric_name: 'Workflow Documentation Quality',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 3.2,
          unit: 'scale_1_to_5',
        },
        inventory_turnover_annual: {
          metric_name: 'Inventory Turnover Rate',
          percentiles: { p10: 3.0, p25: 5.0, p50: 7.5, p75: 10.0, p90: 13.0 },
          mean: 7.8,
          unit: 'turns_per_year',
        },
        operational_reliability: {
          metric_name: 'Operational Reliability Score',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.5,
          unit: 'scale_1_to_5',
        },
        lean_principles_adoption: {
          metric_name: 'Lean Principles Adoption Level',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.9,
          unit: 'scale_1_to_5',
        },
        capacity_utilization_percent: {
          metric_name: 'Capacity Utilization Rate',
          percentiles: { p10: 55.0, p25: 65.0, p50: 75.0, p75: 82.0, p90: 88.0 },
          mean: 74.3,
          unit: 'percent',
        },
      },
      financials: {
        debt_monitoring_effectiveness: {
          metric_name: 'Debt Monitoring Effectiveness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        cash_ratio: {
          metric_name: 'Cash Ratio',
          percentiles: { p10: 0.5, p25: 0.8, p50: 1.2, p75: 1.8, p90: 2.5 },
          mean: 1.35,
          unit: 'ratio',
        },
        cash_runway_months: {
          metric_name: 'Cash Runway Duration',
          percentiles: { p10: 1.5, p25: 3.0, p50: 6.0, p75: 9.0, p90: 12.0 },
          mean: 6.2,
          unit: 'months',
        },
        gross_profit_margin: {
          metric_name: 'Gross Profit Margin',
          percentiles: { p10: 28.0, p25: 35.0, p50: 42.0, p75: 50.0, p90: 58.0 },
          mean: 43.2,
          unit: 'percent',
        },
        burn_rate_sustainability: {
          metric_name: 'Burn Rate Sustainability',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          unit: 'scale_1_to_5',
        },
        cash_flow_forecasting_accuracy: {
          metric_name: 'Cash Flow Forecasting Accuracy',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.0,
          unit: 'scale_1_to_5',
        },
        budgeting_effectiveness: {
          metric_name: 'Budgeting Process Effectiveness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        growth_funding_readiness: {
          metric_name: 'Growth Funding Readiness',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.1,
          unit: 'scale_1_to_5',
        },
      },
      human_resources: {
        hr_infrastructure_completeness: {
          metric_name: 'HR Infrastructure Completeness',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.9,
          unit: 'scale_1_to_5',
        },
        company_culture_strength: {
          metric_name: 'Company Culture Strength',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        recruiting_onboarding_effectiveness: {
          metric_name: 'Recruiting and Onboarding Effectiveness',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 3.0,
          unit: 'scale_1_to_5',
        },
        training_development_quality: {
          metric_name: 'Training and Development Quality',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.8,
          unit: 'scale_1_to_5',
        },
        employee_turnover_rate: {
          metric_name: 'Employee Turnover Rate',
          percentiles: { p10: 8.0, p25: 15.0, p50: 22.0, p75: 30.0, p90: 40.0 },
          mean: 23.5,
          unit: 'percent',
        },
        engagement_retention_efforts: {
          metric_name: 'Employee Engagement and Retention Efforts',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.0,
          unit: 'scale_1_to_5',
        },
        performance_management_quality: {
          metric_name: 'Performance Management Quality',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 2.9,
          unit: 'scale_1_to_5',
        },
      },
      leadership_governance: {
        vision_communication_effectiveness: {
          metric_name: 'Vision Communication Effectiveness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          unit: 'scale_1_to_5',
        },
        decision_making_effectiveness: {
          metric_name: 'Decision Making Effectiveness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        delegation_capability: {
          metric_name: 'Delegation Capability',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.1,
          unit: 'scale_1_to_5',
        },
        succession_planning: {
          metric_name: 'Succession Planning Readiness',
          percentiles: { p10: 1.0, p25: 2.0, p50: 2.0, p75: 3.0, p90: 4.0 },
          mean: 2.5,
          unit: 'scale_1_to_5',
        },
        advisory_board_utilization: {
          metric_name: 'Advisory Board Utilization',
          percentiles: { p10: 1.0, p25: 1.0, p50: 2.0, p75: 3.0, p90: 4.0 },
          mean: 2.2,
          unit: 'scale_1_to_5',
        },
        accountability_systems: {
          metric_name: 'Accountability Systems Quality',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.0,
          unit: 'scale_1_to_5',
        },
      },
      technology_innovation: {
        technology_investment_level: {
          metric_name: 'Technology Investment Level',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.2,
          unit: 'scale_1_to_5',
        },
        innovation_culture: {
          metric_name: 'Innovation Culture Strength',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 3.0,
          unit: 'scale_1_to_5',
        },
        automation_adoption: {
          metric_name: 'Automation Adoption Level',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.8,
          unit: 'scale_1_to_5',
        },
        competitive_technology_position: {
          metric_name: 'Competitive Technology Position',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.1,
          unit: 'scale_1_to_5',
        },
        innovation_revenue_contribution: {
          metric_name: 'Innovation Revenue Contribution',
          percentiles: { p10: 5.0, p25: 10.0, p50: 15.0, p75: 25.0, p90: 40.0 },
          mean: 18.5,
          unit: 'percent',
        },
      },
      it_data_systems: {
        system_reliability: {
          metric_name: 'IT System Reliability',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          unit: 'scale_1_to_5',
        },
        data_security_posture: {
          metric_name: 'Data Security Posture',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.5,
          unit: 'scale_1_to_5',
        },
        backup_recovery_readiness: {
          metric_name: 'Backup and Recovery Readiness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        system_integration_level: {
          metric_name: 'System Integration Level',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.9,
          unit: 'scale_1_to_5',
        },
        data_driven_decision_making: {
          metric_name: 'Data-Driven Decision Making',
          percentiles: { p10: 2.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.1,
          unit: 'scale_1_to_5',
        },
      },
      risk_sustainability: {
        risk_assessment_frequency: {
          metric_name: 'Risk Assessment Frequency',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 3.0, p90: 4.0 },
          mean: 2.7,
          unit: 'scale_1_to_5',
        },
        business_continuity_planning: {
          metric_name: 'Business Continuity Planning',
          percentiles: { p10: 1.0, p25: 2.0, p50: 2.0, p75: 3.0, p90: 4.0 },
          mean: 2.5,
          unit: 'scale_1_to_5',
        },
        insurance_coverage_adequacy: {
          metric_name: 'Insurance Coverage Adequacy',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        key_person_dependency: {
          metric_name: 'Key Person Dependency Risk',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.2,
          unit: 'scale_1_to_5',
        },
        sustainability_initiatives: {
          metric_name: 'Sustainability Initiatives',
          percentiles: { p10: 1.0, p25: 2.0, p50: 2.0, p75: 3.0, p90: 4.0 },
          mean: 2.4,
          unit: 'scale_1_to_5',
        },
      },
      compliance_legal: {
        regulatory_compliance_level: {
          metric_name: 'Regulatory Compliance Level',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.6,
          unit: 'scale_1_to_5',
        },
        legal_documentation_quality: {
          metric_name: 'Legal Documentation Quality',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.4,
          unit: 'scale_1_to_5',
        },
        contract_management: {
          metric_name: 'Contract Management Effectiveness',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
        ip_protection: {
          metric_name: 'Intellectual Property Protection',
          percentiles: { p10: 1.0, p25: 2.0, p50: 3.0, p75: 4.0, p90: 4.0 },
          mean: 2.9,
          unit: 'scale_1_to_5',
        },
        employment_law_compliance: {
          metric_name: 'Employment Law Compliance',
          percentiles: { p10: 2.0, p25: 3.0, p50: 4.0, p75: 4.0, p90: 5.0 },
          mean: 3.6,
          unit: 'scale_1_to_5',
        },
      },
    },
    cross_functional: {
      revenue_engine: {
        revenue_per_employee: {
          metric_name: 'Revenue per Employee',
          percentiles: { p10: 95000, p25: 125000, p50: 160000, p75: 210000, p90: 280000 },
          mean: 172000,
          unit: 'USD',
        },
        marketing_spend_as_percent_revenue: {
          metric_name: 'Marketing Spend as Percent of Revenue',
          percentiles: { p10: 3.0, p25: 5.5, p50: 8.0, p75: 12.0, p90: 18.0 },
          mean: 9.3,
          unit: 'percent',
        },
        sales_marketing_spend_ratio: {
          metric_name: 'Sales to Marketing Spend Ratio',
          percentiles: { p10: 0.4, p25: 0.7, p50: 1.0, p75: 1.5, p90: 2.2 },
          mean: 1.15,
          unit: 'ratio',
        },
        customer_acquisition_payback_months: {
          metric_name: 'Customer Acquisition Payback Period',
          percentiles: { p10: 3.0, p25: 6.0, p50: 10.0, p75: 15.0, p90: 22.0 },
          mean: 11.2,
          unit: 'months',
        },
      },
      operational_excellence: {
        technology_spend_per_employee: {
          metric_name: 'Technology Spend per Employee',
          percentiles: { p10: 500, p25: 1200, p50: 2500, p75: 4500, p90: 7500 },
          mean: 3200,
          unit: 'USD',
        },
        operational_downtime_hours_annual: {
          metric_name: 'Operational Downtime Hours (Annual)',
          percentiles: { p10: 2, p25: 8, p50: 20, p75: 45, p90: 85 },
          mean: 28,
          unit: 'hours',
        },
        process_automation_percentage: {
          metric_name: 'Process Automation Percentage',
          percentiles: { p10: 15, p25: 30, p50: 50, p75: 70, p90: 85 },
          mean: 52,
          unit: 'percent',
        },
      },
      growth_readiness: {
        sustainable_annual_growth_rate: {
          metric_name: 'Sustainable Annual Growth Rate',
          percentiles: { p10: 5, p25: 10, p50: 15, p75: 25, p90: 40 },
          mean: 18.5,
          unit: 'percent',
          context: 'Based on workforce capacity, operational efficiency, and financial resources',
        },
        scaling_capacity_score: {
          metric_name: 'Organizational Scaling Readiness',
          percentiles: { p10: 2.0, p25: 2.5, p50: 3.0, p75: 4.0, p90: 4.5 },
          mean: 3.1,
          unit: 'scale_1_to_5',
          context: 'Composite of HR, technology, operations, and financial readiness',
        },
        talent_bench_strength: {
          metric_name: 'Leadership Pipeline Depth',
          percentiles: { p10: 1.5, p25: 2.0, p50: 3.0, p75: 3.5, p90: 4.0 },
          mean: 2.8,
          unit: 'scale_1_to_5',
        },
        technology_scalability: {
          metric_name: 'IT Systems Scalability',
          percentiles: { p10: 2.0, p25: 3.0, p50: 3.0, p75: 4.0, p90: 5.0 },
          mean: 3.3,
          unit: 'scale_1_to_5',
        },
      },
    },
  };
}

// ============================================================================
// Benchmark Retrieval Functions
// ============================================================================

/**
 * Retrieve relevant benchmarks for a specific category using hierarchical fallback logic
 *
 * @param category - Business category (e.g., 'strategy', 'sales', 'marketing')
 * @param selectors - Company benchmark selectors from profile
 * @returns Benchmark match result with data and match level
 *
 * Fallback Hierarchy:
 * 1. Exact match (all dimensions)
 * 2. Relax geographic constraint (use national)
 * 3. Relax business model constraint
 * 4. Use industry vertical instead of specific NAICS
 * 5. Generic SMB benchmarks
 */
export function getBenchmarksForCategory(
  category: string,
  selectors: BenchmarkSelectors
): BenchmarkMatchResult {
  const {
    primary_industry_code,
    revenue_cohort,
    employee_cohort,
    growth_phase,
    geographic_market,
    business_model,
  } = selectors;

  // Attempt 1: Exact match (all dimensions)
  let dataset = getMockBenchmarkData(
    primary_industry_code,
    revenue_cohort,
    employee_cohort,
    growth_phase,
    geographic_market,
    business_model
  );

  if (dataset && dataset.sample_characteristics.number_of_companies >= 30) {
    return {
      dataset,
      match_level: 'exact',
      match_description: `Exact match: ${primary_industry_code}, ${revenue_cohort}, ${employee_cohort}, ${growth_phase}, ${geographic_market}, ${business_model}`,
    };
  }

  // Fallback 1: Relax geographic constraint (use US_National)
  dataset = getMockBenchmarkData(
    primary_industry_code,
    revenue_cohort,
    employee_cohort,
    growth_phase,
    'US_National',
    business_model
  );

  if (dataset && dataset.sample_characteristics.number_of_companies >= 50) {
    return {
      dataset,
      match_level: 'fallback_1',
      match_description: `Geographic relaxation: ${primary_industry_code}, ${revenue_cohort}, ${employee_cohort}, ${growth_phase}, US_National, ${business_model}`,
    };
  }

  // Fallback 2: Relax business model constraint
  dataset = getMockBenchmarkData(
    primary_industry_code,
    revenue_cohort,
    employee_cohort,
    growth_phase,
    'US_National',
    'all'
  );

  if (dataset && dataset.sample_characteristics.number_of_companies >= 50) {
    return {
      dataset,
      match_level: 'fallback_2',
      match_description: `Business model relaxation: ${primary_industry_code}, ${revenue_cohort}, ${employee_cohort}, ${growth_phase}, US_National, all business models`,
    };
  }

  // Fallback 3: Use industry vertical instead of specific NAICS
  // In production, would extract industry_vertical from industry lookup
  const industry_vertical = 'Services'; // Mock value
  dataset = getMockBenchmarkData(
    industry_vertical,
    revenue_cohort,
    employee_cohort,
    growth_phase,
    'US_National',
    'all'
  );

  if (dataset && dataset.sample_characteristics.number_of_companies >= 50) {
    return {
      dataset,
      match_level: 'fallback_3',
      match_description: `Industry vertical match: ${industry_vertical}, ${revenue_cohort}, ${employee_cohort}, ${growth_phase}, US_National`,
    };
  }

  // Fallback 4: Generic SMB benchmarks
  dataset = getMockBenchmarkData(
    'generic_smb',
    revenue_cohort,
    employee_cohort,
    growth_phase,
    'US_National',
    'all'
  );

  return {
    dataset: dataset || createFallbackDataset(selectors),
    match_level: 'fallback_4',
    match_description: `Generic SMB benchmarks: ${revenue_cohort}, ${employee_cohort}, ${growth_phase}`,
  };
}

/**
 * Create a minimal fallback dataset when no benchmarks are available
 */
function createFallbackDataset(selectors: BenchmarkSelectors): BenchmarkDataset {
  return {
    metadata: {
      benchmark_id: 'fallback_generic',
      data_source: 'Generic SMB Benchmarks',
      last_updated: new Date().toISOString(),
      coverage_period: 'Generic',
      reliability_score: 0.6,
    },
    dimension_filters: {
      industry_code: selectors.primary_industry_code,
      industry_name: 'Generic SMB',
      industry_vertical: 'All',
      revenue_cohort: selectors.revenue_cohort,
      employee_cohort: selectors.employee_cohort,
      growth_phase: selectors.growth_phase,
      geographic_market: 'US_National',
      business_model: 'all',
    },
    sample_characteristics: {
      number_of_companies: 1000,
      median_revenue: 5000000,
      median_employees: 50,
      data_quality_score: 0.6,
    },
    benchmarks: {},
  };
}

/**
 * Retrieve all category benchmarks for a company
 *
 * @param selectors - Company benchmark selectors from profile
 * @returns Record of all category benchmarks
 */
export function getAllBenchmarks(
  selectors: BenchmarkSelectors
): Record<string, CategoryBenchmarks> {
  const categories = [
    'strategy',
    'sales',
    'marketing',
    'customer_experience',
    'operations',
    'financials',
    'human_resources',
    'leadership_governance',
    'technology_innovation',
    'it_data_systems',
    'risk_sustainability',
    'compliance_legal',
  ];

  const result: Record<string, CategoryBenchmarks> = {};

  for (const category of categories) {
    const matchResult = getBenchmarksForCategory(category, selectors);
    const categoryBenchmarks = matchResult.dataset.benchmarks[category as keyof typeof matchResult.dataset.benchmarks];

    if (categoryBenchmarks) {
      result[category] = categoryBenchmarks;
    }
  }

  return result;
}

/**
 * Retrieve cross-functional benchmarks for a company
 *
 * @param selectors - Company benchmark selectors from profile
 * @returns Cross-functional benchmarks across multiple business areas
 */
export function getCrossFunctionalBenchmarks(
  selectors: BenchmarkSelectors
): CrossFunctionalBenchmarks {
  // Use strategy category as representative for overall benchmark dataset
  const matchResult = getBenchmarksForCategory('strategy', selectors);

  return matchResult.dataset.cross_functional || {};
}

/**
 * Calculate percentile rank for a user value against benchmark distribution
 *
 * @param userValue - User's metric value
 * @param benchmark - Benchmark metric with percentile distribution
 * @returns Percentile rank and performance classification
 */
export function calculatePercentileRank(
  userValue: number,
  benchmark: BenchmarkMetric
): {
  percentile_rank: number;
  classification: 'critical_gap' | 'below_average' | 'average_to_good' | 'strength' | 'key_strength';
  benchmark_context: {
    median: number;
    top_quartile: number;
    bottom_quartile: number;
  };
} {
  const { percentiles } = benchmark;

  let rank: number;
  let classification: 'critical_gap' | 'below_average' | 'average_to_good' | 'strength' | 'key_strength';

  if (userValue <= percentiles.p10) {
    rank = 10;
    classification = 'critical_gap';
  } else if (userValue <= percentiles.p25) {
    rank = 10 + ((userValue - percentiles.p10) / (percentiles.p25 - percentiles.p10)) * 15;
    classification = 'critical_gap';
  } else if (userValue <= percentiles.p50) {
    rank = 25 + ((userValue - percentiles.p25) / (percentiles.p50 - percentiles.p25)) * 25;
    classification = 'below_average';
  } else if (userValue <= percentiles.p75) {
    rank = 50 + ((userValue - percentiles.p50) / (percentiles.p75 - percentiles.p50)) * 25;
    classification = 'average_to_good';
  } else if (userValue <= percentiles.p90) {
    rank = 75 + ((userValue - percentiles.p75) / (percentiles.p90 - percentiles.p75)) * 15;
    classification = 'strength';
  } else {
    rank = 90 + Math.min((userValue - percentiles.p90) / (percentiles.p90 * 0.1) * 10, 10);
    classification = 'key_strength';
  }

  return {
    percentile_rank: Math.round(rank * 10) / 10,
    classification,
    benchmark_context: {
      median: percentiles.p50,
      top_quartile: percentiles.p75,
      bottom_quartile: percentiles.p25,
    },
  };
}
