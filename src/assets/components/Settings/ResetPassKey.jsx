import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const dummyAdmin = {
  email: "admin@example.com",
  phone: "9999999999",
  otp: "4321", // mock OTP
};

const ResetPasskey = () => {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const [otp, setOtp] = useState("");
  const [newPasskey, setNewPasskey] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleIdentifierSubmit = (e) => {
    e.preventDefault();
    if (input === dummyAdmin.email || input === dummyAdmin.phone) {
      setError("");
      setStep(2);
    } else {
      setError("Admin email/phone does not match our records.");
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp === dummyAdmin.otp) {
      setError("");
      setStep(3);
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  const handlePasskeyReset = (e) => {
    e.preventDefault();
    if (newPasskey.length >= 4) {
      // Save new passkey logic (localStorage or SQL later)
      localStorage.setItem("admin_passkey", newPasskey); // temporary storage
      setError("");
      alert("Passkey changed successfully!");
      navigate("/"); // go back to dashboard or login
    } else {
      setError("Passkey must be at least 4 characters.");
    }
  };

  return (
    <div className="reset-container">
      <h2>Reset Admin Passkey</h2>

      {step === 1 && (
        <form onSubmit={handleIdentifierSubmit}>
          <input
            type="text"
            placeholder="Enter registered email or phone"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send OTP</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit">Verify OTP</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handlePasskeyReset}>
          <input
            type="password"
            placeholder="Enter new passkey"
            value={newPasskey}
            onChange={(e) => setNewPasskey(e.target.value)}
          />
          <button type="submit">Reset Passkey</button>
        </form>
      )}

      {error && <div className="error">{error}</div>}

      <style>{`
        .reset-container {
          max-width: 400px;
          margin: 100px auto;
          padding: 30px;
          background:rgb(0, 0, 0);
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          text-align: center;
          font-family: sans-serif;
        }
        .reset-container h2 {
          margin-bottom: 20px;
          font-weight: 700;
        }
        .reset-container input {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          font-size: 16px;
          border-radius: 8px;
          border: 2px solid #ccc;
        }
        .reset-container button {
          width: 100%;
          padding: 12px;
          background-color: #28b295;
          border: none;
          color: white;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
        }
        .reset-container .error {
          color: #d32f2f;
          margin-top: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ResetPasskey;
