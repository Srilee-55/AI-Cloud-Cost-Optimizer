import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    goal = Column(Text, nullable=False)
    status = Column(String(50), default="in_progress", nullable=False)  # in_progress, completed, failed
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="agent_sessions")
    actions = relationship("AgentAction", back_populates="session", cascade="all, delete-orphan", order_by="AgentAction.step_number")
    recommendations = relationship("AIRecommendation", back_populates="session")


class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    tool_name = Column(String(100), nullable=False)
    purpose = Column(String(255), default="")
    tool_input_json = Column(Text, default="{}", nullable=False)
    tool_output_json = Column(Text, default="{}", nullable=False)
    duration_ms = Column(Float, default=0.0)
    status = Column(String(50), default="success", nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("AgentSession", back_populates="actions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(36), nullable=True)
    
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    evidence_json = Column(Text, default="[]", nullable=False)
    tools_consulted_json = Column(Text, default="[]", nullable=False)
    recommendations_json = Column(Text, default="[]", nullable=False)
    confidence = Column(Float, default=0.95)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
