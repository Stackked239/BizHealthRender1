#!/usr/bin/env node
/**
 * Validation Script for Technology Investment Scoring Fix
 *
 * This script validates that:
 * 1. Phase 1.5 has TIN and ITD category scores
 * 2. IDM dimensions would be updated correctly with Phase 1.5 scores
 * 3. The IT Manager recipe uses correct dimension codes (ITD not IDS)
 */

import * as fs from 'fs';
import * as path from 'path';

const outputDir = process.cwd() + '/output';

console.log('=== Technology Investment Scoring Fix Validation ===\n');

// Helper to get score band
function getScoreBand(score) {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

// Test 1: Load Phase 1.5 output
console.log('Test 1: Checking Phase 1.5 output...');
let phase1_5;
try {
  phase1_5 = JSON.parse(fs.readFileSync(path.join(outputDir, 'phase1_5_output.json'), 'utf-8'));
  console.log(`  ✓ Phase 1.5 loaded: ${phase1_5.categoryAnalyses.length} categories`);
} catch (e) {
  console.log(`  ✗ Failed to load Phase 1.5: ${e.message}`);
  process.exit(1);
}

// Test 2: Check TIN and ITD categories exist in Phase 1.5
console.log('\nTest 2: Checking TIN and ITD categories in Phase 1.5...');
const tinCategory = phase1_5.categoryAnalyses.find(c => c.categoryCode === 'TIN');
const itdCategory = phase1_5.categoryAnalyses.find(c => c.categoryCode === 'ITD');

if (tinCategory) {
  console.log(`  ✓ TIN (Technology & Innovation): Score ${tinCategory.overallScore}/100`);
} else {
  console.log('  ✗ TIN category NOT FOUND in Phase 1.5');
}

if (itdCategory) {
  console.log(`  ✓ ITD (IT & Data Security): Score ${itdCategory.overallScore}/100`);
} else {
  console.log('  ✗ ITD category NOT FOUND in Phase 1.5');
}

// Test 3: Load current IDM and check dimensions
console.log('\nTest 3: Checking current IDM dimensions...');
let idm;
try {
  idm = JSON.parse(fs.readFileSync(path.join(outputDir, 'idm_output.json'), 'utf-8'));
  console.log(`  ✓ IDM loaded: ${idm.dimensions.length} dimensions`);
} catch (e) {
  console.log(`  ✗ Failed to load IDM: ${e.message}`);
  process.exit(1);
}

const tinDim = idm.dimensions.find(d => d.dimension_code === 'TIN');
const itdDim = idm.dimensions.find(d => d.dimension_code === 'ITD');

console.log('\nTest 4: Comparing IDM vs Phase 1.5 scores (BEFORE fix)...');
if (tinDim) {
  console.log(`  TIN: IDM=${tinDim.score_overall}/100, Phase1.5=${tinCategory?.overallScore ?? 'N/A'}/100`);
  if (tinDim.score_overall !== tinCategory?.overallScore) {
    console.log(`       ⚠️ MISMATCH - fix will update ${tinDim.score_overall} → ${tinCategory.overallScore}`);
  }
} else {
  console.log('  ✗ TIN dimension NOT FOUND in IDM');
}

if (itdDim) {
  console.log(`  ITD: IDM=${itdDim.score_overall}/100, Phase1.5=${itdCategory?.overallScore ?? 'N/A'}/100`);
  if (itdDim.score_overall !== itdCategory?.overallScore) {
    console.log(`       ⚠️ MISMATCH - fix will update ${itdDim.score_overall} → ${itdCategory.overallScore}`);
  }
} else {
  console.log('  ✗ ITD dimension NOT FOUND in IDM');
}

// Test 5: Simulate the fix
console.log('\nTest 5: Simulating Phase 4 fix...');
let dimensionsUpdated = 0;
const simulatedUpdates = [];

for (const categoryAnalysis of phase1_5.categoryAnalyses) {
  const categoryCode = categoryAnalysis.categoryCode;
  const phase1_5Score = categoryAnalysis.overallScore;
  const dimension = idm.dimensions.find(d => d.dimension_code === categoryCode);

  if (dimension) {
    const oldScore = dimension.score_overall;
    if (oldScore !== phase1_5Score) {
      simulatedUpdates.push({
        dimension: categoryCode,
        name: dimension.name,
        oldScore,
        newScore: phase1_5Score,
        newBand: getScoreBand(phase1_5Score)
      });
      dimensionsUpdated++;
    }
  }
}

console.log(`  → ${dimensionsUpdated} dimensions would be updated:`);
for (const update of simulatedUpdates) {
  console.log(`    ${update.dimension} (${update.name}): ${update.oldScore} → ${update.newScore} (${update.newBand})`);
}

// Test 6: Check IT Manager recipe uses ITD (not IDS)
console.log('\nTest 6: Checking IT Manager recipe dimension codes...');
try {
  const recipeFile = fs.readFileSync(
    path.join(process.cwd(), 'src/orchestration/reports/config/manager-recipes.ts'),
    'utf-8'
  );

  // Check for ITD in IT_TECHNOLOGY_MANAGER_RECIPE
  const itRecipeMatch = recipeFile.match(/IT_TECHNOLOGY_MANAGER_RECIPE[\s\S]*?dimensionCodes:\s*\[([^\]]+)\]/);
  if (itRecipeMatch) {
    const dimensionCodes = itRecipeMatch[1];
    if (dimensionCodes.includes('ITD') && !dimensionCodes.includes("'IDS'")) {
      console.log('  ✓ IT Manager recipe uses ITD (correct)');
    } else if (dimensionCodes.includes('IDS')) {
      console.log('  ✗ IT Manager recipe uses IDS (should be ITD)');
    }
    console.log(`    Dimension codes found: ${dimensionCodes.trim()}`);
  }
} catch (e) {
  console.log(`  ✗ Failed to check recipe: ${e.message}`);
}

// Summary
console.log('\n=== Summary ===');
console.log(`Phase 1.5 TIN score: ${tinCategory?.overallScore ?? 'N/A'}`);
console.log(`Phase 1.5 ITD score: ${itdCategory?.overallScore ?? 'N/A'}`);
console.log(`Current IDM TIN score: ${tinDim?.score_overall ?? 'N/A'}`);
console.log(`Current IDM ITD score: ${itdDim?.score_overall ?? 'N/A'}`);
console.log(`Dimensions that will be updated: ${dimensionsUpdated}`);

// Final verdict
console.log('\n=== Validation Result ===');
const tinMismatch = tinDim && tinCategory && tinDim.score_overall !== tinCategory.overallScore;
const itdMismatch = itdDim && itdCategory && itdDim.score_overall !== itdCategory.overallScore;

if (tinMismatch || itdMismatch) {
  console.log('⚠️  FIX NEEDED: IDM scores do not match Phase 1.5 scores');
  console.log('   After running pipeline with the fix, TIN and ITD scores should match Phase 1.5');
} else {
  console.log('✓ SCORES MATCH: No fix needed or fix already applied');
}

console.log('\n✓ Validation complete');
