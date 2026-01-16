#!/usr/bin/env npx tsx
/**
 * OUTPUT AUDIT
 * Scans pipeline output files for ASCII art violations
 */

import * as fs from 'fs';
import * as path from 'path';
import type { OutputAuditResult } from './types.js';

// Extended ASCII pattern to catch all box-drawing and decorative characters
const ASCII_PATTERN = /[\u2500-\u257F\u2580-\u259F\u2190-\u21FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]/g;

// Specific characters we want to eliminate
const SPECIFIC_ASCII = /[\u250C\u2510\u2514\u2518\u2502\u2500\u252C\u2534\u251C\u2524\u2550\u2551\u2554\u2557\u255A\u255D\u2560\u2563\u2566\u2569\u256C\u2588\u2593\u2591\u25B2\u25BC\u25BA\u25C4\u25CF\u25CB\u25A0\u25A1\u25AA\u25AB]/g;

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function scanFile(filePath: string): { asciiCount: number; matches: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');

  const matches = content.match(ASCII_PATTERN) || [];
  const uniqueMatches = [...new Set(matches)];

  return {
    asciiCount: matches.length,
    matches: uniqueMatches.slice(0, 10) // Limit to first 10 unique chars
  };
}

export async function runOutputAudit(outputDir: string = 'output'): Promise<OutputAuditResult> {
  const projectRoot = process.cwd();
  const fullOutputDir = path.join(projectRoot, outputDir);

  console.log(`   Scanning output directory: ${outputDir}\n`);

  if (!fs.existsSync(fullOutputDir)) {
    console.log('   \u26a0 Output directory not found');
    return {
      files: [],
      summary: {
        totalFiles: 0,
        cleanFiles: 0,
        filesWithAscii: 0,
        totalAsciiChars: 0
      }
    };
  }

  const allFiles = findFiles(fullOutputDir, ['.json', '.html']);
  const files: OutputAuditResult['files'] = [];
  let totalAsciiChars = 0;

  // Group files by type for better output
  const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
  const htmlFiles = allFiles.filter(f => f.endsWith('.html'));

  console.log(`   Found ${jsonFiles.length} JSON files, ${htmlFiles.length} HTML files\n`);

  // Scan JSON files
  console.log('   JSON Files:');
  for (const file of jsonFiles) {
    const result = scanFile(file);
    const relativePath = path.relative(fullOutputDir, file);
    const clean = result.asciiCount === 0;

    totalAsciiChars += result.asciiCount;

    files.push({
      path: relativePath,
      asciiCount: result.asciiCount,
      clean,
      type: 'json'
    });

    if (!clean) {
      console.log(`   \u2717 ${relativePath}: ${result.asciiCount} ASCII chars [${result.matches.join('')}]`);
    }
  }

  const cleanJson = jsonFiles.length - files.filter(f => f.type === 'json' && !f.clean).length;
  console.log(`   ${cleanJson}/${jsonFiles.length} clean\n`);

  // Scan HTML files
  console.log('   HTML Files:');
  let htmlWithAscii = 0;
  for (const file of htmlFiles) {
    const result = scanFile(file);
    const relativePath = path.relative(fullOutputDir, file);
    const clean = result.asciiCount === 0;

    totalAsciiChars += result.asciiCount;

    files.push({
      path: relativePath,
      asciiCount: result.asciiCount,
      clean,
      type: 'html'
    });

    if (!clean) {
      htmlWithAscii++;
      console.log(`   \u2717 ${relativePath}: ${result.asciiCount} ASCII chars`);
    }
  }

  const cleanHtml = htmlFiles.length - htmlWithAscii;
  console.log(`   ${cleanHtml}/${htmlFiles.length} clean\n`);

  const totalFiles = files.length;
  const cleanFiles = files.filter(f => f.clean).length;
  const filesWithAscii = files.filter(f => !f.clean).length;

  console.log('   Summary:');
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Clean files: ${cleanFiles}`);
  console.log(`   Files with ASCII: ${filesWithAscii}`);
  console.log(`   Total ASCII characters: ${totalAsciiChars}`);

  return {
    files,
    summary: {
      totalFiles,
      cleanFiles,
      filesWithAscii,
      totalAsciiChars
    }
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const outputDir = process.argv[2] || 'output';
  runOutputAudit(outputDir).then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify(result.summary, null, 2));
  });
}
