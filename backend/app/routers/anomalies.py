from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.anomaly import Anomaly
from app.models.cost import CostRecord
from app.models.workspace import Workspace
from app.schemas.anomaly import AnomalyResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace
from app.ml.anomaly_detector import detect_cost_anomalies

router = APIRouter(prefix="/api/anomalies", tags=["Anomaly Detection"])


@router.get("", response_model=ApiResponse[List[AnomalyResponse]])
def list_anomalies(
    severity: Optional[str] = None,
    provider: Optional[str] = None,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly).filter(Anomaly.workspace_id == workspace.id)
    if severity and severity.lower() != "all":
        query = query.filter(Anomaly.severity == severity.capitalize())
    if provider and provider.lower() != "all":
        query = query.filter(Anomaly.provider_code == provider.lower())

    anomalies = query.order_by(Anomaly.difference.desc()).all()

    # If no anomalies recorded yet, run real-time statistical detection
    if not anomalies:
        cost_records = db.query(CostRecord).filter(CostRecord.workspace_id == workspace.id).all()
        records_dict = [
            {
                "provider_code": r.provider_code,
                "service_name": r.service_name,
                "cost_date": str(r.cost_date),
                "amount": r.amount
            }
            for r in cost_records
        ]
        detected = detect_cost_anomalies(records_dict)
        # Save detected anomalies to database
        for d in detected:
            anom = Anomaly(
                workspace_id=workspace.id,
                provider_code=d["provider_code"],
                service_name=d["service_name"],
                resource_id=d["resource_id"],
                anomaly_date=d["anomaly_date"],
                expected_cost=d["expected_cost"],
                actual_cost=d["actual_cost"],
                difference=d["difference"],
                deviation_percent=d["deviation_percent"],
                severity=d["severity"],
                possible_cause=d["possible_cause"],
                recommended_action=d["recommended_action"],
                status="active"
            )
            db.add(anom)
        db.commit()
        anomalies = db.query(Anomaly).filter(Anomaly.workspace_id == workspace.id).order_by(Anomaly.difference.desc()).all()

    return ApiResponse(
        success=True,
        data=[AnomalyResponse.model_validate(a) for a in anomalies],
        message=f"Retrieved {len(anomalies)} anomalies"
    )


@router.put("/{anomaly_id}/resolve", response_model=ApiResponse[AnomalyResponse])
def resolve_anomaly(
    anomaly_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    anom = db.query(Anomaly).filter(
        Anomaly.id == anomaly_id,
        Anomaly.workspace_id == workspace.id
    ).first()
    if not anom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomaly not found")

    anom.status = "resolved"
    db.commit()
    db.refresh(anom)

    return ApiResponse(
        success=True,
        data=AnomalyResponse.model_validate(anom),
        message="Anomaly marked as resolved"
    )
