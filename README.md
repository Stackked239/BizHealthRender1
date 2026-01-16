# BizHealth Report Pipeline

AI-powered business health assessment and report generation pipeline using Claude Opus 4 and the Anthropic Batch API.

## Overview

The BizHealth Report Pipeline is a comprehensive system that processes business questionnaire submissions through multiple AI analysis phases to generate detailed, personalized business health reports. The pipeline transforms raw questionnaire data into actionable insights across 12 business dimensions, ultimately producing 17 different report types tailored for various stakeholders (owners, managers, employees, executives).

## Tech Stack

### Core Technologies
- **Runtime**: Node.js with TypeScript (ES2022)
- **AI/ML**: Anthropic Claude API (claude-opus-4-20250514)
  - Batch API for cost-efficient parallel processing
  - Extended thinking for deep analysis
- **Data Validation**: Zod schemas for type-safe data structures
- **Database**: PostgreSQL (optional, via pg driver)
- **Logging**: Pino with pretty-printing support

### Visualization & Reporting
- **Chart Generation**: Chart.js with chartjs-node-canvas
- **Canvas Rendering**: node-canvas for server-side graphics
- **HTML Reports**: Custom template-based rendering
- **Markdown Processing**: marked library

### Development Tools
- **Build System**: TypeScript Compiler (tsc)
- **Test Runner**: Vitest with coverage (v8)
- **Code Quality**: ESLint, Prettier
- **Development**: tsx for TypeScript execution
- **DOM Testing**: jsdom for HTML validation

## Features

### Core Pipeline Phases

1. **Phase 0: Raw Capture & Normalization**
   - Webhook payload processing and validation
   - Data normalization and transformation
   - Company profile extraction
   - Zero AI API calls (pure data transformation)

2. **Phase 1: Cross-functional AI Analyses**
   - 10 parallel AI analyses via Anthropic Batch API
   - Tier 1: Strategic, Financial, Operational, Marketing, Sales
   - Tier 2: Customer Experience, HR/People, Tech Innovation, Risk, Compliance
   - Cost-optimized batch processing

3. **Phase 1.5: Category-Level Analysis**
   - Deep-dive analysis of all 12 business categories
   - Chapter-level summaries (4 chapters)
   - Overall health score calculation
   - Cross-category insights generation

4. **Phase 2: Deep-dive Cross-analysis**
   - Integration of Phase 1 results
   - Cross-functional pattern detection
   - Interdependency analysis

5. **Phase 3: Executive Synthesis**
   - High-level strategic synthesis
   - Overall health scoring (0-100)
   - Critical findings consolidation
   - Executive-level recommendations

6. **Phase 4: Final Compilation & IDM Generation**
   - Insights Data Model (IDM) consolidation
   - Integration of all previous phases
   - Quality validation and verification
   - Structured data preparation for reports

7. **Phase 4.5: BLUF Generation**
   - Bottom Line Up Front executive summaries
   - Report-specific key insights
   - Cached for performance optimization

8. **Phase 5: Report Generation**
   - 17 distinct HTML report types
   - Stakeholder-specific content (owners, managers, employees, executives)
   - Interactive visualizations and charts
   - PDF rendering support (optional)

### Business Framework

The pipeline analyzes businesses across a comprehensive 4-chapter, 12-dimension framework:

**Chapters:**
- **GE**: Growth Engine (Strategy, Sales, Marketing, Customer Experience)
- **PH**: Performance & Health (Operations, Financials)
- **PL**: People & Leadership (HR, Leadership & Governance)
- **RS**: Resilience & Safeguards (Tech/Innovation, IT/Data, Risk Management, Compliance)

**12 Dimensions:**
- STR (Strategy), SAL (Sales), MKT (Marketing), CXP (Customer Experience)
- OPS (Operations), FIN (Financials)
- HRS (Human Resources), LDG (Leadership & Governance)
- TIN (Technology & Innovation), ITD (IT & Data Security)
- RMS (Risk Management & Sustainability), CMP (Compliance)

### Report Types

17 different stakeholder-specific reports:
- Comprehensive Report (full analysis)
- Owner's Report (strategic overview)
- Executive Brief (quick insights)
- Quick Wins Report (immediate actions)
- Manager-specific Reports (5 functional areas)
- Employee Report (team-facing insights)
- Deep Dive Reports (4 chapter-specific analyses)
- Strategic Reports (Risk, Roadmap, Financial)

## Setup & Installation

### Prerequisites

- Node.js 20+ (for native ES modules and modern TypeScript)
- npm or yarn package manager
- Anthropic API key (for AI processing)
- PostgreSQL database (optional, for production persistence)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bizhealth-pipeline-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your configuration:
   ```env
   # Required
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here

   # Optional
   DATABASE_URL=postgresql://user:password@localhost:5432/bizhealth
   LOG_LEVEL=info
   OUTPUT_DIR=output
   RENDER_PDF=false
   ```

4. **Build the project** (optional, TypeScript runs via tsx)
   ```bash
   npm run build
   ```

5. **Run tests** (verify setup)
   ```bash
   npm test
   ```

## Usage

### Running the Full Pipeline

Execute the complete pipeline (Phase 0-5):

