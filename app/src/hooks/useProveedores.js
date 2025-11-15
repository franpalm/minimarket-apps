import { useState, useEffect } from "react";
import { getProveedores } from "../services/ProveedorService";

export function useProveedores() {
  const [proveedores, setProveedores] = useState([]);
  useEffect(() => {
    getProveedores().then(setProveedores);
  }, []);
  return proveedores;
}
