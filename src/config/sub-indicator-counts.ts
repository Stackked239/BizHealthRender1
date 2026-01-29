/**
 * Expected sub-indicator counts per dimension
 * Used for quality tracking validation
 *
 * These counts are derived from SUB_INDICATOR_DEFINITIONS in idm.types.ts
 * Each dimension has 5 canonical sub-indicators in the BizHealth framework.
 */

import type { DimensionCode } from '../types/quality.js';

/**
 * Expected sub-indicator counts per dimension
 * All dimensions have 5 sub-indicators in the canonical BizHealth framework
 */
export const SUB_INDICATOR_COUNTS: Record<DimensionCode, number> = {
  STR: 5,   // Strategy: Competitive Differentiation, Market Position, Growth Planning, Strategic Review, Exit/Growth Strategy
  SAL: 5,   // Sales: Target Alignment, Pipeline Management, Sales Cycle Efficiency, Customer Retention, Upselling Effectiveness
  MKT: 5,   // Marketing: Brand Awareness, Customer Targeting, Marketing Economics, Marketing ROI, Channel Strategy
  CXP: 5,   // Customer Experience: Feedback Systems, Customer Satisfaction, Net Promoter Score, Issue Resolution, Response Time
  OPS: 5,   // Operations: Operational Efficiency, Process Documentation, Operational Reliability, Lean Practices, Resource Utilization
  FIN: 5,   // Financials: Financial Controls, Cash Management, Profitability, Financial Planning, Growth Readiness
  HRS: 5,   // Human Resources: HR Infrastructure, Company Culture, Talent Acquisition, Employee Development, Performance Management
  LDG: 5,   // Leadership & Governance: Leadership Effectiveness, Decision-Making Structure, Board Oversight, Leadership Culture, Development & Mentorship
  TIN: 5,   // Technology & Innovation: Technology Investment, Innovation Culture, Technology Adoption, Automation Utilization, Innovation Impact
  ITD: 5,   // IT & Data Security: IT Infrastructure, Network Effectiveness, Cybersecurity, Data Management, IT Scalability
  RMS: 5,   // Risk Management & Sustainability: Risk Outlook, Risk Identification, Risk Mitigation, Business Continuity, Strategic Adaptability
  CMP: 5    // Compliance: Compliance Awareness, Policy Adherence, Compliance Monitoring, Documentation, Incident Reporting
};

/**
 * Total expected sub-indicators across all dimensions
 * 12 dimensions × 5 sub-indicators = 60 total
 */
export const TOTAL_EXPECTED_SUB_INDICATORS = Object.values(SUB_INDICATOR_COUNTS)
  .reduce((sum, count) => sum + count, 0);

/**
 * Expected question counts per dimension
 * Based on QUESTION_MAPPINGS in idm.types.ts
 */
export const EXPECTED_QUESTION_COUNTS: Record<DimensionCode, number> = {
  STR: 7,   // Strategy: 7 questions
  SAL: 8,   // Sales: 8 questions
  MKT: 9,   // Marketing: 9 questions
  CXP: 7,   // Customer Experience: 7 questions
  OPS: 6,   // Operations: 6 questions
  FIN: 12,  // Financials: 12 questions
  HRS: 7,   // Human Resources: 7 questions
  LDG: 7,   // Leadership & Governance: 7 questions
  TIN: 7,   // Technology & Innovation: 7 questions
  ITD: 7,   // IT & Data Security: 7 questions (mapped as IDS in legacy)
  RMS: 8,   // Risk Management & Sustainability: 8 questions
  CMP: 8    // Compliance: 8 questions
};

/**
 * Total expected questions across all dimensions
 * Based on the 87 questionnaire questions in QUESTION_MAPPINGS
 */
export const TOTAL_EXPECTED_QUESTIONS = Object.values(EXPECTED_QUESTION_COUNTS)
  .reduce((sum, count) => sum + count, 0);
