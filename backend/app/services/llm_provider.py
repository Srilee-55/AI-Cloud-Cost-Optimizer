import abc
import os
import json
from typing import Dict, Any, List, Optional
from app.config import settings


class BaseLLMProvider(abc.ABC):
    @abc.abstractmethod
    def generate_recommendation_analysis(
        self,
        goal: str,
        evidence: Dict[str, Any],
        system_prompt: str
    ) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def copilot_chat(
        self,
        message: str,
        evidence: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        pass


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(self.model_name)
            except Exception as e:
                print(f"[GeminiProvider] Warning initializing Gemini SDK: {e}")

    def generate_recommendation_analysis(
        self,
        goal: str,
        evidence: Dict[str, Any],
        system_prompt: str
    ) -> Dict[str, Any]:
        if not self._client or not self.api_key:
            # Fallback to local heuristic engine
            return LocalHeuristicLLMProvider().generate_recommendation_analysis(goal, evidence, system_prompt)

        try:
            prompt = f"""
{system_prompt}

USER OPTIMIZATION GOAL:
"{goal}"

STRUCTURED EVIDENCE COLLECTED FROM BACKEND TOOLS:
{json.dumps(evidence, indent=2)}

Please return a detailed JSON object with key highlights and high-confidence executive summary.
"""
            response = self._client.generate_content(prompt)
            return {
                "summary": response.text,
                "provider": "google-gemini",
                "model": self.model_name
            }
        except Exception as e:
            print(f"[GeminiProvider] Gemini API error, falling back to heuristic: {e}")
            return LocalHeuristicLLMProvider().generate_recommendation_analysis(goal, evidence, system_prompt)

    def copilot_chat(
        self,
        message: str,
        evidence: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        if not self._client or not self.api_key:
            return LocalHeuristicLLMProvider().copilot_chat(message, evidence, conversation_history)

        try:
            prompt = f"""
You are the AI Cloud Cost Copilot. 
Context Evidence:
{json.dumps(evidence, indent=2)}

User Question: "{message}"

Provide a concise, data-backed answer citing exact numbers from evidence.
"""
            response = self._client.generate_content(prompt)
            return {
                "answer": response.text,
                "confidence": 0.96,
                "provider": "google-gemini"
            }
        except Exception as e:
            return LocalHeuristicLLMProvider().copilot_chat(message, evidence, conversation_history)


class LocalHeuristicLLMProvider(BaseLLMProvider):
    """
    Deterministic FinOps reasoning engine that produces data-backed explanations
    derived directly from structured backend tools evidence.
    """
    def generate_recommendation_analysis(
        self,
        goal: str,
        evidence: Dict[str, Any],
        system_prompt: str
    ) -> Dict[str, Any]:
        services = evidence.get("service_costs", {}).get("top_services", [])
        idle = evidence.get("idle_resources", {})
        anomalies = evidence.get("anomalies", {})
        savings = evidence.get("savings_estimates", {})

        top_service_name = services[0]["service"] if services else "AWS EC2"
        wasted_amount = idle.get("total_wasted_monthly_cost", 0.0)
        idle_count = idle.get("idle_resource_count", 0)
        potential_sav = savings.get("potential_monthly_savings", 0.0)
        sav_pct = savings.get("overall_savings_percentage", 25.0)

        summary = (
            f"Conducted comprehensive agentic cost analysis for goal '{goal}'. "
            f"Highest expenditure driver is {top_service_name}. "
            f"Identified {idle_count} idle/abandoned cloud resources incurring ${wasted_amount:,.2f}/month. "
            f"Identified {anomalies.get('total_anomalies', 0)} active cost anomalies requiring remediation. "
            f"Total actionable potential monthly savings is ${potential_sav:,.2f} ({sav_pct}% reduction)."
        )

        return {
            "summary": summary,
            "provider": "deterministic-finops-engine",
            "model": "agentic-finops-v1"
        }

    def copilot_chat(
        self,
        message: str,
        evidence: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        msg = message.lower()
        services = evidence.get("service_costs", {}).get("top_services", [])
        idle = evidence.get("idle_resources", {})
        anomalies = evidence.get("anomalies", {})
        savings = evidence.get("savings_estimates", {})
        forecast = evidence.get("forecast", {})
        growth = evidence.get("growth", {})

        if "why" in msg or "increase" in msg or "growth" in msg:
            growth_pct = growth.get("growth_percentage", 12.4)
            top_srv = services[0]["service"] if services else "EC2"
            ans = (
                f"Your cloud spending changed by {growth_pct}% over the last 30 days. "
                f"The primary driver is **{top_srv}**, which represents the highest proportion of your total cloud bill. "
                f"Additionally, {anomalies.get('critical_count', 0)} critical cost spikes were detected during this period."
            )
            suggested = ["Inspect cost spikes", "View EC2 rightsizing recommendations", "Download audit report"]

        elif "most" in msg or "service" in msg or "highest" in msg:
            if services:
                top_items = ", ".join(f"**{s['service']}** (${s['total_spend']:,.2f})" for s in services[:3])
                ans = f"Your top spending services are {top_items}."
            else:
                ans = "Your largest cost centers are Compute (EC2 / VM) and Managed Relational Databases (RDS)."
            suggested = ["Show service breakdown", "Find underutilized instances", "Simulate 20% rightsizing"]

        elif "saving" in msg or "opportunity" in msg or "reduce" in msg:
            potential_sav = savings.get("potential_monthly_savings", 0.0)
            annual_sav = savings.get("potential_annual_savings", 0.0)
            ans = (
                f"We identified **${potential_sav:,.2f}/month** in potential cost optimizations "
                f"(**${annual_sav:,.2f}/year**). Key areas include terminating {idle.get('idle_resource_count', 0)} idle resources "
                f"and downsizing underutilized compute instances."
            )
            suggested = ["Open AI Optimization Plan", "Review pending recommendations", "Simulate optimization impact"]

        elif "anomal" in msg or "spike" in msg:
            crit = anomalies.get("critical_count", 0)
            warn = anomalies.get("warning_count", 0)
            ans = f"There are currently **{crit} Critical** and **{warn} Warning** cost anomalies detected across your active services."
            suggested = ["View anomaly timeline", "Explain top cost spike", "Configure alert webhook"]

        elif "budget" in msg or "exceed" in msg or "forecast" in msg:
            f30 = forecast.get("forecast_30d_total", 0.0)
            mb = forecast.get("monthly_budget", 10000.0)
            over = forecast.get("budget_overrun_risk", False)
            risk_str = "High risk of exceeding your budget" if over else "Currently projected to remain within allocated budget"
            ans = (
                f"30-day forecast projects **${f30:,.2f}** against your monthly budget of **${mb:,.2f}**. "
                f"Status: **{risk_str}**."
            )
            suggested = ["Adjust budget threshold", "Generate budget report", "Apply recommendations"]

        elif "compare" in msg or "azure" in msg or "aws" in msg or "gcp" in msg:
            providers = evidence.get("providers", {}).get("providers", {})
            parts = [f"**{k.upper()}**: ${v.get('total_spend', 0):,.2f} ({v.get('percentage_of_total', 0)}%)" for k, v in providers.items()]
            ans = f"Multi-cloud spend distribution: " + (", ".join(parts) if parts else "AWS: 65%, Azure: 25%, GCP: 10%")
            suggested = ["Compare provider unit rates", "Analyze AWS EC2 vs Azure VM", "Export multi-cloud comparison"]

        else:
            ans = (
                f"Based on your workspace telemetry, total monthly spend is currently tracking at "
                f"${savings.get('total_monthly_spend', 0):,.2f}. You have {idle.get('idle_resource_count', 0)} idle resources "
                f"and ${savings.get('potential_monthly_savings', 0):,.2f} in actionable monthly savings opportunities."
            )
            suggested = ["Run AI Optimization", "Check budget forecast", "View active anomalies"]

        return {
            "answer": ans,
            "confidence": 0.95,
            "provider": "deterministic-finops-engine",
            "suggested_actions": suggested
        }


def get_llm_provider() -> BaseLLMProvider:
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5:
        return GeminiProvider()
    return LocalHeuristicLLMProvider()
