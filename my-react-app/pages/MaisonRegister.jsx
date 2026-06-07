import React, { useState } from "react";

const MaisonRegister = ({ handleViewChange }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // placeholder: submit registration
    alert(`Welcome, ${fullName}`);
  };

  return (
    <div className="maison-login-page">
      <div className="maison-login-container">
        <div className="login-eyebrow">An Invitation</div>
        <h2 className="login-title">Welcome to the House</h2>
        <p style={{ margin: 0, color: '#4f4a43' }}>Register to unlock private collection previews, seasonal lookbooks, and priority atelier scheduling.</p>

        <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <label className="lux-label">Full Name</label>
          <input className="lux-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />

          <label className="lux-label">Email address</label>
          <input className="lux-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@maison.com" required />

          <label className="lux-label">Password</label>
          <input className="lux-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" required />

          <label className="lux-label">Confirm Password</label>
          <input className="lux-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />

          <div className="forgot-row" />

          <button type="submit" className="maison-login-btn">Request Entry</button>
        </form>

        <div className="portal-footer-center">
          <p>
            Already a member?{' '}
            <a href="#" className="create-account-link" onClick={(e) => { e.preventDefault(); handleViewChange && handleViewChange('LOGIN'); }}>
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaisonRegister;