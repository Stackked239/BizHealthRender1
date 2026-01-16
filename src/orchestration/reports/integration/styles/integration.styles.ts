/**
 * CSS styles for integrated content sections.
 * Maintains BizHealth.ai brand consistency.
 */

export const INTEGRATION_STYLES = `
/* ============================================================================
   INTEGRATION STYLES - BizHealth.ai Content Integration System
   ============================================================================ */

/* Brand Colors */
:root {
  --biz-navy: #212653;
  --biz-green: #969423;
  --biz-grey: #7C7C7C;
  --biz-light-grey: #F5F5F5;
  --biz-white: #FFFFFF;
  --biz-success: #28a745;
  --biz-warning: #ffc107;
  --biz-danger: #dc3545;
}

/* ============================================================================
   TRANSFORM PATTERN: Labeled Sections
   ============================================================================ */

.integrated-section {
  margin: 2rem 0;
  padding: 1.5rem 2rem;
  border-left: 4px solid var(--biz-green);
  background: linear-gradient(to right, rgba(150, 148, 35, 0.05), transparent);
  border-radius: 0 8px 8px 0;
  position: relative;
}

.integrated-section .integration-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(33, 38, 83, 0.1);
}

.integrated-section .integration-header h2 {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--biz-navy);
  margin: 0;
}

.integration-badge {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  background: var(--biz-navy);
  color: white;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.integration-badge.strategic {
  background: var(--biz-green);
}

.integration-badge.deep-dive {
  background: var(--biz-navy);
}

.integrated-section .integration-content {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
}

.integrated-section .integration-content p {
  margin: 0 0 1rem 0;
}

.integrated-section .integration-content p:last-child {
  margin-bottom: 0;
}

.integrated-section .integration-content ul,
.integrated-section .integration-content ol {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.integrated-section .integration-content li {
  margin-bottom: 0.5rem;
}

/* ============================================================================
   SUPPLEMENT PATTERN: Deep Dive Enrichment
   ============================================================================ */

.deep-dive-supplement {
  margin: 1.5rem 0;
  margin-left: 1.5rem;
  padding: 1rem 1.5rem;
  border-left: 3px solid var(--biz-green);
  background: rgba(150, 148, 35, 0.03);
  border-radius: 0 6px 6px 0;
  position: relative;
}

.deep-dive-supplement .supplement-header {
  margin-bottom: 0.75rem;
}

.deep-dive-supplement .supplement-header h3 {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--biz-navy);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.deep-dive-supplement .supplement-content {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #444;
}

.deep-dive-supplement .supplement-content p {
  margin: 0 0 0.75rem 0;
}

.deep-dive-supplement .supplement-content p:last-child {
  margin-bottom: 0;
}

/* ============================================================================
   CROSS-REFERENCES
   ============================================================================ */

.integration-references,
.supplement-references {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #ccc;
  font-size: 0.875rem;
}

.reference-label {
  font-family: 'Open Sans', Arial, sans-serif;
  font-weight: 600;
  color: var(--biz-grey);
  margin-right: 0.5rem;
}

.cross-reference {
  font-family: 'Open Sans', Arial, sans-serif;
  color: var(--biz-navy);
  text-decoration: none;
  border-bottom: 1px dotted var(--biz-green);
  transition: color 0.2s, border-color 0.2s;
}

.cross-reference:hover {
  color: var(--biz-green);
  border-color: var(--biz-navy);
}

.inline-cross-reference {
  font-family: 'Open Sans', Arial, sans-serif;
  color: var(--biz-navy);
  text-decoration: none;
  border-bottom: 1px dotted var(--biz-green);
}

.inline-cross-reference:hover {
  color: var(--biz-green);
}

/* ============================================================================
   DEPTH-BASED STYLING
   ============================================================================ */

.depth-headline {
  font-weight: 600;
}

.depth-summary {
  font-size: 0.95rem;
}

.depth-standard {
  font-size: 1rem;
}

.depth-detailed {
  font-size: 1rem;
}

.depth-detailed .supporting-data {
  background: rgba(0, 0, 0, 0.02);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}

/* ============================================================================
   CALL TO ACTION
   ============================================================================ */

.cta {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(33, 38, 83, 0.05);
  border-radius: 4px;
  font-size: 0.9rem;
}

.cta strong {
  color: var(--biz-navy);
}

/* ============================================================================
   DATA ATTRIBUTES FOR TRACEABILITY
   ============================================================================ */

[data-source] {
  position: relative;
}

[data-integration-id] {
  position: relative;
}

/* Debug mode - show integration IDs */
.debug-mode [data-integration-id]::after {
  content: attr(data-integration-id);
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.55rem;
  color: #999;
  font-family: monospace;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 4px;
  border-radius: 2px;
}

/* ============================================================================
   RESPONSIVE STYLES
   ============================================================================ */

@media (max-width: 768px) {
  .integrated-section {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
  }

  .integrated-section .integration-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .deep-dive-supplement {
    margin-left: 0.75rem;
    padding: 0.75rem 1rem;
  }
}

/* ============================================================================
   PRINT STYLES
   ============================================================================ */

@media print {
  .integrated-section {
    break-inside: avoid;
    border-left-width: 2px;
    background: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    page-break-inside: avoid;
  }

  .deep-dive-supplement {
    break-inside: avoid;
    background: none;
    page-break-inside: avoid;
  }

  .integration-badge {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cross-reference {
    border-bottom: none;
    color: var(--biz-navy);
  }

  .cross-reference::after {
    content: ' (see ' attr(data-target) ')';
    font-style: italic;
    color: var(--biz-grey);
    font-size: 0.85em;
  }

  .cta {
    background: #f5f5f5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* ============================================================================
   ANIMATION (for interactive reports)
   ============================================================================ */

@media (prefers-reduced-motion: no-preference) {
  .integrated-section {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .integrated-section:hover {
    transform: translateX(2px);
    box-shadow: -4px 0 12px rgba(150, 148, 35, 0.1);
  }

  .deep-dive-supplement {
    transition: background-color 0.2s ease;
  }

  .deep-dive-supplement:hover {
    background: rgba(150, 148, 35, 0.06);
  }
}
`;

/**
 * Returns the integration styles as a <style> tag for embedding.
 */
export function getIntegrationStyleTag(): string {
  return `<style id="integration-styles">\n${INTEGRATION_STYLES}\n</style>`;
}

/**
 * Returns just the CSS content (without style tags).
 */
export function getIntegrationStylesCSS(): string {
  return INTEGRATION_STYLES;
}

/**
 * Inject integration styles into HTML document.
 */
export function injectIntegrationStyles(html: string): string {
  const styleTag = getIntegrationStyleTag();

  // Try to inject before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleTag}\n</head>`);
  }

  // Try to inject after opening <html> tag
  if (html.includes('<html')) {
    const match = html.match(/<html[^>]*>/i);
    if (match) {
      return html.replace(match[0], `${match[0]}\n<head>\n${styleTag}\n</head>`);
    }
  }

  // Prepend to document
  return `${styleTag}\n${html}`;
}
