/**
 * Zod Validation Schemas for Questionnaire Responses
 * BizHealth.ai Unified Pipeline
 *
 * All incoming data MUST pass these schemas before processing.
 */

import { z } from 'zod';
import { CATEGORY_CODES, CHAPTER_CODES, RESPONSE_TYPES } from '../question-mapping.types.js';

// Single question response schema
export const QuestionResponseSchema = z.object({
  questionId: z.string().regex(/^[BL]Q\d{3}$/, 'Invalid question ID format'),
  value: z.union([
    z.number(),
    z.string(),
    z.array(z.string())  // For multiselect
  ]),
  timestamp: z.string().datetime().optional(),
  isEstimate: z.boolean().optional().default(false)
});

// Full questionnaire response schema
export const QuestionnaireResponseSchema = z.record(
  z.string(),
  QuestionResponseSchema
).refine(
  (data) => Object.keys(data).length >= 40,
  { message: 'Questionnaire must have at least 40 responses' }
);

// Normalized response schema (after Phase 0 processing)
export const NormalizedResponseSchema = z.object({
  questionId: z.string(),
  rawValue: z.union([z.number(), z.string()]),
  normalizedScore: z.number().min(0).max(100),
  isValid: z.boolean(),
  categoryCode: z.enum(CATEGORY_CODES),
  chapterCode: z.enum(CHAPTER_CODES),
  weight: z.number().positive(),
  responseType: z.enum(RESPONSE_TYPES),
  validationNotes: z.array(z.string()),
  benchmarkComparison: z.object({
    industryAverage: z.number().optional(),
    percentile: z.number().min(0).max(100).optional(),
    position: z.enum(['poor', 'below_average', 'average', 'above_average', 'excellent']).optional()
  }).optional()
});

// Category analysis output schema
export const CategoryAnalysisSchema = z.object({
  categoryCode: z.enum(CATEGORY_CODES),
  categoryName: z.string(),
  chapterCode: z.enum(CHAPTER_CODES),
  chapterName: z.string(),
  overallScore: z.number().min(0).max(100).nullable(),
  status: z.enum(['Critical', 'Attention', 'Proficiency', 'Excellence', 'NO_DATA']),
  confidence: z.enum(['high', 'medium', 'low', 'none']),
  questionCount: z.number().int().nonnegative(),
  validQuestionCount: z.number().int().nonnegative(),
  executiveSummary: z.string().min(50).max(500),
  detailedAnalysis: z.string().min(100).max(2000),
  strengths: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string(),
    impactLevel: z.enum(['high', 'medium', 'low'])
  })).min(1).max(5),
  weaknesses: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    rootCause: z.string().optional()
  })).max(5),
  quickWins: z.array(z.object({
    title: z.string(),
    description: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    timeline: z.string(),
    estimatedROI: z.string().optional()
  })).min(1).max(4),
  risks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    likelihood: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    mitigation: z.string()
  })).max(3)
});

// Type exports from schemas
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type QuestionnaireResponse = z.infer<typeof QuestionnaireResponseSchema>;
export type NormalizedResponse = z.infer<typeof NormalizedResponseSchema>;
export type CategoryAnalysis = z.infer<typeof CategoryAnalysisSchema>;
