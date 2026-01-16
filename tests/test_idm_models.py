#!/usr/bin/env python3
"""
BizHealth IDM Models Tests

Tests for Python IDM models, validation, and transformation.
"""

import json
import pytest
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from idm_models import (
    IDM, Meta, Chapter, Dimension, SubIndicator, Question, Finding,
    Recommendation, QuickWin, Risk, RoadmapPhase, Roadmap, ScoresSummary,
    ChapterCode, DimensionCode, FindingType, RecommendationHorizon, ScoreBand, Trajectory,
    DIMENSION_METADATA, SUB_INDICATOR_DEFINITIONS, QUESTION_MAPPINGS, CHAPTER_NAMES,
    get_score_band, get_chapter_for_dimension, get_dimensions_for_chapter,
    calculate_chapter_score, calculate_overall_health_score, get_health_descriptor,
    determine_trajectory, idm_to_dict, validate_idm
)


# ============================================================================
# MODEL VALIDATION TESTS
# ============================================================================

class TestMetaModel:
    def test_valid_meta(self):
        meta = Meta(
            assessment_run_id="123e4567-e89b-12d3-a456-426614174000",
            company_profile_id="123e4567-e89b-12d3-a456-426614174001",
            created_at="2025-01-15T10:30:00.000Z"
        )
        assert meta.assessment_run_id == "123e4567-e89b-12d3-a456-426614174000"
        assert meta.methodology_version == "1.0.0"

    def test_default_versions(self):
        meta = Meta(
            assessment_run_id="test-id",
            company_profile_id="test-company",
            created_at="2025-01-15T10:30:00Z"
        )
        assert meta.methodology_version == "1.0.0"
        assert meta.scoring_version == "1.0.0"
        assert meta.idm_schema_version == "1.0.0"


class TestChapterModel:
    def test_valid_chapter(self):
        chapter = Chapter(
            chapter_code=ChapterCode.GE,
            name="Growth Engine",
            score_overall=75.0,
            score_band=ScoreBand.PROFICIENCY
        )
        assert chapter.chapter_code == ChapterCode.GE
        assert chapter.score_overall == 75.0

    def test_chapter_with_benchmark(self):
        from idm_models import Benchmark
        chapter = Chapter(
            chapter_code=ChapterCode.PH,
            name="Performance & Health",
            score_overall=80.0,
            score_band=ScoreBand.EXCELLENCE,
            benchmark=Benchmark(peer_percentile=75.0, band_description="Top quartile")
        )
        assert chapter.benchmark.peer_percentile == 75.0


class TestDimensionModel:
    def test_valid_dimension(self):
        dimension = Dimension(
            dimension_code=DimensionCode.STR,
            chapter_code=ChapterCode.GE,
            name="Strategy",
            description="Strategic planning",
            score_overall=68.0,
            score_band=ScoreBand.PROFICIENCY,
            sub_indicators=[]
        )
        assert dimension.dimension_code == DimensionCode.STR
        assert dimension.chapter_code == ChapterCode.GE

    def test_dimension_with_sub_indicators(self):
        sub = SubIndicator(
            id="STR_001",
            dimension_code=DimensionCode.STR,
            name="Competitive Differentiation",
            score=70.0,
            contributing_question_ids=["strategy_q1"]
        )
        dimension = Dimension(
            dimension_code=DimensionCode.STR,
            chapter_code=ChapterCode.GE,
            name="Strategy",
            description="Strategic planning",
            score_overall=70.0,
            score_band=ScoreBand.PROFICIENCY,
            sub_indicators=[sub]
        )
        assert len(dimension.sub_indicators) == 1
        assert dimension.sub_indicators[0].name == "Competitive Differentiation"


class TestFindingModel:
    def test_valid_finding(self):
        finding = Finding(
            id="finding-gap-MKT",
            dimension_code=DimensionCode.MKT,
            type=FindingType.GAP,
            severity="High",
            confidence_level="High",
            short_label="Marketing Gap",
            narrative="Marketing performance is below expectations."
        )
        assert finding.type == FindingType.GAP
        assert finding.dimension_code == DimensionCode.MKT

    def test_finding_with_numeric_severity(self):
        finding = Finding(
            id="finding-risk-FIN",
            dimension_code=DimensionCode.FIN,
            type=FindingType.RISK,
            severity=85,
            confidence_level=90,
            short_label="Financial Risk",
            narrative="Significant financial risk identified."
        )
        assert finding.severity == 85


