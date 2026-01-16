/**
 * Phase 1.5 Integration Diagnostic Validation
 *
 * PURPOSE: Validate Phase 1.5 data pipeline health before implementing
 * cross-dimensional synthesis integration.
 *
 * USAGE: npx tsx scripts/diagnostic/validate-phase15-integration.ts
 */

import { readdir, readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

interface Phase15DiagnosticReport {
  totalAssessments: number;
  phase15Present: number;
  phase15Missing: number;
  phase15Malformed: number;
  sampleDataStructure: {
    categoryCount: number;
    fields: string[];
    hasCrossCategory: boolean;
    hasChapterSummaries: boolean;
    hasOverallSummary: boolean;
  } | null;
  categoryCompletionRates: Record<string, number>;
  integrationGaps: string[];
  recommendations: string[];
}

async function diagnosePhase15Integration(): Promise<Phase15DiagnosticReport> {
  const outputDir = 'output';
  const phase15Path = join(process.cwd(), outputDir, 'phase1_5_output.json');
  const phase4Dir = join(process.cwd(), outputDir, 'phase4');

  const report: Phase15DiagnosticReport = {
    totalAssessments: 0,
    phase15Present: 0,
    phase15Missing: 0,
    phase15Malformed: 0,
    sampleDataStructure: null,
    categoryCompletionRates: {},
    integrationGaps: [],
    recommendations: []
  };

  // Check if Phase 1.5 output exists
  try {
    const phase15Content = await readFile(phase15Path, 'utf-8');
    const phase15Data = JSON.parse(phase15Content);

    // Validate basic structure
    if (phase15Data.phase !== 'phase_1_5') {
      report.phase15Malformed++;
      report.integrationGaps.push('Phase 1.5 output missing "phase" field or incorrect value');
    } else {
      report.phase15Present++;
    }

    // Validate category analyses
    if (!phase15Data.categoryAnalyses || !Array.isArray(phase15Data.categoryAnalyses)) {
      report.phase15Malformed++;
      report.integrationGaps.push('Phase 1.5 output missing or malformed categoryAnalyses array');
    } else {
      report.totalAssessments = phase15Data.categoryAnalyses.length;

      // Capture sample structure
      const firstCat = phase15Data.categoryAnalyses[0];
      report.sampleDataStructure = {
        categoryCount: phase15Data.categoryAnalyses.length,
        fields: firstCat ? Object.keys(firstCat) : [],
        hasCrossCategory: !!phase15Data.crossCategoryInsights,
        hasChapterSummaries: !!phase15Data.chapterSummaries && phase15Data.chapterSummaries.length > 0,
        hasOverallSummary: !!phase15Data.overallSummary
      };

      // Track category completion
      for (const cat of phase15Data.categoryAnalyses) {
        const catCode = cat.categoryCode || 'unknown';
        report.categoryCompletionRates[catCode] = (report.categoryCompletionRates[catCode] || 0) + 1;

        // Check for required fields
        const requiredFields = ['categoryCode', 'categoryName', 'overallScore', 'executiveSummary', 'strengths', 'weaknesses'];
        for (const field of requiredFields) {
          if (!cat[field]) {
            report.integrationGaps.push(`Category ${catCode} missing required field: ${field}`);
          }
        }
      }
    }

    // Check cross-category insights
    if (phase15Data.crossCategoryInsights) {
      const insights = phase15Data.crossCategoryInsights;
      if (!insights.systemicPatterns || !Array.isArray(insights.systemicPatterns)) {
        report.integrationGaps.push('crossCategoryInsights.systemicPatterns missing or not an array');
      }
      if (!insights.interdependencyAnalysis) {
        report.integrationGaps.push('crossCategoryInsights.interdependencyAnalysis missing');
      }
      if (!insights.prioritizationMatrix || !Array.isArray(insights.prioritizationMatrix)) {
        report.integrationGaps.push('crossCategoryInsights.prioritizationMatrix missing or not an array');
      }
    } else {
      report.integrationGaps.push('crossCategoryInsights not found in Phase 1.5 output');
    }

    // Check chapter summaries
    if (!phase15Data.chapterSummaries || phase15Data.chapterSummaries.length === 0) {
      report.integrationGaps.push('chapterSummaries missing or empty');
    }

    // Check overall summary
    if (!phase15Data.overallSummary) {
      report.integrationGaps.push('overallSummary missing from Phase 1.5 output');
    }

  } catch (error) {
    report.phase15Missing++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    report.integrationGaps.push(`CRITICAL: Phase 1.5 output not found or unreadable: ${errorMessage}`);
  }

  // Check if IDM is receiving Phase 1.5 data
  try {
    const idmPath = join(process.cwd(), outputDir, 'idm_output.json');
    const idmContent = await readFile(idmPath, 'utf-8');
    const idm = JSON.parse(idmContent);

    if (!idm.categoryAnalyses || idm.categoryAnalyses.length === 0) {
      report.integrationGaps.push('IDM not receiving Phase 1.5 categoryAnalyses');
    } else {
      console.log(`✓ IDM contains ${idm.categoryAnalyses.length} category analyses`);
    }

    if (!idm.crossCategoryInsights) {
      report.integrationGaps.push('IDM not receiving Phase 1.5 crossCategoryInsights');
    }

    if (!idm.phase15OverallHealth) {
      report.integrationGaps.push('IDM not receiving Phase 1.5 overall health metrics');
    }

  } catch (error) {
    report.integrationGaps.push('IDM output not found - cannot verify Phase 1.5 integration');
  }

  // Check Phase 4 outputs for Phase 1.5 integration metadata
  try {
    const phase4Files = await readdir(phase4Dir);
    const recentFiles = phase4Files.filter(f => f.endsWith('.json')).slice(-3);

    for (const file of recentFiles) {
      try {
        const content = await readFile(join(phase4Dir, file), 'utf-8');
        const phase4Data = JSON.parse(content);

        if (phase4Data.metadata?.phase1_5_integration) {
          console.log(`✓ Phase 4 file ${file} has Phase 1.5 integration metadata`);
        } else {
          report.integrationGaps.push(`Phase 4 file ${file} missing Phase 1.5 integration metadata`);
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  } catch {
    report.integrationGaps.push('Phase 4 output directory not accessible');
  }

  // Generate recommendations
  if (report.phase15Missing > 0) {
    report.recommendations.push('CRITICAL: Execute Phase 1.5 orchestrator to generate category analyses');
  }

  if (report.integrationGaps.some(gap => gap.includes('categoryAnalyses'))) {
    report.recommendations.push('Ensure Phase 4 orchestrator is loading Phase 1.5 output correctly');
  }

  if (report.integrationGaps.some(gap => gap.includes('crossCategoryInsights'))) {
    report.recommendations.push('Verify cross-category insights generation in Phase 1.5 orchestrator');
  }

  if (report.integrationGaps.length === 0) {
    report.recommendations.push('Phase 1.5 integration appears healthy - proceed with Cross-Dimensional Synthesis implementation');
  }

  return report;
}

// Execute and output report
async function main() {
  console.log('=== Phase 1.5 Integration Diagnostic ===\n');

  const report = await diagnosePhase15Integration();

  console.log(JSON.stringify(report, null, 2));

  // Write to audit directory
  try {
    const auditDir = join(process.cwd(), 'output', 'system-audit');
    await mkdir(auditDir, { recursive: true });
    await writeFile(
      join(auditDir, `phase15-diagnostic-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );
    console.log(`\n📄 Diagnostic report saved to output/system-audit/`);
  } catch (error) {
    console.error('Failed to save diagnostic report:', error);
  }

  // Provide summary and recommendations
  console.log('\n=== Summary ===');

  if (report.phase15Present > 0) {
    console.log(`✅ Phase 1.5 output found with ${report.sampleDataStructure?.categoryCount || 0} categories`);
  } else {
    console.log('❌ Phase 1.5 output NOT FOUND');
  }

  if (report.sampleDataStructure) {
    console.log(`   - Has cross-category insights: ${report.sampleDataStructure.hasCrossCategory ? 'Yes' : 'No'}`);
    console.log(`   - Has chapter summaries: ${report.sampleDataStructure.hasChapterSummaries ? 'Yes' : 'No'}`);
    console.log(`   - Has overall summary: ${report.sampleDataStructure.hasOverallSummary ? 'Yes' : 'No'}`);
  }

  if (report.integrationGaps.length > 0) {
    console.log(`\n⚠️ Integration gaps detected (${report.integrationGaps.length}):`);
    report.integrationGaps.slice(0, 10).forEach(gap => console.log(`   - ${gap}`));
    if (report.integrationGaps.length > 10) {
      console.log(`   ... and ${report.integrationGaps.length - 10} more`);
    }
  } else {
    console.log('\n✅ No integration gaps detected');
  }

  console.log('\n=== Recommendations ===');
  report.recommendations.forEach(rec => console.log(`📌 ${rec}`));
}

main().catch(console.error);
