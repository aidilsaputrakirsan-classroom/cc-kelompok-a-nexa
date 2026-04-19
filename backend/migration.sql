-- Migration: Add archive columns to classes table
-- Purpose: Support soft delete (archive) functionality for classes

ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE NULL;

-- -- Create index for archived queries (optional but improves performance)
-- CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);
