"""
==============================================================================
AI Cloud Cost Optimizer — End-to-End Migration & Data Isolation Verification
==============================================================================
Tests complete user lifecycle:
1. Registration & isolated workspace creation
2. Login and JWT authentication
3. CSV Billing Data Ingestion (Cost Records)
4. Cost Summary & FinOps Analytics
5. AI Agent Optimization Pipeline & Simulated Execution
6. Executive Report Generation
7. Strict Per-User Data Isolation (User A vs User B)
"""

import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_e2e_full_lifecycle_and_user_isolation():
    uid_a = uuid.uuid4().hex[:6]
    uid_b = uuid.uuid4().hex[:6]

    # -------------------------------------------------------------
    # Step 1: Register User A
    # -------------------------------------------------------------
    user_a_payload = {
        "email": f"sarah_{uid_a}@cyberdyne-finops.io",
        "password": "StrongPassword2026!",
        "full_name": "Sarah Connor",
        "role": "Admin"
    }
    reg_a = client.post("/api/auth/register", json=user_a_payload)
    assert reg_a.status_code == 201
    token_a = reg_a.json()["data"]["access_token"]
    user_a_id = reg_a.json()["data"]["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # -------------------------------------------------------------
    # Step 2: Login User A
    # -------------------------------------------------------------
    login_a = client.post("/api/auth/login", json={"email": user_a_payload["email"], "password": user_a_payload["password"]})
    assert login_a.status_code == 200
    assert login_a.json()["data"]["access_token"] is not None

    # Verify User A's Workspace was auto-created and isolated
    ws_res_a = client.get("/api/workspaces/current", headers=headers_a)
    assert ws_res_a.status_code == 200
    workspace_a = ws_res_a.json()["data"]
    workspace_a_id = workspace_a["id"]
    assert "Sarah Connor" in workspace_a["name"]

    # -------------------------------------------------------------
    # Step 3: Register User B
    # -------------------------------------------------------------
    user_b_payload = {
        "email": f"john_{uid_b}@continental-cloud.com",
        "password": "AssassinPassword2026!",
        "full_name": "John Wick",
        "role": "Member"
    }
    reg_b = client.post("/api/auth/register", json=user_b_payload)
    assert reg_b.status_code == 201
    token_b = reg_b.json()["data"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    ws_res_b = client.get("/api/workspaces/current", headers=headers_b)
    assert ws_res_b.status_code == 200
    workspace_b = ws_res_b.json()["data"]
    workspace_b_id = workspace_b["id"]

    # Strict isolation check: User A and User B must have different workspace IDs!
    assert workspace_a_id != workspace_b_id

    # -------------------------------------------------------------
    # Step 4: User A Ingests CSV Billing Data
    # -------------------------------------------------------------
    csv_content = (
        "Date,Provider,Service,Amount,Region,CostCenter,Team,Project,Environment,ResourceId\n"
        "2026-08-01,aws,EC2,450.00,us-east-1,Engineering,Backend,Core,Production,i-user-a-01\n"
        "2026-08-02,aws,RDS,280.00,us-east-1,Engineering,Database,Core,Production,rds-user-a-01\n"
        "2026-08-03,gcp,BigQuery,320.00,us-central1,Analytics,BI,Reports,Production,bq-user-a-01\n"
    )
    files = {"file": ("user_a_billing.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/data/upload-csv", headers=headers_a, files=files)
    assert upload_res.status_code == 200
    assert upload_res.json()["data"]["inserted_records_count"] == 3

    # -------------------------------------------------------------
    # Step 5: User A queries Cost Summary
    # -------------------------------------------------------------
    cost_summary_a = client.get("/api/costs/summary", headers=headers_a)
    assert cost_summary_a.status_code == 200
    summary_data_a = cost_summary_a.json()["data"]
    assert summary_data_a["total_spend"] == 1050.00
    assert "aws" in summary_data_a["breakdown_by_provider"]

    # -------------------------------------------------------------
    # Step 6: Verify User B cannot see User A's Cost Records (Data Isolation)
    # -------------------------------------------------------------
    cost_summary_b = client.get("/api/costs/summary", headers=headers_b)
    assert cost_summary_b.status_code == 200
    summary_data_b = cost_summary_b.json()["data"]
    # User B has no cost records
    assert summary_data_b["total_spend"] == 0.0

    # User B attempts to access User A's workspace with explicit header
    cross_access_res = client.get("/api/costs/summary", headers={"Authorization": f"Bearer {token_b}", "X-Workspace-Id": workspace_a_id})
    assert cross_access_res.status_code == 403

    # -------------------------------------------------------------
    # Step 7: User A runs AI Agent Optimization
    # -------------------------------------------------------------
    agent_run = client.post("/api/agent/run", headers=headers_a, json={
        "goal": "Identify cost optimization opportunities for User A",
        "provider": "all"
    })
    assert agent_run.status_code == 200
    agent_data = agent_run.json()["data"]
    assert "recommendations" in agent_data

    # -------------------------------------------------------------
    # Step 8: User A generates Executive PDF Report
    # -------------------------------------------------------------
    report_res = client.post("/api/reports/generate", headers=headers_a, json={
        "title": "Sarah Connor August Cost Audit",
        "report_type": "executive_summary",
        "file_format": "pdf"
    })
    assert report_res.status_code == 201
    report_id = report_res.json()["data"]["id"]

    # Download report
    download_res = client.get(f"/api/reports/{report_id}/download", headers=headers_a)
    assert download_res.status_code == 200
    assert len(download_res.content) > 0
