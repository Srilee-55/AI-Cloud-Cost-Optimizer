from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AgentRunRequest(BaseModel):
    goal: str = "Perform comprehensive cloud cost optimization analysis across all providers"
    provider: Optional[str] = "all"
    max_steps: Optional[int] = 10


class AgentActionResponse(BaseModel):
    id: str
    session_id: str
    step_number: int
    tool_name: str
    purpose: str
    tool_input_json: str
    tool_output_json: str
    duration_ms: float
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


class AgentSessionResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: Optional[str]
    goal: str
    status: str
    summary: str
    created_at: datetime
    updated_at: datetime
    actions: List[AgentActionResponse] = []

    class Config:
        from_attributes = True


class ToolTraceItem(BaseModel):
    tool_name: str
    purpose: str
    key_findings: str
    duration_ms: float
    timestamp: str
