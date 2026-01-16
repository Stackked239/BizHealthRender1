/**
 * Base prompt template for all Phase 1-3 analyses
 *
 * Provides consistent structure and visualization output instructions
 * that all analysis prompts extend.
 *
 * @module base-analysis-prompt
 * @version 1.0.0
 */

// ============================================================================
// VISUALIZATION OUTPUT INSTRUCTIONS
// ============================================================================

/**
 * Standard instructions for structured visualization output
 * Append to all analysis prompts to ensure consistent JSON structure
 */
export const VISUALIZATION_OUTPUT_INSTRUCTIONS = `
## OUTPUT FORMAT REQUIREMENTS

Your response MUST be valid JSON conforming to the following structure.
Do NOT include any text outside the JSON block.
Do NOT use ASCII graphics, progress bars, or text-based visualizations anywhere.
Do NOT use characters like █, ░, ─, │, ┌, ┐, └, ┘, ├, ┤, ┬, ┴, ┼, ★, ☆, or similar.

### Required JSON Structure:

\`\`\`json
{
  "analysisType": "string - the type of analysis (e.g., 'revenue_engine')",
  "narrative": {
    "executiveSummary": "2-3 sentence high-level summary",
    "sections": [
      {
        "id": "unique_section_id",
        "title": "Section Title",
        "content": "Markdown-formatted analysis content. Reference visualizations by ID like: 'As shown in [viz:health_score], the company scores...'",
        "visualizationRefs": ["health_score", "trend_chart"]
      }
    ]
  },
  "visualizations": [
    // See visualization schemas below
  ],
  "metadata": {
    "dimensionsCovered": ["STR", "SAL"],
    "confidenceLevel": "high|medium|low",
    "dataQuality": "complete|partial|limited"
  }
}
\`\`\`

### Visualization Schemas

#### Gauge (for scores, health metrics):
\`\`\`json
{
  "id": "strategy_health_score",
  "type": "gauge",
  "data": {
    "value": 63,
    "max": 100,
    "benchmark": 71,
    "trend": "flat"
  },
  "context": {
    "dimension": "STR",
    "chapter": "GE",
    "label": "Strategy Health Score",
    "placement": "section_header"
  }
}
\`\`\`

#### Bar (for comparisons):
\`\`\`json
{
  "id": "revenue_growth_comparison",
  "type": "bar",
  "data": {
    "clientValue": 12,
    "benchmarkValue": 18,
    "unit": "%",
    "higherIsBetter": true
  },
  "context": {
    "dimension": "SAL",
    "label": "Revenue Growth Rate",
    "placement": "inline"
  }
}
\`\`\`

#### Radar (for multi-dimensional views):
\`\`\`json
{
  "id": "operational_maturity",
  "type": "radar",
  "data": {
    "dimensions": ["Process", "Technology", "People", "Data", "Governance"],
    "clientValues": [65, 45, 72, 38, 55],
    "benchmarkValues": [70, 60, 65, 55, 60]
  },
  "context": {
    "chapter": "PH",
    "label": "Operational Maturity Profile",
    "placement": "section_header"
  }
}
\`\`\`

#### Comparison (for metric tables):
\`\`\`json
{
  "id": "financial_ratios",
  "type": "comparison",
  "data": {
    "metrics": [
      {"label": "Current Ratio", "clientValue": 1.2, "benchmarkValue": 1.5, "status": "caution"},
      {"label": "Quick Ratio", "clientValue": 0.8, "benchmarkValue": 1.0, "status": "critical"},
      {"label": "Debt-to-Equity", "clientValue": 0.4, "benchmarkValue": 0.6, "status": "good"}
    ]
  },
  "context": {
    "dimension": "FIN",
    "label": "Key Financial Ratios",
    "placement": "comparison_block"
  }
}
\`\`\`

#### Heatmap (for matrices):
\`\`\`json
{
  "id": "risk_matrix",
  "type": "heatmap",
  "data": {
    "rows": ["Financial", "Operational", "Strategic", "Compliance"],
    "columns": ["Likelihood", "Impact", "Risk Score"],
    "values": [[3, 4, 12], [2, 5, 10], [4, 3, 12], [1, 4, 4]]
  },
  "context": {
    "label": "Risk Assessment Matrix",
    "placement": "section_header"
  }
}
\`\`\`

#### Sparkline (for trends):
\`\`\`json
{
  "id": "revenue_trend",
  "type": "sparkline",
  "data": {
    "points": [45, 52, 48, 61, 58, 67, 72],
    "labels": ["Q1'23", "Q2'23", "Q3'23", "Q4'23", "Q1'24", "Q2'24", "Q3'24"],
    "highlightLast": true
  },
  "context": {
    "dimension": "SAL",
    "label": "Revenue Trend",
    "placement": "inline"
  }
}
\`\`\`

### CRITICAL RULES:
1. NEVER use ASCII characters for visualizations (no █, ░, ─, │, ┌, etc.)
2. NEVER embed progress bars or gauges in narrative text
3. ALWAYS reference visualizations by ID in narrative: [viz:visualization_id]
4. ALWAYS include benchmark data when available
5. ALWAYS specify dimension and chapter codes for context
6. Output ONLY valid JSON - no markdown wrappers, no explanatory text
7. Each visualization must have a unique ID
8. Provide 3-8 visualizations per analysis section
`;

