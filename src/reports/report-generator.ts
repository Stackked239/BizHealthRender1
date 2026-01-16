/**
 * BizHealth Report Generator
 *
 * Generates HTML reports from the IDM (Insights Data Model) using Claude AI.
 * Supports 9 distinct report types for different audiences and purposes.
 *
 * Features:
 * - AI-powered narrative generation
 * - Semantic HTML output for PDF conversion compatibility
 * - Support for all report variants (Comprehensive, Owners, Quick Wins, etc.)
 * - Clean, structured output with page break hints
 */

import Anthropic from '@anthropic-ai/sdk';
import pino from 'pino';
import {
  IDM,
  Chapter,
  Dimension,
  Finding,
  Recommendation,
  Risk,
  ScoresSummary,
  CHAPTER_NAMES,
  DIMENSION_METADATA,
  getScoreBand,
} from '../types/idm.types.js';

// ============================================================================
// Report Types Enum
// ============================================================================

/**
 * Enumeration of all supported report types
 */
export enum ReportType {
  /** Full comprehensive assessment report with all sections */
  COMPREHENSIVE_REPORT = 'comprehensive_report',

  /** Executive summary for business owners */
  OWNERS_REPORT = 'owners_report',

  /** Focused on quick wins and immediate actions */
  QUICK_WINS_REPORT = 'quick_wins_report',

  /** Detailed risk assessment and mitigation strategies */
  RISK_REPORT = 'risk_report',

  /** Implementation roadmap with timelines */
  ROADMAP_REPORT = 'roadmap_report',

  /** Financial projections and ROI analysis */
  FINANCIAL_REPORT = 'financial_report',

  /** Chapter-level deep dive (Growth Engine) */
  GROWTH_ENGINE_REPORT = 'growth_engine_report',

  /** Chapter-level deep dive (Performance & Health) */
  PERFORMANCE_HEALTH_REPORT = 'performance_health_report',

  /** Chapter-level deep dive (People & Leadership) */
  PEOPLE_LEADERSHIP_REPORT = 'people_leadership_report',

  /** Chapter-level deep dive (Resilience & Safeguards) */
  RESILIENCE_SAFEGUARDS_REPORT = 'resilience_safeguards_report',
}

/**
 * Report metadata including display names and descriptions
 */
export const REPORT_METADATA: Record<ReportType, { name: string; description: string }> = {
  [ReportType.COMPREHENSIVE_REPORT]: {
    name: 'Comprehensive Assessment Report',
    description: 'Full assessment with all dimensions, findings, and recommendations',
  },
  [ReportType.OWNERS_REPORT]: {
    name: 'Business Owner Executive Summary',
    description: 'High-level overview focused on key takeaways and strategic priorities',
  },
  [ReportType.QUICK_WINS_REPORT]: {
    name: 'Quick Wins Action Plan',
    description: 'Focused on immediate, high-impact, low-effort improvements',
  },
  [ReportType.RISK_REPORT]: {
    name: 'Risk Assessment Report',
    description: 'Detailed analysis of business risks and mitigation strategies',
  },
  [ReportType.ROADMAP_REPORT]: {
    name: 'Implementation Roadmap',
    description: 'Phased implementation plan with milestones and dependencies',
  },
  [ReportType.FINANCIAL_REPORT]: {
    name: 'Financial Impact Analysis',
    description: 'ROI projections, investment requirements, and value creation',
  },
  [ReportType.GROWTH_ENGINE_REPORT]: {
    name: 'Growth Engine Deep Dive',
    description: 'Detailed analysis of Strategy, Sales, Marketing, and Customer Experience',
  },
  [ReportType.PERFORMANCE_HEALTH_REPORT]: {
    name: 'Performance & Health Deep Dive',
    description: 'Detailed analysis of Operations and Financials',
  },
  [ReportType.PEOPLE_LEADERSHIP_REPORT]: {
    name: 'People & Leadership Deep Dive',
    description: 'Detailed analysis of Human Resources and Leadership & Governance',
  },
  [ReportType.RESILIENCE_SAFEGUARDS_REPORT]: {
    name: 'Resilience & Safeguards Deep Dive',
    description: 'Detailed analysis of Technology, IT, Risk Management, and Compliance',
  },
};

// ============================================================================
// Types
// ============================================================================

/**
 * Report generation request parameters
 */
