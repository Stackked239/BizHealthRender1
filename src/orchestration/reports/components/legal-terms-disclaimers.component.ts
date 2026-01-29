/**
 * Legal Terms & Disclaimers Component
 *
 * Renders the Legal Terms & Disclaimers page (page 2) for all report variants:
 * - Comprehensive Report
 * - Owner's Report
 * - Executive Brief
 *
 * All variants contain IDENTICAL legal content; only styling differs.
 * This is a static document with no interactive JavaScript.
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface LegalTermsContext {
  companyName: string;
  reportId: string;
  generatedAt: Date;
  variant: 'comprehensive' | 'owners' | 'executive';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date as "Month D, YYYY" (e.g., "November 19, 2025")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// LEGAL CONTENT - ALL 12 SECTIONS
// ============================================================================

/**
 * Generate the complete legal content HTML
 * This is IDENTICAL across all report variants
 */
function generateLegalContent(): string {
  return `
    <!-- ACCEPTANCE OF TERMS -->
    <p class="legal-intro-text">
      <strong>ACCEPTANCE OF TERMS:</strong> By accessing, receiving, or using this BizHealth.ai report (the "Report"), you ("Client," "you," or "your") acknowledge that you have read, understood, and agree to be bound by these Legal Terms & Disclaimers in their entirety. If you do not agree to these terms, do not access or use this Report.
    </p>

    <!-- SECTION 1: NATURE OF SERVICE & SCOPE LIMITATIONS -->
    <section class="legal-section">
      <h2>1. NATURE OF SERVICE & SCOPE LIMITATIONS</h2>

      <h3>1.1 Informational Purposes Only</h3>
      <p>This Report is provided for general informational and educational purposes only. It is designed to offer insights into your business operations based on the data you have provided. The Report does not constitute professional advice of any kind, including but not limited to legal, financial, tax, accounting, investment, or business consulting advice.</p>

      <h3>1.2 Not Professional Advice</h3>
      <p>BizHealth.ai is not a law firm, accounting firm, financial advisory firm, or professional consulting practice. The information contained in this Report should not be relied upon as a substitute for consultation with qualified professionals who can provide advice tailored to your specific circumstances. You are strongly encouraged to seek the advice of qualified professionals regarding any matters addressed in this Report.</p>

      <h3>1.3 Scope of Analysis</h3>
      <p>This Report is based solely on the information you provided through our assessment questionnaire and any supplemental data submitted to BizHealth.ai. We have not independently verified, audited, or investigated the accuracy, completeness, or reliability of this information. The analysis contained herein reflects only the data available to us at the time of assessment and may not capture all relevant factors affecting your business.</p>
    </section>

    <!-- SECTION 2: COMPREHENSIVE LIABILITY LIMITATIONS -->
    <section class="legal-section">
      <h2>2. COMPREHENSIVE LIABILITY LIMITATIONS</h2>

      <h3>2.1 No Warranties</h3>
      <p>THIS REPORT IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BIZHEALTH.AI EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: (A) IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT; (B) WARRANTIES ARISING FROM COURSE OF DEALING, USAGE, OR TRADE PRACTICE; (C) WARRANTIES THAT THE REPORT WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS; (D) WARRANTIES THAT THE REPORT WILL BE ERROR-FREE, ACCURATE, RELIABLE, OR COMPLETE; AND (E) WARRANTIES REGARDING THE RESULTS YOU MAY OBTAIN FROM USING THIS REPORT.</p>

      <h3>2.2 Limitation of Liability</h3>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BIZHEALTH.AI, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH: (A) YOUR USE OF OR INABILITY TO USE THIS REPORT; (B) ANY DECISIONS MADE OR ACTIONS TAKEN BASED ON THIS REPORT; (C) ANY ERRORS, OMISSIONS, OR INACCURACIES IN THE REPORT; (D) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA; OR (E) ANY OTHER MATTER RELATING TO THIS REPORT, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF BIZHEALTH.AI HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>

      <h3>2.3 Cap on Liability</h3>
      <p>IF, NOTWITHSTANDING THE FOREGOING, BIZHEALTH.AI IS FOUND LIABLE FOR ANY LOSS OR DAMAGE ARISING OUT OF OR IN CONNECTION WITH THIS REPORT, OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE LESSER OF: (A) THE AMOUNT YOU PAID TO BIZHEALTH.AI FOR THIS SPECIFIC REPORT; OR (B) ONE HUNDRED UNITED STATES DOLLARS (USD $100.00).</p>

      <h3>2.4 Essential Basis of the Bargain</h3>
      <p>You acknowledge and agree that the limitations of liability set forth in this Section 2 are fundamental elements of the agreement between you and BizHealth.ai. BizHealth.ai would not provide this Report without such limitations. These limitations shall apply even if any remedy fails of its essential purpose.</p>

      <h3>2.5 Specific Disclaimer of Liability</h3>
      <p>Without limiting the foregoing, BizHealth.ai specifically disclaims any liability for: (a) Business decisions made based on this Report; (b) Financial investments or expenditures made in reliance on this Report; (c) Changes to business operations, personnel, or strategy based on this Report; (d) Third-party actions or omissions; (e) Market conditions, economic factors, or industry trends; (f) Regulatory compliance or legal matters; and (g) Any outcomes, results, or consequences of implementing recommendations contained in this Report.</p>
    </section>

    <!-- SECTION 3: DATA USAGE, PRIVACY & CONFIDENTIALITY -->
    <section class="legal-section">
      <h2>3. DATA USAGE, PRIVACY & CONFIDENTIALITY</h2>

      <h3>3.1 Data Collection and Use</h3>
      <p>BizHealth.ai collects and processes the data you provide through our assessment questionnaire to generate this Report. By submitting your data, you grant BizHealth.ai a non-exclusive, royalty-free license to use, process, analyze, and store such data for the purposes of: (a) generating this Report; (b) improving our services, algorithms, and analytical models; (c) developing aggregated, anonymized insights and benchmarks; and (d) complying with applicable laws and regulations.</p>

      <h3>3.2 AI and Machine Learning</h3>
      <p>This Report is generated using artificial intelligence and machine learning technologies. Your data may be used to train, validate, and improve our AI models. All such use will be conducted in accordance with our Privacy Policy and applicable data protection laws. We implement appropriate technical and organizational measures to protect your data during AI processing.</p>

      <h3>3.3 Aggregated Data</h3>
      <p>BizHealth.ai may use your data in aggregated, anonymized form for research, benchmarking, product development, and marketing purposes. Such aggregated data will not identify you or your business specifically.</p>

      <h3>3.4 Confidentiality</h3>
      <p>BizHealth.ai will treat the specific information you provide as confidential and will not disclose such information to third parties except: (a) with your express consent; (b) to service providers who assist in generating this Report, subject to appropriate confidentiality obligations; (c) in aggregated, anonymized form as described above; (d) as required by law, regulation, legal process, or governmental request; or (e) to protect the rights, property, or safety of BizHealth.ai or others.</p>

      <h3>3.5 Data Retention</h3>
      <p>BizHealth.ai retains your data in accordance with our data retention policies and applicable legal requirements. You may request deletion of your personal data by contacting us at the address provided below, subject to our legal obligations and legitimate business interests.</p>
    </section>

    <!-- SECTION 4: METHODOLOGY & ANALYTICAL LIMITATIONS -->
    <section class="legal-section">
      <h2>4. METHODOLOGY & ANALYTICAL LIMITATIONS</h2>

      <h3>4.1 Methodology Disclaimer</h3>
      <p>The scores, ratings, assessments, and recommendations contained in this Report are generated using proprietary algorithms and methodologies developed by BizHealth.ai. These methodologies involve subjective judgments and assumptions that may not be appropriate for all businesses, industries, or circumstances.</p>

      <h3>4.2 Limitations of AI-Generated Content</h3>
      <p>As an AI-powered service, the analysis and recommendations in this Report are generated by machine learning models that: (a) may produce outputs that are incorrect, incomplete, or inappropriate; (b) are based on patterns identified in training data that may not reflect your specific situation; (c) may not account for nuances, context, or factors not captured in your input data; (d) are subject to inherent limitations and biases in AI technology; and (e) should be independently verified and evaluated by qualified professionals.</p>

      <h3>4.3 Benchmark Data</h3>
      <p>Any benchmark comparisons, industry averages, or peer group analyses contained in this Report are based on data and methodologies that may have limitations, including but not limited to: (a) varying sample sizes and data quality; (b) different time periods or market conditions; (c) classification and categorization differences; (d) regional, size, or industry variations; and (e) potential selection bias. Such comparisons are provided for informational purposes only and should not be relied upon as definitive indicators of performance.</p>

      <h3>4.4 Forward-Looking Statements</h3>
      <p>This Report may contain projections, forecasts, estimates, or other forward-looking statements. Such statements are inherently uncertain and are based on assumptions that may prove incorrect. Actual results may differ materially from any projections or forecasts contained herein. BizHealth.ai makes no representation or warranty regarding the achievement of any projected outcomes.</p>

      <h3>4.5 Temporal Limitations</h3>
      <p>This Report reflects an assessment at a single point in time based on the data available on the assessment date. Business conditions, market dynamics, and other factors change over time. This Report should not be relied upon as an accurate representation of conditions at any other time. We recommend periodic reassessments to maintain current insights.</p>
    </section>

    <!-- SECTION 5: INTELLECTUAL PROPERTY RIGHTS -->
    <section class="legal-section">
      <h2>5. INTELLECTUAL PROPERTY RIGHTS</h2>

      <h3>5.1 Ownership</h3>
      <p>This Report, including all content, analyses, scores, recommendations, formatting, design, graphics, and presentation, constitutes proprietary intellectual property of BizHealth.ai. All rights, title, and interest in and to the Report, including all intellectual property rights, remain exclusively with BizHealth.ai.</p>

      <h3>5.2 Limited License</h3>
      <p>Subject to your payment of applicable fees and compliance with these terms, BizHealth.ai grants you a limited, non-exclusive, non-transferable, revocable license to: (a) access and view this Report for your internal business purposes; (b) print and store copies for your records; and (c) share this Report with your employees, advisors, and consultants who have a legitimate need to review it, provided they agree to maintain its confidentiality.</p>

      <h3>5.3 Restrictions</h3>
      <p>You may not: (a) reproduce, distribute, or publicly display this Report, in whole or in part, except as expressly permitted herein; (b) modify, adapt, translate, or create derivative works based on this Report; (c) reverse engineer, decompile, or attempt to extract the underlying methodologies, algorithms, or scoring systems; (d) use this Report for any competitive or commercial purpose, including resale or sublicensing; (e) remove, alter, or obscure any proprietary notices, trademarks, or branding from this Report; or (f) use this Report in any manner that could damage, disable, or impair BizHealth.ai's services or reputation.</p>

      <h3>5.4 Trademarks</h3>
      <p>"BizHealth.ai" and associated logos, marks, and branding are trademarks or registered trademarks of BizHealth.ai, LLC. You may not use these marks without our prior written consent.</p>

      <h3>5.5 Feedback</h3>
      <p>If you provide any feedback, suggestions, or ideas regarding this Report or our services, you grant BizHealth.ai a perpetual, irrevocable, royalty-free, worldwide license to use, modify, and incorporate such feedback into our products and services without any obligation to you.</p>
    </section>

    <!-- SECTION 6: REGULATORY COMPLIANCE & CONSUMER RIGHTS -->
    <section class="legal-section">
      <h2>6. REGULATORY COMPLIANCE & CONSUMER RIGHTS</h2>

      <h3>6.1 Not Regulated Advice</h3>
      <p>This Report does not constitute advice or services subject to professional licensing or regulatory oversight. BizHealth.ai is not registered, licensed, or authorized as a professional advisor in any jurisdiction. You should consult appropriately licensed professionals for advice in regulated areas.</p>

      <h3>6.2 Consumer Protection</h3>
      <p>Certain jurisdictions provide consumers with rights that cannot be waived or limited by contract. Nothing in these terms is intended to limit or exclude any rights you may have under applicable consumer protection laws that cannot be lawfully excluded or limited.</p>

      <h3>6.3 State-Specific Disclosures</h3>
      <p>Residents of certain U.S. states may have additional rights under state law. For example: (a) California residents may have rights under the California Consumer Privacy Act (CCPA); (b) Residents of other states may have rights under applicable state privacy or consumer protection laws. Please refer to our Privacy Policy for state-specific disclosures.</p>

      <h3>6.4 International Users</h3>
      <p>If you access this Report from outside the United States, you are responsible for compliance with local laws. This Report is provided from the United States and is subject to U.S. law. Some features or content may not be appropriate or available in all jurisdictions.</p>

      <h3>6.5 GDPR Compliance</h3>
      <p>For users in the European Economic Area, United Kingdom, or Switzerland, BizHealth.ai processes personal data in accordance with the General Data Protection Regulation (GDPR) and applicable local data protection laws. Our Privacy Policy provides additional information regarding your rights and our data processing practices.</p>

      <h3>6.6 Accessibility</h3>
      <p>BizHealth.ai is committed to making our services accessible to individuals with disabilities. If you experience accessibility issues with this Report, please contact us and we will endeavor to provide the information in an alternative format.</p>
    </section>

    <!-- SECTION 7: LEGAL DISPUTE RESOLUTION -->
    <section class="legal-section">
      <h2>7. LEGAL DISPUTE RESOLUTION</h2>

      <h3>7.1 Governing Law</h3>
      <p>These terms and any disputes arising out of or related to this Report shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles.</p>

      <h3>7.2 Arbitration Agreement</h3>
      <p>Any dispute, controversy, or claim arising out of or relating to this Report or these terms, including the formation, interpretation, breach, or termination thereof, shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted by a single arbitrator in Wilmington, Delaware, or another mutually agreed location.</p>

      <h3>7.3 Class Action Waiver</h3>
      <p>YOU AND BIZHEALTH.AI AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. The arbitrator may not consolidate more than one person's claims and may not preside over any form of class or representative proceeding.</p>

      <h3>7.4 Small Claims Exception</h3>
      <p>Notwithstanding the foregoing, either party may bring an individual action in small claims court if the claim qualifies for small claims jurisdiction.</p>

      <h3>7.5 Equitable Relief</h3>
      <p>Nothing in this section shall prevent either party from seeking injunctive or other equitable relief from a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights or confidentiality obligations.</p>

      <h3>7.6 Limitation Period</h3>
      <p>Any claim or cause of action arising out of or related to this Report must be filed within one (1) year after such claim or cause of action arose, or it shall be forever barred.</p>
    </section>

    <!-- SECTION 8: INDEMNIFICATION -->
    <section class="legal-section">
      <h2>8. INDEMNIFICATION</h2>
      <p>You agree to defend, indemnify, and hold harmless BizHealth.ai, its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of this Report; (b) any breach of these terms by you; (c) your violation of any third-party rights; (d) any decisions made or actions taken based on this Report; (e) your provision of inaccurate, incomplete, or misleading information; or (f) your violation of any applicable law or regulation.</p>
    </section>

    <!-- SECTION 9: MODIFICATIONS & UPDATES -->
    <section class="legal-section">
      <h2>9. MODIFICATIONS & UPDATES</h2>

      <h3>9.1 Modifications to Terms</h3>
      <p>BizHealth.ai reserves the right to modify these Legal Terms & Disclaimers at any time. Modified terms will apply to Reports generated after the effective date of the modification. We encourage you to review the terms applicable to each Report you receive.</p>

      <h3>9.2 Report Updates</h3>
      <p>BizHealth.ai may, but is not obligated to, provide updated versions of this Report. Any updated Report will be subject to the terms in effect at the time of generation. Previous versions of this Report may not reflect current conditions or updated methodologies.</p>
    </section>

    <!-- SECTION 10: TERMINATION & SURVIVAL -->
    <section class="legal-section">
      <h2>10. TERMINATION & SURVIVAL</h2>

      <h3>10.1 Termination</h3>
      <p>The license granted to use this Report may be terminated by BizHealth.ai at any time if you breach these terms. Upon termination, you must cease using this Report and destroy all copies in your possession.</p>

      <h3>10.2 Survival</h3>
      <p>The following provisions shall survive termination: Section 2 (Liability Limitations), Section 5 (Intellectual Property), Section 7 (Dispute Resolution), Section 8 (Indemnification), and any other provisions that by their nature should survive.</p>

      <h3>10.3 Effect of Termination</h3>
      <p>Termination of your license does not limit any other remedies available to BizHealth.ai and does not relieve you of your obligations under these terms.</p>
    </section>

    <!-- SECTION 11: MISCELLANEOUS PROVISIONS -->
    <section class="legal-section">
      <h2>11. MISCELLANEOUS PROVISIONS</h2>

      <h3>11.1 Entire Agreement</h3>
      <p>These Legal Terms & Disclaimers, together with our Terms of Service and Privacy Policy (available at www.bizhealth.ai/legal), constitute the entire agreement between you and BizHealth.ai regarding this Report and supersede all prior agreements and understandings.</p>

      <h3>11.2 Severability</h3>
      <p>If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>

      <h3>11.3 Waiver</h3>
      <p>No waiver of any term shall be deemed a further or continuing waiver of such term or any other term. BizHealth.ai's failure to enforce any provision of these terms shall not constitute a waiver of that provision.</p>

      <h3>11.4 Assignment</h3>
      <p>You may not assign or transfer your rights or obligations under these terms without BizHealth.ai's prior written consent. BizHealth.ai may assign its rights and obligations without restriction.</p>

      <h3>11.5 No Third-Party Beneficiaries</h3>
      <p>These terms do not create any third-party beneficiary rights. Nothing in these terms shall be construed to create any rights enforceable by any person or entity not a party hereto.</p>

      <h3>11.6 Force Majeure</h3>
      <p>BizHealth.ai shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.</p>

      <h3>11.7 Headings</h3>
      <p>The section headings in these terms are for convenience only and have no legal or contractual effect.</p>

      <h3>11.8 Language</h3>
      <p>These terms are provided in English. Any translations are provided for convenience only. In the event of any conflict between the English version and a translated version, the English version shall control.</p>
    </section>

    <!-- SECTION 12: CONTACT INFORMATION -->
    <section class="legal-section">
      <h2>12. CONTACT INFORMATION</h2>
      <p>If you have any questions about these Legal Terms & Disclaimers or this Report, please contact us at:</p>
      <address class="contact-block">
        <strong>BizHealth.ai, LLC</strong><br>
        Email: <a href="mailto:legal@bizhealth.ai">legal@bizhealth.ai</a><br>
        Website: <a href="https://www.bizhealth.ai/legal">www.bizhealth.ai/legal</a>
      </address>
    </section>
  `;
}

