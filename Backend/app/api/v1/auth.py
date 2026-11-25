import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import User
from app.core.auth import AuthService, get_current_user, validate_password_policy
from app.core.rate_limiter import auth_rate_limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, request: Request, db: Session = Depends(get_db)):
    auth_rate_limiter.check_rate_limit(request)

    # Enforce password policy
    valid_pwd, reason = validate_password_policy(req.password)
    if not valid_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason
        )

    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = AuthService.get_password_hash(req.password)
    user = User(
        id=user_id,
        email=req.email.lower().strip(),
        hashed_password=hashed_pwd,
        full_name=req.full_name or req.email.split("@")[0].capitalize()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_payload = {"sub": user.id, "email": user.email}
    access_token = AuthService.create_access_token(token_payload)
    refresh_token = AuthService.create_refresh_token(token_payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_rate_limiter.check_rate_limit(request)

    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not AuthService.verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token_payload = {"sub": user.id, "email": user.email}
    access_token = AuthService.create_access_token(token_payload)
    refresh_token = AuthService.create_refresh_token(token_payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = AuthService.decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access_token = AuthService.create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat()
    }
