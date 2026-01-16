# IDM Consolidation Bug Report

**Date**: November 29, 2025
**Severity**: 🔴 **CRITICAL**
**Impact**: Phase 4 IDM generation completely fails
**Status**: ⚠️ **NOT FIXED**

---

## Executive Summary

The IDM (Insights Data Model) consolidation fails due to a **fundamental data structure mismatch** between Phase 0 output and the IDM consolidator's expectations. This prevents generation of the canonical data model required for report generation.

**Business Impact**:
- ❌ No IDM file generated (~51 KB expected)
- ❌ No master analysis file generated (~208 KB expected)
- ❌ Report generation pipeline blocked
- ✅ All 20 AI analyses completed successfully (data exists, just not consolidated)

---

## Bug Details

### Error Messages

**First Error** (FIXED):
```
Error: Cannot read properties of undefined (reading 'metadata')
Location: src/run-pipeline.ts:397-403
```

**Second Error** (NOT FIXED):
```
Error: Cannot read properties of undefined (reading 'strategy')
Location: src/orchestration/idm-consolidator.ts:199-215
```

### Root Cause Analysis

The IDM consolidator expects questionnaire responses in a **categories-based structure**, but Phase 0 outputs a **chapters/dimensions hierarchy**.

#### Expected Structure (IDM Consolidator)
```typescript
{
  questionnaireResponses: {
    categories: {
      strategy: {
        questions: [
          { question_id: "...", response: "..." }
        ]
      },
      sales: {
        questions: [...]
      },
      operations: {
        questions: [...]
      }
      // ... more categories
    }
  }
}
```

#### Actual Structure (Phase 0 Output)
```typescript
{
  output: {
    questionnaireResponses: {
      chapters: [
        {
          chapter_code: "GE",
          chapter_name: "Growth Engine",
          dimensions: [
            {
              dimension_code: "STR",
              dimension_name: "Strategy",
              questions: [
                { question_id: "...", response: "..." }
              ]
            },
            {
              dimension_code: "SAL",
              dimension_name: "Sales & Marketing",
              questions: [...]
            }
          ]
        },
        {
          chapter_code: "OE",
          chapter_name: "Operational Excellence",
          dimensions: [
            {
              dimension_code: "OPS",
              dimension_name: "Operations",
              questions: [...]
            }
          ]
        }
        // ... more chapters
      ]
    }
  }
}
```

---

## Affected Code

### File: `src/orchestration/idm-consolidator.ts`
**Lines**: 195-240
**Function**: `buildQuestionsFromResponses()`

#### Problematic Code Section

```typescript
// Lines 199-215: Category mapping that expects flat structure
const categoryMapping: Record<string, keyof typeof questionnaireResponses.categories> = {
  'strategy': 'strategy',
  'sales': 'sales',
  'operations': 'operations',
  'finance': 'finance',
  'people': 'people',
  'compliance': 'compliance',
  'technology': 'technology',
  'risk': 'risk',
  'growth': 'growth',
  'market': 'market',
  'customer': 'customer',
  'innovation': 'innovation'
};

// Lines 216-240: Iteration over categories object (doesn't exist)
for (const [categoryId, categoryKey] of Object.entries(categoryMapping)) {
  const category = questionnaireResponses.categories[categoryKey];  // ❌ FAILS HERE

  if (!category || !category.questions) {
    continue;
  }

  // Process questions...
}
```

**Problem**: The code attempts to access `questionnaireResponses.categories[categoryKey]` but Phase 0 outputs `questionnaireResponses.chapters` instead.

---

## Fix Requirements

### High-Level Changes Needed

1. **Rewrite `buildQuestionsFromResponses()` function** to handle chapters/dimensions hierarchy
2. **Create dimension-to-category mapping** to translate between the two structures
3. **Iterate through chapters and dimensions** instead of flat categories
4. **Preserve question data** while transforming structure

### Detailed Fix Implementation

#### Step 1: Update Function Signature
```typescript
function buildQuestionsFromResponses(
  questionnaireResponses: {
    chapters: Array<{
      chapter_code: string;
      chapter_name: string;
      dimensions: Array<{
        dimension_code: string;
        dimension_name: string;
        questions: Array<any>;
      }>;
    }>;
  }
): Record<string, any[]> {
  // Implementation here
}
```

#### Step 2: Create Dimension Code Mapping
```typescript
// Map dimension codes to IDM category names
const dimensionToCategory: Record<string, string> = {
  'STR': 'strategy',
  'SAL': 'sales',
  'OPS': 'operations',
  'FIN': 'finance',
  'PEO': 'people',
  'COM': 'compliance',
  'TEC': 'technology',
  'RSK': 'risk',
  'GRO': 'growth',
  'MKT': 'market',
  'CUS': 'customer',
  'INN': 'innovation'
};
```

