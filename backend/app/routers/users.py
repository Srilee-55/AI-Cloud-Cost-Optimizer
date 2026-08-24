from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdateRequest, UserRoleUpdateRequest
from app.schemas.auth import ChangePasswordRequest
from app.schemas.common import ApiResponse
from app.security.rbac import get_current_user, require_roles
from app.security.password import verify_password, get_password_hash

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=ApiResponse[UserResponse])
def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile retrieved"
    )


@router.put("/profile", response_model=ApiResponse[UserResponse])
def update_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name:
        current_user.full_name = req.full_name
    db.commit()
    db.refresh(current_user)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile updated"
    )


@router.post("/change-password", response_model=ApiResponse[dict])
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return ApiResponse(
        success=True,
        data={"updated": True},
        message="Password updated successfully"
    )


@router.get("", response_model=ApiResponse[List[UserResponse]])
def list_users(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return ApiResponse(
        success=True,
        data=[UserResponse.model_validate(u) for u in users],
        message=f"Retrieved {len(users)} users"
    )


@router.put("/{user_id}/role", response_model=ApiResponse[UserResponse])
def update_user_role(
    user_id: str,
    req: UserRoleUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    if req.role not in UserRole.ALL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role. Allowed: {UserRole.ALL}")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.role = req.role
    db.commit()
    db.refresh(target_user)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(target_user),
        message=f"User role updated to {req.role}"
    )
