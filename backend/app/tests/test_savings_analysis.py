import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@cloudoptimizer.ai", "password": "OptimizerDemo2026!"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["data"]["access_token"]
    workspace_id = response.json()["data"]["user"]["workspace_id"]
    return {
        "Authorization": f"Bearer {token}",
        "X-Workspace-Id": workspace_id,
    }


def test_savings_empty_or_workspace_state(auth_headers):
    """Test 1: Workspace savings returns valid data structure in INR without mock numbers."""
    response = client.get("/api/savings", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["currency"] == "INR"
    assert data["currency_symbol"] == "₹"


def test_savings_user_provided_compute_rightsizing(auth_headers):
    """Test 2: One compute resource with low utilization generates Rightsizing recommendation with complete evidence."""
    payload = {
        "resources": [
            {
                "cloud_provider": "aws",
                "resource_id": "i-09ab12cd34ef",
                "resource_name": "prod-api-backend-01",
                "resource_type": "compute",
                "service_name": "EC2",
                "region": "ap-south-1",
                "monthly_cost": 18500.0,
                "cpu_utilization": 12.5,
                "memory_utilization": 18.0,
                "hours_per_day": 24.0,
                "environment": "Production",
                "status": "running"
            }
        ],
        "analysis_period": "30d",
        "currency": "INR"
    }
    response = client.post("/api/savings/analyze", json=payload, headers=auth_headers)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["total_monthly_spend"] == 18500.0
    assert data["potential_monthly_savings"] > 0
    assert data["opportunities_count"] >= 1

    opp = data["opportunities"][0]
    assert opp["category"] == "rightsizing"
    assert "why" in opp and len(opp["why"]) > 0
    assert "evidence" in opp
    assert opp["evidence"]["Resource ID"] == "i-09ab12cd34ef"
    assert "12.5%" in opp["evidence"]["Average CPU"]
    assert opp["current_monthly_spend"] == 18500.0
    assert opp["estimated_monthly_savings"] > 0
    assert opp["estimated_annual_savings"] == opp["estimated_monthly_savings"] * 12
    assert opp["risk_level"] in ["Low", "Medium", "High"]
    assert opp["effort_level"] in ["Low", "Medium", "High"]
    assert opp["confidence_score"] >= 0.8
    assert "suggested_action" in opp


def test_savings_user_provided_idle_resource(auth_headers):
    """Test 3: Unattached / idle resource generates Idle Cleanup recommendation."""
    payload = {
        "resources": [
            {
                "cloud_provider": "aws",
                "resource_id": "vol-0847b2c910fa",
                "resource_name": "legacy-unattached-ebs",
                "resource_type": "storage",
                "service_name": "EBS",
                "region": "ap-south-1",
                "monthly_cost": 3200.0,
                "environment": "Staging",
                "status": "unattached"
            }
        ]
    }
    response = client.post("/api/savings/analyze", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["opportunities_count"] == 1
    opp = data["opportunities"][0]
    assert opp["category"] == "idle_termination"
    assert opp["estimated_monthly_savings"] >= 3000.0
    assert opp["risk_level"] == "Low"


def test_savings_invalid_data_validation(auth_headers):
    """Test 4: Negative cost or invalid CPU % rejects with descriptive validation message."""
    # Negative cost
    bad_cost_payload = {
        "resources": [
            {
                "cloud_provider": "aws",
                "resource_id": "i-bad-01",
                "monthly_cost": -500.0,
                "service_name": "EC2"
            }
        ]
    }
    resp = client.post("/api/savings/analyze", json=bad_cost_payload, headers=auth_headers)
    assert resp.status_code in [400, 422]

    # CPU > 100%
    bad_cpu_payload = {
        "resources": [
            {
                "cloud_provider": "aws",
                "resource_id": "i-bad-02",
                "monthly_cost": 500.0,
                "cpu_utilization": 150.0,
                "service_name": "EC2"
            }
        ]
    }
    resp2 = client.post("/api/savings/analyze", json=bad_cpu_payload, headers=auth_headers)
    assert resp2.status_code in [400, 422]


def test_savings_csv_template_download():
    """Test 5: Sample CSV template can be downloaded."""
    response = client.get("/api/savings/template/csv")
    assert response.status_code == 200
    assert "cloud_provider,resource_id" in response.text
