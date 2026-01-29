/**
 * Evidence Citation Component
 *
 * Generates evidence citation blocks that link insights back to
 * questionnaire responses, providing transparency and credibility
 * to the assessment findings.
 */

import type { ReportContext, ReportFinding, ReportDimension } from '../../../types/report.types.js';
import { escapeHtml } from '../html-template.js';

/**
 * Evidence citation data structure
 */
interface EvidenceCitation {
  questionId: string;
  questionText: string;
  responseValue: number;
  responseLabel: string;
  benchmarkMedian?: number;
  percentileRank?: number;
  dimensionCode: string;
  dimensionName: string;
}

/**
 * Response label mapping for 5-point scale
 */
const RESPONSE_LABELS: Record<number, string> = {
  1: 'Strongly Disagree / Not at All',
  2: 'Disagree / Rarely',
  3: 'Neutral / Sometimes',
  4: 'Agree / Often',
  5: 'Strongly Agree / Always',
};

/**
 * Get response label from value
 */
function getResponseLabel(value: number): string {
  return RESPONSE_LABELS[Math.round(value)] || `${value}/5`;
}

/**
 * Determine comparison status and generate text
 */
function getBenchmarkComparison(
  responseValue: number,
  benchmarkMedian?: number
): { class: string; text: string } | null {
  if (!benchmarkMedian) return null;

  const diff = responseValue - benchmarkMedian;
  const percentDiff = Math.round(Math.abs(diff / benchmarkMedian) * 100);

  if (diff > 0.5) {
    return {
      class: 'above',
      text: `↑ ${percentDiff}% above industry median (${benchmarkMedian.toFixed(1)}/5)`,
    };
  } else if (diff < -0.5) {
    return {
      class: 'below',
      text: `↓ ${percentDiff}% below industry median (${benchmarkMedian.toFixed(1)}/5)`,
    };
  } else {
    return {
      class: 'at',
      text: `≈ At industry median (${benchmarkMedian.toFixed(1)}/5)`,
    };
  }
}

/**
 * Generate a single evidence citation block
 */
