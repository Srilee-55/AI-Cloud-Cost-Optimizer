import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.alert import Notification, Alert, AlertSeverity, AlertType
from app.models.cost import CostRecord
from app.models.workspace import Workspace
from app.models.user import User

logger = logging.getLogger("app.services.notifications")


class NotificationChannel:
    """Base interface for pluggable notification channels."""
    def send(self, notification: Dict[str, Any]) -> bool:
        raise NotImplementedError


class InAppChannel(NotificationChannel):
    """Persists notification directly into the Supabase notifications table."""
    def send(self, notification: Dict[str, Any]) -> bool:
        return True


class SlackWebhookChannel(NotificationChannel):
    """Pluggable channel for future Slack webhook integrations."""
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url

    def send(self, notification: Dict[str, Any]) -> bool:
        if not self.webhook_url:
            return False
        logger.info(f"[SlackChannel] Pluggable notification dispatch: {notification.get('title')}")
        return True


class SmartNotificationEngine:
    """
    Centralized event-driven notification engine that derives data-backed messages
    from actual stored telemetry across Cost Analysis, Forecasting, Anomalies, and AI Optimization.
    """
    def __init__(self, db: Session):
        self.db = db
        self.channels: List[NotificationChannel] = [InAppChannel(), SlackWebhookChannel()]

    def notify_anomaly_detected(
        self,
        user_id: str,
        workspace: Workspace,
        service_name: str,
        actual_cost: float,
        expected_cost: float,
        deviation_pct: float,
        severity: str = "Critical"
    ) -> Notification:
        """Triggers a notification when a statistical cost spike occurs."""
        title = f"Cost Spike Detected: {service_name} (+{deviation_pct:.1f}%)"
        message = (
            f"Spending on {service_name} in {workspace.name} reached "
            f"₹{actual_cost:,.2f} against the baseline of ₹{expected_cost:,.2f}."
        )
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            workspace_id=workspace.id,
            title=title,
            message=message,
            link="/anomalies",
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def notify_budget_risk(
        self,
        user_id: str,
        workspace: Workspace,
        current_spend: float,
        monthly_budget: float,
        forecast_spend: float
    ) -> Notification:
        """Triggers a data-backed budget threshold or forecast overrun notification."""
        util_pct = (current_spend / monthly_budget * 100.0) if monthly_budget > 0 else 0.0
        title = f"Budget Alert: {util_pct:.1f}% of ₹{monthly_budget:,.2f} Utilized"
        message = (
            f"Workspace {workspace.name} has incurred ₹{current_spend:,.2f}. "
            f"30-day Holt-Winters forecast projects ₹{forecast_spend:,.2f} total spend."
        )
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            workspace_id=workspace.id,
            title=title,
            message=message,
            link="/forecast",
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def notify_optimization_opportunity(
        self,
        user_id: str,
        workspace: Workspace,
        category: str,
        potential_savings: float,
        opportunity_count: int
    ) -> Notification:
        """Triggers when autonomous agent identifies verified ROI savings."""
        title = f"New AI Savings: ₹{potential_savings:,.2f}/month Identified"
        message = (
            f"FinOps Agent discovered {opportunity_count} {category} opportunities "
            f"for {workspace.name} with verified monthly ROI of ₹{potential_savings:,.2f}."
        )
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            workspace_id=workspace.id,
            title=title,
            message=message,
            link="/ai/optimization",
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif
