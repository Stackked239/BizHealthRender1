/**
 * Content mappings for Deep Dive Reports (GE, PH, PL, RS).
 * These use the SUPPLEMENT pattern - enrichment subsections.
 */

import type { ContentRegistryEntry } from '../types/registry.types.js';
import type { IntermediateFileType } from '../types/content.types.js';

type DeepDiveFileType = Extract<IntermediateFileType, 'deepDiveGE' | 'deepDivePH' | 'deepDivePL' | 'deepDiveRS'>;

export const DEEP_DIVE_CONTENT_MAPPINGS: Record<DeepDiveFileType, ContentRegistryEntry> = {
  // =========================================================================
  // DEEP DIVE: GROWTH ENGINE (GE)
  // =========================================================================
  deepDiveGE: {
    sourceFile: 'deepDiveGE',
    integrationStrategy: 'supplement',
    description: 'Growth Engine chapter analysis: Strategy, Sales, Marketing, Customer Experience',
    expectedContentTypes: ['dimension_analysis', 'chapter_insight', 'finding', 'benchmark'],
    extractionConfig: {
      selectors: [
        {
          selector: '.dimension-section[data-dimension="STR"], #dimension-STR',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="SAL"], #dimension-SAL',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="MKT"], #dimension-MKT',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="CXP"], #dimension-CXP',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.chapter-insight, .key-finding',
          contentType: 'chapter_insight',
          required: false,
          titleSelector: '.insight-title, h3',
          contentSelector: '.insight-content'
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'salesMarketingManager',
        targetSection: '#dimension-SAL',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S3',
        label: 'Sales Dimension',
        supplementHeader: 'Deep Dive Insights: Sales Analysis',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with pipeline analysis, conversion metrics, revenue insights.'
      },
      {
        deliverable: 'salesMarketingManager',
        targetSection: '#dimension-MKT',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S4',
        label: 'Marketing Dimension',
        supplementHeader: 'Deep Dive Insights: Marketing Analysis',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with channel effectiveness, ROI analysis, demand generation metrics.'
      },
      {
        deliverable: 'salesMarketingManager',
        targetSection: '#dimension-CXP',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S5',
        label: 'Customer Experience Dimension',
        supplementHeader: 'Deep Dive Insights: Customer Experience',
        priority: 'medium',
        targetVoice: 'manager',
        targetDepth: 'standard',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with NPS trends, journey mapping, retention analysis.'
      }
    ]
  },

  // =========================================================================
  // DEEP DIVE: PERFORMANCE & HEALTH (PH)
  // =========================================================================
  deepDivePH: {
    sourceFile: 'deepDivePH',
    integrationStrategy: 'supplement',
    description: 'Performance & Health chapter analysis: Operations, Financials',
    expectedContentTypes: ['dimension_analysis', 'chapter_insight', 'finding', 'benchmark'],
    extractionConfig: {
      selectors: [
        {
          selector: '.dimension-section[data-dimension="OPS"], #dimension-OPS',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="FIN"], #dimension-FIN',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.chapter-insight, .key-finding',
          contentType: 'chapter_insight',
          required: false,
          titleSelector: '.insight-title, h3',
          contentSelector: '.insight-content'
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'operationsManager',
        targetSection: '#dimension-OPS',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S3',
        label: 'Operations Dimension',
        supplementHeader: 'Deep Dive Insights: Operations Analysis',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with efficiency metrics, process bottlenecks, capacity utilization.'
      },
      {
        deliverable: 'financialsManager',
        targetSection: '#dimension-FIN',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S4',
        label: 'Financials Dimension',
        supplementHeader: 'Deep Dive Insights: Financial Health',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with margin analysis, cost structure, working capital insights.'
      }
    ]
  },

  // =========================================================================
  // DEEP DIVE: PEOPLE & LEADERSHIP (PL)
  // =========================================================================
  deepDivePL: {
    sourceFile: 'deepDivePL',
    integrationStrategy: 'supplement',
    description: 'People & Leadership chapter analysis: HR, Leadership & Governance',
    expectedContentTypes: ['dimension_analysis', 'chapter_insight', 'finding', 'benchmark'],
    extractionConfig: {
      selectors: [
        {
          selector: '.dimension-section[data-dimension="HRS"], #dimension-HRS',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="LDG"], #dimension-LDG',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.chapter-insight, .key-finding',
          contentType: 'chapter_insight',
          required: false,
          titleSelector: '.insight-title, h3',
          contentSelector: '.insight-content'
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'operationsManager',
        targetSection: '#dimension-HRS',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S5',
        label: 'HR Dimension',
        supplementHeader: 'Deep Dive Insights: HR Operations',
        priority: 'medium',
        targetVoice: 'manager',
        targetDepth: 'standard',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with talent metrics, retention analysis, culture insights.'
      },
      {
        deliverable: 'strategyLeadershipManager',
        targetSection: '#dimension-LDG',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S4',
        label: 'Leadership Dimension',
        supplementHeader: 'Deep Dive Insights: Leadership Analysis',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with governance effectiveness, succession planning, decision-making analysis.'
      }
    ]
  },

  // =========================================================================
  // DEEP DIVE: RESILIENCE & SAFEGUARDS (RS)
  // =========================================================================
  deepDiveRS: {
    sourceFile: 'deepDiveRS',
    integrationStrategy: 'supplement',
    description: 'Resilience & Safeguards chapter analysis: Technology, IT/Data, Risk, Compliance',
    expectedContentTypes: ['dimension_analysis', 'chapter_insight', 'finding', 'benchmark'],
    extractionConfig: {
      selectors: [
        {
          selector: '.dimension-section[data-dimension="TIN"], #dimension-TIN',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="IDS"], #dimension-IDS',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="RMS"], #dimension-RMS',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.dimension-section[data-dimension="CMP"], #dimension-CMP',
          contentType: 'dimension_analysis',
          required: true,
          titleSelector: '.dimension-title, h2',
          contentSelector: '.dimension-content, .analysis-content'
        },
        {
          selector: '.chapter-insight, .key-finding',
          contentType: 'chapter_insight',
          required: false,
          titleSelector: '.insight-title, h3',
          contentSelector: '.insight-content'
        }
      ],
      extractVisualizations: true,
      extractStructuredData: true,
      minConfidenceThreshold: 0.7
    },
    targetMappings: [
      {
        deliverable: 'itTechnologyManager',
        targetSection: '#dimension-TIN',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S3',
        label: 'Technology & Innovation Dimension',
        supplementHeader: 'Deep Dive Insights: Technology & Innovation',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with tech stack analysis, innovation pipeline, digital maturity.'
      },
      {
        deliverable: 'itTechnologyManager',
        targetSection: '#dimension-IDS',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S4',
        label: 'IT & Data Security Dimension',
        supplementHeader: 'Deep Dive Insights: IT & Data Security',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with security posture, data governance, infrastructure analysis.'
      },
      {
        deliverable: 'strategyLeadershipManager',
        targetSection: '#dimension-RMS',
        targetSubsection: 'deep-dive-supplement',
        sectionNumber: 'S5',
        label: 'Risk Management Dimension',
        supplementHeader: 'Deep Dive Insights: Risk Management',
        priority: 'high',
        targetVoice: 'manager',
        targetDepth: 'detailed',
        includeVisualizations: true,
        includeCrossReferences: true,
        insertionPoint: 'after',
        transformationGuidance: 'Enrich with risk exposure analysis, mitigation strategies, resilience metrics.'
      }
    ]
  }
};
