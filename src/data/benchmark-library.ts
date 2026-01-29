/**
 * Benchmark Library for BizHealth Assessment
 *
 * Industry benchmarks for each of the 12 business categories.
 * Used for comparing company performance against industry standards.
 *
 * Data Sources:
 * - IBISWorld Industry Reports
 * - Bureau of Labor Statistics
 * - HubSpot Sales/Marketing Statistics
 * - Gartner IT Benchmarks
 * - SHRM HR Benchmarking
 * - RMA Annual Statement Studies
 */

import type { CategoryCode } from './question-category-mapping.js';

// ============================================================================
// BENCHMARK TYPES
// ============================================================================

export interface BenchmarkThresholds {
  poor: number;
  average: number;
  good: number;
  excellent: number;
}

export interface BenchmarkData {
  categoryCode: CategoryCode;
  metricKey: string;
  metricName: string;
  unit: 'percentage' | 'days' | 'dollars' | 'ratio' | 'months' | 'score' | 'times';
  benchmarks: {
    industry: BenchmarkThresholds;
    byCompanySize?: {
      small: BenchmarkThresholds;    // 1-50 employees
      medium: BenchmarkThresholds;   // 51-250 employees
      large: BenchmarkThresholds;    // 251+ employees
    };
    byGrowthStage?: {
      startup: BenchmarkThresholds;
      growth: BenchmarkThresholds;
      mature: BenchmarkThresholds;
    };
  };
  /** Whether lower values are better (e.g., sales cycle days, turnover) */
  lowerIsBetter: boolean;
  sources: string[];
  lastUpdated: string;
  notes?: string;
}

export type BenchmarkPosition = 'poor' | 'average' | 'good' | 'excellent';

// ============================================================================
// BENCHMARK LIBRARY
// ============================================================================

