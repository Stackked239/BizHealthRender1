/**
 * LIL Pipeline Configuration
 * 
 * CRITICAL: This file is the single source of truth for all LIL-specific settings.
 * All LIL orchestrators and builders MUST import from this file.
 * 
 * LIL = "Little" Pipeline for Essentials Plan ($99)
 * Target: Micro-businesses and solopreneurs (<15 employees)
 */

import { z } from 'zod';

// Configuration schema for runtime validation
export const LIL_CONFIG_SCHEMA = z.object({
  pipelineType: z.literal('LIL'),
  pipelineVersion: z.string(),
  questionnaireVersion: z.string(),
  totalQuestions: z.literal(45),
  targetMarket: z.string(),
  maxEmployees: z.number(),
  
  phasesEnabled: z.object({
    phase0: z.boolean(),
    phase1: z.boolean(),
    phase1_5: z.boolean(),
    phase2: z.literal(false),    // MUST be false for LIL
    phase3: z.literal(false),    // MUST be false for LIL
    phase4: z.boolean(),
    phase4_5: z.boolean(),
    phase5: z.boolean(),
    postProcessing: z.boolean()
  }),
  
  aiConfig: z.object({
    model: z.string(),
    maxTokensPhase1: z.number(),
    maxTokensPhase1_5: z.number(),
    maxTokensPhase4_5: z.number(),
    maxTokensPhase5: z.number(),
    batchPollingInterval: z.number(),
    maxBatchWaitTime: z.number(),
    thinkingBudgetPhase1: z.number(),
    thinkingBudgetPhase1_5: z.number(),
  }),
  
  benchmarkSet: z.string(),
  categoryCount: z.literal(12),
  chapterCount: z.literal(4),
  
  reportTypes: z.array(z.enum([
    'comprehensive',
    'owner',
    'manager-strategy',
    'manager-sales-marketing',
    'manager-operations',
    'manager-it-technology',
    'manager-financials',
    'employees'
  ])).length(8),
  
  outputSettings: z.object({
    comprehensivePageTarget: z.string(),
    ownerPageTarget: z.string(),
    managerPageTarget: z.string(),
    employeesPageTarget: z.string(),
    format: z.string(),
    branding: z.object({
      bizNavy: z.string(),
      bizGreen: z.string(),
      fontHeading: z.string(),
      fontBody: z.string()
    })
  }),
  
  roadmapFocus: z.object({
    intervals: z.array(z.number()),
    unit: z.string()
  }),
  
  qualityTargets: z.object({
    minCategoryScore: z.number(),
    maxExecutionMinutes: z.number(),
    maxApiCost: z.number(),
    minRecommendationsPerCategory: z.number(),
    maxRecommendationsPerCategory: z.number()
  })
});

