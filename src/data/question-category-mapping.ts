/**
 * Question-to-Category Mapping for BizHealth Assessment
 *
 * This file defines the canonical mapping between the 87 questionnaire questions
 * and the 12 business dimensions (categories), organized by 4 chapters.
 *
 * Framework Structure:
 * - 4 Chapters: GE (Growth Engine), PH (Performance & Health), PL (People & Leadership), RS (Resilience & Safeguards)
 * - 12 Categories: STR, SAL, MKT, CXP, OPS, FIN, HRS, LDG, TIN, ITD, RMS, CMP
 * - 87 Questions mapped to categories with weights and response types
 */

// ============================================================================
// CANONICAL CATEGORY CODES
// ============================================================================

/**
 * Canonical category codes used throughout the pipeline
 * NOTE: Uses ITD (IT & Data Security) as canonical code for Phase 1.5+
 */
export const CANONICAL_CATEGORY_CODES = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Security',
  RMS: 'Risk Management & Sustainability',
  CMP: 'Compliance - Legal & Regulatory'
} as const;

export type CategoryCode = keyof typeof CANONICAL_CATEGORY_CODES;

/**
 * Array of all category codes in canonical order
 */
export const CATEGORY_CODES_ORDERED: CategoryCode[] = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
];

// ============================================================================
// CHAPTER-CATEGORY HIERARCHY
// ============================================================================

export const CHAPTER_CATEGORY_MAPPING = {
  GE: {
    name: 'Growth Engine',
    description: 'How the business drives revenue and engages the market',
    categories: ['STR', 'SAL', 'MKT', 'CXP'] as CategoryCode[],
    questionRange: { start: 1, end: 29 } // Questions 1-29
  },
  PH: {
    name: 'Performance & Health',
    description: 'How the business delivers consistently and sustains results',
    categories: ['OPS', 'FIN'] as CategoryCode[],
    questionRange: { start: 30, end: 44 } // Questions 30-44
  },
  PL: {
    name: 'People & Leadership',
    description: 'The human side of growth, culture, and decision-making',
    categories: ['HRS', 'LDG'] as CategoryCode[],
    questionRange: { start: 45, end: 57 } // Questions 45-57
  },
  RS: {
    name: 'Resilience & Safeguards',
    description: 'Long-term viability, adaptability, and compliance',
    categories: ['TIN', 'ITD', 'RMS', 'CMP'] as CategoryCode[],
    questionRange: { start: 58, end: 87 } // Questions 58-87
  }
} as const;

export type ChapterCode = keyof typeof CHAPTER_CATEGORY_MAPPING;

/**
 * Array of all chapter codes in canonical order
 */
export const CHAPTER_CODES_ORDERED: ChapterCode[] = ['GE', 'PH', 'PL', 'RS'];

// ============================================================================
// QUESTION MAPPING TYPES
// ============================================================================

export interface QuestionMapping {
  questionId: string;           // Q001-Q087
  questionNumber: number;       // 1-87
  categoryCode: CategoryCode;   // STR, SAL, etc.
  chapterCode: ChapterCode;     // GE, PH, PL, RS
  questionText: string;         // Full question text
  responseType: 'scale_1_5' | 'numeric' | 'percentage' | 'text' | 'yes_no' | 'multi_select' | 'currency';
  weight: number;               // 0.5-1.5 (importance weight)
  benchmarkable: boolean;       // Can be compared to industry benchmarks
  subIndicatorId: string;       // Sub-indicator this question maps to
  followUpTrigger?: {           // When to ask follow-up
    condition: 'less_than' | 'greater_than' | 'equals';
    threshold: number;
    followUpId: string;
  };
}

// ============================================================================
// COMPLETE QUESTION MAPPINGS (87 QUESTIONS)
// ============================================================================

