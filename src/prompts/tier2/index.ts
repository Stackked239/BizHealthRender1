/**
 * Phase 1 Tier 2 Analysis Prompts Index
 *
 * Exports all system and user prompt templates for the 5 Tier 2 interconnection analyses:
 * 1. Growth Readiness Assessment
 * 2. Market Position & Competitive Dynamics Assessment
 * 3. Resource Optimization & Efficiency Assessment
 * 4. Risk & Resilience Assessment
 * 5. Scalability & Infrastructure Readiness Assessment
 *
 * Each analysis module exports:
 * - systemPrompt: Detailed system prompt defining role, frameworks, and methodology
 * - createUserPrompt(cp, responses, benchmarks, tier1Outputs): Function to generate data-injected user prompt
 *
 * Usage:
 * ```typescript
 * import { tier2Prompts } from './prompts/tier2';
 *
 * const growthReadinessPrompt = {
 *   system: tier2Prompts.growthReadiness.systemPrompt,
 *   user: tier2Prompts.growthReadiness.createUserPrompt(
 *     companyProfile,
 *     responses,
 *     benchmarks,
 *     tier1Outputs
 *   )
 * };
 * ```
 */

import * as growthReadiness from './growth-readiness.prompts';
import * as marketPosition from './market-position.prompts';
import * as resourceOptimization from './resource-optimization.prompts';
import * as riskResilience from './risk-resilience.prompts';
import * as scalabilityReadiness from './scalability-readiness.prompts';
import { withVisualizationInstructions } from '../shared/visualization-instructions';

export const tier2Prompts = {
  growthReadiness,
  marketPosition,
  resourceOptimization,
  riskResilience,
  scalabilityReadiness,
};

/**
 * Analysis metadata for orchestration and conditional execution
 */
export const tier2AnalysisMetadata = {
  growthReadiness: {
    analysisName: 'Growth Readiness Assessment',
    analysisType: 'tier2_interconnection',
    components: ['Strategy', 'Sales', 'Marketing', 'HR', 'Technology'],
    tier1Dependencies: [
      'Revenue Engine Analysis',
      'People & Leadership Ecosystem Analysis',
      'Operational Excellence Analysis',
      'Financial & Strategic Alignment',
    ],
    estimatedPages: '10-14',
    estimatedTokens: 7000,
    frameworks: [
      'Sustainable Growth Rate (SGR) Analysis',
      'Scaling Readiness Framework (5 dimensions)',
      'Resource Capacity Planning',
      'Theory of Constraints',
      'Growth Investment Modeling',
    ],
    triggerConditions: [
      'Revenue growth target > 25% annually',
      'Growth phase = "Growth" or "Scale-up"',
      'Strategic goals mention "expansion", "scale", "growth"',
      'Current growth rate > sustainable growth rate',
      'Hiring plans > 30% headcount increase',
    ],
  },
  marketPosition: {
    analysisName: 'Market Position & Competitive Dynamics Assessment',
    analysisType: 'tier2_interconnection',
    components: ['Technology', 'Strategy', 'Operations', 'Marketing'],
    tier1Dependencies: [
      'Operational Excellence Analysis',
      'Financial & Strategic Alignment',
      'Revenue Engine Analysis',
    ],
    estimatedPages: '10-14',
    estimatedTokens: 7000,
    frameworks: [
      "Porter's Five Forces (competitive intensity analysis)",
      'Innovation Maturity Model',
      'VRIO Framework (Value, Rarity, Imitability, Organization)',
      'Technology Adoption Lifecycle',
      'Competitive Positioning Matrix',
    ],
    triggerConditions: [
      'Strategic goals mention "innovation", "technology leadership", "R&D"',
      'Pain points mention "competitive pressure", "differentiation"',
      'Industry is innovation-driven (tech, software, manufacturing)',
      'Company has R&D budget > 5% revenue',
      'New product/service development mentioned',
    ],
  },
  resourceOptimization: {
    analysisName: 'Resource Optimization & Efficiency Assessment',
    analysisType: 'tier2_interconnection',
    components: ['Operations', 'Technology', 'Financials', 'HR'],
    tier1Dependencies: [
      'Operational Excellence Analysis',
      'Financial & Strategic Alignment',
      'People & Leadership Ecosystem Analysis',
    ],
    estimatedPages: '10-14',
    estimatedTokens: 7000,
    frameworks: [
      'Lean Six Sigma (Waste Elimination & Process Efficiency)',
      'Resource Utilization Analysis',
      'Total Cost of Ownership (TCO) Analysis',
      'Productivity Metrics Framework',
      'ROI Prioritization Matrix',
    ],
    triggerConditions: [
      'Pain points mention "efficiency", "cost", "productivity"',
      'Profit margins below industry median',
      'Revenue per employee below industry median',
      'Operational efficiency scores < 3/5 in Tier 1',
      'Strategic goals mention "cost reduction", "efficiency improvement"',
    ],
  },
  riskResilience: {
    analysisName: 'Risk & Resilience Assessment',
    analysisType: 'tier2_interconnection',
    components: ['Risk Management', 'Compliance', 'Financials', 'Operations', 'IT'],
    tier1Dependencies: [
      'Compliance & Sustainability Framework Analysis',
      'Financial & Strategic Alignment',
      'Operational Excellence Analysis',
    ],
    estimatedPages: '10-14',
    estimatedTokens: 7000,
    frameworks: [
      'COSO Enterprise Risk Management (ERM) Framework',
      'ISO 31000 Risk Management Standard',
      'Business Continuity Management (ISO 22301)',
      'Financial Risk Assessment (Liquidity, Solvency, Leverage)',
      'Operational Resilience Framework',
    ],
    triggerConditions: [
      'Pain points mention "risk", "compliance", "security", "resilience"',
      'Cash runway < 6 months',
      'Compliance risk findings in Tier 1',
      'Cybersecurity score < 3/5',
      'Business continuity plans not in place',
      'High customer concentration (>30% revenue from one customer)',
    ],
  },
  scalabilityReadiness: {
    analysisName: 'Scalability & Infrastructure Readiness Assessment',
    analysisType: 'tier2_interconnection',
    components: ['Technology', 'Operations', 'IT', 'HR'],
    tier1Dependencies: [
      'Operational Excellence Analysis',
      'People & Leadership Ecosystem Analysis',
      'Revenue Engine Analysis',
    ],
    estimatedPages: '10-14',
    estimatedTokens: 7000,
    frameworks: [
      'Technology Scalability Assessment Framework',
      'Process Scalability Analysis (Lean Principles)',
      'Infrastructure Capacity Planning',
      'Organizational Scalability Model',
      'Technical Debt Assessment',
    ],
    triggerConditions: [
      'Growth plans > 50% revenue increase',
      'Technology infrastructure score < 3.5/5',
      'Automation rate < 40%',
      'Process documentation score < 3/5',
      'Pain points mention "scalability", "infrastructure", "systems"',
    ],
  },
};

