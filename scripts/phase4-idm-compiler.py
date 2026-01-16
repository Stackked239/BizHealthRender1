#!/usr/bin/env python3
"""
BizHealth.ai Phase 4 + IDM Compilation Engine

Extended version of phase4-compiler.py that produces both:
1. master-analysis-{id}.json (existing output)
2. idm-{id}.json (new IDM output)

The IDM (Insights Data Model) is the canonical source for all report generation.
"""

import json
import re
import sys
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict, field

# Import IDM models
from idm_models import (
    IDM, Meta, Chapter, Dimension, SubIndicator, Question, Finding,
    Recommendation, QuickWin, Risk, RoadmapPhase, Roadmap, ScoresSummary,
    ChapterCode, DimensionCode, FindingType, RecommendationHorizon, ScoreBand, Trajectory,
    DIMENSION_METADATA, SUB_INDICATOR_DEFINITIONS, QUESTION_MAPPINGS, CHAPTER_NAMES,
    get_score_band, get_chapter_for_dimension, get_dimensions_for_chapter,
    calculate_chapter_score, calculate_overall_health_score, get_health_descriptor,
    determine_trajectory, idm_to_dict, validate_idm
)


@dataclass
class CategoryScore:
    """Data structure for category scores"""
    name: str
    dimension_code: str
    score: float
    benchmark_score: float
    weight: float
    trend: str = "stable"
    percentile: int = 50


