/**
 * Manager Prioritization Panel Module
 *
 * Surfaces Phase 1.5 prioritizationMatrix data in a manager-relevant format.
 * Filters priorities to each manager's focus categories.
 *
 * @module manager-prioritization
 */

import type { CategoryCode } from '../../../data/question-category-mapping.js';
import type { PriorityScore, CategoryAnalysis } from '../../../types/phase1-5.types.js';
import type { ManagerType } from './manager-quickwins.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Priority band classification
 */
export type PriorityBand = 'High Priority' | 'Medium Priority' | 'Lower Priority';

/**
 * Manager priority item with enriched data
 */
export interface ManagerPriorityItem {
  categoryCode: CategoryCode;
  categoryName: string;
  score: number;
  priorityScore: number;
  priorityBand: PriorityBand;
  recommendation: string;
  urgency?: number;
  impact?: number;
  effort?: number;
}

// ============================================================================
// CATEGORY MAPPINGS
// ============================================================================

/**
 * Category codes per manager type
 */
const MANAGER_CATEGORY_MAP: Record<ManagerType, CategoryCode[]> = {
  SalesMarketing: ['SAL', 'MKT', 'CXP', 'STR'],
  Operations: ['OPS', 'HRS', 'CXP', 'CMP'],
  Financials: ['FIN', 'CMP', 'RMS'],
  ITTechnology: ['TIN', 'ITD', 'RMS'],
  StrategyLeadership: ['STR', 'LDG', 'RMS']
};

/**
 * Category display names
 */
