/**
 * Webhook payload types from questionnaire submission
 * Based on sample_webhook.json structure
 */

export interface WebhookPayload {
  event: string;
  timestamp: string;
  submission_id: string;
  created_at: string;
  business_overview: BusinessOverview;
  strategy: StrategyResponses;
  sales: SalesResponses;
  marketing: MarketingResponses;
  customer_experience: CustomerExperienceResponses;
  operations: OperationsResponses;
  financials: FinancialsResponses;
  human_resources: HumanResourcesResponses;
  leadership: LeadershipResponses;
  technology: TechnologyResponses;
  it_infrastructure: ITInfrastructureResponses;
  risk_management: RiskManagementResponses;
  compliance: ComplianceResponses;
}

export interface BusinessOverview {
  company_name: string;
  location: string;
  country: string;
  company_website: string;
  industry: string;
  industry_other_details: string;
  corporate_structure: string;
  year_started: number;
  multiple_locations: boolean;
  number_of_locations: number;
  executive_leadership_roles: number;
  support_admin_staff: number;
  full_time_employees: number;
  part_time_employees: number;
  contract_temp_personnel: number;
  seasonal_employees: number;
  last_year_revenue: number;
  projected_revenue: number;
  highest_sales_year: number;
  highest_annual_sales: number;
  products_services: ProductService[];
  current_challenges: string[];
  competitors: Competitor[];
}

export interface ProductService {
  name: string;
  percentage: number;
  type: 'product' | 'service';
}

export interface Competitor {
  direct_competitor: boolean;
  name: string;
  website: string;
}

export interface StrategyResponses {
  competitive_differentiators_understanding: number;
  local_market_share: number;
  sales_growth_past_year: number;
  sales_growth_past_year_estimate: boolean;
  target_sales_growth: number;
  business_goals_plan: number;
  goals_barriers: string | null;
  business_plan_review: number;
  growth_exit_plan: number;
}

export interface SalesResponses {
  b2b_percentage: number | null;
  b2c_percentage: number | null;
  wholesale_percentage: number | null;
  retail_percentage: number | null;
  online_percentage: number | null;
  sales_targets_alignment: number;
  sales_pipeline_management: number;
  average_sales_cycle_days: number;
  no_sales_cycle: boolean;
  close_rate: number;
  no_customer_interaction: boolean;
  average_sale_size: number;
  repeat_sales_percentage: number;
  upselling_focus: number;
  upselling_obstacles: string | null;
}

export interface MarketingResponses {
  brand_awareness: number;
  marketing_methods_count: number;
  current_marketing_channels: string;
  future_marketing_channels: string | null;
  customer_targeting: number;
  customer_acquisition_cost: number;
  cac_unknown: boolean;
  customer_lifetime_value: number;
  ltv_unknown: boolean;
  awareness_conversion_rate: number;
  marketing_roi: number;
  marketing_roi_unknown: boolean;
  monthly_marketing_spend: number;
}

export interface CustomerExperienceResponses {
  customer_feedback_tracking: number;
  feedback_challenges: string | null;
  customer_satisfaction: number;
  no_feedback_method: boolean;
  net_promoter_score: number;
  customer_effort_score: number;
  competitive_strength: number;
  issue_resolution: number;
  response_time_hours: number;
}

export interface OperationsResponses {
  operational_efficiency: number;
  operational_challenges: string | null;
  workflow_documentation: number;
  inventory_turnover_rate: number | null;
  no_inventory: boolean;
  operational_reliability: number;
  lean_principles: number;
  space_utilization: number;
  equipment_utilization: number;
  personnel_utilization: number;
}

export interface FinancialsResponses {
  total_debt_liabilities: number | null;
  total_working_capital: number;
  debt_monitoring: number;
  current_cash_available: number;
  near_term_expenses: number;
  cash_runway_months: number | null;
  gross_profit_margin: number;
  monthly_profit_estimate: number;
  profit_is_estimate: boolean;
  burn_rate: number;
  cash_flow_forecasting: number;
  budgeting_financial_planning: number;
  financial_readiness_growth: number;
  financial_concerns: string | null;
}

export interface HumanResourcesResponses {
  hr_infrastructure: number;
  company_culture: number;
  recruiting_onboarding: number;
  training_development: number;
  training_resources_needed: string | null;
  employee_turnover_rate: number;
  employee_engagement: number;
  performance_management: number;
}

export interface LeadershipResponses {
  leadership_effectiveness: number;
  decision_making_structure: number;
  leadership_board_oversight: number;
  has_advisory_board: boolean;
  decision_making_effectiveness: number;
  leadership_culture_effectiveness: number;
  development_mentorship: number;
}

export interface TechnologyResponses {
  technology_investment: number;
  tech_investment_estimate: boolean;
  innovation_pipeline_percentage: number;
  innovation_culture: number;
  emerging_technologies: number;
  technology_adoption: number;
  automation_utilization: number;
  innovation_impact: number;
}

export interface ITInfrastructureResponses {
  it_infrastructure: number;
  network_effectiveness: number;
  cybersecurity: number;
  data_management: number;
  data_governance: number;
  it_scalability: number;
  it_support_maintenance: number;
}

export interface RiskManagementResponses {
  overall_risk_outlook: number;
  specific_risks_concern: string | null;
  risk_identification_review: number;
  risk_mitigation: number;
  contingency_plans: number;
  financial_resilience: number;
  operational_continuity: number;
  succession_leadership_stability: number;
  strategic_adaptability: number;
  disruption_impact: string | null;
}

export interface ComplianceResponses {
  compliance_awareness: number;
  policy_adherence: number;
  training_completion: number;
  compliance_monitoring: number;
  regulatory_updates: number;
  compliance_documentation: number;
  incident_reporting: number;
  compliance_costs: number;
  compliance_cost_estimate: boolean;
}
