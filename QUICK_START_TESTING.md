# Quick Start: Testing New User Management Features

## Setup Instructions

### 1. Database Migration
When the application starts, SQLAlchemy will automatically create the new tables:
- ✅ Added columns to `users` table
- ✅ Created `classes` table  
- ✅ Created `user_class_association` table

**No manual SQL required** if using SQLAlchemy's auto-create.

### 2. First Admin Setup
```bash
# Start the backend
cd backend
python -m uvicorn main:app --reload

# In your API client (Postman/Insomnia/curl):

# 1. Register as normal user
POST http://localhost:8000/auth/register
Content-Type: application/json

{
    "email": "admin@example.com",
    "name": "System Administrator",
    "password": "AdminPass@123"
}

# Note: Response will show role: "mahasiswa" (default)

# 2-3. Set role to admin (manual database update for first admin)
# Using psql or database client:
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

# 4. Now admin can login and has full access
POST http://localhost:8000/auth/login
{
    "email": "admin@example.com",
    "password": "AdminPass@123"
}

# Response includes: { access_token, token_type, user: { role: "admin", ... }}
```

---

## Testing Each Feature

### Feature 1: Role-Based Access Control (RBAC)

#### 1a. Test Admin Creating a Class
```bash
# 1. Login as admin (use token from above)
COPY: "access_token" value from login response

# 2. Create a class (admin only endpoint)
POST http://localhost:8000/classes
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "name": "Cloud Computing Fundamentals",
    "code": "TK301",
    "description": "Introduction to cloud computing",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 1,
    "max_students": 40
}

# Response: 201 Created with class details including id
# Note: Keep the returned id (e.g., 1)
```

#### 1b. Test Student Cannot Create Class
```bash
# 1. Register as student (default role)
POST http://localhost:8000/auth/register
{
    "email": "student@example.com",
    "name": "Student User",
    "password": "Student@123"
}

# 2. Login as student
POST http://localhost:8000/auth/login
{
    "email": "student@example.com",
    "password": "Student@123"
}
# Copy the access_token

# 3. Try to create class (should fail)
POST http://localhost:8000/classes
Authorization: Bearer {student_token}
Content-Type: application/json

{
    "name": "Hacker Class",
    "code": "HK999",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 1
}

# Response: 403 Forbidden
# { "detail": "Hanya admin yang dapat mengakses resource ini" }
```

#### 1c. Create Dosen (Instructor) Account
```bash
# 1. Register as dosen
POST http://localhost:8000/auth/register
{
    "email": "dosen@example.com",
    "name": "Dosen Contoh",
    "password": "Dosen@123"
}

# Response: user created with role: "mahasiswa"

# 2. Manually update role to dosen (as admin)
UPDATE users SET role = 'dosen' WHERE email = 'dosen@example.com';

# 3. Login as dosen
POST http://localhost:8000/auth/login
{
    "email": "dosen@example.com",
    "password": "Dosen@123"
}
# Copy the access_token
```

---

### Feature 2: User Profile Management

#### 2a. View Current User Profile
```bash
# Using any logged-in token
GET http://localhost:8000/auth/me
Authorization: Bearer {access_token}

# Response includes full user data with role
```

#### 2b. Get Specific User Profile
```bash
# Admin can view any profile
GET http://localhost:8000/users/profile/1
Authorization: Bearer {admin_token}

# Student can only view their own
GET http://localhost:8000/users/profile/3
Authorization: Bearer {student_token}
# Works if student_id = 3

# Student accessing other user's profile
GET http://localhost:8000/users/profile/2
Authorization: Bearer {student_token}
# Response: 403 Forbidden (unless student_id = 2)
```

#### 2c. Update Your Profile
```bash
# Any logged-in user can update their own profile
PUT http://localhost:8000/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "name": "Updated Name",
    "phone": "+62812345678",
    "address": "Jl. Main Street, Jakarta",
    "profile_picture": "https://example.com/pic.jpg",
    "semester": 5
}

# Response: 200 OK with updated user data
```

---

### Feature 3: Password Reset Flow

#### 3a. Request Password Reset
```bash
# Step 1: Request reset token (public endpoint, no auth needed)
POST http://localhost:8000/auth/password-reset-request
Content-Type: application/json

{
    "email": "student@example.com"
}

# Response: 200 OK
# {
#     "message": "Link reset password telah dikirim ke email Anda",
#     "email": "student@example.com"
# }

# For testing: Get the reset token from database
# SELECT reset_token FROM users WHERE email = 'student@example.com';
```

#### 3b. Verify Token and Reset Password
```bash
# Step 2: Verify token and set new password
POST http://localhost:8000/auth/password-reset-verify
Content-Type: application/json

{
    "email": "student@example.com",
    "reset_token": "paste_token_from_database_here",
    "new_password": "NewPassword@123"
}

# Response: 200 OK with user data
# Reset token automatically cleared from database

# Step 3: Try login with new password
POST http://localhost:8000/auth/login
{
    "email": "student@example.com",
    "password": "NewPassword@123"
}

# Response: 200 OK with new access_token
```

