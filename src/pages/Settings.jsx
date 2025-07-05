import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSettings, FiSave, FiShield, FiUser, FiMail, FiPhone, FiClock, FiBell, FiTrash2, FiInstagram, FiDatabase, FiRefreshCw, FiInfo, FiAlertTriangle, FiBox, FiDollarSign, FiGrid, FiUsers, FiFileText } from 'react-icons/fi';
import TermsAgreementModal from '../assets/components/TermsAgreementModal';
import './Settings.css';

const Settings = () => {
  // New settings state
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [expenseLimit, setExpenseLimit] = useState(100000);
  const [thresholdMsg, setThresholdMsg] = useState('');
  const [expenseLimitMsg, setExpenseLimitMsg] = useState('');
  const [layoutResetMsg, setLayoutResetMsg] = useState('');
  const [systemInfo, setSystemInfo] = useState({
    totalMembers: 0,
    totalStaff: 0,
    totalInventory: 0,
    totalFinances: 0,
    lastBackup: null,
    systemVersion: '1.0.0'
  });

  // Admin management state
  const [changeAdmin, setChangeAdmin] = useState({ username: '', phone: '', new_admin_code: '', confirm_admin_code: '' });
  const [changeAdminMsg, setChangeAdminMsg] = useState('');
  const [changeAdminLoading, setChangeAdminLoading] = useState(false);

  // Reset admin state
  const [showResetAdmin, setShowResetAdmin] = useState(false);
  const [resetAdminData, setResetAdminData] = useState({ username: '', admin_code: '' });
  const [resetAdminMsg, setResetAdminMsg] = useState('');
  const [resetAdminLoading, setResetAdminLoading] = useState(false);

  // Staff management state
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [newStaffCode, setNewStaffCode] = useState('');
  const [confirmStaffCode, setConfirmStaffCode] = useState('');
  const [staffCodeMsg, setStaffCodeMsg] = useState('');
  const [staffCodeLoading, setStaffCodeLoading] = useState(false);

  // Terms and Agreement state
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSystemInfo();
    fetchStaffList();
  }, []);

  const fetchSettings = async () => {
    try {
      const [thresholdRes, expenseRes] = await Promise.all([
        axios.get('/settings/low-stock-threshold'),
        axios.get('/settings/expense-limit')
      ]);
      
      setLowStockThreshold(thresholdRes.data.threshold);
      setExpenseLimit(expenseRes.data.limit);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const [membersRes, staffRes, inventoryRes, financesRes] = await Promise.all([
        axios.get('/members').catch(() => ({ data: [] })),
        axios.get('/staff').catch(() => ({ data: [] })),
        axios.get('/inventory').catch(() => ({ data: [] })),
        axios.get('/finances').catch(() => ({ data: [] }))
      ]);

      setSystemInfo({
        totalMembers: membersRes.data.length,
        totalStaff: staffRes.data.length,
        totalInventory: inventoryRes.data.length,
        totalFinances: financesRes.data.length,
        lastBackup: null,
        systemVersion: '1.0.0'
      });
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await axios.get('/staff');
      setStaffList(response.data);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  // Low stock threshold handlers
  const handleThresholdSave = async () => {
    setThresholdMsg('');
    try {
      await axios.put('/settings/low-stock-threshold', { threshold: lowStockThreshold });
      setThresholdMsg('Low stock threshold updated successfully!');
    } catch (err) {
      setThresholdMsg('Failed to update threshold.');
    }
  };

  // Expense limit handlers
  const handleExpenseLimitSave = async () => {
    setExpenseLimitMsg('');
    try {
      await axios.post('/settings/expense-limit', { limit: expenseLimit });
      setExpenseLimitMsg('Expense limit updated successfully!');
    } catch (err) {
      setExpenseLimitMsg('Failed to update expense limit.');
    }
  };

  // Dashboard layout reset
  const handleLayoutReset = async () => {
    setLayoutResetMsg('');
    try {
      await axios.post('/settings/dashboard-layout', { layout: { lg: [] } });
      setLayoutResetMsg('Dashboard layout reset successfully!');
    } catch (err) {
      setLayoutResetMsg('Failed to reset dashboard layout.');
    }
  };

  // Admin code change handler
  const handleChangeAdmin = async (e) => {
    e.preventDefault();
    setChangeAdminMsg('');
    if (changeAdmin.new_admin_code !== changeAdmin.confirm_admin_code) {
      setChangeAdminMsg('New admin codes do not match.');
      return;
    }
    if (!changeAdmin.username || !changeAdmin.phone) {
      setChangeAdminMsg('Username and phone number are required.');
      return;
    }
    setChangeAdminLoading(true);
    try {
      await axios.post('/settings/admin/change-admin-code', {
        username: changeAdmin.username,
        phone: changeAdmin.phone,
        new_admin_code: changeAdmin.new_admin_code,
      });
      setChangeAdminMsg('Admin code changed successfully!');
      setChangeAdmin({ username: '', phone: '', new_admin_code: '', confirm_admin_code: '' });
    } catch (err) {
      setChangeAdminMsg(err.response?.data?.error || 'Failed to change admin code. Please verify username and phone number.');
    } finally {
      setChangeAdminLoading(false);
    }
  };

  // Reset admin handler
  const handleResetAdmin = async (e) => {
    e.preventDefault();
    setResetAdminMsg('');
    
    if (!resetAdminData.username || !resetAdminData.admin_code) {
      setResetAdminMsg('Please enter both admin username and admin code.');
      return;
    }
    
    setResetAdminLoading(true);
    try {
      // First verify the admin credentials using admin code
      const verifyResponse = await axios.post('/settings/admin/verify-admin-code', {
        username: resetAdminData.username,
        admin_code: resetAdminData.admin_code
      });
      
      if (verifyResponse.data.success) {
        // If verification successful, proceed with reset
        await axios.delete('/settings/admin/reset');
        setResetAdminMsg('Admin has been reset successfully! You can now create a new admin.');
        setShowResetAdmin(false);
        setResetAdminData({ username: '', admin_code: '' });
      } else {
        setResetAdminMsg('Invalid admin credentials. Please check your username and admin code.');
      }
    } catch (err) {
      setResetAdminMsg(err.response?.data?.error || 'Failed to reset admin. Please verify your credentials.');
    } finally {
      setResetAdminLoading(false);
    }
  };

  // Staff code change handler
  const handleChangeStaffCode = async (e) => {
    e.preventDefault();
    setStaffCodeMsg('');
    if (!selectedStaff) {
      setStaffCodeMsg('Please select a staff member.');
      return;
    }
    if (newStaffCode !== confirmStaffCode) {
      setStaffCodeMsg('Staff codes do not match.');
      return;
    }
    if (!newStaffCode) {
      setStaffCodeMsg('Please enter a new staff code.');
      return;
    }
    setStaffCodeLoading(true);
    try {
      await axios.put(`/staff/${selectedStaff}/code`, {
        staff_code: newStaffCode
      });
      setStaffCodeMsg('Staff code changed successfully!');
      setSelectedStaff('');
      setNewStaffCode('');
      setConfirmStaffCode('');
    } catch (err) {
      setStaffCodeMsg(err.response?.data?.error || 'Failed to change staff code.');
    } finally {
      setStaffCodeLoading(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Settings & Configuration</h1>
          <p>Manage your gym's settings and system configuration.</p>
        </div>
        <div className="hero-actions">
          <FiSettings size={24} />
        </div>
      </div>

      <div className="settings-grid">
        {/* System Information Card */}
        <div className="settings-card">
          <h3><FiInfo /> System Information</h3>
          <div className="system-info-grid">
            <div className="info-item">
              <FiUser />
              <div>
                <span className="info-label">Total Members</span>
                <span className="info-value">{systemInfo.totalMembers}</span>
              </div>
            </div>
            <div className="info-item">
              <FiShield />
              <div>
                <span className="info-label">Total Staff</span>
                <span className="info-value">{systemInfo.totalStaff}</span>
              </div>
            </div>
            <div className="info-item">
              <FiBox />
              <div>
                <span className="info-label">Inventory Items</span>
                <span className="info-value">{systemInfo.totalInventory}</span>
              </div>
            </div>
            <div className="info-item">
              <FiDollarSign />
              <div>
                <span className="info-label">Finance Records</span>
                <span className="info-value">{systemInfo.totalFinances}</span>
              </div>
            </div>
            <div className="info-item">
              <FiDatabase />
              <div>
                <span className="info-label">System Version</span>
                <span className="info-value">{systemInfo.systemVersion}</span>
              </div>
            </div>
            <div className="info-item">
              <FiClock />
              <div>
                <span className="info-label">Last Backup</span>
                <span className="info-value">{systemInfo.lastBackup || 'Never'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Code Management Card */}
        <div className="settings-card">
          <h3><FiShield /> Admin Code Management</h3>
          <form onSubmit={handleChangeAdmin}>
            <div className="form-group">
              <label htmlFor="change-admin-username">Admin Username</label>
              <input 
                id="change-admin-username"
                name="username" 
                className="modal-input"
                value={changeAdmin.username} 
                onChange={e => setChangeAdmin(p => ({ ...p, username: e.target.value }))} 
                placeholder="Enter admin username" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="change-admin-phone">Phone Number</label>
              <input 
                id="change-admin-phone"
                name="phone" 
                className="modal-input"
                value={changeAdmin.phone} 
                onChange={e => setChangeAdmin(p => ({ ...p, phone: e.target.value }))} 
                placeholder="Enter registered phone number" 
                type="tel" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-admin-code">New Admin Code</label>
              <input 
                id="new-admin-code"
                name="new_admin_code" 
                className="modal-input"
                value={changeAdmin.new_admin_code} 
                onChange={e => setChangeAdmin(p => ({ ...p, new_admin_code: e.target.value }))} 
                placeholder="Enter new admin code" 
                type="password" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-new-admin-code">Confirm New Admin Code</label>
              <input 
                id="confirm-new-admin-code"
                name="confirm_admin_code" 
                className="modal-input"
                value={changeAdmin.confirm_admin_code} 
                onChange={e => setChangeAdmin(p => ({ ...p, confirm_admin_code: e.target.value }))} 
                placeholder="Confirm new admin code" 
                type="password" 
              />
            </div>
            <button type="submit" className="btn" disabled={changeAdminLoading}>
              <FiShield />
              {changeAdminLoading ? 'Saving...' : 'Change Admin Code'}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setShowResetAdmin(true)}>
              <FiTrash2 />
              Reset Admin
            </button>
            {changeAdminMsg && <div className={`message ${changeAdminMsg.includes('Failed') || changeAdminMsg.includes('incorrect') ? 'error' : 'success'}`}>{changeAdminMsg}</div>}
          </form>
        </div>

        {/* Staff Code Management Card */}
        <div className="settings-card">
          <h3><FiUsers /> Staff Code Management</h3>
          <form onSubmit={handleChangeStaffCode}>
            <div className="form-group">
              <label htmlFor="staff-select">Select Staff Member</label>
              <select 
                id="staff-select"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="modal-input"
              >
                <option value="">Choose a staff member...</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} - {staff.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="new-staff-code">New Staff Code</label>
              <input 
                id="new-staff-code"
                type="password"
                value={newStaffCode}
                onChange={(e) => setNewStaffCode(e.target.value)}
                className="modal-input"
                placeholder="Enter new staff code"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-staff-code">Confirm Staff Code</label>
              <input 
                id="confirm-staff-code"
                type="password"
                value={confirmStaffCode}
                onChange={(e) => setConfirmStaffCode(e.target.value)}
                className="modal-input"
                placeholder="Confirm new staff code"
              />
            </div>
            <button type="submit" className="btn" disabled={staffCodeLoading}>
              <FiUsers />
              {staffCodeLoading ? 'Saving...' : 'Change Staff Code'}
            </button>
            {staffCodeMsg && <div className={`message ${staffCodeMsg.includes('Failed') ? 'error' : 'success'}`}>{staffCodeMsg}</div>}
          </form>
        </div>

        {/* Inventory Settings Card */}
        <div className="settings-card">
          <h3><FiBox /> Inventory Settings</h3>
          <div className="form-group">
            <label htmlFor="low-stock-threshold">Low Stock Threshold</label>
            <div className="input-with-button">
              <input 
                id="low-stock-threshold"
                type="number"
                min="1"
                max="100"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                className="modal-input"
                placeholder="Enter threshold (e.g., 5)"
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleThresholdSave}
              >
                <FiSave />
                Save
              </button>
            </div>
            <small>Items with stock below this number will be marked as low stock.</small>
            {thresholdMsg && <div className={`message ${thresholdMsg.includes('Failed') ? 'error' : 'success'}`}>{thresholdMsg}</div>}
          </div>
        </div>

        {/* Financial Settings Card */}
        <div className="settings-card">
          <h3><FiDollarSign /> Financial Settings</h3>
          <div className="form-group">
            <label htmlFor="expense-limit">Monthly Expense Limit (₹)</label>
            <div className="input-with-button">
              <input 
                id="expense-limit"
                type="number"
                min="0"
                value={expenseLimit}
                onChange={(e) => setExpenseLimit(parseInt(e.target.value) || 0)}
                className="modal-input"
                placeholder="Enter monthly expense limit"
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleExpenseLimitSave}
              >
                <FiSave />
                Save
              </button>
            </div>
            <small>Set a monthly expense limit to receive alerts when exceeded.</small>
            {expenseLimitMsg && <div className={`message ${expenseLimitMsg.includes('Failed') ? 'error' : 'success'}`}>{expenseLimitMsg}</div>}
          </div>
        </div>

        {/* Dashboard Settings Card */}
        <div className="settings-card">
          <h3><FiGrid /> Dashboard Settings</h3>
          <div className="form-group">
            <label>Dashboard Layout</label>
            <div className="button-group">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleLayoutReset}
              >
                <FiRefreshCw />
                Reset to Default
              </button>
            </div>
            <small>Reset dashboard layout to default configuration.</small>
            {layoutResetMsg && <div className={`message ${layoutResetMsg.includes('Failed') ? 'error' : 'success'}`}>{layoutResetMsg}</div>}
          </div>
        </div>

        {/* Terms and Agreement Card */}
        <div className="settings-card">
          <h3><FiFileText /> Terms and Agreement</h3>
          <div className="form-group">
            <label>Contract & Terms</label>
            <div className="button-group">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowTermsModal(true)}
              >
                <FiFileText />
                View Terms & Agreement
              </button>
            </div>
            <small>View the contract and terms between the gym and our service.</small>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="settings-card">
          <h3><FiMail /> Contact Information</h3>
          <div className="contact-info-section">
            <a 
              href="https://www.instagram.com/solsparrow.co?igsh=OTR4cjNld3Zvdms4" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-item"
            >
              <FiInstagram className="contact-icon" />
              <div className="contact-details">
                <h4>Instagram</h4>
              </div>
            </a>
            <a 
              href="mailto:Solsparrowhq@gmail.com" 
              className="contact-item"
            >
              <FiMail className="contact-icon" />
              <div className="contact-details">
                <h4>Email</h4>
              </div>
            </a>
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <div className="contact-details">
                <h4>Phone 1 (Hyderabad)</h4>
                <span className="contact-text">+91 90591 71196</span>
              </div>
            </div>
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <div className="contact-details">
                <h4>Phone 2 (Pune)</h4>
                <span className="contact-text">+91 63595 52530</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Admin Modal */}
      {showResetAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3><FiAlertTriangle /> Reset Admin</h3>
            <p className="danger-text">🚨 This will completely reset the admin account. All admin access will be lost and you'll need to create a new admin account.</p>
            <form onSubmit={handleResetAdmin}>
              <div className="form-group">
                <label htmlFor="reset-admin-username">Admin Username</label>
                <input 
                  id="reset-admin-username"
                  name="username" 
                  className="modal-input"
                  value={resetAdminData.username} 
                  onChange={e => setResetAdminData(p => ({ ...p, username: e.target.value }))} 
                  placeholder="Enter admin username" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="reset-admin-code">Admin Code</label>
                <input 
                  id="reset-admin-code"
                  name="admin_code" 
                  className="modal-input"
                  value={resetAdminData.admin_code} 
                  onChange={e => setResetAdminData(p => ({ ...p, admin_code: e.target.value }))} 
                  placeholder="Enter admin code" 
                  type="password" 
                />
              </div>
              <button type="submit" className="btn btn-danger" disabled={resetAdminLoading}>
                <FiTrash2 />
                {resetAdminLoading ? 'Resetting...' : 'Reset Admin'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowResetAdmin(false)}>
                Cancel
              </button>
              {resetAdminMsg && <div className={`message ${resetAdminMsg.includes('Failed') || resetAdminMsg.includes('Invalid') ? 'error' : 'success'}`}>{resetAdminMsg}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Terms and Agreement Modal */}
      <TermsAgreementModal 
        show={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Agreement"
      />
    </div>
  );
};

export default Settings;