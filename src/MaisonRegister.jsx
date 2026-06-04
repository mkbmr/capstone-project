import React, { useState } from "react";

const MaisonRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    sartorialInterest: "bespoke",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Welcome to the House:", formData);
    // Add your registration logic here
  };

  return (
    <div className="maison-register-container">
      <div className="register-header">
        <span>An Invitation</span>
        <h2>Welcome to the House</h2>
        <p>Register to unlock private collection previews, seasonal lookbooks, and priority atelier scheduling.</p>
      </div>

      <form className="maison-register-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            required
            placeholder="FULL NAME"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <input
            type="email"
            required
            placeholder="EMAIL ADDRESS"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <select
            value={formData.sartorialInterest}
            onChange={(e) => setFormData({ ...formData, sartorialInterest: e.target.value })}
          >
            <option value="bespoke">PRIMARY INTEREST: BESPOKE TAILORING</option>
            <option value="ready-to-wear">PRIMARY INTEREST: READY-TO-WEAR COLLECTIONS</option>
            <option value="curated">PRIMARY INTEREST: CURATED ACCESSORIES</option>
          </select>
        </div>

        <button type="submit" className="maison-submit-btn">
          Request Entry
        </button>
      </form>
    </div>
  );
};

export default MaisonRegister;