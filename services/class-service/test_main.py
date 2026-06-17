import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, engine
from main import app, verify_token_with_auth_service
from models import Class

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

MOCK_USER = {"user_id": 1, "email": "test@example.com", "name": "Test User", "role": "dosen"}

async def mock_verify_token_with_auth_service():
    return MOCK_USER


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_token_with_auth_service] = mock_verify_token_with_auth_service
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_create_class(client, db_session):
    response = client.post("/classes", json={
        "name": "Cloud Computing Special",
        "code": "TK399",
        "description": "Class with student limit",
        "semester": 5,
        "academic_year": "2024/2025",
        "max_students": 40,
        "instructor_id": 1
    }, headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Cloud Computing Special"
    assert data["code"] == "TK399"
    assert data["instructor_id"] == 1


def test_list_classes(client, db_session):
    cls = Class(
        name="Test Class",
        code="TEST101",
        description="Description",
        instructor_id=1,
        semester=1,
        academic_year="2024",
        max_students=10,
        is_archived=False
    )
    db_session.add(cls)
    db_session.commit()

    response = client.get("/classes", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["classes"][0]["code"] == "TEST101"
