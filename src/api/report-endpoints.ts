/**
 * BizHealth Report API Endpoints
 *
 * Provides HTTP endpoints for generating and retrieving assessment reports.
 * Designed to work with Express.js or similar HTTP frameworks.
 *
 * Endpoints:
 * - GET /reports/:assessmentRunId/:reportType - Generate and return a report
 * - GET /reports/:assessmentRunId - List available reports for an assessment
 * - POST /reports/:assessmentRunId/generate - Generate multiple reports
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import pino from 'pino';
import {
  ReportGenerator,
  ReportType,
  GeneratedReport,
  REPORT_METADATA,
  getAvailableReportTypes,
  getReportMetadata,
} from '../reports/report-generator.js';
import { IDM, validateIDM, safeValidateIDM } from '../types/idm.types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Report request parameters
 */
export interface ReportRequestParams {
  assessmentRunId: string;
  reportType: ReportType;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  companyName?: string;
  format?: 'html' | 'json';
  includeMetadata?: boolean;
}

/**
 * Report response
 */
export interface ReportResponse {
  success: boolean;
  data?: {
    reportType: ReportType;
    reportName: string;
    html?: string;
    metadata?: {
      generatedAt: string;
      assessmentRunId: string;
      companyProfileId: string;
      inputTokens?: number;
      outputTokens?: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Available reports response
 */
export interface AvailableReportsResponse {
  assessmentRunId: string;
  availableReports: Array<{
    reportType: ReportType;
    name: string;
    description: string;
    cached?: boolean;
    cachedPath?: string;
  }>;
}

/**
 * Batch generation request
 */
export interface BatchGenerationRequest {
  reportTypes: ReportType[];
  companyName?: string;
  saveToFile?: boolean;
}

/**
 * Batch generation response
 */
export interface BatchGenerationResponse {
  success: boolean;
  generated: Array<{
    reportType: ReportType;
    reportName: string;
    outputPath?: string;
    success: boolean;
    error?: string;
  }>;
  totalInputTokens: number;
  totalOutputTokens: number;
}

// ============================================================================
// Report API Handler
// ============================================================================

/**
 * Handler for report-related API operations
 */
export class ReportAPIHandler {
  private reportGenerator: ReportGenerator;
  private logger: pino.Logger;
  private idmCachePath: string;
  private reportsCachePath: string;

  constructor(config: {
    apiKey?: string;
    logger?: pino.Logger;
    idmCachePath?: string;
    reportsCachePath?: string;
  } = {}) {
    this.reportGenerator = new ReportGenerator({
      apiKey: config.apiKey,
      logger: config.logger,
    });

    this.logger = config.logger || pino({ level: 'info' });
    this.idmCachePath = config.idmCachePath || path.join(process.cwd(), 'output', 'idm');
    this.reportsCachePath = config.reportsCachePath || path.join(process.cwd(), 'output', 'reports');
  }

  /**
   * Load IDM for an assessment run
   */
  private async loadIDM(assessmentRunId: string): Promise<IDM | null> {
    try {
      // Try multiple potential locations for the IDM
      const potentialPaths = [
        path.join(this.idmCachePath, `${assessmentRunId}.json`),
        path.join(this.idmCachePath, `idm-${assessmentRunId}.json`),
        path.join(process.cwd(), 'output', 'phase4', `phase4-output-${assessmentRunId}.json`),
        path.join(process.cwd(), 'output', 'phase4_output.json'),
      ];

      for (const idmPath of potentialPaths) {
        try {
          const content = await fs.readFile(idmPath, 'utf-8');
          const data = JSON.parse(content);

          // Check if this is a Phase 4 output with embedded IDM
          if (data.idm) {
            const result = safeValidateIDM(data.idm);
            if (result.success) {
              return result.data;
            }
          }

          // Try to validate as direct IDM
          const result = safeValidateIDM(data);
          if (result.success) {
            return result.data;
          }
        } catch {
          // Try next path
          continue;
        }
      }

      return null;
    } catch (error) {
      this.logger.error({
        assessmentRunId,
        error: error instanceof Error ? error.message : String(error),
      }, 'Failed to load IDM');
      return null;
    }
  }

  /**
   * Get cached report if available
   */
  private async getCachedReport(
    assessmentRunId: string,
    reportType: ReportType
  ): Promise<string | null> {
    try {
      const filename = `${reportType.replace(/_/g, '-')}.html`;
      const reportPath = path.join(this.reportsCachePath, assessmentRunId, filename);

      const content = await fs.readFile(reportPath, 'utf-8');
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Save report to cache
   */
  private async saveReportToCache(
    assessmentRunId: string,
    reportType: ReportType,
    html: string
  ): Promise<string> {
    const assessmentDir = path.join(this.reportsCachePath, assessmentRunId);
    await fs.mkdir(assessmentDir, { recursive: true });

    const filename = `${reportType.replace(/_/g, '-')}.html`;
    const reportPath = path.join(assessmentDir, filename);

    await fs.writeFile(reportPath, html, 'utf-8');
    return reportPath;
  }

  /**
   * Generate a single report
   */
  async generateReport(
    assessmentRunId: string,
    reportType: ReportType,
    options: ReportGenerationOptions = {}
  ): Promise<ReportResponse> {
    try {
      // Validate report type
      if (!Object.values(ReportType).includes(reportType)) {
        return {
          success: false,
          error: {
            code: 'INVALID_REPORT_TYPE',
            message: `Invalid report type: ${reportType}. Available types: ${Object.values(ReportType).join(', ')}`,
          },
        };
      }

      // Check for cached report first
      const cached = await this.getCachedReport(assessmentRunId, reportType);
      if (cached && options.format !== 'json') {
        this.logger.info({
          assessmentRunId,
          reportType,
        }, 'Returning cached report');

        return {
          success: true,
          data: {
            reportType,
            reportName: REPORT_METADATA[reportType].name,
            html: cached,
            metadata: options.includeMetadata ? {
              generatedAt: new Date().toISOString(),
              assessmentRunId,
              companyProfileId: 'cached',
            } : undefined,
          },
        };
      }

      // Load IDM
      const idm = await this.loadIDM(assessmentRunId);
      if (!idm) {
        return {
          success: false,
          error: {
            code: 'IDM_NOT_FOUND',
            message: `IDM not found for assessment run: ${assessmentRunId}`,
          },
        };
      }

      // Generate report
      this.logger.info({
        assessmentRunId,
        reportType,
      }, 'Generating report');

      const report = await this.reportGenerator.generate({
        idm,
        reportType,
        companyName: options.companyName,
      });

      // Save to cache
      await this.saveReportToCache(assessmentRunId, reportType, report.html);

      return {
        success: true,
        data: {
          reportType,
          reportName: report.metadata.reportName,
          html: report.html,
          metadata: options.includeMetadata ? {
            generatedAt: report.metadata.generatedAt,
            assessmentRunId: report.metadata.assessmentRunId,
            companyProfileId: report.metadata.companyProfileId,
            inputTokens: report.usage?.inputTokens,
            outputTokens: report.usage?.outputTokens,
          } : undefined,
        },
      };
    } catch (error) {
      this.logger.error({
        assessmentRunId,
        reportType,
        error: error instanceof Error ? error.message : String(error),
      }, 'Report generation failed');

      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * List available reports for an assessment
   */
  async listAvailableReports(assessmentRunId: string): Promise<AvailableReportsResponse> {
    const availableReports: AvailableReportsResponse['availableReports'] = [];

    for (const reportType of getAvailableReportTypes()) {
      const meta = getReportMetadata(reportType);

      // Check if cached version exists
      const cached = await this.getCachedReport(assessmentRunId, reportType);
      const cachedPath = cached
        ? path.join(this.reportsCachePath, assessmentRunId, `${reportType.replace(/_/g, '-')}.html`)
        : undefined;

      availableReports.push({
        reportType,
        name: meta.name,
        description: meta.description,
        cached: !!cached,
        cachedPath,
      });
    }

    return {
      assessmentRunId,
      availableReports,
    };
  }

  /**
   * Generate multiple reports in batch
   */
  async generateBatch(
    assessmentRunId: string,
    request: BatchGenerationRequest
  ): Promise<BatchGenerationResponse> {
    const results: BatchGenerationResponse['generated'] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Load IDM once
    const idm = await this.loadIDM(assessmentRunId);
    if (!idm) {
      return {
        success: false,
        generated: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
      };
    }

    for (const reportType of request.reportTypes) {
      try {
        const report = await this.reportGenerator.generate({
          idm,
          reportType,
          companyName: request.companyName,
        });

        let outputPath: string | undefined;
        if (request.saveToFile) {
          outputPath = await this.saveReportToCache(assessmentRunId, reportType, report.html);
        }

        results.push({
          reportType,
          reportName: report.metadata.reportName,
          outputPath,
          success: true,
        });

        if (report.usage) {
          totalInputTokens += report.usage.inputTokens;
          totalOutputTokens += report.usage.outputTokens;
        }
      } catch (error) {
        results.push({
          reportType,
          reportName: REPORT_METADATA[reportType].name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: results.every(r => r.success),
      generated: results,
      totalInputTokens,
      totalOutputTokens,
    };
  }

  /**
   * Generate all report types
   */
  async generateAllReports(
    assessmentRunId: string,
    options: { companyName?: string; saveToFile?: boolean } = {}
  ): Promise<BatchGenerationResponse> {
    return this.generateBatch(assessmentRunId, {
      reportTypes: getAvailableReportTypes(),
      companyName: options.companyName,
      saveToFile: options.saveToFile ?? true,
    });
  }
}

// ============================================================================
// Express.js Route Handlers (if using Express)
// ============================================================================

/**
 * Create Express-compatible route handlers
 * Usage:
 *   const handlers = createExpressHandlers({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   app.get('/reports/:assessmentRunId/:reportType', handlers.getReport);
 *   app.get('/reports/:assessmentRunId', handlers.listReports);
 *   app.post('/reports/:assessmentRunId/generate', handlers.generateBatch);
 */
export function createExpressHandlers(config: {
  apiKey?: string;
  logger?: pino.Logger;
}) {
  const handler = new ReportAPIHandler(config);

  return {
    /**
     * GET /reports/:assessmentRunId/:reportType
     * Generate and return a single report
     */
    getReport: async (req: any, res: any) => {
      const { assessmentRunId, reportType } = req.params;
      const { companyName, format, includeMetadata } = req.query;

      const response = await handler.generateReport(
        assessmentRunId,
        reportType as ReportType,
        {
          companyName: companyName as string,
          format: format as 'html' | 'json',
          includeMetadata: includeMetadata === 'true',
        }
      );

      if (!response.success) {
        return res.status(400).json(response);
      }

      // Return HTML directly if format is html (default)
      if (format !== 'json' && response.data?.html) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(response.data.html);
      }

      return res.json(response);
    },

    /**
     * GET /reports/:assessmentRunId
     * List available reports for an assessment
     */
    listReports: async (req: any, res: any) => {
      const { assessmentRunId } = req.params;
      const response = await handler.listAvailableReports(assessmentRunId);
      return res.json(response);
    },

    /**
     * POST /reports/:assessmentRunId/generate
     * Generate multiple reports in batch
     */
    generateBatch: async (req: any, res: any) => {
      const { assessmentRunId } = req.params;
      const { reportTypes, companyName, saveToFile } = req.body;

      const response = await handler.generateBatch(assessmentRunId, {
        reportTypes: reportTypes || getAvailableReportTypes(),
        companyName,
        saveToFile: saveToFile ?? true,
      });

      return res.json(response);
    },

    /**
     * POST /reports/:assessmentRunId/generate-all
     * Generate all report types
     */
    generateAll: async (req: any, res: any) => {
      const { assessmentRunId } = req.params;
      const { companyName, saveToFile } = req.body;

      const response = await handler.generateAllReports(assessmentRunId, {
        companyName,
        saveToFile,
      });

      return res.json(response);
    },
  };
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a ReportAPIHandler with environment-based configuration
 */
export function createReportAPIHandler(config?: {
  apiKey?: string;
  logger?: pino.Logger;
  idmCachePath?: string;
  reportsCachePath?: string;
}): ReportAPIHandler {
  return new ReportAPIHandler({
    apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
    logger: config?.logger,
    idmCachePath: config?.idmCachePath,
    reportsCachePath: config?.reportsCachePath,
  });
}

// ============================================================================
// Re-exports
// ============================================================================

export { ReportType, REPORT_METADATA, getAvailableReportTypes, getReportMetadata };
