-- Add updated_by column to enquiries table
ALTER TABLE enquiries ADD COLUMN updated_by VARCHAR(100) DEFAULT NULL;

-- Add updated_at column if it doesn't exist (for consistency)
