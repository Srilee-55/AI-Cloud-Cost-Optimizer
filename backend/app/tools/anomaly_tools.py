from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.anomaly import Anomaly
from app.models.cost import CostRecord
from app.ml.anomaly_detector import detect_cost_anomalies


def get_anomalies(db: Session, workspace_id: str, severity: str = None) -> Dict[str, Any]:
    """Tool: Returns detected cost anomalies and spikes."""
    # First check stored anomalies
    query = db.query(Anomaly).filter(Anomaly.workspace_id == workspace_id)
    if severity and severity.lower() != "all":
        query = query.filter(Anomaly.severity == severity.capitalize())
        
    anomalies = query.order_by(Anomaly.difference.desc()).all()

    # If none stored yet, compute on the fly from cost records
    if not anomalies:
        cost_records = db.query(CostRecord).filter(CostRecord.workspace_id == workspace_id).all()
        records_dict = [
            {
                "provider_code": r.provider_code,
                "service_name": r.service_name,
                "cost_date": str(r.cost_date),
                "amount": r.amount
            }
            for r in cost_records
        ]
        detected = detect_cost_anomalies(records_dict)
        return {
            "total_anomalies": len(detected),
            "critical_count": sum(1 for a in detected if a["severity"] == "Critical"),
            "warning_count": sum(1 for a in detected if a["severity"] == "Warning"),
            "anomalies": detected[:10]
        }

    return {
        "total_anomalies": len(anomalies),
        "critical_count": sum(1 for a in anomalies if a.severity == "Critical"),
        "warning_count": sum(1 for a in anomalies if a.severity == "Warning"),
        "anomalies": [
            {
                "id": a.id,
                "provider": a.provider_code,
                "service": a.service_name,
                "date": str(a.anomaly_date),
                "expected_cost": a.expected_cost,
                "actual_cost": a.actual_cost,
                "difference": a.difference,
                "deviation_percent": a.deviation_percent,
                "severity": a.severity,
                "possible_cause": a.possible_cause,
                "recommended_action": a.recommended_action
            }
            for a in anomalies
        ]
    }