export interface ReportGenerationRequest {
  /** The Integrated Data Model to generate report from */
  idm: IDM;
  /** Type of report to generate */
  reportType: ReportType;
  /** Optional custom company name override */
  companyName?: string;
  /** Optional additional context for the AI */
  additionalContext?: string;
}

/**
 * Generated report result
 */
export interface GeneratedReport {
  /** Report type that was generated */
  reportType: ReportType;
  /** Report metadata */
  metadata: {
    reportName: string;
    description: string;
    generatedAt: string;
    assessmentRunId: string;
    companyProfileId: string;
  };
  /** Generated HTML content */
  html: string;
  /** Token usage statistics */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Report generator configuration
 */
export interface ReportGeneratorConfig {
  /** Anthropic API key (optional if client is provided) */
  apiKey?: string;
  /** Pre-configured Anthropic client */
  client?: Anthropic;
  /** Model to use for generation */
  model?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Custom logger */
  logger?: pino.Logger;
}

// ============================================================================
// Report Generator Class
// ============================================================================

/**
 * AI-powered report generator using Claude
 */
export class ReportGenerator {
  private client: Anthropic;
  private logger: pino.Logger;
  private model: string;
  private maxTokens: number;

  constructor(config: ReportGeneratorConfig) {
    // Initialize Anthropic client
    if (config.client) {
      this.client = config.client;
    } else if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } else {
      throw new Error('Anthropic client or API key must be provided');
    }

    this.logger = config.logger || pino({
      level: process.env.LOG_LEVEL || 'info',
    });

    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 16000;

    this.logger.info({
      model: this.model,
      maxTokens: this.maxTokens,
    }, 'ReportGenerator initialized');
  }

  /**
   * Generate a report from the IDM
   */
  async generate(request: ReportGenerationRequest): Promise<GeneratedReport> {
    const { idm, reportType, companyName, additionalContext } = request;
    const startTime = Date.now();

    this.logger.info({
      reportType,
      assessmentRunId: idm.meta.assessment_run_id,
    }, 'Starting report generation');

    // Get report metadata
    const reportMeta = REPORT_METADATA[reportType];

    // Build the prompt based on report type
    const systemPrompt = this.buildSystemPrompt(reportType);
    const userPrompt = this.buildUserPrompt(idm, reportType, companyName, additionalContext);

    try {
      // Call Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract HTML from response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      // Extract HTML from markdown code block if present
      let html = textContent.text;
      const htmlMatch = html.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch) {
        html = htmlMatch[1];
      }

      const duration = Date.now() - startTime;
      this.logger.info({
        reportType,
        duration,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }, 'Report generation complete');

      return {
        reportType,
        metadata: {
          reportName: reportMeta.name,
          description: reportMeta.description,
          generatedAt: new Date().toISOString(),
          assessmentRunId: idm.meta.assessment_run_id,
          companyProfileId: idm.meta.company_profile_id,
        },
        html,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      this.logger.error({
        reportType,
        error: error instanceof Error ? error.message : String(error),
      }, 'Report generation failed');
      throw error;
    }
  }

  /**
   * Generate multiple reports in parallel
   */
  async generateMultiple(
    idm: IDM,
    reportTypes: ReportType[],
    companyName?: string
  ): Promise<GeneratedReport[]> {
    this.logger.info({
      reportTypes,
      count: reportTypes.length,
    }, 'Starting batch report generation');

    const promises = reportTypes.map(reportType =>
      this.generate({ idm, reportType, companyName })
    );

    return Promise.all(promises);
  }

