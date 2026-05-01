import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum


EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"


from models import UserRole, MaterialType

# === BASE SCHEMA ===
class ItemBase(BaseModel):
    """Base schema — field yang dipakai untuk create & update."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Laptop"], description="Nama item")
    description: Optional[str] = Field(None, examples=["Laptop untuk cloud computing"], description="Deskripsi detail item")
    price: float = Field(..., gt=0, examples=[15000000], description="Harga per unit dalam Rupiah")
    quantity: int = Field(0, ge=0, examples=[10], description="Jumlah stok item")


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
    name: Optional[str] = Field(None, min_length=1, max_length=100, examples=["Laptop Gaming"])
    description: Optional[str] = Field(None, examples=["Laptop high-end untuk gaming dan development"])
    price: Optional[float] = Field(None, gt=0, examples=[18500000.0])
    quantity: Optional[int] = Field(None, ge=0, examples=[5])


# === RESPONSE SCHEMA (untuk output) ===
class ItemResponse(ItemBase):
    """Schema untuk response. Termasuk id dan timestamp dari database."""
    id: int = Field(..., examples=[1], description="ID item unik")
    created_at: datetime = Field(..., examples=["2024-04-19T10:30:00+00:00"], description="Waktu pembuatan")
    updated_at: Optional[datetime] = Field(None, examples=["2024-04-19T15:45:00+00:00"], description="Waktu update terakhir")

    class Config:
        from_attributes = True  # Agar bisa convert dari SQLAlchemy model


# === LIST RESPONSE (dengan metadata) ===
class ItemListResponse(BaseModel):
    """Schema untuk response list items dengan total count."""
    total: int = Field(..., examples=[42], description="Total item di database")
    items: list[ItemResponse] = Field(..., description="Daftar item")


# === STATS RESPONSE ===
class ItemStatsResponse(BaseModel):
    """Ringkasan statistik semua item."""
    total_items: int = Field(..., examples=[156], description="Total jumlah item unik")
    total_quantity: int = Field(..., examples=[3250], description="Total stok semua item")
    total_value: float = Field(..., examples=[48750000000.0], description="Nilai total stok (price × quantity)")
    average_price: float = Field(..., examples=[312500000.0], description="Rata-rata harga item")


class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Email yang unik dan valid, format: nama@domain.com",
    )
    name: str = Field(..., min_length=2, max_length=100, examples=["Aidil Saputra"], description="Nama lengkap pengguna")
    password: str = Field(
        ...,
        min_length=8,
        examples=["P@ssword123"],
        description="Password minimal 8 karakter, harus memiliki uppercase, lowercase, angka, dan simbol",
    )
    role: UserRole = Field(default=UserRole.MAHASISWA, description="Role user (admin, dosen, mahasiswa)")

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
    id: int = Field(..., examples=[1], description="ID user unik")
    email: str = Field(..., examples=["user@student.itk.ac.id"], description="Email pengguna")
    name: str = Field(..., examples=["Aidil Saputra"], description="Nama lengkap pengguna")
    role: UserRole = Field(..., examples=["mahasiswa"], description="Role pengguna (admin/dosen/mahasiswa)")
    is_active: bool = Field(..., examples=[True], description="Status aktivasi akun")
    phone: Optional[str] = Field(None, examples=["+62812345678"], description="Nomor telepon")
    address: Optional[str] = Field(None, examples=["Jl. Merdeka No. 123, Jakarta"], description="Alamat pengguna")
    profile_picture: Optional[str] = Field(None, examples=["https://example.com/profile/user123.jpg"], description="URL foto profil")
    semester: Optional[int] = Field(None, examples=[5], description="Semester (untuk mahasiswa)")
    created_at: datetime = Field(..., examples=["2024-04-19T10:30:00+00:00"], description="Waktu pembuatan akun")

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema untuk login request."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Email yang terdaftar di sistem",
    )
    password: str = Field(..., examples=["P@ssword123"], description="Password akun pengguna")

    @field_validator("email")
    @classmethod
    def validate_login_email_format(cls, value: str) -> str:
        if not re.fullmatch(EMAIL_REGEX, value):
            raise ValueError("Format email tidak valid. Gunakan format seperti nama@domain.com")
        return value


class TokenResponse(BaseModel):
    """Schema untuk response setelah login berhasil."""
    access_token: str = Field(..., examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."], description="JWT bearer token")
    token_type: str = Field(default="bearer", examples=["bearer"], description="Tipe token (selalu 'bearer')")
    user: UserResponse = Field(..., description="Data pengguna yang login")


# ==================== USER PROFILE & PASSWORD RESET ====================

class UserProfileUpdate(BaseModel):
    """Schema untuk update profil user."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, examples=["Aidil Saputra Updated"])
    phone: Optional[str] = Field(None, max_length=20, examples=["+62812345678"])
    address: Optional[str] = Field(None, examples=["Jl. Merdeka No. 123, Jakarta"])
    profile_picture: Optional[str] = Field(None, examples=["https://example.com/profile/user123.jpg"])


