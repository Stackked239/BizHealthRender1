/**
 * Manager Reports Helper Modules
 *
 * Exports all manager-specific helpers for use in manager report builders.
 *
 * @module managers
 */

// Quick Wins Selection and Enrichment
export {
  type ManagerType,
  type ManagerQuickWin,
  MANAGER_CATEGORY_MAP,
  CATEGORY_DISPLAY_NAMES,
  MANAGER_TYPE_TO_DIMENSION_TYPE,
  selectManagerQuickWinsFromPhase15,
  selectManagerQuickWins,
  validateQuickWinsCount,
  computePriorityScore,
  normalizeLevel,
  normalizeTimeline,
  inferCategoryFromContent
} from './manager-quickwins.js';

// Risk Summary and Enterprise Risk Panel
export {
  type ScoreBand,
  type EnterpriseRisk,
  type EnterpriseRiskSummary,
  buildEnterpriseRiskSummary,
  getFunctionalRiskContext,
  getScoreBandColor,
  renderEnterpriseRiskPanel,
  renderRiskReference,
  getScoreBand,
  CATEGORY_ENTERPRISE_IMPACT,
  FUNCTIONAL_RISK_CONTEXT
} from './manager-risk-summary.js';

// Initiative Ownership and Badges
export {
  type OwnershipStatus,
  type DeptInitiative,
  CATEGORY_PRIMARY_OWNER,
  MANAGER_DISPLAY_NAMES,
  getOwnershipStatus,
  enrichInitiativeWithOwnership,
  renderOwnershipBadge,
  renderOwnershipIndicator,
  renderInitiativeCard,
  renderInitiativeRow
} from './manager-initiatives.js';

// Prioritization Panel
export {
  type PriorityBand,
  type ManagerPriorityItem,
  getManagerPriorities,
  buildPrioritiesFromCategories,
  renderPrioritizationPanel,
  renderPriorityList,
  getPriorityBand,
  getCategoryDisplayName,
  getScoreBadgeStyle,
  getPriorityBadgeStyle
} from './manager-prioritization.js';
