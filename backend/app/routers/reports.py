import os
import json
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.report import Report
from app.models.cost import CostRecord
from app.models.anomaly import Anomaly
from app.models.recommendation import AIRecommendation
from app.models.workspace import Workspace
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user
from app.services.report_generator import generate_cost_report_csv, generate_executive_report_pdf

router = APIRouter(prefix="/api/reports", tags=["Reports"])

REPORT_DIR = os.path.abspath("./generated_reports")
os.makedirs(REPORT_DIR, exist_ok=True)


@router.get("", response_model=ApiResponse[List[ReportResponse]])
def list_reports(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(Report.workspace_id == workspace.id).order_by(Report.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[ReportResponse.model_validate(r) for r in reports],
        message=f"Retrieved {len(reports)} reports"
    )


@router.post("/generate", response_model=ApiResponse[ReportResponse], status_code=status.HTTP_201_CREATED)
def generate_report(
    req: ReportGenerateRequest,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cost_records = db.query(CostRecord).filter(CostRecord.workspace_id == workspace.id).all()
    records_dict = [
        {
            "id": r.id,
            "cost_date": r.cost_date,
            "provider_code": r.provider_code,
            "service_name": r.service_name,
            "resource_id": r.resource_id,
            "amount": r.amount,
            "currency": r.currency,
            "cost_center": r.cost_center,
            "team": r.team,
            "environment": r.environment
        }
        for r in cost_records
    ]

    filename = f"report_{workspace.slug}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.{req.file_format}"
    file_path = os.path.join(REPORT_DIR, filename)

    if req.file_format.lower() == "csv":
        csv_content = generate_cost_report_csv(records_dict)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(csv_content)
    else:
        # PDF Executive Summary
        anomalies = [
            {
                "severity": a.severity,
                "anomaly_date": a.anomaly_date,
                "provider_code": a.provider_code,
                "service_name": a.service_name,
                "actual_cost": a.actual_cost,
                "expected_cost": a.expected_cost,
                "deviation_percent": a.deviation_percent,
                "possible_cause": a.possible_cause
            }
            for a in db.query(Anomaly).filter(Anomaly.workspace_id == workspace.id).all()
        ]
        recs = [
            {
                "priority": r.priority,
                "provider": r.provider,
                "service": r.service,
                "title": r.title,
                "recommended_action": r.recommended_action,
                "estimated_savings": r.estimated_savings,
                "savings_percentage": r.savings_percentage,
                "approval_status": r.approval_status
            }
            for r in db.query(AIRecommendation).filter(AIRecommendation.workspace_id == workspace.id).all()
        ]
        summary_data = {
            "total_spend": sum(r.amount for r in cost_records),
            "current_month_spend": sum(r.amount for r in cost_records[-30:]) if len(cost_records) >= 30 else sum(r.amount for r in cost_records),
            "potential_savings": sum(r["estimated_savings"] for r in recs),
            "cost_efficiency_score": 85.0
        }
        generate_executive_report_pdf(workspace.name, summary_data, anomalies, recs, file_path)

    new_report = Report(
        workspace_id=workspace.id,
        title=req.title,
        report_type=req.report_type,
        file_format=req.file_format,
        file_path=file_path,
        status="completed",
        metadata_json=json.dumps({"record_count": len(cost_records), "format": req.file_format})
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Audit log
    audit = AuditLog(
        workspace_id=workspace.id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="GENERATE_REPORT",
        resource_type="Report",
        resource_id=new_report.id,
        details_json=json.dumps({"title": req.title, "format": req.file_format})
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        data=ReportResponse.model_validate(new_report),
        message=f"{req.file_format.upper()} report generated successfully"
    )


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.workspace_id == workspace.id
    ).first()
    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    media_type = "application/pdf" if report.file_format == "pdf" else "text/csv"
    return FileResponse(
        report.file_path,
        media_type=media_type,
        filename=os.path.basename(report.file_path)
    )
