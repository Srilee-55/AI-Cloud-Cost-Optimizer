import json
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert, Notification, WebhookEvent, AlertSeverity, AlertType
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.alert import AlertResponse, NotificationResponse, WebhookEventResponse
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_workspace, get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])


@router.get("", response_model=ApiResponse[List[AlertResponse]])
def list_alerts(
    severity: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(Alert.workspace_id == workspace.id)
    if severity and severity.lower() != "all":
        query = query.filter(Alert.severity == severity.capitalize())

    alerts = query.order_by(Alert.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[AlertResponse.model_validate(a) for a in alerts],
        message=f"Retrieved {len(alerts)} alerts"
    )


@router.put("/{alert_id}/read", response_model=ApiResponse[AlertResponse])
def mark_alert_read(
    alert_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.workspace_id == workspace.id
    ).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return ApiResponse(
        success=True,
        data=AlertResponse.model_validate(alert),
        message="Alert marked as read"
    )


@router.delete("/{alert_id}", response_model=ApiResponse[dict])
def delete_alert(
    alert_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.workspace_id == workspace.id
    ).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return ApiResponse(
        success=True,
        data={"deleted": True},
        message="Alert dismissed"
    )


@router.get("/notifications", response_model=ApiResponse[List[NotificationResponse]])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return ApiResponse(
        success=True,
        data=[NotificationResponse.model_validate(n) for n in notifs],
        message=f"Retrieved {len(notifs)} notifications"
    )


@router.post("/webhook/test", response_model=ApiResponse[WebhookEventResponse])
def test_critical_alert_webhook(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Simulates dispatching a Critical Alert payload to an outbound Slack/Email webhook."""
    payload = {
        "event": "CRITICAL_COST_ANOMALY_TRIGGERED",
        "workspace_id": workspace.id,
        "workspace_name": workspace.name,
        "severity": "CRITICAL",
        "details": {
            "title": "EC2 Sudden +185% Spike Alert",
            "service": "AWS EC2",
            "actual_cost": 366.22,
            "expected_baseline": 128.50,
            "timestamp": datetime.utcnow().isoformat()
        },
        "delivery_target": "Slack #cloud-cost-alerts"
    }

    event = WebhookEvent(
        workspace_id=workspace.id,
        event_type="CRITICAL_ANOMALY_WEBHOOK",
        payload_json=json.dumps(payload),
        target_url="https://hooks.slack.com/services/simulated-channel",
        status="simulated_delivered",
        response_code="200"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return ApiResponse(
        success=True,
        data=WebhookEventResponse.model_validate(event),
        message="Critical webhook event dispatched and recorded (simulated delivery)."
    )
