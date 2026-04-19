from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
from models import Item, User, Class, user_class_association, UserRole
from schemas import ItemCreate, ItemUpdate, UserCreate, UserProfileUpdate
from auth import hash_password, verify_password, create_password_reset_token_record, verify_password_reset_token, clear_password_reset_token


def create_item(db: Session, item_data: ItemCreate) -> Item:
    """Buat item baru di database."""
    db_item = Item(**item_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_items(db: Session, skip: int = 0, limit: int = 20, search: str = None):
    """
    Ambil daftar items dengan pagination & search.
    - skip: jumlah data yang di-skip (untuk pagination)
    - limit: jumlah data per halaman
    - search: cari berdasarkan nama atau deskripsi
    """
    query = db.query(Item)
    
    if search:
        query = query.filter(
            or_(
                Item.name.ilike(f"%{search}%"),
                Item.description.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}


def get_item_stats(db: Session):
    """Ambil statistik agregat semua item."""
    total_items, total_quantity, total_value, average_price = db.query(
        func.count(Item.id),
        func.coalesce(func.sum(Item.quantity), 0),
        func.coalesce(func.sum(Item.price * Item.quantity), 0.0),
        func.coalesce(func.avg(Item.price), 0.0),
    ).one()

    return {
        "total_items": int(total_items or 0),
        "total_quantity": int(total_quantity or 0),
        "total_value": float(total_value or 0.0),
        "average_price": float(average_price or 0.0),
    }


def get_item(db: Session, item_id: int) -> Item | None:
    """Ambil satu item berdasarkan ID."""
    return db.query(Item).filter(Item.id == item_id).first()


def update_item(db: Session, item_id: int, item_data: ItemUpdate) -> Item | None:
    """
    Update item berdasarkan ID.
    Hanya update field yang dikirim (bukan None).
    """
    db_item = db.query(Item).filter(Item.id == item_id).first()
    
    if not db_item:
        return None
    
    # Hanya update field yang dikirim (exclude_unset=True)
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_item(db: Session, item_id: int) -> bool:
    """Hapus item berdasarkan ID. Return True jika berhasil."""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    
    if not db_item:
        return False
    
    db.delete(db_item)
    db.commit()
    return True


def create_user(db: Session, user_data: UserCreate) -> User:
    """Buat user baru dengan password yang di-hash."""
    # Cek apakah email sudah terdaftar
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return None  # Email sudah dipakai

    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Autentikasi user: cek email & password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ==================== USER PROFILE ====================

def update_user_profile(db: Session, user: User, profile_data: UserProfileUpdate) -> User:
    """Update profil user."""
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


def get_user_profile(db: Session, user_id: int) -> User | None:
    """Ambil profil user berdasarkan ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Ambil user berdasarkan email."""
    return db.query(User).filter(User.email == email).first()


# ==================== PASSWORD RESET ====================

def request_password_reset(db: Session, email: str) -> str | None:
    """Request password reset - generate & simpan token."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    
    reset_token = create_password_reset_token_record(db, user)
    return reset_token


def verify_and_reset_password(
    db: Session,
    email: str,
    reset_token: str,
    new_password: str,
) -> User | None:
    """Verify token dan reset password."""
    user = verify_password_reset_token(db, email, reset_token)
    if not user:
        return None
    
    # Update password
    user.hashed_password = hash_password(new_password)
    clear_password_reset_token(db, user)
    
    return user


# ==================== CLASS MANAGEMENT ====================

def create_class(db: Session, class_data: dict) -> Class:
    """Buat class baru."""
    db_class = Class(**class_data)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class


def get_class(db: Session, class_id: int) -> Class | None:
    """Ambil class berdasarkan ID."""
    return db.query(Class).filter(Class.id == class_id).first()


def get_classes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    instructor_id: int | None = None,
    semester: int | None = None,
    include_archived: bool = False,
) -> dict:
    """Ambil daftar classes dengan filter (default exclude archived classes)."""
    query = db.query(Class)
    
    # Default: exclude archived classes
    if not include_archived:
        query = query.filter(Class.is_archived == False)
    
    if instructor_id:
        query = query.filter(Class.instructor_id == instructor_id)
    
    if semester:
        query = query.filter(Class.semester == semester)
    
    total = query.count()
    classes = query.order_by(Class.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "classes": classes}


def update_class(db: Session, class_id: int, class_data: dict) -> Class | None:
    """Update class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        return None
    
    for field, value in class_data.items():
        if value is not None:
            setattr(db_class, field, value)
    
    db.commit()
    db.refresh(db_class)
    return db_class


def delete_class(db: Session, class_id: int) -> bool:
    """Hapus class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        return False
    
    db.delete(db_class)
    db.commit()
    return True


# ==================== CLASS MEMBERSHIP ====================

def add_student_to_class(db: Session, class_id: int, user_id: int) -> bool:
    """Tambah student ke class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not db_class or not user:
        return False
    
    # Cek apakah sudah existing
    if user in db_class.users:
        return False
    
    db_class.users.append(user)
    db.commit()
    return True


def remove_student_from_class(db: Session, class_id: int, user_id: int) -> bool:
    """Hapus student dari class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not db_class or not user:
        return False
    
    if user not in db_class.users:
        return False
    
    db_class.users.remove(user)
    db.commit()
    return True


def get_user_classes(db: Session, user_id: int) -> list[Class]:
    """Ambil semua class yang diikuti user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    return user.classes


def get_class_students(db: Session, class_id: int) -> list[User]:
    """Ambil semua student dalam class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        return []
    
    return db_class.users


def get_class_student_count(db: Session, class_id: int) -> int:
    """Hitung jumlah student dalam class."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        return 0
    
    return len(db_class.users)


# ==================== ARCHIVE CLASS ====================

def archive_class(db: Session, class_id: int) -> Class:
    """Archive class (soft delete)."""
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        return None
    
    db_class.is_archived = True
    db_class.archived_at = datetime.now()
    db.commit()
    db.refresh(db_class)
    return db_class


def get_classes_with_archive(db: Session, skip: int = 0, limit: int = 20, include_archived: bool = False):
    """
    Ambil list class dengan opsi untuk include archived classes.
    - include_archived: jika False, hanya return class yang tidak diarsip
    """
    query = db.query(Class)
    
    if not include_archived:
        query = query.filter(Class.is_archived == False)
    
    total = query.count()
    classes = query.order_by(Class.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "classes": classes}


