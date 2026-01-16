/**
 * BizHealth Narrative Personalization Utility
 *
 * Ensures company name appears 3-5x more frequently throughout narrative prose.
 * Premium consulting reports are ruthlessly specific—never generic.
 *
 * PHASE 0: Premium Report Quality Transformation
 *
 * Target Metrics:
 * - Company name frequency: 50+ mentions per comprehensive report
 * - Generic language reduction: <10% of total narrative
 */

import type { ReportCompanyProfile } from '../../../types/report.types.js';
import type { ReportFinding } from '../../../types/report.types.js';
import { getScoreBand } from './color-utils.js';

// ============================================================================
// PERSONALIZATION CONTEXT
// ============================================================================

/**
 * Context for narrative personalization
 */
export interface PersonalizationContext {
  companyName: string;
  industry: string;
  companySize?: string;
  employeeCount?: number;
  yearsInBusiness?: number;
  location?: string;
  lifecycleStage?: string;
}

/**
 * Create personalization context from company profile
 */
export function createPersonalizationContext(profile: ReportCompanyProfile): PersonalizationContext {
  return {
    companyName: profile.name,
    industry: profile.industry || 'the industry',
    companySize: profile.companySize,
    employeeCount: profile.employeeCount,
    yearsInBusiness: profile.yearsInBusiness,
    location: profile.location,
    lifecycleStage: profile.lifecycleStage,
  };
}

// ============================================================================
// NARRATIVE PERSONALIZATION
// ============================================================================

/**
 * Replace generic business language with company-specific language
 *
 * Premium consulting standard: Never say "your business" when you can say "Acme Corp"
 */
export function personalizeNarrative(
  genericText: string,
  ctx: PersonalizationContext
): string {
  if (!genericText || !ctx.companyName) return genericText;

  let personalized = genericText
    // Direct company references
    .replace(/\byour business\b/gi, ctx.companyName)
    .replace(/\byour company\b/gi, ctx.companyName)
    .replace(/\bthe company\b/gi, ctx.companyName)
    .replace(/\bthis organization\b/gi, ctx.companyName)
    .replace(/\bthe organization\b/gi, ctx.companyName)
    .replace(/\byour organization\b/gi, ctx.companyName)
    .replace(/\bthe business\b/gi, ctx.companyName)
    .replace(/\byour firm\b/gi, ctx.companyName)
    .replace(/\bthe firm\b/gi, ctx.companyName);

  // Industry-specific references
  personalized = personalized
    .replace(/\bindustry peers\b/gi, `${ctx.industry} peers`)
    .replace(/\bsimilar companies\b/gi, `comparable ${ctx.industry} companies`)
    .replace(/\bmarket competitors\b/gi, `${ctx.industry} competitors`)
    .replace(/\byour industry\b/gi, `the ${ctx.industry} industry`)
    .replace(/\bsector peers\b/gi, `${ctx.industry} sector peers`);

  return personalized;
}

/**
 * Ensure minimum company name frequency in text
 *
 * If company name appears less than target frequency, strategically inject it
 */
export function ensureCompanyNameFrequency(
  text: string,
  companyName: string,
  targetFrequencyPerParagraph: number = 2
): string {
  if (!text || !companyName) return text;

  const paragraphs = text.split(/\n\n+/);
  const enhancedParagraphs = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return paragraph;

    const namePattern = new RegExp(companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const currentCount = (paragraph.match(namePattern) || []).length;

    if (currentCount >= targetFrequencyPerParagraph) {
      return paragraph;
    }

    // Strategic injection points: after sentences that start with generic subjects
    const injectionPatterns = [
      { pattern: /(\. This )(?!specifically)/gi, replacement: `. For ${companyName}, this ` },
      { pattern: /(\. It )(?!is worth)/gi, replacement: `. ${companyName} ` },
      { pattern: /^(The analysis )/i, replacement: `The analysis of ${companyName} ` },
      { pattern: /(\. The assessment )/gi, replacement: `. ${companyName}'s assessment ` },
    ];

    let enhanced = paragraph;
    let injectedCount = currentCount;

    for (const { pattern, replacement } of injectionPatterns) {
      if (injectedCount >= targetFrequencyPerParagraph) break;

      const matches = enhanced.match(pattern);
      if (matches && matches.length > 0) {
        enhanced = enhanced.replace(pattern, replacement);
        injectedCount++;
      }
    }

    return enhanced;
  });

  return enhancedParagraphs.join('\n\n');
}

