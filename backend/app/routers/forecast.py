from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.workspace import Workspace
from app.models.cost import CostRecord
from app.schemas.forecast import ForecastSummaryResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace
from app.ml.forecaster import generate_cost_forecast

router = APIRouter(prefix="/api/forecast", tags=["Cost Forecasting"])


@router.get("", response_model=ApiResponse[ForecastSummaryResponse])
def get_cost_forecast_endpoint(
    days: int = Query(30, ge=7, le=90),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    cost_records = db.query(CostRecord).filter(CostRecord.workspace_id == workspace.id).all()
    records_dict = [
        {
            "cost_date": str(r.cost_date),
            "amount": r.amount
        }
        for r in cost_records
    ]

    forecast_result = generate_cost_forecast(
        cost_records=records_dict,
        days_ahead=days,
        monthly_budget=workspace.monthly_budget
    )

    return ApiResponse(
        success=True,
        data=ForecastSummaryResponse(**forecast_result),
        message=f"{days}-day time-series cost forecast generated"
    )
