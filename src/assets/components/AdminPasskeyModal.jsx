import React, { useState } from 'react';

const AdminPasskeyModal = ({ show, isOpen, onClose, onSuccess, label, title, message }) => {
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Support both 'show' and 'isOpen' props for compatibility
  const isVisible = show || isOpen;

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!adminCode) {
      setError('Admin code is required.');
      setLoading(false);
      return;
    }

    // Pass admin code in the format expected by other pages
    onSuccess({ code: adminCode });
    setAdminCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title || "Admin Confirmation Required"}</h3>
        {message && <div className="modal-message">{message}</div>}
        {label && <div className="modal-label">{label}</div>}
        <form onSubmit={handleVerify}>
          <input
            type="password"
            placeholder="Admin Code"
            value={adminCode}
            onChange={e => setAdminCode(e.target.value)}
            autoFocus
            required
          />
          <div className="modal-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Cancel
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-family: 'Poppins', sans-serif;
        }
        .modal-content {
          background: #23272f;
          padding: 2.5rem;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          min-width: 400px;
          max-width: 500px;
          border: 1px solid #28B295;
          color: #E3E3E0;
        }
        .modal-content h3 {
          margin: 0 0 1rem 0;
          color: #28B295;
          font-weight: 700;
          font-size: 1.5rem;
          text-align: center;
        }
        .modal-message {
          margin-bottom: 1rem;
          font-weight: 500;
          color: #b0b3b8;
          text-align: center;
          font-size: 0.95rem;
        }
        .modal-label {
          margin-bottom: 1rem;
          font-weight: 600;
          color: #D6F84C;
          text-align: center;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .modal-content input {
          display: block;
          width: 100%;
          margin-bottom: 1.5rem;
          padding: 1rem 1.2rem;
          font-size: 1rem;
          background: #1C1C1E;
          border: 1.5px solid #28B295;
          border-radius: 10px;
          color: #E3E3E0;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .modal-content input:focus {
          outline: none;
          border-color: #D6F84C;
          box-shadow: 0 0 0 3px rgba(214,248,76,0.2);
        }
        .modal-content input::placeholder {
          color: #b0b3b8;
          opacity: 1;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .modal-content button {
          padding: 0.8rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          border: 2px solid;
        }
        .btn-primary {
          background: #28B295;
          color: #23272f;
          border-color: #28B295;
        }
        .btn-primary:hover:not(:disabled) {
          background: #23a484;
          border-color: #23a484;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40,178,149,0.3);
        }
        .btn-secondary {
          background: #23272f;
          color: #28B295;
          border-color: #28B295;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #28B295;
          color: #23272f;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40,178,149,0.3);
        }
        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .error-message {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 1rem;
          text-align: center;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .modal-content {
            min-width: 320px;
            margin: 1rem;
            padding: 2rem 1.5rem;
          }
          .modal-actions {
            flex-direction: column;
          }
          .modal-content button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPasskeyModal; 