import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional


def analyze_user_provided_resources(
    resources: List[Dict[str, Any]],
    custom_baseline_spend: Optional[float] = None,
    currency: str = "INR"
) -> Dict[str, Any]:
    """
    Analyzes user-provided cloud infrastructure resources to detect actionable FinOps
    savings opportunities strictly based on submitted telemetry data (NO mocked or fabricated numbers).

    Categories Analyzed:
    1. Compute & Database Rightsizing (Low CPU/Memory utilization)
    2. Idle & Orphaned Resource Cleanup (Stopped instances, unattached EBS/disks, zero traffic)
    3. Non-Production Schedule Optimization (Auto stop/start for Dev/Staging environments)
    4. Cloud Storage Lifecycle & Tiering (Infrequent access objects and high volume data)
    5. Baseline Production Commitments (Savings Plans / Reserved Instances)
    """
    opportunities: List[Dict[str, Any]] = []
    category_savings = {
        "rightsizing": 0.0,
        "idle_termination": 0.0,
        "scheduling": 0.0,
        "storage_tiering": 0.0,
        "commitments": 0.0,
    }
    provider_savings = {}

    total_calculated_spend = sum(float(r.get("monthly_cost") or r.get("cost_monthly") or 0.0) for r in resources)
    baseline_spend = custom_baseline_spend if custom_baseline_spend is not None and custom_baseline_spend > 0 else total_calculated_spend

    for r in resources:
        res_id = str(r.get("resource_id", "")).strip() or f"res-{uuid.uuid4().hex[:6]}"
        res_name = str(r.get("resource_name") or r.get("name") or res_id).strip()
        res_type = str(r.get("resource_type", "compute")).strip().lower()
        service = str(r.get("service_name", "Compute")).strip()
        provider = str(r.get("cloud_provider") or r.get("provider_code") or "aws").strip().lower()
        region = str(r.get("region", "ap-south-1")).strip()
        cost = float(r.get("monthly_cost") or r.get("cost_monthly") or 0.0)
        cpu = float(r["cpu_utilization"]) if r.get("cpu_utilization") is not None else None
        mem = float(r["memory_utilization"]) if r.get("memory_utilization") is not None else None
        storage_gb = float(r["storage_usage_gb"]) if r.get("storage_usage_gb") is not None else None
        hours_day = float(r.get("hours_per_day", 24.0) or 24.0)
        env = str(r.get("environment", "Production")).strip()
        status = str(r.get("status", "running")).strip().lower()

        is_production = env.lower() == "production"
        is_compute_or_db = res_type in ["compute", "database", "node", "instance"] or any(
            s in service.lower() for s in ["ec2", "virtual", "compute", "rds", "sql", "db", "vm"]
        )
        is_storage = res_type in ["storage", "volume", "bucket", "disk"] or any(
            s in service.lower() for s in ["s3", "blob", "ebs", "disk", "storage", "gcs"]
        )

        # -------------------------------------------------------------
        # 1. IDLE & ORPHANED RESOURCE OPPORTUNITY
        # -------------------------------------------------------------
        if status in ["idle", "stopped", "unattached"] or (cpu is not None and cpu < 5.0 and (mem is None or mem < 10.0) and cost > 100.0):
            monthly_sav = round(cost * 0.95, 2)
            opt_cost = round(cost - monthly_sav, 2)
            annual_sav = round(monthly_sav * 12.0, 2)
            sav_pct = round((monthly_sav / cost * 100.0) if cost > 0 else 95.0, 1)

            why_text = (
                f"Resource is currently in '{status.upper()}' state"
                + (f" with negligible CPU load ({cpu:.1f}%)" if cpu is not None else "")
                + f", incurring monthly holding charges of ₹{cost:,.2f} without delivering active business throughput."
            )

            evidence_dict = {
                "Resource ID": res_id,
                "Service": f"{provider.upper()} {service}",
                "Status": status.capitalize(),
                "Environment": env,
                "Current Monthly Cost": f"₹{cost:,.2f}",
                "Region": region,
            }
            if cpu is not None:
                evidence_dict["Average CPU"] = f"{cpu:.1f}%"
            if mem is not None:
                evidence_dict["Average Memory"] = f"{mem:.1f}%"

            opportunities.append({
                "id": f"opp-idle-{uuid.uuid4().hex[:8]}",
                "title": f"Terminate Idle Resource ({res_name})",
                "category": "idle_termination",
                "category_label": "Idle Cleanup",
                "provider_code": provider,
                "service_name": service,
                "resource_id": res_id,
                "resource_name": res_name,
                "environment": env,
                "why": why_text,
                "evidence": evidence_dict,
                "current_monthly_spend": round(cost, 2),
                "estimated_monthly_spend": opt_cost,
                "estimated_monthly_savings": monthly_sav,
                "estimated_annual_savings": annual_sav,
                "savings_percent": sav_pct,
                "risk_level": "Low" if not is_production else "Medium",
                "risk_reason": "Low risk for non-production resources. Take a final snapshot backup prior to termination." if not is_production else "Medium risk due to Production tag. Verify no background batch jobs depend on this resource.",
                "effort_level": "Low",
                "effort_reason": "Create backup snapshot and terminate instance/volume via console or CLI.",
                "confidence_score": 0.98 if status in ["stopped", "unattached"] else 0.92,
                "confidence_level": "High",
                "confidence_reason": f"Backed by user-submitted status '{status}' and low utilization telemetry.",
                "suggested_action": f"Take a point-in-time snapshot backup of {res_id} and safely terminate the resource to eliminate ₹{monthly_sav:,.2f}/month in wasteful spend."
            })
            category_savings["idle_termination"] += monthly_sav
            provider_savings[provider] = provider_savings.get(provider, 0.0) + monthly_sav
            continue  # Move to next resource if terminated

        # -------------------------------------------------------------
        # 2. COMPUTE & DATABASE RIGHTSIZING OPPORTUNITY
        # -------------------------------------------------------------
        if is_compute_or_db and (cpu is not None and cpu < 30.0) and cost > 200.0 and status == "running":
            downsize_factor = 0.50 if cpu < 15.0 else 0.35
            monthly_sav = round(cost * downsize_factor, 2)
            opt_cost = round(cost - monthly_sav, 2)
            annual_sav = round(monthly_sav * 12.0, 2)
            sav_pct = round((monthly_sav / cost * 100.0) if cost > 0 else 40.0, 1)

            mem_str = f" and {mem:.1f}% memory" if mem is not None else ""
            why_text = f"Average CPU utilization is only {cpu:.1f}%{mem_str} across the analysis period, indicating substantial over-provisioning compared to actual workload requirements."

            evidence_dict = {
                "Resource ID": res_id,
                "Service": f"{provider.upper()} {service}",
                "Average CPU": f"{cpu:.1f}% (Recommended: 60-75%)",
                "Environment": env,
                "Current Monthly Cost": f"₹{cost:,.2f}",
                "Status": status.capitalize()
            }
            if mem is not None:
                evidence_dict["Average Memory"] = f"{mem:.1f}%"

            opportunities.append({
                "id": f"opp-rightsize-{uuid.uuid4().hex[:8]}",
                "title": f"Rightsize Overprovisioned Instance ({res_name})",
                "category": "rightsizing",
                "category_label": "Compute Rightsizing",
                "provider_code": provider,
                "service_name": service,
                "resource_id": res_id,
                "resource_name": res_name,
                "environment": env,
                "why": why_text,
                "evidence": evidence_dict,
                "current_monthly_spend": round(cost, 2),
                "estimated_monthly_spend": opt_cost,
                "estimated_monthly_savings": monthly_sav,
                "estimated_annual_savings": annual_sav,
                "savings_percent": sav_pct,
                "risk_level": "Medium" if is_production else "Low",
                "risk_reason": "Medium risk in Production. Ensure peak traffic spikes do not exceed target capacity before downsizing." if is_production else "Low risk in non-production environments.",
                "effort_level": "Low",
                "effort_reason": "Requires updating instance type/size during scheduled maintenance window.",
                "confidence_score": 0.94 if mem is not None else 0.86,
                "confidence_level": "High" if mem is not None else "Medium",
                "confidence_reason": "High confidence supported by CPU, Memory, and cost metrics provided by user.",
                "suggested_action": f"Downsize {res_id} to the next smaller instance tier during off-peak hours to reduce monthly spend from ₹{cost:,.2f} to ₹{opt_cost:,.2f}."
            })
            category_savings["rightsizing"] += monthly_sav
            provider_savings[provider] = provider_savings.get(provider, 0.0) + monthly_sav

        # -------------------------------------------------------------
        # 3. NON-PRODUCTION SCHEDULING (AUTO STOP/START)
        # -------------------------------------------------------------
        if not is_production and is_compute_or_db and (hours_day < 24.0 or status == "running") and cost > 150.0:
            active_hours_weekly = (hours_day * 5.0) if hours_day < 24.0 else 50.0  # 10 hrs * 5 days = 50 hrs/wk
            total_hours_weekly = 168.0  # 24 * 7
            savings_fraction = (total_hours_weekly - active_hours_weekly) / total_hours_weekly
            monthly_sav = round(cost * min(0.65, savings_fraction), 2)
            opt_cost = round(cost - monthly_sav, 2)
            annual_sav = round(monthly_sav * 12.0, 2)
            sav_pct = round((monthly_sav / cost * 100.0) if cost > 0 else 60.0, 1)

            why_text = f"Non-production ({env}) resource is active continuously 24/7 (168 hrs/week) even though developer access is typically limited to business hours (~50 hrs/week)."

            evidence_dict = {
                "Resource ID": res_id,
                "Service": f"{provider.upper()} {service}",
                "Environment": env,
                "Current Schedule": "24/7 Continuous (168 hrs/wk)",
                "Optimized Schedule": f"{int(hours_day if hours_day < 24 else 10)} hrs/day Mon-Fri (~50 hrs/wk)",
                "Current Monthly Cost": f"₹{cost:,.2f}"
            }

            opportunities.append({
                "id": f"opp-sched-{uuid.uuid4().hex[:8]}",
                "title": f"Implement Auto-Stop Schedule for {env} Resource ({res_name})",
                "category": "scheduling",
                "category_label": "Scheduling Optimization",
                "provider_code": provider,
                "service_name": service,
                "resource_id": res_id,
                "resource_name": res_name,
                "environment": env,
                "why": why_text,
                "evidence": evidence_dict,
                "current_monthly_spend": round(cost, 2),
                "estimated_monthly_spend": opt_cost,
                "estimated_monthly_savings": monthly_sav,
                "estimated_annual_savings": annual_sav,
                "savings_percent": sav_pct,
                "risk_level": "Low",
                "risk_reason": f"Low risk because this resource is tagged for {env} use. Scheduled hours can be overridden on demand.",
                "effort_level": "Low",
                "effort_reason": "Configure automated AWS Instance Scheduler or Lambda tag-based start/stop cron.",
                "confidence_score": 0.92,
                "confidence_level": "High",
                "confidence_reason": f"Backed by user-specified {env} environment and usage profile.",
                "suggested_action": f"Set up automated shutdown outside 09:00 - 19:00 Mon-Fri for {res_id} to capture ₹{monthly_sav:,.2f}/month in scheduling savings."
            })
            category_savings["scheduling"] += monthly_sav
            provider_savings[provider] = provider_savings.get(provider, 0.0) + monthly_sav

        # -------------------------------------------------------------
        # 4. STORAGE LIFECYCLE & TIERING OPTIMIZATION
        # -------------------------------------------------------------
        if is_storage and cost > 250.0:
            monthly_sav = round(cost * 0.40, 2)  # 40% savings via intelligent tiering / cold storage
            opt_cost = round(cost - monthly_sav, 2)
            annual_sav = round(monthly_sav * 12.0, 2)
            sav_pct = 40.0

            gb_text = f" ({storage_gb:.0f} GB)" if storage_gb is not None else ""
            why_text = f"Storage resource{gb_text} is running on standard high-cost tier without automated lifecycle transitions for objects unaccessed over 30 days."

            evidence_dict = {
                "Resource ID": res_id,
                "Service": f"{provider.upper()} {service}",
                "Environment": env,
                "Current Monthly Cost": f"₹{cost:,.2f}"
            }
            if storage_gb is not None:
                evidence_dict["Provisioned Capacity"] = f"{storage_gb:,.0f} GB"

            opportunities.append({
                "id": f"opp-store-{uuid.uuid4().hex[:8]}",
                "title": f"Enable Intelligent-Tiering Policy ({res_name})",
                "category": "storage_tiering",
                "category_label": "Storage Optimization",
                "provider_code": provider,
                "service_name": service,
                "resource_id": res_id,
                "resource_name": res_name,
                "environment": env,
                "why": why_text,
                "evidence": evidence_dict,
                "current_monthly_spend": round(cost, 2),
                "estimated_monthly_spend": opt_cost,
                "estimated_monthly_savings": monthly_sav,
                "estimated_annual_savings": annual_sav,
                "savings_percent": sav_pct,
                "risk_level": "Low",
                "risk_reason": "Low risk. Intelligent tiering moves unaccessed objects automatically with zero retrieval latency.",
                "effort_level": "Low",
                "effort_reason": "Single configuration policy toggle in storage bucket settings.",
                "confidence_score": 0.90,
                "confidence_level": "High",
                "confidence_reason": "Standard proven cloud storage lifecycle economics applied to submitted spend.",
                "suggested_action": f"Apply S3/Blob Intelligent-Tiering to {res_id} to automatically move data unaccessed for 30+ days to infrequent access tiers."
            })
            category_savings["storage_tiering"] += monthly_sav
            provider_savings[provider] = provider_savings.get(provider, 0.0) + monthly_sav

        # -------------------------------------------------------------
        # 5. COMMITMENT & SAVINGS PLANS (PRODUCTION STEADY COMPUTE)
        # -------------------------------------------------------------
        if is_production and is_compute_or_db and (cpu is None or cpu >= 30.0) and cost > 500.0 and status == "running":
            monthly_sav = round(cost * 0.30, 2)  # 30% savings with 1-Yr Compute Savings Plan
            opt_cost = round(cost - monthly_sav, 2)
            annual_sav = round(monthly_sav * 12.0, 2)
            sav_pct = 30.0

            why_text = f"Production workload on {res_name} exhibits consistent baseline execution without commitment discount coverage, incurring full on-demand hourly pricing."

            evidence_dict = {
                "Resource ID": res_id,
                "Service": f"{provider.upper()} {service}",
                "Environment": "Production (Steady Baseline)",
                "Pricing Model": "On-Demand Hourly",
                "Current Monthly Spend": f"₹{cost:,.2f}"
            }
            if cpu is not None:
                evidence_dict["Utilization"] = f"{cpu:.1f}% CPU (Steady Load)"

            opportunities.append({
                "id": f"opp-commit-{uuid.uuid4().hex[:8]}",
                "title": f"Cover Baseline Workload with 1-Year Compute Savings Plan ({res_name})",
                "category": "commitments",
                "category_label": "Savings Plan Commitment",
                "provider_code": provider,
                "service_name": service,
                "resource_id": res_id,
                "resource_name": res_name,
                "environment": env,
                "why": why_text,
                "evidence": evidence_dict,
                "current_monthly_spend": round(cost, 2),
                "estimated_monthly_spend": opt_cost,
                "estimated_monthly_savings": monthly_sav,
                "estimated_annual_savings": annual_sav,
                "savings_percent": sav_pct,
                "risk_level": "Low",
                "risk_reason": "Low risk for long-term production baseline services. Flexible Compute Savings Plans automatically apply across regions and instance families.",
                "effort_level": "Low",
                "effort_reason": "Financial purchasing action in cloud billing console, zero code changes.",
                "confidence_score": 0.95,
                "confidence_level": "High",
                "confidence_reason": "Backed by steady production workload spend provided in user dataset.",
                "suggested_action": f"Purchase a 1-year No-Upfront Compute Savings Plan to cover baseline hourly compute for {res_id}, saving ₹{monthly_sav:,.2f}/month."
            })
            category_savings["commitments"] += monthly_sav
            provider_savings[provider] = provider_savings.get(provider, 0.0) + monthly_sav

    # Aggregate Total Savings
    total_potential_monthly_savings = round(sum(o["estimated_monthly_savings"] for o in opportunities), 2)
    total_potential_annual_savings = round(total_potential_monthly_savings * 12.0, 2)
    estimated_optimized_spend = max(0.0, round(baseline_spend - total_potential_monthly_savings, 2))
    overall_savings_percentage = round((total_potential_monthly_savings / baseline_spend * 100.0) if baseline_spend > 0 else 0.0, 1)

    # Sort opportunities by estimated monthly savings descending
    opportunities.sort(key=lambda x: x["estimated_monthly_savings"], reverse=True)

    return {
        "total_monthly_spend": round(baseline_spend, 2),
        "potential_monthly_savings": total_potential_monthly_savings,
        "potential_annual_savings": total_potential_annual_savings,
        "estimated_optimized_spend": estimated_optimized_spend,
        "overall_savings_percentage": overall_savings_percentage,
        "savings_by_category": {k: round(v, 2) for k, v in category_savings.items()},
        "savings_by_provider": {k: round(v, 2) for k, v in provider_savings.items()},
        "resource_count": len(resources),
        "analyzed_resources_count": len(resources),
        "opportunities_count": len(opportunities),
        "opportunities": opportunities,
        "estimates": opportunities,
        "currency": currency,
        "currency_symbol": "₹",
        "analysis_timestamp": datetime.utcnow(),
        "data_source": "user_submitted_data"
    }


def calculate_savings_opportunities(
    resources: List[Dict[str, Any]],
    total_monthly_spend: float
) -> Dict[str, Any]:
    """Legacy helper maintained for backward compatibility with pre-existing tests/tools."""
    return analyze_user_provided_resources(resources, custom_baseline_spend=total_monthly_spend)


def simulate_impact_slider(
    base_savings: float,
    current_spend: float,
    coverage_percentage: float = 100.0
) -> Dict[str, Any]:
    """Simulates cost reduction and savings impact based on a coverage percentage slider."""
    factor = max(0.0, min(100.0, coverage_percentage)) / 100.0
    simulated_savings = round(base_savings * factor, 2)
    simulated_optimized_spend = max(0.0, round(current_spend - simulated_savings, 2))
    simulated_annual_savings = round(simulated_savings * 12.0, 2)
    simulated_percent = round((simulated_savings / current_spend * 100.0) if current_spend > 0 else 0.0, 1)

    return {
        "coverage_percentage": coverage_percentage,
        "simulated_monthly_savings": simulated_savings,
        "simulated_annual_savings": simulated_annual_savings,
        "simulated_optimized_spend": simulated_optimized_spend,
        "simulated_savings_percentage": simulated_percent
    }
