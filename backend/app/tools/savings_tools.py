from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.cloud import CloudResource
from app.models.cost import CostRecord
from app.ml.savings_engine import calculate_savings_opportunities, simulate_impact_slider


def estimate_savings(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Calculates realistic savings across rightsizing, idle cleanup, tiering, and savings plans."""
    resources = db.query(CloudResource).filter(CloudResource.workspace_id == workspace_id).all()
    res_dicts = [
        {
            "id": r.id,
            "resource_id": r.resource_id,
            "name": r.name,
            "service_name": r.service_name,
            "provider_code": r.account.provider.code if r.account and r.account.provider else "aws",
            "cpu_utilization": r.cpu_utilization,
            "memory_utilization": r.memory_utilization,
            "cost_monthly": r.cost_monthly,
            "status": r.status
        }
        for r in resources
    ]

    total_monthly = (
        db.query(func.sum(CostRecord.amount))
        .filter(CostRecord.workspace_id == workspace_id)
        .scalar() or 0.0
    )
    if total_monthly == 0.0:
        total_monthly = sum(r.cost_monthly for r in resources) or 5000.0

    return calculate_savings_opportunities(res_dicts, float(total_monthly))


def simulate_optimization_impact(db: Session, workspace_id: str, coverage_percentage: float = 100.0) -> Dict[str, Any]:
    """Tool: Simulates cost reduction and savings impact based on a coverage percentage slider."""
    savings_data = estimate_savings(db, workspace_id)
    base_savings = savings_data["potential_monthly_savings"]
    current_spend = savings_data["total_monthly_spend"]

    return simulate_impact_slider(base_savings, current_spend, coverage_percentage)
