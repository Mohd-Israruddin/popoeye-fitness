-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Members indexes
DROP INDEX IF EXISTS idx_members_expiry ON members;
CREATE INDEX idx_members_expiry ON members(expiry_date);

DROP INDEX IF EXISTS idx_members_join_date ON members;
CREATE INDEX idx_members_join_date ON members(join_date);

DROP INDEX IF EXISTS idx_members_name ON members;
CREATE INDEX idx_members_name ON members(name);

-- Staff indexes
DROP INDEX IF EXISTS idx_staff_status ON staff;
CREATE INDEX idx_staff_status ON staff(status);

DROP INDEX IF EXISTS idx_staff_role ON staff;
CREATE INDEX idx_staff_role ON staff(role);

DROP INDEX IF EXISTS idx_staff_code ON staff;
CREATE INDEX idx_staff_code ON staff(staff_code);

-- Finances indexes
DROP INDEX IF EXISTS idx_finances_date ON finances;
CREATE INDEX idx_finances_date ON finances(date);

DROP INDEX IF EXISTS idx_finances_type ON finances;
CREATE INDEX idx_finances_type ON finances(type);

DROP INDEX IF EXISTS idx_finances_category ON finances;
CREATE INDEX idx_finances_category ON finances(category);

-- Schedule indexes
DROP INDEX IF EXISTS idx_schedule_date ON schedule;
CREATE INDEX idx_schedule_date ON schedule(date);

DROP INDEX IF EXISTS idx_schedule_time ON schedule;
CREATE INDEX idx_schedule_time ON schedule(time);

-- Recurring transactions indexes
DROP INDEX IF EXISTS idx_recurring_active ON recurring_transactions;
CREATE INDEX idx_recurring_active ON recurring_transactions(is_active, next_due_date);

DROP INDEX IF EXISTS idx_recurring_staff ON recurring_transactions;
CREATE INDEX idx_recurring_staff ON recurring_transactions(staff_id);

-- Staff salary indexes
DROP INDEX IF EXISTS idx_staff_salary_date ON staff_salary_transactions;
CREATE INDEX idx_staff_salary_date ON staff_salary_transactions(payment_date);

DROP INDEX IF EXISTS idx_staff_salary_staff ON staff_salary_transactions;
CREATE INDEX idx_staff_salary_staff ON staff_salary_transactions(staff_id);

-- Inventory indexes
DROP INDEX IF EXISTS idx_inventory_category ON inventory;
CREATE INDEX idx_inventory_category ON inventory(category);

DROP INDEX IF EXISTS idx_inventory_stock ON inventory;
CREATE INDEX idx_inventory_stock ON inventory(stock);

DROP INDEX IF EXISTS idx_inventory_name ON inventory;
CREATE INDEX idx_inventory_name ON inventory(name);

-- Sales tracking indexes
DROP INDEX IF EXISTS idx_sales_date ON sales_tracking;
CREATE INDEX idx_sales_date ON sales_tracking(sale_date);

DROP INDEX IF EXISTS idx_sales_product ON sales_tracking;
CREATE INDEX idx_sales_product ON sales_tracking(product_id);

-- Enquiries indexes
DROP INDEX IF EXISTS idx_enquiries_date ON enquiries;
CREATE INDEX idx_enquiries_date ON enquiries(enquiry_date);

DROP INDEX IF EXISTS idx_enquiries_status ON enquiries;
CREATE INDEX idx_enquiries_status ON enquiries(status);

DROP INDEX IF EXISTS idx_enquiries_follow_up ON enquiries;
CREATE INDEX idx_enquiries_follow_up ON enquiries(follow_up_date);

-- Activity logs indexes
DROP INDEX IF EXISTS idx_activity_timestamp ON activity_logs;
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);

DROP INDEX IF EXISTS idx_activity_staff ON activity_logs;
CREATE INDEX idx_activity_staff ON activity_logs(staff_id);

DROP INDEX IF EXISTS idx_activity_admin ON activity_logs;
CREATE INDEX idx_activity_admin ON activity_logs(admin_id);

DROP INDEX IF EXISTS idx_activity_target ON activity_logs;
CREATE INDEX idx_activity_target ON activity_logs(target_type, target_id);