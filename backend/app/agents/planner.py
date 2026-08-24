from typing import List, Dict, Any


class AgentPlanner:
    """
    Constructs an evidence collection plan and tool execution graph based on the user's optimization goal.
    """
    @staticmethod
    def create_plan(goal: str, provider: str = "all") -> List[Dict[str, Any]]:
        plan = [
            {
                "step": 1,
                "tool_name": "get_cost_records",
                "purpose": "Query historical cost records and spending distribution",
                "params": {"provider_code": provider, "limit": 100}
            },
            {
                "step": 2,
                "tool_name": "get_service_costs",
                "purpose": "Aggregate cloud costs by service and provider hierarchy",
                "params": {}
            },
            {
                "step": 3,
                "tool_name": "calculate_cost_growth",
                "purpose": "Calculate 30-day spending growth rate and trend velocity",
                "params": {}
            },
            {
                "step": 4,
                "tool_name": "get_anomalies",
                "purpose": "Identify statistical spending spikes and cost anomalies",
                "params": {"severity": "all"}
            },
            {
                "step": 5,
                "tool_name": "get_resource_usage",
                "purpose": "Inspect resource CPU/Memory telemetry and instance status",
                "params": {"provider": provider}
            },
            {
                "step": 6,
                "tool_name": "find_idle_resources",
                "purpose": "Detect unattached, stopped, or zero-utilization resources",
                "params": {}
            },
            {
                "step": 7,
                "tool_name": "find_underutilized_resources",
                "purpose": "Identify overprovisioned instances eligible for rightsizing",
                "params": {}
            },
            {
                "step": 8,
                "tool_name": "forecast_cost",
                "purpose": "Generate 30-day forecast and evaluate budget overrun risks",
                "params": {"days_ahead": 30}
            },
            {
                "step": 9,
                "tool_name": "estimate_savings",
                "purpose": "Compute mathematical savings across rightsizing, idle cleanup, and plans",
                "params": {}
            },
            {
                "step": 10,
                "tool_name": "generate_optimization_plan",
                "purpose": "Synthesize collected evidence into explainable recommendations",
                "params": {"provider": provider}
            }
        ]
        return plan
