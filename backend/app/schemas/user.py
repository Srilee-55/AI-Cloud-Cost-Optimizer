from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_superuser: bool
    created_at: datetime


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None


class UserRoleUpdateRequest(BaseModel):
    role: str
