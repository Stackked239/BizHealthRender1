/**
 * Phase 5 Report Builders
 *
 * Exports all report builders for use by the Phase 5 orchestrator.
 *
 * UPDATED 2025-12-04: Added unified CSS framework exports
 */

// HTML Template utilities
export * from './html-template.js';

// Unified CSS Framework (Phase 4/5 Consolidation)
export * from './styles/index.js';

// Report builders (9 total)
export { buildComprehensiveReport } from './comprehensive-report.builder.js';
export { buildOwnersReport } from './owners-report.builder.js';
export { buildExecutiveBrief, type PortalConfig, type PortalOutput, type DashboardData } from './executive-brief.builder.js';
export { buildQuickWinsReport } from './quick-wins-report.builder.js';
export { buildRiskReport } from './risk-report.builder.js';
export { buildRoadmapReport } from './roadmap-report.builder.js';
export { buildFinancialReport } from './financial-report.builder.js';
export { buildDeepDiveReport } from './deep-dive-report.builder.js';
export { buildRecipeReport } from './recipe-report.builder.js';

// Visual enhancement components
export * from './components/index.js';

// Constants (icons, etc.)
export * from './constants/index.js';

// Report utilities
export * from './utils/index.js';

// Configuration (section mappings, constraints)
export * from './config/index.js';

// Validation utilities
export * from './validation/index.js';