  /**
   * Build the system prompt based on report type
   */
  private buildSystemPrompt(reportType: ReportType): string {
    const basePrompt = `You are an expert business consultant generating professional assessment reports.
Your task is to create clean, semantic HTML reports that:
- Use proper HTML5 structure with semantic elements
- Include CSS for professional styling inline in a <style> tag
- Use page-break-before: always for major sections (for PDF export)
- Present data clearly with tables, lists, and visual hierarchy
- Maintain a professional, authoritative tone
- Focus on actionable insights and clear recommendations

IMPORTANT: Output ONLY the HTML document, starting with <!DOCTYPE html>. Do not include any markdown formatting or code blocks.`;

    const reportSpecificInstructions: Record<ReportType, string> = {
      [ReportType.COMPREHENSIVE_REPORT]: `
Generate a comprehensive assessment report including:
- Executive Summary with overall health score and key findings
- Chapter-by-chapter analysis (Growth Engine, Performance & Health, People & Leadership, Resilience & Safeguards)
- Dimension scorecards with sub-indicator breakdowns
- Detailed findings with evidence
- Prioritized recommendations
- Risk assessment matrix
- Implementation roadmap
- Financial impact projections`,

      [ReportType.OWNERS_REPORT]: `
Generate an executive summary report for business owners including:
- One-page executive overview with health score
- Top 3 strengths and top 3 priorities
- Key financial implications
- Strategic imperatives summary
- Quick wins that can be implemented immediately
Keep it concise (2-3 pages max) and focus on business impact.`,

      [ReportType.QUICK_WINS_REPORT]: `
Generate a focused quick wins report including:
- Introduction to quick win methodology
- Prioritized list of quick wins with:
  - Expected impact and timeline
  - Investment required
  - Implementation steps
  - Success metrics
- 30-60-90 day action plan
- Resource requirements summary`,

      [ReportType.RISK_REPORT]: `
Generate a comprehensive risk assessment report including:
- Risk summary dashboard
- Risk matrix (severity vs likelihood)
- Detailed risk analysis by category
- Mitigation strategies for each risk
- Early warning indicators
- Business continuity considerations
- Risk monitoring recommendations`,

      [ReportType.ROADMAP_REPORT]: `
Generate an implementation roadmap report including:
- Phased implementation overview
- Phase 1: Foundation & Quick Wins (0-90 days)
- Phase 2: Core Capability Building (3-12 months)
- Phase 3: Strategic Transformation (12-24 months)
- Dependencies and prerequisites
- Resource requirements by phase
- Milestones and success metrics
- Gantt-style timeline visualization`,

      [ReportType.FINANCIAL_REPORT]: `
Generate a financial impact analysis report including:
- Investment summary
- ROI projections (90-day, annual)
- Cost-benefit analysis by recommendation
- Cash flow impact timeline
- Risk-adjusted returns
- Sensitivity analysis
- Funding considerations`,

      [ReportType.GROWTH_ENGINE_REPORT]: `
Generate a Growth Engine deep dive report covering:
- Strategy dimension analysis
- Sales dimension analysis
- Marketing dimension analysis
- Customer Experience dimension analysis
- Cross-dimensional insights within Growth Engine
- Growth-specific recommendations
- Market opportunity assessment`,

      [ReportType.PERFORMANCE_HEALTH_REPORT]: `
Generate a Performance & Health deep dive report covering:
- Operations dimension analysis
- Financials dimension analysis
- Operational efficiency metrics
- Financial health indicators
- Process improvement opportunities
- Performance optimization recommendations`,

      [ReportType.PEOPLE_LEADERSHIP_REPORT]: `
Generate a People & Leadership deep dive report covering:
- Human Resources dimension analysis
- Leadership & Governance dimension analysis
- Culture and engagement insights
- Leadership effectiveness assessment
- Talent management recommendations
- Organizational structure considerations`,

      [ReportType.RESILIENCE_SAFEGUARDS_REPORT]: `
Generate a Resilience & Safeguards deep dive report covering:
- Technology & Innovation dimension analysis
- IT, Data & Systems dimension analysis
- Risk Management & Sustainability dimension analysis
- Compliance dimension analysis
- Cybersecurity posture
- Business continuity readiness
- Regulatory compliance status`,
    };

    return `${basePrompt}\n\n${reportSpecificInstructions[reportType]}`;
  }

