/**
 * Cross-Reference Generator - Creates links between condensed and detailed content.
 *
 * Used when content is condensed to provide drill-down references to full details.
 */

import type {
  CrossReference,
  IntermediateFileType,
  ClientDeliverableType
} from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('CrossReferenceGenerator');

/**
 * Mapping of source files to their detailed report locations.
 */
const SOURCE_TO_DETAIL_MAP: Record<IntermediateFileType, {
  report: ClientDeliverableType | 'comprehensive';
  sectionPrefix: string;
}> = {
  quickWins: { report: 'comprehensive', sectionPrefix: 'section-recommendations' },
  risk: { report: 'comprehensive', sectionPrefix: 'section-risk-assessment' },
  roadmap: { report: 'comprehensive', sectionPrefix: 'section-implementation' },
  financial: { report: 'comprehensive', sectionPrefix: 'section-financial-analysis' },
  deepDiveGE: { report: 'comprehensive', sectionPrefix: 'chapter-ge' },
  deepDivePH: { report: 'comprehensive', sectionPrefix: 'chapter-ph' },
  deepDivePL: { report: 'comprehensive', sectionPrefix: 'chapter-pl' },
  deepDiveRS: { report: 'comprehensive', sectionPrefix: 'chapter-rs' }
};

/**
 * Report display names for cross-references.
 */
const REPORT_DISPLAY_NAMES: Record<ClientDeliverableType | 'comprehensive', string> = {
  comprehensive: 'Comprehensive Assessment Report',
  owner: "Owner's Report",
  executiveBrief: 'Executive Brief',
  salesMarketingManager: 'Sales & Marketing Manager Report',
  operationsManager: 'Operations Manager Report',
  financialsManager: 'Financials Manager Report',
  itTechnologyManager: 'IT & Technology Manager Report',
  strategyLeadershipManager: 'Strategy & Leadership Manager Report',
  employees: 'Employee Report'
};

/**
 * Generates cross-references for content integration.
 */
export class CrossReferenceGenerator {
  /**
   * Generate cross-references for condensed content.
   */
  public generate(
    sourceFile: IntermediateFileType,
    targetDeliverable: ClientDeliverableType,
    sectionLabel: string
  ): CrossReference[] {
    const references: CrossReference[] = [];

    // Get detail location for this source
    const detailLocation = SOURCE_TO_DETAIL_MAP[sourceFile];
    if (!detailLocation) {
      return references;
    }

    // Don't create self-references
    if (detailLocation.report === targetDeliverable) {
      return references;
    }

    // Create reference to detailed report
    references.push({
      label: 'Full Details',
      targetReport: detailLocation.report,
      targetSection: detailLocation.sectionPrefix,
      linkText: `See ${REPORT_DISPLAY_NAMES[detailLocation.report]} for full details`
    });

    // Add source-specific references
    const additionalRefs = this.getSourceSpecificReferences(sourceFile, targetDeliverable);
    references.push(...additionalRefs);

    return references;
  }

  /**
   * Generate HTML for cross-references section.
   */
  public generateHtml(
    references: CrossReference[],
    cssClass: string = 'integration-references'
  ): string {
    if (references.length === 0) {
      return '';
    }

    const links = references.map(ref => {
      const targetUrl = this.buildTargetUrl(ref);
      return `<a href="${targetUrl}" class="cross-reference" data-target="${ref.targetReport}:${ref.targetSection}">${ref.linkText}</a>`;
    });

    return `
      <div class="${cssClass}">
        <span class="reference-label">More Information:</span>
        ${links.join(' | ')}
      </div>
    `.trim();
  }

  /**
   * Generate cross-references for all deliverables from a source.
   */
  public generateForSource(
    sourceFile: IntermediateFileType
  ): Map<ClientDeliverableType, CrossReference[]> {
    const referenceMap = new Map<ClientDeliverableType, CrossReference[]>();

    // Generate references for each deliverable type
    const deliverables: ClientDeliverableType[] = [
      'comprehensive',
      'owner',
      'executiveBrief',
      'salesMarketingManager',
      'operationsManager',
      'financialsManager',
      'itTechnologyManager',
      'strategyLeadershipManager',
      'employees'
    ];

    for (const deliverable of deliverables) {
      const refs = this.generate(sourceFile, deliverable, '');
      if (refs.length > 0) {
        referenceMap.set(deliverable, refs);
      }
    }

    return referenceMap;
  }

