/**
 * Content mappings for Strategic Reports (quickWins, risk, roadmap, financial).
 * These use the TRANSFORM pattern - embedded as labeled sections.
 */

import type { ContentRegistryEntry } from '../types/registry.types.js';
import type { IntermediateFileType } from '../types/content.types.js';

type StrategicFileType = Extract<IntermediateFileType, 'quickWins' | 'risk' | 'roadmap' | 'financial'>;

export const STRATEGIC_CONTENT_MAPPINGS: Record<StrategicFileType, ContentRegistryEntry> = {
  // =========================================================================
  // QUICK WINS
  // =========================================================================
  quickWins: {
    sourceFile: 'quickWins',
    integrationStrategy: 'transform',
    description: 'High-impact, low-effort opportunities for immediate action',
    expectedContentTypes: ['quick_win', 'recommendation'],
    extractionConfig: {
      selectors: [
        {
          selector: '.quick-win-item, .quick-win-card, [data-content-type="quick-win"]',
          contentType: 'quick_win',
          required: true,
          titleSelector: '.quick-win-title, h3, .title',
          contentSelector: '.quick-win-description, .content, .description',
          severitySelector: '.priority-badge, .impact-level, [data-priority]'
        },
        {
          selector: '.recommendation-card, [data-content-type="recommendation"]',
          contentType: 'recommendation',
          required: false,
          titleSelector: '.recommendation-title, h3',
          contentSelector: '.recommendation-content, .content'
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'owner',
        targetSection: '#section-action-planning',
        sectionNumber: 'S8',
        label: 'Quick Wins Action Plan',
        priority: 'high',
        targetVoice: 'owner',
        targetDepth: 'standard',
        maxItems: 10,
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'within',
        transformationGuidance: 'Focus on ROI and implementation timeline. Use owner-centric language.'
      },
      {
        deliverable: 'comprehensive',
        targetSection: '#section-recommendations',
        sectionNumber: 'S8',
        label: 'Immediate Opportunities',
        priority: 'medium',
        targetVoice: 'executive',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: false,
        insertionPoint: 'within',
        transformationGuidance: 'Provide full detail with evidence. Maintain analytical tone.'
      },
      {
        deliverable: 'executiveBrief',
        targetSection: '#section-priorities',
        sectionNumber: 'S3',
        label: 'Top 3 Quick Wins',
        priority: 'high',
        targetVoice: 'executive',
        targetDepth: 'summary',
        maxItems: 3,
        includeVisualizations: false,
        includeCrossReferences: true,
        insertionPoint: 'within',
        transformationGuidance: 'Condense to headline impact. Enable drill-down via cross-reference.'
      }
    ]
  },

  // =========================================================================
  // RISK
  // =========================================================================
  risk: {
    sourceFile: 'risk',
    integrationStrategy: 'transform',
    description: 'Risk assessment and mitigation strategies',
    expectedContentTypes: ['risk', 'recommendation'],
    extractionConfig: {
      selectors: [
        {
          selector: '.risk-item, .risk-card, [data-content-type="risk"]',
          contentType: 'risk',
          required: true,
          titleSelector: '.risk-title, h3, .title',
          contentSelector: '.risk-description, .content, .narrative',
          severitySelector: '.severity-badge, .risk-level, [data-severity]'
        },
        {
          selector: '.risk-matrix, .risk-heatmap',
          contentType: 'risk',
          required: false
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.8
    },
    targetMappings: [
      {
        deliverable: 'comprehensive',
        targetSection: '#section-risk-assessment',
        sectionNumber: 'S6',
        label: 'Risk Assessment & Mitigation Strategy',
        priority: 'high',
        targetVoice: 'executive',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: false,
        insertionPoint: 'replace',
        transformationGuidance: 'Full risk matrix with mitigation strategies. Maintain severity rankings.'
      },
      {
        deliverable: 'owner',
        targetSection: '#section-risk-compliance',
        sectionNumber: 'S7',
        label: 'Risk & Compliance Summary',
        priority: 'high',
        targetVoice: 'owner',
        targetDepth: 'standard',
        maxItems: 10,
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'replace',
        transformationGuidance: 'Focus on owner-actionable risks. Link to detailed Comprehensive Report.'
      },
      {
        deliverable: 'executiveBrief',
        targetSection: '#section-risks',
        sectionNumber: 'S4',
        label: 'Critical Risks',
        priority: 'high',
        targetVoice: 'executive',
        targetDepth: 'headline',
        maxItems: 3,
        includeVisualizations: false,
        includeCrossReferences: true,
        insertionPoint: 'replace',
        transformationGuidance: 'Top 3 risks only with mitigation status. Keep concise.'
      },
      {
        deliverable: 'financialsManager',
        targetSection: '#section-financial-risks',
        sectionNumber: 'S5',
        label: 'Financial Risk Exposure',
        priority: 'medium',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'within',
        transformationGuidance: 'Filter to financial risks. Include quantified exposure.'
      }
    ]
  },

  // =========================================================================
  // ROADMAP
  // =========================================================================
  roadmap: {
    sourceFile: 'roadmap',
    integrationStrategy: 'transform',
    description: 'Implementation timeline and phased execution plan',
    expectedContentTypes: ['roadmap_phase', 'recommendation'],
    extractionConfig: {
      selectors: [
        {
          selector: '.roadmap-phase, .phase-card, [data-content-type="phase"]',
          contentType: 'roadmap_phase',
          required: true,
          titleSelector: '.phase-title, h3, .title',
          contentSelector: '.phase-content, .milestones, .content'
        },
        {
          selector: '.roadmap-timeline, .gantt-chart, .timeline-visualization',
          contentType: 'roadmap_phase',
          required: false
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'comprehensive',
        targetSection: '#section-implementation',
        sectionNumber: 'S8',
        label: 'Implementation Roadmap',
        priority: 'high',
        targetVoice: 'executive',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: false,
        insertionPoint: 'replace',
        transformationGuidance: 'Full 5-phase timeline with dependencies and milestones.'
      },
      {
        deliverable: 'owner',
        targetSection: '#section-action-planning',
        sectionNumber: 'S8',
        label: '90/180/365-Day Strategic Roadmap',
        priority: 'high',
        targetVoice: 'owner',
        targetDepth: 'standard',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Focus on owner accountability. Clear milestone dates.'
      },
      {
        deliverable: 'strategyLeadershipManager',
        targetSection: '#section-strategic-roadmap',
        sectionNumber: 'S6',
        label: 'Strategic Implementation Roadmap',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'within',
        transformationGuidance: 'Full timeline with resource requirements and dependencies.'
      }
    ]
  },

  // =========================================================================
  // FINANCIAL
  // =========================================================================
  financial: {
    sourceFile: 'financial',
    integrationStrategy: 'transform',
    description: 'Financial impact analysis, projections, and ROI',
    expectedContentTypes: ['financial_metric', 'financial_projection'],
    extractionConfig: {
      selectors: [
        {
          selector: '.financial-metric, .kpi-card, [data-content-type="financial-metric"]',
          contentType: 'financial_metric',
          required: true
        },
        {
          selector: '.financial-projection, .roi-analysis, [data-content-type="projection"]',
          contentType: 'financial_projection',
          required: true
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.8
    },
    targetMappings: [
      {
        deliverable: 'comprehensive',
        targetSection: '#section-financial-analysis',
        sectionNumber: 'S6',
        label: 'Financial Impact Analysis',
        priority: 'high',
        targetVoice: 'executive',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: false,
        insertionPoint: 'replace',
        transformationGuidance: 'Full investment projections, cost-benefit, payback periods.'
      },
      {
        deliverable: 'financialsManager',
        targetSection: '#section-financial-deep-dive',
        sectionNumber: 'S3',
        label: 'Financial Deep Dive Analysis',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: false,
        insertionPoint: 'replace',
        transformationGuidance: 'Complete financial analysis with CFO-relevant metrics.'
      },
      {
        deliverable: 'owner',
        targetSection: '#section-investment',
        sectionNumber: 'S6',
        label: 'Investment Summary',
        priority: 'medium',
        targetVoice: 'owner',
        targetDepth: 'summary',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'within',
        transformationGuidance: 'Key investment requirements and expected returns. Link to detailed analysis.'
      }
    ]
  }
};
