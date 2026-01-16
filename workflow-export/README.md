# BizHealth Workflow Export

Configuration, utilities, and validation tools for the BizHealth Owner and Comprehensive Report Bundle.

## Overview

This module provides:
- **Section Mapping Configuration** - Maps Owner's Report sections to Comprehensive Report sections
- **Content Constraints** - Enforces brevity in Owner's Report
- **Voice Transformation** - Converts analytical to owner-focused language
- **Cross-Reference Components** - Generates callouts linking reports
- **Validation Tools** - Ensures mapping integrity

## Quick Start

```bash
# Install dependencies
npm install

# Run unit tests
npm run test:mappings

# Validate against generated reports
npm run validate:reports

# Full validation suite
npm run validate:all
```

## Owner & Comprehensive Report Bundles

BizHealth.ai generates two primary strategic reports that work as a coordinated bundle:

### Report Architecture

| Report | Purpose | Audience | Voice | Target Size |
|--------|---------|----------|-------|-------------|
| **Owner's Report** | Executive Decision Guide | Business Owner | "You/Your" | ~100-140 KB |
| **Comprehensive Report** | Full Encyclopedia | All Stakeholders | "The company" | ~200-250 KB |

### Key Design Principles

- **Owner's Report** uses "you/your" language and shows aggregated financial ranges
- **Comprehensive Report** contains full analysis, tables, and evidence
- **Cross-references** link Owner's sections to detailed Comprehensive sections
- **"Where to Go for Detail"** section provides navigation guide

### Cross-Reference Mapping

Section mappings are defined in `src/orchestration/reports/config/section-mapping.ts`.

### Validation Commands

```bash
# Validate section mappings against HTML
npm run validate:reports

# Run unit tests for mapping configuration
npm run test:mappings

# Full validation (tests + HTML check)
npm run validate:all

# Debug mode - see all reference resolutions
BIZHEALTH_DEBUG_REFS=true npx tsx src/run-pipeline.ts

# Complete test suite
./scripts/test-reports.sh
```

### Adding New Cross-References

1. Add entry to `SECTION_MAPPINGS` in `config/section-mapping.ts`
2. Add anchor ID to Comprehensive template
3. Use `renderComprehensiveReference()` in Owner's template
4. Run `npm run validate:all`

### Troubleshooting

- **"Missing reference mapping" warning**: Add missing ref to `SECTION_MAPPINGS`
- **"TITLE_NOT_FOUND" error**: Section title doesn't match - check for typos
- **"Duplicate IDs" in tests**: Each mapping must have unique `id` and `anchor`

## File Structure

```
workflow-export/
├── docs/
│   └── owner-comprehensive-bundle-spec.md
├── src/orchestration/reports/
│   ├── config/
│   │   ├── section-mapping.ts
│   │   ├── owner-report-constraints.ts
│   │   └── __tests__/
│   │       └── section-mapping.test.ts
│   ├── components/
│   │   └── comprehensive-reference.component.ts
│   ├── utils/
│   │   ├── reference-logger.ts
│   │   └── voice-transformer.ts
│   ├── validation/
│   │   ├── section-mapping-validator.ts
│   │   └── validate-reports.ts
│   └── styles/
│       └── owner-report-enhancements.css
├── scripts/
│   └── test-reports.sh
├── jest.config.js
├── package.json
└── README.md
```

## License

MIT
