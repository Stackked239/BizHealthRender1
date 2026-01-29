/**
 * Phase 4.5 BLUF Prompt Templates
 *
 * Enhanced prompts for generating high-quality BLUF (Bottom Line Up Front)
 * executive summaries for various report types.
 *
 * Each prompt follows a structured format:
 * 1. Role definition
 * 2. Client context (company data, scores, risks, opportunities)
 * 3. Structure requirements (paragraph count, word count, purpose)
 * 4. Quality requirements (evidence, specificity, tone)
 * 5. Output format
 */

import type { IDM, Chapter, Dimension } from '../types/idm.types.js';

// ===== HELPER FUNCTIONS =====

/**
 * Get top risks from IDM (critical and high severity)
 */
function getTopRisks(idm: IDM, limit = 3): Array<{ title: string; severity: string; narrative: string }> {
  const risks = idm.risks || [];
  return risks
    .filter(r => r.severity === 'critical' || r.severity === 'high' || r.severity === 'Critical' || r.severity === 'High')
    .slice(0, limit)
    .map(r => ({
      title: r.narrative?.split('.')[0] || 'Risk identified',
      severity: String(r.severity),
      narrative: r.narrative || ''
    }));
}

/**
 * Get top opportunities from quick wins (high impact, low effort)
 */
function getTopOpportunities(idm: IDM, limit = 3): Array<{ title: string; impact: string; effort: string }> {
  const recommendations = idm.recommendations || [];
  const quickWinIds = new Set((idm.quick_wins || []).map(qw => qw.recommendation_id));

  // Get recommendations that are quick wins, sorted by impact
  const quickWinRecs = recommendations
    .filter(r => quickWinIds.has(r.id))
    .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))
    .slice(0, limit);

  return quickWinRecs.map(r => ({
    title: r.theme || 'Opportunity identified',
    impact: r.impact_score >= 70 ? 'high' : r.impact_score >= 40 ? 'medium' : 'low',
    effort: r.effort_score <= 30 ? 'low' : r.effort_score <= 60 ? 'medium' : 'high'
  }));
}

/**
 * Format chapter scores as a string
 */
function formatChapterScores(idm: IDM): string {
  const chapters = idm.chapters || [];
  return chapters
    .map(c => `${c.chapter_code}: ${c.score_overall}/100`)
    .join(', ');
}

/**
 * Get company name safely
 */
function getCompanyName(idm: IDM): string {
  // Try multiple paths to find company name
  if ((idm as any).company_profile?.basic_information?.company_name) {
    return (idm as any).company_profile.basic_information.company_name;
  }
  if ((idm as any).meta?.company_name) {
    return (idm as any).meta.company_name;
  }
  // Fallback
  return 'the company';
}

/**
 * Get overall health score
 */
function getOverallScore(idm: IDM): number {
  return idm.scores_summary?.overall_health_score || 0;
}

/**
 * Get health descriptor
 */
function getHealthDescriptor(idm: IDM): string {
  return idm.scores_summary?.descriptor || 'Unknown';
}

/**
 * Get trajectory
 *
 * Defaults to 'Initial' for first assessments (no prior data)
 * Valid values: 'Initial', 'Improving', 'Stable', 'Declining', 'Flat' (deprecated)
 */
function getTrajectory(idm: IDM): string {
  const trajectory = idm.scores_summary?.trajectory;
  // Default to 'Initial' for first assessments
  if (!trajectory) return 'Initial';
  // Map deprecated 'Flat' to 'Stable'
  if (trajectory === 'Flat') return 'Stable';
  return trajectory;
}

// ===== COMPREHENSIVE REPORT BLUF PROMPT =====

