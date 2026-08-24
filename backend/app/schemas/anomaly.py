from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AnomalyResponse(BaseModel):
    id: str
    workspace_id: str
    provider_code: str
    service_name: str
    resource_id: str
    anomaly_date: date
    expected_cost: float
    actual_cost: float
    difference: float
    deviation_percent: float
    severity: str
    possible_cause: str
    recommended_action: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