/**
 * Trigger assessment helper
 *
 * Determines which Tier 2 analyses should run based on company profile and Tier 1 outputs
 */
export function assessTier2Triggers(
  companyProfile: any,
  tier1Outputs: any
): {
  analysesToRun: string[];
  triggerReasons: Record<string, string[]>;
} {
  const analysesToRun: string[] = [];
  const triggerReasons: Record<string, string[]> = {};

  // Growth Readiness triggers
  const growthTriggers: string[] = [];
  const growthTargetPct = companyProfile.company_profile?.size_metrics?.revenue?.yoy_growth_rate || 0;
  const growthPhase = companyProfile.company_profile?.growth_context?.growth_phase || '';
  const strategicGoals = companyProfile.company_profile?.strategic_goals?.join(' ').toLowerCase() || '';

  if (growthTargetPct > 25) {
    growthTriggers.push(`Revenue growth target ${growthTargetPct}% > 25% threshold`);
  }
  if (['Growth', 'Scale-up'].includes(growthPhase)) {
    growthTriggers.push(`Growth phase: ${growthPhase}`);
  }
  if (/(expansion|scale|growth)/i.test(strategicGoals)) {
    growthTriggers.push('Strategic goals mention expansion/scale/growth');
  }

  if (growthTriggers.length > 0) {
    analysesToRun.push('growthReadiness');
    triggerReasons.growthReadiness = growthTriggers;
  }

  // Market Position triggers
  const competitiveTriggers: string[] = [];
  const painPoints = companyProfile.company_profile?.pain_points?.current_challenges?.join(' ').toLowerCase() || '';

  if (/(innovation|technology|r&d)/i.test(strategicGoals)) {
    competitiveTriggers.push('Strategic goals mention innovation/technology/R&D');
  }
  if (/(competitive|differentiation)/i.test(painPoints)) {
    competitiveTriggers.push('Pain points mention competitive pressure/differentiation');
  }

  if (competitiveTriggers.length > 0) {
    analysesToRun.push('marketPosition');
    triggerReasons.marketPosition = competitiveTriggers;
  }

  // Resource Optimization triggers
  const efficiencyTriggers: string[] = [];

  if (/(efficiency|cost|productivity)/i.test(painPoints)) {
    efficiencyTriggers.push('Pain points mention efficiency/cost/productivity');
  }
  if (tier1Outputs?.operational_excellence?.component_assessments?.operations?.overall_score < 3) {
    efficiencyTriggers.push('Operational efficiency score < 3/5 in Tier 1');
  }

  if (efficiencyTriggers.length > 0) {
    analysesToRun.push('resourceOptimization');
    triggerReasons.resourceOptimization = efficiencyTriggers;
  }

  // Risk & Resilience triggers
  const riskTriggers: string[] = [];
  const cashRunwayMonths = companyProfile.company_profile?.financial_metrics?.cash_runway_months || 12;

  if (/(risk|compliance|security|resilience)/i.test(painPoints)) {
    riskTriggers.push('Pain points mention risk/compliance/security/resilience');
  }
  if (cashRunwayMonths < 6) {
    riskTriggers.push(`Cash runway ${cashRunwayMonths} months < 6 month threshold`);
  }
  if (tier1Outputs?.compliance_sustainability?.prioritized_findings?.critical_priority?.length > 0) {
    riskTriggers.push('Critical compliance risks identified in Tier 1');
  }

  if (riskTriggers.length > 0) {
    analysesToRun.push('riskResilience');
    triggerReasons.riskResilience = riskTriggers;
  }

  // Scalability & Infrastructure triggers
  const scalabilityTriggers: string[] = [];

  if (growthTargetPct > 50) {
    scalabilityTriggers.push(`Growth target ${growthTargetPct}% > 50% threshold`);
  }
  if (/(scalability|infrastructure|systems)/i.test(painPoints)) {
    scalabilityTriggers.push('Pain points mention scalability/infrastructure/systems');
  }
  if (tier1Outputs?.operational_excellence?.component_assessments?.technology?.overall_score < 3.5) {
    scalabilityTriggers.push('Technology infrastructure score < 3.5/5 in Tier 1');
  }

  if (scalabilityTriggers.length > 0) {
    analysesToRun.push('scalabilityReadiness');
    triggerReasons.scalabilityReadiness = scalabilityTriggers;
  }

  return {
    analysesToRun,
    triggerReasons,
  };
}

