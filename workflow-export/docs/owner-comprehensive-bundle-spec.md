# Owner-Comprehensive Report Bundle Specification

> **Version:** 1.0.0
> **Last Updated:** December 2024
> **Status:** Implementation Specification

## Overview

BizHealth.ai generates two primary strategic reports that work as a coordinated bundle:

| Report | Purpose | Audience | Voice | Target Size |
|--------|---------|----------|-------|-------------|
| **Owner's Report** | Executive Decision Guide | Business Owner | "You/Your" | ~100-140 KB |
| **Comprehensive Report** | Full Encyclopedia | All Stakeholders | "The company" | ~200-250 KB |

## Report Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                     REPORT BUNDLE                               │
├─────────────────────────┬───────────────────────────────────────┤
│   OWNER'S REPORT        │   COMPREHENSIVE REPORT                │
│   (Decision Guide)      │   (Full Encyclopedia)                 │
├─────────────────────────┼───────────────────────────────────────┤
│ • 50-60% size           │ • 100% size (base)                    │
│ • "You/Your" voice      │ • "The company" voice                 │
│ • Aggregated data       │ • Detailed tables & charts            │
│ • Max 7 priorities      │ • All priorities with evidence        │
│ • Investment ranges     │ • Full financial projections          │
│ • Cross-references →    │ ← Section anchors                     │
└─────────────────────────┴───────────────────────────────────────┘
```

## Key Design Principles

### 1. Voice Transformation

**Owner's Report** uses second-person owner-focused language:
- "Your business shows strong growth potential"
- "You should prioritize these initiatives"
- "Your team's performance exceeds benchmarks"

**Comprehensive Report** uses third-person analytical language:
- "The company demonstrates strong growth potential"
- "These initiatives should be prioritized"
- "The team's performance exceeds benchmarks"

### 2. Content Depth Constraints

The Owner's Report is constrained to remain executive-focused:

| Element | Owner's | Comprehensive |
|---------|---------|---------------|
| Strategic Priorities | Max 7 | All (10+) |
| Quick Wins | Max 5 | All identified |
| Risks | Top 5 | Full inventory |
| Financial Data | Ranges/Bands | Detailed tables |
| Roadmap | 4 Phases | Full initiative grid |

### 3. Cross-Reference System

Owner's Report includes callouts pointing to Comprehensive sections:

```html
<div class="comprehensive-reference">
  <span class="ref-icon">📖</span>
  <span class="ref-text">
    For complete analysis, see <strong>Comprehensive Report</strong> →
    <em>Chapter 1: Growth Engine Deep Dive</em>
  </span>
</div>
```

## Section Mapping

| Owner's Section | Comprehensive Section |
|-----------------|----------------------|
| Business Health Overview | Executive Summary |
| Growth & Revenue Strategy | Chapter 1: Growth Engine Deep Dive |
| Operations & Financial Health | Chapter 2: Performance & Health Deep Dive |
| People & Leadership | Chapter 3: People & Leadership Deep Dive |
| Risk & Compliance | Chapter 4: Resilience & Safeguards Deep Dive |
| Strategic Priorities | Strategic Recommendations |
| Risk Overview | Comprehensive Risk Assessment |
| Execution Timeline | 18-Month Implementation Roadmap |
| Investment & ROI | Financial Impact Analysis |

## Validation Commands

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
└── package.json
```

## Adding New Cross-References

1. Add entry to `SECTION_MAPPINGS` in `config/section-mapping.ts`
2. Add anchor ID to Comprehensive template
3. Use `renderComprehensiveReference()` in Owner's template
4. Run `npm run validate:all`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing reference mapping" warning | Add missing ref to `SECTION_MAPPINGS` |
| "TITLE_NOT_FOUND" error | Section title doesn't match - check for typos |
| "Duplicate IDs" in tests | Each mapping must have unique `id` and `anchor` |

## Success Criteria

### Automated Checks
- `npm run test:mappings` passes
- `npm run validate:reports` exits with code 0
- All SECTION_MAPPINGS titles found in Comprehensive HTML
- No duplicate IDs or anchors

### Structural Checks
- Owner's Report is 50-60% size of Comprehensive
- Cross-references correctly point to Comprehensive sections
- Reports work as coherent, cross-referenced bundle
