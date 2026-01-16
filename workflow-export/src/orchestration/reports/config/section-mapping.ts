/**
 * Canonical section title mapping between Owner's and Comprehensive Reports
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
  /** Anchor ID in Comprehensive Report for deep linking */
  comprehensiveAnchor: string;
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
