/**
 * Clickwrap Modal Component
 * Displays full terms and requires affirmative acceptance before report access
 *
 * Legal Requirements Met:
 * - Full terms displayed (not just linked)
 * - Affirmative checkbox action required
 * - Clear acceptance language
 * - Acceptance timestamp recorded
 *
 * UPDATED 2025-12-10: Added mobile-optimized renderClickwrapModal function
 * with comprehensive fixes for iOS Safari and Android touch handling.
 */

import type { BrandConfig } from '../../../../types/report.types.js';

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
        <div class="clickwrap-terms-container" id="terms-container-${escapedReportId}">
          <div class="clickwrap-terms-content">
            ${legalContent}
          </div>
          <div class="scroll-indicator" id="scroll-indicator-${escapedReportId}">
            <span>↓ Scroll to read all terms</span>
          </div>
        </div>

        <!-- Acceptance Section -->
        <div class="clickwrap-acceptance">
          <label class="clickwrap-checkbox-label">
            <input type="checkbox" id="terms-checkbox-${escapedReportId}" class="clickwrap-checkbox" />
            <span class="checkmark"></span>
            <span class="checkbox-text">
              I have read, understand, and agree to these Terms &amp; Conditions governing my use of this Assessment Report.
            </span>
          </label>

          <button id="accept-terms-btn-${escapedReportId}" class="clickwrap-accept-btn" disabled>
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
      // Ensure DOM is fully loaded before running
      (function() {
        function initClickwrapModal() {
          console.log('[Clickwrap] Starting initialization...');
          
          const modal = document.getElementById('${modalId}');
          const termsContainer = document.getElementById('terms-container-${escapedReportId}');
          const scrollIndicator = document.getElementById('scroll-indicator-${escapedReportId}');
          const checkbox = document.getElementById('terms-checkbox-${escapedReportId}');
          const acceptBtn = document.getElementById('accept-terms-btn-${escapedReportId}');
          const reportContent = document.querySelector('.report-container');

          console.log('[Clickwrap] Found elements:', {
            modal: !!modal,
            termsContainer: !!termsContainer,
            scrollIndicator: !!scrollIndicator,
            checkbox: !!checkbox,
            acceptBtn: !!acceptBtn,
            reportContent: !!reportContent
          });

          if (!modal || !checkbox || !acceptBtn) {
            console.error('[Clickwrap] CRITICAL: Missing required elements!');
            return;
          }

          // Check if already accepted (session storage)
          const acceptanceKey = 'bizhealth_terms_accepted_${escapedReportId}';
          const previousAcceptance = sessionStorage.getItem(acceptanceKey);

          if (previousAcceptance) {
            console.log('[Clickwrap] Previous acceptance found, showing report');
            // Already accepted this session - show report immediately
            modal.classList.add('removed');
            if (reportContent) reportContent.classList.remove('report-content-gated');
            if (reportContent) reportContent.classList.add('report-content-visible');
            return; // Exit early
          } else {
            console.log('[Clickwrap] No previous acceptance, gating content');
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
              console.log('[Clickwrap] Checkbox changed:', this.checked);
              acceptBtn.disabled = !this.checked;
            });
          }

          // Accept button handler
          if (acceptBtn) {
            console.log('[Clickwrap] Attaching click handler to accept button');
            acceptBtn.addEventListener('click', function(event) {
              console.log('[Clickwrap] ACCEPT BUTTON CLICKED!');
              console.log('[Clickwrap] Checkbox state:', checkbox.checked);
              
              if (!checkbox.checked) {
                console.log('[Clickwrap] Checkbox not checked, aborting');
                return;
              }

              // Record acceptance
              const acceptance = {
                reportId: '${escapedReportId}',
                reportType: '${escapedReportType}',
                termsVersion: '${escapedTermsVersion}',
                acceptedAt: new Date().toISOString(),
                userAgent: navigator.userAgent
              };

              console.log('[Clickwrap] Recording acceptance:', acceptance);

              // Store in session (prevents re-prompt on refresh)
              sessionStorage.setItem(acceptanceKey, JSON.stringify(acceptance));

              console.log('[Clickwrap] Revealing report content...');
              // Reveal report content first
              if (reportContent) {
                reportContent.classList.remove('report-content-gated');
                reportContent.classList.add('report-content-visible');
                console.log('[Clickwrap] Report content revealed');
              }

              console.log('[Clickwrap] Hiding modal...');
              // Hide modal with animation
              modal.classList.add('hidden');
              
              setTimeout(function() {
                console.log('[Clickwrap] Removing modal from DOM...');
                modal.classList.add('removed');
                
                // Aggressively remove modal from DOM flow
                if (modal && modal.style) {
                  modal.style.display = 'none';
                  modal.style.visibility = 'hidden';
                  modal.style.zIndex = '-9999';
                  modal.style.position = 'absolute';
                  modal.style.top = '-9999px';
                  console.log('[Clickwrap] Modal styles updated');
                }
                
                // As a last resort, remove from DOM entirely
                if (modal && modal.parentNode) {
                  modal.parentNode.removeChild(modal);
                  console.log('[Clickwrap] Modal removed from DOM completely');
                }
              }, 300);
            });
            console.log('[Clickwrap] Click handler attached successfully');
          } else {
            console.error('[Clickwrap] Accept button not found!');
          }
        }

        // Run when DOM is ready
        if (document.readyState === 'loading') {
          console.log('[Clickwrap] Waiting for DOMContentLoaded...');
          document.addEventListener('DOMContentLoaded', initClickwrapModal);
        } else {
          console.log('[Clickwrap] DOM already loaded, initializing immediately');
          initClickwrapModal();
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

/**
 * Renders a production-ready clickwrap modal for legal terms acceptance.
 *
 * MOBILE FIXES INCLUDED:
 * - Intersection Observer for reliable scroll-to-bottom detection on iOS
 * - Dual event handling (click + touchend) for all interactive elements
 * - Touch target optimization (minimum 48px for all interactive elements)
 * - Visual feedback with loading states
 * - Safety net timer to prevent complete blocking
 * - Helper text guiding users on required actions
 *
 * @param brand - BrandConfig for styling customization
 * @returns Complete HTML string with embedded CSS and JavaScript
 */
export function renderClickwrapModal(brand: BrandConfig): string {
  const termsVersion = '2025.1';
  const primaryColor = brand?.primaryColor || '#212653'; // BizNavy
  const accentColor = brand?.accentColor || '#969423';   // BizGreen

  return `
<!-- CLICKWRAP MODAL - Mobile-Optimized Implementation -->
<div id="clickwrap-modal" class="clickwrap-overlay" role="dialog" aria-modal="true" aria-labelledby="clickwrap-title">

  <style>
    /* ========================================
       CLICKWRAP MODAL STYLES
       Mobile-first responsive design
       ======================================== */

    .clickwrap-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }

    .clickwrap-container {
      background: #ffffff;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .clickwrap-header {
      background: ${primaryColor};
      color: white;
      padding: 20px 24px;
      flex-shrink: 0;
    }

    .clickwrap-header h2 {
      margin: 0;
      font-family: 'Montserrat', sans-serif;
      font-size: 20px;
      font-weight: 600;
    }

    .clickwrap-header p {
      margin: 8px 0 0 0;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      opacity: 0.9;
    }

    .clickwrap-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      /* MOBILE FIX: Enable smooth momentum scrolling on iOS */
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    .clickwrap-body h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: ${primaryColor};
      margin: 24px 0 12px 0;
    }

    .clickwrap-body h3:first-child {
      margin-top: 0;
    }

    .clickwrap-body p {
      margin: 0 0 12px 0;
    }

    .clickwrap-body ul {
      margin: 0 0 12px 0;
      padding-left: 24px;
    }

    .clickwrap-body li {
      margin-bottom: 6px;
    }

    /* Scroll sentinel - invisible marker at bottom */
    #terms-sentinel {
      height: 1px;
      width: 100%;
      visibility: hidden;
    }

    .clickwrap-footer {
      background: #f8f9fa;
      padding: 20px 24px;
      border-top: 1px solid #e9ecef;
      flex-shrink: 0;
    }

    /* Helper text for user guidance */
    .clickwrap-helper {
      font-family: 'Open Sans', sans-serif;
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
      min-height: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .clickwrap-helper.error {
      color: #dc3545;
    }

    .clickwrap-helper.success {
      color: #28a745;
    }

    .helper-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* Checkbox container - MOBILE FIX: Large touch target */
    .clickwrap-checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
      /* MOBILE FIX: Minimum 48px touch target */
      min-height: 48px;
      padding: 8px;
      margin: -8px -8px 12px -8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .clickwrap-checkbox-container:hover {
      background-color: rgba(0, 0, 0, 0.03);
    }

    .clickwrap-checkbox-container:active {
      background-color: rgba(0, 0, 0, 0.06);
    }

    /* Custom checkbox - MOBILE FIX: Larger tap target */
    .clickwrap-checkbox {
      /* MOBILE FIX: 24px checkbox is easier to tap */
      width: 24px;
      height: 24px;
      min-width: 24px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: ${primaryColor};
    }

    .clickwrap-checkbox-label {
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      cursor: pointer;
      user-select: none;
      /* MOBILE FIX: Prevent text selection on tap */
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    /* Accept button - MOBILE FIX: Large touch target with states */
    .clickwrap-accept-btn {
      width: 100%;
      /* MOBILE FIX: Minimum 52px height for comfortable tapping */
      min-height: 52px;
      padding: 14px 24px;
      font-family: 'Montserrat', sans-serif;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      /* MOBILE FIX: Prevent zoom on iOS when focusing input */
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .clickwrap-accept-btn:disabled {
      background-color: #d1d5db;
      color: #6b7280;
      cursor: not-allowed;
    }

    .clickwrap-accept-btn:not(:disabled) {
      background-color: ${primaryColor};
      color: white;
    }

    .clickwrap-accept-btn:not(:disabled):hover {
      background-color: #1a1f42;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(33, 38, 83, 0.3);
    }

    .clickwrap-accept-btn:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(33, 38, 83, 0.2);
    }

    /* Loading state */
    .clickwrap-accept-btn.loading {
      pointer-events: none;
      opacity: 0.8;
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Scroll progress indicator */
    .scroll-progress {
      height: 3px;
      background: #e9ecef;
      border-radius: 2px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .scroll-progress-bar {
      height: 100%;
      background: ${accentColor};
      width: 0%;
      transition: width 0.1s ease;
      border-radius: 2px;
    }

    /* Mobile-specific adjustments */
    @media (max-width: 480px) {
      .clickwrap-overlay {
        padding: 8px;
      }

      .clickwrap-container {
        max-height: 95vh;
        border-radius: 8px;
      }

      .clickwrap-header {
        padding: 16px 20px;
      }

      .clickwrap-header h2 {
        font-size: 18px;
      }

      .clickwrap-body {
        padding: 20px;
        /* MOBILE FIX: Limit height to ensure footer is visible */
        max-height: 45vh;
      }

      .clickwrap-footer {
        padding: 16px 20px;
      }

      .clickwrap-checkbox-label {
        font-size: 13px;
      }

      .clickwrap-accept-btn {
        font-size: 15px;
        min-height: 48px;
      }
    }

    /* Blurred content behind modal */
    .report-content-blurred {
      filter: blur(8px);
      pointer-events: none;
      user-select: none;
    }
  </style>

  <div class="clickwrap-container">
    <div class="clickwrap-header">
      <h2 id="clickwrap-title">Terms of Service & Privacy Policy</h2>
      <p>Please review and accept to continue</p>
    </div>

    <div class="clickwrap-body" id="clickwrap-body">
      <h3>Terms of Service</h3>
      <p>By accessing this BizHealth.ai Business Health Assessment Report ("Report"), you agree to be bound by these Terms of Service.</p>

      <p><strong>1. Confidentiality.</strong> This Report contains proprietary analysis and recommendations prepared exclusively for the named client organization. You agree to maintain the confidentiality of this Report and not disclose its contents to third parties without prior written consent from BizHealth.ai.</p>

      <p><strong>2. Intended Use.</strong> This Report is intended solely for informational and internal planning purposes. The insights, scores, and recommendations provided are based on the assessment data submitted and should be considered as one input among many in your business decision-making process.</p>

      <p><strong>3. No Professional Advice.</strong> This Report does not constitute legal, financial, tax, or other professional advice. You should consult with qualified professionals before making significant business decisions based on this Report's contents.</p>

      <p><strong>4. Accuracy of Information.</strong> The analysis in this Report is based on information provided during the assessment process. BizHealth.ai makes no warranties regarding the accuracy or completeness of the underlying data or the conclusions drawn therefrom.</p>

      <p><strong>5. Limitation of Liability.</strong> To the fullest extent permitted by law, BizHealth.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of this Report.</p>

      <h3>Privacy Policy</h3>
      <p>BizHealth.ai is committed to protecting your privacy and the confidentiality of your business information.</p>

      <p><strong>Data Collection.</strong> We collect business assessment data that you voluntarily provide through our questionnaire. This includes operational metrics, financial indicators, and organizational information necessary to generate your Report.</p>

      <p><strong>Data Use.</strong> Your data is used exclusively to generate your personalized Business Health Assessment Report and to improve our analytical methodologies. We do not sell or share your individual business data with third parties.</p>

      <p><strong>Data Security.</strong> We implement industry-standard security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.</p>

      <p><strong>Data Retention.</strong> Assessment data is retained for the period necessary to provide our services and comply with legal obligations. You may request deletion of your data by contacting us.</p>

      <p><strong>Contact.</strong> For questions about these terms or our privacy practices, please contact us at legal@bizhealth.ai.</p>

      <!-- MOBILE FIX: Sentinel element for Intersection Observer -->
      <div id="terms-sentinel" aria-hidden="true"></div>
    </div>

    <div class="clickwrap-footer">
      <!-- Scroll progress indicator -->
      <div class="scroll-progress" role="progressbar" aria-label="Reading progress">
        <div class="scroll-progress-bar" id="scroll-progress-bar"></div>
      </div>

      <!-- Helper text with dynamic messaging -->
      <div class="clickwrap-helper" id="clickwrap-helper" aria-live="polite">
        <svg class="helper-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span id="helper-text">Please scroll down to read all terms</span>
      </div>

      <!-- Checkbox with large touch target -->
      <div class="clickwrap-checkbox-container" id="checkbox-container" role="group" aria-labelledby="checkbox-label">
        <input
          type="checkbox"
          id="accept-checkbox"
          class="clickwrap-checkbox"
          aria-describedby="helper-text"
        >
        <label for="accept-checkbox" class="clickwrap-checkbox-label" id="checkbox-label">
          I have read and agree to the Terms of Service and Privacy Policy
        </label>
      </div>

      <!-- Accept button with loading state support -->
      <button
        type="button"
        id="accept-btn"
        class="clickwrap-accept-btn"
        disabled
        aria-describedby="clickwrap-helper"
      >
        <span class="btn-text">Accept & View Report</span>
      </button>
    </div>
  </div>
</div>

<script>
(function() {
  'use strict';

  // ================================================
  // CLICKWRAP MODAL - Mobile-Optimized Implementation
  // ================================================

  const TERMS_VERSION = '${termsVersion}';
  const STORAGE_KEY = 'bizhealth-terms-accepted';
  const SAFETY_TIMEOUT_MS = 15000; // 15 second safety net

  // State management
  let hasScrolledToBottom = false;
  let hasCheckedAccept = false;
  let isSubmitting = false;

  // DOM Elements
  const modal = document.getElementById('clickwrap-modal');
  const body = document.getElementById('clickwrap-body');
  const checkbox = document.getElementById('accept-checkbox');
  const checkboxContainer = document.getElementById('checkbox-container');
  const acceptBtn = document.getElementById('accept-btn');
  const helperDiv = document.getElementById('clickwrap-helper');
  const helperText = document.getElementById('helper-text');
  const progressBar = document.getElementById('scroll-progress-bar');
  const sentinel = document.getElementById('terms-sentinel');

  // ================================================
  // CHECK EXISTING ACCEPTANCE
  // ================================================

  function checkExistingAcceptance() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === TERMS_VERSION) {
          hideModal();
          return true;
        }
      }
    } catch (e) {
      // Storage not available or corrupted
    }
    return false;
  }

  // ================================================
  // SCROLL DETECTION - LAYER 1: Intersection Observer
  // MOBILE FIX: Most reliable method for iOS Safari
  // ================================================

  function setupIntersectionObserver() {
    if (!('IntersectionObserver' in window) || !sentinel) {
      return false;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasScrolledToBottom) {
            // MOBILE FIX: User has scrolled to bottom
            hasScrolledToBottom = true;
            updateButtonState();
            observer.disconnect();
          }
        });
      },
      {
        root: body,
        threshold: 0.1,
        rootMargin: '0px 0px 50px 0px' // Trigger slightly before reaching bottom
      }
    );

    observer.observe(sentinel);
    return true;
  }

  // ================================================
  // SCROLL DETECTION - LAYER 2: Scroll Events Fallback
  // MOBILE FIX: Added touchend as backup trigger
  // ================================================

  function setupScrollFallback() {
    function checkScrollPosition() {
      if (hasScrolledToBottom) return;

      const { scrollTop, scrollHeight, clientHeight } = body;
      const scrollPercentage = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100);

      // Update progress bar
      if (progressBar) {
        progressBar.style.width = scrollPercentage + '%';
      }

      // MOBILE FIX: Use 150px threshold for momentum scrolling tolerance
      if (scrollHeight - scrollTop <= clientHeight + 150) {
        hasScrolledToBottom = true;
        updateButtonState();
      }
    }

    // MOBILE FIX: Listen to both scroll and touchend events
    body.addEventListener('scroll', checkScrollPosition, { passive: true });
    body.addEventListener('touchend', function() {
      // Delay check to allow momentum scroll to settle
      setTimeout(checkScrollPosition, 100);
    }, { passive: true });
  }

  // ================================================
  // SCROLL DETECTION - LAYER 3: Short Content Check
  // Handle case where content doesn't need scrolling
  // ================================================

  function checkContentFitsWithoutScroll() {
    requestAnimationFrame(() => {
      if (body.scrollHeight <= body.clientHeight + 20) {
        // Content is short, no scroll needed
        hasScrolledToBottom = true;
        if (progressBar) progressBar.style.width = '100%';
        updateButtonState();
      }
    });
  }

  // ================================================
  // SCROLL DETECTION - LAYER 4: Safety Net Timer
  // MOBILE FIX: Prevent permanent blocking if detection fails
  // ================================================

  function setupSafetyTimer() {
    setTimeout(() => {
      if (!hasScrolledToBottom) {
        console.warn('[Clickwrap] Safety timer triggered - enabling scroll completion');
        hasScrolledToBottom = true;
        if (progressBar) progressBar.style.width = '100%';
        updateButtonState();
      }
    }, SAFETY_TIMEOUT_MS);
  }

  // ================================================
  // CHECKBOX HANDLING
  // MOBILE FIX: Dual event binding for reliability
  // ================================================

  function setupCheckboxHandling() {
    function handleCheckboxChange() {
      hasCheckedAccept = checkbox.checked;
      updateButtonState();
    }

    // Standard change event
    checkbox.addEventListener('change', handleCheckboxChange);

    // MOBILE FIX: Also handle click with slight delay for state sync
    checkbox.addEventListener('click', function() {
      setTimeout(handleCheckboxChange, 10);
    });

    // MOBILE FIX: Allow tapping anywhere in the checkbox container
    checkboxContainer.addEventListener('click', function(e) {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        handleCheckboxChange();
      }
    });

    // MOBILE FIX: Handle touch events on container
    checkboxContainer.addEventListener('touchend', function(e) {
      if (e.target !== checkbox) {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        handleCheckboxChange();
      }
    }, { passive: false });
  }

  // ================================================
  // BUTTON STATE MANAGEMENT
  // ================================================

  function updateButtonState() {
    const canProceed = hasScrolledToBottom && hasCheckedAccept && !isSubmitting;

    // MOBILE FIX: Ensure both attribute and property are set
    acceptBtn.disabled = !canProceed;
    if (canProceed) {
      acceptBtn.removeAttribute('disabled');
    } else {
      acceptBtn.setAttribute('disabled', 'disabled');
    }

    // Update helper text
    updateHelperText();
  }

  function updateHelperText() {
    if (isSubmitting) {
      helperDiv.className = 'clickwrap-helper';
      helperText.textContent = 'Processing...';
      return;
    }

    if (!hasScrolledToBottom) {
      helperDiv.className = 'clickwrap-helper';
      helperText.textContent = 'Please scroll down to read all terms';
    } else if (!hasCheckedAccept) {
      helperDiv.className = 'clickwrap-helper';
      helperText.textContent = 'Please check the acceptance box above';
    } else {
      helperDiv.className = 'clickwrap-helper success';
      helperText.textContent = 'Ready! Click the button below to continue';
    }
  }

  // ================================================
  // BUTTON CLICK HANDLING
  // MOBILE FIX: Dual event binding + double-click prevention
  // ================================================

  function setupButtonHandling() {
    function handleAccept(e) {
      // Prevent default and stop propagation
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Guard against invalid state or double submission
      if (acceptBtn.disabled || isSubmitting || !hasScrolledToBottom || !hasCheckedAccept) {
        return;
      }

      // Set submitting state
      isSubmitting = true;
      acceptBtn.classList.add('loading');
      acceptBtn.innerHTML = '<span class="btn-spinner"></span><span class="btn-text">Opening Report...</span>';
      updateButtonState();

      // Log acceptance
      try {
        const acceptanceData = {
          version: TERMS_VERSION,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 200),
          method: 'clickwrap-v2'
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(acceptanceData));
      } catch (e) {
        console.warn('[Clickwrap] Could not save acceptance to storage');
      }

      // Hide modal with slight delay for visual feedback
      setTimeout(hideModal, 300);
    }

    // MOBILE FIX: Bind both click and touchend events
    acceptBtn.addEventListener('click', handleAccept);

    // MOBILE FIX: touchend as backup for click failures
    acceptBtn.addEventListener('touchend', function(e) {
      if (!acceptBtn.disabled && !isSubmitting) {
        handleAccept(e);
      }
    }, { passive: false });

    // Keyboard accessibility
    acceptBtn.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && !acceptBtn.disabled) {
        e.preventDefault();
        handleAccept(e);
      }
    });
  }

  // ================================================
  // MODAL VISIBILITY
  // ================================================

  function hideModal() {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';

      // Remove blur from report content
      const reportContent = document.querySelector('.report-content');
      if (reportContent) {
        reportContent.classList.remove('report-content-blurred');
      }

      // Also try alternative selectors
      document.querySelectorAll('[data-blurred]').forEach(el => {
        el.removeAttribute('data-blurred');
        el.style.filter = '';
        el.style.pointerEvents = '';
      });
    }, 300);
  }

  function showModal() {
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';

    // Focus management for accessibility
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 100);
  }

  // ================================================
  // INITIALIZATION
  // ================================================

  function initialize() {
    // Check for existing acceptance first
    if (checkExistingAcceptance()) {
      return;
    }

    // Show modal
    showModal();

    // Setup all detection layers
    const hasObserver = setupIntersectionObserver();
    setupScrollFallback();
    checkContentFitsWithoutScroll();
    setupSafetyTimer();

    // Setup interaction handlers
    setupCheckboxHandling();
    setupButtonHandling();

    // Initial state
    updateButtonState();

    console.log('[Clickwrap] Initialized with Intersection Observer:', hasObserver);
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
</script>
`;
}
