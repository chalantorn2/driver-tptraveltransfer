-- Add completion_type column to track driver completion status
-- This is separate from bookings.ht_status which is for Holiday Taxis API status

-- Add to driver_vehicle_assignments table
ALTER TABLE driver_vehicle_assignments
ADD COLUMN IF NOT EXISTS completion_type ENUM('COMPLETED', 'NO_SHOW') NULL AFTER completed_at;

-- Add to driver_tracking_tokens table
ALTER TABLE driver_tracking_tokens
ADD COLUMN IF NOT EXISTS completion_type ENUM('COMPLETED', 'NO_SHOW') NULL AFTER completed_at;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_dva_completion_type ON driver_vehicle_assignments(completion_type);
CREATE INDEX IF NOT EXISTS idx_dtt_completion_type ON driver_tracking_tokens(completion_type);
