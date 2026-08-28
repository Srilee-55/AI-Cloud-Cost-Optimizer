import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    period = Column(String(50), default="monthly", nullable=False)  # monthly, quarterly, annual
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    alert_threshold_percent = Column(Float, default=80.0, nullable=False)
    current_spend = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="healthy", nullable=False)  # healthy, warning, exceeded
    cost_center = Column(String(100), default="All", nullable=False)
    team = Column(String(100), default="All", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    workspace = relationship("Workspace", back_populates="budgets")
