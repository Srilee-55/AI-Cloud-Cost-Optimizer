import pytest
from app.ml.anomaly_detector import detect_cost_anomalies
from app.ml.forecaster import generate_cost_forecast
from app.ml.savings_engine import calculate_savings_opportunities


def test_anomaly_detection_rolling_z_score():
    records = [
        {"cost_date": f"2026-08-{i:02d}", "amount": 100.0, "service_name": "EC2", "provider_code": "aws", "resource_id": f"res-{i}"}
        for i in range(1, 20)
    ]
    # Insert a massive spike on day 20
    records.append({
        "cost_date": "2026-08-20",
        "amount": 550.0,
        "service_name": "EC2",
        "provider_code": "aws",
        "resource_id": "i-test-spike"
    })

    anomalies = detect_cost_anomalies(records, z_threshold=2.0)
    assert len(anomalies) >= 1
    spike = anomalies[0]
    assert spike["actual_cost"] == 550.0
    assert spike["severity"] in ["Critical", "Warning"]
    assert "spike" in spike["possible_cause"].lower() or "burst" in spike["possible_cause"].lower()


def test_time_series_forecasting():
    history = [
        {"cost_date": f"2026-07-{i:02d}", "amount": 100.0 + (i * 5)}
        for i in range(1, 31)
    ]

    forecast_res = generate_cost_forecast(
        history,
        days_ahead=30,
        monthly_budget=7000.0
    )

    assert len(forecast_res["daily_predictions"]) == 30
    assert forecast_res["forecast_30d_total"] > 0

    first_pred = forecast_res["daily_predictions"][0]
    assert first_pred["upper_bound"] >= first_pred["predicted_cost"]
    assert first_pred["lower_bound"] <= first_pred["predicted_cost"]


def test_savings_engine_calculations():
    resources = [
        {
            "resource_id": "i-09ab12cd34ef5601",
            "name": "prod-analytics-worker-01",
            "provider_code": "aws",
            "service_name": "EC2",
            "cost_monthly": 240.0,
            "cpu_utilization": 8.5,
            "memory_utilization": 14.0,
            "status": "running",
        },
        {
            "resource_id": "vol-087654321fedcba",
            "name": "unattached-ebs-dump",
            "provider_code": "aws",
            "service_name": "EBS",
            "cost_monthly": 150.0,
            "status": "idle",
        }
    ]

    savings_report = calculate_savings_opportunities(resources, total_monthly_spend=5000.0)
    assert savings_report["potential_monthly_savings"] > 0
    assert savings_report["potential_annual_savings"] == savings_report["potential_monthly_savings"] * 12
    assert len(savings_report["estimates"]) >= 2
