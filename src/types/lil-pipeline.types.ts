/**
 * LIL Pipeline Type Definitions
 * 
 * Type definitions specific to the LIL (Essentials) pipeline.
 * These types are used throughout the LIL pipeline orchestration.
 */

import { z } from 'zod';
import { CategoryCode, ChapterCode } from '../data/question-category-mapping-lil.js';
import { LILReportType } from '../config/lil-pipeline.config.js';

// ═══════════════════════════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LILBusinessOverview {
  companyName: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  multipleLocations: boolean;
  numberOfLocations?: number;
  industry: string;
  industryDetails?: string;
  corporateStructure: string;
  website?: string;
  yearStarted: number;
  workforce: {
    executiveLeadership: number;
    supportAdmin: number;
    fullTimeEmployees: number;
    partTimeEmployees: number;
    contractors: number;
    seasonal: number;
  };
  salesRevenue: {
    lastYear: number;
    projectedThisYear: number;
    highestYear: number;
    highestAmount: number;
  };
  productsServices: Array<{
    name: string;
    percentOfSales: number;
    type: 'product' | 'service';
  }>;
  currentChallenges: string[];
  competitors: Array<{
    name: string;
    website?: string;
    isDirect: boolean;
  }>;
}

export interface LILQuestionResponse {
  questionId: string;
  value: number | string | boolean | string[];
  isEstimate?: boolean;
  followUpResponse?: string;
}

