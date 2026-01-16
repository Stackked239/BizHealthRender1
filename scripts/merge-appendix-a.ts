/**
 * Stage 1: HTML Merge Script for Appendix A Integration
 *
 * This script safely merges comprehensive.html and quickWins.html files
 * to produce a client-ready comprehensive-with-appendix.html file.
 *
 * Usage: npx tsx scripts/merge-appendix-a.ts [outputDir]
 *
 * If no outputDir is specified, uses the latest Premier Auto Care output.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OUTPUT_DIR = './output/00ab2287-fb69-43ea-b086-77f410a8f490/reports/report-1766043102067';

// ============================================================================
// FILE READING WITH VALIDATION
// ============================================================================

function safeReadFile(filepath: string): string | null {
  try {
    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      return null;
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    console.log(`✓ Read ${filepath}: ${content.length.toLocaleString()} chars`);
    return content;
  } catch (error) {
    console.error(`❌ Error reading ${filepath}:`, error);
    return null;
  }
}

// ============================================================================
// CSS EXTRACTION
// ============================================================================

function extractCSS(html: string, source: string): string {
  // Try to find style block
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);

  if (!styleMatch) {
    console.warn(`⚠️  No <style> block found in ${source}`);
    return '';
  }

  console.log(`✓ Extracted CSS from ${source}: ${styleMatch[1].length.toLocaleString()} chars`);
  return styleMatch[1];
}

// ============================================================================
// CSS MERGING STRATEGY
// ============================================================================

function mergeCSS(comprehensiveCSS: string, quickWinsCSS: string): string {
  // Strategy: Keep comprehensive CSS as base, add unique QuickWins rules scoped to appendix

  // Identify unique QuickWins rules
  const quickWinsRules = quickWinsCSS.split('}').map(r => r.trim() + '}');
  const uniqueRules: string[] = [];

  // Rules specific to the appendix that need to be preserved
  const appendixSpecificSelectors = [
    '.action-card',
    '.action-card-header',
    '.action-card-title',
    '.action-card-id',
    '.action-card-meta',
    '.action-card-section',
    '.appendix-container',
    '.appendix-header',
    '.appendix-designation',
    '.appendix-title',
    '.appendix-subtitle',
    '.parent-report-banner',
    '.metrics-grid',
    '.metric-card',
    '.metric-value',
    '.metric-label',
    '.priority-matrix',
    '.priority-badge',
    '.score-bar-container',
    '.score-bar',
    '.score-bar-fill',
    '.score-value',
    '.roi-badge',
    '.implementation-table',
    '.evidence-section',
    '.evidence-item',
    '.evidence-question',
    '.cross-ref-links',
    '.cross-ref-link',
    '.timeline-section',
    '.timeline-phase',
    '.timeline-marker',
    '.timeline-days',
    '.timeline-label',
    '.timeline-connector',
    '.timeline-content',
    '.timeline-actions',
    '.worksheet-section',
    '.worksheet-table',
    '.xref-table',
    '.intro-section',
    '.section-divider',
  ];

  for (const rule of quickWinsRules) {
    // Skip empty rules
    if (rule.length < 5) continue;

    // Get the selector part
    const selectorPart = rule.split('{')[0]?.trim() || '';

    // Skip if this is a duplicate of something in comprehensive
    // (check for common base selectors that are already defined)
    const commonSelectors = ['body', 'html', '*', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li'];
    const isCommonSelector = commonSelectors.some(s => selectorPart === s);

    if (isCommonSelector) {
      continue;
    }

    // Check if this is an appendix-specific rule
    const isAppendixSpecific = appendixSpecificSelectors.some(sel => selectorPart.includes(sel));

    // Also include :root variables and @media/@page rules
    const isRootOrMedia = selectorPart.includes(':root') ||
                          selectorPart.includes('@media') ||
                          selectorPart.includes('@page');

    if (isAppendixSpecific || isRootOrMedia) {
      // Scope to #appendix-a unless it's a media query or :root
      if (isRootOrMedia || selectorPart.startsWith('.appendix')) {
        uniqueRules.push(rule);
      } else {
        // Scope the rule to #appendix-a
        const scopedRule = rule.replace(selectorPart, `#appendix-a ${selectorPart}`);
        uniqueRules.push(scopedRule);
      }
    }
  }

  // Add appendix pagination CSS
  const appendixPaginationCSS = `
/* === APPENDIX A PAGINATION & STYLES === */
#appendix-a {
  page-break-before: always;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 4px solid #212653;
}

#appendix-a .appendix-container {
  padding: 0;
  max-width: none;
}

