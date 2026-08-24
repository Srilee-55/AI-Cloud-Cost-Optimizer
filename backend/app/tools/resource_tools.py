from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.cloud import CloudResource


def get_resource_usage(db: Session, workspace_id: str, provider: str = None) -> Dict[str, Any]:
    """Tool: Returns live CPU, Memory, and monthly cost metrics for cloud resources."""
    query = db.query(CloudResource).filter(CloudResource.workspace_id == workspace_id)
    if provider and provider.lower() != "all":
        query = query.filter(CloudResource.service_name.ilike(f"%{provider}%"))

    resources = query.all()
    avg_cpu = sum(r.cpu_utilization for r in resources) / len(resources) if resources else 0.0
    avg_mem = sum(r.memory_utilization for r in resources) / len(resources) if resources else 0.0
    total_resource_cost = sum(r.cost_monthly for r in resources)

    return {
        "total_active_resources": len(resources),
        "fleet_average_cpu_utilization": round(avg_cpu, 1),
        "fleet_average_memory_utilization": round(avg_mem, 1),
        "total_monthly_resource_cost": round(total_resource_cost, 2),
        "resources_summary": [
            {
                "id": r.id,
                "name": r.name,
                "service": r.service_name,
                "type": r.resource_type,
                "region": r.region,
                "status": r.status,
                "cpu_pct": r.cpu_utilization,
                "mem_pct": r.memory_utilization,
                "monthly_cost": round(r.cost_monthly, 2)
            }
            for r in resources[:15]
        ]
    }


def find_idle_resources(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Identifies stopped, unattached, or 0% activity resources creating wasteful cost."""
    resources = (
        db.query(CloudResource)
        .filter(
            CloudResource.workspace_id == workspace_id,
            (CloudResource.status == "idle") | (CloudResource.status == "stopped") | (CloudResource.cpu_utilization < 5.0)
        )
        .all()
    )

    wasted_monthly = sum(r.cost_monthly for r in resources)

    return {
        "idle_resource_count": len(resources),
        "total_wasted_monthly_cost": round(wasted_monthly, 2),
        "potential_annual_savings": round(wasted_monthly * 12, 2),
        "idle_resources": [
            {
                "id": r.id,
                "name": r.name,
                "service": r.service_name,
                "region": r.region,
                "monthly_cost": round(r.cost_monthly, 2),
                "cpu_utilization": r.cpu_utilization,
                "recommended_action": "Terminate unattached resource or stop development instances outside working hours."
            }
            for r in resources
        ]
    }


def find_underutilized_resources(db: Session, workspace_id: str) -> Dict[str, Any]:
    """Tool: Detects provisioned instances running with sustained low utilization (< 25% CPU)."""
    resources = (
        db.query(CloudResource)
        .filter(
            CloudResource.workspace_id == workspace_id,
            CloudResource.status == "underutilized"
        )
        .all()
    )

    if not resources:
        # Check by CPU threshold
        resources = (
            db.query(CloudResource)
            .filter(
                CloudResource.workspace_id == workspace_id,
                CloudResource.cpu_utilization < 25.0,
                CloudResource.cpu_utilization >= 5.0
            )
            .all()
        )

    rightsizing_savings = sum(r.cost_monthly * 0.50 for r in resources)

    return {
        "underutilized_count": len(resources),
        "current_monthly_spend": round(sum(r.cost_monthly for r in resources), 2),
        "potential_monthly_savings": round(rightsizing_savings, 2),
        "underutilized_resources": [
            {
                "id": r.id,
                "name": r.name,
                "service": r.service_name,
                "region": r.region,
                "cpu_pct": r.cpu_utilization,
                "mem_pct": r.memory_utilization,
                "current_cost": round(r.cost_monthly, 2),
                "optimized_cost": round(r.cost_monthly * 0.5, 2),
                "recommended_action": "Downsize instance size tier by 1 or 2 sizes."
            }
            for r in resources
        ]
    }
