-- Fix foreign key constraint for admin reset
USE gym_db;

-- Drop and recreate the foreign key with SET NULL
-- This will preserve activity logs but set admin_id to NULL when admin is deleted
ALTER TABLE activity_logs 
DROP FOREIGN KEY fk_activity_logs_admin_id;

ALTER TABLE activity_logs 
ADD CONSTRAINT fk_activity_logs_admin_id 
FOREIGN KEY (admin_id) REFERENCES admin_settings(id) ON DELETE SET NULL;

-- Option 2: Alternative approach - allow NULL values and set ON DELETE SET NULL
-- If you prefer to keep activity logs but just set admin_id to NULL:
-- ALTER TABLE activity_logs 
-- DROP FOREIGN KEY fk_activity_logs_admin_id;
-- 
-- ALTER TABLE activity_logs 
-- ADD CONSTRAINT fk_activity_logs_admin_id 
-- FOREIGN KEY (admin_id) REFERENCES admin_settings(id) ON DELETE SET NULL; 