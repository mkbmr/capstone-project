import React from 'react';

const Header = ({ currentView, filter, handleViewChange, setIsDrawerOpen, totalItems }) => {
  return (
    <header className="maison-header">
      <div className="maison-nav-container">
        <nav className="maison-main-nav">
          <button 
            className={`nav-link-premium ${currentView === 'SHOP' && filter === 'WOMEN' ? 'active' : ''}`} 
            onClick={() => handleViewChange("SHOP", "WOMEN")}
          >
            WOMEN
          </button>
          <button 
            className={`nav-link-premium ${currentView === 'SHOP' && filter === 'MEN' ? 'active' : ''}`} 
            onClick={() => handleViewChange("SHOP", "MEN")}
          >
            MEN
          </button>
          <button 
            className={`nav-link-premium ${currentView === 'SHOP' && filter === 'ALL' ? 'active' : ''}`} 
            onClick={() => handleViewChange("SHOP", "ALL")}
          >
            THE COLLECTIONS
          </button>
        </nav>

        <a href="#" className="maison-logo-svg-wrapper" onClick={(e) => { e.preventDefault(); handleViewChange("SHOP", "ALL"); }}>
          <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="120" y="28" fontFamily="'Cinzel', 'Didot', 'Playfair Display', serif" fontSize="20" fontWeight="400" fill="#111111" letterSpacing="6" textAnchor="middle">MAISON AURA</text>
            <line x1="40" y1="38" x2="200" y2="38" stroke="#d4af37" strokeWidth="1"/>
            <text x="120" y="50" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="7" fontWeight="300" fill="#d4af37" letterSpacing="4" textAnchor="middle">HAUTE COUTURE</text>
          </svg>
        </a>
        
        <div className="maison-right-menu">
          <button className={`maison-utility-btn ${currentView === 'ABOUT' ? 'active' : ''}`} onClick={() => handleViewChange("ABOUT")}>The House</button>
          <button className={`maison-utility-btn ${currentView === 'LOGIN' ? 'active' : ''}`} onClick={() => handleViewChange("LOGIN")}>Sign In</button>
          <button className="maison-cart-wrapper-btn" onClick={() => setIsDrawerOpen(true)}>
            <span className="maison-cart-label">Bag ({totalItems})</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;