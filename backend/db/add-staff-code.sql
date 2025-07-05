-- Add staff_code field to staff table
ALTER TABLE staff ADD COLUMN staff_code VARCHAR(50) UNIQUE;
ALTER TABLE staff ADD COLUMN updated_at DATETIME DEFAULT NULL;
ALTER TABLE staff ADD COLUMN username VARCHAR(100);
ALTER TABLE staff ADD COLUMN password_hash VARCHAR(255); 