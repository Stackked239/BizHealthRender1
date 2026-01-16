/**
 * Questionnaire Responses Transformation Module
 * Transforms webhook category data into QuestionnaireResponses JSON structure
 * matching schema in "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WebhookPayload,
  StrategyResponses,
  SalesResponses,
  MarketingResponses,
  CustomerExperienceResponses,
  OperationsResponses,
  FinancialsResponses,
  HumanResourcesResponses,
  LeadershipResponses,
  TechnologyResponses,
  ITInfrastructureResponses,
  RiskManagementResponses,
  ComplianceResponses,
} from '../types/webhook.types.js';
import {
  QuestionnaireResponses,
  CategoryResponses,
  Question,
  CategoryMetadata,
  OverallMetrics,
} from '../types/questionnaire.types.js';

/**
 * Scale value to text description mapping (1-5 scale)
 */
const SCALE_TEXT_MAP: Record<number, string> = {
  1: 'Poor',
  2: 'Limited',
  3: 'Moderate',
  4: 'Good',
  5: 'Excellent',
};

/**
 * Main transformation function
 * Converts webhook payload to QuestionnaireResponses structure
 */
export function transformToQuestionnaireResponses(
  webhook: WebhookPayload,
  companyProfileId: string
): QuestionnaireResponses {
  // Transform all categories
  const strategyCategory = transformStrategyCategory(webhook.strategy);
  const salesCategory = transformSalesCategory(webhook.sales);
  const marketingCategory = transformMarketingCategory(webhook.marketing);
  const customerExpCategory = transformCustomerExperienceCategory(webhook.customer_experience);
  const operationsCategory = transformOperationsCategory(webhook.operations);
  const financialsCategory = transformFinancialsCategory(webhook.financials);
  const hrCategory = transformHumanResourcesCategory(webhook.human_resources);
  const leadershipCategory = transformLeadershipCategory(webhook.leadership);
  const technologyCategory = transformTechnologyCategory(webhook.technology);
  const itInfraCategory = transformITInfrastructureCategory(webhook.it_infrastructure);
  const riskCategory = transformRiskManagementCategory(webhook.risk_management);
  const complianceCategory = transformComplianceCategory(webhook.compliance);

  // Calculate overall metrics
  const overallMetrics = calculateOverallMetrics([
    strategyCategory,
    salesCategory,
    marketingCategory,
    customerExpCategory,
    operationsCategory,
    financialsCategory,
    hrCategory,
    leadershipCategory,
    technologyCategory,
    itInfraCategory,
    riskCategory,
    complianceCategory,
  ]);

  return {
    metadata: {
      response_id: uuidv4(),
      company_profile_id: companyProfileId,
      completion_date: webhook.created_at,
      completion_status: 'complete',
      total_questions: overallMetrics.total_questions,
      questions_answered: overallMetrics.total_answered,
    },
    categories: {
      strategy: strategyCategory,
      sales: salesCategory,
      marketing: marketingCategory,
      customer_experience: customerExpCategory,
      operations: operationsCategory,
      financials: financialsCategory,
      human_resources: hrCategory,
      leadership_governance: leadershipCategory,
      technology_innovation: technologyCategory,
      it_data_systems: itInfraCategory,
      risk_sustainability: riskCategory,
      compliance_legal: complianceCategory,
    },
    overall_metrics: overallMetrics,
  };
}

/**
 * Strategy Category Transformation
 */
