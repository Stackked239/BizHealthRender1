/**
 * Validates that all SECTION_MAPPINGS titles exist in rendered Comprehensive Report
 * Prevents silent drift between Owner's references and Comprehensive sections
 *
 * Usage:
 *   npm run validate:reports
 *   npx tsx src/orchestration/reports/validation/validate-reports.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { SECTION_MAPPINGS, SectionMapping } from '../config/section-mapping.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
  checkedAt: string;
}

export interface ValidationError {
  mappingId: string;
  expectedTitle: string;
  issue: 'TITLE_NOT_FOUND' | 'ANCHOR_NOT_FOUND' | 'DUPLICATE_TITLE';
  suggestion?: string;
}

export interface ValidationWarning {
  mappingId: string;
  message: string;
}

export interface ValidationStats {
  totalMappings: number;
  titlesFound: number;
  titlesMissing: number;
  anchorsFound: number;
  anchorsMissing: number;
}

/**
 * Validate section mappings against rendered Comprehensive HTML
 */
export function validateSectionMappings(
  comprehensiveHtmlPath: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const stats: ValidationStats = {
    totalMappings: SECTION_MAPPINGS.length,
    titlesFound: 0,
    titlesMissing: 0,
    anchorsFound: 0,
    anchorsMissing: 0
  };

  // Read the Comprehensive HTML
  if (!fs.existsSync(comprehensiveHtmlPath)) {
    return {
      valid: false,
      errors: [{
        mappingId: 'SYSTEM',
        expectedTitle: 'N/A',
        issue: 'TITLE_NOT_FOUND',
        suggestion: `Comprehensive HTML not found at: ${comprehensiveHtmlPath}`
      }],
      warnings: [],
      stats,
      checkedAt: new Date().toISOString()
    };
  }

  const htmlContent = fs.readFileSync(comprehensiveHtmlPath, 'utf-8');

  // Track found titles for duplicate detection
  const foundTitles = new Map<string, string[]>();

  for (const mapping of SECTION_MAPPINGS) {
    // Check 1: Section title exists in HTML
    const titleExists = htmlContent.includes(mapping.comprehensiveSectionTitle);

    if (!titleExists) {
      stats.titlesMissing++;

      // Try to find similar titles for suggestion
      const suggestion = findSimilarTitle(htmlContent, mapping.comprehensiveSectionTitle);

      errors.push({
        mappingId: mapping.id,
        expectedTitle: mapping.comprehensiveSectionTitle,
        issue: 'TITLE_NOT_FOUND',
        suggestion: suggestion
          ? `Did you mean: "${suggestion}"?`
          : 'No similar title found in Comprehensive Report'
      });
    } else {
      stats.titlesFound++;

      // Track for duplicate detection
      if (!foundTitles.has(mapping.comprehensiveSectionTitle)) {
        foundTitles.set(mapping.comprehensiveSectionTitle, []);
      }
      foundTitles.get(mapping.comprehensiveSectionTitle)!.push(mapping.id);
    }

    // Check 2: Anchor ID exists (if specified)
    if (mapping.comprehensiveAnchor) {
      const anchorPattern = new RegExp(
        `id=["']${mapping.comprehensiveAnchor}["']`,
        'i'
      );
      const anchorExists = anchorPattern.test(htmlContent);

      if (!anchorExists) {
        stats.anchorsMissing++;
        warnings.push({
          mappingId: mapping.id,
          message: `Anchor ID "${mapping.comprehensiveAnchor}" not found. Deep linking may not work.`
        });
      } else {
        stats.anchorsFound++;
      }
    }
  }

  // Check 3: Duplicate title mappings
  for (const [title, mappingIds] of foundTitles) {
    if (mappingIds.length > 1) {
      errors.push({
        mappingId: mappingIds.join(', '),
        expectedTitle: title,
        issue: 'DUPLICATE_TITLE',
        suggestion: `Multiple mappings point to same section: ${mappingIds.join(', ')}`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Find similar title in HTML using fuzzy matching
 */
function findSimilarTitle(html: string, targetTitle: string): string | null {
  // Extract all h2/h3 titles from HTML
  const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/gi;
  const titles: string[] = [];
  let match;

  while ((match = titlePattern.exec(html)) !== null) {
    titles.push(match[1].trim());
  }

  // Find best match using simple word overlap similarity
  let bestMatch: string | null = null;
  let bestScore = 0;

  const targetWords = targetTitle.toLowerCase().split(/\s+/);

  for (const title of titles) {
    const titleWords = title.toLowerCase().split(/\s+/);
    const commonWords = targetWords.filter(w => titleWords.includes(w));
    const score = commonWords.length / Math.max(targetWords.length, titleWords.length);

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = title;
    }
  }

  return bestMatch;
}

/**
 * Find the most recent Comprehensive HTML in output directory
 */
export function findComprehensiveHtml(reportDir: string): string | null {
  if (!fs.existsSync(reportDir)) {
    return null;
  }

  // Search in subdirectories (run ID folders)
  const items = fs.readdirSync(reportDir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      const subDir = path.join(reportDir, item.name);
      const files = fs.readdirSync(subDir);
      const compFile = files.find(f =>
        f.toLowerCase().includes('comprehensive') && f.endsWith('.html')
      );
      if (compFile) {
        return path.join(subDir, compFile);
      }
    }
  }

  // Also check root directory
  const rootFiles = items.filter(i => i.isFile()).map(i => i.name);
  const rootCompFile = rootFiles.find(f =>
    f.toLowerCase().includes('comprehensive') && f.endsWith('.html')
  );
  if (rootCompFile) {
    return path.join(reportDir, rootCompFile);
  }

  return null;
}

/**
 * Run validation and output results to console
 */
export function runValidation(reportDir: string): boolean {
  console.log('\n+--------------------------------------------------------+');
  console.log('|           SECTION MAPPING VALIDATION                    |');
  console.log('+--------------------------------------------------------+\n');

  // Find the most recent Comprehensive HTML
  const comprehensivePath = findComprehensiveHtml(reportDir);

  if (!comprehensivePath) {
    console.error('[ERROR] No Comprehensive Report HTML found');
    console.error(`   Searched in: ${reportDir}`);
    console.error('\n   Run the pipeline first: npx tsx src/run-pipeline.ts\n');
    return false;
  }

  console.log(`Validating against: ${path.relative(process.cwd(), comprehensivePath)}\n`);

  const result = validateSectionMappings(comprehensivePath);

  // Output stats
  console.log(`  Mappings checked: ${result.stats.totalMappings}`);
  console.log(`  Titles found:     ${result.stats.titlesFound}/${result.stats.totalMappings}`);
  console.log(`  Anchors found:    ${result.stats.anchorsFound}/${result.stats.totalMappings}`);

  // Output errors
  if (result.errors.length > 0) {
    console.log('\n[ERRORS] (must fix before deployment):');
    for (const error of result.errors) {
      console.log(`\n   [${error.mappingId}] ${error.issue}`);
      console.log(`   Expected: "${error.expectedTitle}"`);
      if (error.suggestion) {
        console.log(`   Suggestion: ${error.suggestion}`);
      }
    }
  }

  // Output warnings
  if (result.warnings.length > 0) {
    console.log('\n[WARNINGS] (should fix):');
    for (const warning of result.warnings) {
      console.log(`   [${warning.mappingId}] ${warning.message}`);
    }
  }

  // Final status
  console.log('');
  if (result.valid) {
    console.log('[SUCCESS] All section mappings validated successfully!\n');
    return true;
  } else {
    console.log('[FAILED] Validation FAILED - fix errors before deployment\n');
    return false;
  }
}