class TestRecommendationModel:
    def test_valid_recommendation(self):
        rec = Recommendation(
            id="rec-MKT-1",
            dimension_code=DimensionCode.MKT,
            linked_finding_ids=["finding-gap-MKT"],
            theme="Marketing Improvement Initiative",
            priority_rank=1,
            impact_score=75.0,
            effort_score=45.0,
            horizon=RecommendationHorizon.NINETY_DAYS,
            action_steps=["Step 1", "Step 2"],
            expected_outcomes="Improve marketing score by 20 points."
        )
        assert rec.horizon == RecommendationHorizon.NINETY_DAYS
        assert rec.priority_rank == 1


# ============================================================================
# HELPER FUNCTION TESTS
# ============================================================================

class TestHelperFunctions:
    def test_get_score_band(self):
        assert get_score_band(90) == ScoreBand.EXCELLENCE
        assert get_score_band(80) == ScoreBand.EXCELLENCE
        assert get_score_band(70) == ScoreBand.PROFICIENCY
        assert get_score_band(60) == ScoreBand.PROFICIENCY
        assert get_score_band(50) == ScoreBand.ATTENTION
        assert get_score_band(30) == ScoreBand.CRITICAL

    def test_get_chapter_for_dimension(self):
        assert get_chapter_for_dimension(DimensionCode.STR) == ChapterCode.GE
        assert get_chapter_for_dimension(DimensionCode.OPS) == ChapterCode.PH
        assert get_chapter_for_dimension(DimensionCode.HRS) == ChapterCode.PL
        assert get_chapter_for_dimension(DimensionCode.TIN) == ChapterCode.RS

    def test_get_dimensions_for_chapter(self):
        ge_dims = get_dimensions_for_chapter(ChapterCode.GE)
        assert len(ge_dims) == 4
        assert DimensionCode.STR in ge_dims
        assert DimensionCode.SAL in ge_dims

    def test_get_health_descriptor(self):
        assert get_health_descriptor(90) == "Excellent Health"
        assert get_health_descriptor(80) == "Good Health"
        assert get_health_descriptor(70) == "Fair Health"
        assert get_health_descriptor(55) == "Needs Improvement"
        assert get_health_descriptor(30) == "Critical Condition"

    def test_determine_trajectory(self):
        assert determine_trajectory(80, 70) == Trajectory.IMPROVING
        assert determine_trajectory(60, 70) == Trajectory.DECLINING
        assert determine_trajectory(70, 68) == Trajectory.FLAT
        assert determine_trajectory(70, None) == Trajectory.FLAT


# ============================================================================
# CONSTANTS TESTS
# ============================================================================

class TestConstants:
    def test_chapter_names(self):
        assert len(CHAPTER_NAMES) == 4
        assert CHAPTER_NAMES[ChapterCode.GE] == "Growth Engine"
        assert CHAPTER_NAMES[ChapterCode.RS] == "Resilience & Safeguards"

    def test_dimension_metadata(self):
        assert len(DIMENSION_METADATA) == 12
        assert DIMENSION_METADATA[DimensionCode.STR].name == "Strategy"
        assert DIMENSION_METADATA[DimensionCode.STR].chapter == ChapterCode.GE

    def test_sub_indicator_definitions(self):
        assert len(SUB_INDICATOR_DEFINITIONS) == 12
        for code, indicators in SUB_INDICATOR_DEFINITIONS.items():
            assert 3 <= len(indicators) <= 5

    def test_question_mappings(self):
        assert len(QUESTION_MAPPINGS) > 80
        # Verify all mappings have valid dimension codes
        valid_codes = [c.value for c in DimensionCode]
        for mapping in QUESTION_MAPPINGS:
            assert mapping.dimension_code.value in valid_codes


# ============================================================================
# FULL IDM VALIDATION TESTS
# ============================================================================

