/**
 * Visualization Supplement for Analysis Prompts
 *
 * This module provides visualization output instructions that can be
 * appended to existing analysis prompts to enforce structured JSON output
 * with visualizations instead of ASCII graphics.
 *
 * @module visualization-supplement
 * @version 1.0.0
 */

import {
  VISUALIZATION_OUTPUT_INSTRUCTIONS,
  ANALYSIS_QUALITY_STANDARDS,
} from './base-analysis-prompt.js';

// ============================================================================
// VISUALIZATION SUPPLEMENT PROMPT
// ============================================================================

/**
 * Visualization supplement to append to existing prompts
 * Overrides the output format section with structured visualization requirements
 */
export const VISUALIZATION_SUPPLEMENT = `

## VISUALIZATION OUTPUT REQUIREMENTS (MANDATORY)

The following requirements OVERRIDE any previous output format instructions.
Your response MUST include structured visualization data instead of ASCII graphics.

${VISUALIZATION_OUTPUT_INSTRUCTIONS}

${ANALYSIS_QUALITY_STANDARDS}

### REMINDER: ASCII GRAPHICS ARE PROHIBITED

Do NOT use any of the following in your output:
- Progress bars: ████████░░░░ or [=====>    ]
- Box drawing: ┌─┬─┐ or +--+--+
- Star ratings: ★★★☆☆
- Color blocks: 🟢🟡🔴
- Any text-based visualizations

Instead, use the structured visualization JSON format specified above.
`;

// ============================================================================
// REVENUE ENGINE VISUALIZATION REQUIREMENTS
// ============================================================================

export const REVENUE_ENGINE_VISUALIZATIONS = `
### Required Visualizations for Revenue Engine Analysis

You MUST include these visualizations (minimum):

1. **revenue_engine_score** (gauge)
   - Overall revenue engine health score (0-100)
   - Include industry benchmark
   - Specify trend direction

2. **sales_conversion_rate** (bar)
   - Client conversion rate vs industry benchmark
   - Unit: percentage
   - higherIsBetter: true

3. **cac_efficiency** (bar)
   - Customer acquisition cost comparison
   - Unit: currency
   - higherIsBetter: false (lower CAC is better)

4. **clv_cac_ratio** (bar)
   - CLV:CAC ratio vs healthy benchmark (3:1)
   - Unit: ratio
   - higherIsBetter: true

5. **revenue_maturity** (radar)
   - Dimensions: Strategy, Sales, Marketing, CX
   - Client values and benchmarks for each

6. **sales_pipeline_health** (gauge)
   - Pipeline management score
   - Based on questionnaire responses

7. **marketing_roi** (bar)
   - Marketing ROI comparison
   - Unit: percentage

8. **customer_retention** (bar)
   - Repeat customer rate vs benchmark
   - Unit: percentage

Example structure:
\`\`\`json
{
  "visualizations": [
    {
      "id": "revenue_engine_score",
      "type": "gauge",
      "data": { "value": 58, "max": 100, "benchmark": 65, "trend": "flat" },
      "context": { "chapter": "GE", "label": "Revenue Engine Score", "placement": "section_header" }
    },
    {
      "id": "sales_conversion_rate",
      "type": "bar",
      "data": { "clientValue": 22, "benchmarkValue": 27, "unit": "%", "higherIsBetter": true },
      "context": { "dimension": "SAL", "label": "Sales Conversion Rate", "placement": "inline" }
    }
    // ... additional visualizations
  ]
}
\`\`\`
`;

// ============================================================================
// OPERATIONAL EXCELLENCE VISUALIZATION REQUIREMENTS
// ============================================================================

export const OPERATIONAL_EXCELLENCE_VISUALIZATIONS = `
### Required Visualizations for Operational Excellence Analysis

You MUST include these visualizations (minimum):

1. **operational_excellence_score** (gauge)
   - Overall operational health score (0-100)
   - Include industry benchmark and trend

2. **process_efficiency_metrics** (comparison)
   - Key process metrics vs benchmarks
   - Include: cycle time, quality, capacity utilization

3. **technology_maturity** (radar)
   - Dimensions: Infrastructure, Integration, Security, Automation, Support
   - Client values and benchmarks

4. **capacity_utilization** (bar)
   - Current utilization vs optimal range
   - Unit: percentage

5. **automation_coverage** (bar)
   - Current automation level vs industry benchmark
   - Unit: percentage

6. **system_reliability** (gauge)
   - IT system uptime/reliability score
   - Include target benchmark

7. **operational_risk_matrix** (heatmap)
   - Risk categories vs impact/likelihood
   - 3-4 rows and columns

8. **business_continuity_readiness** (gauge)
   - BC/DR preparedness score

Example structure:
\`\`\`json
{
  "visualizations": [
    {
      "id": "operational_excellence_score",
      "type": "gauge",
      "data": { "value": 62, "max": 100, "benchmark": 70, "trend": "improving" },
      "context": { "chapter": "PH", "label": "Operational Excellence Score", "placement": "section_header" }
    },
    {
      "id": "technology_maturity",
      "type": "radar",
      "data": {
        "dimensions": ["Infrastructure", "Integration", "Security", "Automation", "Support"],
        "clientValues": [55, 48, 62, 35, 58],
        "benchmarkValues": [65, 60, 70, 55, 65]
      },
      "context": { "label": "Technology Maturity Profile", "placement": "section_header" }
    }
    // ... additional visualizations
  ]
}
\`\`\`
`;

