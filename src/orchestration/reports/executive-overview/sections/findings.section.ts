/**
 * Material Findings Section Renderer
 */

import type { MaterialFinding } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';
import { DIMENSION_METADATA } from '../../../../types/idm.types.js';

/**
 * Render the Material Findings section
 */
export function renderMaterialFindings(findings: MaterialFinding[]): string {
  if (!findings || findings.length === 0) {
    return '';
  }

  return `
    <section class="material-findings">
      <h2>Material Findings</h2>
      <p class="section-intro">
        These are the most significant findings from the assessment, ranked by business impact.
        Each finding is linked to detailed analysis in the Comprehensive Report.
      </p>

      ${findings.map(finding => renderFindingCard(finding)).join('\n')}
    </section>
  `;
}

/**
 * Render a single finding card
 */
function renderFindingCard(finding: MaterialFinding): string {
  const dimensionName = DIMENSION_METADATA[finding.sourceDimension]?.name || finding.sourceDimension;
  const scoreClass = getScoreClass(finding.score);

  return `
    <div class="finding-card">
      <div class="finding-rank">Finding #${finding.rank}: ${escapeHtml(dimensionName)} (${finding.score}/100)</div>
      <div class="finding-diagnosis">${escapeHtml(finding.diagnosis)}</div>
      <div class="finding-implication">${escapeHtml(finding.implication)}</div>
      <div class="finding-evidence">${escapeHtml(finding.evidencePointer)}</div>
    </div>
  `;
}

/**
 * Get CSS class for score coloring
 */
function getScoreClass(score: number): string {
  if (score >= 80) return 'score-excellence';
  if (score >= 60) return 'score-proficiency';
  if (score >= 40) return 'score-attention';
  return 'score-critical';
}

export default renderMaterialFindings;
