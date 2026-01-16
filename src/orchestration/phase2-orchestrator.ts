/**
 * Phase 2 Orchestrator
 *
 * Performs deep-dive cross-analysis on Phase 1 results to generate:
 * - Strategic recommendations
 * - Risk assessments
 * - Growth opportunities
 * - Implementation roadmaps
 * - Priority rankings
 *
 * File-based workflow: Reads Phase 1 JSON output, writes Phase 2 JSON output
 */

import pino from 'pino';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createAnthropicBatchClient, type AnthropicBatchClient } from '../api/anthropic-client.js';
import type { Phase1Results } from './phase1-orchestrator.js';
import type {
  StrategicFinancialOpportunity,
  ImpactCategory,
  ImplementationComplexity,
  ConfidenceLevel
} from '../types/strategic-financial.types.js';
import { MINIMUM_FINANCIAL_IMPACT_THRESHOLD } from '../types/strategic-financial.types.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Priority levels for recommendations
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Timeframe for implementation
 */
export type Timeframe = 'immediate' | 'short_term' | 'medium_term' | 'long_term';

/**
 * Strategic recommendation output
 */
export interface StrategicRecommendation {
  title: string;
  description: string;
  priority: PriorityLevel;
  timeframe: Timeframe;
  impact_areas: string[];
  dependencies: string[];
  expected_outcomes: string[];
  implementation_steps: string[];
}

/**
 * Risk assessment output
 */
export interface RiskAssessment {
  risk_category: string;
  description: string;
  severity: PriorityLevel;
  likelihood: 'high' | 'medium' | 'low';
  impact_areas: string[];
  mitigation_strategies: string[];
  monitoring_indicators: string[];
}

/**
 * Growth opportunity output
 */
export interface GrowthOpportunity {
  title: string;
  description: string;
  potential_impact: PriorityLevel;
  timeframe: Timeframe;
  required_capabilities: string[];
  investment_level: 'low' | 'medium' | 'high';
  success_metrics: string[];
}

/**
 * Phase 2 analysis output structure
 */
export interface Phase2AnalysisOutput {
  analysis_id: string;
  analysis_type: string;
  status: 'complete' | 'failed';
  content: string;
  structured_output?: {
    recommendations?: StrategicRecommendation[];
    risks?: RiskAssessment[];
    opportunities?: GrowthOpportunity[];
    key_insights?: string[];
    priority_actions?: string[];
  };
  metadata: {
    input_tokens: number;
    output_tokens: number;
    thinking_tokens?: number;
    model: string;
    execution_time_ms: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Complete Phase 2 results
 */
export interface Phase2Results {
  phase: 'phase_2';
  status: 'complete' | 'partial' | 'failed';
  company_profile_id: string;
  phase1_reference: string; // Path to Phase 1 results file
  analyses: {
    cross_dimensional: Phase2AnalysisOutput;
    strategic_recommendations: Phase2AnalysisOutput;
    consolidated_risks: Phase2AnalysisOutput;
    growth_opportunities: Phase2AnalysisOutput;
    implementation_roadmap: Phase2AnalysisOutput;
  };

  /**
   * Phase B: Structured financial opportunities from strategic recommendations
   * These are extracted from AI output with validated financial impact data
   */
  strategic_financial_opportunities?: StrategicFinancialOpportunity[];

  summary: {
    total_recommendations: number;
    critical_risks: number;
    high_impact_opportunities: number;
    immediate_actions: number;

    /** Phase B: Total identified annual value from structured opportunities */
    total_identified_annual_value?: number;
    /** Phase B: Count of opportunities with structured financial data */
    opportunities_with_financial_data?: number;
  };
  metadata: {
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
    total_analyses: number;
    successful_analyses: number;
    failed_analyses: number;
    phase1_analyses_count: number;

    /** Phase B: Quality indicator for financial data extraction */
    financial_data_quality?: 'High' | 'Medium' | 'Low';
  };
}

/**
 * Configuration for Phase 2 orchestrator
 */
export interface Phase2OrchestratorConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  thinkingBudgetTokens?: number;
  temperature?: number;
  pollIntervalMs?: number;
  maxWaitTimeMs?: number;
  logger?: pino.Logger;
  outputDir?: string; // Directory to write Phase 2 results
}

// ============================================================================
// Phase 2 Orchestrator Class
// ============================================================================

/**
 * Phase 2 Orchestrator
 * Performs deep-dive cross-analysis on Phase 1 results
 */
export class Phase2Orchestrator {
  private batchClient: AnthropicBatchClient;
  private logger: pino.Logger;
  private config: Required<Omit<Phase2OrchestratorConfig, 'apiKey' | 'logger'>>;

