from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# 1. Tabel Penghubung (Junction Table)
class UserClassAssociation(Base):
    __tablename__ = "user_class_association"
    __table_args__ = {'schema': 'item_service'}

    # Sebagai Composite Primary Key
    user_id = Column(Integer, primary_key=True, nullable=False) # Plain integer, referensi ke auth_service
    class_id = Column(Integer, ForeignKey("item_service.classes.id"), primary_key=True, nullable=False)

# 2. Tabel Classes
class Class(Base):
    __tablename__ = "classes"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    
    # Referensi ke auth_service.users
    instructor_id = Column(Integer, nullable=False) 
    
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(10), nullable=False)
    max_students = Column(Integer, nullable=True)
    is_archived = Column(Boolean, nullable=True)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# 3. Tabel Items
class Item(Base):
    __tablename__ = "items"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False) # Double precision = Float
    quantity = Column(Integer, nullable=False)
    category = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# 4. Tabel Materials
class Material(Base):
    __tablename__ = "materials"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("item_service.classes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # USER-DEFINED di Postgres kita ubah jadi String untuk keamanan ORM
    material_type = Column(String(50), nullable=False) 
    
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)
    external_link = Column(String(512), nullable=True)
    
    # Referensi ke auth_service.users
    uploaded_by = Column(Integer, nullable=False) 
    
    is_published = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# 5. Tabel Assignments
class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("item_service.classes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)
    allow_late_submission = Column(Boolean, nullable=True)
    max_score = Column(Integer, nullable=True)
    
    # Referensi ke auth_service.users
    created_by = Column(Integer, nullable=False)
    
    is_published = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# 6. Tabel Submissions
class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("item_service.assignments.id"), nullable=False)
    
    # Referensi ke auth_service.users
    student_id = Column(Integer, nullable=False) 
    
    file_path = Column(String(512), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    submission_number = Column(Integer, nullable=True)
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_late = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# 7. Tabel Grades
class Grade(Base):
    __tablename__ = "grades"
    __table_args__ = {'schema': 'item_service'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("item_service.submissions.id"), nullable=False)
    score = Column(Float, nullable=False) # Double precision = Float
    
    # Referensi ke auth_service.users
    graded_by = Column(Integer, nullable=False)
    
    graded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())