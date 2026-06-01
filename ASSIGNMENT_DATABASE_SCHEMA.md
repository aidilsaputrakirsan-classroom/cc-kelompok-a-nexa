# Assignment Feature - Database Schema

## New Tables

### 1. assignments
```sql
CREATE TABLE assignments (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL (FK → classes.id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline DATETIME NOT NULL,  -- UTC+8 WITA
  allow_late_submission BOOLEAN DEFAULT FALSE,
  max_score INTEGER DEFAULT 100,
  created_by INTEGER NOT NULL (FK → users.id),
  is_published BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id`: Unique identifier
- `class_id`: References the class this assignment belongs to
- `title`: Assignment title (e.g., "Cloud Deployment Project")
- `description`: Assignment instructions/details
- `deadline`: Submission deadline (stored with timezone info)
- `allow_late_submission`: If TRUE, students can submit after deadline
- `max_score`: Maximum points for this assignment (default 100)
- `created_by`: ID of instructor who created assignment
- `is_published`: If FALSE, assignment hidden from students
- `created_at`, `updated_at`: Timestamps

---

### 2. submissions
```sql
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY,
  assignment_id INTEGER NOT NULL (FK → assignments.id),
  student_id INTEGER NOT NULL (FK → users.id),
  file_path VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  submission_number INTEGER DEFAULT 1,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_late BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)  -- One submission per student per assignment
)
```

**Fields:**
- `id`: Unique identifier
- `assignment_id`: References the assignment
- `student_id`: References the student who submitted
- `file_path`: Full path to submitted file (e.g., `/uploads/assignments/1/5/10/my-essay.pdf`)
- `original_filename`: Original filename uploaded by student (e.g., `my-essay.pdf`)
- `file_size`: File size in bytes
- `submission_number`: Always 1 for latest submission (old ones deleted)
- `submitted_at`: When student submitted (auto-calculated with timezone)
- `is_late`: Automatically flagged TRUE if submitted after deadline
- `created_at`, `updated_at`: Timestamps
- **UNIQUE constraint:** Ensures only one submission per student per assignment at any time

**Important Notes:**
- When student resubmits, the old record is DELETED (not updated)
- New submission always has `submission_number=1`
- `is_late` is calculated at submission time based on deadline
- `file_path` includes student_id for organization

---

### 3. grades
```sql
CREATE TABLE grades (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL (FK → submissions.id),
  score FLOAT NOT NULL,
  graded_by INTEGER NOT NULL (FK → users.id),
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id)  -- One grade per submission
)
```

**Fields:**
- `id`: Unique identifier
- `submission_id`: References the submission being graded
- `score`: Score given (0-100 or up to max_score)
- `graded_by`: ID of instructor who graded
- `graded_at`: When instructor graded (auto-set to current time)
- `created_at`, `updated_at`: Timestamps
- **UNIQUE constraint:** One grade per submission (updating overwrites old grade)

**Important Notes:**
- When instructor grades, if grade already exists, it's updated (not created again)
- Grade visibility: Student can see their own grades, instructor can see all grades for their assignments
- `graded_at` field indicates submission has been graded (NULL = not graded)

---

## Relationships (Entity Relationship Diagram)

```
┌─────────────┐
│   classes   │
└──────┬──────┘
       │ 1
       │ (class_id)
       │ ┌────────────────────────┐
       │ │
       ├─┤ N  ┌─────────────────┐
       │      │  assignments    │
       │      └────────┬────────┘
       │               │ 1
       │               │ (assignment_id)
       │               │
       │               ├─┐ N
       │               │ └─────────────────────┐
       │               │                       │
       │               │                  ┌────┴──────────┐
       │               │                  │  submissions   │
       │               │                  └────┬──────────┘
       │               │                       │ 1
       │               │                       │ (submission_id)
       │               │                       │
       │               │                       └─┐
       │               │                         │ N
       │               │                         │
       │               │                    ┌────┴─────┐
       │               │                    │  grades   │
       │               │                    └───────────┘
       │               │
       │       ┌───────┴──────────┐
       │       │ created_by (FK)  │
       │       │ instructors      │
       │       └──────────────────┘
       │
       └──┐
          │
    ┌─────┴────────┐
    │    users     │
    └──────────────┘
         ▲
         │
    ┌────┴────────────┐
    │ Many-to-Many    │
    │ (students in    │
    │  classes)       │
    └─────────────────┘
```