```bash
# Using default sample
npm run pipeline samples/webhook_001_startup_tech.json

# Or specify a webhook file
npx tsx src/run-pipeline.ts samples/webhook_019_farm_agricultural.json
```

### Phase-Specific Execution

Run individual phases or phase ranges:

```bash
# Only Phase 0 (no API calls)
npx tsx src/run-pipeline.ts samples/webhook_001_startup_tech.json --phase=0

# Phases 0-3 (analysis only, no reports)
npx tsx src/run-pipeline.ts samples/webhook_001_startup_tech.json --phase=0-3

# Only Phase 5 (requires prior Phase 0-4 outputs)
npx tsx src/run-pipeline.ts --phase=5 --output-dir=./output/[run-id]

# Phase 4-5 (IDM + Reports)
npx tsx src/run-pipeline.ts samples/webhook_001_startup_tech.json --phase=4-5

# Phase 1.5 only
npx tsx src/run-pipeline.ts --phase=1.5 --output-dir=./output/[run-id]
```

### Output Structure

Each pipeline run creates a unique run-isolated directory:

```
output/
├── [run-id-uuid]/
│   ├── phase0_output.json
│   ├── phase1_output.json
│   ├── phase1_5_output.json
│   ├── phase2_output.json
│   ├── phase3_output.json
│   ├── phase4_output.json
│   ├── idm_output.json
│   ├── phase4_5a_output.json (BLUF summaries)
│   ├── phase5_output.json
│   ├── pipeline_summary.json
│   └── reports/
│       ├── comprehensive.html
│       ├── owner.html
│       ├── executiveBrief.html
│       ├── quickWins.html
│       ├── risk.html
│       ├── roadmap.html
│       ├── financial.html
│       ├── managers*.html (5 types)
│       ├── employees.html
│       └── deepDive*.html (4 types)
└── index/
    └── [run-id].json (run metadata)
```

### Development Commands

```bash
# Development mode (watch and restart)
npm run dev

# Run full pipeline with validation
npm run pipeline:validate

# Generate and validate reports
npm run generate:validated

# Test specific phases
npm run test:phase1
npm run test:phase2
npm run test:phase3

# Quality assurance
npm run test:formatting
npm run test:css
npm run qa:full

# Visual validation
npm run test:visual
npm run phase5:validate

# Code quality
npm run lint
npm run format
```

## Directory Structure

```
bizhealth-pipeline-1/
├── src/
│   ├── api/                      # Anthropic API client & report endpoints
│   ├── config/                   # Configuration files & constants
│   ├── contracts/                # Data contracts & interfaces
│   ├── data/                     # Static data (benchmarks, mappings)
│   ├── data-transformation/      # Data transformers & normalizers
│   ├── database/                 # PostgreSQL queries & connection
│   ├── monitoring/               # Pipeline monitoring & metrics
│   ├── orchestration/            # Phase orchestrators & coordinators
│   │   ├── phase0-orchestrator.ts
│   │   ├── phase1-orchestrator.ts
│   │   ├── phase1-5-orchestrator.ts
│   │   ├── phase2-orchestrator.ts
│   │   ├── phase3-orchestrator.ts
│   │   ├── phase4-orchestrator.ts
│   │   ├── phase4-5a-orchestrator.ts
│   │   ├── phase5-orchestrator.ts
│   │   ├── idm-consolidator.ts
│   │   └── reports/              # Report builders & components
│   ├── qa/                       # Quality assurance utilities
│   ├── reports/                  # Report generation system
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Shared utilities & helpers
│   ├── index.ts                  # Main entry point
│   ├── run-pipeline.ts           # Pipeline CLI runner
│   └── phase0-index.ts           # Phase 0 entry point
├── samples/                      # Sample webhook payloads (25 businesses)
├── config/                       # External configuration files
│   ├── report-recipes/           # Report type configurations
│   ├── industry-benchmarks.json
│   └── question-mapping.json
├── tests/                        # Test files (Vitest)
├── scripts/                      # Utility scripts
├── output/                       # Generated outputs (gitignored)
├── package.json
├── tsconfig.json
└── .env                          # Environment configuration
```

## Contribution Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types without justification
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with TypeScript rules
- **Naming**:
  - Files: kebab-case (e.g., `phase1-orchestrator.ts`)
  - Classes: PascalCase (e.g., `Phase1Orchestrator`)
  - Functions: camelCase (e.g., `executePhase1`)
  - Constants: UPPER_SNAKE_CASE (e.g., `CHAPTER_NAMES`)

### Testing Requirements

- Unit tests for business logic
- Integration tests for phase execution
- Snapshot tests for report generation
- Visual validation tests for HTML output
- Minimum 80% code coverage for new features

### Git Workflow

1. Create feature branch from `main`
2. Make atomic commits with descriptive messages
3. Run tests and linting before commit
4. Submit PR with clear description and test results
5. Ensure CI passes before merging

### Pull Request Template

- Description of changes
- Related issue numbers
- Test coverage report
- Breaking changes (if any)
- Migration guide (if applicable)

## License

MIT

## Contact

For questions, issues, or contributions, please open an issue on the repository or contact the development team.

---

**Note**: This pipeline is designed for internal business analysis and report generation. Ensure ANTHROPIC_API_KEY is kept secure and never committed to version control.
