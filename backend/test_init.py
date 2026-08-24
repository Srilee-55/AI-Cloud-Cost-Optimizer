import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath("backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, engine, SessionLocal
from app.utils.seed_data import seed_database
from app.main import app

print("Creating database tables...")
Base.metadata.create_all(bind=engine)

print("Running database seeder...")
db = SessionLocal()
seed_database(db)
db.close()

print("ALL BACKEND TABLES CREATED AND SEEDED SUCCESSFULLY!")
