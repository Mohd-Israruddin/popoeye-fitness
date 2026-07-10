import React, { useState, useEffect } from 'react';
import api from '../../../service/api';
import './PersonalTrainingWidget.css';
import { FaDumbbell } from 'react-icons/fa';

const PersonalTrainingWidget = ({ members: membersProp }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (membersProp) {
      setMembers(
        membersProp.filter((m) => (m.personal_training || 'No') === 'Yes')
      );
      setLoading(false);
      return;
    }

    const fetchPtMembers = async () => {
      try {
        const response = await api.get('/members/personal-training');
        setMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch personal training members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPtMembers();
  }, [membersProp]);

  if (loading) {
    return <div className="widget-loading">Loading personal training members...</div>;
  }

  return (
    <div className="pt-widget">
      {members.length > 0 ? (
        <>
          <div className="pt-widget-summary">
            <span>{members.length} member{members.length !== 1 ? 's' : ''} on PT</span>
          </div>
          <ul className="pt-widget-list">
            {members.map((member) => (
              <li key={member.id} className="pt-widget-item">
                <FaDumbbell className="pt-widget-icon" />
                <div className="pt-widget-details">
                  <span className="pt-widget-name">{member.name}</span>
                  <span className="pt-widget-id">ID: {member.member_id}</span>
                </div>
                <span className="pt-widget-badge">Yes</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty-message">No members enrolled in personal training.</p>
      )}
    </div>
  );
};

export default PersonalTrainingWidget;
