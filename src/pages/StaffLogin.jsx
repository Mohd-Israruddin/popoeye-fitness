import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../data/AuthContext';
import TermsAgreementModal from '../assets/components/TermsAgreementModal';

const StaffLogin = () => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Admin setup state
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [setupData, setSetupData] = useState({ admin_code: '', username: '', email: '', phone: '' });
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  
  // Terms agreement state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    // Check if any admin exists
    axios.get('/admin/exists')
      .then(res => {
        setAdminExists(res.data.exists);
        setCheckingAdmin(false);
      })
      .catch(() => {
        setAdminExists(true); // fallback: show login
        setCheckingAdmin(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/login', { id: userId });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid ID');
    }
  };

  const handleSetupChange = (e) => {
    setSetupData({ ...setupData, [e.target.name]: e.target.value });
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');
    
    // Show terms agreement first if not already accepted
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    
    try {
      await axios.post('/admin/setup', setupData);
      setSetupSuccess(true);
      setAdminExists(true);
    } catch (err) {
      setSetupError(err.response?.data?.error || 'Setup failed');
    }
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Automatically submit the form after accepting terms
    handleSetupSubmit({ preventDefault: () => {} });
  };

  if (checkingAdmin) {
    return <div>Loading...</div>;
  }

  if (!adminExists) {
    return (
      <div className="admin-setup-page">
        <div className="setup-container">
          <div className="setup-header">
            <div className="setup-logo">
              <span role="img" aria-label="Gym">💪</span>
            </div>
            <h1>Welcome to Solsparrow</h1>
            <p>Let's set up your gym management system</p>
          </div>
          
          <div className="setup-card">
            <div className="setup-card-header">
              <h2>Initial Admin Setup</h2>
              <p>Create your first administrator account</p>
            </div>
            
            <form className="setup-form" onSubmit={handleSetupSubmit}>
              {setupError && <div className="setup-error">{setupError}</div>}
              {setupSuccess && <div className="setup-success">✅ Admin created successfully! Please log in.</div>}
              
              <div className="form-group">
                <label htmlFor="admin_code">Company Unique ID</label>
                <input
                  id="admin_code"
                  type="password"
                  name="admin_code"
                  placeholder="Enter your unique company ID"
                  value={setupData.admin_code}
                  onChange={handleSetupChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="username">Admin Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={setupData.username}
                  onChange={handleSetupChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Admin Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={setupData.email}
                  onChange={handleSetupChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Admin Phone (Optional)</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={setupData.phone}
                  onChange={handleSetupChange}
                />
              </div>
              
              <button type="submit" className="setup-button">
                <span>🚀</span>
                Create Admin Account
              </button>
            </form>
            
            <div className="setup-footer">
              <p>By creating an admin account, you agree to our Terms of Service</p>
            </div>
          </div>
        </div>
        
        {/* Terms and Agreement Modal */}
        <TermsAgreementModal 
          show={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={handleTermsAccept}
          showAcceptButton={true}
          title="Terms and Agreement - Required for Setup"
        />
        
        <style>{`
          .admin-setup-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #1C1C1E 0%, #2A2A2C 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .setup-container {
            max-width: 500px;
            width: 100%;
          }
          
          .setup-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .setup-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          .setup-header h1 {
            color: #D6F84C;
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0 0 0.5rem 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .setup-header p {
            color: #E3E3E0;
            font-size: 1.1rem;
            margin: 0;
            opacity: 0.9;
          }
          
          .setup-card {
            background: linear-gradient(145deg, #2A2A2C 0%, #1C1C1E 100%);
            border: 2px solid #28B295;
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
          }
          
          .setup-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #28B295, #D6F84C);
          }
          
          .setup-card-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .setup-card-header h2 {
            color: #D6F84C;
            font-size: 1.8rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
          }
          
          .setup-card-header p {
            color: #E3E3E0;
            font-size: 1rem;
            margin: 0;
            opacity: 0.8;
          }
          
          .setup-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .form-group label {
            color: #D6F84C;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .form-group input {
            padding: 1rem 1.2rem;
            background: linear-gradient(145deg, #2A2A2C, #1C1C1E);
            border: 2px solid rgba(40, 178, 149, 0.4);
            border-radius: 12px;
            color: #E3E3E0;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .form-group input:focus {
            outline: none;
            border-color: #D6F84C;
            box-shadow: 
              inset 0 2px 4px rgba(0, 0, 0, 0.2),
              0 0 0 3px rgba(214, 248, 76, 0.2);
            transform: translateY(-2px);
          }
          
          .form-group input::placeholder {
            color: #888;
            font-style: italic;
          }
          
          .setup-button {
            background: linear-gradient(135deg, #28B295, #2A9D8A);
            color: #1C1C1E;
            border: 2px solid #28B295;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            box-shadow: 0 4px 15px rgba(40, 178, 149, 0.4);
            margin-top: 1rem;
          }
          
          .setup-button:hover {
            background: linear-gradient(135deg, #D6F84C, #C4E83C);
            color: #1C1C1E;
            border-color: #D6F84C;
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(214, 248, 76, 0.5);
          }
          
          .setup-button span {
            font-size: 1.2rem;
          }
          
          .setup-error {
            background: linear-gradient(135deg, #FF715B, #E74C3C);
            color: #FFFFFF;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #FF715B;
          }
          
          .setup-success {
            background: linear-gradient(135deg, #28B295, #2A9D8A);
            color: #FFFFFF;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #28B295;
          }
          
          .setup-footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(40, 178, 149, 0.3);
          }
          
          .setup-footer p {
            color: #E3E3E0;
            font-size: 0.9rem;
            opacity: 0.7;
            margin: 0;
          }
          
          @media (max-width: 768px) {
            .admin-setup-page {
              padding: 1rem;
            }
            
            .setup-card {
              padding: 2rem 1.5rem;
            }
            
            .setup-header h1 {
              font-size: 2rem;
            }
            
            .setup-logo {
              font-size: 3rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo"><span role="img" aria-label="Gym">💪</span></div>
        <h2>Login</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="password"
          placeholder="Enter your ID"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <style>{`
        .login-page {
          min-height: 100vh;
          background: #1C1C1E;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Poppins', sans-serif;
        }
        .login-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .login-form {
          background: #23272f;
          padding: 2.5rem 2rem;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          min-width: 360px;
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border: 1px solid #28B295;
          color: #E3E3E0;
        }
        .login-form h2 {
          margin: 0 0 1rem 0;
          color: #28B295;
          font-weight: 700;
          font-size: 1.8rem;
          letter-spacing: 1px;
          text-align: center;
        }
        .login-form input {
          padding: 1rem 1.2rem;
          background: #1C1C1E;
          border: 1.5px solid #28B295;
          border-radius: 10px;
          font-size: 1rem;
          color: #E3E3E0;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .login-form input:focus {
          outline: none;
          border-color: #D6F84C;
          box-shadow: 0 0 0 3px rgba(214,248,76,0.2);
        }
        .login-form input::placeholder {
          color: #b0b3b8;
          opacity: 1;
        }
        .login-form button {
          background: #28B295;
          color: #23272f;
          border: 2px solid #28B295;
          border-radius: 10px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          box-shadow: 0 4px 12px rgba(40,178,149,0.3);
        }
        .login-form button:hover {
          background: #23a484;
          border-color: #23a484;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40,178,149,0.4);
        }
        .error-msg {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
          text-align: center;
          font-weight: 500;
        }
        .success-msg {
          color: #28B295;
          background: rgba(40,178,149,0.1);
          border: 1px solid rgba(40,178,149,0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
          text-align: center;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .login-page {
            padding: 1rem;
          }
          .login-form {
            min-width: 320px;
            padding: 2rem 1.5rem;
          }
          .login-logo {
            font-size: 2.5rem;
          }
          .login-form h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffLogin; 