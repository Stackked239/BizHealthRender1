/**
 * Clickwrap Modal Component
 * Displays full terms and requires affirmative acceptance before report access
 *
 * Legal Requirements Met:
 * - Full terms displayed (not just linked)
 * - Affirmative checkbox action required
 * - Clear acceptance language
 * - Acceptance timestamp recorded
 */

export interface ClickwrapConfig {
  reportId: string;
  reportType: 'comprehensive' | 'owner' | 'executive';
  companyName: string;
  termsVersion: string;
  generatedDate: string;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate the clickwrap modal HTML with full legal terms
 * The modal gates report access until user accepts terms
 *
 * @param config - Configuration for the clickwrap modal
 * @param legalContent - Full legal terms HTML content
 * @returns Complete HTML string for the clickwrap modal
 */
export function generateClickwrapModal(config: ClickwrapConfig, legalContent: string): string {
  const modalId = `clickwrap-modal-${escapeHtml(config.reportId)}`;
  const escapedReportId = escapeHtml(config.reportId);
  const escapedReportType = escapeHtml(config.reportType);
  const escapedCompanyName = escapeHtml(config.companyName);
  const escapedTermsVersion = escapeHtml(config.termsVersion);
  const escapedGeneratedDate = escapeHtml(config.generatedDate);
  const reportTypeLabel = config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1);

