# Phase 4.5: BLUF Generation System

## Overview

Phase 4.5 enhances BizHealth reports with AI-generated Bottom Line Up Front (BLUF) executive summaries. Split into two sub-phases:

- **Phase 4.5A:** BLUF Orchestration & Generation (AI-powered content creation)
- **Phase 4.5B:** BLUF Rendering & Injection (report integration)

## Pipeline Position
```
Phase 4 → Phase 4.5A → Phase 4.5B → Phase 5
(IDM)    (Gen BLUFs)  (Render)     (Reports)
```

## BLUF Types

### Executive BLUFs (2-4 paragraphs, 150-300 words)
- Comprehensive Report
- Owner's Report
- Executive Brief (1-2 paragraphs)

### Section BLUFs (1-2 paragraphs, 50-150 words)
- 4 Chapters (GE, PH, PL, RS)
- 12 Dimensions (STR, SAL, MKT, CXP, OPS, FIN, HRS, LDG, TIN, ITD, RMS, CMP)
- 5 Focused Reports (quick wins, risk, roadmap, financial, employees)
- 5 Manager Reports (financials, operations, sales/marketing, strategy, IT/tech)

**Total:** 29 BLUFs generated per assessment

## Execution

### Run Full Pipeline with Phase 4.5
```bash
npx tsx src/run-pipeline.ts samples/webhook_013_law_firm.json
```

### Skip Phase 4.5
```bash
npx tsx src/run-pipeline.ts samples/webhook_013_law_firm.json --skip-phase45
```

### Run Only Phase 4.5 (requires existing Phase 4 IDM)
```bash
npx tsx src/run-pipeline.ts --phase=4.5
```

## Output Structure
```
output/{runId}/
├── phase4_5a_output.json    # BLUF library (29 BLUFs)
└── reports/{runId}/
    ├── comprehensive.html   # Includes comprehensive BLUF + chapter BLUFs
    ├── owner.html           # Includes owner BLUF
    └── [other reports...]
```

## Quality Standards

### Validation Checks
- ✅ Paragraph count (2-4 for executive, 1-2 for section)
- ✅ Word count (150-300 for executive, 50-150 for section)
- ✅ Quantitative evidence (numbers, scores, percentages)
- ✅ No placeholder text (lorem ipsum, TBD, TODO)
- ✅ Company-specific content (company name referenced)
- ✅ Quality score ≥70/100

### Quality Scoring (0-100)
- Paragraph structure: -30 for wrong count
- Word count: -20 for out of range
- Evidence density: -25 for lack of quantitative data
- Placeholder content: -40 penalty
- Generic content: -15 penalty
- Readability: +5 bonus for Flesch Reading Ease >70

## Configuration

**Environment Variables:**
```bash
PHASE_4_5_MODEL=claude-sonnet-4-20250514
PHASE_4_5_MAX_TOKENS=4000
PHASE_4_5_TEMPERATURE=0.3
PHASE_4_5_BATCH_SIZE=10
PHASE_4_5_CONCURRENCY=5
PHASE_4_5_CACHE_ENABLED=true
PHASE_4_5_CACHE_TTL=24
PHASE_4_5_QUALITY_THRESHOLD=70
```

## Troubleshooting

### Issue: Phase 4.5 fails, reports don't generate
**Solution:** Phase 5 has graceful degradation. Reports generate without BLUFs if Phase 4.5 fails.

### Issue: BLUFs too generic
**Solution:** Check quality score. If <70, review prompts and ensure IDM has sufficient company-specific data.

### Issue: Slow BLUF generation
**Solution:** Enable caching (`PHASE_4_5_CACHE_ENABLED=true`). First run slow, subsequent runs use cache.

### Issue: Low quality scores
**Solution:**
1. Check IDM data completeness
2. Review prompt templates for specificity
3. Increase temperature slightly if too repetitive
4. Review validation warnings for specific issues

## Monitoring

**Key Metrics:**
- `meta.total_blufs_generated`: Should be 29
- `meta.validation_passed`: Should be `true`
- `meta.average_quality_score`: Should be ≥70
- `meta.cache_hits` / `meta.cache_misses`: Track cache efficiency

**Performance Targets:**
- First run (no cache): ~2-3 minutes for 29 BLUFs
- Cached run: ~10-15 seconds
- Quality score average: ≥75

## Rollback Procedure

If Phase 4.5 quality is unsatisfactory:

1. **Disable Phase 4.5:**
```bash
   npx tsx src/run-pipeline.ts --skip-phase45
```

2. **Reports generate normally without BLUFs** (graceful degradation)

3. **Fix prompts offline** in `phase4-5-prompts.ts`

4. **Test with single company:**
```bash
   npx tsx src/run-pipeline.ts --phase=4.5 samples/webhook_001.json
```

5. **Re-enable when quality acceptable**