class Phase4IDMCompiler:
    """
    Compiles Phase 4 summaries and IDM from Phase 1-3 analysis results.
    Implements the BizHealth.ai Analysis Architecture framework.
    """

    def __init__(self, phase1_path: str, phase2_path: str, phase3_path: str,
                 phase1_5_path: Optional[str] = None, webhook_path: Optional[str] = None):
        """Initialize with paths to analysis files"""
        self.phase1 = self._load_json(phase1_path)
        self.phase2 = self._load_json(phase2_path)
        self.phase3 = self._load_json(phase3_path)
        self.phase1_5 = self._load_json(phase1_5_path) if phase1_5_path else {}
        self.webhook_data = self._load_json(webhook_path) if webhook_path else {}

        # Track data source for logging
        self.using_phase1_5 = bool(self.phase1_5 and self.phase1_5.get('categoryAnalyses'))
        if self.using_phase1_5:
            print(f"  ✓ Phase 1.5 data loaded: {len(self.phase1_5.get('categoryAnalyses', []))} categories")

        self.category_scores = self._extract_category_scores()
        self.benchmarks = self._load_benchmarks()

    def _load_json(self, path: str) -> Dict:
        """Load JSON file with error handling"""
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Error loading {path}: {e}", file=sys.stderr)
            return {}

    def _extract_category_scores(self) -> List[CategoryScore]:
        """Extract category scores - Phase 1.5 is authoritative if available"""

        # PRIORITY: Use Phase 1.5 category analyses if available
        if self.phase1_5 and 'categoryAnalyses' in self.phase1_5:
            categories = []
            for cat in self.phase1_5['categoryAnalyses']:
                # Extract percentile from benchmarkComparisons if available
                percentile = 50  # default
                if cat.get('benchmarkComparisons'):
                    # Average the positions across all benchmark comparisons
                    position_map = {'poor': 20, 'average': 50, 'good': 70, 'excellent': 90}
                    positions = [position_map.get(bc.get('position', 'average'), 50)
                                for bc in cat['benchmarkComparisons']]
                    percentile = int(sum(positions) / len(positions)) if positions else 50

                # Map trajectory to trend
                trajectory = self.phase1_5.get('overallSummary', {}).get('trajectory', 'Stable')
                trend_map = {'Declining': 'declining', 'Stable': 'stable', 'Improving': 'improving'}
                trend = trend_map.get(trajectory, 'stable')

                # Get benchmark from our library for this dimension
                # Map ITD to IDS for compatibility with IDM model
                dim_code = cat['categoryCode']
                if dim_code == 'ITD':
                    dim_code = 'IDS'
                benchmark_score = self._get_benchmark_for_dimension(dim_code)

                categories.append(CategoryScore(
                    name=cat['categoryName'],
                    dimension_code=dim_code,
                    score=float(cat['overallScore']),  # Use Phase 1.5 AI-weighted score
                    benchmark_score=benchmark_score,
                    weight=1.0 / 12,
                    trend=trend,
                    percentile=percentile
                ))

            print(f"  ✓ Using Phase 1.5 scores for {len(categories)} categories")
            return categories

        # FALLBACK: Original webhook-based extraction
        print("  ⚠ Phase 1.5 not available, falling back to webhook calculation")
        categories = []

        # Map webhook categories to dimensions
        category_mapping = {
            'strategy': ('STR', 'Strategy', 3.5),
            'sales': ('SAL', 'Sales', 3.6),
            'marketing': ('MKT', 'Marketing', 3.4),
            'customer_experience': ('CXP', 'Customer Experience', 3.7),
            'operations': ('OPS', 'Operations', 3.5),
            'financials': ('FIN', 'Financials', 3.6),
            'human_resources': ('HRS', 'Human Resources', 3.3),
            'leadership': ('LDG', 'Leadership & Governance', 3.4),
            'technology': ('TIN', 'Technology & Innovation', 3.5),
            'it_infrastructure': ('IDS', 'IT, Data & Systems', 3.5),
            'risk_management': ('RMS', 'Risk Management', 3.4),
            'compliance': ('CMP', 'Compliance', 3.6)
        }

        # Extract scores from webhook data
        for category_key, (dim_code, name, benchmark) in category_mapping.items():
            category_data = self.webhook_data.get(category_key, {})
            score = self._calculate_category_score(category_data, dim_code)

            categories.append(CategoryScore(
                name=name,
                dimension_code=dim_code,
                score=score,
                benchmark_score=benchmark,
                weight=1.0 / 12,
                trend=self._calculate_trend_from_data(category_data),
                percentile=self._calculate_percentile(score, benchmark)
            ))

        return categories if categories else self._get_default_scores()

    def _get_benchmark_for_dimension(self, dim_code: str) -> float:
        """Get benchmark score for a dimension code"""
        benchmark_map = {
            'STR': 3.5, 'SAL': 3.6, 'MKT': 3.4, 'CXP': 3.7,
            'OPS': 3.5, 'FIN': 3.6, 'HRS': 3.3, 'LDG': 3.4,
            'TIN': 3.5, 'ITD': 3.5, 'IDS': 3.5, 'RMS': 3.4, 'CMP': 3.6
        }
        return benchmark_map.get(dim_code, 3.5)

    def _normalize_dim_code(self, dim_code: str) -> str:
        """Normalize dimension code (e.g., ITD -> IDS for compatibility)"""
        if dim_code == 'ITD':
            return 'IDS'
        return dim_code

    def _calculate_category_score(self, category_data: Dict, dimension_code: str) -> float:
        """Calculate category score from webhook responses"""
        if not category_data:
            return 60.0  # Default score

        # Get relevant question mappings for this dimension
        relevant_mappings = [m for m in QUESTION_MAPPINGS if m.dimension_code.value == dimension_code]

        scores = []
        weights = []

        for key, value in category_data.items():
            if isinstance(value, (int, float)):
                # 1-5 scale -> 0-100
                if 1 <= value <= 5:
                    normalized = ((value - 1) / 4) * 100
                    scores.append(normalized)
                    weights.append(1.0)
                # Percentage values
                elif 0 <= value <= 100:
                    scores.append(value)
                    weights.append(0.5)

        if scores:
            total_weight = sum(weights)
            weighted_sum = sum(s * w for s, w in zip(scores, weights))
            return round(weighted_sum / total_weight, 1) if total_weight > 0 else 60.0

        return 60.0

    def _calculate_trend_from_data(self, category_data: Dict) -> str:
        """Calculate trend from category data"""
        # Look for growth or trend indicators
        for key, value in category_data.items():
            if 'growth' in key.lower() and isinstance(value, (int, float)):
                if value > 15:
                    return "improving"
                elif value < -5:
                    return "declining"
        return "stable"

    def _calculate_percentile(self, score: float, benchmark: float) -> int:
        """Calculate percentile rank relative to benchmark"""
        # Convert 0-100 score to 1-5 for comparison with benchmark
        score_5 = (score / 100) * 4 + 1
        if benchmark == 0:
            return 50
        ratio = score_5 / benchmark
        if ratio >= 1.2:
            return 90
        elif ratio >= 1.0:
            return 75
        elif ratio >= 0.8:
            return 50
        elif ratio >= 0.6:
            return 25
        return 10

    def _get_default_scores(self) -> List[CategoryScore]:
        """Provide default scores if extraction fails"""
        return [
            CategoryScore("Strategy", "STR", 68, 3.5, 1/12, "stable", 60),
            CategoryScore("Sales", "SAL", 72, 3.6, 1/12, "stable", 65),
            CategoryScore("Marketing", "MKT", 42, 3.4, 1/12, "declining", 35),
            CategoryScore("Customer Experience", "CXP", 85, 3.7, 1/12, "stable", 80),
            CategoryScore("Operations", "OPS", 78, 3.5, 1/12, "stable", 70),
            CategoryScore("Financials", "FIN", 70, 3.6, 1/12, "stable", 60),
            CategoryScore("Human Resources", "HRS", 55, 3.3, 1/12, "declining", 45),
            CategoryScore("Leadership & Governance", "LDG", 48, 3.4, 1/12, "declining", 40),
            CategoryScore("Technology & Innovation", "TIN", 75, 3.5, 1/12, "improving", 70),
            CategoryScore("IT, Data & Systems", "IDS", 90, 3.5, 1/12, "stable", 85),
            CategoryScore("Risk Management", "RMS", 45, 3.4, 1/12, "declining", 38),
            CategoryScore("Compliance", "CMP", 72, 3.6, 1/12, "stable", 65)
        ]

    def _load_benchmarks(self) -> Dict:
        """Load industry benchmarks"""
        return {
            'growth_rate': 20.0,
            'gross_margin': 42.0,
            'sales_cycle': 90.0,
            'close_rate': 25.0,
            'conversion_rate': 4.0,
            'capacity_utilization': 85.0,
            'revenue_per_employee': 250000.0,
            'culture_score': 4.0
        }

    # =========================================================================
    # IDM COMPILATION
    # =========================================================================

    def compile_idm(self) -> IDM:
        """Compile the Insights Data Model (IDM)"""
        company_id = self.phase1.get('company_profile_id', str(uuid.uuid4()))
        assessment_run_id = str(uuid.uuid4())

        # Build meta
        meta = Meta(
            assessment_run_id=assessment_run_id,
            company_profile_id=company_id,
            created_at=datetime.utcnow().isoformat() + "Z",
            methodology_version="1.0.0",
            scoring_version="1.0.0",
            idm_schema_version="1.0.0"
        )

        # Build questions from webhook data
        questions = self._build_questions()

        # Build sub-indicators
        # Build dimensions
        dimensions = self._build_dimensions()

        # Build chapters
        chapters = self._build_chapters(dimensions)

        # Build findings
        findings = self._build_findings(dimensions)

        # Build recommendations
        recommendations = self._build_recommendations(dimensions, findings)

        # Build quick wins
        quick_wins = self._build_quick_wins(recommendations)

        # Build risks
        risks = self._build_risks(dimensions, findings)

        # Build roadmap
        roadmap = self._build_roadmap(recommendations)

        # Build scores summary
        scores_summary = self._build_scores_summary(chapters, dimensions, findings)

        # Store Phase 1.5 cross-category insights for later enrichment
        self.cross_category_insights = None
        self.phase15_overall_health = None

        if self.phase1_5:
            if 'crossCategoryInsights' in self.phase1_5:
                self.cross_category_insights = self.phase1_5['crossCategoryInsights']
            if 'overallSummary' in self.phase1_5:
                self.phase15_overall_health = {
                    'score': self.phase1_5['overallSummary'].get('healthScore'),
                    'status': self.phase1_5['overallSummary'].get('healthStatus'),
                    'trajectory': self.phase1_5['overallSummary'].get('trajectory'),
                    'top_strengths': self.phase1_5['overallSummary'].get('topStrengths', []),
                    'top_weaknesses': self.phase1_5['overallSummary'].get('topWeaknesses', []),
                    'top_risks': self.phase1_5['overallSummary'].get('topRisks', []),
                    'top_opportunities': self.phase1_5['overallSummary'].get('topOpportunities', [])
                }

        return IDM(
            meta=meta,
            chapters=chapters,
            dimensions=dimensions,
            questions=questions,
            findings=findings,
            recommendations=recommendations,
            quick_wins=quick_wins,
            risks=risks,
            roadmap=roadmap,
            scores_summary=scores_summary
        )

    def enrich_idm_dict(self, idm_dict: Dict) -> Dict:
        """Add Phase 1.5 enrichments to IDM dictionary (preserves core schema)"""
        if self.cross_category_insights:
            idm_dict['cross_category_insights'] = self.cross_category_insights
        if self.phase15_overall_health:
            idm_dict['phase15_overall_health'] = self.phase15_overall_health
        return idm_dict

    def validate_phase15_integration(self) -> List[str]:
        """Validate Phase 1.5 data was properly integrated"""
        issues = []

        if not self.using_phase1_5:
            issues.append("INFO: Phase 1.5 data not used (fallback mode)")
            return issues

        phase15_categories = {cat['categoryCode']: cat
                            for cat in self.phase1_5.get('categoryAnalyses', [])}

        # Verify all 12 categories present
        expected_codes = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
                         'HRS', 'LDG', 'TIN', 'ITD', 'IDS', 'RMS', 'CMP']
        for code in expected_codes:
            if code not in phase15_categories:
                # ITD and IDS may be used interchangeably
                if code == 'ITD' and 'IDS' in phase15_categories:
                    continue
                if code == 'IDS' and 'ITD' in phase15_categories:
                    continue
                issues.append(f"MISSING: Category {code} not in Phase 1.5 data")

        # Verify scores were used correctly
        for cat_score in self.category_scores:
            phase15_cat = phase15_categories.get(cat_score.dimension_code)
            if phase15_cat:
                expected_score = phase15_cat['overallScore']
                if abs(cat_score.score - expected_score) > 0.1:
                    issues.append(f"SCORE MISMATCH: {cat_score.dimension_code} "
                                f"expected {expected_score}, got {cat_score.score}")

        # Verify rich content was extracted
        total_strengths = sum(len(cat.get('strengths', [])) for cat in phase15_categories.values())
        total_weaknesses = sum(len(cat.get('weaknesses', [])) for cat in phase15_categories.values())
        total_quickwins = sum(len(cat.get('quickWins', [])) for cat in phase15_categories.values())

        if total_strengths < 12:
            issues.append(f"LOW CONTENT: Only {total_strengths} strengths found (expected 36+)")
        if total_weaknesses < 12:
            issues.append(f"LOW CONTENT: Only {total_weaknesses} weaknesses found (expected 36+)")
        if total_quickwins < 12:
            issues.append(f"LOW CONTENT: Only {total_quickwins} quick wins found (expected 24+)")

        # Verify cross-category insights if present
        if not self.phase1_5.get('crossCategoryInsights'):
            issues.append("WARNING: No cross-category insights found in Phase 1.5 data")
        if not self.phase1_5.get('overallSummary'):
            issues.append("WARNING: No overall summary found in Phase 1.5 data")

        return issues

    def _build_questions(self) -> List[Question]:
        """Build questions from webhook data"""
        questions = []

        category_key_mapping = {
            'strategy': 'STR',
            'sales': 'SAL',
            'marketing': 'MKT',
            'customer_experience': 'CXP',
            'operations': 'OPS',
            'financials': 'FIN',
            'human_resources': 'HRS',
            'leadership': 'LDG',
            'technology': 'TIN',
            'it_infrastructure': 'IDS',
            'risk_management': 'RMS',
            'compliance': 'CMP'
        }

        for category_key, dim_code in category_key_mapping.items():
            category_data = self.webhook_data.get(category_key, {})
            question_num = 1

            for key, value in category_data.items():
                if value is not None and not isinstance(value, (dict, list)):
                    question_id = f"{category_key}_q{question_num}"
                    sub_indicator_id = f"{dim_code}_{str(question_num).zfill(3)}"

                    # Normalize score
                    normalized_score = None
                    if isinstance(value, (int, float)):
                        if 1 <= value <= 5:
                            normalized_score = ((value - 1) / 4) * 100
                        elif 0 <= value <= 100:
                            normalized_score = float(value)

                    questions.append(Question(
                        question_id=question_id,
                        dimension_code=DimensionCode(dim_code),
                        sub_indicator_id=sub_indicator_id,
                        raw_response=value,
                        normalized_score=normalized_score
                    ))
                    question_num += 1

        return questions

    def _build_dimensions(self) -> List[Dimension]:
        """Build dimensions from category scores"""
        dimensions = []

        for cat in self.category_scores:
            dim_code = DimensionCode(cat.dimension_code)
            metadata = DIMENSION_METADATA[dim_code]
            chapter_code = metadata.chapter

            # Build sub-indicators for this dimension
            sub_indicators = self._build_sub_indicators(dim_code, cat.score)

            dimensions.append(Dimension(
                dimension_code=dim_code,
                chapter_code=chapter_code,
                name=metadata.name,
                description=metadata.description,
                score_overall=cat.score,
                score_band=get_score_band(cat.score),
                sub_indicators=sub_indicators,
                benchmark={"peer_percentile": float(cat.percentile), "band_description": f"Peer {cat.percentile}th percentile"}
            ))

        return dimensions

    def _build_sub_indicators(self, dimension_code: DimensionCode, dimension_score: float) -> List[SubIndicator]:
        """Build sub-indicators for a dimension"""
        sub_indicators = []
        definitions = SUB_INDICATOR_DEFINITIONS.get(dimension_code, [])

        for i, defn in enumerate(definitions):
            # Vary sub-indicator scores around dimension score
            variation = (i - 2) * 5  # -10 to +10
            score = max(0, min(100, dimension_score + variation))

            sub_indicators.append(SubIndicator(
                id=defn.id,
                dimension_code=dimension_code,
                name=defn.name,
                score=score,
                score_band=get_score_band(score),
                contributing_question_ids=[]
            ))

        return sub_indicators

    def _build_chapters(self, dimensions: List[Dimension]) -> List[Chapter]:
        """Build chapters from dimensions"""
        chapters = []

        for chapter_code in ChapterCode:
            chapter_dims = [d for d in dimensions if d.chapter_code == chapter_code]
            if chapter_dims:
                avg_score = sum(d.score_overall for d in chapter_dims) / len(chapter_dims)
            else:
                avg_score = 60.0

            chapters.append(Chapter(
                chapter_code=chapter_code,
                name=CHAPTER_NAMES[chapter_code],
                score_overall=round(avg_score, 1),
                score_band=get_score_band(avg_score)
            ))

        return chapters

    def _build_findings(self, dimensions: List[Dimension]) -> List[Finding]:
        """Build findings - use Phase 1.5 strengths/weaknesses if available"""
        findings = []
        finding_id = 1

        # PRIORITY: Extract findings from Phase 1.5 category analyses
        if self.phase1_5 and 'categoryAnalyses' in self.phase1_5:
            for cat in self.phase1_5['categoryAnalyses']:
                dim_code = DimensionCode(self._normalize_dim_code(cat['categoryCode']))

                # Map STRENGTHS to STRENGTH findings
                for strength in cat.get('strengths', []):
                    findings.append(Finding(
                        id=f"finding-{finding_id:03d}",
                        dimension_code=dim_code,
                        type=FindingType.STRENGTH,
                        severity="Low",
                        confidence_level="High",
                        short_label=strength.get('title', 'Strength Identified'),
                        narrative=strength.get('description', ''),
                        evidence_refs={
                            "evidence": strength.get('evidence', []),
                            "impact_level": strength.get('impactLevel', 'medium')
                        }
                    ))
                    finding_id += 1

                # Map WEAKNESSES to GAP or RISK findings based on severity
                for weakness in cat.get('weaknesses', []):
                    severity = weakness.get('severity', 'medium')
                    finding_type = FindingType.RISK if severity in ['critical', 'high'] else FindingType.GAP

                    # Map severity strings to IDM format
                    severity_map = {'critical': 'Critical', 'high': 'High', 'medium': 'Medium', 'low': 'Low'}
                    idm_severity = severity_map.get(severity.lower() if isinstance(severity, str) else 'medium', 'Medium')

                    narrative = weakness.get('description', '')
                    if weakness.get('rootCause'):
                        narrative += f" Root cause: {weakness['rootCause']}"

                    findings.append(Finding(
                        id=f"finding-{finding_id:03d}",
                        dimension_code=dim_code,
                        type=finding_type,
                        severity=idm_severity,
                        confidence_level="High",
                        short_label=weakness.get('title', 'Gap Identified'),
                        narrative=narrative,
                        evidence_refs={
                            "evidence": weakness.get('evidence', []),
                            "root_cause": weakness.get('rootCause')
                        }
                    ))
                    finding_id += 1

            print(f"  ✓ Generated {len(findings)} findings from Phase 1.5 analysis")
            return findings

        # FALLBACK: Original score-based finding generation
        print("  ⚠ Using score-based finding generation (Phase 1.5 not available)")
        for dim in dimensions:
            # Strengths (Excellence tier)
            if dim.score_overall >= 80:
                findings.append(Finding(
                    id=f"finding-strength-{dim.dimension_code.value}",
                    dimension_code=dim.dimension_code,
                    type=FindingType.STRENGTH,
                    severity="Low",
                    confidence_level="High",
                    short_label=f"{dim.name} Excellence",
                    narrative=f"{dim.name} demonstrates strong performance at {dim.score_overall}/100, placing it in the Excellence tier. This represents a competitive advantage.",
                    evidence_refs={"metrics": [f"{dim.dimension_code.value}_score"]}
                ))

            # Gaps (Attention tier)
            elif dim.score_overall >= 40 and dim.score_overall < 60:
                findings.append(Finding(
                    id=f"finding-gap-{dim.dimension_code.value}",
                    dimension_code=dim.dimension_code,
                    type=FindingType.GAP,
                    severity="Medium",
                    confidence_level="High",
                    short_label=f"{dim.name} Performance Gap",
                    narrative=f"{dim.name} shows moderate performance at {dim.score_overall}/100. This gap presents improvement opportunities that should be addressed within 6-12 months.",
                    evidence_refs={"metrics": [f"{dim.dimension_code.value}_score"]}
                ))

            # Risks (Critical tier)
            elif dim.score_overall < 40:
                findings.append(Finding(
                    id=f"finding-risk-{dim.dimension_code.value}",
                    dimension_code=dim.dimension_code,
                    type=FindingType.RISK,
                    severity="Critical",
                    confidence_level="High",
                    short_label=f"{dim.name} Critical Underperformance",
                    narrative=f"{dim.name} is at critical levels with a score of {dim.score_overall}/100. Immediate intervention is required to mitigate business risk.",
                    evidence_refs={"metrics": [f"{dim.dimension_code.value}_score"]}
                ))

        return findings

    def _build_recommendations(self, dimensions: List[Dimension], findings: List[Finding]) -> List[Recommendation]:
        """Build recommendations - Phase 1.5 quickWins become recommendations"""
        recommendations = []
        priority_rank = 1

        # PRIORITY: Convert Phase 1.5 quick wins to recommendations
        if self.phase1_5 and 'categoryAnalyses' in self.phase1_5:
            for cat in self.phase1_5['categoryAnalyses']:
                dim_code = DimensionCode(self._normalize_dim_code(cat['categoryCode']))

                for qw in cat.get('quickWins', []):
                    # Map effort to horizon
                    effort = qw.get('effort', 'medium').lower() if isinstance(qw.get('effort'), str) else 'medium'
                    horizon_map = {
                        'low': RecommendationHorizon.NINETY_DAYS,
                        'medium': RecommendationHorizon.TWELVE_MONTHS,
                        'high': RecommendationHorizon.TWENTY_FOUR_MONTHS_PLUS
                    }
                    horizon = horizon_map.get(effort, RecommendationHorizon.NINETY_DAYS)

                    # Map impact to priority and scores
                    impact = qw.get('impact', 'medium').lower() if isinstance(qw.get('impact'), str) else 'medium'
                    impact_score_map = {'high': 85, 'medium': 65, 'low': 45}
                    effort_score_map = {'low': 30, 'medium': 55, 'high': 80}

                    impact_score = impact_score_map.get(impact, 65)
                    effort_score = effort_score_map.get(effort, 55)

                    # Find related findings for this dimension
                    linked_finding_ids = [
                        f.id for f in findings
                        if f.dimension_code == dim_code and f.type in [FindingType.GAP, FindingType.RISK]
                    ]

                    # Build expected outcomes with ROI if available
                    expected_outcomes = qw.get('description', '')
                    if qw.get('estimatedROI'):
                        expected_outcomes += f" Expected ROI: {qw['estimatedROI']}"

                    recommendations.append(Recommendation(
                        id=f"rec-{priority_rank:03d}",
                        dimension_code=dim_code,
                        linked_finding_ids=linked_finding_ids[:3] if linked_finding_ids else [],
                        theme=qw.get('title', 'Improvement Initiative'),
                        priority_rank=priority_rank,
                        impact_score=impact_score,
                        effort_score=effort_score,
                        horizon=horizon,
                        required_capabilities=[cat.get('categoryName', dim_code.value), "Change Management"],
                        action_steps=[
                            qw.get('description', 'Implement improvement initiative'),
                            f"Target timeline: {qw.get('timeline', '90 days')}",
                            "Monitor progress and measure outcomes",
                            "Document learnings and best practices"
                        ],
                        expected_outcomes=expected_outcomes
                    ))
                    priority_rank += 1

            # Add strategic recommendations from Phase 1.5 overall summary
            if self.phase1_5.get('overallSummary', {}).get('topOpportunities'):
                for opp in self.phase1_5['overallSummary']['topOpportunities'][:5]:
                    recommendations.append(Recommendation(
                        id=f"rec-{priority_rank:03d}",
                        dimension_code=DimensionCode.STR,  # Strategic cross-cutting
                        linked_finding_ids=[],
                        theme=opp if isinstance(opp, str) else str(opp),
                        priority_rank=priority_rank,
                        impact_score=80,
                        effort_score=60,
                        horizon=RecommendationHorizon.TWELVE_MONTHS,
                        required_capabilities=["Strategic Planning", "Cross-functional Leadership"],
                        action_steps=[
                            f"Strategic opportunity: {opp}",
                            "Develop detailed implementation plan",
                            "Assign executive sponsor and project team",
                            "Establish milestones and success metrics"
                        ],
                        expected_outcomes=f"Strategic improvement through: {opp}"
                    ))
                    priority_rank += 1

            print(f"  ✓ Generated {len(recommendations)} recommendations from Phase 1.5 analysis")
            return recommendations

        # FALLBACK: Original generation logic
        print("  ⚠ Using generic recommendation generation (Phase 1.5 not available)")
        sorted_dims = sorted(dimensions, key=lambda d: d.score_overall)

        for dim in sorted_dims:
            if dim.score_overall >= 80:
                continue  # Skip excellence tier

            linked_findings = [
                f.id for f in findings
                if f.dimension_code == dim.dimension_code and f.type in [FindingType.GAP, FindingType.RISK]
            ]

            if not linked_findings:
                continue

            # Determine horizon
            if dim.score_overall < 40:
                horizon = RecommendationHorizon.NINETY_DAYS
            elif dim.score_overall < 60:
                horizon = RecommendationHorizon.TWELVE_MONTHS
            else:
                horizon = RecommendationHorizon.TWENTY_FOUR_MONTHS_PLUS

            impact_score = 100 - dim.score_overall
            effort_score = 70 if dim.score_overall < 40 else 50

            recommendations.append(Recommendation(
                id=f"rec-{dim.dimension_code.value}-{priority_rank}",
                dimension_code=dim.dimension_code,
                linked_finding_ids=linked_findings,
                theme=f"{dim.name} Improvement Initiative",
                priority_rank=priority_rank,
                impact_score=impact_score,
                effort_score=effort_score,
                horizon=horizon,
                required_capabilities=[dim.name, "Change Management"],
                action_steps=[
                    f"Conduct detailed {dim.name.lower()} assessment",
                    "Develop improvement plan with measurable KPIs",
                    "Implement quick wins within first 30 days",
                    "Monitor progress and adjust approach",
                    "Document and share best practices"
                ],
                expected_outcomes=f"Improve {dim.name} score from {dim.score_overall} to {min(100, dim.score_overall + 20)} within the target horizon."
            ))

            priority_rank += 1

        return recommendations

    def _build_quick_wins(self, recommendations: List[Recommendation]) -> List[QuickWin]:
        """Build quick wins - extract from Phase 1.5 or filter from recommendations"""
        quick_wins = []

        # PRIORITY: Use Phase 1.5 quick wins directly (filter to low/medium effort)
        if self.phase1_5 and 'categoryAnalyses' in self.phase1_5:
            # Find recommendations that came from Phase 1.5 quick wins with low effort
            for rec in recommendations:
                # Check if this is a low-effort, high-impact recommendation
                if rec.effort_score <= 40 and rec.impact_score >= 60:
                    quick_wins.append(QuickWin(recommendation_id=rec.id))
                    if len(quick_wins) >= 10:
                        break

            # If not enough, add 90-day horizon items
            if len(quick_wins) < 5:
                for rec in recommendations:
                    if rec.horizon == RecommendationHorizon.NINETY_DAYS:
                        if not any(qw.recommendation_id == rec.id for qw in quick_wins):
                            quick_wins.append(QuickWin(recommendation_id=rec.id))
                            if len(quick_wins) >= 10:
                                break

            print(f"  ✓ Generated {len(quick_wins)} quick wins from Phase 1.5 analysis")
            return quick_wins

        # FALLBACK: Filter recommendations for quick wins
        print("  ⚠ Deriving quick wins from recommendations (Phase 1.5 not available)")

        # High impact, low effort, short horizon
        for rec in recommendations:
            if rec.impact_score >= 60 and rec.effort_score < 50 and rec.horizon == RecommendationHorizon.NINETY_DAYS:
                quick_wins.append(QuickWin(recommendation_id=rec.id))

        # If not enough, add top by impact/effort ratio
        if len(quick_wins) < 3:
            sorted_recs = sorted(
                recommendations,
                key=lambda r: r.impact_score / max(r.effort_score, 1),
                reverse=True
            )
            for rec in sorted_recs[:5]:
                if not any(qw.recommendation_id == rec.id for qw in quick_wins):
                    quick_wins.append(QuickWin(recommendation_id=rec.id))
                if len(quick_wins) >= 5:
                    break

        return quick_wins

    def _build_risks(self, dimensions: List[Dimension], findings: List[Finding]) -> List[Risk]:
        """Build risks - use Phase 1.5 categoryRisks if available"""
        risks = []
        risk_id = 1

        # PRIORITY: Extract risks from Phase 1.5 category analyses
        if self.phase1_5 and 'categoryAnalyses' in self.phase1_5:
            for cat in self.phase1_5['categoryAnalyses']:
                dim_code = self._normalize_dim_code(cat['categoryCode'])

                for category_risk in cat.get('categoryRisks', []):
                    # Map likelihood/impact to IDM format
                    likelihood_map = {'low': 'Low', 'medium': 'Medium', 'high': 'High'}
                    impact_map = {'low': 'Low', 'medium': 'Medium', 'high': 'High'}

                    likelihood = category_risk.get('likelihood', 'medium')
                    impact = category_risk.get('impact', 'medium')

                    # Determine severity based on likelihood x impact
                    risk_level = likelihood_map.get(likelihood.lower() if isinstance(likelihood, str) else 'medium', 'Medium')
                    impact_level = impact_map.get(impact.lower() if isinstance(impact, str) else 'medium', 'Medium')

                    # Calculate severity from likelihood and impact
                    severity_matrix = {
                        ('High', 'High'): 'Critical',
                        ('High', 'Medium'): 'High',
                        ('Medium', 'High'): 'High',
                        ('Medium', 'Medium'): 'Medium',
                        ('Low', 'High'): 'Medium',
                        ('High', 'Low'): 'Medium',
                        ('Medium', 'Low'): 'Low',
                        ('Low', 'Medium'): 'Low',
                        ('Low', 'Low'): 'Low'
                    }
                    severity = severity_matrix.get((risk_level, impact_level), 'Medium')

                    # Build narrative with mitigation
                    narrative = category_risk.get('description', '')
                    if category_risk.get('mitigation'):
                        narrative += f" Mitigation: {category_risk['mitigation']}"

                    risks.append(Risk(
                        id=f"risk-{risk_id:03d}",
                        dimension_code=DimensionCode(dim_code),
                        severity=severity,
                        likelihood=risk_level,
                        narrative=narrative,
                        category=cat.get('categoryName', DIMENSION_METADATA[DimensionCode(dim_code)].name)
                    ))
                    risk_id += 1

            print(f"  ✓ Generated {len(risks)} risks from Phase 1.5 analysis")
            return risks

        # FALLBACK: Original finding-based risk generation
        print("  ⚠ Using finding-based risk generation (Phase 1.5 not available)")
        risk_findings = [f for f in findings if f.type == FindingType.RISK or f.severity == "Critical"]

        for finding in risk_findings:
            risks.append(Risk(
                id=f"risk-{finding.id}",
                dimension_code=finding.dimension_code,
                severity=finding.severity,
                likelihood="High",
                narrative=finding.narrative,
                category=DIMENSION_METADATA[finding.dimension_code].name
            ))

        return risks

    def _build_roadmap(self, recommendations: List[Recommendation]) -> Roadmap:
        """Build roadmap from recommendations"""
        phases = []

        # Phase 1: Quick Wins (0-90 days)
        phase1_recs = [r for r in recommendations if r.horizon == RecommendationHorizon.NINETY_DAYS]
        if phase1_recs:
            phases.append(RoadmapPhase(
                id="phase-1",
                name="Foundation & Quick Wins",
                time_horizon="0-90 days",
                linked_recommendation_ids=[r.id for r in phase1_recs],
                narrative="Focus on immediate value creation through quick wins and critical risk mitigation. Build momentum with visible early successes."
            ))

        # Phase 2: Core Improvements (3-12 months)
        phase2_recs = [r for r in recommendations if r.horizon == RecommendationHorizon.TWELVE_MONTHS]
        if phase2_recs:
            phases.append(RoadmapPhase(
                id="phase-2",
                name="Core Capability Building",
                time_horizon="3-12 months",
                linked_recommendation_ids=[r.id for r in phase2_recs],
                narrative="Implement foundational improvements across key dimensions. Establish new processes and capabilities."
            ))

        # Phase 3: Strategic Transformation (12-24+ months)
        phase3_recs = [r for r in recommendations if r.horizon == RecommendationHorizon.TWENTY_FOUR_MONTHS_PLUS]
        if phase3_recs:
            phases.append(RoadmapPhase(
                id="phase-3",
                name="Strategic Transformation",
                time_horizon="12-24+ months",
                linked_recommendation_ids=[r.id for r in phase3_recs],
                narrative="Execute long-term strategic initiatives. Transform organizational capabilities for sustained competitive advantage."
            ))

        # Fallback
        if not phases:
            phases.append(RoadmapPhase(
                id="phase-continuous",
                name="Continuous Improvement",
                time_horizon="Ongoing",
                linked_recommendation_ids=[r.id for r in recommendations[:3]],
                narrative="Maintain focus on continuous improvement across all dimensions to sustain excellence."
            ))

        return Roadmap(phases=phases)

    def _build_scores_summary(self, chapters: List[Chapter], dimensions: List[Dimension], findings: List[Finding]) -> ScoresSummary:
        """Build scores summary"""
        overall_score = round(sum(c.score_overall for c in chapters) / len(chapters), 1) if chapters else 60.0
        descriptor = get_health_descriptor(overall_score)

        # Determine trajectory
        improving_count = sum(1 for cat in self.category_scores if cat.trend == "improving")
        declining_count = sum(1 for cat in self.category_scores if cat.trend == "declining")

        if improving_count > declining_count + 2:
            trajectory = Trajectory.IMPROVING
        elif declining_count > improving_count + 2:
            trajectory = Trajectory.DECLINING
        else:
            trajectory = Trajectory.FLAT

        # Key imperatives from lowest-scoring dimensions
        sorted_dims = sorted(dimensions, key=lambda d: d.score_overall)
        key_imperatives = [
            f"Improve {d.name} (currently {d.score_overall}/100)"
            for d in sorted_dims[:3]
        ]

        return ScoresSummary(
            overall_health_score=overall_score,
            descriptor=descriptor,
            trajectory=trajectory,
            key_imperatives=key_imperatives
        )

    # =========================================================================
    # PHASE 4 COMPILATION (LEGACY)
    # =========================================================================

    def compile_phase4_json(self) -> Dict:
        """Compile complete Phase 4 summaries JSON (legacy format)"""
        company_id = self.phase1.get('company_profile_id', 'unknown')

        return {
            "phase": "phase_4",
            "status": "complete",
            "company_profile_id": company_id,
            "phase3_reference": f"phase3-results-{company_id}",
            "summaries": {
                "strength_summary": self.compile_strength_summary(),
                "challenge_summary": self.compile_challenge_summary(),
                "trajectory_summary": self.compile_trajectory_summary(),
                "aspirational_outcome": self.compile_aspirational_outcome(),
                "findings": self.compile_findings_legacy(),
                "health_status": self.compile_health_status(),
                "performance_analysis": self.compile_performance_analysis(),
                "imperatives": self.compile_imperatives(),
                "financial_projections": self.compile_financial_projections(),
                "quick_wins": self.compile_quick_wins_legacy(),
                "trend_analysis": self.compile_trend_analysis(),
                "benchmarking": self.compile_benchmarking(),
                "risk_assessment": self.compile_risk_assessment(),
                "interdependencies": self.compile_interdependencies()
            },
            "metadata": {
                "compiled_at": datetime.utcnow().isoformat() + "Z",
                "compiler_version": "2.0.0",
                "data_sources": {
                    "phase1": bool(self.phase1),
                    "phase2": bool(self.phase2),
                    "phase3": bool(self.phase3),
                    "webhook": bool(self.webhook_data)
                }
            }
        }

    def compile_strength_summary(self) -> str:
        top_categories = sorted(self.category_scores, key=lambda x: x.score, reverse=True)[:3]
        strengths = [f"{cat.name} ({cat.score:.0f}/100)" for cat in top_categories if cat.score >= 70]
        return " | ".join(strengths) if strengths else "Organization shows foundational capabilities requiring optimization"

    def compile_challenge_summary(self) -> str:
        bottom_categories = sorted(self.category_scores, key=lambda x: x.score)[:3]
        challenges = [f"{cat.name} ({cat.score:.0f}/100)" for cat in bottom_categories if cat.score < 60]
        return " | ".join(challenges) if challenges else "No critical challenges identified"

    def compile_trajectory_summary(self) -> str:
        avg_score = sum(c.score for c in self.category_scores) / len(self.category_scores)
        declining_count = sum(1 for c in self.category_scores if c.trend == "declining")
        if declining_count >= 3:
            return f"Declining trajectory (avg: {avg_score:.0f}/100) - {declining_count} categories declining"
        elif declining_count >= 2:
            return f"Mixed trajectory (avg: {avg_score:.0f}/100) with concerning decline in {declining_count} areas"
        return f"Stable trajectory (avg: {avg_score:.0f}/100) with improvement opportunities"

    def compile_aspirational_outcome(self) -> str:
        avg_score = sum(c.score for c in self.category_scores) / len(self.category_scores)
        target_score = min(avg_score + 15, 95)
        return f"Transform to industry-leading performance (target: {target_score:.0f}/100) through systematic excellence initiatives"

    def compile_findings_legacy(self) -> List[Dict]:
        findings = []
        weakest = min(self.category_scores, key=lambda x: x.score)
        if weakest.score < 50:
            gap_pct = ((70 - weakest.score) / 70 * 100)
            findings.append({
                "title": f"{weakest.name} Critical Underperformance",
                "description": f"Score of {weakest.score:.0f}/100 represents {gap_pct:.0f}% gap vs benchmark",
                "severity": "Critical" if weakest.score < 40 else "High",
                "affected_areas": [weakest.name],
                "timeframe": "Immediate action required"
            })
        return findings

    def compile_health_status(self) -> Dict:
        avg_score = sum(c.score for c in self.category_scores) / len(self.category_scores)
        descriptor = get_health_descriptor(avg_score)
        return {
            "descriptor": descriptor,
            "score": round(avg_score, 1),
            "explanation": f"Overall business health score of {avg_score:.1f}/100 indicates {descriptor.lower()} organizational state"
        }

    def compile_performance_analysis(self) -> Dict:
        top3 = sorted(self.category_scores, key=lambda x: x.score, reverse=True)[:3]
        bottom3 = sorted(self.category_scores, key=lambda x: x.score)[:3]
        return {
            "top3_categories": [c.name for c in top3],
            "top_performance_avg": round(sum(c.score for c in top3) / 3, 1),
            "bottom3_categories": [c.name for c in bottom3],
            "bottom_performance_avg": round(sum(c.score for c in bottom3) / 3, 1),
            "performance_gap": round((sum(c.score for c in top3) - sum(c.score for c in bottom3)) / 3, 1)
        }

    def compile_imperatives(self) -> List[Dict]:
        imperatives = []
        weakest = min(self.category_scores, key=lambda x: x.score)
        imperatives.append({
            "title": f"Transform {weakest.name}",
            "priority": "Critical",
            "description": f"Address {weakest.score:.0f}/100 performance gap",
            "timeframe": "0-6 months",
            "expected_roi": 5.0
        })
        return imperatives

    def compile_financial_projections(self) -> Dict:
        return {
            "90_day_value": 1250000,
            "annual_value": 5000000,
            "roi_90day": 8.3,
            "investment_required": 150000
        }

    def compile_quick_wins_legacy(self) -> List[Dict]:
        return [{
            "title": "Process Optimization Initiative",
            "timeframe": "30 days",
            "investment": 50000,
            "expected_value": 400000,
            "roi": 8.0
        }]

    def compile_trend_analysis(self) -> Dict:
        return {
            "declining_categories": [c.name for c in self.category_scores if c.trend == "declining"],
            "stable_categories": [c.name for c in self.category_scores if c.trend == "stable"],
            "improving_categories": [c.name for c in self.category_scores if c.trend == "improving"]
        }

    def compile_benchmarking(self) -> Dict:
        return {
            "overall_percentile": round(sum(c.percentile for c in self.category_scores) / len(self.category_scores)),
            "categories": {c.name: c.percentile for c in self.category_scores}
        }

    def compile_risk_assessment(self) -> Dict:
        high_risk = [c for c in self.category_scores if c.score < 45]
        return {
            "high_risk_areas": [c.name for c in high_risk],
            "risk_count": len(high_risk),
            "mitigation_priority": "Immediate" if high_risk else "Standard"
        }

    def compile_interdependencies(self) -> List[Dict]:
        return [{
            "source": "People Leadership",
            "impacts": ["Operations", "Revenue", "Financial"],
            "description": "Cultural health affects all organizational dimensions"
        }]


