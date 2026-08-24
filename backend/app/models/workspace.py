import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AccountType:
    STARTUP = "Startup"
    GROWING = "Growing Business"
    ENTERPRISE = "Enterprise/Professional"
    INDIVIDUAL = "Individual/Freelancer"
    DEMO = "Just Exploring / Demo"

    ALL = [STARTUP, GROWING, ENTERPRISE, INDIVIDUAL, DEMO]


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    account_type = Column(String(50), default=AccountType.GROWING, nullable=False)
    monthly_budget = Column(Float, default=1000000.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    checklist_json = Column(Text, default="{}", nullable=False)  # Store auto-completed checklist items
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    cloud_accounts = relationship("CloudAccount", back_populates="workspace", cascade="all, delete-orphan")
    cloud_resources = relationship("CloudResource", back_populates="workspace", cascade="all, delete-orphan")
    cost_records = relationship("CostRecord", back_populates="workspace", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="workspace", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="workspace", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="workspace", cascade="all, delete-orphan")
    savings_estimates = relationship("SavingsEstimate", back_populates="workspace", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="workspace", cascade="all, delete-orphan")
    agent_sessions = relationship("AgentSession", back_populates="workspace", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="workspace", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="workspace", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="Admin", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_memberships")
