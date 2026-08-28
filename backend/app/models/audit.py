import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), default="system@optimizer.ai", nullable=False)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, LOGOUT, UPLOAD_COSTS, AI_RUN, APPROVE_RECOMMENDATION, SIMULATE_OPTIMIZATION, etc.
    resource_type = Column(String(100), nullable=False)  # User, CostRecord, AIRecommendation, CloudAccount, etc.
    resource_id = Column(String(255), default="")
    details_json = Column(Text, default="{}", nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    workspace = relationship("Workspace", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
