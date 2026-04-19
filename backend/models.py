from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Enum, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from enum import Enum as PyEnum


class UserRole(str, PyEnum):
    """User roles untuk RBAC (Role-Based Access Control)."""
    ADMIN = "admin"
    DOSEN = "dosen"
    MAHASISWA = "mahasiswa"


# Association table untuk many-to-many relationship User-Class
user_class_association = Table(
    'user_class_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('class_id', Integer, ForeignKey('classes.id'), primary_key=True),
)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    
    # Perbaikan: Tambahkan server_default agar tidak NULL saat pertama kali dibuat
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Item(id={self.id}, name='{self.name}', price={self.price})>"


class User(Base):
    """Model untuk tabel 'users' dengan role-based access control."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # email: unique=True sudah otomatis membuat index di belakang layar
    email = Column(String(255), unique=True, nullable=False) 
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MAHASISWA)
    is_active = Column(Boolean, default=True)
    
    # Profile fields
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    profile_picture = Column(String(255), nullable=True)  # URL to profile picture
    semester = Column(Integer, nullable=True)  # For Mahasiswa
    
    # SSO fields
    sso_provider = Column(String(50), nullable=True)  # google, github, etc.
    sso_id = Column(String(255), nullable=True, unique=True)
    
    # Password reset
    reset_token = Column(String(255), nullable=True, unique=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    classes = relationship(
        "Class",
        secondary=user_class_association,
        back_populates="users",
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role={self.role})>"


class Class(Base):
    """Model untuk tabel 'classes' — kelas akademik."""
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False)  # e.g., "TK301"
    description = Column(Text, nullable=True)
    instructor_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Dosen yang mengajar
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(10), nullable=False)  # e.g., "2024/2025"
    max_students = Column(Integer, nullable=True)
    is_archived = Column(Boolean, default=False)  # Soft delete untuk arsip
    archived_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship(
        "User",
        secondary=user_class_association,
        back_populates="classes",
    )
    instructor = relationship(
        "User",
        foreign_keys=[instructor_id],
        viewonly=True,
    )

    def __repr__(self):
        return f"<Class(id={self.id}, code='{self.code}', name='{self.name}')>"