#### Step 3: Rewrite Iteration Logic
```typescript
const questionsByCategory: Record<string, any[]> = {};

// Iterate through chapters
for (const chapter of questionnaireResponses.chapters) {
  // Iterate through dimensions within each chapter
  for (const dimension of chapter.dimensions) {
    const categoryName = dimensionToCategory[dimension.dimension_code];

    if (!categoryName) {
      console.warn(`Unknown dimension code: ${dimension.dimension_code}`);
      continue;
    }

    // Initialize category array if needed
    if (!questionsByCategory[categoryName]) {
      questionsByCategory[categoryName] = [];
    }

    // Add questions from this dimension to the category
    if (dimension.questions && Array.isArray(dimension.questions)) {
      questionsByCategory[categoryName].push(...dimension.questions);
    }
  }
}

return questionsByCategory;
```

### Step 4: Handle Edge Cases
```typescript
// Handle missing chapters
if (!questionnaireResponses.chapters || !Array.isArray(questionnaireResponses.chapters)) {
  console.error('No chapters found in questionnaire responses');
  return {};
}

// Handle empty dimensions
if (!dimension.questions || dimension.questions.length === 0) {
  console.warn(`No questions in dimension ${dimension.dimension_code}`);
  continue;
}
```

---

## Complete Fixed Function

```typescript
function buildQuestionsFromResponses(
  questionnaireResponses: {
    chapters: Array<{
      chapter_code: string;
      chapter_name: string;
      dimensions: Array<{
        dimension_code: string;
        dimension_name: string;
        questions: Array<any>;
      }>;
    }>;
  }
): Record<string, any[]> {

  // Map dimension codes to IDM category names
  const dimensionToCategory: Record<string, string> = {
    'STR': 'strategy',
    'SAL': 'sales',
    'OPS': 'operations',
    'FIN': 'finance',
    'PEO': 'people',
    'COM': 'compliance',
    'TEC': 'technology',
    'RSK': 'risk',
    'GRO': 'growth',
    'MKT': 'market',
    'CUS': 'customer',
    'INN': 'innovation'
  };

  const questionsByCategory: Record<string, any[]> = {};

  // Handle missing chapters
  if (!questionnaireResponses.chapters || !Array.isArray(questionnaireResponses.chapters)) {
    console.error('No chapters found in questionnaire responses');
    return {};
  }

  // Iterate through chapters
  for (const chapter of questionnaireResponses.chapters) {
    if (!chapter.dimensions || !Array.isArray(chapter.dimensions)) {
      console.warn(`No dimensions in chapter ${chapter.chapter_code}`);
      continue;
    }

    // Iterate through dimensions within each chapter
    for (const dimension of chapter.dimensions) {
      const categoryName = dimensionToCategory[dimension.dimension_code];

      if (!categoryName) {
        console.warn(`Unknown dimension code: ${dimension.dimension_code}`);
        continue;
      }

      // Initialize category array if needed
      if (!questionsByCategory[categoryName]) {
        questionsByCategory[categoryName] = [];
      }

      // Add questions from this dimension to the category
      if (dimension.questions && Array.isArray(dimension.questions)) {
        questionsByCategory[categoryName].push(...dimension.questions);
      } else {
        console.warn(`No questions in dimension ${dimension.dimension_code}`);
      }
    }
  }

  return questionsByCategory;
}
```

---

## Testing the Fix

### Test Data Location
```
output/phase0_output.json
```

### Verification Steps

1. **Apply the fix** to `src/orchestration/idm-consolidator.ts:195-240`

2. **Re-run Phase 4 only**:
   ```bash
   npx tsx src/run-pipeline.ts --phase=4
   ```

3. **Verify IDM generation**:
   ```bash
   ls -lh output/phase4/idm-*.json
   # Should show ~51 KB file

   ls -lh output/phase4/master-analysis-*.json
   # Should show ~208 KB file
   ```

4. **Validate JSON structure**:
   ```bash
   cat output/phase4/idm-*.json | python3 -m json.tool > /dev/null && echo "✓ Valid JSON"
   ```

5. **Check for expected dimensions** in IDM:
   ```bash
   cat output/phase4/idm-*.json | python3 -c "
   import json, sys
   idm = json.load(sys.stdin)
   print('Chapters found:', len(idm.get('chapters', [])))
   for chapter in idm.get('chapters', []):
       print(f\"  - {chapter.get('chapter_name')}: {len(chapter.get('questions', []))} questions\")
   "
   ```

### Expected Output After Fix

```
output/phase4/
├── idm-af4b5782-2025-11-30T01-32-50Z.json (51 KB) ✅
├── master-analysis-af4b5782-2025-11-30T01-32-50Z.json (208 KB) ✅
└── phase4-summaries-af4b5782-5849-4e52-9eef-9c380534157f-2025-11-30T01-32-50Z.json (3.2 KB) ✅
```

---

## Risk Assessment

### Implementation Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Incorrect dimension mapping | MEDIUM | Verify all dimension codes exist in Phase 0 output |
| Missing questions after transformation | LOW | Add comprehensive logging during transformation |
| Performance degradation | LOW | Structure is nested but not deeply so |
| Breaking other IDM functions | MEDIUM | Test full Phase 4 pipeline after fix |

