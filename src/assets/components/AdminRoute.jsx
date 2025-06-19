import React, { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

const ADMIN_PASSKEY = "1234"; // Replace this with actual DB value in future

const AdminRoute = () => {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passkey === ADMIN_PASSKEY) {
      setIsAdmin(true);
      setError("");
    } else {
      setError("Invalid passkey. Please try again.");
      setIsAdmin(false);
    }
  };

  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="admin-passkey-container">
      <h2>Enter Admin Passkey</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Admin Passkey"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          autoFocus
          autoComplete="new-password"
        />
        <button type="submit">Submit</button>
        {error && <div className="error-message">{error}</div>}
      </form>

      <p
        className="forgot-passkey"
        onClick={() => navigate("/settings/reset-passkey")}
      >
        Forgot Passkey?
      </p>

      <style>{`
        .admin-passkey-container {
          max-width: 400px;
          margin: 100px auto;
          padding: 30px 25px;
          background: #f5f7fa;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
        }
        .admin-passkey-container h2 {
          margin-bottom: 20px;
          color: #333;
          font-weight: 700;
          font-size: 24px;
        }
        .admin-passkey-container input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
        }
        .admin-passkey-container input:focus {
          border-color: #1976d2;
          box-shadow: 0 0 8px rgba(25, 118, 210, 0.3);
        }
        .admin-passkey-container button {
          margin-top: 18px;
          width: 100%;
          padding: 12px 0;
          background-color: #1976d2;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .admin-passkey-container button:hover {
          background-color: #115293;
        }
        .admin-passkey-container .error-message {
          margin-top: 12px;
          color: #d32f2f;
          font-weight: 600;
          font-size: 14px;
        }
        .forgot-passkey {
          margin-top: 16px;
          color: #1976d2;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }
        .forgot-passkey:hover {
          color: #0d47a1;
        }
      `}</style>
    </div>
  );
};

export default AdminRoute;
