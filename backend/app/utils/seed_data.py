import json
from datetime import date, datetime, timedelta, timezone
import random
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.workspace import Workspace, WorkspaceMember, AccountType
from app.models.cloud import CloudProvider, CloudAccount, CloudResource
from app.models.cost import CostRecord, CostEfficiencyScore
from app.models.budget import Budget
from app.models.anomaly import Anomaly, AnomalySeverity
from app.models.forecast import Forecast, SavingsEstimate
from app.models.recommendation import AIRecommendation, RecommendationStatus
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.audit import AuditLog
from app.security.password import get_password_hash


def seed_database(db: Session):
    """
    Seeds comprehensive demonstration data for multi-cloud enterprise workspace.
    Covers AWS, Azure, GCP with multi-month cost records, idle resources,
    detected anomalies, forecasts, savings estimates, and recommendations.
    """
    # 1. Check or Create Cloud Providers
    providers = {
        "aws": "Amazon Web Services",
        "azure": "Microsoft Azure",
        "gcp": "Google Cloud Platform"
    }
    db_providers = {}
    for code, name in providers.items():
        p = db.query(CloudProvider).filter(CloudProvider.code == code).first()
        if not p:
            p = CloudProvider(name=name, code=code, icon="Cloud", is_active=True)
            db.add(p)
            db.commit()
            db.refresh(p)
        db_providers[code] = p

    # 2. Check or Create Demo User
    demo_user = db.query(User).filter(User.email == "demo@cloudoptimizer.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@cloudoptimizer.ai",
            hashed_password=get_password_hash("OptimizerDemo2026!"),
            full_name="Alex Vance (Demo Admin)",
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # 3. Check or Create Demo Workspace
    demo_ws = db.query(Workspace).filter(Workspace.slug == "enterprise-demo-workspace").first()
    if not demo_ws:
        demo_ws = Workspace(
            name="Acme Global Tech Corp",
            slug="enterprise-demo-workspace",
            account_type=AccountType.ENTERPRISE,
            monthly_budget=2000000.0,
            currency="INR",
            is_demo=True,
            onboarding_completed=True,
            checklist_json=json.dumps({
                "connect_provider": True,
                "upload_cost_data": True,
                "configure_budget": True,
                "run_ai_analysis": True,
                "review_recommendation": True
            })
        )
        db.add(demo_ws)
        db.commit()
        db.refresh(demo_ws)

        # Associate Demo User
        membership = WorkspaceMember(
            workspace_id=demo_ws.id,
            user_id=demo_user.id,
            role=UserRole.ADMIN
        )
        db.add(membership)
        db.commit()

    # 4. Check if cost records exist already
    existing_records = db.query(CostRecord).filter(CostRecord.workspace_id == demo_ws.id).count()
    if existing_records > 50:
        print("[Seeder] Demo workspace already populated.")
        return demo_ws, demo_user

    # 5. Create Cloud Accounts
    account_defs = [
        {"provider": "aws", "id": "112233445566", "name": "AWS Production Infrastructure", "env": "Production"},
        {"provider": "aws", "id": "998877665544", "name": "AWS Staging & Dev", "env": "Staging"},
        {"provider": "azure", "id": "sub-az-core-01", "name": "Azure Enterprise Hub", "env": "Production"},
        {"provider": "gcp", "id": "gcp-data-analytics-prod", "name": "GCP Data Lake & ML", "env": "Production"}
    ]
    created_accounts = {}
    for acc in account_defs:
        cloud_acc = CloudAccount(
            workspace_id=demo_ws.id,
            provider_id=db_providers[acc["provider"]].id,
            account_id=acc["id"],
            account_name=acc["name"],
            environment=acc["env"],
            status="Connected",
            is_demo=True,
            last_synced_at=datetime.now(timezone.utc)
        )
        db.add(cloud_acc)
        db.commit()
        db.refresh(cloud_acc)
        created_accounts[acc["name"]] = cloud_acc

    # 6. Create Cloud Resources (Compute, DBs, Storage, Idle & Underutilized)
    resources_data = [
        # AWS Production
        {"acc": "AWS Production Infrastructure", "res_id": "i-09ab12cd34ef5601", "name": "prod-api-backend-cluster", "srv": "EC2", "type": "compute", "region": "us-east-1", "status": "running", "cpu": 68.5, "mem": 72.0, "cost": 1420.0, "cc": "Engineering", "team": "Backend Core"},
        {"acc": "AWS Production Infrastructure", "res_id": "i-09ab12cd34ef5602", "name": "prod-auth-microservice", "srv": "EC2", "type": "compute", "region": "us-east-1", "status": "running", "cpu": 45.0, "mem": 58.0, "cost": 650.0, "cc": "Engineering", "team": "Platform Security"},
        {"acc": "AWS Production Infrastructure", "res_id": "i-09ab12cd34ef5603", "name": "prod-worker-batch-node", "srv": "EC2", "type": "compute", "region": "us-east-1", "status": "underutilized", "cpu": 12.4, "mem": 22.0, "cost": 980.0, "cc": "Engineering", "team": "Data Operations"},
        {"acc": "AWS Production Infrastructure", "res_id": "rds-prod-primary-pg", "name": "prod-postgres-ha-db", "srv": "RDS", "type": "database", "region": "us-east-1", "status": "running", "cpu": 74.0, "mem": 81.0, "cost": 2150.0, "cc": "Engineering", "team": "Backend Core"},
        {"acc": "AWS Production Infrastructure", "res_id": "s3-acme-primary-assets", "name": "acme-prod-data-lake-raw", "srv": "S3", "type": "storage", "region": "us-east-1", "status": "running", "cpu": 0.0, "mem": 0.0, "cost": 890.0, "cc": "Engineering", "team": "Data Platform"},
        {"acc": "AWS Production Infrastructure", "res_id": "lambda-payment-webhooks", "name": "stripe-webhook-dispatcher", "srv": "Lambda", "type": "serverless", "region": "us-east-1", "status": "running", "cpu": 0.0, "mem": 0.0, "cost": 180.0, "cc": "Finance", "team": "Payments"},

        # AWS Staging (Idle / Wasteful)
        {"acc": "AWS Staging & Dev", "res_id": "i-0887766554433221", "name": "qa-legacy-testbench-m5", "srv": "EC2", "type": "compute", "region": "us-west-2", "status": "idle", "cpu": 1.2, "mem": 4.5, "cost": 360.0, "cc": "QA", "team": "QA Testing"},
        {"acc": "AWS Staging & Dev", "res_id": "vol-01122334455aabbcc", "name": "orphaned-ebs-volume-backup", "srv": "EBS", "type": "storage", "region": "us-west-2", "status": "stopped", "cpu": 0.0, "mem": 0.0, "cost": 145.0, "cc": "Infrastructure", "team": "DevOps"},

        # Azure
        {"acc": "Azure Enterprise Hub", "res_id": "vm-az-fin-analytics-01", "name": "fin-forecast-model-runner", "srv": "Virtual Machines", "type": "compute", "region": "eastus2", "status": "underutilized", "cpu": 16.0, "mem": 28.0, "cost": 840.0, "cc": "Finance", "team": "Risk Modeling"},
        {"acc": "Azure Enterprise Hub", "res_id": "sqldb-az-fin-reports", "name": "az-financial-audit-db", "srv": "Azure SQL", "type": "database", "region": "eastus2", "status": "running", "cpu": 52.0, "mem": 64.0, "cost": 1150.0, "cc": "Finance", "team": "Accounting"},
        {"acc": "Azure Enterprise Hub", "res_id": "blob-az-archive-docs", "name": "enterprise-compliance-blobs", "srv": "Blob Storage", "type": "storage", "region": "eastus2", "status": "running", "cpu": 0.0, "mem": 0.0, "cost": 420.0, "cc": "Legal", "team": "Compliance"},

        # GCP
        {"acc": "GCP Data Lake & ML", "res_id": "gcp-bq-dw-analytics", "name": "analytics-core-warehouse", "srv": "BigQuery", "type": "analytics", "region": "us-central1", "status": "running", "cpu": 0.0, "mem": 0.0, "cost": 1950.0, "cc": "Data Science", "team": "BI & Analytics"},
        {"acc": "GCP Data Lake & ML", "res_id": "gcp-gce-model-trainer", "name": "recommendation-ranker-v2", "srv": "Compute Engine", "type": "compute", "region": "us-central1", "status": "underutilized", "cpu": 18.0, "mem": 31.0, "cost": 720.0, "cc": "Data Science", "team": "Machine Learning"},
        {"acc": "GCP Data Lake & ML", "res_id": "gcs-ml-training-checkpoints", "name": "ml-weights-checkpoints", "srv": "Cloud Storage", "type": "storage", "region": "us-central1", "status": "running", "cpu": 0.0, "mem": 0.0, "cost": 310.0, "cc": "Data Science", "team": "Machine Learning"}
    ]

    db_resources = []
    for r in resources_data:
        account_obj = created_accounts[r["acc"]]
        provider_code = account_obj.provider.code
        res = CloudResource(
            workspace_id=demo_ws.id,
            cloud_account_id=account_obj.id,
            resource_id=r["res_id"],
            name=r["name"],
            service_name=r["srv"],
            resource_type=r["type"],
            region=r["region"],
            status=r["status"],
            cpu_utilization=r["cpu"],
            memory_utilization=r["mem"],
            cost_monthly=r["cost"],
            cost_center=r["cc"],
            team=r["team"],
            project="Enterprise Transformation",
            tags_json=json.dumps({"Environment": account_obj.environment, "Owner": r["team"]}),
            is_demo=True
        )
        db.add(res)
        db_resources.append(res)
    db.commit()

    # 7. Generate 90 Days of Historical Daily Cost Records across all Services
    today = date.today()
    cost_records_to_insert = []
    
    # Baseline spending profiles per service
    service_baselines = [
        {"prov": "aws", "srv": "EC2", "base": 115.0, "cc": "Engineering", "team": "Backend Core", "acc": "AWS Production Infrastructure"},
        {"prov": "aws", "srv": "RDS", "base": 75.0, "cc": "Engineering", "team": "Backend Core", "acc": "AWS Production Infrastructure"},
        {"prov": "aws", "srv": "S3", "base": 32.0, "cc": "Engineering", "team": "Data Platform", "acc": "AWS Production Infrastructure"},
        {"prov": "aws", "srv": "Lambda", "base": 8.5, "cc": "Finance", "team": "Payments", "acc": "AWS Production Infrastructure"},
        {"prov": "aws", "srv": "EBS", "base": 14.0, "cc": "Infrastructure", "team": "DevOps", "acc": "AWS Staging & Dev"},
        {"prov": "azure", "srv": "Virtual Machines", "base": 35.0, "cc": "Finance", "team": "Risk Modeling", "acc": "Azure Enterprise Hub"},
        {"prov": "azure", "srv": "Azure SQL", "base": 42.0, "cc": "Finance", "team": "Accounting", "acc": "Azure Enterprise Hub"},
        {"prov": "azure", "srv": "Blob Storage", "base": 15.0, "cc": "Legal", "team": "Compliance", "acc": "Azure Enterprise Hub"},
        {"prov": "gcp", "srv": "BigQuery", "base": 68.0, "cc": "Data Science", "team": "BI & Analytics", "acc": "GCP Data Lake & ML"},
        {"prov": "gcp", "srv": "Compute Engine", "base": 28.0, "cc": "Data Science", "team": "Machine Learning", "acc": "GCP Data Lake & ML"},
        {"prov": "gcp", "srv": "Cloud Storage", "base": 12.0, "cc": "Data Science", "team": "Machine Learning", "acc": "GCP Data Lake & ML"}
    ]

    for day_offset in range(89, -1, -1):
        current_day = today - timedelta(days=day_offset)
        # Weekday variation multiplier
        day_of_week = current_day.weekday()
        weekday_mult = 1.05 if day_of_week < 5 else 0.85
        
        # Slight upward organic growth
        growth_factor = 1.0 + ((90 - day_offset) * 0.0015)

        for s in service_baselines:
            acc_obj = created_accounts[s["acc"]]
            noise = random.uniform(0.92, 1.08)
            amount = s["base"] * weekday_mult * growth_factor * noise

            # Inject intentional realistic anomalies for specific days
            if day_offset == 14 and s["srv"] == "EC2":
                amount *= 2.85  # EC2 runaway scaling spike
            if day_offset == 7 and s["srv"] == "BigQuery":
                amount *= 3.20  # BigQuery full scan anomaly
            if day_offset == 21 and s["srv"] == "RDS":
                amount *= 2.40  # RDS IOPS surge

            cost_rec = CostRecord(
                workspace_id=demo_ws.id,
                cloud_account_id=acc_obj.id,
                provider_code=s["prov"],
                service_name=s["srv"],
                resource_id=f"{s['prov']}-{s['srv'].lower()}-res",
                region="us-east-1" if s["prov"] == "aws" else ("eastus2" if s["prov"] == "azure" else "us-central1"),
                cost_date=current_day,
                amount=round(amount, 2),
                currency="INR",
                cost_center=s["cc"],
                team=s["team"],
                project="Enterprise Cloud Modernization",
                environment=acc_obj.environment,
                tags_json=json.dumps({"CostCenter": s["cc"], "Team": s["team"]}),
                is_demo=True,
                source="automated_sync"
            )
            cost_records_to_insert.append(cost_rec)

    db.bulk_save_objects(cost_records_to_insert)
    db.commit()

    # 8. Create Budgets
    budget_entries = [
        {"name": "Global Cloud Infrastructure Budget", "amount": 25000.0, "threshold": 80.0, "spend": 19450.0, "cc": "All", "team": "All"},
        {"name": "Engineering Core Services Budget", "amount": 14000.0, "threshold": 85.0, "spend": 11200.0, "cc": "Engineering", "team": "Backend Core"},
        {"name": "Data Science & BigQuery Budget", "amount": 6000.0, "threshold": 75.0, "spend": 5100.0, "cc": "Data Science", "team": "BI & Analytics"}
    ]
    for b in budget_entries:
        stat = "warning" if (b["spend"] / b["amount"]) >= (b["threshold"] / 100.0) else "healthy"
        bg = Budget(
            workspace_id=demo_ws.id,
            name=b["name"],
            period="monthly",
            amount=b["amount"],
            currency="USD",
            alert_threshold_percent=b["threshold"],
            current_spend=b["spend"],
            status=stat,
            cost_center=b["cc"],
            team=b["team"]
        )
        db.add(bg)
    db.commit()

    # 9. Create Pre-detected Anomalies
    anomalies_data = [
        {
            "prov": "aws", "srv": "EC2", "date": today - timedelta(days=14),
            "exp": 128.50, "act": 366.22, "diff": 237.72, "dev": 185.0,
            "sev": AnomalySeverity.CRITICAL,
            "cause": "Auto-scaling group triggered on false memory alarm, launching 6 unneeded m5.2xlarge on-demand instances without scale-down timer.",
            "action": "Adjust CloudWatch CPU/Memory alarm thresholds to 80% and enforce maximum node group capacity of 4 instances."
        },
        {
            "prov": "gcp", "srv": "BigQuery", "date": today - timedelta(days=7),
            "exp": 74.20, "act": 237.44, "diff": 163.24, "dev": 220.0,
            "sev": AnomalySeverity.CRITICAL,
            "cause": "Unpartitioned 8.4 TB historical audit log dataset was repeatedly scanned by ad-hoc reporting scripts during pipeline testing.",
            "action": "Require date partitioning and column clustering on tables over 100GB, and enable max billed query limit tier."
        },
        {
            "prov": "aws", "srv": "RDS", "date": today - timedelta(days=21),
            "exp": 81.00, "act": 194.40, "diff": 113.40, "dev": 140.0,
            "sev": AnomalySeverity.WARNING,
            "cause": "Provisioned IOPS spike caused by unindexed join queries during monthly batch ETL export.",
            "action": "Add missing compound composite index on transactions table and schedule exports during off-peak windows."
        }
    ]
    for a in anomalies_data:
        anom = Anomaly(
            workspace_id=demo_ws.id,
            provider_code=a["prov"],
            service_name=a["srv"],
            resource_id=f"{a['prov']}-{a['srv'].lower()}-cluster",
            anomaly_date=a["date"],
            expected_cost=a["exp"],
            actual_cost=a["act"],
            difference=a["diff"],
            deviation_percent=a["dev"],
            severity=a["sev"],
            possible_cause=a["cause"],
            recommended_action=a["action"],
            status="active"
        )
        db.add(anom)
    db.commit()

    # 10. Create AI Recommendations with Tool Traces
    sample_tool_trace = [
        {"step": 1, "tool_name": "get_cost_records", "purpose": "Query historical cost records", "duration_ms": 14.2, "status": "success", "key_findings": "Retrieved 890 cost records totaling $19,450.00."},
        {"step": 2, "tool_name": "get_service_costs", "purpose": "Aggregate cloud costs by service", "duration_ms": 11.5, "status": "success", "key_findings": "Top expenditure driver identified as AWS EC2."},
        {"step": 3, "tool_name": "calculate_cost_growth", "purpose": "Calculate spending growth rate", "duration_ms": 8.9, "status": "success", "key_findings": "30-day spend grew by 14.2% over previous baseline."},
        {"step": 4, "tool_name": "get_anomalies", "purpose": "Identify spending spikes", "duration_ms": 12.1, "status": "success", "key_findings": "Found 2 Critical and 1 Warning cost anomalies."},
        {"step": 5, "tool_name": "find_idle_resources", "purpose": "Detect zero-utilization resources", "duration_ms": 9.4, "status": "success", "key_findings": "Flagged 2 idle/stopped resources creating $505.00/mo waste."},
        {"step": 6, "tool_name": "find_underutilized_resources", "purpose": "Detect overprovisioned compute", "duration_ms": 10.3, "status": "success", "key_findings": "Found 3 instances with < 20% CPU with $1,270.00/mo savings potential."},
        {"step": 7, "tool_name": "estimate_savings", "purpose": "Compute total savings potential", "duration_ms": 15.0, "status": "success", "key_findings": "Total potential savings: $4,850.00/month (24.9%)."},
        {"step": 8, "tool_name": "generate_optimization_plan", "purpose": "Synthesize recommendations", "duration_ms": 18.2, "status": "success", "key_findings": "Generated 4 actionable optimization items awaiting approval."}
    ]

    recs_data = [
        {
            "title": "Terminate 2 Orphaned / Idle Staging Cloud Resources",
            "problem": "Staging environment has legacy test instances and unattached storage volumes running continuously with 0% CPU utilization.",
            "evidence": {"idle_count": 2, "monthly_waste": 505.0, "resources": ["qa-legacy-testbench-m5", "orphaned-ebs-volume-backup"]},
            "cause": "Instances were left running after Q3 QA test completion with no automated teardown policy in place.",
            "action": "Take automated snapshots and terminate the unattached resources. Enforce automatic nightly shutdown schedules.",
            "cur": 505.0, "opt": 25.0, "sav": 480.0, "pct": 95.0,
            "pri": "Critical", "conf": 0.98, "risk": "Low",
            "prov": "aws", "srv": "EC2 / EBS", "status": RecommendationStatus.PENDING
        },
        {
            "title": "Rightsize 3 Overprovisioned Compute Instances",
            "problem": "Production worker batch node, Azure financial model runner, and GCP ML ranker run at an average of 14.8% CPU utilization.",
            "evidence": {"underutilized_count": 3, "current_spend": 2540.0, "potential_savings": 1270.0},
            "cause": "Instances were sized generously for initial load testing and were never downscaled for standard production load.",
            "action": "Downsize worker nodes from 2xlarge to xlarge during the upcoming Sunday maintenance window.",
            "cur": 2540.0, "opt": 1270.0, "sav": 1270.0, "pct": 50.0,
            "pri": "High", "conf": 0.94, "risk": "Low",
            "prov": "aws", "srv": "EC2", "status": RecommendationStatus.PENDING
        },
        {
            "title": "Purchase 1-Year Compute Savings Plans for Base Production Fleets",
            "problem": "Baseline production compute spend across AWS and Azure is currently paid on on-demand hourly rates without commitment discounts.",
            "evidence": {"steady_state_base": 7800.0, "commitment_discount": "32%"},
            "cause": "No active Savings Plans or Reserved Instances currently cover baseline web server infrastructure.",
            "action": "Commit to a 1-year No-Upfront Compute Savings Plan for $5,000/mo of steady compute capacity.",
            "cur": 7800.0, "opt": 5460.0, "sav": 2340.0, "pct": 30.0,
            "pri": "High", "conf": 0.96, "risk": "Medium",
            "prov": "aws", "srv": "Savings Plans", "status": RecommendationStatus.PENDING
        },
        {
            "title": "Enable S3 & Azure Blob Storage Intelligent Lifecycle Tiering",
            "problem": "Historical asset logs and compliance backups (> 90 days old) are stored on expensive standard object storage tiers.",
            "evidence": {"cold_storage_bytes_tb": 34.5, "current_tier": "Standard S3 / Hot Blob"},
            "cause": "Default object storage bucket lifecycle transition rules were not configured upon bucket creation.",
            "action": "Configure S3 Intelligent-Tiering and transition objects older than 90 days to Glacier Instant Retrieval.",
            "cur": 1310.0, "opt": 550.0, "sav": 760.0, "pct": 58.0,
            "pri": "Medium", "conf": 0.91, "risk": "Low",
            "prov": "aws", "srv": "S3 / Blob", "status": RecommendationStatus.PENDING
        }
    ]

    for r in recs_data:
        rec = AIRecommendation(
            workspace_id=demo_ws.id,
            title=r["title"],
            problem=r["problem"],
            evidence_json=json.dumps(r["evidence"]),
            possible_cause=r["cause"],
            recommended_action=r["action"],
            current_cost=r["cur"],
            optimized_estimated_cost=r["opt"],
            estimated_savings=r["sav"],
            savings_percentage=r["pct"],
            priority=r["pri"],
            confidence=r["conf"],
            risk_level=r["risk"],
            provider=r["prov"],
            service=r["srv"],
            resource_id="fleet-cluster",
            approval_status=r["status"],
            tool_trace_json=json.dumps(sample_tool_trace)
        )
        db.add(rec)
    db.commit()

    # 11. Create Alerts & Audit Logs
    alerts_data = [
        {"type": AlertType.CRITICAL_ANOMALY, "title": "Critical Cost Spike in AWS EC2", "msg": "+185% cost surge detected on 14 days ago ($237.72 deviation).", "sev": AlertSeverity.CRITICAL},
        {"type": AlertType.BUDGET_NEAR_LIMIT, "title": "Engineering Core Budget Near Limit", "msg": "Engineering Core Budget has reached 80% utilization ($11,200 / $14,000).", "sev": AlertSeverity.WARNING},
        {"type": AlertType.OPTIMIZATION_OPPORTUNITY, "title": "New High-Impact AI Savings Opportunity", "msg": "Agent identified $4,850.00/month potential savings across idle and rightsizing candidates.", "sev": AlertSeverity.INFO}
    ]
    for al in alerts_data:
        alert = Alert(
            workspace_id=demo_ws.id,
            alert_type=al["type"],
            title=al["title"],
            message=al["msg"],
            severity=al["sev"],
            is_read=False,
            metadata_json="{}"
        )
        db.add(alert)

    # Initial Audit Log entries
    logs = [
        {"act": "WORKSPACE_CREATED", "res": "Workspace", "details": {"name": "Acme Global Tech Corp"}},
        {"act": "CLOUD_ACCOUNT_CONNECTED", "res": "CloudAccount", "details": {"provider": "AWS", "id": "112233445566"}},
        {"act": "COST_DATA_INGESTION", "res": "CostRecord", "details": {"records_count": 890, "source": "automated_sync"}},
        {"act": "AI_OPTIMIZATION_RUN", "res": "AgentSession", "details": {"goal": "Optimize Multi-Cloud Infrastructure", "recommendations": 4}}
    ]
    for l in logs:
        audit = AuditLog(
            workspace_id=demo_ws.id,
            user_id=demo_user.id,
            user_email=demo_user.email,
            action=l["act"],
            resource_type=l["res"],
            details_json=json.dumps(l["details"]),
            ip_address="127.0.0.1"
        )
        db.add(audit)

    # 12. Create Historical Cost Efficiency Trend
    for offset in range(60, -1, -5):
        d = today - timedelta(days=offset)
        # Efficiency gradually improving over time
        score = 68.0 + ((60 - offset) * 0.28) + random.uniform(-1.5, 1.5)
        ces = CostEfficiencyScore(
            workspace_id=demo_ws.id,
            score_date=d,
            efficiency_score=round(min(96.0, score), 1),
            waste_percentage=round(max(4.0, 32.0 - ((60 - offset) * 0.28)), 1),
            idle_spend_ratio=round(max(0.02, 0.12 - ((60 - offset) * 0.001)), 3)
        )
        db.add(ces)

    db.commit()
    print("[Seeder] Demo workspace successfully populated with realistic multi-cloud data.")
    return demo_ws, demo_user
