/**
 * Executive Overview Content Quality Validator
 *
 * Enforces: Zero generic consulting language per third-party specification.
 * Detects and flags prohibited patterns that reduce decision-grade quality.
 *
 * @module content-quality-validator
 */

import type { EnhancedExecutiveOverviewData } from '../../types/executive-overview.types.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentQualityResult {
  score: number;        // 0-100
  passing: boolean;     // score >= 75
  violations: ContentViolation[];
}

export interface ContentViolation {
  severity: 'critical' | 'warning';
  location: string;
  pattern: string;
  suggestion: string;
}

// ============================================================================
// PROHIBITED GENERIC PATTERNS
// Per third-party specification
// ============================================================================

interface GenericPattern {
  pattern: RegExp;
  suggestion: string;
  severity: 'critical' | 'warning';
}

const GENERIC_PATTERNS: GenericPattern[] = [
  {
    pattern: /conduct\s+(detailed\s+)?assessment/gi,
    suggestion: 'Replace with specific initiative: "Launch 6-week program to..."',
    severity: 'critical',
  },
  {
    pattern: /develop\s+(improvement\s+)?plan\s+with\s+(measurable\s+)?KPIs/gi,
    suggestion: 'State the actual KPIs: "Achieve 150 MQLs/month, reduce CPA to $85"',
    severity: 'critical',
  },
  {
    pattern: /implement\s+quick\s+wins/gi,
    suggestion: 'Name the specific quick wins: "Enable MFA, document top 3 workflows"',
    severity: 'critical',
  },
  {
    pattern: /monitor\s+(progress\s+)?(and\s+)?adjust/gi,
    suggestion: 'Specify what is monitored: "Track weekly pipeline velocity and conversion rates"',
    severity: 'critical',
  },
  {
    pattern: /document\s+and\s+share\s+best\s+practices/gi,
    suggestion: 'Name the practices: "Document customer onboarding workflow and sales qualification criteria"',
    severity: 'critical',
  },
  {
    pattern: /\bTBD\b/g,
    suggestion: 'Calculate or estimate actual value',
    severity: 'critical',
  },
  {
    pattern: /see\s+detailed\s+analysis/gi,
    suggestion: 'Provide the actual figure or reference specific report section',
    severity: 'critical',
  },
  {
    pattern: /presents?\s+(improvement\s+)?opportunities/gi,
    suggestion: 'Quantify the opportunity: "represents $50K-75K annual savings potential"',
    severity: 'warning',
  },
  {
    pattern: /should\s+be\s+addressed/gi,
    suggestion: 'State what action to take: "requires immediate implementation of..."',
    severity: 'warning',
  },
  {
    pattern: /Complete:\s+/gi,
    suggestion: 'Use business metrics instead of task completion',
    severity: 'critical',
  },
  {
    pattern: /\bAchieved\b(?!\s+\d)/gi,
    suggestion: 'Use measurable targets: "150/month → 300/month"',
    severity: 'warning',
  },
  {
    pattern: /consider\s+implementing/gi,
    suggestion: 'Be direct: "Implement X to achieve Y"',
    severity: 'warning',
  },
  {
    pattern: /explore\s+options\s+for/gi,
    suggestion: 'State the specific option: "Deploy cloud-based CRM system"',
    severity: 'warning',
  },
  {
    pattern: /address\s+gaps\s+in/gi,
    suggestion: 'Name the specific gap and solution',
    severity: 'warning',
  },
  {
    pattern: /leverage\s+existing/gi,
    suggestion: 'Be specific about what to leverage and how',
    severity: 'warning',
  },
  {
    pattern: /optimize\s+processes/gi,
    suggestion: 'Name the specific process and optimization',
    severity: 'warning',
  },
  {
    pattern: /enhance\s+capabilities/gi,
    suggestion: 'Specify which capability and how to enhance it',
    severity: 'warning',
  },
  {
    pattern: /drive\s+improvement/gi,
    suggestion: 'State the specific improvement with metrics',
    severity: 'warning',
  },
  {
    pattern: /as\s+needed\s*$/gi,
    suggestion: 'Define specific criteria for when action is needed',
    severity: 'warning',
  },
  {
    pattern: /going\s+forward/gi,
    suggestion: 'Specify timeframe: "Over the next 90 days" or "By Q2"',
    severity: 'warning',
  },
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate content quality of a single section
 *
 * @param content - The text content to validate
 * @param sectionName - Name of the section for error reporting
 * @returns Quality result with score and violations
 */
export function validateContentQuality(
  content: string,
  sectionName: string
): ContentQualityResult {
  const violations: ContentViolation[] = [];
  let score = 100;

  for (const { pattern, suggestion, severity } of GENERIC_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({
          severity,
          location: sectionName,
          pattern: match,
          suggestion,
        });
        score -= severity === 'critical' ? 15 : 5;
      }
    }
  }

  // Check for quantified impacts (numbers should be present)
  const hasQuantifiedImpact = /\d+%|\$[\d,]+|\d+\s*(hours|days|weeks|months|x\s*ROI)/i.test(content);
  if (!hasQuantifiedImpact && content.length > 100) {
    violations.push({
      severity: 'warning',
      location: sectionName,
      pattern: '[No quantified impact found]',
      suggestion: 'Add specific numbers: percentages, dollar amounts, or timeframes',
    });
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    passing: score >= 75,
    violations,
  };
}

/**
 * Validate entire Executive Overview report
 *
 * @param data - The Enhanced Executive Overview data
 * @param companyName - Company name for personalization check
 * @returns Quality result with score and violations
 */
