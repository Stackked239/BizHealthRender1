/**
 * Phase 3 Orchestrator
 *
 * Performs executive synthesis on Phase 2 results to generate:
 * - Executive Summary
 * - Business Health Scorecard
 * - Priority Action Matrix
 * - Investment Roadmap
 * - Risk-Adjusted Final Recommendations
 *
 * File-based workflow: Reads Phase 2 JSON output, writes Phase 3 JSON output
 */

import pino from 'pino';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createAnthropicBatchClient, type AnthropicBatchClient } from '../api/anthropic-client.js';
import type { Phase2Results } from './phase2-orchestrator.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Phase 3 analysis output structure
 */
export interface Phase3AnalysisOutput {
  analysis_id: string;
  analysis_type: string;
  status: 'complete' | 'failed';
  content: string;
  structured_output?: {
    scorecard_metrics?: Record<string, number | string>;
    action_items?: Array<{
      title: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      timeframe: string;
      expected_impact: string;
    }>;
    investment_breakdown?: Record<string, string>;
    key_recommendations?: string[];
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
 * Complete Phase 3 results
 */
export interface Phase3Results {
  phase: 'phase_3';
  status: 'complete' | 'partial' | 'failed';
  company_profile_id: string;
  phase2_reference: string; // Path to Phase 2 results file
  analyses: {
    executive_summary: Phase3AnalysisOutput;
    scorecard: Phase3AnalysisOutput;
    action_matrix: Phase3AnalysisOutput;
    investment_roadmap: Phase3AnalysisOutput;
    final_recommendations: Phase3AnalysisOutput;
  };
  summary: {
    overall_health_score: number;
    health_status: string;
    critical_risks_count: number;
    high_priority_actions_count: number;
    total_investment_required: string;
    expected_roi: string;
  };
  metadata: {
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
    total_analyses: number;
    successful_analyses: number;
    failed_analyses: number;
  };
}

/**
 * Configuration for Phase 3 orchestrator
 */
export interface Phase3OrchestratorConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  thinkingBudgetTokens?: number;
  temperature?: number;
  pollIntervalMs?: number;
  maxWaitTimeMs?: number;
  logger?: pino.Logger;
  outputDir?: string; // Directory to write Phase 3 results
}

// ============================================================================
// Phase 3 Orchestrator Class
// ============================================================================

/**
 * Phase 3 Orchestrator
 * Performs executive synthesis on Phase 2 results
 */
export class Phase3Orchestrator {
  private batchClient: AnthropicBatchClient;
  private logger: pino.Logger;
  private config: Required<Omit<Phase3OrchestratorConfig, 'apiKey' | 'logger'>>;

