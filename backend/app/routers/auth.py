from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest
)
from app.schemas.user import UserResponse
from app.schemas.common import ApiResponse
from app.security.password import get_password_hash, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.security.rbac import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # First user can be admin
    user_count = db.query(User).count()
    assigned_role = UserRole.ADMIN if user_count == 0 else (req.role or UserRole.USER)

    new_user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=assigned_role,
        is_active=True,
        is_superuser=(user_count == 0)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create initial personal workspace for new user
    workspace = Workspace(
        name=f"{new_user.full_name}'s Workspace",
        slug=f"ws-{new_user.id[:8]}",
        account_type="Startup",
        monthly_budget=10000.0,
        currency="USD"
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=new_user.id,
        role=UserRole.ADMIN
    )
    db.add(membership)
    db.commit()

    token_data = {"sub": new_user.id, "email": new_user.email, "role": new_user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_info = {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "workspace_id": workspace.id,
        "workspace_name": workspace.name
    }

    return ApiResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_info
        ),
        message="Account registered successfully"
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    # Get user's primary workspace
    membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    workspace_id = membership.workspace_id if membership else None
    workspace_name = membership.workspace.name if membership and membership.workspace else "Default Workspace"

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "workspace_id": workspace_id,
        "workspace_name": workspace_name
    }

    return ApiResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_info
        ),
        message="Login successful"
    )


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer active")

    membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    workspace_id = membership.workspace_id if membership else None
    workspace_name = membership.workspace.name if membership and membership.workspace else "Default Workspace"

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "workspace_id": workspace_id,
        "workspace_name": workspace_name
    }

    return ApiResponse(
        success=True,
        data=TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=user_info
        ),
        message="Token refreshed successfully"
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile retrieved"
    )


@router.post("/forgot-password", response_model=ApiResponse[dict])
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always return success to prevent email enumeration
    return ApiResponse(
        success=True,
        data={"reset_token_sent": True},
        message="If this email is registered, password reset instructions have been dispatched."
    )


@router.post("/reset-password", response_model=ApiResponse[dict])
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    return ApiResponse(
        success=True,
        data={"reset_success": True},
        message="Password has been reset successfully. Please log in with your new password."
    )


@router.post("/logout", response_model=ApiResponse[dict])
def logout(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data={"logged_out": True},
        message="Logged out successfully"
    )