export const QUESTION_MAPPINGS: QuestionMapping[] = [
  // =========================================================================
  // CHAPTER 1: GROWTH ENGINE (29 questions)
  // =========================================================================

  // === STRATEGY (STR) - 7 Questions ===
  {
    questionId: 'Q001',
    questionNumber: 1,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, how well does your company understand your competitive differentiators and why customers choose you?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'STR_001'
  },
  {
    questionId: 'Q002',
    questionNumber: 2,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'What share of your local market do you think you currently have (as a percentage)?',
    responseType: 'percentage',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'STR_002'
  },
  {
    questionId: 'Q003',
    questionNumber: 3,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'What percent has your sales grown in the past year?',
    responseType: 'percentage',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'STR_003'
  },
  {
    questionId: 'Q004',
    questionNumber: 4,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'What is your target Sales growth for the upcoming year (next 12 months)?',
    responseType: 'percentage',
    weight: 0.8,
    benchmarkable: true,
    subIndicatorId: 'STR_003'
  },
  {
    questionId: 'Q005',
    questionNumber: 5,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do you have a set plan or documented business goals for the next year?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'STR_003',
    followUpTrigger: { condition: 'less_than', threshold: 3, followUpId: 'Q005_FU' }
  },
  {
    questionId: 'Q006',
    questionNumber: 6,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do you review your business plan or adapt your business strategy every few months?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'STR_004'
  },
  {
    questionId: 'Q007',
    questionNumber: 7,
    categoryCode: 'STR',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do you have a defined/documented plan for growing or someday selling your business?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'STR_005'
  },

  // === SALES (SAL) - 8 Questions ===
  {
    questionId: 'Q008',
    questionNumber: 8,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'Sales breakdown: B2B % + B2C % and Wholesale % + Retail % + Online %',
    responseType: 'multi_select',
    weight: 0.8,
    benchmarkable: false,
    subIndicatorId: 'SAL_001'
  },
  {
    questionId: 'Q009',
    questionNumber: 9,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do your monthly sales targets align with what the business really needs to meet its goals?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'SAL_001'
  },
  {
    questionId: 'Q010',
    questionNumber: 10,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'Sales Pipeline Management: On a scale of 1-5, is your sales process smooth and organized?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'SAL_002'
  },
  {
    questionId: 'Q011',
    questionNumber: 11,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'Average Sales Cycle: On average, how many days does it typically take to close a sale?',
    responseType: 'numeric',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'SAL_003'
  },
  {
    questionId: 'Q012',
    questionNumber: 12,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'Close Rate: What percentage of your customer interactions or sales calls result in an order or sale?',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'SAL_003'
  },
  {
    questionId: 'Q013',
    questionNumber: 13,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'What is your average sale/order size (in dollars)?',
    responseType: 'currency',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'SAL_003'
  },
  {
    questionId: 'Q014',
    questionNumber: 14,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'Repeat Sales: What percentage of your monthly sales are from returning customers?',
    responseType: 'percentage',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'SAL_004'
  },
  {
    questionId: 'Q015',
    questionNumber: 15,
    categoryCode: 'SAL',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, how actively do you focus on increasing sales to your existing customers?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'SAL_005',
    followUpTrigger: { condition: 'less_than', threshold: 3, followUpId: 'Q015_FU' }
  },

  // === MARKETING (MKT) - 9 Questions ===
  {
    questionId: 'Q016',
    questionNumber: 16,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Brand Awareness: On a scale of 1-5, how well-known and recognized is your company/brand among your target customers?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'MKT_001'
  },
  {
    questionId: 'Q017',
    questionNumber: 17,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, how many different marketing methods or channels do you actively use?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'MKT_005'
  },
  {
    questionId: 'Q018',
    questionNumber: 18,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Marketing Channels: Current and Future channels utilized',
    responseType: 'text',
    weight: 0.8,
    benchmarkable: false,
    subIndicatorId: 'MKT_005'
  },
  {
    questionId: 'Q019',
    questionNumber: 19,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do you know who your best customers are and target them with your Marketing?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'MKT_002'
  },
  {
    questionId: 'Q020',
    questionNumber: 20,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Customer Acquisition Costs (CAC): How much do you spend to acquire one new customer?',
    responseType: 'currency',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'MKT_003'
  },
  {
    questionId: 'Q021',
    questionNumber: 21,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Customer Lifetime Value (LTV): What is the average lifetime value of a customer?',
    responseType: 'currency',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'MKT_003'
  },
  {
    questionId: 'Q022',
    questionNumber: 22,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Awareness Conversion Rate: What percentage of people who learn about your business actually become customers?',
    responseType: 'percentage',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'MKT_003'
  },
  {
    questionId: 'Q023',
    questionNumber: 23,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'Marketing ROI: What return do you get on marketing spend (dollars back for every dollar spent)?',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'MKT_004'
  },
  {
    questionId: 'Q024',
    questionNumber: 24,
    categoryCode: 'MKT',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, do you track customer feedback and use it to improve?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'MKT_001',
    followUpTrigger: { condition: 'less_than', threshold: 5, followUpId: 'Q024_FU' }
  },

  // === CUSTOMER EXPERIENCE (CXP) - 5 Questions ===
  {
    questionId: 'Q025',
    questionNumber: 25,
    categoryCode: 'CXP',
    chapterCode: 'GE',
    questionText: 'On a scale of 1-5, how satisfied are your customers with the overall quality and value of your products or services?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'CXP_002'
  },
  {
    questionId: 'Q026',
    questionNumber: 26,
    categoryCode: 'CXP',
    chapterCode: 'GE',
    questionText: 'Net Promoter Score (NPS): On a scale of 1-5, how likely are your customers to recommend your business to others?',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    subIndicatorId: 'CXP_003'
  },
  {
    questionId: 'Q027',
    questionNumber: 27,
    categoryCode: 'CXP',
    chapterCode: 'GE',
    questionText: 'Customer Effort Score (CES): On a scale of 1-5, how easy is it for customers to interact with your business at key touchpoints?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'CXP_002'
  },
  {
    questionId: 'Q028',
    questionNumber: 28,
    categoryCode: 'CXP',
    chapterCode: 'GE',
    questionText: 'Competitive Strength: On a scale of 1-5, to what extent do factors like service quality, pricing, and innovation influence customer decisions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'CXP_002'
  },
  {
    questionId: 'Q029',
    questionNumber: 29,
    categoryCode: 'CXP',
    chapterCode: 'GE',
    questionText: 'Issue Resolution: On a scale of 1-5, how effectively does your business resolve customer issues on first contact?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'CXP_004'
  },

  // =========================================================================
  // CHAPTER 2: PERFORMANCE & HEALTH (15 questions)
  // =========================================================================

  // === OPERATIONS (OPS) - 6 Questions ===
  {
    questionId: 'Q030',
    questionNumber: 30,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: "Operational Efficiency: On a scale of 1-5, what percentage of your team's efforts directly contribute to revenue-generating activities?",
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'OPS_001'
  },
  {
    questionId: 'Q031',
    questionNumber: 31,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: 'On a scale of 1-5, how well are your workflows documented, standardized, and streamlined?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'OPS_002'
  },
  {
    questionId: 'Q032',
    questionNumber: 32,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: 'Inventory Turnover Rate: On average, how many times per year do you sell through and replace your entire inventory?',
    responseType: 'numeric',
    weight: 0.9,
    benchmarkable: true,
    subIndicatorId: 'OPS_005'
  },
  {
    questionId: 'Q033',
    questionNumber: 33,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: 'Operational Reliability: How would you rate your ability to deliver high-quality services, projects, or products on time?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'OPS_003',
    followUpTrigger: { condition: 'less_than', threshold: 5, followUpId: 'Q033_FU' }
  },
  {
    questionId: 'Q034',
    questionNumber: 34,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: 'Lean Principles: On a scale of 1-5, how well does your team identify and reduce waste?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'OPS_004'
  },
  {
    questionId: 'Q035',
    questionNumber: 35,
    categoryCode: 'OPS',
    chapterCode: 'PH',
    questionText: 'Capacity Utilization Rate: What percentage of your resources (personnel, space, equipment) are you currently utilizing?',
    responseType: 'percentage',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'OPS_005'
  },

  // === FINANCIALS (FIN) - 9 Questions ===
  {
    questionId: 'Q036',
    questionNumber: 36,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Total Debt & Liabilities: Total Current Debt/Liabilities, Total Working Capital, and debt monitoring scale',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'FIN_001'
  },
  {
    questionId: 'Q037',
    questionNumber: 37,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Short-term Cash Position & Liquidity: Total Current Cash Available and Total Near-term Expenses',
    responseType: 'currency',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'FIN_002'
  },
  {
    questionId: 'Q038',
    questionNumber: 38,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Cash Runway: How many months could your business operate solely on current cash reserves?',
    responseType: 'numeric',
    weight: 1.4,
    benchmarkable: true,
    subIndicatorId: 'FIN_002'
  },
  {
    questionId: 'Q039',
    questionNumber: 39,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Gross Profit Margin: What percent of your sales remains after paying for what you sold (COGS)?',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'FIN_003'
  },
  {
    questionId: 'Q040',
    questionNumber: 40,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: "EBITDA & Profitability: What's your estimated monthly profit before taxes and deductions?",
    responseType: 'currency',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'FIN_003'
  },
  {
    questionId: 'Q041',
    questionNumber: 41,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Burn Rate: On a scale of 1-5, are your monthly expenses at a level that supports healthy growth?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'FIN_002'
  },
  {
    questionId: 'Q042',
    questionNumber: 42,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Cash Flow Forecasting: On a scale of 1-5, how accurately can you predict your cash coming in and out next month?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'FIN_004'
  },
  {
    questionId: 'Q043',
    questionNumber: 43,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Budgeting & Financial Planning: How effectively does your company operate within budgets and financial forecasts?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'FIN_004'
  },
  {
    questionId: 'Q044',
    questionNumber: 44,
    categoryCode: 'FIN',
    chapterCode: 'PH',
    questionText: 'Financial Readiness for Growth: On a scale of 1-5, how confident are you in your ability to fund growth initiatives?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'FIN_005'
  },

  // =========================================================================
  // CHAPTER 3: PEOPLE & LEADERSHIP (13 questions)
  // =========================================================================

  // === HUMAN RESOURCES (HRS) - 7 Questions ===
  {
    questionId: 'Q045',
    questionNumber: 45,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'HR Infrastructure: On a scale of 1-5, how complete, up-to-date, and consistently applied is your HR infrastructure?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'HRS_001'
  },
  {
    questionId: 'Q046',
    questionNumber: 46,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Company Culture: On a scale of 1-5, how clearly defined and positively experienced is your company culture?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'HRS_002'
  },
  {
    questionId: 'Q047',
    questionNumber: 47,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Recruiting & Onboarding: On a scale of 1-5, how consistent and effective are your recruiting and onboarding processes?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'HRS_003'
  },
  {
    questionId: 'Q048',
    questionNumber: 48,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Training & Development: On a scale of 1-5, how well does your company provide employee training and development?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'HRS_004',
    followUpTrigger: { condition: 'less_than', threshold: 5, followUpId: 'Q048_FU' }
  },
  {
    questionId: 'Q049',
    questionNumber: 49,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Employee Turnover Rate: On average, what percent of your employees exit the company each year?',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'HRS_002'
  },
  {
    questionId: 'Q050',
    questionNumber: 50,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Employee Engagement & Retention: On a scale of 1-5, how actively do you measure and address employee satisfaction?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'HRS_002'
  },
  {
    questionId: 'Q051',
    questionNumber: 51,
    categoryCode: 'HRS',
    chapterCode: 'PL',
    questionText: 'Performance Management: On a scale of 1-5, how well do you manage employee performance through regular reviews?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'HRS_005'
  },

  // === LEADERSHIP & GOVERNANCE (LDG) - 6 Questions ===
  {
    questionId: 'Q052',
    questionNumber: 52,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Leadership Effectiveness: On a scale of 1-5, how clearly does leadership communicate strategic goals?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'LDG_001'
  },
  {
    questionId: 'Q053',
    questionNumber: 53,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Decision-Making Structure: On a scale of 1-5, how effective is your leadership structure in enabling agile decisions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'LDG_002'
  },
  {
    questionId: 'Q054',
    questionNumber: 54,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Leadership & Board Oversight: On a scale of 1-5, how diverse, independent, and knowledgeable is your leadership team?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'LDG_003'
  },
  {
    questionId: 'Q055',
    questionNumber: 55,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Decision-Making Effectiveness: On a scale of 1-5, how effective are leaders at making timely, quality decisions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'LDG_002'
  },
  {
    questionId: 'Q056',
    questionNumber: 56,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Leadership and Culture Effectiveness: On a scale of 1-5, how well do leaders build trust and embody company values?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'LDG_004'
  },
  {
    questionId: 'Q057',
    questionNumber: 57,
    categoryCode: 'LDG',
    chapterCode: 'PL',
    questionText: 'Development and Mentorship: On a scale of 1-5, how committed are leaders to personal growth and mentoring?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'LDG_005'
  },

  // =========================================================================
  // CHAPTER 4: RESILIENCE & SAFEGUARDS (30 questions)
  // =========================================================================

  // === TECHNOLOGY & INNOVATION (TIN) - 7 Questions ===
  {
    questionId: 'Q058',
    questionNumber: 58,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: "Technology Investment: What is your company's annual spend on technology?",
    responseType: 'currency',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'TIN_001'
  },
  {
    questionId: 'Q059',
    questionNumber: 59,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Innovation Pipeline: What percentage of annual sales comes from new products/services launched in the last 1-3 years?',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'TIN_005'
  },
  {
    questionId: 'Q060',
    questionNumber: 60,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Innovation Culture: On a scale of 1-5, how actively does your company pursue new methods and technologies?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'TIN_002'
  },
  {
    questionId: 'Q061',
    questionNumber: 61,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Emerging Technologies: On a scale of 1-5, how actively does your business explore emerging technologies?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'TIN_003'
  },
  {
    questionId: 'Q062',
    questionNumber: 62,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Technology Adoption: On a scale of 1-5, how effectively do employees adopt new technology tools?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'TIN_003'
  },
  {
    questionId: 'Q063',
    questionNumber: 63,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Automation Utilization: On a scale of 1-5, how effectively do you use automation to streamline operations?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'TIN_004'
  },
  {
    questionId: 'Q064',
    questionNumber: 64,
    categoryCode: 'TIN',
    chapterCode: 'RS',
    questionText: 'Innovation Impact: On a scale of 1-5, how much has innovation contributed to business growth?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'TIN_005'
  },

  // === IT, DATA & SYSTEMS (IDS) - 7 Questions ===
  {
    questionId: 'Q065',
    questionNumber: 65,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'IT Infrastructure: On a scale of 1-5, how reliable is your IT infrastructure in terms of uptime?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'IDS_001'
  },
  {
    questionId: 'Q066',
    questionNumber: 66,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'Network Effectiveness: On a scale of 1-5, how effective is your network infrastructure?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'IDS_002'
  },
  {
    questionId: 'Q067',
    questionNumber: 67,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'Cybersecurity: On a scale of 1-5, how prepared is your business for cybersecurity threats?',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    subIndicatorId: 'IDS_003'
  },
  {
    questionId: 'Q068',
    questionNumber: 68,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'Data Management: On a scale of 1-5, how robust are your data backup and recovery processes?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'IDS_004'
  },
  {
    questionId: 'Q069',
    questionNumber: 69,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'Data Governance & Compliance: On a scale of 1-5, how well-managed is your data quality and compliance?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'IDS_004'
  },
  {
    questionId: 'Q070',
    questionNumber: 70,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'IT & Network Systems Scalability: On a scale of 1-5, how scalable are your IT systems?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'IDS_005'
  },
  {
    questionId: 'Q071',
    questionNumber: 71,
    categoryCode: 'ITD',
    chapterCode: 'RS',
    questionText: 'IT Support & Maintenance: On a scale of 1-5, how effective is your IT support strategy?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'IDS_001'
  },

  // === RISK MANAGEMENT & SUSTAINABILITY (RMS) - 8 Questions ===
  {
    questionId: 'Q072',
    questionNumber: 72,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Overall Risk Outlook: On a scale of 1-5, how vulnerable is your business to major risks?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'RMS_001'
  },
  {
    questionId: 'Q073',
    questionNumber: 73,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Risk Identification & Review: How often does your team review potential risks?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'RMS_002'
  },
  {
    questionId: 'Q074',
    questionNumber: 74,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Risk Mitigation: What percent of big risks do you have a backup plan for?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'RMS_003'
  },
  {
    questionId: 'Q075',
    questionNumber: 75,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Contingency Plans: On a scale of 1-5, how well could your business continue during unexpected disruptions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'RMS_004',
    followUpTrigger: { condition: 'less_than', threshold: 4, followUpId: 'Q075_FU' }
  },
  {
    questionId: 'Q076',
    questionNumber: 76,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Financial Resilience: On a scale of 1-5, how prepared is your business for unexpected financial setbacks?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'RMS_003'
  },
  {
    questionId: 'Q077',
    questionNumber: 77,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Operational Continuity: How confident are you in maintaining operations during disruptions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'RMS_004'
  },
  {
    questionId: 'Q078',
    questionNumber: 78,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Succession & Leadership Stability: On a scale of 1-5, how prepared is your organization for leadership transitions?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'RMS_004'
  },
  {
    questionId: 'Q079',
    questionNumber: 79,
    categoryCode: 'RMS',
    chapterCode: 'RS',
    questionText: 'Strategic Adaptability: How effectively does your business adapt to changing market conditions?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'RMS_005'
  },

  // === COMPLIANCE - LEGAL & REGULATORY (CMP) - 8 Questions ===
  {
    questionId: 'Q080',
    questionNumber: 80,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Compliance Awareness: On a scale of 1-5, how knowledgeable is your leadership about relevant regulations?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'CMP_001'
  },
  {
    questionId: 'Q081',
    questionNumber: 81,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Policy Adherence: On a scale of 1-5, how effectively does your business follow key compliance rules?',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    subIndicatorId: 'CMP_002'
  },
  {
    questionId: 'Q082',
    questionNumber: 82,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Training Completion: On a scale of 1-5, how compliant is your team with required regulatory training?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'CMP_001'
  },
  {
    questionId: 'Q083',
    questionNumber: 83,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'HR Policy Compliance: On a scale of 1-5, how up-to-date are your HR policies with current labor laws?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'CMP_003'
  },
  {
    questionId: 'Q084',
    questionNumber: 84,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Licensing Compliance: On a scale of 1-5, how up-to-date are your business licenses and permits?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'CMP_003'
  },
  {
    questionId: 'Q085',
    questionNumber: 85,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Contract Review & Legal Protection: On a scale of 1-5, how effectively do you review contracts?',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    subIndicatorId: 'CMP_004'
  },
  {
    questionId: 'Q086',
    questionNumber: 86,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Legal Incidents: On a scale of 1-5, what is the frequency and severity of legal issues in the past 3 years?',
    responseType: 'scale_1_5',
    weight: 1.0,
    benchmarkable: true,
    subIndicatorId: 'CMP_005'
  },
  {
    questionId: 'Q087',
    questionNumber: 87,
    categoryCode: 'CMP',
    chapterCode: 'RS',
    questionText: 'Audit Readiness: On a scale of 1-5, how prepared is your business for financial, HR, or regulatory audits?',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    subIndicatorId: 'CMP_001'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get questions for a specific category
 */
export function getQuestionsForCategory(categoryCode: CategoryCode): QuestionMapping[] {
  return QUESTION_MAPPINGS.filter(q => q.categoryCode === categoryCode);
}

/**
 * Get questions for a specific chapter
 */
export function getQuestionsForChapter(chapterCode: ChapterCode): QuestionMapping[] {
  return QUESTION_MAPPINGS.filter(q => q.chapterCode === chapterCode);
}

/**
 * Get question by ID
 */
export function getQuestionById(questionId: string): QuestionMapping | undefined {
  return QUESTION_MAPPINGS.find(q => q.questionId === questionId);
}

/**
 * Get question by number
 */
export function getQuestionByNumber(questionNumber: number): QuestionMapping | undefined {
  return QUESTION_MAPPINGS.find(q => q.questionNumber === questionNumber);
}

/**
 * Get category code for a chapter
 */
export function getCategoriesForChapter(chapterCode: ChapterCode): CategoryCode[] {
  return CHAPTER_CATEGORY_MAPPING[chapterCode].categories;
}

/**
 * Get chapter code for a category
 */
export function getChapterForCategory(categoryCode: CategoryCode): ChapterCode {
  for (const [chapterCode, chapter] of Object.entries(CHAPTER_CATEGORY_MAPPING)) {
    if (chapter.categories.includes(categoryCode)) {
      return chapterCode as ChapterCode;
    }
  }
  throw new Error(`Category ${categoryCode} not found in any chapter`);
}

/**
 * Get category name from code
 */
export function getCategoryName(categoryCode: CategoryCode): string {
  return CANONICAL_CATEGORY_CODES[categoryCode];
}

/**
 * Get chapter name from code
 */
export function getChapterName(chapterCode: ChapterCode): string {
  return CHAPTER_CATEGORY_MAPPING[chapterCode].name;
}

/**
 * Get count of questions per category
 */
export function getQuestionCountByCategory(): Record<CategoryCode, number> {
  const counts: Record<string, number> = {};
  for (const code of CATEGORY_CODES_ORDERED) {
    counts[code] = getQuestionsForCategory(code).length;
  }
  return counts as Record<CategoryCode, number>;
}

/**
 * Get count of questions per chapter
 */
export function getQuestionCountByChapter(): Record<ChapterCode, number> {
  const counts: Record<string, number> = {};
  for (const code of CHAPTER_CODES_ORDERED) {
    counts[code] = getQuestionsForChapter(code).length;
  }
  return counts as Record<ChapterCode, number>;
}

// ============================================================================
// CATEGORY CODE NORMALIZATION
// ============================================================================

/**
 * Legacy code mappings for backward compatibility
 * Maps deprecated codes to canonical codes
 */
const LEGACY_CODE_MAP: Record<string, CategoryCode> = {
  'IDS': 'ITD',  // Legacy: IT, Data & Systems → Canonical: IT & Data Security
  'IT': 'ITD',   // Alternate shorthand
};

/**
 * Normalize a category code to its canonical form
 * Handles legacy codes (IDS → ITD) for backward compatibility
 *
 * @param code - The category code to normalize (may be legacy or canonical)
 * @returns The canonical category code
 */
export function normalizeCategoryCode(code: string): CategoryCode {
  // Check if it's a legacy code that needs mapping
  const mappedCode = LEGACY_CODE_MAP[code];
  if (mappedCode) {
    return mappedCode;
  }

  // Verify it's a valid canonical code
  if (CATEGORY_CODES_ORDERED.includes(code as CategoryCode)) {
    return code as CategoryCode;
  }

  // Return as-is (may be invalid, let caller handle)
  return code as CategoryCode;
}

/**
 * Check if a code is a valid category code (canonical or legacy)
 */
export function isValidCategoryCode(code: string): boolean {
  return CATEGORY_CODES_ORDERED.includes(code as CategoryCode) ||
         Object.keys(LEGACY_CODE_MAP).includes(code);
}

/**
 * Get all legacy codes for a canonical code
 * Useful for lookups that need to match both legacy and canonical codes
 */
export function getLegacyCodes(canonicalCode: CategoryCode): string[] {
  const legacyCodes: string[] = [];
  for (const [legacy, canonical] of Object.entries(LEGACY_CODE_MAP)) {
    if (canonical === canonicalCode) {
      legacyCodes.push(legacy);
    }
  }
  return legacyCodes;
}

/**
 * Get all codes (canonical + legacy) for a category
 * Useful for finding items that may use either code
 */
export function getAllCodesForCategory(categoryCode: CategoryCode): string[] {
  const normalizedCode = normalizeCategoryCode(categoryCode);
  return [normalizedCode, ...getLegacyCodes(normalizedCode)];
}