class TestFullIDMValidation:
    @pytest.fixture
    def valid_idm_data(self):
        return {
            "meta": {
                "assessment_run_id": "123e4567-e89b-12d3-a456-426614174000",
                "company_profile_id": "123e4567-e89b-12d3-a456-426614174001",
                "created_at": "2025-01-15T10:30:00.000Z",
                "methodology_version": "1.0.0",
                "scoring_version": "1.0.0",
                "idm_schema_version": "1.0.0"
            },
            "chapters": [
                {"chapter_code": "GE", "name": "Growth Engine", "score_overall": 70, "score_band": "Proficiency"},
                {"chapter_code": "PH", "name": "Performance & Health", "score_overall": 75, "score_band": "Proficiency"},
                {"chapter_code": "PL", "name": "People & Leadership", "score_overall": 55, "score_band": "Attention"},
                {"chapter_code": "RS", "name": "Resilience & Safeguards", "score_overall": 80, "score_band": "Excellence"}
            ],
            "dimensions": [
                {
                    "dimension_code": "STR",
                    "chapter_code": "GE",
                    "name": "Strategy",
                    "description": "Strategic planning",
                    "score_overall": 68,
                    "score_band": "Proficiency",
                    "sub_indicators": []
                }
            ],
            "questions": [],
            "findings": [
                {
                    "id": "finding-1",
                    "dimension_code": "STR",
                    "type": "strength",
                    "severity": "Low",
                    "confidence_level": "High",
                    "short_label": "Test Finding",
                    "narrative": "Test narrative"
                }
            ],
            "recommendations": [
                {
                    "id": "rec-1",
                    "dimension_code": "STR",
                    "linked_finding_ids": ["finding-1"],
                    "theme": "Test Theme",
                    "priority_rank": 1,
                    "impact_score": 70,
                    "effort_score": 50,
                    "horizon": "90_days",
                    "action_steps": ["Step 1"],
                    "expected_outcomes": "Test outcomes"
                }
            ],
            "quick_wins": [{"recommendation_id": "rec-1"}],
            "risks": [],
            "roadmap": {
                "phases": [
                    {
                        "id": "phase-1",
                        "name": "Phase 1",
                        "time_horizon": "0-90 days",
                        "linked_recommendation_ids": ["rec-1"],
                        "narrative": "Test phase"
                    }
                ]
            },
            "scores_summary": {
                "overall_health_score": 70,
                "descriptor": "Fair Health",
                "trajectory": "Flat",
                "key_imperatives": ["Improve Strategy"]
            }
        }

    def test_validate_valid_idm(self, valid_idm_data):
        idm = validate_idm(valid_idm_data)
        assert idm.meta.assessment_run_id == "123e4567-e89b-12d3-a456-426614174000"
        assert len(idm.chapters) == 4
        assert idm.scores_summary.overall_health_score == 70

    def test_idm_to_dict(self, valid_idm_data):
        idm = validate_idm(valid_idm_data)
        result = idm_to_dict(idm)
        assert isinstance(result, dict)
        assert result["meta"]["assessment_run_id"] == "123e4567-e89b-12d3-a456-426614174000"


# ============================================================================
# SAMPLE WEBHOOK INTEGRATION TEST
# ============================================================================

class TestWebhookIntegration:
    @pytest.fixture
    def sample_webhook_path(self):
        return Path(__file__).parent.parent / 'sample_webhook.json'

    def test_sample_webhook_exists(self, sample_webhook_path):
        if not sample_webhook_path.exists():
            pytest.skip("sample_webhook.json not found")

        with open(sample_webhook_path, 'r') as f:
            webhook_data = json.load(f)

        assert 'business_overview' in webhook_data
        assert 'strategy' in webhook_data
        assert 'sales' in webhook_data

    def test_sample_webhook_has_required_categories(self, sample_webhook_path):
        if not sample_webhook_path.exists():
            pytest.skip("sample_webhook.json not found")

        with open(sample_webhook_path, 'r') as f:
            webhook_data = json.load(f)

        required_categories = [
            'strategy', 'sales', 'marketing', 'customer_experience',
            'operations', 'financials', 'human_resources', 'leadership',
            'technology', 'it_infrastructure', 'risk_management', 'compliance'
        ]

        for category in required_categories:
            assert category in webhook_data, f"Missing category: {category}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
