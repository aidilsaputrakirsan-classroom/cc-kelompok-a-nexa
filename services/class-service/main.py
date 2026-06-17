import os
import logging
from fastapi import FastAPI, Depends, HTTPException, Query, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from database import engine, get_db, Base
from models import Class, Material, UserClassAssociation
from schemas import (
    ClassCreate, ClassResponse, ClassListResponse, ClassDetailResponse,
    MaterialCreate, MaterialResponse, MaterialListResponse, MaterialUpdate
)
from auth_client import verify_token_with_auth_service, resolve_users_from_auth_service

logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Class Service",
    description="Class and Material microservice",
    version="2.0.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://studyfy.onrender.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# ROLE DEPENDENCIES
# =====================

async def get_current_user(user: dict = Depends(verify_token_with_auth_service)) -> dict:
    return user


async def require_instructor(user: dict = Depends(verify_token_with_auth_service)) -> dict:
    if user.get("role") != "dosen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya dosen yang dapat mengakses resource ini",
        )
    return user

# =====================
# ENDPOINTS
# =====================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "class-service",
        "version": "2.0.0",
    }


@app.post("/classes", response_model=ClassResponse, status_code=201)
async def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    """Buat class baru. Hanya dosen yang bisa."""
    db_class = Class(**class_data.model_dump())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class


@app.get("/classes", response_model=ClassListResponse)
async def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    instructor_id: int | None = Query(None),
    semester: int | None = Query(None),
    include_archived: bool = Query(False),
    only_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Enforce restriction: Dosen only sees their own classes
    if current_user.get("role") == "dosen":
        instructor_id = current_user.get("user_id")

    query = db.query(Class)
    
    if only_archived:
        query = query.filter(Class.is_archived == True)
    elif not include_archived:
        query = query.filter(Class.is_archived == False)
    
    if instructor_id:
        query = query.filter(Class.instructor_id == instructor_id)
    
    if semester:
        query = query.filter(Class.semester == semester)
    
    total = query.count()
    classes = query.order_by(Class.created_at.desc()).offset(skip).limit(limit).all()
    return ClassListResponse(total=total, classes=classes)


@app.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if current_user.get("role") == "dosen" and db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke kelas ini")
        
    return db_class


@app.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengubah kelas Anda sendiri")
    
    for field, value in class_data.model_dump(exclude_unset=True).items():
        setattr(db_class, field, value)
    
    db.commit()
    db.refresh(db_class)
    return db_class


@app.delete("/classes/{class_id}", status_code=204)
async def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa menghapus kelas Anda sendiri")
    
    db.delete(db_class)
    db.commit()


