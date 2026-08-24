import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AnomalySeverity:
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_code = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=False)
    resource_id = Column(String(255), default="unknown")
    anomaly_date = Column(Date, nullable=False)
    expected_cost = Column(Float, nullable=False)
    actual_cost = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    deviation_percent = Column(Float, nullable=False)
    severity = Column(String(50), default=AnomalySeverity.WARNING, nullable=False)
    possible_cause = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, investigated, resolved
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="anomalies")