// ============================================================================
// COMPANY-SPECIFIC CALLOUTS
// ============================================================================

/**
 * Generate company-specific callout box content
 */
export function generateCompanySpecificCallout(
  finding: ReportFinding,
  ctx: PersonalizationContext
): string {
  const typeStyles: Record<string, { icon: string; cssClass: string; intro: string[] }> = {
    strength: {
      icon: '&#10004;',
      cssClass: 'success',
      intro: [
        `${ctx.companyName} demonstrates clear competitive advantage here.`,
        `This represents one of ${ctx.companyName}'s distinctive strengths.`,
        `${ctx.companyName} excels in this area relative to ${ctx.industry} peers.`,
      ],
    },
    gap: {
      icon: '&#9888;',
      cssClass: 'warning',
      intro: [
        `${ctx.companyName} faces a meaningful gap requiring attention.`,
        `This area constrains ${ctx.companyName}'s growth potential.`,
        `${ctx.companyName} underperforms ${ctx.industry} benchmarks here.`,
      ],
    },
    risk: {
      icon: '&#9888;',
      cssClass: 'critical',
      intro: [
        `${ctx.companyName} must address this vulnerability promptly.`,
        `This risk poses material concern for ${ctx.companyName}'s stability.`,
        `Without intervention, this could significantly impact ${ctx.companyName}.`,
      ],
    },
    opportunity: {
      icon: '&#128161;',
      cssClass: 'insight',
      intro: [
        `${ctx.companyName} has untapped potential in this area.`,
        `This represents a growth lever for ${ctx.companyName}.`,
        `${ctx.companyName} could gain competitive advantage by acting here.`,
      ],
    },
  };

  const style = typeStyles[finding.type] || typeStyles.gap;
  const intro = style.intro[Math.floor(Math.random() * style.intro.length)];

  return `
    <div class="callout ${style.cssClass}" style="
      padding: 1.25rem;
      border-radius: 8px;
      margin: 1rem 0;
      page-break-inside: avoid;
    ">
      <div class="callout-header" style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      ">
        <span class="callout-icon" style="font-size: 1.2rem;">${style.icon}</span>
        <strong style="color: #212653;">${finding.shortLabel}</strong>
      </div>
      <p style="margin: 0; line-height: 1.6;">
        ${intro} ${personalizeNarrative(finding.narrative, ctx)}
      </p>
    </div>
  `;
}

// ============================================================================
// CHAPTER OPENING NARRATIVE
// ============================================================================

/**
 * Context for generating chapter opening narratives
 */
export interface ChapterNarrativeContext {
  chapterCode: string;
  chapterName: string;
  chapterScore: number;
  benchmarkPercentile: number;
  topStrengths: ReportFinding[];
  topGaps: ReportFinding[];
  companyName: string;
  industryContext: string;
  overallHealthScore: number;
}

/**
 * Get score band interpretation for narrative
 */
function getScoreBandInterpretation(band: string, chapterName: string): string {
  const interpretations: Record<string, string> = {
    Excellence: `that ${chapterName} is a competitive strength to be protected and leveraged`,
    Proficiency: `solid foundations with targeted opportunities for optimization`,
    Attention: `meaningful gaps requiring strategic intervention within the next 6-12 months`,
    Critical: `urgent vulnerabilities that pose material risk to business continuity and growth`,
  };
  return interpretations[band] || 'areas requiring review';
}

/**
 * Describe the pattern of findings within a chapter
 */
function describeChapterPattern(ctx: ChapterNarrativeContext): string {
  if (ctx.topStrengths.length > 0 && ctx.topGaps.length > 0) {
    return `mixed performance—clear strengths coexisting with addressable weaknesses`;
  } else if (ctx.topStrengths.length > 0) {
    return `consistent strength across dimensions`;
  } else if (ctx.topGaps.length > 0) {
    return `systemic underperformance requiring comprehensive intervention`;
  }
  return `varied performance across dimensions`;
}

/**
 * Get the business impact of a gap finding
 */
