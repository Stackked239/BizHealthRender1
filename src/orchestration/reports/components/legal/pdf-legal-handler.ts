/**
 * PDF Legal Handler
 * Handles legal content transformation for PDF exports
 * - Removes interactive elements (clickwrap modal)
 * - Adds acceptance record stamp
 * - Moves full legal to appendix
 */

export interface PdfLegalConfig {
  acceptedBy?: string;          // User name if known
  acceptedAt?: string;          // ISO timestamp
  agreementId?: string;         // For reference
  termsVersion: string;
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
 * Generate the PDF acceptance stamp HTML
 * This stamp shows that terms were accepted and provides a reference to the appendix
 *
 * @param config - Configuration for the acceptance stamp
 * @returns Complete HTML string for the PDF acceptance stamp
 */
export function generatePdfAcceptanceStamp(config: PdfLegalConfig): string {
  const acceptedDate = config.acceptedAt
    ? new Date(config.acceptedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Prior to report generation';

  return `
    <div class="pdf-acceptance-stamp">
      <div class="stamp-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" fill="#969423"/>
        </svg>
        <strong>Terms &amp; Conditions Accepted</strong>
      </div>
      <div class="stamp-details">
        <p><strong>Date:</strong> ${escapeHtml(acceptedDate)}</p>
        ${config.acceptedBy ? `<p><strong>Accepted by:</strong> ${escapeHtml(config.acceptedBy)}</p>` : ''}
        ${config.agreementId ? `<p><strong>Agreement ID:</strong> ${escapeHtml(config.agreementId)}</p>` : ''}
        <p><strong>Terms Version:</strong> ${escapeHtml(config.termsVersion)}</p>
        <p class="appendix-reference"><strong>Full Terms:</strong> See Appendix A</p>
      </div>
    </div>

    <style>
      .pdf-acceptance-stamp {
        border: 2px solid #969423;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 2rem;
        background: rgba(150, 148, 35, 0.05);
      }

      .stamp-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 1rem;
        color: #212653;
      }

      .stamp-details {
        font-size: 0.85rem;
        color: #555;
      }

      .stamp-details p {
        margin: 0.25rem 0;
      }

      .appendix-reference {
        margin-top: 0.5rem !important;
        color: #969423;
      }

      @media print {
        .pdf-acceptance-stamp {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;
}

/**
 * Generate the PDF legal appendix HTML
 * This is a full legal terms section formatted for PDF appendix
 *
 * @param fullLegalContent - Complete legal terms HTML content
 * @returns Complete HTML string for the PDF legal appendix
 */
export function generatePdfLegalAppendix(fullLegalContent: string): string {
  return `
    <section class="pdf-legal-appendix page-break">
      <div class="appendix-header">
        <h1>Appendix A: Terms &amp; Conditions</h1>
        <p class="appendix-subtitle">Complete Legal Terms Governing This Assessment Report</p>
      </div>

      <div class="appendix-content">
        ${fullLegalContent}
      </div>

      <div class="appendix-footer">
        <p>Terms Version: 2025.1 | © 2025 BizHealth.ai | All Rights Reserved</p>
      </div>
    </section>

    <style>
      .pdf-legal-appendix {
        padding-top: 2rem;
      }

      .appendix-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #212653;
      }

      .appendix-header h1 {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.75rem;
        color: #212653;
        margin-bottom: 0.5rem;
      }

      .appendix-subtitle {
        color: #666;
        font-size: 1rem;
        margin: 0;
      }

      .appendix-content {
        font-size: 0.9rem;
        line-height: 1.7;
        color: #333;
      }

      .appendix-content h3 {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.1rem;
        color: #212653;
        margin: 1.5rem 0 0.75rem 0;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
      }

      .appendix-content h3:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }

      .appendix-footer {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
        text-align: center;
        font-size: 0.8rem;
        color: #888;
      }
    </style>
  `;
}

/**
 * Generate full legal content for PDF appendix
 * This is the complete legal terms that goes in the PDF appendix
 */
export function generateFullLegalContentForPdf(): string {
  return `
    <h3>1. Nature of Service &amp; Scope Limitations</h3>
    <p>This Report is provided for general informational and educational purposes only. It is designed to offer insights into your business operations based on the data you have provided. The Report does not constitute professional advice of any kind, including but not limited to legal, financial, tax, accounting, investment, or business consulting advice.</p>
    <p>BizHealth.ai is not a law firm, accounting firm, financial advisory firm, or professional consulting practice. The information contained in this Report should not be relied upon as a substitute for consultation with qualified professionals who can provide advice tailored to your specific circumstances.</p>
    <p>This Report is based solely on the information you provided through our assessment questionnaire and any supplemental data submitted to BizHealth.ai. We have not independently verified, audited, or investigated the accuracy, completeness, or reliability of this information.</p>

