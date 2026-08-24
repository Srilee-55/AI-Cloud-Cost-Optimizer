from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import AgentSession, AgentAction
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.agent import AgentRunRequest, AgentSessionResponse
from app.schemas.recommendation import AIRecommendationResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user
from app.agents.controller import AgentController

router = APIRouter(prefix="/api/agent", tags=["Agentic AI"])


@router.post("/run", response_model=ApiResponse[Dict[str, Any]])
def trigger_agent_run(
    req: AgentRunRequest,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers the autonomous Agentic AI Cost Optimization Pipeline:
    Observe -> Collect Evidence -> Reason -> Plan -> Recommend
    """
    controller = AgentController(db, workspace.id, current_user.id)
    result = controller.run_optimization_workflow(req.goal, req.provider)

    # Format recommendations for response
    recs = [AIRecommendationResponse.model_validate(r) for r in result["recommendations"]]

    return ApiResponse(
        success=True,
        data={
            "session_id": result["session_id"],
            "goal": result["goal"],
            "summary": result["summary"],
            "tool_trace": result["tool_trace"],
            "recommendations": recs
        },
        message="Agentic AI optimization pipeline completed successfully"
    )


@router.get("/sessions", response_model=ApiResponse[List[AgentSessionResponse]])
def list_sessions(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(AgentSession)
        .filter(AgentSession.workspace_id == workspace.id)
        .order_by(AgentSession.created_at.desc())
        .limit(20)
        .all()
    )
    return ApiResponse(
        success=True,
        data=[AgentSessionResponse.model_validate(s) for s in sessions],
        message=f"Retrieved {len(sessions)} agent sessions"
    )


@router.get("/sessions/{session_id}", response_model=ApiResponse[AgentSessionResponse])
def get_session_details(
    session_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    session = (
        db.query(AgentSession)
        .filter(AgentSession.id == session_id, AgentSession.workspace_id == workspace.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return ApiResponse(
        success=True,
        data=AgentSessionResponse.model_validate(session),
        message="Session details retrieved"
    )