#### 3c. Test Token Expiry (Optional)
```bash
# 1. Request reset
POST http://localhost:8000/auth/password-reset-request
{
    "email": "expiry.test@example.com"
}

# 2. Wait 30+ minutes (configurable via PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

# 3. Try to use expired token
POST http://localhost:8000/auth/password-reset-verify
{
    "email": "expiry.test@example.com",
    "reset_token": "old_token",
    "new_password": "NewPass@123"
}

# Response: 400 Bad Request
# { "detail": "Token tidak valid atau sudah expired" }
```

---

### Feature 4: Class Management

#### 4a. Create Multiple Classes
```bash
# As admin, create 2nd class
POST http://localhost:8000/classes
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "name": "Web Development",
    "code": "TK302",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 1
}

# Repeat for 3rd class
{
    "name": "Database Systems",
    "code": "TK303",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 2
}

# Note class IDs (e.g., 1, 2, 3)
```

#### 4b. List All Classes
```bash
# Anyone can view classes
GET http://localhost:8000/classes
Authorization: Bearer {any_token}

# Response: pagination with total and list
# {
#     "total": 3,
#     "classes": [...]
# }
```

#### 4c. Filter Classes by Instructor
```bash
# Get classes taught by instructor_id=1
GET http://localhost:8000/classes?instructor_id=1
Authorization: Bearer {admin_token}

# Response: classes with instructor_id=1
```

#### 4d. Add Students to Class (Dosen/Admin Only)
```bash
# As dosen, add student to class
POST http://localhost:8000/classes/1/students/3
Authorization: Bearer {dosen_token}

# Response: 201 Created
# { "message": "Student berhasil ditambahkan ke class" }

# As student, try to add yourself (should fail)
POST http://localhost:8000/classes/1/students/3
Authorization: Bearer {student_token}

# Response: 403 Forbidden
```

#### 4e. Get Students in Class
```bash
# View all students in class
GET http://localhost:8000/classes/1/students
Authorization: Bearer {student_token}

# Response: array of user objects
```

#### 4f. Get Classes for User
```bash
# View user's enrolled classes
GET http://localhost:8000/users/3/classes
Authorization: Bearer {student_token}

# Student can view own classes
# Admin can view any user's classes

# Response: array of class objects
```

#### 4g. Remove Student from Class
```bash
# As dosen, remove student
DELETE http://localhost:8000/classes/1/students/3
Authorization: Bearer {dosen_token}

# Response: 204 No Content
```

---

## API Endpoint Quick Reference

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| **AUTH** |
| POST | /auth/register | ❌ | Public | Register user (default role: mahasiswa) |
| POST | /auth/login | ❌ | Public | Login, get JWT token |
| GET | /auth/me | ✅ | Any | Get current user |
| POST | /auth/password-reset-request | ❌ | Public | Request password reset |
| POST | /auth/password-reset-verify | ❌ | Public | Verify token & reset password |
| **PROFILE** |
| GET | /users/profile/{id} | ✅ | Admin/Own | View user profile |
| PUT | /users/profile | ✅ | Any | Update own profile |
| **CLASSES** |
| POST | /classes | ✅ | Admin | Create class |
| GET | /classes | ✅ | Any | List classes |
| GET | /classes/{id} | ✅ | Any | Get class details |
| PUT | /classes/{id} | ✅ | Admin | Update class |
| DELETE | /classes/{id} | ✅ | Admin | Delete class |
| **ENROLLMENT** |
| POST | /classes/{id}/students/{uid} | ✅ | Dosen/Admin | Add student |
| DELETE | /classes/{id}/students/{uid} | ✅ | Dosen/Admin | Remove student |
| GET | /classes/{id}/students | ✅ | Any | List students |
| GET | /users/{id}/classes | ✅ | Admin/Own | User's classes |

---

## Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Profile updated successfully |
| 201 | Created | Class created, student added |
| 204 | No Content | Student removed (success, no response body) |
| 400 | Bad Request | Invalid email format, student already in class |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User doesn't have permission (e.g., Student trying to create class) |
| 404 | Not Found | User/class doesn't exist |
| 422 | Validation Error | Invalid request body |

---

## Troubleshooting

### Issue: Getting 403 Forbidden on class creation
**Solution**: Verify your role is "admin"
```bash
GET /auth/me
# Check that role: "admin" in response
```

### Issue: Password reset verify fails
**Solution**: 
1. Verify token hasn't expired (30 min default)
2. Verify email matches the account
3. Reset the token: `SELECT reset_token FROM users WHERE email = 'xxx'`

### Issue: Can't find student in class after adding
**Solution**: Verify you added the correct class_id and user_id
```bash
# Check class students
GET /classes/{class_id}/students
```

### Issue: Student cannot see classes
**Solution**: Verify authorization - students can only see their own classes
```bash
# This works:
GET /users/{own_student_id}/classes

# This fails (403 Forbidden):
GET /users/{other_student_id}/classes
```

---

## Next Steps

After testing:
1. [ ] Integrate with frontend (add forms, modals)
2. [ ] Setup email service for password reset
3. [ ] Add SSO configuration (Google, GitHub)
4. [ ] Create admin dashboard for user management
5. [ ] Setup production database migrations (Alembic)

---

**Last Updated**: April 19, 2026
