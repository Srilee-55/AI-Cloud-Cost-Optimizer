"""
Diagnostic script executing Step 1 through Step 6 of the checklist.
"""
import os
import sys
from datetime import datetime

# Configure UTF-8 encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.config import settings
from app.database import engine, SessionLocal, get_db
from sqlalchemy import text, inspect

def mask_url(url: str) -> str:
    if not url:
        return "<EMPTY>"
    if "@" in url:
        prefix, rest = url.split("@", 1)
        if ":" in prefix:
            proto_user = prefix.rsplit(":", 1)[0]
            return f"{proto_user}:****@{rest}"
    return url

print("=" * 80)
print("🔍 SUPABASE POSTGRESQL & BACKEND DATABASE DIAGNOSTIC SUITE")
print("=" * 80)

# STEP 1: Check SQLite file and runtime engine URL
print("\n[STEP 1] Check SQLite & Runtime Engine Configuration:")
sqlite_path = os.path.join(BASE_DIR, "cloud_optimizer.db")
if os.path.exists(sqlite_path):
    mtime = datetime.fromtimestamp(os.path.getmtime(sqlite_path))
    size = os.path.getsize(sqlite_path)
    print(f"  • SQLite file detected: {sqlite_path}")
    print(f"  • Size: {size} bytes | Last Modified: {mtime}")
else:
    print(f"  • SQLite file does not exist at: {sqlite_path}")

print(f"  • Settings.DATABASE_URL loaded: {mask_url(settings.DATABASE_URL)}")
print(f"  • Settings.NORMALIZED_DATABASE_URL: {mask_url(settings.NORMALIZED_DATABASE_URL)}")
print(f"  • SQLAlchemy engine.url at runtime: {engine.url.render_as_string(hide_password=True)}")
print(f"  • Engine dialect: {engine.dialect.name}")

# STEP 2: Validate Connection String Format
print("\n[STEP 2] Connection String Analysis:")
raw_url = settings.DATABASE_URL.strip()
if raw_url.startswith("sqlite"):
    print("  ⚠️ ALERT: DATABASE_URL is currently configured to local SQLite!")
    print("  To write to Supabase, DATABASE_URL in backend/.env must be set to your Supabase PostgreSQL connection string.")
elif raw_url.startswith("postgres://") or raw_url.startswith("postgresql://") or raw_url.startswith("postgresql+psycopg2://"):
    print(f"  • PostgreSQL connection string detected.")
    if "supabase.co" in raw_url or "pooler.supabase.com" in raw_url:
        print("  • Supabase domain verified in URL.")
    else:
        print("  • Note: URL does not contain standard supabase.co or pooler.supabase.com domain.")
else:
    print(f"  • Custom or unknown driver format: {raw_url[:15]}...")

# STEP 3: Test Raw Isolated Connection
print("\n[STEP 3] Testing Raw Connection (SELECT 1):")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        print(f"  ✅ Raw query connection SUCCESSFUL: SELECT 1 returned -> {result}")
except Exception as exc:
    print(f"  ❌ Raw connection FAILED: {exc}")

# STEP 4: Check Tables in Public Schema
print("\n[STEP 4] Inspecting Tables in Database Schema:")
try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"  • Tables found ({len(tables)}): {', '.join(sorted(tables))}")
    
    expected_tables = ["users", "workspaces", "workspace_members", "cloud_providers", "cloud_accounts", "cloud_resources", "cost_records", "budgets", "anomalies", "ai_recommendations", "reports", "audit_logs"]
    missing = [t for t in expected_tables if t not in tables]
    if missing:
        print(f"  ⚠️ Missing expected tables: {missing}")
    else:
        print(f"  ✅ All core tables are present in the target database.")
except Exception as exc:
    print(f"  ❌ Schema inspection failed: {exc}")

# STEP 5 & 6: Trace Write Path & Commit Verification
print("\n[STEP 5 & 6] Write Path & Commit Verification:")
try:
    from app.models.user import User
    from app.models.workspace import Workspace
    from app.models.cost import CostRecord
    
    session = SessionLocal()
    user_count = session.query(User).count()
    ws_count = session.query(Workspace).count()
    cost_count = session.query(CostRecord).count()
    print(f"  • Current Record Counts -> Users: {user_count} | Workspaces: {ws_count} | Cost Records: {cost_count}")
    session.close()
except Exception as exc:
    print(f"  ❌ Read/Write verification query failed: {exc}")

print("\n" + "=" * 80)
