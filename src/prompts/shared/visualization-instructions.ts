/**
 * MANDATORY VISUALIZATION INSTRUCTIONS
 *
 * This instruction block is NON-NEGOTIABLE and must be included in
 * ALL Phase 1, Phase 2, and Phase 3 prompts. It establishes the
 * contractual requirement for structured visualization output.
 */

export const VISUALIZATION_INSTRUCTIONS = `
## MANDATORY VISUALIZATION OUTPUT FORMAT

You are generating content for a premium business consulting report ($20,000+ value).
All visualizations MUST be rendered as professional SVG charts by our rendering engine.

### CRITICAL REQUIREMENTS

1. **NEVER generate ASCII art or text-based visualizations**

   FORBIDDEN characters (will cause validation failure):
   ┌ ┐ └ ┘ │ ─ ┬ ┴ ├ ┤ ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ █ ▓ ░ ▲ ▼ ► ◄ ● ○ ■ □

   FORBIDDEN patterns:
   - Box-drawing tables
   - Bar charts made with block characters (like ████░░░░)
   - Matrices with pipe characters
   - Any "visual" made from text characters
   - ASCII diagrams or flowcharts

2. **ALWAYS use JSON visualization specifications**

   When you want to present data visually, output a JSON block in this EXACT format:

   \`\`\`json:visualization
   {
     "vizType": "gauge | bar_chart | horizontal_bar | comparison_matrix | score_tiles | timeline | risk_matrix | heatmap | radar_chart | priority_table | progress_indicator | trend_sparkline | kpi_card",
     "title": "Clear, descriptive title",
     "subtitle": "Optional context",
     "data": [
       {
         "label": "Item name",
         "value": 72,
         "unit": "% | $ | count | score | days | ratio | none",
         "category": "strength | gap | risk | opportunity | neutral | excellence | proficiency | attention | critical",
         "trend": "up | down | stable",
         "benchmark": 65
       }
     ],
     "metadata": {
       "source": "Assessment data",
       "dimensionCode": "STR",
       "chapterCode": "GE"
     }
   }
   \`\`\`

3. **Visualization type selection guide**:

   - Single score (0-100): Use "gauge"
   - Multiple scores to compare: Use "bar_chart" or "comparison_matrix"
   - Ranked list with values: Use "horizontal_bar" or "priority_table"
   - Time-based phases: Use "timeline"
   - Risk probability vs impact: Use "risk_matrix"
   - Multi-dimensional assessment: Use "radar_chart"
   - Key metrics summary: Use "kpi_card" or "score_tiles"
   - Change over time: Use "trend_sparkline"

4. **Multiple visualizations**: You may include multiple \`\`\`json:visualization\`\`\` blocks
   in your response. Each will be rendered as a separate professional chart.

5. **Narrative + Visualization**: Combine rich narrative analysis WITH visualization specs.
   The visualizations complement your written insights—they don't replace them.

### EXAMPLE OUTPUT STRUCTURE

Here is how to structure a section with visualization:

---
**Sales Performance Analysis**

The sales dimension shows strong performance with a score of 78/100, placing the company
in the Proficiency band. Pipeline management is particularly strong, while close rates
show room for improvement compared to industry benchmarks.

\`\`\`json:visualization
{
  "vizType": "gauge",
  "title": "Sales Health Score",
  "data": [{ "label": "Sales", "value": 78, "unit": "score", "category": "proficiency" }],
  "metadata": { "dimensionCode": "SAL", "chapterCode": "GE" }
}
\`\`\`

Key sub-indicators reveal varying performance levels:

\`\`\`json:visualization
{
  "vizType": "horizontal_bar",
  "title": "Sales Sub-Indicator Performance",
  "data": [
    { "label": "Pipeline Management", "value": 85, "unit": "%", "category": "excellence", "benchmark": 70 },
    { "label": "Close Rate", "value": 62, "unit": "%", "category": "attention", "benchmark": 75 },
    { "label": "Customer Retention", "value": 78, "unit": "%", "category": "proficiency", "benchmark": 72 }
  ],
  "metadata": { "dimensionCode": "SAL" }
}
\`\`\`
---

### COMPLIANCE CHECK

Before completing your response, verify:
- No ASCII box-drawing characters anywhere in response
- No text-based charts, tables made with dashes/pipes, or block-character bars
- All data meant for visual display is in \`\`\`json:visualization\`\`\` blocks
- Each visualization block has valid vizType, title, and data array

FAILURE TO COMPLY will result in validation rejection and pipeline failure.
`;

/**
 * Returns the complete system prompt with visualization instructions prepended
 */
export function withVisualizationInstructions(basePrompt: string): string {
  return `${VISUALIZATION_INSTRUCTIONS}\n\n---\n\n${basePrompt}`;
}

/**
 * Returns visualization instructions as a standalone block
 * (for insertion at specific points in prompts)
 */
export function getVisualizationInstructionsBlock(): string {
  return VISUALIZATION_INSTRUCTIONS;
}

/**
 * Light version for token-constrained contexts
 */
export const VISUALIZATION_INSTRUCTIONS_COMPACT = `
## VISUALIZATION FORMAT REQUIREMENT

NEVER use ASCII art or box-drawing characters (═║╔╗┌┐│─█▓░ etc).
All data visualizations MUST use JSON specification blocks:

\`\`\`json:visualization
{
  "vizType": "gauge|bar_chart|horizontal_bar|radar_chart|priority_table|kpi_card",
  "title": "Title",
  "data": [{ "label": "Name", "value": 72, "unit": "%", "category": "proficiency" }]
}
\`\`\`

Valid vizTypes: gauge, bar_chart, horizontal_bar, comparison_matrix, score_tiles,
timeline, risk_matrix, heatmap, radar_chart, priority_table, progress_indicator,
trend_sparkline, kpi_card

ASCII characters in output will cause validation failure.
`;

/**
 * Returns the compact version for token-constrained contexts
 */
export function withCompactVisualizationInstructions(basePrompt: string): string {
  return `${VISUALIZATION_INSTRUCTIONS_COMPACT}\n\n---\n\n${basePrompt}`;
}
