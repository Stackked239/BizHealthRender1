/**
 * Executive Overview Report Builder
 *
 * PURPOSE: Generate a 2-3 page leadership alignment document
 * AUDIENCE: CEOs, owners, key stakeholders, board members
 * READ TIME: 10-15 minutes
 *
 * CRITICAL: This report must be generated LAST in Phase 5 to ensure
 * all cross-references to other reports are accurate.
 *
 * ENHANCED: Integrates third-party specification validators for:
 * - Priority logic enforcement (critical dimensions must be prioritized)
 * - Content quality validation (zero generic consulting language)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import type {
  ReportContext,
  ReportRenderOptions,
  GeneratedReport,
  ReportMeta,
  Phase5ReportType,
  BrandConfig,
} from '../../types/report.types.js';
import { DEFAULT_BRAND } from '../../types/report.types.js';

import type {
  ExecutiveOverviewData,
  ExecutiveOverviewQuality,
  DimensionScoreForValidation,
} from '../../types/executive-overview.types.js';

// Data extraction
import { extractExecutiveOverviewData } from './executive-overview/data-extractor.js';

// Section renderers
import {
  renderHeader,
  renderExecutiveSnapshot,
  renderMaterialFindings,
  renderStrategicPriorities,
  renderKeyRisks,
  renderExecutionView,
  renderRoutingMap,
  renderFinancialImpact,
  renderSuccessMetrics,
  renderBottomLine,
  renderDisclaimer,
} from './executive-overview/sections/index.js';

// Validation
import {
  validateExecutiveOverviewData,
  validatePrerequisites,
  assessQuality,
  meetsWordCountTargets,
} from './executive-overview/executive-overview.validator.js';

// Enhanced Validators (Third-Party Specification)
import {
  validatePriorityLogic,
  correctPriorityList,
} from '../validators/executive-overview-validator.js';

import {
  validateContentQuality,
  validateExecutiveOverviewQuality as validateEnhancedContentQuality,
} from '../validators/content-quality-validator.js';

// Enhanced Mapper
import {
  mapToEnhancedExecutiveOverview,
} from '../mappers/executive-overview-mapper.js';

// Styles
import { generateExecutiveOverviewStyles } from './executive-overview/executive-overview.styles.js';

// Utilities
import { escapeHtml } from './html-template.js';

/**
 * Build the Executive Overview report
 */