export function buildComprehensiveBLUFPrompt(idm: IDM): string {
  const companyName = getCompanyName(idm);
  const overallScore = getOverallScore(idm);
  const healthStatus = getHealthDescriptor(idm);
  const trajectory = getTrajectory(idm);
  const chapterScores = formatChapterScores(idm);
  const topRisks = getTopRisks(idm, 3);
  const topOpportunities = getTopOpportunities(idm, 3);

  const risksList = topRisks.length > 0
    ? topRisks.map((r, i) => `${i + 1}. ${r.title} (${r.severity} severity)`).join('\n')
    : '1. No critical risks identified';

  const opportunitiesList = topOpportunities.length > 0
    ? topOpportunities.map((o, i) => `${i + 1}. ${o.title} (${o.impact} impact, ${o.effort} effort)`).join('\n')
    : '1. Multiple improvement opportunities available';

  return `You are a senior business consultant writing the executive summary (BLUF - Bottom Line Up Front) for a comprehensive business health assessment report.

**CLIENT CONTEXT:**
- Company: ${companyName}
- Overall Health Score: ${overallScore}/100 (${healthStatus})
- Trajectory: ${trajectory}
- Chapter Scores: ${chapterScores}

**TOP RISKS IDENTIFIED:**
${risksList}

**TOP OPPORTUNITIES IDENTIFIED:**
${opportunitiesList}

**YOUR TASK:**
Write a 2-4 paragraph BLUF (Bottom Line Up Front) executive summary for the Comprehensive Business Health Report.

**STRUCTURE REQUIREMENTS:**

**PARAGRAPH 1: Overall Diagnosis + Trajectory (40-80 words)**
- State the overall health score (${overallScore}/100) and descriptor (${healthStatus})
- Mention the trajectory (${trajectory})
- Reference at least 2 specific chapter scores
- Include one strategic framing statement about market position or lifecycle stage

**PARAGRAPH 2: Most Critical Risk/Issue (40-80 words)**
- Identify THE single most urgent priority from the risks above
- Quantify the business impact (revenue, cash, operations)
- Cite specific evidence (dimension score, risk severity)
- State the timeframe for impact if unaddressed

**PARAGRAPH 3: Top Opportunity/Leverage Point (40-80 words)**
- Identify THE highest-impact opportunity from above
- Quantify the potential upside (growth %, efficiency gain)
- Connect to existing strengths
- Cite specific evidence (dimension score, benchmark gap)

**PARAGRAPH 4: Strategic Framing - What's at Stake (40-80 words)**
- "If action is taken..." → specific positive outcome with projected score improvement
- "If action is NOT taken..." → specific negative trajectory with risk
- State the recommended path forward (1-2 top priorities)

**QUALITY REQUIREMENTS:**
- Professional third-person voice ("The company demonstrates..." not "You have...")
- Company-specific content (mention ${companyName} at least twice)
- Quantitative evidence (minimum 5 specific numbers across all paragraphs)
- No generic platitudes ("focus on growth", "improve efficiency")
- Each claim must be traceable to assessment data
- Total length: 150-320 words across all paragraphs

**OUTPUT FORMAT:**
Return ONLY the 2-4 paragraphs, separated by double newlines.
Do NOT include:
- Labels like "Paragraph 1:", "BLUF:", "Executive Summary:"
- Preamble or introduction
- Markdown formatting
- Bullet points or lists

Start directly with paragraph 1 content.`;
}

// ===== OWNER REPORT BLUF PROMPT =====

