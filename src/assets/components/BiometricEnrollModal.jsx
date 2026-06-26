import React, { useState, useEffect } from 'react';
import axios from '../../service/api';
import { toast } from 'react-toastify';
import { FaFingerprint, FaTimes } from 'react-icons/fa';
import './BiometricEnrollModal.css';

const BiometricEnrollModal = ({ member, isOpen, onClose, onSuccess }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [biometricUserId, setBiometricUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      const response = await axios.get('/biometric/devices');
      setDevices(response.data.filter(d => d.status === 'active'));
    } catch (error) {
      toast.error('Failed to load devices');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    
    if (!selectedDevice || !biometricUserId) {
      toast.error('Please select a device and enter biometric user ID');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/biometric/members/${member.id}/enroll`, {
        device_id: selectedDevice,
        biometric_user_id: parseInt(biometricUserId),
        password: password || null
      });
      
      toast.success('Member enrolled successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to enroll member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="biometric-enroll-modal-overlay" onClick={onClose}>
      <div className="biometric-enroll-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="biometric-enroll-modal-header">
          <h2>
            <FaFingerprint /> Enroll {member.name} to Biometric Device
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleEnroll}>
          <div className="form-group">
            <label>Select Device *</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              required
            >
              <option value="">Choose a device...</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.ip_address})
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="form-hint">
                No active devices found. Please add and activate a device first.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Biometric User ID *</label>
            <input
              type="number"
              value={biometricUserId}
              onChange={(e) => setBiometricUserId(e.target.value)}
              placeholder="Enter User ID from device (e.g., 1, 2, 3...)"
              required
              min="1"
            />
            <p className="form-hint">
              This is the User ID assigned on the biometric device when you enrolled the member's fingerprint/face.
            </p>
          </div>

          <div className="form-group">
            <label>Password (Optional)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional password for device access"
            />
            <p className="form-hint">
              Some devices support password authentication as an alternative to biometric.
            </p>
          </div>

          <div className="enrollment-steps">
            <h3>Before Enrolling:</h3>
            <ol>
              <li>Go to your biometric device</li>
              <li>Add a new user and assign a User ID</li>
              <li>Enroll the member's fingerprint or face</li>
              <li>Note the User ID assigned</li>
              <li>Enter that User ID above</li>
            </ol>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || devices.length === 0}>
              {loading ? 'Enrolling...' : 'Enroll Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BiometricEnrollModal;

