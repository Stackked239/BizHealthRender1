# IDM Null Value Inventory

**Generated:** 2025-12-09
**Purpose:** Comprehensive catalog of IDM fields and their null handling requirements

---

## Critical Fields (Must NEVER Be Null)

These fields are required for core report generation and visualizations. If any are null, reports will fail to render.

| Field Path | Type | Current Handling | Fix Needed | Impact if Null |
|------------|------|------------------|------------|----------------|
| `scores_summary.overall_health_score` | number | ✅ Calculated in `buildScoresSummary()` | No | Gauge chart fails |
| `scores_summary.descriptor` | string | ✅ Set by `getHealthDescriptor()` | No | Health status missing |
| `scores_summary.trajectory` | string | ✅ Set by `determineTrajectory()` | No | Trajectory indicator fails |
| `chapters` | array | ✅ Built in `buildChapters()` | No | All chapter sections fail |
| `chapters[].chapter_code` | ChapterCode | ✅ From ChapterCodeSchema | No | Chapter identification fails |
| `chapters[].name` | string | ✅ From CHAPTER_NAMES | No | Chapter headers missing |
| `chapters[].score_overall` | number | ✅ Calculated | No | Chapter gauges fail |
| `chapters[].score_band` | ScoreBand | ✅ From `getScoreBand()` | No | Color coding fails |
| `dimensions` | array | ✅ Built in `buildDimensions()` | No | All dimension sections fail |
| `dimensions[].dimension_code` | DimensionCode | ✅ From DimensionCodeSchema | No | Dimension identification fails |
| `dimensions[].name` | string | ✅ From DIMENSION_METADATA | No | Dimension headers missing |
| `dimensions[].score_overall` | number | ✅ Calculated | No | Dimension gauges fail |
| `dimensions[].sub_indicators` | array | ✅ Built in `buildSubIndicators()` | No | Sub-indicator sections fail |
| `meta.assessment_run_id` | string | ✅ Generated UUID or passed in | No | Report identification fails |
| `meta.company_profile_id` | string | ✅ From company profile | No | Report personalization fails |
| `meta.created_at` | string | ✅ Current timestamp | No | Report date missing |

---

## High Priority Fields (Should Have Fallbacks)

These fields are used in report content. Null values cause degraded output but not crashes.

| Field Path | Type | Current Fallback | Recommended Fallback | Used In |
|------------|------|------------------|----------------------|---------|
| `chapters[].benchmark` | Benchmark? | ❌ None (optional) | Empty object or skip section | Benchmark callouts |
| `chapters[].benchmark.peer_percentile` | number | ❌ None | 50 (median) | Percentile badges |
| `chapters[].benchmark.industry_average` | number | ❌ None | Same as company score | Comparison text |
| `chapters[].benchmark.benchmark_narrative` | string | ❌ None | Generic comparison text | Narrative sections |
| `dimensions[].benchmark` | Benchmark? | ❌ None (optional) | Empty object or skip | Dimension benchmarks |
| `dimensions[].sub_indicators[].score` | number | ✅ Returns 0 if no questions | 0 | Sub-indicator bars |
| `dimensions[].sub_indicators[].contributing_question_ids` | string[] | ✅ Empty array | [] | Evidence citations |
| `findings[].narrative` | string | ❌ Generated but could fail | "Finding requires investigation" | Finding cards |
| `findings[].evidence_refs` | EvidenceRefs? | ❌ None (optional) | {} | Evidence links |
| `recommendations[].action_steps` | string[] | ✅ Default 5 steps | Generic action steps | Action plans |
| `recommendations[].expected_outcomes` | string | ✅ Generated | "Improvement expected" | Outcome cards |
| `recommendations[].required_capabilities` | string[]? | ❌ None (optional) | [] | Capability tags |
| `risks[].mitigation` | string | ❌ **NOT PRESENT** | "To be determined" | Risk mitigation cards |
| `risks[].linked_recommendation_ids` | string[]? | ❌ None (optional) | [] | Risk-rec links |
| `quick_wins[].recommendation_id` | string | ✅ Present | N/A (required) | Quick win lookup |

---

## Optional Fields (Can Be Null/Undefined)

These fields are genuinely optional. Downstream code should handle their absence gracefully.

| Field Path | Type | Downstream Handling Required | Status |
|------------|------|------------------------------|--------|
| `scores_summary.overall_benchmark` | OverallBenchmark? | Yes - hide benchmark section | ⚠️ Needs null check |
| `scores_summary.overall_benchmark.percentile_rank` | number | Yes - hide percentile badge | ⚠️ Needs null check |
| `chapters[].previous_score_overall` | number? | Yes - skip trend indicator | ✅ Already optional |
| `dimensions[].previous_score_overall` | number? | Yes - skip trend indicator | ✅ Already optional |
| `dimensions[].sub_indicators[].score_band` | ScoreBand? | Yes - calculate from score | ✅ Already optional |
| `questions[].normalized_score` | number? | Yes - skip in calculations | ✅ Handled |
| `findings[].sub_indicator_id` | string? | Yes - dimension-level only | ✅ Already optional |
| `recommendations[].roi_estimate` | number? | Yes - show "TBD" | ⚠️ Not in schema |
| `roadmap.phases[].milestones` | string[]? | Yes - skip milestones | Not in schema |
| `visualizations.totalCount` | number | Info only | ✅ Calculated |

