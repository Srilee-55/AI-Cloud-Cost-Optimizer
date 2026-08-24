import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_type = Column(String(50), nullable=False)  # 7_day, 30_day, next_month
    target_date = Column(Date, nullable=False)
    predicted_cost = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.85, nullable=False)  # 0 to 1
    method = Column(String(50), default="exponential_smoothing", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="forecasts")


class SavingsEstimate(Base):
    __tablename__ = "savings_estimates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # rightsizing, idle_termination, reserved_instances, storage_tiering
    provider_code = Column(String(50), nullable=False)
    service_name = Column(String(100), nullable=False)
    current_monthly_spend = Column(Float, nullable=False)
    estimated_monthly_spend = Column(Float, nullable=False)
    estimated_monthly_savings = Column(Float, nullable=False)
    savings_percent = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.9, nullable=False)
    risk_level = Column(String(50), default="Low", nullable=False)  # Low, Medium, High
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="savings_estimates")
