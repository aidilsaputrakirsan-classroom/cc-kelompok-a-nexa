-- ============================================================================
-- COMPLETE DATABASE MIGRATION - Cloud App Backend
-- ============================================================================
-- This migration creates the full database schema from scratch
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Author: Team
-- Date: 2024-04-19
-- ============================================================================

-- ============================================================================
-- 1. CREATE USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MAHASISWA',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone VARCHAR(20),
    address TEXT,
    profile_picture VARCHAR(255),
    semester INTEGER,
    sso_provider VARCHAR(50),
    sso_id VARCHAR(255) UNIQUE,
    reset_token VARCHAR(255) UNIQUE,
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_role CHECK (role IN ('ADMIN', 'DOSEN', 'MAHASISWA'))
);

-- Add missing columns if they don't exist (for existing users table)
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'MAHASISWA';

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS semester INTEGER;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50);

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS sso_id VARCHAR(255) UNIQUE;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) UNIQUE;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 2. CREATE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price FLOAT NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- ============================================================================
-- 3. CREATE CLASSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    academic_year VARCHAR(10) NOT NULL,
    max_students INTEGER CHECK (max_students > 0),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);

-- ============================================================================
-- 4. CREATE USER-CLASS ASSOCIATION TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_class_association (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_user_class_user_id ON user_class_association(user_id);
CREATE INDEX IF NOT EXISTS idx_user_class_class_id ON user_class_association(class_id);

-- ============================================================================
-- 5. DATA INTEGRITY COMMENTS
-- ============================================================================
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE items IS 'Inventory items for cloud app';
COMMENT ON TABLE classes IS 'Classes/courses with student enrollment';
COMMENT ON TABLE user_class_association IS 'Many-to-many relationship between users and classes';

COMMENT ON COLUMN users.role IS 'User role: ADMIN, DOSEN, MAHASISWA (must be uppercase)';
COMMENT ON COLUMN users.sso_provider IS 'SSO provider (google, github, etc)';
COMMENT ON COLUMN classes.is_archived IS 'Soft delete flag - archived classes excluded from queries';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables created successfully with:
-- - Primary keys
-- - Foreign key constraints
-- - Unique constraints
-- - Check constraints
-- - Indexes for performance
-- - Proper timestamps (created_at, updated_at)
-- ============================================================================
