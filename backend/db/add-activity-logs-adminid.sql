-- Add admin_id to activity_logs and set up foreign key
ALTER TABLE activity_logs
  ADD COLUMN admin_id INT NULL AFTER staff_id,
  ADD CONSTRAINT fk_activity_logs_admin_id FOREIGN KEY (admin_id) REFERENCES admin_settings(id); 