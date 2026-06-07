import React, { useState, useEffect } from 'react';
import './App.css';
import MaisonRegister from "../pages/MaisonRegister";
import MaisonLogin from "../pages/MaisonLogin";
import Footer from "../components/Footer";
import MaisonConfigurator from "../pages/MaisonConfigurator";
import MaisonAbout from "../pages/MaisonAbout";
import ContactSupport from "../pages/ContactSupport";
import MaisonSpecs from "../pages/MaisonSpecs";

function App() {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [currentView, setCurrentView] = useState("SHOP");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // NEW: State to hold products from the database
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sartorialCut, setSartorialCut] = useState("Regular");
  const [fabricColor, setFabricColor] = useState("Midnight Noir");
  const [chestSize, setChestSize] = useState("40");

  // NEW: Fetch products from your database API on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to sync with database:", err);
      }
    };
    fetchProducts();
  }, []);

  // Use the fetched 'products' state instead of the static import
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    handleViewChange("SHOP", "ALL");
    alert("You have been signed out.");
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
      image: selectedProduct.image,
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

  return (
    <div className="maison-app">
      {/* ... (Keep your JSX structure exactly the same) ... */}
      {/* The rest of your App.js code continues here... */}
    </div>
  );
}

export default App;