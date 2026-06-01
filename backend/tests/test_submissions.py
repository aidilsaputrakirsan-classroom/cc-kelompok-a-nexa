"""Test submission endpoints."""


def test_submit_assignment_before_deadline(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test submit assignment sebelum deadline → 201."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["assignment_id"] == assignment_id
    assert data["original_filename"] == "essay.pdf"
    assert data["is_late"] == False
    assert "id" in data
    assert data["submission_number"] == 1


def test_submit_assignment_after_deadline_not_allowed(
    client, student1_headers, test_class_with_students,
    assignment_past_deadline, test_pdf_file
):
    """Test submit assignment setelah deadline (not allowed) → 400."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_past_deadline["id"]
    
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    
    assert response.status_code == 400
    assert "Deadline sudah terlewat" in response.json()["detail"]


def test_submit_assignment_after_deadline_allowed(
    client, student1_headers, test_class_with_students,
    assignment_past_deadline_allow_late, test_pdf_file
):
    """Test submit assignment setelah deadline (allowed) → 201."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_past_deadline_allow_late["id"]
    
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["is_late"] == True


def test_submit_assignment_invalid_file_type(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline
):
    """Test submit file bukan PDF → 400."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    from io import BytesIO
    txt_file = BytesIO(b"This is a text file")
    
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.txt", txt_file, "text/plain")},
        headers=student1_headers
    )
    
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


def test_submit_assignment_file_too_large(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline
):
    """Test submit file > 2MB → 400."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    from io import BytesIO
    # Create file larger than 2MB
    large_file = BytesIO(b"x" * (3 * 1024 * 1024))
    
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("large.pdf", large_file, "application/pdf")},
        headers=student1_headers
    )
    
    assert response.status_code == 400
    assert "2MB" in response.json()["detail"]


def test_resubmit_assignment(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test resubmit assignment (old file diganti)."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit first time
    response1 = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay_v1.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    assert response1.status_code == 201
    submission_id_1 = response1.json()["id"]
    
    # Submit second time (resubmit)
    test_pdf_file.seek(0)  # Reset file pointer
    response2 = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay_v2.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    assert response2.status_code == 201
    submission_id_2 = response2.json()["id"]
    
    # New submission should be different ID
    assert submission_id_1 != submission_id_2


def test_get_my_submission(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test student lihat submission sendiri."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit
    client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    
    # Get my submission
    response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}/my-submission",
        headers=student1_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["original_filename"] == "essay.pdf"
    assert data["score"] == None  # Not graded yet


def test_get_my_submission_not_submitted(
    client, student1_headers, test_class_with_students, assignment_future_deadline
):
    """Test student belum submit, get null."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}/my-submission",
        headers=student1_headers
    )
    
    assert response.status_code == 200
    assert response.json() is None


def test_list_submissions_instructor(
    client, instructor_headers, student1_headers, student2_headers,
    test_class_with_students, assignment_future_deadline, test_pdf_file
):
    """Test instructor lihat semua submissions."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Student 1 dan 2 submit
    test_pdf_file.seek(0)
    client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("s1.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    
    test_pdf_file.seek(0)
    client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("s2.pdf", test_pdf_file, "application/pdf")},
        headers=student2_headers
    )
    
    # List submissions
    response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        headers=instructor_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["submissions"]) == 2


def test_list_submissions_student_unauthorized(
    client, student1_headers, test_class_with_students, assignment_future_deadline
):
    """Test student tidak bisa list semua submissions."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    response = client.get(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        headers=student1_headers
    )
    
    assert response.status_code == 403


def test_get_submission_detail(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test instructor lihat detail submission."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Get detail
    response = client.get(
        f"/submissions/{submission_id}",
        headers=instructor_headers
    )
    
    assert response.status_code == 200
    assert response.json()["id"] == submission_id


def test_get_submission_detail_student_own(
    client, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test student lihat detail submission sendiri."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Get detail
    response = client.get(
        f"/submissions/{submission_id}",
        headers=student1_headers
    )
    
    assert response.status_code == 200


def test_get_submission_detail_student_not_own(
    client, student1_headers, student2_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test student tidak bisa lihat submission orang lain."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Student 1 submit
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Student 2 coba lihat
    response = client.get(
        f"/submissions/{submission_id}",
        headers=student2_headers
    )
    
    assert response.status_code == 403


def test_return_submission(
    client, instructor_headers, student1_headers, test_class_with_students,
    assignment_future_deadline, test_pdf_file
):
    """Test instructor return submission untuk resubmit."""
    class_id = test_class_with_students["id"]
    assignment_id = assignment_future_deadline["id"]
    
    # Submit
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    submission_id = response.json()["id"]
    
    # Return submission
    response = client.delete(
        f"/submissions/{submission_id}/return",
        headers=instructor_headers
    )
    
    assert response.status_code == 204
    
    # Verify student bisa submit lagi
    test_pdf_file.seek(0)
    response = client.post(
        f"/classes/{class_id}/assignments/{assignment_id}/submissions",
        files={"file": ("essay_v2.pdf", test_pdf_file, "application/pdf")},
        headers=student1_headers
    )
    assert response.status_code == 201
