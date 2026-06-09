import React, { useState } from "react";

// Added onLoginSuccess to props
const MaisonLogin = ({ handleViewChange, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Welcome back to Maison Aura.");
        
        // 1. Update global state in App.js
        if (onLoginSuccess) onLoginSuccess();
        
        // 2. Redirect to Shop view
        handleViewChange("SHOP", "ALL");
      } else {
        alert("Login failed: " + (data.error || "Check your credentials."));
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Could not reach the server.");
    }
  };

  return (
    <div className="maison-login-page">
      <div className="maison-login-container">
        <div className="login-eyebrow">Sartorial Access</div>
        <h2 className="login-title">Private Sign In</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="lux-label">Login</label>
          <input
            className="lux-input"
            type="email"
            placeholder="name@maison.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="lux-label">Password</label>
          <input
            className="lux-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot-row">
            <button className="forgot-password-link" onClick={(e) => e.preventDefault()}>Forgot password?</button>
          </div>
          <button type="submit" className="maison-login-btn">Sign In</button>
        </form>

        <div className="portal-footer-center">
          <p>
            New to the House?{' '}
            <a
              href="#"
              className="create-account-link"
              onClick={(e) => {
                e.preventDefault();
                handleViewChange("REGISTER");
              }}
            >
              Request Profile Allocation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaisonLogin;