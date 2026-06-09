import { useState, useEffect } from "react";

function mapProduct(p) {
  return {
    id:          p.product_id,
    name:        p.product_name,
    displayName: p.display_name  ?? p.product_name,
    itemType:    p.item_type     ?? "",
    price:       p.price,
    category:    p.category === "Female" ? "WOMEN" : "MEN",
    tag:         p.tag           ?? "",
    image:       p.image_url     ?? "/images/placeholder.png",
    description: p.description,
  };
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then(data => setProducts(data.map(mapProduct)))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false));
  }, []);

  return { products, loading, error };
}

export default useProducts;