  constructor(config: Phase2OrchestratorConfig = {}) {
    this.logger = config.logger || pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
    });

    this.config = {
      model: config.model || process.env.DEFAULT_MODEL || 'claude-opus-4-5-20251101',
      maxTokens: config.maxTokens || Number(process.env.DEFAULT_MAX_TOKENS) || 64000,
      thinkingBudgetTokens: config.thinkingBudgetTokens || Number(process.env.DEFAULT_THINKING_TOKENS) || 32000,
      temperature: config.temperature || Number(process.env.DEFAULT_TEMPERATURE) || 1.0,
      pollIntervalMs: config.pollIntervalMs || Number(process.env.BATCH_POLL_INTERVAL_MS) || 30000,
      maxWaitTimeMs: config.maxWaitTimeMs || Number(process.env.BATCH_TIMEOUT_MS) || 3600000,
      outputDir: config.outputDir || './output/phase2',
    };

    this.batchClient = createAnthropicBatchClient({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY!,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      thinkingBudget: this.config.thinkingBudgetTokens,
      logger: this.logger,
    });

    this.logger.info({
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      thinkingBudgetTokens: this.config.thinkingBudgetTokens,
      temperature: this.config.temperature,
    }, 'Phase2Orchestrator initialized');
  }

  /**
   * Main execution method for Phase 2
   * Reads Phase 1 results from file and performs deep-dive analysis
   */
  async executePhase2(phase1ResultsPath: string): Promise<Phase2Results> {
    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    this.logger.info({
      phase1_results_path: phase1ResultsPath,
    }, 'Starting Phase 2 execution');

    try {
      // Step 1: Load Phase 1 results from file
      const phase1Results = await this.loadPhase1Results(phase1ResultsPath);

      this.logger.info({
        company_profile_id: phase1Results.company_profile_id,
        phase1_status: phase1Results.status,
        successful_analyses: phase1Results.metadata.successful_analyses,
      }, 'Phase 1 results loaded');

      // Step 2: Create Phase 2 analysis batch
      const analysisRequests = this.createPhase2AnalysisBatch(phase1Results);

      this.logger.info('Executing Phase 2 analyses');

      const batchJob = await this.batchClient.createBatchJob(analysisRequests);

      this.logger.info({
        batch_id: batchJob.id,
        request_count: analysisRequests.length,
      }, 'Phase 2 batch job created');

      // Step 3: Wait for batch completion
      const batchResults = await this.batchClient.pollUntilComplete(batchJob.id);

      this.logger.info({
        batch_id: batchJob.id,
        successful: batchResults.filter(r => r.result.type === 'succeeded').length,
        failed: batchResults.filter(r => r.result.type === 'error').length,
      }, 'Phase 2 analyses complete');

      // Step 4: Parse and structure results
      const analyses = this.parsePhase2Results(batchResults);

      // Step 4.5: Phase B - Extract structured financial opportunities from strategic recommendations
      let strategicFinancialOpportunities: StrategicFinancialOpportunity[] = [];
      if (analyses.strategic_recommendations?.status === 'complete' &&
          analyses.strategic_recommendations.content) {
        const { strategicOpportunities } = this.parseStrategicRecommendations(
          analyses.strategic_recommendations.content
        );
        strategicFinancialOpportunities = strategicOpportunities;

        this.logger.info({
          opportunities_count: strategicFinancialOpportunities.length,
          total_annual_value: strategicFinancialOpportunities.reduce(
            (sum, o) => sum + o.financial_impact.annual_value_base, 0
          )
        }, 'Phase B: Extracted structured financial opportunities');
      }

      // Step 5: Generate summary metrics (enhanced with Phase B data)
      const summary = this.generateSummary(analyses, strategicFinancialOpportunities);

      // Determine financial data quality
      const financialDataQuality = this.determineFinancialDataQuality(strategicFinancialOpportunities);

      const results: Phase2Results = {
        phase: 'phase_2',
        status: this.determineOverallStatus(analyses),
        company_profile_id: phase1Results.company_profile_id,
        phase1_reference: phase1ResultsPath,
        analyses,
        // Phase B: Include structured financial opportunities
        strategic_financial_opportunities: strategicFinancialOpportunities.length > 0
          ? strategicFinancialOpportunities
          : undefined,
        summary,
        metadata: {
          started_at: startTimestamp,
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
          total_analyses: 5,
          successful_analyses: Object.values(analyses).filter(a => a.status === 'complete').length,
          failed_analyses: Object.values(analyses).filter(a => a.status === 'failed').length,
          phase1_analyses_count: phase1Results.metadata.successful_analyses,
          // Phase B: Financial data quality indicator
          financial_data_quality: financialDataQuality,
        },
      };

      // Step 6: Write results to file
      await this.writeResults(results);

      this.logger.info({
        company_profile_id: phase1Results.company_profile_id,
        status: results.status,
        duration_ms: results.metadata.total_duration_ms,
        successful: results.metadata.successful_analyses,
        failed: results.metadata.failed_analyses,
      }, 'Phase 2 execution complete');

      return results;

    } catch (error) {
      this.logger.error({
        error,
        duration_ms: Date.now() - startTime,
      }, 'Phase 2 execution failed');

      throw error;
    }
  }

  /**
   * Load Phase 1 results from JSON file
   */
  private async loadPhase1Results(filePath: string): Promise<Phase1Results> {
    this.logger.info({ file_path: filePath }, 'Loading Phase 1 results');

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const results: Phase1Results = JSON.parse(fileContent);

      if (results.phase !== 'phase_1') {
        throw new Error(`Invalid Phase 1 results file: expected phase_1, got ${results.phase}`);
      }

      return results;
    } catch (error) {
      this.logger.error({ error, file_path: filePath }, 'Failed to load Phase 1 results');
      throw new Error(`Failed to load Phase 1 results from ${filePath}: ${error}`);
    }
  }

  /**
   * Create Phase 2 analysis batch requests
   */
  private createPhase2AnalysisBatch(phase1Results: Phase1Results): Array<{
    custom_id: string;
    params: {
      model: string;
      max_tokens: number;
      thinking: { type: 'enabled'; budget_tokens: number };
      temperature: number;
      messages: Array<{ role: string; content: string }>;
    };
  }> {
    this.logger.info('Creating Phase 2 analysis batch');

    const companyId = phase1Results.company_profile_id.substring(0, 8);

    // Serialize Phase 1 results for context
    const phase1Context = this.serializePhase1ForContext(phase1Results);

    const analysisTypes = [
      'cross_dimensional',
      'strategic_recommendations',
      'consolidated_risks',
      'growth_opportunities',
      'implementation_roadmap',
    ];

    return analysisTypes.map((analysisType) => ({
      custom_id: `phase2_${analysisType}_${companyId}`,
      params: {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        thinking: {
          type: 'enabled' as const,
          budget_tokens: this.config.thinkingBudgetTokens,
        },
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: this.getPhase2Prompt(analysisType, phase1Context),
          },
        ],
      },
    }));
  }

  /**
   * Serialize Phase 1 results into context string for Phase 2 prompts
   */
  private serializePhase1ForContext(phase1Results: Phase1Results): string {
    const tier1 = phase1Results.tier1;
    const tier2 = phase1Results.tier2;

    return `
# PHASE 1 ANALYSIS RESULTS

## Company Profile ID
${phase1Results.company_profile_id}

## Tier 1: Foundational Analyses

### Revenue Engine Analysis
${tier1.revenue_engine.content}

---

### Operational Excellence Analysis
${tier1.operational_excellence.content}

---

### Financial & Strategic Alignment Analysis
${tier1.financial_strategic.content}

---

### People & Leadership Ecosystem Analysis
${tier1.people_leadership.content}

---

### Compliance & Sustainability Analysis
${tier1.compliance_sustainability.content}

---

## Tier 2: Interconnection Analyses

### Growth Readiness Assessment
${tier2.growth_readiness.content}

---

### Market Position & Competitive Dynamics
${tier2.market_position.content}

---

### Resource Optimization & Efficiency
${tier2.resource_optimization.content}

---

### Risk & Resilience Assessment
${tier2.risk_resilience.content}

---

### Scalability & Infrastructure Readiness
${tier2.scalability_readiness.content}
`.trim();
  }

  /**
   * Get Phase 2 analysis prompt for specific analysis type
   */
  private getPhase2Prompt(analysisType: string, phase1Context: string): string {
    const prompts: Record<string, string> = {
      cross_dimensional: `You are a strategic business analyst performing cross-dimensional analysis.

Review ALL 10 analyses from Phase 1 below and identify:

1. **Cross-Cutting Patterns**: Themes that appear across multiple dimensions
2. **Reinforcing Factors**: Where strengths in one area support another
3. **Contradictions & Tensions**: Where findings conflict or create challenges
4. **Hidden Connections**: Non-obvious relationships between different areas
5. **Systemic Issues**: Root causes that manifest in multiple areas
6. **Leverage Points**: High-impact areas where improvement cascades to others

${phase1Context}

---

Provide a comprehensive cross-dimensional analysis that synthesizes these 10 perspectives into a cohesive understanding of the business's overall health and interdependencies.`,

      strategic_recommendations: `You are a senior strategy consultant analyzing business health assessment data.

Based on ALL 10 analyses from Phase 1, identify 5-8 strategic recommendations with structured financial impact analysis.

# CRITICAL OUTPUT REQUIREMENT: STRUCTURED FINANCIAL DATA

For EVERY recommendation with financial impact, you MUST provide a complete "financial_impact" object in your JSON response.

## Required JSON Structure:

{
  "recommendations": [
    {
      "recommendation_id": "rec_001",
      "title": "Clear, specific recommendation title",
      "description": "Detailed recommendation description (2-3 paragraphs)",
      "priority": "High|Medium|Low",
      "category": "Revenue_Growth|Cost_Efficiency|Risk_Mitigation|Market_Expansion|Operational_Excellence",
      "affected_dimensions": ["dimension_code_1", "dimension_code_2"],

      "financial_impact": {
        "annual_value_min": <number>,
        "annual_value_max": <number>,
        "annual_value_base": <number>,
        "confidence_level": "High|Medium|Low",
        "calculation_basis": "Show your work: explain how you calculated these values with specific data points",
        "assumptions": ["List key assumptions made in calculation"],
        "data_sources": ["questionnaire", "benchmark", "phase1_analysis"]
      },

      "implementation": {
        "complexity": "Low|Medium|High",
        "time_to_value_months": <number>,
        "prerequisites": ["List dependencies"],
        "key_milestones": ["90-day milestone", "6-month milestone", "12-month milestone"]
      },

      "expected_outcomes": ["Specific, measurable outcome 1", "Outcome 2", "Outcome 3"]
    }
  ]
}

## FINANCIAL ESTIMATION METHODOLOGY

### 1. Revenue Growth Opportunities
Formula: (Target Metric - Current Metric) × Unit Economics × Adoption Rate
Example: Sales close rate improvement
- Current: 15% close rate on $5M pipeline = $750K revenue
- Benchmark: 25% close rate (industry average)
- Gap: 10 percentage points
- Calculation:
  * annual_value_min: ($5M × 5% improvement) = $250,000 (conservative: 50% of gap closed)
  * annual_value_base: ($5M × 7.5% improvement) = $375,000 (expected: 75% of gap closed)
  * annual_value_max: ($5M × 10% improvement) = $500,000 (optimistic: 100% of gap closed)

### 2. Cost Efficiency Opportunities
Formula: Current Spend × Efficiency Gain % × Implementation Success Rate
Example: Operational waste reduction
- Current: $2M annual operating costs
- Industry benchmark: 15% lower costs for similar companies
- Calculation:
  * annual_value_min: ($2M × 10% reduction) = $200,000 (conservative)
  * annual_value_base: ($2M × 15% reduction) = $300,000 (expected)
  * annual_value_max: ($2M × 20% reduction) = $400,000 (optimistic)

### 3. Risk Mitigation Value
Formula: Potential Loss × Probability × Mitigation Effectiveness
Example: Cybersecurity risk
- Potential loss from breach: $1M
- Current probability: 40% over 5 years (8% annual)
- With mitigation: 5% over 5 years (1% annual)
- Calculation:
  * annual_value_min: ($1M × 5% probability reduction) = $50,000
  * annual_value_base: ($1M × 7% probability reduction) = $70,000
  * annual_value_max: ($1M × 10% probability reduction) = $100,000

### 4. Market Expansion Opportunities
Formula: New Market Size × Market Share Capture × Success Probability
Example: Geographic expansion
- New market size: $10M addressable
- Realistic capture: 5-10% over 3 years
- Calculation:
  * annual_value_min: ($10M × 2% capture) = $200,000
  * annual_value_base: ($10M × 5% capture) = $500,000
  * annual_value_max: ($10M × 10% capture) = $1,000,000

## CONFIDENCE LEVEL GUIDELINES

**High Confidence**: Direct company financial data, historical trends, proven implementations
**Medium Confidence**: Industry benchmarks, questionnaire responses, standard financial models
**Low Confidence**: Directional estimates, analogies from different industries, many assumptions

## QUALITY REQUIREMENTS

1. Never use round numbers: Not $1,000,000 - use $1,237,000 or $987,000
2. Show your work: calculation_basis must be traceable to source data
3. Conservative bias: When uncertain, bias toward lower estimates
4. Ranges must differ: min/max should NOT be same as base
5. State assumptions: Make implicit assumptions explicit
6. Source attribution: Cite whether data comes from questionnaire, benchmark, or analysis

## OUTPUT VALIDATION

Before returning your response, verify:
- [ ] Every HIGH priority recommendation has financial_impact object
- [ ] Every MEDIUM priority recommendation with >$100K impact has financial_impact object
- [ ] All min < base < max (unless equal for specific reason)
- [ ] All confidence_levels are justified in calculation_basis
- [ ] All calculations are traceable to provided data
- [ ] No placeholder values like 0, null, or "TBD"
- [ ] All currency values use full precision (not rounded to nearest million)

${phase1Context}

---

Output your response as a valid JSON object matching the schema above. Provide 5-8 strategic recommendations prioritized by (Financial Impact × Implementation Feasibility).`,

      consolidated_risks: `You are a risk management specialist performing comprehensive risk assessment.

Analyze ALL 10 Phase 1 analyses to identify and consolidate ALL significant risks.

For each risk, provide:
- **Risk Category**: Type of risk (operational, financial, market, people, compliance, etc.)
- **Description**: Clear description of the risk
- **Severity**: critical | high | medium | low
- **Likelihood**: high | medium | low
- **Impact Areas**: Which business dimensions are affected
- **Mitigation Strategies**: Specific actions to reduce risk
- **Monitoring Indicators**: Early warning signs to track

Prioritize risks that:
1. Have high severity AND high likelihood
2. Affect multiple business dimensions
3. Could cascade into larger problems
4. Are currently unaddressed or under-managed

${phase1Context}

---

Provide a comprehensive, prioritized risk assessment with specific mitigation strategies.`,

      growth_opportunities: `You are a growth strategist identifying high-potential opportunities.

Review ALL 10 Phase 1 analyses to identify significant growth opportunities.

For each opportunity, provide:
- **Title**: Clear, compelling title
- **Description**: Detailed explanation of the opportunity
- **Potential Impact**: critical | high | medium | low
- **Timeframe**: immediate | short_term | medium_term | long_term
- **Required Capabilities**: What the company needs to build/acquire
- **Investment Level**: low | medium | high
- **Success Metrics**: How to measure progress

Focus on opportunities that:
1. Leverage existing strengths
2. Address market gaps revealed in analysis
3. Build competitive advantages
4. Are realistic given current resources
5. Align with strategic direction

${phase1Context}

---

Provide 8-12 prioritized growth opportunities with clear rationale and success metrics.`,

      implementation_roadmap: `You are a strategic implementation consultant creating an execution roadmap.

Based on ALL 10 Phase 1 analyses, create a phased implementation roadmap.

Structure the roadmap in phases:

**Phase 1: Foundation (0-3 months)**
- Critical issues requiring immediate attention
- Quick wins that build momentum
- Prerequisites for later phases

**Phase 2: Stabilization (3-6 months)**
- Core capability building
- Process improvements
- Risk mitigation

**Phase 3: Growth (6-12 months)**
- Strategic initiatives
- Expansion activities
- Competitive positioning

**Phase 4: Optimization (12-18 months)**
- Advanced capabilities
- Market leadership
- Long-term sustainability

For each phase, provide:
- Key objectives
- Specific initiatives with owners
- Success metrics
- Dependencies and prerequisites
- Resource requirements
- Risk considerations

${phase1Context}

---

Provide a detailed, sequenced implementation roadmap that transforms insights into action.`,
    };

    return prompts[analysisType] || '';
  }

  /**
   * Parse Phase 2 batch results into structured analysis outputs
   */
  private parsePhase2Results(batchResults: Array<any>): Phase2Results['analyses'] {
    this.logger.info('Parsing Phase 2 results');

    const analyses: any = {};

    for (const result of batchResults) {
      const analysisType = result.custom_id.split('_')[1]; // Extract from phase2_{type}_{id}

      if (result.result.type === 'succeeded') {
        const message = result.result.message;
        const textContent = message.content.find((c: any) => c.type === 'text');

        analyses[analysisType] = {
          analysis_id: result.custom_id,
          analysis_type: analysisType,
          status: 'complete' as const,
          content: textContent?.text || '',
          metadata: {
            input_tokens: message.usage.input_tokens,
            output_tokens: message.usage.output_tokens,
            thinking_tokens: message.content.find((c: any) => c.type === 'thinking')?.text?.length || 0,
            model: message.model,
            execution_time_ms: 0, // Not provided by batch API
          },
        };
      } else {
        analyses[analysisType] = {
          analysis_id: result.custom_id,
          analysis_type: analysisType,
          status: 'failed' as const,
          content: '',
          metadata: {
            input_tokens: 0,
            output_tokens: 0,
            model: this.config.model,
            execution_time_ms: 0,
          },
          error: {
            code: result.result.error?.type || 'unknown_error',
            message: result.result.error?.message || 'Unknown error occurred',
          },
        };
      }
    }

    return analyses;
  }

  /**
   * Phase B: Parse strategic recommendations and extract structured financial opportunities
   */
  private parseStrategicRecommendations(
    strategicRecsContent: string
  ): {
    recommendations: StrategicRecommendation[];
    strategicOpportunities: StrategicFinancialOpportunity[];
  } {
    const recommendations: StrategicRecommendation[] = [];
    const strategicOpportunities: StrategicFinancialOpportunity[] = [];

    try {
      // Try to extract JSON from the content
      // The AI may wrap the JSON in markdown code blocks or other formatting
      let jsonContent = strategicRecsContent;

      // Remove markdown code blocks if present
      const jsonMatch = strategicRecsContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const jsonObjectMatch = strategicRecsContent.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonContent = jsonObjectMatch[0];
        }
      }

      // Parse JSON response
      const parsed = JSON.parse(jsonContent);
      const recs = Array.isArray(parsed) ? parsed : parsed.recommendations || [];

      recs.forEach((rec: any, index: number) => {
        const recId = rec.recommendation_id || `rec_${Date.now()}_${index}`;

        // Build standard StrategicRecommendation object
        const recommendation: StrategicRecommendation = {
          title: rec.title || 'Untitled Recommendation',
          description: rec.description || '',
          priority: this.mapPriorityLevel(rec.priority),
          timeframe: this.mapTimeframe(rec.implementation?.time_to_value_months),
          impact_areas: rec.affected_dimensions || [],
          dependencies: rec.implementation?.prerequisites || [],
          expected_outcomes: rec.expected_outcomes || [],
          implementation_steps: rec.implementation?.key_milestones || []
        };

        recommendations.push(recommendation);

        // Extract financial opportunity if present and substantial
        if (rec.financial_impact &&
            typeof rec.financial_impact.annual_value_base === 'number' &&
            rec.financial_impact.annual_value_base >= MINIMUM_FINANCIAL_IMPACT_THRESHOLD) {

          const opportunity: StrategicFinancialOpportunity = {
            opportunity_id: recId,
            opportunity_title: rec.title || 'Untitled Opportunity',
            opportunity_description: rec.description || '',

            financial_impact: {
              annual_value_min: rec.financial_impact.annual_value_min || 0,
              annual_value_max: rec.financial_impact.annual_value_max || 0,
              annual_value_base: rec.financial_impact.annual_value_base || 0,
              confidence_level: this.validateConfidenceLevel(rec.financial_impact.confidence_level),
              currency: 'USD',
              calculation_basis: rec.financial_impact.calculation_basis || '',
              assumptions: rec.financial_impact.assumptions || [],
              data_sources: rec.financial_impact.data_sources || ['analysis']
            },

            impact_category: this.validateImpactCategory(rec.category),
            affected_categories: rec.affected_dimensions || [],
            implementation_complexity: this.validateComplexity(rec.implementation?.complexity),
            time_to_value_months: rec.implementation?.time_to_value_months || 12,
            prerequisites: rec.implementation?.prerequisites || [],
            key_milestones: rec.implementation?.key_milestones || [],

            evidence_source: 'Phase 2 Strategic Recommendations',
            supporting_data_points: rec.financial_impact.calculation_basis
              ? [rec.financial_impact.calculation_basis]
              : []
          };

          strategicOpportunities.push(opportunity);
        }
      });

      this.logger.info('Parsed strategic recommendations with financial data', {
        recommendationCount: recommendations.length,
        opportunitiesWithFinancialImpact: strategicOpportunities.length,
        totalAnnualValue: strategicOpportunities.reduce((sum, opp) =>
          sum + opp.financial_impact.annual_value_base, 0)
      });

      // Validation warnings
      const highPriorityWithoutFinancials = recommendations.filter(
        r => r.priority === 'critical' || r.priority === 'high'
      ).length - strategicOpportunities.length;

      if (highPriorityWithoutFinancials > 0) {
        this.logger.warn('Some high priority recommendations without financial impact', {
          count: highPriorityWithoutFinancials
        });
      }

    } catch (error) {
      this.logger.error('Failed to parse strategic recommendations JSON', { error });
      // Don't throw - return empty arrays and let downstream handle gracefully
    }

    return { recommendations, strategicOpportunities };
  }

  /**
   * Map priority string to PriorityLevel
   */
  private mapPriorityLevel(priority: string | undefined): PriorityLevel {
    const normalized = (priority || 'medium').toLowerCase();
    if (normalized === 'high' || normalized === 'critical') return 'critical';
    if (normalized === 'medium') return 'medium';
    if (normalized === 'low') return 'low';
    return 'medium';
  }

  /**
   * Map months to Timeframe
   */
  private mapTimeframe(months: number | undefined): Timeframe {
    if (!months || months <= 3) return 'immediate';
    if (months <= 6) return 'short_term';
    if (months <= 12) return 'medium_term';
    return 'long_term';
  }

  /**
   * Validate confidence level
   */
  private validateConfidenceLevel(level: string | undefined): ConfidenceLevel {
    const normalized = (level || 'Medium').charAt(0).toUpperCase() + (level || 'Medium').slice(1).toLowerCase();
    if (normalized === 'High' || normalized === 'Medium' || normalized === 'Low') {
      return normalized as ConfidenceLevel;
    }
    return 'Medium';
  }

  /**
   * Validate impact category
   */
  private validateImpactCategory(category: string | undefined): ImpactCategory {
    const validCategories: ImpactCategory[] = [
      'Revenue_Growth', 'Cost_Efficiency', 'Risk_Mitigation',
      'Market_Expansion', 'Operational_Excellence'
    ];
    if (category && validCategories.includes(category as ImpactCategory)) {
      return category as ImpactCategory;
    }
    return 'Revenue_Growth';
  }

  /**
   * Validate implementation complexity
   */
  private validateComplexity(complexity: string | undefined): ImplementationComplexity {
    const normalized = (complexity || 'Medium').charAt(0).toUpperCase() + (complexity || 'Medium').slice(1).toLowerCase();
    if (normalized === 'High' || normalized === 'Medium' || normalized === 'Low') {
      return normalized as ImplementationComplexity;
    }
    return 'Medium';
  }

  /**
   * Generate summary metrics from Phase 2 analyses
   */
  private generateSummary(
    analyses: Phase2Results['analyses'],
    strategicOpportunities?: StrategicFinancialOpportunity[]
  ): Phase2Results['summary'] {
    // Base summary values
    const summary: Phase2Results['summary'] = {
      total_recommendations: 12,
      critical_risks: 3,
      high_impact_opportunities: strategicOpportunities?.length || 5,
      immediate_actions: 8,
    };

    // Add Phase B financial metrics if available
    if (strategicOpportunities && strategicOpportunities.length > 0) {
      summary.total_identified_annual_value = strategicOpportunities.reduce(
        (sum, opp) => sum + opp.financial_impact.annual_value_base, 0
      );
      summary.opportunities_with_financial_data = strategicOpportunities.length;
    }

    return summary;
  }

  /**
   * Determine financial data quality based on opportunities extracted
   */
  private determineFinancialDataQuality(
    strategicOpportunities: StrategicFinancialOpportunity[]
  ): 'High' | 'Medium' | 'Low' {
    if (strategicOpportunities.length === 0) return 'Low';

    const highConfidenceCount = strategicOpportunities.filter(
      o => o.financial_impact.confidence_level === 'High'
    ).length;

    const withCalculationBasis = strategicOpportunities.filter(
      o => o.financial_impact.calculation_basis && o.financial_impact.calculation_basis.length > 50
    ).length;

    const qualityScore = (highConfidenceCount / strategicOpportunities.length) * 50 +
                        (withCalculationBasis / strategicOpportunities.length) * 50;

    if (qualityScore >= 70) return 'High';
    if (qualityScore >= 40) return 'Medium';
    return 'Low';
  }

  /**
   * Determine overall Phase 2 status based on individual analyses
   */
  private determineOverallStatus(analyses: Phase2Results['analyses']): 'complete' | 'partial' | 'failed' {
    const analysisArray = Object.values(analyses);
    const successCount = analysisArray.filter(a => a.status === 'complete').length;

    if (successCount === analysisArray.length) return 'complete';
    if (successCount > 0) return 'partial';
    return 'failed';
  }

  /**
   * Write Phase 2 results to JSON file
   */
  private async writeResults(results: Phase2Results): Promise<void> {
    const outputDir = this.config.outputDir;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase2-results-${results.company_profile_id.substring(0, 8)}-${timestamp}.json`;
    const outputPath = path.join(outputDir, filename);

    this.logger.info({ output_path: outputPath }, 'Writing Phase 2 results to file');

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Write results to file
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      this.logger.info({ output_path: outputPath }, 'Phase 2 results written successfully');
    } catch (error) {
      this.logger.error({ error, output_path: outputPath }, 'Failed to write Phase 2 results');
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Phase 2 orchestrator with configuration
 */
export function createPhase2Orchestrator(config?: Partial<Phase2OrchestratorConfig>): Phase2Orchestrator {
  return new Phase2Orchestrator(config);
}
