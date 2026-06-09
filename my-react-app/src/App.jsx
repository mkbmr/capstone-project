import React, { useState, useEffect } from 'react';
import './App.css';
import MaisonRegister from "../pages/MaisonRegister";
import MaisonLogin from "../pages/MaisonLogin";
import Footer from "../components/Footer";
import MaisonConfigurator from "../pages/MaisonConfigurator";
import MaisonAbout from "../pages/MaisonAbout";
import ContactSupport from "../pages/ContactSupport";
import { useProducts } from "../components/Products";
import MaisonSpecs from "../pages/MaisonSpecs";
import CheckoutSuccess from "../pages/CheckoutSuccess";
import AdminDashboard from "../pages/AdminDashboard";

function App() {
  const { products, loading, error } = useProducts();   // ← fetch from API

  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [currentView, setCurrentView] = useState("SHOP");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [sartorialCut, setSartorialCut] = useState("Regular");
  const [fabricColor, setFabricColor] = useState("");
  const [chestSize, setChestSize] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('isLoggedIn') === 'true');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));

  useEffect(() => {
    if (!selectedProduct) { setProductVariants([]); return; }
    fetch(`/api/products/${selectedProduct.id}/variants`)
      .then(r => r.json())
      .then(variants => {
        setProductVariants(variants);
        const firstColor = variants[0]?.color || '';
        const firstSize = variants[0]?.size || '';
        setFabricColor(firstColor);
        setChestSize(firstSize);
      })
      .catch(() => setProductVariants([]));
  }, [selectedProduct]);

  const handleAdminLogin = (token) => {
    setAdminToken(token);
    localStorage.setItem('adminToken', token);
    setCurrentView('ADMIN');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    handleViewChange('SHOP', 'ALL');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('isLoggedIn', 'true');
    setCurrentView("SHOP");
  };

  const handleCheckout = async () => {

    if (!isLoggedIn) {
      setIsDrawerOpen(false);
      handleViewChange("LOGIN");
      return;
  }
  
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: cart }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url; // redirect to Stripe
    }
  } catch (err) {
    alert('Checkout failed. Please try again.');
  }
};

