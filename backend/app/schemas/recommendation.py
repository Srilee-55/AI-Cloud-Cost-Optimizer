from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AIRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    session_id: Optional[str] = None
    title: str
    problem: str
    evidence_json: str
    possible_cause: str
    recommended_action: str
    current_cost: float
    optimized_estimated_cost: float
    estimated_savings: float
    savings_percentage: float
    priority: str
    confidence: float
    risk_level: str
    provider: str
    service: str
    resource_id: str
    approval_status: str
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    simulated_at: Optional[datetime] = None
    simulated_result_json: Optional[str] = None
    tool_trace_json: str
    created_at: datetime
    updated_at: datetime


class RecommendationApprovalRequest(BaseModel):
    action: str  # approve, reject
    rejection_reason: Optional[str] = None


class RecommendationSimulateRequest(BaseModel):
    simulation_parameters: Optional[Dict[str, Any]] = None


class ImpactSimulationRequest(BaseModel):
    coverage_percentage: float = 100.0  # Slider: 0% to 100%
    recommendation_ids: Optional[List[str]] = None
