/**
 * Validates that all SECTION_MAPPINGS titles exist in rendered Comprehensive Report
 */

import * as fs from 'fs';
import * as path from 'path';
import { SECTION_MAPPINGS } from '../config/section-mapping';

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

export function validateSectionMappings(comprehensiveHtmlPath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const stats: ValidationStats = {
    totalMappings: SECTION_MAPPINGS.length,
    titlesFound: 0,
    titlesMissing: 0,
    anchorsFound: 0,
    anchorsMissing: 0
  };

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
  const foundTitles = new Map<string, string[]>();

  for (const mapping of SECTION_MAPPINGS) {
    const titleExists = htmlContent.includes(mapping.comprehensiveSectionTitle);

    if (!titleExists) {
      stats.titlesMissing++;
      const suggestion = findSimilarTitle(htmlContent, mapping.comprehensiveSectionTitle);
      errors.push({
        mappingId: mapping.id,
        expectedTitle: mapping.comprehensiveSectionTitle,
        issue: 'TITLE_NOT_FOUND',
        suggestion: suggestion ? `Did you mean: "${suggestion}"?` : 'No similar title found'
      });
    } else {
      stats.titlesFound++;
      if (!foundTitles.has(mapping.comprehensiveSectionTitle)) {
        foundTitles.set(mapping.comprehensiveSectionTitle, []);
      }
      foundTitles.get(mapping.comprehensiveSectionTitle)!.push(mapping.id);
    }

    if (mapping.comprehensiveAnchor) {
      const anchorPattern = new RegExp(`id=["']${mapping.comprehensiveAnchor}["']`, 'i');
      if (!anchorPattern.test(htmlContent)) {
        stats.anchorsMissing++;
        warnings.push({
          mappingId: mapping.id,
          message: `Anchor ID "${mapping.comprehensiveAnchor}" not found.`
        });
      } else {
        stats.anchorsFound++;
      }
    }
  }

  for (const [title, mappingIds] of foundTitles) {
    if (mappingIds.length > 1) {
      errors.push({
        mappingId: mappingIds.join(', '),
        expectedTitle: title,
        issue: 'DUPLICATE_TITLE',
        suggestion: `Multiple mappings point to same section`
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings, stats, checkedAt: new Date().toISOString() };
}

function findSimilarTitle(html: string, targetTitle: string): string | null {
  const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/gi;
  const titles: string[] = [];
  let match;
  while ((match = titlePattern.exec(html)) !== null) {
    titles.push(match[1].trim());
  }

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

export function findComprehensiveHtml(reportDir: string): string | null {
  if (!fs.existsSync(reportDir)) return null;

  const items = fs.readdirSync(reportDir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      const subDir = path.join(reportDir, item.name);
      const files = fs.readdirSync(subDir);
      const compFile = files.find(f => f.toLowerCase().includes('comprehensive') && f.endsWith('.html'));
      if (compFile) return path.join(subDir, compFile);
    }
  }

  const rootFiles = items.filter(i => i.isFile()).map(i => i.name);
  const rootCompFile = rootFiles.find(f => f.toLowerCase().includes('comprehensive') && f.endsWith('.html'));
  if (rootCompFile) return path.join(reportDir, rootCompFile);

  return null;
}

export function runValidation(reportDir: string): boolean {
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│           SECTION MAPPING VALIDATION                   │');
  console.log('└────────────────────────────────────────────────────────┘\n');

  const comprehensivePath = findComprehensiveHtml(reportDir);

  if (!comprehensivePath) {
    console.error('❌ ERROR: No Comprehensive Report HTML found');
    console.error(`   Searched in: ${reportDir}`);
    console.error('\n   Run the pipeline first: npx tsx src/run-pipeline.ts\n');
    return false;
  }

  console.log(`📄 Validating against: ${path.relative(process.cwd(), comprehensivePath)}\n`);

  const result = validateSectionMappings(comprehensivePath);

  console.log(`  Mappings checked: ${result.stats.totalMappings}`);
  console.log(`  Titles found:     ${result.stats.titlesFound}/${result.stats.totalMappings}`);
  console.log(`  Anchors found:    ${result.stats.anchorsFound}/${result.stats.totalMappings}`);

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    for (const error of result.errors) {
      console.log(`\n   [${error.mappingId}] ${error.issue}`);
      console.log(`   Expected: "${error.expectedTitle}"`);
      if (error.suggestion) console.log(`   💡 ${error.suggestion}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`   [${warning.mappingId}] ${warning.message}`);
    }
  }

  console.log('');
  if (result.valid) {
    console.log('✅ All section mappings validated successfully!\n');
    return true;
  } else {
    console.log('❌ Validation FAILED\n');
    return false;
  }
}
