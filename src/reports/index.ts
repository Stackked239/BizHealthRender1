/**
 * BizHealth Reports Module
 *
 * Provides report generation capabilities for BizHealth assessments.
 *
 * Usage:
 *   import { ReportGenerator, ReportType, REPORT_METADATA } from './reports';
 *
 *   const generator = new ReportGenerator({ apiKey: 'your-api-key' });
 *   const report = await generator.generate({
 *     idm,
 *     reportType: ReportType.COMPREHENSIVE_REPORT,
 *   });
 */

export {
  // Core generator
  ReportGenerator,
  createReportGenerator,

  // Types
  ReportType,
  REPORT_METADATA,
  getAvailableReportTypes,
  getReportMetadata,

  // Interfaces
  type ReportGenerationRequest,
  type GeneratedReport,
  type ReportGeneratorConfig,
} from './report-generator.js';