---

## Data Flow Example

### Student Submitting Assignment

```
1. Student submits file
   → INSERT into submissions
   {
     assignment_id: 5,
     student_id: 10,
     file_path: "/uploads/assignments/1/5/10/essay.pdf",
     original_filename: "essay.pdf",
     file_size: 1048576,
     submission_number: 1,
     submitted_at: "2024-04-25 15:30:00",
     is_late: false
   }

2. If student resubmits
   → DELETE old submission (file also deleted from disk)
   → INSERT new submission (same structure, fresh timestamp)
   
3. Instructor grades
   → INSERT into grades (or UPDATE if exists)
   {
     submission_id: 1,
     score: 85.0,
     graded_by: 1,
     graded_at: "2024-04-26 10:00:00"
   }

4. Student views their submission with grade
   → SELECT submission WHERE assignment_id=5 AND student_id=10
   → LEFT JOIN grades ON submission.id = grades.submission_id
   → Student sees: submission details + score
```

---

## Constraints & Validations

### Database Constraints
1. **Non-null constraints:**
   - assignment.class_id, title, deadline, created_by
   - submission.assignment_id, student_id, file_path, original_filename, file_size, submitted_at
   - grade.submission_id, score, graded_by, graded_at

2. **Foreign Key constraints:**
   - assignment.class_id → classes.id
   - assignment.created_by → users.id
   - submission.assignment_id → assignments.id
   - submission.student_id → users.id
   - grade.submission_id → submissions.id
   - grade.graded_by → users.id

3. **Unique constraints:**
   - submissions(assignment_id, student_id) - one submission per student per assignment
   - grades(submission_id) - one grade per submission

### Application-Level Validations
1. **File upload:**
   - PDF only (.pdf extension)
   - Max 2MB size
   - Validated in API endpoint

2. **Deadline checking:**
   - Compared with WITA timezone
   - If past deadline and `allow_late_submission=false` → reject
   - If past deadline and `allow_late_submission=true` → accept, flag `is_late=true`

3. **Score validation:**
   - Must be 0 to max_score
   - Validated in API endpoint

4. **Authorization:**
   - Student can only submit to classes they're enrolled in
   - Instructor can only manage own assignments
   - Student can only view own submissions/grades

---

## Migration Notes

If this feature is being added to an existing database:

```sql
-- Create assignments table
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_late_submission BOOLEAN DEFAULT FALSE,
  max_score INTEGER DEFAULT 100,
  created_by INTEGER NOT NULL REFERENCES users(id),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  file_path VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  submission_number INTEGER DEFAULT 1,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- Create grades table
CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  score FLOAT NOT NULL,
  graded_by INTEGER NOT NULL REFERENCES users(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id)
);

-- Create indexes for common queries
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_grades_submission_id ON grades(submission_id);
```

---

## Summary

**3 new tables:**
- `assignments` - stores assignment metadata
- `submissions` - stores student submissions (only latest kept per student per assignment)
- `grades` - stores grades/scores (one per submission)

**Key relationships:**
- Class → Assignments (1:N)
- Assignment → Submissions (1:N)
- Submission → Grade (1:1)
- User → Assignments (as creator)
- User → Submissions (as student)
- User → Grades (as grader)

**Storage:**
- Files stored locally in `/uploads/assignments/{class_id}/{assignment_id}/{student_id}/`
- Database stores only file path and metadata
- Old files automatically deleted on resubmission
