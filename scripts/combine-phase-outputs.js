#!/usr/bin/env node
/**
 * Combine Phase Output JSON Files
 *
 * This script combines the output JSON files from phase1, phase2, phase3, and phase4
 * into a single master JSON file for comprehensive analysis.
 *
 * Usage: node scripts/combine-phase-outputs.js [company_profile_id]
 *
 * If no company_profile_id is provided, the script will auto-detect from existing files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const PHASES = ['phase1', 'phase2', 'phase3', 'phase4'];

/**
 * Find the most recent JSON file in a phase directory
 */
function findLatestPhaseFile(phaseDir, phase) {
  if (!fs.existsSync(phaseDir)) {
    console.warn(`Warning: Phase directory not found: ${phaseDir}`);
    return null;
  }

  const files = fs.readdirSync(phaseDir)
    .filter(f => f.endsWith('.json') && f.startsWith(phase))
    .sort()
    .reverse(); // Most recent first (assuming timestamp in filename)

  return files.length > 0 ? path.join(phaseDir, files[0]) : null;
}

/**
 * Read and parse a JSON file
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Extract key metadata from phase data
 */
function extractPhaseMetadata(phaseData, phase) {
  const metadata = {
    phase: phase,
    status: phaseData.status || 'unknown',
    company_profile_id: phaseData.company_profile_id || null
  };

  if (phaseData.metadata) {
    metadata.started_at = phaseData.metadata.started_at;
    metadata.completed_at = phaseData.metadata.completed_at;
    metadata.duration_ms = phaseData.metadata.total_duration_ms;
  }

  if (phaseData.execution_metadata) {
    metadata.batch_id = phaseData.execution_metadata.batch_id;
  }

  return metadata;
}

/**
 * Calculate aggregate metrics across all phases
 */
function calculateAggregateMetrics(phaseData) {
  const metrics = {
    total_analyses: 0,
    total_tokens: {
      input: 0,
      output: 0,
      thinking: 0
    },
    total_duration_ms: 0
  };

  // Count analyses and tokens from each phase
  for (const [phase, data] of Object.entries(phaseData)) {
    if (!data) continue;

    // Phase 1 structure
    if (data.tier1) {
      for (const analysis of Object.values(data.tier1)) {
        if (analysis.metadata) {
          metrics.total_analyses++;
          metrics.total_tokens.input += analysis.metadata.input_tokens || 0;
          metrics.total_tokens.output += analysis.metadata.output_tokens || 0;
          metrics.total_tokens.thinking += analysis.metadata.thinking_tokens || 0;
        }
      }
    }
    if (data.tier2) {
      for (const analysis of Object.values(data.tier2)) {
        if (analysis.metadata) {
          metrics.total_analyses++;
          metrics.total_tokens.input += analysis.metadata.input_tokens || 0;
          metrics.total_tokens.output += analysis.metadata.output_tokens || 0;
          metrics.total_tokens.thinking += analysis.metadata.thinking_tokens || 0;
        }
      }
    }

    // Phase 2 & 3 structure
    if (data.analyses) {
      for (const analysis of Object.values(data.analyses)) {
        if (analysis.metadata) {
          metrics.total_analyses++;
          metrics.total_tokens.input += analysis.metadata.input_tokens || 0;
          metrics.total_tokens.output += analysis.metadata.output_tokens || 0;
          metrics.total_tokens.thinking += analysis.metadata.thinking_tokens || 0;
        }
      }
    }

    // Duration
    if (data.metadata?.total_duration_ms) {
      metrics.total_duration_ms += data.metadata.total_duration_ms;
    }
    if (data.execution_metadata?.total_duration_ms) {
      metrics.total_duration_ms += data.execution_metadata.total_duration_ms;
    }
  }

  return metrics;
}

/**
 * Main function to combine phase outputs
 */
function combinePhaseOutputs(targetCompanyId = null) {
  console.log('🔄 Starting phase output combination...\n');

  const phaseFiles = {};
  const phaseData = {};
  let detectedCompanyId = targetCompanyId;

  // Step 1: Find all phase files
  console.log('📂 Locating phase files...');
  for (const phase of PHASES) {
    const phaseDir = path.join(OUTPUT_DIR, phase);
    const filePath = findLatestPhaseFile(phaseDir, phase);

    if (filePath) {
      phaseFiles[phase] = filePath;
      console.log(`  ✓ ${phase}: ${path.basename(filePath)}`);
    } else {
      console.log(`  ✗ ${phase}: No file found`);
    }
  }

  // Step 2: Read and validate phase data
  console.log('\n📖 Reading phase data...');
  for (const [phase, filePath] of Object.entries(phaseFiles)) {
    const data = readJsonFile(filePath);
    if (data) {
      phaseData[phase] = data;

      // Auto-detect company ID from first phase with data
      if (!detectedCompanyId && data.company_profile_id) {
        detectedCompanyId = data.company_profile_id;
      }

      console.log(`  ✓ ${phase}: Loaded successfully`);
    } else {
      console.log(`  ✗ ${phase}: Failed to load`);
    }
  }

  if (Object.keys(phaseData).length === 0) {
    console.error('\n❌ No phase data could be loaded. Exiting.');
    process.exit(1);
  }

  // Step 3: Build master JSON structure
  console.log('\n🔨 Building master JSON...');

  const masterJson = {
    meta: {
      generated_at: new Date().toISOString(),
      company_profile_id: detectedCompanyId,
      source_files: phaseFiles,
      phases_included: Object.keys(phaseData),
      version: '1.0.0'
    },
    aggregate_metrics: calculateAggregateMetrics(phaseData),
    phase_metadata: {},
    phases: {}
  };

  // Add phase data and metadata
  for (const [phase, data] of Object.entries(phaseData)) {
    masterJson.phase_metadata[phase] = extractPhaseMetadata(data, phase);
    masterJson.phases[phase] = data;
  }

  // Step 4: Add executive summary if available
  if (phaseData.phase3?.analyses?.executive) {
    masterJson.executive_summary = {
      source: 'phase3',
      content: phaseData.phase3.analyses.executive.content
    };
  }

  // Step 5: Add phase 4 summaries if available
  if (phaseData.phase4?.summaries) {
    masterJson.business_health_summary = phaseData.phase4.summaries;
  }

  // Step 6: Write master JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFileName = `master-analysis-${detectedCompanyId || 'unknown'}-${timestamp}.json`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  try {
    fs.writeFileSync(outputPath, JSON.stringify(masterJson, null, 2));
    console.log(`\n✅ Master JSON created successfully!`);
    console.log(`   📄 File: ${outputPath}`);
    console.log(`   📊 Phases included: ${Object.keys(phaseData).join(', ')}`);
    console.log(`   📈 Total analyses: ${masterJson.aggregate_metrics.total_analyses}`);
    console.log(`   🔤 Total tokens: ${masterJson.aggregate_metrics.total_tokens.input + masterJson.aggregate_metrics.total_tokens.output}`);
  } catch (error) {
    console.error(`\n❌ Error writing master JSON: ${error.message}`);
    process.exit(1);
  }

  return outputPath;
}

// Run if called directly
const companyId = process.argv[2] || null;
combinePhaseOutputs(companyId);

export { combinePhaseOutputs };
