/**
 * Employees Report Content Transformer
 *
 * PURPOSE: Apply "Positive Filter" to ReportContext data.
 * NEVER expose raw scores, gaps, risks, or negative performance data.
 * All content must be celebration-focused and employee-appropriate.
 *
 * This transformer extracts ONLY positive content from the ReportContext
 * and reframes any growth areas as empowering opportunities.
 */

import type {
  ReportContext,
  ReportDimension,
  ReportFinding,
  ReportRecommendation,
  ReportChapter,
} from '../../../types/report.types.js';
import type { DimensionCode } from '../../../types/idm.types.js';

// ============================================
// OUTPUT INTERFACES
// ============================================

export interface EmployeeNewsletterContent {
  companyName: string;
  assessmentDate: string;

  // Section 1: Welcome & Appreciation
  welcomeMessage: string;
  appreciationStatement: string;

  // Section 2: Big Wins (Top Strengths)
  bigWins: BigWin[];

  // Section 3: Team Strengths
  teamStrengths: TeamStrength[];

  // Section 4: Positive Benchmarks ("Did You Know?")
  benchmarkWins: BenchmarkWin[];

  // Section 5: Growth Investments (Reframed Recommendations)
  growthInvestments: GrowthInvestment[];

  // Section 6: Growth Ideas for Our Team (NEW)
  growthIdeas: GrowthIdea[];

  // Section 7: Closing
  closingMessage: string;
}

export interface GrowthIdea {
  icon: string;           // 🌱 | 📚 | 🚀 | 💡
  title: string;          // Employee-friendly title
  description: string;    // What this opportunity entails
  forYou: string;         // Individual benefit
  forUs: string;          // Company benefit
}

export interface BigWin {
  icon: string; // Celebratory emoji
  headline: string; // "Strong Customer Relationships"
  description: string; // Plain-language explanation
  teamCredit: string; // "Thanks to your dedication..."
}

export interface TeamStrength {
  icon: string;
  name: string; // Friendly strength name
  description: string; // What this means
  evidence?: string; // Positive data point (optional)
  customerImpact: string; // How it benefits customers/company
}

export interface BenchmarkWin {
  metric: string; // Plain-language metric name
  comparison: string; // "We outperform industry average"
  badge: string; // "Top Performer" / "Above Average"
}

export interface GrowthInvestment {
  icon: string;
  title: string; // "Investing in [X]" - action-oriented
  description: string; // What we're doing (NOT the problem)
  yourRole: string; // How employees can contribute
  outcome: string; // What success looks like
}

// ============================================
// DIMENSION METADATA FOR POSITIVE MESSAGING
// ============================================

const STRENGTH_HEADLINES: Record<string, string> = {
  FIN: 'Strong Financial Foundation',
  CXP: 'Exceptional Customer Relationships',
  OPS: 'Operational Excellence',
  SAL: 'Sales Team Success',
  MKT: 'Powerful Brand Presence',
  STR: 'Clear Strategic Direction',
  HRS: 'Outstanding Team Culture',
  LDG: 'Strong Leadership',
  TIN: 'Technology Innovation',
  ITD: 'Tech-Forward Operations',
  RMS: 'Smart Risk Management',
  CMP: 'Compliance Excellence',
};

const FRIENDLY_STRENGTH_NAMES: Record<string, string> = {
  FIN: 'Financial Stability',
  CXP: 'Customer Focus',
  OPS: 'Smooth Operations',
  SAL: 'Sales Excellence',
  MKT: 'Brand Strength',
  STR: 'Strategic Vision',
  HRS: 'Great Team Culture',
  LDG: 'Leadership Excellence',
  TIN: 'Innovation',
  ITD: 'Technology',
  RMS: 'Risk Awareness',
  CMP: 'Compliance',
};

