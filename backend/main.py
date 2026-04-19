import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, User, UserRole
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    ItemStatsResponse,
    UserCreate, UserResponse, LoginRequest, TokenResponse,
    UserProfileUpdate, UserWithClassesResponse,
    PasswordResetRequest, PasswordResetVerify, PasswordResetResponse,
    ClassCreate, ClassResponse, ClassListResponse,
)
from auth import (
    create_access_token, get_current_user, require_admin, require_instructor,
    create_password_reset_token_record, verify_password_reset_token,
)
import crud

load_dotenv()

# Buat semua tabel saat startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud App API",
    description="REST API untuk mata kuliah Komputasi Awan — SI ITK",
    version="0.4.0",
)

# ==================== CORS (CONFIGURED FOR DEVOPS) ====================
# Mengambil allowed origins dari .env, default ke localhost frontend (Vite)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost")
origins_list = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.4.0"}


# ==================== AUTH ENDPOINTS (PUBLIC) ====================

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ==================== PASSWORD RESET ====================

@app.post("/auth/password-reset-request", response_model=PasswordResetResponse, status_code=200)
def password_reset_request(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset - akan mengirim email dengan reset token."""
    user = crud.get_user_by_email(db=db, email=request.email)
    if not user:
        # Jangan beri tahu apakah email terdaftar atau tidak (security best practice)
        return {
            "message": "Jika email terdaftar, link reset password akan dikirim",
            "email": request.email,
        }
    
    reset_token = crud.request_password_reset(db=db, email=request.email)
    
    # TODO: Kirim email dengan reset token
    # Untuk testing, token dapat diambil dari response
    return {
        "message": "Link reset password telah dikirim ke email Anda",
        "email": request.email,
        # "reset_token": reset_token,  # Only for development/testing
    }


@app.post("/auth/password-reset-verify", response_model=UserResponse, status_code=200)
def password_reset_verify(reset_data: PasswordResetVerify, db: Session = Depends(get_db)):
    """Verify token dan reset password ke password baru."""
    user = crud.verify_and_reset_password(
        db=db,
        email=reset_data.email,
        reset_token=reset_data.reset_token,
        new_password=reset_data.new_password,
    )
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Token tidak valid atau sudah expired",
        )
    
    return user


# ==================== USER PROFILE ====================

@app.get("/users/profile/{user_id}", response_model=UserWithClassesResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil profil user. Admin bisa ambil profil siapa saja, user lain hanya profil sendiri."""
    # Authorization check
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Tidak bisa mengakses profil user lain")
    
    user = crud.get_user_profile(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    return user


@app.put("/users/profile", response_model=UserResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profil user sendiri."""
    updated_user = crud.update_user_profile(
        db=db,
        user=current_user,
        profile_data=profile_data,
    )
    return updated_user


# ==================== CLASS MANAGEMENT (PROTECTED) ====================

@app.post("/classes", response_model=ClassResponse, status_code=201)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),  # Only admin can create classes
):
    """Buat class baru. Hanya admin yang bisa."""
    class_dict = class_data.model_dump()
    db_class = crud.create_class(db=db, class_data=class_dict)
    return db_class


@app.get("/classes", response_model=ClassListResponse)
def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    instructor_id: int | None = Query(None),
    semester: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List semua classes dengan filter."""
    result = crud.get_classes(
        db=db,
        skip=skip,
        limit=limit,
        instructor_id=instructor_id,
        semester=semester,
    )
    return result


@app.get("/classes/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail class."""
    db_class = crud.get_class(db=db, class_id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    return db_class


@app.put("/classes/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update class. Hanya admin yang bisa."""
    updated_class = crud.update_class(
        db=db,
        class_id=class_id,
        class_data=class_data.model_dump(exclude_unset=True),
    )
    if not updated_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    return updated_class


@app.delete("/classes/{class_id}", status_code=204)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Hapus class. Hanya admin yang bisa."""
    success = crud.delete_class(db=db, class_id=class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")


@app.post("/classes/{class_id}/students/{user_id}", status_code=201)
def add_student_to_class(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    """Tambah student ke class. Hanya dosen/admin yang bisa."""
    success = crud.add_student_to_class(db=db, class_id=class_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Tidak bisa tambah student ke class (class/user tidak ditemukan atau sudah ada)",
        )
    return {"message": "Student berhasil ditambahkan ke class"}


@app.delete("/classes/{class_id}/students/{user_id}", status_code=204)
def remove_student_from_class(
    class_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    """Hapus student dari class. Hanya dosen/admin yang bisa."""
    success = crud.remove_student_from_class(db=db, class_id=class_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Tidak bisa hapus student dari class (tidak terdaftar)",
        )


@app.get("/users/{user_id}/classes", response_model=list[ClassResponse])
def get_user_classes(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua class yang diikuti user."""
    # Authorization check
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Tidak bisa melihat classes user lain")
    
    classes = crud.get_user_classes(db=db, user_id=user_id)
    return classes


@app.get("/classes/{class_id}/students", response_model=list[UserResponse])
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua students dalam class."""
    # Verify class exists
    db_class = crud.get_class(db=db, class_id=class_id)
    if not db_class:
        raise HTTPException(status_code=404, detail="Class tidak ditemukan")
    
    students = crud.get_class_students(db=db, class_id=class_id)
    return students




@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.create_item(db=db, item_data=item)


@app.get("/items", response_model=ItemListResponse)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_items(db=db, skip=skip, limit=limit, search=search)


@app.get("/items/stats", response_model=ItemStatsResponse)
def get_items_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_item_stats(db=db)


@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = crud.update_item(db=db, item_id=item_id, item_data=item)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return updated


@app.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return None


# ==================== TEAM INFO ====================

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