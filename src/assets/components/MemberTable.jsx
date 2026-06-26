import React, { useState, useEffect } from "react";
import api from '../../service/api';
import "./MemberTable.css";
import { FaEdit, FaTrash, FaStickyNote, FaUser, FaEnvelope, FaDumbbell, FaCommentDots, FaWeight, FaCommentAlt, FaRulerHorizontal } from 'react-icons/fa';
import AdminPasskeyModal from './AdminPasskeyModal';
import { useAuth } from '../../data/AuthContext';
import { getMemberPhotoUrl } from '../../utils/memberPhoto';

const MemberTable = ({ members, onEdit, onDelete, onOpenBodyMeasurements }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState({});
  const [loadingPayments, setLoadingPayments] = useState({});
  const { user, isAdmin, isStaff } = useAuth();

  // Debug: log the current user object
  console.log('Current user:', user);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelect = (e, id) => {
    e.stopPropagation(); 
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(members.map(m => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSendWhatsapp = async (member) => {
    if (!member.phone) {
      alert(`⚠️ ${member.name} has no phone number.`);
      return;
    }

    try {
      await api.post("/members/send-welcome/" + member.id);
      alert(`✅ Welcome WhatsApp sent to ${member.name}`);
    } catch (error) {
      console.error("WhatsApp Error:", error);
      alert(`❌ Failed to send WhatsApp to ${member.name}`);
    }
  };

  const handleSendBulkWhatsapp = async () => {
    try {
      const res = await api.get("/members/send-expiry-reminders");
      alert(res.data.message || "✅ WhatsApp reminders sent.");
    } catch (error) {
      console.error("Bulk WhatsApp error:", error);
      alert("❌ Failed to send bulk WhatsApp reminders.");
    }
  };

  const handleSingleDelete = (id) => {
    setDeleteMode('single');
    setPendingDeleteIds([id]);
    setShowPasskeyModal(true);
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setDeleteMode('bulk');
    setPendingDeleteIds(selected);
    setShowPasskeyModal(true);
  };

  const handlePasskeySuccess = async ({ code }) => {
    setShowPasskeyModal(false);
    try {
      if (deleteMode === 'single') {
        await api.post('/members/delete-one', { id: pendingDeleteIds[0], admin_code: code, staff_code: code });
        alert('🗑️ Member deleted.');
        onDelete([pendingDeleteIds[0]]);
      } else if (deleteMode === 'bulk') {
        await api.post('/members/delete', { ids: pendingDeleteIds, admin_code: code, staff_code: code });
        alert('🗑️ Selected members deleted.');
        onDelete(pendingDeleteIds);
        setSelected([]);
      }
      setPendingDeleteIds([]);
      setDeleteMode(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const today = new Date();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString()}`;
  };

  const getMemberPhoto = (member) => getMemberPhotoUrl(member.photo, member.name);

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  const fetchPaymentHistory = async (member) => {
    setLoadingPayments((prev) => ({ ...prev, [member.id]: true }));
    try {
      const res = await api.get(`/members/${member.id}/payments`);
      setPaymentHistory((prev) => ({ ...prev, [member.id]: res.data }));
    } catch (err) {
      setPaymentHistory((prev) => ({ ...prev, [member.id]: [] }));
    } finally {
      setLoadingPayments((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  useEffect(() => {
    if (expandedId) {
      const member = members.find((m) => m.id === expandedId);
      if (member && paymentHistory[member.id] === undefined) {
        fetchPaymentHistory(member);
      }
    }
    // eslint-disable-next-line
  }, [expandedId]);

  return (
    <div className="members-table-wrapper">
      <div className="members-table-header">
        <div className="members-bulk-actions">
          <label className="members-select-all-label">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={selected.length === members.length && members.length > 0}
            />
            <span>Select All</span>
          </label>
          {selected.length > 0 && (
            <>
              <button
                className="members-bulk-sms-btn"
                onClick={handleSendBulkWhatsapp}
              >
                <FaCommentDots />
                <span>Send WhatsApp Reminders ({selected.length})</span>
              </button>
              <button
                className="members-bulk-delete-btn"
                onClick={handleBulkDelete}
              >
                <FaTrash />
                <span>Delete ({selected.length})</span>
              </button>
            </>
          )}
        </div>
        <div className="members-table-info">
          <span>{members.length} members</span>
        </div>
      </div>

      <div className="members-table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th className="members-checkbox-header"></th>
              <th>Photo</th>
              <th>Member ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Package</th>
              <th>Join Date</th>
              <th>Expiry Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelected = selected.includes(member.id);
              const isExpired = member.expiry_date && new Date(member.expiry_date) < today;
              
              return (
                <React.Fragment key={member.id}>
                  <tr 
                    className={`members-row ${isSelected ? 'selected' : ''} ${isExpired ? 'expired' : ''}`}
                    onClick={() => toggleExpand(member.id)}
                  >
                    <td className="members-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelect(e, member.id)}
                      />
                    </td>
                    <td className="members-photo-cell">
                      <img
                        src={getMemberPhoto(member)}
                        alt={member.name}
                        className="members-avatar"
                      />
                    </td>
                    <td className="members-id-cell">{member.member_id}</td>
                    <td className="members-name-cell">{member.name}</td>
                    <td>
                      <span className="members-phone-link">
                        <FaCommentDots /> {member.phone || 'N/A'}
                      </span>
                    </td>
                    <td>{member.package}</td>
                    <td>{formatDate(member.join_date)}</td>
                    <td>{formatDate(member.expiry_date)}</td>
                    <td className="members-total-amount-cell">{formatCurrency(member.total_amount)}</td>
                    <td className="members-paid-amount-cell">{formatCurrency(member.paid_amount)}</td>
                    <td className="members-due-amount-cell">
                      {formatCurrency(member.total_amount - member.paid_amount)}
                    </td>
                    <td className="members-actions-cell">
                      <div className="members-action-buttons">
                        <button
                          onClick={(e) => handleActionClick(e, () => handleSendWhatsapp(member))}
                          className="members-action-btn members-action-btn-sms"
                          title="Send WhatsApp"
                        >
                          <FaCommentAlt />
                        </button>
                        <button
                          onClick={(e) => handleActionClick(e, () => onOpenBodyMeasurements(member))}
                          className="members-action-btn members-action-btn-measure"
                          title="Body Measurements"
                        >
                          <FaRulerHorizontal />
                        </button>
                        <button
                          onClick={(e) => handleActionClick(e, () => onEdit(member))}
                          className="members-action-btn members-action-btn-edit"
                          title="Edit Member"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="members-action-btn members-action-btn-delete"
                          onClick={(e) => handleSingleDelete(member.id)}
                          title="Delete Member"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === member.id && (
                    <tr className="members-expanded-row">
                      <td colSpan="12">
                        <div className="members-details-expanded">
                          <div className="members-expanded-profile">
                            <img
                              src={getMemberPhoto(member)}
                              alt={member.name}
                              className="members-expanded-photo"
                            />
                            <div>
                              <h4>{member.name}</h4>
                              <p>{member.member_id}</p>
                            </div>
                          </div>
                          <div className="members-details-grid">
                            <div className="members-detail-section">
                              <p><strong>Address:</strong> {member.address || "N/A"}</p>
                              <p><strong>Phone:</strong> {member.phone || "N/A"}</p>
                              <p><strong>Email:</strong> {member.email || "N/A"}</p>
                              <p><strong>Health Issues:</strong> {member.health_issues || "N/A"}</p>
                              <p><strong>Blood Group:</strong> {member.blood_group || "N/A"}</p>
                            </div>
                            <div className="members-detail-section">
                              <p><strong>Height:</strong> {member.height || "-"} cm</p>
                              <p><strong>Weight:</strong> {member.weight || "-"} kg</p>
                              <p><strong>Chest:</strong> {member.chest || "-"} cm</p>
                              <p><strong>Waist:</strong> {member.waist || "-"} cm</p>
                            </div>
                            <div className="members-detail-section">
                              <p><strong>Hips:</strong> {member.hips || "-"} cm</p>
                              <p><strong>Biceps:</strong> {member.biceps || "-"} cm</p>
                              <p><strong>Thighs:</strong> {member.thighs || "-"} cm</p>
                              <p><strong>Extra Details:</strong> {member.extra_details || "N/A"}</p>
                            </div>
                          </div>
                          {/* Payment/Renewal History Section */}
                          <div className="members-payment-history-section">
                            <h4>Payment & Renewal History</h4>
                            <div className="members-payment-history-summary">
                              <span><strong>Join Date:</strong> {formatDate(member.join_date)}</span>
                              <span><strong>Expiry Date:</strong> {formatDate(member.expiry_date)}</span>
                              <span><strong>Package:</strong> {member.package || 'N/A'}</span>
                            </div>
                            {loadingPayments[member.id] ? (
                              <div>Loading...</div>
                            ) : (
                              <table className="members-payment-history-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(paymentHistory[member.id] && paymentHistory[member.id].length > 0) ? (
                                    paymentHistory[member.id].map((payment) => (
                                      <tr key={payment.id}>
                                        <td>{formatDate(payment.date)}</td>
                                        <td>{formatCurrency(payment.amount)}</td>
                                        <td>{payment.payment}</td>
                                        <td>{payment.description}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="4">No payment/renewal history found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        {members.length === 0 && (
          <div className="empty-state">
            <FaUser />
            <h3>No Members Found</h3>
            <p>Add your first member to get started</p>
          </div>
        )}
      </div>
      <AdminPasskeyModal
        show={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        onSuccess={handlePasskeySuccess}
        label="Enter your Admin/Staff ID to confirm deletion:"
      />
    </div>
  );
};

export default MemberTable;