const STRENGTH_DESCRIPTIONS: Record<string, string> = {
  FIN: 'Our financial practices keep the company stable and growing.',
  CXP: 'Our customers love working with us, and it shows.',
  OPS: 'We run a tight ship with efficient processes.',
  SAL: 'Our sales team consistently delivers results.',
  MKT: 'Our brand resonates with customers and stands out in the market.',
  STR: "We have a clear vision for where we're headed.",
  HRS: "We've built a team that works well together.",
  LDG: 'Our leadership provides clear direction and support.',
  TIN: 'We embrace new ideas and technologies.',
  ITD: 'Our technology enables us to work smarter.',
  RMS: 'We proactively identify and manage risks.',
  CMP: 'We maintain high standards of compliance and ethics.',
};

const CUSTOMER_IMPACTS: Record<string, string> = {
  FIN: 'This stability lets us invest in better service for you.',
  CXP: 'Happy customers are the heart of everything we do.',
  OPS: 'Efficient operations mean faster service and fewer headaches.',
  SAL: 'Strong sales mean job security and growth opportunities.',
  MKT: 'A strong brand attracts great customers and talent.',
  STR: "Clear strategy means everyone knows where we're going.",
  HRS: 'Great culture makes this a great place to work.',
  LDG: 'Strong leadership supports your success.',
  TIN: 'Innovation keeps us competitive and exciting.',
  ITD: 'Good tech makes your job easier.',
  RMS: 'Managing risks protects all of us.',
  CMP: 'High standards protect our reputation.',
};

// Employee-actionable role suggestions for growth investments (by dimension code)
const EMPLOYEE_HELP_PHRASES: Record<string, string> = {
  MKT: 'Share customer feedback and success stories',
  SAL: 'Suggest leads and referral opportunities',
  OPS: 'Flag process bottlenecks you encounter',
  HRS: 'Participate in training and mentorship',
  TEC: 'Report tech issues and suggest improvements',
  TIN: 'Report tech issues and suggest improvements',
  ITD: 'Report tech issues and suggest improvements',
  FIN: 'Help identify cost-saving opportunities',
  CXP: 'Share customer insights and feedback',
  STR: 'Share ideas during team discussions',
  LDG: 'Participate in leadership initiatives',
  RMS: 'Report potential risks you observe',
  CMP: 'Follow new guidelines as they roll out',
  default: 'Share your ideas with your manager',
};

// Fallback employee roles (used when no dimension-specific phrase available)
const EMPLOYEE_ROLES = [
  'Share your ideas for improvement',
  'Participate in training opportunities',
  'Help test new processes',
  "Provide feedback on what's working",
  'Mentor teammates through changes',
  'Celebrate small wins with your team',
  'Ask questions and stay curious',
  'Support your colleagues during transitions',
];

// Action verb mapping for investment titles
const ACTION_VERBS: Record<string, string> = {
  high: 'Building',
  medium: 'Launching',
  low: 'Strengthening',
};

// Friendly timeframe mapping
const TIMEFRAME_MAP: Record<string, string> = {
  '0-90': 'This Quarter',
  '90_days': 'This Quarter',
  '91-180': 'Next 6 Months',
  '12_months': 'Next 6 Months',
  '181-365+': 'This Year',
  '24_months_plus': 'This Year',
};

// Friendly area names from dimension codes
const FRIENDLY_AREA_NAMES: Record<string, string> = {
  STR: 'Our Strategy',
  SAL: 'Our Sales Capabilities',
  MKT: 'Our Marketing',
  CXP: 'Customer Experience',
  OPS: 'Our Operations',
  FIN: 'Financial Processes',
  HRS: 'Our Team & Culture',
  LDG: 'Leadership Development',
  TIN: 'Innovation',
  ITD: 'Technology & Systems',
  RMS: 'Risk Management',
  CMP: 'Compliance',
};

// ============================================
// MAIN TRANSFORMER FUNCTION
// ============================================

/**
 * Transform ReportContext data into employee-friendly newsletter content.
 * Applies a "positive filter" to ensure only celebratory content is included.
 */
