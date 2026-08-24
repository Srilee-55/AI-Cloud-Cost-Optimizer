from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.cost import CostRecord


def get_cost_records(
    db: Session,
    workspace_id: str,
    start_date: str = None,
    end_date: str = None,
    provider_code: str = None,
    service_name: str = None,
    limit: int = 100
) -> Dict[str, Any]:
    """Tool: Retrieve structured cost records for a workspace with optional filters."""
    query = db.query(CostRecord).filter(CostRecord.workspace_id == workspace_id)
    
    if provider_code and provider_code.lower() != "all":
        query = query.filter(CostRecord.provider_code == provider_code.lower())
    if service_name and service_name.lower() != "all":
        query = query.filter(CostRecord.service_name == service_name)
    if start_date:
        query = query.filter(CostRecord.cost_date >= start_date)
    if end_date:
        query = query.filter(CostRecord.cost_date <= end_date)
        
    records = query.order_by(CostRecord.cost_date.desc()).limit(limit).all()
    total_amount = sum(r.amount for r in records)
    
    return {
        "count": len(records),
        "total_amount": round(total_amount, 2),
        "currency": records[0].currency if records else "USD",
        "sample_records": [
            {
                "id": r.id,
                "provider": r.provider_code,
                "service": r.service_name,
                "resource_id": r.resource_id,
                "date": str(r.cost_date),
                "amount": round(r.amount, 2),
                "cost_center": r.cost_center,
                "team": r.team
            }
            for r in records[:15]
        ]
    }


def get_service_costs(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Aggregates spending by cloud service across all accounts."""
    results = (
        db.query(
            CostRecord.provider_code,
            CostRecord.service_name,
            func.sum(CostRecord.amount).label("total_spend"),
            func.count(CostRecord.id).label("record_count")
        )
        .filter(CostRecord.workspace_id == workspace_id)
        .group_by(CostRecord.provider_code, CostRecord.service_name)
        .order_by(func.sum(CostRecord.amount).desc())
        .all()
    )

    services = [
        {
            "provider": r[0],
            "service": r[1],
            "total_spend": round(float(r[2]), 2),
            "record_count": r[3]
        }
        for r in results
    ]

    total_spend = sum(s["total_spend"] for s in services)

    return {
        "total_services_count": len(services),
        "overall_spend": round(total_spend, 2),
        "top_services": services[:8]
    }


def calculate_cost_growth(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Calculates month-over-month and 30-day cost growth velocity."""
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)

    current_period = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace_id, CostRecord.cost_date >= thirty_days_ago)
        .scalar() or 0.0
    )

    previous_period = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace_id, CostRecord.cost_date >= sixty_days_ago, CostRecord.cost_date < thirty_days_ago)
        .scalar() or 0.0
    )

    diff = current_period - previous_period
    growth_pct = ((diff / previous_period) * 100.0) if previous_period > 0 else 0.0

    return {
        "current_30d_spend": round(float(current_period), 2),
        "previous_30d_spend": round(float(previous_period), 2),
        "cost_difference": round(float(diff), 2),
        "growth_percentage": round(float(growth_pct), 1),
        "is_accelerating": growth_pct > 15.0
    }


def compare_provider_costs(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Compares spending, service diversity, and growth across AWS, Azure, and GCP."""
    results = (
        db.query(
            CostRecord.provider_code,
            func.sum(CostRecord.amount).label("total_spend"),
            func.count(func.distinct(CostRecord.service_name)).label("service_count")
        )
        .filter(CostRecord.workspace_id == workspace_id)
        .group_by(CostRecord.provider_code)
        .all()
    )

    providers = {
        r[0]: {
            "total_spend": round(float(r[1]), 2),
            "service_count": r[2]
        }
        for r in results
    }

    total = sum(p["total_spend"] for p in providers.values())
    for k in providers:
        providers[k]["percentage_of_total"] = round((providers[k]["total_spend"] / total) * 100.0 if total > 0 else 0, 1)

    return {
        "total_cloud_spend": round(total, 2),
        "providers": providers
    }
