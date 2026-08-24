from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    account_type: str
    monthly_budget: float
    currency: str
    is_demo: bool
    onboarding_completed: bool
    checklist_json: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkspaceCreate(BaseModel):
    name: str
    account_type: str = "Growing Business"
    monthly_budget: float = 10000.0
    currency: str = "USD"


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    monthly_budget: Optional[float] = None
    currency: Optional[str] = None


class OnboardingRequest(BaseModel):
    workspace_name: str
    account_type: str
    cloud_providers: List[str]
    monthly_budget: float
    currency: Optional[str] = "USD"


class ChecklistUpdateRequest(BaseModel):
    item_key: str
    completed: bool
