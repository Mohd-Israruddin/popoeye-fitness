USE gym_db;


ALTER TABLE inventory
ADD COLUMN created_by VARCHAR(100) AFTER dealer_contact,
ADD COLUMN updated_by VARCHAR(100) AFTER created_by;