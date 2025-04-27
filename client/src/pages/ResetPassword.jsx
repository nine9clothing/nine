import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastMessage from '../ToastMessage';
import { supabase } from '../lib/supabase.js';
import logo from '../assets/nine9_logo.jpg';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token });
      } else {
        setToastMessage({ message: "Invalid or expired reset link.", type: "error" });
      }
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setToastMessage({ message: "Passwords do not match.", type: "error" });
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setToastMessage({
        message: "Password must be at least 8 characters and contain letters and numbers.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (sessionError || !user) {
        setToastMessage({ message: "Session expired. Use the reset link again.", type: "error" });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setLoading(false);
      setToastMessage({ message: "Password updated successfully!", type: "success" });

      // Wait a moment before redirect so toast can be seen
      setTimeout(async () => {
        await supabase.auth.signOut();
        setToastMessage(null); // clear toast after viewing
        window.location.replace('/');
      }, 2000);
      
    } catch (err) {
      setToastMessage({ message: err.message || "Something went wrong.", type: "error" });
    } finally {
    }
  };

  return (
    <div>
      
      <div style={containerStyle}>

        <div style={cardStyle}>
      <img src={logo} alt="Logo" style={{ width: '150px', height: 'auto', borderRadius: '8px', marginBottom: '40px', marginLeft: '80px', }} />

        <h2 style={headingStyle}>Reset Password</h2>
        <form onSubmit={handleResetPassword} style={formStyle}>
          <label htmlFor="newPassword" style={labelStyle}>New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="e.g. Abc123456"
            style={inputStyle}
          />
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "🔄 Resetting..." : "Reset Password"}
          </button>
        </form>

        {toastMessage && (
          <ToastMessage
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>

      </div>
      

  </div>
  );
  
};

/* Styles */
const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "black",
  padding: "20px",
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "40px",
  borderRadius: "8px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  maxWidth: "400px",
  width: "100%",
};

const headingStyle = {
  fontSize: "2rem",
  marginBottom: "20px",
  textAlign: "center",
  color: "#333",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  marginBottom: "5px",
  fontSize: "0.9rem",
  color: "#333",
};

const inputStyle = {
  width: "100%",
  padding: "12px 15px",
  marginBottom: "15px",
  fontSize: "1rem",
  borderRadius: "4px",
  border: "1px solid #ddd",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#007BFF",
  color: "#fff",
  fontSize: "1rem",
  cursor: "pointer",
  border: "none",
  borderRadius: "50px",
};

export default ResetPassword;