export function buildOwnerBLUFPrompt(idm: IDM): string {
  const companyName = getCompanyName(idm);
  const overallScore = getOverallScore(idm);
  const healthStatus = getHealthDescriptor(idm);
  const trajectory = getTrajectory(idm);
  const chapterScores = formatChapterScores(idm);
  const topRisks = getTopRisks(idm, 3);
  const topOpportunities = getTopOpportunities(idm, 3);

  const risksList = topRisks.length > 0
    ? topRisks.map((r, i) => `${i + 1}. ${r.title} (${r.severity} severity)`).join('\n')
    : '1. No critical risks identified';

  const opportunitiesList = topOpportunities.length > 0
    ? topOpportunities.map((o, i) => `${i + 1}. ${o.title} (${o.impact} impact, ${o.effort} effort)`).join('\n')
    : '1. Multiple improvement opportunities available';

  return `You are a trusted business advisor writing the executive summary (BLUF) for an owner-focused business health report.

**CLIENT CONTEXT:**
- Company: ${companyName}
- Overall Health Score: ${overallScore}/100 (${healthStatus})
- Trajectory: ${trajectory}
- Chapter Scores: ${chapterScores}

**TOP RISKS:**
${risksList}

**TOP OPPORTUNITIES:**
${opportunitiesList}

**YOUR TASK:**
Write a 2-4 paragraph BLUF for the Owner's Report. Use owner-focused "you/your" language while maintaining consultant authority.

**STRUCTURE REQUIREMENTS:**

**PARAGRAPH 1: Your Business Health + Where You Stand (40-80 words)**
- State your overall health score (${overallScore}/100) and status (${healthStatus})
- Mention your current trajectory (${trajectory})
- Use "your business", "your team", "your company" language
- Include at least 2 specific chapter scores

**PARAGRAPH 2: Your Most Urgent Priority (40-80 words)**
- Identify THE most urgent issue YOU need to address
- Explain impact on YOUR revenue, cash flow, or operations
- Cite specific scores/metrics from YOUR assessment
- Use ownership framing ("you need to...", "your priority...")

**PARAGRAPH 3: Your Biggest Opportunity (40-80 words)**
- Identify THE highest-impact opportunity for YOUR business
- Quantify what YOU can gain (growth, efficiency, competitive edge)
- Connect to YOUR existing strengths
- Use owner-framing ("you can...", "your opportunity...")

**PARAGRAPH 4: What's at Stake for You (40-80 words)**
- "If you take action..." → YOUR positive outcome
- "If you don't..." → YOUR risk of inaction
- State YOUR recommended path forward
- Use empowering tone for owner accountability

**QUALITY REQUIREMENTS:**
- Owner-focused voice ("you/your" language throughout)
- Professional yet accessible (advisor to owner, not peer)
- Company-specific (use ${companyName}, cite YOUR actual scores)
- Quantitative evidence (minimum 5 numbers across all paragraphs)
- Each paragraph 40-80 words
- Total length: 160-320 words

**OUTPUT FORMAT:**
Return ONLY the 2-4 paragraphs, separated by double newlines. No labels, no preamble.`;
}

// ===== EXECUTIVE BRIEF BLUF PROMPT =====

export function buildExecutiveBriefBLUFPrompt(idm: IDM): string {
  const companyName = getCompanyName(idm);
  const overallScore = getOverallScore(idm);
  const healthStatus = getHealthDescriptor(idm);
  const trajectory = getTrajectory(idm);
  const topRisks = getTopRisks(idm, 2);
  const topOpportunities = getTopOpportunities(idm, 2);

  return `You are a senior consultant writing a concise executive overview for busy C-suite readers.

**CLIENT CONTEXT:**
- Company: ${companyName}
- Overall Health Score: ${overallScore}/100 (${healthStatus})
- Trajectory: ${trajectory}
- Top Risk: ${topRisks[0]?.title || 'None critical'}
- Top Opportunity: ${topOpportunities[0]?.title || 'Multiple available'}

**YOUR TASK:**
Write a 1-2 paragraph executive overview (50-120 words total).

**STRUCTURE:**
- PARAGRAPH 1: Health snapshot + trajectory + one key insight (30-60 words)
- PARAGRAPH 2 (optional): Action imperative + expected outcome (30-60 words)

**REQUIREMENTS:**
- Extremely concise - every word must count
- Lead with the most important information
- Include at least 2 specific numbers
- Professional third-person voice
- No filler or generic statements

**OUTPUT FORMAT:**
Return ONLY the 1-2 paragraphs, separated by double newlines. No labels.`;
}

// ===== CHAPTER BLUF PROMPT =====

