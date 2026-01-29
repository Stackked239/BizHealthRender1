/**
 * Executive Brief Components Index
 *
 * Exports all components for the enhanced Executive Brief report.
 *
 * @version 2.0.0
 * @since December 2025
 */

// Benchmark Positioning
export {
  generateBenchmarkPositioningSection,
  default as BenchmarkPositioning,
} from './benchmark-positioning.component.js';

// Risk Heat Map
export {
  generateRiskAssessmentSection,
  default as RiskHeatMap,
} from './risk-heatmap.component.js';

// Strategic Roadmap
export {
  generateStrategicRoadmapSection,
  default as StrategicRoadmap,
} from './strategic-roadmap.component.js';

// Category Dashboard
export {
  generateCategoryDashboardSection,
  default as CategoryDashboard,
} from './category-dashboard.component.js';

// Enhanced Quick Wins
export {
  generateEnhancedQuickWinsSection,
  generateSimpleQuickWinsSection,
  default as EnhancedQuickWins,
} from './enhanced-quick-wins.component.js';

// Table of Contents
export {
  generateTableOfContents,
  generateSectionAnchor,
  DEFAULT_EXECUTIVE_BRIEF_SECTIONS,
  default as TableOfContents,
} from './toc.component.js';
export type { TocSection } from './toc.component.js';