/**
 * Batch API configuration helper for Tier 2 analyses
 *
 * Generates batch API request configuration for triggered Tier 2 analyses
 */
export function generateTier2BatchConfig(
  companyId: string,
  companyProfile: any,
  questionnaireResponses: any,
  benchmarkData: any,
  tier1Outputs: any,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    analysesToRun?: string[]; // Optional: override trigger assessment
  } = {}
) {
  const {
    model = 'gpt-4o',
    temperature = 0.2,
    maxTokens = 7000,
    analysesToRun,
  } = options;

  // Determine which analyses to run
  const triggers = analysesToRun || assessTier2Triggers(companyProfile, tier1Outputs).analysesToRun;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const batchRequests: any[] = [];

  // Growth Readiness
  if (triggers.includes('growthReadiness')) {
    batchRequests.push({
      custom_id: `tier2_growth_readiness_${companyId}_${timestamp}`,
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
            content: withVisualizationInstructions(tier2Prompts.growthReadiness.systemPrompt),
          },
          {
            role: 'user',
            content: tier2Prompts.growthReadiness.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData,
              tier1Outputs
            ),
          },
        ],
      },
    });
  }

  // Market Position & Competitive Dynamics
  if (triggers.includes('marketPosition')) {
    batchRequests.push({
      custom_id: `tier2_market_position_${companyId}_${timestamp}`,
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
            content: withVisualizationInstructions(tier2Prompts.marketPosition.systemPrompt),
          },
          {
            role: 'user',
            content: tier2Prompts.marketPosition.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData,
              tier1Outputs
            ),
          },
        ],
      },
    });
  }

  // Resource Optimization & Efficiency
  if (triggers.includes('resourceOptimization')) {
    batchRequests.push({
      custom_id: `tier2_resource_optimization_${companyId}_${timestamp}`,
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
            content: withVisualizationInstructions(tier2Prompts.resourceOptimization.systemPrompt),
          },
          {
            role: 'user',
            content: tier2Prompts.resourceOptimization.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData,
              tier1Outputs
            ),
          },
        ],
      },
    });
  }

  // Risk & Resilience
  if (triggers.includes('riskResilience')) {
    batchRequests.push({
      custom_id: `tier2_risk_resilience_${companyId}_${timestamp}`,
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
            content: withVisualizationInstructions(tier2Prompts.riskResilience.systemPrompt),
          },
          {
            role: 'user',
            content: tier2Prompts.riskResilience.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData,
              tier1Outputs
            ),
          },
        ],
      },
    });
  }

  // Scalability & Infrastructure Readiness
  if (triggers.includes('scalabilityReadiness')) {
    batchRequests.push({
      custom_id: `tier2_scalability_readiness_${companyId}_${timestamp}`,
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
            content: withVisualizationInstructions(tier2Prompts.scalabilityReadiness.systemPrompt),
          },
          {
            role: 'user',
            content: tier2Prompts.scalabilityReadiness.createUserPrompt(
              companyProfile,
              questionnaireResponses,
              benchmarkData,
              tier1Outputs
            ),
          },
        ],
      },
    });
  }

  return batchRequests;
}

/**
 * Export individual prompt modules for direct access
 */
export {
  growthReadiness,
  marketPosition,
  resourceOptimization,
  riskResilience,
  scalabilityReadiness,
};
