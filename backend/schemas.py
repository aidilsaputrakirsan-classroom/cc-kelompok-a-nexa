import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"


# === BASE SCHEMA ===
class ItemBase(BaseModel):
    """Base schema — field yang dipakai untuk create & update."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Laptop"])
    description: Optional[str] = Field(None, examples=["Laptop untuk cloud computing"])
    price: float = Field(..., gt=0, examples=[15000000])
    quantity: int = Field(0, ge=0, examples=[10])


# === CREATE SCHEMA (untuk POST request) ===
class ItemCreate(ItemBase):
    """Schema untuk membuat item baru. Mewarisi semua field dari ItemBase."""
    pass


# === UPDATE SCHEMA (untuk PUT request) ===
class ItemUpdate(BaseModel):
    """
    Schema untuk update item. Semua field optional 
    karena user mungkin hanya ingin update sebagian field.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


# === RESPONSE SCHEMA (untuk output) ===
class ItemResponse(ItemBase):
    """Schema untuk response. Termasuk id dan timestamp dari database."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Agar bisa convert dari SQLAlchemy model


# === LIST RESPONSE (dengan metadata) ===
class ItemListResponse(BaseModel):
    """Schema untuk response list items dengan total count."""
    total: int
    items: list[ItemResponse]


# === STATS RESPONSE ===
class ItemStatsResponse(BaseModel):
    """Ringkasan statistik semua item."""
    total_items: int
    total_quantity: int
    total_value: float
    average_price: float


class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Format email harus valid, contoh: user@domain.com",
    )
    name: str = Field(..., min_length=2, max_length=100, examples=["Aidil Saputra"])
    password: str = Field(
        ...,
        min_length=8,
        examples=["P@ssword123"],
        description="Password minimal 8 karakter, wajib huruf besar, huruf kecil, angka, dan simbol.",
    )

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
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema untuk login request."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Format email harus valid, contoh: user@domain.com",
    )
    password: str = Field(..., examples=["password123"])

    @field_validator("email")
    @classmethod
    def validate_login_email_format(cls, value: str) -> str:
        if not re.fullmatch(EMAIL_REGEX, value):
            raise ValueError("Format email tidak valid. Gunakan format seperti nama@domain.com")
        return value


class TokenResponse(BaseModel):
    """Schema untuk response setelah login berhasil."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse