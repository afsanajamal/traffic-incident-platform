import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.auth.domain import UserRole
from app.auth.model import Invitation, User
from app.auth.schemas import (
    AuthResponse,
    InvitationCreate,
    InvitationRead,
    LoginRequest,
    RegisterRequest,
    UserRead,
)
from app.auth.security import create_access_token, hash_password, verify_password
from app.core.config import get_settings
from app.core.database import get_session


router = APIRouter()


@router.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_session)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    settings = get_settings()
    token = create_access_token(
        user_id=str(user.id),
        secret_key=settings.auth_secret_key,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return AuthResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/api/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/api/auth/register", response_model=UserRead, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_session)) -> User:
    invitation = db.scalar(
        select(Invitation).where(Invitation.token == payload.invitation_token)
    )
    now = datetime.now(UTC)
    if invitation is None or invitation.accepted_at is not None or invitation.expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")

    existing_user = db.scalar(select(User).where(User.email == invitation.email.lower()))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        email=invitation.email.lower(),
        full_name=payload.full_name,
        role=invitation.role,
        password_hash=hash_password(payload.password),
    )
    invitation.accepted_at = now
    db.add(user)
    db.add(invitation)
    db.commit()
    db.refresh(user)
    return user


@router.post("/api/invitations", response_model=InvitationRead, status_code=201)
def create_invitation(
    payload: InvitationCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> Invitation:
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    invitation = Invitation(
        email=payload.email.lower(),
        role=payload.role,
        token=secrets.token_urlsafe(32),
        created_by_id=current_user.id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.get("/api/invitations", response_model=list[InvitationRead])
def list_invitations(
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> list[Invitation]:
    return list(db.scalars(select(Invitation).order_by(Invitation.created_at.desc())).all())


@router.get("/api/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.patch("/api/users/{user_id}/active", response_model=UserRead)
def set_user_active(
    user_id: uuid.UUID,
    is_active: bool,
    db: Session = Depends(get_session),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and not is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_super_admin(db: Session) -> None:
    settings = get_settings()
    email = settings.super_admin_email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is not None:
        return

    user = User(
        email=email,
        full_name=settings.super_admin_name,
        role=UserRole.SUPER_ADMIN,
        password_hash=hash_password(settings.super_admin_password),
    )
    db.add(user)
    db.commit()
