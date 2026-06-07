import React, { useState } from "react";

const MaisonRegister = ({ handleViewChange }) => {
  // Centralized state including the new phone field
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation: Passwords must match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Send data to your Node.js backend
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            full_name: formData.fullName, 
            email: formData.email, 
            password: formData.password,
            phone: formData.phone 
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful! Welcome to Maison Aura.");
      } else {
        alert("Error: " + (data.error || "Registration failed"));
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert("Could not reach the server. Make sure your API is running.");
    }
  };

  return (
    <div className="maison-login-page">
      <div className="maison-login-container">
        <div className="login-eyebrow">An Invitation</div>
        <h2 className="login-title">Welcome to the House</h2>
        <p style={{ margin: 0, color: '#4f4a43' }}>
          Register to unlock private collection previews, seasonal lookbooks, and priority atelier scheduling.
        </p>

        <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <label className="lux-label">Full Name</label>
          <input name="fullName" className="lux-input" type="text" value={formData.fullName} onChange={handleChange} placeholder="Full name" required />

          <label className="lux-label">Email address</label>
          <input name="email" className="lux-input" type="email" value={formData.email} onChange={handleChange} placeholder="name@maison.com" required />

          <label className="lux-label">Phone Number</label>
          <input name="phone" className="lux-input" type="tel" value={formData.phone} onChange={handleChange} placeholder="+65 0000 0000" required />

          <label className="lux-label">Password</label>
          <input name="password" className="lux-input" type="password" value={formData.password} onChange={handleChange} placeholder="Enter a password" required />

          <label className="lux-label">Confirm Password</label>
          <input name="confirmPassword" className="lux-input" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />

          <div className="forgot-row" />

          <button type="submit" className="maison-login-btn">Request Entry</button>
        </form>

        <div className="portal-footer-center">
          <p>
            Already a member?{' '}
            <a 
                href="#" 
                className="create-account-link" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  console.log("Button clicked, handleViewChange is:", handleViewChange);
                  if (handleViewChange) {
                      handleViewChange('LOGIN');
                  } else {
                      console.error("handleViewChange is missing!");
                  }
                }}
              >
                Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaisonRegister;