import numpy as np
import pandas as pd
from datetime import date, timedelta
from typing import List, Dict, Any


def generate_cost_forecast(
    cost_records: List[Dict[str, Any]],
    days_ahead: int = 30,
    monthly_budget: float = 10000.0
) -> Dict[str, Any]:
    """
    Generates time-series cost forecasts using Holt's Linear Exponential Smoothing & Linear Trend Regression.
    Returns predicted daily costs, confidence bands (upper/lower bounds), and budget overrun risk analysis.
    """
    if not cost_records:
        # Fallback default estimation
        today = date.today()
        daily = []
        base_rate = monthly_budget / 30.0 if monthly_budget > 0 else 100.0
        for i in range(1, days_ahead + 1):
            target = today + timedelta(days=i)
            daily.append({
                "date": target.strftime("%Y-%m-%d"),
                "predicted_cost": round(base_rate, 2),
                "lower_bound": round(base_rate * 0.85, 2),
                "upper_bound": round(base_rate * 1.15, 2),
                "confidence_score": 0.80
            })
        return {
            "forecast_7d_total": round(base_rate * 7, 2),
            "forecast_30d_total": round(base_rate * 30, 2),
            "next_month_total": round(base_rate * 30, 2),
            "monthly_budget": monthly_budget,
            "budget_overrun_risk": (base_rate * 30) > monthly_budget,
            "budget_variance": round((base_rate * 30) - monthly_budget, 2),
            "method": "baseline_exponential_smoothing",
            "daily_predictions": daily
        }

    df = pd.DataFrame(cost_records)
    df["cost_date"] = pd.to_datetime(df["cost_date"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    daily_spend = df.groupby("cost_date")["amount"].sum().reset_index()
    daily_spend = daily_spend.sort_values(by="cost_date")

    y = daily_spend["amount"].values
    n = len(y)

    if n < 3:
        avg_val = float(np.mean(y)) if n > 0 else monthly_budget / 30.0
        y = np.array([avg_val, avg_val, avg_val])
        n = len(y)

    # Calculate trend and level via Double Exponential Smoothing (Holt's linear)
    alpha = 0.35  # level smoothing
    beta = 0.15   # trend smoothing

    level = y[0]
    trend = (y[-1] - y[0]) / n if n > 1 else 0.0

    for val in y:
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend

    # Standard error of residuals for confidence intervals
    residuals = []
    current_l = y[0]
    current_t = trend
    for val in y:
        pred = current_l + current_t
        residuals.append(val - pred)
        current_l = alpha * val + (1 - alpha) * (current_l + current_t)
        current_t = beta * (current_l - (current_l - current_t)) + (1 - beta) * current_t

    std_err = float(np.std(residuals)) if len(residuals) > 1 else float(np.std(y))
    if std_err == 0:
        std_err = max(float(np.mean(y)) * 0.1, 5.0)

    last_date = daily_spend["cost_date"].max().date()
    daily_predictions = []

    cum_7d = 0.0
    cum_30d = 0.0

    for step in range(1, days_ahead + 1):
        target_date = last_date + timedelta(days=step)
        # Linear forecast step
        pred_val = max(0.0, level + (step * trend))
        
        # Uncertainty expands with horizon
        uncertainty = 1.96 * std_err * np.sqrt(1 + (step * 0.05))
        lower = max(0.0, pred_val - uncertainty)
        upper = pred_val + uncertainty

        confidence = max(0.60, min(0.98, 0.95 - (step * 0.008)))

        daily_predictions.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_cost": round(float(pred_val), 2),
            "lower_bound": round(float(lower), 2),
            "upper_bound": round(float(upper), 2),
            "confidence_score": round(float(confidence), 2)
        })

        if step <= 7:
            cum_7d += pred_val
        if step <= 30:
            cum_30d += pred_val

    # Estimate current month vs next month
    next_month_total = cum_30d
    budget_variance = next_month_total - monthly_budget
    overrun_risk = next_month_total > monthly_budget

    return {
        "forecast_7d_total": round(cum_7d, 2),
        "forecast_30d_total": round(cum_30d, 2),
        "next_month_total": round(next_month_total, 2),
        "monthly_budget": monthly_budget,
        "budget_overrun_risk": overrun_risk,
        "budget_variance": round(budget_variance, 2),
        "method": "holts_linear_exponential_smoothing",
        "daily_predictions": daily_predictions
    }