### Rollback Plan

If the fix causes issues:

1. **Restore original function** from git history:
   ```bash
   git checkout HEAD -- src/orchestration/idm-consolidator.ts
   ```

2. **Document the failure** for further investigation

3. **Consider alternative approach**: Transform Phase 0 output to match expected structure

---

## Alternative Approaches

### Approach 1: Fix Phase 0 Output (Not Recommended)
Change Phase 0 to output flat categories instead of chapters/dimensions hierarchy.

**Pros**:
- IDM consolidator works unchanged

**Cons**:
- Breaks existing Phase 0 structure
- May affect other consumers of Phase 0 data
- Loses semantic grouping of chapters/dimensions

### Approach 2: Fix IDM Consolidator (Recommended)
Update IDM consolidator to handle chapters/dimensions structure.

**Pros**:
- Preserves semantic Phase 0 structure
- More flexible for future changes
- Only affects one function

**Cons**:
- Requires understanding dimension code mapping
- More complex iteration logic

### Approach 3: Add Transformation Layer
Create intermediate transformer between Phase 0 and IDM consolidator.

**Pros**:
- Separation of concerns
- Easy to test independently

**Cons**:
- Additional complexity
- Extra transformation step

**Recommendation**: Use **Approach 2** (fix IDM consolidator) as it's the least invasive and most maintainable.

---

## Additional Context

### Dimension Code Reference

Based on Phase 0 output analysis, these dimension codes were found:

```typescript
// Growth Engine Chapter (GE)
'STR' → 'strategy'          // Strategy
'SAL' → 'sales'             // Sales & Marketing
'CUS' → 'customer'          // Customer Success

// Operational Excellence Chapter (OE)
'OPS' → 'operations'        // Operations
'TEC' → 'technology'        // Technology & Systems
'FIN' → 'finance'           // Financial Management

// People & Culture Chapter (PC)
'PEO' → 'people'            // People & Leadership
'COM' → 'compliance'        // Compliance & Governance

// Growth & Risk Chapter (GR)
'GRO' → 'growth'            // Growth Readiness
'MKT' → 'market'            // Market Position
'RSK' → 'risk'              // Risk & Resilience
'INN' → 'innovation'        // Innovation Capacity
```

**Note**: Verify these mappings against actual Phase 0 output before implementing the fix.

### Where to Find Actual Dimension Codes

```bash
# Extract all dimension codes from Phase 0 output
cat output/phase0_output.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
chapters = data['output']['questionnaireResponses']['chapters']
for chapter in chapters:
    print(f\"\n{chapter['chapter_name']} ({chapter['chapter_code']}):\")
    for dim in chapter['dimensions']:
        print(f\"  {dim['dimension_code']}: {dim['dimension_name']}\")
"
```

---

## Timeline to Resolution

### Immediate (< 1 hour)
- ✅ Bug documented and analyzed
- ✅ Root cause identified
- ✅ Fix approach designed
- ⏳ Implement fix in `idm-consolidator.ts`
- ⏳ Test with existing Phase 0 output
- ⏳ Verify IDM generation succeeds

### Short-term (1-2 days)
- ⏳ Test fix against all 25 sample webhooks
- ⏳ Add unit tests for `buildQuestionsFromResponses()`
- ⏳ Document dimension code mapping
- ⏳ Update TypeScript types if needed

### Medium-term (1 week)
- ⏳ Add integration tests for Phase 0 → Phase 4 flow
- ⏳ Add schema validation for IDM output
- ⏳ Improve error messages for data mismatches
- ⏳ Consider adding data structure migration guide

---

## Related Issues

### Issue #2: TypeScript Compilation Warnings
**Priority**: MEDIUM
**Impact**: Pipeline runs but with warnings
**Location**: Prompt template files

This is a separate issue from the IDM bug and can be addressed independently.

### Issue #3: Missing Questionnaire Responses
**Priority**: LOW
**Impact**: 4/93 questions not answered (95.7% completion)
**Related**: May affect IDM completeness but not structure

---

## Contact & Escalation

**For questions about this bug**:
- Review Phase 0 output: `output/phase0_output.json`
- Review IDM consolidator: `src/orchestration/idm-consolidator.ts:195-240`
- Check this report: `IDM_CONSOLIDATION_BUG_REPORT.md`

**Before implementing the fix**:
1. Verify dimension code mappings against actual data
2. Create backup of `idm-consolidator.ts`
3. Test with Phase 0 output from multiple sample webhooks
4. Validate IDM output structure matches schema

---

**Report Generated**: 2025-11-30T01:40:00Z
**Pipeline Version**: 1.0.0
**Bug Severity**: 🔴 CRITICAL
**Fix Complexity**: MEDIUM
**Estimated Time to Fix**: 1-2 hours
**Estimated Time to Test**: 2-4 hours
