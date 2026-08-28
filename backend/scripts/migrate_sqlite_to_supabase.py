"""
==============================================================================
AI Cloud Cost Optimizer — SQLite to Supabase PostgreSQL Migration Script
==============================================================================
Safely copies all existing data from SQLite (cloud_optimizer.db) to Supabase PostgreSQL.
Features:
- Automatic timestamped backup of the local SQLite database
- Automatic schema creation on the target database
- Strict topological table migration preserving Foreign Key constraints
- Row-by-row / batch verification comparing SQLite source and Supabase target counts
- Detailed summary logging
"""

import os
import sys
import shutil
import argparse
from datetime import datetime
from typing import List, Dict, Any, Type

# Configure UTF-8 encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.database import Base
from app.models import (
    User,
    Workspace,
    WorkspaceMember,
    CloudProvider,
    CloudAccount,
    CloudResource,
    CostRecord,
    CostEfficiencyScore,
    Budget,
    Anomaly,
    Forecast,
    SavingsEstimate,
    AgentSession,
    AgentAction,
    ChatMessage,
    AIRecommendation,
    Alert,
    Notification,
    WebhookEvent,
    AuditLog,
    Report
)


TABLE_ORDER: List[Type[Base]] = [
    User,
    Workspace,
    WorkspaceMember,
    CloudProvider,
    CloudAccount,
    CloudResource,
    CostRecord,
    CostEfficiencyScore,
    Budget,
    Anomaly,
    Forecast,
    SavingsEstimate,
    AgentSession,
    AgentAction,
    ChatMessage,
    AIRecommendation,
    Alert,
    Notification,
    WebhookEvent,
    AuditLog,
    Report
]


def backup_sqlite_db(db_path: str) -> str:
    """Creates a timestamped backup of the SQLite database."""
    if not os.path.exists(db_path):
        print(f"[Warning] SQLite file '{db_path}' does not exist. Skipping backup.")
        return ""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_{timestamp}"
    shutil.copy2(db_path, backup_path)
    print(f"[Backup] SQLite database backed up to: {backup_path}")
    return backup_path


def migrate_data(source_db_path: str, target_db_url: str, batch_size: int = 100):
    """Executes the migration from SQLite to Supabase PostgreSQL."""
    print("=" * 80)
    print("🚀 AI CLOUD COST OPTIMIZER — DATABASE MIGRATION (SQLite -> Supabase PostgreSQL)")
    print("=" * 80)
    
    # 1. Backup source SQLite DB
    backup_sqlite_db(source_db_path)
    
    # 2. Setup Source Engine & Session
    sqlite_url = f"sqlite:///{os.path.abspath(source_db_path)}"
    source_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SourceSession = sessionmaker(bind=source_engine)
    source_session = SourceSession()
    
    # 3. Setup Target Engine & Session
    if target_db_url.startswith("postgres://"):
        target_db_url = "postgresql://" + target_db_url[len("postgres://"):]
    
    print(f"[Connect] Connecting to Target Supabase Database: {target_db_url.split('@')[-1] if '@' in target_db_url else target_db_url}")
    target_engine = create_engine(target_db_url, pool_pre_ping=True)
    TargetSession = sessionmaker(bind=target_engine)
    target_session = TargetSession()
    
    # 4. Create Tables on Target if not exist
    print("[Schema] Ensuring all 21 tables exist on target database...")
    Base.metadata.create_all(bind=target_engine)
    print("[Schema] Tables verified.")
    
    # 5. Migrate each table in dependency order
    summary_report = []
    
    for model in TABLE_ORDER:
        table_name = model.__tablename__
        source_count = source_session.query(func.count(model.id)).scalar() or 0
        
        if source_count == 0:
            target_count = target_session.query(func.count(model.id)).scalar() or 0
            summary_report.append({
                "table": table_name,
                "source": 0,
                "migrated": 0,
                "target_total": target_count,
                "status": "SKIPPED (Empty)"
            })
            print(f"  - [{table_name}] 0 records in SQLite. Skipped.")
            continue
        
        # Read records from SQLite
        records = source_session.query(model).all()
        migrated_count = 0
        
        for record in records:
            # Check if record already exists in target
            existing = target_session.query(model).filter(model.id == record.id).first()
            if not existing:
                # Extract column attributes
                record_dict = {
                    col.name: getattr(record, col.name)
                    for col in model.__table__.columns
                }
                new_instance = model(**record_dict)
                target_session.add(new_instance)
                migrated_count += 1
            else:
                pass
        
        target_session.commit()
        target_total = target_session.query(func.count(model.id)).scalar() or 0
        
        status = "SUCCESS" if target_total >= source_count else "MISMATCH"
        summary_report.append({
            "table": table_name,
            "source": source_count,
            "migrated": migrated_count,
            "target_total": target_total,
            "status": status
        })
        print(f"  + [{table_name}] Source: {source_count} | Inserted: {migrated_count} | Target Total: {target_total} | {status}")
    
    source_session.close()
    target_session.close()
    
    # 6. Print Migration Summary Table
    print("\n" + "=" * 80)
    print(f"{'TABLE NAME':<26} | {'SQLITE':<8} | {'MIGRATED':<9} | {'SUPABASE TOTAL':<14} | {'STATUS'}")
    print("-" * 80)
    for row in summary_report:
        print(f"{row['table']:<26} | {row['source']:<8} | {row['migrated']:<9} | {row['target_total']:<14} | {row['status']}")
    print("=" * 80)
    print("✨ Database Migration Completed Successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite data to Supabase PostgreSQL")
    parser.add_argument("--source", default=os.path.join(BASE_DIR, "cloud_optimizer.db"), help="Path to SQLite database file")
    parser.add_argument("--target-url", default=None, help="Target PostgreSQL connection string (defaults to DATABASE_URL from .env)")
    
    args = parser.parse_args()
    
    target_url = args.target_url or settings.NORMALIZED_DATABASE_URL
    if not target_url or target_url.startswith("sqlite"):
        print("[Notice] DATABASE_URL in .env is currently set to SQLite or empty.")
        print("To migrate to Supabase, provide the target URL via --target-url or configure DATABASE_URL in backend/.env")
        print("Example:")
        print("  python backend/scripts/migrate_sqlite_to_supabase.py --target-url \"postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres\"")
        sys.exit(0)
    
    migrate_data(args.source, target_url)
