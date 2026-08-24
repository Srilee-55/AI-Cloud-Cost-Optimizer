from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class UserResourceInput(BaseModel):
    cloud_provider: str = Field("aws", description="Cloud Provider (aws, azure, gcp, other)")
    resource_id: str = Field(..., description="Unique Identifier / ARN / Name of resource")
    resource_name: Optional[str] = Field(None, description="Human readable name of resource")
    resource_type: str = Field("compute", description="Resource type: compute, database, storage, network, other")
    service_name: str = Field("EC2", description="Specific service name, e.g. EC2, RDS, S3, Virtual Machines")
    region: str = Field("ap-south-1", description="Deployment region")
    monthly_cost: float = Field(..., ge=0.0, description="Current monthly cost in INR (₹)")
    cpu_utilization: Optional[float] = Field(None, ge=0.0, le=100.0, description="Average CPU Utilization % (0-100)")
    memory_utilization: Optional[float] = Field(None, ge=0.0, le=100.0, description="Average Memory Utilization % (0-100)")
    storage_usage_gb: Optional[float] = Field(None, ge=0.0, description="Storage size in GB if applicable")
    hours_per_day: Optional[float] = Field(24.0, ge=1.0, le=24.0, description="Hours required per day")
    environment: str = Field("Production", description="Environment: Production, Staging, Development, Test")
    status: str = Field("running", description="Status: running, idle, stopped, underutilized, unattached")
    tags: Optional[Dict[str, str]] = None


class SavingsAnalysisRequest(BaseModel):
    resources: List[UserResourceInput] = Field(..., min_length=1, description="List of user-provided cloud resources to analyze")
    analysis_period: Optional[str] = Field("30d", description="Analysis horizon: 7d, 30d, 90d")
    currency: Optional[str] = Field("INR", description="Analysis Currency: INR (₹)")
    custom_baseline_spend: Optional[float] = Field(None, ge=0.0, description="Optional override for total monthly baseline")


class ActionableSavingsOpportunity(BaseModel):
    id: str
    title: str
    category: str  # rightsizing, idle_termination, scheduling, storage_tiering, commitments
    category_label: str
    provider_code: str
    service_name: str
    resource_id: str
    resource_name: str
    environment: str
    why: str
    evidence: Dict[str, Any]
    current_monthly_spend: float
    estimated_monthly_spend: float
    estimated_monthly_savings: float
    estimated_annual_savings: float
    savings_percent: float
    risk_level: str  # Low, Medium, High
    risk_reason: str
    effort_level: str  # Low, Medium, High
    effort_reason: str
    confidence_score: float  # e.g. 0.95
    confidence_level: str  # High, Medium, Low
    confidence_reason: str
    suggested_action: str
    status: str = "active"


class UserSavingsAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_monthly_spend: float
    potential_monthly_savings: float
    potential_annual_savings: float
    estimated_optimized_spend: float
    overall_savings_percentage: float
    savings_by_category: Dict[str, float]
    savings_by_provider: Dict[str, float]
    resource_count: int
    analyzed_resources_count: int
    opportunities_count: int
    opportunities: List[ActionableSavingsOpportunity]
    currency: str = "INR"
    currency_symbol: str = "₹"
    analysis_timestamp: datetime
    data_source: str = "user_submitted_data"
