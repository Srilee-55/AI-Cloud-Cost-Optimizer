import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Float, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database import Base


class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    cloud_account_id = Column(String(36), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=True)
    cloud_resource_id = Column(String(36), ForeignKey("cloud_resources.id", ondelete="SET NULL"), nullable=True)
    
    provider_code = Column(String(50), nullable=False, index=True)  # aws, azure, gcp
    service_name = Column(String(100), nullable=False, index=True)  # EC2, S3, RDS, BigQuery, Virtual Machines
    resource_id = Column(String(255), default="unknown", nullable=False)
    region = Column(String(50), default="us-east-1", nullable=False)
    cost_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    
    cost_center = Column(String(100), default="Engineering", nullable=False, index=True)
    team = Column(String(100), default="Platform", nullable=False, index=True)
    project = Column(String(100), default="Core Services", nullable=False)
    environment = Column(String(50), default="Production", nullable=False)
    tags_json = Column(Text, default="{}", nullable=False)
    
    is_demo = Column(Boolean, default=False, nullable=False)
    source = Column(String(50), default="automated_sync", nullable=False)  # manual, csv, automated_sync
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="cost_records")
    account = relationship("CloudAccount", back_populates="cost_records")
    resource = relationship("CloudResource", back_populates="cost_records")

    __table_args__ = (
        Index("idx_workspace_date", "workspace_id", "cost_date"),
        Index("idx_workspace_provider", "workspace_id", "provider_code"),
        Index("idx_workspace_service", "workspace_id", "service_name"),
    )


class CostEfficiencyScore(Base):
    __tablename__ = "cost_efficiency_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    score_date = Column(Date, default=date.today, nullable=False)
    efficiency_score = Column(Float, nullable=False)  # 0 to 100
    waste_percentage = Column(Float, default=0.0)
    idle_spend_ratio = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
