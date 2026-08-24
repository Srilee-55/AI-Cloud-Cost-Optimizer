import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.memory import AgentMemory
from app.tools import cost_tools, resource_tools, anomaly_tools, forecast_tools, savings_tools, recommendation_tools
from app.services.llm_provider import get_llm_provider
from app.agents.prompts import SYSTEM_AGENT_PROMPT


class DecisionEngine:
    def __init__(self, db: Session, workspace_id: str, memory: AgentMemory):
        self.db = db
        self.workspace_id = workspace_id
        self.memory = memory
        self.llm = get_llm_provider()

    def execute_tool(self, tool_name: str, params: Dict[str, Any], evidence_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Invokes a specific backend tool and returns structured output."""
        if tool_name == "get_cost_records":
            return cost_tools.get_cost_records(
                self.db, self.workspace_id,
                provider_code=params.get("provider_code"),
                limit=params.get("limit", 100)
            )
        elif tool_name == "get_service_costs":
            return cost_tools.get_service_costs(self.db, self.workspace_id)
        elif tool_name == "calculate_cost_growth":
            return cost_tools.calculate_cost_growth(self.db, self.workspace_id)
        elif tool_name == "compare_provider_costs":
            return cost_tools.compare_provider_costs(self.db, self.workspace_id)
        elif tool_name == "get_anomalies":
            return anomaly_tools.get_anomalies(self.db, self.workspace_id, severity=params.get("severity"))
        elif tool_name == "get_resource_usage":
            return resource_tools.get_resource_usage(self.db, self.workspace_id, provider=params.get("provider"))
        elif tool_name == "find_idle_resources":
            return resource_tools.find_idle_resources(self.db, self.workspace_id)
        elif tool_name == "find_underutilized_resources":
            return resource_tools.find_underutilized_resources(self.db, self.workspace_id)
        elif tool_name == "forecast_cost":
            return forecast_tools.forecast_cost(self.db, self.workspace_id, days_ahead=params.get("days_ahead", 30))
        elif tool_name == "get_budget_status":
            return forecast_tools.get_budget_status(self.db, self.workspace_id)
        elif tool_name == "estimate_savings":
            return savings_tools.estimate_savings(self.db, self.workspace_id)
        elif tool_name == "simulate_optimization_impact":
            return savings_tools.simulate_optimization_impact(self.db, self.workspace_id, coverage_percentage=params.get("coverage_percentage", 100.0))
        elif tool_name == "generate_optimization_plan":
            return {"recommendations": recommendation_tools.generate_optimization_plan(evidence_context or {}, provider=params.get("provider", "aws"))}
        else:
            return {"error": f"Unknown tool '{tool_name}'"}

    def run_agentic_pipeline(self, goal: str, plan_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes the sequential Agentic AI workflow:
        Observe -> Collect Evidence -> Reason -> Plan -> Recommend
        """
        evidence: Dict[str, Any] = {}
        tool_trace: List[Dict[str, Any]] = []

        # 1. Sequential Tool Execution & Evidence Collection
        for item in plan_steps:
            step = item["step"]
            tool_name = item["tool_name"]
            purpose = item["purpose"]
            params = item.get("params", {})

            start_t = time.time()
            output = self.execute_tool(tool_name, params, evidence_context=evidence)
            duration_ms = round((time.time() - start_t) * 1000, 2)

            # Store in evidence cache
            if tool_name == "get_cost_records":
                evidence["cost_records"] = output
            elif tool_name == "get_service_costs":
                evidence["service_costs"] = output
            elif tool_name == "calculate_cost_growth":
                evidence["growth"] = output
            elif tool_name == "get_anomalies":
                evidence["anomalies"] = output
            elif tool_name == "get_resource_usage":
                evidence["resources"] = output
            elif tool_name == "find_idle_resources":
                evidence["idle_resources"] = output
            elif tool_name == "find_underutilized_resources":
                evidence["underutilized_resources"] = output
            elif tool_name == "forecast_cost":
                evidence["forecast"] = output
            elif tool_name == "estimate_savings":
                evidence["savings_estimates"] = output

            # Record tool action in memory / database
            self.memory.record_action(
                step_number=step,
                tool_name=tool_name,
                purpose=purpose,
                tool_input=params,
                tool_output=output,
                duration_ms=duration_ms,
                status="success"
            )

            # Add to tool trace for frontend explainability
            tool_trace.append({
                "step": step,
                "tool_name": tool_name,
                "purpose": purpose,
                "duration_ms": duration_ms,
                "status": "success",
                "key_findings": self._extract_key_findings(tool_name, output)
            })

        # 2. Synthesize Recommendations
        generated_recs = recommendation_tools.generate_optimization_plan(evidence)
        saved_recommendations = []
        for rec in generated_recs:
            saved_rec = recommendation_tools.save_recommendation(
                db=self.db,
                workspace_id=self.workspace_id,
                recommendation_data=rec,
                session_id=self.memory.session_id,
                tool_trace=tool_trace
            )
            saved_recommendations.append(saved_rec)

        # 3. Generate LLM Analysis / Executive Summary
        llm_res = self.llm.generate_recommendation_analysis(goal, evidence, SYSTEM_AGENT_PROMPT)
        summary = llm_res.get("summary", "Optimization analysis completed.")

        self.memory.complete_session(summary)

        return {
            "session_id": self.memory.session_id,
            "goal": goal,
            "summary": summary,
            "recommendations": saved_recommendations,
            "tool_trace": tool_trace,
            "evidence": evidence
        }

    def _extract_key_findings(self, tool_name: str, output: Dict[str, Any]) -> str:
        def fmt(val):
            try:
                n = float(val)
                s = f"{abs(n):.2f}"
                parts = s.split(".")
                int_part = parts[0]
                dec_part = f".{parts[1]}"
                if len(int_part) <= 3:
                    formatted = int_part
                else:
                    last3 = int_part[-3:]
                    remaining = int_part[:-3]
                    groups = []
                    while len(remaining) > 2:
                        groups.insert(0, remaining[-2:])
                        remaining = remaining[:-2]
                    if remaining:
                        groups.insert(0, remaining)
                    formatted = ",".join(groups) + "," + last3
                return f"₹{formatted}{dec_part}"
            except Exception:
                return "₹0.00"

        if tool_name == "get_cost_records":
            return f"Retrieved {output.get('count', 0)} cost records totalling {fmt(output.get('total_amount', 0))}."
        elif tool_name == "get_service_costs":
            top = output.get("top_services", [])
            top_name = top[0]["service"] if top else "None"
            return f"Top expenditure driver identified as {top_name}."
        elif tool_name == "calculate_cost_growth":
            return f"Spending grew by {output.get('growth_percentage', 0)}% compared with the previous 30-day period."
        elif tool_name == "get_anomalies":
            return f"Found {output.get('critical_count', 0)} Critical and {output.get('warning_count', 0)} Warning cost anomalies."
        elif tool_name == "find_idle_resources":
            return f"Flagged {output.get('idle_resource_count', 0)} idle/stopped resources creating {fmt(output.get('total_wasted_monthly_cost', 0))}/mo waste."
        elif tool_name == "find_underutilized_resources":
            return f"Flagged {output.get('underutilized_count', 0)} underutilized instances with potential savings of {fmt(output.get('potential_monthly_savings', 0))}/mo."
        elif tool_name == "forecast_cost":
            return f"30-day spend projected at {fmt(output.get('forecast_30d_total', 0))} (budget: {fmt(output.get('monthly_budget', 0))})."
        elif tool_name == "estimate_savings":
            return f"Identified total potential savings of {fmt(output.get('potential_monthly_savings', 0))}/month ({output.get('overall_savings_percentage', 0)}%)."
        elif tool_name == "generate_optimization_plan":
            return f"Compiled structured optimization recommendations with pending human approval."
        return "Tool execution succeeded."
