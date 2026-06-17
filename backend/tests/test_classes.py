"""Test class capacity and student enrollment endpoints."""
import pytest


def test_class_capacity_limit(client, instructor_headers, student1_headers, student2_headers):
    """Test batas kapasitas kelas (max_students)."""
    # 1. Dosen membuat kelas dengan kapasitas max_students = 1
    user_response = client.get("/auth/me", headers=instructor_headers)
    instructor_id = user_response.json()["id"]
    
    class_response = client.post("/classes", json={
        "name": "Cloud Computing Special",
        "code": "TK399",
        "description": "Class with 1 student limit",
        "semester": 5,
        "academic_year": "2024/2025",
        "max_students": 1,
        "instructor_id": instructor_id
    }, headers=instructor_headers)
    assert class_response.status_code == 201
    class_id = class_response.json()["id"]

    # Dapatkan ID student 1 dan student 2
    student1_id = client.get("/auth/me", headers=student1_headers).json()["id"]
    student2_id = client.get("/auth/me", headers=student2_headers).json()["id"]

    # 2. Tambahkan student 1 (berhasil)
    response_s1 = client.post(f"/classes/{class_id}/students/{student1_id}", headers=instructor_headers)
    assert response_s1.status_code == 201

    # 3. Tambahkan student 2 (gagal karena kapasitas penuh)
    response_s2 = client.post(f"/classes/{class_id}/students/{student2_id}", headers=instructor_headers)
    assert response_s2.status_code == 400
    assert "Kelas sudah penuh" in response_s2.json()["detail"]

    # 4. Tambahkan student 1 lagi (gagal karena sudah terdaftar, bukan karena kapasitas)
    response_s1_again = client.post(f"/classes/{class_id}/students/{student1_id}", headers=instructor_headers)
    assert response_s1_again.status_code == 400
    assert "sudah ada" in response_s1_again.json()["detail"]
