/**
 * LIL Pipeline Question-Category Mapping
 * 
 * CRITICAL: This file maps all 45 MICRO Questionnaire questions to 12 categories.
 * Question IDs use LQ prefix (LQ001-LQ045).
 * 
 * Category Distribution:
 * - Growth Engine (GE): STR (4), SAL (6), MKT (5), CXP (3) = 18 questions
 * - Performance & Health (PH): OPS (4), FIN (7) = 11 questions
 * - People & Leadership (PL): HRS (3), LDG (2) = 5 questions
 * - Resilience & Safeguards (RS): TIN (4), ITD (2), RMS (3), CMP (2) = 11 questions
 * TOTAL: 45 questions
 */

import { z } from 'zod';

// Canonical category codes (MUST match BIG Pipeline)
export const CATEGORY_CODES = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'] as const;
export type CategoryCode = typeof CATEGORY_CODES[number];

// Chapter codes
export const CHAPTER_CODES = ['GE', 'PH', 'PL', 'RS'] as const;
export type ChapterCode = typeof CHAPTER_CODES[number];

// Chapter-to-category mapping
export const CHAPTER_CATEGORY_MAP: Record<ChapterCode, CategoryCode[]> = {
  GE: ['STR', 'SAL', 'MKT', 'CXP'],  // Growth Engine
  PH: ['OPS', 'FIN'],                 // Performance & Health
  PL: ['HRS', 'LDG'],                 // People & Leadership
  RS: ['TIN', 'ITD', 'RMS', 'CMP']    // Resilience & Safeguards
};

// Response type definitions
export type ResponseType = 'scale_1_5' | 'percentage' | 'currency' | 'number' | 'text' | 'multi_select' | 'yes_no' | 'calculated';

// Question mapping schema
export const QuestionMappingSchema = z.object({
  questionId: z.string().regex(/^LQ\d{3}$/),
  questionNumber: z.number().int().min(1).max(45),
  questionText: z.string(),
  categoryCode: z.enum(CATEGORY_CODES),
  chapterCode: z.enum(CHAPTER_CODES),
  responseType: z.enum(['scale_1_5', 'percentage', 'currency', 'number', 'text', 'multi_select', 'yes_no', 'calculated']),
  weight: z.number().min(0.5).max(2.0),
  benchmarkable: z.boolean(),
  followUpTrigger: z.string().optional(),
  scaleDescriptions: z.record(z.string()).optional()
});

export type QuestionMapping = z.infer<typeof QuestionMappingSchema>;

