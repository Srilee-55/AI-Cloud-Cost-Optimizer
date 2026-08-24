import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AlertSeverity:
    INFO = "Info"
    WARNING = "Warning"
    CRITICAL = "Critical"


class AlertType:
    BUDGET_EXCEEDED = "budget_exceeded"
    BUDGET_NEAR_LIMIT = "budget_near_limit"
    COST_SPIKE = "cost_spike"
    CRITICAL_ANOMALY = "critical_anomaly"
    FORECAST_OVER_BUDGET = "forecast_over_budget"
    OPTIMIZATION_OPPORTUNITY = "optimization_opportunity"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default=AlertSeverity.WARNING, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    metadata_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="alerts")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), default="")
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=False)
    target_url = Column(String(255), default="https://hooks.slack.com/services/simulated")
    status = Column(String(50), default="simulated_delivered", nullable=False)  # simulated_delivered, failed
    response_code = Column(String(10), default="200")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