function getGapImpact(gap: ReportFinding): string {
  const impactMap: Record<string, string> = {
    STR: 'compete effectively in the market',
    SAL: 'achieve revenue growth targets',
    MKT: 'acquire customers cost-effectively',
    CXP: 'retain and grow customer relationships',
    OPS: 'operate efficiently at scale',
    FIN: 'maintain financial health and access capital',
    HRS: 'attract and retain top talent',
    LDG: 'make timely strategic decisions',
    TIN: 'innovate and adapt to market changes',
    IDS: 'leverage data and technology effectively',
    RMS: 'manage risk and ensure business continuity',
    CMP: 'meet regulatory requirements and avoid penalties',
  };
  return impactMap[gap.dimensionCode] || 'achieve strategic objectives';
}

/**
 * Generate strategic opening narrative for chapter sections
 *
 * Premium consulting standard: 2-3 paragraphs before any tables/bullets
 * explaining context, performance, and implications for THIS company.
 */
export function generateChapterOpeningNarrative(ctx: ChapterNarrativeContext): string {
  const scoreBand = getScoreBand(ctx.chapterScore);
  const benchmarkComparison =
    ctx.benchmarkPercentile >= 50
      ? `outperforming ${100 - ctx.benchmarkPercentile}% of`
      : `trailing ${ctx.benchmarkPercentile}% of`;

  const strengthsNarrative =
    ctx.topStrengths.length > 0
      ? `Notably, ${ctx.topStrengths[0].shortLabel} represents a genuine competitive advantage that ${ctx.companyName} can leverage for growth.`
      : '';

  const gapsNarrative =
    ctx.topGaps.length > 0
      ? `However, ${ctx.topGaps[0].shortLabel} requires immediate attention—this gap directly constrains ${ctx.companyName}'s ability to ${getGapImpact(ctx.topGaps[0])}.`
      : '';

  const trajectoryInsight =
    ctx.chapterScore < ctx.overallHealthScore
      ? `This chapter's underperformance is dragging down ${ctx.companyName}'s overall health score.`
      : `This chapter is contributing positively to ${ctx.companyName}'s overall health trajectory.`;

  return `
    <div class="chapter-strategic-context" style="
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-left: 4px solid #969423;
      border-radius: 0 8px 8px 0;
      padding: 1.5rem;
      margin: 1.5rem 0 2rem 0;
      page-break-inside: avoid;
    ">
      <p class="lead-paragraph" style="
        font-size: 1.05rem;
        line-height: 1.7;
        color: #333;
        margin-bottom: 1rem;
      ">
        <strong>${ctx.companyName}'s ${ctx.chapterName}</strong> performance, scoring
        <strong style="color: #212653;">${ctx.chapterScore}/100</strong>, places the company in the
        <strong style="color: #212653;">${ctx.benchmarkPercentile}th percentile</strong>—${benchmarkComparison}
        ${ctx.industryContext} peers. This <span style="color: #212653;">${scoreBand.toLowerCase()}</span> rating signals
        ${getScoreBandInterpretation(scoreBand, ctx.chapterName)}.
      </p>

      <p style="
        font-size: 1rem;
        line-height: 1.7;
        color: #444;
        margin-bottom: 1rem;
      ">
        This chapter's assessment reveals a pattern of ${describeChapterPattern(ctx)}.
        ${strengthsNarrative} ${gapsNarrative}
      </p>

      <p style="
        font-size: 1rem;
        line-height: 1.7;
        color: #444;
        margin: 0;
      ">
        ${trajectoryInsight} The following analysis examines each dimension within
        ${ctx.chapterName}, providing evidence-based findings and actionable
        recommendations prioritized by impact and feasibility for ${ctx.companyName}.
      </p>
    </div>
  `;
}

// ============================================================================
// EVIDENCE INTEGRATION
// ============================================================================

/**
 * Evidence source for integration into narrative prose
 */
export interface EvidenceSource {
  questionContext: string;
  responseLabel: string;
  numericScore: number;
  percentile?: number;
}

/**
 * Generate evidence-integrated analytical paragraph
 *
 * Premium consulting standard: Client data woven INTO narrative,
 * not just referenced in sidebar callouts.
 */
