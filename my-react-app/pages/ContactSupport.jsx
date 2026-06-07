import React from "react";

const ContactSupport = () => {
  return (
    <div className="contact-support-page">
      <div className="contact-support-card">
        <div className="login-eyebrow">Concierge Support</div>
        <h2 className="login-title">Contact Support</h2>
        <div className="contact-support-intro">
          <p>For personalised assistance, send your enquiry directly to our concierge support team.</p>
          <p>We typically respond within one business hour.</p>
        </div>

        <div className="contact-support-grid">
          <div className="contact-card">
            <h4>Email Concierge</h4>
            <p>For order support, styling guidance, and atelier consultations.</p>
            <a href="mailto:support@maisonaura.com" className="contact-link">support@maisonaura.com</a>
          </div>

          <div className="contact-card">
            <h4>General Enquiries</h4>
            <p>For collection previews, private appointments, and bespoke tailoring inquiries.</p>
            <a href="mailto:hello@maisonaura.com" className="contact-link">hello@maisonaura.com</a>
          </div>
        </div>

        <div className="contact-note">
          <p>Please include your order reference, preferred consultation window, and any tailoring preferences when contacting us for an expedited response.</p>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
