import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.recommendation import AIRecommendation, RecommendationStatus
from app.models.alert import Alert, AlertSeverity, AlertType


def generate_optimization_plan(
    evidence: Dict[str, Any],
    provider: str = "aws"
) -> List[Dict[str, Any]]:
    """
    Synthesizes collected evidence (costs, idle resources, underutilized nodes, anomalies)
    into structured, explainable recommendation plans with savings estimates.
    """
    recommendations = []

    # 1. Idle Resource Plan
    idle_data = evidence.get("idle_resources", {})
    if idle_data and idle_data.get("idle_resource_count", 0) > 0:
        wasted = idle_data.get("total_wasted_monthly_cost", 0.0)
        count = idle_data.get("idle_resource_count", 0)
        items = idle_data.get("idle_resources", [])
        sample_names = ", ".join(i["name"] for i in items[:3])
        
        recommendations.append({
            "title": f"Terminate {count} Orphaned / Idle Cloud Resources",
            "problem": f"Detected {count} completely idle or stopped resources ({sample_names}) generating zero business value but incurring monthly storage/holding costs.",
            "evidence": {
                "idle_count": count,
                "monthly_waste": wasted,
                "flagged_resources": items
            },
            "possible_cause": "Orphaned dev/test instances, unattached EBS/disk volumes, or legacy staging deployments left running after deployment cycles.",
            "recommended_action": "Safely create snapshot backups and terminate the idle resources. Configure auto-shutdown schedules for non-production environments.",
            "current_cost": wasted,
            "optimized_estimated_cost": round(wasted * 0.05, 2),
            "estimated_savings": round(wasted * 0.95, 2),
            "savings_percentage": 95.0,
            "priority": "Critical" if wasted > 200 else "High",
            "confidence": 0.98,
            "risk_level": "Low",
            "provider": provider if provider != "all" else "aws",
            "service": "Compute / Storage",
            "resource_id": items[0]["id"] if items else "idle-fleet"
        })

    # 2. Underutilized Rightsizing Plan
    underutilized_data = evidence.get("underutilized_resources", {})
    if underutilized_data and underutilized_data.get("underutilized_count", 0) > 0:
        count = underutilized_data.get("underutilized_count", 0)
        curr = underutilized_data.get("current_monthly_spend", 0.0)
        sav = underutilized_data.get("potential_monthly_savings", 0.0)
        items = underutilized_data.get("underutilized_resources", [])
        
        recommendations.append({
            "title": f"Rightsize {count} Overprovisioned Compute Instances",
            "problem": f"Found {count} compute instances running with sustained CPU utilization under 25%, resulting in substantial unutilized capacity spend.",
            "evidence": {
                "underutilized_count": count,
                "current_spend": curr,
                "potential_savings": sav,
                "flagged_resources": items
            },
            "possible_cause": "Instances were provisioned for peak historical traffic spikes that are no longer active, or provisioned generously during initial launch.",
            "recommended_action": "Downsize instance families (e.g. from 2xlarge to xlarge) during standard maintenance windows or implement dynamic autoscaling targets.",
            "current_cost": curr,
            "optimized_estimated_cost": round(curr - sav, 2),
            "estimated_savings": sav,
            "savings_percentage": round((sav / curr * 100.0) if curr > 0 else 50.0, 1),
            "priority": "High",
            "confidence": 0.92,
            "risk_level": "Low",
            "provider": provider if provider != "all" else "aws",
            "service": "EC2 / Virtual Machines",
            "resource_id": items[0]["id"] if items else "compute-fleet"
        })

    # 3. Anomaly Remediation Plan
    anomaly_data = evidence.get("anomalies", {})
    if anomaly_data and anomaly_data.get("critical_count", 0) > 0:
        crit_anomalies = [a for a in anomaly_data.get("anomalies", []) if a.get("severity") == "Critical"]
        if crit_anomalies:
            top_anom = crit_anomalies[0]
            recommendations.append({
                "title": f"Mitigate Critical Cost Spike in {top_anom.get('service', 'Cloud Service')}",
                "problem": f"A severe cost spike of +{top_anom.get('deviation_percent')}% (${top_anom.get('difference')}) was identified on {top_anom.get('date')}.",
                "evidence": {
                    "anomaly_details": top_anom
                },
                "possible_cause": top_anom.get("possible_cause", "Unscheduled burst traffic or runaway job."),
                "recommended_action": top_anom.get("recommended_action", "Implement hard concurrency caps and review recent deployments."),
                "current_cost": top_anom.get("actual_cost", 100.0),
                "optimized_estimated_cost": top_anom.get("expected_cost", 50.0),
                "estimated_savings": top_anom.get("difference", 50.0),
                "savings_percentage": round(min(80.0, top_anom.get("deviation_percent", 50.0)), 1),
                "priority": "Critical",
                "confidence": 0.95,
                "risk_level": "Medium",
                "provider": top_anom.get("provider", "aws"),
                "service": top_anom.get("service", "Cloud Service"),
                "resource_id": top_anom.get("resource_id", "spike-target")
            })

    # 4. Storage & Savings Plans Macro Optimization
    savings_data = evidence.get("savings_estimates", {})
    if savings_data and savings_data.get("potential_monthly_savings", 0) > 0:
        macro_sav = savings_data.get("potential_monthly_savings", 0.0)
        tot_spend = savings_data.get("total_monthly_spend", 0.0)
        if len(recommendations) < 3 and macro_sav > 100.0:
            recommendations.append({
                "title": "Enable 1-Year Compute Savings Plans & Object Lifecycle Tiering",
                "problem": "Consistent baseline production workloads are being billed on standard on-demand pricing without commitment discount coverage.",
                "evidence": {
                    "monthly_spend": tot_spend,
                    "savings_estimates": savings_data.get("savings_by_category", {})
                },
                "possible_cause": "No active Savings Plans or Reserved Instance commitments currently covering baseline production compute.",
                "recommended_action": "Commit to a 1-year No-Upfront Compute Savings Plan for steady baseline capacity to lock in 28-34% hourly discounts.",
                "current_cost": tot_spend * 0.40,
                "optimized_estimated_cost": (tot_spend * 0.40) * 0.70,
                "estimated_savings": round((tot_spend * 0.40) * 0.30, 2),
                "savings_percentage": 30.0,
                "priority": "Medium",
                "confidence": 0.95,
                "risk_level": "Low",
                "provider": "aws",
                "service": "Savings Plans",
                "resource_id": "global-commitments"
            })

    return recommendations


