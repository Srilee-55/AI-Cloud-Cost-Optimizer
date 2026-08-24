from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.cost import CostRecord
from app.models.workspace import Workspace
from app.schemas.cost import PeriodComparisonResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace

router = APIRouter(prefix="/api/analysis", tags=["Cost Analysis"])

# Demo exchange rates relative to USD
EXCHANGE_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "INR": 83.50
}


@router.get("/breakdown", response_model=ApiResponse[Dict[str, Any]])
def get_cost_breakdown(
    dimension: str = Query("service", pattern="^(service|provider|region|team|cost_center|environment)$"),
    period: str = Query("30d", pattern="^(7d|30d|90d|all)$"),
    provider: Optional[str] = None,
    currency: str = "INR",
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(CostRecord).filter(CostRecord.workspace_id == workspace.id)

    today = date.today()
    if period == "7d":
        query = query.filter(CostRecord.cost_date >= today - timedelta(days=7))
    elif period == "30d":
        query = query.filter(CostRecord.cost_date >= today - timedelta(days=30))
    elif period == "90d":
        query = query.filter(CostRecord.cost_date >= today - timedelta(days=90))

    if provider and provider.lower() != "all":
        query = query.filter(CostRecord.provider_code == provider.lower())

    # Dynamically select column
    dim_map = {
        "service": CostRecord.service_name,
        "provider": CostRecord.provider_code,
        "region": CostRecord.region,
        "team": CostRecord.team,
        "cost_center": CostRecord.cost_center,
        "environment": CostRecord.environment,
    }
    col = dim_map[dimension]

    results = (
        query.with_entities(col, func.sum(CostRecord.amount), func.count(CostRecord.id))
        .group_by(col)
        .order_by(func.sum(CostRecord.amount).desc())
        .all()
    )

    rate = EXCHANGE_RATES.get(currency.upper(), 1.0)
    total = sum(float(r[1]) for r in results) if results else 0.0

    items = []
    for r in results:
        amount_usd = float(r[1])
        amount_converted = amount_usd * rate
        pct = (amount_usd / total * 100.0) if total > 0 else 0.0
        items.append({
            "name": str(r[0]),
            "amount": round(amount_converted, 2),
            "amount_usd": round(amount_usd, 2),
            "percentage": round(pct, 1),
            "record_count": r[2]
        })

    return ApiResponse(
        success=True,
        data={
            "dimension": dimension,
            "period": period,
            "currency": currency.upper(),
            "exchange_rate": rate,
            "total_spend": round(total * rate, 2),
            "total_spend_usd": round(total, 2),
            "items": items
        },
        message=f"Cost breakdown by {dimension} generated"
    )


@router.get("/compare-periods", response_model=ApiResponse[PeriodComparisonResponse])
def compare_periods(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    today = date.today()
    p_a_start = today - timedelta(days=30)
    p_b_start = today - timedelta(days=60)
    p_b_end = p_a_start

    # Period A (Current 30 days)
    spend_a = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_a_start)
        .scalar() or 0.0
    )

    # Period B (Previous 30 days)
    spend_b = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_b_start, CostRecord.cost_date < p_b_end)
        .scalar() or 0.0
    )

    diff = spend_a - spend_b
    pct_change = ((diff / spend_b) * 100.0) if spend_b > 0 else 0.0

    # Service comparison
    srv_a = dict(
        db.query(CostRecord.service_name, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_a_start)
        .group_by(CostRecord.service_name)
        .all()
    )

    srv_b = dict(
        db.query(CostRecord.service_name, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_b_start, CostRecord.cost_date < p_b_end)
        .group_by(CostRecord.service_name)
        .all()
    )

    all_services = set(srv_a.keys()).union(set(srv_b.keys()))
    service_comparison = []
    for s in all_services:
        va = float(srv_a.get(s, 0.0))
        vb = float(srv_b.get(s, 0.0))
        s_diff = va - vb
        s_pct = ((s_diff / vb) * 100.0) if vb > 0 else (100.0 if va > 0 else 0.0)
        service_comparison.append({
            "service": s,
            "current_spend": round(va, 2),
            "previous_spend": round(vb, 2),
            "difference": round(s_diff, 2),
            "growth_percentage": round(s_pct, 1)
        })

    service_comparison.sort(key=lambda x: abs(x["difference"]), reverse=True)

    # Provider comparison
    prov_a = dict(
        db.query(CostRecord.provider_code, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_a_start)
        .group_by(CostRecord.provider_code)
        .all()
    )
    prov_b = dict(
        db.query(CostRecord.provider_code, func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace.id, CostRecord.cost_date >= p_b_start, CostRecord.cost_date < p_b_end)
        .group_by(CostRecord.provider_code)
        .all()
    )

    provider_comparison = []
    for p in ["aws", "azure", "gcp"]:
        va = float(prov_a.get(p, 0.0))
        vb = float(prov_b.get(p, 0.0))
        p_diff = va - vb
        p_pct = ((p_diff / vb) * 100.0) if vb > 0 else 0.0
        provider_comparison.append({
            "provider": p.upper(),
            "current_spend": round(va, 2),
            "previous_spend": round(vb, 2),
            "difference": round(p_diff, 2),
            "growth_percentage": round(p_pct, 1)
        })

    return ApiResponse(
        success=True,
        data=PeriodComparisonResponse(
            period_a_label="Current 30 Days",
            period_b_label="Previous 30 Days",
            period_a_total=round(float(spend_a), 2),
            period_b_total=round(float(spend_b), 2),
            cost_difference=round(float(diff), 2),
            percentage_change=round(float(pct_change), 1),
            major_contributors=service_comparison[:5],
            service_comparison=service_comparison,
            provider_comparison=provider_comparison
        ),
        message="Period comparison completed"
    )
