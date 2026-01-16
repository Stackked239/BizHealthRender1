/**
 * Executive Snapshot Section Renderer
 *
 * Renders the BLUF (Bottom Line Up Front) section - the most important
 * section of the Executive Overview.
 */

import type { ExecutiveSnapshot } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';
import { TRAJECTORY_LABELS, TRAJECTORY_ICONS } from '../executive-overview.constants.js';

/**
 * Render the Executive Snapshot section
 */
export function renderExecutiveSnapshot(snapshot: ExecutiveSnapshot): string {
  const trajectoryLabel = TRAJECTORY_LABELS[snapshot.trajectory] || 'Stable';
  const trajectoryIcon = TRAJECTORY_ICONS[snapshot.trajectory] || TRAJECTORY_ICONS.stable;

  const scoreClass = getScoreClass(snapshot.overallScore);
  const trajectoryClass = `trajectory-${snapshot.trajectory}`;

  return `
    <section class="executive-snapshot">
      <h2>Executive Snapshot</h2>

      <div class="bluf-box">
        <p>${escapeHtml(snapshot.bluf)}</p>
      </div>

      <div class="snapshot-metrics">
        <div class="metric-card">
          <span class="metric-label">Overall Health</span>
          <span class="metric-value ${scoreClass}">${snapshot.overallScore}/100</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Trajectory</span>
          <span class="metric-value ${trajectoryClass}">${trajectoryIcon} ${escapeHtml(trajectoryLabel)}</span>
        </div>
      </div>

      <div class="strengths-gaps">
        <div class="column">
          <h4>Top Strengths</h4>
          <ul>
            ${snapshot.topStrengths.map(s => `
              <li><strong>${escapeHtml(s.dimension)}</strong> (${s.score}/100)</li>
            `).join('')}
          </ul>
        </div>
        <div class="column">
          <h4>Priority Gaps</h4>
          <ul>
            ${snapshot.topGaps.map(g => `
              <li><strong>${escapeHtml(g.dimension)}</strong> (${g.score}/100)</li>
            `).join('')}
          </ul>
        </div>
      </div>
    </section>
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

export default renderExecutiveSnapshot;
