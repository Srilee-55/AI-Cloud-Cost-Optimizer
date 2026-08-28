import io
import csv
import json
import uuid
from datetime import datetime, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cost import CostRecord
from app.models.workspace import Workspace
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.cost import CostRecordCreate, CostRecordResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user
from app.utils.seed_data import seed_database

router = APIRouter(prefix="/api/data", tags=["Cost Data Collection"])


@router.post("/manual", response_model=ApiResponse[CostRecordResponse], status_code=status.HTTP_201_CREATED)
def create_manual_cost_record(
    req: CostRecordCreate,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_record = CostRecord(
        workspace_id=workspace.id,
        provider_code=req.provider_code.lower(),
        service_name=req.service_name,
        resource_id=req.resource_id or f"{req.provider_code}-{req.service_name.lower()}-res",
        region=req.region,
        cost_date=req.cost_date,
        amount=float(req.amount),
        currency=req.currency,
        cost_center=req.cost_center or "Engineering",
        team=req.team or "Platform",
        project=req.project or "Core Services",
        environment=req.environment or "Production",
        tags_json=json.dumps(req.tags or {}),
        is_demo=False,
        source="manual"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # Audit log
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="MANUAL_COST_ENTRY",
        resource_type="CostRecord",
        resource_id=new_record.id,
        details_json=json.dumps({"amount": req.amount, "service": req.service_name, "provider": req.provider_code})
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        data=CostRecordResponse.model_validate(new_record),
        message="Cost record saved successfully"
    )


@router.post("/upload-csv", response_model=ApiResponse[dict])
async def upload_csv(
    file: UploadFile = File(...),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .csv file."
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum 10MB limit."
        )

    try:
        text_stream = io.StringIO(content.decode("utf-8-sig"))
        reader = csv.DictReader(text_stream)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV: {str(e)}"
        )

    records_to_insert = []
    errors = []
    row_count = 0

    for idx, row in enumerate(reader, start=1):
        row_count += 1
        try:
            # Flexible field resolution
            prov = (row.get("Provider") or row.get("provider") or row.get("provider_code") or "aws").strip().lower()
            service = (row.get("Service") or row.get("service") or row.get("service_name") or "Compute").strip()
            amount_raw = row.get("Amount") or row.get("amount") or row.get("Cost") or row.get("cost") or "0"
            date_raw = row.get("Date") or row.get("date") or row.get("cost_date") or str(date.today())
            
            amount = float(amount_raw.replace("$", "").replace(",", "").strip())
            
            # Parse date
            try:
                if "/" in date_raw:
                    parsed_date = datetime.strptime(date_raw, "%m/%d/%Y").date()
                else:
                    parsed_date = datetime.strptime(date_raw, "%Y-%m-%d").date()
            except Exception:
                parsed_date = date.today()

            rec = CostRecord(
                id=str(uuid.uuid4()),
                workspace_id=workspace.id,
                provider_code=prov,
                service_name=service,
                resource_id=row.get("Resource ID") or row.get("resource_id") or f"{prov}-{service.lower()}-res",
                region=row.get("Region") or row.get("region") or "us-east-1",
                cost_date=parsed_date,
                amount=round(amount, 2),
                currency=row.get("Currency") or row.get("currency") or "USD",
                cost_center=row.get("Cost Center") or row.get("cost_center") or "Engineering",
                team=row.get("Team") or row.get("team") or "Platform",
                project=row.get("Project") or row.get("project") or "General",
                environment=row.get("Environment") or row.get("environment") or "Production",
                tags_json="{}",
                is_demo=False,
                source="csv"
            )
            records_to_insert.append(rec)
        except Exception as err:
            errors.append(f"Row {idx}: {str(err)}")

    if records_to_insert:
        db.add_all(records_to_insert)
        db.commit()

    # Audit log
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="CSV_COST_UPLOAD",
        resource_type="CostRecord",
        resource_id=file.filename,
        details_json=json.dumps({"inserted_count": len(records_to_insert), "error_count": len(errors)})
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        data={
            "filename": file.filename,
            "total_rows_processed": row_count,
            "inserted_records_count": len(records_to_insert),
            "errors": errors[:10],
            "has_errors": len(errors) > 0
        },
        message=f"Successfully imported {len(records_to_insert)} cost records from CSV."
    )


@router.post("/seed-demo", response_model=ApiResponse[dict])
def trigger_seed_demo(db: Session = Depends(get_db)):
    demo_ws, demo_user = seed_database(db)
    return ApiResponse(
        success=True,
        data={
            "workspace_id": demo_ws.id,
            "workspace_name": demo_ws.name,
            "demo_user_email": demo_user.email
        },
        message="Demo data populated across AWS, Azure, and GCP."
    )
