import pytest
from app.database import SessionLocal
from app.tools.cost_tools import get_cost_records, get_service_costs, calculate_cost_growth
from app.tools.resource_tools import find_idle_resources, find_underutilized_resources
from app.tools.savings_tools import estimate_savings
from app.models.workspace import Workspace


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_agent_cost_and_resource_tools(db_session):
    ws = db_session.query(Workspace).first()
    assert ws is not None, "A workspace must exist in database"
    workspace_id = ws.id

    # 1. Cost Records Tool
    cost_data = get_cost_records(db_session, workspace_id)
    assert "count" in cost_data
    assert "total_amount" in cost_data
    assert cost_data["total_amount"] > 0

    # 2. Service Costs Tool
    service_data = get_service_costs(db_session, workspace_id)
    assert "top_services" in service_data
    assert len(service_data["top_services"]) > 0

    # 3. Cost Growth Tool
    growth_data = calculate_cost_growth(db_session, workspace_id)
    assert "growth_percentage" in growth_data
    assert "current_30d_spend" in growth_data

    # 4. Underutilized Resources Tool
    underutilized = find_underutilized_resources(db_session, workspace_id)
    assert "underutilized_count" in underutilized
    assert "underutilized_resources" in underutilized

    # 5. Idle Resources Tool
    idle = find_idle_resources(db_session, workspace_id)
    assert "idle_resource_count" in idle
    assert "idle_resources" in idle

    # 6. Savings Estimation Tool
    savings = estimate_savings(db_session, workspace_id)
    assert "potential_monthly_savings" in savings
    assert "estimates" in savings
