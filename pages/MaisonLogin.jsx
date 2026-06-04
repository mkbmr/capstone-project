import React from "react";

const MaisonLogin = ({ handleViewChange }) => {
  return (
    <div className="maison-login-container">
      {/* ... Your existing login input fields go here ... */}

      <div className="portal-footer-links">
        <p>
          New to the House?{" "}
          <a 
            href="#" 
            className="create-account-link" 
            onClick={(e) => {
              e.preventDefault(); 
              handleViewChange("REGISTER"); // 🌟 Magic! Instantly loads your new form component
            }}
          >
            Request Profile Allocation
          </a>
        </p>
      </div>
    </div>
  );
};

export default MaisonLogin;