function transformStrategyCategory(data: StrategyResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'strategy_q1',
      question_number: 1,
      question_text: "On a scale of 1-5, how well does your company understand your 'competitive differentiators'?",
      response_type: 'scale',
      response_value: data.competitive_differentiators_understanding,
      response_value_text: SCALE_TEXT_MAP[data.competitive_differentiators_understanding],
      question_weight: 1.0,
    },
    {
      question_id: 'strategy_q2',
      question_number: 2,
      question_text: 'What share of your local market do you think you currently have?',
      response_type: 'percentage',
      response_value: data.local_market_share,
      response_unit: 'percent',
      question_weight: 1.0,
    },
    {
      question_id: 'strategy_q3',
      question_number: 3,
      question_text: 'What percent has your sales grown in the past year?',
      response_type: 'percentage',
      response_value: data.sales_growth_past_year,
      response_unit: 'percent',
      is_estimate: data.sales_growth_past_year_estimate,
      question_weight: 1.0,
    },
    {
      question_id: 'strategy_q4',
      question_number: 4,
      question_text: 'What is your target Sales growth for the upcoming year?',
      response_type: 'percentage',
      response_value: data.target_sales_growth,
      response_unit: 'percent',
      question_weight: 1.0,
    },
    {
      question_id: 'strategy_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, do you have a set plan or documented business goals for the next year?',
      response_type: 'scale',
      response_value: data.business_goals_plan,
      response_value_text: SCALE_TEXT_MAP[data.business_goals_plan],
      follow_up_triggered: !!data.goals_barriers,
      follow_up_response: data.goals_barriers || undefined,
      question_weight: 1.5,
    },
    {
      question_id: 'strategy_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, do you review your business plan or adapt your business strategy every few months?',
      response_type: 'scale',
      response_value: data.business_plan_review,
      response_value_text: SCALE_TEXT_MAP[data.business_plan_review],
      question_weight: 1.0,
    },
    {
      question_id: 'strategy_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, do you have a defined/documented plan for growing or someday selling your business?',
      response_type: 'scale',
      response_value: data.growth_exit_plan,
      response_value_text: SCALE_TEXT_MAP[data.growth_exit_plan],
      question_weight: 1.5,
    },
  ];

  // Calculate category metadata
  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  // Calculate growth gap metric
  const growthGap = data.target_sales_growth - data.sales_growth_past_year;

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      growth_gap: growthGap,
    },
  };

  return {
    category_id: 'strategy',
    category_name: 'Strategy',
    chapter: 'Growth Engine',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Sales Category Transformation
 */
function transformSalesCategory(data: SalesResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'sales_q1',
      question_number: 1,
      question_text: 'Sales mix: B2B/B2C and Wholesale/Retail/Online',
      response_type: 'composite_percentage',
      response_value: {
        b2b_percent: data.b2b_percentage,
        b2c_percent: data.b2c_percentage,
        wholesale_percent: data.wholesale_percentage,
        retail_percent: data.retail_percentage,
        online_percent: data.online_percentage,
      },
      question_weight: 0.5,
    },
    {
      question_id: 'sales_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, do your monthly sales targets align with what the business really needs?',
      response_type: 'scale',
      response_value: data.sales_targets_alignment,
      response_value_text: SCALE_TEXT_MAP[data.sales_targets_alignment],
      question_weight: 1.0,
    },
    {
      question_id: 'sales_q3',
      question_number: 3,
      question_text: 'Sales Pipeline Management: On a scale of 1-5, is your sales process smooth and organized?',
      response_type: 'scale',
      response_value: data.sales_pipeline_management,
      response_value_text: SCALE_TEXT_MAP[data.sales_pipeline_management],
      question_weight: 1.5,
    },
    {
      question_id: 'sales_q4',
      question_number: 4,
      question_text: 'Average Sales Cycle: how many days does it typically take to close a sale?',
      response_type: 'numeric',
      response_value: data.average_sales_cycle_days,
      response_unit: 'days',
      not_applicable: data.no_sales_cycle,
      question_weight: 1.0,
    },
    {
      question_id: 'sales_q5',
      question_number: 5,
      question_text: 'Close Rate: What percentage of your customer interactions result in a sale?',
      response_type: 'percentage',
      response_value: data.close_rate,
      response_unit: 'percent',
      not_applicable: data.no_customer_interaction,
      question_weight: 1.0,
    },
    {
      question_id: 'sales_q6',
      question_number: 6,
      question_text: 'What is your average sale/order size (in dollars)?',
      response_type: 'currency',
      response_value: data.average_sale_size,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'sales_q7',
      question_number: 7,
      question_text: 'Repeat Sales: What percentage of your monthly sales are from returning customers?',
      response_type: 'percentage',
      response_value: data.repeat_sales_percentage,
      response_unit: 'percent',
      question_weight: 1.0,
    },
    {
      question_id: 'sales_q8',
      question_number: 8,
      question_text: 'On a scale of 1-5, how actively do you focus on increasing sales to existing customers?',
      response_type: 'scale',
      response_value: data.upselling_focus,
      response_value_text: SCALE_TEXT_MAP[data.upselling_focus],
      follow_up_triggered: !!data.upselling_obstacles,
      follow_up_response: data.upselling_obstacles || undefined,
      question_weight: 1.0,
    },
  ];

  // Calculate sales velocity: (average_sale_size * close_rate) / sales_cycle_days
  const salesVelocity = data.no_sales_cycle || data.no_customer_interaction
    ? 0
    : (data.average_sale_size * (data.close_rate / 100)) / data.average_sales_cycle_days;

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      sales_velocity: parseFloat(salesVelocity.toFixed(2)),
      b2b_dominance: data.b2b_percentage || 0,
      customer_retention_indicator: data.repeat_sales_percentage,
    },
  };

  return {
    category_id: 'sales',
    category_name: 'Sales',
    chapter: 'Growth Engine',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Marketing Category Transformation
 */
function transformMarketingCategory(data: MarketingResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'marketing_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how well do your customers know your brand?',
      response_type: 'scale',
      response_value: data.brand_awareness,
      response_value_text: SCALE_TEXT_MAP[data.brand_awareness],
      question_weight: 1.0,
    },
    {
      question_id: 'marketing_q2',
      question_number: 2,
      question_text: 'How many marketing methods/channels do you currently use?',
      response_type: 'numeric',
      response_value: data.marketing_methods_count,
      question_weight: 0.5,
    },
    {
      question_id: 'marketing_q3',
      question_number: 3,
      question_text: 'What marketing channels are you currently using?',
      response_type: 'text',
      response_value: data.current_marketing_channels,
      question_weight: 0.5,
    },
    {
      question_id: 'marketing_q4',
      question_number: 4,
      question_text: 'What marketing channels do you plan to use in the future?',
      response_type: 'text',
      response_value: data.future_marketing_channels,
      question_weight: 0.5,
    },
    {
      question_id: 'marketing_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, do you know who your target customer is?',
      response_type: 'scale',
      response_value: data.customer_targeting,
      response_value_text: SCALE_TEXT_MAP[data.customer_targeting],
      question_weight: 1.5,
    },
    {
      question_id: 'marketing_q6',
      question_number: 6,
      question_text: 'What is your Customer Acquisition Cost (CAC)?',
      response_type: 'currency',
      response_value: data.customer_acquisition_cost,
      response_unit: 'USD',
      not_applicable: data.cac_unknown,
      question_weight: 1.0,
    },
    {
      question_id: 'marketing_q7',
      question_number: 7,
      question_text: 'What is your Customer Lifetime Value (LTV)?',
      response_type: 'currency',
      response_value: data.customer_lifetime_value,
      response_unit: 'USD',
      not_applicable: data.ltv_unknown,
      question_weight: 1.0,
    },
    {
      question_id: 'marketing_q8',
      question_number: 8,
      question_text: 'What is your conversion rate from awareness to purchase?',
      response_type: 'percentage',
      response_value: data.awareness_conversion_rate,
      response_unit: 'percent',
      question_weight: 1.0,
    },
    {
      question_id: 'marketing_q9',
      question_number: 9,
      question_text: 'What is your Marketing ROI?',
      response_type: 'percentage',
      response_value: data.marketing_roi,
      response_unit: 'percent',
      not_applicable: data.marketing_roi_unknown,
      question_weight: 1.0,
    },
  ];

  // Calculate CAC/LTV ratio
  const cacLtvRatio = data.cac_unknown || data.ltv_unknown || data.customer_acquisition_cost === 0
    ? 0
    : data.customer_lifetime_value / data.customer_acquisition_cost;

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      cac_ltv_ratio: parseFloat(cacLtvRatio.toFixed(2)),
      marketing_roi: data.marketing_roi_unknown ? 0 : data.marketing_roi,
      channel_diversity_score: data.marketing_methods_count,
    },
  };

  return {
    category_id: 'marketing',
    category_name: 'Marketing',
    chapter: 'Growth Engine',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Customer Experience Category Transformation
 */
function transformCustomerExperienceCategory(data: CustomerExperienceResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'customer_experience_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how well do you track customer feedback?',
      response_type: 'scale',
      response_value: data.customer_feedback_tracking,
      response_value_text: SCALE_TEXT_MAP[data.customer_feedback_tracking],
      follow_up_triggered: !!data.feedback_challenges,
      follow_up_response: data.feedback_challenges || undefined,
      question_weight: 1.0,
    },
    {
      question_id: 'customer_experience_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how satisfied are your customers?',
      response_type: 'scale',
      response_value: data.customer_satisfaction,
      response_value_text: SCALE_TEXT_MAP[data.customer_satisfaction],
      not_applicable: data.no_feedback_method,
      question_weight: 1.5,
    },
    {
      question_id: 'customer_experience_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how likely are your customers to recommend you? (Net Promoter Score)',
      response_type: 'scale',
      response_value: data.net_promoter_score,
      response_value_text: SCALE_TEXT_MAP[data.net_promoter_score],
      question_weight: 1.5,
    },
    {
      question_id: 'customer_experience_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how easy is it for customers to do business with you? (Customer Effort Score)',
      response_type: 'scale',
      response_value: data.customer_effort_score,
      response_value_text: SCALE_TEXT_MAP[data.customer_effort_score],
      question_weight: 1.0,
    },
    {
      question_id: 'customer_experience_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how do you compare to your competitors in customer experience?',
      response_type: 'scale',
      response_value: data.competitive_strength,
      response_value_text: SCALE_TEXT_MAP[data.competitive_strength],
      question_weight: 1.0,
    },
    {
      question_id: 'customer_experience_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how effectively do you resolve customer issues on first contact?',
      response_type: 'scale',
      response_value: data.issue_resolution,
      response_value_text: SCALE_TEXT_MAP[data.issue_resolution],
      question_weight: 1.0,
    },
    {
      question_id: 'customer_experience_q7',
      question_number: 7,
      question_text: 'What is your average response time to customer inquiries (in hours)?',
      response_type: 'numeric',
      response_value: data.response_time_hours,
      response_unit: 'hours',
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
  };

  return {
    category_id: 'customer_experience',
    category_name: 'Customer Experience',
    chapter: 'Growth Engine',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Operations Category Transformation
 */
function transformOperationsCategory(data: OperationsResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'operations_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how efficient are your operations?',
      response_type: 'scale',
      response_value: data.operational_efficiency,
      response_value_text: SCALE_TEXT_MAP[data.operational_efficiency],
      follow_up_triggered: !!data.operational_challenges,
      follow_up_response: data.operational_challenges || undefined,
      question_weight: 1.5,
    },
    {
      question_id: 'operations_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how well documented are your workflows and processes?',
      response_type: 'scale',
      response_value: data.workflow_documentation,
      response_value_text: SCALE_TEXT_MAP[data.workflow_documentation],
      question_weight: 1.0,
    },
    {
      question_id: 'operations_q3',
      question_number: 3,
      question_text: 'What is your inventory turnover rate (times per year)?',
      response_type: 'numeric',
      response_value: data.inventory_turnover_rate,
      response_unit: 'turns_per_year',
      not_applicable: data.no_inventory,
      question_weight: 1.0,
    },
    {
      question_id: 'operations_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how reliable are your operations?',
      response_type: 'scale',
      response_value: data.operational_reliability,
      response_value_text: SCALE_TEXT_MAP[data.operational_reliability],
      question_weight: 1.5,
    },
    {
      question_id: 'operations_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how well do you apply lean principles?',
      response_type: 'scale',
      response_value: data.lean_principles,
      response_value_text: SCALE_TEXT_MAP[data.lean_principles],
      question_weight: 1.0,
    },
    {
      question_id: 'operations_q6',
      question_number: 6,
      question_text: 'What is your utilization rate for space, equipment, and personnel?',
      response_type: 'composite_percentage',
      response_value: {
        space_utilization: data.space_utilization,
        equipment_utilization: data.equipment_utilization,
        personnel_utilization: data.personnel_utilization,
      },
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  // Calculate average capacity utilization
  const avgCapacityUtilization = (
    data.space_utilization +
    data.equipment_utilization +
    data.personnel_utilization
  ) / 3;

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      operational_efficiency_percent: data.operational_efficiency * 20, // Convert 1-5 to percentage
      inventory_turnover: data.no_inventory ? null : data.inventory_turnover_rate,
      capacity_utilization_avg: parseFloat(avgCapacityUtilization.toFixed(1)),
    },
  };

  return {
    category_id: 'operations',
    category_name: 'Operations',
    chapter: 'Performance & Health',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Financials Category Transformation
 */
function transformFinancialsCategory(data: FinancialsResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'financials_q1',
      question_number: 1,
      question_text: 'What is your total debt and liabilities?',
      response_type: 'currency',
      response_value: data.total_debt_liabilities,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q2',
      question_number: 2,
      question_text: 'What is your total working capital?',
      response_type: 'currency',
      response_value: data.total_working_capital,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how well do you monitor your debt?',
      response_type: 'scale',
      response_value: data.debt_monitoring,
      response_value_text: SCALE_TEXT_MAP[data.debt_monitoring],
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q4',
      question_number: 4,
      question_text: 'How much cash do you currently have available?',
      response_type: 'currency',
      response_value: data.current_cash_available,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q5',
      question_number: 5,
      question_text: 'What are your near-term monthly expenses?',
      response_type: 'currency',
      response_value: data.near_term_expenses,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q6',
      question_number: 6,
      question_text: 'How many months of cash runway do you have?',
      response_type: 'numeric',
      response_value: data.cash_runway_months,
      response_unit: 'months',
      question_weight: 1.5,
    },
    {
      question_id: 'financials_q7',
      question_number: 7,
      question_text: 'What is your gross profit margin?',
      response_type: 'percentage',
      response_value: data.gross_profit_margin,
      response_unit: 'percent',
      question_weight: 1.5,
    },
    {
      question_id: 'financials_q8',
      question_number: 8,
      question_text: 'What is your estimated monthly profit?',
      response_type: 'currency',
      response_value: data.monthly_profit_estimate,
      response_unit: 'USD',
      is_estimate: data.profit_is_estimate,
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q9',
      question_number: 9,
      question_text: 'What is your monthly burn rate?',
      response_type: 'currency',
      response_value: data.burn_rate,
      response_unit: 'USD',
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q10',
      question_number: 10,
      question_text: 'On a scale of 1-5, how effective is your cash flow forecasting?',
      response_type: 'scale',
      response_value: data.cash_flow_forecasting,
      response_value_text: SCALE_TEXT_MAP[data.cash_flow_forecasting],
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q11',
      question_number: 11,
      question_text: 'On a scale of 1-5, how effective is your budgeting and financial planning?',
      response_type: 'scale',
      response_value: data.budgeting_financial_planning,
      response_value_text: SCALE_TEXT_MAP[data.budgeting_financial_planning],
      question_weight: 1.0,
    },
    {
      question_id: 'financials_q12',
      question_number: 12,
      question_text: 'On a scale of 1-5, how financially ready are you for growth?',
      response_type: 'scale',
      response_value: data.financial_readiness_growth,
      response_value_text: SCALE_TEXT_MAP[data.financial_readiness_growth],
      follow_up_triggered: !!data.financial_concerns,
      follow_up_response: data.financial_concerns || undefined,
      question_weight: 1.5,
    },
  ];

  // Calculate financial metrics
  const cashRatio = data.near_term_expenses > 0
    ? data.current_cash_available / data.near_term_expenses
    : 0;

  const debtToAssetRatio = data.total_working_capital > 0
    ? (data.total_debt_liabilities || 0) / data.total_working_capital
    : 0;

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      cash_ratio: parseFloat(cashRatio.toFixed(2)),
      cash_runway_months: data.cash_runway_months,
      gross_profit_margin: data.gross_profit_margin,
      monthly_ebitda: data.monthly_profit_estimate,
      debt_to_asset_ratio: parseFloat(debtToAssetRatio.toFixed(2)),
    },
  };

  return {
    category_id: 'financials',
    category_name: 'Financials',
    chapter: 'Performance & Health',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Human Resources Category Transformation
 */
function transformHumanResourcesCategory(data: HumanResourcesResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'human_resources_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how complete is your HR infrastructure?',
      response_type: 'scale',
      response_value: data.hr_infrastructure,
      response_value_text: SCALE_TEXT_MAP[data.hr_infrastructure],
      question_weight: 1.5,
    },
    {
      question_id: 'human_resources_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how strong is your company culture?',
      response_type: 'scale',
      response_value: data.company_culture,
      response_value_text: SCALE_TEXT_MAP[data.company_culture],
      question_weight: 1.5,
    },
    {
      question_id: 'human_resources_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how effective is your recruiting and onboarding?',
      response_type: 'scale',
      response_value: data.recruiting_onboarding,
      response_value_text: SCALE_TEXT_MAP[data.recruiting_onboarding],
      question_weight: 1.0,
    },
    {
      question_id: 'human_resources_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how effective is your training and development?',
      response_type: 'scale',
      response_value: data.training_development,
      response_value_text: SCALE_TEXT_MAP[data.training_development],
      follow_up_triggered: !!data.training_resources_needed,
      follow_up_response: data.training_resources_needed || undefined,
      question_weight: 1.0,
    },
    {
      question_id: 'human_resources_q5',
      question_number: 5,
      question_text: 'What is your employee turnover rate?',
      response_type: 'percentage',
      response_value: data.employee_turnover_rate,
      response_unit: 'percent',
      question_weight: 1.5,
    },
    {
      question_id: 'human_resources_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how engaged are your employees?',
      response_type: 'scale',
      response_value: data.employee_engagement,
      response_value_text: SCALE_TEXT_MAP[data.employee_engagement],
      question_weight: 1.5,
    },
    {
      question_id: 'human_resources_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, how effective is your performance management?',
      response_type: 'scale',
      response_value: data.performance_management,
      response_value_text: SCALE_TEXT_MAP[data.performance_management],
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      employee_turnover_rate: data.employee_turnover_rate,
    },
  };

  return {
    category_id: 'human_resources',
    category_name: 'Human Resources',
    chapter: 'People & Leadership',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Leadership Category Transformation
 */
function transformLeadershipCategory(data: LeadershipResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'leadership_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how effective is your leadership?',
      response_type: 'scale',
      response_value: data.leadership_effectiveness,
      response_value_text: SCALE_TEXT_MAP[data.leadership_effectiveness],
      question_weight: 1.5,
    },
    {
      question_id: 'leadership_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how clear is your decision-making structure?',
      response_type: 'scale',
      response_value: data.decision_making_structure,
      response_value_text: SCALE_TEXT_MAP[data.decision_making_structure],
      question_weight: 1.0,
    },
    {
      question_id: 'leadership_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how effective is your leadership/board oversight?',
      response_type: 'scale',
      response_value: data.leadership_board_oversight,
      response_value_text: SCALE_TEXT_MAP[data.leadership_board_oversight],
      question_weight: 1.0,
    },
    {
      question_id: 'leadership_q4',
      question_number: 4,
      question_text: 'Do you have an advisory board?',
      response_type: 'boolean',
      response_value: data.has_advisory_board ? 1 : 0,
      question_weight: 0.5,
    },
    {
      question_id: 'leadership_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how effective is your decision-making?',
      response_type: 'scale',
      response_value: data.decision_making_effectiveness,
      response_value_text: SCALE_TEXT_MAP[data.decision_making_effectiveness],
      question_weight: 1.5,
    },
    {
      question_id: 'leadership_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how effective is your leadership in creating culture?',
      response_type: 'scale',
      response_value: data.leadership_culture_effectiveness,
      response_value_text: SCALE_TEXT_MAP[data.leadership_culture_effectiveness],
      question_weight: 1.0,
    },
    {
      question_id: 'leadership_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, how effective is your leadership development and mentorship?',
      response_type: 'scale',
      response_value: data.development_mentorship,
      response_value_text: SCALE_TEXT_MAP[data.development_mentorship],
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      has_advisory_board: data.has_advisory_board,
    },
  };

  return {
    category_id: 'leadership_governance',
    category_name: 'Leadership & Governance',
    chapter: 'People & Leadership',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Technology Category Transformation
 */
function transformTechnologyCategory(data: TechnologyResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'technology_q1',
      question_number: 1,
      question_text: 'How much do you invest annually in technology?',
      response_type: 'currency',
      response_value: data.technology_investment,
      response_unit: 'USD',
      is_estimate: data.tech_investment_estimate,
      question_weight: 1.0,
    },
    {
      question_id: 'technology_q2',
      question_number: 2,
      question_text: 'What percentage of your revenue comes from innovation pipeline?',
      response_type: 'percentage',
      response_value: data.innovation_pipeline_percentage,
      response_unit: 'percent',
      question_weight: 1.0,
    },
    {
      question_id: 'technology_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how strong is your innovation culture?',
      response_type: 'scale',
      response_value: data.innovation_culture,
      response_value_text: SCALE_TEXT_MAP[data.innovation_culture],
      question_weight: 1.0,
    },
    {
      question_id: 'technology_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how well do you track emerging technologies?',
      response_type: 'scale',
      response_value: data.emerging_technologies,
      response_value_text: SCALE_TEXT_MAP[data.emerging_technologies],
      question_weight: 1.0,
    },
    {
      question_id: 'technology_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how quickly do you adopt new technologies?',
      response_type: 'scale',
      response_value: data.technology_adoption,
      response_value_text: SCALE_TEXT_MAP[data.technology_adoption],
      question_weight: 1.0,
    },
    {
      question_id: 'technology_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how well do you utilize automation?',
      response_type: 'scale',
      response_value: data.automation_utilization,
      response_value_text: SCALE_TEXT_MAP[data.automation_utilization],
      question_weight: 1.5,
    },
    {
      question_id: 'technology_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, what is the impact of innovation on your business?',
      response_type: 'scale',
      response_value: data.innovation_impact,
      response_value_text: SCALE_TEXT_MAP[data.innovation_impact],
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
    calculated_metrics: {
      technology_investment_annual: data.technology_investment,
      innovation_revenue_percent: data.innovation_pipeline_percentage,
    },
  };

  return {
    category_id: 'technology_innovation',
    category_name: 'Technology & Innovation',
    chapter: 'Resilience & Safeguards',
    questions,
    category_metadata: metadata,
  };
}