@app.post("/classes/{class_id}/students/{user_id}", status_code=201)
async def add_student_to_class(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
        
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa menambah siswa ke kelas Anda sendiri")

    # Check capacity limit
    current_count = db.query(UserClassAssociation).filter_by(class_id=class_id).count()
    if db_class.max_students and current_count >= db_class.max_students:
        raise HTTPException(status_code=400, detail="Kelas sudah penuh")

    # Check if student is already enrolled
    existing = db.query(UserClassAssociation).filter_by(class_id=class_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student sudah ada di class (class/user tidak ditemukan atau sudah ada)")

    association = UserClassAssociation(user_id=user_id, class_id=class_id)
    db.add(association)
    db.commit()
    return {"message": "Student berhasil ditambahkan ke class"}


@app.delete("/classes/{class_id}/students/{user_id}", status_code=204)
async def remove_student_from_class(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
        
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengeluarkan siswa dari kelas Anda sendiri")

    association = db.query(UserClassAssociation).filter_by(class_id=class_id, user_id=user_id).first()
    if not association:
        raise HTTPException(status_code=400, detail="Tidak bisa hapus student dari class (tidak terdaftar)")

    db.delete(association)
    db.commit()


@app.get("/users/{user_id}/classes", response_model=list[ClassResponse])
async def get_user_classes(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin" and current_user.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Tidak bisa melihat classes user lain")
    
    classes = db.query(Class).join(UserClassAssociation, Class.id == UserClassAssociation.class_id).filter(UserClassAssociation.user_id == user_id).all()
    return classes


@app.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    request: Request,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    student_associations = db.query(UserClassAssociation).filter_by(class_id=class_id).all()
    student_ids = [assoc.user_id for assoc in student_associations]
    
    students_details = await resolve_users_from_auth_service(student_ids, authorization)
    return students_details


@app.patch("/classes/{class_id}/archive", response_model=ClassResponse)
async def archive_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengarsip kelas Anda sendiri")
    
    if db_class.is_archived:
        raise HTTPException(status_code=400, detail="Class sudah diarsip")
    
    db_class.is_archived = True
    db_class.archived_at = datetime.now()
    db.commit()
    db.refresh(db_class)
    return db_class


@app.patch("/classes/{class_id}/unarchive", response_model=ClassResponse)
async def unarchive_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa membuka arsip kelas Anda sendiri")
    
    if not db_class.is_archived:
        raise HTTPException(status_code=400, detail="Class tidak dalam status arsip")
    
    db_class.is_archived = False
    db_class.archived_at = None
    db.commit()
    db.refresh(db_class)
    return db_class

# =====================
# MATERIAL ENDPOINTS
# =====================

@app.post("/classes/{class_id}/materials", response_model=MaterialResponse, status_code=201)
async def upload_material(
    class_id: int,
    material_data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    if db_class.instructor_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa upload materi ke kelas Anda sendiri")
    
    db_material = Material(
        class_id=class_id,
        uploaded_by=current_user.get("user_id"),
        **material_data.model_dump(exclude_unset=True)
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@app.get("/classes/{class_id}/materials", response_model=MaterialListResponse)
async def list_materials(
    class_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    query = db.query(Material).filter(Material.class_id == class_id)
    if current_user.get("role") == "mahasiswa":
        query = query.filter(Material.is_published == True)
        
    total = query.count()
    materials = query.order_by(Material.created_at.desc()).offset(skip).limit(limit).all()
    return MaterialListResponse(total=total, materials=materials)


@app.get("/classes/{class_id}/materials/{material_id}", response_model=MaterialResponse)
async def get_material(
    class_id: int,
    material_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_material = db.query(Material).filter(Material.id == material_id, Material.class_id == class_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material tidak ditemukan")
    return db_material


@app.put("/classes/{class_id}/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    class_id: int,
    material_id: int,
    material_data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_material = db.query(Material).filter(Material.id == material_id, Material.class_id == class_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material tidak ditemukan")
    
    if db_material.uploaded_by != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengubah materi yang Anda upload")
    
    for field, value in material_data.model_dump(exclude_unset=True).items():
        setattr(db_material, field, value)
        
    db.commit()
    db.refresh(db_material)
    return db_material


@app.delete("/classes/{class_id}/materials/{material_id}", status_code=204)
async def delete_material(
    class_id: int,
    material_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_material = db.query(Material).filter(Material.id == material_id, Material.class_id == class_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material tidak ditemukan")
    
    if db_material.uploaded_by != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Anda hanya bisa menghapus materi yang Anda upload")
        
    db.delete(db_material)
    db.commit()

# =====================
# INTERNAL INTER-SERVICE VERIFICATION ENDPOINTS
# =====================

@app.get("/classes/{class_id}/verify-instructor")
def verify_instructor(
    class_id: int,
    instructor_id: int = Query(...),
    db: Session = Depends(get_db),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
         raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    return {"is_instructor": db_class.instructor_id == instructor_id}


@app.get("/classes/{class_id}/verify-enrollment")
def verify_enrollment(
    class_id: int,
    student_id: int = Query(...),
    db: Session = Depends(get_db),
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
         raise HTTPException(status_code=404, detail="Class tidak ditemukan")
         
    is_enrolled = db.query(UserClassAssociation).filter_by(
        class_id=class_id, user_id=student_id
    ).first() is not None
    return {"is_enrolled": is_enrolled}
