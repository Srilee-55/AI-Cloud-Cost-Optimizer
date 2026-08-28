from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BudgetCreate(BaseModel):
    name: str
    period: str = "monthly"
    amount: float
    currency: str = "USD"
    alert_threshold_percent: float = 80.0
    cost_center: Optional[str] = "All"
    team: Optional[str] = "All"


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    alert_threshold_percent: Optional[float] = None
    cost_center: Optional[str] = None
    team: Optional[str] = None


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    period: str
    amount: float
    currency: str
    alert_threshold_percent: float
    current_spend: float
    status: str
    cost_center: str
    team: str
    created_at: datetime
    updated_at: datetime