  return `
    <!-- Clickwrap Modal Overlay -->
    <div id="${modalId}" class="clickwrap-overlay" role="dialog" aria-modal="true" aria-labelledby="clickwrap-title">
      <div class="clickwrap-modal">
        <!-- Header -->
        <div class="clickwrap-header">
          <div class="clickwrap-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#212653"/>
              <text x="20" y="26" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="16" font-weight="700" fill="white">BH</text>
            </svg>
          </div>
          <div class="clickwrap-title-block">
            <h2 id="clickwrap-title">Assessment Report Terms &amp; Conditions</h2>
            <p class="clickwrap-subtitle">${escapedCompanyName} — ${reportTypeLabel} Report</p>
          </div>
        </div>

        <!-- Terms Container -->
        <div class="clickwrap-terms-container" id="terms-container">
          <div class="clickwrap-terms-content">
            ${legalContent}
          </div>
          <div class="scroll-indicator" id="scroll-indicator">
            <span>↓ Scroll to read all terms</span>
          </div>
        </div>

        <!-- Acceptance Section -->
        <div class="clickwrap-acceptance">
          <label class="clickwrap-checkbox-label">
            <input type="checkbox" id="terms-checkbox" class="clickwrap-checkbox" />
            <span class="checkmark"></span>
            <span class="checkbox-text">
              I have read, understand, and agree to these Terms &amp; Conditions governing my use of this Assessment Report.
            </span>
          </label>

          <button id="accept-terms-btn" class="clickwrap-accept-btn" disabled>
            Accept &amp; View Report
          </button>

          <p class="clickwrap-footer-note">
            Terms Version: ${escapedTermsVersion} |
            Report Generated: ${escapedGeneratedDate}
          </p>
        </div>
      </div>
    </div>

    <!-- Clickwrap Styles -->
    <style>
      /* Overlay */
      .clickwrap-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(33, 38, 83, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 1;
        transition: opacity 0.3s ease;
      }

      .clickwrap-overlay.hidden {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      }

      .clickwrap-overlay.removed {
        display: none !important;
        visibility: hidden !important;
        z-index: -1 !important;
      }

      /* Modal Container */
      .clickwrap-modal {
        background: #ffffff;
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }

      /* Header */
      .clickwrap-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #212653 0%, #2a3070 100%);
        color: white;
      }

      .clickwrap-title-block h2 {
        margin: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
      }

      .clickwrap-subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        opacity: 0.8;
      }

      /* Terms Container */
      .clickwrap-terms-container {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        background: #f8f9fa;
        position: relative;
        max-height: 400px;
        border-top: 1px solid #e9ecef;
        border-bottom: 1px solid #e9ecef;
      }

      .clickwrap-terms-content {
        font-family: 'Open Sans', sans-serif;
        font-size: 0.875rem;
        line-height: 1.6;
        color: #333;
      }

      .clickwrap-terms-content h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #212653;
        margin: 1.5rem 0 0.75rem 0;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
      }

      .clickwrap-terms-content h3:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }

      .clickwrap-terms-content p {
        margin-bottom: 0.75rem;
      }

      .clickwrap-terms-content ul {
        margin: 0.5rem 0 1rem 1.5rem;
      }

      .clickwrap-terms-content li {
        margin-bottom: 0.25rem;
      }

      /* Scroll Indicator */
      .scroll-indicator {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        padding: 0.75rem;
        background: linear-gradient(transparent, #f8f9fa 50%);
        color: #969423;
        font-size: 0.8rem;
        font-weight: 600;
        transition: opacity 0.3s ease;
      }

      .scroll-indicator.hidden {
        opacity: 0;
      }

      /* Acceptance Section */
      .clickwrap-acceptance {
        padding: 1.5rem;
        background: white;
      }

      .clickwrap-checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        margin-bottom: 1.25rem;
      }

      .clickwrap-checkbox {
        position: absolute;
        opacity: 0;
        cursor: pointer;
      }

      .checkmark {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border: 2px solid #212653;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .clickwrap-checkbox:checked + .checkmark {
        background: #212653;
      }

      .clickwrap-checkbox:checked + .checkmark::after {
        content: '✓';
        color: white;
        font-weight: bold;
        font-size: 14px;
      }

      .clickwrap-checkbox:focus + .checkmark {
        box-shadow: 0 0 0 3px rgba(150, 148, 35, 0.3);
      }

      .checkbox-text {
        font-size: 0.9rem;
        line-height: 1.5;
        color: #333;
      }

      /* Accept Button */
      .clickwrap-accept-btn {
        width: 100%;
        padding: 1rem 2rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #969423 0%, #7a7a1c 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .clickwrap-accept-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .clickwrap-accept-btn:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(150, 148, 35, 0.4);
      }

      .clickwrap-footer-note {
        margin-top: 1rem;
        font-size: 0.75rem;
        color: #888;
        text-align: center;
      }

      /* Report Content - Hidden Until Accepted */
      .report-content-gated {
        filter: blur(10px);
        pointer-events: none;
        user-select: none;
      }

      .report-content-visible {
        filter: none;
        pointer-events: auto;
        user-select: auto;
      }

      /* Print: Hide modal entirely */
      @media print {
        .clickwrap-overlay {
          display: none !important;
        }
      }
    </style>

    <!-- Clickwrap JavaScript -->
    <script>
      (function() {
        const modal = document.getElementById('${modalId}');
        const termsContainer = document.getElementById('terms-container');
        const scrollIndicator = document.getElementById('scroll-indicator');
        const checkbox = document.getElementById('terms-checkbox');
        const acceptBtn = document.getElementById('accept-terms-btn');
        const reportContent = document.querySelector('.report-container');

        // Check if already accepted (session storage)
        const acceptanceKey = 'bizhealth_terms_accepted_${escapedReportId}';
        const previousAcceptance = sessionStorage.getItem(acceptanceKey);

        if (previousAcceptance) {
          // Already accepted this session - show report immediately
          modal.classList.add('removed');
          if (reportContent) reportContent.classList.remove('report-content-gated');
          if (reportContent) reportContent.classList.add('report-content-visible');
        } else {
          // Gate the report content
          if (reportContent) reportContent.classList.add('report-content-gated');
        }

        // Scroll indicator visibility
        if (termsContainer) {
          termsContainer.addEventListener('scroll', function() {
            const isNearBottom = termsContainer.scrollHeight - termsContainer.scrollTop <= termsContainer.clientHeight + 50;
            if (isNearBottom) {
              scrollIndicator.classList.add('hidden');
            }
          });
        }

        // Checkbox enables button
        if (checkbox) {
          checkbox.addEventListener('change', function() {
            acceptBtn.disabled = !this.checked;
          });
        }

        // Accept button handler
        if (acceptBtn) {
          acceptBtn.addEventListener('click', function() {
            if (!checkbox.checked) return;

            // Record acceptance
            const acceptance = {
              reportId: '${escapedReportId}',
              reportType: '${escapedReportType}',
              termsVersion: '${escapedTermsVersion}',
              acceptedAt: new Date().toISOString(),
              userAgent: navigator.userAgent
            };

            // Store in session (prevents re-prompt on refresh)
            sessionStorage.setItem(acceptanceKey, JSON.stringify(acceptance));

            // Optional: Send to server for permanent record
            // fetch('/api/terms-acceptance', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(acceptance)
            // });

            // Reveal report content first
            if (reportContent) {
              reportContent.classList.remove('report-content-gated');
              reportContent.classList.add('report-content-visible');
            }

            // Hide modal with animation
            modal.classList.add('hidden');
            setTimeout(function() {
              modal.classList.add('removed');
              // Aggressively remove modal from DOM flow
              if (modal && modal.style) {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.zIndex = '-9999';
                modal.style.position = 'absolute';
                modal.style.top = '-9999px';
              }
              // As a last resort, remove from DOM entirely
              if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
              }
            }, 300);
          });
        }
      })();
    </script>
  `;
}

