-- Add member profile photo URL (Cloudinary)
ALTER TABLE members
ADD COLUMN photo VARCHAR(500) NULL AFTER name;
