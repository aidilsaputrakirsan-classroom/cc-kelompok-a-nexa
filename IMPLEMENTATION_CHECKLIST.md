# Implementation Checklist for User Management Features

## ✅ Completed Components

### 1. Database Models (models.py)
- [x] UserRole enum (ADMIN, DOSEN, MAHASISWA)
- [x] User model extended with:
  - [x] role field (Enum with default MAHASISWA)
  - [x] Profile fields (phone, address, profile_picture, semester)
  - [x] SSO fields (sso_provider, sso_id)
  - [x] Password reset fields (reset_token, reset_token_expiry)
  - [x] Relationship to classes via many-to-many
- [x] Class model with:
  - [x] Basic fields (name, code, description, semester, academic_year, max_students)
  - [x] instructor_id FK to User
  - [x] Many-to-many relationship to User through user_class_association
  - [x] Timestamps
- [x] user_class_association table for many-to-many

### 2. Validation Schemas (schemas.py)
- [x] UserRoleEnum for API validation
- [x] Updated UserResponse with role and profile
- [x] UserProfileUpdate schema
- [x] PasswordResetRequest schema
- [x] PasswordResetVerify schema
- [x] PasswordResetResponse schema
- [x] ClassBase, ClassCreate, ClassResponse schemas
- [x] ClassListResponse, ClassDetailResponse schemas
- [x] UserWithClassesResponse schema

### 3. Authentication & Authorization (auth.py)
- [x] RBAC dependencies:
  - [x] require_admin()
  - [x] require_instructor()
  - [x] require_role() - parameterized role checker
- [x] Password reset token functions:
  - [x] generate_password_reset_token()
  - [x] create_password_reset_token_record()
  - [x] verify_password_reset_token()
  - [x] clear_password_reset_token()
- [x] Configuration for PASSWORD_RESET_TOKEN_EXPIRE_MINUTES

### 4. Business Logic (crud.py)
- [x] User profile functions:
  - [x] update_user_profile()
  - [x] get_user_profile()
  - [x] get_user_by_email()
- [x] Password reset functions:
  - [x] request_password_reset()
  - [x] verify_and_reset_password()
- [x] Class management functions:
  - [x] create_class()
  - [x] get_class()
  - [x] get_classes() with filters
  - [x] update_class()
  - [x] delete_class()
- [x] Class membership functions:
  - [x] add_student_to_class()
  - [x] remove_student_from_class()
  - [x] get_user_classes()
  - [x] get_class_students()
  - [x] get_class_student_count()

### 5. API Endpoints (main.py)
#### Password Reset
- [x] POST /auth/password-reset-request
- [x] POST /auth/password-reset-verify

#### User Profile
- [x] GET /users/profile/{user_id}
- [x] PUT /users/profile

#### Class Management
- [x] POST /classes (admin only)
- [x] GET /classes (with filters)
- [x] GET /classes/{class_id}
- [x] PUT /classes/{class_id} (admin only)
- [x] DELETE /classes/{class_id} (admin only)

#### Class Membership
- [x] POST /classes/{class_id}/students/{user_id} (instructor/admin)
- [x] DELETE /classes/{class_id}/students/{user_id} (instructor/admin)
- [x] GET /classes/{class_id}/students
- [x] GET /users/{user_id}/classes

#### Authorization Checks
- [x] Admin can perform all operations
- [x] Instructor/Dosen can manage class members
- [x] Users can only view own profile (except admin)
- [x] Public endpoints for password reset and profile updates

### 6. Documentation
- [x] FEATURE_USER_MANAGEMENT.md with complete feature overview
- [x] Database migration SQL commands
- [x] Authorization matrix
- [x] Testing checklist
- [x] Future enhancements list

---

## Still TODO (Optional Features)

### 1. Email Integration
- [ ] Add email service for password reset links
- [ ] Sendgrid or AWS SES integration
- [ ] Email templates

### 2. SSO Implementation
- [ ] Google OAuth2
- [ ] GitHub OAuth2
- [ ] LinkedIn OAuth2

### 3. Advanced Features
- [ ] User management dashboard (admin)
- [ ] Bulk user import
- [ ] Class enrollment workflow
- [ ] Audit logging
- [ ] Fine-grained permissions

### 4. Frontend Integration
- [ ] Login with role selection
- [ ] Profile management UI
- [ ] Password reset form
- [ ] Class management interface
- [ ] Student management UI

---

## Files Modified

| File | Status | Changes |
|------|--------|---------|
| models.py | ✅ | Added UserRole enum, extended User, added Class model |
| schemas.py | ✅ | Added 11 new schemas (RBAC, profile, reset, class) |
| auth.py | ✅ | Added RBAC dependencies, password reset tokens |
| crud.py | ✅ | Added 13 new CRUD functions for profiles, reset, classes |
| main.py | ✅ | Added 13 new endpoints with RBAC protection |
| requirements.txt | ✅ | No changes needed (all deps already included) |

---

## Testing Workflow

### 1. Basic Setup
```bash
# First, create a new admin account (manually or via registration)
POST /auth/register
{
    "email": "admin@example.com",
    "name": "Admin User",
    "password": "Admin@Pass123"
}

# Then manually update role in database:
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### 2. Role Testing
```bash
# Login as admin
POST /auth/login
{
    "email": "admin@example.com",
    "password": "Admin@Pass123"
}

# Try to create a class (should work)
POST /classes
{
    "name": "Cloud Computing",
    "code": "TK301",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 1
}

# Try with Mahasiswa token (should fail)
# - First register as Mahasiswa (default role)
# - Token will have Mahasiswa role
# - POST /classes will return 403 Forbidden
```

### 3. Password Reset Testing
```bash
# Request reset
POST /auth/password-reset-request
{
    "email": "user@example.com"
}

# Extract reset_token from database
SELECT reset_token FROM users WHERE email = 'user@example.com';

# Verify and reset
POST /auth/password-reset-verify
{
    "email": "user@example.com",
    "reset_token": "token_from_db",
    "new_password": "NewPass@123"
}

# Login with new password
POST /auth/login
{
    "email": "user@example.com",
    "password": "NewPass@123"
}
```

### 4. Class Management Testing
```bash
# Create class as admin
POST /classes
{
    "name": "Cloud Computing",
    "code": "TK301",
    "semester": 5,
    "academic_year": "2024/2025",
    "instructor_id": 1,
    "max_students": 30
}

# Add student to class
POST /classes/1/students/2

# Get class students
GET /classes/1/students

# Get user's classes
GET /users/2/classes
```

---

## Notes for Development Team

1. **Backward Compatibility**: 
   - Existing users will default to MAHASISWA role
   - Existing applications continue to work
   - Recommend updating old user roles in database

2. **Security**:
   - Password reset tokens expire after 30 minutes (configurable)
   - Tokens don't leak information (same response for valid/invalid email)
   - All operations use JWT bearer tokens

3. **Database**:
   - SQLAlchemy will auto-create new tables on first run
   - Migration tool (Alembic) recommended for production
   - See FEATURE_USER_MANAGEMENT.md for SQL commands

4. **Configuration**:
   - Update `.env.docker` with PASSWORD_RESET_TOKEN_EXPIRE_MINUTES if needed
   - Default is 30 minutes

5. **Integration Points**:
   - Email service needs to be added for password reset emails
   - Frontend needs to implement login role selection (optional)
   - S SO provider configuration when ready

---

Generated: April 19, 2026
