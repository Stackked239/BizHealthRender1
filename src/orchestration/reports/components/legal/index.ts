/**
 * Legal Components Index
 *
 * Exports all legal-related components for BizHealth reports:
 * - Clickwrap Modal: Gates report access with terms acceptance
 * - Acceptance Banner: Compact confirmation banner
 * - Legal Accordion: Expandable legal sections at report bottom
 * - PDF Legal Handler: PDF-specific legal content formatting
 */

// Clickwrap Modal
export {
  generateClickwrapModal,
  generateClickwrapLegalContent,
  renderClickwrapModal,
} from './clickwrap-modal.component.js';

export type { ClickwrapConfig } from './clickwrap-modal.component.js';

// Acceptance Banner
export { generateAcceptanceBanner } from './acceptance-banner.component.js';

export type { AcceptanceBannerConfig } from './acceptance-banner.component.js';

// Legal Accordion
export {
  generateLegalAccordion,
  parseLegalContent,
  getDefaultLegalSections,
} from './legal-accordion.component.js';

export type { LegalSection } from './legal-accordion.component.js';

// PDF Legal Handler
export {
  generatePdfAcceptanceStamp,
  generatePdfLegalAppendix,
  generateFullLegalContentForPdf,
} from './pdf-legal-handler.js';

export type { PdfLegalConfig } from './pdf-legal-handler.js';