@media print {
  #appendix-a {
    page-break-before: always;
  }
  #appendix-a .action-card,
  #appendix-a .timeline-phase,
  #appendix-a .metrics-grid {
    page-break-inside: avoid;
  }
  #appendix-a table {
    page-break-inside: avoid;
  }
}
`;

  const merged = comprehensiveCSS + '\n\n' + appendixPaginationCSS + '\n\n/* === APPENDIX A UNIQUE STYLES === */\n' +
                 uniqueRules.filter(r => r.length > 5).join('\n\n');

  console.log(`✓ Merged CSS: ${merged.length.toLocaleString()} chars (added ${uniqueRules.length} unique rules)`);
  return merged;
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

function extractQuickWinsContent(html: string): string | null {
  let cleaned = html;

  // Remove clickwrap modal if present
  cleaned = cleaned.replace(/<div[^>]*id="clickwrap-modal[^"]*"[^>]*>[\s\S]*?<\/div>\s*<!--.*?-->/g, '');
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*clickwrap[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');

  // Remove HTML document structure
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
  cleaned = cleaned.replace(/<html[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/html>/gi, '');
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<body[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/body>/gi, '');

  // Remove style blocks (we've already extracted the CSS)
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove script tags
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Clean up whitespace
  cleaned = cleaned.trim();

  if (cleaned.length < 1000) {
    console.error('❌ Extracted content too short - extraction may have failed');
    console.error(`   Extracted length: ${cleaned.length} chars`);
    return null;
  }

  console.log(`✓ Extracted QuickWins content: ${cleaned.length.toLocaleString()} chars`);
  return cleaned;
}

// ============================================================================
// TABLE OF CONTENTS UPDATE
// ============================================================================

function updateTOC(html: string): string {
  const appendixEntry = `
        <li>
          <a href="#appendix-a">Appendix A: Accelerated Action Plan (0-90 Days)</a>
          <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
            <li><a href="#appendix-a-priority-matrix">Priority Matrix</a></li>
            <li><a href="#appendix-a-detailed-actions">Detailed Action Plans</a></li>
            <li><a href="#appendix-a-timeline">30-60-90 Day Timeline</a></li>
            <li><a href="#appendix-a-worksheet">Manager's Implementation Worksheet</a></li>
          </ul>
        </li>
`;

  // Strategy 1: Find the last </ul> before the first major section (after TOC)
  // Look for </ul></nav> pattern which closes TOC
  let updated = html.replace(
    /(<\/ul>\s*<\/nav>)/i,
    appendixEntry + '$1'
  );

  if (updated !== html) {
    console.log('✓ Updated TOC (found </ul></nav> pattern)');
    return updated;
  }

  // Strategy 2: Find TOC section and insert before its closing </ul>
  const tocMatch = html.match(/(class="[^"]*toc[^"]*"[^>]*>[\s\S]*?)(<\/ul>\s*<\/(?:nav|div)>)/i);
  if (tocMatch) {
    const tocStart = html.indexOf(tocMatch[0]);
    const insertPoint = tocStart + tocMatch[1].length;
    updated = html.substring(0, insertPoint) + appendixEntry + html.substring(insertPoint);
    console.log('✓ Updated TOC (strategy 2 - found TOC class)');
    return updated;
  }

  // Strategy 3: Find section with id="toc" or similar
  const tocSectionMatch = html.match(/<(?:nav|div)[^>]*id="[^"]*toc[^"]*"[^>]*>[\s\S]*?(<\/ul>)/i);
  if (tocSectionMatch) {
    const insertPoint = html.indexOf(tocSectionMatch[1]);
    updated = html.substring(0, insertPoint) + appendixEntry + html.substring(insertPoint);
    console.log('✓ Updated TOC (strategy 3 - found TOC id)');
    return updated;
  }

  console.warn('⚠️  Could not update TOC - manual check required');
  return html;
}

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================

function assembleDocument(
  comprehensiveHTML: string,
  mergedCSS: string,
  appendixContent: string
): string {
  // Replace CSS in comprehensive
  let output = comprehensiveHTML.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/,
    `$1\n${mergedCSS}\n$3`
  );

  // Wrap appendix content in section with proper ID
  const appendixSection = `
<!-- ============================================================================ -->
<!-- APPENDIX A: ACCELERATED ACTION PLAN (0-90 Days)                              -->
<!-- Integrated from quickWins.html - Premier Auto Care Centers                   -->
<!-- ============================================================================ -->
<section id="appendix-a" class="section page-break">
  ${appendixContent}