class PasswordResetRequest(BaseModel):
    """Schema untuk request password reset."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Email akun yang ingin di-reset password-nya",
    )

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        if not re.fullmatch(EMAIL_REGEX, value):
            raise ValueError("Format email tidak valid")
        return value


class PasswordResetVerify(BaseModel):
    """Schema untuk verify dan update password dengan reset token."""
    email: str = Field(
        ...,
        pattern=EMAIL_REGEX,
        examples=["user@student.itk.ac.id"],
        description="Email yang sesuai dengan token",
    )
    reset_token: str = Field(
        ...,
        min_length=32,
        max_length=255,
        examples=["y0K0Z1mXcUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz"],
        description="Token reset password yang diterima via email",
    )
    new_password: str = Field(
        ...,
        min_length=8,
        examples=["NewPass@2024"],
        description="Password minimal 8 karakter dengan uppercase, lowercase, angka, dan simbol.",
    )

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
    """Response untuk password reset request."""
    message: str = Field(..., examples=["Jika email terdaftar, link reset password akan dikirim"])
    email: str = Field(..., examples=["user@student.itk.ac.id"])


# ==================== CLASS SCHEMAS ====================

class ClassBase(BaseModel):
    """Base schema untuk Class."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Cloud Computing"])
    code: str = Field(..., min_length=1, max_length=20, examples=["TK301"])
    description: Optional[str] = Field(None, examples=["Pengenalan infrastruktur cloud computing dan deployment aplikasi"])
    semester: int = Field(..., ge=1, le=8, examples=[5], description="Semester 1-8")
    academic_year: str = Field(..., examples=["2024/2025"], description="Format: YYYY/YYYY")
    max_students: Optional[int] = Field(None, ge=1, examples=[40], description="Maksimal jumlah mahasiswa")


class ClassCreate(ClassBase):
    """Schema untuk membuat class baru."""
    instructor_id: int = Field(..., gt=0, examples=[1], description="ID pengguna yang menjadi instructor/dosen")


class ClassResponse(ClassBase):
    """Schema untuk response class."""
    id: int = Field(..., examples=[1], description="ID class unik")
    instructor_id: int = Field(..., examples=[1], description="ID dosen pengampu")
    is_archived: bool = Field(default=False, examples=[False], description="Status archive class")
    archived_at: Optional[datetime] = Field(None, examples=["2024-04-19T15:45:00+00:00"], description="Waktu class diarsip")
    created_at: datetime = Field(..., examples=["2024-04-19T10:30:00+00:00"])
    updated_at: Optional[datetime] = Field(None, examples=["2024-04-19T15:45:00+00:00"])

    class Config:
        from_attributes = True


class ClassListResponse(BaseModel):
    """Schema untuk response list classes."""
    total: int = Field(..., examples=[15], description="Total jumlah class yang tersedia")
    classes: list[ClassResponse] = Field(..., description="Daftar class")


class ClassDetailResponse(ClassResponse):
    """Schema untuk response class dengan detail users."""
    students_count: int = Field(..., examples=[24], description="Jumlah mahasiswa terdaftar")
    users: list["UserResponse"] = Field(default=[], description="Daftar detail mahasiswa")


class UserWithClassesResponse(UserResponse):
    """Schema untuk response user dengan list classes."""
    classes: list[ClassResponse] = Field(default=[], description="Daftar class yang diikuti pengguna")


# ==================== MATERIAL SCHEMAS ====================

class MaterialBase(BaseModel):
    """Base schema untuk Material."""
    title: str = Field(..., min_length=1, max_length=255, examples=["Cloud Architecture Basics"], description="Judul materi")
    description: Optional[str] = Field(None, examples=["Pengenalan arsitektur cloud dan komponen-komponennya"], description="Deskripsi detail materi")
    material_type: MaterialType = Field(..., examples=["pdf"], description="Tipe materi: pdf, ppt, video, link")
    is_published: bool = Field(default=True, examples=[True], description="Apakah materi visible untuk mahasiswa")


class MaterialCreate(MaterialBase):
    """Schema untuk membuat material baru."""
    external_link: Optional[str] = Field(None, examples=["https://example.com/video"], description="Link eksternal (untuk tipe 'link')")

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, value: str, info) -> Optional[str]:
        """Validasi bahwa external_link harus ada jika material_type adalah 'link'."""
        if info.data.get("material_type") == MaterialType.LINK and not value:
            raise ValueError("External link harus disediakan untuk material tipe 'link'")
        return value


class MaterialResponse(MaterialBase):
    """Schema untuk response material."""
    id: int = Field(..., examples=[1], description="ID material unik")
    class_id: int = Field(..., examples=[1], description="ID class yang memiliki materi")
    file_path: Optional[str] = Field(None, examples=["/uploads/classes/1/materials/file.pdf"], description="Path file yang di-upload")
    file_size: Optional[int] = Field(None, examples=[2048576], description="Ukuran file dalam bytes")
    external_link: Optional[str] = Field(None, examples=["https://example.com/video"], description="Link eksternal")
    uploaded_by: int = Field(..., examples=[1], description="ID dosen yang upload materi")
    created_at: datetime = Field(..., examples=["2024-04-19T10:30:00+00:00"], description="Waktu pembuatan materi")
    updated_at: Optional[datetime] = Field(None, examples=["2024-04-19T15:45:00+00:00"], description="Waktu update terakhir")

    class Config:
        from_attributes = True


class MaterialListResponse(BaseModel):
    """Schema untuk response list materials."""
    total: int = Field(..., examples=[10], description="Total jumlah material di class")
    materials: list[MaterialResponse] = Field(..., description="Daftar material")


class MaterialUpdate(BaseModel):
    """Schema untuk update material."""
    title: Optional[str] = Field(None, min_length=1, max_length=255, examples=["Updated Title"])
    description: Optional[str] = Field(None, examples=["Updated description"])
    is_published: Optional[bool] = Field(None, examples=[True])
    external_link: Optional[str] = Field(None, examples=["https://example.com/video"])