export function transformForEmployeesNewsletter(
  ctx: ReportContext,
  companyName?: string
): EmployeeNewsletterContent {
  const name = companyName || ctx.companyProfile?.name || 'Our Company';

  return {
    companyName: name,
    assessmentDate: formatDate(ctx.metadata?.generatedAt || new Date().toISOString()),

    welcomeMessage: generateWelcomeMessage(name),
    appreciationStatement: generateAppreciation(name),

    bigWins: extractBigWins(ctx),
    teamStrengths: extractTeamStrengths(ctx),
    benchmarkWins: extractPositiveBenchmarks(ctx),
    growthInvestments: extractGrowthInvestments(ctx),
    growthIdeas: extractGrowthIdeas(ctx),

    closingMessage: generateClosingMessage(),
  };
}

// ============================================
// EXTRACTION FUNCTIONS (Positive Filter Logic)
// ============================================

/**
 * Extract top 3 highest-scoring dimensions as "Big Wins"
 * These become the hero cards in the newsletter
 * FIX 1: Now includes quantified metrics from findings
 */
function extractBigWins(ctx: ReportContext): BigWin[] {
  const wins: BigWin[] = [];

  // First, try to get strength findings with quantified evidence
  const strengthFindings = (ctx.findings || []).filter(
    (f) =>
      f.type === 'strength' &&
      f.narrative &&
      (f.narrative.includes('%') || /\d+/.test(f.narrative))
  );

  // Sort dimensions by score descending, take top 3
  const topDimensions = [...(ctx.dimensions || [])]
    .filter((d) => d.score !== undefined && d.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  const winIcons = ['🏆', '⭐', '🎯'];

  for (let i = 0; i < topDimensions.length; i++) {
    const dim = topDimensions[i];
    const code = dim.code || '';
    const score = dim.score || 0;

    // Try to find a quantified finding for this dimension
    const dimFinding = strengthFindings.find((f) => f.dimensionCode === code);

    // Build description with metric
    let description: string;
    let teamCredit: string;

    if (dimFinding && dimFinding.narrative) {
      // Use the finding narrative with metric
      description = extractPlainLanguageMetric(dimFinding.narrative, dim.name || '');
      teamCredit = getTeamCreditFromFinding(dimFinding, dim.name || '');
    } else {
      // Fallback: Use percentile comparison if available
      const benchmark = dim.benchmark;
      if (benchmark && benchmark.peerPercentile && benchmark.peerPercentile >= 50) {
        const percentileRank = 100 - benchmark.peerPercentile;
        description = `${dim.name || 'This area'} at ${score}% puts us in the top ${percentileRank}% of industry peers.`;
        teamCredit = `Thanks to your dedication to ${dim.name?.toLowerCase() || 'excellence'}, we're outperforming the competition.`;
      } else if (score >= 70) {
        description = `Our ${dim.name?.toLowerCase() || 'performance'} score of ${score}/100 shows we're excelling in this area.`;
        teamCredit = `Your hard work has helped us achieve above-average results in ${dim.name?.toLowerCase() || 'this area'}.`;
      } else {
        description = getStrengthDescription(code, dim.name);
        teamCredit = `Your commitment to ${dim.name?.toLowerCase() || 'excellence'} makes this possible.`;
      }
    }

    wins.push({
      icon: winIcons[i] || '🌟',
      headline: getStrengthHeadline(code, dim.name),
      description,
      teamCredit,
    });
  }

  return wins;
}

/**
 * Extract a plain-language metric from a finding narrative
 */
function extractPlainLanguageMetric(narrative: string, dimensionName: string): string {
  // Look for percentage patterns like "85% satisfaction" or "retention rate of 92%"
  const percentMatch = narrative.match(/(\d+)%\s*(satisfaction|retention|growth|improvement|increase|rating)?/i);
  if (percentMatch) {
    const percent = percentMatch[1];
    const metric = percentMatch[2] || 'rating';
    return `${dimensionName} scores reached ${percent}% ${metric.toLowerCase()}.`;
  }

  // Look for score patterns like "score of 85"
  const scoreMatch = narrative.match(/score\s*(?:of\s*)?(\d+)/i);
  if (scoreMatch) {
    return `Our ${dimensionName.toLowerCase()} score reached ${scoreMatch[1]} points.`;
  }

  // If we can't extract a specific metric, use the narrative but clean it up
  // Limit to first sentence if it's long
  const firstSentence = narrative.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length < 150) {
    return firstSentence + '.';
  }

  return `We're achieving strong results in ${dimensionName.toLowerCase()}.`;
}

