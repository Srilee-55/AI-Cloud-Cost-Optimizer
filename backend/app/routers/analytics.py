from datetime import date, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.cost import CostRecord, CostEfficiencyScore
from app.models.anomaly import Anomaly
from app.models.recommendation import AIRecommendation
from app.models.workspace import Workspace
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/multi-dimensional", response_model=ApiResponse[Dict[str, Any]])
def get_multi_dimensional_analytics(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    # 1. Multi-Cloud Spending by Month
    monthly_trend = (
        db.query(
            CostRecord.cost_date,
            CostRecord.provider_code,
            func.sum(CostRecord.amount)
        )
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.cost_date, CostRecord.provider_code)
        .order_by(CostRecord.cost_date.asc())
        .all()
    )

    trend_by_date = {}
    for d, prov, amt in monthly_trend:
        d_str = str(d)
        if d_str not in trend_by_date:
            trend_by_date[d_str] = {"date": d_str, "aws": 0.0, "azure": 0.0, "gcp": 0.0, "total": 0.0}
        trend_by_date[d_str][prov] = round(float(amt), 2)
        trend_by_date[d_str]["total"] = round(trend_by_date[d_str]["total"] + float(amt), 2)

    # 2. Team vs Cost Center Allocation Matrix
    allocations = (
        db.query(
            CostRecord.team,
            CostRecord.cost_center,
            func.sum(CostRecord.amount)
        )
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.team, CostRecord.cost_center)
        .all()
    )

    team_allocations = [
        {"team": r[0], "cost_center": r[1], "amount": round(float(r[2]), 2)}
        for r in allocations
    ]

    # 3. Anomaly Distribution by Severity and Service
    anomalies = db.query(Anomaly).filter(Anomaly.workspace_id == workspace.id).all()
    anomaly_distribution = {
        "Critical": sum(1 for a in anomalies if a.severity == "Critical"),
        "Warning": sum(1 for a in anomalies if a.severity == "Warning"),
        "Normal": sum(1 for a in anomalies if a.severity == "Normal")
    }

    # 4. Optimization Pipeline Status
    recs = db.query(AIRecommendation).filter(AIRecommendation.workspace_id == workspace.id).all()
    rec_status_counts = {
        "pending": sum(1 for r in recs if r.approval_status == "pending"),
        "approved": sum(1 for r in recs if r.approval_status == "approved"),
        "simulated": sum(1 for r in recs if r.approval_status == "simulated"),
        "rejected": sum(1 for r in recs if r.approval_status == "rejected")
    }

    return ApiResponse(
        success=True,
        data={
            "stacked_trend": list(trend_by_date.values()),
            "team_allocations": team_allocations,
            "anomaly_distribution": anomaly_distribution,
            "recommendation_status_distribution": rec_status_counts
        },
        message="Multi-dimensional analytics computed"
    )
