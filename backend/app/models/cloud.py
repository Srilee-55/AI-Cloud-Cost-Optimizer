import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class CloudProvider(Base):
    __tablename__ = "cloud_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)  # aws, azure, gcp
    icon = Column(String(50), default="Cloud")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    accounts = relationship("CloudAccount", back_populates="provider")


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(String(36), ForeignKey("cloud_providers.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(String(100), nullable=False)  # e.g., 123456789012 or sub-id
    account_name = Column(String(255), nullable=False)
    environment = Column(String(50), default="Production", nullable=False)  # Production, Staging, Development
    status = Column(String(50), default="Connected", nullable=False)  # Connected, Syncing, Error
    is_demo = Column(Boolean, default=False, nullable=False)
    credentials_json = Column(Text, default="{}", nullable=False)
    last_synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    workspace = relationship("Workspace", back_populates="cloud_accounts")
    provider = relationship("CloudProvider", back_populates="accounts")
    resources = relationship("CloudResource", back_populates="account", cascade="all, delete-orphan")
    cost_records = relationship("CostRecord", back_populates="account", cascade="all, delete-orphan")


class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    cloud_account_id = Column(String(36), ForeignKey("cloud_accounts.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(String(255), nullable=False, index=True)  # e.g. i-0abcd1234efgh5678
    name = Column(String(255), nullable=False)
    service_name = Column(String(100), nullable=False, index=True)  # EC2, S3, RDS, Lambda, VM, Blob, BigQuery
    resource_type = Column(String(100), nullable=False)  # compute, storage, database, serverless, networking
    region = Column(String(50), default="us-east-1", nullable=False)
    status = Column(String(50), default="running", nullable=False)  # running, stopped, idle, underutilized
    cpu_utilization = Column(Float, default=0.0)  # percentage 0 - 100
    memory_utilization = Column(Float, default=0.0)  # percentage 0 - 100
    cost_monthly = Column(Float, default=0.0, nullable=False)
    cost_center = Column(String(100), default="Engineering", nullable=False)
    team = Column(String(100), default="Platform", nullable=False)
    project = Column(String(100), default="Core Services", nullable=False)
    tags_json = Column(Text, default="{}", nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    workspace = relationship("Workspace", back_populates="cloud_resources")
    account = relationship("CloudAccount", back_populates="resources")
    cost_records = relationship("CostRecord", back_populates="resource")
