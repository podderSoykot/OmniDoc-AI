import os
import re
import datetime
import hmac
import hashlib
from typing import Optional, Dict, Any, Tuple
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.document import User

SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def validate_password_policy(password: str) -> Tuple[bool, str]:
    """
    Enforces enterprise password policy:
    - Minimum 8 characters
    - At least one uppercase letter [A-Z]
    - At least one lowercase letter [a-z]
    - At least one digit [0-9]
    - At least one special symbol
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+/~`]", password):
        return False, "Password must contain at least one special character."
    return True, ""

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        # bcrypt limit is 72 bytes
        pwd_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
        to_encode = data.copy()
        now = datetime.datetime.now(datetime.timezone.utc)
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
        to_encode = data.copy()
        now = datetime.datetime.now(datetime.timezone.utc)
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            return None

    @staticmethod
    def get_user_from_token(token: str, db: Session) -> Optional[User]:
        payload = AuthService.decode_token(token)
        if not payload:
            return None
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()

    # Signed URL helpers for secure file preview & download
    @staticmethod
    def generate_signed_file_token(document_id: str, user_id: str, expires_seconds: int = 3600) -> str:
        now = datetime.datetime.now(datetime.timezone.utc)
        expire = now + datetime.timedelta(seconds=expires_seconds)
        payload = {
            "sub": user_id,
            "doc_id": document_id,
            "type": "file_access",
            "exp": expire
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)

    @staticmethod
    def verify_signed_file_token(token: str, document_id: str) -> Optional[str]:
        payload = AuthService.decode_token(token)
        if not payload:
            return None
        if payload.get("type") != "file_access" or payload.get("doc_id") != document_id:
            return None
        return payload.get("sub")

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns current authenticated user, or None if no token provided."""
    if not token:
        return None
    return AuthService.get_user_from_token(token, db)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Strictly requires an authenticated user with valid JWT token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = AuthService.get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
