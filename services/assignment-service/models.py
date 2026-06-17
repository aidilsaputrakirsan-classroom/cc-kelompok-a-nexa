import os
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

class Assignment(Base):
    __tablename__ = "assignments"
    if not IS_SQLITE:
        __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, nullable=False)  # Plain integer referring to class-service Class ID
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
    assignment_id = Column(Integer, ForeignKey("item_service.assignments.id" if not IS_SQLITE else "assignments.id"), nullable=False)
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
    submission_id = Column(Integer, ForeignKey("item_service.submissions.id" if not IS_SQLITE else "submissions.id"), nullable=False)
    score = Column(Float, nullable=False)
    graded_by = Column(Integer, nullable=False)  # Refers to auth-service user ID
    graded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
