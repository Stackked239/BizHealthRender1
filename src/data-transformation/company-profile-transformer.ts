/**
 * Company Profile Transformation Module
 *
 * Transforms webhook payload data into CompanyProfile JSON structure
 * with comprehensive data validation, error handling, and derived calculations.
 */

import { v4 as uuidv4 } from 'uuid';
import { WebhookPayload } from '../types/webhook.types.js';
import { CompanyProfile } from '../types/company-profile.types.js';

/**
 * Industry to NAICS code mapping
 * Covers common industries from questionnaire responses
 */
const INDUSTRY_NAICS_MAP: Record<string, { code: string; vertical: string }> = {
  'information': { code: '51', vertical: 'Information Technology' },
  'technology': { code: '54151', vertical: 'Information Technology' },
  'fintech': { code: '522', vertical: 'Financial Technology' },
  'financial_services': { code: '52', vertical: 'Finance and Insurance' },
  'professional_services': { code: '54', vertical: 'Professional Services' },
  'manufacturing': { code: '31-33', vertical: 'Manufacturing' },
  'retail': { code: '44-45', vertical: 'Retail Trade' },
  'healthcare': { code: '62', vertical: 'Healthcare and Social Assistance' },
  'construction': { code: '23', vertical: 'Construction' },
  'real_estate': { code: '53', vertical: 'Real Estate' },
  'hospitality': { code: '72', vertical: 'Accommodation and Food Services' },
  'education': { code: '61', vertical: 'Educational Services' },
  'transportation': { code: '48-49', vertical: 'Transportation and Warehousing' },
  'utilities': { code: '22', vertical: 'Utilities' },
  'agriculture': { code: '11', vertical: 'Agriculture, Forestry, Fishing' },
  'other': { code: '99', vertical: 'Other Services' }
};

/**
 * Error class for transformation validation failures
 */
export class TransformationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'TransformationError';
  }
}

/**
 * Validates required fields exist in webhook payload
 */
function validateWebhookPayload(webhook: WebhookPayload): void {
  if (!webhook.business_overview) {
    throw new TransformationError('Missing business_overview section');
  }

  const bo = webhook.business_overview;

  if (!bo.company_name?.trim()) {
    throw new TransformationError('Company name is required', 'company_name');
  }

  if (!bo.location?.trim()) {
    throw new TransformationError('Location is required', 'location');
  }

  if (!bo.industry?.trim()) {
    throw new TransformationError('Industry is required', 'industry');
  }

  if (!bo.year_started || bo.year_started < 1800 || bo.year_started > new Date().getFullYear()) {
    throw new TransformationError('Valid year_started is required', 'year_started');
  }

  if (bo.last_year_revenue === undefined || bo.last_year_revenue < 0) {
    throw new TransformationError('Valid last_year_revenue is required', 'last_year_revenue');
  }

  if (bo.projected_revenue === undefined || bo.projected_revenue < 0) {
    throw new TransformationError('Valid projected_revenue is required', 'projected_revenue');
  }
}

/**
 * Parses location string into city and state/province components
 * Handles formats: "City ST", "City, ST", "City State"
 */
function parseLocation(locationStr: string): { city: string; state: string } {
  const cleaned = locationStr.trim();

  // Try comma-separated format first
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());
    return {
      city: parts[0] || '',
      state: parts[1] || ''
    };
  }

  // Try space-separated format (assumes last part is state abbreviation)
  const parts = cleaned.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    const state = parts[parts.length - 1];
    const city = parts.slice(0, -1).join(' ');
    return { city, state };
  }

  // Single part - treat as city
  return {
    city: cleaned,
    state: ''
  };
}

/**
 * Maps industry string to NAICS code and vertical
 */