export async function buildExecutiveOverviewReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const startTime = Date.now();
  const brand = options.brand || DEFAULT_BRAND;

  // =========================================================================
  // STEP 1: PRE-GENERATION VALIDATION
  // =========================================================================

  const prereqValidation = validatePrerequisites(ctx);

  if (!prereqValidation.isValid) {
    console.error('[ExecutiveOverview] Prerequisite validation errors:', prereqValidation.errors);
    throw new Error(`Executive Overview prerequisites failed: ${prereqValidation.errors.join(', ')}`);
  }

  if (prereqValidation.warnings.length > 0) {
    console.warn('[ExecutiveOverview] Prerequisite warnings:', prereqValidation.warnings);
  }

  // =========================================================================
  // STEP 2: EXTRACT DATA FROM CONTEXT
  // =========================================================================

  const overviewData = extractExecutiveOverviewData(ctx);

  // =========================================================================
  // STEP 2.5: ENHANCED PRIORITY LOGIC VALIDATION (Third-Party Specification)
  // =========================================================================

  // Extract dimension scores for priority validation
  const dimensionScores: DimensionScoreForValidation[] = ctx.dimensions.map(d => ({
    name: d.name,
    score: d.score,
    percentile: d.benchmark?.peerPercentile,
  }));

  // Convert legacy priorities to enhanced format for validation
  const enhancedPriorities = overviewData.strategicPriorities.map(p => ({
    rank: p.rank,
    title: p.title,
    timeline: p.timeline,
    timelineBadgeClass: `timeline-${p.timeline}`,
    whatDescription: p.what,
    whyItMatters: p.why,
    whatGoodLooksLike: p.whatGoodLooksLike,
    dependencies: p.dependencies || [],
    targetCompletion: p.targetCompletion,
    dimension: p.linkedDimensions?.[0] || '',
    dimensionScore: ctx.dimensions.find(d =>
      p.linkedDimensions?.includes(d.code)
    )?.score || 50,
  }));

  // Validate priority logic
  const priorityValidation = validatePriorityLogic(enhancedPriorities, dimensionScores);

  if (!priorityValidation.valid) {
    console.warn('[ExecutiveOverview] Priority logic violations detected:');
    priorityValidation.errors.forEach(err => console.warn(`  - ${err}`));

    // Auto-correct priorities if critical dimensions are missing
    const correctedPriorities = correctPriorityList(
      enhancedPriorities,
      dimensionScores,
      ctx.recommendations?.map(r => ({
        dimension: r.dimensionName,
        category: r.dimensionName,
        actionSteps: r.actionSteps,
        businessImpact: r.expectedOutcomes,
        successCriteria: [],
        theme: r.theme,
      })) || []
    );

    // Update overview data with corrected priorities
    overviewData.strategicPriorities = correctedPriorities.map((cp, idx) => ({
      rank: idx + 1,
      title: cp.title,
      timeline: cp.timeline,
      what: cp.whatDescription,
      why: cp.whyItMatters,
      whatGoodLooksLike: cp.whatGoodLooksLike,
      targetCompletion: cp.targetCompletion,
      dependencies: cp.dependencies,
      linkedDimensions: [cp.dimension] as any[],
    }));

    console.log('[ExecutiveOverview] Priorities auto-corrected to include critical dimensions');
  }

  if (priorityValidation.warnings.length > 0) {
    console.warn('[ExecutiveOverview] Priority validation warnings:');
    priorityValidation.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  // =========================================================================
  // STEP 2.6: ENHANCED CONTENT QUALITY VALIDATION (Third-Party Specification)
  // =========================================================================

  // Validate content quality for key sections
  const contentSectionsToValidate = [
    { name: 'Executive Snapshot BLUF', content: overviewData.executiveSnapshot.bluf },
    { name: 'Strategic Priorities', content: overviewData.strategicPriorities.map(p => `${p.what} ${p.why}`).join(' ') },
    { name: 'Bottom Line', content: overviewData.bottomLine },
  ];

  let contentQualityScore = 0;
  let contentSectionCount = 0;

  for (const section of contentSectionsToValidate) {
    if (section.content && section.content.length > 0) {
      const qualityResult = validateContentQuality(section.content, section.name);
      contentQualityScore += qualityResult.score;
      contentSectionCount++;

      if (!qualityResult.passing) {
        console.warn(`[ExecutiveOverview] Content quality issues in ${section.name}:`);
        qualityResult.violations.forEach(v => {
          console.warn(`  - [${v.severity}] "${v.pattern}" -> ${v.suggestion}`);
        });
      }
    }
  }

  const avgContentQuality = contentSectionCount > 0
    ? Math.round(contentQualityScore / contentSectionCount)
    : 100;

  if (avgContentQuality < 75) {
    console.warn(`[ExecutiveOverview] Overall content quality score: ${avgContentQuality}/100 (target: 75+)`);
  } else {
    console.log(`[ExecutiveOverview] Content quality score: ${avgContentQuality}/100 - PASS`);
  }

  // =========================================================================
  // STEP 3: VALIDATE DATA COMPLETENESS
  // =========================================================================

  const validation = validateExecutiveOverviewData(overviewData);

  if (!validation.isValid) {
    console.error('[ExecutiveOverview] Validation errors:', validation.errors);
    throw new Error(`Executive Overview validation failed: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('[ExecutiveOverview] Validation warnings:', validation.warnings);
  }

  // =========================================================================
  // STEP 4: RENDER SECTIONS
  // =========================================================================

  const sections = [
    renderHeader(overviewData.meta, brand),
    renderExecutiveSnapshot(overviewData.executiveSnapshot),
    renderMaterialFindings(overviewData.materialFindings),
    renderStrategicPriorities(overviewData.strategicPriorities),
    overviewData.keyRisks?.length > 0 ? renderKeyRisks(overviewData.keyRisks) : '',
    renderExecutionView(overviewData.executionRoadmap),
    renderRoutingMap(overviewData.reportRouteGuide),
    overviewData.financialImpact ? renderFinancialImpact(overviewData.financialImpact) : '',
    overviewData.successMetrics?.length > 0 ? renderSuccessMetrics(overviewData.successMetrics) : '',
    renderBottomLine(overviewData.bottomLine, overviewData.meta.companyName),
    renderDisclaimer(overviewData.meta.companyName),
  ].filter(Boolean);

  // =========================================================================
  // STEP 5: COMPOSE FINAL HTML
  // =========================================================================

  const styles = generateExecutiveOverviewStyles(
    brand.primaryColor,
    brand.accentColor,
    true // includePrintCSS
  );

  const html = wrapExecutiveOverviewDocument({
    title: `Executive Overview - ${overviewData.meta.companyName}`,
    sections: sections.join('\n'),
    brand,
    styles,
  });

  // =========================================================================
  // STEP 6: QUALITY ASSESSMENT
  // =========================================================================

  const quality = assessQuality(html, overviewData, validation);
  const wordCountCheck = meetsWordCountTargets(quality.wordCount);

  if (!wordCountCheck.meetsMinimum) {
    console.warn('[ExecutiveOverview]', wordCountCheck.message);
  }
  if (!wordCountCheck.meetsMaximum) {
    console.warn('[ExecutiveOverview]', wordCountCheck.message);
  }

  // =========================================================================
  // STEP 7: WRITE FILES
  // =========================================================================

  const htmlPath = path.join(options.outputDir, 'executive-overview.html');
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: 'executiveOverview' as Phase5ReportType,
    reportName: 'Executive Overview',
    generatedAt: new Date().toISOString(),
    companyName: overviewData.meta.companyName,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: quality.pageEstimate,
    sections: [
      { id: 'executive-snapshot', title: 'Executive Snapshot' },
      { id: 'material-findings', title: 'Material Findings' },
      { id: 'strategic-priorities', title: 'Strategic Priorities' },
      { id: 'key-risks', title: 'Key Risks & Mitigations' },
      { id: 'execution-view', title: '90-Day Execution View' },
      { id: 'routing-map', title: 'Where to Go Deeper' },
      { id: 'bottom-line', title: 'The Bottom Line' },
    ],
    brand: {
      primaryColor: brand.primaryColor,
      accentColor: brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, 'executive-overview.meta.json');
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  // =========================================================================
  // STEP 8: LOG AND RETURN
  // =========================================================================

  const processingTimeMs = Date.now() - startTime;

  console.log(`[ExecutiveOverview] Generated successfully in ${processingTimeMs}ms (${quality.wordCount} words, ~${quality.pageEstimate} pages)`);
  console.log(`[ExecutiveOverview] Priority validation: ${priorityValidation.valid ? 'PASS' : 'CORRECTED'}, Content quality: ${avgContentQuality}/100`);

  return {
    reportType: 'executiveOverview' as Phase5ReportType,
    reportName: 'Executive Overview',
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

// ============================================================================
// HTML DOCUMENT WRAPPER
// ============================================================================

interface WrapDocumentOptions {
  title: string;
  sections: string;
  brand: BrandConfig;
  styles: string;
}

/**
 * Wrap sections in a complete HTML document
 */
function wrapExecutiveOverviewDocument(options: WrapDocumentOptions): string {
  const { title, sections, brand, styles } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BizHealth.ai Executive Overview Generator">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${styles}
  </style>
</head>
<body>
  <div class="executive-overview">
${sections}
  </div>
</body>
</html>`;
}

// Re-export for use in Phase 5 orchestrator
export default buildExecutiveOverviewReport;