// ============================================================================
// FINANCIAL STRATEGIC VISUALIZATION REQUIREMENTS
// ============================================================================

export const FINANCIAL_STRATEGIC_VISUALIZATIONS = `
### Required Visualizations for Financial & Strategic Analysis

You MUST include these visualizations (minimum):

1. **financial_health_score** (gauge)
   - Overall financial health (0-100)
   - Include benchmark and trend

2. **key_financial_ratios** (comparison)
   - Metrics: Current Ratio, Quick Ratio, Debt-to-Equity, Profit Margin
   - Include status indicators

3. **cash_flow_health** (gauge)
   - Cash flow position score
   - Include runway indicator if applicable

4. **profitability_comparison** (bar)
   - Gross/Net margin vs industry
   - Unit: percentage

5. **financial_risk_matrix** (heatmap)
   - Risk categories: Liquidity, Credit, Market, Operational
   - Columns: Likelihood, Impact, Score

6. **strategic_alignment** (radar)
   - Dimensions: Planning, Resources, Execution, Measurement
   - Client vs best practice

7. **growth_investment_readiness** (gauge)
   - Investment capacity score

8. **revenue_trend** (sparkline)
   - Last 6-8 quarters revenue trend
`;

// ============================================================================
// PEOPLE LEADERSHIP VISUALIZATION REQUIREMENTS
// ============================================================================

export const PEOPLE_LEADERSHIP_VISUALIZATIONS = `
### Required Visualizations for People & Leadership Analysis

You MUST include these visualizations (minimum):

1. **people_health_score** (gauge)
   - Overall people/culture health (0-100)

2. **leadership_effectiveness** (radar)
   - Dimensions: Vision, Communication, Development, Decision-making, Culture
   - Client vs benchmark

3. **engagement_metrics** (comparison)
   - Metrics: Satisfaction, Retention, Development, Recognition
   - Include status indicators

4. **talent_pipeline_health** (gauge)
   - Talent acquisition/development score

5. **culture_indicators** (bar)
   - Culture strength vs industry

6. **hr_infrastructure** (gauge)
   - HR systems/processes maturity

7. **succession_readiness** (gauge)
   - Leadership succession preparedness

8. **workforce_composition** (comparison)
   - Key workforce metrics vs benchmarks
`;

// ============================================================================
// COMPLIANCE SUSTAINABILITY VISUALIZATION REQUIREMENTS
// ============================================================================

export const COMPLIANCE_SUSTAINABILITY_VISUALIZATIONS = `
### Required Visualizations for Compliance & Sustainability Analysis

You MUST include these visualizations (minimum):

1. **compliance_health_score** (gauge)
   - Overall compliance posture (0-100)

2. **risk_exposure_matrix** (heatmap)
   - Categories: Regulatory, Legal, Operational, Reputational
   - Assessment: Likelihood, Impact, Mitigation

3. **compliance_gaps** (comparison)
   - Key compliance areas vs requirements
   - Include status indicators

4. **sustainability_maturity** (radar)
   - Dimensions: Environmental, Social, Governance, Reporting
   - Client vs best practice

5. **regulatory_readiness** (gauge)
   - Preparedness for key regulations

6. **risk_mitigation_coverage** (bar)
   - Risks with mitigation plans vs total

7. **audit_readiness** (gauge)
   - Audit/documentation preparedness

8. **esg_score** (gauge)
   - ESG/sustainability score if applicable
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get visualization requirements for a specific analysis type
 */
export function getVisualizationRequirements(
  analysisType:
    | 'revenue_engine'
    | 'operational_excellence'
    | 'financial_strategic'
    | 'people_leadership'
    | 'compliance_sustainability'
): string {
  const requirements: Record<string, string> = {
    revenue_engine: REVENUE_ENGINE_VISUALIZATIONS,
    operational_excellence: OPERATIONAL_EXCELLENCE_VISUALIZATIONS,
    financial_strategic: FINANCIAL_STRATEGIC_VISUALIZATIONS,
    people_leadership: PEOPLE_LEADERSHIP_VISUALIZATIONS,
    compliance_sustainability: COMPLIANCE_SUSTAINABILITY_VISUALIZATIONS,
  };

  return requirements[analysisType] || '';
}

/**
 * Build complete visualization supplement for an analysis type
 */
export function buildVisualizationSupplement(
  analysisType:
    | 'revenue_engine'
    | 'operational_excellence'
    | 'financial_strategic'
    | 'people_leadership'
    | 'compliance_sustainability'
): string {
  return `
${VISUALIZATION_SUPPLEMENT}

${getVisualizationRequirements(analysisType)}
`.trim();
}

/**
 * Append visualization requirements to an existing prompt
 */
export function appendVisualizationRequirements(
  existingPrompt: string,
  analysisType:
    | 'revenue_engine'
    | 'operational_excellence'
    | 'financial_strategic'
    | 'people_leadership'
    | 'compliance_sustainability'
): string {
  const supplement = buildVisualizationSupplement(analysisType);

  // Find the end of the prompt (before final instructions)
  const endMarker = /(?:Begin your|Produce complete|Start your|Perform the)/i;
  const match = existingPrompt.match(endMarker);

  if (match && match.index) {
    // Insert supplement before final instruction
    return (
      existingPrompt.slice(0, match.index) +
      '\n\n' +
      supplement +
      '\n\n' +
      existingPrompt.slice(match.index)
    );
  }

  // If no marker found, append at end
  return existingPrompt + '\n\n' + supplement;
}