// The actual configuration
export const LIL_PIPELINE_CONFIG = {
  pipelineType: 'LIL' as const,
  pipelineVersion: 'LIL_1.0',
  questionnaireVersion: 'MICRO-45Q-2026-Q1',
  totalQuestions: 45 as const,
  targetMarket: 'micro-business-solopreneur-<15-employees',
  maxEmployees: 15,
  
  phasesEnabled: {
    phase0: true,           // Data capture & normalization
    phase1: true,           // 5 cross-functional analyses
    phase1_5: true,         // 12 category analyses (CORE ENGINE)
    phase2: false as const, // REMOVED: Cross-Dimensional Synthesis
    phase3: false as const, // REMOVED: Executive Synthesis
    phase4: true,           // IDM Assembly (simplified)
    phase4_5: true,         // 8 BLUF generation
    phase5: true,           // 8 report generation
    postProcessing: true    // File optimization, archival
  },
  
  aiConfig: {
    model: 'claude-sonnet-4-20250514',
    maxTokensPhase1: 3000,
    maxTokensPhase1_5: 2500,
    maxTokensPhase4_5: 500,
    maxTokensPhase5: 16000,
    batchPollingInterval: 30000,      // 30 seconds
    maxBatchWaitTime: 2400000,        // 40 minutes
    thinkingBudgetPhase1: 4000,
    thinkingBudgetPhase1_5: 3000,
  },
  
  benchmarkSet: 'MICRO-2026-Q1',
  categoryCount: 12 as const,
  chapterCount: 4 as const,
  
  // EXACTLY 8 REPORTS - NO MORE, NO FEWER
  reportTypes: [
    'comprehensive',
    'owner',
    'manager-strategy',
    'manager-sales-marketing',
    'manager-operations',
    'manager-it-technology',
    'manager-financials',
    'employees'
  ] as const,
  
  outputSettings: {
    comprehensivePageTarget: '60-80',
    ownerPageTarget: '25-35',
    managerPageTarget: '15-25',
    employeesPageTarget: '10-15',
    format: 'HTML-PDF',
    branding: {
      bizNavy: '#212653',
      bizGreen: '#969423',
      fontHeading: 'Montserrat',
      fontBody: 'Open Sans'
    }
  },
  
  // LIL uses 30-60-90 day roadmap (NOT 0-6-12-18 months)
  roadmapFocus: {
    intervals: [30, 60, 90],
    unit: 'days'
  },
  
  qualityTargets: {
    minCategoryScore: 1,
    maxExecutionMinutes: 8,
    maxApiCost: 2.50,
    minRecommendationsPerCategory: 3,
    maxRecommendationsPerCategory: 5
  }
} satisfies z.infer<typeof LIL_CONFIG_SCHEMA>;

// Validate at module load time
LIL_CONFIG_SCHEMA.parse(LIL_PIPELINE_CONFIG);

// Helper function to check if running LIL pipeline
export function isLILPipeline(pipelineType: string): pipelineType is 'LIL' {
  return pipelineType === 'LIL';
}

// Helper to get pipeline type from questionnaire
export function getPipelineType(questionCount: number): 'LIL' | 'BIG' {
  return questionCount <= 50 ? 'LIL' : 'BIG';
}

// Export types
export type LILPipelineConfig = z.infer<typeof LIL_CONFIG_SCHEMA>;
export type LILReportType = typeof LIL_PIPELINE_CONFIG.reportTypes[number];

// Category and Chapter definitions
export const LIL_CATEGORIES = {
  STR: { name: 'Strategy', chapter: 'GE', questionCount: 4 },
  SAL: { name: 'Sales', chapter: 'GE', questionCount: 6 },
  MKT: { name: 'Marketing', chapter: 'GE', questionCount: 5 },
  CXP: { name: 'Customer Experience', chapter: 'GE', questionCount: 3 },
  OPS: { name: 'Operations', chapter: 'PH', questionCount: 4 },
  FIN: { name: 'Financials', chapter: 'PH', questionCount: 7 },
  HRS: { name: 'Human Resources', chapter: 'PL', questionCount: 3 },
  LDG: { name: 'Leadership & Governance', chapter: 'PL', questionCount: 2 },
  TIN: { name: 'Technology & Innovation', chapter: 'RS', questionCount: 4 },
  ITD: { name: 'IT, Data Management & Systems', chapter: 'RS', questionCount: 2 },
  RMS: { name: 'Risk Management & Sustainability', chapter: 'RS', questionCount: 3 },
  CMP: { name: 'Compliance - Legal & Regulatory', chapter: 'RS', questionCount: 2 }
} as const;

export const LIL_CHAPTERS = {
  GE: { name: 'Growth Engine', categories: ['STR', 'SAL', 'MKT', 'CXP'] },
  PH: { name: 'Performance & Health', categories: ['OPS', 'FIN'] },
  PL: { name: 'People & Leadership', categories: ['HRS', 'LDG'] },
  RS: { name: 'Resilience & Safeguards', categories: ['TIN', 'ITD', 'RMS', 'CMP'] }
} as const;

export type CategoryCode = keyof typeof LIL_CATEGORIES;
export type ChapterCode = keyof typeof LIL_CHAPTERS;
