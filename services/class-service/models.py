import os
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

class UserClassAssociation(Base):
    __tablename__ = "user_class_association"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    user_id = Column(Integer, primary_key=True, nullable=False)
    class_id = Column(Integer, ForeignKey("item_service.classes.id" if not IS_SQLITE else "classes.id"), primary_key=True, nullable=False)


class Class(Base):
    __tablename__ = "classes"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    instructor_id = Column(Integer, nullable=False)  # Refers to auth-service user ID
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(10), nullable=False)
    max_students = Column(Integer, nullable=True)
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Material(Base):
    __tablename__ = "materials"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("item_service.classes.id" if not IS_SQLITE else "classes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    material_type = Column(String(50), nullable=False)
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)
    external_link = Column(String(512), nullable=True)
    uploaded_by = Column(Integer, nullable=False)  # Refers to auth-service user ID
    is_published = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
