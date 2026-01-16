/**
 * Company Profile (CP) types
 * Based on "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

export interface CompanyProfile {
  metadata: CPMetadata;
  basic_information: BasicInformation;
  size_metrics: SizeMetrics;
  business_focus: BusinessFocus;
  growth_context: GrowthContext;
  pain_points: PainPoints;
  competitive_context: CompetitiveContext;
  benchmark_selectors: BenchmarkSelectors;
}

export interface CPMetadata {
  profile_id: string;
  created_date: string;
  last_updated: string;
  assessment_version: string;
}

export interface BasicInformation {
  company_name: string;
  location: Location;
  industry: Industry;
  corporate_structure: string;
  website: string;
  year_founded: number;
}

export interface Location {
  city: string;
  state_province: string;
  country: string;
  multiple_locations: boolean;
  number_of_locations: number;
}

export interface Industry {
  primary_industry: string;
  industry_details: string;
  naics_code: string;
  industry_vertical: string;
}

export interface SizeMetrics {
  workforce: Workforce;
  revenue: Revenue;
  size_classification: SizeClassification;
}

export interface Workforce {
  executive_leadership: number;
  support_administrative: number;
  full_time_employees: number;
  part_time_employees: number;
  contractors_1099: number;
  seasonal_employees: number;
  total_workforce: number;
}

export interface Revenue {
  last_year_total: number;
  projected_this_year: number;
  highest_year: number;
  highest_annual_revenue: number;
  yoy_growth_rate: number;
}

export interface SizeClassification {
  revenue_band: string;
  employee_band: string;
  sba_designation: string;
}

export interface BusinessFocus {
  products_services: ProductServiceDetail[];
  customer_mix: CustomerMix;
}

export interface ProductServiceDetail {
  name: string;
  type: 'product' | 'service';
  percent_of_revenue: number;
}

export interface CustomerMix {
  b2b_percent: number;
  b2c_percent: number;
  wholesale_percent: number;
  retail_percent: number;
  online_percent: number;
}

export interface GrowthContext {
  growth_phase: string;
  growth_stage_indicators: GrowthStageIndicators;
  strategic_intent: string;
}

export interface GrowthStageIndicators {
  years_in_operation: number;
  revenue_trajectory: string;
  market_position: string;
}

export interface PainPoints {
  current_challenges: string[];
  other_challenges_detail: string;
}

export interface CompetitiveContext {
  competitors: CompetitorDetail[];
  competitive_differentiators: string;
  estimated_market_share: number;
}

export interface CompetitorDetail {
  name: string;
  website: string;
  is_direct_competitor: boolean;
}

export interface BenchmarkSelectors {
  primary_industry_code: string;
  revenue_cohort: string;
  employee_cohort: string;
  growth_phase: string;
  geographic_market: string;
  business_model: string;
}
