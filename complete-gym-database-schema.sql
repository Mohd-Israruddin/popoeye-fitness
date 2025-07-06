-- Complete Gym Management System Database Schema
-- Based on all backend routes and SQL files

-- Create database
CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- ========================================
-- CORE TABLES
-- ========================================

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(15),
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

-- Staff table
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

-- Finances table
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

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  trainer VARCHAR(100),
  time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

-- ========================================
-- RECURRING TRANSACTIONS & SALARY
-- ========================================

-- Recurring transactions table
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

-- Staff salary transactions table
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

-- ========================================
-- INVENTORY & SALES
-- ========================================

-- Inventory table
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

-- Sales tracking table
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

-- ========================================
-- ENQUIRIES
-- ========================================

-- Enquiries table
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

-- ========================================
-- ADMIN & SETTINGS
-- ========================================

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  admin_code VARCHAR(100) NOT NULL,
  passkey VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

-- Settings table
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

-- ========================================
-- ACTIVITY LOGS (after admin_settings)
-- ========================================

-- Activity logs table
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

-- ========================================
-- LEGACY TABLES (for backward compatibility)
-- ========================================

-- Legacy admin table (deprecated, use admin_settings instead)
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  passkey_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
);

-- Owner notes table
CREATE TABLE IF NOT EXISTS owner_notes (
  id INT PRIMARY KEY DEFAULT 1,
  note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Members indexes
CREATE INDEX idx_members_expiry ON members(expiry_date);
CREATE INDEX idx_members_join_date ON members(join_date);
CREATE INDEX idx_members_name ON members(name);

-- Staff indexes
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_code ON staff(staff_code);

-- Finances indexes
CREATE INDEX idx_finances_date ON finances(date);
CREATE INDEX idx_finances_type ON finances(type);
CREATE INDEX idx_finances_category ON finances(category);

-- Schedule indexes
CREATE INDEX idx_schedule_date ON schedule(date);
CREATE INDEX idx_schedule_time ON schedule(time);

-- Recurring transactions indexes
CREATE INDEX idx_recurring_active ON recurring_transactions(is_active, next_due_date);
CREATE INDEX idx_recurring_staff ON recurring_transactions(staff_id);

-- Staff salary indexes
CREATE INDEX idx_staff_salary_date ON staff_salary_transactions(payment_date);
CREATE INDEX idx_staff_salary_staff ON staff_salary_transactions(staff_id);

-- Inventory indexes
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_stock ON inventory(stock);
CREATE INDEX idx_inventory_name ON inventory(name);

-- Sales tracking indexes
CREATE INDEX idx_sales_date ON sales_tracking(sale_date);
CREATE INDEX idx_sales_product ON sales_tracking(product_id);

-- Enquiries indexes
CREATE INDEX idx_enquiries_date ON enquiries(enquiry_date);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_follow_up ON enquiries(follow_up_date);

-- Activity logs indexes
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_staff ON activity_logs(staff_id);
CREATE INDEX idx_activity_admin ON activity_logs(admin_id);
CREATE INDEX idx_activity_target ON activity_logs(target_type, target_id);

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert default settings
INSERT IGNORE INTO settings (id, gym_name, contact_email, contact_phone, opening_hours, expense_limit, low_stock_threshold) 
VALUES (1, 'My Gym', 'admin@mygym.com', '+1234567890', 'Mon-Fri: 6AM-10PM, Sat-Sun: 8AM-8PM', 100000.00, 5);

-- Insert sample admin (password: admin123)
INSERT IGNORE INTO admin_settings (username, email, admin_code, passkey) 
VALUES ('admin', 'admin@mygym.com', 'ADMIN001', 'admin123');

-- ========================================
-- VIEWS FOR INSIGHTS
-- ========================================

-- Create insights view for dashboard
CREATE OR REPLACE VIEW insights_view AS
SELECT 
  (SELECT COUNT(*) FROM members WHERE expiry_date >= CURDATE()) as active_members,
  (SELECT COUNT(*) FROM members WHERE expiry_date < CURDATE()) as expired_members,
  (SELECT COUNT(*) FROM staff WHERE status = 'Active') as active_staff,
  (SELECT SUM(amount) FROM finances WHERE type = 'income' AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as monthly_income,
  (SELECT SUM(amount) FROM finances WHERE type = 'expense' AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as monthly_expense,
  (SELECT COUNT(*) FROM enquiries WHERE status = 'New') as new_enquiries,
  (SELECT COUNT(*) FROM inventory WHERE stock < low_stock_threshold) as low_stock_items;

-- ========================================
-- COMMENTS
-- ========================================

/*
This schema includes all tables used by the gym management system:

Core Features:
- Member management with body measurements
- Staff management with salary tracking
- Financial tracking (income/expense)
- Class scheduling
- Inventory management with sales tracking
- Enquiry management
- Recurring transactions (for salaries, subscriptions)
- Activity logging for audit trail

Admin Features:
- Admin authentication with passkey
- Settings management
- Dashboard insights
- Expense limits
- Low stock alerts

All tables include proper foreign key relationships, indexes for performance,
and timestamp fields for tracking creation/updates.
*/ 