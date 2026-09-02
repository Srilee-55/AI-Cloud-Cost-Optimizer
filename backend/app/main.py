import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.security.rate_limit import RateLimitMiddleware
from app.utils.seed_data import seed_database

# Import all routers
from app.routers import (
    auth,
    users,
    workspaces,
    cloud,
    costs,
    data,
    analysis,
    anomalies,
    agent,
    recommendations,
    ai,
    forecast,
    savings,
    alerts,
    reports,
    analytics,
    audit,
    security,
    admin
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist and auto-seed demo data
    Base.metadata.create_all(bind=engine)
    try:
        db = SessionLocal()
        seed_database(db)
        db.close()
    except Exception as e:
        print(f"[Main] Seeder notice: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI-powered Cloud Cost Intelligence and Optimization Engine",
    version="1.0.0",
    lifespan=lifespan
)


# Root Health Check Route
@app.get("/", tags=["Health"])
def root_health_check():
    return {"status": "ok"}


# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app"
)

# Rate Limiter
app.add_middleware(RateLimitMiddleware)


# Standardized validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": "Validation Error",
            "errors": jsonable_encoder(exc.errors())
        }
    )


# Standardized generic exception handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": f"Server Error: {str(exc)}"
        }
    )


# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "AI Cloud Cost Optimizer Backend",
            "environment": settings.ENVIRONMENT
        },
        "message": "Service is operational"
    }


# Register Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workspaces.router)
app.include_router(cloud.router)
app.include_router(costs.router)
app.include_router(data.router)
app.include_router(analysis.router)
app.include_router(anomalies.router)
app.include_router(agent.router)
app.include_router(recommendations.router)
app.include_router(ai.router)
app.include_router(forecast.router)
app.include_router(savings.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(security.router)
app.include_router(admin.router)
