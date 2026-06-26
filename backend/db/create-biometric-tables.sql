-- Biometric Integration Tables
USE gym_db;

-- Table to store biometric device configurations
CREATE TABLE IF NOT EXISTS biometric_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(15),
  server_domain VARCHAR(255),
  port INT DEFAULT 4370,
  serial_number VARCHAR(100),
  device_name VARCHAR(100),
  mac_address VARCHAR(17),
  firmware_version VARCHAR(50),
  status ENUM('active', 'inactive', 'disconnected') DEFAULT 'inactive',
  last_sync DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ip_port (ip_address, port),
  INDEX idx_server_domain (server_domain)
);

-- Table to link members with their biometric user IDs on devices
CREATE TABLE IF NOT EXISTS member_biometric_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  device_id INT NOT NULL,
  biometric_user_id INT NOT NULL, -- User ID on the biometric device
  fingerprint_count INT DEFAULT 0,
  face_count INT DEFAULT 0,
  password VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES biometric_devices(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member_device (member_id, device_id),
  UNIQUE KEY unique_device_biometric_id (device_id, biometric_user_id)
);

-- Table to store attendance logs from biometric devices
CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  member_id INT,
  biometric_user_id INT NOT NULL,
  check_time DATETIME NOT NULL,
  check_type ENUM('check_in', 'check_out', 'unknown') DEFAULT 'unknown',
  verification_mode ENUM('fingerprint', 'face', 'password', 'rfid', 'unknown') DEFAULT 'unknown',
  status ENUM('valid', 'invalid', 'expired_membership') DEFAULT 'valid',
  sync_status ENUM('synced', 'pending', 'failed') DEFAULT 'pending',
  raw_data TEXT, -- Store raw device data if needed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES biometric_devices(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_check_time (check_time),
  INDEX idx_member_id (member_id),
  INDEX idx_device_id (device_id),
  INDEX idx_sync_status (sync_status)
);

-- Add index for faster queries
CREATE INDEX idx_attendance_member_date ON attendance_logs(member_id, check_time);
CREATE INDEX idx_attendance_device_date ON attendance_logs(device_id, check_time);

