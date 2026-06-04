import React from 'react';

const Footer = ({ handleViewChange }) => {
  // Helper to handle the navigation and view shift smoothly
  const handleFooterNav = (e, view, filter = "ALL") => {
    e.preventDefault();
    handleViewChange(view, filter);
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Makes the page glide elegantly to the top
    });
  };

  return (
    <footer className="maison-footer">
      <div className="footer-grid-container">
        <div className="footer-column">
          <h4>Collections</h4>
          <ul>
            {/* 🌟 Updated to scroll to top */}
            <li><a href="#shop" onClick={(e) => handleFooterNav(e, "SHOP", "MEN")}>Men’s Ready-To-Wear</a></li>
            <li><a href="#shop" onClick={(e) => handleFooterNav(e, "SHOP", "WOMEN")}>Women’s Tailoring</a></li>
            <li><a href="#shop" onClick={(e) => handleFooterNav(e, "SHOP", "ALL")}>The Atelier Collection</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>The House</h4>
          <ul>
            {/* 🌟 Updated to scroll to top */}
            <li><a href="#about" onClick={(e) => handleFooterNav(e, "ABOUT")}>Our Heritage</a></li>
            <li><a href="#salons">Private Salons</a></li>
            <li><a href="#craftsmanship">Craftsmanship</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Concierge</h4>
          <ul>
            <li><a href="#contact">Contact Support</a></li>
            <li><a href="#shipping">Delivery & Returns</a></li>
            <li><a href="#care">Garment Care</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Atelier Hours</h4>
          <ul className="hours-list-static">
            <li><span>Mon — Fri</span> <span>10:00 — 21:00</span></li>
            <li><span>Saturday</span> <span>10:00 — 18:00</span></li>
            <li><span>Sunday</span> <span>11:00 — 17:00</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-legal-links">
          <p>© 2026 MAISON AURA. ALL RIGHTS RESERVED.</p>
          <div className="legal-sub-row">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Use</a>
            <a href="#accessibility">Accessibility</a>
          </div>
        </div>
        
        <div className="footer-socials">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;