import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Assignment, Submission, Grade
from schemas import (
    AssignmentCreate, AssignmentResponse, AssignmentListResponse, AssignmentUpdate,
    SubmissionResponse, SubmissionListResponse, SubmissionWithGradeResponse,
    GradeCreate, GradeResponse
)
from auth_client import (
    verify_token_with_auth_service,
    verify_instructor_in_class_service,
    verify_enrollment_in_class_service
)

logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Assignment Service",
    description="Assignment, Submission, and Grading microservice",
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
# ENDPOINTS: ASSIGNMENTS
# =====================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "assignment-service",
        "version": "2.0.0",
    }


@app.post("/classes/{class_id}/assignments", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    class_id: int,
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_instructor),
):
    """Buat assignment baru. Hanya dosen pengampu kelas ini yang bisa."""
    is_instructor = await verify_instructor_in_class_service(class_id, current_user["user_id"])
    if not is_instructor:
        raise HTTPException(
            status_code=403,
            detail="Anda hanya bisa membuat assignment untuk kelas Anda sendiri"
        )
        
    db_assignment = Assignment(
        class_id=class_id,
        created_by=current_user["user_id"],
        **assignment_data.model_dump()
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
    """Ambil daftar assignment untuk sebuah class."""
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
        
    # Verify enrollment in class
    is_enrolled = await verify_enrollment_in_class_service(class_id, current_user["user_id"])
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="Anda tidak terdaftar di class ini")
        
    # Verify assignment exists
    db_assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.class_id == class_id
    ).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment tidak ditemukan")
        
    # Validate PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang diperbolehkan")
        
    # Check file size (max 2MB)
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 2MB")
        
    # Check deadline
    current_time = get_wita_now()
    is_late = current_time > db_assignment.deadline
    if is_late and not db_assignment.allow_late_submission:
        raise HTTPException(
            status_code=400,
            detail="Deadline sudah terlewat dan tidak menerima submission terlambat"
        )
        
    # Save file
    upload_dir = f"uploads/assignments/{class_id}/{assignment_id}/{current_user['user_id']}"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    # Remove older submission for this assignment (resubmission)
    existing = db.query(Submission).filter_by(
        assignment_id=assignment_id, student_id=current_user["user_id"]
    ).first()
    if existing:
        if os.path.exists(existing.file_path):
            try:
                os.remove(existing.file_path)
            except:
                pass
        db.delete(existing)
        db.commit()
        
    # Create submission record
    db_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user["user_id"],
        file_path=file_path,
        original_filename=file.filename,
        file_size=file_size,
        is_late=is_late,
        submission_number=1
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


@app.get("/classes/{class_id}/assignments/{assignment_id}/my-submission", response_model=SubmissionWithGradeResponse | None)
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
        graded_at=db_grade.graded_at if db_grade else None
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
        # Verify if instructor is assignment owner
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
        except:
            pass
            
    # Also delete associated grade if exists
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
        raise HTTPException(
            status_code=400,
            detail=f"Score harus antara 0 dan {db_assignment.max_score}"
        )
        
    db_grade = db.query(Grade).filter_by(submission_id=submission_id).first()
    if db_grade:
        db_grade.score = grade_data.score
        db_grade.graded_by = current_user["user_id"]
        db_grade.graded_at = datetime.now()
    else:
        db_grade = Grade(
            submission_id=submission_id,
            score=grade_data.score,
            graded_by=current_user["user_id"]
        )
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
