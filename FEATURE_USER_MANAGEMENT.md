# User Management Features Implementation

**Date**: April 19, 2026  
**Status**: ✅ Complete

## Overview
Comprehensive user management system added to the backend with role-based access control (RBAC), password reset, profile management, and class management.

## Features Added

### 1. **Role-Based Access Control (RBAC)**
Three user roles implemented:
- **Admin**: Full system access, can manage classes and users
- **Dosen** (Instructor): Can manage classes and students
- **Mahasiswa** (Student): Can view assigned classes and own profile

**Database Changes**:
- Added `role` column to `users` table (Enum: admin, dosen, mahasiswa)
- Default role: `mahasiswa`

**Auth Functions**:
- `require_admin()`: Dependency for admin-only endpoints
- `require_instructor()`: Dependency for instructor/admin endpoints
- `require_role(*roles)`: Generic role checker

---

### 2. **User Profile Management**
Users can view and update their profiles.

**New Fields in User Model**:
- `phone`: String (20 chars, optional)
- `address`: Text (optional)
- `profile_picture`: String - URL to profile picture (optional)
- `semester`: Integer (for students, optional)

**New Endpoints**:
```
GET    /users/profile/{user_id}      - Get user profile with classes
PUT    /users/profile                - Update own profile
```

**Schemas**:
- `UserProfileUpdate`: For profile updates (all fields optional)
- `UserResponse`: Updated to include role and profile fields
- `UserWithClassesResponse`: User profile with associated classes

---

### 3. **Password Reset**
Secure password reset flow using tokens.

**New Fields in User Model**:
- `reset_token`: String (unique, optional)
- `reset_token_expiry`: DateTime (optional)

**New Endpoints**:
```
POST   /auth/password-reset-request   - Request password reset
POST   /auth/password-reset-verify    - Verify token and set new password
```

**Schemas**:
- `PasswordResetRequest`: Email for password reset
- `PasswordResetVerify`: Email, reset token, new password
- `PasswordResetResponse`: Confirmation message

**Auth Functions**:
- `generate_password_reset_token()`: Generate secure token
- `create_password_reset_token_record()`: Save token with expiry (default: 30 mins)
- `verify_password_reset_token()`: Validate token and check expiry
- `clear_password_reset_token()`: Clear token after successful reset

**Note**: Token expiry time configurable via `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES` env variable.

---

### 4. **Class Management**
Full class lifecycle management with student associations.

**New Model: Class**
```python
class Class(Base):
    - id: Primary key
    - name: Class name
    - code: Unique class code (e.g., "TK301")
    - description: Class description
    - instructor_id: Foreign key to User (Dosen)
    - semester: 1-8
    - academic_year: String (e.g., "2024/2025")
    - max_students: Optional limit
    - created_at, updated_at: Timestamps
    - users: Many-to-many relationship with User
```

**Many-to-Many Association**:
- `user_class_association` table links users and classes
- Users can be enrolled in multiple classes
- Classes have multiple students

**New Endpoints**:
```
POST   /classes                       - Create class (admin only)
GET    /classes                       - List classes (with filters)
GET    /classes/{class_id}            - Get class details
PUT    /classes/{class_id}            - Update class (admin only)
DELETE /classes/{class_id}            - Delete class (admin only)

POST   /classes/{class_id}/students/{user_id}    - Add student to class
DELETE /classes/{class_id}/students/{user_id}    - Remove student from class
GET    /classes/{class_id}/students              - List students in class

GET    /users/{user_id}/classes       - Get user's enrolled classes
```

**Schemas**:
- `ClassBase`: Base class fields
- `ClassCreate`: For creating classes (includes instructor_id)
- `ClassResponse`: Class details
- `ClassListResponse`: List with pagination
- `ClassDetailResponse`: Class with student count and full user list

**CRUD Functions**:
- `create_class()`, `get_class()`, `get_classes()`, `update_class()`, `delete_class()`
- `add_student_to_class()`, `remove_student_from_class()`
- `get_user_classes()`, `get_class_students()`, `get_class_student_count()`

---

### 5. **SSO Support (Skeleton)**
Infrastructure prepared for OAuth2/SSO integration:

**New Fields in User Model**:
- `sso_provider`: String (e.g., "google", "github", optional)
- `sso_id`: String (unique, optional)

