import React, { useState, useEffect } from "react";
import api from '../service/api';
import MemberTable from "../assets/components/MemberTable";
import SearchBar from "../assets/components/SearchBar";
import MemberForm from "../assets/components/MemberForm";
import BodyMeasurementsForm from "../assets/components/BodyMeasurementsForm";
import AdminPasskeyModal from '../assets/components/AdminPasskeyModal';
import { FaUserPlus, FaEnvelope, FaUsers, FaUserTimes, FaUserClock, FaChartBar, FaFilter, FaDumbbell } from "react-icons/fa";
import PersonalTrainingWidget from "../assets/components/widgets/PersonalTrainingWidget";
import { FiUsers, FiUserCheck, FiUserX, FiAlertTriangle, FiMessageCircle, FiPlus } from 'react-icons/fi';
import "./Members.css";
import COLORS from "../data/colors";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showBodyForm, setShowBodyForm] = useState(false);
  const [bodyMember, setBodyMember] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [pendingEditData, setPendingEditData] = useState(null);
  const [pendingAddData, setPendingAddData] = useState(null);
  const [addOrEditMode, setAddOrEditMode] = useState(null); // 'add' or 'edit'

  const today = new Date();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [members, activeFilter, packageFilter]);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/members");
      setMembers(res.data);
      setFilteredMembers(res.data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...members];
  
    if (activeFilter === 'expired') {
      filtered = filtered.filter(m => m.expiry_date && new Date(m.expiry_date) < today);
    } else if (activeFilter === 'expiring') {
      filtered = filtered.filter(m => {
        if (!m.expiry_date) return false;
        const exp = new Date(m.expiry_date);
        const diff = (exp - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });
    }
  
    if (packageFilter !== 'all') {
      filtered = filtered.filter(m => m.package === packageFilter);
    }
  
    setFilteredMembers(filtered);
  };

  const handleSearch = (query) => {
    const lower = query.toLowerCase();
    const result = members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        (m.member_id && m.member_id.toString().toLowerCase().includes(lower))
    );
    setFilteredMembers(result);
  };

  const handleSave = async (newMember) => {
    if (editing) {
      setPendingEdit(editing.id);
      setPendingEditData(newMember);
      setAddOrEditMode('edit');
      setShowCodeModal(true);
    } else {
      setPendingAddData(newMember);
      setAddOrEditMode('add');
      setShowCodeModal(true);
    }
  };

  const handleSaveBodyMeasurements = async (measurements) => {
    if (!bodyMember) return;
    
    try {
      // Call the API to update only body measurements
      await api.put(`/members/${bodyMember.id}/measurements`, measurements);
      
      // Refresh the members list
      fetchMembers();
      
      // Close the form
      setShowBodyForm(false);
      setBodyMember(null);
      
      alert('✅ Body measurements saved successfully!');
    } catch (error) {
      console.error('Error saving body measurements:', error);
      alert('❌ Failed to save body measurements. Please try again.');
    }
  };

  // Called when modal is confirmed
  const handleCodeModalSuccess = async ({ code }) => {
    setShowCodeModal(false);
    try {
      if (addOrEditMode === 'edit') {
        await api.put(`/members/${pendingEdit}`, { ...pendingEditData, admin_code: code, staff_code: code, created_by: code });
        setShowForm(false);
        setEditing(null);
        setPendingEdit(null);
        setPendingEditData(null);
        setAddOrEditMode(null);
        fetchMembers();
      } else if (addOrEditMode === 'add') {
        await api.post("/members", { ...pendingAddData, created_by: code });
        setShowForm(false);
        setEditing(null);
        setPendingAddData(null);
        setAddOrEditMode(null);
        fetchMembers();
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert(error.response?.data?.message || 'Failed to save.');
    }
  };

  const handleDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => api.delete(`/members/${id}`)));
      fetchMembers();
    } catch (error) {
      console.error("Error deleting members:", error);
    }
  };

  const handleWhatsappReminders = async () => {
    setWhatsappLoading(true);
    setWhatsappMessage("");
    try {
      const res = await api.get("/members/send-expiry-reminders");
      setWhatsappMessage(res.data.message || "WhatsApp reminders sent successfully!");
    } catch (error) {
      setWhatsappMessage("Failed to send WhatsApp reminders.");
      console.error("Failed to send WhatsApp reminders:", error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleOpenBodyMeasurements = (member) => {
    setBodyMember(member);
    setShowBodyForm(true);
  };

  const packageTypes = [...new Set(members.map(m => m.package))];
  
  // Calculate statistics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => {
    if (!m.expiry_date) return false;
    return new Date(m.expiry_date) >= today;
  }).length;
  const expiredMembers = members.filter(m => m.expiry_date && new Date(m.expiry_date) < today).length;
  const expiringMembers = members.filter(m => {
    if (!m.expiry_date) return false;
    const exp = new Date(m.expiry_date);
    const diff = (exp - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
  const ptMembers = members.filter(m => (m.personal_training || 'No') === 'Yes').length;

  return (
    <div className="members-page">
      {/* Hero Section */}
      <div className="members-hero-section">
        <div className="members-hero-content">
          <div className="members-header-left">
            <h1>Member Management</h1>
            <p>An overview of your gym's membership status.</p>
          </div>
          <div className="members-action-buttons">
            <button className="members-btn" onClick={handleWhatsappReminders} disabled={whatsappLoading}>
              <FiMessageCircle />
              <span>{whatsappLoading ? 'Sending...' : 'Send WhatsApp Reminders'}</span>
            </button>
            <button className="members-btn members-btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus />
              <span>Add New Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="members-stats-grid">
        <div className="members-stat-card total">
          <div className="members-stat-icon">
            <FiUsers />
          </div>
          <div className="members-stat-content">
            <h3>{totalMembers}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="members-stat-card active">
          <div className="members-stat-icon">
            <FiUserCheck />
          </div>
          <div className="members-stat-content">
            <h3>{activeMembers}</h3>
            <p>Active Members</p>
          </div>
        </div>
        <div className="members-stat-card expiring">
          <div className="members-stat-icon">
            <FiAlertTriangle />
          </div>
          <div className="members-stat-content">
            <h3>{expiringMembers}</h3>
            <p>Expiring Soon</p>
          </div>
        </div>
        <div className="members-stat-card expired">
          <div className="members-stat-icon">
            <FiUserX />
          </div>
          <div className="members-stat-content">
            <h3>{expiredMembers}</h3>
            <p>Expired Members</p>
          </div>
        </div>
        <div className="members-stat-card pt">
          <div className="members-stat-icon">
            <FaDumbbell />
          </div>
          <div className="members-stat-content">
            <h3>{ptMembers}</h3>
            <p>Personal Training</p>
          </div>
        </div>
      </div>

      {/* Personal Training Widget */}
      <div className="members-pt-section">
        <h3>Personal Training Members</h3>
        <PersonalTrainingWidget members={members} />
      </div>

      {/* Package Distribution Section */}
      <div className="members-package-distribution-section">
        <h3>Membership Package Distribution</h3>
        <div className="members-package-distribution-list">
          {Object.entries(
            members.filter(m => m.package && !['one month', '1 month', 'monthly'].includes((m.package || '').toLowerCase()))
              .reduce((acc, m) => {
                const key = m.package;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {})
          ).map(([pkg, count]) => {
            const percent = totalMembers > 0 ? ((count / totalMembers) * 100).toFixed(1) : 0;
            return (
              <div key={pkg} className="members-package-card">
                <div className="members-package-name">{pkg}</div>
                <div className="members-package-count">{count}</div>
                <div className="members-package-percent">{percent}% of members</div>
              </div>
            );
          })}
          {Object.keys(
            members.filter(m => m.package && !['one month', '1 month', 'monthly'].includes((m.package || '').toLowerCase()))
              .reduce((acc, m) => {
                const key = m.package;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {})
          ).length === 0 && (
            <div className="members-package-none">No multi-month packages found.</div>
          )}
        </div>
      </div>

      {/* Email Message */}
      {whatsappMessage && (
        <div className={`members-sms-message ${whatsappMessage.includes('Failed') ? 'error' : 'success'}`}>
          {whatsappMessage}
        </div>
      )}

      {/* Search and Controls Section */}
      <div className="members-controls-section">
        <div className="members-search-section">
          <SearchBar onSearch={handleSearch} />
          <button 
            className="members-btn members-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            <span>Filters</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="members-filters-panel">
            <div className="members-filter-group">
              <label>Status Filter:</label>
              <div className="members-filter-buttons">
                <button 
                  onClick={() => setActiveFilter('all')} 
                  className={activeFilter === 'all' ? 'active' : ''}
                >
                  <FaUsers /> All
                </button>
                <button 
                  onClick={() => setActiveFilter('expired')} 
                  className={activeFilter === 'expired' ? 'active' : ''}
                >
                  <FaUserTimes /> Expired
                </button>
                <button 
                  onClick={() => setActiveFilter('expiring')} 
                  className={activeFilter === 'expiring' ? 'active' : ''}
                >
                  <FaUserClock /> Expiring Soon
                </button>
              </div>
            </div>
            
            <div className="members-filter-group">
              <label>Package Filter:</label>
              <select 
                onChange={(e) => setPackageFilter(e.target.value)} 
                className="members-package-filter"
                value={packageFilter}
              >
                <option value="all">All Packages</option>
                {packageTypes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="members-results-summary">
        <div className="members-results-info">
          <FaChartBar />
          <span>Showing {filteredMembers.length} of {totalMembers} members</span>
        </div>
        {activeFilter !== 'all' && (
          <div className="members-active-filter">
            Filter: {activeFilter === 'expired' ? 'Expired Members' : 'Expiring Soon'}
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="members-table-section">
        <MemberTable
          members={filteredMembers}
          onEdit={(member) => {
            setEditing(member);
            setShowForm(true);
          }}
          onDelete={handleDelete}
          onOpenBodyMeasurements={handleOpenBodyMeasurements}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <MemberForm
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          member={editing}
        />
      )}
      {showBodyForm && (
        <BodyMeasurementsForm
          member={bodyMember}
          measurements={{
            height: bodyMember?.height || '',
            weight: bodyMember?.weight || '',
            chest: bodyMember?.chest || '',
            waist: bodyMember?.waist || '',
            hips: bodyMember?.hips || '',
            biceps: bodyMember?.biceps || '',
            thighs: bodyMember?.thighs || ''
          }}
          onClose={() => setShowBodyForm(false)}
          onSave={handleSaveBodyMeasurements}
        />
      )}
      <AdminPasskeyModal
        show={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSuccess={handleCodeModalSuccess}
        label={
          addOrEditMode === 'add'
            ? "Enter your Admin/Staff ID to confirm adding member:"
            : "Enter your Admin/Staff ID to confirm editing member:"
        }
      />
    </div>
  );
};

export default Members;
