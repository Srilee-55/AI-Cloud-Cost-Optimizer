import os
import csv
import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def format_indian_number(val: float, decimals: int = 2) -> str:
    """Formats numeric float into standard Indian Numbering system (Lakhs, Crores)."""
    try:
        n = float(val)
    except (ValueError, TypeError):
        return "0.00"
    
    s = f"{abs(n):.{decimals}f}"
    parts = s.split(".")
    int_part = parts[0]
    dec_part = f".{parts[1]}" if len(parts) > 1 and decimals > 0 else ""
    
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
        
    return f"-INR {formatted}{dec_part}" if n < 0 else f"INR {formatted}{dec_part}"


def generate_cost_report_csv(cost_records: List[Dict[str, Any]]) -> str:
    """Generates CSV format string from cost records."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(["ID", "Date", "Provider", "Service", "Resource ID", "Amount", "Currency", "Cost Center", "Team", "Environment"])
    
    for r in cost_records:
        writer.writerow([
            r.get("id", ""),
            str(r.get("cost_date", "")),
            r.get("provider_code", "").upper(),
            r.get("service_name", ""),
            r.get("resource_id", ""),
            r.get("amount", 0.0),
            r.get("currency", "INR"),
            r.get("cost_center", ""),
            r.get("team", ""),
            r.get("environment", "")
        ])
        
    return output.getvalue()


def generate_executive_report_pdf(
    workspace_name: str,
    summary_data: Dict[str, Any],
    anomalies: List[Dict[str, Any]],
    recommendations: List[Dict[str, Any]],
    output_path: str
) -> str:
    """Generates an executive-ready PDF report using ReportLab with a clean light theme."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom light theme styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1E293B"),
        fontName="Helvetica-Bold",
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#334155"),
        fontName="Helvetica-Bold",
        spaceBefore=14,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("AI Cloud Cost Optimizer — Executive Intelligence Report", title_style))
    elements.append(Paragraph(f"<b>Workspace:</b> {workspace_name} &nbsp;|&nbsp; <b>Generated:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    elements.append(Spacer(1, 10))

    # Executive Summary KPI Table
    elements.append(Paragraph("1. Executive Financial Summary", heading_style))
    
    tot_spend = summary_data.get("total_spend", 0.0)
    curr_month = summary_data.get("current_month_spend", 0.0)
    pot_savings = summary_data.get("potential_savings", 0.0)
    efficiency = summary_data.get("cost_efficiency_score", 85.0)
    
    kpi_data = [
        ["Total Recorded Spend", "Current Month Spend", "Potential Monthly Savings", "Cost Efficiency Score"],
        [format_indian_number(tot_spend), format_indian_number(curr_month), format_indian_number(pot_savings), f"{efficiency}/100"]
    ]
    
    kpi_table = Table(kpi_data, colWidths=[130, 130, 140, 130])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#475569")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#FFFFFF")),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor("#0F172A")),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 11),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 15))

    # Top AI Optimization Recommendations
    elements.append(Paragraph("2. Top AI Optimization Recommendations", heading_style))
    if recommendations:
        rec_rows = [["Priority", "Service", "Problem & Action", "Monthly Savings", "Status"]]
        for r in recommendations[:4]:
            rec_rows.append([
                r.get("priority", "High"),
                f"{r.get('provider', '').upper()} {r.get('service', '')}",
                Paragraph(f"<b>{r.get('title', '')}</b><br/>{r.get('recommended_action', '')[:110]}...", body_style),
                f"{format_indian_number(r.get('estimated_savings', 0))} ({r.get('savings_percentage', 0)}%)",
                r.get("approval_status", "pending").capitalize()
            ])
            
        rec_table = Table(rec_rows, colWidths=[65, 85, 230, 95, 65])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(rec_table)
    else:
        elements.append(Paragraph("No active recommendations found.", body_style))
    elements.append(Spacer(1, 15))

    # Critical Anomaly Audit
    elements.append(Paragraph("3. Detected Cost Anomalies & Spikes", heading_style))
    if anomalies:
        anom_rows = [["Severity", "Date", "Service", "Actual vs Expected", "Deviation %", "Possible Root Cause"]]
        for a in anomalies[:4]:
            anom_rows.append([
                a.get("severity", "Warning"),
                str(a.get("anomaly_date", "")),
                f"{a.get('provider_code', '').upper()} {a.get('service_name', '')}",
                f"{format_indian_number(a.get('actual_cost', 0))} (exp: {format_indian_number(a.get('expected_cost', 0))})",
                f"+{a.get('deviation_percent', 0)}%",
                Paragraph(a.get("possible_cause", "")[:100] + "...", body_style)
            ])
            
        anom_table = Table(anom_rows, colWidths=[55, 65, 95, 115, 65, 145])
        anom_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(anom_table)
    else:
        elements.append(Paragraph("No active cost anomalies recorded.", body_style))

    doc.build(elements)
    return output_path