</section>
`;

  // Find the best place to insert the appendix
  // 1. Before </main> if it exists
  // 2. Before the footer if it exists
  // 3. Before </body> as fallback

  if (output.includes('</main>')) {
    output = output.replace('</main>', appendixSection + '\n</main>');
    console.log('✓ Inserted appendix before </main>');
  } else if (output.includes('<footer')) {
    output = output.replace(/<footer/i, appendixSection + '\n<footer');
    console.log('✓ Inserted appendix before <footer>');
  } else {
    output = output.replace('</body>', appendixSection + '\n</body>');
    console.log('✓ Inserted appendix before </body>');
  }

  console.log(`✓ Assembled final document: ${output.length.toLocaleString()} chars`);
  return output;
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
  }>;
}

function validateOutput(html: string): ValidationResult {
  const checks = [
    {
      name: 'File size > 1.3MB',
      passed: html.length > 1300000,
      expected: '> 1,300,000 chars',
      actual: `${html.length.toLocaleString()} chars`,
    },
    {
      name: 'Contains #appendix-a',
      passed: html.includes('id="appendix-a"'),
      expected: 'id="appendix-a" present',
      actual: html.includes('id="appendix-a"') ? 'Present' : 'Missing',
    },
    {
      name: 'Contains action-card class',
      passed: html.includes('class="action-card"'),
      expected: 'action-card class present',
      actual: html.includes('class="action-card"') ? 'Present' : 'Missing',
    },
    {
      name: 'Contains appendix-container',
      passed: html.includes('appendix-container'),
      expected: 'appendix-container present',
      actual: html.includes('appendix-container') ? 'Present' : 'Missing',
    },
    {
      name: 'TOC updated with Appendix A',
      passed: html.includes('href="#appendix-a"'),
      expected: 'TOC link to appendix',
      actual: html.includes('href="#appendix-a"') ? 'Present' : 'Missing',
    },
    {
      name: 'HTML structure valid',
      passed: html.includes('<!DOCTYPE html') && html.includes('</html>'),
      expected: 'Valid HTML document',
      actual: html.includes('<!DOCTYPE html') && html.includes('</html>') ? 'Valid' : 'Invalid',
    },
  ];

  return {
    passed: checks.every(c => c.passed),
    checks,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('BizHealth Appendix A Integration');
  console.log('Stage 1: HTML Merge Script');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get output directory from args or use default
  const args = process.argv.slice(2);
  const outputDir = args[0] || DEFAULT_OUTPUT_DIR;

  console.log(`📁 Output directory: ${outputDir}\n`);

  // Define file paths
  const comprehensivePath = path.join(outputDir, 'comprehensive.html');
  const quickWinsPath = path.join(outputDir, 'quickWins.html');
  const outputPath = path.join(outputDir, 'comprehensive-with-appendix.html');

  // Step 1: Read files
  console.log('Step 1: Reading input files...');
  const comprehensive = safeReadFile(comprehensivePath);
  const quickWins = safeReadFile(quickWinsPath);

  if (!comprehensive || !quickWins) {
    console.error('\n❌ Failed to read input files - aborting');
    process.exit(1);
  }

  // Step 2: Extract CSS
  console.log('\nStep 2: Extracting CSS...');
  const comprehensiveCSS = extractCSS(comprehensive, 'comprehensive');
  const quickWinsCSS = extractCSS(quickWins, 'quickWins');
  const mergedCSS = mergeCSS(comprehensiveCSS, quickWinsCSS);

  // Step 3: Extract QuickWins content
  console.log('\nStep 3: Extracting QuickWins content...');
  const appendixContent = extractQuickWinsContent(quickWins);
  if (!appendixContent) {
    console.error('\n❌ Failed to extract appendix content - aborting');
    process.exit(1);
  }

  // Step 4: Update TOC
  console.log('\nStep 4: Updating Table of Contents...');
  const updatedComprehensive = updateTOC(comprehensive);

  // Step 5: Assemble final document
  console.log('\nStep 5: Assembling final document...');
  const final = assembleDocument(updatedComprehensive, mergedCSS, appendixContent);

  // Step 6: Write output
  console.log('\nStep 6: Writing output file...');
  try {
    fs.writeFileSync(outputPath, final, 'utf-8');
    console.log(`✓ SUCCESS: Written to ${outputPath}`);
    console.log(`  File size: ${(final.length / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Error writing output:', error);
    process.exit(1);
  }

  // Step 7: Validation
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Validation Checks:');
  console.log('═══════════════════════════════════════════════════════════════');

  const validation = validateOutput(final);

  for (const check of validation.checks) {
    const icon = check.passed ? '✓' : '❌';
    const status = check.passed ? 'PASS' : 'FAIL';
    console.log(`  ${icon} ${check.name}: ${status}`);
    if (!check.passed) {
      console.log(`      Expected: ${check.expected}`);
      console.log(`      Actual: ${check.actual}`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');

  if (validation.passed) {
    console.log('\n✅ All validation checks passed!');
    console.log(`\n📄 Client-ready file: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('  1. Open the file in a browser to verify visual formatting');
    console.log('  2. Use Print Preview to check pagination');
    console.log('  3. Verify TOC links navigate correctly');
  } else {
    console.log('\n⚠️  Some validation checks failed - please review');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
