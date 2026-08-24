from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CopilotChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class CopilotChatResponse(BaseModel):
    id: str
    session_id: Optional[str]
    user_message: str
    answer: str
    evidence: List[Dict[str, Any]]
    tools_consulted: List[str]
    recommendations: List[Dict[str, Any]]
    confidence: float
    suggested_actions: List[str]
    created_at: datetime


class WeeklyDigestResponse(BaseModel):
    period_start: str
    period_end: str
    total_cost_change_pct: float
    total_spend: float
    new_anomalies_count: int
    new_recommendations_count: int
    potential_savings_amount: float
    budget_status_summary: str
    forecast_outlook: str
    key_highlights: List[str]
    action_items: List[str]
