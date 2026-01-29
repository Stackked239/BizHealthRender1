/**
 * BizHealth.ai Card Components Index
 *
 * Exports card-based visual components for report generation.
 * These components provide structured, scannable formats for
 * recommendations and action items.
 *
 * Components:
 * - Action Plan Cards: Full-featured recommendation cards (Owner's Report)
 * - Quick Win Cards: Simplified cards for quick wins (Owner's Report)
 * - Recommendation Cards: Manager Report recommendation cards
 * - Finding Cards: Manager Report finding cards (strengths, gaps, risks)
 * - Manager Quick Win Cards: Manager Report quick win cards
 */

// ============================================================================
// ACTION PLAN CARDS (Owner's Report Style)
// ============================================================================

export {
  generateActionPlanCard,
  generateActionPlanCardGrid,
  generateActionPlanCardList,
  generateActionPlanSummary,
} from './action-plan-card.component.js';

export type {
  ActionPlanCard,
  ActionPlanCardOptions,
  ActionPlanGridOptions,
  CardPriority,
  CardCategory,
  CardHorizon,
  CurrencyRange,
  ActionStep,
} from './action-plan-card.component.js';

// ============================================================================
// QUICK WIN CARDS (Owner's Report Style)
// ============================================================================

export {
  generateQuickWinCard,
  generateQuickWinsGrid,
  generateQuickWinsList,
  generateQuickWinRow,
  generateQuickWinsSummary,
  generateQuickWinBadge,
  generateTransformationArrow,
} from './quick-win-card.component.js';

export type {
  QuickWinCard,
  QuickWinCardOptions,
  QuickWinsGridOptions,
} from './quick-win-card.component.js';

// ============================================================================
// RECOMMENDATION CARDS (Manager Reports)
// ============================================================================

export {
  renderRecommendationCard,
  renderRecommendationCards,
  renderRecommendationsByHorizon,
  renderRecommendationRow,
} from './recommendation-card.component.js';

export type {
  RecommendationCardOptions,
} from './recommendation-card.component.js';

// ============================================================================
// FINDING CARDS (Manager Reports)
// ============================================================================

export {
  renderFindingCard,
  renderFindingsGrouped,
  renderFindingsList,
  renderFindingRow,
  countFindingsByType,
  renderFindingsSummaryBadges,
} from './finding-card.component.js';

export type {
  FindingType,
  FindingCardOptions,
} from './finding-card.component.js';

// ============================================================================
// MANAGER QUICK WIN CARDS (Manager Reports)
// ============================================================================

export {
  renderManagerQuickWinCard,
  renderManagerQuickWinCards,
  renderManagerQuickWinRow,
  renderManagerQuickWinChecklist,
  renderQuickWinsSummaryStats,
} from './manager-quick-win-card.component.js';

export type {
  ManagerQuickWinCardOptions,
} from './manager-quick-win-card.component.js';
