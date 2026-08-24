import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), default="executive_summary", nullable=False)  # monthly_cost, anomaly_audit, executive_summary, savings_analysis
    file_format = Column(String(20), default="pdf", nullable=False)  # pdf, csv
    file_path = Column(String(500), default="")
    status = Column(String(50), default="completed", nullable=False)  # completed, generating, failed
    metadata_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="reports")
