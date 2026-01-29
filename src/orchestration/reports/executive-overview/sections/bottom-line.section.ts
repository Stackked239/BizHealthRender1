/**
 * Bottom Line Section Renderer
 *
 * The closing statement that summarizes the key message
 * and provides a clear next step for leadership.
 */

import { escapeHtml } from '../../html-template.js';

/**
 * Render the Bottom Line section
 */
export function renderBottomLine(bottomLine: string, companyName: string): string {
  // Extract the "Next step" if it exists
  const nextStepMatch = bottomLine.match(/Next step:\s*(.+)$/i);
  const nextStep = nextStepMatch ? nextStepMatch[1] : null;
  const mainContent = nextStep
    ? bottomLine.replace(/Next step:\s*.+$/i, '').trim()
    : bottomLine;

  return `
    <section class="bottom-line">
      <h2>The Bottom Line</h2>
      <p>${escapeHtml(mainContent)}</p>
      ${nextStep ? `
        <p class="next-step">Next Step: ${escapeHtml(nextStep)}</p>
      ` : ''}
    </section>
  `;
}

/**
 * Render the disclaimer footer
 */
export function renderDisclaimer(companyName: string): string {
  return `
    <footer class="executive-overview-disclaimer">
      <hr />
      <p>
        <strong>Important Disclaimers:</strong> This Report is provided for informational and
        educational purposes only. It does not constitute legal, financial, tax, accounting,
        investment, or business consulting advice. ${escapeHtml(companyName)} should consult with qualified
        professionals before making material decisions based on recommendations in this report.
        Projections and expected outcomes are illustrative based on industry benchmarks.
        Actual results may vary. All information is confidential and proprietary to BizHealth.ai.
      </p>
    </footer>
  `;
}

export default renderBottomLine;