/**
 * IT Infrastructure Category Transformation
 */
function transformITInfrastructureCategory(data: ITInfrastructureResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'it_infrastructure_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how adequate is your IT infrastructure?',
      response_type: 'scale',
      response_value: data.it_infrastructure,
      response_value_text: SCALE_TEXT_MAP[data.it_infrastructure],
      question_weight: 1.5,
    },
    {
      question_id: 'it_infrastructure_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how effective is your network?',
      response_type: 'scale',
      response_value: data.network_effectiveness,
      response_value_text: SCALE_TEXT_MAP[data.network_effectiveness],
      question_weight: 1.0,
    },
    {
      question_id: 'it_infrastructure_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how strong is your cybersecurity?',
      response_type: 'scale',
      response_value: data.cybersecurity,
      response_value_text: SCALE_TEXT_MAP[data.cybersecurity],
      question_weight: 2.0,
    },
    {
      question_id: 'it_infrastructure_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how effective is your data management?',
      response_type: 'scale',
      response_value: data.data_management,
      response_value_text: SCALE_TEXT_MAP[data.data_management],
      question_weight: 1.5,
    },
    {
      question_id: 'it_infrastructure_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how effective is your data governance?',
      response_type: 'scale',
      response_value: data.data_governance,
      response_value_text: SCALE_TEXT_MAP[data.data_governance],
      question_weight: 1.0,
    },
    {
      question_id: 'it_infrastructure_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how scalable is your IT infrastructure?',
      response_type: 'scale',
      response_value: data.it_scalability,
      response_value_text: SCALE_TEXT_MAP[data.it_scalability],
      question_weight: 1.5,
    },
    {
      question_id: 'it_infrastructure_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, how effective is your IT support and maintenance?',
      response_type: 'scale',
      response_value: data.it_support_maintenance,
      response_value_text: SCALE_TEXT_MAP[data.it_support_maintenance],
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
  };

  return {
    category_id: 'it_data_systems',
    category_name: 'IT, Data Management & Systems',
    chapter: 'Resilience & Safeguards',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Risk Management Category Transformation
 */
function transformRiskManagementCategory(data: RiskManagementResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'risk_management_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, what is your overall risk outlook?',
      response_type: 'scale',
      response_value: data.overall_risk_outlook,
      response_value_text: SCALE_TEXT_MAP[data.overall_risk_outlook],
      follow_up_triggered: !!data.specific_risks_concern,
      follow_up_response: data.specific_risks_concern || undefined,
      question_weight: 1.5,
    },
    {
      question_id: 'risk_management_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how effectively do you identify and review risks?',
      response_type: 'scale',
      response_value: data.risk_identification_review,
      response_value_text: SCALE_TEXT_MAP[data.risk_identification_review],
      question_weight: 1.0,
    },
    {
      question_id: 'risk_management_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how effective is your risk mitigation?',
      response_type: 'scale',
      response_value: data.risk_mitigation,
      response_value_text: SCALE_TEXT_MAP[data.risk_mitigation],
      question_weight: 1.5,
    },
    {
      question_id: 'risk_management_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how prepared are your contingency plans?',
      response_type: 'scale',
      response_value: data.contingency_plans,
      response_value_text: SCALE_TEXT_MAP[data.contingency_plans],
      question_weight: 1.5,
    },
    {
      question_id: 'risk_management_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how resilient are you financially?',
      response_type: 'scale',
      response_value: data.financial_resilience,
      response_value_text: SCALE_TEXT_MAP[data.financial_resilience],
      question_weight: 1.5,
    },
    {
      question_id: 'risk_management_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how prepared are you for operational disruptions?',
      response_type: 'scale',
      response_value: data.operational_continuity,
      response_value_text: SCALE_TEXT_MAP[data.operational_continuity],
      question_weight: 1.5,
    },
    {
      question_id: 'risk_management_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, how stable is your succession and leadership?',
      response_type: 'scale',
      response_value: data.succession_leadership_stability,
      response_value_text: SCALE_TEXT_MAP[data.succession_leadership_stability],
      question_weight: 1.0,
    },
    {
      question_id: 'risk_management_q8',
      question_number: 8,
      question_text: 'On a scale of 1-5, how adaptable is your strategy?',
      response_type: 'scale',
      response_value: data.strategic_adaptability,
      response_value_text: SCALE_TEXT_MAP[data.strategic_adaptability],
      follow_up_triggered: !!data.disruption_impact,
      follow_up_response: data.disruption_impact || undefined,
      question_weight: 1.0,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
  };

  return {
    category_id: 'risk_sustainability',
    category_name: 'Risk Management & Sustainability',
    chapter: 'Resilience & Safeguards',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Compliance Category Transformation
 */
function transformComplianceCategory(data: ComplianceResponses): CategoryResponses {
  const questions: Question[] = [
    {
      question_id: 'compliance_q1',
      question_number: 1,
      question_text: 'On a scale of 1-5, how aware are you of compliance requirements?',
      response_type: 'scale',
      response_value: data.compliance_awareness,
      response_value_text: SCALE_TEXT_MAP[data.compliance_awareness],
      question_weight: 1.5,
    },
    {
      question_id: 'compliance_q2',
      question_number: 2,
      question_text: 'On a scale of 1-5, how well do you adhere to policies?',
      response_type: 'scale',
      response_value: data.policy_adherence,
      response_value_text: SCALE_TEXT_MAP[data.policy_adherence],
      question_weight: 1.5,
    },
    {
      question_id: 'compliance_q3',
      question_number: 3,
      question_text: 'On a scale of 1-5, how complete is your compliance training?',
      response_type: 'scale',
      response_value: data.training_completion,
      response_value_text: SCALE_TEXT_MAP[data.training_completion],
      question_weight: 1.0,
    },
    {
      question_id: 'compliance_q4',
      question_number: 4,
      question_text: 'On a scale of 1-5, how effective is your compliance monitoring?',
      response_type: 'scale',
      response_value: data.compliance_monitoring,
      response_value_text: SCALE_TEXT_MAP[data.compliance_monitoring],
      question_weight: 1.5,
    },
    {
      question_id: 'compliance_q5',
      question_number: 5,
      question_text: 'On a scale of 1-5, how well do you track regulatory updates?',
      response_type: 'scale',
      response_value: data.regulatory_updates,
      response_value_text: SCALE_TEXT_MAP[data.regulatory_updates],
      question_weight: 1.0,
    },
    {
      question_id: 'compliance_q6',
      question_number: 6,
      question_text: 'On a scale of 1-5, how complete is your compliance documentation?',
      response_type: 'scale',
      response_value: data.compliance_documentation,
      response_value_text: SCALE_TEXT_MAP[data.compliance_documentation],
      question_weight: 1.0,
    },
    {
      question_id: 'compliance_q7',
      question_number: 7,
      question_text: 'On a scale of 1-5, how effective is your incident reporting?',
      response_type: 'scale',
      response_value: data.incident_reporting,
      response_value_text: SCALE_TEXT_MAP[data.incident_reporting],
      question_weight: 1.0,
    },
    {
      question_id: 'compliance_q8',
      question_number: 8,
      question_text: 'What are your annual compliance costs?',
      response_type: 'currency',
      response_value: data.compliance_costs,
      response_unit: 'USD',
      is_estimate: data.compliance_cost_estimate,
      question_weight: 0.5,
    },
  ];

  const scaleQuestions = questions.filter((q) => q.response_type === 'scale');
  const avgScaleScore = calculateAverageScale(scaleQuestions);

  const metadata: CategoryMetadata = {
    total_questions: questions.length,
    questions_answered: questions.length,
    avg_scale_score: avgScaleScore,
  };

  return {
    category_id: 'compliance_legal',
    category_name: 'Compliance - Legal & Regulatory',
    chapter: 'Resilience & Safeguards',
    questions,
    category_metadata: metadata,
  };
}

/**
 * Helper function to calculate average scale score
 */
function calculateAverageScale(questions: Question[]): number {
  if (questions.length === 0) return 0;

  const sum = questions.reduce((acc, q) => {
    const value = typeof q.response_value === 'number' ? q.response_value : 0;
    return acc + value;
  }, 0);

  return parseFloat((sum / questions.length).toFixed(2));
}

/**
 * Calculate overall metrics across all categories
 */
function calculateOverallMetrics(categories: CategoryResponses[]): OverallMetrics {
  let totalQuestions = 0;
  let totalAnswered = 0;
  let scaleScoreSum = 0;
  let scaleScoreCount = 0;

  // Chapter groupings
  const growthEngineCategories = ['strategy', 'sales', 'marketing', 'customer_experience'];
  const performanceHealthCategories = ['operations', 'financials'];
  const peopleLeadershipCategories = ['human_resources', 'leadership_governance'];
  const resilienceSafeguardsCategories = [
    'technology_innovation',
    'it_data_systems',
    'risk_sustainability',
    'compliance_legal',
  ];

  // Calculate totals
  categories.forEach((category) => {
    totalQuestions += category.category_metadata.total_questions;
    totalAnswered += category.category_metadata.questions_answered;

    if (category.category_metadata.avg_scale_score !== undefined) {
      scaleScoreSum += category.category_metadata.avg_scale_score;
      scaleScoreCount++;
    }
  });

  // Calculate chapter scores
  const getChapterScore = (categoryIds: string[]): number => {
    const chapterCategories = categories.filter((c) => categoryIds.includes(c.category_id));
    if (chapterCategories.length === 0) return 0;

    const sum = chapterCategories.reduce((acc, c) => {
      return acc + (c.category_metadata.avg_scale_score || 0);
    }, 0);

    return parseFloat((sum / chapterCategories.length).toFixed(2));
  };

  return {
    total_questions: totalQuestions,
    total_answered: totalAnswered,
    completion_rate: parseFloat(((totalAnswered / totalQuestions) * 100).toFixed(1)),
    overall_avg_scale_score: parseFloat((scaleScoreSum / scaleScoreCount).toFixed(2)),
    chapter_scores: {
      growth_engine: getChapterScore(growthEngineCategories),
      performance_health: getChapterScore(performanceHealthCategories),
      people_leadership: getChapterScore(peopleLeadershipCategories),
      resilience_safeguards: getChapterScore(resilienceSafeguardsCategories),
    },
  };
}

/**
 * Validation function to ensure transformed data is complete
 */
export function validateQuestionnaireResponses(data: QuestionnaireResponses): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate metadata
  if (!data.metadata.response_id) errors.push('Missing response_id');
  if (!data.metadata.company_profile_id) errors.push('Missing company_profile_id');
  if (!data.metadata.completion_date) errors.push('Missing completion_date');

  // Validate categories exist
  const requiredCategories = [
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

  requiredCategories.forEach((cat) => {
    if (!data.categories[cat as keyof typeof data.categories]) {
      errors.push(`Missing category: ${cat}`);
    }
  });

  // Validate overall metrics
  if (data.overall_metrics.total_questions === 0) {
    errors.push('Total questions cannot be zero');
  }

  if (data.overall_metrics.completion_rate < 0 || data.overall_metrics.completion_rate > 100) {
    errors.push('Invalid completion rate');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
