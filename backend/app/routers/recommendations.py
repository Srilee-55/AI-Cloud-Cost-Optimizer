from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.recommendation import AIRecommendation, RecommendationStatus
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.recommendation import (
    AIRecommendationResponse,
    RecommendationApprovalRequest,
    RecommendationSimulateRequest,
    ImpactSimulationRequest
)
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user
from app.agents.controller import AgentController
from app.ml.savings_engine import simulate_impact_slider

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])


@router.get("", response_model=ApiResponse[List[AIRecommendationResponse]])
def list_recommendations(
    status_filter: Optional[str] = None,
    provider: Optional[str] = None,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(AIRecommendation).filter(AIRecommendation.workspace_id == workspace.id)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(AIRecommendation.approval_status == status_filter.lower())
    if provider and provider.lower() != "all":
        query = query.filter(AIRecommendation.provider == provider.lower())

    recs = query.order_by(AIRecommendation.estimated_savings.desc()).all()
    return ApiResponse(
        success=True,
        data=[AIRecommendationResponse.model_validate(r) for r in recs],
        message=f"Retrieved {len(recs)} recommendations"
    )


@router.get("/{rec_id}", response_model=ApiResponse[AIRecommendationResponse])
def get_recommendation(
    rec_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    rec = db.query(AIRecommendation).filter(
        AIRecommendation.id == rec_id,
        AIRecommendation.workspace_id == workspace.id
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    return ApiResponse(
        success=True,
        data=AIRecommendationResponse.model_validate(rec),
        message="Recommendation retrieved"
    )


@router.post("/{rec_id}/approve", response_model=ApiResponse[AIRecommendationResponse])
def approve_recommendation(
    rec_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    controller = AgentController(db, workspace.id, current_user.id)
    try:
        rec = controller.approve_recommendation(rec_id)
        return ApiResponse(
            success=True,
            data=AIRecommendationResponse.model_validate(rec),
            message="Recommendation approved for simulated execution"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{rec_id}/reject", response_model=ApiResponse[AIRecommendationResponse])
def reject_recommendation(
    rec_id: str,
    req: RecommendationApprovalRequest,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    controller = AgentController(db, workspace.id, current_user.id)
    try:
        rec = controller.reject_recommendation(rec_id, req.rejection_reason or "")
        return ApiResponse(
            success=True,
            data=AIRecommendationResponse.model_validate(rec),
            message="Recommendation rejected"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{rec_id}/simulate", response_model=ApiResponse[Dict[str, Any]])
def simulate_action(
    rec_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    controller = AgentController(db, workspace.id, current_user.id)
    try:
        sim_result = controller.simulate_optimization_action(rec_id)
        return ApiResponse(
            success=True,
            data=sim_result,
            message="Simulated action executed and result recorded successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/impact-simulation", response_model=ApiResponse[Dict[str, Any]])
def simulate_impact(
    req: ImpactSimulationRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(AIRecommendation).filter(AIRecommendation.workspace_id == workspace.id)
    if req.recommendation_ids:
        query = query.filter(AIRecommendation.id.in_(req.recommendation_ids))

    recs = query.all()
    total_savings = sum(r.estimated_savings for r in recs)
    total_current = sum(r.current_cost for r in recs) or (workspace.monthly_budget * 0.8)

    simulation = simulate_impact_slider(total_savings, total_current, req.coverage_percentage)
    return ApiResponse(
        success=True,
        data=simulation,
        message=f"Dynamic impact computed for {req.coverage_percentage}% coverage"
    )
