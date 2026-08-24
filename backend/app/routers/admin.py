import platform
import os
import psutil
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.workspace import Workspace
from app.models.cost import CostRecord
from app.models.agent import AgentSession
from app.schemas.user import UserResponse
from app.schemas.workspace import WorkspaceResponse
from app.schemas.common import ApiResponse
from app.security.rbac import require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin Panel"])


@router.get("/system-health", response_model=ApiResponse[Dict[str, Any]])
def get_system_health(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_workspaces = db.query(Workspace).count()
    total_records = db.query(CostRecord).count()
    total_ai_runs = db.query(AgentSession).count()

    return ApiResponse(
        success=True,
        data={
            "status": "HEALTHY",
            "api_version": "1.0.0",
            "python_version": platform.python_version(),
            "os": platform.system(),
            "total_users": total_users,
            "total_workspaces": total_workspaces,
            "total_cost_records": total_records,
            "total_ai_runs": total_ai_runs,
            "database_status": "ONLINE (Connected)",
            "gemini_agent_engine": "READY"
        },
        message="System telemetry retrieved"
    )


@router.get("/workspaces", response_model=ApiResponse[List[WorkspaceResponse]])
def list_all_workspaces(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    workspaces = db.query(Workspace).all()
    return ApiResponse(
        success=True,
        data=[WorkspaceResponse.model_validate(w) for w in workspaces],
        message=f"Retrieved {len(workspaces)} workspaces"
    )
