"""User model for Auth Service."""
import enum

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class UserRole(str, enum.Enum):
    USER = "USER"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'auth_service'}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) 
    is_active = Column(Boolean, default=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    semester = Column(Integer, nullable=True)
    sso_provider = Column(String(50), nullable=True)
    sso_id = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())