def save_recommendation(
    db: Session,
    workspace_id: str,
    recommendation_data: Dict[str, Any],
    session_id: str = None,
    tool_trace: List[Dict[str, Any]] = None
) -> AIRecommendation:
    """Saves a generated recommendation into the database with pending approval state and tool trace."""
    rec = AIRecommendation(
        workspace_id=workspace_id,
        session_id=session_id,
        title=recommendation_data["title"],
        problem=recommendation_data["problem"],
        evidence_json=json.dumps(recommendation_data.get("evidence", {}), default=str),
        possible_cause=recommendation_data["possible_cause"],
        recommended_action=recommendation_data["recommended_action"],
        current_cost=float(recommendation_data["current_cost"]),
        optimized_estimated_cost=float(recommendation_data["optimized_estimated_cost"]),
        estimated_savings=float(recommendation_data["estimated_savings"]),
        savings_percentage=float(recommendation_data["savings_percentage"]),
        priority=recommendation_data.get("priority", "Medium"),
        confidence=float(recommendation_data.get("confidence", 0.90)),
        risk_level=recommendation_data.get("risk_level", "Low"),
        provider=recommendation_data.get("provider", "aws"),
        service=recommendation_data.get("service", "General"),
        resource_id=recommendation_data.get("resource_id", "fleet"),
        approval_status=RecommendationStatus.PENDING,
        tool_trace_json=json.dumps(tool_trace or [], default=str)
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def create_alert(
    db: Session,
    workspace_id: str,
    alert_type: str,
    title: str,
    message: str,
    severity: str = AlertSeverity.WARNING,
    metadata: Dict[str, Any] = None
) -> Alert:
    """Creates a system alert and persists it in PostgreSQL/SQLite."""
    alert = Alert(
        workspace_id=workspace_id,
        alert_type=alert_type,
        title=title,
        message=message,
        severity=severity,
        metadata_json=json.dumps(metadata or {}, default=str)
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
