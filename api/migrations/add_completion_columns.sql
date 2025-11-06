-- Migration: Add completion tracking columns to driver_vehicle_assignments
-- Date: 2025-11-02
-- Description: Add columns for tracking job completion with GPS location

-- Check if columns exist before adding
ALTER TABLE driver_vehicle_assignments
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL COMMENT 'Timestamp when job was completed',
ADD COLUMN IF NOT EXISTS completion_latitude DECIMAL(10, 8) NULL COMMENT 'GPS latitude at completion',
ADD COLUMN IF NOT EXISTS completion_longitude DECIMAL(11, 8) NULL COMMENT 'GPS longitude at completion';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_completed_at ON driver_vehicle_assignments(completed_at);

-- Verify the changes
SELECT 'Migration completed successfully. Columns added:' as status;
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'driver_vehicle_assignments'
AND COLUMN_NAME IN ('completed_at', 'completion_latitude', 'completion_longitude');
