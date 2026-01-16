/**
 * Execution View Section Renderer
 *
 * Renders the 30/60/90 day execution roadmap
 */

import type { ExecutionPhase } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Execution View section
 */
export function renderExecutionView(phases: ExecutionPhase[]): string {
  if (!phases || phases.length === 0) {
    return '';
  }

  return `
    <section class="execution-view">
      <h2>90-Day Execution View</h2>
      <p class="section-intro">
        A phased approach to implementing strategic priorities.
        Each phase builds on the previous, creating sustainable momentum.
      </p>

      ${phases.map(phase => renderExecutionPhase(phase)).join('\n')}
    </section>
  `;
}

/**
 * Render a single execution phase
 */
function renderExecutionPhase(phase: ExecutionPhase): string {
  return `
    <div class="execution-phase">
      <h3>${escapeHtml(phase.phaseTitle)}</h3>
      <p class="phase-focus">${escapeHtml(phase.focus)}</p>

      <ul class="milestone-list">
        ${phase.milestones.map(milestone => `
          <li>
            <span class="milestone-week">${escapeHtml(milestone.week)}</span>
            <span class="milestone-action">
              ${escapeHtml(milestone.action)}
              ${milestone.deliverable ? `<span class="milestone-deliverable"> - Deliverable: ${escapeHtml(milestone.deliverable)}</span>` : ''}
            </span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

export default renderExecutionView;
