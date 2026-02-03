/**
 * Question Mapping Type Definitions
 * BizHealth.ai Unified Pipeline
 *
 * These types are shared between BIG and LIL pipelines.
 * Changes here affect both pipeline variants.
 */

// Canonical category codes - SINGLE SOURCE OF TRUTH
export const CATEGORY_CODES = [
  'STR', 'SAL', 'MKT', 'CXP',  // Growth Engine
  'OPS', 'FIN',                 // Performance & Health
  'HRS', 'LDG',                 // People & Leadership
  'TIN', 'ITD', 'RMS', 'CMP'   // Resilience & Safeguards
] as const;

export type CategoryCode = typeof CATEGORY_CODES[number];

// Chapter codes
export const CHAPTER_CODES = ['GE', 'PH', 'PL', 'RS'] as const;
export type ChapterCode = typeof CHAPTER_CODES[number];

// Response types supported by questionnaires
// Note: Using underscore naming to match existing codebase conventions
export const RESPONSE_TYPES = [
  'scale_1_5',
  'percentage',
  'number',
  'currency',
  'text',
  'yes_no',
  'multi_select',
  'calculated'
] as const;

export type ResponseType = typeof RESPONSE_TYPES[number];

// Health status bands - used for reporting
export const HEALTH_BANDS = {
  CRITICAL: { min: 0, max: 39, label: 'Critical', color: '#dc3545' },
  ATTENTION: { min: 40, max: 59, label: 'Attention', color: '#ffc107' },
  PROFICIENCY: { min: 60, max: 79, label: 'Proficiency', color: '#28a745' },
  EXCELLENCE: { min: 80, max: 100, label: 'Excellence', color: '#007bff' }
} as const;

export type HealthBand = keyof typeof HEALTH_BANDS;

// Pipeline types
export type PipelineType = 'BIG' | 'LIL';

// Question mapping structure
export interface QuestionMapping {
  questionId: string;
  questionNumber: number;
  categoryCode: CategoryCode;
  chapterCode: ChapterCode;
  questionText: string;
  responseType: ResponseType;
  weight: number;
  benchmarkable: boolean;
  followUpTrigger?: {
    condition: 'lessThan' | 'greaterThan' | 'equals';
    threshold: number;
    followUpQuestionId?: string;
  };
}

// Category configuration
export interface CategoryConfig {
  code: CategoryCode;
  name: string;
  chapterCode: ChapterCode;
  chapterName: string;
  expectedQuestionCount: number;
  weight: number;
  sparseThreshold: number;  // Minimum questions for high confidence
}

// Pipeline configuration
export interface PipelineConfig {
  pipelineType: PipelineType;
  version: string;
  questionCount: number;
  questionIdPrefix: string;
  reportCount: number;
  phases: {
    phase0: boolean;
    phase1: boolean;
    phase1_5: boolean;
    phase2: boolean;  // BIG only
    phase3: boolean;  // BIG only
    phase4: boolean;
    phase4_5: boolean;
    phase5: boolean;
  };
  categories: CategoryConfig[];
  healthBands: typeof HEALTH_BANDS;
}

// Chapter-to-category mapping
export const CHAPTER_CATEGORY_MAP: Record<ChapterCode, CategoryCode[]> = {
  GE: ['STR', 'SAL', 'MKT', 'CXP'],  // Growth Engine
  PH: ['OPS', 'FIN'],                 // Performance & Health
  PL: ['HRS', 'LDG'],                 // People & Leadership
  RS: ['TIN', 'ITD', 'RMS', 'CMP']    // Resilience & Safeguards
};

// Chapter names
export const CHAPTER_NAMES: Record<ChapterCode, string> = {
  GE: 'Growth Engine',
  PH: 'Performance & Health',
  PL: 'People & Leadership',
  RS: 'Resilience & Safeguards'
};

// Category names
export const CATEGORY_NAMES: Record<CategoryCode, string> = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Management',
  RMS: 'Risk Management',
  CMP: 'Compliance'
};

/**
 * Get chapter code for a category
 */
export function getChapterForCategory(categoryCode: CategoryCode): ChapterCode {
  for (const [chapter, categories] of Object.entries(CHAPTER_CATEGORY_MAP)) {
    if (categories.includes(categoryCode)) {
      return chapter as ChapterCode;
    }
  }
  throw new Error(`Unknown category code: ${categoryCode}`);
}

/**
 * Validate a category code
 */
export function isValidCategoryCode(code: string): code is CategoryCode {
  return CATEGORY_CODES.includes(code as CategoryCode);
}

/**
 * Validate a chapter code
 */
export function isValidChapterCode(code: string): code is ChapterCode {
  return CHAPTER_CODES.includes(code as ChapterCode);
}

/**
 * Get health band for a score
 */
export function getHealthBandForScore(score: number): typeof HEALTH_BANDS[HealthBand] {
  if (score >= HEALTH_BANDS.EXCELLENCE.min) return HEALTH_BANDS.EXCELLENCE;
  if (score >= HEALTH_BANDS.PROFICIENCY.min) return HEALTH_BANDS.PROFICIENCY;
  if (score >= HEALTH_BANDS.ATTENTION.min) return HEALTH_BANDS.ATTENTION;
  return HEALTH_BANDS.CRITICAL;
}