export function validateExecutiveOverviewQuality(
  data: EnhancedExecutiveOverviewData,
  companyName: string
): ContentQualityResult {
  const allViolations: ContentViolation[] = [];
  let totalScore = 0;
  let sectionCount = 0;

  // Validate each section
  const sections = [
    {
      name: 'Executive Snapshot',
      content: data.executiveSnapshot.blufParagraph,
    },
    {
      name: 'Material Findings',
      content: data.materialFindings
        .map(f => `${f.diagnosis} ${f.implication}`)
        .join(' '),
    },
    {
      name: 'Strategic Priorities',
      content: data.strategicPriorities
        .map(p => `${p.whatDescription} ${p.whyItMatters}`)
        .join(' '),
    },
    {
      name: 'Key Risks',
      content: data.keyRisks
        .map(r => `${r.risk} ${r.mitigation}`)
        .join(' '),
    },
    {
      name: 'Financial Impact',
      content: JSON.stringify(data.financialImpact),
    },
    {
      name: 'Success Metrics',
      content: data.successMetrics
        .map(m => `${m.metric} ${m.targetValue}`)
        .join(' '),
    },
    {
      name: 'Bottom Line',
      content: data.bottomLine.summaryParagraph,
    },
  ];

  for (const section of sections) {
    const result = validateContentQuality(section.content, section.name);
    allViolations.push(...result.violations);
    totalScore += result.score;
    sectionCount++;
  }

  // Check company name appears throughout
  const fullContent = sections.map(s => s.content).join(' ');
  const companyNameCount = (fullContent.match(new RegExp(escapeRegExp(companyName), 'gi')) || []).length;
  if (companyNameCount < 3) {
    allViolations.push({
      severity: 'warning',
      location: 'Overall',
      pattern: `Company name appears only ${companyNameCount} times`,
      suggestion: 'Reference company name at least 3-5 times throughout report',
    });
    totalScore -= 10;
  }

  const avgScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;

  return {
    score: avgScore,
    passing: avgScore >= 75,
    violations: allViolations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if content contains specific numbers (not just placeholder text)
 */
export function hasSpecificNumbers(content: string): boolean {
  // Match actual numbers, not placeholders like [X] or {number}
  const numberPattern = /(?<!\[|\{)\b\d+(?:\.\d+)?(?:%|x|k|m|K|M)?\b(?!]|})/;
  return numberPattern.test(content);
}

/**
 * Check if content mentions specific dollar amounts
 */
export function hasDollarAmounts(content: string): boolean {
  return /\$[\d,]+(?:\.\d{2})?(?:\s*(?:k|m|K|M|million|thousand))?/.test(content);
}

/**
 * Check if content has specific timeframes
 */
export function hasSpecificTimeframes(content: string): boolean {
  return /\b(?:\d+\s*(?:days?|weeks?|months?|years?)|Q[1-4]\s*\d{4}|by\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i.test(content);
}

/**
 * Get suggestions for improving generic content
 */
export function getImprovementSuggestions(content: string): string[] {
  const suggestions: string[] = [];

  if (!hasSpecificNumbers(content)) {
    suggestions.push('Add quantified metrics (e.g., "15% improvement", "3.2x ROI")');
  }

  if (!hasDollarAmounts(content)) {
    suggestions.push('Include dollar impact estimates (e.g., "$50,000 annual savings")');
  }

  if (!hasSpecificTimeframes(content)) {
    suggestions.push('Specify concrete timeframes (e.g., "within 90 days", "by Q2 2024")');
  }

  // Check for action verb usage
  const strongActionVerbs = /\b(implement|deploy|launch|execute|establish|create|build)\b/gi;
  if (!strongActionVerbs.test(content)) {
    suggestions.push('Use strong action verbs (implement, deploy, launch, execute)');
  }

  return suggestions;
}

/**
 * Calculate overall content quality score
 */
export function calculateContentQualityScore(
  violations: ContentViolation[]
): number {
  let score = 100;

  for (const violation of violations) {
    score -= violation.severity === 'critical' ? 15 : 5;
  }

  return Math.max(0, score);
}

/**
 * Check if strategic priority has action-oriented title
 */
export function hasActionOrientedTitle(title: string): boolean {
  // Check for action verbs at the start
  const actionVerbPattern = /^(implement|deploy|launch|execute|establish|create|build|develop|transform|modernize|accelerate|strengthen|secure|optimize|streamline)/i;
  return actionVerbPattern.test(title);
}

/**
 * Validate that success criteria are observable outcomes, not checkboxes
 */
export function validateSuccessCriteria(criteria: string[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (const criterion of criteria) {
    // Flag checkbox-style criteria
    if (/^(?:Complete|Finish|Done|Achieved):?\s/i.test(criterion)) {
      issues.push(`"${criterion}" uses checkbox language - reframe as observable outcome`);
    }

    // Flag criteria without measurable elements
    if (!/\d+/.test(criterion) && !/increase|decrease|improve|reduce|achieve|reach/i.test(criterion)) {
      issues.push(`"${criterion}" may lack measurability - add specific metrics or outcomes`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export default {
  validateContentQuality,
  validateExecutiveOverviewQuality,
  hasSpecificNumbers,
  hasDollarAmounts,
  hasSpecificTimeframes,
  getImprovementSuggestions,
  calculateContentQualityScore,
  hasActionOrientedTitle,
  validateSuccessCriteria,
};
