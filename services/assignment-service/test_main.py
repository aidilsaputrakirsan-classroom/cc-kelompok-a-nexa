import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, engine
from main import app, verify_token_with_auth_service
from models import Assignment

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


def test_create_assignment_mocked(client, db_session):
    # Mocking inter-service call: verify_instructor_in_class_service
    import main
    async def mock_verify_instructor(class_id, instructor_id):
        return True
    
    # Temporarily override the function
    original_verify = main.verify_instructor_in_class_service
    main.verify_instructor_in_class_service = mock_verify_instructor
    
    try:
        response = client.post("/classes/1/assignments", json={
            "title": "Cloud Deployment Project",
            "description": "Deploy aplikasi",
            "deadline": "2024-12-31T23:59:59+08:00",
            "allow_late_submission": False,
            "max_score": 100,
            "is_published": True
        }, headers={"Authorization": "Bearer fake-token"})
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Cloud Deployment Project"
        assert data["class_id"] == 1
    finally:
        main.verify_instructor_in_class_service = original_verify


def test_list_assignments(client, db_session):
    from datetime import datetime, timezone
    asn = Assignment(
        class_id=1,
        title="Test Assignment",
        description="Desc",
        deadline=datetime.now(timezone.utc),
        allow_late_submission=False,
        max_score=100,
        created_by=1,
        is_published=True
    )
    db_session.add(asn)
    db_session.commit()

    response = client.get("/classes/1/assignments", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["assignments"][0]["title"] == "Test Assignment"
