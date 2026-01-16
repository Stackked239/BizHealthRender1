/**
 * Phase 1 Tier 1 Analysis Prompts Index
 *
 * Exports all system and user prompt templates for the 5 core Tier 1 analyses:
 * 1. Revenue Engine Analysis
 * 2. Operational Excellence Analysis
 * 3. Financial & Strategic Alignment Analysis
 * 4. People & Leadership Ecosystem Analysis
 * 5. Compliance & Sustainability Framework Analysis
 *
 * Each analysis module exports:
 * - systemPrompt: Detailed system prompt defining role, frameworks, and methodology
 * - createUserPrompt(cp, responses, benchmarks): Function to generate data-injected user prompt
 *
 * Usage:
 * ```typescript
 * import { tier1Prompts } from './prompts/tier1';
 *
 * const revenueEnginePrompt = {
 *   system: tier1Prompts.revenueEngine.systemPrompt,
 *   user: tier1Prompts.revenueEngine.createUserPrompt(companyProfile, responses, benchmarks)
 * };
 * ```
 */

import * as revenueEngine from './revenue-engine.prompts';
import * as operationalExcellence from './operational-excellence.prompts';
import * as financialStrategic from './financial-strategic.prompts';
import * as peopleLeadership from './people-leadership.prompts';
import * as complianceSustainability from './compliance-sustainability.prompts';
import { withVisualizationInstructions } from '../shared/visualization-instructions';

export const tier1Prompts = {
  revenueEngine,
  operationalExcellence,
  financialStrategic,
  peopleLeadership,
  complianceSustainability,
};

/**
 * Analysis metadata for orchestration and batch processing
 */
export const tier1AnalysisMetadata = {
  revenueEngine: {
    analysisName: 'Revenue Engine Analysis',
    analysisType: 'tier1_cross_functional',
    components: ['Strategy', 'Sales', 'Marketing', 'Customer Experience'],
    estimatedPages: '8-12',
    estimatedTokens: 6000,
    frameworks: [
      'Customer Lifetime Value (CLV) Framework',
      'Sales Funnel/Pipeline Management',
      'Strategic Planning Maturity Assessment',
      'Revenue Operations (RevOps) Framework',
    ],
  },
  operationalExcellence: {
    analysisName: 'Operational Excellence Analysis',
    analysisType: 'tier1_cross_functional',
    components: ['Operations', 'Technology & Innovation', 'IT & Data Systems', 'Risk Management'],
    estimatedPages: '8-12',
    estimatedTokens: 6000,
    frameworks: [
      'Lean Six Sigma (DMAIC) Methodology',
      'Process Value Stream Mapping',
      'Technology Infrastructure Assessment',
      'ITIL Service Management Framework',
      'Business Continuity & Disaster Recovery',
    ],
  },
  financialStrategic: {
    analysisName: 'Financial & Strategic Alignment Analysis',
    analysisType: 'tier1_cross_functional',
    components: ['Strategy', 'Financials'],
    estimatedPages: '6-10',
    estimatedTokens: 5000,
    frameworks: [
      'Financial Ratio Analysis (Liquidity, Profitability, Efficiency, Leverage)',
      'SWOT Analysis',
      'Balanced Scorecard Framework',
      'SMART Goals Assessment',
      'Cash Flow Analysis',
    ],
  },
  peopleLeadership: {
    analysisName: 'People & Leadership Ecosystem Analysis',
    analysisType: 'tier1_cross_functional',
    components: ['Human Resources', 'Leadership & Governance'],
    estimatedPages: '8-12',
    estimatedTokens: 6000,
    frameworks: [
      'SHRM Competency Model (9 core competencies)',
      'McKinsey 7S Framework',
      'HR Maturity Model Assessment',
      'Leadership Effectiveness Framework',
      'Succession Planning Framework',
    ],
  },
  complianceSustainability: {
    analysisName: 'Compliance & Sustainability Framework Analysis',
    analysisType: 'tier1_cross_functional',
    components: ['Compliance - Legal & Regulatory', 'Risk Management & Sustainability'],
    estimatedPages: '6-10',
    estimatedTokens: 5000,
    frameworks: [
      'COSO Internal Control Framework',
      'COSO Enterprise Risk Management (ERM) Framework',
      'ISO 31000 Risk Management Standard',
      'NIST Cybersecurity Framework',
      'ISO 22301 Business Continuity Management',
      'ESG Framework (GRI, SASB standards)',
    ],
  },
};

/**
 * Batch API configuration helper
 *
 * Generates batch API request configuration for all 5 Tier 1 analyses
 */
export function generateTier1BatchConfig(
  companyId: string,
  companyProfile: any,
  questionnaireResponses: any,
  benchmarkData: any,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const {
    model = 'gpt-4o',
    temperature = 0.2,
    maxTokens = 6000,
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return [
    // Revenue Engine Analysis
    {
      custom_id: `tier1_revenue_engine_${companyId}_${timestamp}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: withVisualizationInstructions(tier1Prompts.revenueEngine.systemPrompt),
          },
          {
            role: 'user',
            content: tier1Prompts.revenueEngine.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData
            ),
          },
        ],
      },
    },
    // Operational Excellence Analysis
    {
      custom_id: `tier1_operational_excellence_${companyId}_${timestamp}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: withVisualizationInstructions(tier1Prompts.operationalExcellence.systemPrompt),
          },
          {
            role: 'user',
            content: tier1Prompts.operationalExcellence.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData
            ),
          },
        ],
      },
    },
    // Financial & Strategic Alignment Analysis
    {
      custom_id: `tier1_financial_strategic_${companyId}_${timestamp}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: withVisualizationInstructions(tier1Prompts.financialStrategic.systemPrompt),
          },
          {
            role: 'user',
            content: tier1Prompts.financialStrategic.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData
            ),
          },
        ],
      },
    },
    // People & Leadership Ecosystem Analysis
    {
      custom_id: `tier1_people_leadership_${companyId}_${timestamp}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: withVisualizationInstructions(tier1Prompts.peopleLeadership.systemPrompt),
          },
          {
            role: 'user',
            content: tier1Prompts.peopleLeadership.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData
            ),
          },
        ],
      },
    },
    // Compliance & Sustainability Framework Analysis
    {
      custom_id: `tier1_compliance_sustainability_${companyId}_${timestamp}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: withVisualizationInstructions(tier1Prompts.complianceSustainability.systemPrompt),
          },
          {
            role: 'user',
            content: tier1Prompts.complianceSustainability.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData
            ),
          },
        ],
      },
    },
  ];
}

/**
 * Export individual prompt modules for direct access
 */
export {
  revenueEngine,
  operationalExcellence,
  financialStrategic,
  peopleLeadership,
  complianceSustainability,
};
