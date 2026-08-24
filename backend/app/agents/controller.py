import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.planner import AgentPlanner
from app.agents.memory import AgentMemory
from app.agents.decision_engine import DecisionEngine
from app.models.recommendation import AIRecommendation, RecommendationStatus
from app.models.audit import AuditLog
from app.models.alert import Alert, AlertSeverity, AlertType
from app.ml.savings_engine import simulate_impact_slider


class AgentController:
    """
    Main Agent Controller orchestrating the end-to-end Agentic AI workflow:
    Observe -> Collect Evidence -> Reason -> Plan -> Recommend -> Human Approval -> Simulate Action -> Record Result
    """
    def __init__(self, db: Session, workspace_id: str, user_id: Optional[str] = None):
        self.db = db
        self.workspace_id = workspace_id
        self.user_id = user_id

    def run_optimization_workflow(self, goal: str, provider: str = "all") -> Dict[str, Any]:
        """Runs the autonomous agent optimization pipeline."""
        # 1. Observe: Initialize memory and session
        memory = AgentMemory(self.db, self.workspace_id)
        session = memory.create_session(goal, user_id=self.user_id)

        # 2. Plan: Build the tool calling execution graph
        plan_steps = AgentPlanner.create_plan(goal, provider)

        # 3. Reason & Execute Tools: Gather evidence and synthesize recommendations
        engine = DecisionEngine(self.db, self.workspace_id, memory)
        result = engine.run_agentic_pipeline(goal, plan_steps)

        # 4. Audit Log
        audit = AuditLog(
            workspace_id=self.workspace_id,
            user_id=self.user_id,
            action="AI_OPTIMIZATION_RUN",
            resource_type="AgentSession",
            resource_id=session.id,
            details_json=json.dumps({"goal": goal, "recommendations_count": len(result["recommendations"])})
        )
        self.db.add(audit)
        self.db.commit()

        return result

    def approve_recommendation(self, recommendation_id: str) -> AIRecommendation:
        """Human-in-the-loop: Approve recommendation for simulated execution."""
        rec = self.db.query(AIRecommendation).filter(
            AIRecommendation.id == recommendation_id,
            AIRecommendation.workspace_id == self.workspace_id
        ).first()
        if not rec:
            raise ValueError("Recommendation not found")

        rec.approval_status = RecommendationStatus.APPROVED
        rec.approved_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(rec)

        # Record audit log
        audit = AuditLog(
            workspace_id=self.workspace_id,
            user_id=self.user_id,
            action="APPROVE_RECOMMENDATION",
            resource_type="AIRecommendation",
            resource_id=rec.id,
            details_json=json.dumps({"title": rec.title, "estimated_savings": rec.estimated_savings})
        )
        self.db.add(audit)
        self.db.commit()

        return rec

    def reject_recommendation(self, recommendation_id: str, reason: str = "") -> AIRecommendation:
        """Human-in-the-loop: Reject recommendation."""
        rec = self.db.query(AIRecommendation).filter(
            AIRecommendation.id == recommendation_id,
            AIRecommendation.workspace_id == self.workspace_id
        ).first()
        if not rec:
            raise ValueError("Recommendation not found")

        rec.approval_status = RecommendationStatus.REJECTED
        rec.rejected_at = datetime.utcnow()
        rec.rejection_reason = reason or "Rejected by user"
        self.db.commit()
        self.db.refresh(rec)

        audit = AuditLog(
            workspace_id=self.workspace_id,
            user_id=self.user_id,
            action="REJECT_RECOMMENDATION",
            resource_type="AIRecommendation",
            resource_id=rec.id,
            details_json=json.dumps({"reason": reason})
        )
        self.db.add(audit)
        self.db.commit()

        return rec

    def simulate_optimization_action(self, recommendation_id: str) -> Dict[str, Any]:
        """
        Simulate Action: Executes a safe, non-destructive simulation of the approved optimization.
        Calculates projected runtime cost reduction and records result in audit log.
        """
        rec = self.db.query(AIRecommendation).filter(
            AIRecommendation.id == recommendation_id,
            AIRecommendation.workspace_id == self.workspace_id
        ).first()
        if not rec:
            raise ValueError("Recommendation not found")

        # Must be approved or pending
        if rec.approval_status == RecommendationStatus.REJECTED:
            raise ValueError("Cannot simulate a rejected recommendation")

        simulation_result = {
            "simulation_id": f"sim-{rec.id[:8]}",
            "action_executed": f"SIMULATED: {rec.recommended_action}",
            "target_resource": rec.resource_id,
            "provider": rec.provider,
            "service": rec.service,
            "original_monthly_cost": rec.current_cost,
            "projected_monthly_cost": rec.optimized_estimated_cost,
            "achieved_monthly_savings": rec.estimated_savings,
            "achieved_annual_savings": round(rec.estimated_savings * 12, 2),
            "safety_status": "SIMULATION_SUCCESS - No live production infrastructure modified.",
            "timestamp": datetime.utcnow().isoformat()
        }

        rec.approval_status = RecommendationStatus.SIMULATED
        rec.simulated_at = datetime.utcnow()
        rec.simulated_result_json = json.dumps(simulation_result)
        self.db.commit()

        # Audit log the simulation
        audit = AuditLog(
            workspace_id=self.workspace_id,
            user_id=self.user_id,
            action="SIMULATE_OPTIMIZATION",
            resource_type="AIRecommendation",
            resource_id=rec.id,
            details_json=json.dumps(simulation_result)
        )
        self.db.add(audit)
        self.db.commit()

        return simulation_result
