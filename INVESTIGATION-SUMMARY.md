# BizHealth Pipeline Investigation Summary

**Investigation Date:** 2025-11-30T20:57:57.465698
**Pipeline Location:** /home/user/bizHealth-Dennis-11.29.25

## Executive Summary

The investigation found **27,783 words** of AI-generated narrative content 
in the phase outputs, confirming that the analysis phases ARE generating content. 
However, the report generator is NOT consuming this narrative content - it only 
extracts numerical scores. This explains why reports show correct scores but lack 
substantive analysis text.

## Phase Output Analysis

| Phase | Exists | Size | Narrative Fields | Narrative Words |
|-------|--------|------|------------------|-----------------|
| Phase 0 | ✅ | 97,791 bytes | 77 | 918 |
| Phase 1 | ✅ | 77,873 bytes | 10 | 9,746 |
| Phase 2 | ✅ | 58,681 bytes | 5 | 7,317 |
| Phase 3 | ✅ | 68,712 bytes | 5 | 9,190 |
| Phase 4 | ✅ | 71,307 bytes | 52 | 612 |

**Total Narrative Content Available:** 27,783 words

### Sample Narrative Content Found

**Phase 0:**
- `root.output.companyProfile.basic_information.industry.industry_details` (16 words)
  > "Fintech company that provides technology to financial services companies.  It is most like Computershare for comparison...."
- `root.output.questionnaireResponses.chapters[0].dimensions[0].questions[0].original_prompt_text` (14 words)
  > "On a scale of 1-5, how well does your company understand your 'competitive differentiators'?..."

**Phase 1:**
- `root.tier1.revenue_engine.content` (849 words)
  > "# REVENUE ENGINE ANALYSIS: EWM Global  ## 1. Current State Assessment  ### Revenue Profile EWM Global operates as a specialized B2B fintech provider with strong fundamentals but significant growth con..."
- `root.tier1.operational_excellence.content` (720 words)
  > "# OPERATIONAL EXCELLENCE ANALYSIS ## EWM Global - Fintech Services  ### 1. CURRENT STATE ASSESSMENT  EWM Global demonstrates a mixed operational profile with notable strengths in reliability but oppor..."

**Phase 2:**
- `root.analyses.cross.content` (1242 words)
  > "# CROSS-DIMENSIONAL STRATEGIC SYNTHESIS: EWM GLOBAL  ## EXECUTIVE SUMMARY  EWM Global presents a stark paradox: a company with world-class customer relationships and technical capabilities facing immi..."
- `root.analyses.strategic.content` (1416 words)
  > "# STRATEGIC RECOMMENDATIONS FOR EWM GLOBAL  Based on the comprehensive Phase 1 analyses, here are 15 prioritized strategic recommendations to address EWM Global's critical situation and transform it i..."

**Phase 3:**
- `root.analyses.executive.content` (935 words)
  > "# EXECUTIVE SUMMARY: EWM GLOBAL TRANSFORMATION IMPERATIVE  ## BUSINESS OVERVIEW  **EWM Global** is a 24-year-old fintech services company specializing in employee benefits administration, with 170 emp..."
- `root.analyses.scorecard.content` (1878 words)
  > "# COMPREHENSIVE BUSINESS HEALTH SCORECARD: EWM GLOBAL  ## OVERALL BUSINESS HEALTH SCORE: 38/100 (CRITICAL)  ### Scoring Methodology - **Weighted Composite Score** based on business criticality - **Fin..."

**Phase 4:**
- `root.summaries.strength_summary` (11 words)
  > "Customer Retention (98%) | Operational Reliability (5/5) | Compliance Excellence (4.14/5)..."
- `root.summaries.challenge_summary` (15 words)
  > "Cultural Dysfunction (2.0/5) | Acquisition Efficiency (1% conversion) | Profitability Gap (32% vs 42% benchmark)..."

## Report Generation Analysis

### Files Found
- `src/reports/report-generator.ts` - ✅ reads narratives ✅ reads scores
- `src/reporting/report-prompts.ts` - ✅ reads narratives ✅ reads scores
- `src/reporting/report-generator.ts` - ✅ reads narratives ✅ reads scores
- `src/types/report.types.ts` - ❌ NO narrative refs 
- `src/api/report-endpoints.ts` - ✅ reads narratives 
- `src/orchestration/reports/risk-report.builder.ts` - ✅ reads narratives ✅ reads scores
- `src/orchestration/reports/comprehensive-report.builder.ts` - ❌ NO narrative refs ✅ reads scores
- `src/orchestration/reports/financial-report.builder.ts` - ❌ NO narrative refs ✅ reads scores
- `src/orchestration/reports/roadmap-report.builder.ts` - ✅ reads narratives ✅ reads scores
- `src/orchestration/reports/owners-report.builder.ts` - ✅ reads narratives ✅ reads scores
- `src/orchestration/reports/deep-dive-report.builder.ts` - ✅ reads narratives ✅ reads scores
- `src/orchestration/reports/quick-wins-report.builder.ts` - ❌ NO narrative refs ✅ reads scores
- `src/reports/report-generator.ts` - ✅ reads narratives ✅ reads scores
- `src/reporting/report-generator.ts` - ✅ reads narratives ✅ reads scores
- `src/scripts/render-pdf.ts` - ❌ NO narrative refs 
- `src/orchestration/reports/html-template.ts` - ✅ reads narratives ✅ reads scores

## Root Cause Determination

**Primary Cause:** CONTENT_EXISTS_NOT_CONSUMED
**Confidence:** MEDIUM

**Evidence:**
- Found 27,783 words of narrative content in phase outputs

## Recommendations

1. Modify report generator to read analysis_text/narrative fields from phase outputs
2. Add template placeholders for narrative content in each report section
3. Create mapping between phase analysis fields and report sections

## Hypothesis Analysis

| Hypothesis | Score | Evidence Count |
|------------|-------|----------------|
| CONTENT_EXISTS_NOT_CONSUMED | 40/100 | 1 |
| CONTENT_NOT_GENERATED | 0/100 | 0 |
| IDM_EXCLUDES_NARRATIVES | 0/100 | 0 |
| TEMPLATE_NO_PLACEHOLDERS | 0/100 | 0 |

---

*This report was generated automatically by the BizHealth Pipeline Investigator.*