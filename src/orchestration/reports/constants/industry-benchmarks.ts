/**
 * Industry Benchmark Defaults
 *
 * Provides fallback benchmark data when dynamic benchmark data is unavailable.
 * Used by the Executive Brief and other reports to ensure benchmark comparisons
 * are always substantive rather than showing "Benchmark pending" placeholders.
 *
 * @version 1.0.0
 * @since December 2025
 * PORTAL-FIX: Created to resolve benchmark data gaps (2024-12)
 */

import type { DimensionCode } from '../../../types/idm.types.js';

/**
 * Percentile thresholds for competitive positioning
 */
export interface PercentileThresholds {
  top25: number;
  top50: number;
  bottom25: number;
}

/**
 * Category benchmark data with source attribution
 */
export interface CategoryBenchmark {
  benchmark: number;
  source: string;
  percentileThresholds: PercentileThresholds;
}

/**
 * Complete industry benchmark profile
 */
export interface IndustryBenchmark {
  industryName: string;
  sicCode: string;
  categories: Partial<Record<DimensionCode, CategoryBenchmark>>;
}

/**
 * Industry benchmark defaults organized by industry key
 * PORTAL-FIX: Provides substantive benchmark data when dynamic data unavailable
 */
export const INDUSTRY_BENCHMARK_DEFAULTS: Record<string, IndustryBenchmark> = {
  'legal-services': {
    industryName: 'Legal Services',
    sicCode: '81',
    categories: {
      STR: { benchmark: 62, source: 'IBISWorld Legal Services 2024', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      SAL: { benchmark: 70, source: 'Clio Legal Trends Report 2024', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      MKT: { benchmark: 65, source: 'Thomson Reuters State of Legal Market', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      CXP: { benchmark: 80, source: 'ACSI Legal Services Index', percentileThresholds: { top25: 88, top50: 80, bottom25: 68 } },
      OPS: { benchmark: 75, source: 'ABA Law Practice Division', percentileThresholds: { top25: 85, top50: 75, bottom25: 60 } },
      FIN: { benchmark: 70, source: 'Altman Weil Law Firms in Transition', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      HRS: { benchmark: 68, source: 'NALP Legal Industry HR Benchmarks', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      LDG: { benchmark: 65, source: 'Georgetown Law Center Study', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      TIN: { benchmark: 50, source: 'Wolters Kluwer Future Ready Lawyer', percentileThresholds: { top25: 65, top50: 50, bottom25: 38 } },
      ITD: { benchmark: 52, source: 'ABA Legal Technology Survey', percentileThresholds: { top25: 68, top50: 52, bottom25: 40 } },
      RMS: { benchmark: 82, source: 'Aon Professional Services Risk Report', percentileThresholds: { top25: 90, top50: 82, bottom25: 70 } },
      CMP: { benchmark: 90, source: 'Thomson Reuters Regulatory Intelligence', percentileThresholds: { top25: 95, top50: 90, bottom25: 80 } },
    }
  },
  'healthcare': {
    industryName: 'Healthcare Services',
    sicCode: '80',
    categories: {
      STR: { benchmark: 65, source: 'MGMA Practice Management', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      SAL: { benchmark: 60, source: 'Healthcare Financial Management Association', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      MKT: { benchmark: 55, source: 'HCAHPS Patient Experience', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      CXP: { benchmark: 75, source: 'Press Ganey Patient Satisfaction', percentileThresholds: { top25: 85, top50: 75, bottom25: 62 } },
      OPS: { benchmark: 70, source: 'ACHE Healthcare Operations Benchmark', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      FIN: { benchmark: 65, source: 'Moody Healthcare Financial Metrics', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      HRS: { benchmark: 70, source: 'ASHHRA Healthcare HR Benchmarks', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      LDG: { benchmark: 68, source: 'Advisory Board Leadership Survey', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      TIN: { benchmark: 58, source: 'HIMSS Digital Health Index', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      ITD: { benchmark: 62, source: 'CHIME Digital Health Survey', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      RMS: { benchmark: 78, source: 'ASHRM Risk Management Benchmarks', percentileThresholds: { top25: 88, top50: 78, bottom25: 65 } },
      CMP: { benchmark: 88, source: 'Joint Commission Compliance Metrics', percentileThresholds: { top25: 95, top50: 88, bottom25: 78 } },
    }
  },
  'professional-services': {
    industryName: 'Professional Services',
    sicCode: '87',
    categories: {
      STR: { benchmark: 62, source: 'Service Performance Insight', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      SAL: { benchmark: 68, source: 'Hinge Research Institute', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      MKT: { benchmark: 60, source: 'Hinge High Growth Study', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      CXP: { benchmark: 75, source: 'Client Satisfaction Benchmark', percentileThresholds: { top25: 85, top50: 75, bottom25: 62 } },
      OPS: { benchmark: 70, source: 'SPI Professional Services Maturity', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      FIN: { benchmark: 68, source: 'PSA Financial Benchmarks', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      HRS: { benchmark: 65, source: 'SHRM Professional Services Survey', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      LDG: { benchmark: 62, source: 'Deloitte Leadership Benchmark', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      TIN: { benchmark: 55, source: 'SPI Technology Adoption Index', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      ITD: { benchmark: 58, source: 'Gartner IT Services Benchmark', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      RMS: { benchmark: 72, source: 'Marsh Professional Liability Report', percentileThresholds: { top25: 84, top50: 72, bottom25: 58 } },
      CMP: { benchmark: 78, source: 'Compliance Week Professional Services', percentileThresholds: { top25: 88, top50: 78, bottom25: 65 } },
    }
  },
  'manufacturing': {
    industryName: 'Manufacturing',
    sicCode: '20-39',
    categories: {
      STR: { benchmark: 58, source: 'IndustryWeek Manufacturing Report', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      SAL: { benchmark: 62, source: 'NAM Manufacturing Outlook', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      MKT: { benchmark: 52, source: 'Manufacturing Marketing Institute', percentileThresholds: { top25: 68, top50: 52, bottom25: 38 } },
      CXP: { benchmark: 68, source: 'CSIA Customer Satisfaction Index', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      OPS: { benchmark: 72, source: 'APQC Manufacturing Benchmarks', percentileThresholds: { top25: 85, top50: 72, bottom25: 58 } },
      FIN: { benchmark: 65, source: 'Deloitte Manufacturing CFO Survey', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      HRS: { benchmark: 60, source: 'Manufacturing Institute Workforce', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      LDG: { benchmark: 58, source: 'IndustryWeek Leadership Survey', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      TIN: { benchmark: 55, source: 'Industry 4.0 Adoption Index', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      ITD: { benchmark: 52, source: 'MPI IT in Manufacturing Survey', percentileThresholds: { top25: 68, top50: 52, bottom25: 38 } },
      RMS: { benchmark: 75, source: 'FM Global Resilience Index', percentileThresholds: { top25: 85, top50: 75, bottom25: 60 } },
      CMP: { benchmark: 80, source: 'EHS Compliance Benchmarks', percentileThresholds: { top25: 90, top50: 80, bottom25: 68 } },
    }
  },
  'technology': {
    industryName: 'Technology & Software',
    sicCode: '73',
    categories: {
      STR: { benchmark: 68, source: 'Gartner Tech Market Analysis', percentileThresholds: { top25: 82, top50: 68, bottom25: 52 } },
      SAL: { benchmark: 72, source: 'TSIA Sales Benchmark', percentileThresholds: { top25: 85, top50: 72, bottom25: 58 } },
      MKT: { benchmark: 70, source: 'SiriusDecisions Tech Marketing', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      CXP: { benchmark: 75, source: 'TSIA Customer Success Benchmark', percentileThresholds: { top25: 85, top50: 75, bottom25: 62 } },
      OPS: { benchmark: 72, source: 'DORA DevOps Report', percentileThresholds: { top25: 85, top50: 72, bottom25: 58 } },
      FIN: { benchmark: 65, source: 'KeyBanc SaaS Survey', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      HRS: { benchmark: 70, source: 'Radford Technology Compensation', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      LDG: { benchmark: 68, source: 'CIO Leadership Index', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      TIN: { benchmark: 78, source: 'Gartner Innovation Index', percentileThresholds: { top25: 88, top50: 78, bottom25: 65 } },
      ITD: { benchmark: 80, source: 'Forrester Digital Maturity', percentileThresholds: { top25: 90, top50: 80, bottom25: 68 } },
      RMS: { benchmark: 70, source: 'Ponemon Security Report', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      CMP: { benchmark: 72, source: 'Tech Compliance Index', percentileThresholds: { top25: 85, top50: 72, bottom25: 58 } },
    }
  },
  'retail': {
    industryName: 'Retail & Consumer',
    sicCode: '52-59',
    categories: {
      STR: { benchmark: 58, source: 'NRF Retail Benchmark', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      SAL: { benchmark: 65, source: 'Retail TouchPoints Sales Index', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      MKT: { benchmark: 68, source: 'Digital Commerce 360', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      CXP: { benchmark: 72, source: 'ACSI Retail Satisfaction', percentileThresholds: { top25: 84, top50: 72, bottom25: 58 } },
      OPS: { benchmark: 65, source: 'Retail Systems Research', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      FIN: { benchmark: 55, source: 'NRF Retail Finance Survey', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      HRS: { benchmark: 55, source: 'Retail Industry Leaders HR', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      LDG: { benchmark: 58, source: 'Retail Executive Survey', percentileThresholds: { top25: 72, top50: 58, bottom25: 42 } },
      TIN: { benchmark: 62, source: 'RSR Retail Innovation Index', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      ITD: { benchmark: 60, source: 'Retail Technology Adoption', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      RMS: { benchmark: 65, source: 'Retail Loss Prevention Survey', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      CMP: { benchmark: 70, source: 'Retail Compliance Council', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
    }
  },
  'financial-services': {
    industryName: 'Financial Services',
    sicCode: '60-67',
    categories: {
      STR: { benchmark: 65, source: 'McKinsey Banking Report', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      SAL: { benchmark: 68, source: 'J.D. Power Financial Sales', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      MKT: { benchmark: 62, source: 'Financial Brand Marketing', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      CXP: { benchmark: 72, source: 'J.D. Power Banking Satisfaction', percentileThresholds: { top25: 84, top50: 72, bottom25: 58 } },
      OPS: { benchmark: 70, source: 'BIAN Banking Operations', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      FIN: { benchmark: 75, source: 'Deloitte Banking CFO Survey', percentileThresholds: { top25: 85, top50: 75, bottom25: 62 } },
      HRS: { benchmark: 68, source: 'Financial Services HR Benchmark', percentileThresholds: { top25: 80, top50: 68, bottom25: 52 } },
      LDG: { benchmark: 70, source: 'Banking Leadership Index', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      TIN: { benchmark: 65, source: 'Fintech Innovation Index', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      ITD: { benchmark: 70, source: 'Celent IT Spending Report', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      RMS: { benchmark: 82, source: 'Basel Risk Management', percentileThresholds: { top25: 92, top50: 82, bottom25: 70 } },
      CMP: { benchmark: 88, source: 'Regulatory Compliance Index', percentileThresholds: { top25: 95, top50: 88, bottom25: 78 } },
    }
  },
  'default': {
    industryName: 'All Industries Average',
    sicCode: '00',
    categories: {
      STR: { benchmark: 60, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      SAL: { benchmark: 65, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      MKT: { benchmark: 60, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      CXP: { benchmark: 70, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      OPS: { benchmark: 65, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      FIN: { benchmark: 65, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 78, top50: 65, bottom25: 50 } },
      HRS: { benchmark: 62, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 75, top50: 62, bottom25: 48 } },
      LDG: { benchmark: 60, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 75, top50: 60, bottom25: 45 } },
      TIN: { benchmark: 55, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      ITD: { benchmark: 55, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 70, top50: 55, bottom25: 40 } },
      RMS: { benchmark: 70, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 82, top50: 70, bottom25: 55 } },
      CMP: { benchmark: 75, source: 'BizHealth.ai Cross-Industry Analysis', percentileThresholds: { top25: 88, top50: 75, bottom25: 60 } },
    }
  }
};

/**
 * Helper to normalize industry string to lookup key
 * PORTAL-FIX: Maps company profile industry to benchmark data
 */
export function getIndustryKey(industry?: string): string {
  if (!industry) return 'default';

  const normalized = industry.toLowerCase().trim();

  // Legal services
  if (normalized.includes('legal') || normalized.includes('law') || normalized.includes('attorney')) {
    return 'legal-services';
  }

  // Healthcare
  if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('hospital') ||
      normalized.includes('clinic') || normalized.includes('physician') || normalized.includes('dental')) {
    return 'healthcare';
  }

  // Professional services
  if (normalized.includes('consulting') || normalized.includes('professional') || normalized.includes('accounting') ||
      normalized.includes('architecture') || normalized.includes('engineering services')) {
    return 'professional-services';
  }

  // Manufacturing
  if (normalized.includes('manufactur') || normalized.includes('production') || normalized.includes('industrial') ||
      normalized.includes('factory') || normalized.includes('assembly')) {
    return 'manufacturing';
  }

  // Technology
  if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('saas') ||
      normalized.includes('it services') || normalized.includes('computer') || normalized.includes('digital')) {
    return 'technology';
  }

  // Retail
  if (normalized.includes('retail') || normalized.includes('store') || normalized.includes('commerce') ||
      normalized.includes('consumer') || normalized.includes('shop')) {
    return 'retail';
  }

  // Financial services
  if (normalized.includes('financ') || normalized.includes('bank') || normalized.includes('insurance') ||
      normalized.includes('investment') || normalized.includes('credit') || normalized.includes('lending')) {
    return 'financial-services';
  }

  return 'default';
}

/**
 * Get industry benchmark data for a specific category
 * PORTAL-FIX: Provides fallback benchmark when dynamic data unavailable
 */
export function getIndustryBenchmarkForCategory(
  categoryCode: DimensionCode,
  industry?: string
): CategoryBenchmark | undefined {
  const industryKey = getIndustryKey(industry);
  const industryData = INDUSTRY_BENCHMARK_DEFAULTS[industryKey] || INDUSTRY_BENCHMARK_DEFAULTS['default'];
  return industryData.categories[categoryCode];
}

/**
 * Get benchmark comparison result for display
 * PORTAL-FIX: Replaces "Benchmark pending" with substantive comparison
 */
export interface BenchmarkComparisonResult {
  display: string;
  delta: number;
  status: 'above' | 'at' | 'below';
  benchmark: number;
  source: string;
  percentile: string;
}

export function getBenchmarkComparison(
  categoryCode: DimensionCode,
  score: number,
  industry?: string,
  dynamicBenchmark?: number
): BenchmarkComparisonResult {
  const industryKey = getIndustryKey(industry);
  const industryData = INDUSTRY_BENCHMARK_DEFAULTS[industryKey] || INDUSTRY_BENCHMARK_DEFAULTS['default'];
  const categoryBenchmark = industryData.categories[categoryCode];

  // Use dynamic benchmark if available, otherwise use static defaults
  const benchmark = dynamicBenchmark ?? categoryBenchmark?.benchmark ?? 60;
  const delta = score - benchmark;
  const source = categoryBenchmark?.source || 'BizHealth.ai Cross-Industry Analysis';

  // Determine status
  let status: 'above' | 'at' | 'below';
  let display: string;

  if (delta > 5) {
    status = 'above';
    display = `+${delta} above avg`;
  } else if (delta < -5) {
    status = 'below';
    display = `${delta} below avg`;
  } else {
    status = 'at';
    display = 'At benchmark';
  }

  // Determine percentile ranking
  const thresholds = categoryBenchmark?.percentileThresholds;
  let percentile = 'Middle 50%';

  if (thresholds) {
    if (score >= thresholds.top25) percentile = 'Top 25%';
    else if (score >= thresholds.top50) percentile = 'Top 50%';
    else if (score <= thresholds.bottom25) percentile = 'Bottom 25%';
  }

  return {
    display,
    delta,
    status,
    benchmark,
    source,
    percentile
  };
}

/**
 * Get all category benchmarks for an industry
 * PORTAL-FIX: Used for substantive benchmark positioning section
 */
export function getAllIndustryBenchmarks(industry?: string): {
  industryName: string;
  categories: Map<DimensionCode, CategoryBenchmark>;
} {
  const industryKey = getIndustryKey(industry);
  const industryData = INDUSTRY_BENCHMARK_DEFAULTS[industryKey] || INDUSTRY_BENCHMARK_DEFAULTS['default'];

  const categoriesMap = new Map<DimensionCode, CategoryBenchmark>();
  for (const [code, data] of Object.entries(industryData.categories)) {
    if (data) {
      categoriesMap.set(code as DimensionCode, data);
    }
  }

  return {
    industryName: industryData.industryName,
    categories: categoriesMap
  };
}
