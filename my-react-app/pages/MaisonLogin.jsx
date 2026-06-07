import React, { useState } from "react";

const MaisonLogin = ({ handleViewChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // placeholder: integrate real auth flow
    alert(`Signing in as ${email}`);
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