export const BENCHMARK_LIBRARY: BenchmarkData[] = [
  // =========================================================================
  // STRATEGY BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'STR',
    metricKey: 'market_share',
    metricName: 'Local Market Share',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 2, average: 8, good: 15, excellent: 25 }
    },
    lowerIsBetter: false,
    sources: ['IBISWorld Industry Reports', 'SBA Market Analysis'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'STR',
    metricKey: 'yoy_growth',
    metricName: 'Year-over-Year Revenue Growth',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: -5, average: 8, good: 15, excellent: 30 },
      byGrowthStage: {
        startup: { poor: 10, average: 50, good: 100, excellent: 200 },
        growth: { poor: 5, average: 20, good: 40, excellent: 75 },
        mature: { poor: -2, average: 5, good: 10, excellent: 20 }
      }
    },
    lowerIsBetter: false,
    sources: ['Bureau of Labor Statistics', 'Kauffman Foundation'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'STR',
    metricKey: 'strategic_planning_score',
    metricName: 'Strategic Planning Maturity',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Balanced Scorecard Institute', 'McKinsey Strategy Survey'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // SALES BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'SAL',
    metricKey: 'sales_cycle_days',
    metricName: 'Average Sales Cycle Length',
    unit: 'days',
    benchmarks: {
      industry: { poor: 120, average: 60, good: 30, excellent: 14 },
      byCompanySize: {
        small: { poor: 90, average: 45, good: 21, excellent: 7 },
        medium: { poor: 120, average: 60, good: 35, excellent: 14 },
        large: { poor: 180, average: 90, good: 45, excellent: 21 }
      }
    },
    lowerIsBetter: true,
    sources: ['HubSpot Sales Statistics', 'Salesforce State of Sales'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'SAL',
    metricKey: 'close_rate',
    metricName: 'Sales Close Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 10, average: 20, good: 30, excellent: 40 }
    },
    lowerIsBetter: false,
    sources: ['HubSpot Sales Statistics', 'Gartner'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'SAL',
    metricKey: 'repeat_customer_rate',
    metricName: 'Repeat Customer Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 20, average: 35, good: 50, excellent: 70 }
    },
    lowerIsBetter: false,
    sources: ['Bain & Company', 'Harvard Business Review'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'SAL',
    metricKey: 'pipeline_management_score',
    metricName: 'Pipeline Management Effectiveness',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Salesforce', 'HubSpot'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // MARKETING BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'MKT',
    metricKey: 'cac',
    metricName: 'Customer Acquisition Cost',
    unit: 'dollars',
    benchmarks: {
      industry: { poor: 500, average: 200, good: 100, excellent: 50 }
    },
    lowerIsBetter: true,
    sources: ['HubSpot Marketing Statistics', 'ProfitWell'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'MKT',
    metricKey: 'ltv',
    metricName: 'Customer Lifetime Value',
    unit: 'dollars',
    benchmarks: {
      industry: { poor: 500, average: 2000, good: 5000, excellent: 15000 }
    },
    lowerIsBetter: false,
    sources: ['HubSpot', 'Gartner'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'MKT',
    metricKey: 'ltv_cac_ratio',
    metricName: 'LTV:CAC Ratio',
    unit: 'ratio',
    benchmarks: {
      industry: { poor: 1, average: 3, good: 5, excellent: 8 }
    },
    lowerIsBetter: false,
    sources: ['SaaS Capital', 'Bessemer Venture Partners'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'MKT',
    metricKey: 'marketing_roi',
    metricName: 'Marketing ROI',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 100, average: 300, good: 500, excellent: 1000 }
    },
    lowerIsBetter: false,
    sources: ['Nielsen Marketing Mix Modeling', 'Google Analytics Benchmarks'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'MKT',
    metricKey: 'conversion_rate',
    metricName: 'Awareness to Customer Conversion Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 1, average: 3, good: 5, excellent: 10 }
    },
    lowerIsBetter: false,
    sources: ['WordStream', 'Unbounce Conversion Benchmark'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // CUSTOMER EXPERIENCE BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'CXP',
    metricKey: 'nps',
    metricName: 'Net Promoter Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: -10, average: 30, good: 50, excellent: 70 }
    },
    lowerIsBetter: false,
    sources: ['Bain & Company NPS Benchmarks', 'CustomerGauge'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'CXP',
    metricKey: 'first_contact_resolution',
    metricName: 'First Contact Resolution Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 50, average: 70, good: 85, excellent: 95 }
    },
    lowerIsBetter: false,
    sources: ['ICMI', 'Zendesk Customer Service Benchmark'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'CXP',
    metricKey: 'customer_satisfaction_score',
    metricName: 'Customer Satisfaction Score (CSAT)',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2.5, average: 3.5, good: 4.2, excellent: 4.8 }
    },
    lowerIsBetter: false,
    sources: ['ACSI', 'Qualtrics XM Institute'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'CXP',
    metricKey: 'customer_effort_score',
    metricName: 'Customer Effort Score (CES)',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Gartner CES Research', 'Tethr'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // OPERATIONS BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'OPS',
    metricKey: 'revenue_generating_time',
    metricName: 'Revenue-Generating Activity Percentage',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 30, average: 50, good: 70, excellent: 85 }
    },
    lowerIsBetter: false,
    sources: ['McKinsey Operations Excellence', 'Lean Enterprise Institute'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'OPS',
    metricKey: 'inventory_turnover',
    metricName: 'Annual Inventory Turnover',
    unit: 'times',
    benchmarks: {
      industry: { poor: 2, average: 6, good: 12, excellent: 20 }
    },
    lowerIsBetter: false,
    sources: ['APICS', 'Supply Chain Management Review'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'OPS',
    metricKey: 'capacity_utilization',
    metricName: 'Capacity Utilization Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 50, average: 70, good: 85, excellent: 95 }
    },
    lowerIsBetter: false,
    sources: ['Federal Reserve Economic Data', 'Industry Week'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'OPS',
    metricKey: 'on_time_delivery',
    metricName: 'On-Time Delivery Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 70, average: 85, good: 95, excellent: 99 }
    },
    lowerIsBetter: false,
    sources: ['APICS', 'Supply Chain Digest'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // FINANCIALS BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'FIN',
    metricKey: 'gross_margin',
    metricName: 'Gross Profit Margin',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 20, average: 35, good: 50, excellent: 70 }
    },
    lowerIsBetter: false,
    sources: ['Dun & Bradstreet', 'RMA Annual Statement Studies'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'FIN',
    metricKey: 'cash_runway',
    metricName: 'Cash Runway',
    unit: 'months',
    benchmarks: {
      industry: { poor: 2, average: 6, good: 12, excellent: 24 },
      byGrowthStage: {
        startup: { poor: 6, average: 12, good: 18, excellent: 24 },
        growth: { poor: 3, average: 6, good: 12, excellent: 18 },
        mature: { poor: 2, average: 4, good: 8, excellent: 12 }
      }
    },
    lowerIsBetter: false,
    sources: ['CB Insights', 'Startup Genome'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'FIN',
    metricKey: 'current_ratio',
    metricName: 'Current Ratio (Cash/Near-term Expenses)',
    unit: 'ratio',
    benchmarks: {
      industry: { poor: 0.5, average: 1.2, good: 2.0, excellent: 3.0 }
    },
    lowerIsBetter: false,
    sources: ['RMA Annual Statement Studies', 'BizStats'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'FIN',
    metricKey: 'debt_to_equity',
    metricName: 'Debt to Equity Ratio',
    unit: 'ratio',
    benchmarks: {
      industry: { poor: 3.0, average: 1.5, good: 0.8, excellent: 0.3 }
    },
    lowerIsBetter: true,
    sources: ['RMA Annual Statement Studies', 'Federal Reserve'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'FIN',
    metricKey: 'ebitda_margin',
    metricName: 'EBITDA Margin',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 5, average: 12, good: 20, excellent: 30 }
    },
    lowerIsBetter: false,
    sources: ['Sageworks', 'NYU Stern'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // HUMAN RESOURCES BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'HRS',
    metricKey: 'employee_turnover',
    metricName: 'Annual Employee Turnover Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 30, average: 18, good: 10, excellent: 5 }
    },
    lowerIsBetter: true,
    sources: ['Bureau of Labor Statistics', 'SHRM Benchmarking'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'HRS',
    metricKey: 'employee_engagement',
    metricName: 'Employee Engagement Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Gallup Q12', 'SHRM'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'HRS',
    metricKey: 'time_to_hire',
    metricName: 'Average Time to Hire (Days)',
    unit: 'days',
    benchmarks: {
      industry: { poor: 60, average: 36, good: 23, excellent: 14 }
    },
    lowerIsBetter: true,
    sources: ['SHRM', 'LinkedIn Talent Insights'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'HRS',
    metricKey: 'training_hours',
    metricName: 'Annual Training Hours per Employee',
    unit: 'ratio',
    benchmarks: {
      industry: { poor: 8, average: 20, good: 40, excellent: 60 }
    },
    lowerIsBetter: false,
    sources: ['ATD State of the Industry', 'LinkedIn Learning'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // LEADERSHIP & GOVERNANCE BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'LDG',
    metricKey: 'leadership_effectiveness',
    metricName: 'Leadership Effectiveness Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Gallup Q12', 'CEB Leadership Assessment'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'LDG',
    metricKey: 'decision_speed',
    metricName: 'Decision-Making Speed Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['McKinsey Decision Making Survey', 'Bain'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'LDG',
    metricKey: 'strategic_alignment',
    metricName: 'Strategic Alignment Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['Balanced Scorecard Institute', 'Strategy&'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // TECHNOLOGY & INNOVATION BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'TIN',
    metricKey: 'tech_spend_pct',
    metricName: 'Technology Spend as % of Revenue',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 1, average: 4, good: 7, excellent: 12 }
    },
    lowerIsBetter: false,
    sources: ['Gartner IT Spending Forecast', 'Deloitte Tech Trends'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'TIN',
    metricKey: 'new_product_revenue_pct',
    metricName: 'Revenue from New Products (1-3 years)',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 5, average: 15, good: 25, excellent: 40 }
    },
    lowerIsBetter: false,
    sources: ['BCG Innovation Report', 'McKinsey Innovation Survey'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'TIN',
    metricKey: 'automation_score',
    metricName: 'Automation Utilization Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['McKinsey Automation', 'Deloitte'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // IT & DATA SECURITY BENCHMARKS (Canonical code: ITD)
  // =========================================================================
  {
    categoryCode: 'ITD',
    metricKey: 'system_uptime',
    metricName: 'IT System Uptime',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 95, average: 99, good: 99.5, excellent: 99.9 }
    },
    lowerIsBetter: false,
    sources: ['Gartner IT Metrics', 'Uptime Institute'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'ITD',
    metricKey: 'cybersecurity_score',
    metricName: 'Cybersecurity Preparedness Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['NIST Cybersecurity Framework', 'Ponemon Institute'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'ITD',
    metricKey: 'data_backup_rpo',
    metricName: 'Recovery Point Objective (Hours)',
    unit: 'ratio',
    benchmarks: {
      industry: { poor: 48, average: 24, good: 4, excellent: 1 }
    },
    lowerIsBetter: true,
    sources: ['Gartner', 'Veeam Data Protection Trends'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // RISK MANAGEMENT BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'RMS',
    metricKey: 'risk_mitigation_coverage',
    metricName: 'Major Risk Mitigation Coverage',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 20, average: 50, good: 75, excellent: 95 }
    },
    lowerIsBetter: false,
    sources: ['Risk Management Association', 'ISO 31000 Framework'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'RMS',
    metricKey: 'business_continuity_score',
    metricName: 'Business Continuity Preparedness',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['ISO 22301', 'Disaster Recovery Institute'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'RMS',
    metricKey: 'succession_readiness',
    metricName: 'Leadership Succession Readiness',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['SHRM', 'Spencer Stuart'],
    lastUpdated: '2025-01'
  },

  // =========================================================================
  // COMPLIANCE BENCHMARKS
  // =========================================================================
  {
    categoryCode: 'CMP',
    metricKey: 'compliance_training_completion',
    metricName: 'Compliance Training Completion Rate',
    unit: 'percentage',
    benchmarks: {
      industry: { poor: 60, average: 85, good: 95, excellent: 100 }
    },
    lowerIsBetter: false,
    sources: ['SCCE Compliance Statistics', 'Ethics & Compliance Initiative'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'CMP',
    metricKey: 'audit_readiness_score',
    metricName: 'Audit Readiness Score',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['IIA', 'Deloitte Audit Survey'],
    lastUpdated: '2025-01'
  },
  {
    categoryCode: 'CMP',
    metricKey: 'policy_currency_score',
    metricName: 'Policy Currency (Up-to-date Policies)',
    unit: 'score',
    benchmarks: {
      industry: { poor: 2, average: 3, good: 4, excellent: 5 }
    },
    lowerIsBetter: false,
    sources: ['SCCE', 'Thomson Reuters'],
    lastUpdated: '2025-01'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get benchmarks for a specific category
 */
export function getBenchmarksForCategory(categoryCode: CategoryCode): BenchmarkData[] {
  return BENCHMARK_LIBRARY.filter(b => b.categoryCode === categoryCode);
}

/**
 * Get a specific benchmark by category and metric key
 */
export function getBenchmark(categoryCode: CategoryCode, metricKey: string): BenchmarkData | undefined {
  return BENCHMARK_LIBRARY.find(
    b => b.categoryCode === categoryCode && b.metricKey === metricKey
  );
}

/**
 * Calculate benchmark position for a given value
 */
export function calculateBenchmarkPosition(
  value: number,
  benchmark: BenchmarkData,
  companySize?: 'small' | 'medium' | 'large',
  growthStage?: 'startup' | 'growth' | 'mature'
): BenchmarkPosition {
  // Determine which benchmark set to use
  let thresholds = benchmark.benchmarks.industry;

  if (companySize && benchmark.benchmarks.byCompanySize) {
    thresholds = benchmark.benchmarks.byCompanySize[companySize];
  } else if (growthStage && benchmark.benchmarks.byGrowthStage) {
    thresholds = benchmark.benchmarks.byGrowthStage[growthStage];
  }

  // Handle inverted metrics (lower is better)
  if (benchmark.lowerIsBetter) {
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.average) return 'average';
    return 'poor';
  } else {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.average) return 'average';
    return 'poor';
  }
}

/**
 * Get gap analysis between company value and benchmark
 */
export function calculateBenchmarkGap(
  value: number,
  benchmark: BenchmarkData,
  targetPosition: BenchmarkPosition = 'good'
): {
  gap: number;
  percentageGap: number;
  direction: 'above' | 'below' | 'at';
  targetValue: number;
} {
  const targetValue = benchmark.benchmarks.industry[targetPosition];
  const gap = benchmark.lowerIsBetter
    ? targetValue - value  // For lower-is-better metrics, positive gap means we're above (worse)
    : value - targetValue; // For higher-is-better metrics, positive gap means we're above (better)

  const percentageGap = targetValue !== 0
    ? Math.round((gap / targetValue) * 100)
    : 0;

  let direction: 'above' | 'below' | 'at';
  if (Math.abs(gap) < 0.001) {
    direction = 'at';
  } else if (benchmark.lowerIsBetter) {
    direction = gap > 0 ? 'above' : 'below';
  } else {
    direction = gap > 0 ? 'above' : 'below';
  }

  return {
    gap: Math.abs(gap),
    percentageGap: Math.abs(percentageGap),
    direction,
    targetValue
  };
}

/**
 * Get industry average for a specific benchmark
 */
export function getIndustryAverage(categoryCode: CategoryCode, metricKey: string): number | undefined {
  const benchmark = getBenchmark(categoryCode, metricKey);
  return benchmark?.benchmarks.industry.average;
}

/**
 * Get all benchmark metric keys for a category
 */
export function getBenchmarkMetricKeys(categoryCode: CategoryCode): string[] {
  return getBenchmarksForCategory(categoryCode).map(b => b.metricKey);
}

/**
 * Format benchmark value with appropriate unit
 */
export function formatBenchmarkValue(value: number, unit: BenchmarkData['unit']): string {
  switch (unit) {
    case 'percentage':
      return `${value}%`;
    case 'dollars':
      return `$${value.toLocaleString()}`;
    case 'days':
      return `${value} days`;
    case 'months':
      return `${value} months`;
    case 'ratio':
      return `${value}x`;
    case 'times':
      return `${value}x`;
    case 'score':
      return `${value}/5`;
    default:
      return String(value);
  }
}
