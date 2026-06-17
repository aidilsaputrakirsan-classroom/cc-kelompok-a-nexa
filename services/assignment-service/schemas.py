from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ==================== ASSIGNMENT SCHEMAS ====================

class AssignmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Cloud Deployment Project"])
    description: Optional[str] = Field(None, examples=["Deploy aplikasi ke cloud platform"])
    deadline: datetime = Field(..., examples=["2024-05-01T23:59:59+08:00"])
    allow_late_submission: bool = Field(default=False)
    max_score: int = Field(default=100, ge=1, le=1000)
    is_published: bool = Field(default=True)


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None
    max_score: Optional[int] = None
    is_published: Optional[bool] = None


class AssignmentResponse(AssignmentBase):
    id: int
    class_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssignmentListResponse(BaseModel):
    total: int
    assignments: List[AssignmentResponse]


# ==================== SUBMISSION SCHEMAS ====================

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    original_filename: str
    file_size: int
    submission_number: int
    submitted_at: datetime
    is_late: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    total: int
    submissions: List[SubmissionResponse]


class SubmissionWithGradeResponse(SubmissionResponse):
    score: Optional[float] = None
    graded_at: Optional[datetime] = None


# ==================== GRADE SCHEMAS ====================

class GradeCreate(BaseModel):
    score: float = Field(..., examples=[85.0])


class GradeResponse(BaseModel):
    id: int
    submission_id: int
    score: float
    graded_by: int
    graded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
