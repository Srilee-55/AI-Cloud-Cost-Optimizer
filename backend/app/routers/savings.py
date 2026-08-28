import csv
import io
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.workspace import Workspace
from app.models.cloud import CloudResource
from app.models.cost import CostRecord
from app.schemas.savings import (
    SavingsAnalysisRequest,
    UserSavingsAnalysisResponse,
    UserResourceInput
)
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace
from app.ml.savings_engine import analyze_user_provided_resources

router = APIRouter(prefix="/api/savings", tags=["FinOps Savings Estimation"])


@router.post("/analyze", response_model=ApiResponse[UserSavingsAnalysisResponse])
def analyze_custom_resources(
    req: SavingsAnalysisRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """
    Analyzes user-provided cloud-cost and resource data.
    Validates telemetry, runs deterministic FinOps optimization algorithms,
    and returns evidence-based actionable savings recommendations in INR (₹).
    """
    if not req.resources or len(req.resources) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one resource must be provided for savings analysis."
        )

    # Validate and normalize user resources
    raw_dicts = []
    for idx, r in enumerate(req.resources):
        if r.monthly_cost < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resource '{r.resource_id}' (Row #{idx+1}) has an invalid negative cost: ₹{r.monthly_cost}"
            )
        if r.cpu_utilization is not None and not (0.0 <= r.cpu_utilization <= 100.0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resource '{r.resource_id}' CPU utilization must be between 0% and 100% (Received: {r.cpu_utilization}%)"
            )
        if r.memory_utilization is not None and not (0.0 <= r.memory_utilization <= 100.0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resource '{r.resource_id}' Memory utilization must be between 0% and 100% (Received: {r.memory_utilization}%)"
            )

        raw_dicts.append({
            "cloud_provider": r.cloud_provider,
            "resource_id": r.resource_id,
            "resource_name": r.resource_name or r.resource_id,
            "resource_type": r.resource_type,
            "service_name": r.service_name,
            "region": r.region,
            "monthly_cost": float(r.monthly_cost),
            "cpu_utilization": float(r.cpu_utilization) if r.cpu_utilization is not None else None,
            "memory_utilization": float(r.memory_utilization) if r.memory_utilization is not None else None,
            "storage_usage_gb": float(r.storage_usage_gb) if r.storage_usage_gb is not None else None,
            "hours_per_day": float(r.hours_per_day or 24.0),
            "environment": r.environment,
            "status": r.status,
            "tags": r.tags or {}
        })

    analysis_result = analyze_user_provided_resources(
        resources=raw_dicts,
        custom_baseline_spend=req.custom_baseline_spend,
        currency=req.currency or "INR"
    )

    return ApiResponse(
        success=True,
        data=UserSavingsAnalysisResponse.model_validate(analysis_result),
        message=f"Successfully analyzed {len(raw_dicts)} user resources and identified {analysis_result['opportunities_count']} actionable savings opportunities."
    )


@router.get("/template/csv", response_class=PlainTextResponse)
def download_sample_csv_template():
    """Returns a valid CSV template pre-formatted for bulk cloud resource savings analysis."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "cloud_provider",
        "resource_id",
        "resource_name",
        "resource_type",
        "service_name",
        "region",
        "monthly_cost",
        "cpu_utilization",
        "memory_utilization",
        "storage_usage_gb",
        "hours_per_day",
        "environment",
        "status"
    ])
    writer.writerow(["aws", "i-09ab12cd34ef", "prod-api-backend-01", "compute", "EC2", "ap-south-1", "18500", "12.5", "18.0", "100", "24", "Production", "running"])
    writer.writerow(["aws", "vol-0847b2c910fa", "legacy-unattached-ebs", "storage", "EBS", "ap-south-1", "3200", "", "", "500", "24", "Staging", "unattached"])
    writer.writerow(["azure", "vm-dev-worker-02", "staging-test-worker", "compute", "Virtual Machines", "centralindia", "12400", "8.0", "14.0", "50", "10", "Development", "running"])
    writer.writerow(["gcp", "gcs-archive-data-lake", "customer-events-lake", "storage", "Cloud Storage", "asia-south1", "9500", "", "", "2500", "24", "Production", "running"])
    writer.writerow(["aws", "i-03fa45de7890", "dev-qa-cluster-node", "compute", "EC2", "ap-south-1", "8800", "4.0", "6.0", "40", "8", "Development", "running"])

    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finops_savings_resources_template.csv"}
    )


@router.get("", response_model=ApiResponse[UserSavingsAnalysisResponse])
def get_current_workspace_savings(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """
    Returns existing workspace savings analysis.
    If no user resources exist in the database, returns an empty state
    without fake or predefined numbers.
    """
    resources = db.query(CloudResource).filter(CloudResource.workspace_id == workspace.id).all()
    
    if not resources or len(resources) == 0:
        # Return clean empty state (NO mock numbers)
        empty_result = {
            "total_monthly_spend": 0.0,
            "potential_monthly_savings": 0.0,
            "potential_annual_savings": 0.0,
            "estimated_optimized_spend": 0.0,
            "overall_savings_percentage": 0.0,
            "savings_by_category": {
                "rightsizing": 0.0,
                "idle_termination": 0.0,
                "scheduling": 0.0,
                "storage_tiering": 0.0,
                "commitments": 0.0,
            },
            "savings_by_provider": {},
            "resource_count": 0,
            "analyzed_resources_count": 0,
            "opportunities_count": 0,
            "opportunities": [],
            "currency": "INR",
            "currency_symbol": "₹",
            "analysis_timestamp": datetime.now(timezone.utc),
            "data_source": "workspace_database"
        }
        return ApiResponse(
            success=True,
            data=UserSavingsAnalysisResponse.model_validate(empty_result),
            message="No cloud resources found for analysis."
        )

    res_dicts = [
        {
            "cloud_provider": r.account.provider.code if r.account and r.account.provider else "aws",
            "resource_id": r.resource_id,
            "resource_name": r.name or r.resource_id,
            "resource_type": r.resource_type or "compute",
            "service_name": r.service_name or "Compute",
            "region": r.region or "ap-south-1",
            "monthly_cost": float(r.cost_monthly or 0.0),
            "cpu_utilization": float(r.cpu_utilization) if r.cpu_utilization is not None else None,
            "memory_utilization": float(r.memory_utilization) if r.memory_utilization is not None else None,
            "storage_usage_gb": None,
            "hours_per_day": 24.0,
            "environment": r.tags_json and "Production" in r.tags_json and "Production" or "Development",
            "status": r.status or "running",
            "tags": {}
        }
        for r in resources
    ]

    total_monthly = sum(r["monthly_cost"] for r in res_dicts)
    analysis_result = analyze_user_provided_resources(res_dicts, custom_baseline_spend=total_monthly)

    return ApiResponse(
        success=True,
        data=UserSavingsAnalysisResponse.model_validate(analysis_result),
        message="Workspace savings analysis computed."
    )
