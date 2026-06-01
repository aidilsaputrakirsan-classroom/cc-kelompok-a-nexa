"""
Konfigurasi test — setup database test terpisah dari database utama.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from io import BytesIO
from datetime import datetime, timezone, timedelta

from database import Base, get_db
from main import app
from models import UserRole

# Database test — SQLite in-memory (tidak perlu PostgreSQL untuk testing!)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Buat database baru untuk setiap test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Test client dengan database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Helper: register + login, return auth headers."""
    # Register
    client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "TestPassword123!",
        "name": "Test User"
    })
    # Login
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "TestPassword123!"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ==================== ASSIGNMENT FEATURE FIXTURES ====================

def get_wita_time(offset_hours: int = 0) -> str:
    """Get WITA time (UTC+8) with offset in ISO format."""
    now = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=8+offset_hours)
    return now.isoformat() + "+08:00"


@pytest.fixture
def instructor_headers(client):
    """Register as instructor (dosen), return auth headers."""
    client.post("/auth/register", json={
        "email": "instructor@example.com",
        "password": "InstructorPass123!",
        "name": "Instructor User",
        "role": "dosen"
    })
    response = client.post("/auth/login", json={
        "email": "instructor@example.com",
        "password": "InstructorPass123!"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student1_headers(client):
    """Register as student 1 (mahasiswa), return auth headers."""
    client.post("/auth/register", json={
        "email": "student1@example.com",
        "password": "StudentPass123!",
        "name": "Student One",
        "role": "mahasiswa"
    })
    response = client.post("/auth/login", json={
        "email": "student1@example.com",
        "password": "StudentPass123!"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student2_headers(client):
    """Register as student 2 (mahasiswa), return auth headers."""
    client.post("/auth/register", json={
        "email": "student2@example.com",
        "password": "StudentPass123!",
        "name": "Student Two",
        "role": "mahasiswa"
    })
    response = client.post("/auth/login", json={
        "email": "student2@example.com",
        "password": "StudentPass123!"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_class(client, instructor_headers):
    """Create a test class with instructor."""
    # Get instructor ID from current user
    user_response = client.get("/auth/me", headers=instructor_headers)
    instructor_id = user_response.json()["id"]
    
    response = client.post("/classes", json={
        "name": "Cloud Computing",
        "code": "TK301",
        "description": "Introduction to cloud computing",
        "semester": 5,
        "academic_year": "2024/2025",
        "instructor_id": instructor_id
    }, headers=instructor_headers)
    return response.json()


@pytest.fixture
def test_class_with_students(client, instructor_headers, student1_headers, student2_headers, test_class):
    """Create test class and enroll 2 students."""
    class_id = test_class["id"]
    
    # Get student IDs from headers (need to make a request to get user info)
    user1_response = client.get("/auth/me", headers=student1_headers)
    user2_response = client.get("/auth/me", headers=student2_headers)
    
    student1_id = user1_response.json()["id"]
    student2_id = user2_response.json()["id"]
    
    # Add students to class
    client.post(f"/classes/{class_id}/students/{student1_id}", headers=instructor_headers)
    client.post(f"/classes/{class_id}/students/{student2_id}", headers=instructor_headers)
    
    return test_class


@pytest.fixture
def assignment_future_deadline(client, instructor_headers, test_class):
    """Create assignment with deadline 1 hour in future."""
    class_id = test_class["id"]
    deadline = get_wita_time(offset_hours=1)
    
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Future Assignment",
        "description": "This assignment is due in the future",
        "deadline": deadline,
        "allow_late_submission": False,
        "max_score": 100,
        "is_published": True
    }, headers=instructor_headers)
    
    return response.json()


@pytest.fixture
def assignment_past_deadline(client, instructor_headers, test_class):
    """Create assignment with deadline 1 hour in past."""
    class_id = test_class["id"]
    deadline = get_wita_time(offset_hours=-1)
    
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Past Assignment",
        "description": "This assignment deadline has passed",
        "deadline": deadline,
        "allow_late_submission": False,
        "max_score": 100,
        "is_published": True
    }, headers=instructor_headers)
    
    return response.json()


@pytest.fixture
def assignment_past_deadline_allow_late(client, instructor_headers, test_class):
    """Create assignment with past deadline but allow late submission."""
    class_id = test_class["id"]
    deadline = get_wita_time(offset_hours=-1)
    
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Past Assignment (Allow Late)",
        "description": "This assignment allows late submission",
        "deadline": deadline,
        "allow_late_submission": True,
        "max_score": 100,
        "is_published": True
    }, headers=instructor_headers)
    
    return response.json()


@pytest.fixture
def test_pdf_file():
    """Create a valid PDF file for testing."""
    # Minimal valid PDF bytes (size ~280 bytes)
    pdf_bytes = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj 4 0 obj<</Length 44>>stream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Submission) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n304\n%%EOF"
    return BytesIO(pdf_bytes)