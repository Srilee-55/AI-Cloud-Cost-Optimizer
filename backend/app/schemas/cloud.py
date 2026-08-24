from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class CloudProviderResponse(BaseModel):
    id: str
    name: str
    code: str
    icon: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class CloudAccountCreate(BaseModel):
    provider_code: str
    account_id: str
    account_name: str
    environment: str = "Production"
    is_demo: bool = False
    credentials: Optional[Dict[str, Any]] = None


class CloudAccountResponse(BaseModel):
    id: str
    workspace_id: str
    provider_id: str
    account_id: str
    account_name: str
    environment: str
    status: str
    is_demo: bool
    last_synced_at: Optional[datetime]
    created_at: datetime
    provider: Optional[CloudProviderResponse] = None

    class Config:
        from_attributes = True


class CloudResourceResponse(BaseModel):
    id: str
    workspace_id: str
    cloud_account_id: str
    resource_id: str
    name: str
    service_name: str
    resource_type: str
    region: str
    status: str
    cpu_utilization: float
    memory_utilization: float
    cost_monthly: float
    cost_center: str
    team: str
    project: str
    tags_json: str
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True