---

## Schema Permissiveness Issues

### Fields Accepting Both String and Number

These create type uncertainty in downstream code:

| Field | Current Schema | Recommendation |
|-------|---------------|----------------|
| `Finding.severity` | `z.union([z.string(), z.number()])` | Normalize to string: 'Critical' \| 'High' \| 'Medium' \| 'Low' |
| `Finding.confidence_level` | `z.union([z.string(), z.number()])` | Normalize to string: 'High' \| 'Medium' \| 'Low' |
| `Risk.severity` | `z.union([z.string(), z.number()])` | Normalize to string |
| `Risk.likelihood` | `z.union([z.string(), z.number()])` | Normalize to string |

### Arrays That Should Default to Empty

| Field | Current | Recommendation |
|-------|---------|----------------|
| `Recommendation.required_capabilities` | `.optional()` | `.default([])` |
| `Recommendation.linked_finding_ids` | Required array | OK - always populated |
| `Risk.linked_recommendation_ids` | `.optional()` | `.default([])` |
| `EvidenceRefs.question_ids` | `.optional()` | `.default([])` |
| `EvidenceRefs.metrics` | `.optional()` | `.default([])` |

---

## Missing Fields in Current Schema

Fields expected by report builders but not defined in IDM schema:

| Expected Field | Used By | Recommendation |
|----------------|---------|----------------|
| `Risk.mitigation` | Risk cards, risk matrix | Add `mitigation: z.string().default('Strategy to be determined')` |
| `Recommendation.estimated_investment` | Financial projections | Derive from effort_score |
| `Recommendation.estimated_roi` | ROI displays | Calculate from impact/effort |
| `QuickWin.title` | Quick win cards | Lookup from recommendation.theme |
| `QuickWin.description` | Quick win cards | Lookup from recommendation.expected_outcomes |
| `QuickWin.investment_estimate` | Quick win ROI | Derive from recommendation effort |

---

## Report Builder Null Handling Gaps

### owners-report.builder.ts

| Line | Issue | Fix |
|------|-------|-----|
| 464 | `QUICK_REFS.executiveSummary()` called without null check | Add `typeof QUICK_REFS?.executiveSummary === 'function' ? ...` |
| 482 | `QUICK_REFS.scorecard()` called without null check | Add defensive check |
| Various | Benchmark data accessed without null checks | Add `chapter.benchmark?.` |

### recipe-report.builder.ts

| Line | Issue | Fix |
|------|-------|-----|
| Multiple | `.replace()` called on potentially non-string values | Use `safeReplace()` from utils |
| Multiple | Array `.map()` without null filtering | Filter null/undefined first |

### comprehensive-report.builder.ts

| Line | Issue | Fix |
|------|-------|-----|
| Various | Narrative extraction may return null | Add fallback strings |
| Various | Benchmark sections render even when data missing | Add conditional rendering |

---

## Validation Script Coverage

The `phase4-validation.ts` script covers:

| Check | Status |
|-------|--------|
| Overall health score valid number 0-100 | ✅ |
| All 4 chapters present | ✅ |
| All 12 dimensions present | ✅ |
| Chapter scores valid | ✅ |
| Dimension scores valid | ✅ |
| No "undefined" strings | ✅ |
| No "[object Object]" strings | ✅ |
| No ghost arrays | ✅ |
| Findings have required fields | ✅ |
| Recommendations have required fields | ✅ |
| Quick wins reference valid recommendations | ✅ |
| Gauge chart data ready | ✅ |
| Radar chart data ready | ✅ |
| Risk matrix data ready | ✅ |
| Zod schema validation | ✅ |

---

## Recommended Fix Priority

### P0 - Immediate (Before Next Pipeline Run)

1. **Add `mitigation` field to Risk** in `extractRisks()` function
2. **Add defensive checks** for `QUICK_REFS` calls in owners-report.builder.ts
3. **Add "scorecard" section mapping** to section-mapping.ts

### P1 - This Sprint

1. **Normalize severity/likelihood** to string-only in Risk schema
2. **Add benchmark fallback UI** that gracefully hides when data missing
3. **Enrich quick wins** with full recommendation data during consolidation

### P2 - Next Sprint

1. **Add missing fields** to schema (mitigation, estimated_investment, etc.)
2. **Replace optional arrays** with `.default([])` in Zod schemas
3. **Add comprehensive test suite** for null edge cases

---

## Quick Reference: Safe Extraction Functions

Use these from `src/qa/phase4-safety-patches.ts`:

```typescript
import {
  extractNumericValueSafe,
  extractStringSafe,
  extractArraySafe,
  calculateWeightedScoreSafe,
  getScoreBandSafe,
  validateSeveritySafe,
  validateProbabilitySafe,
  isValidDimensionCode,
  consolidateRecommendationsSafe,
  compileRisksSafe,
  enrichQuickWinSafe,
} from '../qa/phase4-safety-patches.js';

// Example usage:
const score = extractNumericValueSafe(rawData.score, 0);
const narrative = extractStringSafe(finding.narrative, 'No description available');
const items = extractArraySafe(rawData.items, isNonEmptyString, []);
```

---

*End of Null Inventory*