  constructor(config: Phase3OrchestratorConfig = {}) {
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
      outputDir: config.outputDir || './output/phase3',
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
    }, 'Phase3Orchestrator initialized');
  }

  /**
   * Main execution method for Phase 3
   * Reads Phase 2 results from file and performs executive synthesis
   */
  async executePhase3(phase2ResultsPath: string): Promise<Phase3Results> {
    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    this.logger.info({
      phase2_results_path: phase2ResultsPath,
    }, 'Starting Phase 3 execution');

    try {
      // Step 1: Load Phase 2 results from file
      const phase2Results = await this.loadPhase2Results(phase2ResultsPath);

      this.logger.info({
        company_profile_id: phase2Results.company_profile_id,
        phase2_status: phase2Results.status,
        successful_analyses: phase2Results.metadata.successful_analyses,
      }, 'Phase 2 results loaded');

      // Step 2: Create Phase 3 analysis batch
      const analysisRequests = this.createPhase3AnalysisBatch(phase2Results);

      this.logger.info('Executing Phase 3 analyses');

      const batchJob = await this.batchClient.createBatchJob(analysisRequests);

      this.logger.info({
        batch_id: batchJob.id,
        request_count: analysisRequests.length,
      }, 'Phase 3 batch job created');

      // Step 3: Wait for batch completion
      const batchResults = await this.batchClient.pollUntilComplete(batchJob.id);

      this.logger.info({
        batch_id: batchJob.id,
        successful: batchResults.filter(r => r.result.type === 'succeeded').length,
        failed: batchResults.filter(r => r.result.type === 'error').length,
      }, 'Phase 3 analyses complete');

      // Step 4: Parse and structure results
      const analyses = this.parsePhase3Results(batchResults);

      // Step 5: Generate summary metrics
      const summary = this.generateSummary(analyses);

      const results: Phase3Results = {
        phase: 'phase_3',
        status: this.determineOverallStatus(analyses),
        company_profile_id: phase2Results.company_profile_id,
        phase2_reference: phase2ResultsPath,
        analyses,
        summary,
        metadata: {
          started_at: startTimestamp,
          completed_at: new Date().toISOString(),
          total_duration_ms: Date.now() - startTime,
          total_analyses: 5,
          successful_analyses: Object.values(analyses).filter(a => a.status === 'complete').length,
          failed_analyses: Object.values(analyses).filter(a => a.status === 'failed').length,
        },
      };

      // Step 6: Write results to file
      await this.writeResults(results);

      this.logger.info({
        company_profile_id: phase2Results.company_profile_id,
        status: results.status,
        duration_ms: results.metadata.total_duration_ms,
        successful: results.metadata.successful_analyses,
        failed: results.metadata.failed_analyses,
      }, 'Phase 3 execution complete');

      return results;

    } catch (error) {
      this.logger.error({
        error,
        duration_ms: Date.now() - startTime,
      }, 'Phase 3 execution failed');

      throw error;
    }
  }

  /**
   * Load Phase 2 results from JSON file
   */
  private async loadPhase2Results(filePath: string): Promise<Phase2Results> {
    this.logger.info({ file_path: filePath }, 'Loading Phase 2 results');

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const results: Phase2Results = JSON.parse(fileContent);

      if (results.phase !== 'phase_2') {
        throw new Error(`Invalid Phase 2 results file: expected phase_2, got ${results.phase}`);
      }

      return results;
    } catch (error) {
      this.logger.error({ error, file_path: filePath }, 'Failed to load Phase 2 results');
      throw new Error(`Failed to load Phase 2 results from ${filePath}: ${error}`);
    }
  }

  /**
   * Create Phase 3 analysis batch requests
   */
  private createPhase3AnalysisBatch(phase2Results: Phase2Results): Array<{
    custom_id: string;
    params: {
      model: string;
      max_tokens: number;
      thinking: { type: 'enabled'; budget_tokens: number };
      temperature: number;
      messages: Array<{ role: string; content: string }>;
    };
  }> {
    this.logger.info('Creating Phase 3 analysis batch');

    const companyId = phase2Results.company_profile_id.substring(0, 8);

    // Serialize Phase 2 results for context
    const phase2Context = this.serializePhase2ForContext(phase2Results);

    const analysisTypes = [
      'executive_summary',
      'scorecard',
      'action_matrix',
      'investment_roadmap',
      'final_recommendations',
    ];

    return analysisTypes.map((analysisType) => ({
      custom_id: `phase3_${analysisType}_${companyId}`,
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
            content: this.getPhase3Prompt(analysisType, phase2Context),
          },
        ],
      },
    }));
  }

  /**
   * Serialize Phase 2 results into context string for Phase 3 prompts
   */
  private serializePhase2ForContext(phase2Results: Phase2Results): string {
    const analyses = phase2Results.analyses;

    return `
# PHASE 2 DEEP-DIVE ANALYSIS RESULTS

## Company Profile ID
${phase2Results.company_profile_id}

## Phase 2 Summary Metrics
- Total Recommendations: ${phase2Results.summary.total_recommendations}
- Critical Risks: ${phase2Results.summary.critical_risks}
- High-Impact Opportunities: ${phase2Results.summary.high_impact_opportunities}
- Immediate Actions: ${phase2Results.summary.immediate_actions}

## Deep-Dive Analyses

### Cross-Dimensional Analysis
${analyses.cross.content}

---

### Strategic Recommendations
${analyses.strategic.content}

---

### Consolidated Risk Assessment
${analyses.consolidated.content}

---

### Growth Opportunities
${analyses.growth.content}

---

### Implementation Roadmap
${analyses.implementation.content}

---
`.trim();
  }

  /**
   * Get Phase 3 analysis prompt for specific analysis type
   */
  private getPhase3Prompt(analysisType: string, phase2Context: string): string {
    const prompts: Record<string, string> = {
      executive_summary: `You are an executive business consultant preparing a comprehensive executive summary.

Based on ALL Phase 2 analyses below, create a clear, compelling executive summary that:

**Structure:**
1. **Business Overview**: Company snapshot and current position
2. **Key Findings**: Top 3-5 critical insights from Phase 2 analysis
3. **Overall Health Assessment**: Holistic view of business health with overall score (0-100)
4. **Critical Priorities**: Top 5 priorities requiring immediate executive attention
5. **Strategic Opportunities**: Highest-impact growth opportunities identified
6. **Risk Landscape**: Major risks and mitigation approach
7. **Recommended Path Forward**: Clear next steps for leadership

**Requirements:**
- Executive-friendly language (avoid jargon, be concise)
- Data-driven insights with specific metrics where available
- Action-oriented recommendations
- Clear prioritization and rationale
- 2-3 page equivalent length

${phase2Context}

---

Provide a comprehensive executive summary that enables leadership to quickly understand business health and make informed decisions.`,

      scorecard: `You are a business metrics specialist creating a comprehensive Business Health Scorecard.

Based on ALL Phase 2 analyses, create a detailed scorecard with quantified metrics across all business dimensions.

**Scorecard Structure:**

**1. Overall Business Health Score** (0-100)
   - Composite score across all dimensions
   - Clear methodology for calculation

**2. Dimensional Scores** (0-100 each)
   - Revenue Engine Health
   - Operational Excellence
   - Financial & Strategic Readiness
   - People & Leadership
   - Market Position & Competitiveness
   - Growth Readiness
   - Risk & Resilience
   - Scalability

**3. Key Performance Indicators**
   For each dimension:
   - Current state metrics
   - Benchmark comparison
   - Gap analysis
   - Trend direction (improving/declining/stable)

**4. Health Status Classification**
   - Healthy (80-100): Areas of strength
   - Stable (60-79): Adequate but needs monitoring
   - At Risk (40-59): Requires attention
   - Critical (0-39): Immediate action needed

**5. Score Drivers**
   - Top factors improving scores
   - Top factors lowering scores

${phase2Context}

---

Provide a comprehensive, quantified scorecard with clear metrics, scoring methodology, and interpretive guidance.`,

      action_matrix: `You are a strategic implementation expert creating a Priority Action Matrix.

Based on ALL Phase 2 analyses, create a structured action matrix that prioritizes all recommended actions.

**Matrix Framework:**

**Axis 1: Impact Level**
- Critical Impact: Affects core business viability
- High Impact: Significantly improves competitive position
- Medium Impact: Notable improvement in specific areas
- Low Impact: Incremental improvements

**Axis 2: Urgency/Timeframe**
- Immediate (0-3 months): Cannot wait, critical path items
- Short-term (3-6 months): Important but can be sequenced
- Medium-term (6-12 months): Strategic initiatives
- Long-term (12+ months): Future-focused improvements

**For Each Action:**
1. **Action Title**: Clear, specific action
2. **Priority Score**: 1-10 based on impact × urgency
3. **Category**: Which business dimension(s) affected
4. **Dependencies**: Prerequisites or blockers
5. **Resource Requirements**: People, budget, time
6. **Expected Outcomes**: Measurable results
7. **Risk if Delayed**: Consequences of inaction
8. **Quick Win Potential**: Can deliver early results?

**Matrix Outputs:**
- **Critical Path Actions**: Must-do items in sequence
- **Quick Wins**: High impact, low complexity (do first for momentum)
- **Strategic Initiatives**: High impact, higher complexity (plan carefully)
- **Monitoring Items**: Medium/low priority (defer but track)

${phase2Context}

---

Provide a comprehensive, prioritized action matrix that enables effective resource allocation and sequencing decisions.`,

      investment_roadmap: `You are a financial strategy consultant creating an Investment Roadmap.

Based on ALL Phase 2 analyses, create a detailed investment roadmap with financial requirements and expected returns.

**Roadmap Structure:**

**1. Investment Overview**
   - Total investment required (ranges)
   - Investment timeline (phased approach)
   - Expected ROI and payback periods
   - Risk-adjusted returns

**2. Investment Categories**
   For each major investment area:
   - **People & Talent**: Hiring, training, leadership
   - **Technology & Systems**: Tools, platforms, infrastructure
   - **Operations & Processes**: Equipment, facilities, optimization
   - **Marketing & Sales**: Customer acquisition, brand building
   - **Strategic Initiatives**: New capabilities, market expansion

**3. Phased Investment Plan**

   **Phase 1: Foundation (0-3 months)**
   - Critical investments that unblock everything else
   - Estimated budget range
   - Expected outcomes

   **Phase 2: Stabilization (3-6 months)**
   - Core capability building
   - Estimated budget range
   - Expected outcomes

   **Phase 3: Growth (6-12 months)**
   - Strategic expansion investments
   - Estimated budget range
   - Expected outcomes

   **Phase 4: Optimization (12-18 months)**
   - Advanced capabilities and competitive advantages
   - Estimated budget range
   - Expected outcomes

**4. ROI Analysis**
   - Expected revenue impact by phase
   - Cost savings and efficiency gains
   - Risk reduction value
   - Competitive advantage value
   - Overall financial return projection

**5. Funding Options & Considerations**
   - Internal cash flow vs. external funding
   - Investment priorities if budget constrained
   - Scaling options based on results

${phase2Context}

---

Provide a comprehensive investment roadmap with clear financial projections, phasing, and ROI analysis.`,

      final_recommendations: `You are a senior strategic advisor providing final, risk-adjusted recommendations to leadership.

Based on ALL Phase 2 analyses, synthesize everything into final executive recommendations.

**Structure:**

**1. Situation Assessment**
   - Current business position (objective assessment)
   - Critical challenges identified
   - Key opportunities available
   - Competitive dynamics and market context

**2. Strategic Direction**
   - Recommended strategic focus for next 12-18 months
   - Core capabilities to build/strengthen
   - Market positioning strategy
   - Differentiation approach

**3. Top 10 Prioritized Recommendations**
   For each recommendation:
   - **What**: Specific action or initiative
   - **Why**: Strategic rationale and expected impact
   - **When**: Timing and sequencing
   - **How**: Implementation approach and resource requirements
   - **Risk Factors**: What could go wrong and mitigation
   - **Success Metrics**: How to measure progress and results

**4. Risk Management Strategy**
   - Top 5 risks requiring active management
   - Mitigation plans for each
   - Monitoring and early warning systems
   - Contingency plans

**5. Critical Success Factors**
   - What must go right for success
   - Required leadership commitments
   - Organizational prerequisites
   - Key milestones to track

**6. Decision Framework for Leadership**
   - Key decisions required now
   - Decisions that can be deferred
   - Decision criteria and trade-offs
   - Recommended decision-making process

**7. Next Steps (30/60/90 Day Plan)**
   - Immediate actions (next 30 days)
   - Short-term initiatives (60 days)
   - Foundation building (90 days)
   - Success indicators for each phase

${phase2Context}

---

Provide comprehensive, actionable final recommendations that synthesize all insights into a clear strategic path forward with risk management and implementation guidance.`,
    };

    return prompts[analysisType] || '';
  }

  /**
   * Parse Phase 3 batch results into structured analysis outputs
   */
  private parsePhase3Results(batchResults: Array<any>): Phase3Results['analyses'] {
    this.logger.info('Parsing Phase 3 results');

    const analyses: any = {};

    for (const result of batchResults) {
      const analysisType = result.custom_id.split('_')[1]; // Extract from phase3_{type}_{id}

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
   * Generate summary metrics from Phase 3 analyses
   */
  private generateSummary(analyses: Phase3Results['analyses']): Phase3Results['summary'] {
    // Extract metrics from scorecard if available
    // For now, return placeholder values that would be extracted from analysis content
    return {
      overall_health_score: 72,
      health_status: 'Stable - Requires Strategic Attention',
      critical_risks_count: 3,
      high_priority_actions_count: 8,
      total_investment_required: '$250K - $500K (12-month horizon)',
      expected_roi: '3.5x over 18 months',
    };
  }

  /**
   * Determine overall Phase 3 status based on individual analyses
   */
  private determineOverallStatus(analyses: Phase3Results['analyses']): 'complete' | 'partial' | 'failed' {
    const analysisArray = Object.values(analyses);
    const successCount = analysisArray.filter(a => a.status === 'complete').length;

    if (successCount === analysisArray.length) return 'complete';
    if (successCount > 0) return 'partial';
    return 'failed';
  }

  /**
   * Write Phase 3 results to JSON file
   */
  private async writeResults(results: Phase3Results): Promise<void> {
    const outputDir = this.config.outputDir;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase3-results-${results.company_profile_id.substring(0, 8)}-${timestamp}.json`;
    const outputPath = path.join(outputDir, filename);

    this.logger.info({ output_path: outputPath }, 'Writing Phase 3 results to file');

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Write results to file
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      this.logger.info({ output_path: outputPath }, 'Phase 3 results written successfully');
    } catch (error) {
      this.logger.error({ error, output_path: outputPath }, 'Failed to write Phase 3 results');
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Phase 3 orchestrator with configuration
 */
export function createPhase3Orchestrator(config?: Partial<Phase3OrchestratorConfig>): Phase3Orchestrator {
  return new Phase3Orchestrator(config);
}
