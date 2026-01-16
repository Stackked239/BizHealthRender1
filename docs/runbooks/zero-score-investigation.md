# Zero-Score Anomaly Investigation Runbook

## Problem Statement

A test or quality gate detects a sub-indicator with score = 0 when:
- Raw response value > 0 (e.g., technology_investment = $85,000)
- Phase 1.5 normalized score > 50 (e.g., 85)
- Phase 4 IDM score = 0 (ERROR)

This indicates a data transformation bug in the pipeline.

## Symptom Recognition

### Primary Indicator

```json
{
  "subIndicatorId": "TIN_001",
  "subIndicatorName": "Technology Investment",
  "rawResponseValue": 85000,
  "phase15Score": 85,
  "idmScore": 0,
  "severity": "CRITICAL"
}
```

### Where Found

- Quality gate anomaly detection: `output/system-audit/quality/anomaly-detection.json`
- Test failure: `TC-103: Phase 4 shows TIN_001 != 0 (bug case)`

## Investigation Steps

### Step 1: Verify Raw Data

```bash
# Check Phase 0 raw response
grep -r "technology_investment" output/phase0_output.json
# Should show: raw_response: 85000
```

### Step 2: Verify Phase 1.5 Normalization

```bash
# Check Phase 1.5 analysis
grep -A5 "TIN_001" output/phase1_5_output.json
# Should show: normalizedScore: 85
```

### Step 3: Check Phase 4 Consolidation

```bash
# Check Phase 4 IDM
grep -A5 "TIN_001" output/phase4_output.json
# Should show: score: 85 (NOT 0)
```

### Step 4: Locate Missing Handler

```bash
# Search for handler in idm-consolidator
grep -n "normalizeCurrencyResponse" src/orchestration/
# If NOT found, this is the bug
```

## Common Causes

### Cause 1: Missing Handler Function

- **Location**: src/orchestration/idm-consolidator.ts
- **Missing**: `normalizeCurrencyResponse(value, revenue)`
- **Fix**: Add handler to convert raw response to normalized 0-100 score

### Cause 2: Handler Not Called

- **Location**: idm-consolidator.ts `consolidateDimension()` or `consolidateSubIndicators()`
- **Problem**: Handler exists but not invoked
- **Fix**: Add handler call in consolidation logic

### Cause 3: Data Not Passed Between Phases

- **Location**: Phase transition code
- **Problem**: Raw value not propagated from Phase 0 to Phase 1.5 to Phase 4
- **Fix**: Ensure data is properly passed through each phase

## Fix Implementation

### Add Missing Handler

File: `src/orchestration/idm-consolidator.ts`

```typescript
// Import at top
import { normalizeCurrencyResponse } from '../utils/normalization-handlers.js';

// In consolidateSubIndicators(), add:
if (subIndicator.contributing_question_ids) {
  const phase0Data = phase0Map.get(subIndicator.contributing_question_ids);
  if (phase0Data?.response_type === 'currency') {
    const normalized = normalizeCurrencyResponse(
      phase0Data.raw_response,
      companyProfile.annual_revenue
    );
    subIndicator.score = normalized;
  }
}
```

### Add Unit Test for Regression Prevention

File: `src/__tests__/unit/normalization-handlers.test.ts`

```typescript
it('TC-001: should normalize $85,000 to 80-90 for $2.8M revenue brewery', () => {
  const result = normalizeCurrencyResponse(85000, 2800000);
  expect(result).toBeGreaterThanOrEqual(80);
  expect(result).toBeLessThanOrEqual(90);
});
```

## Verification

### Test the Fix

```bash
# Re-run the specific test
npx vitest run src/__tests__/unit/normalization-handlers.test.ts --reporter=verbose

# Run quality gates
npx tsx src/scripts/quality-gates.ts

# Check anomaly results
cat output/system-audit/quality/anomaly-detection.json
# Should show: "anomaliesDetected": 0 (for critical)
```

### Run Full Pipeline Test

```bash
# Run pipeline with brewery webhook
npm run pipeline -- fixtures/webhooks/brewery-golden.json

# Verify TIN_001 score
grep -A5 "TIN_001" output/phase4_output.json
# Should show score: 80-90
```

## Prevention

1. Add unit test for any new response type (TC-001 model)
2. Add integration test for phase transition (TC-100 model)
3. Run quality gates before commit: `npx tsx src/scripts/quality-gates.ts`
4. Monitor anomaly detection regularly
5. Review PRs for normalization handler coverage

## Escalation

If the fix is non-trivial or affects multiple sub-indicators:

1. Document all affected sub-indicators
2. Create separate fix for each handler type
3. Add comprehensive test coverage before deploying fix
4. Run full E2E tests with all golden webhooks

## Related Files

- `src/utils/normalization-handlers.ts` - Normalization functions
- `src/__tests__/unit/normalization-handlers.test.ts` - Unit tests
- `src/scripts/quality-gates.ts` - Quality gate validation
- `fixtures/webhooks/brewery-golden.json` - Primary regression fixture
- `output/system-audit/quality/anomaly-detection.json` - Anomaly results

## Metrics to Monitor

After implementing fix:

| Metric | Expected | Actual |
|--------|----------|--------|
| Critical anomalies | 0 | |
| TIN_001 score | 80-90 | |
| Unit tests passing | 100% | |
| Quality gates | All pass | |
