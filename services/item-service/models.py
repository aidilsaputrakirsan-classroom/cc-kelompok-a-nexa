import os
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

_schema = "item_service" if not IS_SQLITE else None
_fk = lambda table: f"item_service.{table}" if not IS_SQLITE else table


# =====================
# ITEMS
# =====================

class Item(Base):
    __tablename__ = "items"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    category = Column(String(50), nullable=True)
    owner_id = Column(Integer, nullable=False)  # Refers to auth-service user ID

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# =====================
# CLASSES & ENROLLMENT
# =====================

class UserClassAssociation(Base):
    __tablename__ = "user_class_association"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    user_id = Column(Integer, primary_key=True, nullable=False)
    class_id = Column(
        Integer,
        ForeignKey(_fk("classes.id")),
        primary_key=True,
        nullable=False,
    )


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
    class_id = Column(Integer, ForeignKey(_fk("classes.id")), nullable=False)
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


# =====================
# ASSIGNMENTS, SUBMISSIONS & GRADES
# =====================

class Assignment(Base):
    __tablename__ = "assignments"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, nullable=False)  # FK to classes.id (same schema)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)
    allow_late_submission = Column(Boolean, default=False)
    max_score = Column(Integer, default=100)
    created_by = Column(Integer, nullable=False)  # Refers to auth-service user ID
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Submission(Base):
    __tablename__ = "submissions"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey(_fk("assignments.id")), nullable=False)
    student_id = Column(Integer, nullable=False)  # Refers to auth-service user ID
    file_path = Column(String(512), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    submission_number = Column(Integer, default=1)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_late = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Grade(Base):
    __tablename__ = "grades"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey(_fk("submissions.id")), nullable=False)
    score = Column(Float, nullable=False)
    graded_by = Column(Integer, nullable=False)  # Refers to auth-service user ID
    graded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())