from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# ==================== CLASS SCHEMAS ====================

class ClassBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Cloud Computing"])
    code: str = Field(..., min_length=1, max_length=20, examples=["TK301"])
    description: Optional[str] = Field(None, examples=["Pengenalan infrastruktur cloud computing"])
    semester: int = Field(..., ge=1, le=8, examples=[5], description="Semester 1-8")
    academic_year: str = Field(..., examples=["2024/2025"], description="Format: YYYY/YYYY")
    max_students: Optional[int] = Field(None, ge=1, examples=[40])


class ClassCreate(ClassBase):
    instructor_id: int = Field(..., gt=0, examples=[1])


class ClassResponse(ClassBase):
    id: int
    instructor_id: int
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassListResponse(BaseModel):
    total: int
    classes: List[ClassResponse]


class ClassDetailResponse(ClassResponse):
    students_count: int
    users: List[dict] = []  # List of user dicts from auth-service


# ==================== MATERIAL SCHEMAS ====================

class MaterialBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Cloud Architecture Basics"])
    description: Optional[str] = Field(None, examples=["Pengenalan arsitektur cloud"])
    material_type: str = Field(..., examples=["pdf"])
    is_published: bool = Field(default=True)


class MaterialCreate(MaterialBase):
    external_link: Optional[str] = Field(None, examples=["https://example.com/video"])

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, value: str, info) -> Optional[str]:
        if info.data.get("material_type") == "link" and not value:
            raise ValueError("External link harus disediakan untuk material tipe 'link'")
        return value


class MaterialResponse(MaterialBase):
    id: int
    class_id: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    external_link: Optional[str] = None
    uploaded_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialListResponse(BaseModel):
    total: int
    materials: List[MaterialResponse]


class MaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_published: Optional[bool] = None
    external_link: Optional[str] = None
