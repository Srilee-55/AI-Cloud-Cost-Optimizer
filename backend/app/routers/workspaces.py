import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, AccountType
from app.models.cloud import CloudAccount, CloudProvider
from app.schemas.workspace import (
    WorkspaceResponse,
    WorkspaceCreate,
    WorkspaceUpdate,
    OnboardingRequest,
    ChecklistUpdateRequest
)
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_user, get_current_workspace

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


@router.get("", response_model=ApiResponse[List[WorkspaceResponse]])
def list_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    workspaces = [m.workspace for m in memberships if m.workspace]
    
    # If none, return demo workspace if available
    if not workspaces:
        demo = db.query(Workspace).filter(Workspace.is_demo == True).first()
        if demo:
            workspaces = [demo]

    return ApiResponse(
        success=True,
        data=[WorkspaceResponse.model_validate(w) for w in workspaces],
        message="Workspaces retrieved"
    )


@router.get("/current", response_model=ApiResponse[WorkspaceResponse])
def get_active_workspace(workspace: Workspace = Depends(get_current_workspace)):
    return ApiResponse(
        success=True,
        data=WorkspaceResponse.model_validate(workspace),
        message="Active workspace retrieved"
    )


@router.post("/onboarding", response_model=ApiResponse[WorkspaceResponse])
def complete_onboarding(
    req: OnboardingRequest,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    workspace.name = req.workspace_name
    workspace.account_type = req.account_type
    workspace.monthly_budget = float(req.monthly_budget)
    workspace.currency = req.currency or "USD"
    workspace.onboarding_completed = True

    # Connect selected providers if specified
    for prov_code in req.cloud_providers:
        prov = db.query(CloudProvider).filter(CloudProvider.code == prov_code.lower()).first()
        if prov:
            existing = db.query(CloudAccount).filter(
                CloudAccount.workspace_id == workspace.id,
                CloudAccount.provider_id == prov.id
            ).first()
            if not existing:
                new_acc = CloudAccount(
                    workspace_id=workspace.id,
                    provider_id=prov.id,
                    account_id=f"{prov_code}-prod-001",
                    account_name=f"{prov_code.upper()} Production Account",
                    environment="Production",
                    status="Connected"
                )
                db.add(new_acc)

    # Initialize checklist
    checklist = {
        "connect_provider": len(req.cloud_providers) > 0,
        "upload_cost_data": False,
        "configure_budget": req.monthly_budget > 0,
        "run_ai_analysis": False,
        "review_recommendation": False
    }
    workspace.checklist_json = json.dumps(checklist)

    db.commit()
    db.refresh(workspace)

    return ApiResponse(
        success=True,
        data=WorkspaceResponse.model_validate(workspace),
        message="Onboarding completed successfully"
    )


@router.get("/checklist", response_model=ApiResponse[dict])
def get_checklist_status(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    try:
        checklist = json.loads(workspace.checklist_json or "{}")
    except Exception:
        checklist = {}

    # Auto-evaluate checklist items against real backend activity
    has_providers = len(workspace.cloud_accounts) > 0
    has_costs = len(workspace.cost_records) > 0
    has_budget = len(workspace.budgets) > 0 or workspace.monthly_budget > 0
    has_ai = len(workspace.ai_recommendations) > 0
    has_reviewed = any(r.approval_status != "pending" for r in workspace.ai_recommendations)

    eval_checklist = {
        "connect_provider": has_providers or checklist.get("connect_provider", False),
        "upload_cost_data": has_costs or checklist.get("upload_cost_data", False),
        "configure_budget": has_budget or checklist.get("configure_budget", False),
        "run_ai_analysis": has_ai or checklist.get("run_ai_analysis", False),
        "review_recommendation": has_reviewed or checklist.get("review_recommendation", False)
    }

    # Persist updated status
    workspace.checklist_json = json.dumps(eval_checklist)
    db.commit()

    return ApiResponse(
        success=True,
        data=eval_checklist,
        message="Checklist retrieved"
    )


@router.put("/checklist", response_model=ApiResponse[dict])
def update_checklist_status(
    req: ChecklistUpdateRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    try:
        checklist = json.loads(workspace.checklist_json or "{}")
    except Exception:
        checklist = {}

    checklist[req.item_key] = req.completed
    workspace.checklist_json = json.dumps(checklist)
    db.commit()

    return ApiResponse(
        success=True,
        data=checklist,
        message="Checklist updated"
    )
