/**
 * Report Sections Module
 *
 * Exports section builders for comprehensive reports.
 *
 * @module sections
 * @version 1.0.0
 */

export {
  buildInterdependencySynthesis,
  buildCrossDimensionalSynthesisSection,
  type CategoryAnalysis,
  type CrossCategoryInsights,
  type InterdependencyRelationship,
  type SystemicPattern,
  type CascadeRisk,
} from './interdependency-synthesis.builder.js';

export {
  buildFinancialImpactAnalysis,
  type Recommendation,
  type QuickWin,
  type CompanyProfile,
  type ReportContext as FinancialImpactReportContext,
} from './financial-impact.builder.js';

export {
  buildPMOEstablishment,
} from './pmo-establishment.builder.js';

export {
  buildImplementationSummary,
} from './implementation-summary.builder.js';
