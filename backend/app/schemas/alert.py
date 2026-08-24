from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: str
    workspace_id: str
    alert_type: str
    title: str
    message: str
    severity: str
    is_read: bool
    metadata_json: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    workspace_id: str
    title: str
    message: str
    link: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookEventResponse(BaseModel):
    id: str
    workspace_id: str
    event_type: str
    payload_json: str
    target_url: str
    status: str
    response_code: str
    created_at: datetime

    class Config:
        from_attributes = True