/**
 * Generate team credit based on finding context
 */
function getTeamCreditFromFinding(finding: ReportFinding, dimensionName: string): string {
  const dimLower = dimensionName.toLowerCase();

  // Map dimension-related keywords to appropriate team credits
  if (dimLower.includes('customer') || dimLower.includes('experience')) {
    return 'Thanks to your dedication to service quality.';
  }
  if (dimLower.includes('sales')) {
    return "Your persistence and customer focus made this happen.";
  }
  if (dimLower.includes('operation') || dimLower.includes('efficiency')) {
    return 'Your attention to process improvement is paying off.';
  }
  if (dimLower.includes('team') || dimLower.includes('culture') || dimLower.includes('hr')) {
    return 'You make this a great place to work.';
  }
  if (dimLower.includes('financial')) {
    return 'Your cost-consciousness and smart decisions are working.';
  }

  return `Thanks to your commitment to ${dimLower}.`;
}

/**
 * Extract 4-5 team strengths from dimensions scoring 50+
 * If fewer than 4 qualify, take relative top performers
 * FIX 2: Now includes quantified evidence with score/percentile
 */
function extractTeamStrengths(ctx: ReportContext): TeamStrength[] {
  const strengths: TeamStrength[] = [];
  const strengthIcons = ['💪', '🤝', '🚀', '💡', '🎖️'];

  // Get dimensions scoring 60+ (threshold for strengths)
  const qualifyingDimensions = [...(ctx.dimensions || [])]
    .filter((d) => d.score !== undefined && d.score !== null && d.score >= 60)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Filter out dimensions already used in bigWins (top 3)
  const remaining = qualifyingDimensions.slice(3);

  // Take up to 5 strengths
  const selected = remaining.slice(0, 5);

  // If we don't have enough from 60+ scoring, fill in with top remaining dimensions
  if (selected.length < 3) {
    const allSorted = [...(ctx.dimensions || [])]
      .filter((d) => d.score !== undefined && d.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(3); // Exclude top 3 used for big wins

    const additionalNeeded = 5 - selected.length;
    const additional = allSorted
      .filter((d) => !selected.find((s) => s.code === d.code))
      .slice(0, additionalNeeded);
    selected.push(...additional);
  }

  for (let i = 0; i < selected.length; i++) {
    const dim = selected[i];
    const code = dim.code || '';
    const score = dim.score || 0;

    // Build quantified evidence string
    let evidence: string;
    const benchmark = dim.benchmark;

    if (benchmark && benchmark.peerPercentile && benchmark.peerPercentile >= 50) {
      const percentileRank = 100 - benchmark.peerPercentile;
      evidence = `Score: ${score}/100 | Top ${percentileRank}%`;
    } else if (benchmark && benchmark.description) {
      evidence = `Score: ${score}/100 | ${benchmark.description}`;
    } else if (score >= 70) {
      evidence = `Score: ${score}/100 | Above industry average`;
    } else if (score >= 60) {
      evidence = `Score: ${score}/100 | Meeting industry standards`;
    } else {
      evidence = `Score: ${score}/100`;
    }

    // Get impact statement
    const impact = getStrengthImpact(code, dim.name);

    strengths.push({
      icon: strengthIcons[i] || '⭐',
      name: getFriendlyStrengthName(code, dim.name),
      description: getStrengthDescription(code, dim.name),
      evidence,
      customerImpact: impact,
    });
  }

  return strengths;
}

/**
 * Get employee-focused impact statement for a strength
 */
function getStrengthImpact(code: string, name?: string): string {
  const impactMap: Record<string, string> = {
    FIN: 'This stability enables us to invest in your growth and our future.',
    CXP: 'Happy customers create a positive work environment for everyone.',
    OPS: 'Efficient processes mean less stress and more time for what matters.',
    SAL: 'Strong sales performance means job security and bonus opportunities.',
    MKT: 'A recognized brand attracts both great customers and great talent.',
    STR: 'Clear strategy means you know how your work contributes to our success.',
    HRS: 'Our culture makes this a rewarding place to build your career.',
    LDG: 'Strong leadership means you get the support you need to succeed.',
    TIN: 'Innovation keeps our work interesting and our skills relevant.',
    ITD: 'Great technology makes your daily work easier and more productive.',
    RMS: 'Proactive risk management protects our jobs and our future.',
    CMP: 'Our compliance standards protect the company and your career.',
  };

  return impactMap[code] || CUSTOMER_IMPACTS[code] || 'This benefits our customers and team.';
}

/**
 * Extract ONLY positive benchmark comparisons
 * CRITICAL: If company < industry, OMIT entirely (don't show negative)
 */
function extractPositiveBenchmarks(ctx: ReportContext): BenchmarkWin[] {
  const wins: BenchmarkWin[] = [];

  // Check dimensions for benchmark data
  for (const dim of ctx.dimensions || []) {
    if (dim.benchmark) {
      const companyScore = dim.score || 0;
      // Only include if we have benchmark data and company meets or exceeds
      // Use peerPercentile > 50 as "above average"
      if (dim.benchmark.peerPercentile && dim.benchmark.peerPercentile >= 50) {
        wins.push({
          metric: getFriendlyStrengthName(dim.code || '', dim.name),
          comparison: `We outperform the industry average in ${dim.name?.toLowerCase() || 'this area'}`,
          badge: getPerformanceBadge(dim.benchmark.peerPercentile),
        });
      }
    }
  }

  // Also check chapters for benchmark data
  for (const chapter of ctx.chapters || []) {
    if (chapter.benchmark && chapter.benchmark.peerPercentile >= 50) {
      wins.push({
        metric: chapter.name || 'Business Performance',
        comparison: `We rank in the top ${100 - chapter.benchmark.peerPercentile}% for ${chapter.name?.toLowerCase() || 'this area'}`,
        badge: getPerformanceBadge(chapter.benchmark.peerPercentile),
      });
    }
  }

  // Return max 3 benchmark wins
  return wins.slice(0, 3);
}

/**
 * Transform Recommendations into "Growth Investments"
 * CRITICAL: Do NOT show the gap/problem - only the investment
 * FIX 3: Improved titles and descriptions with proper verb framing
 */
function extractGrowthInvestments(ctx: ReportContext): GrowthInvestment[] {
  const investments: GrowthInvestment[] = [];
  const investmentIcons = ['🌱', '📈', '🔧', '🎓', '💼'];

  // Get high-impact recommendations (priorityRank 1-3 or impactScore >= 7)
  const recommendations = (ctx.recommendations || [])
    .filter((r) => r.priorityRank <= 3 || r.impactScore >= 7)
    .slice(0, 3);

  // Fallback: if no high-impact, take top 3 by priority
  const selected =
    recommendations.length > 0
      ? recommendations
      : (ctx.recommendations || []).sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 3);

  for (let i = 0; i < selected.length; i++) {
    const rec = selected[i];
    const dimCode = rec.dimensionCode || '';

    // FIX 3: Create grammatically correct title with action verb
    const title = createInvestmentTitle(rec);

    // FIX 3: Use roadmap or expected outcome for description
    const description = createInvestmentDescription(rec, ctx);

    // FIX 3: Use dimension-specific help phrase
    const yourRole =
      EMPLOYEE_HELP_PHRASES[dimCode] ||
      EMPLOYEE_HELP_PHRASES['default'] ||
      EMPLOYEE_ROLES[i % EMPLOYEE_ROLES.length];

    // FIX 3: Include friendly timeframe
    const outcome = createPositiveOutcome(rec);

    investments.push({
      icon: investmentIcons[i] || '🌟',
      title,
      description,
      yourRole,
      outcome,
    });
  }

  return investments;
}