  /**
   * Build the user prompt with IDM data
   */
  private buildUserPrompt(
    idm: IDM,
    reportType: ReportType,
    companyName?: string,
    additionalContext?: string
  ): string {
    const company = companyName || 'the assessed organization';

    // Build context sections based on report type
    const sections: string[] = [
      `Generate a ${REPORT_METADATA[reportType].name} for ${company}.`,
      '',
      '## Assessment Data',
      '',
      this.formatScoresSummary(idm.scores_summary),
      this.formatChapters(idm.chapters),
    ];

    // Include relevant data based on report type
    switch (reportType) {
      case ReportType.COMPREHENSIVE_REPORT:
        sections.push(
          this.formatDimensions(idm.dimensions),
          this.formatFindings(idm.findings),
          this.formatRecommendations(idm.recommendations, idm.quick_wins),
          this.formatRisks(idm.risks),
          this.formatRoadmap(idm.roadmap)
        );
        break;

      case ReportType.OWNERS_REPORT:
        sections.push(
          this.formatTopFindings(idm.findings, 5),
          this.formatTopRecommendations(idm.recommendations, 5),
          this.formatQuickWinsSummary(idm.recommendations, idm.quick_wins)
        );
        break;

      case ReportType.QUICK_WINS_REPORT:
        sections.push(
          this.formatQuickWinsDetailed(idm.recommendations, idm.quick_wins)
        );
        break;

      case ReportType.RISK_REPORT:
        sections.push(
          this.formatRisksDetailed(idm.risks),
          this.formatRiskFindings(idm.findings)
        );
        break;

      case ReportType.ROADMAP_REPORT:
        sections.push(
          this.formatRecommendations(idm.recommendations, idm.quick_wins),
          this.formatRoadmapDetailed(idm.roadmap)
        );
        break;

      case ReportType.FINANCIAL_REPORT:
        sections.push(
          this.formatFinancialProjections(idm),
          this.formatRecommendationsWithROI(idm.recommendations)
        );
        break;

      case ReportType.GROWTH_ENGINE_REPORT:
        sections.push(this.formatChapterDeepDive(idm, 'GE'));
        break;

      case ReportType.PERFORMANCE_HEALTH_REPORT:
        sections.push(this.formatChapterDeepDive(idm, 'PH'));
        break;

      case ReportType.PEOPLE_LEADERSHIP_REPORT:
        sections.push(this.formatChapterDeepDive(idm, 'PL'));
        break;

      case ReportType.RESILIENCE_SAFEGUARDS_REPORT:
        sections.push(this.formatChapterDeepDive(idm, 'RS'));
        break;
    }

    if (additionalContext) {
      sections.push('', '## Additional Context', additionalContext);
    }

    return sections.join('\n');
  }

  // ==========================================================================
  // Formatting Helper Methods
  // ==========================================================================

  private formatScoresSummary(summary: ScoresSummary): string {
    return `### Overall Health Score
- Score: ${summary.overall_health_score}/100
- Status: ${summary.descriptor}
- Trajectory: ${summary.trajectory}
- Key Imperatives: ${summary.key_imperatives.join('; ')}`;
  }

  private formatChapters(chapters: Chapter[]): string {
    const lines = ['### Chapter Scores'];
    for (const chapter of chapters) {
      lines.push(`- ${chapter.name}: ${chapter.score_overall}/100 (${chapter.score_band})`);
    }
    return lines.join('\n');
  }

  private formatDimensions(dimensions: Dimension[]): string {
    const lines = ['### Dimension Scores'];
    for (const dim of dimensions) {
      lines.push(`\n#### ${dim.name} (${dim.dimension_code})`);
      lines.push(`- Overall: ${dim.score_overall}/100 (${dim.score_band})`);
      lines.push('- Sub-indicators:');
      for (const si of dim.sub_indicators) {
        lines.push(`  - ${si.name}: ${si.score}/100`);
      }
    }
    return lines.join('\n');
  }

  private formatFindings(findings: Finding[]): string {
    const lines = ['### Findings'];

    const grouped = {
      strength: findings.filter(f => f.type === 'strength'),
      gap: findings.filter(f => f.type === 'gap'),
      risk: findings.filter(f => f.type === 'risk'),
      opportunity: findings.filter(f => f.type === 'opportunity'),
    };

    for (const [type, items] of Object.entries(grouped)) {
      if (items.length > 0) {
        lines.push(`\n#### ${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})`);
        for (const f of items) {
          lines.push(`- **${f.short_label}** [${f.dimension_code}]: ${f.narrative}`);
        }
      }
    }
    return lines.join('\n');
  }

  private formatTopFindings(findings: Finding[], limit: number): string {
    const lines = ['### Key Findings'];

    // Prioritize risks and gaps
    const prioritized = [
      ...findings.filter(f => f.type === 'risk'),
      ...findings.filter(f => f.type === 'gap'),
      ...findings.filter(f => f.type === 'strength'),
    ].slice(0, limit);

    for (const f of prioritized) {
      lines.push(`- **${f.short_label}** (${f.type}): ${f.narrative}`);
    }
    return lines.join('\n');
  }

