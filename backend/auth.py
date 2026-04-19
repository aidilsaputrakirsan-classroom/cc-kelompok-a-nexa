import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole

load_dotenv()

# Konfigurasi dari environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security scheme — Swagger akan menampilkan simple token input
security = HTTPBearer()


# ==================== PASSWORD ====================

def hash_password(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password terhadap hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ==================== JWT TOKEN ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Buat JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode dan verifikasi JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== DEPENDENCY ====================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency injection: ambil current user dari JWT token di Authorization header.
    Gunakan di endpoint yang butuh autentikasi.
    """
    token = credentials.credentials
    payload = decode_token(token)
    user_id: int = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif",
        )

    return user


# ==================== ROLE-BASED ACCESS CONTROL ====================

def require_role(*allowed_roles: UserRole):
    """
    Decorator untuk RBAC. Gunakan di endpoint yang memerlukan role tertentu.
    
    Contoh:
        @app.get("/admin-only")
        def admin_endpoint(current_user: User = Depends(require_role(UserRole.ADMIN))):
            return {"message": f"Hello {current_user.name}"}
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Diperlukan role: {', '.join([r.value for r in allowed_roles])}",
            )
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency untuk endpoint yang hanya bisa diakses admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengakses resource ini",
        )
    return current_user


def require_instructor(current_user: User = Depends(get_current_user)) -> User:
    """Dependency untuk endpoint yang hanya bisa diakses dosen/instructor."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOSEN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya dosen yang dapat mengakses resource ini",
        )
    return current_user


# ==================== PASSWORD RESET TOKENS ====================

def generate_password_reset_token(email: str) -> str:
    """Generate token unik untuk password reset."""
    # Generate 32-character random string
    token = secrets.token_urlsafe(32)
    return token


def create_password_reset_token_record(
    db: Session,
    user: User,
) -> str:
    """Buat record reset token di database dan return token."""
    reset_token = generate_password_reset_token(user.email)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    
    user.reset_token = reset_token
    user.reset_token_expiry = expiry
    db.commit()
    
    return reset_token


def verify_password_reset_token(
    db: Session,
    email: str,
    reset_token: str,
) -> Optional[User]:
    """Verify password reset token. Return User jika valid."""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return None
    
    if user.reset_token != reset_token:
        return None
    
    if not user.reset_token_expiry:
        return None
    
    if datetime.now(timezone.utc) > user.reset_token_expiry:
        return None  # Token sudah expired
    
    return user


def clear_password_reset_token(db: Session, user: User):
    """Clear reset token setelah password berhasil di-reset."""
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()