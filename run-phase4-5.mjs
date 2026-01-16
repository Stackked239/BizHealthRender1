#!/usr/bin/env node

import { runPipeline } from './src/run-pipeline.ts';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('Running Phase 4-5 only to fix IDM generation and generate reports...');

// Run pipeline for Phase 4-5 only
await runPipeline({
  webhookPath: './samples/webhook_010_brewery_craft.json',
  outputDir: './output',
  startPhase: 4,
  endPhase: 5,
  skipDatabase: true,
  generateReports: true,
  reportTypes: [],  // Will use defaults from Phase 5
  skipPhase15: false,
});
