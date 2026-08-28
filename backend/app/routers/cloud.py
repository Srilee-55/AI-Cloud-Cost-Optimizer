import json
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cloud import CloudProvider, CloudAccount, CloudResource
from app.models.workspace import Workspace
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.cloud import (
    CloudProviderResponse,
    CloudAccountCreate,
    CloudAccountResponse,
    CloudResourceResponse
)
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user

router = APIRouter(prefix="/api/cloud", tags=["Cloud Management"])


@router.get("/providers", response_model=ApiResponse[List[CloudProviderResponse]])
def list_providers(db: Session = Depends(get_db)):
    providers = db.query(CloudProvider).filter(CloudProvider.is_active == True).all()
    return ApiResponse(
        success=True,
        data=[CloudProviderResponse.model_validate(p) for p in providers],
        message="Cloud providers retrieved"
    )


@router.get("/accounts", response_model=ApiResponse[List[CloudAccountResponse]])
def list_accounts(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    accounts = db.query(CloudAccount).filter(CloudAccount.workspace_id == workspace.id).all()
    return ApiResponse(
        success=True,
        data=[CloudAccountResponse.model_validate(a) for a in accounts],
        message=f"Retrieved {len(accounts)} cloud accounts"
    )


@router.post("/accounts", response_model=ApiResponse[CloudAccountResponse], status_code=status.HTTP_201_CREATED)
def create_account(
    req: CloudAccountCreate,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    provider = db.query(CloudProvider).filter(CloudProvider.code == req.provider_code.lower()).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Provider '{req.provider_code}' not found")

    new_acc = CloudAccount(
        workspace_id=workspace.id,
        provider_id=provider.id,
        account_id=req.account_id,
        account_name=req.account_name,
        environment=req.environment,
        status="Connected",
        is_demo=req.is_demo,
        credentials_json=json.dumps(req.credentials or {}),
        last_synced_at=datetime.now(timezone.utc)
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)

    # Audit log
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="CONNECT_CLOUD_ACCOUNT",
        resource_type="CloudAccount",
        resource_id=new_acc.id,
        details_json=json.dumps({"provider": req.provider_code, "name": req.account_name})
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        data=CloudAccountResponse.model_validate(new_acc),
        message="Cloud account connected successfully"
    )


@router.delete("/accounts/{account_id}", response_model=ApiResponse[dict])
def delete_account(
    account_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    acc = db.query(CloudAccount).filter(
        CloudAccount.id == account_id,
        CloudAccount.workspace_id == workspace.id
    ).first()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    db.delete(acc)
    db.commit()

    return ApiResponse(
        success=True,
        data={"deleted": True},
        message="Cloud account removed"
    )


@router.post("/accounts/{account_id}/sync", response_model=ApiResponse[dict])
def sync_account(
    account_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    acc = db.query(CloudAccount).filter(
        CloudAccount.id == account_id,
        CloudAccount.workspace_id == workspace.id
    ).first()
    if not acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    acc.last_synced_at = datetime.now(timezone.utc)
    acc.status = "Connected"
    db.commit()

    return ApiResponse(
        success=True,
        data={"synced": True, "last_synced_at": acc.last_synced_at.isoformat()},
        message=f"Simulated sync completed for {acc.account_name}"
    )


@router.get("/resources", response_model=ApiResponse[List[CloudResourceResponse]])
def list_resources(
    provider: str = None,
    service: str = None,
    status_filter: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(CloudResource).filter(CloudResource.workspace_id == workspace.id)
    if service:
        query = query.filter(CloudResource.service_name.ilike(f"%{service}%"))
    if status_filter:
        query = query.filter(CloudResource.status == status_filter)

    resources = query.order_by(CloudResource.cost_monthly.desc()).all()
    return ApiResponse(
        success=True,
        data=[CloudResourceResponse.model_validate(r) for r in resources],
        message=f"Retrieved {len(resources)} cloud resources"
    )
