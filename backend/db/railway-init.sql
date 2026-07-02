-- Run this in Railway MySQL (Data tab or any MySQL client)
-- Railway already creates the database — do NOT run CREATE DATABASE

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  photo VARCHAR(500) NULL,
  email VARCHAR(100),
  phone VARCHAR(15),
  join_date DATE,
  expiry_date DATE,
  package VARCHAR(100),
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  pending_amount DECIMAL(10,2),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  biceps DECIMAL(5,2),
  thighs DECIMAL(5,2),
  address VARCHAR(255),
  health_issues VARCHAR(255),
  blood_group VARCHAR(10),
  extra_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  staff_code VARCHAR(50) UNIQUE,
  role VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(100),
  address TEXT,
  photo VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Active',
  salary DECIMAL(10,2) DEFAULT 0.00,
  bonus DECIMAL(10,2) DEFAULT 0.00,
  salary_status VARCHAR(20) DEFAULT 'Pending',
  username VARCHAR(100),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS finances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  payment VARCHAR(50) NOT NULL,
  description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  trainer VARCHAR(100),
  time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  payment VARCHAR(50) NOT NULL,
  description TEXT,
  frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_processed DATE NULL,
  next_due_date DATE NOT NULL,
  staff_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS staff_salary_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  finance_id INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (finance_id) REFERENCES finances(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  stock INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  dealer_contact VARCHAR(255),
  low_stock_threshold INT DEFAULT 5,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS sales_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  FOREIGN KEY (product_id) REFERENCES inventory(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(100),
  interest VARCHAR(100),
  status VARCHAR(50) DEFAULT 'New',
  follow_up_date DATE,
  notes TEXT,
  enquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  admin_code VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15),
  passkey VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gym_name VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(15),
  opening_hours TEXT,
  theme VARCHAR(50) DEFAULT 'default',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  expense_limit DECIMAL(10,2) DEFAULT 100000.00,
  dashboard_layout TEXT,
  note TEXT,
  low_stock_threshold INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NULL,
  admin_id INT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES admin_settings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  passkey_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS biometric_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(15) NULL,
  server_domain VARCHAR(255) NULL,
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

CREATE TABLE IF NOT EXISTS member_biometric_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  device_id INT NOT NULL,
  biometric_user_id INT NOT NULL,
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
  raw_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES biometric_devices(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  INDEX idx_check_time (check_time),
  INDEX idx_member_id (member_id),
  INDEX idx_device_id (device_id),
  INDEX idx_sync_status (sync_status)
);

INSERT INTO settings (gym_name, contact_email, contact_phone, opening_hours, expense_limit, low_stock_threshold)
SELECT 'Popoeye Fitness', 'admin@popoeyefitness.com', '+91XXXXXXXXXX', 'Mon-Sat: 6AM-10PM', 100000.00, 5
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
