/**
 * Key Risks Section Renderer
 */

import type { RiskMitigation } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Key Risks section
 */
export function renderKeyRisks(risks: RiskMitigation[]): string {
  if (!risks || risks.length === 0) {
    return '';
  }

  return `
    <section class="key-risks">
      <h2>Key Risks & Mitigations</h2>
      <p class="section-intro">
        The following risks require monitoring and proactive mitigation.
        Each risk is assessed by likelihood and potential impact.
      </p>

      ${risks.map(risk => renderRiskItem(risk)).join('\n')}
    </section>
  `;
}

/**
 * Render a single risk item
 */
function renderRiskItem(risk: RiskMitigation): string {
  const riskClass = risk.impact === 'high' ? 'high' :
                    risk.impact === 'medium' ? 'medium' : 'low';

  return `
    <div class="risk-item ${riskClass}">
      <div class="risk-description">
        <h4>Risk</h4>
        <p>${escapeHtml(risk.risk)}</p>
        <div class="risk-badges">
          <span class="risk-badge likelihood-${risk.likelihood}">Likelihood: ${capitalize(risk.likelihood)}</span>
          <span class="risk-badge impact-${risk.impact}">Impact: ${capitalize(risk.impact)}</span>
        </div>
      </div>
      <div class="risk-mitigation">
        <h4>Mitigation</h4>
        <p>${escapeHtml(risk.mitigation)}</p>
        ${risk.owner ? `<p><strong>Owner:</strong> ${escapeHtml(risk.owner)}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default renderKeyRisks;
