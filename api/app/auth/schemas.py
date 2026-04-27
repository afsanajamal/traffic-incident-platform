import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.auth.domain import UserRole


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class InvitationCreate(BaseModel):
    email: EmailStr
    role: UserRole


class InvitationRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    token: str
    expires_at: datetime
    accepted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    invitation_token: str
    full_name: str = Field(min_length=1, max_length=160)
    password: str = Field(min_length=8, max_length=128)
