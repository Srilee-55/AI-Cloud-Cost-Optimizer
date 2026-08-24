from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.cost import CostRecord
from app.models.budget import Budget
from app.models.workspace import Workspace
from app.ml.forecaster import generate_cost_forecast


def forecast_cost(db: Session, workspace_id: str, days_ahead: int = 30) -> Dict[str, Any]:
    """Tool: Generates future cost projections and variance estimates against budget."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    monthly_budget = workspace.monthly_budget if workspace else 10000.0

    records = db.query(CostRecord).filter(CostRecord.workspace_id == workspace_id).all()
    records_dict = [
        {
            "cost_date": str(r.cost_date),
            "amount": r.amount
        }
        for r in records
    ]

    forecast_data = generate_cost_forecast(records_dict, days_ahead=days_ahead, monthly_budget=monthly_budget)
    return forecast_data


def get_budget_status(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Retrieves budget utilization and threshold alerts."""
    budgets = db.query(Budget).filter(Budget.workspace_id == workspace_id).all()
    if not budgets:
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        mb = workspace.monthly_budget if workspace else 10000.0
        return {
            "budget_configured": False,
            "monthly_budget": mb,
            "status": "healthy",
            "utilization_percentage": 65.0
        }

    b = budgets[0]
    utilization = (b.current_spend / b.amount * 100.0) if b.amount > 0 else 0.0
    return {
        "budget_configured": True,
        "name": b.name,
        "amount": b.amount,
        "current_spend": b.current_spend,
        "utilization_percentage": round(utilization, 1),
        "status": "exceeded" if utilization >= 100 else ("warning" if utilization >= b.alert_threshold_percent else "healthy"),
        "alert_threshold": b.alert_threshold_percent
    }