export function buildChapterBLUFPrompt(
  chapterCode: 'GE' | 'PH' | 'PL' | 'RS',
  chapter: Chapter,
  idm: IDM
): string {
  const companyName = getCompanyName(idm);
  const chapterNames: Record<string, string> = {
    'GE': 'Growth Engine',
    'PH': 'Performance & Health',
    'PL': 'People & Leadership',
    'RS': 'Resilience & Safeguards'
  };
  const chapterName = chapterNames[chapterCode] || chapterCode;

  // Get dimensions for this chapter
  const chapterDimensions = (idm.dimensions || [])
    .filter(d => d.chapter_code === chapterCode)
    .map(d => `${d.name}: ${d.score_overall}/100`)
    .join(', ');

  return `You are a senior consultant writing a chapter summary for the ${chapterName} section.

**CHAPTER CONTEXT:**
- Company: ${companyName}
- Chapter: ${chapterName} (${chapterCode})
- Chapter Score: ${chapter.score_overall}/100 (${chapter.score_band})
- Dimensions: ${chapterDimensions}

**YOUR TASK:**
Write a 1-2 paragraph summary (60-120 words total) for the ${chapterName} chapter.

**STRUCTURE:**
- PARAGRAPH 1: Chapter health status + strongest/weakest dimensions (30-70 words)
- PARAGRAPH 2 (optional): Key finding or priority action for this area (30-50 words)

**REQUIREMENTS:**
- Focus on this chapter's specific areas
- Cite at least 2 specific dimension scores
- Identify what's working and what needs attention
- Professional third-person voice
- No generic statements

**OUTPUT FORMAT:**
Return ONLY the 1-2 paragraphs, separated by double newlines. No labels.`;
}

// ===== DIMENSION BLUF PROMPT =====

export function buildDimensionBLUFPrompt(
  dimensionCode: string,
  dimension: Dimension,
  idm: IDM
): string {
  const companyName = getCompanyName(idm);

  // Get sub-indicator details
  const subIndicators = (dimension.sub_indicators || [])
    .map(si => `${si.name}: ${si.score}/100`)
    .join(', ');

  return `You are a senior consultant writing a dimension summary for the ${dimension.name} area.

**DIMENSION CONTEXT:**
- Company: ${companyName}
- Dimension: ${dimension.name} (${dimensionCode})
- Score: ${dimension.score_overall}/100 (${dimension.score_band})
- Sub-indicators: ${subIndicators}
- Description: ${dimension.description}

**YOUR TASK:**
Write a 1-2 paragraph summary (50-100 words total) for the ${dimension.name} dimension.

**STRUCTURE:**
- PARAGRAPH 1: Dimension status + key insight (30-60 words)
- PARAGRAPH 2 (optional): Specific recommendation or action (20-40 words)

**REQUIREMENTS:**
- Cite the dimension score (${dimension.score_overall}/100)
- Reference at least 1 specific sub-indicator
- Be specific about what's working or needs improvement
- Professional third-person voice

**OUTPUT FORMAT:**
Return ONLY the 1-2 paragraphs, separated by double newlines. No labels.`;
}

// ===== FOCUSED REPORT BLUF PROMPTS =====

export function buildFocusedReportBLUFPrompt(reportType: string, idm: IDM): string {
  const companyName = getCompanyName(idm);
  const overallScore = getOverallScore(idm);

  const prompts: Record<string, string> = {
    'quick_wins': `You are a consultant summarizing quick win opportunities for ${companyName}.

**CONTEXT:**
- Overall Health: ${overallScore}/100
- Quick Wins Available: ${(idm.quick_wins || []).length}

**TASK:**
Write a 1-2 paragraph overview (50-100 words) of the quick win opportunities.
- Highlight the highest-impact, lowest-effort improvements
- Cite expected benefits where possible
- Create urgency without alarm

**OUTPUT:** Return ONLY the paragraphs. No labels.`,

    'risk_assessment': `You are a consultant summarizing the risk landscape for ${companyName}.

**CONTEXT:**
- Overall Health: ${overallScore}/100
- Total Risks Identified: ${(idm.risks || []).length}

**TASK:**
Write a 1-2 paragraph risk overview (50-100 words).
- Prioritize the most critical risks
- Quantify potential impact where possible
- Provide actionable mitigation focus

**OUTPUT:** Return ONLY the paragraphs. No labels.`,

    'roadmap': `You are a consultant summarizing the implementation roadmap for ${companyName}.

**CONTEXT:**
- Overall Health: ${overallScore}/100
- Roadmap Phases: ${(idm.roadmap?.phases || []).length}

**TASK:**
Write a 1-2 paragraph roadmap overview (50-100 words).
- Outline the phased approach
- Highlight immediate priorities vs. longer-term initiatives
- Create momentum for execution

**OUTPUT:** Return ONLY the paragraphs. No labels.`,

    'financial_opportunities': `You are a consultant summarizing financial opportunities for ${companyName}.

**CONTEXT:**
- Overall Health: ${overallScore}/100
- Financial Dimension: Available in IDM

**TASK:**
Write a 1-2 paragraph financial overview (50-100 words).
- Highlight revenue/cost improvement opportunities
- Cite specific financial metrics where available
- Focus on ROI potential

**OUTPUT:** Return ONLY the paragraphs. No labels.`,

    'employees_report': `You are a consultant summarizing company health for an employee audience at ${companyName}.

**CONTEXT:**
- Overall Health: ${overallScore}/100
- Company: ${companyName}

**TASK:**
Write a 1-2 paragraph company health overview (50-100 words) appropriate for employees.
- Focus on positive trajectory and opportunities
- Acknowledge challenges constructively
- Build confidence in the company's direction

**OUTPUT:** Return ONLY the paragraphs. No labels.`
  };

  return prompts[reportType] || prompts['quick_wins'];
}

