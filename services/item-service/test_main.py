import os
# Set database URL in environment before importing database models/app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db, engine
from main import app
from models import Item
from auth_client import verify_token_with_auth_service

# Setup TestingSessionLocal using the engine initialized in database.py
# (since we set the environment variable, database.py's engine will use sqlite:///./test.db)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Mocked user information
MOCK_USER = {"user_id": 1, "email": "test@example.com", "name": "Test User"}


async def mock_verify_token_with_auth_service():
    return MOCK_USER


@pytest.fixture(scope="function")
def db_session():
    """Create a clean database for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient with overridden get_db and verify_token_with_auth_service."""
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


def test_get_item_stats(client, db_session):
    # Setup test items for our mocked user (user_id = 1)
    item1 = Item(name="Laptop", description="Core i7", price=15000000.0, quantity=2, owner_id=1)
    item2 = Item(name="Mouse", description="Wireless", price=250000.0, quantity=5, owner_id=1)
    # Also add an item belonging to another user to ensure stats are filtered correctly
    item3 = Item(name="Keyboard", description="Mechanical", price=500000.0, quantity=3, owner_id=2)
    
    db_session.add(item1)
    db_session.add(item2)
    db_session.add(item3)
    db_session.commit()

    # Request stats
    response = client.get("/items/stats", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 200
    data = response.json()

    assert data["total_items"] == 2
    assert data["total_value"] == (15000000.0 * 2) + (250000.0 * 5)
    assert data["termahal"] == 15000000.0
    assert data["termurah"] == 250000.0


def test_get_item_stats_empty(client):
    # Request stats on an empty database
    response = client.get("/items/stats", headers={"Authorization": "Bearer fake-token"})
    assert response.status_code == 200
    data = response.json()

    assert data["total_items"] == 0
    assert data["total_value"] == 0.0
    assert data["termahal"] == 0.0
    assert data["termurah"] == 0.0
