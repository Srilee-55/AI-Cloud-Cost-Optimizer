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


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"


def test_cost_summary_endpoint(auth_headers):
    response = client.get("/api/costs/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_spend" in data["data"]
    assert "cost_trend" in data["data"]


def test_agent_run_pipeline(auth_headers):
    response = client.post(
        "/api/agent/run",
        json={"goal": "Test automated agentic execution", "provider": "all"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "summary" in data["data"]
    assert "recommendations" in data["data"]


def test_recommendation_approval_and_simulation(auth_headers):
    res = client.get("/api/recommendations?status_filter=pending", headers=auth_headers)
    assert res.status_code == 200
    recs = res.json()["data"]

    if len(recs) > 0:
        rec_id = recs[0]["id"]

        # 1. Approve
        approve_res = client.post(f"/api/recommendations/{rec_id}/approve", headers=auth_headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["data"]["approval_status"] == "approved"

        # 2. Simulate
        sim_res = client.post(f"/api/recommendations/{rec_id}/simulate", headers=auth_headers)
        assert sim_res.status_code == 200
        assert "safety_status" in sim_res.json()["data"]


def test_ai_copilot_endpoint(auth_headers):
    response = client.post(
        "/api/ai/copilot",
        json={"message": "What is my highest spending cloud service?"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["answer"]) > 0
    assert len(data["data"]["tools_consulted"]) > 0


def test_report_generation(auth_headers):
    # Generate CSV Report
    res_csv = client.post(
        "/api/reports/generate",
        json={
            "title": "Automated Test Report CSV",
            "report_type": "monthly_cost",
            "file_format": "csv",
        },
        headers=auth_headers,
    )
    assert res_csv.status_code == 201
    assert res_csv.json()["data"]["file_format"] == "csv"

    # Generate PDF Report
    res_pdf = client.post(
        "/api/reports/generate",
        json={
            "title": "Automated Test Report PDF",
            "report_type": "executive_summary",
            "file_format": "pdf",
        },
        headers=auth_headers,
    )
    assert res_pdf.status_code == 201
    assert res_pdf.json()["data"]["file_format"] == "pdf"


def test_alerts_webhook_test_trigger(auth_headers):
    response = client.post("/api/alerts/webhook/test", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "simulated_delivered"


def test_admin_system_health(auth_headers):
    response = client.get("/api/admin/system-health", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "HEALTHY"
