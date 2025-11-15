import { useState, useEffect } from "react";
import { getCategories } from "../services/CategoryService";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    getCategories().then(setCategories);
  }, []);
  return categories;
}
