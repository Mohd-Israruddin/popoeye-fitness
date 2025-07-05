import React, { useState, useEffect } from "react";
import AddStaffForm from "./AddStaffForm";
import StaffCard from "./StaffCard";
import StaffDetailModal from "./StaffDetailModal";
import "./Staff.css";
import { FaPlus, FaUsers, FaUserCheck, FaDumbbell, FaPhone } from 'react-icons/fa';
import api from "../../service/api";
import eventBus from "../../service/eventBus";
import AdminPasskeyModal from '../../assets/components/AdminPasskeyModal';
import { useAuth } from '../../data/AuthContext';
import { Link } from 'react-router-dom';
import StaffLog from './StaffLog';

const Staff = () => {
  const { isAdmin } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [pendingEditId, setPendingEditId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'edit' or 'delete'
  const [editCredentials, setEditCredentials] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', address: '', username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();

    const handleUpdate = () => fetchStaff();
    eventBus.on('staff-data-updated', handleUpdate);

    return () => {
      eventBus.remove('staff-data-updated', handleUpdate);
    };
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaffList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOrUpdate = async (staffData) => {
    try {
      console.log('Saving staff data:', staffData);
      console.log('Is editing:', isEditing);
      console.log('Selected staff:', selectedStaff);
      
      if (isEditing && selectedStaff) {
        console.log('Updating staff with ID:', selectedStaff.id);
        await api.put(`/staff/${selectedStaff.id}`, { ...staffData, ...editCredentials });
      } else {
        console.log('Adding new staff member');
        await api.post('/staff', staffData);
      }
      console.log('Staff saved successfully');
      fetchStaff();
      handleCancel();
    } catch (error) {
      console.error('Error saving staff member:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleMarkSalaryPaid = async (id, status) => {
    try {
      const res = await api.put(`/staff/${id}/salary-status`, { salary_status: status });
      const updatedStaff = res.data;
      setStaffList(staffList.map(s => s.id === id ? updatedStaff : s));
      setSelectedStaff(updatedStaff);
    } catch (error) {
      console.error('Error updating salary status:', error);
    }
  };

  const handleEditClick = (id) => {
    setPendingEditId(id);
    setPendingAction('edit');
    setShowPasskeyModal(true);
  };

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setPendingAction('delete');
    setShowPasskeyModal(true);
  };

  const handlePasskeySuccess = ({ code }) => {
    setShowPasskeyModal(false);
    if (pendingAction === 'edit') {
      setEditCredentials({ admin_code: code });
      openEditModal(pendingEditId);
    } else if (pendingAction === 'delete') {
      deleteStaff(pendingDeleteId, code);
    }
    setPendingEditId(null);
    setPendingDeleteId(null);
    setPendingAction(null);
  };

  const deleteStaff = async (id, admin_code) => {
    try {
      await api.post(`/staff/${id}/delete`, { admin_code });
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const handleCancel = () => {
    setSelectedStaff(null);
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setIsEditing(false);
    setShowAddForm(true);
  };

  const openEditModal = (id) => {
    setSelectedStaff(staffList.find(s => s.id === id));
    setIsEditing(true);
    setShowAddForm(false);
  };

  const handleOpenForm = (staff = null) => {
    setEditStaff(staff);
    setForm(staff ? { ...staff, password: '' } : { name: '', role: '', phone: '', email: '', address: '', username: '', password: '' });
    setShowForm(true);
    setError('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditStaff(null);
    setError('');
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editStaff) {
        await api.put(`/staff/${editStaff.id}`, form);
      } else {
        await api.post('/staff', form);
      }
      fetchStaff();
      handleCloseForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save staff');
    }
  };

  // Calculate stats
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(staff => staff.status === 'Active').length;
  const trainers = staffList.filter(staff => staff.role === 'Trainer').length;
  const receptionists = staffList.filter(staff => staff.role === 'Receptionist').length;

  if (!isAdmin) return <div>Not authorized.</div>;

  return (
    <div className="staff-page">
      {/* Hero Section */}
      <div className="staff-hero-section">
        <div className="staff-hero-content">
          <h1>Staff Management</h1>
          <p>Oversee all staff members, roles, and schedules.</p>
        </div>
        <div className="staff-hero-actions">
          <button className="staff-add-btn" onClick={handleAddNew}>
            <FaPlus /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="staff-stat-card total">
          <div className="staff-stat-icon">
            <FaUsers />
          </div>
          <div className="staff-stat-content">
            <p>Total Staff</p>
            <h3>{totalStaff}</h3>
          </div>
        </div>
        <div className="staff-stat-card active">
          <div className="staff-stat-icon">
            <FaUserCheck />
          </div>
          <div className="staff-stat-content">
            <p>Active Staff</p>
            <h3>{activeStaff}</h3>
          </div>
        </div>
        <div className="staff-stat-card trainers">
          <div className="staff-stat-icon">
            <FaDumbbell />
          </div>
          <div className="staff-stat-content">
            <p>Trainers</p>
            <h3>{trainers}</h3>
          </div>
        </div>
        <div className="staff-stat-card receptionists">
          <div className="staff-stat-icon">
            <FaPhone />
          </div>
          <div className="staff-stat-content">
            <p>Receptionists</p>
            <h3>{receptionists}</h3>
          </div>
        </div>
      </div>

      {/* Add Staff Form */}
      {(showAddForm || isEditing) && (
        <AddStaffForm 
          onSave={handleAddOrUpdate}
          onCancel={handleCancel}
          staff={selectedStaff}
        />
      )}

      {/* Staff Grid */}
      <div className="staff-grid">
        {staffList.map((staff) => (
          <StaffCard
            key={staff.id}
            staffMember={staff}
            onSelect={() => setSelectedStaff(staff)}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {selectedStaff && !isEditing && !showAddForm && (
        <StaffDetailModal 
          staff={selectedStaff} 
          onClose={handleCancel}
          onEdit={() => openEditModal(selectedStaff.id)}
          onMarkSalaryPaid={handleMarkSalaryPaid}
        />
      )}

      <AdminPasskeyModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        onSuccess={handlePasskeySuccess}
      />

      {showForm && (
        <div className="modal-overlay">
          <form className="staff-form" onSubmit={handleSubmit}>
            <h3>{editStaff ? 'Edit Staff' : 'Add Staff'}</h3>
            {error && <div className="error-msg">{error}</div>}
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
            <input name="role" placeholder="Role" value={form.role} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required={!editStaff} />
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={handleCloseForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Staff;
