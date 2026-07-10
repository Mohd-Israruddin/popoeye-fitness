import React, { useState, useEffect } from 'react';
import api from '../../../service/api';
import './DuePaymentsWidget.css';
import { FaMoneyBillWave } from 'react-icons/fa';

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const DuePaymentsWidget = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDuePayments = async () => {
      try {
        const response = await api.get('/members/due-payments');
        setMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch due payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDuePayments();
  }, []);

  const totalDue = members.reduce(
    (sum, m) => sum + (Number(m.pending_amount) || 0),
    0
  );

  if (loading) {
    return <div className="widget-loading">Loading due payments...</div>;
  }

  return (
    <div className="due-payments-widget">
      {members.length > 0 ? (
        <>
          <div className="due-payments-summary">
            <span>{members.length} member{members.length !== 1 ? 's' : ''} with dues</span>
            <span className="due-payments-total">{formatCurrency(totalDue)}</span>
          </div>
          <ul className="due-payments-list">
            {members.map((member) => (
              <li key={member.id} className="due-payments-item">
                <FaMoneyBillWave className="due-payments-icon" />
                <div className="due-payments-details">
                  <span className="due-payments-name">{member.name}</span>
                  <span className="due-payments-id">ID: {member.member_id}</span>
                </div>
                <span className="due-payments-amount">
                  {formatCurrency(member.pending_amount)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty-message">No pending payments. All members are up to date.</p>
      )}
    </div>
  );
};

export default DuePaymentsWidget;