  private formatRecommendations(recommendations: Recommendation[], quickWins: { recommendation_id: string }[]): string {
    const quickWinIds = new Set(quickWins.map(qw => qw.recommendation_id));
    const lines = ['### Recommendations'];

    for (const rec of recommendations) {
      const isQuickWin = quickWinIds.has(rec.id);
      lines.push(`\n#### ${rec.priority_rank}. ${rec.theme}${isQuickWin ? ' [QUICK WIN]' : ''}`);
      lines.push(`- Horizon: ${rec.horizon}`);
      lines.push(`- Impact: ${rec.impact_score}/100, Effort: ${rec.effort_score}/100`);
      lines.push(`- Action Steps:`);
      for (const step of rec.action_steps) {
        lines.push(`  - ${step}`);
      }
      lines.push(`- Expected Outcome: ${rec.expected_outcomes}`);
    }
    return lines.join('\n');
  }

  private formatTopRecommendations(recommendations: Recommendation[], limit: number): string {
    const lines = ['### Priority Recommendations'];
    const top = recommendations.slice(0, limit);

    for (const rec of top) {
      lines.push(`- **${rec.theme}** (${rec.horizon}): Impact ${rec.impact_score}/100`);
    }
    return lines.join('\n');
  }

  private formatQuickWinsSummary(recommendations: Recommendation[], quickWins: { recommendation_id: string }[]): string {
    const quickWinIds = new Set(quickWins.map(qw => qw.recommendation_id));
    const qwRecs = recommendations.filter(r => quickWinIds.has(r.id));

    const lines = ['### Quick Wins Summary'];
    for (const rec of qwRecs) {
      lines.push(`- ${rec.theme}: Impact ${rec.impact_score}/100, Effort ${rec.effort_score}/100`);
    }
    return lines.join('\n');
  }

  private formatQuickWinsDetailed(recommendations: Recommendation[], quickWins: { recommendation_id: string }[]): string {
    const quickWinIds = new Set(quickWins.map(qw => qw.recommendation_id));
    const qwRecs = recommendations.filter(r => quickWinIds.has(r.id));

    const lines = ['### Quick Wins Detailed'];
    for (const rec of qwRecs) {
      lines.push(`\n#### ${rec.theme}`);
      lines.push(`- Impact Score: ${rec.impact_score}/100`);
      lines.push(`- Effort Score: ${rec.effort_score}/100`);
      lines.push(`- Timeline: ${rec.horizon}`);
      lines.push(`- Action Steps:`);
      for (const step of rec.action_steps) {
        lines.push(`  - ${step}`);
      }
      lines.push(`- Expected Outcome: ${rec.expected_outcomes}`);
    }
    return lines.join('\n');
  }

  private formatRisks(risks: Risk[]): string {
    const lines = ['### Risk Assessment'];
    for (const risk of risks) {
      lines.push(`- **${risk.category || risk.dimension_code}**: ${risk.narrative} (Severity: ${risk.severity}, Likelihood: ${risk.likelihood})`);
    }
    return lines.join('\n');
  }

  private formatRisksDetailed(risks: Risk[]): string {
    const lines = ['### Detailed Risk Analysis'];
    for (const risk of risks) {
      lines.push(`\n#### Risk: ${risk.category || risk.dimension_code}`);
      lines.push(`- ID: ${risk.id}`);
      lines.push(`- Dimension: ${risk.dimension_code}`);
      lines.push(`- Severity: ${risk.severity}`);
      lines.push(`- Likelihood: ${risk.likelihood}`);
      lines.push(`- Description: ${risk.narrative}`);
    }
    return lines.join('\n');
  }

  private formatRiskFindings(findings: Finding[]): string {
    const riskFindings = findings.filter(f => f.type === 'risk' || f.severity === 'Critical');
    const lines = ['### Risk-Related Findings'];
    for (const f of riskFindings) {
      lines.push(`- **${f.short_label}**: ${f.narrative}`);
    }
    return lines.join('\n');
  }

  private formatRoadmap(roadmap: { phases: Array<{ name: string; time_horizon: string; narrative: string; linked_recommendation_ids: string[] }> }): string {
    const lines = ['### Implementation Roadmap'];
    for (const phase of roadmap.phases) {
      lines.push(`\n#### ${phase.name} (${phase.time_horizon})`);
      lines.push(`${phase.narrative}`);
      lines.push(`- Recommendations: ${phase.linked_recommendation_ids.length} items`);
    }
    return lines.join('\n');
  }

