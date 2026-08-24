from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    title: str
    report_type: str = "executive_summary"  # monthly_cost, anomaly_audit, executive_summary, savings_analysis
    file_format: str = "pdf"  # pdf, csv
    include_anomalies: bool = True
    include_forecasts: bool = True
    include_recommendations: bool = True


class ReportResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    report_type: str
    file_format: str
    file_path: str
    status: str
    metadata_json: str
    created_at: datetime

    class Config:
        from_attributes = True