const CATEGORY_NAMES: Record<CategoryCode, string> = {
  STR: 'Strategy & Vision',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Finance',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Security',
  RMS: 'Risk Management',
  CMP: 'Compliance'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get priority band from priority score
 */
function getPriorityBand(score: number): PriorityBand {
  if (score >= 7) return 'High Priority';
  if (score >= 4) return 'Medium Priority';
  return 'Lower Priority';
}

/**
 * Get category display name
 */
function getCategoryDisplayName(categoryCode: string): string {
  return CATEGORY_NAMES[categoryCode as CategoryCode] || categoryCode;
}

/**
 * Generate enriched, contextual recommendation based on priority data
 * Returns actionable language that reflects the specific situation
 */
function generateDefaultRecommendation(
  categoryCode: string,
  score: number,
  urgency?: number,
  impact?: number,
  effort?: number
): string {
  const categoryName = getCategoryDisplayName(categoryCode);

  // Critical urgency - immediate action required
  if (urgency && urgency >= 8 || score < 30) {
    return `Critical gap: Address ${categoryName} within 30 days to prevent cascading business risks`;
  }

  // Quick win opportunity - high impact, low effort
  if (impact && effort && impact >= 7 && effort <= 4) {
    return `Quick win opportunity: Implement ${categoryName} improvements immediately for rapid ROI`;
  }

  // Strategic investment - high impact, high effort
  if (impact && effort && impact >= 7 && effort >= 7) {
    return `Strategic investment: Plan ${categoryName} transformation with dedicated resources over 6-12 months`;
  }

  // Critical band (0-39)
  if (score < 40) {
    return `Critical gap: Prioritize ${categoryName} stabilization to prevent further business impact`;
  }

  // Attention band (40-59)
  if (score < 60) {
    return `Optimization target: Strengthen ${categoryName} processes to reach proficiency within 6 months`;
  }

  // Proficiency band (60-79)
  if (score < 80) {
    return `Fine-tuning opportunity: Refine ${categoryName} practices to achieve excellence`;
  }

  // Excellence band (80+)
  return `Best practice: Maintain ${categoryName} excellence and share learnings across organization`;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Filter and format prioritization data for a specific manager
 */
export function getManagerPriorities(
  prioritizationMatrix: PriorityScore[],
  categoryAnalyses: CategoryAnalysis[],
  managerType: ManagerType,
  maxItems: number = 5
): ManagerPriorityItem[] {
  const relevantCategories = MANAGER_CATEGORY_MAP[managerType];

  // Create a map for quick category score lookup
  const categoryScoreMap = new Map<string, number>();
  categoryAnalyses.forEach(ca => {
    categoryScoreMap.set(ca.categoryCode, ca.overallScore);
  });

  // Filter to manager's relevant categories
  const filteredPriorities = prioritizationMatrix
    .filter(entry => relevantCategories.includes(entry.categoryCode as CategoryCode))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, maxItems);

  // Map to ManagerPriorityItem
  return filteredPriorities.map(entry => {
    const score = categoryScoreMap.get(entry.categoryCode) || 50;
    return {
      categoryCode: entry.categoryCode as CategoryCode,
      categoryName: getCategoryDisplayName(entry.categoryCode),
      score,
      priorityScore: entry.priorityScore,
      priorityBand: getPriorityBand(entry.priorityScore),
      recommendation: entry.recommendation || generateDefaultRecommendation(
        entry.categoryCode,
        score,
        entry.urgency,
        entry.impact,
        entry.effort
      ),
      urgency: entry.urgency,
      impact: entry.impact,
      effort: entry.effort
    };
  });
}

/**
 * Build priority items from category analyses when prioritization matrix isn't available
 */
export function buildPrioritiesFromCategories(
  categoryAnalyses: CategoryAnalysis[],
  managerType: ManagerType,
  maxItems: number = 5
): ManagerPriorityItem[] {
  const relevantCategories = MANAGER_CATEGORY_MAP[managerType];

  // Filter and score categories
  const filteredCategories = categoryAnalyses
    .filter(ca => relevantCategories.includes(ca.categoryCode as CategoryCode))
    .map(ca => {
      // Calculate priority score based on score (lower score = higher priority)
      // Also factor in the category's importance
      const scoreGap = 100 - ca.overallScore;
      const priorityScore = Math.round((scoreGap / 10) +
        (ca.categoryRisks?.length || 0) * 0.5 +
        (ca.weaknesses?.length || 0) * 0.3);

      return {
        categoryCode: ca.categoryCode as CategoryCode,
        categoryName: ca.categoryName,
        score: ca.overallScore,
        priorityScore: Math.min(10, priorityScore),
        priorityBand: getPriorityBand(priorityScore),
        recommendation: generateDefaultRecommendation(
          ca.categoryCode,
          ca.overallScore
        )
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, maxItems);

  return filteredCategories;
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Get score badge style based on score value
 */
function getScoreBadgeStyle(score: number): string {
  if (score >= 80) return 'background: #d1fae5; color: #065f46;';
  if (score >= 60) return 'background: #dbeafe; color: #1e40af;';
  if (score >= 40) return 'background: #fef3c7; color: #92400e;';
  return 'background: #fee2e2; color: #991b1b;';
}

/**
 * Get priority badge style based on priority band
 * Uses premium gradient styling with box shadows
 */
function getPriorityBadgeStyle(band: PriorityBand): string {
  switch (band) {
    case 'High Priority':
      return 'background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);';
    case 'Medium Priority':
      return 'background: linear-gradient(135deg, #d97706, #b45309); color: white; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);';
    default:
      return 'background: linear-gradient(135deg, #6b7280, #4b5563); color: white; box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);';
  }
}

/**
 * Render prioritization panel HTML
 */
export function renderPrioritizationPanel(
  managerPriorities: ManagerPriorityItem[],
  managerType: ManagerType
): string {
  if (managerPriorities.length === 0) {
    return `
      <section class="priority-focus-panel" style="
        margin: 2rem 0;
        padding: 1.5rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      ">
        <h3 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #212653;
          margin: 0;
        ">
          <span>🎯</span> Priority Focus for Your Department
        </h3>
        <p style="margin: 1rem 0 0 0; color: #6b7280;">
          Priority data not available. See category analysis for detailed insights.
        </p>
      </section>
    `;
  }

  const managerTitle = {
    SalesMarketing: 'Sales & Marketing',
    Operations: 'Operations',
    Financials: 'Finance',
    ITTechnology: 'IT & Technology',
    StrategyLeadership: 'Strategy & Leadership'
  }[managerType] || 'Your Department';

  return `
    <section class="priority-focus-panel" style="
      margin: 2rem 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
    ">
      <h3 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.125rem;
        font-weight: 600;
        color: #212653;
        margin: 0 0 1.25rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span>🎯</span> Priority Focus for ${escapeHtml(managerTitle)}
      </h3>

      <table class="prioritization-table" style="
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9375rem;
      ">
        <thead>
          <tr style="background: #212653; color: white;">
            <th style="padding: 0.75rem; text-align: left; border-radius: 6px 0 0 0;">Category</th>
            <th style="padding: 0.75rem; text-align: center;">Score</th>
            <th style="padding: 0.75rem; text-align: center;">Priority</th>
            <th style="padding: 0.75rem; text-align: left; border-radius: 0 6px 0 0;">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          ${managerPriorities.map((item, index) => `
          <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 0.75rem; font-weight: 500;">
              ${escapeHtml(item.categoryName)}
              <span style="color: #6b7280; font-size: 0.8125rem; font-weight: 400;">(${item.categoryCode})</span>
            </td>
            <td style="padding: 0.75rem; text-align: center;">
              <span style="
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
                ${getScoreBadgeStyle(item.score)}
              ">${item.score}</span>
            </td>
            <td style="padding: 0.75rem; text-align: center;">
              <span style="
                display: inline-block;
                padding: 0.25rem 0.625rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                ${getPriorityBadgeStyle(item.priorityBand)}
              ">${item.priorityBand}</span>
            </td>
            <td style="padding: 0.75rem; color: #374151; font-size: 0.875rem;">
              ${escapeHtml(item.recommendation)}
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #bbf7d0;
        font-size: 0.8125rem;
        color: #6b7280;
      ">
        <strong>How to use:</strong> Focus on High Priority items first. These represent
        the areas with the greatest improvement potential for your department.
      </div>
    </section>
  `;
}

/**
 * Render compact priority list
 */
export function renderPriorityList(
  managerPriorities: ManagerPriorityItem[],
  maxItems: number = 3
): string {
  const items = managerPriorities.slice(0, maxItems);

  if (items.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No priorities identified.</p>';
  }

  return `
    <div class="priority-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${items.map(item => `
        <div style="
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: #f9fafb;
          border-left: 3px solid ${item.priorityBand === 'High Priority' ? '#dc2626' : item.priorityBand === 'Medium Priority' ? '#d97706' : '#6b7280'};
          border-radius: 0 6px 6px 0;
        ">
          <span style="
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.8125rem;
            ${getScoreBadgeStyle(item.score)}
          ">${item.score}</span>
          <span style="flex: 1; font-size: 0.875rem; color: #374151; font-weight: 500;">
            ${escapeHtml(item.categoryName)}
          </span>
          <span style="
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.6875rem;
            font-weight: 600;
            ${getPriorityBadgeStyle(item.priorityBand)}
          ">${item.priorityBand}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getPriorityBand,
  getCategoryDisplayName,
  generateDefaultRecommendation,
  getScoreBadgeStyle,
  getPriorityBadgeStyle,
  MANAGER_CATEGORY_MAP,
  CATEGORY_NAMES
};
