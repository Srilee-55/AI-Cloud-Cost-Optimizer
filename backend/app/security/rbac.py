from typing import List, Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.workspace import Workspace, WorkspaceMember
from app.security.jwt import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def get_current_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Workspace:
    # If specific workspace ID is passed, check access
    if x_workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == x_workspace_id).first()
        if not workspace:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
        # Verify membership if not superuser
        if not current_user.is_superuser:
            membership = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace.id,
                WorkspaceMember.user_id == current_user.id
            ).first()
            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this workspace"
                )
        return workspace

    # Fallback to user's first available workspace
    membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).first()
    if membership and membership.workspace:
        return membership.workspace

    # If user has no workspace, create a dedicated isolated workspace for this user
    default_ws = Workspace(
        name=f"{current_user.full_name}'s Workspace",
        slug=f"ws-{current_user.id[:8]}",
        account_type="Startup",
        monthly_budget=10000.0,
        currency="USD"
    )
    db.add(default_ws)
    db.commit()
    db.refresh(default_ws)

    new_membership = WorkspaceMember(
        workspace_id=default_ws.id,
        user_id=current_user.id,
        role="Admin"
    )
    db.add(new_membership)
    db.commit()

    return default_ws
