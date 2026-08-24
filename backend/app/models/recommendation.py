import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class RecommendationStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SIMULATED = "simulated"


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("agent_sessions.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    problem = Column(Text, nullable=False)
    evidence_json = Column(Text, default="{}", nullable=False)  # JSON structured evidence collected by tools
    possible_cause = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    
    current_cost = Column(Float, nullable=False)
    optimized_estimated_cost = Column(Float, nullable=False)
    estimated_savings = Column(Float, nullable=False)
    savings_percentage = Column(Float, nullable=False)
    
    priority = Column(String(50), default="Medium", nullable=False)  # Low, Medium, High, Critical
    confidence = Column(Float, default=0.90, nullable=False)  # 0.0 to 1.0
    risk_level = Column(String(50), default="Low", nullable=False)  # Low, Medium, High
    
    provider = Column(String(50), default="aws", nullable=False)
    service = Column(String(100), default="EC2", nullable=False)
    resource_id = Column(String(255), default="multiple")
    
    # Human-in-the-loop Approval & Simulation
    approval_status = Column(String(50), default=RecommendationStatus.PENDING, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    simulated_at = Column(DateTime, nullable=True)
    simulated_result_json = Column(Text, default="{}", nullable=True)
    
    # Explainability tool-call trace
    tool_trace_json = Column(Text, default="[]", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="ai_recommendations")
    session = relationship("AgentSession", back_populates="recommendations")
