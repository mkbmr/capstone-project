import React from 'react';

const MaisonConfigurator = ({
  selectedProduct,
  variants = [],
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

  const colorOptions = [...new Set(variants.map(v => v.color).filter(Boolean))];

  const sizeMap = {};
  variants.forEach(v => {
    if (!v.size) return;
    sizeMap[v.size] = (sizeMap[v.size] || 0) + v.stock_quantity;
  });
  const sizeOptions = Object.entries(sizeMap);

  return (
    <aside id="sartorial-configurator" className="maison-configurator-panel animated-reveal">
      <div className="config-sticky-wrapper">
        <span className="config-eyebrow">Sartorial Atelier</span>
        <h3 className="config-product-title">{selectedProduct.name}</h3>
        <p className="config-product-price">
          ${selectedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        <div className="config-divider"></div>
        <p className="config-description-text" style={{ textAlign: 'left' }}>
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
                {colorOptions.length > 0 ? (
                  colorOptions.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))
                ) : (
                  <option value="">No colors available</option>
                )}
              </select>
            </div>
          </div>

          <div className="option-group">
            <label className="lux-label">Chest Size / Fitting Service</label>
            <div className="custom-select-wrapper">
              <select value={chestSize} onChange={(e) => setChestSize(e.target.value)} className="lux-select">
                <option value="Atelier Fitting">Private Atelier Fitting (Complimentary)</option>
                {sizeOptions.map(([size, stock]) => (
                  <option key={size} value={size}>
                    {size} (Ready-To-Wear) — {stock} in stock
                  </option>
                ))}
                {sizeOptions.length === 0 && (
                  <option value="" disabled>No sizes available</option>
                )}
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