// ============================================================================
// STYLE GENERATION
// ============================================================================

/**
 * Generate CSS styles based on variant
 */
function generateLegalStyles(variant: 'comprehensive' | 'owners' | 'executive'): string {
  // Base styles (common to all variants)
  const baseStyles = `
    /* LEGAL TERMS PAGE - PRINT STYLING */
    @media print {
      .legal-terms-page {
        page-break-before: always;
        page-break-after: always;
      }

      .legal-content h2 {
        page-break-after: avoid;
      }

      .legal-section {
        page-break-inside: avoid;
      }

      .legal-acknowledgment {
        page-break-inside: avoid;
      }
    }

    /* HEADER BLOCK */
    .legal-terms-header {
      background-color: #212653; /* BizNavy */
      color: #FFFFFF;
      padding: 24px 40px;
      text-align: center;
      border-bottom: 4px solid #969423; /* BizGreen accent */
    }

    .legal-terms-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.5rem; /* 24px */
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .legal-terms-subtitle {
      font-family: 'Open Sans', sans-serif;
      font-size: 1rem; /* 16px */
      font-style: italic;
      color: #E5E7EB;
      margin: 0;
    }

    /* EMPATHETIC INTRODUCTION */
    .legal-intro {
      background-color: #F3F4F6;
      padding: 16px 24px;
      border-left: 4px solid #969423;
      margin: 24px 0;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #374151;
    }

    .legal-intro p {
      margin: 0;
    }

    /* DOCUMENT METADATA BLOCK */
    .legal-metadata {
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 24px;
      margin: 24px 0;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem;
      color: #374151;
    }

    .legal-metadata p {
      margin: 4px 0;
    }

    .legal-metadata strong {
      color: #212653;
    }

    /* BODY TEXT STYLING */
    .legal-content {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem; /* ~14px, equivalent to 11pt */
      line-height: 1.6;
      color: #374151;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    .legal-content h2 {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.125rem; /* 18px */
      font-weight: 600;
      color: #212653;
      margin-top: 32px;
      margin-bottom: 16px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 8px;
    }

    .legal-content h3 {
      font-family: 'Open Sans', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .legal-content p {
      margin: 12px 0;
      text-align: justify;
    }

    .legal-intro-text {
      background-color: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .legal-section {
      margin-bottom: 24px;
    }

    /* CONTACT BLOCK */
    .contact-block {
      font-style: normal;
      background-color: #F3F4F6;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .contact-block a {
      color: #212653;
      text-decoration: underline;
    }

    .contact-block a:hover {
      color: #969423;
    }

    /* ACKNOWLEDGMENT BLOCK */
    .legal-acknowledgment {
      background-color: #F3F4F6;
      border-left: 4px solid #212653;
      padding: 24px;
      margin-top: 40px;
      margin-bottom: 24px;
    }

    .acknowledgment-text {
      font-size: 0.875rem;
      color: #1F2937;
      margin: 0;
      text-transform: none;
    }

    .acknowledgment-text strong {
      display: block;
      margin-bottom: 8px;
      color: #212653;
    }

    /* FOOTER */
    .legal-footer {
      border-top: 2px solid #E5E7EB;
      padding-top: 24px;
      margin-top: 40px;
      text-align: center;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .legal-footer p {
      margin: 4px 0;
    }

    .legal-footer a {
      color: #212653;
      text-decoration: underline;
    }

    .legal-footer a:hover {
      color: #969423;
    }
  `;

  // Variant-specific styles
  let variantStyles = '';

  switch (variant) {
    case 'comprehensive':
      // Full 12 sections displayed, standard font size
      variantStyles = `
        /* COMPREHENSIVE VARIANT STYLES */
        .legal-content {
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .legal-content h2 {
          font-size: 1.125rem;
        }
      `;
      break;

    case 'owners':
      // Slightly condensed for owner's report
      variantStyles = `
        /* OWNERS VARIANT STYLES */
        .legal-content {
          font-size: 0.875rem;
          line-height: 1.5; /* Slightly condensed */
        }

        .legal-content h2 {
          font-size: 1rem; /* Slightly smaller */
        }

        .legal-content h3 {
          font-size: 0.9375rem;
        }
      `;
      break;

    case 'executive':
      // Collapsible accordion-style sections using CSS-only <details>/<summary>
      variantStyles = `
        /* EXECUTIVE VARIANT STYLES - CSS-only accordion */
        .legal-content {
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .legal-section {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .legal-section h2 {
          margin: 0;
          padding: 0;
          border: none;
        }

        .legal-details {
          border: none;
        }

        .legal-details summary {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #212653;
          padding: 16px;
          cursor: pointer;
          background-color: #F9FAFB;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .legal-details summary::-webkit-details-marker {
          display: none;
        }

        .legal-details summary::after {
          content: '+';
          font-size: 1.25rem;
          font-weight: 300;
          color: #969423;
          transition: transform 0.2s;
        }

        .legal-details[open] summary::after {
          content: '-';
        }

        .legal-details[open] summary {
          border-bottom: 1px solid #E5E7EB;
        }

        .legal-details-content {
          padding: 16px;
        }

        .legal-details-content h3 {
          margin-top: 16px;
        }

        .legal-details-content h3:first-child {
          margin-top: 0;
        }
      `;
      break;
  }

  return `
    <style>
      ${baseStyles}
      ${variantStyles}
    </style>
  `;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Build the Legal Terms & Disclaimers page HTML
 *
 * @param context - Context containing company name, report ID, generation date, and variant
 * @returns Complete HTML string for the legal terms page
 */
export function buildLegalTermsPage(context: LegalTermsContext): string {
  const { companyName, reportId, generatedAt, variant } = context;
  const formattedDate = formatDate(generatedAt);

  // Get styles for this variant
  const styles = generateLegalStyles(variant);

  // Get legal content
  const legalContent = generateLegalContent();

  // For executive variant, wrap sections in <details> elements
  let processedContent = legalContent;
  if (variant === 'executive') {
    processedContent = wrapSectionsInDetails(legalContent);
  }

  return `
    ${styles}
    <div class="legal-terms-page">
      <!-- HEADER -->
      <header class="legal-terms-header">
        <h1 class="legal-terms-title">Legal Terms & Disclaimers</h1>
        <p class="legal-terms-subtitle">Important Information About Your BizHealth.ai Report</p>
      </header>

      <div class="legal-content">
        <!-- EMPATHETIC INTRODUCTION -->
        <div class="legal-intro">
          <p>We want you to get maximum value from your BizHealth.ai report. To protect both you and us, the following terms clarify that this is AI-powered informational content only—not professional advice—and outline important limitations and privacy practices.</p>
        </div>

        <!-- DOCUMENT IDENTIFICATION -->
        <div class="legal-metadata">
          <p><strong>BizHealth.ai Client Report</strong></p>
          <p>Effective Date: ${formattedDate}</p>
          <p>Report ID: ${escapeHtml(reportId)}</p>
          <p>Client Entity: ${escapeHtml(companyName)}</p>
        </div>

        <!-- LEGAL CONTENT -->
        ${processedContent}

        <!-- ACKNOWLEDGMENT BLOCK -->
        <div class="legal-acknowledgment">
          <p class="acknowledgment-text">
            <strong>ACKNOWLEDGMENT</strong>
            BY ACCESSING OR USING THIS REPORT, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE LEGAL TERMS & DISCLAIMERS IN THEIR ENTIRETY.
          </p>
        </div>

        <!-- FOOTER -->
        <div class="legal-footer">
          <p>Copyright &copy; 2025 BizHealth.ai, LLC. All Rights Reserved.</p>
          <p>Document Version: 2.0 | Last Updated: November 19, 2025</p>
          <p>For complete Terms of Service and Privacy Policy, visit:
            <a href="https://www.bizhealth.ai/legal">www.bizhealth.ai/legal</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Wrap legal sections in <details>/<summary> elements for executive variant
 * Sections 1-6 are expanded by default; 7-12 are collapsed
 */
function wrapSectionsInDetails(content: string): string {
  // Parse sections and wrap them
  const sectionRegex = /<section class="legal-section">\s*<h2>(\d+)\.\s*([^<]+)<\/h2>([\s\S]*?)<\/section>/g;

  return content.replace(sectionRegex, (match, sectionNum, sectionTitle, sectionContent) => {
    const num = parseInt(sectionNum, 10);
    const isExpanded = num <= 6; // Sections 1-6 expanded by default

    return `
      <section class="legal-section">
        <details class="legal-details"${isExpanded ? ' open' : ''}>
          <summary>${sectionNum}. ${sectionTitle.trim()}</summary>
          <div class="legal-details-content">
            ${sectionContent}
          </div>
        </details>
      </section>
    `;
  });
}

/**
 * Generate just the legal terms styles (for inclusion in report stylesheets)
 */
export function getLegalTermsStyles(variant: 'comprehensive' | 'owners' | 'executive'): string {
  // Strip the <style> tags and return just the CSS
  const fullStyles = generateLegalStyles(variant);
  return fullStyles.replace(/<\/?style>/g, '').trim();
}
