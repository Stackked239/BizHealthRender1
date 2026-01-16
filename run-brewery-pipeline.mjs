#!/usr/bin/env node

import { runPipeline, parseArgs } from './src/run-pipeline.ts';
import { config } from 'dotenv';

// Load environment variables
config();

// Override args to use brewery webhook
process.argv = [
  process.argv[0],
  process.argv[1],
  'samples/webhook_010_brewery_craft.json'
];

// Parse config
const pipelineConfig = parseArgs();

console.log('Starting BizHealth pipeline for Hopcraft Brewing Co...');
console.log('Webhook:', pipelineConfig.webhookPath);
console.log('Output:', pipelineConfig.outputDir);

// Run pipeline
await runPipeline(pipelineConfig);
