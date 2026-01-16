# Phase C Testing Strategy

## Overview

BizHealth Phase C implements comprehensive automated testing with <5 minute feedback loop for quality assurance.

## Testing Approach

### Three-Layer Testing Model

1. **Unit Tests (40+ tests)**
   - Focus: Normalization handlers
   - Coverage: 100% of handler logic
   - Scope: Input -> normalized score

2. **Integration Tests (20+ tests)**
   - Focus: Phase transitions
   - Coverage: Data flow across phases
   - Scope: Phase 0 -> Phase 1.5 -> Phase 4

3. **E2E Tests (15+ tests)**
   - Focus: Full pipeline scenarios
   - Coverage: 5+ industry webhooks
   - Scope: Webhook -> 17 reports

## Coverage Targets

| Target | Threshold | Status |
|--------|-----------|--------|
| Code Coverage | 80%+ | Required |
| Critical Paths | 100% | Required |
| Handler Coverage | 100% | Required |
| Phase Transitions | 100% | Required |

## Artifact Storage

All test artifacts stored in QA-QC-Audit structure:
- Test results: `output/system-audit/quality/test-results.json`
- Coverage: `output/coverage/index.html`
- Quality metrics: `output/system-audit/quality/quality-metrics.json`
- Anomalies: `output/system-audit/quality/anomaly-detection.json`

## Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run quality gates
npx tsx src/scripts/quality-gates.ts

# Run only unit tests
npx vitest run src/__tests__/unit/

# Run only integration tests
npx vitest run src/__tests__/integration/
```

## Golden Webhook Fixtures

Three golden webhook fixtures are provided for regression testing:

| Fixture | Purpose | Key Assertions |
|---------|---------|----------------|
| brewery-golden.json | TIN_001=0 bug regression | $85K tech investment -> 80-90 score |
| tech-startup-golden.json | High-tech baseline | $250K -> 90+ score |
| manufacturing-golden.json | Operations-heavy baseline | Ops highest category |

## Quality Gates

The quality gates module (`src/scripts/quality-gates.ts`) runs five validation checks:

1. **TypeScript Compilation** - No type errors
2. **Unit Tests** - All normalization handler tests pass
3. **Integration Tests** - Phase transition tests pass
4. **Code Coverage** - Meets 80% threshold
5. **Zero-Score Anomaly Detection** - No TIN_001=0 patterns

## Success Metrics

- 100% pass rate on quality gates
- 80%+ code coverage
- Zero undetected zero-score anomalies
- <5 minute test execution time
- All 17 reports generate without error

## CI/CD Integration

The quality gates are designed to be run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Quality Gates
  run: npx tsx src/scripts/quality-gates.ts
```

Exit codes:
- `0`: All gates passed
- `1`: One or more gates failed

## Test File Structure

```
src/__tests__/
  setup.ts                              # Global test setup
  unit/
    normalization-handlers.test.ts      # Handler unit tests
  integration/
    phase-transitions.test.ts           # Phase transition tests
  e2e/
    pipeline-scenarios.test.ts          # Full pipeline tests
fixtures/
  webhooks/
    brewery-golden.json                 # TIN_001=0 regression
    tech-startup-golden.json            # High-tech baseline
    manufacturing-golden.json           # Operations baseline
output/
  system-audit/quality/
    test-results.json                   # Test execution results
    quality-metrics.json                # Quality gate metrics
    anomaly-detection.json              # Zero-score anomalies
  coverage/
    index.html                          # Coverage dashboard
    coverage-summary.json               # Coverage summary
```

## Maintenance

### Adding New Tests

1. Place unit tests in `src/__tests__/unit/`
2. Place integration tests in `src/__tests__/integration/`
3. Place E2E tests in `src/__tests__/e2e/`
4. Follow naming convention: `*.test.ts`

### Adding New Fixtures

1. Add webhook JSON to `fixtures/webhooks/`
2. Include `_metadata` section with:
   - `fixture_name`
   - `purpose`
   - `expected_*` scores
   - `critical_assertions`

### Updating Thresholds

Quality thresholds are defined in `src/scripts/quality-gates.ts`:

```typescript
const THRESHOLDS = {
  minCoverage: 80,
  // ...
};
```

And in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
}
```