// ===== MANAGER REPORT BLUF PROMPTS =====

/**
 * Build enhanced BLUF prompt for Manager Reports
 *
 * This generates premium consulting-quality content ($20,000+ value)
 * with mandatory content depth requirements for each section.
 */
export function buildManagerReportBLUFPrompt(managerType: string, idm: IDM): string {
  const companyName = getCompanyName(idm);
  const overallScore = getOverallScore(idm);
  const industry = idm.company_profile?.industry || 'business';

  // Map manager types to relevant dimensions
  const managerDimensionMap: Record<string, string[]> = {
    'financials_manager': ['FIN', 'OPS', 'RMS', 'CMP'],
    'operations_manager': ['OPS', 'CXP', 'TIN'],
    'sales_marketing_manager': ['SAL', 'MKT', 'STR', 'CXP'],
    'strategy_manager': ['STR', 'LDG', 'RMS'],
    'it_technology_manager': ['TIN', 'ITD', 'RMS']
  };

  const relevantDimensions = managerDimensionMap[managerType] || ['STR'];
  const allDimensions = idm.dimensions || [];

  // Get department-specific dimension scores with benchmarks
  const deptDimensions = allDimensions.filter(d => relevantDimensions.includes(d.dimension_code));
  const departmentDimensionDetails = deptDimensions
    .map(d => {
      const benchmark = d.benchmark_peer_percentile || 60;
      const gap = d.score_overall - benchmark;
      const gapDesc = gap >= 0 ? `+${gap} above benchmark` : `${gap} below benchmark`;
      return `${d.name}: ${d.score_overall}/100 (${gapDesc}, benchmark: ${benchmark})`;
    })
    .join('\n    - ');

  // Calculate department average
  const deptAvgScore = deptDimensions.length > 0
    ? Math.round(deptDimensions.reduce((sum, d) => sum + d.score_overall, 0) / deptDimensions.length)
    : overallScore;

  // Get top enterprise strengths and gaps with scores
  const sortedDimensions = [...allDimensions].sort((a, b) => b.score_overall - a.score_overall);
  const topStrengths = sortedDimensions.slice(0, 2).map(d => `${d.name} (${d.score_overall})`).join(', ');
  const topGaps = [...allDimensions].sort((a, b) => a.score_overall - b.score_overall).slice(0, 2);
  const topGapsFormatted = topGaps.map(d => `${d.name} (${d.score_overall})`).join(', ');

  // Get lowest scoring dimension for priority focus
  const lowestDimension = topGaps[0];
  const lowestGap = lowestDimension ? (lowestDimension.benchmark_peer_percentile || 60) - lowestDimension.score_overall : 0;

  const managerTitles: Record<string, string> = {
    'financials_manager': 'Financials',
    'operations_manager': 'Operations',
    'sales_marketing_manager': 'Sales & Marketing',
    'strategy_manager': 'Strategy & Leadership',
    'it_technology_manager': 'IT & Technology'
  };

  const title = managerTitles[managerType] || 'Department';
  const scoreDelta = deptAvgScore - overallScore;
  const deltaDescription = scoreDelta >= 0 ? `${scoreDelta} points above` : `${Math.abs(scoreDelta)} points below`;

  return `You are a senior business consultant generating content for a premium ${title} Manager Report worth $20,000+.

**CONTEXT:**
- Company: ${companyName}
- Industry: ${industry}
- Overall Company Health Score: ${overallScore}/100
- ${title} Department Average: ${deptAvgScore}/100 (${deltaDescription} company average)
- Enterprise Strengths: ${topStrengths}
- Enterprise Gaps: ${topGapsFormatted}
- Department Dimensions with Benchmarks:
    - ${departmentDimensionDetails}
${lowestDimension ? `- Priority Focus: ${lowestDimension.name} at ${lowestDimension.score_overall}/100 (${lowestGap}-point gap to industry benchmark)` : ''}

**TASK:**
Generate a comprehensive BLUF with exactly TWO sections:

## SECTION 1: COMPANY BLUF SNAPSHOT (2-3 paragraphs, 100-150 words)
Provide a high-level synthesis of ${companyName}'s overall business health:
- Overall health score (${overallScore}/100) and trajectory interpretation
- Top 2-3 enterprise-level strengths with specific score references
- Top 2-3 enterprise-level gaps with benchmark comparisons
- Strategic framing of the company's competitive position in the ${industry} industry

## SECTION 2: ${title.toUpperCase()} FOCUS (3-5 paragraphs, 200-300 words)
Provide department-specific strategic analysis with DEPTH:
- Department health score (${deptAvgScore}/100) relative to company average and WHY this matters
- Each dimension's score with benchmark context and business impact explanation
- Root cause analysis of the lowest-scoring area
- Specific impact if gaps remain unaddressed (consequence statement)
- How ${title} connects to enterprise-wide priorities with concrete examples
- TWO specific action recommendations with success metrics and timelines

**CONTENT DEPTH REQUIREMENTS (MANDATORY):**

1. **Quick Wins** (40-60 words each): Include business impact quantification
   GOOD: "Strengthen IT Infrastructure Performance (50/100). Address the 35-point gap to industry benchmark through standardized documentation and identification of top 3 friction points. Expected impact: 20% reduction in system-related delays within 90 days. Track via monthly uptime metrics."
   BAD: "Strengthen IT Infrastructure Performance. This addresses a gap to benchmark."

2. **Key Findings** (25-40 words each): Include benchmark context and "why this matters"
   GOOD: "${companyName}'s Sales Effectiveness at 58/100 lags the industry benchmark by 12 points, directly impacting revenue growth potential. This gap suggests systematic issues in lead conversion methodology."
   BAD: "Sales needs improvement with a score of 58."

3. **Gap Analysis** (50-75 words each): Include root cause, impact if unaddressed, opportunity upside
   GOOD: "The Marketing ROI gap (45/100 vs 65 benchmark) stems from fragmented campaign tracking and attribution. Without addressing this, ${companyName} risks 15-20% marketing budget waste annually. Closing this gap through analytics investment could yield 2-3x improvement in customer acquisition efficiency."
   BAD: "Marketing ROI needs attention."

4. **Category Summary** (150-200 words total): Executive synthesis with priority actions

**CRITICAL RULES:**
- NO generic/template language (avoid: "improvements can be made", "consider implementing", "as needed")
- ALL content must reference ${companyName} specifically throughout (not just in headers)
- EVERY claim must connect to assessment data with specific scores
- QUANTIFY business impact wherever possible (%, points, timeframes)
- Use industry-specific context from the ${industry} sector
- Focus on "why this matters" not just "what the score is"

**OUTPUT:** Return ONLY the two sections with their headers. No additional labels or formatting.`;
}

