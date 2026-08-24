from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ForecastResponse(BaseModel):
    id: str
    workspace_id: str
    forecast_type: str
    target_date: date
    predicted_cost: float
    lower_bound: float
    upper_bound: float
    confidence_score: float
    method: str
    created_at: datetime

    class Config:
        from_attributes = True


class ForecastSummaryResponse(BaseModel):
    forecast_7d_total: float
    forecast_30d_total: float
    next_month_total: float
    monthly_budget: float
    budget_overrun_risk: bool
    budget_variance: float
    method: str
    daily_predictions: List[Dict[str, Any]]


class SavingsEstimateResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    category: str
    provider_code: str
    service_name: str
    current_monthly_spend: float
    estimated_monthly_spend: float
    estimated_monthly_savings: float
    savings_percent: float
    confidence_score: float
    risk_level: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsSummaryResponse(BaseModel):
    total_monthly_spend: float
    potential_monthly_savings: float
    potential_annual_savings: float
    overall_savings_percentage: float
    savings_by_category: Dict[str, float]
    savings_by_provider: Dict[str, float]
    estimates: List[SavingsEstimateResponse]