useEffect(() => {
  if (window.location.pathname.startsWith('/admin')) {
    setCurrentView('ADMIN');
    window.history.replaceState({}, '', '/');
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'SUCCESS') {
    setCurrentView('SUCCESS');
    setCart([]);
    window.history.replaceState({}, '', '/');
  }
}, []);

  // ← now uses `products` instead of MAISON_AURA_PRODUCTS
  const filteredProducts = (filter === "ALL"
    ? products
    : products.filter(p => p.category === filter))
    .slice()
    .sort((a, b) => {
      const categoryOrder = { WOMEN: 0, MEN: 1 };
      const categoryPriority = (categoryOrder[a.category] ?? 2) - (categoryOrder[b.category] ?? 2);
      if (categoryPriority !== 0) return categoryPriority;
      return b.price - a.price;
    });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleViewChange = (view, productFilter = "ALL") => {
    setCurrentView(view);
    setFilter(productFilter);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSartorialCut("Regular");
    setFabricColor("Midnight Noir");
    setChestSize("38");
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const itemConfiguration = {
      id: `${selectedProduct.id}-${sartorialCut}-${fabricColor}-${chestSize}`,
      baseId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      cut: sartorialCut,
      color: fabricColor,
      size: chestSize,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === itemConfiguration.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === itemConfiguration.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...itemConfiguration, quantity: 1 }];
    });
    setIsDrawerOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  if (currentView === 'ADMIN') {
    return (
      <AdminDashboard
        adminToken={adminToken}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        handleViewChange={handleViewChange}
      />
    );
  }

  return (
    <div className="maison-app">
      {isDrawerOpen && <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}></div>}

      <div className="concierge-banner">
        COMPLIMENTARY PRIVATE ATELIER FITTING & GLOBAL WHITE-GLOVE SHIPPING
      </div>

      {/* ==================== HEADER NAVIGATION ==================== */}
      <header className="maison-header">
        <div className="maison-nav-container">
          <nav className="maison-main-nav">
            <button className={`nav-link-premium ${currentView === 'SHOP' && filter === 'WOMEN' ? 'active' : ''}`} onClick={() => handleViewChange("SHOP", "WOMEN")}>WOMEN</button>
            <button className={`nav-link-premium ${currentView === 'SHOP' && filter === 'MEN' ? 'active' : ''}`} onClick={() => handleViewChange("SHOP", "MEN")}>MEN</button>
            <button className={`nav-link-premium ${currentView === 'SHOP' && filter === 'ALL' ? 'active' : ''}`} onClick={() => handleViewChange("SHOP", "ALL")}>THE COLLECTIONS</button>
          </nav>

          <a href="#" className="maison-logo-svg-wrapper" onClick={(e) => { e.preventDefault(); handleViewChange("SHOP", "ALL"); }}>
            <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="120" y="28" fontFamily="'Cinzel', 'Didot', 'Playfair Display', serif" fontSize="20" fontWeight="400" fill="#111111" letterSpacing="6" textAnchor="middle">MAISON AURA</text>
              <line x1="40" y1="38" x2="200" y2="38" stroke="#d4af37" strokeWidth="1"/>
              <text x="120" y="50" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="7" fontWeight="300" fill="#d4af37" letterSpacing="4" textAnchor="middle">HAUTE COUTURE</text>
            </svg>
          </a>

          <div className="maison-right-menu">
            {adminToken && (
              <button className="maison-utility-btn" onClick={() => setCurrentView('ADMIN')}>
                Admin
              </button>
            )}
            {isLoggedIn ? (
        <button
            className="maison-utility-btn"
            onClick={() => {
            setIsLoggedIn(false);
            sessionStorage.removeItem('isLoggedIn');
            handleViewChange("SHOP", "ALL");
            }}
        >
            Sign Out
        </button>
        ) : (
        <button
            className={`maison-utility-btn ${(currentView === 'LOGIN' || currentView === 'REGISTER') ? 'active' : ''}`}
            onClick={() => handleViewChange("LOGIN")}
        >
            Sign In
        </button>
        )}
            <button className="maison-cart-wrapper-btn" onClick={() => setIsDrawerOpen(true)}>
              <span className="maison-cart-label">Bag ({totalItems})</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================== WORKSPACE PLATFORM ==================== */}
      <main className={`maison-content-split ${selectedProduct && currentView === "SHOP" ? 'has-selection' : 'no-selection'}`}>

        {/* LOADING / ERROR STATES */}
        {currentView === "SHOP" && loading && (
          <div className="catalog-header-block">
            <p style={{ textAlign: 'center', letterSpacing: '3px', color: '#888' }}>LOADING COLLECTION...</p>
          </div>
        )}
        {currentView === "SHOP" && error && (
          <div className="catalog-header-block">
            <p style={{ textAlign: 'center', color: '#c00' }}>Unable to load collection. Please try again.</p>
          </div>
        )}

        {/* SCENARIO A: A Product IS Selected */}
        {currentView === "SHOP" && !loading && !error && selectedProduct && (
          <section className="atelier-dual-workspace animated-reveal">
            <div className="atelier-showcase-left">
              <button className="lux-back-btn" onClick={() => setSelectedProduct(null)}>
                ← Return to {filter === "ALL" ? "Collections" : `${filter}'s Catalog`}
              </button>
              <div className="atelier-image-frame">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="atelier-main-image" />
              </div>
              {selectedProduct.tag && <span className="atelier-frame-tag">{selectedProduct.tag}</span>}
            </div>

            <div className="atelier-right-stack">
              <MaisonSpecs category={selectedProduct?.category} />
              <div className="atelier-configurator-right">
                <MaisonConfigurator
                  selectedProduct={selectedProduct}
                  variants={productVariants}
                  sartorialCut={sartorialCut}
                  setSartorialCut={setSartorialCut}
                  fabricColor={fabricColor}
                  setFabricColor={setFabricColor}
                  chestSize={chestSize}
                  setChestSize={setChestSize}
                  addToCart={addToCart}
                />
              </div>
            </div>
          </section>
        )}

        {/* SCENARIO B: NO Product Selected — Catalog Grid */}
        {currentView === "SHOP" && !loading && !error && !selectedProduct && (
          <section className="maison-catalog-workspace">
            <div className="catalog-header-block">
              <span className="catalog-subtitle">Ready-To-Wear & Made-To-Measure</span>
              <h2 className="maison-category-title">{filter === "ALL" ? "SARTORIAL SUITS" : `${filter} SUITS`}</h2>
            </div>

            <div className="maison-grid">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct && selectedProduct.id === product.id;
                return (
                  <div key={product.id} className={`maison-card ${isSelected ? 'selected-silhouette' : ''}`} onClick={() => handleSelectProduct(product)}>
                    <div className="maison-img-holder">
                      <img src={product.image} alt={product.name} className="product-grid-image" />
                    </div>
                    {isSelected && <div className="lux-selected-indicator">✓ Selected for Atelier</div>}
                    <div className="maison-details">
                      {product.tag && <span className="maison-tag maison-tag-inline">{product.tag}</span>}
                      <h3 className="maison-card-title">{product.displayName}</h3>
                      <p className="maison-card-subtitle">{product.itemType}</p>
                      <p className="maison-card-price">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {currentView === "ABOUT" && <MaisonAbout handleViewChange={handleViewChange} />}
        {currentView === "LOGIN" && <MaisonLogin handleViewChange={handleViewChange} onLoginSuccess={handleLoginSuccess} />}
        {currentView === "REGISTER" && <MaisonRegister handleViewChange={handleViewChange} />}
        {currentView === "CONTACT" && <ContactSupport handleViewChange={handleViewChange} />}
        {currentView === "SUCCESS" && <CheckoutSuccess handleViewChange={handleViewChange} />}
      </main>

      <Footer handleViewChange={handleViewChange} />

      {/* ==================== CART DRAWER ==================== */}
      <div className={`maison-app-drawer ${isDrawerOpen ? 'drawer-visible' : ''}`}>
        <div className="drawer-header">
          <h3>YOUR SELECTIONS</h3>
          <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>✕ Close</button>
        </div>

        <div className="drawer-body">
          <ul className="maison-summary-list">
            {cart.length === 0 ? (
              <li className="maison-empty-text">Your private wardrobe trunk is empty.</li>
            ) : (
              cart.map((item) => {
                // ← now uses `products` instead of MAISON_AURA_PRODUCTS
                const product = products.find(p => p.id === item.baseId) || {};
                return (
                  <li key={item.id} className="maison-summary-item">
                    <div className="maison-summary-thumb">
                      {product.image && (
                        <img src={product.image} alt={product.name || item.name} className="maison-cart-thumb" />
                      )}
                    </div>
                    <div className="maison-summary-details">
                      <span className="maison-item-name">{item.name}</span>
                      <span className="maison-item-meta">{item.color} / {item.cut} / Size {item.size}</span>
                      <span className="maison-item-qty">Quantity: {item.quantity}</span>
                    </div>
                    <div className="maison-summary-actions">
                      <span className="maison-item-price">${(item.price * item.quantity).toLocaleString('en-US')}</span>
                      <button className="maison-item-del" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="drawer-footer">
          <div className="maison-total-row">
            <span>Estimated Value</span>
            <span className="maison-total-price">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button
            className="maison-checkout-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            >
            PROCEED TO ACQUISITION
            </button>
        </div>
      </div>

    </div>
  );
}

export default App;