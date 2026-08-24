import numpy as np
import pandas as pd
from datetime import date, timedelta
from typing import List, Dict, Any


def detect_cost_anomalies(cost_records: List[Dict[str, Any]], z_threshold: float = 2.0) -> List[Dict[str, Any]]:
    """
    Detects cost anomalies using rolling Z-Score and IQR methods.
    Calculates expected cost, actual cost, difference, deviation %, severity,
    likely root causes, and recommended mitigation actions.
    """
    if not cost_records or len(cost_records) < 5:
        return []

    df = pd.DataFrame(cost_records)
    if "cost_date" not in df.columns or "amount" not in df.columns:
        return []

    df["cost_date"] = pd.to_datetime(df["cost_date"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # Group by service and date to get daily service totals
    daily_service = df.groupby(["provider_code", "service_name", "cost_date"])["amount"].sum().reset_index()
    daily_service = daily_service.sort_values(by=["provider_code", "service_name", "cost_date"])

    anomalies = []

    # Process each service separately
    for (provider, service), group in daily_service.groupby(["provider_code", "service_name"]):
        if len(group) < 4:
            continue

        amounts = group["amount"].values
        dates = group["cost_date"].values

        # Rolling statistics (window of up to 14 days)
        rolling_mean = group["amount"].rolling(window=7, min_periods=3).mean()
        rolling_std = group["amount"].rolling(window=7, min_periods=3).std().fillna(group["amount"].std())
        rolling_std = rolling_std.replace(0, group["amount"].mean() * 0.05 + 1.0)

        # IQR baseline
        q25 = np.percentile(amounts, 25)
        q75 = np.percentile(amounts, 75)
        iqr = q75 - q25
        iqr_upper = q75 + 1.5 * iqr

        for i in range(len(group)):
            actual = amounts[i]
            expected = rolling_mean.iloc[i] if not np.isnan(rolling_mean.iloc[i]) else np.mean(amounts)
            std = rolling_std.iloc[i] if not np.isnan(rolling_std.iloc[i]) and rolling_std.iloc[i] > 0 else 1.0
            
            z_score = (actual - expected) / std if std > 0 else 0.0
            is_iqr_outlier = actual > iqr_upper and actual > (expected * 1.3)

            # Detect positive cost spikes
            if (z_score > z_threshold or is_iqr_outlier) and actual > (expected + 15.0):
                diff = float(actual - expected)
                dev_pct = float((diff / expected) * 100.0) if expected > 0 else 100.0
                
                # Determine severity
                if dev_pct > 150.0 or z_score > 3.5:
                    severity = "Critical"
                elif dev_pct > 50.0 or z_score > 2.0:
                    severity = "Warning"
                else:
                    severity = "Normal"

                # Generate contextual root cause & mitigation based on service type
                cause, action = generate_anomaly_explanation(provider, service, dev_pct, actual, expected)

                # Format date
                ts = pd.to_datetime(dates[i])
                anomaly_date_str = ts.strftime("%Y-%m-%d")

                anomalies.append({
                    "provider_code": str(provider),
                    "service_name": str(service),
                    "resource_id": f"{provider}-{service.lower().replace(' ', '-')}-cluster",
                    "anomaly_date": anomaly_date_str,
                    "expected_cost": round(float(expected), 2),
                    "actual_cost": round(float(actual), 2),
                    "difference": round(diff, 2),
                    "deviation_percent": round(dev_pct, 1),
                    "severity": severity,
                    "possible_cause": cause,
                    "recommended_action": action,
                    "status": "active"
                })

    return sorted(anomalies, key=lambda x: x["difference"], reverse=True)


def generate_anomaly_explanation(provider: str, service: str, dev_pct: float, actual: float, expected: float) -> tuple[str, str]:
    srv = service.lower()
    if "ec2" in srv or "vm" in srv or "compute" in srv:
        cause = f"Sudden auto-scaling trigger or unallocated on-demand compute instance bursts ({round(dev_pct, 1)}% spike over 7-day baseline)."
        action = "Inspect Auto-Scaling Group scale-down policies, terminate orphaned on-demand nodes, or adjust minimum target utilization."
    elif "s3" in srv or "blob" in srv or "storage" in srv:
        cause = f"High un-lifecycle data ingestion or multipart upload cache retention ({round(dev_pct, 1)}% above expected)."
        action = "Enable Intelligent-Tiering, purge abandoned incomplete multipart uploads, and set lifecycle expiration policies."
    elif "rds" in srv or "sql" in srv or "database" in srv:
        cause = f"Provisioned IOPS surge, unindexed query workload scan, or automated snapshot storage accumulation."
        action = "Review database slow query logs, optimize heavy join queries, and clean up aged point-in-time snapshots."
    elif "lambda" in srv or "function" in srv or "serverless" in srv:
        cause = f"Recursive function invocation loop or increased concurrency timeouts without error backoff."
        action = "Set concurrency execution caps, check Dead Letter Queues (DLQ), and inspect retry interval limits."
    elif "bigquery" in srv or "analytics" in srv:
        cause = f"Unpartitioned table full scan queries executed during scheduled batch processing."
        action = "Enforce partition and clustering filters on large datasets, and configure query cost maximum billing tier limits."
    else:
        cause = f"Unscheduled resource provisioning or network egress bandwidth surge ({round(dev_pct, 1)}% above rolling average)."
        action = "Review cloud trail audit logs for recent IAM provisioning events and inspect network routing tables."

    return cause, action
