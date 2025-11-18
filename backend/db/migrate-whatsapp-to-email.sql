-- Migration script to change WhatsApp to Email in members table
-- Run this script to update existing database

USE gym_db;

-- Add new columns if they don't exist
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS email VARCHAR(100) AFTER name,
ADD COLUMN IF NOT EXISTS phone VARCHAR(15) AFTER email;

-- Copy whatsapp data to phone column (if whatsapp column exists)
-- This is a safety measure in case you want to keep phone numbers
UPDATE members 
SET phone = whatsapp 
WHERE whatsapp IS NOT NULL AND phone IS NULL;

-- Drop the whatsapp column after confirming data is migrated
-- Uncomment the line below when you're ready to remove the whatsapp column
-- ALTER TABLE members DROP COLUMN whatsapp;

-- Update any existing sample data to have email addresses
UPDATE members 
SET email = CONCAT(LOWER(REPLACE(name, ' ', '.')), '@example.com')
WHERE email IS NULL OR email = '';

-- Add index for email column
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- Add index for phone column  
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Show the updated table structure
DESCRIBE members;
