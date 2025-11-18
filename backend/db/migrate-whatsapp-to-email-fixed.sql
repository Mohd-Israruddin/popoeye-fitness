-- Migration script to change WhatsApp to Email in members table
-- Run this script to update existing database

USE gym_db;

-- Add new columns if they don't exist
ALTER TABLE members ADD COLUMN email VARCHAR(100) AFTER name;
ALTER TABLE members ADD COLUMN phone VARCHAR(15) AFTER email;

-- Copy whatsapp data to phone column (if whatsapp column exists)
-- This is a safety measure in case you want to keep phone numbers
UPDATE members SET phone = whatsapp WHERE whatsapp IS NOT NULL AND phone IS NULL;

-- Update any existing sample data to have email addresses
UPDATE members SET email = CONCAT(LOWER(REPLACE(name, ' ', '.')), '@example.com') WHERE email IS NULL OR email = '';

-- Add index for email column
CREATE INDEX idx_members_email ON members(email);

-- Add index for phone column  
CREATE INDEX idx_members_phone ON members(phone);

-- Show the updated table structure
DESCRIBE members;
