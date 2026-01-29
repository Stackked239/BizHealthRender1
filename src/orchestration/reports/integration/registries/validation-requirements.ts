/**
 * Validation requirements for each client deliverable.
 * Defines what integrations are required and which are critical (fail pipeline).
 */

import type { ValidationRequirement } from '../types/registry.types.js';

export const VALIDATION_REQUIREMENTS: ValidationRequirement[] = [
  // =========================================================================
  // COMPREHENSIVE REPORT
  // =========================================================================
  {
    deliverable: 'comprehensive',
    requiredIntegrations: [
      {
        source: 'quickWins',
        section: '#section-recommendations',
        critical: true,
        description: 'Quick Wins in Recommendations section'
      },
      {
        source: 'risk',
        section: '#section-risk-assessment',
        critical: true,
        description: 'Full risk assessment'
      },
      {
        source: 'roadmap',
        section: '#section-implementation',
        critical: true,
        description: 'Implementation roadmap'
      },
      {
        source: 'financial',
        section: '#section-financial-analysis',
        critical: true,
        description: 'Financial impact analysis'
      }
    ],
    minCoveragePercent: 100
  },

  // =========================================================================
  // OWNER'S REPORT
  // =========================================================================
  {
    deliverable: 'owner',
    requiredIntegrations: [
      {
        source: 'quickWins',
        section: '#section-action-planning',
        critical: true,
        description: 'Quick Wins Action Plan'
      },
      {
        source: 'risk',
        section: '#section-risk-compliance',
        critical: true,
        description: 'Risk & Compliance Summary'
      },
      {
        source: 'roadmap',
        section: '#section-action-planning',
        critical: true,
        description: 'Strategic Roadmap'
      }
    ],
    minCoveragePercent: 100
  },

  // =========================================================================
  // EXECUTIVE BRIEF
  // =========================================================================
  {
    deliverable: 'executiveBrief',
    requiredIntegrations: [
      {
        source: 'quickWins',
        section: '#section-priorities',
        critical: true,
        description: 'Top 3 Quick Wins'
      },
      {
        source: 'risk',
        section: '#section-risks',
        critical: true,
        description: 'Critical Risks'
      }
    ],
    minCoveragePercent: 100
  },

  // =========================================================================
  // SALES & MARKETING MANAGER
  // =========================================================================
  {
    deliverable: 'salesMarketingManager',
    requiredIntegrations: [
      {
        source: 'deepDiveGE',
        section: '#dimension-SAL',
        critical: true,
        description: 'Sales dimension deep dive'
      },
      {
        source: 'deepDiveGE',
        section: '#dimension-MKT',
        critical: true,
        description: 'Marketing dimension deep dive'
      },
      {
        source: 'deepDiveGE',
        section: '#dimension-CXP',
        critical: false,
        description: 'Customer Experience deep dive'
      }
    ],
    minCoveragePercent: 80
  },

  // =========================================================================
  // OPERATIONS MANAGER
  // =========================================================================
  {
    deliverable: 'operationsManager',
    requiredIntegrations: [
      {
        source: 'deepDivePH',
        section: '#dimension-OPS',
        critical: true,
        description: 'Operations dimension deep dive'
      },
      {
        source: 'deepDivePL',
        section: '#dimension-HRS',
        critical: false,
        description: 'HR operations deep dive'
      }
    ],
    minCoveragePercent: 80
  },

  // =========================================================================
  // FINANCIALS MANAGER
  // =========================================================================
  {
    deliverable: 'financialsManager',
    requiredIntegrations: [
      {
        source: 'financial',
        section: '#section-financial-deep-dive',
        critical: true,
        description: 'Financial Deep Dive Analysis'
      },
      {
        source: 'deepDivePH',
        section: '#dimension-FIN',
        critical: true,
        description: 'Financials dimension deep dive'
      },
      {
        source: 'risk',
        section: '#section-financial-risks',
        critical: false,
        description: 'Financial risk exposure'
      }
    ],
    minCoveragePercent: 90
  },

  // =========================================================================
  // IT & TECHNOLOGY MANAGER
  // =========================================================================
  {
    deliverable: 'itTechnologyManager',
    requiredIntegrations: [
      {
        source: 'deepDiveRS',
        section: '#dimension-TIN',
        critical: true,
        description: 'Technology & Innovation deep dive'
      },
      {
        source: 'deepDiveRS',
        section: '#dimension-IDS',
        critical: true,
        description: 'IT & Data Security deep dive'
      }
    ],
    minCoveragePercent: 100
  },

  // =========================================================================
  // STRATEGY & LEADERSHIP MANAGER
  // =========================================================================
  {
    deliverable: 'strategyLeadershipManager',
    requiredIntegrations: [
      {
        source: 'deepDivePL',
        section: '#dimension-LDG',
        critical: true,
        description: 'Leadership dimension deep dive'
      },
      {
        source: 'deepDiveRS',
        section: '#dimension-RMS',
        critical: true,
        description: 'Risk Management deep dive'
      },
      {
        source: 'roadmap',
        section: '#section-strategic-roadmap',
        critical: false,
        description: 'Strategic Implementation Roadmap'
      }
    ],
    minCoveragePercent: 80
  },

  // =========================================================================
  // EMPLOYEES REPORT
  // =========================================================================
  {
    deliverable: 'employees',
    requiredIntegrations: [],  // No integrations - celebratory content only
    minCoveragePercent: 100   // Automatically passes (0/0 = 100%)
  }
];
