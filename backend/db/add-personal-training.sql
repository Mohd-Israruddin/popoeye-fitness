ALTER TABLE members
ADD COLUMN personal_training ENUM('Yes', 'No') NOT NULL DEFAULT 'No';
