"""Test grading endpoints."""


def test_submit_grade_success(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test submit grade → 201."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit assignment
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Grade submission
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=instructor_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["score"] == 85.0
    assert data["submission_id"] == submission_id
    assert "graded_at" in data


def test_submit_grade_out_of_range(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test submit grade > max_score → 400."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit assignment
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Try to grade with score > max_score (100)
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 150.0},
        headers=instructor_headers
    )
    
    assert response.status_code == 400
    assert "Score harus antara" in response.json()["detail"]


def test_submit_grade_negative_score(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test submit grade < 0 → 400."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit assignment
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Try to grade with negative score
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": -10.0},
        headers=instructor_headers
    )
    
    assert response.status_code == 400


def test_update_grade(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test update grade (re-grade)."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit assignment
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Grade dengan score 85
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=instructor_headers
    )
    assert response.status_code == 201
    grade_id = response.json()["id"]
    
    # Update grade ke 90
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 90.0},
        headers=instructor_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["score"] == 90.0
    # Grade ID should be same (updated, not created new)
    assert data["id"] == grade_id


def test_get_grade_student_own(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test student lihat grade sendiri."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit assignment
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Grade
    client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=instructor_headers
    )
    
    # Student lihat grade
    response = client.get(
        f"/submissions/{submission_id}/grade",
        headers=student1_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 85.0


def test_get_grade_student_not_own(
    client, instructor_headers, student1_headers, student2_headers,
    test_class_with_students, assignment_future_deadline, test_pdf_file
):
    """Test student tidak bisa lihat grade orang lain."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Student 1 submit & grade
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=instructor_headers
    )
    
    # Student 2 coba lihat grade student 1
    response = client.get(
        f"/submissions/{submission_id}/grade",
        headers=student2_headers
    )
    
    assert response.status_code == 403


def test_get_grade_instructor(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test instructor lihat grade submission."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit & grade
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=instructor_headers
    )
    
    # Instructor lihat grade
    response = client.get(
        f"/submissions/{submission_id}/grade",
        headers=instructor_headers
    )
    
    assert response.status_code == 200
    assert response.json()["score"] == 85.0


def test_get_grade_not_graded_yet(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test get grade sebelum di-grade → 404."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit tapi belum di-grade
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Get grade
    response = client.get(
        f"/submissions/{submission_id}/grade",
        headers=student1_headers
    )
    
    assert response.status_code == 404


def test_student_cannot_grade(
    client, student1_headers, student2_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test student tidak bisa submit grade."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Student 1 submit
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Student 2 coba grade
    response = client.post(
        f"/submissions/{submission_id}/grade",
        json={"score": 85.0},
        headers=student2_headers
    )
    
    assert response.status_code == 403
