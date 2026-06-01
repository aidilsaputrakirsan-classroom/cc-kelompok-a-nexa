# Assignment Feature API Documentation

**Last Updated:** June 1, 2026  
**Status:** ✅ Ready for Frontend Integration

---

## Overview

This document describes all assignment-related API endpoints for the Studyfy LMS Assignment Feature.

### Key Features
- Instructors can create, update, delete assignments with deadlines
- Students can submit PDF files (max 2MB) with automatic deadline checking
- Instructors can grade submissions with scores (0-100 points)
- Late submission tracking (configurable by instructor)
- Automatic file management (old submissions deleted on resubmit)
- Timezone: **WITA (UTC+8)** for all deadline calculations

---

## Base URL
```
http://localhost:8000
```

### Authentication
All endpoints (except /health and /auth/*) require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. ASSIGNMENT MANAGEMENT (Instructor Only)

### Create Assignment
```http
POST /classes/{class_id}/assignments
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Cloud Deployment Project",
  "description": "Deploy aplikasi ke cloud platform",
  "deadline": "2024-05-01T23:59:59+08:00",
  "allow_late_submission": false,
  "max_score": 100,
  "is_published": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "class_id": 1,
  "title": "Cloud Deployment Project",
  "description": "Deploy aplikasi ke cloud platform",
  "deadline": "2024-05-01T23:59:59+08:00",
  "allow_late_submission": false,
  "max_score": 100,
  "is_published": true,
  "created_by": 1,
  "created_at": "2024-04-19T10:30:00+08:00",
  "updated_at": null
}
```

**Errors:**
- `404 Class tidak ditemukan` - class doesn't exist
- `403 Anda hanya bisa membuat assignment untuk kelas Anda sendiri` - not the instructor

---

### List Assignments
```http
GET /classes/{class_id}/assignments?skip=0&limit=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total": 5,
  "assignments": [
    {
      "id": 1,
      "class_id": 1,
      "title": "Cloud Deployment Project",
      "description": "Deploy aplikasi ke cloud platform",
      "deadline": "2024-05-01T23:59:59+08:00",
      "allow_late_submission": false,
      "max_score": 100,
      "is_published": true,
      "created_by": 1,
      "created_at": "2024-04-19T10:30:00+08:00",
      "updated_at": null
    }
  ]
}
```

---

### Get Assignment Detail
```http
GET /classes/{class_id}/assignments/{assignment_id}
Authorization: Bearer <token>
```

**Response (200):** Same as single assignment in list response

**Errors:**
- `404 Assignment tidak ditemukan` - assignment doesn't exist or not in this class

---

### Update Assignment
```http
PUT /classes/{class_id}/assignments/{assignment_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "description": "Updated description",
  "deadline": "2024-05-05T23:59:59+08:00",
  "allow_late_submission": true,
  "max_score": 100,
  "is_published": true
}
```

**Response (200):** Updated assignment object

**Errors:**
- `404 Assignment tidak ditemukan`
- `403 Anda hanya bisa mengubah assignment Anda sendiri` - not the creator

---

### Delete Assignment
```http
DELETE /classes/{class_id}/assignments/{assignment_id}
Authorization: Bearer <token>
```

**Response (204):** No content

**Errors:**
- `404 Assignment tidak ditemukan`
- `403 Anda hanya bisa menghapus assignment Anda sendiri`

---

## 2. SUBMISSION MANAGEMENT (Students + Instructors)

### Submit Assignment
```http
POST /classes/{class_id}/assignments/{assignment_id}/submissions
Content-Type: multipart/form-data
Authorization: Bearer <token>

File: <PDF file (max 2MB)>
```

**Response (201):**
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 5,
  "original_filename": "my-essay.pdf",
  "file_size": 1048576,
  "submission_number": 1,
  "submitted_at": "2024-04-25T15:30:00+08:00",
  "is_late": false,
  "created_at": "2024-04-25T15:30:00+08:00"
}
```

**Errors:**
- `404 Class tidak ditemukan`
- `404 Assignment tidak ditemukan`
- `403 Anda tidak terdaftar di class ini` - not enrolled
- `403 Hanya mahasiswa yang bisa submit assignment` - not a student
- `400 Hanya file PDF yang diperbolehkan` - wrong file type
- `400 Ukuran file maksimal 2MB` - file too large
- `400 Deadline sudah terlewat dan tidak menerima submission terlambat` - late & not allowed

**Important Notes:**
- Only PDF files allowed
- Maximum file size: 2MB
- If student resubmits, old file is automatically deleted
- `is_late` is automatically calculated based on deadline
- Requires confirmation from frontend (see UI section)

---

### Get My Submission
```http
GET /classes/{class_id}/assignments/{assignment_id}/my-submission
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 5,
  "original_filename": "my-essay.pdf",
  "file_size": 1048576,
  "submission_number": 1,
  "submitted_at": "2024-04-25T15:30:00+08:00",
  "is_late": false,
  "created_at": "2024-04-25T15:30:00+08:00",
  "score": 85.0,
  "graded_at": "2024-04-26T10:00:00+08:00"
}
```

**Response (200 - Not Submitted Yet):**
```
null
```

**Response (200 - Submitted but Not Graded):**
```json
{
  ...same as above but...
  "score": null,
  "graded_at": null
}
```

**Notes:**
- Returns student's own submission
- Includes grade if instructor has graded it
- Returns null if no submission yet

---

### Get Submission Detail (Instructor View)
```http
GET /submissions/{submission_id}
Authorization: Bearer <token>
```

**Response (200):** Submission object

**Errors:**
- `404 Submission tidak ditemukan`
- `403 Anda tidak bisa melihat submission ini` - no permission

---

### List All Submissions for Assignment (Instructor Only)
```http
GET /classes/{class_id}/assignments/{assignment_id}/submissions?skip=0&limit=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total": 24,
  "submissions": [
    {
      "id": 1,
      "assignment_id": 1,
      "student_id": 5,
      "original_filename": "my-essay.pdf",
      "file_size": 1048576,
      "submission_number": 1,
      "submitted_at": "2024-04-25T15:30:00+08:00",
      "is_late": false,
      "created_at": "2024-04-25T15:30:00+08:00"
    }
  ]
}
```

**Errors:**
- `404 Assignment tidak ditemukan`
- `403 Anda hanya bisa lihat submissions untuk assignment Anda` - not the creator

---

### Return Submission for Resubmission (Instructor Only)
```http
DELETE /submissions/{submission_id}/return
Authorization: Bearer <token>
```

**Response (204):** No content

**What Happens:**
- Deletes the submission record from database
- Deletes the uploaded file from disk
- Student can now submit again
- No new grade needed (if instructor wants to re-grade a new submission)

**Errors:**
- `404 Submission tidak ditemukan`
- `403 Anda hanya bisa return submission untuk assignment Anda` - not the creator
- `500 Gagal return submission` - server error

---

## 3. GRADING (Instructor Only)

### Submit/Update Grade
```http
POST /submissions/{submission_id}/grade
Content-Type: application/json
Authorization: Bearer <token>

{
  "score": 85.0
}
```

**Response (201):**
```json
{
  "id": 1,
  "submission_id": 1,
  "score": 85.0,
  "graded_by": 1,
  "graded_at": "2024-04-26T10:00:00+08:00",
  "created_at": "2024-04-26T10:00:00+08:00"
}
```

**Errors:**
- `404 Submission tidak ditemukan`
- `403 Anda hanya bisa grade submission untuk assignment Anda` - not creator of assignment
- `400 Score harus antara 0 dan {max_score}` - score out of range

**Notes:**
- If grade already exists, it will be updated (not created twice)
- Score must be 0-100 (or whatever max_score is set to)
- Grade becomes visible to student immediately
- `graded_at` is auto-set to current time

---

### Get Grade
```http
GET /submissions/{submission_id}/grade
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "submission_id": 1,
  "score": 85.0,
  "graded_by": 1,
  "graded_at": "2024-04-26T10:00:00+08:00",
  "created_at": "2024-04-26T10:00:00+08:00"
}
```

**Errors:**
- `404 Submission tidak ditemukan`
- `403 Anda tidak bisa melihat grade submission ini` - no permission
- `404 Grade belum ada untuk submission ini` - not graded yet

**Notes:**
- Student can see own grade
- Instructor can see any grade for their assignments

---

## User Roles & Permissions

### Instructor (DOSEN)
✅ Can:
- Create, update, delete assignments
- View all submissions for their assignments
- View all grades
- Submit/update grades for their assignments
- Return submissions for resubmission

❌ Cannot:
- Submit assignments
- See other instructors' assignments (except admin)

### Student (MAHASISWA)
✅ Can:
- View assignments for classes they're enrolled in
- Submit assignments
- View their own submissions
- View their own grades

❌ Cannot:
- See other students' submissions/grades
- Grade assignments
- Create/modify assignments

### Admin
✅ Can:
- Everything (all endpoints)

---

## File Upload Behavior

### Storage Path
```
/uploads/assignments/{class_id}/{assignment_id}/{student_id}/{original_filename}
```

Example:
```
/uploads/assignments/1/5/10/my-essay.pdf
```

### Resubmission Logic
1. Student submits file 1st time → stored
2. Student submits file 2nd time → old file deleted, new file stored
3. System always keeps only the LATEST submission
4. `submission_number` always = 1 (latest)

### File Validation
- **Type:** PDF only (`.pdf` extension required)
- **Size:** Maximum 2MB
- **Naming:** Original filename preserved

---

## Deadline & Late Submission Logic

### Scenario 1: Allow Late = FALSE
```
Current Time: 2024-04-26 10:00 WITA
Deadline:     2024-04-25 23:59 WITA
allow_late_submission: false

Result: ❌ ERROR - "Deadline sudah terlewat dan tidak menerima submission terlambat"
```

### Scenario 2: Allow Late = TRUE
```
Current Time: 2024-04-26 10:00 WITA
Deadline:     2024-04-25 23:59 WITA
allow_late_submission: true

Result: ✅ Submission accepted
        is_late: true
        File stored, student notified
```

### Scenario 3: Before Deadline
```
Current Time: 2024-04-25 15:00 WITA
Deadline:     2024-04-25 23:59 WITA
allow_late_submission: false or true

Result: ✅ Submission accepted
        is_late: false
```

---

## Frontend Integration Checklist

### Student UI Components Needed
- [ ] Assignment list for class
- [ ] Assignment detail view (title, description, deadline, max_score)
- [ ] Submission form with file picker
- [ ] **Confirmation dialog before submit:** "Are you sure you want to submit? This action cannot be undone."
- [ ] My submission status (submitted_at, is_late, score if graded)
- [ ] Grade display (score/max_score) after grading

### Instructor UI Components Needed
- [ ] Create assignment form (title, deadline, allow_late_submission, max_score)
- [ ] Edit assignment form
- [ ] Assignment list with submission count
- [ ] Submissions list with sorting/filtering
- [ ] Submission detail view
- [ ] Grade submission form (score input)
- [ ] Grade display
- [ ] "Return for Resubmission" button (delete submission)

### Important UI Behaviors
1. **Before Deadline:**
   - Submit button is ENABLED

2. **After Deadline + allow_late=FALSE:**
   - Submit button is DISABLED or shows error message
   - Message: "Deadline passed - no late submissions allowed"

3. **After Deadline + allow_late=TRUE:**
   - Submit button is ENABLED
   - Warning message: "You are submitting after the deadline"
   - `is_late` will be flagged in system

4. **Confirmation Prompt:**
   - Show dialog before any submission
   - Message: "Are you sure you want to submit? You will not be able to change your submission unless the instructor returns it."
   - Buttons: [Cancel] [Confirm Submit]

5. **Grade Display:**
   - Show score immediately after instructor grades
   - Format: "Score: 85/100" or "Score: 85 points"

---

## Error Response Format

All error responses follow this format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `201` - Created successfully
- `200` - OK / Retrieved successfully
- `204` - Deleted successfully (no content)
- `400` - Bad request (validation error, file too large, etc.)
- `403` - Forbidden (not authorized for this action)
- `404` - Not found (assignment, submission, grade doesn't exist)
- `500` - Server error

---

## Example Flow: Student Submitting Assignment

```
1. Student views assignment
   GET /classes/1/assignments/5
   Response: Assignment details with deadline

2. Student picks file and clicks Submit
   POST /classes/1/assignments/5/submissions
   - Validate deadline (allow_late check)
   - Validate file (PDF, 2MB)
   - Save file to disk
   - Create submission record
   Response: Submission confirmed

3. Student views their submission
   GET /classes/1/assignments/5/my-submission
   Response: Submission details (no grade yet)

4. Instructor grades the submission
   POST /submissions/1/grade
   Request: { "score": 85.0 }
   Response: Grade confirmed

5. Student views their grade
   GET /classes/1/assignments/5/my-submission
   Response: Submission WITH score and graded_at
```

---

## Example Flow: Instructor Managing Submissions

```
1. Instructor views all submissions
   GET /classes/1/assignments/5/submissions
   Response: List of 24 submissions

2. Instructor views specific submission
   GET /submissions/1
   Response: Submission details

3. Instructor grades submission
   POST /submissions/1/grade
   Request: { "score": 75.0 }
   Response: Grade saved

4. Instructor wants student to resubmit
   DELETE /submissions/1/return
   Response: Submission deleted (file also deleted)
   
5. Student can now submit again
   POST /classes/1/assignments/5/submissions
   (Same as before)
```

---

## Notes for Frontend Team

1. **Timezone:** All times are in WITA (UTC+8). The backend handles all calculations in this timezone.
   - When displaying deadlines to students, convert if needed for their local timezone
   - When submitting file, backend calculates is_late based on current WITA time

2. **File Upload:** Use `multipart/form-data` for file uploads, not JSON

3. **Confirmation Dialog:** MUST show before submission - user explicitly confirmed they understand submission is final

4. **Resubmission:** Only possible if instructor returns submission first

5. **Late Submission Behavior:** 
   - Even if deadline passed, student can submit IF `allow_late_submission=true`
   - `is_late` flag indicates late submission for records/grading

6. **Grade Display:** Show score immediately after grading (no refresh needed if using polling)

---

## Testing Endpoints

### Quick Test Commands (using curl)

```bash
# Register as instructor
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@test.com","password":"Pass123!","name":"Instructor","role":"dosen"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@test.com","password":"Pass123!"}'

# Create assignment
curl -X POST http://localhost:8000/classes/1/assignments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","deadline":"2025-12-31T23:59:59+08:00","max_score":100}'

# Submit assignment
curl -X POST http://localhost:8000/classes/1/assignments/1/submissions \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf"

# Grade submission
curl -X POST http://localhost:8000/submissions/1/grade \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"score":85}'
```

---

**Ready for Frontend Integration!** 🚀

If you have questions about any endpoint, please clarify with the backend team before starting frontend implementation.
