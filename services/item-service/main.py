"""
Item Service — Consolidated service handling inventory (items), classes, materials,
assignments, submissions, and grading.
Berkomunikasi dengan Auth Service untuk verifikasi token.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from logging_config import setup_logging
from logging_middleware import RequestLoggingMiddleware
from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from metrics import metrics

from database import engine, get_db, Base
from models import Item, Class, Material, UserClassAssociation, Assignment, Submission, Grade
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse, ItemStatsResponse,
    ClassCreate, ClassResponse, ClassListResponse, ClassDetailResponse,
    MaterialCreate, MaterialResponse, MaterialListResponse, MaterialUpdate,
    AssignmentCreate, AssignmentResponse, AssignmentListResponse, AssignmentUpdate,
    SubmissionResponse, SubmissionListResponse, SubmissionWithGradeResponse,
    GradeCreate, GradeResponse,
)
from auth_client import verify_token_with_auth_service, auth_circuit

setup_logging()
logger = logging.getLogger(__name__)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Item Service",
    description="Consolidated inventory, classes, materials, and assignments microservice",
    version="2.2.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://studyfy-item-service.onrender.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)


# =====================
# TIME & ROLE UTILS
# =====================

def get_wita_now() -> datetime:
    """Dapatkan waktu sekarang dalam timezone WITA (UTC+8)."""
    return datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=8)


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
# HEALTH & METRICS
# =====================

@app.get("/metrics")
def get_metrics():
    """Return application metrics."""
    return {
        "service": "item-service",
        **metrics.get_metrics(),
    }


@app.get("/health")
def health_check():
    cb_status = auth_circuit.get_status()
    overall = "healthy" if cb_status["state"] == "CLOSED" else "degraded"
    return {
        "status": overall,
        "service": "item-service",
        "version": "2.2.0",
        "dependencies": {
            "auth-service": cb_status,
        },
    }


@app.get("/team")
def team_info():
    return {
        "team": "cloud-kelompok-a-nexa",
        "members": [
            {"name": "Dzaky Rasyiq Zuhair", "nim": "10231035", "role": "Lead Backend"},
            {"name": "Dhiya Afifah", "nim": "10231031", "role": "Lead Frontend"},
            {"name": "Ika Agustin Wulandari", "nim": "10231041", "role": "Lead DevOps"},
            {"name": "Gabriel Karmen Sanggalangi", "nim": "10231039", "role": "Lead QA & Docs"},
        ],
    }


# =====================
# ENDPOINTS: ITEMS (Inventory)
# =====================

@app.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(
    item_data: ItemCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Buat item baru — requires authentication."""
    item = Item(**item_data.model_dump(), owner_id=user["user_id"])
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/items", response_model=ItemListResponse)
async def get_items(
    search: str = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil daftar items milik user yang login."""
    query = db.query(Item).filter(Item.owner_id == user["user_id"])
    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return ItemListResponse(total=total, items=items)


@app.get("/items/stats", response_model=ItemStatsResponse)
async def get_items_stats(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil statistik items milik user yang login."""
    stats = db.query(
        func.count(Item.id),
        func.coalesce(func.sum(Item.price * Item.quantity), 0.0),
        func.coalesce(func.max(Item.price), 0.0),
        func.coalesce(func.min(Item.price), 0.0),
    ).filter(Item.owner_id == user["user_id"]).one()
    return {
        "total_items": stats[0],
        "total_value": stats[1],
        "termahal": stats[2],
        "termurah": stats[3],
    }


@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil item by ID."""
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == user["user_id"]).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    update_data: ItemUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Update item."""
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == user["user_id"]).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Hapus item."""
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == user["user_id"]).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# =====================
# ENDPOINTS: CLASSES
# =====================

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
    instructor_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    include_archived: bool = Query(False),
    only_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Dosen only sees their own classes
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
    current_count = db.query(UserClassAssociation).filter_by(class_id=class_id).count()
    if db_class.max_students and current_count >= db_class.max_students:
        raise HTTPException(status_code=400, detail="Kelas sudah penuh")
    existing = db.query(UserClassAssociation).filter_by(class_id=class_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student sudah ada di class")
    db.add(UserClassAssociation(user_id=user_id, class_id=class_id))
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
        raise HTTPException(status_code=400, detail="Student tidak terdaftar di class ini")
    db.delete(association)
    db.commit()


@app.get("/users/{user_id}/classes", response_model=List[ClassResponse])
async def get_user_classes(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin" and current_user.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Tidak bisa melihat classes user lain")
    classes = (
        db.query(Class)
        .join(UserClassAssociation, Class.id == UserClassAssociation.class_id)
        .filter(UserClassAssociation.user_id == user_id)
        .all()
    )
    return classes


@app.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from auth_client import resolve_users_from_auth_service
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    student_ids = [a.user_id for a in db.query(UserClassAssociation).filter_by(class_id=class_id).all()]
    return await resolve_users_from_auth_service(student_ids, authorization)


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
# ENDPOINTS: MATERIALS
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
        **material_data.model_dump(exclude_unset=True),
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
# INTERNAL VERIFICATION ENDPOINTS
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


# =====================
# ENDPOINTS: ASSIGNMENTS
# =====================

@app.post("/classes/{class_id}/assignments", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    class_id: int,
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    """Buat assignment baru. Hanya dosen pengampu kelas ini yang bisa."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class or db_class.instructor_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa membuat assignment untuk kelas Anda sendiri")
    db_assignment = Assignment(
        class_id=class_id,
        created_by=current_user["user_id"],
        **assignment_data.model_dump(),
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@app.get("/classes/{class_id}/assignments", response_model=AssignmentListResponse)
async def list_assignments(
    class_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(Assignment).filter(Assignment.class_id == class_id)
    if current_user.get("role") == "mahasiswa":
        query = query.filter(Assignment.is_published == True)
    total = query.count()
    assignments = query.order_by(Assignment.created_at.desc()).offset(skip).limit(limit).all()
    return AssignmentListResponse(total=total, assignments=assignments)


@app.get("/classes/{class_id}/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    return db_assignment


@app.put("/classes/{class_id}/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    class_id: int,
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    if db_assignment.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa mengubah assignment Anda sendiri")
    for field, value in assignment_data.model_dump(exclude_unset=True).items():
        setattr(db_assignment, field, value)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@app.delete("/classes/{class_id}/assignments/{assignment_id}", status_code=204)
async def delete_assignment(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    if db_assignment.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa menghapus assignment Anda sendiri")
    db.delete(db_assignment)
    db.commit()


# =====================
# ENDPOINTS: SUBMISSIONS
# =====================

@app.post("/classes/{class_id}/assignments/{assignment_id}/submissions", response_model=SubmissionResponse, status_code=201)
async def submit_assignment(
    class_id: int,
    assignment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "mahasiswa":
        raise HTTPException(status_code=403, detail="Hanya mahasiswa yang bisa submit assignment")

    # Verify enrollment
    is_enrolled = db.query(UserClassAssociation).filter_by(
        class_id=class_id, user_id=current_user["user_id"]
    ).first() is not None
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="Anda tidak terdaftar di class ini")

    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang diperbolehkan")

    file_content = await file.read()
    if len(file_content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 2MB")

    is_late = get_wita_now() > db_assignment.deadline.replace(tzinfo=None)
    if is_late and not db_assignment.allow_late_submission:
        raise HTTPException(status_code=400, detail="Deadline sudah terlewat dan tidak menerima submission terlambat")

    upload_dir = f"uploads/assignments/{class_id}/{assignment_id}/{current_user['user_id']}"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Resubmission — remove old file and record
    existing = db.query(Submission).filter_by(
        assignment_id=assignment_id, student_id=current_user["user_id"]
    ).first()
    if existing:
        if os.path.exists(existing.file_path):
            try:
                os.remove(existing.file_path)
            except Exception:
                pass
        db.delete(existing)
        db.commit()

    db_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user["user_id"],
        file_path=file_path,
        original_filename=file.filename,
        file_size=len(file_content),
        is_late=is_late,
        submission_number=1,
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission


@app.get("/classes/{class_id}/assignments/{assignment_id}/submissions", response_model=SubmissionListResponse)
async def list_submissions(
    class_id: int,
    assignment_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    if db_assignment.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa lihat submissions untuk assignment Anda")
    query = db.query(Submission).filter(Submission.assignment_id == assignment_id)
    total = query.count()
    submissions = query.order_by(Submission.submitted_at.desc()).offset(skip).limit(limit).all()
    return SubmissionListResponse(total=total, submissions=submissions)


@app.get("/classes/{class_id}/assignments/{assignment_id}/my-submission", response_model=Optional[SubmissionWithGradeResponse])
async def get_my_submission(
    class_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
    db_submission = db.query(Submission).filter_by(
        assignment_id=assignment_id, student_id=current_user["user_id"]
    ).first()
    if not db_submission:
        return None
    db_grade = db.query(Grade).filter_by(submission_id=db_submission.id).first()
    return SubmissionWithGradeResponse(
        id=db_submission.id,
        assignment_id=db_submission.assignment_id,
        student_id=db_submission.student_id,
        original_filename=db_submission.original_filename,
        file_size=db_submission.file_size,
        submission_number=db_submission.submission_number,
        submitted_at=db_submission.submitted_at,
        is_late=db_submission.is_late,
        created_at=db_submission.created_at,
        score=db_grade.score if db_grade else None,
        graded_at=db_grade.graded_at if db_grade else None,
    )


@app.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    if current_user["user_id"] != db_submission.student_id:
        db_assignment = db.query(Assignment).filter_by(id=db_submission.assignment_id).first()
        if not db_assignment or db_assignment.created_by != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Anda tidak bisa melihat submission ini")
    return db_submission


@app.delete("/submissions/{submission_id}/return", status_code=204)
async def return_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    db_assignment = db.query(Assignment).filter_by(id=db_submission.assignment_id).first()
    if not db_assignment or db_assignment.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa return submission untuk assignment Anda")
    if os.path.exists(db_submission.file_path):
        try:
            os.remove(db_submission.file_path)
        except Exception:
            pass
    db.query(Grade).filter_by(submission_id=submission_id).delete()
    db.delete(db_submission)
    db.commit()


# =====================
# ENDPOINTS: GRADING
# =====================

@app.post("/submissions/{submission_id}/grade", response_model=GradeResponse, status_code=201)
async def submit_grade(
    submission_id: int,
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    db_assignment = db.query(Assignment).filter_by(id=db_submission.assignment_id).first()
    if not db_assignment or db_assignment.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Anda hanya bisa grade submission untuk assignment Anda")
    if grade_data.score < 0 or grade_data.score > db_assignment.max_score:
        raise HTTPException(status_code=400, detail=f"Score harus antara 0 dan {db_assignment.max_score}")
    db_grade = db.query(Grade).filter_by(submission_id=submission_id).first()
    if db_grade:
        db_grade.score = grade_data.score
        db_grade.graded_by = current_user["user_id"]
        db_grade.graded_at = datetime.now()
    else:
        db_grade = Grade(submission_id=submission_id, score=grade_data.score, graded_by=current_user["user_id"])
        db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade


@app.get("/submissions/{submission_id}/grade", response_model=GradeResponse)
async def get_submission_grade(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    if current_user["user_id"] != db_submission.student_id:
        db_assignment = db.query(Assignment).filter_by(id=db_submission.assignment_id).first()
        if not db_assignment or db_assignment.created_by != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Anda tidak bisa melihat grade submission ini")
    db_grade = db.query(Grade).filter_by(submission_id=submission_id).first()
    if not db_grade:
        raise HTTPException(status_code=404, detail="Grade belum ada untuk submission ini")
    return db_grade
