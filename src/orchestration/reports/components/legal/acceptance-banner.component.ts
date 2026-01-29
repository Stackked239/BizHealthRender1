/**
 * Acceptance Banner Component
 * Displays compact confirmation that terms were accepted
 * Replaces lengthy legal block at top of report
 */

export interface AcceptanceBannerConfig {
  termsVersion: string;
  showViewTermsLink: boolean;
}

/**
 * Generate the acceptance banner HTML
 * This compact banner replaces the lengthy legal block at the top of the report
 *
 * @param config - Configuration for the acceptance banner
 * @returns Complete HTML string for the acceptance banner
 */
export function generateAcceptanceBanner(config: AcceptanceBannerConfig): string {
  return `
    <div class="terms-acceptance-banner">
      <div class="banner-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-1 15l-5-5 1.41-1.41L9 12.17l7.59-7.59L18 6l-9 9z" fill="#969423"/>
        </svg>
      </div>
      <div class="banner-content">
        <span class="banner-text">
          <strong>Terms Accepted</strong> — This report is provided for informational purposes only and does not constitute professional advice.
        </span>
        ${config.showViewTermsLink ? `
          <a href="#legal-terms-section" class="view-terms-link">View Full Terms</a>
        ` : ''}
      </div>
    </div>

    <style>
      .terms-acceptance-banner {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, rgba(150, 148, 35, 0.08) 0%, rgba(150, 148, 35, 0.04) 100%);
        border: 1px solid rgba(150, 148, 35, 0.2);
        border-radius: 8px;
        margin-bottom: 2rem;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .banner-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .banner-content {
        flex: 1;
      }

      .banner-text {
        color: #555;
      }

      .banner-text strong {
        color: #212653;
      }

      .view-terms-link {
        display: inline-block;
        margin-left: 0.5rem;
        color: #969423;
        text-decoration: none;
        font-weight: 600;
      }

      .view-terms-link:hover {
        text-decoration: underline;
      }

      @media print {
        .terms-acceptance-banner {
          background: #f8f9fa !important;
          border-color: #ddd !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .view-terms-link {
          display: none;
        }
      }
    </style>
  `;
}