  /**
   * Get source-specific additional references.
   */
  private getSourceSpecificReferences(
    sourceFile: IntermediateFileType,
    targetDeliverable: ClientDeliverableType
  ): CrossReference[] {
    const refs: CrossReference[] = [];

    switch (sourceFile) {
      case 'quickWins':
        // Quick wins reference risk and roadmap
        if (targetDeliverable !== 'comprehensive') {
          refs.push({
            label: 'Implementation Timeline',
            targetReport: 'comprehensive',
            targetSection: 'section-implementation',
            linkText: 'View implementation roadmap'
          });
        }
        break;

      case 'risk':
        // Risks reference mitigation in roadmap
        refs.push({
          label: 'Mitigation Plan',
          targetReport: 'comprehensive',
          targetSection: 'section-implementation',
          linkText: 'View risk mitigation roadmap'
        });
        break;

      case 'financial':
        // Financial references owner report investment section
        if (targetDeliverable !== 'owner') {
          refs.push({
            label: 'Investment Summary',
            targetReport: 'owner',
            targetSection: 'section-investment',
            linkText: "See Owner's Report for investment summary"
          });
        }
        break;

      case 'deepDiveGE':
      case 'deepDivePH':
      case 'deepDivePL':
      case 'deepDiveRS':
        // Deep dives reference related manager reports
        const relatedManagers = this.getRelatedManagers(sourceFile, targetDeliverable);
        for (const manager of relatedManagers) {
          refs.push({
            label: `${REPORT_DISPLAY_NAMES[manager]}`,
            targetReport: manager,
            targetSection: 'dimension-analysis',
            linkText: `See ${REPORT_DISPLAY_NAMES[manager]}`
          });
        }
        break;
    }

    return refs;
  }

  /**
   * Get related manager reports for a deep dive.
   */
  private getRelatedManagers(
    sourceFile: IntermediateFileType,
    currentDeliverable: ClientDeliverableType
  ): ClientDeliverableType[] {
    const chapterToManagers: Record<string, ClientDeliverableType[]> = {
      deepDiveGE: ['salesMarketingManager'],
      deepDivePH: ['operationsManager', 'financialsManager'],
      deepDivePL: ['operationsManager', 'strategyLeadershipManager'],
      deepDiveRS: ['itTechnologyManager', 'strategyLeadershipManager']
    };

    const managers = chapterToManagers[sourceFile] || [];
    return managers.filter(m => m !== currentDeliverable);
  }

  /**
   * Build target URL for cross-reference.
   */
  private buildTargetUrl(ref: CrossReference): string {
    // Build relative URL to target report and section
    const reportFile = this.getReportFilename(ref.targetReport);
    const sectionAnchor = ref.targetSection.replace(/^#/, '');

    return `${reportFile}#${sectionAnchor}`;
  }

  /**
   * Get filename for a report type.
   */
  private getReportFilename(report: ClientDeliverableType | 'comprehensive'): string {
    const filenames: Record<ClientDeliverableType | 'comprehensive', string> = {
      comprehensive: 'comprehensive.html',
      owner: 'owner.html',
      executiveBrief: 'executiveBrief.html',
      salesMarketingManager: 'managersSalesMarketing.html',
      operationsManager: 'managersOperations.html',
      financialsManager: 'managersFinancials.html',
      itTechnologyManager: 'managersItTechnology.html',
      strategyLeadershipManager: 'managersStrategy.html',
      employees: 'employees.html'
    };

    return filenames[report] || 'comprehensive.html';
  }

  /**
   * Create a simple inline cross-reference link.
   */
  public createInlineLink(
    targetReport: ClientDeliverableType | 'comprehensive',
    targetSection: string,
    linkText: string
  ): string {
    const url = this.buildTargetUrl({
      label: '',
      targetReport,
      targetSection,
      linkText
    });

    return `<a href="${url}" class="inline-cross-reference">${linkText}</a>`;
  }

  /**
   * Parse existing cross-references from HTML.
   */
  public parseFromHtml(html: string): CrossReference[] {
    const references: CrossReference[] = [];
    const regex = /<a[^>]*class="[^"]*cross-reference[^"]*"[^>]*data-target="([^:]+):([^"]+)"[^>]*>([^<]+)<\/a>/gi;

    let match;
    while ((match = regex.exec(html)) !== null) {
      references.push({
        label: match[3],
        targetReport: match[1] as ClientDeliverableType | 'comprehensive',
        targetSection: match[2],
        linkText: match[3]
      });
    }

    return references;
  }
}