function getIndustryMapping(industry: string): { code: string; vertical: string } {
  const normalized = industry.toLowerCase().trim();

  // Direct match
  if (INDUSTRY_NAICS_MAP[normalized]) {
    return INDUSTRY_NAICS_MAP[normalized];
  }

  // Partial match for common patterns
  for (const [key, value] of Object.entries(INDUSTRY_NAICS_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default to "Other Services"
  return INDUSTRY_NAICS_MAP['other'];
}

/**
 * Calculates total workforce from all employee categories
 */
function calculateTotalWorkforce(
  executive: number,
  support: number,
  fullTime: number,
  partTime: number,
  contractors: number,
  seasonal: number
): number {
  return (executive || 0) + (support || 0) + (fullTime || 0) +
         (partTime || 0) + (contractors || 0) + (seasonal || 0);
}

/**
 * Calculates year-over-year growth rate
 * Returns as decimal (e.g., 0.08 for 8% growth)
 */
function calculateYoYGrowthRate(lastYear: number, projected: number): number {
  if (lastYear === 0) {
    return projected > 0 ? 1 : 0; // 100% growth if starting from zero
  }
  return (projected - lastYear) / lastYear;
}

/**
 * Determines revenue band based on revenue amount
 */
function getRevenueBand(revenue: number): string {
  if (revenue < 100000) return '<$100K';
  if (revenue < 500000) return '$100K-$500K';
  if (revenue < 1000000) return '$500K-$1M';
  if (revenue < 5000000) return '$1M-$5M';
  if (revenue < 10000000) return '$5M-$10M';
  if (revenue < 25000000) return '$10M-$25M';
  if (revenue < 50000000) return '$25M-$50M';
  if (revenue < 100000000) return '$50M-$100M';
  return '$100M+';
}

/**
 * Determines employee band based on total workforce
 */
function getEmployeeBand(workforce: number): string {
  if (workforce === 0) return '0';
  if (workforce <= 10) return '1-10';
  if (workforce <= 50) return '11-50';
  if (workforce <= 100) return '51-100';
  if (workforce <= 250) return '101-250';
  if (workforce <= 500) return '251-500';
  return '500+';
}

/**
 * Determines SBA small business designation
 * Simplified logic based on NAICS industry standards
 */
function getSBADesignation(revenue: number, employees: number, naicsCode: string): string {
  // General thresholds - actual SBA designation varies by specific NAICS code
  const isManufacturing = naicsCode.startsWith('31') || naicsCode.startsWith('32') || naicsCode.startsWith('33');

  if (isManufacturing) {
    return employees <= 500 ? 'Small Business' : 'Large Business';
  }

  // Most other industries use revenue thresholds
  if (revenue <= 7500000) {
    return 'Small Business';
  } else if (revenue <= 40000000) {
    return 'Mid-Market';
  }

  return 'Large Business';
}

/**
 * Determines growth phase based on YoY growth rate
 */
function getGrowthPhase(yoyGrowthRate: number): string {
  if (yoyGrowthRate < -0.05) return 'Declining';
  if (yoyGrowthRate < 0.03) return 'Stable';
  if (yoyGrowthRate < 0.08) return 'Steady Growth';
  if (yoyGrowthRate < 0.20) return 'Growth';
  if (yoyGrowthRate < 0.50) return 'High Growth';
  return 'Rapid Growth';
}

/**
 * Determines revenue trajectory descriptor
 */
function getRevenueTrajectory(yoyGrowthRate: number): string {
  if (yoyGrowthRate > 0.01) return 'Growing';
  if (yoyGrowthRate < -0.01) return 'Declining';
  return 'Stable';
}

/**
 * Determines market position from market share percentage
 */
function getMarketPosition(marketShare: number): string {
  if (marketShare < 1) return 'Emerging Player';
  if (marketShare < 5) return 'Small Player';
  if (marketShare < 15) return 'Growing Competitor';
  if (marketShare < 30) return 'Significant Player';
  if (marketShare < 50) return 'Market Leader';
  return 'Dominant Player';
}

/**
 * Derives business model from customer mix percentages
 */
function deriveBusinessModel(
  b2bPercent: number | null,
  b2cPercent: number | null,
  wholesalePercent: number | null,
  retailPercent: number | null,
  onlinePercent: number | null
): string {
  const b2b = b2bPercent || 0;
  const b2c = b2cPercent || 0;
  const wholesale = wholesalePercent || 0;
  const retail = retailPercent || 0;
  const online = onlinePercent || 0;

  // Determine primary customer type
  if (b2b >= 80) return 'B2B';
  if (b2c >= 80) return 'B2C';
  if (b2b > 0 && b2c > 0 && Math.abs(b2b - b2c) < 30) return 'Hybrid B2B/B2C';

  // Consider channel mix
  if (online >= 70) return 'Digital/Online';
  if (wholesale >= 50) return 'Wholesale';
  if (retail >= 50) return 'Retail';

  // Default based on predominant type
  if (b2b > b2c) return 'B2B';
  if (b2c > b2b) return 'B2C';

  return 'Mixed Model';
}

/**
 * Derives strategic intent from growth plan rating
 */
function deriveStrategicIntent(growthExitPlan: number): string {
  if (growthExitPlan >= 5) return 'Aggressive Growth with Exit Strategy';
  if (growthExitPlan >= 4) return 'Strategic Growth';
  if (growthExitPlan >= 3) return 'Moderate Growth';
  if (growthExitPlan >= 2) return 'Maintaining Current Position';
  return 'Undefined Strategy';
}

/**
 * Normalizes website URL format
 */
function normalizeWebsite(website: string): string {
  let normalized = website.trim().toLowerCase();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  return normalized;
}

/**
 * Generates ISO 8601 timestamp
 */
function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Main transformation function: converts WebhookPayload to CompanyProfile
 *
 * @param webhook - The webhook payload from questionnaire submission
 * @returns CompanyProfile - Transformed company profile structure
 * @throws TransformationError if validation fails or required data is missing
 */
export function transformToCompanyProfile(webhook: WebhookPayload): CompanyProfile {
  // Validate input
  validateWebhookPayload(webhook);

  const bo = webhook.business_overview;
  const strat = webhook.strategy;
  const sales = webhook.sales;

  // Parse location
  const { city, state } = parseLocation(bo.location);

  // Get industry mapping
  const industryMapping = getIndustryMapping(bo.industry);

  // Calculate workforce metrics
  const totalWorkforce = calculateTotalWorkforce(
    bo.executive_leadership_roles,
    bo.support_admin_staff,
    bo.full_time_employees,
    bo.part_time_employees,
    bo.contract_temp_personnel,
    bo.seasonal_employees
  );

  // Calculate financial metrics
  const yoyGrowthRate = calculateYoYGrowthRate(bo.last_year_revenue, bo.projected_revenue);
  const revenueBand = getRevenueBand(bo.projected_revenue);
  const employeeBand = getEmployeeBand(totalWorkforce);
  const sbaDesignation = getSBADesignation(bo.projected_revenue, totalWorkforce, industryMapping.code);

  // Calculate growth context
  const currentYear = new Date().getFullYear();
  const yearsInOperation = currentYear - bo.year_started;
  const growthPhase = getGrowthPhase(yoyGrowthRate);
  const revenueTrajectory = getRevenueTrajectory(yoyGrowthRate);
  const marketPosition = getMarketPosition(strat?.local_market_share || 0);

  // Derive business model
  const businessModel = deriveBusinessModel(
    sales?.b2b_percentage,
    sales?.b2c_percentage,
    sales?.wholesale_percentage,
    sales?.retail_percentage,
    sales?.online_percentage
  );

  // Derive strategic intent
  const strategicIntent = deriveStrategicIntent(strat?.growth_exit_plan || 0);

  // Transform products/services
  const productsServices = (bo.products_services || []).map(ps => ({
    name: ps.name,
    type: ps.type,
    percent_of_revenue: ps.percentage
  }));

  // Transform competitors
  const competitors = (bo.competitors || []).map(comp => ({
    name: comp.name,
    website: comp.website,
    is_direct_competitor: comp.direct_competitor
  }));

  // Extract other challenges detail (if "other" is in the list)
  const otherChallengesDetail = bo.current_challenges?.includes('other')
    ? 'Additional challenges not categorized'
    : '';

  // Normalize website
  const website = bo.company_website ? normalizeWebsite(bo.company_website) : '';

  // Generate timestamps
  const now = generateTimestamp();

  // Build CompanyProfile structure
  const companyProfile: CompanyProfile = {
    metadata: {
      profile_id: uuidv4(),
      created_date: now,
      last_updated: now,
      assessment_version: '1.0'
    },

    basic_information: {
      company_name: bo.company_name,
      location: {
        city: city,
        state_province: state,
        country: bo.country,
        multiple_locations: bo.multiple_locations || false,
        number_of_locations: bo.number_of_locations || 1
      },
      industry: {
        primary_industry: bo.industry,
        industry_details: bo.industry_other_details || '',
        naics_code: industryMapping.code,
        industry_vertical: industryMapping.vertical
      },
      corporate_structure: bo.corporate_structure,
      website: website,
      year_founded: bo.year_started
    },

    size_metrics: {
      workforce: {
        executive_leadership: bo.executive_leadership_roles || 0,
        support_administrative: bo.support_admin_staff || 0,
        full_time_employees: bo.full_time_employees || 0,
        part_time_employees: bo.part_time_employees || 0,
        contractors_1099: bo.contract_temp_personnel || 0,
        seasonal_employees: bo.seasonal_employees || 0,
        total_workforce: totalWorkforce
      },
      revenue: {
        last_year_total: bo.last_year_revenue,
        projected_this_year: bo.projected_revenue,
        highest_year: bo.highest_sales_year || currentYear,
        highest_annual_revenue: bo.highest_annual_sales || bo.projected_revenue,
        yoy_growth_rate: yoyGrowthRate
      },
      size_classification: {
        revenue_band: revenueBand,
        employee_band: employeeBand,
        sba_designation: sbaDesignation
      }
    },

    business_focus: {
      products_services: productsServices,
      customer_mix: {
        b2b_percent: sales?.b2b_percentage || 0,
        b2c_percent: sales?.b2c_percentage || 0,
        wholesale_percent: sales?.wholesale_percentage || 0,
        retail_percent: sales?.retail_percentage || 0,
        online_percent: sales?.online_percentage || 0
      }
    },

    growth_context: {
      growth_phase: growthPhase,
      growth_stage_indicators: {
        years_in_operation: yearsInOperation,
        revenue_trajectory: revenueTrajectory,
        market_position: marketPosition
      },
      strategic_intent: strategicIntent
    },

    pain_points: {
      current_challenges: bo.current_challenges || [],
      other_challenges_detail: otherChallengesDetail
    },

    competitive_context: {
      competitors: competitors,
      competitive_differentiators: `Market share: ${strat?.local_market_share || 0}%, Understanding: ${strat?.competitive_differentiators_understanding || 0}/5`,
      estimated_market_share: strat?.local_market_share || 0
    },

    benchmark_selectors: {
      primary_industry_code: industryMapping.code,
      revenue_cohort: revenueBand,
      employee_cohort: employeeBand,
      growth_phase: growthPhase,
      geographic_market: `${state}, ${bo.country}`,
      business_model: businessModel
    }
  };

  return companyProfile;
}

/**
 * Exports for testing and utility usage
 */
export const transformationUtils = {
  parseLocation,
  getIndustryMapping,
  calculateTotalWorkforce,
  calculateYoYGrowthRate,
  getRevenueBand,
  getEmployeeBand,
  getSBADesignation,
  getGrowthPhase,
  getRevenueTrajectory,
  getMarketPosition,
  deriveBusinessModel,
  deriveStrategicIntent,
  normalizeWebsite,
  validateWebhookPayload
};
