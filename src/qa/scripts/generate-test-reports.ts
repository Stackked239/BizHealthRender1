/**
 * Generate Test Reports
 *
 * Generates Phase 5 HTML reports using sample data for testing.
 * These are used as fixtures for automated formatting tests.
 *
 * Run with: npm run generate:test-reports
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { buildOwnersReport } from '../../orchestration/reports/owners-report.builder.js';
import { buildComprehensiveReport } from '../../orchestration/reports/comprehensive-report.builder.js';
import { createSampleReportContext } from '../fixtures/sample-context.js';
import { DEFAULT_BRAND, type ReportRenderOptions } from '../../types/report.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTestReports(): Promise<void> {
  console.log('📄 Generating Phase 5 Test Reports\n');

  const outputDir = path.join(__dirname, '../fixtures/phase5');
  fs.mkdirSync(outputDir, { recursive: true });

  const ctx = createSampleReportContext();

  const options: ReportRenderOptions = {
    outputDir,
    brand: DEFAULT_BRAND,
    includeTOC: true,
    includePageNumbers: true,
    includeHeaderFooter: true,
  };

  // Generate Owner's Report
  try {
    console.log('⏳ Generating Owner\'s Report...');
    const ownersResult = await buildOwnersReport(ctx, options);
    const ownersPath = path.join(outputDir, 'owners-report.html');

    // Read the generated file and copy to standard fixture location
    if (fs.existsSync(ownersResult.htmlPath)) {
      const content = fs.readFileSync(ownersResult.htmlPath, 'utf-8');
      fs.writeFileSync(ownersPath, content);
      console.log(`✅ Generated: ${ownersPath}`);
    } else {
      console.error('❌ Owner\'s Report HTML not found at expected path');
    }
  } catch (error) {
    console.error('❌ Failed to generate Owner\'s Report:', error);
  }

  // Generate Comprehensive Report
  try {
    console.log('⏳ Generating Comprehensive Report...');
    const comprehensiveResult = await buildComprehensiveReport(ctx, options);
    const comprehensivePath = path.join(outputDir, 'comprehensive-report.html');

    // Read the generated file and copy to standard fixture location
    if (fs.existsSync(comprehensiveResult.htmlPath)) {
      const content = fs.readFileSync(comprehensiveResult.htmlPath, 'utf-8');
      fs.writeFileSync(comprehensivePath, content);
      console.log(`✅ Generated: ${comprehensivePath}`);
    } else {
      console.error('❌ Comprehensive Report HTML not found at expected path');
    }
  } catch (error) {
    console.error('❌ Failed to generate Comprehensive Report:', error);
  }

  console.log('\n✅ Test report generation complete!');
  console.log('Now run: npm run test:formatting');
}

generateTestReports().catch(console.error);