**Current Status**: Fields only - implementation pending

**Future Development**:
- Google OAuth2
- GitHub OAuth2
- Alternative email login fallback

---

## File Changes Summary

### **models.py**
- ✅ Added `UserRole` enum (Admin, Dosen, Mahasiswa)
- ✅ Added `user_class_association` table
- ✅ Extended `User` model with role, profile, SSO, and reset token fields
- ✅ Added `Class` model with instructor and student relationships

### **schemas.py**
- ✅ Added `UserRoleEnum` for API validation
- ✅ Updated `UserResponse` with role and profile fields
- ✅ Added `UserProfileUpdate`, `PasswordResetRequest`, `PasswordResetVerify`, `PasswordResetResponse`
- ✅ Added `ClassBase`, `ClassCreate`, `ClassResponse`, `ClassListResponse`, `ClassDetailResponse`
- ✅ Added `UserWithClassesResponse`

### **auth.py**
- ✅ Added `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES` config
- ✅ Added RBAC dependency functions: `require_admin()`, `require_instructor()`, `require_role()`
- ✅ Added password reset token functions
- ✅ Added `secrets` module for secure token generation

### **crud.py**
- ✅ Added user profile functions: `update_user_profile()`, `get_user_profile()`, `get_user_by_email()`
- ✅ Added password reset functions: `request_password_reset()`, `verify_and_reset_password()`
- ✅ Added class management functions: `create_class()`, `get_class()`, `get_classes()`, `update_class()`, `delete_class()`
- ✅ Added class membership functions: `add_student_to_class()`, `remove_student_from_class()`, `get_user_classes()`, `get_class_students()`

### **main.py**
- ✅ Added password reset endpoints
- ✅ Added user profile endpoints
- ✅ Added comprehensive class management endpoints
- ✅ Added RBAC protection to endpoints

---

## Authorization Model

| Endpoint | Admin | Dosen | Mahasiswa |
|----------|-------|-------|-----------|
| POST /classes | ✅ | ❌ | ❌ |
| GET /classes | ✅ | ✅ | ✅ |
| PUT /classes/{id} | ✅ | ❌ | ❌ |
| DELETE /classes/{id} | ✅ | ❌ | ❌ |
| POST /classes/{id}/students/{uid} | ✅ | ✅ | ❌ |
| DELETE /classes/{id}/students/{uid} | ✅ | ✅ | ❌ |
| GET /users/profile/{id} | ✅ | ✅* | ✅* |
| PUT /users/profile | ✅ | ✅ | ✅ |

*Can only access own profile unless admin

---

## Database Migration

Run these SQL commands or let Alembic handle it:

```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'mahasiswa';
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255);
ALTER TABLE users ADD COLUMN semester INTEGER;
ALTER TABLE users ADD COLUMN sso_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN sso_id VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create classes table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL REFERENCES users(id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    max_students INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_class_association junction table
CREATE TABLE user_class_association (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    class_id INTEGER PRIMARY KEY REFERENCES classes(id)
);
```

---

## Environment Variables (Optional)

Add to `.env.docker`:
```env
# Password reset token expiry time (minutes)
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30

# SSO configuration (for future use)
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_secret
```

---

## Testing Checklist

- [ ] Register user with default role (mahasiswa)
- [ ] Login returns user with role
- [ ] Admin can create classes
- [ ] Dosen can add students to class
- [ ] Mahasiswa cannot create/modify classes
- [ ] Profile update works
- [ ] Password reset flow works
- [ ] Get user profile with classes
- [ ] Get class with students
- [ ] RBAC middleware rejects unauthorized access

---

## Future Enhancements

1. **Password Reset Email**: Integrate email service (SendGrid, AWS SES)
2. **SSO Implementation**: Add Google/GitHub OAuth2
3. **User Management Dashboard**: Admin endpoints for bulk operations
4. **Class Enrollment**: Self-service enrollment with approval workflow
5. **Audit Logging**: Track user actions and role changes
6. **Permission Middleware**: Implement more granular permissions per resource

---

## Notes

- All timestamps use timezone-aware UTC
- Passwords validated with strong requirements (uppercase, lowercase, number, symbol)
- Reset tokens expire after 30 minutes (configurable)
- Invalid reset token doesn't reveal if email exists (security best practice)
- No new dependencies added - uses existing packages
