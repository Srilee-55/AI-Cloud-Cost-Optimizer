from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.cost import CostRecord, CostEfficiencyScore
from app.models.workspace import Workspace
from app.schemas.cost import CostRecordResponse, CostSummaryResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace

router = APIRouter(prefix="/api/costs", tags=["Cost Management"])


@router.get("", response_model=ApiResponse[List[CostRecordResponse]])
def list_cost_records(
    provider: Optional[str] = None,
    service: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(CostRecord).filter(CostRecord.workspace_id == workspace.id)
    if provider and provider.lower() != "all":
        query = query.filter(CostRecord.provider_code == provider.lower())
    if service and service.lower() != "all":
        query = query.filter(CostRecord.service_name.ilike(f"%{service}%"))
    if start_date:
        query = query.filter(CostRecord.cost_date >= start_date)
    if end_date:
        query = query.filter(CostRecord.cost_date <= end_date)

    records = query.order_by(CostRecord.cost_date.desc()).limit(limit).all()
    return ApiResponse(
        success=True,
        data=[CostRecordResponse.model_validate(r) for r in records],
        message=f"Retrieved {len(records)} cost records"
    )


@router.get("/summary", response_model=ApiResponse[CostSummaryResponse])
def get_cost_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)

    # All-time total
    total_spend = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id)
        .scalar() or 0.0
    )

    # Current 30 days
    current_month_spend = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .scalar() or 0.0
    )

    # Previous 30 days
    previous_month_spend = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= sixty_days_ago, CostRecord.cost_date < thirty_days_ago)
        .scalar() or 0.0
    )

    mom_change = (
        ((current_month_spend - previous_month_spend) / previous_month_spend * 100.0)
        if previous_month_spend > 0 else 0.0
    )

    daily_avg = current_month_spend / 30.0 if current_month_spend > 0 else 0.0
    budget_util = (
        (current_month_spend / workspace.monthly_budget * 100.0)
        if workspace.monthly_budget > 0 else 0.0
    )

    # Provider breakdown
    prov_results = (
        db.query(CostRecord.provider_code, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.provider_code)
        .all()
    )
    by_provider = {r[0]: round(float(r[1]), 2) for r in prov_results}

    # Service breakdown
    srv_results = (
        db.query(CostRecord.service_name, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.service_name)
        .order_by(func.sum(CostRecord.amount).desc())
        .limit(8)
        .all()
    )
    by_service = {r[0]: round(float(r[1]), 2) for r in srv_results}

    # Cost Center breakdown
    cc_results = (
        db.query(CostRecord.cost_center, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.cost_center)
        .all()
    )
    by_cc = {r[0]: round(float(r[1]), 2) for r in cc_results}

    # Team breakdown
    team_results = (
        db.query(CostRecord.team, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.team)
        .all()
    )
    by_team = {r[0]: round(float(r[1]), 2) for r in team_results}

    # Daily Trend for last 30 days
    trend_results = (
        db.query(CostRecord.cost_date, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= thirty_days_ago)
        .group_by(CostRecord.cost_date)
        .order_by(CostRecord.cost_date.asc())
        .all()
    )
    cost_trend = [{"date": str(r[0]), "amount": round(float(r[1]), 2)} for r in trend_results]

    return ApiResponse(
        success=True,
        data=CostSummaryResponse(
            total_spend=round(float(total_spend), 2),
            current_month_spend=round(float(current_month_spend), 2),
            previous_month_spend=round(float(previous_month_spend), 2),
            month_over_month_change_pct=round(float(mom_change), 1),
            daily_average_spend=round(float(daily_avg), 2),
            budget_utilization_pct=round(float(budget_util), 1),
            cost_efficiency_score=84.5,
            currency=workspace.currency,
            breakdown_by_provider=by_provider,
            breakdown_by_service=by_service,
            breakdown_by_cost_center=by_cc,
            breakdown_by_team=by_team,
            cost_trend=cost_trend
        ),
        message="Cost summary calculated"
    )


@router.get("/efficiency-trend", response_model=ApiResponse[List[Dict[str, Any]]])
def get_efficiency_trend(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    scores = (
        db.query(CostEfficiencyScore)
        .filter(CostEfficiencyScore.workspace_id == workspace.id)
        .order_by(CostEfficiencyScore.score_date.asc())
        .all()
    )
    data = [
        {
            "date": str(s.score_date),
            "efficiency_score": s.efficiency_score,
            "waste_percentage": s.waste_percentage,
            "idle_spend_ratio": s.idle_spend_ratio
        }
        for s in scores
    ]
    return ApiResponse(
        success=True,
        data=data,
        message="Cost efficiency trend retrieved"
    )
