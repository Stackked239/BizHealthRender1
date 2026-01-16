/**
 * Canonical section title mapping between Owner's and Comprehensive Reports
 * This ensures stable cross-references even if templates are updated
 *
 * IMPORTANT: When updating section titles in Comprehensive Report,
 * also update this file to maintain reference integrity.
 * Run `npm run validate:reports` after any changes.
 */

export interface SectionMapping {
  /** Unique identifier for this mapping */
  id: string;
  /** Label shown in Owner's Report context */
  ownerLabel: string;
  /** Exact section title in Comprehensive Report (must match exactly) */
  comprehensiveSectionTitle: string;
  /** Anchor ID in Comprehensive Report for future linking */
  comprehensiveAnchor: string;
  /** Optional: Label shown in Executive Brief context */
  executiveBriefLabel?: string;
  /** Optional: Anchor ID in Executive Brief for linking */
  executiveBriefAnchor?: string;
}

export const SECTION_MAPPINGS: SectionMapping[] = [
  {
    id: 'executive-summary',
    ownerLabel: 'Business Health Overview',
    comprehensiveSectionTitle: 'Executive Summary',
    comprehensiveAnchor: 'executive-summary'
  },
  {
    id: 'growth-engine',
    ownerLabel: 'Growth & Revenue Strategy',
    comprehensiveSectionTitle: 'Chapter 1: Growth Engine Deep Dive',
    comprehensiveAnchor: 'chapter-growth-engine'
  },
  {
    id: 'performance-health',
    ownerLabel: 'Operations & Financial Health',
    comprehensiveSectionTitle: 'Chapter 2: Performance & Health Deep Dive',
    comprehensiveAnchor: 'chapter-performance-health'
  },
  {
    id: 'people-leadership',
    ownerLabel: 'People & Leadership',
    comprehensiveSectionTitle: 'Chapter 3: People & Leadership Deep Dive',
    comprehensiveAnchor: 'chapter-people-leadership'
  },
  {
    id: 'resilience-safeguards',
    ownerLabel: 'Risk & Compliance',
    comprehensiveSectionTitle: 'Chapter 4: Resilience & Safeguards Deep Dive',
    comprehensiveAnchor: 'chapter-resilience-safeguards'
  },
  {
    id: 'strategic-recommendations',
    ownerLabel: 'Strategic Priorities',
    comprehensiveSectionTitle: 'Strategic Recommendations',
    comprehensiveAnchor: 'strategic-recommendations'
  },
  {
    id: 'risk-assessment',
    ownerLabel: 'Risk Overview',
    comprehensiveSectionTitle: 'Comprehensive Risk Assessment',
    comprehensiveAnchor: 'risk-assessment'
  },
  {
    id: 'roadmap',
    ownerLabel: 'Execution Timeline',
    comprehensiveSectionTitle: '18-Month Implementation Roadmap',
    comprehensiveAnchor: 'implementation-roadmap'
  },
  {
    id: 'financial-impact',
    ownerLabel: 'Investment & ROI',
    comprehensiveSectionTitle: 'Financial Impact Analysis',
    comprehensiveAnchor: 'financial-impact'
  },
  {
    id: 'scorecard',
    ownerLabel: 'Performance Scorecard',
    comprehensiveSectionTitle: 'Business Health Scorecard',
    comprehensiveAnchor: 'health-scorecard'
  },
  // Executive Brief / Executive Health Snapshot sections
  {
    id: 'executive-health-snapshot',
    ownerLabel: 'Health Overview',
    comprehensiveSectionTitle: 'Executive Summary',
    comprehensiveAnchor: 'executive-summary',
    executiveBriefLabel: 'Executive Health Snapshot',
    executiveBriefAnchor: 'executive-snapshot'
  },
  {
    id: 'action-focus',
    ownerLabel: 'Key Actions',
    comprehensiveSectionTitle: 'Strategic Recommendations',
    comprehensiveAnchor: 'strategic-recommendations',
    executiveBriefLabel: 'Action Focus & Navigation',
    executiveBriefAnchor: 'action-focus'
  },
  {
    id: 'methods-legal-appendix',
    ownerLabel: 'Methods & Legal',
    comprehensiveSectionTitle: 'Assessment Methodology',
    comprehensiveAnchor: 'methodology',
    executiveBriefLabel: 'Methods & Legal Appendix',
    executiveBriefAnchor: 'methods-legal'
  },
  // Performance Scorecard and Quick Reference sections
  {
    id: 'scorecard',
    ownerLabel: 'Performance Scorecard',
    comprehensiveSectionTitle: 'Performance Scorecard & Metrics',
    comprehensiveAnchor: 'scorecard',
    executiveBriefLabel: 'Performance Scorecard',
    executiveBriefAnchor: 'scorecard'
  },
  {
    id: 'what-this-means',
    ownerLabel: 'What This Means',
    comprehensiveSectionTitle: 'Executive Summary',
    comprehensiveAnchor: 'executive-summary',
    executiveBriefLabel: 'Key Implications',
    executiveBriefAnchor: 'implications'
  },
  {
    id: 'chapter-performance',
    ownerLabel: 'Chapter Performance',
    comprehensiveSectionTitle: 'Chapter Performance Analysis',
    comprehensiveAnchor: 'chapter-analysis',
    executiveBriefLabel: 'Chapter Scores',
    executiveBriefAnchor: 'chapter-scores'
  }
];

/**
 * Get a section mapping by ID
 */
export function getSectionMapping(id: string): SectionMapping | undefined {
  return SECTION_MAPPINGS.find(m => m.id === id);
}

/**
 * Get the comprehensive section title for a given mapping ID
 */
export function getComprehensiveTitle(id: string): string {
  const mapping = getSectionMapping(id);
  return mapping?.comprehensiveSectionTitle || '';
}

/**
 * Get reference text for Owner's Report
 */
export function getReference(id: string): string {
  const mapping = getSectionMapping(id);
  if (!mapping) return '';
  return `See Comprehensive Report → "${mapping.comprehensiveSectionTitle}"`;
}

/**
 * Get all section mappings
 */
export function getAllSectionMappings(): SectionMapping[] {
  return [...SECTION_MAPPINGS];
}

/**
 * Get the executive brief label for a given mapping ID
 */
export function getExecutiveBriefLabel(id: string): string {
  const mapping = getSectionMapping(id);
  return mapping?.executiveBriefLabel || mapping?.ownerLabel || '';
}

/**
 * Get reference text for Executive Brief
 */
export function getExecutiveBriefReference(id: string): string {
  const mapping = getSectionMapping(id);
  if (!mapping) return '';
  return `See Comprehensive Report → "${mapping.comprehensiveSectionTitle}"`;
}
