import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db, engine
from main import app

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_register_login(client, db_session):
    # Register
    reg_response = client.post("/register", json={
        "email": "dosen@example.com",
        "name": "Dosen Test",
        "password": "Password123!",
        "role": "dosen"
    })
    assert reg_response.status_code == 201
    
    # Login
    login_response = client.post("/login", json={
        "email": "dosen@example.com",
        "password": "Password123!"
    })
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    
    # Verify
    verify_response = client.get("/verify", headers={
        "Authorization": f"Bearer {token_data['access_token']}"
    })
    assert verify_response.status_code == 200
    verify_data = verify_response.json()
    assert verify_data["email"] == "dosen@example.com"
    assert verify_data["role"] == "dosen"
