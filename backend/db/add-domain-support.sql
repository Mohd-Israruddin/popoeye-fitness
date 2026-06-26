-- Migration: Add domain support to biometric_devices table
-- Run this if you already have the biometric_devices table created

USE gym_db;

-- Add server_domain column if it doesn't exist
ALTER TABLE biometric_devices 
ADD COLUMN IF NOT EXISTS server_domain VARCHAR(255) NULL AFTER ip_address;

-- Add index for domain lookups
CREATE INDEX IF NOT EXISTS idx_server_domain ON biometric_devices(server_domain);

-- Make ip_address nullable (since we can use domain instead)
ALTER TABLE biometric_devices 
MODIFY COLUMN ip_address VARCHAR(15) NULL;

-- Update unique constraint to allow NULL values
-- Note: MySQL doesn't support unique constraints with NULL values well
-- So we'll remove the old constraint and add a new one
ALTER TABLE biometric_devices 
DROP INDEX IF EXISTS unique_ip_port;

-- Add new unique constraint that handles NULLs properly
-- This allows multiple NULL IPs but unique IP+port combinations
CREATE UNIQUE INDEX unique_ip_port ON biometric_devices(ip_address, port);

