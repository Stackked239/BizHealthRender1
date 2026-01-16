# BizHealth Pipeline - Local Environment Setup Guide

This guide provides step-by-step instructions for running the full BizHealth pipeline in a local environment using Anthropic API credentials provided via a `.env` file.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Python 3.9+** installed ([Download](https://www.python.org/))
- **npm** (comes with Node.js)
- **Anthropic API Key** with Batch API access ([Get one](https://console.anthropic.com/))

### Verify Prerequisites

```bash
# Check Node.js version (must be 18+)
node --version

# Check npm version
npm --version

# Check Python version (must be 3.9+)
python3 --version
```

---

## Step 1: Install Dependencies

Navigate to the workflow-export directory and install Node.js dependencies:

```bash
cd workflow-export

# Install all Node.js dependencies
npm install
```

---

## Step 2: Configure Environment (.env File)

### Create the .env File

```bash
# Copy the example environment file
cp .env.example .env
```

### Edit the .env File

Open `.env` in your preferred editor and add your Anthropic API key:

```bash
# Required - Add your Anthropic API key here
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# Optional - Model configuration (defaults shown)
DEFAULT_MODEL=claude-opus-4-20250514
DEFAULT_MAX_TOKENS=32000
DEFAULT_THINKING_TOKENS=16000
DEFAULT_TEMPERATURE=1.0

# Optional - Batch API configuration
BATCH_POLL_INTERVAL_MS=30000
BATCH_TIMEOUT_MS=3600000

# Optional - Logging
LOG_LEVEL=info
NODE_ENV=development
```

### Important Configuration Notes

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** | - | Your Anthropic API key (starts with `sk-ant-`) |
| `DEFAULT_MODEL` | No | `claude-opus-4-20250514` | Claude model to use |
| `DEFAULT_MAX_TOKENS` | No | `32000` | Max output tokens (32K max for Opus 4) |
| `DEFAULT_THINKING_TOKENS` | No | `16000` | Extended thinking budget |
| `BATCH_TIMEOUT_MS` | No | `3600000` | Batch API timeout (1 hour) |
| `LOG_LEVEL` | No | `info` | Logging verbosity (debug/info/warn/error) |

---

## Step 3: Verify Installation

Test that everything is set up correctly:

```bash
# Test TypeScript compilation
npm run build

# Verify the API key is loaded (Phase 0 doesn't need API)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=0
```

If Phase 0 runs successfully, your setup is correct.

---

## Step 4: Run the Full Pipeline

### Quick Start - Full Pipeline (All Phases)

```bash
# Run all phases (0-4) with the default sample webhook
npx tsx src/run-pipeline.ts
```

### Run with a Specific Webhook

```bash
# Use one of the 25 industry-specific sample webhooks
npx tsx src/run-pipeline.ts samples/webhook_001_startup_tech.json

# Or use the manufacturing example
npx tsx src/run-pipeline.ts samples/webhook_003_manufacturing_established.json
```

### Run Individual Phases

```bash
# Phase 0 only (data normalization - no API calls)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=0

# Phases 0-1 (normalization + 10 AI analyses)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=0-1

# Phases 2-4 (requires Phase 1 output exists)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=2-4

# Phase 4 only (IDM generation - requires all previous phases)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=4
```

### Custom Output Directory

```bash
# Specify a custom output directory
npx tsx src/run-pipeline.ts sample_webhook.json --output-dir=./my-output
```

---

## Expected Pipeline Execution

### Timeline

| Phase | Description | Duration | API Calls |
|-------|-------------|----------|-----------|
| Phase 0 | Data normalization | ~1-2 seconds | None |
| Phase 1 | 10 foundational AI analyses | 5-15 minutes | Batch API |
| Phase 2 | 5 cross-dimensional analyses | 3-5 minutes | Batch API |
| Phase 3 | 5 executive synthesis analyses | 2-4 minutes | Batch API |
| Phase 4 | IDM compilation | <1 second | None |

**Total Expected Time**: 15-25 minutes for full pipeline

### Expected Output

```
================================================================================
BIZHEALTH REPORT PIPELINE
================================================================================
Webhook:    ./sample_webhook.json
Output Dir: ./output
Phases:     0 → 4
================================================================================

────────────────────────────────────────────────────────────────
PHASE 0
────────────────────────────────────────────────────────────────
✓ Phase 0: SUCCESS
  Duration: 150ms
  Output: ./output/phase0_output.json
  assessment_run_id: uuid-xxxxx
  company_profile_id: uuid-xxxxx

────────────────────────────────────────────────────────────────
PHASE 1
────────────────────────────────────────────────────────────────
✓ Phase 1: SUCCESS
  Duration: 750000ms
  Output: ./output/phase1_output.json
  successful_analyses: 10
  failed_analyses: 0

────────────────────────────────────────────────────────────────
PHASE 2
────────────────────────────────────────────────────────────────
✓ Phase 2: SUCCESS
  Duration: 225000ms
  Output: ./output/phase2_output.json
  successful_analyses: 5

────────────────────────────────────────────────────────────────
PHASE 3
────────────────────────────────────────────────────────────────
✓ Phase 3: SUCCESS
  Duration: 135000ms
  Output: ./output/phase3_output.json
  overall_health_score: 3.8

────────────────────────────────────────────────────────────────
PHASE 4
────────────────────────────────────────────────────────────────
✓ Phase 4: SUCCESS
  Duration: 200ms
  Output: ./output/phase4_output.json
  health_score: 3.8

================================================================================
PIPELINE SUMMARY
================================================================================
Total Duration: 1110350ms (18m 30s)
Phases Run: 5
Successful: 5
Failed: 0
Output Directory: /full/path/to/output
================================================================================
```

---

## Output Files

After a successful full pipeline run, you'll find these files in the output directory:

```
output/
├── phase0_output.json              # Normalized input data
├── phase1_output.json              # 10 AI analyses
├── phase2_output.json              # 5 cross-dimensional analyses
├── phase3_output.json              # 5 executive syntheses
├── phase4_output.json              # Final compilation reference
├── pipeline_summary.json           # Execution summary
│
├── phase0/
│   ├── raw-assessment-*.json       # Original data snapshot
│   ├── company-profile-*.json      # Normalized company info
│   └── questionnaire-responses-*.json
│
├── phase1/
│   └── phase1-results-*.json
│
├── phase2/
│   └── phase2-results-*.json
│
├── phase3/
│   └── phase3-results-*.json
│
└── phase4/
    ├── idm-*.json                  # CANONICAL Insights Data Model
    ├── master-analysis-*.json      # Complete consolidated analysis
    └── phase4-summaries-*.json     # Executive summaries
```

### Key Output Files

1. **`phase4/idm-*.json`** - The Canonical Insights Data Model (IDM)
   - Single source of truth for report generation
   - Contains all scores, findings, recommendations, risks
   - ~51 KB

2. **`phase4/master-analysis-*.json`** - Complete analysis
   - Full text of all Phase 1-3 analyses
   - ~208 KB

3. **`pipeline_summary.json`** - Execution metadata
   - Duration, success/failure status for each phase
   - Useful for debugging and auditing

---

## Available Sample Webhooks

The `samples/` directory contains 25 industry-specific examples:

| File | Industry |
|------|----------|
| `webhook_001_startup_tech.json` | Tech Startup |
| `webhook_002_restaurant_chain.json` | Restaurant Chain |
| `webhook_003_manufacturing_established.json` | Manufacturing |
| `webhook_004_healthcare_clinic.json` | Healthcare Clinic |
| `webhook_005_retail_boutique.json` | Retail Boutique |
| `webhook_006_construction_firm.json` | Construction |
| `webhook_007_consulting_firm.json` | Consulting |
| `webhook_008_ecommerce_fashion.json` | E-commerce Fashion |
| `webhook_009_accounting_firm.json` | Accounting |
| `webhook_010_brewery_craft.json` | Craft Brewery |
| `webhook_011_fitness_studio.json` | Fitness Studio |
| `webhook_012_software_saas.json` | Software/SaaS |
| `webhook_013_law_firm.json` | Law Firm |
| `webhook_014_auto_repair.json` | Auto Repair |
| `webhook_015_real_estate_agency.json` | Real Estate |
| `webhook_016_logistics_company.json` | Logistics |
| `webhook_017_dental_practice.json` | Dental Practice |
| `webhook_018_marketing_agency.json` | Marketing Agency |
| `webhook_019_farm_agricultural.json` | Agricultural |
| `webhook_020_insurance_agency.json` | Insurance |
| `webhook_021_graphic_design_studio.json` | Graphic Design |
| `webhook_022_veterinary_clinic.json` | Veterinary Clinic |
| `webhook_023_coffee_shop_chain.json` | Coffee Shop Chain |
| `webhook_024_plumbing_company.json` | Plumbing |
| `webhook_025_tutoring_center.json` | Tutoring Center |

---

## Troubleshooting

### Common Issues

#### 1. "ANTHROPIC_API_KEY environment variable is required"

**Cause**: Missing or invalid API key in `.env`

**Solution**:
```bash
# Verify .env exists and has the key
cat .env | grep ANTHROPIC_API_KEY

# Ensure the key starts with sk-ant-
```

#### 2. "Cannot find module 'dotenv'"

**Cause**: Dependencies not installed

**Solution**:
```bash
npm install
```

#### 3. Phase 1/2/3 takes longer than expected

**Expected behavior**: Batch API processing takes 5-15 minutes per AI phase. The pipeline polls every 30 seconds and displays progress.

**Increase timeout if needed**:
```bash
# In .env
BATCH_TIMEOUT_MS=7200000  # 2 hours
```

#### 4. "max_tokens: 64000 > 32000"

**Cause**: Token limit exceeds Claude Opus 4 maximum

**Solution**: Verify `.env` has:
```bash
DEFAULT_MAX_TOKENS=32000
DEFAULT_THINKING_TOKENS=16000
```

#### 5. Phase 2/3/4 fails with "output not found"

**Cause**: Previous phase didn't complete successfully

**Solution**: Re-run from the failing phase:
```bash
# Check which outputs exist
ls -la output/phase*.json

# Re-run missing phases
npx tsx src/run-pipeline.ts sample_webhook.json --phase=1-4
```

### Debug Mode

Enable verbose logging:

```bash
# In .env
LOG_LEVEL=debug

# Run with output capture
npx tsx src/run-pipeline.ts 2>&1 | tee pipeline.log
```

### Verify Pipeline Integrity

```bash
# Check all output files exist
ls -lh output/phase*.json

# Check IDM was generated
ls -lh output/phase4/idm-*.json

# Validate JSON structure
cat output/phase4/idm-*.json | python3 -m json.tool > /dev/null && echo "✓ Valid JSON"
```

---

## Cost Estimates

Running the full pipeline with Claude Opus 4:

| Model | Estimated Cost per Run |
|-------|------------------------|
| Claude Opus 4 | $15-30 |
| Claude Sonnet 4 | $3-6 |
| Claude Haiku 4 | $0.50-1 |

*Costs vary based on input data size and response length.*

---

## Quick Reference Commands

```bash
# Full pipeline (all phases)
npx tsx src/run-pipeline.ts

# With specific webhook
npx tsx src/run-pipeline.ts samples/webhook_001_startup_tech.json

# Phase 0 only (no API needed)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=0

# Skip to Phase 4 (assumes 1-3 completed)
npx tsx src/run-pipeline.ts sample_webhook.json --phase=4

# Custom output directory
npx tsx src/run-pipeline.ts sample_webhook.json --output-dir=./custom-output

# Debug mode
LOG_LEVEL=debug npx tsx src/run-pipeline.ts
```

---

## Next Steps After Pipeline Completion

1. **Review the IDM**: Check `output/phase4/idm-*.json` for the canonical data model
2. **Generate Reports**: Use the IDM to generate HTML/PDF reports
3. **Spot-Check Quality**: Verify scores and recommendations make sense
4. **Iterate**: Run on different sample webhooks to test various industries

---

## Support

For issues with:
- **Pipeline code**: Check the main README.md
- **Anthropic API**: Visit [console.anthropic.com](https://console.anthropic.com/)
- **Claude Code**: Report issues at [github.com/anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)