/**
 * Generate simplified legal content for the clickwrap modal
 * This is a condensed version suitable for the modal display
 */
export function generateClickwrapLegalContent(): string {
  return `
    <h3>Professional Services Disclaimer</h3>
    <p>This Report is provided for general informational and educational purposes only. It is designed to offer insights into your business operations based on the data you have provided. The Report does not constitute professional advice of any kind, including but not limited to legal, financial, tax, accounting, investment, or business consulting advice.</p>
    <p>BizHealth.ai is not a law firm, accounting firm, financial advisory firm, or professional consulting practice. The information contained in this Report should not be relied upon as a substitute for consultation with qualified professionals who can provide advice tailored to your specific circumstances.</p>

    <h3>Data Accuracy &amp; Limitations</h3>
    <p>The analyses, scores, recommendations, and other outputs in this Report are based solely on the information you provided through the assessment questionnaire. BizHealth.ai does not independently verify the accuracy, completeness, or reliability of the data you submitted.</p>
    <p>If any information provided was inaccurate, incomplete, or outdated, the findings and recommendations in this Report may not accurately reflect your business situation.</p>

    <h3>No Guarantee of Outcomes</h3>
    <p>Any projections, forecasts, potential savings, ROI estimates, or expected outcomes presented in this Report are illustrative only and based on assumptions that may not hold true in your specific circumstances. Actual results may vary significantly.</p>

    <h3>Limitation of Liability</h3>
    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BIZHEALTH.AI, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.</p>

    <h3>Intellectual Property</h3>
    <p>This Report, including all content, analyses, scores, recommendations, formatting, design, graphics, and presentation, constitutes proprietary intellectual property of BizHealth.ai. All rights, title, and interest in and to the Report remain exclusively with BizHealth.ai.</p>
    <p>You are granted a limited, non-exclusive, non-transferable license to use this Report solely for your internal business purposes.</p>

    <h3>Indemnification</h3>
    <p>You agree to indemnify, defend, and hold harmless BizHealth.ai from any claims, damages, losses, liabilities, costs, and expenses arising out of or relating to your use of this Report or any decisions made based on its contents.</p>

    <h3>Confidentiality</h3>
    <p>This Report contains confidential information about your business. You agree to maintain the confidentiality of this Report and not disclose its contents to third parties without prior written consent, except as required by law or to your professional advisors.</p>

    <h3>Governing Law</h3>
    <p>These terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.</p>

    <h3>Force Majeure</h3>
    <p>BizHealth.ai shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, or government actions.</p>

    <h3>Entire Agreement</h3>
    <p>These terms, together with any applicable service agreements, constitute the entire agreement between you and BizHealth.ai regarding this Report and supersede all prior agreements and understandings.</p>
  `;
}