  private formatRoadmapDetailed(roadmap: { phases: Array<{ id: string; name: string; time_horizon: string; narrative: string; linked_recommendation_ids: string[] }> }): string {
    const lines = ['### Detailed Implementation Roadmap'];
    for (const phase of roadmap.phases) {
      lines.push(`\n#### Phase: ${phase.name}`);
      lines.push(`- ID: ${phase.id}`);
      lines.push(`- Timeline: ${phase.time_horizon}`);
      lines.push(`- Description: ${phase.narrative}`);
      lines.push(`- Linked Recommendations: ${phase.linked_recommendation_ids.join(', ')}`);
    }
    return lines.join('\n');
  }

  private formatFinancialProjections(idm: IDM): string {
    // Estimate financial projections based on recommendations
    const lines = ['### Financial Projections'];

    const totalImpact = idm.recommendations.reduce((sum, r) => sum + r.impact_score, 0);
    const avgImpact = totalImpact / (idm.recommendations.length || 1);

    lines.push(`- Total Recommendations: ${idm.recommendations.length}`);
    lines.push(`- Average Impact Score: ${avgImpact.toFixed(1)}/100`);
    lines.push(`- Quick Wins Count: ${idm.quick_wins.length}`);

    // Estimate ROI based on improvement potential
    const improvementPotential = 100 - idm.scores_summary.overall_health_score;
    lines.push(`- Improvement Potential: ${improvementPotential} points`);

    return lines.join('\n');
  }

  private formatRecommendationsWithROI(recommendations: Recommendation[]): string {
    const lines = ['### Recommendations with ROI Analysis'];
    for (const rec of recommendations) {
      const roi = (rec.impact_score / Math.max(rec.effort_score, 1)).toFixed(2);
      lines.push(`\n#### ${rec.theme}`);
      lines.push(`- Impact: ${rec.impact_score}/100`);
      lines.push(`- Effort: ${rec.effort_score}/100`);
      lines.push(`- ROI Ratio: ${roi}x`);
      lines.push(`- Horizon: ${rec.horizon}`);
    }
    return lines.join('\n');
  }

  private formatChapterDeepDive(idm: IDM, chapterCode: 'GE' | 'PH' | 'PL' | 'RS'): string {
    const chapter = idm.chapters.find(c => c.chapter_code === chapterCode);
    const dimensions = idm.dimensions.filter(d => d.chapter_code === chapterCode);
    const findings = idm.findings.filter(f =>
      dimensions.some(d => d.dimension_code === f.dimension_code)
    );
    const recommendations = idm.recommendations.filter(r =>
      dimensions.some(d => d.dimension_code === r.dimension_code)
    );
    const risks = idm.risks.filter(r =>
      dimensions.some(d => d.dimension_code === r.dimension_code)
    );

    const lines = [
      `### ${CHAPTER_NAMES[chapterCode]} Deep Dive`,
      '',
      `#### Chapter Overview`,
      chapter ? `- Overall Score: ${chapter.score_overall}/100 (${chapter.score_band})` : '',
      '',
      this.formatDimensions(dimensions),
      '',
      '#### Chapter Findings',
      ...findings.map(f => `- **${f.short_label}**: ${f.narrative}`),
      '',
      '#### Chapter Recommendations',
      ...recommendations.map(r => `- **${r.theme}** (${r.horizon}): ${r.expected_outcomes}`),
      '',
      '#### Chapter Risks',
      ...risks.map(r => `- ${r.category || r.dimension_code}: ${r.narrative}`),
    ];

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a ReportGenerator with environment-based configuration
 */
export function createReportGenerator(
  config?: Partial<ReportGeneratorConfig>
): ReportGenerator {
  return new ReportGenerator({
    apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
    model: config?.model || process.env.DEFAULT_MODEL,
    maxTokens: config?.maxTokens,
    logger: config?.logger,
    client: config?.client,
  });
}

/**
 * Get all available report types
 */
export function getAvailableReportTypes(): ReportType[] {
  return Object.values(ReportType);
}

/**
 * Get report metadata by type
 */
export function getReportMetadata(reportType: ReportType): { name: string; description: string } {
  return REPORT_METADATA[reportType];
}