    <h3>2. Comprehensive Liability Limitations</h3>
    <p>THIS REPORT IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BIZHEALTH.AI EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: (A) IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT; (B) WARRANTIES ARISING FROM COURSE OF DEALING, USAGE, OR TRADE PRACTICE; (C) WARRANTIES THAT THE REPORT WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS; (D) WARRANTIES THAT THE REPORT WILL BE ERROR-FREE, ACCURATE, RELIABLE, OR COMPLETE.</p>
    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BIZHEALTH.AI, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES.</p>
    <p>IF, NOTWITHSTANDING THE FOREGOING, BIZHEALTH.AI IS FOUND LIABLE FOR ANY LOSS OR DAMAGE ARISING OUT OF OR IN CONNECTION WITH THIS REPORT, OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE LESSER OF: (A) THE AMOUNT YOU PAID TO BIZHEALTH.AI FOR THIS SPECIFIC REPORT; OR (B) ONE HUNDRED UNITED STATES DOLLARS (USD $100.00).</p>

    <h3>3. Data Usage, Privacy &amp; Confidentiality</h3>
    <p>BizHealth.ai collects and processes the data you provide through our assessment questionnaire to generate this Report. By submitting your data, you grant BizHealth.ai a non-exclusive, royalty-free license to use, process, analyze, and store such data for the purposes of: (a) generating this Report; (b) improving our services, algorithms, and analytical models; (c) developing aggregated, anonymized insights and benchmarks; and (d) complying with applicable laws and regulations.</p>
    <p>This Report is generated using artificial intelligence and machine learning technologies. Your data may be used to train, validate, and improve our AI models. BizHealth.ai will treat the specific information you provide as confidential and will not disclose such information to third parties except: (a) with your express consent; (b) to service providers who assist in generating this Report; (c) in aggregated, anonymized form; (d) as required by law.</p>

    <h3>4. Methodology &amp; Analytical Limitations</h3>
    <p>The scores, ratings, assessments, and recommendations contained in this Report are generated using proprietary algorithms and methodologies developed by BizHealth.ai. These methodologies involve subjective judgments and assumptions that may not be appropriate for all businesses, industries, or circumstances.</p>
    <p>As an AI-powered service, the analysis and recommendations in this Report are generated by machine learning models that: (a) may produce outputs that are incorrect, incomplete, or inappropriate; (b) are based on patterns identified in training data that may not reflect your specific situation; (c) may not account for nuances, context, or factors not captured in your input data; (d) are subject to inherent limitations and biases in AI technology.</p>

    <h3>5. Intellectual Property Rights</h3>
    <p>This Report, including all content, analyses, scores, recommendations, formatting, design, graphics, and presentation, constitutes proprietary intellectual property of BizHealth.ai. All rights, title, and interest in and to the Report remain exclusively with BizHealth.ai.</p>
    <p>Subject to your payment of applicable fees and compliance with these terms, BizHealth.ai grants you a limited, non-exclusive, non-transferable, revocable license to: (a) access and view this Report for your internal business purposes; (b) print and store copies for your records; and (c) share this Report with your employees, advisors, and consultants who have a legitimate need to review it.</p>

    <h3>6. Regulatory Compliance &amp; Consumer Rights</h3>
    <p>This Report does not constitute advice or services subject to professional licensing or regulatory oversight. BizHealth.ai is not registered, licensed, or authorized as a professional advisor in any jurisdiction. You should consult appropriately licensed professionals for advice in regulated areas.</p>
    <p>Certain jurisdictions provide consumers with rights that cannot be waived or limited by contract. Nothing in these terms is intended to limit or exclude any rights you may have under applicable consumer protection laws.</p>

    <h3>7. Legal Dispute Resolution</h3>
    <p>These terms and any disputes arising out of or related to this Report shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles.</p>
    <p>Any dispute, controversy, or claim arising out of or relating to this Report or these terms shall be resolved by binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.</p>
    <p>YOU AND BIZHEALTH.AI AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</p>

    <h3>8. Indemnification</h3>
    <p>You agree to defend, indemnify, and hold harmless BizHealth.ai, its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising out of or relating to: (a) your use of this Report; (b) any breach of these terms by you; (c) your violation of any third-party rights; (d) any decisions made or actions taken based on this Report.</p>

    <h3>9. Modifications &amp; Updates</h3>
    <p>BizHealth.ai reserves the right to modify these Legal Terms & Disclaimers at any time. Modified terms will apply to Reports generated after the effective date of the modification. We encourage you to review the terms applicable to each Report you receive.</p>

    <h3>10. Termination &amp; Survival</h3>
    <p>The license granted to use this Report may be terminated by BizHealth.ai at any time if you breach these terms. Upon termination, you must cease using this Report and destroy all copies in your possession.</p>
    <p>The following provisions shall survive termination: Liability Limitations, Intellectual Property, Dispute Resolution, Indemnification, and any other provisions that by their nature should survive.</p>

    <h3>11. Miscellaneous Provisions</h3>
    <p>These Legal Terms & Disclaimers, together with our Terms of Service and Privacy Policy (available at www.bizhealth.ai/legal), constitute the entire agreement between you and BizHealth.ai regarding this Report.</p>
    <p>If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
    <p>BizHealth.ai shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control.</p>

    <h3>12. Contact Information</h3>
    <p>If you have any questions about these Legal Terms & Disclaimers or this Report, please contact us at:</p>
    <address style="font-style: normal; background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
      <strong>BizHealth.ai, LLC</strong><br>
      Email: <a href="mailto:legal@bizhealth.ai">legal@bizhealth.ai</a><br>
      Website: <a href="https://www.bizhealth.ai/legal">www.bizhealth.ai/legal</a>
    </address>
  `;
}
