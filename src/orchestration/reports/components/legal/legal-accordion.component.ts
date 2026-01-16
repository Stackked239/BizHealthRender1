/**
 * Legal Accordion Component
 * Displays full terms in collapsible sections at bottom of report
 * All sections collapsed by default for minimal visual footprint
 */

export interface LegalSection {
  id: string;
  title: string;
  content: string;
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
 * Generate the legal accordion HTML
 * Displays full terms in collapsible sections at the bottom of the report
 *
 * @param sections - Array of legal sections to display
 * @returns Complete HTML string for the legal accordion
 */
export function generateLegalAccordion(sections: LegalSection[]): string {
  const accordionItems = sections.map((section) => `
    <div class="legal-accordion-item">
      <button class="legal-accordion-header"
              aria-expanded="false"
              aria-controls="legal-content-${escapeHtml(section.id)}"
              id="legal-header-${escapeHtml(section.id)}">
        <span class="accordion-icon">▶</span>
        <span class="accordion-title">${escapeHtml(section.title)}</span>
      </button>
      <div class="legal-accordion-content"
           id="legal-content-${escapeHtml(section.id)}"
           role="region"
           aria-labelledby="legal-header-${escapeHtml(section.id)}"
           hidden>
        <div class="accordion-content-inner">
          ${section.content}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <section id="legal-terms-section" class="legal-accordion-section">
      <div class="legal-section-header">
        <h2>
          <span class="legal-icon">📋</span>
          Legal Terms &amp; Disclaimers
        </h2>
        <p class="legal-section-subtitle">
          Click any section below to expand and view full details.
        </p>
      </div>

      <div class="legal-accordion">
        ${accordionItems}
      </div>

      <div class="legal-footer">
        <p>Terms Version: 2025.1 | © 2025 BizHealth.ai | All Rights Reserved</p>
      </div>
    </section>

    <style>
      .legal-accordion-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 2px solid #e9ecef;
      }

      .legal-section-header {
        margin-bottom: 1.5rem;
      }

      .legal-section-header h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        color: #212653;
        margin-bottom: 0.5rem;
      }

      .legal-icon {
        font-size: 1.25rem;
      }

      .legal-section-subtitle {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
      }

      .legal-accordion {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
      }

      .legal-accordion-item {
        border-bottom: 1px solid #e9ecef;
      }

      .legal-accordion-item:last-child {
        border-bottom: none;
      }

      .legal-accordion-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: #f8f9fa;
        border: none;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: #212653;
        text-align: left;
        transition: background 0.2s ease;
      }

      .legal-accordion-header:hover {
        background: #f0f0f0;
      }

      .legal-accordion-header[aria-expanded="true"] {
        background: #212653;
        color: white;
      }

      .accordion-icon {
        font-size: 0.75rem;
        transition: transform 0.2s ease;
      }

      .legal-accordion-header[aria-expanded="true"] .accordion-icon {
        transform: rotate(90deg);
      }

      .legal-accordion-content {
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .legal-accordion-content[hidden] {
        display: none;
      }

      .accordion-content-inner {
        padding: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.7;
        color: #444;
      }

      .accordion-content-inner p {
        margin-bottom: 0.75rem;
      }

      .accordion-content-inner ul {
        margin: 0.5rem 0 1rem 1.25rem;
      }

      .accordion-content-inner li {
        margin-bottom: 0.25rem;
      }

      .legal-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.8rem;
        color: #888;
      }

      /* Print: Expand all sections */
      @media print {
        .legal-accordion-content {
          display: block !important;
        }

        .legal-accordion-content[hidden] {
          display: block !important;
        }

        .legal-accordion-header {
          background: #f8f9fa !important;
          color: #212653 !important;
        }

        .accordion-icon {
          display: none;
        }
      }
    </style>

    <script>
      (function() {
        const headers = document.querySelectorAll('.legal-accordion-header');

        headers.forEach(function(header) {
          header.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            const content = document.getElementById(this.getAttribute('aria-controls'));

            // Toggle this section
            this.setAttribute('aria-expanded', !expanded);
            content.hidden = expanded;
          });
        });
      })();
    </script>
  `;
}

/**
 * Parses existing legal HTML content into structured sections
 * This function extracts sections from the existing legal content
 */
export function parseLegalContent(rawLegalHtml: string): LegalSection[] {
  const sections: LegalSection[] = [
    {
      id: 'disclaimer',
      title: 'Professional Services Disclaimer',
      content: extractSection(rawLegalHtml, 'Professional Services Disclaimer', 'disclaimer') ||
               extractSection(rawLegalHtml, 'Nature of Service', 'disclaimer')
    },
    {
      id: 'accuracy',
      title: 'Data Accuracy & Limitations',
      content: extractSection(rawLegalHtml, 'Data Accuracy', 'accuracy') ||
               extractSection(rawLegalHtml, 'No Guarantee', 'accuracy')
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: extractSection(rawLegalHtml, 'Limitation of Liability', 'liability') ||
               extractSection(rawLegalHtml, 'Liability Limitations', 'liability')
    },
    {
      id: 'ip',
      title: 'Intellectual Property Rights',
      content: extractSection(rawLegalHtml, 'Intellectual Property', 'ip') ||
               extractSection(rawLegalHtml, 'Proprietary Rights', 'ip')
    },
    {
      id: 'indemnification',
      title: 'Indemnification',
      content: extractSection(rawLegalHtml, 'Indemnification', 'indemnification')
    },
    {
      id: 'confidentiality',
      title: 'Confidentiality',
      content: extractSection(rawLegalHtml, 'Confidentiality', 'confidentiality')
    },
    {
      id: 'governing-law',
      title: 'Governing Law & Jurisdiction',
      content: extractSection(rawLegalHtml, 'Governing Law', 'governing-law') ||
               extractSection(rawLegalHtml, 'Jurisdiction', 'governing-law') ||
               extractSection(rawLegalHtml, 'Dispute Resolution', 'governing-law')
    },
    {
      id: 'force-majeure',
      title: 'Force Majeure',
      content: extractSection(rawLegalHtml, 'Force Majeure', 'force-majeure')
    },
    {
      id: 'entire-agreement',
      title: 'Entire Agreement & Amendments',
      content: extractSection(rawLegalHtml, 'Entire Agreement', 'entire-agreement') ||
               extractSection(rawLegalHtml, 'Amendment', 'entire-agreement') ||
               extractSection(rawLegalHtml, 'Modifications', 'entire-agreement')
    }
  ].filter(s => s.content && s.content.trim().length > 0);

  return sections;
}

/**
 * Extract a section from HTML content based on a search term
 */
function extractSection(html: string, searchTerm: string, _fallbackId: string): string {
  // Simple extraction - looks for heading containing searchTerm and grabs content until next heading
  const regex = new RegExp(
    `<h[23][^>]*>[^<]*${searchTerm}[^<]*</h[23]>([\\s\\S]*?)(?=<h[23]|$)`,
    'i'
  );

  const match = html.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }

  return '';
}

/**
 * Generate default legal sections when parsing fails
 * These are the standard legal sections for BizHealth.ai reports
 */
export function getDefaultLegalSections(): LegalSection[] {
  return [
    {
      id: 'disclaimer',
      title: 'Professional Services Disclaimer',
      content: `
        <p>This Report is provided for general informational and educational purposes only. It is designed to offer insights into your business operations based on the data you have provided. The Report does not constitute professional advice of any kind, including but not limited to legal, financial, tax, accounting, investment, or business consulting advice.</p>
        <p>BizHealth.ai is not a law firm, accounting firm, financial advisory firm, or professional consulting practice. The information contained in this Report should not be relied upon as a substitute for consultation with qualified professionals who can provide advice tailored to your specific circumstances.</p>
      `
    },
    {
      id: 'accuracy',
      title: 'Data Accuracy & Limitations',
      content: `
        <p>The analyses, scores, recommendations, and other outputs in this Report are based solely on the information you provided through the assessment questionnaire. BizHealth.ai does not independently verify the accuracy, completeness, or reliability of the data you submitted.</p>
        <p>If any information provided was inaccurate, incomplete, or outdated, the findings and recommendations in this Report may not accurately reflect your business situation.</p>
        <p>Any projections, forecasts, potential savings, ROI estimates, or expected outcomes presented in this Report are illustrative only and based on assumptions that may not hold true in your specific circumstances. Actual results may vary significantly.</p>
      `
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: `
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BIZHEALTH.AI, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.</p>
        <p>IF, NOTWITHSTANDING THE FOREGOING, BIZHEALTH.AI IS FOUND LIABLE FOR ANY LOSS OR DAMAGE ARISING OUT OF OR IN CONNECTION WITH THIS REPORT, OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE LESSER OF: (A) THE AMOUNT YOU PAID TO BIZHEALTH.AI FOR THIS SPECIFIC REPORT; OR (B) ONE HUNDRED UNITED STATES DOLLARS (USD $100.00).</p>
      `
    },
    {
      id: 'ip',
      title: 'Intellectual Property Rights',
      content: `
        <p>This Report, including all content, analyses, scores, recommendations, formatting, design, graphics, and presentation, constitutes proprietary intellectual property of BizHealth.ai. All rights, title, and interest in and to the Report remain exclusively with BizHealth.ai.</p>
        <p>You are granted a limited, non-exclusive, non-transferable license to use this Report solely for your internal business purposes.</p>
        <p>You may not: (a) reproduce, distribute, or publicly display this Report, in whole or in part, except as expressly permitted herein; (b) modify, adapt, translate, or create derivative works based on this Report; (c) reverse engineer, decompile, or attempt to extract the underlying methodologies, algorithms, or scoring systems.</p>
      `
    },
    {
      id: 'indemnification',
      title: 'Indemnification',
      content: `
        <p>You agree to defend, indemnify, and hold harmless BizHealth.ai, its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of this Report; (b) any breach of these terms by you; (c) your violation of any third-party rights; (d) any decisions made or actions taken based on this Report.</p>
      `
    },
    {
      id: 'confidentiality',
      title: 'Confidentiality',
      content: `
        <p>This Report contains confidential information about your business. You agree to maintain the confidentiality of this Report and not disclose its contents to third parties without prior written consent, except as required by law or to your professional advisors who have a legitimate need to review it, provided they agree to maintain its confidentiality.</p>
      `
    },
    {
      id: 'governing-law',
      title: 'Governing Law & Dispute Resolution',
      content: `
        <p>These terms and any disputes arising out of or related to this Report shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles.</p>
        <p>Any dispute, controversy, or claim arising out of or relating to this Report or these terms shall be resolved by binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.</p>
        <p>YOU AND BIZHEALTH.AI AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</p>
      `
    },
    {
      id: 'force-majeure',
      title: 'Force Majeure',
      content: `
        <p>BizHealth.ai shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.</p>
      `
    },
    {
      id: 'entire-agreement',
      title: 'Entire Agreement & Amendments',
      content: `
        <p>These Legal Terms & Disclaimers, together with our Terms of Service and Privacy Policy (available at www.bizhealth.ai/legal), constitute the entire agreement between you and BizHealth.ai regarding this Report and supersede all prior agreements and understandings.</p>
        <p>BizHealth.ai reserves the right to modify these Legal Terms & Disclaimers at any time. Modified terms will apply to Reports generated after the effective date of the modification.</p>
      `
    }
  ];
}