export function generateEvidenceIntegratedParagraph(
  finding: ReportFinding,
  evidence: EvidenceSource,
  companyName: string
): string {
  const percentileNarrative =
    evidence.percentile !== undefined
      ? evidence.percentile >= 75
        ? `placing them among the top quartile of peer organizations`
        : evidence.percentile >= 50
          ? `positioning them above the industry median`
          : evidence.percentile >= 25
            ? `trailing the majority of comparable organizations`
            : `placing them in the bottom quartile—a critical vulnerability`
      : '';

  const alignmentPhrase =
    evidence.numericScore >= 3.5 === (finding.type === 'strength')
      ? 'directly supports'
      : 'presents an interesting tension with';

  const findingImplication = getGapImpact(finding);

  return `
    <p class="evidence-integrated" style="
      font-size: 1rem;
      line-height: 1.7;
      color: #333;
      margin: 1rem 0;
    ">
      <strong>${finding.shortLabel}</strong> is particularly pronounced at ${companyName}. When asked about
      ${evidence.questionContext}, leadership responded with
      "<em style="color: #212653;">${evidence.responseLabel}</em>" (${evidence.numericScore}/5)${percentileNarrative ? `, ${percentileNarrative}` : ''}.
      This self-assessment ${alignmentPhrase} our finding that ${companyName}'s ability to ${findingImplication}
      ${finding.type === 'strength' ? 'is a competitive advantage' : 'requires strategic attention'}.
    </p>
  `;
}

// ============================================================================
// RECOMMENDATION NARRATIVE ENHANCEMENT
// ============================================================================

/**
 * Generate "Why This Matters" narrative for recommendations
 */
export function generateWhyThisMatters(
  theme: string,
  dimensionName: string,
  companyName: string,
  linkedFindings: ReportFinding[]
): string {
  const strengthCount = linkedFindings.filter((f) => f.type === 'strength').length;
  const gapCount = linkedFindings.filter((f) => f.type === 'gap').length;
  const riskCount = linkedFindings.filter((f) => f.type === 'risk').length;

  let context = '';
  if (riskCount > 0) {
    context = `This recommendation addresses ${riskCount} identified risk${riskCount > 1 ? 's' : ''} that could materially impact ${companyName}'s operations.`;
  } else if (gapCount > 0) {
    context = `This recommendation addresses ${gapCount} performance gap${gapCount > 1 ? 's' : ''} limiting ${companyName}'s growth potential.`;
  } else if (strengthCount > 0) {
    context = `This recommendation builds on ${strengthCount} existing strength${strengthCount > 1 ? 's' : ''} to accelerate ${companyName}'s competitive advantage.`;
  }

  return `
    <div class="why-this-matters" style="
      background: #e7f3ff;
      border-left: 4px solid #0d6efd;
      border-radius: 0 8px 8px 0;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #212653;
        margin: 0 0 0.5rem 0;
      ">Why This Matters for ${companyName}</h4>
      <p style="margin: 0; line-height: 1.6; color: #333;">
        ${theme} is critical for ${companyName}'s ${dimensionName} performance.
        ${context} Implementing this recommendation positions ${companyName}
        for sustainable improvement in this area.
      </p>
    </div>
  `;
}

/**
 * Generate "Risk of Inaction" narrative for recommendations
 */
export function generateRiskOfInaction(
  _theme: string,
  companyName: string,
  priority: string,
  linkedFindings: ReportFinding[]
): string {
  const risks = linkedFindings.filter((f) => f.type === 'risk');
  const gaps = linkedFindings.filter((f) => f.type === 'gap');

  let riskNarrative = '';
  if (priority === 'critical' || risks.length > 0) {
    riskNarrative = `Without action, ${companyName} faces escalating exposure that could result in significant operational disruption, financial loss, or competitive disadvantage within 6-12 months.`;
  } else if (gaps.length > 0) {
    riskNarrative = `Delaying action allows these performance gaps to widen, making future remediation more costly and time-consuming for ${companyName}.`;
  } else {
    riskNarrative = `While not immediately critical, inaction means ${companyName} misses an opportunity to strengthen its competitive position.`;
  }

  return `
    <div class="risk-of-inaction" style="
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 0 8px 8px 0;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #856404;
        margin: 0 0 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span>&#9888;</span> Risk of Inaction
      </h4>
      <p style="margin: 0; line-height: 1.6; color: #333;">
        ${riskNarrative}
      </p>
    </div>
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getScoreBandInterpretation,
  describeChapterPattern,
  getGapImpact,
};