export interface LILQuestionnaireInput {
  submissionId: string;
  timestamp: string;
  pipelineType: 'LIL';
  businessOverview: LILBusinessOverview;
  responses: LILQuestionResponse[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 0 OUTPUT - Normalized Data
// ═══════════════════════════════════════════════════════════════════════════

export interface LILNormalizedResponse {
  questionId: string;
  categoryCode: CategoryCode;
  chapterCode: ChapterCode;
  rawValue: number | string | boolean | string[];
  normalizedScore: number; // 0-100 scale
  weight: number;
  isEstimate: boolean;
  followUpResponse?: string;
}

export interface LILPhase0Output {
  submissionId: string;
  companyName: string;
  industry: string;
  employeeCount: number;
  normalizedResponses: LILNormalizedResponse[];
  categoryScores: Record<CategoryCode, number>;
  chapterScores: Record<ChapterCode, number>;
  overallScore: number;
  metadata: {
    processedAt: string;
    questionCount: number;
    estimateCount: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 OUTPUT - Cross-Functional Analyses
// ═══════════════════════════════════════════════════════════════════════════

export type CrossFunctionalAnalysisType = 
  | 'growth_potential'
  | 'operational_efficiency'
  | 'financial_health'
  | 'organizational_strength'
  | 'risk_resilience';

export interface LILCrossFunctionalAnalysis {
  analysisType: CrossFunctionalAnalysisType;
  title: string;
  score: number;
  summary: string;
  keyFindings: string[];
  contributingCategories: CategoryCode[];
  recommendations: string[];
}

export interface LILPhase1Output {
  submissionId: string;
  analyses: LILCrossFunctionalAnalysis[];
  executiveSummary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  metadata: {
    processedAt: string;
    modelUsed: string;
    tokensUsed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1.5 OUTPUT - Category Deep Dives
// ═══════════════════════════════════════════════════════════════════════════

export interface LILCategoryAnalysis {
  categoryCode: CategoryCode;
  categoryName: string;
  chapterCode: ChapterCode;
  score: number;
  benchmarkComparison: 'below' | 'at' | 'above';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timeframe: '30-day' | '60-day' | '90-day';
    estimatedImpact: string;
  }>;
  keyMetrics: Array<{
    name: string;
    value: string;
    benchmark?: string;
    status: 'good' | 'warning' | 'critical';
  }>;
}

export interface LILPhase1_5Output {
  submissionId: string;
  categoryAnalyses: LILCategoryAnalysis[];
  chapterSummaries: Record<ChapterCode, {
    score: number;
    summary: string;
    topPriorities: string[];
  }>;
  metadata: {
    processedAt: string;
    modelUsed: string;
    tokensUsed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 OUTPUT - IDM (Integrated Data Model)
// ═══════════════════════════════════════════════════════════════════════════

export interface LILIDMOutput {
  submissionId: string;
  companyProfile: {
    name: string;
    industry: string;
    size: string;
    yearsInBusiness: number;
    totalEmployees: number;
  };
  healthScores: {
    overall: number;
    byChapter: Record<ChapterCode, number>;
    byCategory: Record<CategoryCode, number>;
  };
  consolidatedInsights: {
    executiveSummary: string;
    topStrengths: string[];
    topWeaknesses: string[];
    criticalActions: string[];
  };
  categoryData: Record<CategoryCode, LILCategoryAnalysis>;
  crossFunctionalData: LILCrossFunctionalAnalysis[];
  roadmap: {
    thirtyDay: Array<{ action: string; category: CategoryCode; impact: string }>;
    sixtyDay: Array<{ action: string; category: CategoryCode; impact: string }>;
    ninetyDay: Array<{ action: string; category: CategoryCode; impact: string }>;
  };
  metadata: {
    processedAt: string;
    pipelineVersion: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4.5 OUTPUT - BLUFs (Bottom Line Up Front)
// ═══════════════════════════════════════════════════════════════════════════

export interface LILBLUF {
  reportType: LILReportType;
  headline: string;
  keyTakeaway: string;
  scoreHighlight: string;
  topPriority: string;
  callToAction: string;
}

export interface LILPhase4_5Output {
  submissionId: string;
  blufs: Record<LILReportType, LILBLUF>;
  metadata: {
    processedAt: string;
    modelUsed: string;
    tokensUsed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 OUTPUT - Generated Reports
// ═══════════════════════════════════════════════════════════════════════════

export interface LILGeneratedReport {
  reportType: LILReportType;
  title: string;
  htmlContent: string;
  pageCount: number;
  sections: string[];
  generatedAt: string;
}

export interface LILPhase5Output {
  submissionId: string;
  reports: LILGeneratedReport[];
  metadata: {
    processedAt: string;
    totalReports: number;
    totalPages: number;
    modelUsed: string;
    tokensUsed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface LILPipelineState {
  submissionId: string;
  pipelineType: 'LIL';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentPhase: 'phase0' | 'phase1' | 'phase1_5' | 'phase4' | 'phase4_5' | 'phase5' | 'complete';
  startedAt: string;
  completedAt?: string;
  error?: string;
  outputs: {
    phase0?: LILPhase0Output;
    phase1?: LILPhase1Output;
    phase1_5?: LILPhase1_5Output;
    phase4?: LILIDMOutput;
    phase4_5?: LILPhase4_5Output;
    phase5?: LILPhase5Output;
  };
  metrics: {
    totalTokensUsed: number;
    estimatedCost: number;
    executionTimeMs: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS FOR VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const LILBusinessOverviewSchema = z.object({
  companyName: z.string().min(1),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().default('United States')
  }),
  multipleLocations: z.boolean(),
  numberOfLocations: z.number().optional(),
  industry: z.string(),
  industryDetails: z.string().optional(),
  corporateStructure: z.string(),
  website: z.string().optional(),
  yearStarted: z.number().min(1800).max(2030),
  workforce: z.object({
    executiveLeadership: z.number().min(0),
    supportAdmin: z.number().min(0),
    fullTimeEmployees: z.number().min(0),
    partTimeEmployees: z.number().min(0),
    contractors: z.number().min(0),
    seasonal: z.number().min(0)
  }),
  salesRevenue: z.object({
    lastYear: z.number().min(0),
    projectedThisYear: z.number().min(0),
    highestYear: z.number(),
    highestAmount: z.number().min(0)
  }),
  productsServices: z.array(z.object({
    name: z.string(),
    percentOfSales: z.number().min(0).max(100),
    type: z.enum(['product', 'service'])
  })),
  currentChallenges: z.array(z.string()),
  competitors: z.array(z.object({
    name: z.string(),
    website: z.string().optional(),
    isDirect: z.boolean()
  }))
});

export const LILQuestionResponseSchema = z.object({
  questionId: z.string().regex(/^LQ\d{3}$/),
  value: z.union([z.number(), z.string(), z.boolean(), z.array(z.string())]),
  isEstimate: z.boolean().optional(),
  followUpResponse: z.string().optional()
});

export const LILQuestionnaireInputSchema = z.object({
  submissionId: z.string().uuid(),
  timestamp: z.string().datetime(),
  pipelineType: z.literal('LIL'),
  businessOverview: LILBusinessOverviewSchema,
  responses: z.array(LILQuestionResponseSchema).min(40).max(50) // Allow some flexibility
});
