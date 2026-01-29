/**
 * Questionnaire Response types
 * Based on "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

export interface QuestionnaireResponses {
  metadata: QuestionnaireMetadata;
  categories: {
    strategy: CategoryResponses;
    sales: CategoryResponses;
    marketing: CategoryResponses;
    customer_experience: CategoryResponses;
    operations: CategoryResponses;
    financials: CategoryResponses;
    human_resources: CategoryResponses;
    leadership_governance: CategoryResponses;
    technology_innovation: CategoryResponses;
    it_data_systems: CategoryResponses;
    risk_sustainability: CategoryResponses;
    compliance_legal: CategoryResponses;
  };
  overall_metrics: OverallMetrics;
}

export interface QuestionnaireMetadata {
  response_id: string;
  company_profile_id: string;
  completion_date: string;
  completion_status: 'complete' | 'partial';
  total_questions: number;
  questions_answered: number;
}

export interface CategoryResponses {
  category_id: string;
  category_name: string;
  chapter: string;
  questions: Question[];
  category_metadata: CategoryMetadata;
}

export interface Question {
  question_id: string;
  question_number: number;
  question_text: string;
  response_type: ResponseType;
  response_value: number | string | Record<string, unknown> | null;
  response_value_text?: string;
  response_unit?: string;
  is_estimate?: boolean;
  not_applicable?: boolean;
  follow_up_triggered?: boolean;
  follow_up_response?: string;
  question_weight: number;
  skip_logic_triggered?: boolean;
}

export type ResponseType =
  | 'scale'
  | 'numeric'
  | 'percentage'
  | 'currency'
  | 'text'
  | 'boolean'
  | 'checkbox'
  | 'composite_percentage';

export interface CategoryMetadata {
  total_questions: number;
  questions_answered: number;
  avg_scale_score?: number;
  calculated_metrics?: Record<string, number | string>;
}

export interface OverallMetrics {
  total_questions: number;
  total_answered: number;
  completion_rate: number;
  overall_avg_scale_score: number;
  chapter_scores: {
    growth_engine: number;
    performance_health: number;
    people_leadership: number;
    resilience_safeguards: number;
  };
}
