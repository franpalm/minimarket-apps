import { useState, useEffect } from "react";
import { getProducts } from "../services/ProductService";

export function useProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getProducts().then(setProducts);
  }, []);
  return products;
}