/**
 * FIX 3: Create a grammatically correct investment title
 * Uses action verbs and the area name, not the raw recommendation theme
 */
function createInvestmentTitle(rec: ReportRecommendation): string {
  const dimCode = rec.dimensionCode || '';
  const areaName = FRIENDLY_AREA_NAMES[dimCode] || rec.dimensionName || 'Our Business';

  // Determine action verb based on priority (high priority = building, low = strengthening)
  let actionVerb: string;
  if (rec.priorityRank <= 2 || rec.impactScore >= 8) {
    actionVerb = 'Building';
  } else if (rec.priorityRank <= 4) {
    actionVerb = 'Launching';
  } else {
    actionVerb = 'Strengthening';
  }

  // Avoid duplicate words - check if area already implies the action
  const theme = (rec.theme || '').toLowerCase();
  if (theme.includes('build') || theme.includes('launch') || theme.includes('strengthen')) {
    // Extract the noun/object from the theme
    const cleanTheme = extractNounPhrase(rec.theme);
    if (cleanTheme) {
      return cleanTheme;
    }
  }

  return `${actionVerb} ${areaName}`;
}

/**
 * Extract noun phrase from recommendation theme
 */
function extractNounPhrase(theme: string): string {
  // Remove common action verbs to get the noun phrase
  const cleaned = theme
    .replace(/^(improve|enhance|develop|implement|establish|strengthen|build|launch|create|fix)\s+/i, '')
    .replace(/^(the|our|a)\s+/i, '')
    .trim();

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * FIX 3: Create investment description from roadmap or expected outcomes
 */
function createInvestmentDescription(rec: ReportRecommendation, ctx: ReportContext): string {
  // Try to find roadmap phase with this recommendation
  const roadmapPhase = ctx.roadmap?.phases?.find((p) =>
    p.linkedRecommendationIds?.includes(rec.id)
  );

  if (roadmapPhase && roadmapPhase.narrative) {
    // Clean up roadmap narrative for employee consumption
    const cleanNarrative = roadmapPhase.narrative
      .replace(/gap|issue|problem|weakness|deficiency/gi, 'opportunity')
      .replace(/risk/gi, 'consideration');
    return cleanNarrative.length <= 200 ? cleanNarrative : cleanNarrative.slice(0, 197) + '...';
  }

  // Use expected outcomes if available
  if (rec.expectedOutcomes) {
    const outcome = rec.expectedOutcomes
      .replace(/reduce risk|mitigate/gi, 'improve')
      .replace(/gaps|issues/gi, 'opportunities');
    return `We're investing in this area to ${outcome.toLowerCase()}`;
  }

  // Get friendly timeframe
  const timeframe = TIMEFRAME_MAP[rec.horizon] || 'the coming months';
  const areaName = FRIENDLY_AREA_NAMES[rec.dimensionCode] || rec.dimensionName || 'this area';

  return `We're making investments to strengthen ${areaName.toLowerCase()} and better serve our customers over ${timeframe.toLowerCase()}.`;
}

/**
 * FIX 3: Create positive outcome with timeframe
 */
function createPositiveOutcome(rec: ReportRecommendation): string {
  const timeframe = TIMEFRAME_MAP[rec.horizon] || 'Soon';

  if (rec.expectedOutcomes) {
    // Clean any negative language
    const outcome = rec.expectedOutcomes
      .replace(/reduce risk|mitigate|prevent|avoid/gi, 'improve')
      .replace(/gaps|issues|problems/gi, 'results');

    // Keep it concise
    const firstSentence = outcome.split(/[.!?]/)[0].trim();
    if (firstSentence.length < 100) {
      return `${timeframe}: ${firstSentence}.`;
    }
  }

  // Default positive outcome
  return `${timeframe}: Stronger capabilities and new opportunities for growth.`;
}

/**
 * FIX 4: Extract growth ideas for employees
 * Sources HR/Development recommendations and creates employee-focused opportunities
 */
function extractGrowthIdeas(ctx: ReportContext): GrowthIdea[] {
  const ideas: GrowthIdea[] = [];
  const growthIcons = ['🌱', '📚', '🚀', '💡'];

  // Primary: Find HR/Development recommendations
  const growthRecommendations = (ctx.recommendations || []).filter(
    (r) =>
      ['HRS', 'LDG'].includes(r.dimensionCode) ||
      (r.theme && r.theme.toLowerCase().includes('training')) ||
      (r.theme && r.theme.toLowerCase().includes('development')) ||
      (r.theme && r.theme.toLowerCase().includes('culture')) ||
      (r.theme && r.theme.toLowerCase().includes('team'))
  );

  // Create ideas from recommendations
  for (let i = 0; i < Math.min(growthRecommendations.length, 4); i++) {
    const rec = growthRecommendations[i];
    ideas.push({
      icon: growthIcons[i] || '🌱',
      title: createGrowthIdeaTitle(rec),
      description: createGrowthIdeaDescription(rec),
      forYou: getIndividualBenefit(rec),
      forUs: getCompanyBenefit(rec),
    });
  }

  // If we have fewer than 3 ideas, add defaults based on dimension gaps
  if (ideas.length < 3) {
    const defaultIdeas = getDefaultGrowthIdeas(ctx);
    const needed = 3 - ideas.length;
    for (let i = 0; i < needed && i < defaultIdeas.length; i++) {
      ideas.push(defaultIdeas[i]);
    }
  }

  // Log warning if using defaults
  if (ideas.length === 0 || ideas.every((i) => !i.description.includes('based on'))) {
    console.warn('[employees-transformer] Using default growth ideas - no HR recommendations found');
  }

  return ideas.slice(0, 4); // Max 4 growth ideas
}

/**
 * Create employee-friendly title for a growth idea
 */
function createGrowthIdeaTitle(rec: ReportRecommendation): string {
  const theme = rec.theme || '';

  // Extract the key topic and make it employee-focused
  if (theme.toLowerCase().includes('training')) {
    return 'Professional Development';
  }
  if (theme.toLowerCase().includes('development')) {
    return 'Skill Building Opportunities';
  }
  if (theme.toLowerCase().includes('culture')) {
    return 'Culture & Team Building';
  }
  if (theme.toLowerCase().includes('leadership')) {
    return 'Leadership Growth';
  }
  if (theme.toLowerCase().includes('performance')) {
    return 'Performance Excellence';
  }
  if (theme.toLowerCase().includes('feedback')) {
    return 'Feedback & Recognition';
  }

  // Default: clean up the theme
  const cleaned = theme
    .replace(/^(improve|enhance|develop|implement|establish)\s+/i, '')
    .replace(/processes?|systems?|frameworks?/gi, '')
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'Growth Opportunity';
}

/**
 * Create description for growth idea
 */
function createGrowthIdeaDescription(rec: ReportRecommendation): string {
  if (rec.expectedOutcomes) {
    // Clean up and make employee-focused
    const outcome = rec.expectedOutcomes
      .replace(/company|organization|business/gi, 'team')
      .replace(/improve|enhance/gi, 'build');

    const firstSentence = outcome.split(/[.!?]/)[0].trim();
    if (firstSentence.length < 120) {
      return `We're exploring ways to ${firstSentence.toLowerCase()}.`;
    }
  }

  // Use action steps if available
  if (rec.actionSteps && rec.actionSteps.length > 0) {
    const step = rec.actionSteps[0]
      .replace(/^(implement|establish|develop|create)/i, 'explore')
      .toLowerCase();
    return `We're planning to ${step}.`;
  }

  return "We're exploring opportunities based on team feedback.";
}

/**
 * Get individual benefit for growth idea
 */
function getIndividualBenefit(rec: ReportRecommendation): string {
  const dimCode = rec.dimensionCode || '';

  const benefitMap: Record<string, string> = {
    HRS: 'Build skills that advance your career',
    LDG: 'Develop leadership capabilities',
    TIN: 'Learn cutting-edge technologies',
    OPS: 'Master efficient work processes',
    SAL: 'Sharpen your customer skills',
    MKT: 'Expand your marketing expertise',
    CXP: 'Become a customer experience expert',
  };

  return benefitMap[dimCode] || 'Grow professionally with new opportunities';
}

/**
 * Get company benefit for growth idea
 */
function getCompanyBenefit(rec: ReportRecommendation): string {
  const dimCode = rec.dimensionCode || '';

  const benefitMap: Record<string, string> = {
    HRS: 'A more capable, confident team',
    LDG: 'Stronger leadership pipeline',
    TIN: 'Enhanced innovation capabilities',
    OPS: 'Improved operational efficiency',
    SAL: 'Increased sales performance',
    MKT: 'Stronger market presence',
    CXP: 'Better customer relationships',
  };

  return benefitMap[dimCode] || 'A stronger, more capable organization';
}

/**
 * Get default growth ideas when no HR recommendations exist
 */
function getDefaultGrowthIdeas(ctx: ReportContext): GrowthIdea[] {
  const defaults: GrowthIdea[] = [];

  // Check if HR dimension needs improvement - create relevant defaults
  const hrDimension = ctx.dimensions?.find((d) => d.code === 'HRS');
  const ldgDimension = ctx.dimensions?.find((d) => d.code === 'LDG');

  defaults.push({
    icon: '📚',
    title: 'Skill Development',
    description: "We're exploring training opportunities based on team feedback.",
    forYou: 'Build skills that advance your career',
    forUs: 'A more capable, confident team',
  });

  defaults.push({
    icon: '🤝',
    title: 'Team Collaboration',
    description: "We're looking for ways to strengthen how we work together.",
    forYou: 'Better teamwork and communication',
    forUs: 'More effective cross-functional work',
  });

  defaults.push({
    icon: '💡',
    title: 'Innovation & Ideas',
    description: 'We want to hear your ideas for how we can improve.',
    forYou: 'Your voice shapes our future',
    forUs: 'Fresh perspectives and creative solutions',
  });

  defaults.push({
    icon: '🎯',
    title: 'Career Growth',
    description: "We're committed to helping you grow within the company.",
    forYou: 'Clear paths for advancement',
    forUs: 'Retaining our best talent',
  });

  return defaults;
}

// ============================================
// HELPER FUNCTIONS (Positive Messaging)
// ============================================

function getStrengthHeadline(code: string, fallbackName?: string): string {
  return STRENGTH_HEADLINES[code] || `Excellence in ${fallbackName || 'Business'}`;
}

function getFriendlyStrengthName(code: string, fallbackName?: string): string {
  return FRIENDLY_STRENGTH_NAMES[code] || fallbackName || 'Business Excellence';
}

function getStrengthDescription(code: string, fallbackName?: string): string {
  return (
    STRENGTH_DESCRIPTIONS[code] || `We excel in ${fallbackName?.toLowerCase() || 'this area'}.`
  );
}

function getCustomerImpact(code: string, fallbackName?: string): string {
  return CUSTOMER_IMPACTS[code] || 'This benefits our customers and team.';
}

function getPerformanceBadge(percentile: number): string {
  if (percentile >= 80) return 'Top Performer';
  if (percentile >= 65) return 'Above Average';
  return 'Competitive';
}

function generateWelcomeMessage(companyName: string): string {
  return `Welcome to your ${companyName} Team Update! We're excited to share some highlights of what we've accomplished together and where we're headed next.`;
}

function generateAppreciation(companyName: string): string {
  return `Every success we achieve is because of your hard work, dedication, and teamwork. ${companyName} wouldn't be where it is today without each and every one of you. Thank you for everything you do!`;
}

function generateClosingMessage(): string {
  return `Together, we've built something special—and the best is yet to come. Your ideas, your energy, and your commitment make all the difference. Here's to an even stronger year ahead!`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

export default transformForEmployeesNewsletter;
