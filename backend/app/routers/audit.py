from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditLog
from app.models.workspace import Workspace
from app.schemas.audit import AuditLogResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace

router = APIRouter(prefix="/api/audit", tags=["Audit Logging"])


@router.get("", response_model=ApiResponse[List[AuditLogResponse]])
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.workspace_id == workspace.id)
    if action:
        query = query.filter(AuditLog.action == action.upper())

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return ApiResponse(
        success=True,
        data=[AuditLogResponse.model_validate(l) for l in logs],
        message=f"Retrieved {len(logs)} audit logs"
    )