// ============================================================================
// ANALYSIS QUALITY STANDARDS
// ============================================================================

/**
 * Quality standards for analysis content
 */
export const ANALYSIS_QUALITY_STANDARDS = `
## ANALYSIS QUALITY STANDARDS

### Narrative Requirements:
- Write in professional consulting voice (authoritative, specific, actionable)
- Ground every claim in questionnaire data or calculated metrics
- Avoid generic observations - be specific to this company
- Use "the company" not "you" or "your company"
- Include specific numbers, percentages, and comparisons
- Reference visualizations naturally: "As illustrated in [viz:id]..."
- NEVER include ASCII art, progress bars, or visual representations in text

### Visualization Requirements:
- Provide 3-8 visualizations per analysis section
- Include at least one gauge for the primary health score
- Use bar charts for client vs. benchmark comparisons
- Use radar charts for multi-dimensional assessments
- Use comparison blocks for related metrics
- All values must be derived from questionnaire data
- Include trend data when historical context is available

### Evidence Standards:
- Cite specific questionnaire responses (e.g., "Q23 indicates...")
- Reference calculated scores with methodology notes
- Note confidence level based on data completeness
- Flag areas where data is insufficient for definitive conclusions

### Visualization ID Conventions:
- Use snake_case for IDs: "revenue_engine_score"
- Prefix with context: "str_health_score", "sal_conversion_rate"
- Keep IDs concise but descriptive
- Ensure all IDs are unique within the analysis
`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Build a complete analysis prompt with consistent structure
 *
 * @param analysisType - Type of analysis (e.g., "Revenue Engine")
 * @param specificInstructions - Analysis-specific instructions
 * @param companyContext - Company profile information
 * @param questionnaireData - Questionnaire responses
 * @param benchmarkData - Industry benchmark data
 * @returns Complete prompt string
 */
export function buildAnalysisPrompt(
  analysisType: string,
  specificInstructions: string,
  companyContext: string,
  questionnaireData: string,
  benchmarkData: string
): string {
  return `
# ${analysisType.toUpperCase()} ANALYSIS

## COMPANY CONTEXT
${companyContext}

## QUESTIONNAIRE DATA
${questionnaireData}

## BENCHMARK DATA
${benchmarkData}

## ANALYSIS INSTRUCTIONS
${specificInstructions}

${ANALYSIS_QUALITY_STANDARDS}

${VISUALIZATION_OUTPUT_INSTRUCTIONS}

Perform the analysis now and output ONLY the JSON response.
`.trim();
}

// ============================================================================
// VISUALIZATION TEMPLATE HELPERS
// ============================================================================

/**
 * Generate a standard gauge visualization template
 */
export function createGaugeTemplate(
  id: string,
  label: string,
  dimension?: string,
  chapter?: string
): string {
  return JSON.stringify(
    {
      id,
      type: 'gauge',
      data: {
        value: '{{value}}',
        max: 100,
        benchmark: '{{benchmark}}',
        trend: '{{trend}}',
      },
      context: {
        dimension,
        chapter,
        label,
        placement: 'section_header',
      },
    },
    null,
    2
  );
}

/**
 * Generate a standard bar comparison template
 */
