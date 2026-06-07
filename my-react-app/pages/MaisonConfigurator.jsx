import React from 'react';

const MaisonConfigurator = ({ 
  selectedProduct, 
  sartorialCut, 
  setSartorialCut, 
  fabricColor,
  setFabricColor, 
  chestSize, 
  setChestSize, 
  addToCart 
}) => {
  const isAtelierFitting = chestSize === "Atelier Fitting";
  const isBespoke = isAtelierFitting || chestSize === "Bespoke Dimensions";

  return (
    <aside id="sartorial-configurator" className="maison-configurator-panel animated-reveal">
      <div className="config-sticky-wrapper">
        <span className="config-eyebrow">Sartorial Atelier</span>
        <h3 className="config-product-title">{selectedProduct.name}</h3>
        <p className="config-product-price">
          ${selectedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        
        <div className="config-divider"></div>
        <p 
        className="config-description-text" 
        style={{ textAlign: 'left' }} // 🌟 Add this exact style attribute
        >
        {selectedProduct.description}
        </p>
        <div className="config-divider"></div>

        <div className="custom-options-stack">
          <div className="option-group">
            <label className="lux-label">Sartorial Cut</label>
            <div className="custom-select-wrapper">
              <select value={sartorialCut} onChange={(e) => setSartorialCut(e.target.value)} className="lux-select">
                <option value="Regular">Regular Fit</option>
                <option value="Short">Short Fit</option>
                <option value="Long">Long Fit</option>
              </select>
            </div>
          </div>

          <div className="option-group">
            <label className="lux-label">Fabric Colorway</label>
            <div className="custom-select-wrapper">
              <select value={fabricColor} onChange={(e) => setFabricColor(e.target.value)} className="lux-select">
                <option value="Midnight Noir">Midnight Noir</option>
                <option value="Atelier Charcoal">Atelier Charcoal</option>
                <option value="Imperial Navy">Imperial Navy</option>
              </select>
            </div>
          </div>

          <div className="option-group">
            <label className="lux-label">Chest Size / Fitting Service</label>
            <div className="custom-select-wrapper">
              <select value={chestSize} onChange={(e) => setChestSize(e.target.value)} className="lux-select">
                {/* 🌟 The Luxury Experience Options */}
                <option value="Atelier Fitting">Private Atelier Fitting (Complimentary)</option>

                {/* Standard Ready-To-Wear Options */}
                <option value="38">38 (Ready-To-Wear)</option>
                <option value="40">40 (Ready-To-Wear)</option>
                <option value="42">42 (Ready-To-Wear)</option>
                <option value="44">44 (Ready-To-Wear)</option>
              </select>
            </div>
          </div>

          {isAtelierFitting && (
            <div className="atelier-notice-box">
              <p>
                <strong>Complimentary Fitting Service Selected:</strong> Upon completing your acquisition request, a Maison Aura concierge will contact you within 24 hours to schedule your private fitting at our salons or your residence.
              </p>
            </div>
          )}

        </div>

        <button className="maison-add-btn-primary" onClick={addToCart} style={{ marginTop: '20px' }}>
          {isBespoke ? "REQUEST ATELIER ACQUISITION" : "ADD TO PRIVATE TRUNK"}
        </button>
      </div>
    </aside>
  );
};

export default MaisonConfigurator;