def main():
    """Main execution function"""
    if len(sys.argv) < 4:
        print("Usage: python phase4-idm-compiler.py <phase1.json> <phase2.json> <phase3.json> [phase1_5.json] [webhook.json]")
        sys.exit(1)

    phase1_path = sys.argv[1]
    phase2_path = sys.argv[2]
    phase3_path = sys.argv[3]

    # Optional Phase 1.5 (new) - check if arg exists and is a phase1_5 file
    phase1_5_path = None
    webhook_path = None

    if len(sys.argv) > 4:
        # Determine if 4th arg is phase1_5 or webhook based on filename pattern
        arg4 = sys.argv[4]
        if 'phase1_5' in arg4.lower() or 'phase1-5' in arg4.lower():
            phase1_5_path = arg4
            webhook_path = sys.argv[5] if len(sys.argv) > 5 else None
        else:
            # Legacy: 4th arg is webhook
            webhook_path = arg4

    print("Phase 4 + IDM Compilation Engine Starting...")
    print(f"  Phase 1: {Path(phase1_path).name}")
    print(f"  Phase 2: {Path(phase2_path).name}")
    print(f"  Phase 3: {Path(phase3_path).name}")
    if phase1_5_path:
        print(f"  Phase 1.5: {Path(phase1_5_path).name} [AUTHORITATIVE SOURCE]")
    if webhook_path:
        print(f"  Webhook: {Path(webhook_path).name}")

    compiler = Phase4IDMCompiler(phase1_path, phase2_path, phase3_path, phase1_5_path, webhook_path)

    # Run Phase 1.5 integration validation
    validation_issues = compiler.validate_phase15_integration()
    if validation_issues:
        print("\n  Phase 1.5 Integration Validation:")
        for issue in validation_issues:
            print(f"    - {issue}")

    # Generate Phase 4 output
    phase4_output = compiler.compile_phase4_json()
    company_id = phase4_output['company_profile_id']
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S-%f")[:-3] + "Z"

    # Generate IDM
    idm = compiler.compile_idm()
    idm_dict = idm_to_dict(idm)

    # Enrich IDM with Phase 1.5 cross-category insights
    idm_dict = compiler.enrich_idm_dict(idm_dict)

    # Create output directory
    output_dir = Path("output/phase4")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write Phase 4 output
    phase4_filename = f"phase4-summaries-{company_id}-{timestamp}.json"
    phase4_path = output_dir / phase4_filename
    with open(phase4_path, 'w') as f:
        json.dump(phase4_output, f, indent=2)

    # Write IDM output
    idm_filename = f"idm-{company_id}-{timestamp}.json"
    idm_path = output_dir / idm_filename
    with open(idm_path, 'w') as f:
        json.dump(idm_dict, f, indent=2)

    # Write master analysis (combined) with Phase 1.5 integration metadata
    master_filename = f"master-analysis-{company_id}-{timestamp}.json"
    master_path = output_dir / master_filename
    master_output = {
        "meta": {
            "company_profile_id": company_id,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "phases_included": ["phase1", "phase1_5", "phase2", "phase3", "phase4"] if compiler.using_phase1_5
                              else ["phase1", "phase2", "phase3", "phase4"],
            "idm_path": str(idm_path),
            "phase1_5_integration": {
                "used": compiler.using_phase1_5,
                "categories_integrated": len(compiler.phase1_5.get('categoryAnalyses', [])) if compiler.using_phase1_5 else 0,
                "data_source": "phase1_5_output.json" if compiler.using_phase1_5 else "webhook_calculation",
                "validation_issues": validation_issues
            }
        },
        "phases": {
            "phase1": compiler.phase1,
            "phase2": compiler.phase2,
            "phase3": compiler.phase3,
            "phase4": phase4_output
        },
        "idm_summary": {
            "overall_health_score": idm_dict['scores_summary']['overall_health_score'],
            "trajectory": idm_dict['scores_summary']['trajectory'],
            "chapters_count": len(idm_dict['chapters']),
            "dimensions_count": len(idm_dict['dimensions']),
            "findings_count": len(idm_dict['findings']),
            "recommendations_count": len(idm_dict['recommendations']),
            "quick_wins_count": len(idm_dict['quick_wins']),
            "risks_count": len(idm_dict['risks']),
            "has_cross_category_insights": 'cross_category_insights' in idm_dict,
            "has_phase15_health": 'phase15_overall_health' in idm_dict
        }
    }

    # Include Phase 1.5 data in master output if available
    if compiler.using_phase1_5:
        master_output["phases"]["phase1_5"] = compiler.phase1_5

    with open(master_path, 'w') as f:
        json.dump(master_output, f, indent=2)

    print(f"\n  Phase 4 compilation complete!")
    print(f"    Phase 4 Output: {phase4_path}")
    print(f"    IDM Output: {idm_path}")
    print(f"    Master Analysis: {master_path}")
    print(f"    Categories analyzed: {len(compiler.category_scores)}")
    print(f"    IDM dimensions: {len(idm_dict['dimensions'])}")
    print(f"    IDM findings: {len(idm_dict['findings'])}")
    print(f"    IDM recommendations: {len(idm_dict['recommendations'])}")
    print(f"    IDM quick wins: {len(idm_dict['quick_wins'])}")
    print(f"    IDM risks: {len(idm_dict['risks'])}")
    if compiler.using_phase1_5:
        print(f"    Phase 1.5 integrated: YES (authoritative source)")
    else:
        print(f"    Phase 1.5 integrated: NO (fallback mode)")


if __name__ == "__main__":
    main()
