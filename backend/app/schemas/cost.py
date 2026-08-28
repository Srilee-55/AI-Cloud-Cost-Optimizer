from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class CostRecordCreate(BaseModel):
    provider_code: str
    service_name: str
    resource_id: Optional[str] = "unknown"
    region: str = "us-east-1"
    cost_date: date
    amount: float
    currency: str = "USD"
    cost_center: Optional[str] = "Engineering"
    team: Optional[str] = "Platform"
    project: Optional[str] = "Core Services"
    environment: Optional[str] = "Production"
    tags: Optional[Dict[str, Any]] = None


class CostRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    cloud_account_id: Optional[str]
    cloud_resource_id: Optional[str]
    provider_code: str
    service_name: str
    resource_id: str
    region: str
    cost_date: date
    amount: float
    currency: str
    cost_center: str
    team: str
    project: str
    environment: str
    tags_json: str
    is_demo: bool
    source: str
    created_at: datetime


class CostSummaryResponse(BaseModel):
    total_spend: float
    current_month_spend: float
    previous_month_spend: float
    month_over_month_change_pct: float
    daily_average_spend: float
    budget_utilization_pct: float
    cost_efficiency_score: float
    currency: str
    breakdown_by_provider: Dict[str, float]
    breakdown_by_service: Dict[str, float]
    breakdown_by_cost_center: Dict[str, float]
    breakdown_by_team: Dict[str, float]
    cost_trend: List[Dict[str, Any]]


class PeriodComparisonResponse(BaseModel):
    period_a_label: str
    period_b_label: str
    period_a_total: float
    period_b_total: float
    cost_difference: float
    percentage_change: float
    major_contributors: List[Dict[str, Any]]
    service_comparison: List[Dict[str, Any]]
    provider_comparison: List[Dict[str, Any]]
