"""Pydantic schemas for Auth Service."""
import re
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
    )
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(
        ...,
        min_length=8,
        examples=["P@ssword123"],
    )
    role: str = Field(default="mahasiswa")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        if not re.fullmatch(EMAIL_REGEX, value):
            raise ValueError("Format email tidak valid. Gunakan format seperti nama@domain.com")
        return value

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password minimal 8 karakter.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password harus mengandung minimal 1 huruf besar (A-Z).")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password harus mengandung minimal 1 huruf kecil (a-z).")
        if not re.search(r"\d", value):
            raise ValueError("Password harus mengandung minimal 1 angka (0-9).")
        if not re.search(r"[^\w\s]", value):
            raise ValueError("Password harus mengandung minimal 1 simbol, misalnya !@#$%.")
        return value


class UserResponse(BaseModel):
    """Schema untuk response user (tanpa password)."""
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    semester: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenVerifyResponse(BaseModel):
    user_id: int
    email: str
    name: str
    role: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    profile_picture: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)


class PasswordResetVerify(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    reset_token: str = Field(..., min_length=32, max_length=255)
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password minimal 8 karakter.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password harus mengandung minimal 1 huruf besar (A-Z).")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password harus mengandung minimal 1 huruf kecil (a-z).")
        if not re.search(r"\d", value):
            raise ValueError("Password harus mengandung minimal 1 angka (0-9).")
        if not re.search(r"[^\w\s]", value):
            raise ValueError("Password harus mengandung minimal 1 simbol, misalnya !@#$%.")
        return value


class PasswordResetResponse(BaseModel):
    message: str
    email: str


class UserResolveRequest(BaseModel):
    user_ids: List[int]