export function generateEvidenceCitation(citation: EvidenceCitation): string {
  const comparison = getBenchmarkComparison(citation.responseValue, citation.benchmarkMedian);

  return `
    <div class="evidence-citation">
      <div class="citation-header">
        <span class="citation-icon">📊</span>
        <span>Evidence Source</span>
      </div>
      <div class="question-ref">
        ${escapeHtml(citation.questionId)}: "${escapeHtml(citation.questionText)}"
      </div>
      <div class="response-text">
        Your response: ${citation.responseValue.toFixed(1)}/5 — "${escapeHtml(citation.responseLabel || getResponseLabel(citation.responseValue))}"
      </div>
      ${comparison ? `
        <div class="benchmark-comparison ${comparison.class}">
          <span>📈</span> ${escapeHtml(comparison.text)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate evidence citations for a dimension based on its findings
 */
export function generateEvidenceCitationsForDimension(
  ctx: ReportContext,
  dimensionCode: string,
  maxCitations: number = 2
): string {
  const dimension = ctx.dimensions.find(d => d.code === dimensionCode);
  if (!dimension) return '';

  // Find findings for this dimension that have evidence references
  const dimensionFindings = ctx.findings
    .filter(f => f.dimensionCode === dimensionCode && f.evidenceRefs?.questionIds?.length);

  if (dimensionFindings.length === 0) {
    // Generate a generic citation based on dimension score
    return generateGenericDimensionCitation(dimension);
  }

  // Generate citations for up to maxCitations findings
  const citations = dimensionFindings.slice(0, maxCitations).map(finding => {
    const questionId = finding.evidenceRefs?.questionIds?.[0] || `${dimensionCode}-Q1`;

    return generateEvidenceCitation({
      questionId,
      questionText: finding.shortLabel || finding.narrative.substring(0, 60) + '...',
      responseValue: convertScoreToFivePoint(dimension.score),
      responseLabel: getResponseLabel(convertScoreToFivePoint(dimension.score)),
      benchmarkMedian: dimension.benchmark ? convertScoreToFivePoint(dimension.benchmark.peerPercentile) : undefined,
      dimensionCode: dimension.code,
      dimensionName: dimension.name,
    });
  });

  return citations.join('\n');
}

/**
 * Generate a generic citation based on dimension score
 */
function generateGenericDimensionCitation(dimension: ReportDimension): string {
  const scoreOnFive = convertScoreToFivePoint(dimension.score);
  const benchmarkOnFive = dimension.benchmark
    ? convertScoreToFivePoint(dimension.benchmark.peerPercentile)
    : undefined;

  return generateEvidenceCitation({
    questionId: `${dimension.code}-AVG`,
    questionText: `Overall ${dimension.name} Assessment`,
    responseValue: scoreOnFive,
    responseLabel: getResponseLabel(scoreOnFive),
    benchmarkMedian: benchmarkOnFive,
    dimensionCode: dimension.code,
    dimensionName: dimension.name,
  });
}

/**
 * Convert 100-point score to 5-point scale
 */
function convertScoreToFivePoint(score: number): number {
  return Math.round((score / 20) * 10) / 10; // Converts 0-100 to 0-5 with one decimal
}

/**
 * Generate evidence citations from findings with evidence refs
 */
export function generateEvidenceCitationsFromFindings(
  findings: ReportFinding[],
  dimensions: ReportDimension[],
  maxCitations: number = 3
): string {
  const findingsWithEvidence = findings.filter(f => f.evidenceRefs?.questionIds?.length);

  if (findingsWithEvidence.length === 0) return '';

  const citations = findingsWithEvidence.slice(0, maxCitations).map(finding => {
    const dimension = dimensions.find(d => d.code === finding.dimensionCode);
    const scoreOnFive = dimension ? convertScoreToFivePoint(dimension.score) : 3;
    const benchmarkOnFive = dimension?.benchmark
      ? convertScoreToFivePoint(dimension.benchmark.peerPercentile)
      : undefined;

    return generateEvidenceCitation({
      questionId: finding.evidenceRefs?.questionIds?.[0] || finding.id,
      questionText: finding.shortLabel,
      responseValue: scoreOnFive,
      responseLabel: getResponseLabel(scoreOnFive),
      benchmarkMedian: benchmarkOnFive,
      dimensionCode: finding.dimensionCode,
      dimensionName: finding.dimensionName,
    });
  });

  return `
    <div class="evidence-citations-group">
      ${citations.join('\n')}
    </div>
  `;
}

/**
 * Generate insight card with evidence
 */
export function generateInsightCardWithEvidence(
  finding: ReportFinding,
  dimension?: ReportDimension
): string {
  const typeClass = finding.type === 'strength' ? 'strength' :
                    finding.type === 'gap' ? 'weakness' :
                    finding.type === 'risk' ? 'warning' : 'opportunity';

  const typeLabel = finding.type === 'strength' ? 'Strength' :
                    finding.type === 'gap' ? 'Gap' :
                    finding.type === 'risk' ? 'Risk' : 'Opportunity';

  const typeIcon = finding.type === 'strength' ? '✅' :
                   finding.type === 'gap' ? '❌' :
                   finding.type === 'risk' ? '⚠️' : '📈';

  // Generate evidence citation if available
  let evidenceHtml = '';
  if (finding.evidenceRefs?.questionIds?.length && dimension) {
    const scoreOnFive = convertScoreToFivePoint(dimension.score);
    const benchmarkOnFive = dimension.benchmark
      ? convertScoreToFivePoint(dimension.benchmark.peerPercentile)
      : undefined;

    evidenceHtml = generateEvidenceCitation({
      questionId: finding.evidenceRefs.questionIds[0],
      questionText: finding.shortLabel,
      responseValue: scoreOnFive,
      responseLabel: getResponseLabel(scoreOnFive),
      benchmarkMedian: benchmarkOnFive,
      dimensionCode: finding.dimensionCode,
      dimensionName: finding.dimensionName,
    });
  }

  return `
    <div class="insight-card ${typeClass}">
      <div class="insight-label">${typeIcon} ${escapeHtml(typeLabel)}</div>
      <div class="insight-title">${escapeHtml(finding.shortLabel)}</div>
      <div class="insight-detail">${escapeHtml(finding.narrative)}</div>
      ${evidenceHtml}
    </div>
  `;
}

export { EvidenceCitation };