// ===== MANAGER REPORT CONTENT DEPTH PROMPTS =====

/**
 * Enhanced prompt for generating Quick Wins section in Manager Reports
 * Ensures minimum 40-60 words per quick win with business impact quantification
 */
export function buildManagerQuickWinsPrompt(managerType: string, idm: IDM): string {
  const companyName = getCompanyName(idm);
  const managerTitles: Record<string, string> = {
    'financials_manager': 'Financials',
    'operations_manager': 'Operations',
    'sales_marketing_manager': 'Sales & Marketing',
    'strategy_manager': 'Strategy & Leadership',
    'it_technology_manager': 'IT & Technology'
  };
  const title = managerTitles[managerType] || 'Department';

  return `You are generating Quick Wins for a premium ${title} Manager Report.

**MANDATORY FORMAT FOR EACH QUICK WIN (40-60 words minimum):**

1. **Title with Score**: "[Area] Performance Improvement (XX/100)"

2. **Gap Context**: "Address the XX-point gap to industry benchmark of YY/100"

3. **Action Specification**: Concrete steps (not vague "improvements")

4. **Business Impact**: Quantified outcome ("potential XX% efficiency gain", "estimated $XXK savings")

5. **Success Metrics**: How to track progress ("Track via [specific metric]")

6. **Timeline**: Realistic timeframe for results

**EXAMPLE (GOOD - 55 words):**
"**Strengthen ${companyName} IT Infrastructure Performance (50/100)**. Address the 35-point gap to industry benchmark through standardized documentation and identification of top 3 friction points. This directly impacts operational efficiency with potential 20% reduction in system-related delays within 90 days. Track progress via monthly uptime metrics and support ticket volume."

**EXAMPLE (BAD - 12 words):**
"Strengthen IT Infrastructure Performance. This addresses a gap to benchmark."

Generate 3-5 Quick Wins following this format exactly.`;
}

