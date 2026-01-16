#!/usr/bin/env python3
"""
BizHealth.ai Insights Data Model (IDM) v1.0 - Python Models

This module provides Pydantic models mirroring the TypeScript IDM types.
Used for validation and transformation in the Phase 4 compiler and IDM consolidator.

Framework Structure:
- 4 Chapters: GE (Growth Engine), PH (Performance Health), PL (People & Leadership), RS (Resilience & Safeguards)
- 12 Dimensions: STR, SAL, MKT, CXP, OPS, FIN, HRS, LDG, TIN, IDS, RMS, CMP
- 3-5 Sub-indicators per dimension
- 87 questionnaire questions mapped to dimensions
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
from uuid import UUID


# ============================================================================
# ENUMS
# ============================================================================

class ChapterCode(str, Enum):
    """Chapter codes representing the 4 main assessment chapters"""
    GE = "GE"  # Growth Engine
    PH = "PH"  # Performance & Health
    PL = "PL"  # People & Leadership
    RS = "RS"  # Resilience & Safeguards


class DimensionCode(str, Enum):
    """Dimension codes representing the 12 assessment dimensions"""
    STR = "STR"  # Strategy
    SAL = "SAL"  # Sales
    MKT = "MKT"  # Marketing
    CXP = "CXP"  # Customer Experience
    OPS = "OPS"  # Operations
    FIN = "FIN"  # Financials
    HRS = "HRS"  # Human Resources
    LDG = "LDG"  # Leadership & Governance
    TIN = "TIN"  # Technology & Innovation
    IDS = "IDS"  # IT, Data & Systems
    RMS = "RMS"  # Risk Management & Sustainability
    CMP = "CMP"  # Compliance


class FindingType(str, Enum):
    """Types of findings"""
    STRENGTH = "strength"
    GAP = "gap"
    RISK = "risk"
    OPPORTUNITY = "opportunity"


class RecommendationHorizon(str, Enum):
    """Time horizons for recommendations"""
    NINETY_DAYS = "90_days"
    TWELVE_MONTHS = "12_months"
    TWENTY_FOUR_MONTHS_PLUS = "24_months_plus"


class ScoreBand(str, Enum):
    """Score bands for performance tier classification"""
    CRITICAL = "Critical"
    ATTENTION = "Attention"
    PROFICIENCY = "Proficiency"
    EXCELLENCE = "Excellence"


class Trajectory(str, Enum):
    """Trajectory indicators"""
    IMPROVING = "Improving"
    FLAT = "Flat"
    DECLINING = "Declining"


# ============================================================================
# CONSTANTS
# ============================================================================

CHAPTER_NAMES: Dict[ChapterCode, str] = {
    ChapterCode.GE: "Growth Engine",
    ChapterCode.PH: "Performance & Health",
    ChapterCode.PL: "People & Leadership",
    ChapterCode.RS: "Resilience & Safeguards"
}


class DimensionMetadata:
    """Dimension metadata container"""
    def __init__(self, name: str, description: str, chapter: ChapterCode):
        self.name = name
        self.description = description
        self.chapter = chapter


DIMENSION_METADATA: Dict[DimensionCode, DimensionMetadata] = {
    DimensionCode.STR: DimensionMetadata(
        "Strategy",
        "Strategic planning, market positioning, and growth strategy",
        ChapterCode.GE
    ),
    DimensionCode.SAL: DimensionMetadata(
        "Sales",
        "Sales effectiveness, pipeline management, and revenue generation",
        ChapterCode.GE
    ),
    DimensionCode.MKT: DimensionMetadata(
        "Marketing",
        "Brand awareness, customer acquisition, and marketing ROI",
        ChapterCode.GE
    ),
    DimensionCode.CXP: DimensionMetadata(
        "Customer Experience",
        "Customer satisfaction, retention, and experience quality",
        ChapterCode.GE
    ),
    DimensionCode.OPS: DimensionMetadata(
        "Operations",
        "Operational efficiency, process optimization, and workflow management",
        ChapterCode.PH
    ),
    DimensionCode.FIN: DimensionMetadata(
        "Financials",
        "Financial health, profitability, and fiscal management",
        ChapterCode.PH
    ),
    DimensionCode.HRS: DimensionMetadata(
        "Human Resources",
        "Talent management, culture, and employee engagement",
        ChapterCode.PL
    ),
    DimensionCode.LDG: DimensionMetadata(
        "Leadership & Governance",
        "Leadership effectiveness, decision-making, and organizational governance",
        ChapterCode.PL
    ),
    DimensionCode.TIN: DimensionMetadata(
        "Technology & Innovation",
        "Technology adoption, innovation culture, and digital transformation",
        ChapterCode.RS
    ),
    DimensionCode.IDS: DimensionMetadata(
        "IT, Data & Systems",
        "IT infrastructure, data management, and cybersecurity",
        ChapterCode.RS
    ),
    DimensionCode.RMS: DimensionMetadata(
        "Risk Management & Sustainability",
        "Risk identification, mitigation, and business continuity",
        ChapterCode.RS
    ),
    DimensionCode.CMP: DimensionMetadata(
        "Compliance",
        "Regulatory compliance, policy adherence, and legal requirements",
        ChapterCode.RS
    )
}


# ============================================================================
# MODELS
# ============================================================================

class Meta(BaseModel):
    """IDM Metadata"""
    assessment_run_id: str
    company_profile_id: str
    created_at: str
    methodology_version: str = "1.0.0"
    scoring_version: str = "1.0.0"
    idm_schema_version: str = "1.0.0"


class Benchmark(BaseModel):
    """Benchmark data for comparative analysis"""
    peer_percentile: float = Field(ge=0, le=100)
    band_description: str


class Chapter(BaseModel):
    """Chapter representing a major assessment grouping"""
    chapter_code: ChapterCode
    name: str
    score_overall: float = Field(ge=0, le=100)
    score_band: ScoreBand
    benchmark: Optional[Benchmark] = None
    previous_score_overall: Optional[float] = Field(None, ge=0, le=100)


class SubIndicator(BaseModel):
    """Sub-indicator representing a specific aspect within a dimension"""
    id: str
    dimension_code: DimensionCode
    name: str
    score: float = Field(ge=0, le=100)
    score_band: Optional[ScoreBand] = None
    contributing_question_ids: List[str]


class Dimension(BaseModel):
    """Dimension representing one of 12 assessment areas"""
    dimension_code: DimensionCode
    chapter_code: ChapterCode
    name: str
    description: str
    score_overall: float = Field(ge=0, le=100)
    score_band: ScoreBand
    sub_indicators: List[SubIndicator]
    benchmark: Optional[Benchmark] = None
    previous_score_overall: Optional[float] = Field(None, ge=0, le=100)


class Question(BaseModel):
    """Question mapping questionnaire responses to dimensions"""
    question_id: str
    dimension_code: DimensionCode
    sub_indicator_id: str
    raw_response: Any
    normalized_score: Optional[float] = Field(None, ge=0, le=100)


class EvidenceRefs(BaseModel):
    """Evidence references for findings and recommendations"""
    question_ids: Optional[List[str]] = None
    metrics: Optional[List[str]] = None
    benchmarks: Optional[List[str]] = None


class Finding(BaseModel):
    """Finding representing an insight from the analysis"""
    id: str
    dimension_code: DimensionCode
    sub_indicator_id: Optional[str] = None
    type: FindingType
    severity: Union[str, float, int]
    confidence_level: Union[str, float, int]
    short_label: str
    narrative: str
    evidence_refs: Optional[EvidenceRefs] = None


class Recommendation(BaseModel):
    """Recommendation for business improvement"""
    id: str
    dimension_code: DimensionCode
    linked_finding_ids: List[str]
    theme: str
    priority_rank: int = Field(gt=0)
    impact_score: float = Field(ge=0, le=100)
    effort_score: float = Field(ge=0, le=100)
    horizon: RecommendationHorizon
    required_capabilities: Optional[List[str]] = None
    action_steps: List[str]
    expected_outcomes: str


class QuickWin(BaseModel):
    """Quick win - a recommendation identified as high impact, low effort"""
    recommendation_id: str


class Risk(BaseModel):
    """Risk identified in the assessment"""
    id: str
    dimension_code: DimensionCode
    severity: Union[str, float, int]
    likelihood: Union[str, float, int]
    narrative: str
    linked_recommendation_ids: Optional[List[str]] = None
    category: Optional[str] = None


class RoadmapPhase(BaseModel):
    """Roadmap phase for implementation planning"""
    id: str
    name: str
    time_horizon: str
    linked_recommendation_ids: List[str]
    narrative: str


class Roadmap(BaseModel):
    """Complete roadmap"""
    phases: List[RoadmapPhase]


class ScoresSummary(BaseModel):
    """Overall scores summary"""
    overall_health_score: float = Field(ge=0, le=100)
    descriptor: str
    trajectory: Trajectory
    key_imperatives: List[str]


class IDM(BaseModel):
    """Complete Insights Data Model (IDM)"""
    meta: Meta
    chapters: List[Chapter]
    dimensions: List[Dimension]
    questions: List[Question]
    findings: List[Finding]
    recommendations: List[Recommendation]
    quick_wins: List[QuickWin]
    risks: List[Risk]
    roadmap: Roadmap
    scores_summary: ScoresSummary


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_score_band(score: float) -> ScoreBand:
    """Get score band from numeric score"""
    if score >= 80:
        return ScoreBand.EXCELLENCE
    if score >= 60:
        return ScoreBand.PROFICIENCY
    if score >= 40:
        return ScoreBand.ATTENTION
    return ScoreBand.CRITICAL


def get_chapter_for_dimension(dimension_code: DimensionCode) -> ChapterCode:
    """Get chapter code for a dimension"""
    return DIMENSION_METADATA[dimension_code].chapter


def get_dimensions_for_chapter(chapter_code: ChapterCode) -> List[DimensionCode]:
    """Get all dimensions for a chapter"""
    return [
        code for code, meta in DIMENSION_METADATA.items()
        if meta.chapter == chapter_code
    ]


def calculate_chapter_score(dimensions: List[Dimension], chapter_code: ChapterCode) -> float:
    """Calculate chapter score from dimensions"""
    chapter_dims = [d for d in dimensions if d.chapter_code == chapter_code]
    if not chapter_dims:
        return 0.0
    total = sum(d.score_overall for d in chapter_dims)
    return round(total / len(chapter_dims), 1)


def calculate_overall_health_score(chapters: List[Chapter]) -> float:
    """Calculate overall health score from chapters"""
    if not chapters:
        return 0.0
    total = sum(c.score_overall for c in chapters)
    return round(total / len(chapters), 1)


def get_health_descriptor(score: float) -> str:
    """Get health descriptor from score"""
    if score >= 85:
        return "Excellent Health"
    if score >= 75:
        return "Good Health"
    if score >= 65:
        return "Fair Health"
    if score >= 50:
        return "Needs Improvement"
    return "Critical Condition"


def determine_trajectory(
    current_score: float,
    previous_score: Optional[float] = None
) -> Trajectory:
    """Determine trajectory from current and previous scores"""
    if previous_score is None:
        return Trajectory.FLAT
    delta = current_score - previous_score
    if delta > 5:
        return Trajectory.IMPROVING
    if delta < -5:
        return Trajectory.DECLINING
    return Trajectory.FLAT


# ============================================================================
# SUB-INDICATOR DEFINITIONS
# ============================================================================

class SubIndicatorDef:
    """Sub-indicator definition"""
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name


SUB_INDICATOR_DEFINITIONS: Dict[DimensionCode, List[SubIndicatorDef]] = {
    DimensionCode.STR: [
        SubIndicatorDef("STR_001", "Competitive Differentiation"),
        SubIndicatorDef("STR_002", "Market Position"),
        SubIndicatorDef("STR_003", "Growth Planning"),
        SubIndicatorDef("STR_004", "Strategic Review Process"),
        SubIndicatorDef("STR_005", "Exit/Growth Strategy")
    ],
    DimensionCode.SAL: [
        SubIndicatorDef("SAL_001", "Sales Target Alignment"),
        SubIndicatorDef("SAL_002", "Pipeline Management"),
        SubIndicatorDef("SAL_003", "Sales Cycle Efficiency"),
        SubIndicatorDef("SAL_004", "Customer Retention"),
        SubIndicatorDef("SAL_005", "Upselling Effectiveness")
    ],
    DimensionCode.MKT: [
        SubIndicatorDef("MKT_001", "Brand Awareness"),
        SubIndicatorDef("MKT_002", "Customer Targeting"),
        SubIndicatorDef("MKT_003", "Marketing Economics (CAC/LTV)"),
        SubIndicatorDef("MKT_004", "Marketing ROI"),
        SubIndicatorDef("MKT_005", "Channel Strategy")
    ],
    DimensionCode.CXP: [
        SubIndicatorDef("CXP_001", "Customer Feedback Systems"),
        SubIndicatorDef("CXP_002", "Customer Satisfaction"),
        SubIndicatorDef("CXP_003", "Net Promoter Score"),
        SubIndicatorDef("CXP_004", "Issue Resolution"),
        SubIndicatorDef("CXP_005", "Response Time")
    ],
    DimensionCode.OPS: [
        SubIndicatorDef("OPS_001", "Operational Efficiency"),
        SubIndicatorDef("OPS_002", "Process Documentation"),
        SubIndicatorDef("OPS_003", "Operational Reliability"),
        SubIndicatorDef("OPS_004", "Lean Practices"),
        SubIndicatorDef("OPS_005", "Resource Utilization")
    ],
    DimensionCode.FIN: [
        SubIndicatorDef("FIN_001", "Financial Controls"),
        SubIndicatorDef("FIN_002", "Cash Management"),
        SubIndicatorDef("FIN_003", "Profitability"),
        SubIndicatorDef("FIN_004", "Financial Planning"),
        SubIndicatorDef("FIN_005", "Growth Readiness")
    ],
    DimensionCode.HRS: [
        SubIndicatorDef("HRS_001", "HR Infrastructure"),
        SubIndicatorDef("HRS_002", "Company Culture"),
        SubIndicatorDef("HRS_003", "Talent Acquisition"),
        SubIndicatorDef("HRS_004", "Employee Development"),
        SubIndicatorDef("HRS_005", "Performance Management")
    ],
    DimensionCode.LDG: [
        SubIndicatorDef("LDG_001", "Leadership Effectiveness"),
        SubIndicatorDef("LDG_002", "Decision-Making Structure"),
        SubIndicatorDef("LDG_003", "Board Oversight"),
        SubIndicatorDef("LDG_004", "Leadership Culture"),
        SubIndicatorDef("LDG_005", "Development & Mentorship")
    ],
    DimensionCode.TIN: [
        SubIndicatorDef("TIN_001", "Technology Investment"),
        SubIndicatorDef("TIN_002", "Innovation Culture"),
        SubIndicatorDef("TIN_003", "Technology Adoption"),
        SubIndicatorDef("TIN_004", "Automation Utilization"),
        SubIndicatorDef("TIN_005", "Innovation Impact")
    ],
    DimensionCode.IDS: [
        SubIndicatorDef("IDS_001", "IT Infrastructure"),
        SubIndicatorDef("IDS_002", "Network Effectiveness"),
        SubIndicatorDef("IDS_003", "Cybersecurity"),
        SubIndicatorDef("IDS_004", "Data Management"),
        SubIndicatorDef("IDS_005", "IT Scalability")
    ],
    DimensionCode.RMS: [
        SubIndicatorDef("RMS_001", "Risk Outlook"),
        SubIndicatorDef("RMS_002", "Risk Identification"),
        SubIndicatorDef("RMS_003", "Risk Mitigation"),
        SubIndicatorDef("RMS_004", "Business Continuity"),
        SubIndicatorDef("RMS_005", "Strategic Adaptability")
    ],
    DimensionCode.CMP: [
        SubIndicatorDef("CMP_001", "Compliance Awareness"),
        SubIndicatorDef("CMP_002", "Policy Adherence"),
        SubIndicatorDef("CMP_003", "Compliance Monitoring"),
        SubIndicatorDef("CMP_004", "Documentation"),
        SubIndicatorDef("CMP_005", "Incident Reporting")
    ]
}


# ============================================================================
# QUESTION MAPPINGS
# ============================================================================

class QuestionMapping:
    """Question to dimension and sub-indicator mapping"""
    def __init__(
        self,
        question_id: str,
        dimension_code: DimensionCode,
        sub_indicator_id: str,
        weight: float
    ):
        self.question_id = question_id
        self.dimension_code = dimension_code
        self.sub_indicator_id = sub_indicator_id
        self.weight = weight


QUESTION_MAPPINGS: List[QuestionMapping] = [
    # Strategy (STR) - 7 questions
    QuestionMapping("strategy_q1", DimensionCode.STR, "STR_001", 1.0),
    QuestionMapping("strategy_q2", DimensionCode.STR, "STR_002", 1.0),
    QuestionMapping("strategy_q3", DimensionCode.STR, "STR_003", 1.0),
    QuestionMapping("strategy_q4", DimensionCode.STR, "STR_003", 1.0),
    QuestionMapping("strategy_q5", DimensionCode.STR, "STR_003", 1.5),
    QuestionMapping("strategy_q6", DimensionCode.STR, "STR_004", 1.0),
    QuestionMapping("strategy_q7", DimensionCode.STR, "STR_005", 1.5),

    # Sales (SAL) - 8 questions
    QuestionMapping("sales_q1", DimensionCode.SAL, "SAL_001", 0.5),
    QuestionMapping("sales_q2", DimensionCode.SAL, "SAL_001", 1.0),
    QuestionMapping("sales_q3", DimensionCode.SAL, "SAL_002", 1.5),
    QuestionMapping("sales_q4", DimensionCode.SAL, "SAL_003", 1.0),
    QuestionMapping("sales_q5", DimensionCode.SAL, "SAL_003", 1.0),
    QuestionMapping("sales_q6", DimensionCode.SAL, "SAL_003", 1.0),
    QuestionMapping("sales_q7", DimensionCode.SAL, "SAL_004", 1.0),
    QuestionMapping("sales_q8", DimensionCode.SAL, "SAL_005", 1.0),

    # Marketing (MKT) - 9 questions
    QuestionMapping("marketing_q1", DimensionCode.MKT, "MKT_001", 1.0),
    QuestionMapping("marketing_q2", DimensionCode.MKT, "MKT_005", 0.5),
    QuestionMapping("marketing_q3", DimensionCode.MKT, "MKT_005", 0.5),
    QuestionMapping("marketing_q4", DimensionCode.MKT, "MKT_005", 0.5),
    QuestionMapping("marketing_q5", DimensionCode.MKT, "MKT_002", 1.5),
    QuestionMapping("marketing_q6", DimensionCode.MKT, "MKT_003", 1.0),
    QuestionMapping("marketing_q7", DimensionCode.MKT, "MKT_003", 1.0),
    QuestionMapping("marketing_q8", DimensionCode.MKT, "MKT_003", 1.0),
    QuestionMapping("marketing_q9", DimensionCode.MKT, "MKT_004", 1.0),

    # Customer Experience (CXP) - 7 questions
    QuestionMapping("customer_experience_q1", DimensionCode.CXP, "CXP_001", 1.0),
    QuestionMapping("customer_experience_q2", DimensionCode.CXP, "CXP_002", 1.5),
    QuestionMapping("customer_experience_q3", DimensionCode.CXP, "CXP_003", 1.5),
    QuestionMapping("customer_experience_q4", DimensionCode.CXP, "CXP_002", 1.0),
    QuestionMapping("customer_experience_q5", DimensionCode.CXP, "CXP_002", 1.0),
    QuestionMapping("customer_experience_q6", DimensionCode.CXP, "CXP_004", 1.0),
    QuestionMapping("customer_experience_q7", DimensionCode.CXP, "CXP_005", 1.0),

    # Operations (OPS) - 6 questions
    QuestionMapping("operations_q1", DimensionCode.OPS, "OPS_001", 1.5),
    QuestionMapping("operations_q2", DimensionCode.OPS, "OPS_002", 1.0),
    QuestionMapping("operations_q3", DimensionCode.OPS, "OPS_005", 1.0),
    QuestionMapping("operations_q4", DimensionCode.OPS, "OPS_003", 1.5),
    QuestionMapping("operations_q5", DimensionCode.OPS, "OPS_004", 1.0),
    QuestionMapping("operations_q6", DimensionCode.OPS, "OPS_005", 1.0),

    # Financials (FIN) - 12 questions
    QuestionMapping("financials_q1", DimensionCode.FIN, "FIN_001", 1.0),
    QuestionMapping("financials_q2", DimensionCode.FIN, "FIN_002", 1.0),
    QuestionMapping("financials_q3", DimensionCode.FIN, "FIN_001", 1.0),
    QuestionMapping("financials_q4", DimensionCode.FIN, "FIN_002", 1.0),
    QuestionMapping("financials_q5", DimensionCode.FIN, "FIN_002", 1.0),
    QuestionMapping("financials_q6", DimensionCode.FIN, "FIN_002", 1.5),
    QuestionMapping("financials_q7", DimensionCode.FIN, "FIN_003", 1.5),
    QuestionMapping("financials_q8", DimensionCode.FIN, "FIN_003", 1.0),
    QuestionMapping("financials_q9", DimensionCode.FIN, "FIN_002", 1.0),
    QuestionMapping("financials_q10", DimensionCode.FIN, "FIN_004", 1.0),
    QuestionMapping("financials_q11", DimensionCode.FIN, "FIN_004", 1.0),
    QuestionMapping("financials_q12", DimensionCode.FIN, "FIN_005", 1.5),

    # Human Resources (HRS) - 7 questions
    QuestionMapping("human_resources_q1", DimensionCode.HRS, "HRS_001", 1.5),
    QuestionMapping("human_resources_q2", DimensionCode.HRS, "HRS_002", 1.5),
    QuestionMapping("human_resources_q3", DimensionCode.HRS, "HRS_003", 1.0),
    QuestionMapping("human_resources_q4", DimensionCode.HRS, "HRS_004", 1.0),
    QuestionMapping("human_resources_q5", DimensionCode.HRS, "HRS_002", 1.5),
    QuestionMapping("human_resources_q6", DimensionCode.HRS, "HRS_002", 1.5),
    QuestionMapping("human_resources_q7", DimensionCode.HRS, "HRS_005", 1.0),

    # Leadership & Governance (LDG) - 7 questions
    QuestionMapping("leadership_q1", DimensionCode.LDG, "LDG_001", 1.5),
    QuestionMapping("leadership_q2", DimensionCode.LDG, "LDG_002", 1.0),
    QuestionMapping("leadership_q3", DimensionCode.LDG, "LDG_003", 1.0),
    QuestionMapping("leadership_q4", DimensionCode.LDG, "LDG_003", 0.5),
    QuestionMapping("leadership_q5", DimensionCode.LDG, "LDG_002", 1.5),
    QuestionMapping("leadership_q6", DimensionCode.LDG, "LDG_004", 1.0),
    QuestionMapping("leadership_q7", DimensionCode.LDG, "LDG_005", 1.0),

    # Technology & Innovation (TIN) - 7 questions
    QuestionMapping("technology_q1", DimensionCode.TIN, "TIN_001", 1.0),
    QuestionMapping("technology_q2", DimensionCode.TIN, "TIN_005", 1.0),
    QuestionMapping("technology_q3", DimensionCode.TIN, "TIN_002", 1.0),
    QuestionMapping("technology_q4", DimensionCode.TIN, "TIN_003", 1.0),
    QuestionMapping("technology_q5", DimensionCode.TIN, "TIN_003", 1.0),
    QuestionMapping("technology_q6", DimensionCode.TIN, "TIN_004", 1.5),
    QuestionMapping("technology_q7", DimensionCode.TIN, "TIN_005", 1.0),

    # IT, Data & Systems (IDS) - 7 questions
    QuestionMapping("it_infrastructure_q1", DimensionCode.IDS, "IDS_001", 1.5),
    QuestionMapping("it_infrastructure_q2", DimensionCode.IDS, "IDS_002", 1.0),
    QuestionMapping("it_infrastructure_q3", DimensionCode.IDS, "IDS_003", 2.0),
    QuestionMapping("it_infrastructure_q4", DimensionCode.IDS, "IDS_004", 1.5),
    QuestionMapping("it_infrastructure_q5", DimensionCode.IDS, "IDS_004", 1.0),
    QuestionMapping("it_infrastructure_q6", DimensionCode.IDS, "IDS_005", 1.5),
    QuestionMapping("it_infrastructure_q7", DimensionCode.IDS, "IDS_001", 1.0),

    # Risk Management & Sustainability (RMS) - 8 questions
    QuestionMapping("risk_management_q1", DimensionCode.RMS, "RMS_001", 1.5),
    QuestionMapping("risk_management_q2", DimensionCode.RMS, "RMS_002", 1.0),
    QuestionMapping("risk_management_q3", DimensionCode.RMS, "RMS_003", 1.5),
    QuestionMapping("risk_management_q4", DimensionCode.RMS, "RMS_004", 1.5),
    QuestionMapping("risk_management_q5", DimensionCode.RMS, "RMS_003", 1.5),
    QuestionMapping("risk_management_q6", DimensionCode.RMS, "RMS_004", 1.5),
    QuestionMapping("risk_management_q7", DimensionCode.RMS, "RMS_004", 1.0),
    QuestionMapping("risk_management_q8", DimensionCode.RMS, "RMS_005", 1.0),

    # Compliance (CMP) - 8 questions
    QuestionMapping("compliance_q1", DimensionCode.CMP, "CMP_001", 1.5),
    QuestionMapping("compliance_q2", DimensionCode.CMP, "CMP_002", 1.5),
    QuestionMapping("compliance_q3", DimensionCode.CMP, "CMP_001", 1.0),
    QuestionMapping("compliance_q4", DimensionCode.CMP, "CMP_003", 1.5),
    QuestionMapping("compliance_q5", DimensionCode.CMP, "CMP_003", 1.0),
    QuestionMapping("compliance_q6", DimensionCode.CMP, "CMP_004", 1.0),
    QuestionMapping("compliance_q7", DimensionCode.CMP, "CMP_005", 1.0),
    QuestionMapping("compliance_q8", DimensionCode.CMP, "CMP_001", 0.5)
]


def get_question_mapping(question_id: str) -> Optional[QuestionMapping]:
    """Get question mapping by question ID"""
    for mapping in QUESTION_MAPPINGS:
        if mapping.question_id == question_id:
            return mapping
    return None


def get_questions_for_dimension(dimension_code: DimensionCode) -> List[QuestionMapping]:
    """Get all questions for a dimension"""
    return [m for m in QUESTION_MAPPINGS if m.dimension_code == dimension_code]


def get_questions_for_sub_indicator(sub_indicator_id: str) -> List[QuestionMapping]:
    """Get all questions for a sub-indicator"""
    return [m for m in QUESTION_MAPPINGS if m.sub_indicator_id == sub_indicator_id]


# ============================================================================
# VALIDATION
# ============================================================================

def validate_idm(data: dict) -> IDM:
    """Validate and parse IDM data"""
    return IDM(**data)


def validate_idm_safe(data: dict) -> tuple[Optional[IDM], Optional[str]]:
    """Validate IDM data without raising exceptions"""
    try:
        idm = IDM(**data)
        return idm, None
    except Exception as e:
        return None, str(e)


# ============================================================================
# SERIALIZATION
# ============================================================================

def idm_to_dict(idm: IDM) -> dict:
    """Convert IDM to dictionary for JSON serialization"""
    return idm.model_dump(mode='json')


def idm_to_json(idm: IDM, indent: int = 2) -> str:
    """Convert IDM to JSON string"""
    return idm.model_dump_json(indent=indent)


if __name__ == "__main__":
    # Test the models
    print("BizHealth IDM Models loaded successfully")
    print(f"Chapters: {len(ChapterCode)}")
    print(f"Dimensions: {len(DimensionCode)}")
    print(f"Question mappings: {len(QUESTION_MAPPINGS)}")
