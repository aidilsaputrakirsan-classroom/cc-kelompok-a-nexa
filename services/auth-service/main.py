"""
Auth Service — Handles authentication and user management.
"""
import os
import logging
import time
import secrets
from logging_config import setup_logging
from logging_middleware import RequestLoggingMiddleware
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Header, Request, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from collections import deque

from database import engine, get_db, Base
from models import User
from schemas import (
    UserCreate, UserResponse, LoginRequest,
    TokenResponse, TokenVerifyResponse, UserProfileUpdate,
    PasswordResetRequest, PasswordResetVerify, PasswordResetResponse,
    UserResolveRequest
)

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auth Service",
    description="Authentication microservice — register, login, verify tokens, reset password, profile",
    version="2.0.0",
)

class ServiceMetrics:
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.request_count = 0
        self.error_count = 0
        self.latencies_ms = deque(maxlen=1000)
        self.start_time = time.time()

    def record(self, status_code: int, duration_ms: float) -> None:
        self.request_count += 1
        if status_code >= 500:
            self.error_count += 1
        self.latencies_ms.append(duration_ms)

    def snapshot(self) -> dict:
        if not self.latencies_ms:
            p50 = p95 = p99 = 0.0
        else:
            sorted_latencies = sorted(self.latencies_ms)

            def percentile(values: list[float], pct: float) -> float:
                if not values:
                    return 0.0
                index = int(round((len(values) - 1) * pct))
                return values[max(0, min(index, len(values) - 1))]

            p50 = percentile(sorted_latencies, 0.50)
            p95 = percentile(sorted_latencies, 0.95)
            p99 = percentile(sorted_latencies, 0.99)

        error_rate = self.error_count / self.request_count if self.request_count else 0.0
        uptime_seconds = time.time() - self.start_time
        uptime_minutes = int(uptime_seconds // 60)

        return {
            "service": self.service_name,
            "status": "healthy",
            "request_count": self.request_count,
            "error_count": self.error_count,
            "error_rate": error_rate,
            "uptime": f"{uptime_minutes}m",
            "latency_ms": {
                "p50": p50,
                "p95": p95,
                "p99": p99,
            },
        }

metrics = ServiceMetrics("auth-service")

app.add_middleware(RequestLoggingMiddleware)

cors_origins = os.getenv("CORS_ORIGINS", "https://studyfy-auth-service.onrender.com")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun tidak aktif")
    return user


def require_instructor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "dosen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya dosen yang dapat mengakses resource ini",
        )
    return current_user

# =====================
# ENDPOINTS
# =====================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "auth-service",
        "version": "2.0.0",
    }

@app.get("/metrics")
def get_metrics():
    return {
        "service": "auth-service",
        **metrics.snapshot(),
    }


@app.post("/auth/register", response_model=UserResponse, status_code=201)
@app.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register user baru."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=pwd_context.hash(user_data.password),
        role=user_data.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=TokenResponse)
@app.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login dan dapatkan JWT token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not pwd_context.verify(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
    })
    return TokenResponse(access_token=token, token_type="bearer", user=user)


@app.get("/verify", response_model=TokenVerifyResponse)
def verify_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Verifikasi JWT token — dipanggil oleh service lain."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split("Bearer ")[1]
    payload = decode_token(token)
    user_id = int(payload["sub"])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
        
    return TokenVerifyResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
    )


@app.get("/auth/me", response_model=UserResponse)
@app.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Dapatkan profil user yang sedang login."""
    return current_user


@app.post("/auth/password-reset-request", response_model=PasswordResetResponse, status_code=200)
@app.post("/password-reset-request", response_model=PasswordResetResponse, status_code=200)
def password_reset_request(request_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset."""
    user = db.query(User).filter(User.email == request_data.email).first()
    if not user:
        return {
            "message": "Jika email terdaftar, link reset password akan dikirim",
            "email": request_data.email,
        }
        
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    
    user.reset_token = reset_token
    user.reset_token_expiry = expiry
    db.commit()
    
    return {
        "message": "Link reset password telah dikirim ke email Anda",
        "email": request_data.email,
    }


@app.post("/auth/password-reset-verify", response_model=UserResponse, status_code=200)
@app.post("/password-reset-verify", response_model=UserResponse, status_code=200)
def password_reset_verify(reset_data: PasswordResetVerify, db: Session = Depends(get_db)):
    """Verify reset token and update password."""
    user = db.query(User).filter(
        User.email == reset_data.email,
        User.reset_token == reset_data.reset_token
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Token tidak valid atau sudah expired")
        
    if not user.reset_token_expiry or datetime.now(timezone.utc) > user.reset_token_expiry.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Token tidak valid atau sudah expired")
        
    user.hashed_password = pwd_context.hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    db.refresh(user)
    return user


@app.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    """Ambil semua daftar user (hanya dosen)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()


@app.get("/users/profile/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil profil user."""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Tidak bisa mengakses profil user lain")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user


@app.put("/users/profile", response_model=UserResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profil user sendiri."""
    update_dict = profile_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/users/resolve", response_model=List[UserResponse])
def resolve_users(req: UserResolveRequest, db: Session = Depends(get_db)):
    """Batch resolve list user_ids ke user info (panggilan internal microservice)."""
    users = db.query(User).filter(User.id.in_(req.user_ids)).all()
    return users