/**
 * Enhanced prompt for generating Gap Analysis section in Manager Reports
 * Ensures minimum 50-75 words per gap with root cause and impact analysis
 */
export function buildManagerGapAnalysisPrompt(managerType: string, idm: IDM): string {
  const companyName = getCompanyName(idm);
  const managerTitles: Record<string, string> = {
    'financials_manager': 'Financials',
    'operations_manager': 'Operations',
    'sales_marketing_manager': 'Sales & Marketing',
    'strategy_manager': 'Strategy & Leadership',
    'it_technology_manager': 'IT & Technology'
  };
  const title = managerTitles[managerType] || 'Department';

  return `You are generating Gap Analysis for a premium ${title} Manager Report for ${companyName}.

**MANDATORY FORMAT FOR EACH GAP (50-75 words minimum):**

1. **Gap Identification**: "[Dimension] (XX/100 vs YY benchmark)"

2. **Root Cause Analysis**: WHY this gap exists (not just that it exists)

3. **Impact if Unaddressed**: Specific consequences of inaction

4. **Opportunity Upside**: Quantified benefit of closing the gap

5. **Connection to ${companyName}**: Company-specific context

**EXAMPLE (GOOD - 68 words):**
"The Marketing ROI gap at ${companyName} (45/100 vs 65 industry benchmark) stems from fragmented campaign tracking across multiple platforms and inconsistent attribution methodology. Without addressing this within 6-12 months, ${companyName} risks 15-20% marketing budget waste annually—approximately $XX,000 based on current spend. Closing this gap through centralized analytics investment could yield 2-3x improvement in customer acquisition efficiency."

**EXAMPLE (BAD - 8 words):**
"Marketing ROI needs attention with a low score."

Generate 3-4 Gap Analyses following this format exactly.`;
}

export default {
  buildComprehensiveBLUFPrompt,
  buildOwnerBLUFPrompt,
  buildExecutiveBriefBLUFPrompt,
  buildChapterBLUFPrompt,
  buildDimensionBLUFPrompt,
  buildFocusedReportBLUFPrompt,
  buildManagerReportBLUFPrompt,
  buildManagerQuickWinsPrompt,
  buildManagerGapAnalysisPrompt
};
