/**
 * Executive Overview Constants
 *
 * Static configuration and content for the Executive Overview report.
 * This includes the routing map that directs readers to detailed reports.
 */

import type { ReportRouteEntry } from '../../../types/executive-overview.types.js';

/**
 * Report routing map entries
 *
 * These are static entries that help readers navigate to the appropriate
 * detailed report based on their information needs.
 */
export const ROUTING_MAP_ENTRIES: ReportRouteEntry[] = [
  {
    questionCategory: 'Sales pipeline, revenue growth, marketing effectiveness',
    recommendedReport: "Manager's Report - Sales & Marketing",
    reportDescription: 'Deep-dive on lead generation, conversion, and marketing ROI',
  },
  {
    questionCategory: 'Operational efficiency, process consistency, capacity',
    recommendedReport: "Manager's Report - Operations",
    reportDescription: 'Process analysis, bottleneck identification, improvement roadmap',
  },
  {
    questionCategory: 'Cash flow, margins, financial forecasting',
    recommendedReport: "Manager's Report - Financials",
    reportDescription: 'Financial health diagnostics and working capital optimization',
  },
  {
    questionCategory: 'Technology systems, IT security, automation',
    recommendedReport: "Manager's Report - IT & Technology",
    reportDescription: 'Systems integration, security posture, technology roadmap',
  },
  {
    questionCategory: 'Strategic direction, leadership, governance',
    recommendedReport: "Manager's Report - Strategy",
    reportDescription: 'Strategic clarity, leadership effectiveness, decision-making',
  },
  {
    questionCategory: 'Team engagement, culture, capability gaps',
    recommendedReport: 'Employee Newsletter',
    reportDescription: 'Employee perspective, engagement drivers, cultural health',
  },
  {
    questionCategory: 'Complete 360-degree view across all 12 dimensions',
    recommendedReport: 'Comprehensive Report',
    reportDescription: 'Full diagnostic encyclopedia with all metrics and analysis',
  },
  {
    questionCategory: 'Owner/CEO strategic decision guidance',
    recommendedReport: "Owner's Report",
    reportDescription: 'Executive-level synthesis with prioritized action plan',
  },
];

/**
 * Executive Overview configuration
 */
export const EXECUTIVE_OVERVIEW_CONFIG = {
  targetWordCount: { min: 2000, max: 3500 },
  targetPageCount: { min: 2, max: 3 },
  targetReadTimeMinutes: { min: 10, max: 15 },
  sections: [
    'header',
    'executiveSnapshot',
    'materialFindings',
    'strategicPriorities',
    'keyRisks',
    'executionView',
    'routingMap',
    'financialImpact',
    'successMetrics',
    'bottomLine',
    'disclaimer',
  ],
} as const;

/**
 * Section titles for consistent display
 */
export const SECTION_TITLES = {
  executiveSnapshot: 'Executive Snapshot',
  materialFindings: 'Material Findings',
  strategicPriorities: 'Strategic Priorities',
  keyRisks: 'Key Risks & Mitigations',
  executionView: '90-Day Execution View',
  routingMap: 'Where to Go Deeper',
  financialImpact: 'Financial Impact Summary',
  successMetrics: 'Success Metrics',
  bottomLine: 'The Bottom Line',
} as const;

/**
 * Trajectory labels for display
 */
export const TRAJECTORY_LABELS: Record<string, string> = {
  growing: 'Growing',
  stable: 'Stable',
  stagnating: 'Stagnating',
  declining: 'Declining',
} as const;

/**
 * Trajectory icons for visual representation
 */
export const TRAJECTORY_ICONS: Record<string, string> = {
  growing: '&#x25B2;', // Up arrow
  stable: '&#x25AC;', // Dash
  stagnating: '&#x25CF;', // Circle
  declining: '&#x25BC;', // Down arrow
} as const;

/**
 * Phase titles for execution roadmap
 */
export const EXECUTION_PHASE_TITLES = {
  days_1_30: 'Days 1-30: Stabilize & Establish Foundations',
  days_31_60: 'Days 31-60: Build Momentum',
  days_61_90: 'Days 61-90: Embed & Measure',
} as const;

/**
 * Phase focus descriptions
 */
export const EXECUTION_PHASE_FOCUS = {
  days_1_30: 'Quick wins, leadership alignment, and foundation-setting for larger initiatives.',
  days_31_60: 'Execute on primary initiatives while monitoring early metrics.',
  days_61_90: 'Lock in gains, course-correct as needed, and establish ongoing cadence.',
} as const;

/**
 * Timeline badge colors
 */
export const TIMELINE_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  '30-day': { bg: '#28a745', color: '#ffffff' },
  '60-day': { bg: '#17a2b8', color: '#ffffff' },
  '90-day': { bg: '#212653', color: '#ffffff' },
  '6-month': { bg: '#6c757d', color: '#ffffff' },
  '12-month': { bg: '#343a40', color: '#ffffff' },
} as const;

/**
 * Risk level colors
 */
export const RISK_LEVEL_COLORS: Record<string, string> = {
  high: '#dc3545',
  medium: '#ffc107',
  low: '#28a745',
} as const;
