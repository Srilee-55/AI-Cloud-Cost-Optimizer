from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: Optional[str]
    user_email: str
    action: str
    resource_type: str
    resource_id: str
    details_json: str
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True