// Complete 45-question mapping
export const LIL_QUESTION_MAPPING: QuestionMapping[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 1: GROWTH ENGINE (GE) - 18 Questions
  // ═══════════════════════════════════════════════════════════════════════════
  
  // STRATEGY (STR) - 4 Questions
  {
    questionId: 'LQ001',
    questionNumber: 1,
    questionText: 'On a scale of 1-5, how well does your company understand your competitive differentiators (what makes you different from competitors) and why customers choose you?',
    categoryCode: 'STR',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Minimal: little or no understanding of differentiators or customer choices',
      '2': 'Limited: some awareness, but differentiation is vague or unclear',
      '3': 'Moderate: basic understanding, not fully clarified or communicated',
      '4': 'Good: clear understanding and effective communication of unique qualities',
      '5': 'Excellent: deep insight of differentiators, actively leveraging to stand out'
    }
  },
  {
    questionId: 'LQ002',
    questionNumber: 2,
    questionText: 'What percent has your sales grown in the past year (even if it\'s a guess)?',
    categoryCode: 'STR',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.3,
    benchmarkable: true
  },
  {
    questionId: 'LQ003',
    questionNumber: 3,
    questionText: 'On a scale of 1-5, do you have a set plan or documented business goals for the next year?',
    categoryCode: 'STR',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'If <3, ask: What barriers keep you from setting & documenting company goals?',
    scaleDescriptions: {
      '1': 'No Plan: no defined or documented goals for the next year',
      '2': 'Informal: goals exist but are vague or not documented',
      '3': 'Basic: some documented goals, limited detail or measurement',
      '4': 'Structured: clear, documented goals with measurable targets',
      '5': 'Comprehensive: fully documented goals with tracking and accountability'
    }
  },
  {
    questionId: 'LQ004',
    questionNumber: 4,
    questionText: 'What is your target Sales growth for the upcoming year (next 12 months)?',
    categoryCode: 'STR',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true
  },

  // SALES (SAL) - 6 Questions
  {
    questionId: 'LQ005',
    questionNumber: 5,
    questionText: 'What is your sales breakdown? (B2B % + B2C % = 100%)',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.1,
    benchmarkable: false
  },
  {
    questionId: 'LQ006',
    questionNumber: 6,
    questionText: 'On average, how many days does it typically take to close a sale?',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'number',
    weight: 1.2,
    benchmarkable: true
  },
  {
    questionId: 'LQ007',
    questionNumber: 7,
    questionText: 'What is your average sale/order size (in dollars)?',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'currency',
    weight: 1.3,
    benchmarkable: true
  },
  {
    questionId: 'LQ008',
    questionNumber: 8,
    questionText: 'What percentage of your monthly sales are from returning customers?',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.4,
    benchmarkable: true
  },
  {
    questionId: 'LQ009',
    questionNumber: 9,
    questionText: 'What percentage of your sales opportunities or leads typically result in an order or sale?',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.5,
    benchmarkable: true
  },
  {
    questionId: 'LQ010',
    questionNumber: 10,
    questionText: 'On a scale of 1-5, how actively does your business focus on increasing sales to your existing customers (upselling/cross-selling)?',
    categoryCode: 'SAL',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'If <3, ask: What obstacles or challenges make it difficult to upsell or cross-sell?',
    scaleDescriptions: {
      '1': 'Rarely: no focus on increasing sales to existing customers',
      '2': 'Minimal: some efforts to upsell, but not consistent',
      '3': 'Moderate: some efforts to expand sales with current customers',
      '4': 'Strong: consistent efforts to upsell and expand sales',
      '5': 'Optimal: regular upselling strategies; prioritize customer expansion'
    }
  },

  // MARKETING (MKT) - 5 Questions
  {
    questionId: 'LQ011',
    questionNumber: 11,
    questionText: 'On a scale of 1-5, how many different marketing methods or channels do you actively use?',
    categoryCode: 'MKT',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.1,
    benchmarkable: true,
    followUpTrigger: 'What Marketing method(s) or channels do you currently utilize?',
    scaleDescriptions: {
      '1': 'Limited: use 0-1 marketing method',
      '2': 'Basic: use 2 methods with limited diversity',
      '3': 'Moderate: use 3-5 marketing methods with a balanced mix',
      '4': 'Broad: use 6 or more methods with good variety',
      '5': 'Optimal: utilize multiple (7+) channels in a strategic way'
    }
  },
  {
    questionId: 'LQ012',
    questionNumber: 12,
    questionText: 'On a scale of 1-5, do you know who your best customers are and target them with your Marketing?',
    categoryCode: 'MKT',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'No marketing: No efforts to identify or target customers',
      '2': 'Limited: Some marketing, but no clear target audience',
      '3': 'Basic: Know your customers but unsure how to target them effectively',
      '4': 'Good: Clear understanding and targeted marketing efforts',
      '5': 'Excellent: Fully aware of ideal customers; actively target with tailored marketing'
    }
  },
  {
    questionId: 'LQ013',
    questionNumber: 13,
    questionText: 'How much do you spend to acquire one new customer (Customer Acquisition Cost)?',
    categoryCode: 'MKT',
    chapterCode: 'GE',
    responseType: 'currency',
    weight: 1.2,
    benchmarkable: true
  },
  {
    questionId: 'LQ014',
    questionNumber: 14,
    questionText: 'What return do you get on marketing spend (Marketing ROI as a percent)?',
    categoryCode: 'MKT',
    chapterCode: 'GE',
    responseType: 'percentage',
    weight: 1.3,
    benchmarkable: true
  },
  {
    questionId: 'LQ015',
    questionNumber: 15,
    questionText: 'What is the average lifetime value of a customer (total revenue from a typical customer over time)?',
    categoryCode: 'MKT',
    chapterCode: 'GE',
    responseType: 'currency',
    weight: 1.4,
    benchmarkable: true
  },

  // CUSTOMER EXPERIENCE (CXP) - 3 Questions
  {
    questionId: 'LQ016',
    questionNumber: 16,
    questionText: 'On a scale of 1-5, how satisfied are your customers with the overall quality and value of your products or services?',
    categoryCode: 'CXP',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.5,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Dissatisfied: frequent customer complaints; low value perception',
      '2': 'Subpar: recurring issues; quality/value below expectations',
      '3': 'Average: mixed feedback; meets basic expectations',
      '4': 'Satisfied: frequent positive feedback; good quality and value',
      '5': 'Excellent: consistent positive feedback; exceptional quality and value'
    }
  },
  {
    questionId: 'LQ017',
    questionNumber: 17,
    questionText: 'On a scale of 1-5, how likely are your customers to recommend your business to others (Net Promoter Score)?',
    categoryCode: 'CXP',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Unlikely: customers may discourage others from your business',
      '2': 'Hesitant: limited advocacy; customers often reluctant to recommend',
      '3': 'Neutral: customers indifferent; neither promote nor discourage',
      '4': 'Supportive: generally positive; customers recommend in most cases',
      '5': 'Advocate: customers actively promote your business'
    }
  },
  {
    questionId: 'LQ018',
    questionNumber: 18,
    questionText: 'On a scale of 1-5, how effectively does your business resolve customer issues or complaints on the first contact?',
    categoryCode: 'CXP',
    chapterCode: 'GE',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'On average, how quickly does your team typically respond to customer questions or concerns?',
    scaleDescriptions: {
      '1': 'Minimal: less than 30% resolved on first contact',
      '2': 'Limited: 30-50% resolved on first contact',
      '3': 'Moderate: 50-70% resolved on first contact',
      '4': 'Strong: 70-90% resolved on first contact',
      '5': 'Optimal: greater than 90% resolved on first contact'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 2: PERFORMANCE & HEALTH (PH) - 11 Questions
  // ═══════════════════════════════════════════════════════════════════════════

  // OPERATIONS (OPS) - 4 Questions
  {
    questionId: 'LQ019',
    questionNumber: 19,
    questionText: 'On a scale of 1-5, how well are your workflows documented, standardized, and streamlined for smooth, efficient operations?',
    categoryCode: 'OPS',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Minimal: workflows lack documentation & standardization; frequent internal delays',
      '2': 'Basic: few processes documented; delays and inconsistencies are common',
      '3': 'Developing: most workflows are documented and somewhat streamlined; occasional bottlenecks',
      '4': 'Strong: workflows well documented, standardized, and generally operate smoothly',
      '5': 'Optimal: all workflows are thoroughly documented, standardized, and operate seamlessly'
    }
  },
  {
    questionId: 'LQ020',
    questionNumber: 20,
    questionText: 'On a scale of 1-5, how would you rate your ability to deliver high-quality services, projects, or products on time?',
    categoryCode: 'OPS',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    followUpTrigger: 'If <5, ask: What challenges or factors are most (negatively) impacting your operations?',
    scaleDescriptions: {
      '1': 'Unreliable: frequently miss deadlines or quality standards',
      '2': 'Inconsistent: occasional delays or quality variance; inconsistent outcomes',
      '3': 'Adequate: generally meets timelines and quality standards; some gaps exist',
      '4': 'Good: mostly on time with consistent quality',
      '5': 'Excellent: always on time with superior quality'
    }
  },
  {
    questionId: 'LQ021',
    questionNumber: 21,
    questionText: 'On a scale of 1-5, how efficiently do you believe your business operates (minimal waste, smooth processes, optimal resource use)?',
    categoryCode: 'OPS',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Inefficient: High waste, disorganized processes, poor resource use',
      '2': 'Basic: Some structure, but frequent waste and inefficiencies',
      '3': 'Adequate: Functional processes, with room for improvement',
      '4': 'Efficient: Smooth operations, low waste, good resource management',
      '5': 'Optimized: Seamless processes, minimal waste, maximum resource efficiency'
    }
  },
  {
    questionId: 'LQ022',
    questionNumber: 22,
    questionText: 'On average, what percentage of your resources (personnel, space and equipment) are you currently utilizing?',
    categoryCode: 'OPS',
    chapterCode: 'PH',
    responseType: 'percentage',
    weight: 1.2,
    benchmarkable: true
  },

  // FINANCIALS (FIN) - 7 Questions
  {
    questionId: 'LQ023',
    questionNumber: 23,
    questionText: 'What is your total current cash available and total near-term expenses (bills due in next 30 days)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'currency',
    weight: 1.5,
    benchmarkable: true
  },
  {
    questionId: 'LQ024',
    questionNumber: 24,
    questionText: 'How many months could your business operate solely on your current cash reserves (Cash Runway)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'number',
    weight: 1.5,
    benchmarkable: true
  },
  {
    questionId: 'LQ025',
    questionNumber: 25,
    questionText: 'What percent of your sales remains after paying for what you sold (Gross Profit Margin)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'percentage',
    weight: 1.4,
    benchmarkable: true
  },
  {
    questionId: 'LQ026',
    questionNumber: 26,
    questionText: 'On a scale of 1-5, are your monthly expenses at a level that supports healthy growth (Burn Rate)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Unsustainable: expenses far outpace revenue, threatening stability',
      '2': 'Elevated: high spending strains cash flow, hindering growth',
      '3': 'Balanced: expenses align with steady progress, room for tweaks',
      '4': 'Sustainable: controlled costs enable reliable expansion',
      '5': 'Optimized: minimal expenses, but watch for underinvestment risks'
    }
  },
  {
    questionId: 'LQ027',
    questionNumber: 27,
    questionText: 'What is your total monthly debt payment (loans, credit lines, financing)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'currency',
    weight: 1.2,
    benchmarkable: true
  },
  {
    questionId: 'LQ028',
    questionNumber: 28,
    questionText: 'On a scale of 1-5, how well do you track and plan your business finances (budgeting, expense tracking, revenue forecasting)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Absent: operate reactively without formal budgets, tracking, or forecasting',
      '2': 'Minimal: basic budgets or records exist but are rarely used to guide decisions',
      '3': 'Functional: annual budgets & basic expense tracking in place; some inconsistencies',
      '4': 'Strong: active management of expenses, budgets, and revenue forecasting',
      '5': 'Optimized: Comprehensive, proactive tracking and planning with precise, data-driven budgets & forecasts'
    }
  },
  {
    questionId: 'LQ029',
    questionNumber: 29,
    questionText: 'On a scale of 1-5, how accurately can you predict your cash coming in and out next month (Cash Flow Forecasting)?',
    categoryCode: 'FIN',
    chapterCode: 'PH',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'Are there any financial concerns that are of key importance or potentially troublesome?',
    scaleDescriptions: {
      '1': 'None: no forecasting; unable to predict cash inflows and outflows',
      '2': 'Limited: some awareness, but no formal or reliable forecasts',
      '3': 'Basic: moderate estimates, often based on history',
      '4': 'Strong: accurate, formal methods for predicting cash inflows and outflows',
      '5': 'Optimal: detailed, reliable forecasts that support proactive financial decisions'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 3: PEOPLE & LEADERSHIP (PL) - 5 Questions
  // ═══════════════════════════════════════════════════════════════════════════

  // HUMAN RESOURCES (HRS) - 3 Questions
  {
    questionId: 'LQ030',
    questionNumber: 30,
    questionText: 'On a scale of 1-5, how clearly defined and communicated are your company\'s values and culture?',
    categoryCode: 'HRS',
    chapterCode: 'PL',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Undefined: values are unclear; culture is inconsistent',
      '2': 'Fragmented: some values exist; culture varies and lacks cohesion',
      '3': 'Developing: core values are defined; culture is emerging but lacks consistency',
      '4': 'Strong: well-defined, values consistently lived; positive culture',
      '5': 'Thriving: values are deeply embedded; vibrant highly-positive culture'
    }
  },
  {
    questionId: 'LQ031',
    questionNumber: 31,
    questionText: 'On a scale of 1-5, how well does your company provide employee training and professional development opportunities?',
    categoryCode: 'HRS',
    chapterCode: 'PL',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'None: no formal training or development offered',
      '2': 'Limited: occasional; sporadic training without structure',
      '3': 'Basic: role-specific training with limited development',
      '4': 'Established: regular training programs and development opportunities',
      '5': 'Comprehensive: integrated training, ongoing development, and career planning'
    }
  },
  {
    questionId: 'LQ032',
    questionNumber: 32,
    questionText: 'On a scale of 1-5, how actively does your company measure and address employee satisfaction and retention?',
    categoryCode: 'HRS',
    chapterCode: 'PL',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'If <5, ask: What employee-related issues—such as turnover, team morale, or hiring difficulties—most impact your business?',
    scaleDescriptions: {
      '1': 'None: no measurement or action on engagement or retention',
      '2': 'Informal: casual checks with minimal follow-up',
      '3': 'Limited: some engagement or retention efforts; inconsistent follow-up',
      '4': 'Regular: consistent surveys and feedback used, with actions taken',
      '5': 'Proactive: continuous engagement strategies with high retention success'
    }
  },

  // LEADERSHIP & GOVERNANCE (LDG) - 2 Questions
  {
    questionId: 'LQ033',
    questionNumber: 33,
    questionText: 'On a scale of 1-5, how clearly does your leadership communicate the company\'s strategic goals and inspire long-term growth?',
    categoryCode: 'LDG',
    chapterCode: 'PL',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Unclear: strategic goals are not shared or undefined',
      '2': 'Basic: some clarity, but communication lacks consistency',
      '3': 'Moderate: clear direction with occasional inspiration',
      '4': 'Strong: well-communicated vision that guides and motivates teams',
      '5': 'Optimal: highly compelling vision and consistently reinforced'
    }
  },
  {
    questionId: 'LQ034',
    questionNumber: 34,
    questionText: 'On a scale of 1-5, how well do your leaders build trust, empathy, and team morale while consistently embodying the company\'s values?',
    categoryCode: 'LDG',
    chapterCode: 'PL',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Low: minimal trust/empathy; actions contradict values, causing poor morale',
      '2': 'Inconsistent: gaps in empathy/trust; frequent value mismatches erode team spirit',
      '3': 'Moderate: basic trust/empathy; most decisions align with values, but morale varies',
      '4': 'Strong: solid trust/empathy; positive morale; values guide actions with few exceptions',
      '5': 'High: deep trust; thriving culture; leaders embody values, inspiring excellence'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 4: RESILIENCE & SAFEGUARDS (RS) - 11 Questions
  // ═══════════════════════════════════════════════════════════════════════════

  // TECHNOLOGY & INNOVATION (TIN) - 4 Questions
  {
    questionId: 'LQ035',
    questionNumber: 35,
    questionText: 'What is your company\'s annual spend on technology, including IT infrastructure, tools, and platforms?',
    categoryCode: 'TIN',
    chapterCode: 'RS',
    responseType: 'currency',
    weight: 1.1,
    benchmarkable: true
  },
  {
    questionId: 'LQ036',
    questionNumber: 36,
    questionText: 'On a scale of 1-5, how actively does your company pursue new methods, technologies, or approaches to improve products or services?',
    categoryCode: 'TIN',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Inactive: no efforts to innovate products or services',
      '2': 'Minimal: occasional ideas, rarely fully implemented',
      '3': 'Developing: some structured innovation with mixed results',
      '4': 'Proactive: regular initiatives for innovation',
      '5': 'Optimal: continuous innovation; successful innovation culture'
    }
  },
  {
    questionId: 'LQ037',
    questionNumber: 37,
    questionText: 'On a scale of 1-5, how effectively do employees adopt and utilize new and existing business technology tools?',
    categoryCode: 'TIN',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Minimal: low adoption; employees avoid or struggle with technology',
      '2': 'Limited: basic adoption; general resistance or gaps exist',
      '3': 'Average: moderate usage; sporadic or inconsistent adoption',
      '4': 'Good: widespread adoption; most employees utilize technology',
      '5': 'Excellent: full integration with high proficiency'
    }
  },
  {
    questionId: 'LQ038',
    questionNumber: 38,
    questionText: 'On a scale of 1-5, how effectively does your business use automation to streamline repetitive tasks?',
    categoryCode: 'TIN',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'None: no automation; all processes manual',
      '2': 'Minimal: limited automation; most processes manual',
      '3': 'Moderate: some automation with partial efficiency gains',
      '4': 'Strong: widespread automation; few manual processes',
      '5': 'Optimal: fully automated; minimal manual processes'
    }
  },

  // IT, DATA MANAGEMENT & SYSTEMS (ITD) - 2 Questions
  {
    questionId: 'LQ039',
    questionNumber: 39,
    questionText: 'On a scale of 1-5, how prepared is your business for cybersecurity threats?',
    categoryCode: 'ITD',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Unprepared: no cybersecurity protections in place',
      '2': 'Basic: minimal safeguards, limited defenses',
      '3': 'Moderate: some protective measures but inconsistent',
      '4': 'Strong: comprehensive safeguards covering key areas',
      '5': 'Optimal: robust, regularly tested cybersecurity measures'
    }
  },
  {
    questionId: 'LQ040',
    questionNumber: 40,
    questionText: 'On a scale of 1-5, how robust are your data backup and recovery processes?',
    categoryCode: 'ITD',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Weak: no data backups or recovery processes in place',
      '2': 'Minimal: infrequent backups; little to no recovery testing',
      '3': 'Adequate: basic backups; lacks comprehensiveness',
      '4': 'Strong: regular, reliable backups with tested recovery',
      '5': 'Optimal: automated, multi-site backups, following best practices'
    }
  },

  // RISK MANAGEMENT & SUSTAINABILITY (RMS) - 3 Questions
  {
    questionId: 'LQ041',
    questionNumber: 41,
    questionText: 'On a scale of 1-5, what percent of big risks do you have a backup plan for?',
    categoryCode: 'RMS',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'None: no backup plans for major risks',
      '2': 'Minimal: few risks covered; most lack contingency plans',
      '3': 'Partial: some key risks planned; gaps exist',
      '4': 'Strong: most risks have clear, actionable backup plans',
      '5': 'Comprehensive: tested contingency plans for nearly all major risks'
    }
  },
  {
    questionId: 'LQ042',
    questionNumber: 42,
    questionText: 'On a scale of 1-5, how prepared is your business to handle unexpected financial setbacks?',
    categoryCode: 'RMS',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.4,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Unprepared: no reserves or plans, high vulnerability',
      '2': 'Limited: minimal buffers; reactive only to crises',
      '3': 'Moderate: some reserves or strategies, but gaps exist',
      '4': 'Strong: solid plans and reserves for most scenarios',
      '5': 'Optimal: robust reserves, diversified strategies, and stress-tested plans'
    }
  },
  {
    questionId: 'LQ043',
    questionNumber: 43,
    questionText: 'On a scale of 1-5, how prepared is your business to continue operations if faced with a major disruption?',
    categoryCode: 'RMS',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    followUpTrigger: 'What specific risk(s) concern you and your team the most right now?',
    scaleDescriptions: {
      '1': 'Unprepared: no contingency plans; high vulnerability',
      '2': 'Basic: some measures, mostly reactive; significant gaps',
      '3': 'Partial: some plans, but coverage is incomplete',
      '4': 'Full: strong strategies and backups for most disruptions',
      '5': 'Seamless: tested, comprehensive plans ensuring uninterrupted operations'
    }
  },

  // COMPLIANCE - LEGAL & REGULATORY (CMP) - 2 Questions
  {
    questionId: 'LQ044',
    questionNumber: 44,
    questionText: 'On a scale of 1-5, how effectively does your business follow key compliance rules (e.g., safety standards, data privacy laws)?',
    categoryCode: 'CMP',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.3,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Poor: little to no adherence to key compliance rules',
      '2': 'Fair: occasional compliance, but inconsistent and prone to lapses',
      '3': 'Moderate: generally follows rules, with some gaps',
      '4': 'Good: consistently adheres to key compliance policies',
      '5': 'Excellent: fully compliant, with strict and ongoing adherence to all policies'
    }
  },
  {
    questionId: 'LQ045',
    questionNumber: 45,
    questionText: 'On a scale of 1-5, how up-to-date are your business licenses, permits, and certifications?',
    categoryCode: 'CMP',
    chapterCode: 'RS',
    responseType: 'scale_1_5',
    weight: 1.2,
    benchmarkable: true,
    scaleDescriptions: {
      '1': 'Incomplete: most or all licenses or permits are expired or past due',
      '2': 'Minimal: a few key licenses are current, but many are outdated or incomplete',
      '3': 'Partially: some licenses are current, but a few require updates',
      '4': 'Mostly: licenses and permits are generally up-to-date with minor lapses',
      '5': 'Fully: all licenses and permits are current, valid, and well-maintained'
    }
  }
];

// Helper functions
export function getQuestionsByCategory(categoryCode: CategoryCode): QuestionMapping[] {
  return LIL_QUESTION_MAPPING.filter(q => q.categoryCode === categoryCode);
}

export function getQuestionsByChapter(chapterCode: ChapterCode): QuestionMapping[] {
  const categories = CHAPTER_CATEGORY_MAP[chapterCode];
  return LIL_QUESTION_MAPPING.filter(q => categories.includes(q.categoryCode));
}

export function getQuestionById(questionId: string): QuestionMapping | undefined {
  return LIL_QUESTION_MAPPING.find(q => q.questionId === questionId);
}

export function getCategoryWeight(categoryCode: CategoryCode): number {
  const questions = getQuestionsByCategory(categoryCode);
  return questions.reduce((sum, q) => sum + q.weight, 0) / questions.length;
}

// Validate all questions at module load
LIL_QUESTION_MAPPING.forEach(q => QuestionMappingSchema.parse(q));

// Export total count for validation
export const TOTAL_LIL_QUESTIONS = LIL_QUESTION_MAPPING.length;
if (TOTAL_LIL_QUESTIONS !== 45) {
  throw new Error(`Expected 45 questions, got ${TOTAL_LIL_QUESTIONS}`);
}
