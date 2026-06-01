"""Test assignment CRUD endpoints."""


def test_create_assignment_success(client, instructor_headers, test_class):
    """Test membuat assignment baru → 201."""
    class_id = test_class["id"]
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Cloud Deployment Project",
        "description": "Deploy aplikasi ke cloud platform",
        "deadline": "2024-12-31T23:59:59+08:00",
        "allow_late_submission": False,
        "max_score": 100,
        "is_published": True
    }, headers=instructor_headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Cloud Deployment Project"
    assert data["class_id"] == class_id
    assert data["max_score"] == 100
    assert data["allow_late_submission"] == False
    assert "id" in data


def test_create_assignment_unauthorized_student(client, student1_headers, test_class):
    """Test student tidak bisa membuat assignment → 403."""
    class_id = test_class["id"]
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Unauthorized Assignment",
        "deadline": "2024-12-31T23:59:59+08:00",
        "max_score": 100
    }, headers=student1_headers)
    
    assert response.status_code == 403


def test_create_assignment_unauthorized_different_instructor(client, instructor_headers, test_class):
    """Test instructor tidak bisa membuat assignment untuk class orang lain."""
    # Register instructor kedua
    client.post("/auth/register", json={
        "email": "instructor2@example.com",
        "password": "Pass123!",
        "name": "Instructor 2",
        "role": "dosen"
    })
    response = client.post("/auth/login", json={
        "email": "instructor2@example.com",
        "password": "Pass123!"
    })
    instructor2_token = response.json()["access_token"]
    instructor2_headers = {"Authorization": f"Bearer {instructor2_token}"}
    
    class_id = test_class["id"]
    response = client.post(f"/classes/{class_id}/assignments", json={
        "title": "Unauthorized Assignment",
        "deadline": "2024-12-31T23:59:59+08:00",
        "max_score": 100
    }, headers=instructor2_headers)
    
    assert response.status_code == 403


def test_list_assignments(client, instructor_headers, assignment_future_deadline):
    """Test mengambil daftar assignments."""
    class_id = assignment_future_deadline["class_id"]
    response = client.get(f"/classes/{class_id}/assignments", headers=instructor_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["assignments"]) >= 1
    assert data["assignments"][0]["title"] == "Future Assignment"


def test_get_assignment_detail(client, instructor_headers, assignment_future_deadline):
    """Test mengambil detail assignment."""
    class_id = assignment_future_deadline["class_id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}",
        headers=instructor_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == assignment_id
    assert data["title"] == "Future Assignment"


def test_update_assignment_success(client, instructor_headers, assignment_future_deadline):
    """Test update assignment oleh instructor owner."""
    class_id = assignment_future_deadline["class_id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.put(
        f"/classes/{class_id}/assignments/{assignment_id}",
        json={
            "title": "Updated Title",
            "max_score": 85
        },
        headers=instructor_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["max_score"] == 85


def test_update_assignment_unauthorized(client, student1_headers, assignment_future_deadline):
    """Test student tidak bisa update assignment."""
    class_id = assignment_future_deadline["class_id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.put(
        f"/classes/{class_id}/assignments/{assignment_id}",
        json={"title": "Hacked"},
        headers=student1_headers
    )
    
    assert response.status_code == 403


def test_delete_assignment_success(client, instructor_headers, assignment_future_deadline):
    """Test delete assignment oleh instructor owner."""
    class_id = assignment_future_deadline["class_id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.delete(
        f"/classes/{class_id}/assignments/{assignment_id}",
        headers=instructor_headers
    )
    
    assert response.status_code == 204
    
    # Verify sudah tidak ada
    get_response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}",
        headers=instructor_headers
    )
    assert get_response.status_code == 404


def test_delete_assignment_unauthorized(client, student1_headers, assignment_future_deadline):
    """Test student tidak bisa delete assignment."""
    class_id = assignment_future_deadline["class_id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.delete(
        f"/classes/{class_id}/assignments/{assignment_id}",
        headers=student1_headers
    )
    
    assert response.status_code == 403