export function createBarTemplate(
  id: string,
  label: string,
  unit: string,
  dimension?: string
): string {
  return JSON.stringify(
    {
      id,
      type: 'bar',
      data: {
        clientValue: '{{clientValue}}',
        benchmarkValue: '{{benchmarkValue}}',
        unit,
        higherIsBetter: true,
      },
      context: {
        dimension,
        label,
        placement: 'inline',
      },
    },
    null,
    2
  );
}

/**
 * Generate a standard radar visualization template
 */
export function createRadarTemplate(
  id: string,
  label: string,
  dimensions: string[],
  chapter?: string
): string {
  return JSON.stringify(
    {
      id,
      type: 'radar',
      data: {
        dimensions,
        clientValues: dimensions.map(() => '{{value}}'),
        benchmarkValues: dimensions.map(() => '{{benchmark}}'),
      },
      context: {
        chapter,
        label,
        placement: 'section_header',
      },
    },
    null,
    2
  );
}

/**
 * Generate a standard comparison block template
 */
export function createComparisonTemplate(
  id: string,
  label: string,
  metrics: string[],
  dimension?: string
): string {
  return JSON.stringify(
    {
      id,
      type: 'comparison',
      data: {
        metrics: metrics.map((m) => ({
          label: m,
          clientValue: '{{clientValue}}',
          benchmarkValue: '{{benchmarkValue}}',
          status: '{{status}}',
        })),
      },
      context: {
        dimension,
        label,
        placement: 'comparison_block',
      },
    },
    null,
    2
  );
}

// ============================================================================
// REQUIRED VISUALIZATION DEFINITIONS
// ============================================================================

/**
 * Standard visualization requirements by analysis type
 */
export const REQUIRED_VISUALIZATIONS = {
  revenue_engine: [
    { id: 'revenue_engine_score', type: 'gauge', description: 'Overall revenue engine health score' },
    { id: 'sales_conversion', type: 'bar', description: 'Sales conversion rate vs benchmark' },
    { id: 'cac_efficiency', type: 'bar', description: 'Customer acquisition cost comparison' },
    { id: 'clv_cac_ratio', type: 'bar', description: 'CLV:CAC ratio comparison' },
    { id: 'revenue_maturity', type: 'radar', description: 'Multi-dimensional maturity view' },
  ],
  operational_excellence: [
    { id: 'operational_excellence_score', type: 'gauge', description: 'Overall operational health' },
    { id: 'process_efficiency', type: 'comparison', description: 'Key process metrics' },
    { id: 'technology_maturity', type: 'radar', description: 'Technology maturity profile' },
    { id: 'capacity_utilization', type: 'bar', description: 'Resource utilization' },
    { id: 'automation_coverage', type: 'bar', description: 'Automation level' },
  ],
  financial_strategic: [
    { id: 'financial_health_score', type: 'gauge', description: 'Overall financial health' },
    { id: 'key_ratios', type: 'comparison', description: 'Key financial ratios' },
    { id: 'cash_flow_health', type: 'gauge', description: 'Cash flow position' },
    { id: 'profitability', type: 'bar', description: 'Profitability comparison' },
    { id: 'financial_risk', type: 'heatmap', description: 'Financial risk matrix' },
  ],
  people_leadership: [
    { id: 'people_health_score', type: 'gauge', description: 'Overall people health' },
    { id: 'leadership_effectiveness', type: 'radar', description: 'Leadership capabilities' },
    { id: 'engagement_metrics', type: 'comparison', description: 'Employee engagement' },
    { id: 'talent_pipeline', type: 'gauge', description: 'Talent pipeline health' },
    { id: 'culture_indicators', type: 'bar', description: 'Culture metrics' },
  ],
  compliance_sustainability: [
    { id: 'compliance_score', type: 'gauge', description: 'Overall compliance health' },
    { id: 'risk_exposure', type: 'heatmap', description: 'Risk exposure matrix' },
    { id: 'compliance_gaps', type: 'comparison', description: 'Key compliance gaps' },
    { id: 'sustainability_maturity', type: 'radar', description: 'Sustainability profile' },
    { id: 'regulatory_readiness', type: 'gauge', description: 'Regulatory readiness' },
  ],
} as const;

export type AnalysisType = keyof typeof REQUIRED_VISUALIZATIONS;

/**
 * Get required visualizations for an analysis type
 */
export function getRequiredVisualizations(analysisType: AnalysisType) {
  return REQUIRED_VISUALIZATIONS[analysisType] || [];
}
